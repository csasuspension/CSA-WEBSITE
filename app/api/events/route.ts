import { NextRequest, NextResponse } from "next/server";
import { createPortalEvent, listPortalEvents } from "@/db/portal";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ events: await listPortalEvents() });
  } catch (error) {
    console.error("events:list", error);
    return NextResponse.json({ error: "Data is temporarily unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!["order", "warranty", "claim"].includes(body.eventType) || !body.reference) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }
    const event = await createPortalEvent({
      eventType: body.eventType,
      reference: String(body.reference),
      status: body.status ? String(body.status) : "submitted",
      payload: typeof body.payload === "object" && body.payload ? body.payload : {},
    });
    return NextResponse.json({ ok: true, event }, { status: 201 });
  } catch (error) {
    console.error("events:create", error);
    return NextResponse.json({ error: "Could not save this record" }, { status: 503 });
  }
}
