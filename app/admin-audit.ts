import { env } from "cloudflare:workers";

export async function writeAuditLog(input:{email:string;action:string;entity:string;entityId?:string;detail?:unknown}) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY, email TEXT NOT NULL, action TEXT NOT NULL, entity TEXT NOT NULL,
      entity_id TEXT NOT NULL DEFAULT '', detail_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).run();
    await env.DB.prepare("INSERT INTO audit_logs (id,email,action,entity,entity_id,detail_json) VALUES (?,?,?,?,?,?)")
      .bind(crypto.randomUUID(),input.email,input.action,input.entity,input.entityId??"",JSON.stringify(input.detail??{})).run();
  } catch (error) { console.error("audit:write",error); }
}
