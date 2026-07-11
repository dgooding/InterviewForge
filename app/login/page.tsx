"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  Loader2,
  Shield,
  Mail,
  Lock,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
} from "lucide-react";
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
  signInWithPassword,
  signUpWithPassword,
  isSupabaseConfigured,
  isGoogleOAuthEnabled,
  isGitHubOAuthEnabled,
} from "@/lib/auth";
import { useApp } from "@/components/providers";
import { hasLocalProgress } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup" | "magic";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isCloudUser, cloudEnabled } = useApp();

  const initialMode =
    searchParams.get("mode") === "signup"
      ? "signup"
      : searchParams.get("mode") === "magic"
        ? "magic"
        : "signin";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState<
    "google" | "github" | "password" | "magic" | null
  >(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const configured = isSupabaseConfigured() || cloudEnabled;
  const googleOn = isGoogleOAuthEnabled();
  const githubOn = isGitHubOAuthEnabled();
  const willMigrate = typeof window !== "undefined" && hasLocalProgress();

  useEffect(() => {
    if (isCloudUser) router.replace("/dashboard");
  }, [isCloudUser, router]);

  const friendlyOAuthError = (raw: string, provider: string) => {
    const r = raw.toLowerCase();
    if (
      r.includes("provider is not enabled") ||
      r.includes("unsupported provider") ||
      r.includes("validation_failed") ||
      r.includes("unable to exchange")
    ) {
      return `${provider} sign-in isn’t available right now. Use email + password or a magic link instead.`;
    }
    return raw;
  };

  const onPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) {
      toast.error("Cloud login isn’t configured on this deployment.");
      return;
    }
    setLoading("password");
    try {
      if (mode === "signup") {
        const res = await signUpWithPassword(email, password, name);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        if (res.needsConfirm) {
          toast.success(
            "Account created — check your email to confirm, then sign in."
          );
          setMode("signin");
          return;
        }
        toast.success("Account created — you’re signed in");
        router.replace("/dashboard");
        return;
      }

      const res = await signInWithPassword(email, password);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Signed in");
      router.replace("/dashboard");
    } finally {
      setLoading(null);
    }
  };

  const onMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("magic");
    const res = await signInWithEmail(email);
    setLoading(null);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setMagicSent(true);
    toast.success("Check your email for the sign-in link");
  };

  const onGoogle = async () => {
    if (!googleOn) {
      toast.message("Use email + password or a magic link to sign in.");
      return;
    }
    setLoading("google");
    const res = await signInWithGoogle();
    if (res.error) {
      toast.error(friendlyOAuthError(res.error, "Google"));
      setLoading(null);
      return;
    }
    if (res.redirecting) return;
    toast.success("Signed in with Google");
    router.replace("/dashboard");
  };

  const onGitHub = async () => {
    if (!githubOn) return;
    setLoading("github");
    const res = await signInWithGitHub();
    if (res.error) {
      toast.error(friendlyOAuthError(res.error, "GitHub"));
      setLoading(null);
    }
  };

  const oauthError = searchParams.get("error");
  const errorMessage = searchParams.get("message");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
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
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <Card className="border-indigo-500/15 shadow-glow">
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center gap-2 text-2xl">
              {mode === "signup" ? (
                <>
                  <UserPlus className="h-6 w-6 text-indigo-500" />
                  Create account
                </>
              ) : mode === "magic" ? (
                <>
                  <Mail className="h-6 w-6 text-indigo-500" />
                  Email magic link
                </>
              ) : (
                <>
                  <LogIn className="h-6 w-6 text-indigo-500" />
                  Sign in
                </>
              )}
            </CardTitle>
            <CardDescription>
              {mode === "signup"
                ? "Create an account with email and password. Your practice progress can sync privately."
                : mode === "magic"
                  ? "We’ll email you a one-tap link — no password needed."
                  : "Use your email and password. Guest progress on this device can merge after you sign in."}
            </CardDescription>

            {/* Mode tabs */}
            <div className="flex rounded-xl border border-border/70 bg-muted/40 p-1">
              {(
                [
                  { id: "signin" as const, label: "Sign in" },
                  { id: "signup" as const, label: "Create account" },
                  { id: "magic" as const, label: "Magic link" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMode(tab.id);
                    setMagicSent(false);
                  }}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-all sm:text-sm",
                    mode === tab.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {oauthError && (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
                {errorMessage
                  ? decodeURIComponent(errorMessage)
                  : "Sign-in failed. Try email + password or a magic link."}
              </p>
            )}

            {willMigrate && (
              <p className="flex gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2 text-xs text-muted-foreground">
                <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                Local practice data on this device will merge into your account
                after sign-in (never shared with other users).
              </p>
            )}

            {!configured && (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                Cloud login isn’t configured on this deployment (missing Supabase
                env vars).
              </p>
            )}

            {/* Password sign-in / sign-up */}
            {(mode === "signin" || mode === "signup") && (
              <form onSubmit={onPasswordSubmit} className="space-y-3">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      autoComplete="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!!loading}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!!loading}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      placeholder={
                        mode === "signup"
                          ? "At least 6 characters"
                          : "Your password"
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={!!loading}
                      required
                      minLength={6}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  disabled={!!loading || !configured}
                >
                  {loading === "password" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === "signup" ? (
                    "Create account"
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            )}

            {/* Magic link */}
            {mode === "magic" && (
              <form onSubmit={onMagic} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="magic-email">Email</Label>
                  <Input
                    id="magic-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!!loading || magicSent}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  disabled={!!loading || !configured || magicSent}
                >
                  {loading === "magic" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : magicSent ? (
                    "Link sent — check your inbox"
                  ) : (
                    "Email me a sign-in link"
                  )}
                </Button>
                {magicSent && (
                  <p className="text-xs text-muted-foreground">
                    Open the link on this device. Check spam if you don’t see it
                    in a minute.
                  </p>
                )}
              </form>
            )}

            <div className="relative py-1 text-center text-xs text-muted-foreground">
              <span className="relative z-10 bg-card px-2">or continue with</span>
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

            {githubOn && (
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
            )}

            <p className="text-center text-xs text-muted-foreground">
              {mode === "signin" ? (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                    onClick={() => setMode("signup")}
                  >
                    Create one
                  </button>
                </>
              ) : mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                    onClick={() => setMode("signin")}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Prefer a password?{" "}
                  <button
                    type="button"
                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                    onClick={() => setMode("signin")}
                  >
                    Sign in with email
                  </button>
                </>
              )}
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              Continue as guest
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Guest mode stays 100% on this browser.{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy
              </Link>
              {" · "}
              <Link href="/settings" className="text-primary hover:underline">
                Settings
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
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
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
