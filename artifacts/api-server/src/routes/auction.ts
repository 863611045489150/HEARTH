import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, auctionEntriesTable } from "@workspace/db";
import {
  CreateAuctionEntryBody,
  UpdateAuctionEntryBody,
  UpdateAuctionEntryParams,
  DeleteAuctionEntryParams,
  ListAuctionEntriesResponse,
  CreateAuctionEntryResponse,
  UpdateAuctionEntryResponse,
  DeleteAuctionEntryResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/auction", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const entries = await db
    .select()
    .from(auctionEntriesTable)
    .where(eq(auctionEntriesTable.userId, req.userId!))
    .orderBy(auctionEntriesTable.createdAt);
  res.json(ListAuctionEntriesResponse.parse(entries));
});

router.post("/auction", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = CreateAuctionEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const dateStr =
    parsed.data.date instanceof Date
      ? parsed.data.date.toISOString().split("T")[0]!
      : (parsed.data.date as string);
  const [entry] = await db
    .insert(auctionEntriesTable)
    .values({ userId: req.userId!, ...parsed.data, date: dateStr })
    .returning();
  res.status(201).json(CreateAuctionEntryResponse.parse(entry));
});

router.patch("/auction/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = UpdateAuctionEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAuctionEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { date: rawDate, ...restUpdate } = parsed.data;
  const updateData: {
    item?: string;
    winningBid?: number;
    buyer?: string;
    date?: string;
  } = { ...restUpdate };
  if (rawDate !== undefined) {
    updateData.date = rawDate instanceof Date
      ? rawDate.toISOString().split("T")[0]!
      : (rawDate as string);
  }
  const [entry] = await db
    .update(auctionEntriesTable)
    .set(updateData)
    .where(and(eq(auctionEntriesTable.id, params.data.id), eq(auctionEntriesTable.userId, req.userId!)))
    .returning();
  if (!entry) {
    res.status(404).json({ error: "Auction entry not found" });
    return;
  }
  res.json(UpdateAuctionEntryResponse.parse(entry));
});

router.delete("/auction/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = DeleteAuctionEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [entry] = await db
    .delete(auctionEntriesTable)
    .where(and(eq(auctionEntriesTable.id, params.data.id), eq(auctionEntriesTable.userId, req.userId!)))
    .returning();
  if (!entry) {
    res.status(404).json({ error: "Auction entry not found" });
    return;
  }
  res.json(DeleteAuctionEntryResponse.parse({ success: true }));
});

export default router;
