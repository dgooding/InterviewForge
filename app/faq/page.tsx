"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FAQS = [
  {
    q: "Do I need an account?",
    a: "No. Guest mode works fully. Progress stays in your browser until you optionally sign in to sync across devices.",
    href: "/login",
    cta: "Sign in options",
  },
  {
    q: "Is my interview data private?",
    a: "Yes. Anonymous progress never leaves your device. Cloud data is isolated per user with row-level security. Export or delete everything in Settings.",
    href: "/privacy",
    cta: "Read privacy",
  },
  {
    q: "How does AI feedback work without an API key?",
    a: "A local coaching engine scores clarity, STAR structure, relevance, technical depth, and confidence. With XAI_API_KEY configured, Grok can enhance feedback.",
    href: "/interview",
    cta: "Try a mock interview",
  },
  {
    q: "Can I practice with voice?",
    a: "Yes on supported browsers (Chrome/Edge). Use Record answer during a mock interview. You can always type instead.",
    href: "/interview/behavioral",
    cta: "Open behavioral practice",
  },
  {
    q: "What is ATS score on resume analysis?",
    a: "A transparent local heuristic estimating how keyword- and impact-friendly your resume looks — not a guarantee from any employer system.",
    href: "/resume",
    cta: "Analyze resume",
  },
  {
    q: "Where is the question bank?",
    a: "Browse 200+ prompts, filter by category and difficulty, bookmark favorites, and practice any question in the simulator.",
    href: "/questions",
    cta: "Open question bank",
  },
  {
    q: "Keyboard shortcuts?",
    a: "Press ? anywhere (outside text fields). Use g then d/i/r/h/s/a/q for Dashboard, Interview, Resume, History, Settings, Analytics, or Questions.",
    href: "/dashboard",
    cta: "Go to dashboard",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">FAQ</h1>
        <p className="mt-1 text-muted-foreground">
          Quick answers about InterviewForge.
        </p>
        <div className="mt-8 space-y-4">
          {FAQS.map((f) => (
            <Card key={f.q} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{f.q}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{f.a}</p>
                <Button asChild size="sm" variant="outline">
                  <Link href={f.href}>{f.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild variant="gradient">
            <Link href="/interview">Start practice</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings">Settings & privacy</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
