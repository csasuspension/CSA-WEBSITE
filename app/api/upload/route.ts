import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!env.BUCKET) return NextResponse.json({ error: "Upload storage unavailable" }, { status: 503 });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "File required" }, { status: 400 });
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }
    if (file.size > 12 * 1024 * 1024) return NextResponse.json({ error: "File exceeds 12 MB" }, { status: 413 });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80);
    const key = `evidence/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
    await env.BUCKET.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { originalName: file.name },
    });
    return NextResponse.json({ ok: true, key, name: file.name }, { status: 201 });
  } catch (error) {
    console.error("upload:create", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 503 });
  }
}
