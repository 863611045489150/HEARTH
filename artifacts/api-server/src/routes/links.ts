import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { db, businessLinksTable } from "@workspace/db";
import {
  CreateLinkBody,
  DeleteLinkParams,
  ListLinksResponse,
  CreateLinkResponse,
  DeleteLinkResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { generateLinkSummary } from "../lib/ai-router";

const router: IRouter = Router();

router.get("/links", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const links = await db
    .select()
    .from(businessLinksTable)
    .where(eq(businessLinksTable.userId, req.userId!))
    .orderBy(businessLinksTable.createdAt);
  res.json(ListLinksResponse.parse(links));
});

router.post("/links", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = CreateLinkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let aiSummary = "";
  try {
    aiSummary = await generateLinkSummary(parsed.data.url, parsed.data.label ?? "");
  } catch (err) {
    logger.warn({ err }, "AI link summary failed");
    aiSummary = parsed.data.label ?? parsed.data.url;
  }

  const [link] = await db
    .insert(businessLinksTable)
    .values({
      userId: req.userId!,
      url: parsed.data.url,
      label: parsed.data.label ?? "",
      aiSummary,
    })
    .returning();
  res.status(201).json(CreateLinkResponse.parse(link));
});

router.delete("/links/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = DeleteLinkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [link] = await db
    .delete(businessLinksTable)
    .where(and(eq(businessLinksTable.id, params.data.id), eq(businessLinksTable.userId, req.userId!)))
    .returning();
  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }
  res.json(DeleteLinkResponse.parse({ success: true }));
});

export default router;
