import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/app/admin-auth";
import { writeAuditLog } from "@/app/admin-audit";

export const dynamic="force-dynamic";
const accepted=["image/png","image/jpeg","image/webp","image/svg+xml"];

export async function POST(request:NextRequest){
  try{
    const access=await requireAnyPermission(["content","inventory","after_sales"]);
    if(!access.authorized)return NextResponse.json({error:"Permission denied"},{status:403});
    if(!env.BUCKET)return NextResponse.json({error:"Upload storage unavailable"},{status:503});
    const form=await request.formData();const value=form.get("file");
    if(!value||typeof value!=="object"||!("arrayBuffer" in value)||!("type" in value)||!("size" in value))return NextResponse.json({error:"File required"},{status:400});
    const file=value as File;
    if(!accepted.includes(file.type))return NextResponse.json({error:"Unsupported file type"},{status:415});
    if(file.size>8*1024*1024)return NextResponse.json({error:"File exceeds 8 MB"},{status:413});
    const safe=(file.name||"image").replace(/[^a-zA-Z0-9._-]+/g,"-").slice(-80)||"image";
    const key=`media/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}-${safe}`;
    await env.BUCKET.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type},customMetadata:{originalName:file.name}});
    await writeAuditLog({email:access.user.email,action:"media.upload",entity:"media",entityId:key,detail:{name:file.name,size:file.size}});
    return NextResponse.json({ok:true,key,name:file.name,url:`/api/upload?key=${encodeURIComponent(key)}`},{status:201});
  }catch(error){console.error("admin-media:upload",error);return NextResponse.json({error:"Upload failed"},{status:503})}
}
