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
    title: "Fake interviews that feel real",
    desc: "Timer's optional. Type or talk. We score you right after — no waiting around.",
    href: "/mock-interview",
    cta: "Bet, let's practice",
  },
  {
    icon: Target,
    title: "Pick the job you're chasing",
    desc: "SWE, PM, help desk, sales… whatever. We stop throwing random questions at you.",
    href: "/roles",
    cta: "Pick my role",
  },
  {
    icon: FileText,
    title: "Your resume, but useful",
    desc: "Drop a PDF. We tell you what's actually good and what to say out loud in interviews.",
    href: "/analyze-resume",
    cta: "Check my resume",
  },
  {
    icon: BarChart3,
    title: "The numbers don't lie",
    desc: "Are you clearer? More confident? Or still winging it? Charts that keep it real.",
    href: "/analytics",
    cta: "Show me my stats",
  },
  {
    icon: Zap,
    title: "Big-company vibes",
    desc: "Google-y, Meta-y, Amazon LP energy, startup chaos — practice how they actually ask.",
    href: "/interview/company",
    cta: "Do company mode",
  },
  {
    icon: Sparkles,
    title: "Feedback that isn't vague",
    desc: "What you nailed, what was mid, a better answer, and phrases that sound human.",
    href: "/history",
    cta: "See past feedback",
  },
];

const testimonials = [
  {
    name: "Alex Rivera",
    role: "SWE @ FAANG",
    quote:
      "ngl I used to just panic-practice in the shower. This made me actually track stuff. Behavioral scores went up in like two weeks.",
    stars: 5,
  },
  {
    name: "Priya Shah",
    role: "Product Manager",
    quote:
      "Company modes + STAR feedback felt less like homework and more like a blunt friend who wants you to get the offer.",
    stars: 5,
  },
  {
    name: "Jordan Lee",
    role: "Data Scientist",
    quote:
      "Resume tips + question bank is lowkey the combo. I walked into loops less sweaty. Still nervous. But less sweaty.",
    stars: 5,
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useApp();
  const qCount = getQuestionCount();

  return (
    <div className="relative">
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Flip light/dark">
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild variant="gradient" size="sm">
          <Link href="/dashboard">Just start</Link>
        </Button>
      </div>

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
            Interview practice without the corporate cringe
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Stop bombing interviews{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
              for free
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
            InterviewForge is the chill practice buddy who still keeps it honest.
            Mock rounds, real feedback, STAR stories that don&apos;t sound like a
            robot wrote them — and stats so you know if you&apos;re actually getting better.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" variant="gradient" className="gap-2">
              <Link href="/dashboard">
                I&apos;m ready, let&apos;s go
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/interview">Jump into a mock</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/login">Log in so it syncs</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            {qCount}+ questions · guest mode is free · login is optional, lowkey
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-16 grid gap-4 sm:grid-cols-3"
        >
          {[
            {
              label: "How much people usually level up",
              value: "+2.4 pts",
              href: "/analytics",
            },
            {
              label: "Questions we actually have",
              value: `${qCount}+`,
              href: "/questions",
            },
            {
              label: "How fast feedback hits",
              value: "basically now*",
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

      <section className="border-y border-border/50 bg-card/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need so you don&apos;t freeze
            </h2>
            <p className="mt-3 text-muted-foreground">
              Looks fancy. Talks normal. Actually helps you prep instead of
              lecturing you.
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

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            People who used this and stopped spiraling
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

      <section className="pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-indigo-600/10 via-violet-600/10 to-transparent">
            <CardContent className="flex flex-col items-center gap-6 px-8 py-12 text-center sm:px-16">
              <h2 className="text-3xl font-bold">
                Your next offer starts with less awkward practice
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Instant feedback so you're not guessing",
                  "Stuff saves on your laptop first (you control the cloud)",
                  "PDF reports if you like staring at receipts of growth",
                ].map((item) => (
                  <li key={item} className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" variant="gradient">
                <Link href="/dashboard">
                  Okay fine, I&apos;ll practice
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                *Local scoring is instant. Fancy AI mode needs wifi. Life is hard.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <nav className="mb-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
          {[
            ["/dashboard", "Home base"],
            ["/interview", "Practice"],
            ["/questions", "Question dump"],
            ["/roles", "Jobs"],
            ["/resume", "Resume"],
            ["/login", "Log in"],
            ["/faq", "FAQ (the real ones)"],
            ["/privacy", "Privacy (chill)"],
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
          © {new Date().getFullYear()} InterviewForge · built so you stop
          winging it
        </p>
      </footer>
    </div>
  );
}
