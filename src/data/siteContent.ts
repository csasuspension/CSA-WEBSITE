export type LocalText={th:string;en:string};
export type PublishStatus="draft"|"published";
export type EditorialItem={id:string;type:"advice"|"news"|"clip";title:LocalText;excerpt:LocalText;body:LocalText;image:string;url:string;category:string;publishedAt:string;status:PublishStatus;sortOrder:number};
export type FaqItem={id:string;question:LocalText;answer:LocalText;status:PublishStatus;sortOrder:number};
export type DealerItem={id:string;name:LocalText;place:LocalText;phone:string;mapUrl:string;latitude:number|null;longitude:number|null;status:PublishStatus;sortOrder:number};
export type CareerItem={id:string;title:LocalText;location:LocalText;description:LocalText;email:string;status:PublishStatus;sortOrder:number};
export type SiteContent={
  hero:{image:string;badge:LocalText;title:LocalText;highlight:LocalText;description:LocalText;button:LocalText};
  promotion:{active:boolean;image:string;title:LocalText;description:LocalText;button:LocalText;url:string;startsAt:string;endsAt:string};
  contact:{phone:string;email:string;facebook:string;instagram:string;tiktok:string;line:string;address:LocalText};
  dealerButton:LocalText;
  about:{headline:LocalText;description:LocalText};
  editorial:EditorialItem[];
  faqs:FaqItem[];
  dealers:DealerItem[];
  careers:CareerItem[];
};

export const defaultSiteContent:SiteContent={
  hero:{image:"/csa-ci.jpg",badge:{th:"CSA SUSPENSION",en:"CSA SUSPENSION"},title:{th:"นุ่ม แน่น หนึบ",en:"Smooth. Stable."},highlight:{th:"จบในเซ็ตเดียว",en:"Built for your vehicle."},description:{th:"ช่วงล่างสมรรถนะสูง พร้อมค้นหารุ่นที่ตรงกับรถของคุณและรับประกันออนไลน์",en:"High-performance suspension with precise vehicle fitment and online warranty."},button:{th:"ค้นหาสินค้าที่ตรงรุ่น",en:"Find compatible parts"}},
  promotion:{active:true,image:"",title:{th:"สิทธิพิเศษสำหรับสมาชิก CSA",en:"CSA member privilege"},description:{th:"ติดตามข่าวสารและโปรโมชั่นล่าสุดจาก CSA",en:"Discover the latest CSA news and promotions."},button:{th:"ดูรายละเอียด",en:"View details"},url:"",startsAt:"",endsAt:""},
  contact:{phone:"",email:"",facebook:"",instagram:"",tiktok:"",line:"",address:{th:"",en:""}},
  dealerButton:{th:"ค้นหาตัวแทนใกล้ฉัน",en:"Find a dealer near me"},
  about:{headline:{th:"ช่วงล่างที่ออกแบบเพื่อรถตู้ และการใช้งานจริงของคนไทย",en:"Suspension engineered for vans and real Thai road conditions."},description:{th:"CSA มุ่งพัฒนาผลิตภัณฑ์ช่วงล่างที่ให้ทั้งความนุ่ม ความมั่นคง และความมั่นใจ พร้อมระบบ Serial Number การรับประกัน และบริการหลังการขายที่ตรวจสอบได้",en:"CSA develops van suspension for comfort, stability and confidence, backed by traceable serial numbers, warranty and after-sales support."}},
  editorial:[],
  faqs:[],
  dealers:[],
  careers:[]
};

export function normalizeSiteContent(input:Partial<SiteContent>|null|undefined):SiteContent{
  const value=input||{};
  return {...defaultSiteContent,...value,
    hero:{...defaultSiteContent.hero,...value.hero},
    promotion:{...defaultSiteContent.promotion,...value.promotion},
    contact:{...defaultSiteContent.contact,...value.contact,address:{...defaultSiteContent.contact.address,...value.contact?.address}},
    dealerButton:{...defaultSiteContent.dealerButton,...value.dealerButton},
    about:{headline:{...defaultSiteContent.about.headline,...value.about?.headline},description:{...defaultSiteContent.about.description,...value.about?.description}},
    editorial:Array.isArray(value.editorial)?value.editorial:[],
    faqs:Array.isArray(value.faqs)?value.faqs:[],
    dealers:Array.isArray(value.dealers)?value.dealers.map((x:any)=>({...x,mapUrl:String(x.mapUrl??""),latitude:Number.isFinite(Number(x.latitude))?Number(x.latitude):null,longitude:Number.isFinite(Number(x.longitude))?Number(x.longitude):null})):[],
    careers:Array.isArray(value.careers)?value.careers:[]
  };
}