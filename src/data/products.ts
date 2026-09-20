import type { Product } from "@/src/types/portal";

// แก้รายการสินค้า รุ่นรถ ราคา และป้ายสินค้าได้จากไฟล์นี้
export const products: Product[] = [
  { id: "CSA-H3-F01", name: "CSA Performance Front Pair", model: "HIACE 300", price: 12900, tag: "BEST SELLER" },
  { id: "CSA-H3-R02", name: "CSA Comfort Rear Pair", model: "HIACE 300", price: 9900, tag: "COMFORT" },
  { id: "CSA-MJ-F01", name: "CSA Touring Front Pair", model: "MAJESTY", price: 14500, tag: "TOURING" },
  { id: "CSA-NC-S01", name: "CSA Van Control Set", model: "NEW COMMUTER", price: 21900, tag: "FULL SET" },
  { id: "CSA-H3-A01", name: "Remote Reservoir Kit", model: "HIACE 300", price: 6500, tag: "UPGRADE" },
  { id: "CSA-MJ-A02", name: "Adjuster Service Kit", model: "MAJESTY", price: 2900, tag: "SERVICE" }
];
