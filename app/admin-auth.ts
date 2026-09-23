import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { getCloudflareAccessUser } from "@/app/cloudflare-access";

const DEFAULT_ADMIN_EMAILS = [
  "info.csasuspension@gmail.com",
  "ss.soematerial@gmail.com",
  "cdnchin38@gmail.com",
];

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

  return allowlist.has(user.email)
    ? { authorized:true as const, user }
    : { authorized:false as const, reason:"forbidden" as const };
}
