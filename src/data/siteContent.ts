export type LocalText={th:string;en:string};
export type ContentKind="article"|"news"|"clip";
export type ContentItem={
  id:string;kind:ContentKind;title:LocalText;excerpt:LocalText;body:LocalText;
  image:string;videoUrl:string;publishedAt:string;active:boolean;featured:boolean;
};
export type SiteContent={
  hero:{image:string;badge:LocalText;title:LocalText;highlight:LocalText;description:LocalText;button:LocalText};
  promotion:{active:boolean;image:string;title:LocalText;description:LocalText;button:LocalText;url:string;startsAt:string;endsAt:string};
  contact:{phone:string;email:string;facebook:string;instagram:string;line:string};
  dealerButton:LocalText;
  contentItems:ContentItem[];
};

export const defaultSiteContent:SiteContent={
  hero:{image:"/csa-ci.jpg",badge:{th:"CSA VAN SERIES",en:"CSA VAN SERIES"},title:{th:"นุ่ม แน่น หนึบ",en:"Smooth. Stable."},highlight:{th:"จบในเซ็ตเดียว",en:"Built for your van."},description:{th:"ช่วงล่างสมรรถนะสูงสำหรับรถตู้ พร้อมค้นหารุ่นที่ตรงกับรถของคุณและรับประกันออนไลน์",en:"High-performance van suspension with precise fitment and online warranty."},button:{th:"ค้นหาสินค้า",en:"Find products"}},
  promotion:{active:true,image:"",title:{th:"สิทธิพิเศษสำหรับสมาชิก CSA",en:"CSA member privilege"},description:{th:"ติดตามข่าวสารและโปรโมชั่นล่าสุดจาก CSA",en:"Discover the latest CSA news and promotions."},button:{th:"ดูรายละเอียด",en:"View details"},url:"",startsAt:"",endsAt:""},
  contact:{phone:"02-000-0000",email:"service@csa.co.th",facebook:"https://facebook.com",instagram:"https://instagram.com",line:"https://line.me"},
  dealerButton:{th:"ค้นหาตัวแทน",en:"Find a dealer"},
  contentItems:[],
};

export function normalizeSiteContent(value?:Partial<SiteContent>|null):SiteContent{
  if(!value)return defaultSiteContent;
  const hero={...defaultSiteContent.hero,...value.hero};
  const dealerButton={...defaultSiteContent.dealerButton,...value.dealerButton};
  if(hero.button.th==="ค้นหาสินค้าที่ตรงรุ่น")hero.button={...hero.button,th:"ค้นหาสินค้า"};
  if(hero.button.en==="Find compatible parts")hero.button={...hero.button,en:"Find products"};
  if(dealerButton.th==="ค้นหาตัวแทนใกล้ฉัน")dealerButton.th="ค้นหาตัวแทน";
  if(dealerButton.en==="Find a dealer near me")dealerButton.en="Find a dealer";
  return {
    ...defaultSiteContent,
    ...value,
    hero,
    promotion:{...defaultSiteContent.promotion,...value.promotion},
    contact:{...defaultSiteContent.contact,...value.contact},
    dealerButton,
    contentItems:Array.isArray(value.contentItems)?value.contentItems:[],
  };
}
