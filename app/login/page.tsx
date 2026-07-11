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
  signInWithGitHub,
  signInWithEmail,
  signInWithPassword,
  signUpWithPassword,
  isSupabaseConfigured,
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
  const [loading, setLoading] = useState<"github" | "password" | "magic" | null>(
    null
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const configured = isSupabaseConfigured() || cloudEnabled;
  const githubOn = isGitHubOAuthEnabled();
  const willMigrate = typeof window !== "undefined" && hasLocalProgress();

  useEffect(() => {
    if (isCloudUser) router.replace("/dashboard");
  }, [isCloudUser, router]);

  const onPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) {
      toast.error("Cloud login isn’t set up on this deploy, ngl.");
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
            "Account’s ready — check your email, then log in."
          );
          setMode("signin");
          return;
        }
        toast.success("You’re in — account created");
        router.replace("/dashboard");
        return;
      }

      const res = await signInWithPassword(email, password);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("You’re logged in");
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
    toast.success("Check your email for the login link");
  };

  const onGitHub = async () => {
    if (!githubOn) return;
    setLoading("github");
    const res = await signInWithGitHub();
    if (res.error) {
      toast.error(res.error);
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
            Log in to your account
          </p>
        </div>

        <Card className="border-indigo-500/15 shadow-glow">
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center gap-2 text-2xl">
              {mode === "signup" ? (
                <>
                  <UserPlus className="h-6 w-6 text-indigo-500" />
                  Make an account
                </>
              ) : mode === "magic" ? (
                <>
                  <Mail className="h-6 w-6 text-indigo-500" />
                  Email magic link
                </>
              ) : (
                <>
                  <LogIn className="h-6 w-6 text-indigo-500" />
                  Log in
                </>
              )}
            </CardTitle>
            <CardDescription>
              {mode === "signup"
                ? "Email + password. Your practice can sync privately — no weird public stuff."
                : mode === "magic"
                  ? "We’ll email you a one-tap link. No password, bet."
                  : "Email + password. Guest progress on this device can merge after you log in."}
            </CardDescription>

            <div className="flex rounded-xl border border-border/70 bg-muted/40 p-1">
              {(
                [
                  { id: "signin" as const, label: "Log in" },
                  { id: "signup" as const, label: "Sign up" },
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
                  : "Login flopped. Try email + password or a magic link."}
              </p>
            )}

            {willMigrate && (
              <p className="flex gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2 text-xs text-muted-foreground">
                <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                Local practice on this device merges into your account after
                login (never shared with random people).
              </p>
            )}

            {!configured && (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                Cloud login isn’t set up here (missing Supabase env vars).
              </p>
            )}

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
                    "Make account"
                  ) : (
                    "Log in"
                  )}
                </Button>
              </form>
            )}

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
                    "Email me a login link"
                  )}
                </Button>
                {magicSent && (
                  <p className="text-xs text-muted-foreground">
                    Open the link on this device. Spam folder if it doesn’t show
                    in a minute.
                  </p>
                )}
              </form>
            )}

            {githubOn && (
              <>
                <div className="relative py-1 text-center text-xs text-muted-foreground">
                  <span className="relative z-10 bg-card px-2">or</span>
                  <div className="absolute left-0 right-0 top-1/2 border-t border-border" />
                </div>
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
              </>
            )}

            <p className="text-center text-xs text-muted-foreground">
              {mode === "signin" ? (
                <>
                  No account yet?{" "}
                  <button
                    type="button"
                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                    onClick={() => setMode("signup")}
                  >
                    Make one
                  </button>
                </>
              ) : mode === "signup" ? (
                <>
                  Already have one?{" "}
                  <button
                    type="button"
                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                    onClick={() => setMode("signin")}
                  >
                    Log in
                  </button>
                </>
              ) : (
                <>
                  Want a password instead?{" "}
                  <button
                    type="button"
                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                    onClick={() => setMode("signin")}
                  >
                    Log in with email
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
