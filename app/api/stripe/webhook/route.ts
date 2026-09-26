import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
function db(){if(!env.DB)throw new Error("Database is unavailable");return env.DB}
function hex(bytes:ArrayBuffer){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,"0")).join("")}
async function verify(payload:string,header:string,secret:string){
 const parts=header.split(",").map(x=>x.split("="));const timestamp=parts.find(x=>x[0]==="t")?.[1];const signatures=parts.filter(x=>x[0]==="v1").map(x=>x[1]);
 if(!timestamp||!signatures.length||Math.abs(Date.now()/1000-Number(timestamp))>300)return false;
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const expected=hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(`${timestamp}.${payload}`)));
 return signatures.some(sig=>sig.length===expected.length&&[...sig].reduce((v,ch,i)=>v|(ch.charCodeAt(0)^expected.charCodeAt(i)),0)===0);
}
async function ensureWebhookTable(){await db().prepare("CREATE TABLE IF NOT EXISTS stripe_webhook_events (id TEXT PRIMARY KEY,type TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run()}

export async function POST(request:NextRequest){
 try{
  const secret=String(env.STRIPE_WEBHOOK_SECRET??"").trim();if(!secret)return NextResponse.json({error:"Webhook is not configured"},{status:503});
  const payload=await request.text(), signature=request.headers.get("stripe-signature")??"";
  if(!(await verify(payload,signature,secret)))return NextResponse.json({error:"Invalid signature"},{status:400});
  const event:any=JSON.parse(payload);await ensureWebhookTable();
  const seen=await db().prepare("SELECT id FROM stripe_webhook_events WHERE id=?").bind(String(event.id)).first();if(seen)return NextResponse.json({received:true,duplicate:true});
  const session=event.data?.object;const orderId=String(session?.metadata?.order_id||session?.client_reference_id||"");
  if(orderId&&["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(event.type)&&session?.payment_status==="paid"){
    const row=await db().prepare("SELECT data_json FROM sales_records WHERE id=? AND kind='order'").bind(orderId).first<{data_json:string}>();
    if(row){let data:any={};try{data=JSON.parse(row.data_json)}catch{}
      if(data.payment!=="Stripe · ชำระแล้ว"){
        const items=Array.isArray(data.items)?data.items:[];
        for(const item of items)await db().prepare("UPDATE catalog_products SET stock=MAX(0,stock-?),updated_at=CURRENT_TIMESTAMP WHERE sku=?").bind(Number(item.qty)||0,String(item.sku)).run();
      }
      data={...data,payment:"Stripe · ชำระแล้ว",stripeSessionId:String(session.id??""),stripePaymentIntent:String(session.payment_intent??""),paidAt:new Date().toISOString()};
      await db().prepare("UPDATE sales_records SET status='paid',data_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(JSON.stringify(data),orderId).run();
    }
  }
  if(orderId&&event.type==="checkout.session.async_payment_failed"){
    const row=await db().prepare("SELECT data_json FROM sales_records WHERE id=? AND kind='order'").bind(orderId).first<{data_json:string}>();if(row){let data:any={};try{data=JSON.parse(row.data_json)}catch{}data={...data,payment:"Stripe · ชำระไม่สำเร็จ"};await db().prepare("UPDATE sales_records SET status='awaiting_payment',data_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(JSON.stringify(data),orderId).run()}
  }
  await db().prepare("INSERT INTO stripe_webhook_events (id,type) VALUES (?,?)").bind(String(event.id),String(event.type)).run();
  return NextResponse.json({received:true});
 }catch(error){console.error("stripe:webhook",error);return NextResponse.json({error:"Webhook processing failed"},{status:500})}
}
