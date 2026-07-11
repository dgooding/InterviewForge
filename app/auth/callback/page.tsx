"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * OAuth redirect target for Google sign-in (Supabase PKCE).
 * Exchanges ?code= for a session, then sends the user to the dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Finishing Google sign-in…");

  useEffect(() => {
    let active = true;

    async function finish() {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        setMessage("Cloud auth is not configured.");
        router.replace("/login");
        return;
      }

      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const err = url.searchParams.get("error_description");

        if (err) {
          setMessage(err);
          setTimeout(() => router.replace("/login?error=oauth"), 1500);
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Hash-based or already restored session
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            setMessage("No session found. Try signing in again.");
            setTimeout(() => router.replace("/login"), 1500);
            return;
          }
        }

        if (active) {
          setMessage("Signed in — loading your progress…");
          router.replace("/dashboard");
        }
      } catch (e) {
        console.error(e);
        if (active) {
          setMessage("Sign-in failed. Redirecting…");
          setTimeout(() => router.replace("/login?error=callback"), 1500);
        }
      }
    }

    finish();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground" role="status">
        {message}
      </p>
    </div>
  );
}
