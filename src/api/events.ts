import type { PortalEventType } from "@/src/types/portal";

export async function saveEvent(
  eventType: PortalEventType,
  reference: string,
  payload: Record<string, unknown>
) {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventType, reference, payload })
  });

  if (!response.ok) throw new Error("Could not save record");
}
