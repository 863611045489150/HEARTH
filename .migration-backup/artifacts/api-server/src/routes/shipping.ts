import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, shippingCalculationsTable } from "@workspace/db";
import {
  CalculateShippingBody,
  DeleteShippingCalculationParams,
  ListShippingCalculationsResponse,
  CalculateShippingResponse,
  DeleteShippingCalculationResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

// Simple freight estimate: base rate per kg by distance tier
function estimateShipping(origin: string, destination: string, weightKg: number): number {
  const isSameCity = origin.toLowerCase().trim() === destination.toLowerCase().trim();
  const baseRate = isSameCity ? 30 : 80; // INR per kg
  const minCharge = isSameCity ? 100 : 250;
  return Math.max(minCharge, Math.round(baseRate * weightKg));
}

const router: IRouter = Router();

router.get("/shipping", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const calcs = await db
    .select()
    .from(shippingCalculationsTable)
    .where(eq(shippingCalculationsTable.userId, req.userId!))
    .orderBy(shippingCalculationsTable.createdAt);
  res.json(ListShippingCalculationsResponse.parse(calcs));
});

router.post("/shipping", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = CalculateShippingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const estimatedCost = estimateShipping(
    parsed.data.origin,
    parsed.data.destination,
    parsed.data.weightKg
  );
  const [calc] = await db
    .insert(shippingCalculationsTable)
    .values({
      userId: req.userId!,
      ...parsed.data,
      estimatedCost,
      currency: "INR",
    })
    .returning();
  res.status(201).json(CalculateShippingResponse.parse(calc));
});

router.delete("/shipping/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = DeleteShippingCalculationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [calc] = await db
    .delete(shippingCalculationsTable)
    .where(and(
      eq(shippingCalculationsTable.id, params.data.id),
      eq(shippingCalculationsTable.userId, req.userId!)
    ))
    .returning();
  if (!calc) {
    res.status(404).json({ error: "Shipping calculation not found" });
    return;
  }
  res.json(DeleteShippingCalculationResponse.parse({ success: true }));
});

export default router;
