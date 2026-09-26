import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Item = { id:string; qty:number };
type ProductRow = { sku:string; name:string; price:number; stock:number; active:number };
function db(){if(!env.DB)throw new Error("Database is unavailable");return env.DB}
async function ensureSales(){
  await db().prepare(`CREATE TABLE IF NOT EXISTS sales_records (
    id TEXT PRIMARY KEY, kind TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new',
    data_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
}
function orderId(){const d=new Date().toISOString().slice(2,10).replaceAll("-","");return `SO-${d}-${crypto.randomUUID().slice(0,5).toUpperCase()}`}
function origin(request:NextRequest){return process.env.NODE_ENV==="production"?"https://www.csasuspension.com":request.nextUrl.origin}

export async function POST(request:NextRequest){
 try{
  const secret=String(env.STRIPE_SECRET_KEY??"").trim();
  if(!secret)return NextResponse.json({error:"Stripe is not configured"},{status:503});
  if(!secret.startsWith("sk_test_")&&String(env.STRIPE_ALLOW_LIVE??"")!=="1")return NextResponse.json({error:"Live Stripe payments are locked"},{status:503});
  const body=await request.json();
  const items=(Array.isArray(body.items)?body.items:[]).map((x:any)=>({id:String(x.id??"").trim().toUpperCase(),qty:Math.max(1,Math.min(20,Math.floor(Number(x.qty)||0)))})).filter((x:Item)=>x.id&&x.qty>0);
  const recipient=String(body.recipient??"").trim(), phone=String(body.phone??"").trim(), address=String(body.address??"").trim();
  if(!items.length||!recipient||!phone||!address)return NextResponse.json({error:"Recipient, phone, address and cart items are required"},{status:400});
  if(recipient.length>120||phone.length>40||address.length>800||items.length>30)return NextResponse.json({error:"Checkout data is too long"},{status:400});

  const products: Array<ProductRow & {qty:number}>=[];
  for(const item of items){
    const row=await db().prepare("SELECT sku,name,price,stock,active FROM catalog_products WHERE sku=?").bind(item.id).first<ProductRow>();
    if(!row||!row.active)return NextResponse.json({error:`Product ${item.id} is not available for online checkout`},{status:409});
    if(row.price<=0)return NextResponse.json({error:`Product ${item.id} does not have a sellable price`},{status:409});
    if(row.stock<item.qty)return NextResponse.json({error:`Not enough stock for ${row.name}`},{status:409});
    products.push({...row,qty:item.qty});
  }
  const total=products.reduce((sum,p)=>sum+p.price*p.qty,0);
  const id=orderId();
  await ensureSales();
  const orderData={customer:recipient,phone,address,amount:total,payment:"Stripe · รอชำระ",shipping:"รอยืนยัน",source:"website",items:products.map(p=>({sku:p.sku,name:p.name,price:p.price,qty:p.qty}))};
  await db().prepare("INSERT INTO sales_records (id,kind,status,data_json) VALUES (?,'order','awaiting_payment',?)").bind(id,JSON.stringify(orderData)).run();

  const params=new URLSearchParams();
  params.set("mode","payment");
  params.set("success_url",`${origin(request)}/?checkout=success&order=${encodeURIComponent(id)}`);
  params.set("cancel_url",`${origin(request)}/?checkout=cancelled&order=${encodeURIComponent(id)}`);
  params.set("client_reference_id",id);
  params.set("metadata[order_id]",id);
  params.set("payment_intent_data[metadata][order_id]",id);
  params.set("locale","auto");
  products.forEach((p,i)=>{
    params.set(`line_items[${i}][quantity]`,String(p.qty));
    params.set(`line_items[${i}][price_data][currency]`,"thb");
    params.set(`line_items[${i}][price_data][unit_amount]`,String(Math.round(p.price*100)));
    params.set(`line_items[${i}][price_data][product_data][name]`,p.name);
    params.set(`line_items[${i}][price_data][product_data][metadata][sku]`,p.sku);
  });
  const stripe=await fetch("https://api.stripe.com/v1/checkout/sessions",{method:"POST",headers:{Authorization:`Bearer ${secret}`,"Content-Type":"application/x-www-form-urlencoded"},body:params});
  const session:any=await stripe.json();
  if(!stripe.ok||!session.url){
    await db().prepare("UPDATE sales_records SET status='cancelled',data_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(JSON.stringify({...orderData,payment:"Stripe · สร้าง Checkout ไม่สำเร็จ"}),id).run();
    console.error("stripe:checkout",session?.error?.type,session?.error?.code);
    return NextResponse.json({error:"Could not start Stripe Checkout"},{status:502});
  }
  await db().prepare("UPDATE sales_records SET data_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(JSON.stringify({...orderData,stripeSessionId:String(session.id)}),id).run();
  return NextResponse.json({ok:true,orderId:id,url:session.url});
 }catch(error){console.error("checkout:create",error);return NextResponse.json({error:"Could not create checkout"},{status:503})}
}
