import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let clientPromise: Promise<SupabaseClient> | null = null;

export function getSupabaseClient(): Promise<SupabaseClient> {
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    const res = await fetch(`${base}/api/auth/config`);
    if (!res.ok) throw new Error("Could not load auth config");
    const { supabaseUrl, supabaseAnonKey } = (await res.json()) as {
      supabaseUrl: string;
      supabaseAnonKey: string;
    };
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { flowType: "pkce", persistSession: true },
    });
  })();

  return clientPromise;
}

export function getCallbackUrl(): string {
  // Works in both dev (localhost) and production (Replit domain)
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  return `${window.location.origin}${base}/auth/callback`;
}
