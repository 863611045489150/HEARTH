import { Router, type IRouter } from "express";
import { eq, and, ilike, sql, eq as eqPg } from "drizzle-orm";
import { db, itemsTable } from "@workspace/db";
import {
  CreateItemBody,
  UpdateItemBody,
  GetItemParams,
  UpdateItemParams,
  DeleteItemParams,
  ListItemsQueryParams,
  ListItemsResponse,
  CreateItemResponse,
  GetItemResponse,
  UpdateItemResponse,
  DeleteItemResponse,
  GetItemsSummaryResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { processNaturalLanguage } from "../lib/ai-router";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Must come before /:id route
router.get("/items/summary", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const totalResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(itemsTable)
    .where(eqPg(itemsTable.userId, req.userId!));

  const byTypeResult = await db
    .select({ type: itemsTable.type, count: sql<number>`count(*)::int` })
    .from(itemsTable)
    .where(eqPg(itemsTable.userId, req.userId!))
    .groupBy(itemsTable.type);

  res.json(GetItemsSummaryResponse.parse({
    total: totalResult[0]?.count ?? 0,
    byType: byTypeResult.map((r: { type: string | null; count: number }) => ({ type: r.type, count: r.count })),
  }));
});

router.get("/items", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const query = ListItemsQueryParams.safeParse(req.query);
  let dbQuery = db.select().from(itemsTable).where(eq(itemsTable.userId, req.userId!)).$dynamic();

  if (query.success) {
    const conditions = [eq(itemsTable.userId, req.userId!)];
    if (query.data.type) {
      conditions.push(eq(itemsTable.type, query.data.type));
    }
    if (query.data.search) {
      conditions.push(ilike(itemsTable.title, `%${query.data.search}%`));
    }
    if (conditions.length > 1) {
      dbQuery = db.select().from(itemsTable).where(and(...conditions)).$dynamic();
    }
  }

  const items = await dbQuery.orderBy(itemsTable.createdAt);
  res.json(ListItemsResponse.parse(items));
});

router.post("/items", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let processed: {
    type: "list" | "table" | "calculation" | "business_record" | "note";
    title: string;
    structuredData: Record<string, unknown>;
    total: number | null;
  } = {
    type: "note",
    title: parsed.data.rawText.slice(0, 60),
    structuredData: { content: parsed.data.rawText },
    total: null,
  };

  try {
    const aiResult = await processNaturalLanguage(parsed.data.rawText);
    processed = {
      type: aiResult.type,
      title: aiResult.title,
      structuredData: aiResult.structuredData,
      total: aiResult.total,
    };
  } catch (err) {
    logger.warn({ err }, "AI processing failed, storing as note");
  }

  const [item] = await db
    .insert(itemsTable)
    .values({
      userId: req.userId!,
      rawText: parsed.data.rawText,
      ...processed,
    })
    .returning();

  res.status(201).json(CreateItemResponse.parse(item));
});

router.get("/items/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = GetItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db
    .select()
    .from(itemsTable)
    .where(and(eq(itemsTable.id, params.data.id), eq(itemsTable.userId, req.userId!)));
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(GetItemResponse.parse(item));
});

router.patch("/items/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = UpdateItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db
    .update(itemsTable)
    .set(parsed.data)
    .where(and(eq(itemsTable.id, params.data.id), eq(itemsTable.userId, req.userId!)))
    .returning();
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(UpdateItemResponse.parse(item));
});

router.delete("/items/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = DeleteItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db
    .delete(itemsTable)
    .where(and(eq(itemsTable.id, params.data.id), eq(itemsTable.userId, req.userId!)))
    .returning();
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(DeleteItemResponse.parse({ success: true }));
});

export default router;
