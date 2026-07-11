"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Cloud, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInWithGoogle, isSupabaseConfigured } from "@/lib/auth";
import { useApp } from "@/components/providers";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isCloudUser, cloudEnabled } = useApp();
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured() || cloudEnabled;

  useEffect(() => {
    if (isCloudUser) router.replace("/dashboard");
  }, [isCloudUser, router]);

  const onGoogle = async () => {
    setLoading(true);
    const res = await signInWithGoogle();
    if (res.error) {
      toast.error(res.error);
      setLoading(false);
      return;
    }
    // Browser redirects to Google — keep spinner
  };

  const oauthError = searchParams.get("error");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-glow">
              <Sparkles className="h-5 w-5" />
            </span>
            InterviewForge
          </Link>
        </div>

        <Card className="border-primary/10 shadow-glow">
          <CardHeader>
            <CardTitle>Sign in to save progress</CardTitle>
            <CardDescription>
              Use Google to sync interviews, resume insights, streak, and scores
              across devices. You can still practice offline as a guest.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {oauthError && (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
                Sign-in was cancelled or failed. Please try again.
              </p>
            )}

            <Button
              type="button"
              variant="gradient"
              className="w-full"
              disabled={loading || !configured}
              onClick={onGoogle}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </Button>

            {!configured && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Google login is not configured on this deployment yet. Add
                Supabase env vars and enable the Google provider (see README →
                Google Auth). Guest mode still works.
              </p>
            )}

            <div className="grid gap-2 rounded-xl border border-border/60 p-3 text-xs text-muted-foreground">
              <p className="flex items-center gap-2 font-medium text-foreground">
                <Cloud className="h-3.5 w-3.5 text-primary" />
                With Google
              </p>
              <p>Sessions, resume analysis, role, and streak sync to your account.</p>
              <p className="mt-2 flex items-center gap-2 font-medium text-foreground">
                <HardDrive className="h-3.5 w-3.5 text-primary" />
                Guest (this device only)
              </p>
              <p>Progress stays in your browser until you sign in — then it merges.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              Continue as guest
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/" className="text-primary hover:underline">
                Back to home
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
