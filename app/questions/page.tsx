"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  Mic,
  ArrowRight,
  Layers,
  ExternalLink,
} from "lucide-react";
import {
  QUESTIONS,
  CATEGORIES,
  getQuestionCount,
  categoryToInterviewMode,
} from "@/lib/questions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function QuestionsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");

  const filtered = useMemo(() => {
    return QUESTIONS.filter((q) => {
      if (category !== "all" && q.category !== category) return false;
      if (difficulty !== "all" && q.difficulty !== difficulty) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        if (
          !q.text.toLowerCase().includes(s) &&
          !q.category.includes(s) &&
          !q.id.includes(s)
        )
          return false;
      }
      return true;
    });
  }, [search, category, difficulty]);

  const categoryPracticeHref =
    category !== "all"
      ? `/interview?category=${encodeURIComponent(category)}&autostart=1`
      : "/interview?mode=mixed";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Question Bank</h1>
            <p className="mt-1 text-muted-foreground">
              {getQuestionCount()}+ pre-loaded questions — filter, search, and
              practice with one click.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {filtered.length} shown
            </Badge>
            <Button asChild size="sm" variant="gradient">
              <Link href={categoryPracticeHref}>
                <Mic className="h-4 w-4" />
                {category === "all"
                  ? "Start mixed mock"
                  : `Practice ${category}`}
              </Link>
            </Button>
          </div>
        </div>

        <Card className="mt-6 border-primary/15 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <Layers className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  How to use this bank
                </p>
                <p className="text-muted-foreground">
                  Open any question for tips and outlines, practice that prompt
                  alone, or run a full mock interview for the category.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/interview">Full simulator</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/roles">Pick a role</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search questions"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={category === "all" ? "default" : "outline"}
              onClick={() => setCategory("all")}
            >
              All categories
            </Button>
            {CATEGORIES.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={category === c ? "default" : "outline"}
                onClick={() => setCategory(c)}
                className="capitalize"
              >
                {c}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "easy", "medium", "hard"].map((d) => (
              <Button
                key={d}
                size="sm"
                variant={difficulty === d ? "secondary" : "ghost"}
                onClick={() => setDifficulty(d)}
                className="capitalize"
              >
                {d === "all" ? "All levels" : d}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {filtered.map((q, i) => {
            const mode = categoryToInterviewMode(q.category);
            const practiceHref = `/interview?q=${encodeURIComponent(q.id)}&autostart=1`;
            const categoryHref = `/interview?category=${encodeURIComponent(q.category)}&autostart=1`;
            const detailHref = `/questions/${encodeURIComponent(q.id)}`;

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.3) }}
              >
                <Card className="transition-shadow hover:border-primary/25 hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="text-base font-medium leading-snug">
                        <Link
                          href={detailHref}
                          className="hover:text-primary hover:underline"
                        >
                          {q.text}
                        </Link>
                      </CardTitle>
                      <div className="flex shrink-0 flex-wrap gap-1">
                        <Badge variant="outline" className="capitalize">
                          {q.category}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "capitalize",
                            q.difficulty === "hard" &&
                              "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                            q.difficulty === "medium" &&
                              "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                            q.difficulty === "easy" &&
                              "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          )}
                        >
                          {q.difficulty}
                        </Badge>
                        {q.companyStyle && (
                          <Badge variant="outline" className="capitalize">
                            {q.companyStyle}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {q.tips && (
                      <CardDescription>Tip: {q.tips}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      ID: {q.id}
                      {q.mode && q.mode !== "all" ? ` · mode ${q.mode}` : ""}
                      {` · simulator ${mode}`}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="gradient">
                        <Link href={practiceHref}>
                          <Mic className="h-3.5 w-3.5" />
                          Practice this
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={detailHref}>
                          Details
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={categoryHref} className="capitalize">
                          <ExternalLink className="h-3.5 w-3.5" />
                          More {q.category}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed py-12 text-center">
              <p className="text-muted-foreground">
                No questions match your filters.
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setDifficulty("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
