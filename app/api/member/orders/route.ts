import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getMember } from "@/src/auth/member";
export const dynamic="force-dynamic";
function db(){if(!env.DB)throw new Error("Database unavailable");return env.DB}
export async function GET(){try{const member=await getMember();if(!member)return NextResponse.json({error:"Sign in required"},{status:401});const rows=await db().prepare("SELECT id,status,data_json,created_at,updated_at FROM sales_records WHERE kind='order' ORDER BY created_at DESC LIMIT 100").all<any>();const orders=(rows.results??[]).map((r:any)=>{let data:any={};try{data=JSON.parse(r.data_json)}catch{}return {...r,data}}).filter((r:any)=>r.data.memberId===member.id);return NextResponse.json({orders})}catch(error){console.error("member-orders",error);return NextResponse.json({error:"Orders are temporarily unavailable"},{status:503})}}
