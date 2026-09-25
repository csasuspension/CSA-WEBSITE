"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, BadgeDollarSign, BarChart3, Boxes, Check, CheckCircle2, ChevronRight, CircleGauge, ClipboardCheck, Clock3, Database, Eye, FileText, Globe2, LayoutDashboard, PackageCheck, Search, Settings2, ShieldCheck, ShoppingBag, TrendingUp, UserCog, Users, WalletCards, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { Lang } from "@/src/types/portal";
import { ProductAdmin } from "@/src/components/ProductAdmin";
import { WebsiteAdmin } from "@/src/components/WebsiteAdmin";

type Module = "dashboard"|"crm"|"sales"|"orders"|"inventory"|"warranty"|"finance"|"admin"|"website";
type QueueModule=Exclude<Module,"dashboard"|"admin"|"website">;
type Item={id:string;name:string;detail:string;value:string;status:string;priority?:boolean};

const modules:{id:Module;label:string;icon:typeof LayoutDashboard;count:string}[]=[
  {id:"admin",label:"Product",icon:PackageCheck,count:""},
  {id:"website",label:"Website",icon:Globe2,count:""},
];

const queues:Record<QueueModule,Item[]>={
  crm:[{id:"DEMO-RECORD",name:"Demo Customer A",detail:"Meta · HIACE 300 · Chiang Mai",value:"New lead",status:"Assign",priority:true},{id:"DEMO-RECORD",name:"Demo Dealer A",detail:"Garage · 3 vehicles · Last order 12 Sep",value:"Dealer",status:"Open profile"},{id:"DEMO-RECORD",name:"Demo Van Club",detail:"Facebook · Dealer enquiry",value:"Qualified",status:"Send to Sales"}],
  sales:[{id:"DEMO-RECORD",name:"Demo Dealer A",detail:"HIACE 300 · Front + Rear · configured quantity",value:"—",status:"Send quotation",priority:true},{id:"DEMO-RECORD",name:"Demo Customer B",detail:"MAJESTY · Follow-up due 10:30",value:"—",status:"Follow up"},{id:"DEMO-RECORD",name:"Demo Dealer C",detail:"Dealer price request · configured quantity",value:"—",status:"Request approval"}],
  orders:[{id:"DEMO-RECORD",name:"Demo Dealer A",detail:"Paid · Ship to Chiang Mai",value:"—",status:"Release to warehouse",priority:true},{id:"DEMO-RECORD",name:"Demo Customer C",detail:"Address requires verification",value:"—",status:"Verify address"},{id:"DEMO-RECORD",name:"Demo Dealer B",detail:"Tax invoice required",value:"—",status:"Send to Finance"}],
  inventory:[{id:"SKU CSA-H300-R",name:"HIACE 300 Rear Pair",detail:"Inventory managed in Admin",value:"LOW STOCK",status:"Create PO",priority:true},{id:"DEMO-RECORD",name:"Pick DEMO-RECORD",detail:"Bin A-03 · configured quantity",value:"PAID",status:"Start picking"},{id:"DEMO-RECORD",name:"MAJESTY Front Pair",detail:"DEMO-LOT · configured quantity",value:"QC",status:"Assign serial"}],
  warranty:[{id:"DEMO-RECORD",name:"Oil leakage inspection",detail:"DEMO-SERIAL-043 · HIACE 300",value:"UNDER REVIEW",status:"Inspect",priority:true},{id:"DEMO-RECORD",name:"Demo Customer D",detail:"Receipt unreadable · DEMO-SERIAL-038",value:"MORE INFO",status:"Request evidence"},{id:"DEMO-RECORD",name:"Rear pair vibration",detail:"DEMO-SERIAL-021 · MAJESTY",value:"APPROVED",status:"Arrange replacement"}],
  finance:[{id:"DEMO-RECORD",name:"Payment mismatch",detail:"DEMO-RECORD · Received —",value:"—",status:"Resolve",priority:true},{id:"DEMO-RECORD",name:"Demo Dealer B",detail:"Tax invoice for DEMO-RECORD",value:"—",status:"Issue invoice"},{id:"DEMO-RECORD",name:"Demo Dealer D",detail:"18 days overdue",value:"—",status:"Follow up"}],
};

const moduleOutput:Record<QueueModule,string>={crm:"Qualified lead → Sales",sales:"Won quotation → Orders",orders:"Paid order → Inventory",inventory:"Serial + tracking → Customer Service",warranty:"Decision → Customer + Inventory",finance:"Payment confirmed → Orders"};

