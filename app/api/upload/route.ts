import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic="force-dynamic";
const accepted=["image/png","image/jpeg","image/webp","video/mp4","video/webm","application/pdf"];

export async function POST(request:NextRequest){
  try{
    if(!env.BUCKET)return NextResponse.json({error:"Upload storage unavailable"},{status:503});
    const form=await request.formData();const value=form.get("file");
    if(!value||typeof value!=="object"||!("arrayBuffer" in value)||!("type" in value)||!("size" in value))return NextResponse.json({error:"File required"},{status:400});
    const file=value as File;
    if(!accepted.includes(file.type))return NextResponse.json({error:"Unsupported file type"},{status:415});
    if(file.size>12*1024*1024)return NextResponse.json({error:"File exceeds 12 MB"},{status:413});
    const safe=(file.name||"evidence").replace(/[^a-zA-Z0-9._-]+/g,"-").slice(-80)||"evidence";
    const key=`evidence/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}-${safe}`;
    await env.BUCKET.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type},customMetadata:{originalName:file.name}});
    return NextResponse.json({ok:true,key,name:file.name},{status:201});
  }catch(error){console.error("evidence:upload",error);return NextResponse.json({error:"Upload failed"},{status:503})}
}

export async function GET(request:NextRequest){
  try{
    if(!env.BUCKET)return new NextResponse("Not found",{status:404});
    const key=request.nextUrl.searchParams.get("key")??"";
    if(!key.startsWith("products/")&&!key.startsWith("media/")&&!key.startsWith("evidence/"))return new NextResponse("Not found",{status:404});
    const object=await env.BUCKET.get(key);if(!object)return new NextResponse("Not found",{status:404});
    return new NextResponse(object.body as ReadableStream,{headers:{"Content-Type":object.httpMetadata?.contentType??"application/octet-stream","Cache-Control":key.startsWith("evidence/")?"private, no-store":"public, max-age=31536000, immutable","X-Content-Type-Options":"nosniff"}});
  }catch{return new NextResponse("Not found",{status:404})}
}
