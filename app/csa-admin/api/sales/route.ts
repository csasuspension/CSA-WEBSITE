import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { requireCsaAdmin } from "@/app/admin-auth";

export const dynamic = "force-dynamic";

const kinds = ["lead", "customer", "quote", "order"] as const;
type Kind = typeof kinds[number];
type Row = { id:string; kind:Kind; status:string; data_json:string; created_at:string; updated_at:string };

function db(){if(!env.DB)throw new Error("Database is unavailable");return env.DB}
async function ensureSchema(){
  await db().prepare(`CREATE TABLE IF NOT EXISTS sales_records (
    id TEXT PRIMARY KEY, kind TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new',
    data_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db().prepare("CREATE INDEX IF NOT EXISTS sales_records_kind_updated ON sales_records(kind, updated_at DESC)").run();
}
function record(row:Row){let data:Record<string,unknown>={};try{data=JSON.parse(row.data_json)}catch{}return {...row,data}}
function nextId(kind:Kind){const prefix={lead:"LD",customer:"CU",quote:"QT",order:"SO"}[kind];const date=new Date().toISOString().slice(2,10).replaceAll("-","");return `${prefix}-${date}-${crypto.randomUUID().slice(0,5).toUpperCase()}`}

export async function GET(){
  try{
    if(!(await requireCsaAdmin()).authorized)return NextResponse.json({error:"Admin access required"},{status:403});
    await ensureSchema();
    const result=await db().prepare("SELECT id,kind,status,data_json,created_at,updated_at FROM sales_records ORDER BY updated_at DESC LIMIT 500").all<Row>();
    return NextResponse.json({records:result.results.map(record)});
  }catch(error){console.error("sales:list",error);return NextResponse.json({error:"Sales data is temporarily unavailable"},{status:503})}
}

export async function POST(request:NextRequest){
  try{
    const access=await requireCsaAdmin();
    if(!access.authorized)return NextResponse.json({error:"Admin access required"},{status:403});
    await ensureSchema();
    const body=await request.json();
    const kind=String(body.kind??"") as Kind;
    if(!kinds.includes(kind))return NextResponse.json({error:"Invalid record type"},{status:400});
    const id=String(body.id||nextId(kind)).trim().toUpperCase();
    const status=String(body.status||"new").trim();
    const data=typeof body.data==="object"&&body.data?{...body.data,updatedBy:access.user.email}:{};
    await db().prepare(`INSERT INTO sales_records (id,kind,status,data_json,created_at,updated_at)
      VALUES (?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET status=excluded.status,data_json=excluded.data_json,updated_at=CURRENT_TIMESTAMP`)
      .bind(id,kind,status,JSON.stringify(data)).run();
    return NextResponse.json({ok:true,id,kind,status,data},{status:201});
  }catch(error){console.error("sales:save",error);return NextResponse.json({error:"Could not save sales record"},{status:503})}
}
