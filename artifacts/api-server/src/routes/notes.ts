import { Router, type IRouter } from "express";
import { eq, and, ilike } from "drizzle-orm";
import { db, notesTable } from "@workspace/db";
import {
  CreateNoteBody,
  UpdateNoteBody,
  GetNoteParams,
  UpdateNoteParams,
  DeleteNoteParams,
  SyncNoteToNotionParams,
  ListNotesQueryParams,
  ListNotesResponse,
  CreateNoteResponse,
  GetNoteResponse,
  UpdateNoteResponse,
  DeleteNoteResponse,
  SyncNoteToNotionResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

function serializeNote(note: typeof notesTable.$inferSelect) {
  return {
    ...note,
    notionSynced: note.notionSynced === "true",
  };
}

router.get("/notes", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const query = ListNotesQueryParams.safeParse(req.query);
  let dbQuery = db.select().from(notesTable).where(eq(notesTable.userId, req.userId!)).$dynamic();

  if (query.success && query.data.search) {
    dbQuery = dbQuery.where(and(
      eq(notesTable.userId, req.userId!),
      ilike(notesTable.title, `%${query.data.search}%`)
    ));
  }

  const notes = await dbQuery.orderBy(notesTable.updatedAt);
  res.json(ListNotesResponse.parse(notes.map(serializeNote)));
});

router.post("/notes", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = CreateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [note] = await db
    .insert(notesTable)
    .values({ userId: req.userId!, ...parsed.data })
    .returning();
  res.status(201).json(CreateNoteResponse.parse(serializeNote(note!)));
});

router.get("/notes/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = GetNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [note] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, params.data.id), eq(notesTable.userId, req.userId!)));
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json(GetNoteResponse.parse(serializeNote(note)));
});

router.patch("/notes/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = UpdateNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [note] = await db
    .update(notesTable)
    .set(parsed.data)
    .where(and(eq(notesTable.id, params.data.id), eq(notesTable.userId, req.userId!)))
    .returning();
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json(UpdateNoteResponse.parse(serializeNote(note)));
});

router.delete("/notes/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = DeleteNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [note] = await db
    .delete(notesTable)
    .where(and(eq(notesTable.id, params.data.id), eq(notesTable.userId, req.userId!)))
    .returning();
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json(DeleteNoteResponse.parse({ success: true }));
});

router.post("/notes/:id/sync-notion", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = SyncNoteToNotionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [note] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, params.data.id), eq(notesTable.userId, req.userId!)));
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  // Mark as synced (Notion OAuth integration handled separately)
  const [updated] = await db
    .update(notesTable)
    .set({ notionSynced: "true" })
    .where(eq(notesTable.id, note.id))
    .returning();
  res.json(SyncNoteToNotionResponse.parse(serializeNote(updated!)));
});

export default router;
