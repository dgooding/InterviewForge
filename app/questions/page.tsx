"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  BookOpen,
  Mic,
  Bookmark,
  X,
  Lightbulb,
  ListTree,
  MessageCircleQuestion,
  Sparkles,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  QUESTIONS,
  CATEGORIES,
  getQuestionCount,
  categoryToInterviewMode,
} from "@/lib/questions";
import type { InterviewQuestion } from "@/lib/types";
import {
  getBookmarkedQuestionIds,
  toggleBookmarkedQuestion,
} from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { casualTip, casualDifficulty } from "@/lib/voice";

/** Display-facing question shape (maps from bank data). */
export interface Question {
  id: string;
  text: string;
  tip: string;
  category:
    | "Behavioral"
    | "Technical"
    | "System Design"
    | "Leadership"
    | "Product"
    | "Situational"
    | "Company Culture";
  difficulty: "Easy" | "Medium" | "Hard";
  sampleAnswerOutline?: string;
  rawCategory: InterviewQuestion["category"];
}

const CATEGORY_LABEL: Record<InterviewQuestion["category"], Question["category"]> =
  {
    behavioral: "Behavioral",
    technical: "Technical",
    "system-design": "System Design",
    leadership: "Leadership",
    product: "Product",
    situational: "Situational",
    "company-culture": "Company Culture",
  };

const CATEGORY_CHIPS: { value: string; label: string }[] = [
  { value: "all", label: "All of 'em" },
  ...CATEGORIES.map((c) => ({
    value: c,
    label: CATEGORY_LABEL[c],
  })),
];

const DIFFICULTY_CHIPS: { value: string; label: string }[] = [
  { value: "all", label: "Any vibe" },
  { value: "easy", label: "Chill" },
  { value: "medium", label: "Solid" },
  { value: "hard", label: "Spicy" },
];

const CATEGORY_PILL: Record<string, string> = {
  behavioral:
    "bg-violet-500/15 text-violet-700 border-violet-500/25 dark:text-violet-300",
  technical:
    "bg-indigo-500/15 text-indigo-700 border-indigo-500/25 dark:text-indigo-300",
  "system-design":
    "bg-purple-500/15 text-purple-700 border-purple-500/25 dark:text-purple-300",
  leadership:
    "bg-fuchsia-500/15 text-fuchsia-700 border-fuchsia-500/25 dark:text-fuchsia-300",
  product:
    "bg-sky-500/15 text-sky-700 border-sky-500/25 dark:text-sky-300",
  situational:
    "bg-cyan-500/15 text-cyan-700 border-cyan-500/25 dark:text-cyan-300",
  "company-culture":
    "bg-blue-500/15 text-blue-700 border-blue-500/25 dark:text-blue-300",
};

const DIFFICULTY_PILL: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
  medium:
    "bg-amber-500/15 text-amber-800 border-amber-500/20 dark:text-amber-400",
  hard: "bg-rose-500/15 text-rose-700 border-rose-500/20 dark:text-rose-400",
};

function toDisplayQuestion(q: InterviewQuestion): Question {
  return {
    id: q.id,
    text: q.text,
    tip: casualTip(q.tips || defaultTip(q.category)),
    category: CATEGORY_LABEL[q.category],
    difficulty:
      q.difficulty === "easy"
        ? "Easy"
        : q.difficulty === "hard"
          ? "Hard"
          : "Medium",
    sampleAnswerOutline: q.sampleAnswerOutline,
    rawCategory: q.category,
  };
}

function displayDifficulty(d: Question["difficulty"]): string {
  return casualDifficulty(d.toLowerCase());
}

function defaultTip(category: InterviewQuestion["category"]): string {
  switch (category) {
    case "behavioral":
    case "leadership":
    case "situational":
      return "STAR it: Situation → Task → Action → Result. Numbers hit different.";
    case "technical":
      return "Clarify constraints, outline your approach, then trade-offs. Don't just yap.";
    case "system-design":
      return "Requirements first, sketch the boxes, then scale + failure modes.";
    case "product":
      return "Who's the user, what's the goal, which metrics, why this option.";
    case "company-culture":
      return "Be real — tie values to stuff you actually did.";
    default:
      return "Lead with the point, then proof. Keep it tight.";
  }
}

function structureTips(category: InterviewQuestion["category"]): string[] {
  switch (category) {
    case "behavioral":
    case "leadership":
    case "situational":
      return [
        "Situation — set the scene in 1–2 sentences",
        "Task — what you actually owned",
        "Action — what YOU did (not the team, you)",
        "Result — numbers + what you learned",
      ];
    case "technical":
      return [
        "Restate the problem + constraints",
        "Sketch 1–2 approaches before diving deep",
        "Drop complexity (time/space) when it matters",
        "Call out edge cases + how you'd test",
      ];
    case "system-design":
      return [
        "Requirements (functional + non-functional)",
        "High-level design (clients, services, data)",
        "Deep dive on bottlenecks + scale",
        "Trade-offs, monitoring, recovery",
      ];
    case "product":
      return [
        "Who's the user and what job are they hiring this for?",
        "Success metrics (north star + guardrails)",
        "Options you considered + why this one",
        "Rollout, risks, how you'd iterate",
      ];
    default:
      return [
        "Lead with a clear thesis",
        "Back it with one real example",
        "Close with impact or a sharp question",
      ];
  }
}

