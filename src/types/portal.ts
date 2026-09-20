export type Lang = "th" | "en";

export type View =
  | "shop"
  | "garage"
  | "warranty"
  | "claims"
  | "promotions"
  | "admin";

export type Product = {
  id: string;
  name: string;
  model: string;
  price: number;
  tag: string;
};

export type PortalEventType = "order" | "warranty" | "claim";
