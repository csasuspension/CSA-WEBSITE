import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export async function requireCsaAdmin() {
  const user = await getChatGPTUser();
  if (!user) return { authorized:false as const, reason:"signin" as const };

  const allowlist = String(env.CSA_ADMIN_EMAILS ?? "")
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

  return allowlist.includes(user.email.toLowerCase())
    ? { authorized:true as const, user }
    : { authorized:false as const, reason:"forbidden" as const };
}
