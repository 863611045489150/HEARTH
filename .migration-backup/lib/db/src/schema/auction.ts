import { pgTable, text, uuid, timestamp, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const auctionEntriesTable = pgTable("auction_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  item: text("item").notNull(),
  winningBid: real("winning_bid").notNull(),
  buyer: text("buyer").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAuctionEntrySchema = createInsertSchema(auctionEntriesTable).omit({ id: true, createdAt: true });
export type InsertAuctionEntry = z.infer<typeof insertAuctionEntrySchema>;
export type AuctionEntry = typeof auctionEntriesTable.$inferSelect;
