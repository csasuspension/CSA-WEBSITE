import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/app/admin-auth";
import { writeAuditLog } from "@/app/admin-audit";
import { defaultSiteContent, type SiteContent } from "@/src/data/siteContent";

export const dynamic="force-dynamic";
let ready:Promise<void>|undefined;
function database(){if(!env.DB)throw new Error("Database is unavailable");return env.DB}
function ensure(){if(!ready)ready=database().prepare("CREATE TABLE IF NOT EXISTS site_content (id TEXT PRIMARY KEY, content_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run().then(()=>undefined);return ready}

export async function GET(){
  try{await ensure();const row=await database().prepare("SELECT content_json FROM site_content WHERE id='main'").first<{content_json:string}>();return NextResponse.json({content:row?JSON.parse(row.content_json):defaultSiteContent})}
  catch{return NextResponse.json({content:defaultSiteContent})}
}

export async function POST(request:NextRequest){
  try{const access=await requirePermission("content");if(!access.authorized)return NextResponse.json({error:"Permission denied"},{status:403});await ensure();const content=await request.json() as SiteContent;await database().prepare("INSERT INTO site_content (id,content_json,updated_at) VALUES ('main',?,CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET content_json=excluded.content_json,updated_at=CURRENT_TIMESTAMP").bind(JSON.stringify(content)).run();await writeAuditLog({email:access.user.email,action:"website.save",entity:"site_content",entityId:"main"});return NextResponse.json({ok:true})}
  catch(error){console.error("site-content:save",error);return NextResponse.json({error:"Could not save website content"},{status:503})}
}
