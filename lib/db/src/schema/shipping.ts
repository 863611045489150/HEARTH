import { pgTable, text, uuid, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shippingCalculationsTable = pgTable("shipping_calculations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  weightKg: real("weight_kg").notNull(),
  description: text("description"),
  estimatedCost: real("estimated_cost").notNull(),
  currency: text("currency").notNull().default("INR"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertShippingCalculationSchema = createInsertSchema(shippingCalculationsTable).omit({ id: true, createdAt: true });
export type InsertShippingCalculation = z.infer<typeof insertShippingCalculationSchema>;
export type ShippingCalculation = typeof shippingCalculationsTable.$inferSelect;
