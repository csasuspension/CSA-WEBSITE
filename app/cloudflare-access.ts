import { headers } from "next/headers";

export type CloudflareAccessUser = {
  email: string;
  displayName: string;
};

const ACCESS_EMAIL_HEADER = "cf-access-authenticated-user-email";
const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";

export async function getCloudflareAccessUser(): Promise<CloudflareAccessUser | null> {
  const requestHeaders = await headers();
  const email = requestHeaders.get(ACCESS_EMAIL_HEADER)?.trim().toLowerCase();
  const assertion = requestHeaders.get(ACCESS_JWT_HEADER);

  // Both headers are injected by Cloudflare Access after its policy succeeds.
  // Requiring the assertion prevents an email-only header from granting access.
  if (!email || !assertion) return null;

  return { email, displayName: email };
}

