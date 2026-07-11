"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  Quote,
  Sparkles,
  MessageSquareQuote,
} from "lucide-react";
import type { AIFeedback } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { scoreBg, cn } from "@/lib/utils";

export function FeedbackPanel({ feedback }: { feedback: AIFeedback }) {
  const metrics = [
    { label: "Clarity", value: feedback.scores.clarity },
    { label: "Relevance", value: feedback.scores.relevance },
    { label: "Structure / STAR", value: feedback.scores.structure },
    { label: "Technical", value: feedback.scores.technicalAccuracy },
    { label: "Confidence", value: feedback.scores.confidence },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-r from-indigo-600/10 to-violet-600/10 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
              <p className="text-3xl font-bold tracking-tight">
                {feedback.scores.overall}
                <span className="text-lg text-muted-foreground">/10</span>
              </p>
            </div>
            <Badge
              className={cn("text-sm px-3 py-1", scoreBg(feedback.scores.overall))}
              variant="outline"
            >
              {feedback.summary}
            </Badge>
          </div>
        </div>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          {metrics.map((m) => (
            <div key={m.label} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{m.label}</span>
                <span className="font-semibold">{m.value}</span>
              </div>
              <Progress value={m.value * 10} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Improvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.improvements.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Quote className="h-4 w-4 text-primary" />
            Sample Better Answer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {feedback.sampleBetterAnswer}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-violet-500" />
            Key Phrases to Use
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {feedback.keyPhrases.map((p, i) => (
            <Badge key={i} variant="secondary" className="font-normal">
              {p}
            </Badge>
          ))}
        </CardContent>
      </Card>

      {feedback.followUpQuestion && (
        <Card className="border-dashed border-primary/40 bg-primary/5">
          <CardContent className="flex gap-3 pt-6">
            <MessageSquareQuote className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Follow-up from interviewer</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {feedback.followUpQuestion}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
