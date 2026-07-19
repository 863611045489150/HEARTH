import * as React from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [status, setStatus] = React.useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = await getSupabaseClient();

        // PKCE: exchange the ?code= param Supabase puts in the URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error || !data.session) throw error ?? new Error("No session returned");
          if (!cancelled) {
            localStorage.setItem("hearth_token", data.session.access_token);
            setLocation("/");
          }
          return;
        }

        // Fallback: check if a session already exists (e.g. implicit flow)
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session) {
          if (!cancelled) {
            localStorage.setItem("hearth_token", session.access_token);
            setLocation("/");
          }
          return;
        }

        throw new Error("No authentication code found. Please try signing in again.");
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err?.message ?? "Authentication failed");
          setStatus("error");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [setLocation]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="text-center space-y-4"
      >
        {status === "loading" ? (
          <>
            <p className="font-serif text-2xl text-foreground">Signing you in…</p>
            <p className="text-xs text-muted-foreground">Just a moment</p>
          </>
        ) : (
          <>
            <p className="font-serif text-2xl text-foreground">Something went wrong</p>
            <p className="text-xs text-muted-foreground max-w-xs">{errorMsg}</p>
            <button
              onClick={() => setLocation("/auth")}
              className="mt-4 text-xs underline text-foreground hover:opacity-70 transition-opacity"
            >
              Back to sign in
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
