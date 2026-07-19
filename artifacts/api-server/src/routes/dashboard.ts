import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, notesTable, itemsTable, auctionEntriesTable } from "@workspace/db";
import { GetDashboardResponse } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;

  const [
    notesCount,
    itemsCount,
    itemsByType,
    recentNotes,
    recentItems,
    auctionTotal,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(notesTable).where(eq(notesTable.userId, userId)),
    db.select({ count: sql<number>`count(*)::int` }).from(itemsTable).where(eq(itemsTable.userId, userId)),
    db
      .select({ type: itemsTable.type, count: sql<number>`count(*)::int` })
      .from(itemsTable)
      .where(eq(itemsTable.userId, userId))
      .groupBy(itemsTable.type),
    db
      .select()
      .from(notesTable)
      .where(eq(notesTable.userId, userId))
      .orderBy(desc(notesTable.updatedAt))
      .limit(5),
    db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.userId, userId))
      .orderBy(desc(itemsTable.createdAt))
      .limit(5),
    db
      .select({ total: sql<number>`coalesce(sum(winning_bid), 0)::float` })
      .from(auctionEntriesTable)
      .where(eq(auctionEntriesTable.userId, userId)),
  ]);

  res.json(GetDashboardResponse.parse({
    totalNotes: notesCount[0]?.count ?? 0,
    totalItems: itemsCount[0]?.count ?? 0,
    itemsByType: itemsByType.map((r: { type: string | null; count: number }) => ({ type: r.type, count: r.count })),
    recentNotes: recentNotes.map((n: typeof recentNotes[number]) => ({ ...n, notionSynced: n.notionSynced === "true" })),
    recentItems: recentItems,
    auctionTotal: auctionTotal[0]?.total ?? 0,
  }));
});

export default router;
