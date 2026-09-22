import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CustomerPortal } from "@/src/components/CustomerPortal";

export const dynamic = "force-dynamic";

export default async function Home() {
  const requestHeaders = await headers();
  const hostname = (requestHeaders.get("host") ?? "").split(":")[0].toLowerCase();

  if (hostname === "admin.csasuspension.com") redirect("https://www.csasuspension.com/csa-admin");

  return <CustomerPortal/>;
}
