"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Cloud,
  HardDrive,
  Download,
  Trash2,
  LogIn,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Mic,
  FileText,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";

type Health = {
  ok: boolean;
  config: { supabase: boolean; xai: boolean; appUrl: string | null };
  features: Record<string, boolean>;
};

export default function SettingsPage() {
  const {
    user,
    isCloudUser,
    cloudEnabled,
    cloudOnline,
    sessions,
    resumeAnalysis,
    lastCloudSync,
    exportProgress,
    deleteLocalProgress,
    deleteCloudAndLocalProgress,
    signOut,
    softSync,
    stats,
  } = useApp();

  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setHealth(d))
      .catch(() => setHealth(null));
  }, []);

  const onDeleteAll = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      toast.message("Click delete again to confirm permanent wipe");
      return;
    }
    setBusy(true);
    try {
      await deleteCloudAndLocalProgress();
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">Settings & privacy</h1>
        <p className="mt-1 text-muted-foreground">
          You own your interview data. Choose how it is stored.
        </p>

        {/* System / feature readiness */}
        <Card className="mt-8 border-primary/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Server className="h-5 w-5 text-primary" />
              System status
            </CardTitle>
            <CardDescription>
              Core product works without cloud config. Supabase enables Google
              sync; xAI upgrades AI quality.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <StatusRow
                ok
                label="Guest progress (localStorage)"
                detail="Always on"
              />
              <StatusRow
                ok
                label="Resume · Interview · History · Analytics"
                detail="Fully implemented"
              />
              <StatusRow
                ok={Boolean(health?.config.supabase ?? cloudEnabled)}
                label="Supabase / Google cloud login"
                detail={
                  health?.config.supabase || cloudEnabled
                    ? "Configured"
                    : "Add env vars — see SETUP.md"
                }
              />
              <StatusRow
                ok={Boolean(health?.config.xai)}
                label="xAI / Grok API"
                detail={
                  health?.config.xai
                    ? "Configured (enhanced AI)"
                    : "Optional — local coach active"
                }
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm" variant="outline">
                <Link href="/resume">
                  <FileText className="h-3.5 w-3.5" />
                  Resume
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/interview">
                  <Mic className="h-3.5 w-3.5" />
                  Interview
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/history">
                  <History className="h-3.5 w-3.5" />
                  History
                </Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/faq">FAQ & help</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/privacy">Privacy</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account status */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {isCloudUser ? (
                <Cloud className="h-5 w-5 text-primary" />
              ) : (
                <HardDrive className="h-5 w-5 text-primary" />
              )}
              Account
            </CardTitle>
            <CardDescription>
              {isCloudUser
                ? "Signed in — progress syncs to your private cloud account (RLS protected)."
                : "Guest mode — all progress stays in this browser only. Nothing is uploaded."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isCloudUser ? "default" : "secondary"}>
                {isCloudUser ? "Signed in" : "Anonymous guest"}
              </Badge>
              {isCloudUser && (
                <Badge variant={cloudOnline ? "success" : "warning"}>
                  {cloudOnline ? "Cloud reachable" : "Cloud offline (local cache)"}
                </Badge>
              )}
              {!cloudEnabled && (
                <Badge variant="outline">Cloud login not configured</Badge>
              )}
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
              <p className="font-medium">{user?.name || "Candidate"}</p>
              <p className="text-muted-foreground">
                {isCloudUser ? user?.email : "Local profile (not shared)"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {stats.totalSessions} sessions · streak {stats.streak} ·{" "}
                {sessions.length} stored ·{" "}
                {resumeAnalysis ? "resume analyzed" : "no resume"}
              </p>
              {lastCloudSync && isCloudUser && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Last cloud sync: {formatDate(lastCloudSync)}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {isCloudUser ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void softSync()}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Sync now
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await signOut();
                      toast.success(
                        "Signed out. Progress remains on this device only."
                      );
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                </>
              ) : (
                <Button asChild variant="gradient" size="sm">
                  <Link href="/login">
                    <LogIn className="h-4 w-4" />
                    Sign in with Google
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Privacy principles */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-emerald-500" />
              Privacy principles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Guest progress never leaves this browser until you sign in.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Cloud data is scoped to your account with row-level security —
                other users cannot read your rows.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                You can export or permanently delete your data at any time.
              </li>
              <li className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                If you use AI scoring/resume analysis, the text you submit is
                sent to the analysis API for that request only (not stored as
                your long-term progress store).
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Data ownership */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Your data</CardTitle>
            <CardDescription>
              Export a private JSON backup, or wipe everything.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={exportProgress}>
              <Download className="h-4 w-4" />
              Export progress (JSON)
            </Button>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                Danger zone
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Delete all practice data on this device? This cannot be undone."
                      )
                    ) {
                      deleteLocalProgress();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete local progress
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={busy}
                  onClick={() => void onDeleteAll()}
                >
                  <Trash2 className="h-4 w-4" />
                  {confirmDelete
                    ? "Click again to confirm full wipe"
                    : "Delete all data (local + cloud)"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Full wipe removes interviews, resume analysis, and streak
                {isCloudUser ? " from your account and this device" : " from this device"}
                . It does not delete your Google account.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function StatusRow({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex gap-2 rounded-lg border border-border/50 px-3 py-2">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      )}
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
