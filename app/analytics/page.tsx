"use client";

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
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useApp } from "@/components/providers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  const { stats } = useApp();

  const radarData = [
    { skill: "Communication", score: stats.categoryScores.communication },
    { skill: "Technical", score: stats.categoryScores.technical },
    { skill: "Confidence", score: stats.categoryScores.confidence },
    { skill: "Structure", score: stats.categoryScores.structure },
  ];

  const categoryBars = radarData.map((d) => ({
    name: d.skill,
    score: d.score,
  }));

  const modeBreakdown = stats.scoreHistory.reduce(
    (acc, h) => {
      acc[h.mode] = acc[h.mode] || [];
      acc[h.mode].push(h.score);
      return acc;
    },
    {} as Record<string, number[]>
  );

  const modeData = Object.entries(modeBreakdown).map(([mode, scores]) => ({
    mode,
    avg:
      Math.round(
        (scores.reduce((a, b) => a + b, 0) / scores.length) * 10
      ) / 10,
    count: scores.length,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">
          Performance Analytics
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track score trends, category strength, and weak areas over time.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Average score</p>
              <p className="text-3xl font-bold">
                {stats.averageScore || "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Sessions analyzed</p>
              <p className="text-3xl font-bold">{stats.totalSessions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Personal best</p>
              <p className="text-3xl font-bold">{stats.bestScore || "—"}</p>
            </CardContent>
          </Card>
        </div>

        {stats.totalSessions === 0 ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center py-16 text-center text-muted-foreground">
              <TrendingUp className="mb-3 h-10 w-10 opacity-40" />
              <p>Complete mock interviews to unlock analytics.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category performance</CardTitle>
                <CardDescription>
                  Communication · Technical · Confidence · Structure
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category bars</CardTitle>
                <CardDescription>Average dimension scores</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBars}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="name"
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
                    <Bar
                      dataKey="score"
                      fill="hsl(243,75%,59%)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Score over time</CardTitle>
                <CardDescription>Session overall scores</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.scoreHistory}>
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
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Score"
                      stroke="hsl(270,70%,55%)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {modeData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">By interview mode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {modeData.map((m) => (
                    <div
                      key={m.mode}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <div>
                        <p className="font-medium capitalize">{m.mode}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.count} session{m.count === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Badge variant="secondary">{m.avg} avg</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Weak areas
                </CardTitle>
                <CardDescription>
                  Recurring improvement themes from feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.weakAreas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Not enough data yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {stats.weakAreas.map((w, i) => (
                      <li
                        key={i}
                        className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
                      >
                        {w}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
}
