import { env } from "cloudflare:workers";

type LineCard={memberId?:string;lineUserId?:string;title:string;subtitle?:string;reference:string;status:string;actionLabel?:string;actionUrl?:string;altText?:string};
function db(){if(!env.DB)throw new Error("Database unavailable");return env.DB}
async function lineUser(card:LineCard){if(card.lineUserId)return card.lineUserId;if(!card.memberId)return "";const r=await db().prepare("SELECT line_user_id FROM members WHERE id=?").bind(card.memberId).first<{line_user_id:string}>();return r?.line_user_id??""}
function site(){return String(env.CSA_PUBLIC_URL??"https://www.csasuspension.com").replace(/\/$/,"")}
export async function pushLineCard(card:LineCard){
 const token=String(env.LINE_CHANNEL_ACCESS_TOKEN??"").trim(),to=await lineUser(card);if(!token||!to)return {delivery:"skipped",reason:!token?"LINE token missing":"member LINE user missing"};
 const actionUrl=card.actionUrl?.startsWith("http")?card.actionUrl:`${site()}${card.actionUrl||"/"}`;
 const body={type:"flex",altText:card.altText||`CSA · ${card.title}`,contents:{type:"bubble",styles:{header:{backgroundColor:"#ffc400"},footer:{separator:true}},header:{type:"box",layout:"vertical",contents:[{type:"text",text:"CSA SUSPENSION",weight:"bold",color:"#111111",size:"sm"},{type:"text",text:card.title,weight:"bold",color:"#111111",size:"xl",wrap:true,margin:"sm"}]},body:{type:"box",layout:"vertical",spacing:"md",contents:[...(card.subtitle?[{type:"text",text:card.subtitle,color:"#555555",wrap:true,size:"sm"}]:[]),{type:"separator"},{type:"box",layout:"horizontal",contents:[{type:"text",text:"REFERENCE",size:"xs",color:"#888888",flex:2},{type:"text",text:card.reference,weight:"bold",size:"sm",align:"end",flex:4}]},{type:"box",layout:"horizontal",contents:[{type:"text",text:"STATUS",size:"xs",color:"#888888",flex:2},{type:"text",text:card.status,weight:"bold",size:"sm",align:"end",flex:4}]}]},footer:{type:"box",layout:"vertical",contents:[{type:"button",style:"primary",color:"#111111",action:{type:"uri",label:card.actionLabel||"ดูรายละเอียด",uri:actionUrl}}]}}};
 const response=await fetch("https://api.line.me/v2/bot/message/push",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({to,messages:[body]})});
 if(!response.ok){const error=await response.text();console.error("line-push",response.status,error.slice(0,300));return {delivery:"failed",reason:`LINE ${response.status}`}}
 return {delivery:"sent"};
}
export async function notifyOrder(memberId:string|undefined,orderId:string,status:string,extra:Record<string,unknown>={}){
 const map:Record<string,[string,string,string]>={awaiting_payment:["รับคำสั่งซื้อแล้ว","เราได้รับคำสั่งซื้อของคุณแล้ว","ดูสถานะคำสั่งซื้อ"],paid:["ยืนยันการชำระเงินแล้ว","CSA กำลังเตรียมสินค้า","ดูสถานะคำสั่งซื้อ"],packing:["กำลังเตรียมสินค้า","สินค้าของคุณกำลังแพ็กเพื่อจัดส่ง","ดูสถานะคำสั่งซื้อ"],shipped:["จัดส่งสินค้าแล้ว",`${String(extra.carrier||"ขนส่ง")} · ${String(extra.trackingNo||"กำลังอัปเดต Tracking")}`,"ติดตามพัสดุ"],completed:["ได้รับสินค้าแล้ว","สินค้าเป็นอย่างไรบ้าง? ลงทะเบียนรับประกันเพื่อเชื่อม Serial กับบัญชีของคุณ","After Service"]};
 const item=map[status];if(!item)return {delivery:"skipped"};return pushLineCard({memberId,title:item[0],subtitle:item[1],reference:orderId,status,actionLabel:item[2],actionUrl:`/?page=profile&order=${encodeURIComponent(orderId)}`});
}
export async function notifyAfterSales(memberId:string|undefined,kind:"warranty"|"claim",reference:string,status:string,serial=""){
 const warranty=status==="active";const title=kind==="warranty"?(warranty?"เปิดใช้งาน Warranty แล้ว":"อัปเดต Warranty"):`อัปเดตเคลม · ${status}`;
 const subtitle=kind==="warranty"?`Serial ${serial||"-"} · เก็บ Warranty ID นี้ไว้สำหรับบริการหลังการขาย`:`Claim ${reference}${serial?` · Serial ${serial}`:""}`;
 return pushLineCard({memberId,title,subtitle,reference,status,actionLabel:kind==="warranty"?"ดู Warranty":"ดูสถานะเคลม",actionUrl:kind==="warranty"?"/?page=my-products":"/?page=claims"});
}