export function InternalSystem({lang,userEmail}:{lang:Lang;userEmail:string}){
  const [active,setActive]=useState<Module>("admin"); const [done,setDone]=useState<string[]>([]); const [serial,setSerial]=useState(""); const [toast,setToast]=useState("");
  const notify=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(""),1800)};
  return <div className="min-h-[calc(100vh-88px)] bg-[#080808]"><div className="border-b border-white/10 bg-[#111] px-4 py-4 md:px-8"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black tracking-[.2em] text-[#ffc400]">CSA BACK-OFFICE</p><h1 className="mt-1 text-2xl font-black">{lang==="th"?"จัดการสินค้าและหน้าเว็บไซต์":"Product & website management"}</h1></div><div className="flex items-center gap-3"><div className="text-right"><p className="text-sm font-bold">{userEmail}</p><p className="text-xs text-zinc-500">Admin access · Live</p></div><span className="grid h-10 w-10 place-items-center rounded-full bg-[#ffc400] font-black text-black">CSA</span></div></div></div><div className="grid lg:grid-cols-[230px_1fr]"><aside className="border-b border-white/10 bg-[#0d0d0d] p-3 lg:min-h-[calc(100vh-165px)] lg:border-b-0 lg:border-r"><p className="px-3 pb-2 text-xs font-bold tracking-widest text-zinc-600">จัดการเว็บไซต์</p><div className="grid grid-cols-2 gap-1 lg:grid-cols-1">{modules.map(m=>{const Icon=m.icon;return <button key={m.id} onClick={()=>setActive(m.id)} className={`flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold ${active===m.id?"bg-[#ffc400] text-black":"text-zinc-400 hover:bg-white/5 hover:text-white"}`}><Icon className="h-4 w-4 shrink-0"/><span className="truncate">{m.label}</span></button>})}</div><div className="mt-5 hidden border-t border-white/10 px-3 pt-5 lg:block"><p className="text-xs font-bold text-zinc-400">ผลลัพธ์บนเว็บ</p><p className="mt-2 text-xs leading-5 text-zinc-600">กดบันทึกแล้วข้อมูลจะอัปเดตบน Customer UI ทันที</p></div></aside><main className="min-w-0 p-4 md:p-7">{active==="admin"?<ProductAdmin/>:<WebsiteAdmin/>}</main></div>{toast&&<div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 border border-[#ffc400]/40 bg-[#171717] px-4 py-3 text-sm font-bold shadow-2xl"><CheckCircle2 className="mr-2 inline h-4 w-4 text-[#ffc400]"/>{toast}</div>}</div>;
}

function Dashboard({setActive}:{setActive:(m:Module)=>void}){
  const metrics=[["—","Revenue today","72%",TrendingUp],["12","Orders","+20%",ShoppingBag],["38","Leads","+12%",Users],["5.4","ROAS","Target 4.0",CircleGauge],["—","Gross profit","36.1%",BadgeDollarSign],["—","Outstanding AR","1 overdue",WalletCards]];
  const actions:[string,string,string,Module][]=[["Approve dealer discount 15%","DEMO-RECORD · —","Approve","sales"],["Review warranty claim","DEMO-RECORD · Oil leakage","Review","warranty"],["Reorder low stock","CSA-H300-R · low stock","Reorder","inventory"],["Payment mismatch","Received — short","Resolve","finance"]];
  return <><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold text-zinc-500">TODAY AT A GLANCE</p><h2 className="mt-1 text-3xl font-black">Owner Dashboard</h2></div><Button onClick={downloadDailyReport} variant="outline" className="border-white/15 bg-transparent text-white"><FileText className="h-4 w-4"/>Daily report</Button></div><div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-6">{metrics.map(([v,k,d,I])=>{const Icon=I as typeof TrendingUp;return <div key={k as string} className="border border-white/10 bg-[#111] p-4"><div className="flex justify-between"><Icon className="h-4 w-4 text-[#ffc400]"/><span className="text-xs text-zinc-600">{d as string}</span></div><p className="mt-5 text-2xl font-black">{v as string}</p><p className="mt-1 text-xs text-zinc-500">{k as string}</p></div>})}</div><div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><section className="border border-white/10 bg-[#111]"><div className="border-b border-white/10 p-4"><p className="font-black">Needs your action</p><p className="text-xs text-zinc-500">Only approvals, risk and exceptions</p></div>{actions.map(a=><div key={a[0]} className="grid gap-3 border-b border-white/10 p-4 last:border-0 sm:grid-cols-[32px_1fr_auto]"><span className="grid h-8 w-8 place-items-center rounded-full bg-red-500/15 text-red-400"><AlertTriangle className="h-4 w-4"/></span><div><p className="text-sm font-bold">{a[0]}</p><p className="text-xs text-zinc-500">{a[1]}</p></div><Button onClick={()=>setActive(a[3])} size="sm" variant="outline" className="border-white/15 bg-transparent text-white">{a[2]}<ArrowRight className="h-3 w-3"/></Button></div>)}</section><section className="border border-white/10 bg-[#111] p-4"><p className="font-black">Company flow</p><p className="text-xs text-zinc-500">Current workload at each hand-off</p><div className="mt-5 space-y-4">{[["CRM → Sales",14,38],["Sales → Orders",8,18],["Paid → Inventory",8,12],["QC → Shipment",5,12],["Delivered → Warranty",6,28]].map(([label,n,total])=><div key={label as string}><div className="mb-2 flex justify-between text-xs"><span>{label as string}</span><b>{n as number}</b></div><Progress value={(n as number)/(total as number)*100} className="h-1.5 bg-white/10"/></div>)}</div></section></div></>;
}

