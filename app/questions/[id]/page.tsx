"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mic,
  BookOpen,
  Lightbulb,
  ListTree,
  Layers,
} from "lucide-react";
import {
  getQuestionById,
  getRelatedQuestions,
  categoryToInterviewMode,
} from "@/lib/questions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function QuestionDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const question = useMemo(() => (id ? getQuestionById(id) : undefined), [id]);
  const related = useMemo(
    () => (question ? getRelatedQuestions(question, 6) : []),
    [question]
  );

  if (!id || !question) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Question not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That ID is not in the bank. Browse the full list instead.
        </p>
        <Button asChild className="mt-6" variant="gradient">
          <Link href="/questions">Question bank</Link>
        </Button>
      </div>
    );
  }

  const mode = categoryToInterviewMode(question.category);
  const practiceHref = `/interview?q=${encodeURIComponent(question.id)}&autostart=1`;
  const categoryHref = `/interview?category=${encodeURIComponent(question.category)}&autostart=1`;
  const modeHref = `/interview?mode=${encodeURIComponent(mode)}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/questions">
            <ArrowLeft className="h-4 w-4" />
            Back to question bank
          </Link>
        </Button>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="capitalize">
            {question.category}
          </Badge>
          <Badge
            variant="secondary"
            className={cn(
              "capitalize",
              question.difficulty === "hard" &&
                "bg-rose-500/15 text-rose-600 dark:text-rose-400",
              question.difficulty === "medium" &&
                "bg-amber-500/15 text-amber-700 dark:text-amber-400",
              question.difficulty === "easy" &&
                "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
            )}
          >
            {question.difficulty}
          </Badge>
          {question.companyStyle && (
            <Badge variant="outline" className="capitalize">
              {question.companyStyle}
            </Badge>
          )}
          <Badge variant="secondary">ID {question.id}</Badge>
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          {question.text}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Practice this prompt in the simulator, review coaching tips, then try
          related questions in the same category.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="gradient">
            <Link href={practiceHref}>
              <Mic className="h-4 w-4" />
              Practice this question
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={categoryHref} className="capitalize">
              <Layers className="h-4 w-4" />
              Full {question.category} set
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={modeHref}>
              Open {mode} simulator
            </Link>
          </Button>
        </div>

        {question.tips && (
          <Card className="mt-8 border-primary/15">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4 text-primary" />
                Coaching tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{question.tips}</p>
            </CardContent>
          </Card>
        )}

        {question.sampleAnswerOutline && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListTree className="h-4 w-4 text-primary" />
                Answer outline
              </CardTitle>
              <CardDescription>
                Structure to adapt — not a script to memorize.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {question.sampleAnswerOutline}
              </p>
            </CardContent>
          </Card>
        )}

        {!question.tips && !question.sampleAnswerOutline && (
          <Card className="mt-8">
            <CardContent className="flex gap-3 p-4 text-sm text-muted-foreground">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                Use STAR (Situation, Task, Action, Result) for behavioral
                prompts, or clarify requirements → approach → trade-offs for
                technical ones. Start a practice session to get scored feedback.
              </p>
            </CardContent>
          </Card>
        )}

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Related questions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Same category — good follow-ups after you nail this one.
            </p>
            <ul className="mt-4 space-y-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Link
                          href={`/questions/${r.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {r.text}
                        </Link>
                        <p className="mt-1 text-xs capitalize text-muted-foreground">
                          {r.difficulty} · {r.id}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/questions/${r.id}`}>Open</Link>
                        </Button>
                        <Button asChild size="sm" variant="gradient">
                          <Link
                            href={`/interview?q=${encodeURIComponent(r.id)}&autostart=1`}
                          >
                            Practice
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
          <Button asChild variant="outline">
            <Link href="/questions">All questions</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/history">Session history</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/analytics">Analytics</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
