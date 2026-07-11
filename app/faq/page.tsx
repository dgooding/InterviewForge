"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FAQS = [
  {
    q: "Do I need an account?",
    a: "No. Guest mode works fully. Progress stays in your browser until you optionally sign in with Google or GitHub to sync across devices.",
  },
  {
    q: "Is my interview data private?",
    a: "Yes. Anonymous progress never leaves your device. Cloud data is isolated per user with row-level security. You can export or delete everything in Settings.",
  },
  {
    q: "How does AI feedback work without an API key?",
    a: "A local coaching engine scores clarity, STAR structure, relevance, technical depth, and confidence. With XAI_API_KEY configured, Grok enhances feedback quality.",
  },
  {
    q: "Can I practice with voice?",
    a: "Yes on supported browsers (Chrome/Edge). Use Record answer during a mock interview. You can always type instead.",
  },
  {
    q: "What is ATS score on resume analysis?",
    a: "A transparent local heuristic estimating how keyword- and impact-friendly your resume looks — not a guarantee from any employer system.",
  },
  {
    q: "Keyboard shortcuts?",
    a: "Press ? anywhere (outside text fields). Use g then d/i/r/h/s to jump to Dashboard, Interview, Resume, History, or Settings.",
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
            <Card key={f.q}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{f.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
