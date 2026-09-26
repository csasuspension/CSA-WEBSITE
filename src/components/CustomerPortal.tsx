"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck, Car, CheckCircle2, ChevronRight, CircleGauge, ClipboardCheck,
  CreditCard, FileImage, Gift, Heart, LogOut,
  Menu, Minus, PackageCheck, Phone, Plus, QrCode, Search, ShieldCheck,
  ShoppingBag, SlidersHorizontal, Sparkles, UserRound, X, MapPin,
  FileText, Info, Newspaper, PlayCircle, CircleHelp, Briefcase, Mail, Package,
  Grid2X2, List, ChevronDown, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShockAbsorberIcon } from "@/src/components/icons/ShockAbsorberIcon";
import { CsaLogo } from "@/src/components/CsaLogo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { saveEvent } from "@/src/api/events";
import { SiteFooter } from "@/src/components/SiteFooter";
import { VehicleFinderSelect } from "@/src/components/VehicleFinderSelect";
import { PublicPage } from "@/src/components/PublicPages";
import { products } from "@/src/data/products";
import { defaultSiteContent,type SiteContent } from "@/src/data/siteContent";
import { translations } from "@/src/locales";
import type { Lang, Product, View } from "@/src/types/portal";

const nav: { id: View; icon: typeof ShoppingBag }[] = [
  { id:"shop", icon:ShoppingBag }, { id:"member", icon:UserRound },
  { id:"my-products", icon:Package }, { id:"warranty", icon:ShieldCheck },
  { id:"claims", icon:ClipboardCheck }, { id:"promotions", icon:Gift },
  { id:"branches", icon:MapPin }, { id:"advice", icon:FileText },
  { id:"about", icon:Info }, { id:"news", icon:Newspaper },
  { id:"clips", icon:PlayCircle }, { id:"faq", icon:CircleHelp },
  { id:"careers", icon:Briefcase }, { id:"contact", icon:Mail },
];
const money = new Intl.NumberFormat("th-TH", { style:"currency", currency:"THB", maximumFractionDigits:0 });

