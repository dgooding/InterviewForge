"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * Redirect fallback when the Google GIS popup cannot postMessage
 * (e.g. opener lost). Bridge sends users here with #credential=...
 */
export default function GoogleAuthFallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Finishing Google sign-in…");

  useEffect(() => {
    let active = true;

    async function finish() {
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const credential =
        params.get("credential") ||
        new URLSearchParams(window.location.search).get("credential");

      if (!credential) {
        setMessage("Missing Google credential. Try signing in again.");
        setTimeout(() => router.replace("/login?error=oauth"), 1500);
        return;
      }

      const supabase = getSupabaseBrowser();
      if (!supabase) {
        setMessage("Cloud auth is not configured.");
        router.replace("/login");
        return;
      }

      try {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: credential,
        });
        if (error) throw error;
        if (active) {
          setMessage("Signed in — loading your progress…");
          router.replace("/dashboard");
        }
      } catch (e) {
        console.error(e);
        const msg =
          e instanceof Error ? e.message : "Google sign-in failed.";
        if (active) {
          setMessage(msg);
          setTimeout(
            () =>
              router.replace(
                `/login?error=callback&message=${encodeURIComponent(msg.slice(0, 200))}`
              ),
            1500
          );
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
