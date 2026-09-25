import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic="force-dynamic";
const allowed=new Set(["image/png","image/jpeg","image/webp","application/pdf"]);

export async function POST(request:NextRequest){
 try{
  if(!env.BUCKET)return NextResponse.json({error:"Upload storage unavailable"},{status:503});
  const form=await request.formData();const file=form.get("file");
  if(!file||typeof file!=="object"||!("arrayBuffer" in file)||!("type" in file)||!("size" in file))return NextResponse.json({error:"File required"},{status:400});
  const upload=file as File;
  if(!allowed.has(upload.type))return NextResponse.json({error:"Use PNG, JPG, WEBP or PDF"},{status:415});
  if(upload.size>8*1024*1024)return NextResponse.json({error:"File exceeds 8 MB"},{status:413});
  const safe=(upload.name||"evidence").replace(/[^a-zA-Z0-9._-]+/g,"-").slice(-80)||"evidence";
  const key=`customer-evidence/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}-${safe}`;
  await env.BUCKET.put(key,await upload.arrayBuffer(),{httpMetadata:{contentType:upload.type},customMetadata:{originalName:upload.name}});
  return NextResponse.json({ok:true,url:`/api/customer-upload?key=${encodeURIComponent(key)}`},{status:201});
 }catch(error){console.error("customer-upload:create",error);return NextResponse.json({error:"Upload failed"},{status:503})}
}
export async function GET(request:NextRequest){
 try{if(!env.BUCKET)return new NextResponse("Not found",{status:404});const key=request.nextUrl.searchParams.get("key")??"";if(!key.startsWith("customer-evidence/"))return new NextResponse("Not found",{status:404});const object=await env.BUCKET.get(key);if(!object)return new NextResponse("Not found",{status:404});return new NextResponse(object.body as ReadableStream,{headers:{"Content-Type":object.httpMetadata?.contentType??"application/octet-stream","Cache-Control":"private, max-age=3600","X-Content-Type-Options":"nosniff"}})}catch{return new NextResponse("Not found",{status:404})}
}