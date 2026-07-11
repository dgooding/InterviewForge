"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Download,
  History,
  ChevronDown,
  ChevronUp,
  Search,
  Mic,
  Play,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers";
import { exportSessionReport } from "@/lib/pdf-report";
import { formatDate, scoreBg, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FeedbackPanel } from "@/components/feedback-panel";
import type { InterviewSession } from "@/lib/types";
import { isInterviewMode } from "@/components/interview/interview-simulator";

export default function HistoryPage() {
  const { sessions, user } = useApp();
  const searchParams = useSearchParams();
  const focusId = searchParams.get("id");

  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(focusId);
  const [exporting, setExporting] = useState<string | null>(null);

  // Deep link from dashboard: /history?id=...
  useEffect(() => {
    if (!focusId) return;
    setExpanded(focusId);
    const t = window.setTimeout(() => {
      document
        .getElementById(`session-${focusId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(t);
  }, [focusId]);

  const filtered = useMemo(() => {
    let list = sessions
      .filter((s) => s.status === "completed" || s.status === "paused")
      .sort(
        (a, b) =>
          new Date(b.completedAt || b.startedAt).getTime() -
          new Date(a.completedAt || a.startedAt).getTime()
      );

    if (modeFilter !== "all") {
      list = list.filter((s) => s.mode === modeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.role.toLowerCase().includes(q) ||
          s.mode.toLowerCase().includes(q) ||
          s.companyStyle?.toLowerCase().includes(q) ||
          s.answers.some(
            (a) =>
              a.questionText.toLowerCase().includes(q) ||
              a.answerText.toLowerCase().includes(q)
          )
      );
    }
    return list;
  }, [sessions, modeFilter, search]);

  const handleExport = async (session: InterviewSession) => {
    if (session.answers.length === 0) {
      toast.error("Nothing to export yet for this session");
      return;
    }
    setExporting(session.id);
    try {
      await exportSessionReport(session, user);
      toast.success("PDF report downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(null);
    }
  };

  const modes = useMemo(() => {
    const set = new Set(sessions.map((s) => s.mode));
    return Array.from(set);
  }, [sessions]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">History & Reports</h1>
        <p className="mt-1 text-muted-foreground">
          Search and filter past interviews. Export PDF coaching reports.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 pr-9"
              placeholder="Search role, mode, or answer text…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search history"
            />
            {search && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={modeFilter === "all" ? "default" : "outline"}
              onClick={() => setModeFilter("all")}
            >
              All modes
            </Button>
            {modes.map((m) => (
              <Button
                key={m}
                size="sm"
                variant={modeFilter === m ? "default" : "outline"}
                onClick={() => setModeFilter(m)}
                className="capitalize"
              >
                {m}
              </Button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center py-16 text-center text-muted-foreground">
              <History className="mb-3 h-10 w-10 opacity-40" />
              <p>No sessions match your filters.</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/interview">
                  <Mic className="h-4 w-4" />
                  Start a mock interview
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 space-y-4">
            {filtered.map((session) => {
              const open = expanded === session.id;
              return (
                <Card
                  key={session.id}
                  id={`session-${session.id}`}
                  className={cn(
                    focusId === session.id && "ring-1 ring-primary/40"
                  )}
                >
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => setExpanded(open ? null : session.id)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{session.role}</CardTitle>
                        <CardDescription>
                          {session.mode}
                          {session.companyStyle
                            ? ` · ${session.companyStyle}`
                            : ""}
                          {session.untimed ? " · untimed" : ""} ·{" "}
                          {session.completedAt
                            ? formatDate(session.completedAt)
                            : formatDate(session.startedAt)}{" "}
                          · {session.answers.length} answers
                          {session.status === "paused" ? " · paused" : ""}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.overallScore != null && (
                          <Badge
                            variant="outline"
                            className={cn(scoreBg(session.overallScore ?? 0))}
                          >
                            {(session.overallScore ?? 0).toFixed(1)} / 10
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleExport(session);
                          }}
                          disabled={exporting === session.id}
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </Button>
                        {open ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {open && (
                    <CardContent className="space-y-8 border-t pt-6">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="gradient">
                          <Link
                            href={
                              isInterviewMode(session.mode)
                                ? `/interview/${session.mode}`
                                : "/interview"
                            }
                          >
                            <Play className="h-3.5 w-3.5" />
                            Practice this mode again
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href="/analytics">View analytics</Link>
                        </Button>
                      </div>
                      {session.answers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No answers recorded yet.{" "}
                          <Link
                            href={
                              isInterviewMode(session.mode)
                                ? `/interview/${session.mode}`
                                : "/interview"
                            }
                            className="font-medium text-primary hover:underline"
                          >
                            Start a new session
                          </Link>
                        </p>
                      ) : (
                        session.answers.map((a, i) => (
                          <div key={i} className="space-y-3">
                            <div>
                              <Badge variant="secondary">Q{i + 1}</Badge>
                              <p className="mt-2 font-medium">
                                {a.questionText}
                              </p>
                              <p className="mt-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                                {a.answerText}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Answered in {a.durationSeconds}s
                              </p>
                            </div>
                            <FeedbackPanel feedback={a.feedback} />
                          </div>
                        ))
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
