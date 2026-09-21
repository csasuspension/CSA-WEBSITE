export type Lang = "th" | "en";

export type View =
  | "shop"
  | "member"
  | "my-products"
  | "garage"
  | "warranty"
  | "claims"
  | "promotions"
  | "branches"
  | "advice"
  | "about"
  | "news"
  | "clips"
  | "faq"
  | "careers"
  | "contact"
  | "profile"
  | "admin";

export type Product = {
  id: string;
  name: string;
  model: string;
  modelNumber?: string;
  vehicleMake?: string;
  category?: string;
  position?: string;
  yearFrom?: number;
  yearTo?: number;
  price: number;
  stock?: number;
  tag: string;
  active?: boolean;
};

export type PortalEventType = "order" | "warranty" | "claim";
