export type Lang = "th" | "en";

export type View =
  | "shop" | "member" | "my-products" | "garage" | "warranty" | "claims"
  | "promotions" | "branches" | "advice" | "about" | "news" | "clips"
  | "faq" | "careers" | "contact" | "profile" | "admin";

export type ProductAttribute = { name: string; value: string };
export type ProductOptionGroup = { name: string; values: string[] };
export type ProductVariant = { name: string; sku: string; price: number; stock: number; weight?: number };
export type ProductShipping = { weight?: number; width?: number; length?: number; height?: number };

export type Product = {
  id: string; name: string; model: string; modelNumber?: string; vehicleMake?: string;
  category?: string; position?: string; yearFrom?: number; yearTo?: number;
  price: number; stock?: number; tag: string; active?: boolean;
  brand?: string; shortDescription?: string; description?: string; imageUrls?: string[];
  attributes?: ProductAttribute[]; optionGroups?: ProductOptionGroup[];
  variants?: ProductVariant[]; shipping?: ProductShipping;
};

export type PortalEventType = "order" | "warranty" | "claim";
