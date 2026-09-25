import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { createPortalEvent, listPortalEvents } from "@/db/portal";
import { requireCsaAdmin } from "@/app/admin-auth";

export const dynamic="force-dynamic";
function database(){if(!env.DB)throw new Error("Database unavailable");return env.DB}
function reference(type:"order"|"warranty"|"claim"){const d=new Date().toISOString().slice(2,10).replaceAll("-","");const p=type==="warranty"?"CSA-W":type==="claim"?"CSA-C":"CSA-O";return `${p}-${d}-${crypto.randomUUID().slice(0,5).toUpperCase()}`}
async function ensureOperations(){await database().prepare(`CREATE TABLE IF NOT EXISTS operations_records (id TEXT PRIMARY KEY,kind TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',data_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run()}

export async function GET(){try{if(!(await requireCsaAdmin()).authorized)return NextResponse.json({error:"Admin access required"},{status:403});return NextResponse.json({events:await listPortalEvents()})}catch(error){console.error("events:list",error);return NextResponse.json({error:"Data is temporarily unavailable"},{status:503})}}

export async function POST(request:NextRequest){
 try{
  const body=await request.json();const eventType=String(body.eventType) as "order"|"warranty"|"claim";
  if(!["order","warranty","claim"].includes(eventType))return NextResponse.json({error:"Invalid event"},{status:400});
  const payload=typeof body.payload==="object"&&body.payload?body.payload:{};
  if((eventType==="warranty"||eventType==="claim")&&!/^\d{4}\sCSA\s\d{5}$/i.test(String(payload.serial??"").trim()))return NextResponse.json({error:"Invalid CSA serial format"},{status:400});
  const ref=reference(eventType);const status=eventType==="warranty"?"active":eventType==="claim"?"received":"submitted";
  const event=await createPortalEvent({eventType,reference:ref,status,payload});
  if(eventType==="warranty"||eventType==="claim"){await ensureOperations();await database().prepare("INSERT INTO operations_records (id,kind,status,data_json) VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING").bind(ref,eventType,status,JSON.stringify({...payload,source:"customer_portal"})).run()}
  return NextResponse.json({ok:true,event,reference:ref,status},{status:201});
 }catch(error){console.error("events:create",error);return NextResponse.json({error:"Could not save this record"},{status:503})}
}