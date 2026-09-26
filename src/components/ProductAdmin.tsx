"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive, Boxes, CheckCircle2, ChevronLeft, ChevronRight, Edit3, ImagePlus,
  Layers3, Loader2, PackagePlus, Plus, RefreshCw, Search, Settings2,
  PackageCheck, SlidersHorizontal, Trash2,
  Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Product, ProductAttribute, ProductOptionGroup, ProductVariant } from "@/src/types/portal";

type TabId="general"|"details"|"attributes"|"variants"|"shipping"|"warranty";
const tabs:{id:TabId;label:string;icon:typeof Boxes}[]=[
  {id:"general",label:"ข้อมูลทั่วไป",icon:PackagePlus},
  {id:"details",label:"รายละเอียด",icon:Layers3},
  {id:"attributes",label:"ข้อมูลจำเพาะ",icon:Settings2},
  {id:"variants",label:"ตัวเลือกและราคา",icon:SlidersHorizontal},
  {id:"shipping",label:"การจัดส่ง",icon:Boxes},
  {id:"warranty",label:"การรับประกัน",icon:PackageCheck},
];

const createProduct=():Product=>({
  id:"",name:"",vehicleMake:"",model:"",modelNumber:"",category:"",position:"",
  price:0,stock:0,tag:"NEW",active:true,brand:"CSA",shortDescription:"",
  nameEn:"",shortDescriptionEn:"",description:"",descriptionEn:"",imageUrls:[],attributes:[],
  warranty:{duration:"1 ปี",conditions:"รับประกันความบกพร่องจากการผลิต",note:"",durationEn:"1 year",conditionsEn:"Manufacturing defects",noteEn:""},
});
const copyProduct=(item:Product):Product=>JSON.parse(JSON.stringify(item)) as Product;

