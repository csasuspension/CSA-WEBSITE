import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { requireCsaAdmin, requirePermission, type AdminPermission } from "@/app/admin-auth";
import { writeAuditLog } from "@/app/admin-audit";

export const dynamic = "force-dynamic";

const kinds = ["payment","shipment","warranty","claim","serial","dealer","notification"] as const;
type Kind = typeof kinds[number];
type Row = {id:string;kind:Kind;status:string;data_json:string;created_at:string;updated_at:string};

function db(){if(!env.DB)throw new Error("Database is unavailable");return env.DB}
async function ensureSchema(){
  await db().prepare(`CREATE TABLE IF NOT EXISTS operations_records (
    id TEXT PRIMARY KEY, kind TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', data_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db().prepare("CREATE INDEX IF NOT EXISTS operations_kind_updated ON operations_records(kind,updated_at DESC)").run();
  await db().prepare(`CREATE TABLE IF NOT EXISTS admin_roles (
    email TEXT PRIMARY KEY, role TEXT NOT NULL DEFAULT 'staff', permissions_json TEXT NOT NULL DEFAULT '[]',
    active INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db().prepare(`CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY, email TEXT NOT NULL, action TEXT NOT NULL, entity TEXT NOT NULL,
    entity_id TEXT NOT NULL DEFAULT '', detail_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
}
function prefix(kind:Kind){return {payment:"PAY",shipment:"SHP",warranty:"WR",claim:"CL",serial:"SN",dealer:"DL",notification:"NT"}[kind]}
function nextId(kind:Kind){const date=new Date().toISOString().slice(2,10).replaceAll("-","");return `${prefix(kind)}-${date}-${crypto.randomUUID().slice(0,5).toUpperCase()}`}
function parse(row:Row){let data:Record<string,unknown>={};try{data=JSON.parse(row.data_json)}catch{}return {...row,data}}

export async function GET(){
  try{
    const access=await requireCsaAdmin();
    if(!access.authorized)return NextResponse.json({error:"Admin access required"},{status:403});
    await ensureSchema();
    const [records,roles,audits]=await Promise.all([
      db().prepare("SELECT id,kind,status,data_json,created_at,updated_at FROM operations_records ORDER BY updated_at DESC LIMIT 1000").all<Row>(),
      db().prepare("SELECT email,role,permissions_json,active,updated_at FROM admin_roles ORDER BY email").all<{email:string;role:string;permissions_json:string;active:number;updated_at:string}>(),
      db().prepare("SELECT id,email,action,entity,entity_id,detail_json,created_at FROM audit_logs ORDER BY created_at DESC LIMIT 300").all(),
    ]);
    return NextResponse.json({
      records:records.results.map(parse),
      roles:access.permissions.includes("roles")?roles.results.map(row=>({...row,active:Boolean(row.active),permissions:JSON.parse(row.permissions_json||"[]")})):[],
      audits:access.permissions.includes("roles")?audits.results:[],
      currentUser:{email:access.user.email,role:access.role,permissions:access.permissions},
      lineConfigured:Boolean(env.LINE_CHANNEL_ACCESS_TOKEN&&env.LINE_TARGET_ID),
    });
  }catch(error){console.error("operations:list",error);return NextResponse.json({error:"Operations data is temporarily unavailable"},{status:503})}
}

export async function POST(request:NextRequest){
  try{
    const body=await request.json() as Record<string,unknown>;
    const action=String(body.action??"record");
    const permission:AdminPermission=action==="role"?"roles":action==="notify"?"after_sales":"after_sales";
    const access=await requirePermission(permission);
    if(!access.authorized)return NextResponse.json({error:"Permission denied"},{status:403});
    await ensureSchema();

    if(action==="role"){
      const email=String(body.email??"").trim().toLowerCase();
      const role=String(body.role??"staff").trim();
      const permissions=Array.isArray(body.permissions)?body.permissions.filter(x=>typeof x==="string"):[];
      const active=body.active===false?0:1;
      if(!email.includes("@"))return NextResponse.json({error:"Valid email is required"},{status:400});
      if(email===access.user.email&&(!active||!permissions.includes("roles")))return NextResponse.json({error:"You cannot remove your own access-management permission"},{status:400});
      await db().prepare(`INSERT INTO admin_roles (email,role,permissions_json,active,updated_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(email) DO UPDATE SET role=excluded.role,permissions_json=excluded.permissions_json,active=excluded.active,updated_at=CURRENT_TIMESTAMP`)
        .bind(email,role,JSON.stringify(permissions),active).run();
      await writeAuditLog({email:access.user.email,action:"role.update",entity:"admin_role",entityId:email,detail:{role,permissions,active:Boolean(active)}});
      return NextResponse.json({ok:true,email});
    }

    if(action==="notify"){
      const message=String(body.message??"").trim();
      if(!message)return NextResponse.json({error:"Message is required"},{status:400});
      let delivery="queued";
      let deliveryError="";
      if(env.LINE_CHANNEL_ACCESS_TOKEN&&env.LINE_TARGET_ID){
        try{
          const response=await fetch("https://api.line.me/v2/bot/message/push",{method:"POST",headers:{Authorization:`Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,"Content-Type":"application/json"},body:JSON.stringify({to:env.LINE_TARGET_ID,messages:[{type:"text",text:message}]})});
          if(!response.ok)throw new Error(`LINE ${response.status}`);
          delivery="sent";
        }catch(error){delivery="failed";deliveryError=String(error)}
      }
      const id=nextId("notification");
      const data={message,channel:"LINE",delivery,deliveryError,createdBy:access.user.email};
      await db().prepare("INSERT INTO operations_records (id,kind,status,data_json) VALUES (?,'notification',?,?)").bind(id,delivery,JSON.stringify(data)).run();
      await writeAuditLog({email:access.user.email,action:"notification.send",entity:"notification",entityId:id,detail:{delivery}});
      return NextResponse.json({ok:true,id,delivery,lineConfigured:Boolean(env.LINE_CHANNEL_ACCESS_TOKEN&&env.LINE_TARGET_ID)});
    }

    const kind=String(body.kind??"") as Kind;
    if(!kinds.includes(kind)||kind==="notification")return NextResponse.json({error:"Invalid record type"},{status:400});
    const id=String(body.id||nextId(kind)).trim().toUpperCase();
    const status=String(body.status||"new").trim();
    const data=typeof body.data==="object"&&body.data?{...(body.data as object),updatedBy:access.user.email}:{};
    await db().prepare(`INSERT INTO operations_records (id,kind,status,data_json,created_at,updated_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET status=excluded.status,data_json=excluded.data_json,updated_at=CURRENT_TIMESTAMP`)
      .bind(id,kind,status,JSON.stringify(data)).run();
    await writeAuditLog({email:access.user.email,action:body.id?"record.update":"record.create",entity:kind,entityId:id,detail:{status}});
    return NextResponse.json({ok:true,id,kind,status,data},{status:201});
  }catch(error){console.error("operations:save",error);return NextResponse.json({error:"Could not save operations record"},{status:503})}
}

export async function DELETE(request:NextRequest){
  try{
    const access=await requirePermission("after_sales");
    if(!access.authorized)return NextResponse.json({error:"Permission denied"},{status:403});
    await ensureSchema();
    const id=String((await request.json()).id??"").trim().toUpperCase();
    if(!id)return NextResponse.json({error:"Record ID is required"},{status:400});
    await db().prepare("DELETE FROM operations_records WHERE id=?").bind(id).run();
    await writeAuditLog({email:access.user.email,action:"record.delete",entity:"operations",entityId:id});
    return NextResponse.json({ok:true});
  }catch(error){console.error("operations:delete",error);return NextResponse.json({error:"Could not delete record"},{status:503})}
}
