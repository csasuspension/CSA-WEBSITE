import { env } from "cloudflare:workers";

type NewPortalEvent = {
  eventType: "order" | "warranty" | "claim";
  reference: string;
  status?: string;
  payload: Record<string, unknown>;
};

function database() {
  if (!env.DB) throw new Error("Database is temporarily unavailable");
  return env.DB;
}

export async function createPortalEvent(input: NewPortalEvent) {
  await database()
    .prepare("INSERT INTO portal_events (event_type, reference, status, payload_json) VALUES (?, ?, ?, ?)")
    .bind(input.eventType, input.reference, input.status ?? "submitted", JSON.stringify(input.payload))
    .run();
  return input;
}

export async function listPortalEvents() {
  const result = await database()
    .prepare("SELECT id, event_type, reference, status, payload_json, created_at FROM portal_events ORDER BY id DESC LIMIT 50")
    .all();
  return result.results;
}
