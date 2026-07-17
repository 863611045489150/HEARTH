import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import { CreateProfileBody, GetProfileResponse, CreateProfileResponse } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { parseProfileText } from "../lib/ai-router";

const router: IRouter = Router();

router.get("/profile", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, req.userId!));
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(GetProfileResponse.parse({
    ...profile,
    notionConnected: profile.notionConnected === "true",
  }));
});

router.post("/profile", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = CreateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let parsed_profile = { role: "User", useCases: [] as string[], tone: "casual" };
  try {
    parsed_profile = await parseProfileText(parsed.data.rawText);
  } catch (err) {
    req.log.warn({ err }, "AI profile parsing failed, using defaults");
  }

  const [existing] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, req.userId!));

  let profile;
  if (existing) {
    [profile] = await db
      .update(profilesTable)
      .set({
        rawText: parsed.data.rawText,
        role: parsed_profile.role,
        useCases: parsed_profile.useCases,
        tone: parsed_profile.tone,
      })
      .where(eq(profilesTable.userId, req.userId!))
      .returning();
  } else {
    [profile] = await db
      .insert(profilesTable)
      .values({
        userId: req.userId!,
        rawText: parsed.data.rawText,
        role: parsed_profile.role,
        useCases: parsed_profile.useCases,
        tone: parsed_profile.tone,
      })
      .returning();
  }

  res.json(CreateProfileResponse.parse({
    ...profile,
    notionConnected: profile!.notionConnected === "true",
  }));
});

export default router;
