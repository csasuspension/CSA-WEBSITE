# CSA Website — จุดที่ใช้แก้เว็บ

## แก้บ่อย

| ต้องการแก้ | ไฟล์ |
|---|---|
| ข้อความภาษาไทย | `src/locales/th.json` |
| ข้อความภาษาอังกฤษ | `src/locales/en.json` |
| รายการสินค้า รุ่นรถ ราคา | `src/data/products.ts` |
| Footer และข้อมูลติดต่อ | `src/components/SiteFooter.tsx` |
| ช่องค้นหารุ่นรถ | `src/components/VehicleFinderSelect.tsx` |
| สี ฟอนต์ ปุ่ม รูปแบบหลัก | `src/styles/brand.css` |
| หน้าและ Flow ทั้งหมด | `app/page.tsx` |
| รูปภาพและโลโก้ | `public/` |
| API ออเดอร์ รับประกัน เคลม | `src/api/events.ts` และ `app/api/` |
| Database | `db/` และ `drizzle/` |
| ตั้งค่าการ Deploy | `.openai/hosting.json` |

## โครงสร้างหลัก

```text
csa-website/
├── app/                 # หน้าเว็บและ API routes
├── src/
│   ├── api/             # ฟังก์ชันเรียก Backend
│   ├── components/      # ส่วนประกอบที่ใช้ซ้ำ
│   ├── data/            # สินค้า ราคา รุ่นรถ
│   ├── locales/         # ภาษาไทยและอังกฤษ
│   ├── styles/          # สี ฟอนต์ และรูปแบบแบรนด์
│   └── types/           # รูปแบบข้อมูล TypeScript
├── public/              # รูป โลโก้ และไอคอน
├── db/                  # การทำงานกับฐานข้อมูล
└── drizzle/             # โครงสร้างฐานข้อมูลและ Migration
```

ไฟล์ `app/page.tsx` เป็นตัวประกอบทุกส่วนเข้าด้วยกัน ส่วนข้อมูลที่แก้บ่อยถูกแยกออกมาแล้ว จึงไม่ต้องค้นหาในไฟล์ใหญ่ทุกครั้ง
