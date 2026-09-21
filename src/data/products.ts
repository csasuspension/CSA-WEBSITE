import type { Product } from "@/src/types/portal";

// แก้รายการสินค้า รุ่นรถ ราคา และป้ายสินค้าได้จากไฟล์นี้
export const products: Product[] = [
  { id: "CSA-H3-F01", name: "CSA Performance Front Pair", vehicleMake:"TOYOTA", model: "HIACE 300", modelNumber:"GDH300", category:"Shock Absorber", position:"Front", yearFrom:2019, yearTo:2026, price: 0, stock:0, tag: "BEST SELLER", active:true },
  { id: "CSA-H3-R02", name: "CSA Comfort Rear Pair", vehicleMake:"TOYOTA", model: "HIACE 300", modelNumber:"GDH300", category:"Shock Absorber", position:"Rear", yearFrom:2019, yearTo:2026, price: 0, stock:0, tag: "COMFORT", active:true },
  { id: "CSA-MJ-F01", name: "CSA Touring Front Pair", vehicleMake:"TOYOTA", model: "MAJESTY", modelNumber:"GDH303", category:"Shock Absorber", position:"Front", yearFrom:2019, yearTo:2026, price: 0, stock:0, tag: "TOURING", active:true },
  { id: "CSA-NC-S01", name: "CSA Van Control Set", vehicleMake:"TOYOTA", model: "NEW COMMUTER", modelNumber:"GDH322", category:"Suspension Set", position:"Full Set", yearFrom:2019, yearTo:2026, price: 0, stock:0, tag: "FULL SET", active:true },
  { id: "CSA-H3-A01", name: "Remote Reservoir Kit", vehicleMake:"TOYOTA", model: "HIACE 300", modelNumber:"GDH300", category:"Accessory", position:"Full Set", yearFrom:2019, yearTo:2026, price: 0, stock:0, tag: "UPGRADE", active:true },
  { id: "CSA-MJ-A02", name: "Adjuster Service Kit", vehicleMake:"TOYOTA", model: "MAJESTY", modelNumber:"GDH303", category:"Service Part", position:"Full Set", yearFrom:2019, yearTo:2026, price: 0, stock:0, tag: "SERVICE", active:true }
];