function followUps(q: Question): string[] {
  return [
    `Can you go deeper on the biggest decision in: “${q.text.slice(0, 60)}${q.text.length > 60 ? "…" : ""}”?`,
    "What would you do different now that you know more?",
    "How'd you measure success, and who fought you on it?",
  ];
}

export default function QuestionsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [selected, setSelected] = useState<Question | null>(null);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  useEffect(() => {
    setBookmarks(getBookmarkedQuestionIds());
  }, []);

  const bank: Question[] = useMemo(
    () => QUESTIONS.map(toDisplayQuestion),
    []
  );

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return bank.filter((q) => {
      if (showBookmarksOnly && !bookmarks.includes(q.id)) return false;
      if (category !== "all" && q.rawCategory !== category) return false;
      if (difficulty !== "all" && q.difficulty.toLowerCase() !== difficulty)
        return false;
      if (s) {
        const hay = `${q.text} ${q.tip} ${q.category} ${q.id}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [bank, search, category, difficulty, showBookmarksOnly, bookmarks]);

  const onToggleBookmark = useCallback(
    (id: string, e?: { stopPropagation: () => void; preventDefault: () => void }) => {
      e?.stopPropagation();
      e?.preventDefault();
      const next = toggleBookmarkedQuestion(id);
      setBookmarks(next);
      toast.message(
        next.includes(id) ? "Saved — bet" : "Unsaved",
        { id: `bm-${id}`, duration: 1800 }
      );
    },
    []
  );

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setDifficulty("all");
    setShowBookmarksOnly(false);
  };

  const practiceHref = (q: Question) => {
    const mode = categoryToInterviewMode(q.rawCategory);
    return `/interview/${mode}?q=${encodeURIComponent(q.id)}&autostart=1`;
  };

  // Close modal on Escape
  useEffect(() => {
    if (!selected) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  useEffect(() => {
    if (selected) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [selected]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Soft indigo ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl dark:bg-indigo-500/15" />
        <div className="absolute -right-24 top-40 h-80 w-80 rounded-full bg-violet-600/15 blur-3xl dark:bg-violet-500/10" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" />
                InterviewForge library
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
                  Question Bank
                </span>
              </h1>
              <p className="mt-2 max-w-xl text-muted-foreground">
                {getQuestionCount()}+ prompts loaded — filter, search, then
                practice. lowkey stacked.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur">
                <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                {filtered.length} question{filtered.length === 1 ? "" : "s"}{" "}
                showing
              </span>
              <Button asChild size="sm" variant="gradient" className="shadow-glow">
                <Link
                  href={
                    category !== "all"
                      ? `/interview/${categoryToInterviewMode(
                          category as
                            | "behavioral"
                            | "technical"
                            | "system-design"
                            | "leadership"
                            | "product"
                            | "situational"
                            | "company-culture"
                        )}?category=${encodeURIComponent(category)}&autostart=1`
                      : "/interview/mixed"
                  }
                >
                  <Mic className="h-4 w-4" />
                  Start a mock
                </Link>
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions…"
              aria-label="Search questions"
              className="h-12 rounded-2xl border-indigo-500/20 bg-card/90 pl-11 pr-10 text-base shadow-sm backdrop-blur transition-shadow focus-visible:border-indigo-500/40 focus-visible:shadow-glow"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="mt-5">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Filter className="h-3 w-3" />
              Categories
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_CHIPS.map((chip) => {
                const active = category === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setCategory(chip.value)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25"
                        : "border-border/80 bg-card/60 text-muted-foreground hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-foreground"
                    )}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty chips */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Difficulty
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {DIFFICULTY_CHIPS.map((chip) => {
                const active = difficulty === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setDifficulty(chip.value)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
                      active
                        ? chip.value === "easy"
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : chip.value === "medium"
                            ? "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300"
                            : chip.value === "hard"
                              ? "border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              : "border-transparent bg-secondary text-secondary-foreground"
                        : "border-border/80 bg-card/60 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    {chip.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowBookmarksOnly((v) => !v)}
                className={cn(
                  "ml-1 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                  showBookmarksOnly
                    ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300"
                    : "border-border/80 bg-card/60 text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Bookmark
                  className={cn(
                    "h-3.5 w-3.5",
                    showBookmarksOnly && "fill-current"
                  )}
                />
                Saved ({bookmarks.length})
              </button>
            </div>
          </div>
        </motion.header>

        {/* Cards grid */}
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            <motion.div
              layout
              className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2"
            >
              {filtered.map((q, i) => {
                const bookmarked = bookmarks.includes(q.id);
                return (
                  <motion.article
                    key={q.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{
                      duration: 0.25,
                      delay: Math.min(i * 0.02, 0.25),
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(q)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(q);
                      }
                    }}
                    className={cn(
                      "group relative cursor-pointer rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm",
                      "transition-all duration-200",
                      "hover:-translate-y-0.5 hover:border-indigo-500/35 hover:shadow-lg hover:shadow-indigo-500/10",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                    )}
                  >
                    <span className="absolute right-4 top-4 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
                      ID: {q.id}
                    </span>

                    <button
                      type="button"
                      aria-label={
                        bookmarked ? "Remove bookmark" : "Save question"
                      }
                      onClick={(e) => onToggleBookmark(q.id, e)}
                      className={cn(
                        "absolute right-4 top-10 rounded-lg p-1.5 transition-colors",
                        bookmarked
                          ? "text-indigo-500 hover:bg-indigo-500/10"
                          : "text-muted-foreground opacity-60 hover:bg-muted hover:opacity-100 group-hover:opacity-100"
                      )}
                    >
                      <Bookmark
                        className={cn(
                          "h-4 w-4",
                          bookmarked && "fill-indigo-500"
                        )}
                      />
                    </button>

                    <div className="mb-3 flex flex-wrap gap-1.5 pr-16">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                          CATEGORY_PILL[q.rawCategory]
                        )}
                      >
                        {q.category}
                      </span>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                          DIFFICULTY_PILL[q.difficulty.toLowerCase()]
                        )}
                      >
                        {displayDifficulty(q.difficulty)}
                      </span>
                    </div>

                    <h2 className="pr-8 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                      {q.text}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      <span className="font-medium text-indigo-600/80 dark:text-indigo-400/90">
                        Quick tip:{" "}
                      </span>
                      {q.tip}
                    </p>

                    <div
                      className="mt-4 flex flex-wrap items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button asChild size="sm" variant="gradient" className="h-8">
                        <Link href={practiceHref(q)}>
                          <Mic className="h-3.5 w-3.5" />
                          Practice
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-indigo-500/20"
                        type="button"
                        onClick={() => setSelected(q)}
                      >
                        Details
                      </Button>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-indigo-500/25 bg-card/40 px-6 py-20 text-center"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Nothing matched, ngl</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try different words or clear the filters. It&apos;s fine.
              </p>
              <Button
                className="mt-6"
                variant="outline"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              aria-label="Close details"
              onClick={() => setSelected(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="question-modal-title"
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-indigo-500/20 bg-card shadow-2xl sm:rounded-3xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-indigo-600/10 via-violet-600/10 to-transparent px-5 py-4">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <Badge
                      className={cn(
                        "border font-semibold",
                        CATEGORY_PILL[selected.rawCategory]
                      )}
                      variant="outline"
                    >
                      {selected.category}
                    </Badge>
                    <Badge
                      className={cn(
                        "border font-semibold",
                        DIFFICULTY_PILL[selected.difficulty.toLowerCase()]
                      )}
                      variant="outline"
                    >
                      {displayDifficulty(selected.difficulty)}
                    </Badge>
                    <span className="self-center text-[10px] font-mono text-muted-foreground">
                      ID: {selected.id}
                    </span>
                  </div>
                  <h2
                    id="question-modal-title"
                    className="text-lg font-semibold leading-snug"
                  >
                    {selected.text}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                <section>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                    <Lightbulb className="h-4 w-4" />
                    Quick tip
                  </h3>
                  <p className="text-sm text-muted-foreground">{selected.tip}</p>
                </section>

                <section>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                    <ListTree className="h-4 w-4" />
                    How to structure it
                  </h3>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {structureTips(selected.rawCategory).map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </section>

                {selected.sampleAnswerOutline && (
                  <section>
                    <h3 className="mb-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                      Outline to riff on
                    </h3>
                    <p className="whitespace-pre-wrap rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                      {selected.sampleAnswerOutline}
                    </p>
                  </section>
                )}

                <section>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                    <MessageCircleQuestion className="h-4 w-4" />
                    They might follow up with
                  </h3>
                  <ul className="space-y-2">
                    {followUps(selected).map((f) => (
                      <li
                        key={f}
                        className="rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm text-muted-foreground"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border/60 bg-card px-5 py-4">
                <Button asChild variant="gradient" className="flex-1 sm:flex-none">
                  <Link href={practiceHref(selected)}>
                    <Mic className="h-4 w-4" />
                    Practice this one
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onToggleBookmark(selected.id)}
                >
                  <Bookmark
                    className={cn(
                      "h-4 w-4",
                      bookmarks.includes(selected.id) &&
                        "fill-indigo-500 text-indigo-500"
                    )}
                  />
                  {bookmarks.includes(selected.id) ? "Saved" : "Save"}
                </Button>
                <Button asChild variant="ghost">
                  <Link
                    href={`/interview/${categoryToInterviewMode(selected.rawCategory)}`}
                  >
                    Open simulator
                  </Link>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
