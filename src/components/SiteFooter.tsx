import { Mail, Phone } from "lucide-react";
import type { Lang } from "@/src/types/portal";

function FooterLinks({ title, items }: { title: string; items: string[] }) {
  return <div><h3 className="text-xl font-black">{title}</h3><ul className="mt-5 space-y-4 text-zinc-400">{items.map((item) => <li key={item}><button>{item}</button></li>)}</ul></div>;
}

export function SiteFooter({ lang }: { lang: Lang }) {
  return <footer className="bg-black px-6 py-14 text-white sm:px-10"><div className="mx-auto max-w-6xl"><h2 className="text-3xl font-black">{lang === "th" ? "ติดต่อ" : "Contact"}</h2><div className="mt-7 grid gap-5 sm:grid-cols-2"><a href="tel:020000000" className="flex items-center gap-4 text-xl font-black text-[#ffc400]"><Phone className="h-8 w-8 text-white"/>Call 02-000-0000</a><a href="mailto:service@csa.co.th" className="flex items-center gap-4 text-lg font-bold"><Mail className="h-7 w-7"/>service@csa.co.th</a></div>
    <div className="mt-12 grid gap-10 border-b border-white/20 pb-12 md:grid-cols-[1fr_1fr_1fr]"><div><h3 className="font-display text-5xl italic">CSA</h3><p className="mt-4 max-w-sm leading-7 text-zinc-400">{lang === "th" ? "ผู้เชี่ยวชาญช่วงล่างสมรรถนะสูงสำหรับรถตู้ พร้อมบริการ รับประกัน และดูแลหลังการขาย" : "High-performance van suspension with warranty and after-sales support."}</p><div className="mt-6 flex gap-3"><span className="social-dot">f</span><span className="social-dot text-xs">IG</span><span className="social-dot text-xs">LINE</span></div></div><FooterLinks title={lang === "th" ? "สินค้าและบริการ" : "Products"} items={["โช้คอัพ CSA", "ค้นหาตามรุ่นรถ", "ลงทะเบียนรับประกัน", "แจ้งเคลม"]}/><FooterLinks title={lang === "th" ? "ดูแลลูกค้า" : "Support"} items={["บัญชีของฉัน", "ติดตามคำสั่งซื้อ", "คำถามที่พบบ่อย", "นโยบายความเป็นส่วนตัว"]}/></div>
    <div className="mt-8 flex flex-wrap items-center justify-between gap-5 text-sm text-zinc-500"><p>© 2026 CSA. All rights reserved.</p><div className="flex gap-2">{["VISA", "Mastercard", "JCB", "UnionPay"].map((item) => <span key={item} className="rounded bg-white px-2 py-1 text-xs font-black text-black">{item}</span>)}</div></div></div></footer>;
}
