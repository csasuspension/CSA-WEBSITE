import { requireCsaAdmin } from "@/app/admin-auth";
import { InternalSystem } from "@/src/components/InternalSystem";

export const dynamic = "force-dynamic";

const ACCESS_SETTINGS_URL =
  "https://dash.cloudflare.com/0fbc55b8748aae303e704753c7f8641b/one/access-controls/apps";
const ACCESS_LOGOUT_URL =
  "https://weathered-wave-d8ab.cloudflareaccess.com/cdn-cgi/access/logout";

export default async function AdminPage() {
  const access = await requireCsaAdmin();

  if (!access.authorized) {
    const needsAccessSetup = access.reason === "signin";
    const message = access.reason === "wrong-host"
      ? "กรุณาเปิดระบบจาก www.csasuspension.com/csa-admin"
      : access.reason === "not-configured"
        ? "ยังไม่ได้ตั้งค่ารายชื่อผู้ดูแลระบบใน Cloudflare"
        : needsAccessSetup
          ? "Cloudflare Access ยังไม่ได้เชื่อมกับ /csa-admin กรุณาสร้าง Access Application ก่อน"
          : "บัญชีนี้ไม่ได้รับอนุญาตให้จัดการระบบ CSA";

    return (
      <main className="grid min-h-screen place-items-center bg-[#090909] px-6 text-white">
        <section className="max-w-md border border-white/10 bg-[#111] p-8 text-center">
          <img src="/csa-logo.svg" alt="CSA" className="mx-auto h-16 w-auto" />
          <h1 className="mt-7 text-2xl font-black">Admin access required</h1>
          <p className="mt-3 leading-7 text-zinc-400">{message}</p>
          <a
            href={needsAccessSetup ? ACCESS_SETTINGS_URL : ACCESS_LOGOUT_URL}
            target="_top"
            className="mt-6 inline-flex rounded-xl bg-[#ffc400] px-5 py-3 font-black text-black transition hover:bg-[#ffd43b]"
          >
            {needsAccessSetup ? "เปิดการตั้งค่า Cloudflare Access" : "เข้าสู่ระบบด้วยบัญชีอื่น"}
          </a>
        </section>
      </main>
    );
  }

  return <InternalSystem lang="th" />;
}
