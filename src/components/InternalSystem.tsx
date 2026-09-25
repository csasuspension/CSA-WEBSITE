"use client";

import { useState } from "react";
import { BarChart3, FileText, Globe2, LayoutDashboard, Menu, PackageCheck, ShoppingBag, Users, X } from "lucide-react";
import type { Lang } from "@/src/types/portal";
import { ProductAdmin } from "@/src/components/ProductAdmin";
import { WebsiteAdmin } from "@/src/components/WebsiteAdmin";
import { SalesAdmin,type SalesModule } from "@/src/components/SalesAdmin";

type Module=SalesModule|"product"|"website";
const modules:{id:Module;label:string;icon:typeof LayoutDashboard;group:"sales"|"content"}[]=[
  {id:"dashboard",label:"Dashboard",icon:LayoutDashboard,group:"sales"},
  {id:"leads",label:"Leads",icon:BarChart3,group:"sales"},
  {id:"customers",label:"Customers",icon:Users,group:"sales"},
  {id:"quotes",label:"Quotations",icon:FileText,group:"sales"},
  {id:"orders",label:"Orders",icon:ShoppingBag,group:"sales"},
  {id:"product",label:"Products",icon:PackageCheck,group:"content"},
  {id:"website",label:"Website",icon:Globe2,group:"content"},
];

export function InternalSystem({lang,userEmail}:{lang:Lang;userEmail:string}){
  const [active,setActive]=useState<Module>("dashboard");
  const [menuOpen,setMenuOpen]=useState(false);
  const navigate=(next:Module)=>{setActive(next);setMenuOpen(false);window.scrollTo({top:0,behavior:"smooth"})};
  return <div className="min-h-[100dvh] overflow-x-clip bg-[#080808] text-white">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0b]/95 px-4 py-3 backdrop-blur md:px-6"><div className="mx-auto flex max-w-[1700px] items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><button onClick={()=>setMenuOpen(x=>!x)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 lg:hidden" aria-label="เปิดเมนู">{menuOpen?<X/>:<Menu/>}</button><div className="min-w-0"><p className="text-[11px] font-black tracking-[.2em] text-[#ffc400]">CSA SALES BACK-OFFICE</p><h1 className="truncate text-lg font-black sm:text-xl">{lang==="th"?"ระบบจัดการงานขาย":"Sales management"}</h1></div></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="max-w-56 truncate text-sm font-bold">{userEmail}</p><p className="text-xs text-emerald-400">● Admin access</p></div><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ffc400] text-sm font-black text-black">CSA</span></div></div></header>
    <div className="mx-auto grid max-w-[1700px] lg:grid-cols-[240px_1fr]">
      <aside className={`${menuOpen?"block":"hidden"} fixed inset-x-0 top-[69px] z-30 max-h-[calc(100dvh-69px)] overflow-y-auto border-b border-white/10 bg-[#0d0d0d] p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:sticky lg:top-[69px] lg:block lg:h-[calc(100dvh-69px)] lg:border-b-0 lg:border-r`}><NavGroup title="งานขาย" items={modules.filter(x=>x.group==="sales")} active={active} navigate={navigate}/><NavGroup title="สินค้าและเว็บไซต์" items={modules.filter(x=>x.group==="content")} active={active} navigate={navigate}/><div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-3"><p className="text-xs font-bold text-zinc-400">Sales flow</p><p className="mt-2 text-xs leading-5 text-zinc-600">Lead → Quotation → Order → Payment → Shipping</p></div></aside>
      <main className="min-w-0 p-4 pb-[calc(2rem+env(safe-area-inset-bottom))] md:p-7">{active==="product"?<ProductAdmin/>:active==="website"?<WebsiteAdmin/>:<SalesAdmin module={active} onNavigate={navigate}/>}</main>
    </div>
  </div>;
}

function NavGroup({title,items,active,navigate}:{title:string;items:typeof modules;active:Module;navigate:(m:Module)=>void}){
  return <div className="mb-5"><p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-zinc-600">{title}</p><nav className="space-y-1">{items.map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>navigate(item.id)} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition ${active===item.id?"bg-[#ffc400] text-black":"text-zinc-400 hover:bg-white/5 hover:text-white"}`}><Icon className="h-4 w-4 shrink-0"/><span className="flex-1">{item.label}</span></button>})}</nav></div>;
}