function Queue({module,done,onComplete}:{module:QueueModule;done:string[];onComplete:(id:string)=>void}){
  const meta=modules.find(x=>x.id===module)!; const Icon=meta.icon; const items=queues[module].filter(x=>!done.includes(x.id));
  return <><div className="flex flex-wrap items-end justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center bg-[#ffc400] text-black"><Icon/></span><div><p className="text-xs font-bold text-zinc-500">WORK QUEUE</p><h2 className="text-3xl font-black">{meta.label}</h2></div></div><div className="border border-white/10 bg-[#111] px-4 py-2"><p className="text-xs text-zinc-600">OUTPUT / HAND-OFF</p><p className="text-sm font-bold text-[#ffc400]">{moduleOutput[module]}</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{[[items.length,"Open queue"],[items.filter(x=>x.priority).length,"Priority"],[done.length,"Completed today"]].map(x=><div key={x[1] as string} className="border border-white/10 bg-[#111] p-4"><p className="text-2xl font-black text-[#ffc400]">{x[0]}</p><p className="text-xs text-zinc-500">{x[1]}</p></div>)}</div><section className="mt-5 border border-white/10 bg-[#111]"><div className="flex justify-between border-b border-white/10 p-4"><div><p className="font-black">My queue</p><p className="text-xs text-zinc-500">Priority first · Every action creates the next module&apos;s input</p></div><Clock3 className="h-5 w-5 text-zinc-600"/></div>{items.length?items.map(item=><div key={item.id} className="grid gap-3 border-b border-white/10 p-4 last:border-0 md:grid-cols-[1fr_auto_auto] md:items-center"><div><div className="flex items-center gap-2"><span className="font-mono text-xs text-[#ffc400]">{item.id}</span>{item.priority&&<span className="bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-400">PRIORITY</span>}</div><p className="mt-1 font-bold">{item.name}</p><p className="text-xs text-zinc-500">{item.detail}</p></div><p className="font-black">{item.value}</p><div className="flex gap-2"><Button onClick={() => window.alert([item.id,item.name,item.detail,item.value].join("\n"))} size="sm" variant="outline" className="border-white/15 bg-transparent text-white"><Eye className="h-3 w-3"/>Open</Button><Button onClick={()=>onComplete(item.id)} size="sm" className="bg-[#ffc400] text-black"><Check className="h-3 w-3"/>{item.status}</Button></div></div>):<div className="p-10 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-[#ffc400]"/><p className="mt-3 font-bold">Queue cleared</p></div>}</section></>;
}

function AdminModule(){return <><div><p className="text-xs font-bold text-zinc-500">SYSTEM CONTROL</p><h2 className="mt-1 text-3xl font-black">Product</h2></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[[UserCog,"Users & roles","Owner, Sales, CS, Warehouse, Finance"],[Database,"Master data","Products, vehicle fitment, dealers"],[Settings2,"Approval rules","Discount, claim and expense limits"],[BarChart3,"KPI settings","Targets, thresholds and alerts"],[ShieldCheck,"Permissions","Module and record access"],[PackageCheck,"Audit log","Actions, changes and hand-offs"]].map(([I,t,d])=>{const Icon=I as typeof UserCog;return <button key={t as string} onClick={() => window.alert(`${t}: ${d}`)} className="border border-white/10 bg-[#111] p-5 text-left hover:border-[#ffc400]"><Icon className="h-5 w-5 text-[#ffc400]"/><h3 className="mt-5 font-black">{t as string}</h3><p className="mt-2 text-sm text-zinc-500">{d as string}</p><ChevronRight className="mt-5 h-4 w-4"/></button>})}</div></>}
function Fact({k,v}:{k:string;v:string}){return <div><p className="text-xs text-zinc-600">{k}</p><p className="mt-1 font-bold">{v}</p></div>}

function downloadDailyReport(){
  const rows=[
    ["Metric","Value"],
    ["Revenue today","0"],
    ["Orders","0"],
    ["Leads","0"],
    ["Outstanding AR","0"],
  ];
  const blob=new Blob([rows.map(row=>row.join(",")).join("\n")],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download=`csa-daily-report-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
