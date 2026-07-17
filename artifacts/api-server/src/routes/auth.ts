import { Router, type IRouter } from "express";
import { createClient } from "@supabase/supabase-js";
import { GetMeResponse, LogoutResponse } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

function getSupabaseAdmin() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const router: IRouter = Router();

// Public — no auth required. Returns the publishable Supabase config
// so the frontend can bootstrap its own Supabase client for OAuth.
router.get("/auth/config", (_req, res): void => {
  const supabaseUrl = process.env["SUPABASE_URL"];
  const supabaseAnonKey = process.env["SUPABASE_ANON_KEY"];
  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }
  res.json({ supabaseUrl, supabaseAnonKey });
});

router.post("/auth/logout", requireAuth, (_req, res): void => {
  res.json(LogoutResponse.parse({ success: true }));
});

router.get("/auth/me", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.getUserById(req.userId!);
  if (error || !data.user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(GetMeResponse.parse({
    id: data.user.id,
    email: data.user.email ?? "",
    createdAt: data.user.created_at,
  }));
});

export default router;
