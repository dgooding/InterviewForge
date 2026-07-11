import type { InterviewSession, UserStats, InterviewMode } from "./types";
import { average } from "./utils";

export function computeStats(
  sessions: InterviewSession[],
  streak: number
): UserStats {
  const completed = sessions.filter(
    (s) => s.status === "completed" && s.answers.length > 0
  );

  const allScores = completed
    .map((s) => s.overallScore ?? average(s.answers.map((a) => a.feedback.scores.overall)))
    .filter((n) => n > 0);

  const clarity: number[] = [];
  const technical: number[] = [];
  const confidence: number[] = [];
  const structure: number[] = [];

  completed.forEach((s) => {
    s.answers.forEach((a) => {
      clarity.push(a.feedback.scores.clarity);
      technical.push(a.feedback.scores.technicalAccuracy);
      confidence.push(a.feedback.scores.confidence);
      structure.push(a.feedback.scores.structure);
    });
  });

  const scoreHistory = completed
    .filter((s) => s.completedAt)
    .map((s) => ({
      date: s.completedAt!.slice(0, 10),
      score:
        s.overallScore ??
        average(s.answers.map((a) => a.feedback.scores.overall)),
      mode: s.mode as InterviewMode,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-20);

  // Weak areas from improvement tags
  const improvementCounts: Record<string, number> = {};
  completed.forEach((s) => {
    s.answers.forEach((a) => {
      a.feedback.improvements.forEach((imp) => {
        const key = imp.slice(0, 60);
        improvementCounts[key] = (improvementCounts[key] || 0) + 1;
      });
    });
  });
  const weakAreas = Object.entries(improvementCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  return {
    totalSessions: completed.length,
    averageScore: average(allScores),
    streak,
    bestScore: allScores.length ? Math.max(...allScores) : 0,
    categoryScores: {
      communication: average(clarity),
      technical: average(technical),
      confidence: average(confidence),
      structure: average(structure),
    },
    scoreHistory,
    weakAreas,
  };
}
