"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ComposedChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Brain,
  TrendingUp,
  Mic,
  History,
  Target,
  Flame,
  Sparkles,
  Scale,
  Calendar,
  BookOpen,
  AlertTriangle,
  Shield,
  Lightbulb,
  ArrowRight,
  Activity,
  HeartPulse,
  Layers,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/components/providers";
import {
  buildPsychProfile,
  dimensionBarColor,
} from "@/lib/psych-analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const { stats, sessions, user } = useApp();

  const psych = useMemo(
    () => buildPsychProfile(sessions, user?.streak ?? stats.streak ?? 0),
    [sessions, user?.streak, stats.streak]
  );

  const radarData = psych.dimensions.map((d) => ({
    skill: d.label.split(" ")[0],
    full: d.label,
    score: d.score,
  }));

  const trajectoryColor =
    psych.trajectory.direction === "rising"
      ? "text-emerald-500"
      : psych.trajectory.direction === "falling"
        ? "text-rose-500"
        : psych.trajectory.direction === "volatile"
          ? "text-amber-500"
          : "text-indigo-400";

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">
              <Brain className="h-3.5 w-3.5" />
              Your brain on interviews
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
                Analytics & mind map
              </span>
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Scores, habits, confidence checks, and coaching that actually
              matches how people learn when it&apos;s stressful, ngl.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="gradient" size="sm">
              <Link href="/interview">
                <Mic className="h-4 w-4" />
                Practice
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/history">
                <History className="h-4 w-4" />
                History
              </Link>
            </Button>
          </div>
        </div>

        {/* Readiness hero */}
        <Card className="mt-8 overflow-hidden border-indigo-500/20 bg-gradient-to-br from-indigo-600/10 via-violet-600/5 to-transparent">
          <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Interview readiness index
              </p>
              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                {psych.readinessLabel}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                {psych.readinessInsight}
              </p>
              <div className="mt-4 max-w-md">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Composite 0–100</span>
                  <span className="font-semibold text-foreground">
                    {psych.readinessIndex}
                  </span>
                </div>
                <Progress value={psych.readinessIndex} className="h-2.5" />
              </div>
              <p className={cn("mt-3 text-sm font-medium", trajectoryColor)}>
                Trajectory: {psych.trajectory.label}
                {psych.trajectory.delta !== 0
                  ? ` (${psych.trajectory.delta > 0 ? "+" : ""}${psych.trajectory.delta})`
                  : ""}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/80 px-8 py-6 text-center shadow-sm">
              <p className="text-5xl font-bold text-primary">
                {stats.averageScore || "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">avg score / 10</p>
              <div className="mt-4 flex gap-4 text-center text-xs">
                <div>
                  <p className="text-lg font-semibold">{stats.totalSessions}</p>
                  <p className="text-muted-foreground">sessions</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{stats.bestScore || "—"}</p>
                  <p className="text-muted-foreground">best</p>
                </div>
                <div>
                  <p className="text-lg font-semibold flex items-center justify-center gap-0.5">
                    <Flame className="h-4 w-4 text-orange-500" />
                    {stats.streak}
                  </p>
                  <p className="text-muted-foreground">streak</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {stats.totalSessions === 0 ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <Brain className="mb-3 h-12 w-12 text-indigo-500/50" />
              <h3 className="text-lg font-semibold">No profile yet, fr</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Do some mock interviews and we&apos;ll unlock readiness,
                confidence checks, spacing vibes, story skill, and coaching that
                actually fits you.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button asChild variant="gradient">
                  <Link href="/interview/behavioral">
                    <Mic className="h-4 w-4" />
                    Behavioral baseline
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/interview/mixed">Mixed mock</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/questions">Question bank</Link>
                </Button>
              </div>
              <div className="mt-10 grid w-full max-w-3xl gap-3 text-left sm:grid-cols-3">
                {[
                  {
                    t: "Self-efficacy",
                    d: "Scores climb when you win small first — start easy, then stretch.",
                  },
                  {
                    t: "Deliberate practice",
                    d: "One weak skill + feedback per session beats random marathon reps.",
                  },
                  {
                    t: "Spacing",
                    d: "2–4 sessions/week beats cramming the night before. no cap.",
                  },
                ].map((x) => (
                  <div
                    key={x.t}
                    className="rounded-xl border border-border/60 bg-card/50 p-3"
                  >
                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                      {x.t}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{x.d}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Coaching narrative */}
            <Card className="mt-8 border-violet-500/15">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-violet-500" />
                  Coach&apos;s read on you
                </CardTitle>
                <CardDescription>
                  Scores, habits, and how you show up — the full picture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {psych.coachingNarrative.map((line, i) => (
                  <p
                    key={i}
                    className="text-sm leading-relaxed text-muted-foreground"
                    dangerouslySetInnerHTML={{
                      __html: line
                        .replace(
                          /\*\*(.+?)\*\*/g,
                          '<strong class="text-foreground font-semibold">$1</strong>'
                        ),
                    }}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Psych metric tiles */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile
                icon={TrendingUp}
                label="Trajectory"
                value={psych.trajectory.label}
                detail={psych.trajectory.selfEfficacyNote}
                accent={trajectoryColor}
              />
              <MetricTile
                icon={Scale}
                label="Confidence check"
                value={
                  psych.calibration.label === "insufficient"
                    ? "—"
                    : psych.calibration.label
                }
                detail={`Gap ${psych.calibration.gap >= 0 ? "+" : ""}${psych.calibration.gap} (presence − substance)`}
              />
              <MetricTile
                icon={Calendar}
                label="Practice rhythm"
                value={psych.cadence.spacingLabel}
                detail={
                  psych.cadence.daysSinceLastPractice != null
                    ? `${psych.cadence.daysSinceLastPractice}d since last · ${psych.cadence.practiceDays} active days`
                    : "No cadence yet"
                }
              />
              <MetricTile
                icon={Sparkles}
                label="Deliberate practice"
                value={`${psych.deliberatePracticeScore}/10`}
                detail={psych.growthInsight.slice(0, 90) + "…"}
              />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Radar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skill map</CardTitle>
                  <CardDescription>
                    Clarity · Relevance · Structure · Technical · Confidence
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis
                        dataKey="skill"
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 11,
                        }}
                      />
                      <PolarRadiusAxis
                        domain={[0, 10]}
                        tick={false}
                        axisLine={false}
                      />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="hsl(243,75%,59%)"
                        fill="hsl(243,75%,59%)"
                        fillOpacity={0.35}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Dimension breakdown with psych frames */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="h-5 w-5 text-indigo-500" />
                    Dimension breakdown
                  </CardTitle>
                  <CardDescription>
                    What each score actually means when it&apos;s stressful
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-72 space-y-4 overflow-y-auto pr-1">
                  {psych.dimensions.map((d) => (
                    <div key={d.key} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{d.label}</p>
                        <span className="text-sm font-semibold tabular-nums">
                          {d.score || "—"}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            dimensionBarColor(d.score)
                          )}
                          style={{ width: `${(d.score / 10) * 100}%` }}
                        />
                      </div>
                      <p className="text-[11px] italic text-indigo-600/80 dark:text-indigo-300/80">
                        {d.psychFrame}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {d.interpretation}
                      </p>
                      <p className="text-xs font-medium text-foreground/90">
                        → {d.coachCue}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Score over time */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Score over time</CardTitle>
                  <CardDescription>
                    {psych.trajectory.insight}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.scoreHistory}>
                      <defs>
                        <linearGradient id="psychFill" x1="0" y1="0" x2="0" y2="1">
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
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
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
                        name="Score"
                        stroke="hsl(243,75%,59%)"
                        fill="url(#psychFill)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Calibration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Scale className="h-5 w-5 text-indigo-500" />
                    Confidence vs substance
                  </CardTitle>
                  <CardDescription>
                    Are you overselling or underselling yourself?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/60 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Presence</p>
                      <p className="text-2xl font-bold">
                        {psych.calibration.confidence || "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Substance</p>
                      <p className="text-2xl font-bold">
                        {psych.calibration.substance || "—"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="capitalize"
                  >
                    {psych.calibration.label}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {psych.calibration.insight}
                  </p>
                  <p className="text-sm font-medium">
                    → {psych.calibration.coachCue}
                  </p>
                </CardContent>
              </Card>

              {/* Cadence + growth */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HeartPulse className="h-5 w-5 text-rose-400" />
                    Habits & bounce-back
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium">Spacing / forgetting curve</p>
                    <p className="mt-1 text-muted-foreground">
                      {psych.cadence.spacingInsight}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">
                      Recovery after dips · {psych.growthMindsetScore}/10
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {psych.growthInsight}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">
                      Deliberate practice · {psych.deliberatePracticeScore}/10
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {psych.deliberateInsight}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Answer depth</p>
                    <p className="mt-1 text-muted-foreground">
                      ~{psych.answerDepth.avgWords} words · ~
                      {psych.answerDepth.avgDurationSec}s avg ·{" "}
                      {psych.answerDepth.insight}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Timed vs untimed */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-amber-500" />
                    You vs the clock
                  </CardTitle>
                  <CardDescription>
                    How you perform when the timer&apos;s staring at you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1 rounded-xl border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Timed avg</p>
                      <p className="text-xl font-bold">
                        {psych.timedVsUntimed.timedAvg ?? "—"}
                      </p>
                    </div>
                    <div className="flex-1 rounded-xl border p-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        Untimed avg
                      </p>
                      <p className="text-xl font-bold">
                        {psych.timedVsUntimed.untimedAvg ?? "—"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {psych.timedVsUntimed.insight}
                  </p>
                </CardContent>
              </Card>

              {/* Narrative */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-indigo-500" />
                    Story skill
                  </CardTitle>
                  <CardDescription>
                    Structure score · STAR / how well your stories land
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {psych.narrativeMaturity || "—"}
                    <span className="text-base text-muted-foreground">/10</span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {psych.narrativeInsight}
                  </p>
                  <Button asChild className="mt-4" size="sm" variant="outline">
                    <Link href="/interview/behavioral">
                      STAR drill
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Mode profiles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Layers className="h-5 w-5 text-violet-500" />
                    Mode transfer
                  </CardTitle>
                  <CardDescription>{psych.diversityInsight}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {psych.modeProfiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No modes yet — go try one.</p>
                  ) : (
                    psych.modeProfiles.map((m) => (
                      <Link
                        key={m.mode}
                        href={`/interview/${m.mode}`}
                        className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 transition-colors hover:border-indigo-500/40 hover:bg-indigo-500/5"
                      >
                        <div>
                          <p className="font-medium capitalize">
                            {m.mode.replace("-", " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.count} session{m.count === 1 ? "" : "s"} · ~
                            {m.avgDurationSec}s/answer
                          </p>
                        </div>
                        <Badge variant="secondary">{m.avg} avg</Badge>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Weekly volume */}
              {psych.weeklyVolume.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Weekly practice volume</CardTitle>
                    <CardDescription>
                      Showing up often beats going hard once. consistency &gt; intensity
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={psych.weeklyVolume}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="week"
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis
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
                        <Legend />
                        <Bar
                          dataKey="sessions"
                          name="Sessions"
                          fill="hsl(243,75%,59%)"
                          radius={[6, 6, 0, 0]}
                        />
                        <Line
                          type="monotone"
                          dataKey="avgScore"
                          name="Avg score"
                          stroke="hsl(270,70%,55%)"
                          strokeWidth={2}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Strengths */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-emerald-500" />
                    What you&apos;re good at
                  </CardTitle>
                  <CardDescription>
                    Themes that keep showing up in feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {psych.topStrengths.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Strengths show up once you collect some feedback.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {psych.topStrengths.map((s) => (
                        <li
                          key={s.text}
                          className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-100"
                        >
                          <span className="font-medium">{s.text}</span>
                          {s.count > 1 && (
                            <span className="ml-2 text-xs opacity-70">
                              ×{s.count}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Growth edges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Growth edges
                  </CardTitle>
                  <CardDescription>
                    Recurring fix-me themes — your deliberate practice targets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {psych.topImprovements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Improvement themes show up after scored answers.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {psych.topImprovements.map((s) => (
                        <li
                          key={s.text}
                          className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100"
                        >
                          <span className="font-medium">{s.text}</span>
                          {s.count > 1 && (
                            <span className="ml-2 text-xs opacity-70">
                              ×{s.count}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations ZPD */}
              <Card className="lg:col-span-2 border-indigo-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-indigo-500" />
                    Next challenges (stretch zone)
                  </CardTitle>
                  <CardDescription>
                    Tasks just past where you are now — high learning, not
                    impossible
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {psych.recommendations.map((r) => (
                    <Link
                      key={r.title}
                      href={r.href}
                      className={cn(
                        "group rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10",
                        r.priority === "high"
                          ? "border-indigo-500/30 bg-indigo-500/5"
                          : "border-border/70 bg-card/60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                          {r.title}
                        </p>
                        <Badge
                          variant="outline"
                          className="shrink-0 capitalize text-[10px]"
                        >
                          {r.priority}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {r.why}
                      </p>
                      <p className="mt-2 text-[11px] font-medium text-indigo-600/80 dark:text-indigo-300/80">
                        {r.psychBasis}
                      </p>
                      <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
                        Open it
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </p>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              {/* Framework legend */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lightbulb className="h-5 w-5 text-amber-400" />
                    Why this dashboard even exists
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      t: "Self-efficacy (Bandura)",
                      d: "You believe you can do it when you rack up wins — we track those and bounce-backs.",
                    },
                    {
                      t: "Deliberate practice (Ericsson)",
                      d: "Goals + feedback + focused reps beat mindless volume. we score practice quality.",
                    },
                    {
                      t: "Spacing (Ebbinghaus)",
                      d: "Spread-out practice sticks more than cramming — we check your cadence.",
                    },
                    {
                      t: "Growth mindset (Dweck)",
                      d: "Bounce-back after dips = adaptive learning. we measure recovery.",
                    },
                    {
                      t: "Narrative / STAR",
                      d: "Structured stories are easier for interviewers to follow. structure is a real metric.",
                    },
                    {
                      t: "Yerkes–Dodson",
                      d: "Too chill or too stressed tanks performance — timed vs untimed shows your curve.",
                    },
                  ].map((x) => (
                    <div
                      key={x.t}
                      className="rounded-xl border border-border/50 bg-muted/20 p-3"
                    >
                      <p className="font-semibold text-foreground">{x.t}</p>
                      <p className="mt-1 text-xs leading-relaxed">{x.d}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  detail,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  accent?: string;
}) {
  return (
    <Card className="h-full">
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-300">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
              className={cn(
                "mt-0.5 text-lg font-bold capitalize leading-tight",
                accent
              )}
            >
              {value}
            </p>
            <p className="mt-1 line-clamp-3 text-[11px] text-muted-foreground">
              {detail}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
