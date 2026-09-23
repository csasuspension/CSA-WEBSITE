"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive, Boxes, CheckCircle2, ChevronLeft, ChevronRight, Edit3, ImagePlus,
  Layers3, Loader2, PackagePlus, Plus, RefreshCw, Search, Settings2,
  ShippingBox, SlidersHorizontal, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Product, ProductAttribute, ProductOptionGroup, ProductVariant } from "@/src/types/portal";

type TabId="general"|"attributes"|"details"|"variants"|"shipping";
const tabs:{id:TabId;label:string;icon:typeof Boxes}[]=[
  {id:"general",label:"ข้อมูลทั่วไป",icon:PackagePlus},
  {id:"attributes",label:"คุณลักษณะ",icon:Settings2},
  {id:"details",label:"รายละเอียด",icon:Layers3},
  {id:"variants",label:"ตัวเลือกสินค้า",icon:SlidersHorizontal},
  {id:"shipping",label:"การจัดส่ง",icon:ShippingBox},
];

const createProduct=():Product=>({
  id:"",name:"",vehicleMake:"",model:"",modelNumber:"",category:"",position:"",
  price:0,stock:0,tag:"NEW",active:true,brand:"CSA",shortDescription:"",
  description:"",imageUrls:[],attributes:[],optionGroups:[],variants:[],
  shipping:{weight:0,width:0,length:0,height:0},
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
    const variants=editing.variants??[];
    const payload:Product=variants.length?{
      ...editing,
      price:Math.min(...variants.map(v=>Number(v.price)||0)),
      stock:variants.reduce((sum,v)=>sum+(Number(v.stock)||0),0),
    }:editing;
    try{
      const response=await fetch("/csa-admin/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error);
      setEditing(null);setMessage("บันทึกสินค้าและตัวเลือกเรียบร้อย");await load();
    }catch(error){setMessage(error instanceof Error?error.message:"Could not save product")}
    finally{setSaving(false)}
  };
  const remove=async(item:Product)=>{
    if(!window.confirm(`ซ่อนสินค้า ${item.id} จากเว็บไซต์?`))return;
    const response=await fetch("/csa-admin/api/products",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({sku:item.id})});
    if(response.ok){setMessage("ซ่อนสินค้าแล้ว");await load()}else setMessage("ไม่สามารถซ่อนสินค้าได้");
  };

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-bold tracking-[.18em] text-[#ffc400]">PRODUCT MANAGEMENT</p><h2 className="mt-1 text-3xl font-black">สินค้า</h2><p className="mt-2 text-sm text-zinc-500">จัดการข้อมูล รายละเอียด คุณลักษณะ ตัวเลือก ราคา สต็อก และการจัดส่งได้เอง</p></div>
      <Button onClick={()=>setEditing(createProduct())} className="bg-[#ffc400] text-black"><Plus/>เพิ่มสินค้า</Button>
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
      <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-white/[.03] text-xs text-zinc-500"><tr><th className="p-4">SKU / PRODUCT</th><th>หมวดหมู่</th><th>FITMENT</th><th>ตัวเลือก</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th className="pr-4 text-right">ACTION</th></tr></thead>
        <tbody>{visible.map(item=><tr key={item.id} className="border-t border-white/10">
          <td className="p-4"><p className="font-mono text-xs text-[#ffc400]">{item.id}</p><p className="mt-1 font-bold">{item.name}</p><p className="text-xs text-zinc-600">{item.brand||"—"}</p></td>
          <td>{item.category||"—"}<p className="text-xs text-zinc-600">{item.position||"—"}</p></td>
          <td><p className="font-bold">{[item.vehicleMake,item.model].filter(Boolean).join(" ")||"—"}</p><p className="text-xs text-zinc-600">{item.modelNumber||"—"}</p></td>
          <td>{item.variants?.length??0} Variants<p className="text-xs text-zinc-600">{item.optionGroups?.map(x=>x.name).join(" · ")||"ไม่มีตัวเลือก"}</p></td>
          <td className="font-bold">฿{Number(item.price).toLocaleString("th-TH")}</td>
          <td><span className={Number(item.stock)<8?"font-bold text-amber-400":""}>{item.stock??0}</span></td>
          <td><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.active===false?"bg-zinc-800 text-zinc-500":"bg-emerald-500/15 text-emerald-400"}`}>{item.active===false?"HIDDEN":"ACTIVE"}</span></td>
          <td><div className="flex justify-end gap-2 pr-4"><Button onClick={()=>setEditing(copyProduct(item))} size="sm" variant="outline" className="border-white/15 bg-transparent text-white"><Edit3/>แก้ไข</Button><Button onClick={()=>void remove(item)} size="icon" variant="outline" className="border-red-500/20 bg-transparent text-red-400" aria-label={`Hide ${item.name}`}><Trash2/></Button></div></td>
        </tr>)}</tbody>
      </table>{!visible.length&&<div className="p-10 text-center text-sm text-zinc-500">ไม่พบสินค้าที่ค้นหา</div>}</div>}
    </section>
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
    <DialogContent className="max-h-[94vh] overflow-hidden rounded-2xl border-white/10 bg-[#121212] p-0 text-white sm:max-w-5xl">
      <DialogHeader className="border-b border-white/10 px-5 py-4"><DialogTitle className="flex items-center gap-2 text-2xl"><PackagePlus className="text-[#ffc400]"/>{value.id?"แก้ไขสินค้า":"เพิ่มสินค้าใหม่"}</DialogTitle></DialogHeader>
      <div className="flex overflow-x-auto border-b border-white/10 px-3">{tabs.map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>setTab(item.id)} className={`flex shrink-0 items-center gap-2 rounded-none border-b-2 px-4 py-3 text-sm font-bold ${tab===item.id?"border-[#ffc400] text-[#ffc400]":"border-transparent text-zinc-500"}`}><Icon className="h-4 w-4"/>{item.label}</button>})}</div>
      <div className="max-h-[68vh] overflow-y-auto p-5">
        {tab==="general"&&<GeneralTab value={value} update={update}/>}
        {tab==="attributes"&&<AttributesTab value={value} update={update}/>}
        {tab==="details"&&<DetailsTab value={value} update={update}/>}
        {tab==="variants"&&<VariantsTab value={value} update={update}/>}
        {tab==="shipping"&&<ShippingTab value={value} update={update}/>}
      </div>
      <div className="flex items-center justify-between border-t border-white/10 bg-[#0d0d0d] p-4">
        <Button onClick={previous} disabled={activeIndex===0} variant="outline" className="border-white/15 bg-transparent text-white"><ChevronLeft/>ย้อนกลับ</Button>
        <div className="flex gap-2"><Button onClick={()=>setValue(null)} variant="outline" className="border-white/15 bg-transparent text-white">ยกเลิก</Button>{activeIndex<tabs.length-1?<Button onClick={next} className="bg-[#ffc400] text-black">ถัดไป<ChevronRight/></Button>:<Button onClick={save} disabled={saving||!value.id.trim()||!value.name.trim()} className="bg-[#ffc400] text-black">{saving&&<Loader2 className="animate-spin"/>}บันทึกสินค้า</Button>}</div>
      </div>
    </DialogContent>
  </Dialog>;
}

function GeneralTab({value,update}:{value:Product;update:<K extends keyof Product>(key:K,next:Product[K])=>void}){
  const images=value.imageUrls??[];
  return <div className="space-y-6">
    <Section title="ข้อมูลทั่วไป" description="ข้อมูลหลักที่ลูกค้าจะเห็นบนเว็บไซต์">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SKU *"><Input value={value.id} onChange={e=>update("id",e.target.value.toUpperCase())} placeholder="CSA-H3-F01" className="border-white/15 bg-black/40 font-mono"/></Field>
        <Field label="ชื่อสินค้า *"><Input value={value.name} onChange={e=>update("name",e.target.value)} placeholder="ชื่อสินค้าที่แสดง" className="border-white/15 bg-black/40"/></Field>
        <Field label="แบรนด์"><Input value={value.brand??""} onChange={e=>update("brand",e.target.value)} placeholder="เพิ่มแบรนด์เอง" className="border-white/15 bg-black/40"/></Field>
        <Field label="หมวดหมู่"><Input value={value.category??""} onChange={e=>update("category",e.target.value)} placeholder="เช่น โช้คอัพ, สปริง, อุปกรณ์เสริม" className="border-white/15 bg-black/40"/></Field>
        <Field label="ตำแหน่งสินค้า"><Input value={value.position??""} onChange={e=>update("position",e.target.value)} placeholder="เช่น หน้า, หลัง, ทั้งชุด" className="border-white/15 bg-black/40"/></Field>
        <Field label="ป้ายสินค้า"><Input value={value.tag} onChange={e=>update("tag",e.target.value)} placeholder="NEW / BEST SELLER" className="border-white/15 bg-black/40"/></Field>
        <div className="sm:col-span-2"><Field label="คำอธิบายสั้น"><Textarea value={value.shortDescription??""} onChange={e=>update("shortDescription",e.target.value)} placeholder="สรุปจุดเด่นสินค้า" className="min-h-20 border-white/15 bg-black/40"/></Field></div>
      </div>
    </Section>
    <Section title="รูปภาพสินค้า" description="เพิ่มลิงก์รูปภาพได้หลายรูปและจัดการเอง">
      <div className="space-y-3">{images.map((url,index)=><div key={index} className="flex gap-2"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/5"><ImagePlus className="h-4 w-4 text-[#ffc400]"/></span><Input value={url} onChange={e=>update("imageUrls",images.map((x,i)=>i===index?e.target.value:x))} placeholder="https://..." className="border-white/15 bg-black/40"/><Button onClick={()=>update("imageUrls",images.filter((_,i)=>i!==index))} size="icon" variant="outline" className="border-red-500/20 text-red-400"><Trash2/></Button></div>)}</div>
      <Button onClick={()=>update("imageUrls",[...images,""])} variant="outline" className="mt-3 border-white/15 bg-transparent text-white"><Plus/>เพิ่มรูปภาพ</Button>
    </Section>
    <Section title="ข้อมูลรถที่รองรับ" description="กรอกได้เอง ไม่ล็อกยี่ห้อ รุ่น หรือเลขตัวถัง">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="ยี่ห้อรถ"><Input value={value.vehicleMake??""} onChange={e=>update("vehicleMake",e.target.value)} placeholder="TOYOTA" className="border-white/15 bg-black/40"/></Field>
        <Field label="รุ่นรถ"><Input value={value.model??""} onChange={e=>update("model",e.target.value)} placeholder="HIACE 300" className="border-white/15 bg-black/40"/></Field>
        <Field label="เลขรุ่น / Chassis"><Input value={value.modelNumber??""} onChange={e=>update("modelNumber",e.target.value)} placeholder="GDH300" className="border-white/15 bg-black/40"/></Field>
        <Field label="ปีเริ่ม"><Input type="number" value={value.yearFrom??""} onChange={e=>update("yearFrom",e.target.value?Number(e.target.value):undefined)} className="border-white/15 bg-black/40"/></Field>
        <Field label="ปีสิ้นสุด"><Input type="number" value={value.yearTo??""} onChange={e=>update("yearTo",e.target.value?Number(e.target.value):undefined)} className="border-white/15 bg-black/40"/></Field>
      </div>
    </Section>
    <div className="flex items-center justify-between rounded-xl border border-white/10 p-4"><div><p className="font-bold">แสดงสินค้าบนเว็บไซต์</p><p className="text-xs text-zinc-500">ปิดเพื่อซ่อนสินค้าโดยไม่ลบข้อมูล</p></div><Switch checked={value.active!==false} onCheckedChange={checked=>update("active",checked)}/></div>
  </div>;
}

function AttributesTab({value,update}:{value:Product;update:<K extends keyof Product>(key:K,next:Product[K])=>void}){
  const rows=value.attributes??[];
  const set=(next:ProductAttribute[])=>update("attributes",next);
  return <Section title="คุณลักษณะของสินค้า" description="เพิ่มหัวข้อและค่าได้เอง เช่น วัสดุ, เทคโนโลยี, ประเภทรถ">
    <div className="space-y-3">{rows.map((row,index)=><div key={index} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]"><Input value={row.name} onChange={e=>set(rows.map((x,i)=>i===index?{...x,name:e.target.value}:x))} placeholder="ชื่อคุณลักษณะ" className="border-white/15 bg-black/40"/><Input value={row.value} onChange={e=>set(rows.map((x,i)=>i===index?{...x,value:e.target.value}:x))} placeholder="ค่า" className="border-white/15 bg-black/40"/><Button onClick={()=>set(rows.filter((_,i)=>i!==index))} size="icon" variant="outline" className="border-red-500/20 text-red-400"><Trash2/></Button></div>)}</div>
    <Button onClick={()=>set([...rows,{name:"",value:""}])} variant="outline" className="mt-4 border-white/15 bg-transparent text-white"><Plus/>เพิ่มคุณลักษณะ</Button>
  </Section>;
}

function DetailsTab({value,update}:{value:Product;update:<K extends keyof Product>(key:K,next:Product[K])=>void}){
  return <Section title="รายละเอียดสินค้า" description="ใส่วิธีใช้ คุณสมบัติ การติดตั้ง การรับประกัน หรือข้อมูลเพิ่มเติม">
    <Textarea value={value.description??""} onChange={e=>update("description",e.target.value)} placeholder={"รายละเอียดสินค้า\n\n• จุดเด่น\n• รุ่นที่รองรับ\n• วิธีติดตั้ง\n• การรับประกัน"} className="min-h-[360px] border-white/15 bg-black/40 leading-7"/>
  </Section>;
}

function VariantsTab({value,update}:{value:Product;update:<K extends keyof Product>(key:K,next:Product[K])=>void}){
  const groups=value.optionGroups??[];
  const variants=value.variants??[];
  const setGroups=(next:ProductOptionGroup[])=>update("optionGroups",next);
  const setVariants=(next:ProductVariant[])=>update("variants",next);
  return <div className="space-y-6">
    <Section title="ชื่อตัวเลือกสินค้า" description="สร้างตัวเลือกได้เอง เช่น ตำแหน่ง, รุ่นรถ, สี หรือชุดสินค้า">
      <div className="space-y-3">{groups.map((group,index)=><div key={index} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]"><Input value={group.name} onChange={e=>setGroups(groups.map((x,i)=>i===index?{...x,name:e.target.value}:x))} placeholder="ชื่อตัวเลือก เช่น ตำแหน่ง" className="border-white/15 bg-black/40"/><Input value={group.values.join(", ")} onChange={e=>setGroups(groups.map((x,i)=>i===index?{...x,values:e.target.value.split(",").map(v=>v.trim()).filter(Boolean)}:x))} placeholder="ค่า เช่น หน้า, หลัง, หน้าและหลัง" className="border-white/15 bg-black/40"/><Button onClick={()=>setGroups(groups.filter((_,i)=>i!==index))} size="icon" variant="outline" className="border-red-500/20 text-red-400"><Trash2/></Button></div>)}</div>
      <Button onClick={()=>setGroups([...groups,{name:"",values:[]}])} variant="outline" className="mt-4 border-white/15 bg-transparent text-white"><Plus/>เพิ่มกลุ่มตัวเลือก</Button>
    </Section>
    <Section title="รายการตัวเลือกสินค้า" description="แต่ละตัวเลือกมี SKU ราคา สต็อก และน้ำหนักของตัวเอง">
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs text-zinc-500"><tr><th className="pb-2">ชื่อตัวเลือก</th><th>SKU</th><th>ราคา</th><th>คลัง</th><th>น้ำหนัก (kg)</th><th/></tr></thead><tbody>{variants.map((variant,index)=><tr key={index} className="border-t border-white/10"><td className="py-2 pr-2"><Input value={variant.name} onChange={e=>setVariants(variants.map((x,i)=>i===index?{...x,name:e.target.value}:x))} placeholder="หน้า / HIACE 300" className="border-white/15 bg-black/40"/></td><td className="pr-2"><Input value={variant.sku} onChange={e=>setVariants(variants.map((x,i)=>i===index?{...x,sku:e.target.value.toUpperCase()}:x))} className="border-white/15 bg-black/40 font-mono"/></td><td className="pr-2"><Input type="number" value={variant.price} onChange={e=>setVariants(variants.map((x,i)=>i===index?{...x,price:Number(e.target.value)}:x))} className="border-white/15 bg-black/40"/></td><td className="pr-2"><Input type="number" value={variant.stock} onChange={e=>setVariants(variants.map((x,i)=>i===index?{...x,stock:Number(e.target.value)}:x))} className="border-white/15 bg-black/40"/></td><td className="pr-2"><Input type="number" step="0.1" value={variant.weight??0} onChange={e=>setVariants(variants.map((x,i)=>i===index?{...x,weight:Number(e.target.value)}:x))} className="border-white/15 bg-black/40"/></td><td><Button onClick={()=>setVariants(variants.filter((_,i)=>i!==index))} size="icon" variant="outline" className="border-red-500/20 text-red-400"><Trash2/></Button></td></tr>)}</tbody></table></div>
      <Button onClick={()=>setVariants([...variants,{name:"",sku:"",price:0,stock:0,weight:0}])} variant="outline" className="mt-4 border-white/15 bg-transparent text-white"><Plus/>เพิ่มตัวเลือกสินค้า</Button>
      {!variants.length&&<div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="ราคาขายหลัก"><Input type="number" value={value.price} onChange={e=>update("price",Number(e.target.value))} className="border-white/15 bg-black/40"/></Field><Field label="สต็อกหลัก"><Input type="number" value={value.stock??0} onChange={e=>update("stock",Number(e.target.value))} className="border-white/15 bg-black/40"/></Field></div>}
    </Section>
  </div>;
}

function ShippingTab({value,update}:{value:Product;update:<K extends keyof Product>(key:K,next:Product[K])=>void}){
  const shipping=value.shipping??{};
  const set=(key:keyof typeof shipping,next:number)=>update("shipping",{...shipping,[key]:next});
  return <Section title="การจัดส่ง" description="กำหนดน้ำหนักและขนาดพัสดุของสินค้าหลัก">
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