export function CustomerPortal() {
  const [lang,setLang] = useState<Lang>("th");
  const [view,setView] = useState<View>("shop");
  const [model,setModel] = useState("ALL");
  const [query,setQuery] = useState("");
  const [cart,setCart] = useState<Record<string,number>>({});
  const [cartOpen,setCartOpen] = useState(false);
  const [loginOpen,setLoginOpen] = useState(false);
  const [checkoutOpen,setCheckoutOpen] = useState(false);
  const [menuOpen,setMenuOpen] = useState(false);
  const [loggedIn,setLoggedIn] = useState(false);
  const [memberName,setMemberName] = useState("");
  const [catalog,setCatalog] = useState<Product[]>(products);
  const [siteContent,setSiteContent] = useState<SiteContent>(defaultSiteContent);
  const [favorites,setFavorites] = useState<Set<string>>(new Set());
  const [toast,setToast] = useState("");
  const t = translations[lang];

  useEffect(() => {
    const saved = localStorage.getItem("csa-language");
    if (saved === "th" || saved === "en") setLang(saved);
  }, []);
  useEffect(() => {
    fetch("/api/products",{cache:"no-store"}).then(async response=>response.ok?response.json():Promise.reject()).then(data=>{
      if(Array.isArray(data.products)&&data.products.length)setCatalog(data.products);
    }).catch(()=>undefined);
  }, [view]);
  useEffect(()=>{fetch("/api/auth/me",{cache:"no-store"}).then(r=>r.json()).then(d=>{setLoggedIn(Boolean(d.authenticated));setMemberName(String(d.member?.display_name||""))}).catch(()=>undefined);const q=new URLSearchParams(window.location.search);if(q.get("login")==="success"){setToast(lang==="th"?"เข้าสู่ระบบ LINE สำเร็จ":"LINE login successful");history.replaceState(null,"",window.location.pathname)}},[]);
  useEffect(()=>{fetch("/api/site-content",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(d.content)setSiteContent(d.content)}).catch(()=>undefined)},[]);
  useEffect(() => {
    const context = (document as unknown as {
      modelContext?: { registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> };
    }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const safeRegister = (tool: Record<string, unknown>) => {
      void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined);
    };
    safeRegister({
      name: "add_product_to_cart",
      title: "Add CSA product to cart",
      description: "Add a known CSA demo product to the visible shopping cart.",
      inputSchema: {
        type: "object",
        properties: {
          productId: { type: "string", enum: products.map((product) => product.id) },
          quantity: { type: "integer", minimum: 1, maximum: 20 },
        },
        required: ["productId"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input: unknown) => {
        const value = input as { productId?: string; quantity?: number };
        if (!value.productId || !products.some((product) => product.id === value.productId)) throw new Error("Unknown product");
        const quantity = Math.max(1, Math.min(20, Number(value.quantity ?? 1)));
        setCart((current) => ({ ...current, [value.productId!]: (current[value.productId!] || 0) + quantity }));
        setView("shop");
        return { productId: value.productId, quantity, status: "added" };
      },
    });
    safeRegister({
      name: "navigate_csa_portal",
      title: "Open a CSA portal section",
      description: "Navigate the customer portal to products, member services, warranty, claims, promotions, and support.",
      inputSchema: {
        type: "object",
        properties: { section: { type: "string", enum: nav.map((item) => item.id) } },
        required: ["section"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async (input: unknown) => {
        const value = input as { section?: View };
        if (!value.section || !nav.some((item) => item.id === value.section)) throw new Error("Unknown section");
        setView(value.section);
        return { section: value.section };
      },
    });
    return () => lifecycle.abort();
  }, []);
  const changeLang = (next: Lang) => { setLang(next); localStorage.setItem("csa-language",next); };
  const labels = useMemo<Record<View,string>>(() => lang==="th" ? ({shop:"หน้าหลักและสินค้า",member:"สมาชิก", "my-products":"สินค้าของฉัน",garage:"รถของฉัน",warranty:"ลงทะเบียนรับประกัน",claims:"เคลมและติดตาม",promotions:"โปรโมชั่น",branches:"สาขาและตัวแทน",advice:"บทความแนะนำ",about:"เกี่ยวกับ CSA",news:"ข่าวสาร",clips:"CSA Clips",faq:"คำถามที่พบบ่อย",careers:"ร่วมงานกับเรา",contact:"ติดต่อเรา",profile:"โปรไฟล์",admin:"ระบบภายใน"}) : ({shop:"Home & products",member:"Member", "my-products":"My products",garage:"My garage",warranty:"Warranty",claims:"Claims",promotions:"Promotions",branches:"Dealers",advice:"Advice",about:"About CSA",news:"News",clips:"CSA Clips",faq:"FAQ",careers:"Careers",contact:"Contact",profile:"Profile",admin:"Internal system"}), [lang]);
  const filtered = catalog.filter(p => (model === "ALL" || p.model === model) && (!query || `${p.name} ${p.model} ${p.modelNumber??""} ${p.id}`.toLowerCase().includes(query.toLowerCase())));
  const lines = Object.entries(cart).filter(([,q]) => q > 0).map(([id,qty]) => ({ product:catalog.find(p => p.id === id)!, qty })).filter(line=>Boolean(line.product));
  const count = lines.reduce((s,l) => s+l.qty,0);
  const total = lines.reduce((s,l) => s+l.qty*l.product.price,0);
  const flash = (message:string) => { setToast(message); window.setTimeout(() => setToast(""),1800); };
  const add = (id:string) => { setCart(c => ({...c,[id]:(c[id]||0)+1})); flash(lang==="th"?"เพิ่มสินค้าในตะกร้าแล้ว":"Added to cart"); };

  const go = (next:View) => { setView(next); setMenuOpen(false); window.scrollTo({top:0,behavior:"smooth"}); };

  return <div className="min-h-screen overflow-x-clip bg-[#090909] text-white">
    <header className="sticky top-0 z-40 bg-[#ffc400] text-black shadow-md">
      <div className="mx-auto flex h-[66px] max-w-[1600px] items-center px-4 sm:h-[76px] sm:px-7">
        <button className="flex items-center" onClick={() => go("shop")} aria-label="CSA home">
          <CsaLogo className="h-9 sm:h-11" />
        </button>
        <nav className="mx-auto hidden items-center gap-7 text-sm font-black lg:flex">
          {(["shop","promotions","branches","advice","about"] as View[]).map(id=><button key={id} onClick={()=>go(id)} className={view===id?"underline decoration-2 underline-offset-8":"opacity-70 hover:opacity-100"}>{labels[id]}</button>)}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button className="header-icon" onClick={()=>loggedIn?go("profile"):setLoginOpen(true)} aria-label={t.login}><UserRound/></button>
          <button className="header-icon relative" onClick={()=>setCartOpen(true)} aria-label={t.cart}><ShoppingBag/>{count>0&&<span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-black px-1 text-[10px] text-white">{count}</span>}</button>
          {loggedIn&&<button onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"});setLoggedIn(false);setMemberName("");flash(lang==="th"?"ออกจากระบบแล้ว":"Signed out")}} className="header-icon hidden sm:grid" aria-label={lang==="th"?"ออกจากระบบ":"Sign out"}><LogOut/></button>}
          <div className="ml-1 flex rounded-full bg-black p-1 text-[11px] font-black text-white">
            {(["th","en"] as Lang[]).map(x=><button key={x} onClick={()=>changeLang(x)} className={`grid h-9 w-9 place-items-center rounded-full ${lang===x?"bg-white text-black":""}`}>{x.toUpperCase()}</button>)}
          </div>
          <button className="header-icon ml-1" onClick={()=>setMenuOpen(true)} aria-label={lang==="th"?"เปิดเมนู":"Open menu"}><Menu/></button>
        </div>
      </div>
    </header>

    <main className="mx-auto min-w-0 max-w-[1600px]">
        {view==="shop"&&<Shop lang={lang} t={t} model={model} setModel={setModel} products={filtered} allProducts={catalog} content={siteContent} add={add} go={go} favorites={favorites} toggleFavorite={id=>setFavorites(current=>{const next=new Set(current);next.has(id)?next.delete(id):next.add(id);return next})}/>} 
        {view==="garage"&&<Garage lang={lang}/>}
        {view==="warranty"&&(loggedIn?<Warranty lang={lang} flash={flash}/>:<MemberRequired lang={lang} login={()=>setLoginOpen(true)}/>)}
        {view==="claims"&&(loggedIn?<Claims lang={lang} flash={flash}/>:<MemberRequired lang={lang} login={()=>setLoginOpen(true)}/>)}
        {view==="promotions"&&<Promotions lang={lang} content={siteContent}/>} 
        {(["member","my-products","branches","advice","about","news","clips","faq","careers","contact","profile"] as View[]).includes(view)&&<PublicPage view={view} lang={lang} go={go} content={siteContent}/>}
    </main>

    <MenuDrawer open={menuOpen} setOpen={setMenuOpen} lang={lang} query={query} setQuery={setQuery} labels={labels} go={go} content={siteContent} loggedIn={loggedIn} memberName={memberName} login={()=>setLoginOpen(true)}/>

    {cartOpen&&<Cart lang={lang} t={t} lines={lines} total={total} close={()=>setCartOpen(false)} change={(id:string,d:number)=>setCart(c=>({...c,[id]:Math.max(0,(c[id]||0)+d)}))} checkout={()=>{setCartOpen(false);setCheckoutOpen(true)}}/>}
    <Login open={loginOpen} setOpen={setLoginOpen} lang={lang}/>
    <Checkout open={checkoutOpen} setOpen={setCheckoutOpen} total={total} lang={lang} done={async()=>{const ref=`CSA-ORD-${Date.now().toString().slice(-8)}`;await saveEvent("order",ref,{total,items:lines.map(l=>({id:l.product.id,qty:l.qty}))});setCheckoutOpen(false);setCart({});flash(lang==="th"?"สร้างคำสั่งซื้อทดลองแล้ว":"Demo order created")}}/>
    {toast&&<div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-[#ffc400]/40 bg-[#191919] px-4 py-3 text-center text-sm font-semibold shadow-2xl"><CheckCircle2 className="mr-2 inline h-4 w-4 text-[#ffc400]"/>{toast}</div>}
  </div>;
}

function Shop({lang,t,model,setModel,products,allProducts,content,add,go,favorites,toggleFavorite}:{lang:Lang;t:any;model:string;setModel:(v:string)=>void;products:Product[];allProducts:Product[];content:SiteContent;add:(v:string)=>void;go:(v:View)=>void;favorites:Set<string>;toggleFavorite:(id:string)=>void}) {
  const [make,setMake]=useState("");
  const [chosen,setChosen]=useState("");
  const [year,setYear]=useState("");
  const [layout,setLayout]=useState<"grid"|"list">("grid");
  const [filtersOpen,setFiltersOpen]=useState(true);
  const [selected,setSelected]=useState<Product|null>(null);
  const makes=useMemo(()=>Array.from(new Set(allProducts.map(p=>p.vehicleMake).filter(Boolean) as string[])).sort(),[allProducts]);
  const models=useMemo(()=>Array.from(new Set(allProducts.filter(p=>!make||p.vehicleMake===make).map(p=>p.model).filter(Boolean))).sort(),[allProducts,make]);
  const years=useMemo(()=>{const values=new Set<number>();allProducts.filter(p=>(!make||p.vehicleMake===make)&&(!chosen||p.model===chosen)).forEach(p=>{if(p.yearFrom&&p.yearTo)for(let y=p.yearTo;y>=p.yearFrom;y--)values.add(y);else if(p.yearFrom)values.add(p.yearFrom)});return Array.from(values).sort((a,b)=>b-a).map(String)},[allProducts,make,chosen]);
  const clearFinder=()=>{setMake("");setChosen("");setYear("");setModel("ALL")};
  if(selected)return <ProductDetail product={selected} lang={lang} back={()=>{setSelected(null);window.scrollTo({top:0,behavior:"smooth"})}} favorite={favorites.has(selected.id)} toggleFavorite={()=>toggleFavorite(selected.id)} go={go}/>;
  return <>
    <section className="relative min-h-[340px] overflow-hidden sm:min-h-[470px]">
      <img src={content.hero.image||"/csa-ci.jpg"} alt="CSA high performance suspension" className="absolute inset-0 h-full w-full object-cover object-[57%_5%]"/>
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent"/>
      <div className="relative flex min-h-[340px] items-center px-4 py-10 sm:min-h-[470px] sm:px-12">
        <div className="max-w-xl"><span className="bg-[#ffc400] px-4 py-1 text-[11px] font-black tracking-[.2em] text-black">{content.hero.badge[lang]}</span>
        <h1 className="mt-5 font-display text-4xl uppercase leading-[.95] sm:text-6xl">{content.hero.title[lang]}<br/><span className="text-[#ffc400]">{content.hero.highlight[lang]}</span></h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-zinc-200">{content.hero.description[lang]}</p>
        <Button onClick={()=>document.getElementById("finder")?.scrollIntoView({behavior:"smooth"})} className="mt-5 h-12 rounded-xl bg-[#ffc400] px-7 font-black text-black hover:bg-white">{content.hero.button[lang]}<ChevronRight/></Button></div>
      </div>
    </section>
    <section className="bg-black px-4 sm:px-10"><div className="mx-auto grid max-w-6xl grid-cols-3 overflow-hidden rounded-b-xl text-center">
      {[[ShockAbsorberIcon,lang==="th"?"โช้คอัพ":"SHOCKS",()=>document.getElementById("finder")?.scrollIntoView({behavior:"smooth"})],[ShieldCheck,lang==="th"?"รับประกัน":"WARRANTY",()=>go("warranty")],[BadgeCheck,lang==="th"?"ของแท้ CSA":"GENUINE CSA",()=>go("about")]].map(([I,label,action],i)=>{const Icon=I as typeof ShockAbsorberIcon;return <button key={label as string} onClick={action as ()=>void} className={`flex min-h-20 flex-col items-center justify-center gap-1.5 border-r border-white/10 px-2 text-xs font-black sm:min-h-24 sm:text-sm ${i===0?"border-t-4 border-t-[#ffc400] bg-white text-black":"text-white"}`}><Icon className="h-6 w-6 sm:h-7 sm:w-7"/>{label as string}</button>})}
      </div></section>
    <section id="finder" className="relative scroll-mt-20 overflow-hidden bg-[#151515] px-4 py-10 text-black sm:scroll-mt-24 sm:px-10 sm:py-16">
      <div aria-hidden="true" className="absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#ffc400]/10 blur-3xl"/>
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#090909] shadow-[0_28px_80px_rgba(0,0,0,.45)]">
        <div className="grid lg:grid-cols-[310px_1fr]">
          <div className="relative overflow-hidden bg-[#ffc400] p-6 sm:p-8 lg:min-h-[430px]">
            <span aria-hidden="true" className="absolute -right-14 -top-12 h-48 w-48 rounded-full border-[34px] border-black/5"/>
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4 lg:block">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-black text-white shadow-[0_6px_0_rgba(255,255,255,.45)]"><ShockAbsorberIcon className="h-8 w-8"/></span>
                <button onClick={clearFinder} className="rounded-full border border-black/25 px-4 py-2 text-xs font-black transition hover:bg-black hover:text-white lg:absolute lg:bottom-0 lg:left-0">{lang==="th"?"ล้างทั้งหมด":"Clear all"}</button>
              </div>
              <div className="relative mt-6 lg:mt-10">
                <p className="text-[11px] font-black uppercase tracking-[.22em] opacity-60">CSA FITMENT FINDER</p>
                <h2 className="mt-2 font-display text-4xl leading-none sm:text-5xl">{lang==="th"?"โช้คอัพ":"Shock absorbers"}</h2>
                <p className="mt-4 max-w-[240px] text-sm font-bold leading-6 opacity-70">{lang==="th"?"เลือกข้อมูลรถตามลำดับ เพื่อค้นหาโช้คอัพที่ตรงรุ่น":"Choose your vehicle step by step to find the exact fit."}</p>
              </div>
              <div className="mt-6 flex gap-2 lg:mt-auto lg:mb-14">
                {[Boolean(make),Boolean(chosen),Boolean(year)].map((done,index)=><span key={index} className={`h-1.5 flex-1 rounded-full transition-colors ${done?"bg-black":"bg-black/20"}`}/>) }
              </div>
            </div>
          </div>
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="mb-5 flex items-center justify-between text-white">
              <p className="text-xs font-black uppercase tracking-[.18em] text-zinc-500">{lang==="th"?"ข้อมูลรถของคุณ":"Your vehicle"}</p>
              <p className="text-xs font-bold text-[#ffc400]">{[make,chosen,year].filter(Boolean).length}/3</p>
            </div>
            <div className="space-y-4">
              <VehicleFinderSelect number="01" value={make} setValue={value=>{setMake(value);setChosen("");setYear("")}} options={makes} label={lang==="th"?"เลือกแบรนด์":"Select brand"}/>
              <VehicleFinderSelect number="02" value={chosen} setValue={value=>{setChosen(value);setYear("")}} options={models} disabled={!make} label={lang==="th"?"เลือกรุ่นรถ":"Select vehicle model"}/>
              <VehicleFinderSelect number="03" value={year} setValue={setYear} options={years} disabled={!chosen} label={lang==="th"?"ปีที่ผลิต":"Production year"}/>
              <Button disabled={!make||!chosen||!year} onClick={()=>{setModel(chosen);window.setTimeout(()=>document.getElementById("product-catalog")?.scrollIntoView({behavior:"smooth"}),100)}} className="mt-2 h-14 w-full rounded-2xl bg-[#ffc400] text-base font-black text-black shadow-[0_6px_0_#6f5600] transition hover:-translate-y-0.5 hover:bg-white disabled:shadow-none"><Search className="h-5 w-5"/>{lang==="th"?"ค้นหาโช้คอัพที่ตรงรุ่น":"Find matching shocks"}</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section id="product-catalog" className="scroll-mt-20 bg-[#f2f2f2] px-5 py-10 text-black sm:scroll-mt-24 sm:px-10 sm:py-14">
      <div className="mx-auto max-w-6xl"><div className="mb-6 flex items-center justify-between gap-3 border-b border-zinc-300 pb-5"><button onClick={()=>setFiltersOpen(x=>!x)} className="flex items-center gap-3 text-lg font-black"><SlidersHorizontal/>{lang==="th"?"แสดงตัวกรอง":"Filters"}<ChevronDown className={`h-4 w-4 transition ${filtersOpen?"rotate-180":""}`}/></button><div className="flex gap-2"><button aria-label="Grid view" onClick={()=>setLayout("grid")} className={`grid h-11 w-11 place-items-center rounded-xl ${layout==="grid"?"bg-black text-white":"bg-white text-zinc-400"}`}><Grid2X2/></button><button aria-label="List view" onClick={()=>setLayout("list")} className={`grid h-11 w-11 place-items-center rounded-xl ${layout==="list"?"bg-black text-white":"bg-white text-zinc-400"}`}><List/></button></div></div>
      {filtersOpen&&<div className="mb-7 flex flex-wrap gap-2">{["ALL","HIACE 300","MAJESTY","NEW COMMUTER"].map(x=><button key={x} onClick={()=>setModel(x)} className={`rounded-full border px-4 py-2 text-sm font-bold ${model===x?"border-black bg-black text-white":"border-zinc-300 bg-white text-zinc-600"}`}>{x==="ALL"?t.all:x}</button>)}</div>}
      <div className={layout==="grid"?"grid grid-cols-2 gap-3 lg:grid-cols-3":"space-y-4"}>{products.map(p=><ProductCard key={p.id} product={p} lang={lang} layout={layout} favorite={favorites.has(p.id)} toggleFavorite={()=>toggleFavorite(p.id)} details={()=>{setSelected(p);window.scrollTo({top:0,behavior:"smooth"})}}/>)}</div>
      {!products.length&&<div className="rounded-2xl bg-white p-10 text-center text-zinc-500">{lang==="th"?"ไม่พบสินค้าที่ตรงกับตัวกรอง":"No products match these filters"}</div>}
      </div>
    </section>
    <SiteFooter lang={lang} onNavigate={go}/>
  </>;
}

function ProductCard({product:p,lang,layout,favorite,toggleFavorite,details}:{product:Product;lang:Lang;layout:"grid"|"list";favorite:boolean;toggleFavorite:()=>void;details:()=>void}){
  const image=p.imageUrls?.find(Boolean);
  const displayName=lang==="en"&&p.nameEn?p.nameEn:p.name;
  return <article className={`group overflow-hidden rounded-[24px] bg-white shadow-sm ${layout==="list"?"grid grid-cols-[38%_1fr] sm:grid-cols-[260px_1fr]":""}`}>
    <button onClick={details} className={`relative grid w-full place-items-center overflow-hidden bg-white ${layout==="list"?"min-h-52":"h-52 sm:h-72"}`}>
      {image?<img src={image} alt={p.name} className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-105"/>:<ShockAbsorberIcon className="h-28 w-28 text-zinc-800 sm:h-36 sm:w-36"/>}
      <span className="absolute left-3 top-3 rounded-full bg-[#ffc400] px-4 py-1 text-[10px] font-black">{p.tag}</span>
    </button>
    <div className="relative flex min-w-0 flex-col p-4 sm:p-5"><button onClick={toggleFavorite} aria-label={favorite?"Remove favorite":"Add favorite"} className="absolute right-3 top-3 text-zinc-400"><Heart className={`h-6 w-6 ${favorite?"fill-[#ffc400] text-[#b48b00]":""}`}/></button>
      <p className="pr-8 text-[11px] font-bold text-zinc-500">{p.brand||"CSA"} · {p.id}</p><button onClick={details} className="mt-1 text-left text-base font-black leading-tight sm:text-xl">{displayName}</button>
      <div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-bold">{p.position||"—"}</span><span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-bold">{p.model}</span></div>
      <div className="mt-auto pt-4"><p className="text-xs text-zinc-500">{lang==="th"?"ราคาเริ่มต้น":"Starting price"}</p><p className="text-xl font-black">{p.price>0?money.format(p.price):(lang==="th"?"สอบถามราคา":"Contact us")}</p>
      <Button onClick={details} className="mt-4 h-11 w-full bg-[#ffc400] font-black text-black hover:bg-black hover:text-white">{lang==="th"?"ดูรายละเอียด":"View details"}</Button></div>
    </div>
  </article>;
}

function ProductDetail({product:p,lang,back,favorite,toggleFavorite,go}:{product:Product;lang:Lang;back:()=>void;favorite:boolean;toggleFavorite:()=>void;go:(v:View)=>void}){
  const [tab,setTab]=useState<"details"|"specs"|"warranty">("details");
  const image=p.imageUrls?.find(Boolean);
  const displayName=lang==="en"&&p.nameEn?p.nameEn:p.name;
  const displayDescription=lang==="en"?(p.descriptionEn||p.shortDescriptionEn):(p.description||p.shortDescription);
  const specs=[
    {name:lang==="th"?"รุ่นรถที่เข้ากันได้":"Compatible vehicle",value:[p.vehicleMake,p.model,p.yearFrom&&p.yearTo?`${p.yearFrom}–${p.yearTo}`:""].filter(Boolean).join(" ")},
    {name:lang==="th"?"ตำแหน่ง":"Position",value:p.position||"—"},
    {name:lang==="th"?"โครงสร้าง":"Construction",value:p.category||"Shock absorber"},
    {name:lang==="th"?"รหัสรุ่นรถ":"Chassis",value:p.modelNumber||"—"},
    ...(p.attributes??[]).map(row=>({name:lang==="en"&&row.nameEn?row.nameEn:row.name,value:lang==="en"&&row.valueEn?row.valueEn:row.value})),
  ];
  const tabs=[{id:"details" as const,label:lang==="th"?"รายละเอียด":"Details"},{id:"specs" as const,label:lang==="th"?"ข้อมูลจำเพาะ":"Specifications"},{id:"warranty" as const,label:lang==="th"?"การรับประกัน":"Warranty"}];
  return <><section className="bg-[#f4f4f4] px-5 py-7 text-black sm:px-10 sm:py-10"><div className="mx-auto max-w-6xl"><button onClick={back} className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-500">← {lang==="th"?"กลับไปหน้าสินค้า":"Back to products"}</button><div className="grid gap-7 lg:grid-cols-2"><div className="relative grid min-h-[360px] place-items-center rounded-[28px] bg-white p-8 shadow-sm">{image?<img src={image} alt={p.name} className="max-h-[480px] w-full object-contain"/>:<ShockAbsorberIcon className="h-52 w-52 text-zinc-900"/>}<button onClick={toggleFavorite} className="absolute right-5 top-5 text-zinc-400"><Heart className={`h-8 w-8 ${favorite?"fill-[#ffc400] text-[#b48b00]":""}`}/></button></div><div className="flex flex-col justify-center"><p className="text-sm font-black text-[#b48b00]">{p.brand||"CSA"} · {p.id}</p><h1 className="mt-2 font-display text-4xl leading-tight sm:text-6xl">{displayName}</h1><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-lg bg-white px-4 py-2 text-sm font-bold">{p.position||"—"}</span><span className="rounded-lg bg-white px-4 py-2 text-sm font-bold">{p.model}</span></div><p className="mt-6 text-zinc-600">{(lang==="en"?p.shortDescriptionEn:p.shortDescription)||(lang==="th"?"โช้คอัพสมรรถนะสูง ออกแบบให้ตรงกับรุ่นรถและการใช้งาน":"High-performance shock absorber engineered for precise vehicle fitment.")}</p><p className="mt-7 text-sm text-zinc-500">{lang==="th"?"ราคาเริ่มต้น":"Starting price"}</p><p className="text-3xl font-black">{p.price>0?money.format(p.price):(lang==="th"?"สอบถามราคา":"Contact us")}</p><Button onClick={()=>go("branches")} className="mt-6 h-14 bg-[#ffc400] text-base font-black text-black hover:bg-black hover:text-white"><MapPin/>{lang==="th"?"ค้นหาตัวแทนจำหน่าย":"Find a dealer"}</Button></div></div>
      <div className="mt-12 flex overflow-x-auto border-b border-zinc-300">{tabs.map(item=><button key={item.id} onClick={()=>setTab(item.id)} className={`shrink-0 border-b-4 px-5 py-4 text-base font-black ${tab===item.id?"border-[#ffc400] text-black":"border-transparent text-zinc-500"}`}>{item.label}</button>)}</div>
      <div className="min-h-[300px] py-8">{tab==="details"&&<div><h2 className="text-3xl font-black">{lang==="th"?"รายละเอียด":"Details"}</h2><p className="mt-5 whitespace-pre-line leading-8 text-zinc-700">{displayDescription||(lang==="th"?"ออกแบบเพื่อเพิ่มความมั่นใจในการขับขี่ ให้การควบคุมที่นุ่ม แน่น และหนึบในทุกเส้นทาง":"Designed for confident control, comfort and stability on every journey.")}</p></div>}{tab==="specs"&&<div><h2 className="text-3xl font-black">{lang==="th"?"ข้อมูลจำเพาะ":"Specifications"}</h2><div className="mt-5 overflow-hidden rounded-2xl border border-zinc-300">{specs.filter(x=>x.name&&x.value).map((row,index)=><div key={`${row.name}-${index}`} className="grid grid-cols-[42%_1fr] border-b border-zinc-300 last:border-0 even:bg-white"><span className="p-4 font-bold">{row.name}</span><span className="p-4 font-black">{row.value}</span></div>)}</div></div>}{tab==="warranty"&&<div><h2 className="text-3xl font-black">{lang==="th"?"การรับประกัน":"Warranty"}</h2><div className="mt-5 overflow-hidden rounded-2xl border border-zinc-300"><div className="grid grid-cols-2 bg-[#ffc400] font-black"><span className="p-4">{lang==="th"?"ระยะรับประกัน":"Period"}</span><span className="p-4">{lang==="th"?"เงื่อนไข":"Conditions"}</span></div><div className="grid grid-cols-2 bg-white"><span className="p-4 font-bold">{(lang==="en"?p.warranty?.durationEn:p.warranty?.duration)||(lang==="th"?"1 ปี":"1 year")}</span><span className="p-4">{(lang==="en"?p.warranty?.conditionsEn:p.warranty?.conditions)||(lang==="th"?"รับประกันความบกพร่องจากการผลิต":"Manufacturing defects")}</span></div></div>{(lang==="en"?p.warranty?.noteEn:p.warranty?.note)&&<p className="mt-5 whitespace-pre-line leading-7 text-zinc-600">{lang==="en"?p.warranty?.noteEn:p.warranty?.note}</p>}</div>}</div></div></section><SiteFooter lang={lang} onNavigate={go}/></>;
}

function MenuDrawer({open,setOpen,lang,query,setQuery,labels,go,content,loggedIn,memberName,login}:{open:boolean;setOpen:(v:boolean)=>void;lang:Lang;query:string;setQuery:(v:string)=>void;labels:Record<View,string>;go:(v:View)=>void;content:SiteContent;loggedIn:boolean;memberName:string;login:()=>void}) {
 const account=[{id:"my-products" as View,icon:Package},{id:"warranty" as View,icon:ShieldCheck},{id:"claims" as View,icon:ClipboardCheck}];
 const support=[{id:"branches" as View,icon:MapPin},{id:"faq" as View,icon:CircleHelp},{id:"contact" as View,icon:Mail}];
 const discover=[{id:"promotions" as View,icon:Gift},{id:"advice" as View,icon:FileText},{id:"news" as View,icon:Newspaper},{id:"clips" as View,icon:PlayCircle},{id:"about" as View,icon:Info}];
 const item=(id:View,Icon:typeof ShoppingBag)=><button key={id} onClick={()=>go(id)} className="flex w-full items-center justify-between border-b border-zinc-100 py-4 text-left font-bold"><span className="flex items-center gap-3"><Icon className="h-5 w-5 text-zinc-500"/>{labels[id]}</span><ChevronRight className="h-5 w-5 text-zinc-400"/></button>;
 const phone=content.contact.phone.trim(),lineUrl=content.contact.line.trim();
 return <Sheet open={open} onOpenChange={setOpen}><SheetContent className="flex h-[100dvh] w-[88vw] flex-col border-0 bg-white p-0 text-black sm:max-w-md" showCloseButton={false}>
  <SheetHeader className="flex-row items-center justify-between border-b border-zinc-200 px-6 py-5"><SheetTitle className="text-2xl font-black">CSA</SheetTitle><button onClick={()=>setOpen(false)} aria-label="Close menu"><X className="h-7 w-7 text-zinc-500"/></button></SheetHeader>
  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
   <label className="my-5 flex items-center rounded-full border border-zinc-300 p-2 pl-5"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={lang==="th"?"ค้นหาสินค้า / รุ่นรถ":"Search products / vehicle"} className="h-10 min-w-0 flex-1 outline-none"/><button onClick={()=>{go("shop");window.setTimeout(()=>document.getElementById("product-catalog")?.scrollIntoView({behavior:"smooth"}),120)}} className="grid h-11 w-11 place-items-center rounded-full bg-black text-white"><Search/></button></label>
   <button onClick={()=>go("shop")} className="flex w-full items-center justify-between rounded-xl bg-[#ffc400] px-4 py-4 text-left font-black"><span className="flex items-center gap-3"><ShockAbsorberIcon className="h-6 w-6"/>{lang==="th"?"เลือกโช้คอัพให้ตรงรุ่น":"Find shocks for my van"}</span><ChevronRight className="h-5 w-5"/></button>
   <section className="mt-6"><p className="mb-2 text-xs font-black uppercase tracking-[.15em] text-zinc-400">{lang==="th"?"บัญชีของฉัน":"MY CSA"}</p>{loggedIn?<button onClick={()=>go("profile")} className="mb-2 flex w-full items-center gap-3 rounded-xl bg-zinc-100 p-4 text-left"><UserRound className="h-5 w-5"/><div><p className="font-black">{memberName||"CSA Member"}</p><p className="text-xs text-emerald-600">LINE CONNECTED</p></div></button>:<button onClick={()=>{setOpen(false);login()}} className="mb-2 flex w-full items-center justify-between rounded-xl bg-zinc-100 p-4 text-left font-black"><span className="flex items-center gap-3"><UserRound className="h-5 w-5"/>{lang==="th"?"เข้าสู่ระบบด้วย LINE":"Sign in with LINE"}</span><ChevronRight className="h-5 w-5 text-zinc-400"/></button>}{account.map(x=>item(x.id,x.icon))}</section>
   <section className="mt-6"><p className="mb-2 text-xs font-black uppercase tracking-[.15em] text-zinc-400">{lang==="th"?"บริการและช่วยเหลือ":"SUPPORT"}</p>{support.map(x=>item(x.id,x.icon))}</section>
   <section className="mt-6"><p className="mb-2 text-xs font-black uppercase tracking-[.15em] text-zinc-400">{lang==="th"?"รู้จัก CSA":"DISCOVER CSA"}</p>{discover.map(x=>item(x.id,x.icon))}</section>
   <div className="mt-7 border-t border-zinc-300 pt-6">{phone&&<a href={`tel:${phone.replace(/[^+\d]/g,"")}`} className="flex items-center gap-3 text-base font-black"><Phone/>{lang==="th"?"โทร":"Call"} {phone}</a>}{lineUrl&&<a href={lineUrl} target="_blank" rel="noreferrer" className="mt-5 flex items-center gap-3 text-base font-black"><MessageCircle className="h-5 w-5"/>{lang==="th"?"ติดต่อ CSA ทาง LINE":"Contact CSA on LINE"}</a>}{!phone&&!lineUrl&&<button onClick={()=>go("contact")} className="flex items-center gap-3 text-base font-black"><Mail/>{lang==="th"?"ข้อมูลติดต่อ CSA":"CSA contact information"}</button>}</div>
  </div>
 </SheetContent></Sheet>;
}
function Shell({eyebrow,title,children}:{eyebrow:string;title:string;children:React.ReactNode}) {
  return <div className="px-4 py-7 md:px-8 md:py-9"><p className="text-xs font-bold tracking-[.2em] text-[#ffc400]">{eyebrow}</p><h1 className="mt-2 font-display text-4xl uppercase sm:text-5xl">{title}</h1><div className="mt-7">{children}</div></div>;
}

function Garage({lang}:{lang:Lang}) {
  const [added,setAdded]=useState(false);
  return <Shell eyebrow="VEHICLE PROFILE" title={lang==="th"?"รถของฉัน":"My garage"}><div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
    <section className="border border-white/10 bg-[#111] p-5"><div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-full bg-[#ffc400] text-black"><Car/></div><div><p className="text-xs text-zinc-500">TOYOTA</p><h3 className="text-xl font-black">HIACE 300 2.8 GL</h3><p className="text-sm text-zinc-500">2024 · Diesel · Demo vehicle</p></div></div><div className="mt-6 grid grid-cols-3 gap-2">{[["2","Registered parts"],["642","Warranty days"],["0","Open claims"]].map(([v,k])=><div key={k} className="border-t border-white/10 pt-3"><p className="text-2xl font-black text-[#ffc400]">{v}</p><p className="text-xs text-zinc-500">{k}</p></div>)}</div></section>
    <section className="border border-dashed border-white/20 p-5"><ShockAbsorberIcon className="h-6 w-6 text-[#ffc400]"/><h3 className="mt-4 font-bold">{added?(lang==="th"?"เพิ่มรถเรียบร้อย":"Vehicle added"):(lang==="th"?"เพิ่มรถอีกคัน":"Add another vehicle")}</h3><p className="mt-1 text-sm text-zinc-500">{added?"TOYOTA MAJESTY · 2024":(lang==="th"?"เก็บข้อมูลรถเพื่อค้นหาอะไหล่ที่ตรงรุ่นได้เร็วขึ้น":"Save your vehicle for faster fitment matching.")}</p><Button onClick={()=>setAdded(true)} disabled={added} variant="outline" className="mt-5 border-white/20 bg-transparent text-white">{added?(lang==="th"?"บันทึกแล้ว":"Saved"):(lang==="th"?"เพิ่มข้อมูลรถ":"Add vehicle")}</Button></section>
  </div></Shell>;
}

function Warranty({lang,flash}:{lang:Lang;flash:(v:string)=>void}) {
  const [serial,setSerial]=useState("");const [step,setStep]=useState(1);const [purchaseDate,setPurchaseDate]=useState("");const [dealer,setDealer]=useState("");const [receiptUrl,setReceiptUrl]=useState("");const [warrantyId,setWarrantyId]=useState("");const [busy,setBusy]=useState(false);
  const valid=/^\d{4}\sCSA\s\d{5}$/i.test(serial.trim());
  const scanQr=async(file?:File)=>{if(!file)return;try{const Detector=(window as any).BarcodeDetector;if(!Detector)throw new Error("unsupported");const bitmap=await createImageBitmap(file);const codes=await new Detector({formats:["qr_code"]}).detect(bitmap);const raw=String(codes?.[0]?.rawValue??"").toUpperCase();const match=raw.match(/\d{4}\sCSA\s\d{5}/);if(!match)throw new Error("not-found");setSerial(match[0]);flash(lang==="th"?"อ่าน QR สำเร็จ":"QR scanned")}catch{flash(lang==="th"?"อ่าน QR ไม่สำเร็จ กรุณากรอก Serial":"Could not read QR. Enter the serial number.")}};
  const submit=async()=>{setBusy(true);try{const result=await saveEvent("warranty","",{serial:serial.trim().toUpperCase(),product:"CSA Suspension",purchaseDate,dealer,receiptUrl});setWarrantyId(result.reference);setStep(3);flash(lang==="th"?"ลงทะเบียนรับประกันสำเร็จ":"Warranty registered")}catch(e){flash(e instanceof Error?e.message:"Registration failed")}finally{setBusy(false)}};
  return <Shell eyebrow="SERIAL REGISTRATION" title={lang==="th"?"ลงทะเบียนรับประกัน":"Warranty registration"}><div className="grid gap-5 xl:grid-cols-[1fr_360px]"><section className="border border-white/10 bg-[#111] p-5 md:p-7"><div className="mb-7 flex items-center gap-2">{[1,2,3].map(n=><div key={n} className="flex flex-1 items-center gap-2"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${step>=n?"bg-[#ffc400] text-black":"bg-white/10 text-zinc-500"}`}>{n}</span>{n<3&&<span className={`h-px flex-1 ${step>n?"bg-[#ffc400]":"bg-white/10"}`}/>}</div>)}</div>
  {step===1&&<><Label htmlFor="serial">Serial Number</Label><div className="mt-2 flex gap-2"><Input id="serial" value={serial} onChange={e=>setSerial(e.target.value.toUpperCase())} placeholder="2609 CSA 12345" className="border-white/15 bg-black/40 font-mono text-base"/><Button onClick={()=>document.getElementById("qr-file")?.click()} variant="outline" className="border-white/15 bg-transparent text-white"><QrCode className="h-4 w-4"/>SCAN</Button><input id="qr-file" type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>void scanQr(e.target.files?.[0])}/></div><p className={`mt-2 text-xs ${serial&&!valid?"text-red-400":"text-zinc-600"}`}>Format: 2609 CSA 12345</p><Button disabled={!valid} onClick={()=>setStep(2)} className="mt-6 bg-[#ffc400] text-black">{lang==="th"?"ตรวจสอบ Serial":"Verify serial"}<ChevronRight className="h-4 w-4"/></Button></>}
  {step===2&&<div className="space-y-4"><div className="border border-[#ffc400]/30 bg-[#ffc400]/5 p-4"><BadgeCheck className="h-5 w-5 text-[#ffc400]"/><p className="mt-2 font-bold">CSA Suspension</p><p className="font-mono text-sm text-zinc-500">{serial}</p></div><div className="grid gap-3 sm:grid-cols-2"><div><Label>{lang==="th"?"วันที่ซื้อ":"Purchase date"}</Label><Input type="date" value={purchaseDate} onChange={e=>setPurchaseDate(e.target.value)} className="mt-2 border-white/15 bg-black/40"/></div><div><Label>{lang==="th"?"ร้านค้าที่ซื้อ":"Dealer"}</Label><Input value={dealer} onChange={e=>setDealer(e.target.value)} placeholder="CSA Authorized Dealer" className="mt-2 border-white/15 bg-black/40"/></div></div><Upload label={lang==="th"?"ใบเสร็จ / หลักฐานการซื้อ":"Receipt / purchase evidence"} onUploaded={setReceiptUrl}/><Button disabled={busy||!purchaseDate||!dealer||!receiptUrl} onClick={()=>void submit()} className="bg-[#ffc400] text-black">{busy?<Loader2 className="animate-spin"/>:null}{lang==="th"?"ยืนยันข้อมูล":"Confirm details"}</Button></div>}
  {step===3&&<div className="py-7 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400"/><h3 className="mt-4 text-2xl font-black">{lang==="th"?"ลงทะเบียนสำเร็จ":"Warranty registered"}</h3><p className="mt-2 font-mono text-sm text-[#ffc400]">Warranty ID: {warrantyId}</p><Button onClick={()=>{setStep(1);setSerial("");setPurchaseDate("");setDealer("");setReceiptUrl("");setWarrantyId("")}} variant="outline" className="mt-5 border-white/20 bg-transparent text-white">{lang==="th"?"ลงทะเบียนสินค้าเพิ่ม":"Register another product"}</Button></div>}</section><aside className="border border-white/10 bg-[#111] p-5"><CircleGauge className="h-6 w-6 text-[#ffc400]"/><h3 className="mt-4 font-bold">{lang==="th"?"ก่อนลงทะเบียน":"Before you register"}</h3><ul className="mt-4 space-y-3 text-sm text-zinc-400">{(lang==="th"?["Serial Number รูปแบบ 2609 CSA 12345","ใบเสร็จหรือหลักฐานการซื้อ","ชื่อร้าน/ตัวแทนจำหน่าย","ระบบจะสร้าง Warranty ID อัตโนมัติ"]:["Serial number in 2609 CSA 12345 format","Purchase receipt","Dealer name","Warranty ID is generated automatically"]).map(x=><li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ffc400]"/>{x}</li>)}</ul></aside></div></Shell>;
}
function Claims({lang,flash}:{lang:Lang;flash:(v:string)=>void}) {
 const [serial,setSerial]=useState("");const [issue,setIssue]=useState("");const [evidenceUrl,setEvidenceUrl]=useState("");const [claimId,setClaimId]=useState("");const [busy,setBusy]=useState(false);const valid=/^\d{4}\sCSA\s\d{5}$/i.test(serial.trim());
 const submit=async()=>{setBusy(true);try{const result=await saveEvent("claim","",{serial:serial.trim().toUpperCase(),product:"CSA Suspension",issue,evidenceUrl,receivedAt:new Date().toISOString().slice(0,10)});setClaimId(result.reference);flash(lang==="th"?"ส่งคำขอเคลมสำเร็จ":"Claim submitted")}catch(e){flash(e instanceof Error?e.message:"Claim failed")}finally{setBusy(false)}};
 return <Shell eyebrow="CLAIM CENTER" title={lang==="th"?"แจ้งเคลมและติดตามสถานะ":"Claims & tracking"}><div className="grid gap-5 xl:grid-cols-[1fr_390px]"><section className="border border-white/10 bg-[#111] p-5 md:p-7">{claimId?<div className="py-8 text-center"><PackageCheck className="mx-auto h-12 w-12 text-emerald-400"/><h3 className="mt-4 font-mono text-2xl font-black text-[#ffc400]">{claimId}</h3><p className="mt-2 text-sm text-zinc-500">{lang==="th"?"ได้รับคำขอแล้ว และส่งเข้าระบบ After-sales":"Claim received and sent to After-sales."}</p><Button onClick={()=>{setClaimId("");setSerial("");setIssue("");setEvidenceUrl("")}} variant="outline" className="mt-5 border-white/20 bg-transparent text-white">{lang==="th"?"แจ้งเคลมรายการใหม่":"New claim"}</Button></div>:<div className="space-y-4"><div><Label>Serial Number</Label><Input value={serial} onChange={e=>setSerial(e.target.value.toUpperCase())} placeholder="2609 CSA 12345" className="mt-2 border-white/15 bg-black/40 font-mono"/>{serial&&!valid&&<p className="mt-2 text-xs text-red-400">Format: 2609 CSA 12345</p>}</div><div><Label>{lang==="th"?"อาการหรือปัญหาที่พบ":"Issue description"}</Label><Textarea value={issue} onChange={e=>setIssue(e.target.value)} className="mt-2 min-h-28 border-white/15 bg-black/40" placeholder={lang==="th"?"อธิบายอาการ วันที่พบ และลักษณะการใช้งาน":"Describe the issue, date and usage conditions"}/></div><Upload label={lang==="th"?"เพิ่มรูปหรือ PDF หลักฐาน":"Add image or PDF evidence"} onUploaded={setEvidenceUrl}/><Button disabled={busy||!valid||!issue.trim()||!evidenceUrl} className="bg-[#ffc400] text-black" onClick={()=>void submit()}>{busy?<Loader2 className="animate-spin"/>:null}{lang==="th"?"ส่งคำขอเคลม":"Submit claim"}</Button></div>}</section><aside className="border border-white/10 bg-[#111] p-5"><p className="text-xs font-bold tracking-widest text-[#ffc400]">CLAIM PROCESS</p><div className="mt-6">{(lang==="th"?["รับเรื่อง","กำลังตรวจสอบ","อนุมัติ / ไม่อนุมัติ","เสร็จสิ้น"]:["Received","Reviewing","Approved / Rejected","Completed"]).map((x,i)=><div key={x} className="flex gap-3 pb-5"><span className={`mt-1 h-3 w-3 rounded-full border-2 ${i===0?"border-[#ffc400] bg-[#ffc400]":"border-zinc-700"}`}/><p className={`text-sm font-semibold ${i===0?"text-white":"text-zinc-600"}`}>{x}</p></div>)}</div></aside></div></Shell>;
}
function Promotions({lang,content}:{lang:Lang;content:SiteContent}) {
  const promo=content.promotion;
  if(!promo.active)return <Shell eyebrow="MEMBER BENEFITS" title={lang==="th"?"สิทธิพิเศษสมาชิก":"Member benefits"}><div className="rounded-2xl border border-white/10 bg-[#111] p-10 text-center text-zinc-500">{lang==="th"?"ยังไม่มีโปรโมชั่นในขณะนี้":"No active promotions"}</div></Shell>;
  return <Shell eyebrow="MEMBER BENEFITS" title={lang==="th"?"สิทธิพิเศษสมาชิก":"Member benefits"}><article className="grid overflow-hidden rounded-3xl bg-[#ffc400] text-black md:grid-cols-[42%_1fr]">{promo.image&&<img src={promo.image} alt="" className="h-full min-h-64 w-full object-cover"/>}<div className="flex min-h-64 flex-col justify-center p-7"><Sparkles className="h-6 w-6"/><h3 className="mt-5 font-display text-3xl leading-tight sm:text-4xl">{promo.title[lang]}</h3><p className="mt-3 max-w-xl leading-7">{promo.description[lang]}</p>{promo.url&&<a href={promo.url} className="mt-6 inline-flex w-fit rounded-xl bg-black px-5 py-3 font-black text-white">{promo.button[lang]}</a>}{(promo.startsAt||promo.endsAt)&&<p className="mt-5 text-xs font-bold opacity-60">{promo.startsAt||"—"} — {promo.endsAt||"—"}</p>}</div></article></Shell>;
}

function Field({label,type="text",placeholder}:{label:string;type?:string;placeholder?:string}) { return <div><Label>{label}</Label><Input type={type} placeholder={placeholder} className="mt-2 border-white/15 bg-black/40"/></div> }
function Upload({label,onUploaded}:{label:string;onUploaded?:(url:string)=>void}) {
  const [state,setState]=useState("");
  const upload=async(file?:File)=>{
    if(!file)return; setState("Uploading…");
    const body=new FormData(); body.append("file",file);
    const response=await fetch("/api/customer-upload",{method:"POST",body});
    const data=await response.json();
    if(response.ok&&data.url){setState(`✓ ${file.name}`);onUploaded?.(String(data.url))}else setState(data.error||"Upload failed");
  };
  return <div><Label>{label}</Label><label className="mt-2 flex cursor-pointer items-center gap-3 border border-dashed border-white/20 p-4 text-sm text-zinc-400"><FileImage className="h-5 w-5 text-[#ffc400]"/>{state||label}<input type="file" className="hidden" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={e=>void upload(e.target.files?.[0])}/></label></div>
}

function Cart({lang,t,lines,total,close,change,checkout}:any) {
  return <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm" onMouseDown={close}><aside className="absolute right-0 top-0 flex h-[100dvh] w-full max-w-md flex-col border-l border-white/10 bg-[#111]" onMouseDown={e=>e.stopPropagation()}><div className="flex shrink-0 items-center justify-between p-5"><div><p className="text-xs font-bold tracking-widest text-[#ffc400]">CSA CART</p><h2 className="font-display text-3xl uppercase">{t.cart}</h2></div><Button variant="ghost" size="icon" onClick={close} aria-label={lang==="th"?"ปิดตะกร้า":"Close cart"}><X className="h-5 w-5"/></Button></div>
    {!lines.length?<div className="grid min-h-0 flex-1 place-items-center px-5 text-zinc-500">{t.empty}</div>:<><div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 pb-5">{lines.map(({product:p,qty}:any)=><div key={p.id} className="flex gap-3 border-b border-white/10 pb-3"><div className="grid h-16 w-16 place-items-center bg-zinc-900"><ShockAbsorberIcon className="text-[#ffc400]"/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{p.name}</p><p className="text-xs text-zinc-600">{p.id}</p><p className="mt-1 text-sm font-bold">{money.format(p.price)}</p></div><div className="flex items-center gap-1 self-end"><button aria-label={lang==="th"?"ลดจำนวน":"Decrease quantity"} className="grid h-10 w-10 place-items-center rounded-xl border border-white/15" onClick={()=>change(p.id,-1)}><Minus className="h-4 w-4"/></button><span className="min-w-7 text-center">{qty}</span><button aria-label={lang==="th"?"เพิ่มจำนวน":"Increase quantity"} className="grid h-10 w-10 place-items-center rounded-xl border border-white/15" onClick={()=>change(p.id,1)}><Plus className="h-4 w-4"/></button></div></div>)}</div><div className="shrink-0 border-t border-white/10 bg-[#111] px-5 pt-5 pb-[calc(1rem+env(safe-area-inset-bottom))]"><div className="mb-4 flex items-end justify-between"><span className="text-zinc-500">{t.total}</span><strong className="text-2xl">{money.format(total)}</strong></div><Button className="h-12 w-full bg-[#ffc400] text-black" onClick={checkout}>{t.checkout}<ChevronRight className="h-4 w-4"/></Button><p className="mt-2 text-center text-[10px] text-zinc-600">{lang==="th"?"ราคาทดลอง ยังไม่ใช่การสั่งซื้อจริง":"Demo price. No real charge."}</p></div></>}</aside></div>;
}

function MemberRequired({lang,login}:{lang:Lang;login:()=>void}){return <div className="mx-auto max-w-3xl px-5 py-16"><div className="border border-white/10 bg-[#111] p-8 text-center"><UserRound className="mx-auto h-10 w-10 text-[#ffc400]"/><h1 className="mt-4 text-2xl font-black">{lang==="th"?"เข้าสู่ระบบสมาชิกก่อน":"Member sign-in required"}</h1><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">{lang==="th"?"การลงทะเบียนรับประกันและการเคลมจะเชื่อมกับบัญชี LINE ของคุณ เพื่อให้ดูสินค้าและติดตามสถานะได้":"Warranty and claims are linked to your LINE member account so you can see products and track status."}</p><Button onClick={login} className="mt-6 bg-[#ffc400] text-black">{lang==="th"?"เข้าสู่ระบบด้วย LINE":"Sign in with LINE"}</Button></div></div>}

function Login({open,setOpen,lang}:any) {
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto border-white/10 bg-[#121212] pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-white sm:max-w-md"><DialogHeader><DialogTitle className="font-display text-3xl uppercase">{lang==="th"?"เข้าสู่ระบบสมาชิก":"Member sign in"}</DialogTitle></DialogHeader><p className="text-sm text-zinc-400">{lang==="th"?"เข้าสู่ระบบด้วยบัญชี LINE เพื่อเชื่อมสินค้า การรับประกัน และการเคลมของคุณ":"Sign in with LINE to connect your products, warranty and claims."}</p><Button className="h-12 bg-[#06c755] text-white hover:bg-[#05b64d]" onClick={()=>{window.location.href="/api/auth/line"}}>LINE Login</Button><p className="text-xs text-zinc-600">{lang==="th"?"ระบบจะกลับมายังเว็บไซต์ CSA หลังยืนยันกับ LINE":"You will return to CSA after authorizing with LINE."}</p></DialogContent></Dialog>;
}
function Checkout({open,setOpen,total,lang,done}:any) {
  const [method,setMethod]=useState("promptpay");
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto border-white/10 bg-[#121212] pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-white sm:max-w-lg"><DialogHeader><DialogTitle className="font-display text-3xl uppercase">{lang==="th"?"ยืนยันคำสั่งซื้อ":"Confirm order"}</DialogTitle></DialogHeader><div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Field label={lang==="th"?"ชื่อผู้รับ":"Recipient"} placeholder="Demo customer"/><Field label={lang==="th"?"เบอร์โทร":"Phone"} placeholder="000-000-0000"/></div><div><Label>{lang==="th"?"ที่อยู่จัดส่ง":"Shipping address"}</Label><Textarea className="mt-2 border-white/15 bg-black/40" placeholder="Demo address, Thailand"/></div><div><Label>{lang==="th"?"วิธีชำระเงิน":"Payment method"}</Label><div className="mt-2 grid grid-cols-2 gap-2"><Pay active={method==="promptpay"} onClick={()=>setMethod("promptpay")} icon={QrCode} title="PromptPay QR" sub="Upload slip · Free"/><Pay active={method==="gateway"} onClick={()=>setMethod("gateway")} icon={CreditCard} title="Payment Gateway" sub="Automatic · Demo"/></div></div><div className="flex items-end justify-between border-t border-white/10 pt-4"><span className="text-zinc-500">TOTAL</span><strong className="text-2xl">{money.format(total)}</strong></div><Button className="h-12 w-full bg-[#ffc400] text-black" onClick={done}>{lang==="th"?"สร้างออเดอร์ทดลอง":"Create demo order"}</Button></div></DialogContent></Dialog>;
}
function Pay({active,onClick,icon:Icon,title,sub}:any){return <button onClick={onClick} className={`border p-4 text-left text-sm font-bold ${active?"border-[#ffc400] bg-[#ffc400]/5":"border-white/10"}`}><Icon className="mb-2 h-5 w-5 text-[#ffc400]"/>{title}<br/><span className="text-xs font-normal text-zinc-500">{sub}</span></button>}
