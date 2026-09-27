import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { getMember } from "@/src/auth/member";
export const dynamic="force-dynamic";
function db(){if(!env.DB)throw new Error("Database unavailable");return env.DB}
async function ensure(){await db().prepare(`CREATE TABLE IF NOT EXISTS member_products (id TEXT PRIMARY KEY,member_id TEXT NOT NULL,serial TEXT NOT NULL,warranty_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',purchase_date TEXT NOT NULL DEFAULT '',dealer TEXT NOT NULL DEFAULT '',receipt_url TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(member_id,serial))`).run();await db().prepare(`CREATE TABLE IF NOT EXISTS member_claims (id TEXT PRIMARY KEY,member_id TEXT NOT NULL,serial TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'received',issue TEXT NOT NULL DEFAULT '',evidence_url TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();await db().prepare(`CREATE TABLE IF NOT EXISTS operations_records (id TEXT PRIMARY KEY,kind TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',data_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run()}
export async function GET(){try{const member=await getMember();if(!member)return NextResponse.json({error:"Sign in required"},{status:401});await ensure();const products=await db().prepare("SELECT id,serial,warranty_id,status,purchase_date,dealer,receipt_url,created_at FROM member_products WHERE member_id=? ORDER BY created_at DESC").bind(member.id).all();const claims=await db().prepare("SELECT id,serial,status,issue,evidence_url,created_at,updated_at FROM member_claims WHERE member_id=? ORDER BY created_at DESC").bind(member.id).all();return NextResponse.json({member,products:products.results??[],claims:claims.results??[]})}catch(error){console.error("member-records:list",error);return NextResponse.json({error:"Member records are temporarily unavailable"},{status:503})}}

function makeId(prefix:string){return `${prefix}-${new Date().toISOString().slice(2,10).replaceAll("-","")}-${crypto.randomUUID().slice(0,5).toUpperCase()}`}
export async function POST(request:NextRequest){
 try{
  const member=await getMember();if(!member)return NextResponse.json({error:"Sign in required"},{status:401});await ensure();
  const body=await request.json() as Record<string,unknown>;const action=String(body.action??"");const serial=String(body.serial??"").trim().toUpperCase();
  if(!serial)return NextResponse.json({error:"Serial number is required"},{status:400});
  if(action==="warranty"){
   const purchaseDate=String(body.purchaseDate??"").trim(),dealer=String(body.dealer??"").trim(),receiptUrl=String(body.receiptUrl??"").trim();
   if(!purchaseDate||!dealer)return NextResponse.json({error:"Purchase date and dealer are required"},{status:400});
   const existing=await db().prepare("SELECT id FROM member_products WHERE serial=? LIMIT 1").bind(serial).first<{id:string}>();if(existing)return NextResponse.json({error:"This serial number is already registered"},{status:409});
   const serialRecord=await db().prepare("SELECT id,status,data_json FROM operations_records WHERE kind='serial' AND (id=? OR json_extract(data_json,'$.serial')=?) LIMIT 1").bind(serial,serial).first<{id:string;status:string;data_json:string}>();
   if(!serialRecord)return NextResponse.json({error:"Serial number was not found. Please contact CSA."},{status:404});
   if(!["available","sold","new"].includes(serialRecord.status))return NextResponse.json({error:"This serial number is not available for registration"},{status:409});
   let serialData:Record<string,unknown>={};try{serialData=JSON.parse(serialRecord.data_json)}catch{}
   const warrantyId=makeId("WR"),productId=makeId("MP");const data={customer:member.display_name,memberId:member.id,serial,product:String(serialData.product??"CSA Product"),purchaseDate,dealer,receiptUrl};
   await db().batch([
    db().prepare("INSERT INTO member_products (id,member_id,serial,warranty_id,status,purchase_date,dealer,receipt_url) VALUES (?,?,?,?,?,?,?,?)").bind(productId,member.id,serial,warrantyId,"active",purchaseDate,dealer,receiptUrl),
    db().prepare("INSERT INTO operations_records (id,kind,status,data_json) VALUES (?,'warranty','active',?)").bind(warrantyId,JSON.stringify(data)),
    db().prepare("UPDATE operations_records SET status='registered',data_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(JSON.stringify({...serialData,registeredBy:member.id,warrantyId}),serialRecord.id),
   ]);
   return NextResponse.json({ok:true,id:warrantyId},{status:201});
  }
  if(action==="claim"){
   const issue=String(body.issue??"").trim(),evidenceUrl=String(body.evidenceUrl??"").trim();if(issue.length<10)return NextResponse.json({error:"Please describe the issue in more detail"},{status:400});
   const product=await db().prepare("SELECT warranty_id,dealer FROM member_products WHERE member_id=? AND serial=? LIMIT 1").bind(member.id,serial).first<{warranty_id:string;dealer:string}>();if(!product)return NextResponse.json({error:"Registered product not found"},{status:404});
   const id=makeId("CL");const data={customer:member.display_name,memberId:member.id,warrantyId:product.warranty_id,serial,issue,evidenceUrl,receivedAt:new Date().toISOString().slice(0,10)};
   await db().batch([
    db().prepare("INSERT INTO member_claims (id,member_id,serial,status,issue,evidence_url) VALUES (?,?,?,'received',?,?)").bind(id,member.id,serial,issue,evidenceUrl),
    db().prepare("INSERT INTO operations_records (id,kind,status,data_json) VALUES (?,'claim','received',?)").bind(id,JSON.stringify(data)),
   ]);
   return NextResponse.json({ok:true,id},{status:201});
  }
  return NextResponse.json({error:"Invalid action"},{status:400});
 }catch(error){console.error("member-records:save",error);return NextResponse.json({error:"Could not save member record"},{status:503})}
}
