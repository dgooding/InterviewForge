"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Flame,
  Trophy,
  Target,
  Mic,
  FileText,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useApp } from "@/components/providers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative, scoreBg, cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user, sessions, stats, selectedRole, resumeAnalysis } = useApp();

  const recent = sessions
    .filter((s) => s.status === "completed")
    .slice(0, 5);

  const recommendations = [
    {
      title: selectedRole
        ? `Drill ${selectedRole}`
        : "Pick a role first",
      desc: selectedRole
        ? "Hop into a mixed mock built for that role."
        : "Software Engineer, PM, whatever you're aiming for.",
      href: selectedRole ? "/interview/mixed" : "/roles",
      icon: Briefcase,
    },
    {
      title: resumeAnalysis ? "Peep resume insights" : "Drop your resume",
      desc: resumeAnalysis
        ? "Steal those talking points for your next run."
        : "Upload a PDF — get strengths + talking points, no cap.",
      href: "/resume",
      icon: FileText,
    },
    {
      title: "Behavioral STAR drill",
      desc: "Timed behaviorals so your stories don't flop.",
      href: "/interview/behavioral",
      icon: Mic,
    },
    {
      title: "Question bank",
      desc: "500+ prompts. Search, pick one, grind it.",
      href: "/questions",
      icon: Target,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Hey, {user?.name?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="mt-1 text-muted-foreground">
              Your interview prep HQ. Stop bombing interviews.
              {user?.isCloud && !user.isGuest
                ? " Progress syncs privately to your account."
                : " Stuff saves on this device. Log in anytime if you want it everywhere."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!(user?.isCloud && !user.isGuest) && (
              <Button asChild variant="outline">
                <Link href="/login">Sync to other devices</Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/settings">Privacy</Link>
            </Button>
            <Button asChild variant="gradient">
              <Link href="/interview">
                Start practicing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick start — features are live, not placeholders */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: "/interview",
              title: "Mock interview",
              desc: "Timed or chill · voice + AI feedback",
            },
            {
              href: "/resume",
              title: "Resume check",
              desc: "PDF upload · ATS · talking points",
            },
            {
              href: "/history",
              title: "History & PDF",
              desc: "Old sessions · export reports",
            },
            {
              href: "/analytics",
              title: "Analytics",
              desc: "Trends · how mid your scores are",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-border/60 bg-card/50 p-4 transition-all hover:border-primary/40 hover:shadow-glow"
            >
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Overall score",
              value: stats.averageScore ? stats.averageScore.toFixed(1) : "—",
              sub: "Avg across sessions",
              icon: Trophy,
              color: "text-amber-500",
              href: "/analytics",
            },
            {
              label: "Day streak",
              value: String(stats.streak),
              sub: "Don't break it ngl",
              icon: Flame,
              color: "text-orange-500",
              href: "/interview",
            },
            {
              label: "Sessions",
              value: String(stats.totalSessions),
              sub: "Mocks you've finished",
              icon: Target,
              color: "text-indigo-500",
              href: "/history",
            },
            {
              label: "Best score",
              value: stats.bestScore ? stats.bestScore.toFixed(1) : "—",
              sub: "Your high score",
              icon: TrendingUp,
              color: "text-emerald-500",
              href: "/analytics",
            },
          ].map((s) => (
            <Link key={s.label} href={s.href} className="block">
              <Card className="h-full transition-all hover:border-primary/40 hover:shadow-glow">
                <CardContent className="flex items-start justify-between pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="mt-1 text-3xl font-bold">{s.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
                  </div>
                  <div className={cn("rounded-xl bg-muted p-2.5", s.color)}>
                    <s.icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Score trends</CardTitle>
              <CardDescription>
                Last few sessions, vibes check
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              {stats.scoreHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.scoreHistory}>
                    <defs>
                      <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="hsl(243,75%,59%)"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor="hsl(243,75%,59%)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(243,75%,59%)"
                      fill="url(#scoreFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                  <Clock className="mb-2 h-8 w-8 opacity-40" />
                  <p className="text-sm">No sessions yet — go do one</p>
                  <Button asChild variant="link" className="mt-1">
                    <Link href="/interview">Run your first mock</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What to do next</CardTitle>
              <CardDescription>Lowkey good moves rn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.map((r) => (
                <Link
                  key={r.title}
                  href={r.href}
                  className="flex gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <r.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent sessions */}
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Past sessions</CardTitle>
              <CardDescription>Your recent mocks</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/history">See all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Finish a session and it&apos;ll show up here.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {recent.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-medium">{s.role}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.mode}
                        {s.companyStyle ? ` · ${s.companyStyle}` : ""} ·{" "}
                        {s.completedAt
                          ? formatRelative(s.completedAt)
                          : "Still going"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          scoreBg(s.overallScore ?? 0)
                        )}
                      >
                        {(s.overallScore ?? 0).toFixed(1)} / 10
                      </Badge>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/history?id=${s.id}`}>Details</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
