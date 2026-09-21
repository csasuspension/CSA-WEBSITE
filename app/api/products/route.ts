import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { products as defaults } from "@/src/data/products";
import type { Product } from "@/src/types/portal";

export const dynamic = "force-dynamic";

type ProductRow = {
  sku:string; name:string; vehicle_make:string; vehicle_model:string; model_number:string;
  category:string; position:string; year_from:number|null; year_to:number|null;
  price:number; stock:number; tag:string; active:number; updated_at:string;
};

function db(){ if(!env.DB) throw new Error("Database is unavailable"); return env.DB; }
function fromRow(row:ProductRow):Product { return {id:row.sku,name:row.name,vehicleMake:row.vehicle_make,model:row.vehicle_model,modelNumber:row.model_number,category:row.category,position:row.position,yearFrom:row.year_from??undefined,yearTo:row.year_to??undefined,price:row.price,stock:row.stock,tag:row.tag,active:Boolean(row.active)}; }

export async function GET(request:NextRequest){
  try{
    const includeInactive=request.nextUrl.searchParams.get("includeInactive")==="1";
    const result=await db().prepare("SELECT sku,name,vehicle_make,vehicle_model,model_number,category,position,year_from,year_to,price,stock,tag,active,updated_at FROM catalog_products ORDER BY updated_at DESC").all<ProductRow>();
    const overrides=new Map(result.results.map(row=>[row.sku,fromRow(row)]));
    const merged=[...defaults.map(item=>overrides.get(item.id)??item),...result.results.filter(row=>!defaults.some(item=>item.id===row.sku)).map(fromRow)];
    return NextResponse.json({products:merged.filter(item=>includeInactive||item.active!==false)});
  }catch(error){ console.error("products:list",error); return NextResponse.json({error:"Product data is temporarily unavailable"},{status:503}); }
}

export async function POST(request:NextRequest){
  try{
    const body=await request.json() as Product;
    const sku=String(body.id??"").trim().toUpperCase(); const name=String(body.name??"").trim(); const model=String(body.model??"").trim();
    if(!sku||!name||!model||!Number.isFinite(Number(body.price))||Number(body.price)<0) return NextResponse.json({error:"SKU, product name, vehicle model and a valid price are required"},{status:400});
    await db().prepare(`INSERT INTO catalog_products (sku,name,vehicle_make,vehicle_model,model_number,category,position,year_from,year_to,price,stock,tag,active,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(sku) DO UPDATE SET name=excluded.name,vehicle_make=excluded.vehicle_make,vehicle_model=excluded.vehicle_model,model_number=excluded.model_number,category=excluded.category,position=excluded.position,year_from=excluded.year_from,year_to=excluded.year_to,price=excluded.price,stock=excluded.stock,tag=excluded.tag,active=excluded.active,updated_at=CURRENT_TIMESTAMP`)
      .bind(sku,name,String(body.vehicleMake??"TOYOTA"),model,String(body.modelNumber??""),String(body.category??"Shock Absorber"),String(body.position??"Full Set"),body.yearFrom?Number(body.yearFrom):null,body.yearTo?Number(body.yearTo):null,Math.round(Number(body.price)),Math.max(0,Math.round(Number(body.stock??0))),String(body.tag??"CSA"),body.active===false?0:1).run();
    return NextResponse.json({ok:true,sku},{status:201});
  }catch(error){ console.error("products:save",error); return NextResponse.json({error:"Could not save product"},{status:503}); }
}

export async function DELETE(request:NextRequest){
  try{
    const sku=String((await request.json()).sku??"").trim().toUpperCase();
    if(!sku) return NextResponse.json({error:"SKU is required"},{status:400});
    const fallback=defaults.find(item=>item.id===sku);
    if(fallback){
      await db().prepare(`INSERT INTO catalog_products (sku,name,vehicle_make,vehicle_model,model_number,category,position,year_from,year_to,price,stock,tag,active,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,CURRENT_TIMESTAMP)
        ON CONFLICT(sku) DO UPDATE SET active=0,updated_at=CURRENT_TIMESTAMP`).bind(fallback.id,fallback.name,fallback.vehicleMake??"TOYOTA",fallback.model,fallback.modelNumber??"",fallback.category??"Shock Absorber",fallback.position??"Full Set",fallback.yearFrom??null,fallback.yearTo??null,fallback.price,fallback.stock??0,fallback.tag).run();
    }else await db().prepare("DELETE FROM catalog_products WHERE sku = ?").bind(sku).run();
    return NextResponse.json({ok:true});
  }catch(error){ console.error("products:delete",error); return NextResponse.json({error:"Could not remove product"},{status:503}); }
}
