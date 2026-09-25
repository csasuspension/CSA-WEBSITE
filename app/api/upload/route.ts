import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/app/admin-auth";
import { writeAuditLog } from "@/app/admin-audit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const access = await requireAnyPermission(["content","inventory","after_sales"]);
    if (!access.authorized) return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    if (!env.BUCKET) return NextResponse.json({ error: "Upload storage unavailable" }, { status: 503 });
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file !== "object" || !("arrayBuffer" in file) || !("type" in file) || !("size" in file)) return NextResponse.json({ error: "File required" }, { status: 400 });
    const allowedTypes = new Set(["image/png","image/jpeg","image/webp","image/svg+xml"]);
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type. Use PNG, JPG, WEBP or SVG." }, { status: 415 });
    }
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "File exceeds 8 MB" }, { status: 413 });
    const uploadFile=file as File;
    const safeName = (uploadFile.name||"image").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80)||"image";
    const key = `media/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
    await env.BUCKET.put(key, await uploadFile.arrayBuffer(), {
      httpMetadata: { contentType: uploadFile.type },
      customMetadata: { originalName: uploadFile.name },
    });
    await writeAuditLog({email:access.user.email,action:"media.upload",entity:"media",entityId:key,detail:{name:uploadFile.name,size:uploadFile.size}});
    return NextResponse.json({ ok: true, key, name: uploadFile.name, url: `/api/upload?key=${encodeURIComponent(key)}` }, { status: 201 });
  } catch (error) {
    console.error("upload:create", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 503 });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!env.BUCKET) return new NextResponse("Not found", { status: 404 });
    const key = request.nextUrl.searchParams.get("key") ?? "";
    if (!key.startsWith("products/")&&!key.startsWith("media/")) return new NextResponse("Not found", { status: 404 });
    const object = await env.BUCKET.get(key);
    if (!object) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(object.body as ReadableStream, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
