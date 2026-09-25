import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { createPortalEvent, listPortalEvents } from "@/db/portal";
import { requireCsaAdmin } from "@/app/admin-auth";
import { getMember } from "@/src/auth/member";

export const dynamic="force-dynamic";
function database(){if(!env.DB)throw new Error("Database unavailable");return env.DB}
function reference(type:"order"|"warranty"|"claim"){const d=new Date().toISOString().slice(2,10).replaceAll("-","");const p=type==="warranty"?"CSA-W":type==="claim"?"CSA-C":"CSA-O";return `${p}-${d}-${crypto.randomUUID().slice(0,5).toUpperCase()}`}
async function ensureMemberRecords(){await database().prepare(`CREATE TABLE IF NOT EXISTS member_products (id TEXT PRIMARY KEY,member_id TEXT NOT NULL,serial TEXT NOT NULL,warranty_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',purchase_date TEXT NOT NULL DEFAULT '',dealer TEXT NOT NULL DEFAULT '',receipt_url TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(member_id,serial))`).run();await database().prepare(`CREATE TABLE IF NOT EXISTS member_claims (id TEXT PRIMARY KEY,member_id TEXT NOT NULL,serial TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'received',issue TEXT NOT NULL DEFAULT '',evidence_url TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run()}
async function ensureOperations(){await database().prepare(`CREATE TABLE IF NOT EXISTS operations_records (id TEXT PRIMARY KEY,kind TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',data_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run()}

export async function GET(){try{if(!(await requireCsaAdmin()).authorized)return NextResponse.json({error:"Admin access required"},{status:403});return NextResponse.json({events:await listPortalEvents()})}catch(error){console.error("events:list",error);return NextResponse.json({error:"Data is temporarily unavailable"},{status:503})}}

export async function POST(request:NextRequest){
 try{
  const body=await request.json();const eventType=String(body.eventType) as "order"|"warranty"|"claim";
  if(!["order","warranty","claim"].includes(eventType))return NextResponse.json({error:"Invalid event"},{status:400});
  const payload=typeof body.payload==="object"&&body.payload?body.payload:{};
  const member=await getMember();
  if((eventType==="warranty"||eventType==="claim")&&!member)return NextResponse.json({error:"Sign in with LINE before registering warranty or claims"},{status:401});
  if((eventType==="warranty"||eventType==="claim")&&!/^\d{4}\sCSA\s\d{5}$/i.test(String(payload.serial??"").trim()))return NextResponse.json({error:"Invalid CSA serial format"},{status:400});
  const ref=reference(eventType);const status=eventType==="warranty"?"active":eventType==="claim"?"received":"submitted";
  const linkedPayload={...payload,...(member?{memberId:member.id}:{})};
  const event=await createPortalEvent({eventType,reference:ref,status,payload:linkedPayload});
  if(eventType==="warranty"||eventType==="claim"){await ensureOperations();await ensureMemberRecords();
   if(eventType==="warranty"){const serial=String(payload.serial).trim().toUpperCase();const existing=await database().prepare("SELECT warranty_id FROM member_products WHERE member_id=? AND serial=?").bind(member!.id,serial).first();if(existing)return NextResponse.json({error:"This serial is already registered to your account"},{status:409});await database().prepare("INSERT INTO member_products (id,member_id,serial,warranty_id,status,purchase_date,dealer,receipt_url) VALUES (?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(),member!.id,serial,ref,status,String(payload.purchaseDate??""),String(payload.dealer??""),String(payload.receiptUrl??"")).run()}
   if(eventType==="claim"){const serial=String(payload.serial).trim().toUpperCase();const owned=await database().prepare("SELECT id FROM member_products WHERE member_id=? AND serial=?").bind(member!.id,serial).first();if(!owned)return NextResponse.json({error:"Register this product to your account before submitting a claim"},{status:409});await database().prepare("INSERT INTO member_claims (id,member_id,serial,status,issue,evidence_url) VALUES (?,?,?,?,?,?)").bind(ref,member!.id,serial,status,String(payload.issue??""),String(payload.evidenceUrl??"")).run()}
await database().prepare("INSERT INTO operations_records (id,kind,status,data_json) VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING").bind(ref,eventType,status,JSON.stringify({...linkedPayload,source:"customer_portal"})).run()}
  return NextResponse.json({ok:true,event,reference:ref,status},{status:201});
 }catch(error){console.error("events:create",error);return NextResponse.json({error:"Could not save this record"},{status:503})}
}