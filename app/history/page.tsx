"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Download, History, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers";
import { exportSessionReport } from "@/lib/pdf-report";
import { formatDate, scoreBg, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FeedbackPanel } from "@/components/feedback-panel";
import type { InterviewSession } from "@/lib/types";

export default function HistoryPage() {
  const { sessions, user } = useApp();
  const searchParams = useSearchParams();
  const focusId = searchParams.get("id");

  const completed = useMemo(
    () =>
      sessions
        .filter((s) => s.status === "completed")
        .sort(
          (a, b) =>
            new Date(b.completedAt || b.startedAt).getTime() -
            new Date(a.completedAt || a.startedAt).getTime()
        ),
    [sessions]
  );

  const [expanded, setExpanded] = useState<string | null>(
    focusId || completed[0]?.id || null
  );
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (session: InterviewSession) => {
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">History & Reports</h1>
        <p className="mt-1 text-muted-foreground">
          Review past interviews and export PDF coaching reports.
        </p>

        {completed.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
              <History className="mb-3 h-10 w-10 opacity-40" />
              <p>No completed sessions yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 space-y-4">
            {completed.map((session) => {
              const open = expanded === session.id;
              return (
                <Card
                  key={session.id}
                  className={cn(
                    focusId === session.id && "ring-1 ring-primary/40"
                  )}
                >
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() =>
                      setExpanded(open ? null : session.id)
                    }
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">
                          {session.role}
                        </CardTitle>
                        <CardDescription>
                          {session.mode}
                          {session.companyStyle
                            ? ` · ${session.companyStyle}`
                            : ""}{" "}
                          ·{" "}
                          {session.completedAt
                            ? formatDate(session.completedAt)
                            : formatDate(session.startedAt)}{" "}
                          · {session.answers.length} answers
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(scoreBg(session.overallScore ?? 0))}
                        >
                          {(session.overallScore ?? 0).toFixed(1)} / 10
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport(session);
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
                      {session.answers.map((a, i) => (
                        <div key={i} className="space-y-3">
                          <div>
                            <Badge variant="secondary">Q{i + 1}</Badge>
                            <p className="mt-2 font-medium">{a.questionText}</p>
                            <p className="mt-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                              {a.answerText}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Answered in {a.durationSeconds}s
                            </p>
                          </div>
                          <FeedbackPanel feedback={a.feedback} />
                        </div>
                      ))}
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
