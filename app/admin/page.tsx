import { redirect } from "next/navigation";
import { requireCsaAdmin } from "@/app/admin-auth";
import { chatGPTSignInPath } from "@/app/chatgpt-auth";
import { InternalSystem } from "@/src/components/InternalSystem";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const access = await requireCsaAdmin();
  if (!access.authorized && access.reason === "signin") redirect(chatGPTSignInPath("/admin"));

  if (!access.authorized) {
    return <main className="grid min-h-screen place-items-center bg-[#090909] px-6 text-white"><section className="max-w-md border border-white/10 bg-[#111] p-8 text-center"><img src="/csa-logo.svg" alt="CSA" className="mx-auto h-16 w-auto brightness-0 invert"/><h1 className="mt-7 text-2xl font-black">Access restricted</h1><p className="mt-3 leading-7 text-zinc-400">This account is not authorized for CSA administration.</p><a href="/signout-with-chatgpt?return_to=/admin" target="_top" className="mt-6 inline-flex bg-[#ffc400] px-5 py-3 font-black text-black">Use another account</a></section></main>;
  }

  return <InternalSystem lang="th"/>;
}
