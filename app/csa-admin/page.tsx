import { requireCsaAdmin } from "@/app/admin-auth";
import { InternalSystem } from "@/src/components/InternalSystem";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const access = await requireCsaAdmin();

  if (!access.authorized) {
    const message = access.reason === "wrong-host"
      ? "กรุณาเปิดระบบจาก www.csasuspension.com/csa-admin"
      : access.reason === "not-configured"
        ? "ยังไม่ได้ตั้งค่ารายชื่อผู้ดูแลระบบใน Cloudflare"
        : access.reason === "signin"
          ? "ยังไม่ได้รับข้อมูลการเข้าสู่ระบบจาก Cloudflare Access"
          : "บัญชีนี้ไม่ได้รับอนุญาตให้จัดการระบบ CSA";

    return <main className="grid min-h-screen place-items-center bg-[#090909] px-6 text-white"><section className="max-w-md border border-white/10 bg-[#111] p-8 text-center"><img src="/csa-logo.svg" alt="CSA" className="mx-auto h-16 w-auto brightness-0 invert"/><h1 className="mt-7 text-2xl font-black">Admin access required</h1><p className="mt-3 leading-7 text-zinc-400">{message}</p><a href="https://weathered-wave-d8ab.cloudflareaccess.com/cdn-cgi/access/logout" target="_top" className="mt-6 inline-flex bg-[#ffc400] px-5 py-3 font-black text-black">เข้าสู่ระบบด้วยบัญชีอื่น</a></section></main>;
  }

  return <InternalSystem lang="th"/>;
}
