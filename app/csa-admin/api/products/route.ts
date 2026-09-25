import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { products as defaults } from "@/src/data/products";
import type { Product } from "@/src/types/portal";
import { requirePermission } from "@/app/admin-auth";
import { writeAuditLog } from "@/app/admin-audit";

export const dynamic = "force-dynamic";

type ProductRow = {
  sku:string; name:string; vehicle_make:string; vehicle_model:string; model_number:string;
  category:string; position:string; year_from:number|null; year_to:number|null;
  price:number; stock:number; tag:string; active:number; product_data_json:string|null; updated_at:string;
};

let schemaReady:Promise<void>|undefined;
function db(){if(!env.DB)throw new Error("Database is unavailable");return env.DB}
function ensureExtendedSchema(){
  if(!schemaReady)schemaReady=(async()=>{
    await db().prepare(`CREATE TABLE IF NOT EXISTS catalog_products (
      sku TEXT PRIMARY KEY, name TEXT NOT NULL, vehicle_make TEXT NOT NULL DEFAULT '',
      vehicle_model TEXT NOT NULL DEFAULT '', model_number TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '', position TEXT NOT NULL DEFAULT '',
      year_from INTEGER, year_to INTEGER, price INTEGER NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0, tag TEXT NOT NULL DEFAULT 'CSA',
      active INTEGER NOT NULL DEFAULT 1, product_data_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).run();
    try{await db().prepare("ALTER TABLE catalog_products ADD COLUMN product_data_json TEXT NOT NULL DEFAULT '{}'").run()}
    catch(error){if(!String(error).toLowerCase().includes("duplicate column"))throw error}
  })();
  return schemaReady;
}
function extended(product:Product){
  return {
    nameEn:String(product.nameEn??""),brand:String(product.brand??""),
    shortDescription:String(product.shortDescription??""),shortDescriptionEn:String(product.shortDescriptionEn??""),
    description:String(product.description??""),descriptionEn:String(product.descriptionEn??""),
    imageUrls:Array.isArray(product.imageUrls)?product.imageUrls.map(String).filter(Boolean):[],
    attributes:Array.isArray(product.attributes)?product.attributes:[],
    optionGroups:Array.isArray(product.optionGroups)?product.optionGroups:[],
    variants:Array.isArray(product.variants)?product.variants:[],
    shipping:product.shipping??{},warranty:product.warranty??{},
  };
}
function fromRow(row:ProductRow):Product{
  let data:Partial<Product>={};
  try{data=JSON.parse(row.product_data_json||"{}") as Partial<Product>}catch{}
  return {...data,id:row.sku,name:row.name,vehicleMake:row.vehicle_make,model:row.vehicle_model,
    modelNumber:row.model_number,category:row.category,position:row.position,
    yearFrom:row.year_from??undefined,yearTo:row.year_to??undefined,price:row.price,
    stock:row.stock,tag:row.tag,active:Boolean(row.active)};
}

export async function GET(request:NextRequest){
  try{
    const includeInactive=request.nextUrl.searchParams.get("includeInactive")==="1";
    if(includeInactive&&!(await requirePermission("inventory")).authorized)return NextResponse.json({error:"Permission denied"},{status:403});
    await ensureExtendedSchema();
    const result=await db().prepare("SELECT sku,name,vehicle_make,vehicle_model,model_number,category,position,year_from,year_to,price,stock,tag,active,product_data_json,updated_at FROM catalog_products ORDER BY updated_at DESC").all<ProductRow>();
    const overrides=new Map(result.results.map(row=>[row.sku,fromRow(row)]));
    const deleted=new Set(result.results.filter(row=>row.active===-1).map(row=>row.sku));
    const merged=[...defaults.filter(item=>!deleted.has(item.id)).map(item=>overrides.get(item.id)??item),...result.results.filter(row=>row.active!==-1&&!defaults.some(item=>item.id===row.sku)).map(fromRow)];
    return NextResponse.json({products:merged.filter(item=>includeInactive||item.active!==false)});
  }catch(error){console.error("products:list",error);return NextResponse.json({error:"Product data is temporarily unavailable"},{status:503})}
}

export async function POST(request:NextRequest){
  try{
    const access=await requirePermission("inventory");
    if(!access.authorized)return NextResponse.json({error:"Permission denied"},{status:403});
    await ensureExtendedSchema();
    const body=await request.json() as Product;
    const sku=String(body.id??"").trim().toUpperCase();
    const name=String(body.name??"").trim();
    const price=Number(body.price);
    if(!sku||!name||!Number.isFinite(price)||price<0)return NextResponse.json({error:"SKU, product name and a valid price are required"},{status:400});
    const stock=Math.max(0,Math.round(Number(body.stock??0)||0));
    await db().prepare(`INSERT INTO catalog_products (sku,name,vehicle_make,vehicle_model,model_number,category,position,year_from,year_to,price,stock,tag,active,product_data_json,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(sku) DO UPDATE SET name=excluded.name,vehicle_make=excluded.vehicle_make,vehicle_model=excluded.vehicle_model,model_number=excluded.model_number,category=excluded.category,position=excluded.position,year_from=excluded.year_from,year_to=excluded.year_to,price=excluded.price,stock=excluded.stock,tag=excluded.tag,active=excluded.active,product_data_json=excluded.product_data_json,updated_at=CURRENT_TIMESTAMP`)
      .bind(sku,name,String(body.vehicleMake??""),String(body.model??""),String(body.modelNumber??""),
        String(body.category??""),String(body.position??""),body.yearFrom?Number(body.yearFrom):null,
        body.yearTo?Number(body.yearTo):null,Math.round(price),stock,String(body.tag??"CSA"),
        body.active===false?0:1,JSON.stringify(extended(body))).run();
    await writeAuditLog({email:access.user.email,action:"product.save",entity:"product",entityId:sku,detail:{active:body.active!==false,stock}});
    return NextResponse.json({ok:true,sku},{status:201});
  }catch(error){console.error("products:save",error);return NextResponse.json({error:"Could not save product"},{status:503})}
}

export async function DELETE(request:NextRequest){
  try{
    const access=await requirePermission("inventory");
    if(!access.authorized)return NextResponse.json({error:"Permission denied"},{status:403});
    await ensureExtendedSchema();
    const payload=await request.json();
    const sku=String(payload.sku??"").trim().toUpperCase();
    const purge=payload.mode==="purge";
    if(!sku)return NextResponse.json({error:"SKU is required"},{status:400});
    const fallback=defaults.find(item=>item.id===sku);
    if(purge){
      if(fallback)await db().prepare(`INSERT INTO catalog_products (sku,name,vehicle_make,vehicle_model,model_number,category,position,year_from,year_to,price,stock,tag,active,product_data_json,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?, -1,'{}',CURRENT_TIMESTAMP)
        ON CONFLICT(sku) DO UPDATE SET active=-1,updated_at=CURRENT_TIMESTAMP`)
        .bind(fallback.id,fallback.name,fallback.vehicleMake??"",fallback.model??"",fallback.modelNumber??"",fallback.category??"",fallback.position??"",fallback.yearFrom??null,fallback.yearTo??null,fallback.price,fallback.stock??0,fallback.tag).run();
      else await db().prepare("DELETE FROM catalog_products WHERE sku = ?").bind(sku).run();
    }else if(fallback){
      await db().prepare(`INSERT INTO catalog_products (sku,name,vehicle_make,vehicle_model,model_number,category,position,year_from,year_to,price,stock,tag,active,product_data_json,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,'{}',CURRENT_TIMESTAMP)
        ON CONFLICT(sku) DO UPDATE SET active=0,updated_at=CURRENT_TIMESTAMP`)
        .bind(fallback.id,fallback.name,fallback.vehicleMake??"",fallback.model??"",fallback.modelNumber??"",
          fallback.category??"",fallback.position??"",fallback.yearFrom??null,fallback.yearTo??null,
          fallback.price,fallback.stock??0,fallback.tag).run();
    }else await db().prepare("UPDATE catalog_products SET active=0,updated_at=CURRENT_TIMESTAMP WHERE sku = ?").bind(sku).run();
    await writeAuditLog({email:access.user.email,action:purge?"product.delete":"product.delist",entity:"product",entityId:sku});
    return NextResponse.json({ok:true});
  }catch(error){console.error("products:delete",error);return NextResponse.json({error:"Could not remove product"},{status:503})}
}
