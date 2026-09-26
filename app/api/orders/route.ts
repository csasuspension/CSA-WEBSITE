import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { getMember } from "@/src/auth/member";
import { notifyOrder } from "@/src/notifications/line";

export const dynamic="force-dynamic";
type Item={id:string;qty:number}; type ProductRow={sku:string;name:string;price:number;stock:number;active:number};
function db(){if(!env.DB)throw new Error("Database unavailable");return env.DB}
async function ensure(){
 await db().prepare(`CREATE TABLE IF NOT EXISTS sales_records (id TEXT PRIMARY KEY,kind TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',data_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
 await db().prepare("CREATE INDEX IF NOT EXISTS sales_records_kind_updated ON sales_records(kind,updated_at DESC)").run();
}
function id(){const d=new Date().toISOString().slice(2,10).replaceAll("-","");return `SO-${d}-${crypto.randomUUID().slice(0,5).toUpperCase()}`}
export async function POST(request:NextRequest){try{
 const body=await request.json();const items=(Array.isArray(body.items)?body.items:[]).map((x:any)=>({id:String(x.id??"").trim().toUpperCase(),qty:Math.max(1,Math.min(20,Math.floor(Number(x.qty)||0)))})).filter((x:Item)=>x.id&&x.qty);
 const customer=String(body.customer??"").trim(),phone=String(body.phone??"").trim(),address=String(body.address??"").trim(),province=String(body.province??"").trim(),postcode=String(body.postcode??"").trim(),note=String(body.note??"").trim();
 if(!items.length||!customer||!phone||!address)return NextResponse.json({error:"Customer, phone, shipping address and cart are required"},{status:400});
 if(items.length>30||customer.length>120||phone.length>40||address.length>800||note.length>1000)return NextResponse.json({error:"Checkout data is too long"},{status:400});
 const lines=[] as any[];for(const item of items){const p=await db().prepare("SELECT sku,name,price,stock,active FROM catalog_products WHERE sku=?").bind(item.id).first<ProductRow>();if(!p||!p.active)return NextResponse.json({error:`${item.id} is unavailable`},{status:409});if(p.price<=0)return NextResponse.json({error:`${p.name} is not available for online sale`},{status:409});if(p.stock<item.qty)return NextResponse.json({error:`Not enough stock for ${p.name}`},{status:409});lines.push({sku:p.sku,name:p.name,price:p.price,qty:item.qty,lineTotal:p.price*item.qty})}
 const total=lines.reduce((s,x)=>s+x.lineTotal,0),orderId=id(),member=await getMember();await ensure();
 const data={customer,phone,address,province,postcode,note,amount:total,items:lines,memberId:member?.id??"",paymentMethod:"pending",paymentStatus:"unpaid",paymentReference:"",payment:"รอเลือกวิธีชำระ",shippingStatus:"pending",shipping:"รอยืนยัน",trackingNo:"",carrier:"",source:"website"};
 await db().prepare("INSERT INTO sales_records (id,kind,status,data_json) VALUES (?,'order','awaiting_payment',?)").bind(orderId,JSON.stringify(data)).run();
 const line=member?await notifyOrder(member.id,orderId,"awaiting_payment"):({delivery:"skipped"} as const);
 return NextResponse.json({ok:true,orderId,status:"awaiting_payment",amount:total,paymentStatus:"unpaid",line},{status:201});
}catch(error){console.error("orders:create",error);return NextResponse.json({error:"Could not create order"},{status:503})}}
