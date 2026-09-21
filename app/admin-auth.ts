import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { getCloudflareAccessUser } from "@/app/cloudflare-access";

export async function requireCsaAdmin() {
  const requestHeaders = await headers();
  const hostname = (requestHeaders.get("host") ?? "").split(":")[0].toLowerCase();
  const adminHost = String(env.CSA_ADMIN_HOST ?? "admin.csasuspension.com").toLowerCase();

  if (hostname !== adminHost) {
    return { authorized:false as const, reason:"wrong-host" as const };
  }

  const user = await getCloudflareAccessUser();
  if (!user) return { authorized:false as const, reason:"signin" as const };

  const allowlist = String(env.CSA_ADMIN_EMAILS ?? "")
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

  if (!allowlist.length) {
    return { authorized:false as const, reason:"not-configured" as const };
  }

  return allowlist.includes(user.email)
    ? { authorized:true as const, user }
    : { authorized:false as const, reason:"forbidden" as const };
}
