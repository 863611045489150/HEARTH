import { Router, type IRouter } from "express";
import { createClient } from "@supabase/supabase-js";
import {
  RegisterBody,
  LoginBody,
  RegisterResponse,
  LoginResponse,
  GetMeResponse,
  LogoutResponse,
  SendOtpBody,
  SendOtpResponse,
  VerifyOtpBody,
  VerifyOtpResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

function getSupabaseAdmin() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function getSupabaseClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
  return createClient(url, key);
}

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user || !data.session) {
    res.status(400).json({ error: error?.message ?? "Registration failed" });
    return;
  }
  const result = RegisterResponse.parse({
    user: {
      id: data.user.id,
      email: data.user.email,
      createdAt: data.user.created_at,
    },
    token: data.session.access_token,
  });
  res.status(201).json(result);
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user || !data.session) {
    res.status(401).json({ error: error?.message ?? "Invalid credentials" });
    return;
  }
  const result = LoginResponse.parse({
    user: {
      id: data.user.id,
      email: data.user.email,
      createdAt: data.user.created_at,
    },
    token: data.session.access_token,
  });
  res.json(result);
});

router.post("/auth/logout", requireAuth, async (_req, res): Promise<void> => {
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
    email: data.user.email,
    createdAt: data.user.created_at,
  }));
});

router.post("/auth/send-otp", async (req, res): Promise<void> => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({ phone: parsed.data.phone });
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.json(SendOtpResponse.parse({ success: true }));
});

router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone: parsed.data.phone,
    token: parsed.data.token,
    type: "sms",
  });
  if (error || !data.user || !data.session) {
    res.status(400).json({ error: error?.message ?? "Invalid or expired OTP" });
    return;
  }
  res.json(VerifyOtpResponse.parse({
    user: {
      id: data.user.id,
      email: data.user.email ?? data.user.phone ?? "",
      createdAt: data.user.created_at,
    },
    token: data.session.access_token,
  }));
});

export default router;
