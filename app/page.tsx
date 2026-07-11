"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Target,
  Mic,
  BarChart3,
  FileText,
  Zap,
  Star,
  ArrowRight,
  CheckCircle2,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/components/providers";
import { getQuestionCount } from "@/lib/questions";

const features = [
  {
    icon: Mic,
    title: "Live Mock Interviews",
    desc: "Timed questions with text or voice input and instant AI scoring.",
    href: "/mock-interview",
    cta: "Start a mock interview",
  },
  {
    icon: Target,
    title: "Role-Tailored Prep",
    desc: "Software eng, PM, data, design, sales — or any custom role.",
    href: "/roles",
    cta: "Choose your target role",
  },
  {
    icon: FileText,
    title: "Resume Intelligence",
    desc: "Upload a PDF and get strengths plus interview talking points.",
    href: "/analyze-resume",
    cta: "Analyze your resume",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    desc: "Trends across clarity, technical depth, and confidence.",
    href: "/analytics",
    cta: "View your analytics",
  },
  {
    icon: Zap,
    title: "Company Styles",
    desc: "Practice Google, Meta, Amazon LP, Apple, Microsoft, and startup formats.",
    href: "/interview/company",
    cta: "Practice company styles",
  },
  {
    icon: Sparkles,
    title: "Actionable Feedback",
    desc: "STAR coaching, sample answers, key phrases, and follow-ups.",
    href: "/history",
    cta: "See feedback & reports",
  },
];

const testimonials = [
  {
    name: "Alex Rivera",
    role: "SWE @ FAANG",
    quote:
      "InterviewForge turned vague 'practice more' into a weekly system. My behavioral scores jumped in two weeks.",
    stars: 5,
  },
  {
    name: "Priya Shah",
    role: "Product Manager",
    quote:
      "The company-specific modes and STAR feedback felt like a real coach. I walked into onsite loops calmer.",
    stars: 5,
  },
  {
    name: "Jordan Lee",
    role: "Data Scientist",
    quote:
      "Resume analysis + question bank was a killer combo. Perfect portfolio piece energy — and actually useful.",
    stars: 5,
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useApp();
  const qCount = getQuestionCount();

  return (
    <div className="relative">
      {/* Top bar for landing */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild variant="gradient" size="sm">
          <Link href="/dashboard">Open app</Link>
        </Button>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Badge
            variant="secondary"
            className="mb-6 gap-1.5 px-3 py-1.5 text-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            AI-Powered Interview Coaching
          </Badge>
          <p className="mb-4 text-lg font-semibold tracking-tight text-violet-400 sm:text-xl">
            Dave are you shitting me?
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Master Any Interview{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
              with AI
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
            InterviewForge is your personal coach for behavioral, technical, and
            company-specific interviews — with instant scoring, STAR feedback,
            and analytics that show real progress.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" variant="gradient" className="gap-2">
              <Link href="/dashboard">
                Start free prep
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/interview">Mock interview</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/login">Sign in to sync</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            {qCount}+ questions · Guest mode works offline · Optional Google sync
          </p>
        </motion.div>

        {/* Feature preview cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-16 grid gap-4 sm:grid-cols-3"
        >
          {[
            {
              label: "Avg. practice score lift",
              value: "+2.4 pts",
              href: "/analytics",
            },
            {
              label: "Question bank",
              value: `${qCount}+`,
              href: "/questions",
            },
            {
              label: "Feedback latency",
              value: "<1s*",
              href: "/interview",
            },
          ].map((stat) => (
            <Link key={stat.label} href={stat.href} className="block">
              <Card className="h-full border-primary/10 bg-card/60 backdrop-blur transition-all hover:border-primary/40 hover:shadow-glow">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="border-y border-border/50 bg-card/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to walk in ready
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built like a polished SaaS — designed to impress and actually help
              you prep.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={f.href} className="group block h-full">
                  <Card className="h-full transition-all hover:border-primary/40 hover:shadow-glow">
                    <CardContent className="flex h-full flex-col pt-6">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-primary transition-transform group-hover:scale-105">
                        <f.icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold group-hover:text-primary">
                        {f.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm text-muted-foreground">
                        {f.desc}
                      </p>
                      <p className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                        {f.cta}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Loved by candidates leveling up
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="bg-card/70">
                <CardContent className="pt-6">
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-4">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-indigo-600/10 via-violet-600/10 to-transparent">
            <CardContent className="flex flex-col items-center gap-6 px-8 py-12 text-center sm:px-16">
              <h2 className="text-3xl font-bold">
                Your next offer starts with better practice
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Instant AI feedback on every answer",
                  "Progress saved locally (Supabase-ready)",
                  "Export PDF reports for reflection",
                ].map((item) => (
                  <li key={item} className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" variant="gradient">
                <Link href="/dashboard">
                  Start Free Prep
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                *Local heuristic engine is instant; xAI-enhanced feedback depends
                on network.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <nav className="mb-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
          {[
            ["/dashboard", "Dashboard"],
            ["/interview", "Interview"],
            ["/questions", "Questions"],
            ["/roles", "Roles"],
            ["/resume", "Resume"],
            ["/login", "Sign in"],
            ["/faq", "FAQ"],
            ["/privacy", "Privacy"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="hover:text-primary transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <p>
          © {new Date().getFullYear()} InterviewForge · Built as a production-grade
          proof of concept
        </p>
      </footer>
    </div>
  );
}
