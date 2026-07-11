"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Cloud, HardDrive, Shield } from "lucide-react";
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
import {
  signInWithGoogle,
  signInWithGitHub,
  signInWithEmail,
  isSupabaseConfigured,
} from "@/lib/auth";
import { useApp } from "@/components/providers";
import { hasLocalProgress } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isCloudUser, cloudEnabled } = useApp();
  const [loading, setLoading] = useState<
    "google" | "github" | "email" | null
  >(null);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const configured = isSupabaseConfigured() || cloudEnabled;
  const willMigrate = typeof window !== "undefined" && hasLocalProgress();

  useEffect(() => {
    if (isCloudUser) router.replace("/dashboard");
  }, [isCloudUser, router]);

  const onGoogle = async () => {
    setLoading("google");
    const res = await signInWithGoogle();
    if (res.error) {
      toast.error(
        res.error.includes("provider is not enabled")
          ? "Google isn’t enabled yet — use email magic link below, or finish Google Cloud setup."
          : res.error
      );
      setLoading(null);
    }
  };

  const onGitHub = async () => {
    setLoading("github");
    const res = await signInWithGitHub();
    if (res.error) {
      toast.error(
        res.error.includes("provider is not enabled")
          ? "GitHub isn’t enabled yet — use email magic link below."
          : res.error
      );
      setLoading(null);
    }
  };

  const onEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("email");
    const res = await signInWithEmail(email);
    setLoading(null);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setEmailSent(true);
    toast.success("Check your email for the sign-in link");
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
            <CardTitle>Save progress across devices</CardTitle>
            <CardDescription>
              Optional. Guest mode keeps everything on this browser only.
              Signing in uploads your local progress to your private account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {oauthError && (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
                Sign-in was cancelled or failed. Please try again.
              </p>
            )}

            {willMigrate && (
              <p className="flex gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                We found local practice data on this device. After sign-in it
                will be merged into your account (never shared with other users).
              </p>
            )}

            {/* Email magic link — works now without Google Cloud */}
            <form onSubmit={onEmail} className="space-y-2">
              <Label htmlFor="email">Email magic link (recommended)</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!loading || emailSent}
                required
              />
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={!!loading || !configured || emailSent}
              >
                {loading === "email" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : emailSent ? (
                  "Link sent — check your inbox"
                ) : (
                  "Email me a sign-in link"
                )}
              </Button>
              {emailSent && (
                <p className="text-xs text-muted-foreground">
                  Open the link on this device. It signs you in and syncs local
                  progress. Check spam if you don&apos;t see it in 1–2 minutes.
                </p>
              )}
            </form>

            <div className="relative py-1 text-center text-xs text-muted-foreground">
              <span className="bg-card px-2 relative z-10">or</span>
              <div className="absolute left-0 right-0 top-1/2 border-t border-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={!!loading || !configured}
              onClick={onGoogle}
            >
              {loading === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={!!loading || !configured}
              onClick={onGitHub}
            >
              {loading === "github" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GitHubIcon />
              )}
              Continue with GitHub
            </Button>

            {!configured && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Cloud login isn&apos;t configured on this deployment yet. Add
                Supabase env vars (README). Guest mode still works with full
                local privacy.
              </p>
            )}

            <div className="grid gap-2 rounded-xl border border-border/60 p-3 text-xs text-muted-foreground">
              <p className="flex items-center gap-2 font-medium text-foreground">
                <Cloud className="h-3.5 w-3.5 text-primary" />
                Signed in
              </p>
              <p>
                Sessions, resume insights, role, and streak sync privately under
                your account (Supabase RLS).
              </p>
              <p className="mt-2 flex items-center gap-2 font-medium text-foreground">
                <HardDrive className="h-3.5 w-3.5 text-primary" />
                Guest
              </p>
              <p>
                100% local. No progress is sent to our database until you sign
                in.
              </p>
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
              <Link href="/settings" className="text-primary hover:underline">
                Privacy &amp; data settings
              </Link>
              {" · "}
              <Link href="/" className="text-primary hover:underline">
                Home
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

function GitHubIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.43 7.86 10.96.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.73.08-.72.08-.72 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.11-.76.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.7.42.36.79 1.08.79 2.18 0 1.57-.01 2.84-.01 3.23 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.74 18.27.5 12 .5z" />
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
