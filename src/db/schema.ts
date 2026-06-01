import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Data model for Barnett Art.
 *
 * Conventions (deliberate, defensible choices):
 *  - Money is ALWAYS integer cents (e.g. £45.00 -> 4500). Never floats.
 *  - order_items snapshot the title and unit price at purchase time, so an
 *    order is an immutable record decoupled from later product/price edits.
 *  - Inventory integrity is enforced in the DB (CHECK constraints), not just
 *    in app code — stock can never go negative.
 */

export const productType = pgEnum("product_type", ["original", "print"]);
export const productStatus = pgEnum("product_status", [
  "available",
  "sold",
  "archived",
]);
export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "fulfilled",
  "cancelled",
]);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    type: productType("type").notNull(),
    // Base price for originals, or the "from" price for prints.
    basePriceCents: integer("base_price_cents").notNull(),
    currency: text("currency").notNull().default("GBP"),
    status: productStatus("status").notNull().default("available"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    index("products_status_idx").on(t.status),
    check("products_base_price_nonneg", sql`${t.basePriceCents} >= 0`),
  ],
);

// Prints only: size / framing variants, each with its own price and stock.
export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g. "A2 / Framed"
    priceCents: integer("price_cents").notNull(),
    sku: text("sku").notNull(),
    stockQty: integer("stock_qty").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("product_variants_sku_idx").on(t.sku),
    index("product_variants_product_idx").on(t.productId),
    check("product_variants_price_nonneg", sql`${t.priceCents} >= 0`),
    // Stock can never go negative — enforced in the database.
    check("product_variants_stock_nonneg", sql`${t.stockQty} >= 0`),
  ],
);

export const images = pgTable(
  "images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    s3Key: text("s3_key").notNull(),
    altText: text("alt_text").notNull().default(""),
    width: integer("width"),
    height: integer("height"),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("images_product_idx").on(t.productId)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: orderStatus("status").notNull().default("pending"),
    customerEmail: text("customer_email").notNull(),
    shippingAddress: jsonb("shipping_address"),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").notNull().default("GBP"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // The payment intent is the idempotency anchor for the webhook handler.
    uniqueIndex("orders_payment_intent_idx").on(t.stripePaymentIntentId),
    index("orders_status_idx").on(t.status),
    index("orders_email_idx").on(t.customerEmail),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id),
    variantId: uuid("variant_id").references(() => productVariants.id),
    // Snapshots — what the customer actually bought, frozen at purchase time.
    titleSnapshot: text("title_snapshot").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull().default(1),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    check("order_items_qty_positive", sql`${t.quantity} > 0`),
  ],
);

// Inferred types for use across the app.
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Image = typeof images.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
