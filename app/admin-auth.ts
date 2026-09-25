import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { getCloudflareAccessUser } from "@/app/cloudflare-access";

const DEFAULT_ADMIN_EMAILS = [
  "info.csasuspension@gmail.com",
  "ss.soematerial@gmail.com",
  "cdnchin38@gmail.com",
];

export type AdminPermission = "sales" | "after_sales" | "inventory" | "content" | "reports" | "roles";
const ALL_PERMISSIONS: AdminPermission[] = ["sales", "after_sales", "inventory", "content", "reports", "roles"];

async function configuredRole(email: string) {
  if (!env.DB) return null;
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_roles (
      email TEXT PRIMARY KEY, role TEXT NOT NULL DEFAULT 'staff', permissions_json TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).run();
    return await env.DB.prepare("SELECT role,permissions_json,active FROM admin_roles WHERE email=?")
      .bind(email).first<{role:string;permissions_json:string;active:number}>();
  } catch { return null; }
}

export async function requireCsaAdmin() {
  const requestHeaders = await headers();
  const hostname = (requestHeaders.get("host") ?? "").split(":")[0].toLowerCase();
  const adminHost = String(env.CSA_ADMIN_HOST ?? "www.csasuspension.com").toLowerCase();

  if (hostname !== adminHost) {
    return { authorized:false as const, reason:"wrong-host" as const };
  }

  const user = await getCloudflareAccessUser();
  if (!user) return { authorized:false as const, reason:"signin" as const };

  const configuredEmails = String(env.CSA_ADMIN_EMAILS ?? "")
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

  const allowlist = new Set([...DEFAULT_ADMIN_EMAILS, ...configuredEmails]);

  if (allowlist.has(user.email)) {
    const row = await configuredRole(user.email);
    let permissions = ALL_PERMISSIONS;
    if (row) {
      try { permissions = JSON.parse(row.permissions_json) as AdminPermission[]; } catch {}
      if (!row.active) return { authorized:false as const, reason:"forbidden" as const };
    }
    return { authorized:true as const, user, role:row?.role ?? "super_admin", permissions };
  }

  const row = await configuredRole(user.email);
  if (!row?.active) return { authorized:false as const, reason:"forbidden" as const };
  let permissions:AdminPermission[]=[];
  try { permissions=JSON.parse(row.permissions_json) as AdminPermission[]; } catch {}
  return { authorized:true as const, user, role:row.role, permissions };
}

export async function requirePermission(permission: AdminPermission) {
  const access = await requireCsaAdmin();
  if (!access.authorized) return access;
  return access.permissions.includes(permission)
    ? access
    : { authorized:false as const, reason:"permission" as const };
}

export async function requireAnyPermission(permissions: AdminPermission[]) {
  const access = await requireCsaAdmin();
  if (!access.authorized) return access;
  return permissions.some(permission=>access.permissions.includes(permission))
    ? access
    : { authorized:false as const, reason:"permission" as const };
}
