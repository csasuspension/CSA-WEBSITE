import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const portalEvents = sqliteTable("portal_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventType: text("event_type").notNull(),
  reference: text("reference").notNull(),
  status: text("status").notNull().default("submitted"),
  payloadJson: text("payload_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const catalogProducts = sqliteTable("catalog_products", {
  sku: text("sku").primaryKey(),
  name: text("name").notNull(),
  vehicleMake: text("vehicle_make").notNull().default(""),
  vehicleModel: text("vehicle_model").notNull().default(""),
  modelNumber: text("model_number").notNull().default(""),
  category: text("category").notNull().default(""),
  position: text("position").notNull().default(""),
  yearFrom: integer("year_from"),
  yearTo: integer("year_to"),
  price: integer("price").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  tag: text("tag").notNull().default("CSA"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  productDataJson: text("product_data_json").notNull().default("{}"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
