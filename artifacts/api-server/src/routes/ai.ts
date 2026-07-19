import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import { AiChatBody, AiProcessBody, AiChatResponse, AiProcessResponse } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { aiChat, processNaturalLanguage } from "../lib/ai-router";

const router: IRouter = Router();

router.post("/ai/chat", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Build system prompt with user profile context
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, req.userId!));

  const systemPrompt = profile
    ? `You are Hearth, a personal AI assistant. User context: ${profile.rawText}. Role: ${profile.role}. Tone: ${profile.tone}. Be helpful, concise, and adapt to the user's needs.`
    : "You are Hearth, a personal AI assistant for a family workspace. Be helpful and concise.";

  const messages = parsed.data.history
    ? [...parsed.data.history, { role: "user" as const, content: parsed.data.message }]
    : [{ role: "user" as const, content: parsed.data.message }];

  const result = await aiChat(messages, systemPrompt);
  res.json(AiChatResponse.parse(result));
});

router.post("/ai/process", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = AiProcessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, req.userId!));

  const profileContext = profile ? `${profile.role}: ${profile.rawText}` : undefined;
  const result = await processNaturalLanguage(parsed.data.text, profileContext);
  res.json(AiProcessResponse.parse(result));
});

export default router;
