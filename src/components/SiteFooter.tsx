"use client";

import { useEffect,useState } from "react";
import { Mail, MapPin, Navigation, Phone } from "lucide-react";
import type { Lang, View } from "@/src/types/portal";
import { defaultSiteContent,type SiteContent } from "@/src/data/siteContent";
import { CsaLogo } from "@/src/components/CsaLogo";

function FooterLinks({ title, items, onNavigate }: { title: string; items: {label:string;view:View}[]; onNavigate?:(view:View)=>void }) {
  return <div><h3 className="text-lg font-black">{title}</h3><ul className="mt-4 space-y-3 text-sm text-zinc-400">{items.map((item) => <li key={item.label}><button onClick={()=>onNavigate?.(item.view)} className="hover:text-white">{item.label}</button></li>)}</ul></div>;
}

export function SiteFooter({ lang, onNavigate }: { lang: Lang; onNavigate?:(view:View)=>void }) {
  const [content,setContent]=useState<SiteContent>(defaultSiteContent);
  useEffect(()=>{fetch("/api/site-content",{cache:"no-store"}).then(r=>r.json()).then(d=>d.content&&setContent(d.content)).catch(()=>undefined)},[]);
  const products=lang==="th"?[{label:"โช้คอัพ CSA",view:"shop" as View},{label:"ลงทะเบียนรับประกัน",view:"warranty" as View},{label:"แจ้งเคลม",view:"claims" as View}]:[{label:"CSA shock absorbers",view:"shop" as View},{label:"Register warranty",view:"warranty" as View},{label:"Submit a claim",view:"claims" as View}];
  const support=lang==="th"?[{label:"บัญชีของฉัน",view:"profile" as View},{label:"คำถามที่พบบ่อย",view:"faq" as View},{label:"ติดต่อเรา",view:"contact" as View}]:[{label:"My account",view:"profile" as View},{label:"FAQ",view:"faq" as View},{label:"Contact",view:"contact" as View}];
  return <>
    <section className="bg-[#171717] px-5 py-10 text-white sm:px-10 sm:py-14"><div className="mx-auto grid max-w-6xl gap-5 overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0b0b] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#ffc400] text-black"><MapPin className="h-6 w-6"/></span><p className="mt-5 text-xs font-black tracking-[.18em] text-[#ffc400]">CSA AUTHORIZED DEALER</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">{lang==="th"?"ค้นหาตัวแทนจำหน่ายใกล้คุณ":"Find a CSA dealer near you"}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{lang==="th"?"ค้นหาจากตำแหน่งปัจจุบัน ดูระยะทาง เบอร์โทร และเปิดเส้นทางใน Google Maps":"Use your current location to see nearby dealers, distance, phone and Google Maps directions."}</p></div><button onClick={()=>onNavigate?.("branches")} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-[#ffc400] px-6 font-black text-black transition hover:bg-white"><Navigation className="h-5 w-5"/>{content.dealerButton[lang]}</button></div></section>
    <footer className="bg-black px-6 py-12 text-white sm:px-10"><div className="mx-auto max-w-6xl"><h2 className="text-2xl font-black">{lang === "th" ? "ติดต่อ" : "Contact"}</h2><div className="mt-6 grid gap-4 sm:grid-cols-2">{content.contact.phone&&<a href={`tel:${content.contact.phone.replace(/[^+\\d]/g,"")}`} className="flex items-center gap-3 text-lg font-black text-[#ffc400]"><Phone className="h-6 w-6 text-white"/>{content.contact.phone}</a>}{content.contact.email&&<a href={`mailto:${content.contact.email}`} className="flex items-center gap-3 text-base font-bold"><Mail className="h-6 w-6"/>{content.contact.email}</a>}</div>
      <div className="mt-10 grid gap-9 border-b border-white/20 pb-10 md:grid-cols-3"><div><CsaLogo className="h-16"/><p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">{lang === "th" ? "ผู้เชี่ยวชาญช่วงล่างสมรรถนะสูงสำหรับรถตู้ พร้อมบริการ รับประกัน และดูแลหลังการขาย" : "High-performance van suspension with warranty and after-sales support."}</p><div className="mt-5 flex gap-3">{content.contact.facebook&&<a className="social-dot" href={content.contact.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">f</a>}{content.contact.instagram&&<a className="social-dot text-xs" href={content.contact.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">IG</a>}{content.contact.line&&<a className="social-dot text-xs" href={content.contact.line} target="_blank" rel="noreferrer" aria-label="LINE">LINE</a>}</div></div><FooterLinks onNavigate={onNavigate} title={lang === "th" ? "สินค้าและบริการ" : "Products"} items={products}/><FooterLinks onNavigate={onNavigate} title={lang === "th" ? "ดูแลลูกค้า" : "Support"} items={support}/></div>
      <div className="mt-7 text-sm text-zinc-500"><p>© 2026 CSA. All rights reserved.</p></div></div></footer>
  </>;
}