export function ProductAdmin(){
  const [items,setItems]=useState<Product[]>([]);
  const [query,setQuery]=useState("");
  const [editing,setEditing]=useState<Product|null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");

  const load=async()=>{
    setLoading(true);
    try{
      const response=await fetch("/csa-admin/api/products?includeInactive=1",{cache:"no-store"});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error);
      setItems(data.products??[]);
    }catch(error){setMessage(error instanceof Error?error.message:"Could not load products")}
    finally{setLoading(false)}
  };
  useEffect(()=>{void load()},[]);
  const visible=useMemo(()=>items.filter(item=>
    `${item.id} ${item.name} ${item.model} ${item.modelNumber} ${item.brand} ${item.category}`
      .toLowerCase().includes(query.toLowerCase())
  ),[items,query]);

  const save=async()=>{
    if(!editing)return;
    setSaving(true);setMessage("");
    const payload:Product=editing;
    try{
      const response=await fetch("/csa-admin/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error);
      setEditing(null);setMessage("บันทึกแล้ว");await load();
    }catch(error){setMessage(error instanceof Error?error.message:"Could not save product")}
    finally{setSaving(false)}
  };
  const setListed=async(item:Product,active:boolean)=>{
    setMessage("");
    if(!active){
      if(!window.confirm(`ซ่อนสินค้า ${item.id} จากหน้าเว็บไซต์? ข้อมูลสินค้าจะยังอยู่`))return;
      const response=await fetch("/csa-admin/api/products",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({sku:item.id,mode:"delist"})});
      if(response.ok){setMessage("ซ่อนแล้ว");await load()}else setMessage("ไม่สามารถซ่อนสินค้าได้");
      return;
    }
    const response=await fetch("/csa-admin/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...item,active:true})});
    if(response.ok){setMessage("แสดงแล้ว");await load()}else setMessage("ไม่สามารถแสดงสินค้าได้");
  };
  const purge=async(item:Product)=>{
    if(!window.confirm(`ลบสินค้า ${item.id} ถาวร? การดำเนินการนี้ไม่สามารถย้อนกลับได้`))return;
    const response=await fetch("/csa-admin/api/products",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({sku:item.id,mode:"purge"})});
    if(response.ok){setMessage("ลบสินค้าออกจากระบบแล้ว");await load()}else setMessage("ไม่สามารถลบสินค้าได้");
  };

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-bold tracking-[.18em] text-[#ffc400]">PRODUCT MANAGEMENT</p><h2 className="mt-1 text-3xl font-black">สินค้า</h2><p className="mt-2 text-sm text-zinc-500">จัดการข้อมูลที่แสดงบนหน้า Customer UI: รายการสินค้า รายละเอียด ข้อมูลจำเพาะ และการรับประกัน</p></div>
      <Button onClick={()=>setEditing(createProduct())} className="bg-white text-black hover:bg-zinc-200"><Plus/>เพิ่มสินค้า</Button>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <Stat icon={Boxes} value={String(items.length)} label="สินค้าทั้งหมด"/>
      <Stat icon={CheckCircle2} value={String(items.filter(x=>x.active!==false).length)} label="กำลังแสดง"/>
      <Stat icon={Archive} value={String(items.filter(x=>x.active===false).length)} label="ซ่อนอยู่"/>
    </div>
    <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4">
        <label className="flex h-11 min-w-0 flex-1 items-center rounded-xl border border-white/15 bg-black px-3"><Search className="mr-2 h-4 w-4 text-zinc-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ค้นหา SKU, ชื่อสินค้า, แบรนด์, รุ่นรถ หรือหมวดหมู่" className="w-full bg-transparent text-sm outline-none"/></label>
        <Button onClick={()=>void load()} variant="outline" className="border-white/15 bg-transparent text-white"><RefreshCw className={loading?"animate-spin":""}/>รีเฟรช</Button>
      </div>
      {loading?<div className="grid h-44 place-items-center"><Loader2 className="animate-spin text-[#ffc400]"/></div>:
      <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-white/[.03] text-xs text-zinc-500"><tr><th className="p-4">SKU / PRODUCT</th><th>หมวดหมู่</th><th>FITMENT</th><th>PRICE</th><th>STATUS</th><th className="pr-4 text-right">ACTION</th></tr></thead>
        <tbody>{visible.map(item=><tr key={item.id} className="border-t border-white/10">
          <td className="p-4"><p className="font-mono text-xs text-[#ffc400]">{item.id}</p><p className="mt-1 font-bold">{item.name}</p><p className="text-xs text-zinc-600">{item.brand||"—"}</p></td>
          <td>{item.category||"—"}<p className="text-xs text-zinc-600">{item.position||"—"}</p></td>
          <td><p className="font-bold">{[item.vehicleMake,item.model].filter(Boolean).join(" ")||"—"}</p><p className="text-xs text-zinc-600">{item.modelNumber||"—"}</p></td>
          <td className="font-bold">฿{Number(item.price).toLocaleString("th-TH")}</td>
          <td><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.active===false?"bg-zinc-800 text-zinc-500":"bg-emerald-500/15 text-emerald-400"}`}>{item.active===false?"HIDDEN":"ACTIVE"}</span></td>
          <td><div className="flex justify-end gap-2 pr-4"><Button onClick={()=>setEditing(copyProduct(item))} size="sm" variant="outline" className="border-white/15 bg-transparent text-white"><Edit3/>แก้ไข</Button><Button onClick={()=>void setListed(item,item.active===false)} size="sm" variant="outline" className="border-white/15 bg-transparent text-white">{item.active===false?<><Eye/>แสดง</>:<><EyeOff/>ซ่อน</>}</Button><Button onClick={()=>void purge(item)} size="icon" variant="outline" className="border-red-500/20 bg-transparent text-red-400" aria-label={`Delete ${item.name}`}><Trash2/></Button></div></td>
        </tr>)}</tbody>
      </table>{!visible.length&&<div className="p-10 text-center text-sm text-zinc-500">ไม่พบสินค้าที่ค้นหา</div>}</div>}
    </section>
    <div className="mt-5 flex justify-center"><Button onClick={()=>setEditing(createProduct())} className="min-h-12 rounded-xl bg-white px-7 font-black text-black"><Plus/>เพิ่มสินค้า</Button></div>
    {message&&<p className="mt-3 text-sm font-bold text-[#ffc400]">{message}</p>}
    <ProductDialog value={editing} setValue={setEditing} saving={saving} save={()=>void save()}/>
  </div>;
}

function ProductDialog({value,setValue,saving,save}:{value:Product|null;setValue:(v:Product|null)=>void;saving:boolean;save:()=>void}){
  const [tab,setTab]=useState<TabId>("general");
  if(!value)return null;
  const update=<K extends keyof Product>(key:K,next:Product[K])=>setValue({...value,[key]:next});
  const activeIndex=tabs.findIndex(x=>x.id===tab);
  const next=()=>setTab(tabs[Math.min(tabs.length-1,activeIndex+1)].id);
  const previous=()=>setTab(tabs[Math.max(0,activeIndex-1)].id);

  return <Dialog open onOpenChange={open=>!open&&setValue(null)}>
    <DialogContent className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden rounded-none border-white/10 bg-[#121212] p-0 text-white sm:h-auto sm:max-h-[94dvh] sm:max-w-5xl sm:rounded-2xl">
      <DialogHeader className="border-b border-white/10 px-5 py-4"><DialogTitle className="flex items-center gap-2 text-2xl"><PackagePlus className="text-[#ffc400]"/>{value.id?"แก้ไขสินค้า":"เพิ่มสินค้า"}</DialogTitle></DialogHeader>
      <div className="flex overflow-x-auto border-b border-white/10 px-3">{tabs.map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>setTab(item.id)} className={`flex shrink-0 items-center gap-2 rounded-none border-b-2 px-4 py-3 text-sm font-bold ${tab===item.id?"border-[#ffc400] text-[#ffc400]":"border-transparent text-zinc-500"}`}><Icon className="h-4 w-4"/>{item.label}</button>})}</div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
        {tab==="general"&&<GeneralTab value={value} update={update}/>} 
        {tab==="details"&&<DetailsTab value={value} update={update}/>} 
        {tab==="attributes"&&<AttributesTab value={value} update={update}/>} 
        {tab==="variants"&&<VariantsTab value={value} update={update}/>} 
        {tab==="shipping"&&<ShippingTab value={value} update={update}/>} 
        {tab==="warranty"&&<WarrantyTab value={value} update={update}/>} 
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#0d0d0d] px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button onClick={previous} disabled={activeIndex===0} variant="outline" className="border-white/15 bg-transparent text-white"><ChevronLeft/>ย้อนกลับ</Button>
        <div className="flex gap-2"><Button onClick={()=>setValue(null)} variant="outline" className="border-white/15 bg-transparent text-white">ยกเลิก</Button>{activeIndex<tabs.length-1?<Button onClick={next} className="bg-white text-black hover:bg-zinc-200">ถัดไป<ChevronRight/></Button>:<Button onClick={save} disabled={saving||!value.id.trim()||!value.name.trim()} className="bg-white text-black hover:bg-zinc-200">{saving&&<Loader2 className="animate-spin"/>}บันทึกสินค้า</Button>}</div>
      </div>
    </DialogContent>
  </Dialog>;
}

function GeneralTab({value,update}:{value:Product;update:<K extends keyof Product>(key:K,next:Product[K])=>void}){
  const images=value.imageUrls??[];
  const [uploading,setUploading]=useState(false);
  const [uploadError,setUploadError]=useState("");
  const upload=async(file?:File)=>{
    if(!file)return;
    setUploading(true);setUploadError("");
    try{
      const form=new FormData();form.append("file",file);
      const response=await fetch("/csa-admin/api/upload",{method:"POST",body:form});
      const data=await response.json();
      if(!response.ok||!data.url)throw new Error(data.error||"อัปโหลดรูปไม่สำเร็จ");
      update("imageUrls",[...images,String(data.url)]);
    }catch(error){setUploadError(error instanceof Error?error.message:"อัปโหลดรูปไม่สำเร็จ")}
    finally{setUploading(false)}
  };
  return <div className="space-y-6">
    <Section title="ข้อมูลทั่วไป" description="ข้อมูลสินค้า">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SKU *"><Input value={value.id} onChange={e=>update("id",e.target.value.toUpperCase())} placeholder="CSA-H3-F01" className="border-white/15 bg-black/40 font-mono"/></Field>
        <Field label="ชื่อสินค้า *"><Input value={value.name} onChange={e=>update("name",e.target.value)} placeholder="ชื่อสินค้าที่แสดง" className="border-white/15 bg-black/40"/></Field>
        <Field label="ชื่อสินค้า (English)"><Input value={value.nameEn??""} onChange={e=>update("nameEn",e.target.value)} placeholder="Product name" className="border-white/15 bg-black/40"/></Field>
        <Field label="แบรนด์"><Input value={value.brand??""} onChange={e=>update("brand",e.target.value)} placeholder="เพิ่มแบรนด์เอง" className="border-white/15 bg-black/40"/></Field>
        <Field label="หมวดหมู่"><Input value={value.category??""} onChange={e=>update("category",e.target.value)} placeholder="เช่น โช้คอัพ, สปริง, อุปกรณ์เสริม" className="border-white/15 bg-black/40"/></Field>
        <Field label="ตำแหน่งสินค้า"><Input value={value.position??""} onChange={e=>update("position",e.target.value)} placeholder="เช่น หน้า, หลัง, ทั้งชุด" className="border-white/15 bg-black/40"/></Field>
        <Field label="ป้ายสินค้า"><Input value={value.tag} onChange={e=>update("tag",e.target.value)} placeholder="NEW / BEST SELLER" className="border-white/15 bg-black/40"/></Field>
        <Field label="คำอธิบายสั้น (ไทย)"><Textarea value={value.shortDescription??""} onChange={e=>update("shortDescription",e.target.value)} placeholder="สรุปจุดเด่นสินค้า" className="min-h-20 border-white/15 bg-black/40"/></Field>
        <Field label="คำอธิบายสั้น (English)"><Textarea value={value.shortDescriptionEn??""} onChange={e=>update("shortDescriptionEn",e.target.value)} placeholder="Short product description" className="min-h-20 border-white/15 bg-black/40"/></Field>
      </div>
    </Section>
    <Section title="รูปภาพสินค้า" description="เพิ่มรูปสินค้า">
      <div className="space-y-3">{images.map((url,index)=><div key={`${url}-${index}`} className="grid gap-2 rounded-xl border border-white/10 p-3 sm:grid-cols-[72px_1fr_auto] sm:items-center">{url?<img src={url} alt="" className="h-16 w-16 rounded-lg bg-white object-contain p-1"/>:<span className="grid h-16 w-16 place-items-center rounded-lg bg-white/5"><ImagePlus className="h-5 w-5 text-[#ffc400]"/></span>}<div><Input value={url} onChange={e=>update("imageUrls",images.map((x,i)=>i===index?e.target.value:x))} placeholder="https://..." className="border-white/15 bg-black/40"/><div className="mt-2 flex gap-2"><Button type="button" disabled={index===0} onClick={()=>{const next=[...images];[next[index-1],next[index]]=[next[index],next[index-1]];update("imageUrls",next)}} size="sm" variant="outline" className="border-white/15 bg-transparent text-white">เลื่อนขึ้น</Button><Button type="button" disabled={index===images.length-1} onClick={()=>{const next=[...images];[next[index+1],next[index]]=[next[index],next[index+1]];update("imageUrls",next)}} size="sm" variant="outline" className="border-white/15 bg-transparent text-white">เลื่อนลง</Button></div></div><Button type="button" onClick={()=>update("imageUrls",images.filter((_,i)=>i!==index))} size="icon" variant="outline" className="border-red-500/20 text-red-400"><Trash2/></Button></div>)}</div>
      <div className="mt-3 flex flex-wrap gap-2"><label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-black"><ImagePlus className="h-4 w-4"/>{uploading?"กำลังอัปโหลด…":"อัปโหลดรูป"}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" disabled={uploading} onChange={e=>{void upload(e.target.files?.[0]);e.currentTarget.value=""}}/></label><Button type="button" onClick={()=>update("imageUrls",[...images,""])} variant="outline" className="border-white/15 bg-transparent text-white"><Plus/>เพิ่มด้วยลิงก์</Button></div>
      {uploadError&&<p className="mt-2 text-sm font-bold text-red-400">{uploadError}</p>}
    </Section>
    <div className="flex items-center justify-between rounded-xl border border-white/10 p-4"><div><p className="font-bold">แสดงสินค้าบนเว็บไซต์</p><p className="text-xs text-zinc-500">ปิดเพื่อซ่อนสินค้าโดยไม่ลบข้อมูล</p></div><Switch checked={value.active!==false} onCheckedChange={checked=>update("active",checked)}/></div>
  </div>;
}

function AttributesTab({value,update}:{value:Product;update:<K extends keyof Product>(key:K,next:Product[K])=>void}){
  const rows=value.attributes??[];
  const set=(next:ProductAttribute[])=>update("attributes",next);
  return <div className="space-y-6"><Section title="ข้อมูลรถที่รองรับ" description="ใช้ค้นหาสินค้า">
    <div className="grid gap-4 sm:grid-cols-3"><Field label="ยี่ห้อรถ"><Input value={value.vehicleMake??""} onChange={e=>update("vehicleMake",e.target.value)} placeholder="TOYOTA" className="border-white/15 bg-black/40"/></Field><Field label="รุ่นรถ"><Input value={value.model??""} onChange={e=>update("model",e.target.value)} placeholder="HIACE 300" className="border-white/15 bg-black/40"/></Field><Field label="เลขรุ่น / Chassis"><Input value={value.modelNumber??""} onChange={e=>update("modelNumber",e.target.value)} placeholder="GDH300" className="border-white/15 bg-black/40"/></Field><Field label="ปีเริ่ม"><Input type="number" value={value.yearFrom??""} onChange={e=>update("yearFrom",e.target.value?Number(e.target.value):undefined)} className="border-white/15 bg-black/40"/></Field><Field label="ปีสิ้นสุด"><Input type="number" value={value.yearTo??""} onChange={e=>update("yearTo",e.target.value?Number(e.target.value):undefined)} className="border-white/15 bg-black/40"/></Field></div>
  </Section><Section title="ข้อมูลจำเพาะ" description="ข้อมูลจำเพาะ">
    <div className="space-y-3">{rows.map((row,index)=><div key={index} className="grid gap-2 rounded-xl border border-white/10 p-3 sm:grid-cols-2"><Input value={row.name} onChange={e=>set(rows.map((x,i)=>i===index?{...x,name:e.target.value}:x))} placeholder="หัวข้อ (ไทย)" className="border-white/15 bg-black/40"/><Input value={row.value} onChange={e=>set(rows.map((x,i)=>i===index?{...x,value:e.target.value}:x))} placeholder="ค่า (ไทย)" className="border-white/15 bg-black/40"/><Input value={row.nameEn??""} onChange={e=>set(rows.map((x,i)=>i===index?{...x,nameEn:e.target.value}:x))} placeholder="Label (English)" className="border-white/15 bg-black/40"/><div className="flex gap-2"><Input value={row.valueEn??""} onChange={e=>set(rows.map((x,i)=>i===index?{...x,valueEn:e.target.value}:x))} placeholder="Value (English)" className="border-white/15 bg-black/40"/><Button type="button" onClick={()=>set(rows.filter((_,i)=>i!==index))} size="icon" variant="outline" className="border-red-500/20 text-red-400"><Trash2/></Button></div></div>)}</div>
    <Button type="button" onClick={()=>set([...rows,{name:"",value:"",nameEn:"",valueEn:""}])} variant="outline" className="mt-4 border-white/15 bg-transparent text-white"><Plus/>เพิ่มคุณลักษณะ</Button>
  </Section></div>;
}

function DetailsTab({value,update}:{value:Product;update:<K extends keyof Product>(key:K,next:Product[K])=>void}){
  return <Section title="รายละเอียดสินค้า" description="TH / EN">
    <div className="grid gap-4 lg:grid-cols-2"><Field label="รายละเอียด (ไทย)"><Textarea value={value.description??""} onChange={e=>update("description",e.target.value)} placeholder={"รายละเอียดสินค้า\n\n• จุดเด่น\n• เทคโนโลยี\n• คำแนะนำการติดตั้ง"} className="min-h-[360px] border-white/15 bg-black/40 leading-7"/></Field><Field label="Details (English)"><Textarea value={value.descriptionEn??""} onChange={e=>update("descriptionEn",e.target.value)} placeholder={"Product details\n\n• Highlights\n• Technology\n• Installation"} className="min-h-[360px] border-white/15 bg-black/40 leading-7"/></Field></div>
  </Section>;
}

function WarrantyTab({value,update}:{value:Product;update:<K extends keyof Product>(key:K,next:Product[K])=>void}){
  const warranty=value.warranty??{};
  const set=(key:keyof typeof warranty,next:string)=>update("warranty",{...warranty,[key]:next});
  return <Section title="การรับประกัน" description="ข้อมูล Warranty"><div className="grid gap-4 sm:grid-cols-2"><Field label="ระยะรับประกัน (ไทย)"><Input value={warranty.duration??""} onChange={e=>set("duration",e.target.value)} placeholder="เช่น 1 ปี (ไม่จำกัดระยะทาง)" className="border-white/15 bg-black/40"/></Field><Field label="Warranty period (English)"><Input value={warranty.durationEn??""} onChange={e=>set("durationEn",e.target.value)} placeholder="1 year" className="border-white/15 bg-black/40"/></Field><Field label="เงื่อนไขหลัก (ไทย)"><Input value={warranty.conditions??""} onChange={e=>set("conditions",e.target.value)} placeholder="รับประกันความบกพร่องจากการผลิต" className="border-white/15 bg-black/40"/></Field><Field label="Conditions (English)"><Input value={warranty.conditionsEn??""} onChange={e=>set("conditionsEn",e.target.value)} placeholder="Manufacturing defects" className="border-white/15 bg-black/40"/></Field><Field label="หมายเหตุ (ไทย)"><Textarea value={warranty.note??""} onChange={e=>set("note",e.target.value)} className="min-h-44 border-white/15 bg-black/40 leading-7"/></Field><Field label="Notes (English)"><Textarea value={warranty.noteEn??""} onChange={e=>set("noteEn",e.target.value)} className="min-h-44 border-white/15 bg-black/40 leading-7"/></Field></div></Section>;
}

function VariantsTab({value,update}:{value:Product;update:<K extends keyof Product>(key:K,next:Product[K])=>void}){
  const groups=value.optionGroups??[];
  const variants=value.variants??[];
  const setGroups=(next:ProductOptionGroup[])=>update("optionGroups",next);
  const setVariants=(next:ProductVariant[])=>update("variants",next);
  return <div className="space-y-6">
    <Section title="ชื่อตัวเลือกสินค้า" description="ตัวเลือกสินค้า">
      <div className="space-y-3">{groups.map((group,index)=><div key={index} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]"><Input value={group.name} onChange={e=>setGroups(groups.map((x,i)=>i===index?{...x,name:e.target.value}:x))} placeholder="ชื่อตัวเลือก เช่น ตำแหน่ง" className="border-white/15 bg-black/40"/><Input value={group.values.join(", ")} onChange={e=>setGroups(groups.map((x,i)=>i===index?{...x,values:e.target.value.split(",").map(v=>v.trim()).filter(Boolean)}:x))} placeholder="ค่า เช่น หน้า, หลัง, หน้าและหลัง" className="border-white/15 bg-black/40"/><Button onClick={()=>setGroups(groups.filter((_,i)=>i!==index))} size="icon" variant="outline" className="border-red-500/20 text-red-400"><Trash2/></Button></div>)}</div>
      <Button onClick={()=>setGroups([...groups,{name:"",values:[]}])} variant="outline" className="mt-4 border-white/15 bg-transparent text-white"><Plus/>เพิ่มกลุ่มตัวเลือก</Button>
    </Section>
    <Section title="รายการตัวเลือกสินค้า" description="SKU / ราคา / สต็อก">
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs text-zinc-500"><tr><th className="pb-2">ชื่อตัวเลือก</th><th>SKU</th><th>ราคา</th><th>คลัง</th><th>น้ำหนัก (kg)</th><th/></tr></thead><tbody>{variants.map((variant,index)=><tr key={index} className="border-t border-white/10"><td className="py-2 pr-2"><Input value={variant.name} onChange={e=>setVariants(variants.map((x,i)=>i===index?{...x,name:e.target.value}:x))} placeholder="หน้า / HIACE 300" className="border-white/15 bg-black/40"/></td><td className="pr-2"><Input value={variant.sku} onChange={e=>setVariants(variants.map((x,i)=>i===index?{...x,sku:e.target.value.toUpperCase()}:x))} className="border-white/15 bg-black/40 font-mono"/></td><td className="pr-2"><Input type="number" value={variant.price} onChange={e=>setVariants(variants.map((x,i)=>i===index?{...x,price:Number(e.target.value)}:x))} className="border-white/15 bg-black/40"/></td><td className="pr-2"><Input type="number" value={variant.stock} onChange={e=>setVariants(variants.map((x,i)=>i===index?{...x,stock:Number(e.target.value)}:x))} className="border-white/15 bg-black/40"/></td><td className="pr-2"><Input type="number" step="0.1" value={variant.weight??0} onChange={e=>setVariants(variants.map((x,i)=>i===index?{...x,weight:Number(e.target.value)}:x))} className="border-white/15 bg-black/40"/></td><td><Button onClick={()=>setVariants(variants.filter((_,i)=>i!==index))} size="icon" variant="outline" className="border-red-500/20 text-red-400"><Trash2/></Button></td></tr>)}</tbody></table></div>
      <Button onClick={()=>setVariants([...variants,{name:"",sku:"",price:0,stock:0,weight:0}])} variant="outline" className="mt-4 border-white/15 bg-transparent text-white"><Plus/>เพิ่มตัวเลือกสินค้า</Button>
      {!variants.length&&<div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="ราคาขายหลัก"><Input type="number" value={value.price} onChange={e=>update("price",Number(e.target.value))} className="border-white/15 bg-black/40"/></Field><Field label="สต็อกหลัก"><Input type="number" value={value.stock??0} onChange={e=>update("stock",Number(e.target.value))} className="border-white/15 bg-black/40"/></Field></div>}
    </Section>
  </div>;
}

function ShippingTab({value,update}:{value:Product;update:<K extends keyof Product>(key:K,next:Product[K])=>void}){
  const shipping=value.shipping??{};
  const set=(key:keyof typeof shipping,next:number)=>update("shipping",{...shipping,[key]:next});
  return <Section title="การจัดส่ง" description="ขนาดพัสดุ">
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="น้ำหนัก (kg)"><Input type="number" step="0.1" value={shipping.weight??0} onChange={e=>set("weight",Number(e.target.value))} className="border-white/15 bg-black/40"/></Field>
      <Field label="ความกว้าง (cm)"><Input type="number" value={shipping.width??0} onChange={e=>set("width",Number(e.target.value))} className="border-white/15 bg-black/40"/></Field>
      <Field label="ความยาว (cm)"><Input type="number" value={shipping.length??0} onChange={e=>set("length",Number(e.target.value))} className="border-white/15 bg-black/40"/></Field>
      <Field label="ความสูง (cm)"><Input type="number" value={shipping.height??0} onChange={e=>set("height",Number(e.target.value))} className="border-white/15 bg-black/40"/></Field>
    </div>
  </Section>;
}

function Section({title,description,children}:{title:string;description:string;children:React.ReactNode}){return <section className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-4 sm:p-5"><h3 className="font-black">{title}</h3><p className="mt-1 text-xs text-zinc-500">{description}</p><div className="mt-5">{children}</div></section>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <div><Label className="mb-2 block">{label}</Label>{children}</div>}
function Stat({icon:Icon,value,label}:{icon:typeof Boxes;value:string;label:string}){return <div className="rounded-2xl border border-white/10 bg-[#111] p-4"><Icon className="h-4 w-4 text-[#ffc400]"/><p className="mt-4 text-2xl font-black">{value}</p><p className="text-xs text-zinc-500">{label}</p></div>}
