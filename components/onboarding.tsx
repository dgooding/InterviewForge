"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, FileText, BarChart3, Cloud, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers";

const STEPS = [
  {
    icon: Mic,
    title: "Practice with real mock interviews",
    body: "Timed or untimed rounds, voice or text, with instant coaching feedback.",
  },
  {
    icon: FileText,
    title: "Turn your resume into talking points",
    body: "Upload a PDF for strengths, ATS tips, and sample answers you can practice.",
  },
  {
    icon: BarChart3,
    title: "Track progress over time",
    body: "Scores, streaks, and history stay on this device by default.",
  },
  {
    icon: Cloud,
    title: "Optional cloud sync",
    body: "Sign in with Google only when you want the same progress on another device.",
  },
];

const KEY = "if_onboarding_done";

export function OnboardingModal() {
  const { hydrated } = useApp();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      /* ignore */
    }
  }, [hydrated]);

  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const next = () => {
    if (step >= STEPS.length - 1) close();
    else setStep((s) => s + 1);
  };

  const S = STEPS[step];
  const Icon = S.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-glow"
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Close onboarding"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium text-primary">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 id="onboarding-title" className="mt-1 text-xl font-bold">
              {S.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{S.body}</p>

            <div className="mt-4 flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${
                    i <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="gradient" onClick={next} className="flex-1">
                {step >= STEPS.length - 1 ? "Get started" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              {step >= STEPS.length - 1 && (
                <Button asChild variant="outline" onClick={close}>
                  <Link href="/interview">Start interview</Link>
                </Button>
              )}
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Tips: press{" "}
              <kbd className="rounded border border-border px-1">?</kbd> for
              keyboard shortcuts later
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
