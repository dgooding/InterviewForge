"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen } from "lucide-react";
import { QUESTIONS, CATEGORIES, getQuestionCount } from "@/lib/questions";
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Question Bank</h1>
            <p className="mt-1 text-muted-foreground">
              {getQuestionCount()}+ pre-loaded questions — filter, search, and
              practice.
            </p>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {filtered.length} shown
          </Badge>
        </div>

        <div className="mt-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          {filtered.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.3) }}
            >
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-base font-medium leading-snug">
                      {q.text}
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
                <CardContent>
                  <p className="text-xs text-muted-foreground">ID: {q.id}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              No questions match your filters.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
