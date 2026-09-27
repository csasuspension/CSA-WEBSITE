import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
type DealerRow = { id:string; status:string; data_json:string; updated_at:string };

export async function GET(){
  try{
    if(!env.DB) throw new Error("Database unavailable");
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS operations_records (
      id TEXT PRIMARY KEY, kind TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', data_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const result=await env.DB.prepare("SELECT id,status,data_json,updated_at FROM operations_records WHERE kind='dealer' AND status='active' ORDER BY updated_at DESC").all<DealerRow>();
    const dealers=(result.results??[]).map(row=>{let data:Record<string,unknown>={};try{data=JSON.parse(row.data_json)}catch{}return {id:row.id,status:row.status,updatedAt:row.updated_at,...data}});
    return NextResponse.json({dealers});
  }catch(error){console.error("dealers:list",error);return NextResponse.json({error:"Dealer data is temporarily unavailable"},{status:503})}
}
