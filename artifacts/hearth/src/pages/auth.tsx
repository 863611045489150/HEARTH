import * as React from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseClient, getCallbackUrl } from "@/lib/supabase";

// Google "G" logo as a clean SVG — no external dependency
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function AuthPage() {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getCallbackUrl(),
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
      // Browser will redirect — no need to setLoading(false)
    } catch (err: any) {
      toast({
        title: "Sign-in failed",
        description: err?.message ?? "Could not connect to Google. Try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm px-6 py-10 flex flex-col items-center"
      >
        {/* Wordmark */}
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl text-foreground mb-3">Hearth</h1>
          <p className="text-muted-foreground text-xs tracking-widest uppercase">
            Your Family AI Workspace
          </p>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 h-13 px-6 border border-border text-sm font-medium text-foreground hover:bg-[#fafafa] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ height: "52px" }}
        >
          {loading ? (
            <span className="text-muted-foreground text-sm">Redirecting…</span>
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>

        <p className="mt-8 text-xs text-muted-foreground/50 text-center leading-relaxed">
          By continuing you agree to use this workspace
          <br />
          for your family's private data only.
        </p>

        {/* Accent mark */}
        <div className="mt-16">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "#FF6B35" }}
          />
        </div>
      </motion.div>
    </div>
  );
}
