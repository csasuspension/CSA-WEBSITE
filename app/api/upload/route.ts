import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { requireCsaAdmin } from "@/app/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!(await requireCsaAdmin()).authorized) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    if (!env.BUCKET) return NextResponse.json({ error: "Upload storage unavailable" }, { status: 503 });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "File required" }, { status: 400 });
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "File exceeds 8 MB" }, { status: 413 });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80);
    const key = `products/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
    await env.BUCKET.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { originalName: file.name },
    });
    return NextResponse.json({ ok: true, key, name: file.name, url: `/api/upload?key=${encodeURIComponent(key)}` }, { status: 201 });
  } catch (error) {
    console.error("upload:create", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 503 });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!env.BUCKET) return new NextResponse("Not found", { status: 404 });
    const key = request.nextUrl.searchParams.get("key") ?? "";
    if (!key.startsWith("products/")) return new NextResponse("Not found", { status: 404 });
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
