"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Building2,
  FileText,
  Layers,
  Mic,
  Network,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers";
import { INTERVIEW_MODES, isInterviewMode } from "@/components/interview/interview-simulator";
import {
  categoryToInterviewMode,
  getQuestionById,
} from "@/lib/questions";
import { searchRoles } from "@/lib/roles";
import type { InterviewQuestion } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleSearch } from "@/components/role-search";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MODE_ICONS: Record<string, LucideIcon> = {
  behavioral: Target,
  technical: Sparkles,
  "system-design": Network,
  mixed: Layers,
  company: Building2,
  jd: FileText,
};

/**
 * Mock Interview hub — role selection + mode cards.
 * Each mode navigates to a dedicated practice route: /interview/[mode]
 */
export default function InterviewHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedRole, setSelectedRole } = useApp();

  // Legacy / deep-link redirects: ?mode=, ?q=, ?category=
  useEffect(() => {
    const mode = searchParams.get("mode");
    const q = searchParams.get("q") || searchParams.get("question");
    const category = searchParams.get("category");
    const autostart = searchParams.get("autostart");
    const difficulty = searchParams.get("difficulty");

    let targetMode: string | null = null;
    if (mode && isInterviewMode(mode)) targetMode = mode;
    else if (q) {
      const question = getQuestionById(q);
      if (question) targetMode = categoryToInterviewMode(question.category);
    } else if (category) {
      targetMode = categoryToInterviewMode(
        category as InterviewQuestion["category"]
      );
    }

    if (!targetMode) return;

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (difficulty) params.set("difficulty", difficulty);
    if (autostart) params.set("autostart", autostart);
    const qs = params.toString();
    router.replace(`/interview/${targetMode}${qs ? `?${qs}` : ""}`);
  }, [searchParams, router]);

  const activeRole = selectedRole || "Software Engineer";

  const chipRoles = useMemo(() => searchRoles("", 8), []);

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">
              <Mic className="h-3.5 w-3.5" />
              Live practice
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
                Mock Interview Simulator
              </span>
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Pick a role and mode, then answer timed questions with text or
              voice. Progress saves automatically on this device.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/questions">Question bank</Link>
          </Button>
        </div>

        {/* Role selection */}
        <section className="mt-8 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Target role</p>
            <p className="text-xs text-muted-foreground">
              Active:{" "}
              <span className="font-semibold text-foreground">{activeRole}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {chipRoles.map((r) => {
              const active = selectedRole === r.title;
              return (
                <Button
                  key={r.id}
                  size="sm"
                  type="button"
                  variant={active ? "default" : "outline"}
                  className={cn(
                    active &&
                      "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/20"
                  )}
                  onClick={() => {
                    setSelectedRole(r.title);
                    toast.success(`Role set: ${r.title}`, {
                      id: "role-set",
                      duration: 1800,
                    });
                  }}
                >
                  {r.title}
                </Button>
              );
            })}
            <Button size="sm" type="button" variant="ghost" asChild>
              <Link href="/roles">
                <Briefcase className="h-3.5 w-3.5" />
                Browse all roles
              </Link>
            </Button>
          </div>
          <RoleSearch
            value={activeRole}
            onSelect={(title) => {
              setSelectedRole(title);
              toast.success(`Role set: ${title}`, {
                id: "role-set",
                duration: 1800,
              });
            }}
            placeholder="Search roles (IT Service Desk, Frontend…)"
          />
        </section>

        {/* Mode cards → dedicated routes */}
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Choose a practice mode
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {INTERVIEW_MODES.map((m, i) => {
              const Icon = MODE_ICONS[m.id] || Mic;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link href={m.href} className="block h-full">
                    <Card
                      className={cn(
                        "h-full cursor-pointer border-border/70 transition-all duration-200",
                        "hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10"
                      )}
                    >
                      <CardHeader className="pb-2">
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="flex items-center justify-between gap-2 text-base">
                          {m.label}
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </CardTitle>
                        <CardDescription>{m.desc}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between">
                        <Badge variant="secondary">{m.count} questions</Badge>
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                          Open session →
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-3">
          <QuickLink href="/questions" label="Question bank" desc="212+ prompts" />
          <QuickLink href="/history" label="History" desc="Past sessions" />
          <QuickLink href="/analytics" label="Analytics" desc="Scores & trends" />
        </section>
      </motion.div>
    </div>
  );
}

function QuickLink({
  href,
  label,
  desc,
}: {
  href: string;
  label: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 transition-colors hover:border-indigo-500/30 hover:bg-indigo-500/5"
    >
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}
