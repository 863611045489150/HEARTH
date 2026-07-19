import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessLinksTable = pgTable("business_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  url: text("url").notNull(),
  label: text("label").notNull().default(""),
  aiSummary: text("ai_summary").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBusinessLinkSchema = createInsertSchema(businessLinksTable).omit({ id: true, createdAt: true });
export type InsertBusinessLink = z.infer<typeof insertBusinessLinkSchema>;
export type BusinessLink = typeof businessLinksTable.$inferSelect;
