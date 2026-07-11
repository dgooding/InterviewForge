/**
 * Psychology-informed interview performance analytics.
 *
 * Draws on:
 * - Bandura: self-efficacy (mastery, trajectory)
 * - Ericsson: deliberate practice (volume, feedback, difficulty)
 * - Dweck: growth mindset (recovery after dips)
 * - Ebbinghaus: spacing / forgetting curves (practice cadence)
 * - Yerkes–Dodson: arousal–performance (timed vs untimed)
 * - Narrative psychology / STAR: structure scores
 * - Dual-process fluency: clarity
 * - Self-presentation: confidence vs substance gap
 * - Positive psychology: signature strengths
 * - ZPD (Vygotsky): next challenge recommendations
 * - Habit formation: streak / consistency
 * - Peak–end rule: recent sessions weight interpretation
 */

import type {
  InterviewSession,
  InterviewAnswer,
  InterviewMode,
  AnswerScores,
} from "./types";
import { average, clamp } from "./utils";

export type DimensionKey = keyof AnswerScores;

export interface DimensionInsight {
  key: DimensionKey;
  label: string;
  score: number;
  psychFrame: string;
  interpretation: string;
  coachCue: string;
}

export interface PracticeCadence {
  daysSinceLastPractice: number | null;
  averageGapDays: number | null;
  practiceDays: number;
  spacingLabel: "none" | "crammed" | "healthy" | "sparse" | "lapsed";
  spacingInsight: string;
}

export interface Trajectory {
  direction: "rising" | "stable" | "falling" | "volatile" | "insufficient";
  delta: number;
  label: string;
  insight: string;
  selfEfficacyNote: string;
}

export interface ConfidenceCalibration {
  confidence: number;
  substance: number; // avg of clarity, structure, relevance, technical
  gap: number; // confidence - substance
  label: "underconfident" | "calibrated" | "overconfident" | "insufficient";
  insight: string;
  coachCue: string;
}

export interface ModeProfile {
  mode: InterviewMode;
  count: number;
  avg: number;
  avgDurationSec: number;
}

export interface StrengthTheme {
  text: string;
  count: number;
}

export interface PsychProfile {
  readinessIndex: number; // 0–100 composite
  readinessLabel: string;
  readinessInsight: string;
  dimensions: DimensionInsight[];
  trajectory: Trajectory;
  cadence: PracticeCadence;
  calibration: ConfidenceCalibration;
  growthMindsetScore: number; // 0–10 recovery after dips
  growthInsight: string;
  deliberatePracticeScore: number; // 0–10
  deliberateInsight: string;
  modeProfiles: ModeProfile[];
  diversityScore: number; // 0–10 mode variety
  diversityInsight: string;
  timedVsUntimed: {
    timedAvg: number | null;
    untimedAvg: number | null;
    insight: string;
  };
  topStrengths: StrengthTheme[];
  topImprovements: StrengthTheme[];
  narrativeMaturity: number; // structure-focused 0–10
  narrativeInsight: string;
  answerDepth: {
    avgWords: number;
    avgDurationSec: number;
    insight: string;
  };
  recommendations: {
    title: string;
    why: string;
    href: string;
    priority: "high" | "medium" | "low";
    psychBasis: string;
  }[];
  coachingNarrative: string[];
  weeklyVolume: { week: string; sessions: number; avgScore: number }[];
}

const DIMENSION_META: Record<
  Exclude<DimensionKey, "overall">,
  { label: string; psychFrame: string }
> = {
  clarity: {
    label: "Clarity & fluency",
    psychFrame:
      "Cognitive fluency — clear speech just hits different. people trust it more.",
  },
  relevance: {
    label: "Relevance & focus",
    psychFrame:
      "Staying on the question — shows you can lock in when it's stressful.",
  },
  structure: {
    label: "Narrative structure",
    psychFrame:
      "STAR / story structure — organized stories are way easier to remember and trust.",
  },
  technicalAccuracy: {
    label: "Technical depth",
    psychFrame:
      "Domain knowledge — can you actually defend the ideas when they dig?",
  },
  confidence: {
    label: "Presence & confidence",
    psychFrame:
      "How you show up — calm delivery, not empty bravado.",
  },
};

function completedSessions(sessions: InterviewSession[]): InterviewSession[] {
  return sessions
    .filter((s) => s.status === "completed" && s.answers.length > 0)
    .sort(
      (a, b) =>
        new Date(a.completedAt || a.startedAt).getTime() -
        new Date(b.completedAt || b.startedAt).getTime()
    );
}

function allAnswers(sessions: InterviewSession[]): InterviewAnswer[] {
  return sessions.flatMap((s) => s.answers);
}

function sessionScore(s: InterviewSession): number {
  if (s.overallScore != null && s.overallScore > 0) return s.overallScore;
  return average(s.answers.map((a) => a.feedback.scores.overall));
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const ms =
    new Date(dayKey(b)).getTime() - new Date(dayKey(a)).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countThemes(texts: string[], limit = 6): StrengthTheme[] {
  const counts: Record<string, number> = {};
  texts.forEach((t) => {
    const key = t.trim().slice(0, 80);
    if (!key) return;
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([text, count]) => ({ text, count }));
}

function dimInterpretation(key: Exclude<DimensionKey, "overall">, score: number): {
  interpretation: string;
  coachCue: string;
} {
  if (score <= 0) {
    return {
      interpretation: "Not enough samples yet for this one.",
      coachCue: "Knock out a few scored answers to unlock this signal.",
    };
  }
  if (key === "clarity") {
    if (score >= 8)
      return {
        interpretation:
          "Your wording is easy to follow under pressure — interviewers can actually track you.",
        coachCue: "Keep sentences short; add one real metric per story.",
      };
    if (score >= 6)
      return {
        interpretation:
          "Mostly clear, but sometimes you ramble or get dense. lowkey taxes the listener.",
        coachCue: "Practice the 3-sentence open: context → action → result.",
      };
    return {
      interpretation:
        "People may lose your point — super common when you're anxious, ngl.",
      coachCue: "Slow down 10%, cut filler, land the punchline first.",
    };
  }
  if (key === "structure") {
    if (score >= 8)
      return {
        interpretation:
          "Strong STAR-ish scaffolding. Interviewers can retell your story later.",
        coachCue: "Vary the vibe a bit, but still end on a result.",
      };
    if (score >= 6)
      return {
        interpretation:
          "Structure is there but uneven — Situation runs long or Result is thin.",
        coachCue: "Force it: 20% context, 50% actions, 30% result + learning.",
      };
    return {
      interpretation:
        "Stories can sound like a timeline dump, not a real narrative.",
      coachCue: "Jot STAR labels before you speak. trust.",
    };
  }
  if (key === "confidence") {
    if (score >= 8)
      return {
        interpretation:
          "High presence. Just make sure confidence matches the substance (see calibration).",
        coachCue: "Keep the warmth; don't claim stuff you can't defend.",
      };
    if (score >= 6)
      return {
        interpretation:
          "Solid presence, room for calmer pacing and cleaner closes.",
        coachCue: "End with a firm result sentence, not a fade-out.",
      };
    return {
      interpretation:
        "Low presence can read as low skill even when content is good, tbh.",
      coachCue: "Record yourself; practice one power close per answer.",
    };
  }
  if (key === "technicalAccuracy") {
    if (score >= 8)
      return {
        interpretation:
          "Your tech holds up when they dig — that's senior energy.",
        coachCue: "Add trade-offs and failure modes to sound even more senior.",
      };
    if (score >= 6)
      return {
        interpretation:
          "Solid base, but depth questions still expose gaps.",
        coachCue: "For each concept: definition → example → trade-off.",
      };
    return {
      interpretation:
        "Tech answers need tighter accuracy and fewer vague claims.",
      coachCue: "Drill fundamentals out loud; when unsure, reason out loud.",
    };
  }
  // relevance
  if (score >= 8)
    return {
      interpretation:
        "You stay locked on the question — strong focus under pressure.",
      coachCue: "Keep echoing the question's verb in your first line.",
    };
  if (score >= 6)
    return {
      interpretation:
        "Mostly on-target with occasional detours when stressed.",
      coachCue: "If you drift, say 'Back to your question…' and re-anchor.",
    };
  return {
    interpretation:
      "Answers often leave the actual question behind — costly when time is short.",
    coachCue: "Pause 2 seconds. Restate the ask. Then answer.",
  };
}

function computeTrajectory(scores: number[]): Trajectory {
  if (scores.length < 2) {
    return {
      direction: "insufficient",
      delta: 0,
      label: "Building baseline",
      insight:
        "Belief grows from wins. You need a few more sessions before a real trend shows up.",
      selfEfficacyNote:
        "Early wins matter — start with drills you can nail, then stretch.",
    };
  }
  const recent = scores.slice(-5);
  const earlier = scores.slice(0, Math.max(1, scores.length - 5));
  const rAvg = average(recent);
  const eAvg = average(earlier);
  const delta = Math.round((rAvg - eAvg) * 10) / 10;

  // volatility
  const mean = average(scores);
  const variance =
    scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length;
  const sd = Math.sqrt(variance);

  if (sd >= 1.8 && Math.abs(delta) < 0.6) {
    return {
      direction: "volatile",
      delta,
      label: "All over the place",
      insight:
        "Swings usually mean nerves or inconsistent prep — not that you're permanently mid.",
      selfEfficacyNote:
        "Stabilize with a pre-interview ritual (breath + 30s plan).",
    };
  }
  if (delta >= 0.5) {
    return {
      direction: "rising",
      delta,
      label: "Going up",
      insight: `Recent sessions avg ${delta} points higher — the reps are stacking, bet.`,
      selfEfficacyNote:
        "Protect the win streak; only add harder modes after two solid sessions.",
    };
  }
  if (delta <= -0.5) {
    return {
      direction: "falling",
      delta,
      label: "Dip detected",
      insight:
        "Recent scores are softer. Often fatigue, harder modes, or cramming — not permanent, fr.",
      selfEfficacyNote:
        "Hit a medium drill you can nail, then re-challenge. Recovery rebuilds belief.",
    };
  }
  return {
    direction: "stable",
    delta,
    label: "Stable plateau",
    insight:
      "Scores are consistent. Plateaus are normal before the next jump.",
    selfEfficacyNote:
      "Break the plateau with one weak dimension (e.g. structure-only drills).",
  };
}

function computeCadence(sessions: InterviewSession[]): PracticeCadence {
  if (!sessions.length) {
    return {
      daysSinceLastPractice: null,
      averageGapDays: null,
      practiceDays: 0,
      spacingLabel: "none",
      spacingInsight:
        "Spacing effect: spreading practice beats cramming if you want skills that stick.",
    };
  }
  const days = Array.from(
    new Set(sessions.map((s) => dayKey(s.completedAt || s.startedAt)))
  ).sort();
  const gaps: number[] = [];
  for (let i = 1; i < days.length; i++) {
    gaps.push(daysBetween(days[i - 1], days[i]));
  }
  const last = days[days.length - 1];
  const daysSinceLastPractice = daysBetween(
    last,
    new Date().toISOString()
  );
  const averageGapDays = gaps.length ? average(gaps) : null;

  let spacingLabel: PracticeCadence["spacingLabel"] = "healthy";
  let spacingInsight = "";

  if (daysSinceLastPractice >= 14) {
    spacingLabel = "lapsed";
    spacingInsight =
      "14+ days idle — expect a little rust. A short warm-up session brings it back fast.";
  } else if (averageGapDays != null && averageGapDays < 1.2 && days.length >= 3) {
    spacingLabel = "crammed";
    spacingInsight =
      "Sessions are bunched. Cramming boosts short-term scores but fades — leave 1–2 days between deep practices.";
  } else if (averageGapDays != null && averageGapDays > 7) {
    spacingLabel = "sparse";
    spacingInsight =
      "Long gaps between sessions. Aim for 2–4 focused sessions/week. habit > heroics.";
  } else {
    spacingLabel = "healthy";
    spacingInsight =
      "Practice rhythm looks solid — consistency builds automaticity under stress.";
  }

  return {
    daysSinceLastPractice,
    averageGapDays,
    practiceDays: days.length,
    spacingLabel,
    spacingInsight,
  };
}

function computeCalibration(answers: InterviewAnswer[]): ConfidenceCalibration {
  if (!answers.length) {
    return {
      confidence: 0,
      substance: 0,
      gap: 0,
      label: "insufficient",
      insight: "Need scored answers to check confidence vs substance.",
      coachCue: "After each answer, rate yourself 1–10 before seeing AI scores.",
    };
  }
  const confidence = average(answers.map((a) => a.feedback.scores.confidence));
  const substance = average(
    answers.map((a) =>
      average([
        a.feedback.scores.clarity,
        a.feedback.scores.structure,
        a.feedback.scores.relevance,
        a.feedback.scores.technicalAccuracy,
      ])
    )
  );
  const gap = Math.round((confidence - substance) * 10) / 10;

  if (gap >= 1.2) {
    return {
      confidence,
      substance,
      gap,
      label: "overconfident",
      insight:
        "Presence outruns substance. Interviewers dig harder when delivery is slick but thin.",
      coachCue:
        "For each claim, attach one proof (metric, trade-off, or failure mode).",
    };
  }
  if (gap <= -1.2) {
    return {
      confidence,
      substance,
      gap,
      label: "underconfident",
      insight:
        "Content is stronger than delivery. Live, you might be getting underrated, ngl.",
      coachCue:
        "Practice power closes and go 10% slower; your substance already carries weight.",
    };
  }
  return {
    confidence,
    substance,
    gap,
    label: "calibrated",
    insight:
      "Confidence roughly matches substance — solid show-up without empty bravado.",
    coachCue: "Keep it matched; record one session weekly to stay honest.",
  };
}

function growthFromScores(scores: number[]): { score: number; insight: string } {
  if (scores.length < 3) {
    return {
      score: 5,
      insight:
        "Growth shows in bounce-back after dips. Need more sessions to measure recovery.",
    };
  }
  let recoveries = 0;
  let opportunities = 0;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i - 1] - scores[i] >= 1) {
      opportunities++;
      // look ahead up to 2 sessions for recovery
      const next = scores.slice(i + 1, i + 3);
      if (next.some((s) => s >= scores[i - 1] - 0.3)) recoveries++;
    }
  }
  if (opportunities === 0) {
    return {
      score: 7,
      insight:
        "Few sharp dips — stability is good. Growth shows when you try harder modes and still recover.",
    };
  }
  const ratio = recoveries / opportunities;
  const score = clamp(Math.round(ratio * 10 * 10) / 10, 0, 10);
  return {
    score,
    insight:
      ratio >= 0.6
        ? "You tend to rebound after weaker sessions — that's the growth pattern (effort → recovery)."
        : "After dips, scores stay soft. Treat bad sessions as data; schedule a recovery drill within 48h.",
  };
}

function deliberatePractice(
  sessions: InterviewSession[],
  answers: InterviewAnswer[],
  cadence: PracticeCadence,
  diversity: number
): { score: number; insight: string } {
  if (!sessions.length) {
    return {
      score: 0,
      insight: "Deliberate practice needs goals, feedback, and reps. simple.",
    };
  }
  const volume = clamp(sessions.length / 10, 0, 1); // 10 sessions = full
  const feedbackRich =
    answers.length > 0
      ? clamp(
          answers.filter((a) => a.feedback.improvements?.length).length /
            answers.length,
          0,
          1
        )
      : 0;
  const spacing =
    cadence.spacingLabel === "healthy"
      ? 1
      : cadence.spacingLabel === "sparse"
        ? 0.5
        : cadence.spacingLabel === "crammed"
          ? 0.4
          : cadence.spacingLabel === "lapsed"
            ? 0.3
            : 0;
  const div = diversity / 10;
  const score =
    Math.round((volume * 0.3 + feedbackRich * 0.3 + spacing * 0.2 + div * 0.2) * 100) /
    10;
  return {
    score: clamp(score, 0, 10),
    insight:
      score >= 7
        ? "Practice pattern looks deliberate: volume, feedback use, and some variety."
        : "Stop random reps. Pick one weak skill per session + review feedback out loud.",
  };
}

function buildRecommendations(
  profile: Omit<PsychProfile, "recommendations" | "coachingNarrative" | "readinessIndex" | "readinessLabel" | "readinessInsight">,
  sessions: InterviewSession[]
): PsychProfile["recommendations"] {
  const recs: PsychProfile["recommendations"] = [];
  const dims = [...profile.dimensions].filter((d) => d.key !== "overall");
  dims.sort((a, b) => a.score - b.score);
  const weakest = dims[0];
  const strongest = dims[dims.length - 1];

  if (!sessions.length) {
    return [
      {
        title: "Start a behavioral STAR drill",
        why: "Easy wins build confidence fastest when stories have structure.",
        href: "/interview/behavioral",
        priority: "high",
        psychBasis: "Bandura · mastery experiences",
      },
      {
        title: "Pick a target role",
        why: "Knowing the role keeps practice pointed at stuff that actually matters.",
        href: "/roles",
        priority: "medium",
        psychBasis: "Encoding specificity",
      },
    ];
  }

  if (weakest && weakest.score > 0 && weakest.score < 7) {
    const href =
      weakest.key === "technicalAccuracy"
        ? "/interview/technical"
        : weakest.key === "structure"
          ? "/interview/behavioral"
          : weakest.key === "confidence"
            ? "/interview/behavioral"
            : "/interview/mixed";
    recs.push({
      title: `Target: raise ${weakest.label}`,
      why: weakest.coachCue,
      href,
      priority: "high",
      psychBasis: weakest.psychFrame.split("—")[0].trim(),
    });
  }

  if (profile.calibration.label === "overconfident") {
    recs.push({
      title: "Substance drill — defend every claim",
      why: profile.calibration.coachCue,
      href: "/interview/technical",
      priority: "high",
      psychBasis: "Self-presentation / calibration",
    });
  }
  if (profile.calibration.label === "underconfident") {
    recs.push({
      title: "Presence drill — power closes",
      why: profile.calibration.coachCue,
      href: "/interview/behavioral",
      priority: "high",
      psychBasis: "Self-efficacy · delivery",
    });
  }

  if (
    profile.cadence.spacingLabel === "lapsed" ||
    profile.cadence.spacingLabel === "sparse"
  ) {
    recs.push({
      title: "Re-enter with a short mixed mock",
      why: profile.cadence.spacingInsight,
      href: "/interview/mixed",
      priority: "high",
      psychBasis: "Spacing effect · habit re-entry",
    });
  }
  if (profile.cadence.spacingLabel === "crammed") {
    recs.push({
      title: "Space your next session 48h out",
      why: "Let it settle; review one PDF report instead of another full mock today.",
      href: "/history",
      priority: "medium",
      psychBasis: "Spacing / consolidation",
    });
  }

  if (profile.diversityScore < 4 && sessions.length >= 3) {
    recs.push({
      title: "Cross-train a new interview mode",
      why: "Variety helps skills transfer and stops you from only being good at one format.",
      href: "/interview/company",
      priority: "medium",
      psychBasis: "Transfer of learning · variability",
    });
  }

  if (strongest && strongest.score >= 7.5) {
    recs.push({
      title: `Leverage strength: ${strongest.label}`,
      why: "Lead with what you're good at while you fix weaker dimensions. stack wins.",
      href: "/questions",
      priority: "low",
      psychBasis: "Positive psychology · signature strengths",
    });
  }

  recs.push({
    title: "Question bank — micro-reps",
    why: "Short, focused reps on one prompt beat unfocused marathon sessions.",
    href: "/questions",
    priority: "medium",
    psychBasis: "Deliberate practice",
  });

  // unique by title
  const seen = new Set<string>();
  return recs.filter((r) => {
    if (seen.has(r.title)) return false;
    seen.add(r.title);
    return true;
  }).slice(0, 6);
}

export function buildPsychProfile(
  sessionsIn: InterviewSession[],
  streak: number
): PsychProfile {
  const sessions = completedSessions(sessionsIn);
  const answers = allAnswers(sessions);
  const scores = sessions.map(sessionScore).filter((n) => n > 0);

  const dimKeys: Exclude<DimensionKey, "overall">[] = [
    "clarity",
    "relevance",
    "structure",
    "technicalAccuracy",
    "confidence",
  ];

  const dimensions: DimensionInsight[] = dimKeys.map((key) => {
    const vals = answers.map((a) => a.feedback.scores[key]);
    const score = average(vals);
    const meta = DIMENSION_META[key];
    const { interpretation, coachCue } = dimInterpretation(key, score);
    return {
      key,
      label: meta.label,
      score,
      psychFrame: meta.psychFrame,
      interpretation,
      coachCue,
    };
  });

  const trajectory = computeTrajectory(scores);
  const cadence = computeCadence(sessions);
  const calibration = computeCalibration(answers);
  const growth = growthFromScores(scores);

  const modeMap = new Map<InterviewMode, { scores: number[]; durs: number[] }>();
  sessions.forEach((s) => {
    const cur = modeMap.get(s.mode) || { scores: [], durs: [] };
    cur.scores.push(sessionScore(s));
    s.answers.forEach((a) => cur.durs.push(a.durationSeconds || 0));
    modeMap.set(s.mode, cur);
  });
  const modeProfiles: ModeProfile[] = Array.from(modeMap.entries()).map(
    ([mode, v]) => ({
      mode,
      count: v.scores.length,
      avg: average(v.scores),
      avgDurationSec: average(v.durs),
    })
  );

  const diversityScore = clamp(
    Math.round((modeProfiles.length / 6) * 10 * 10) / 10,
    0,
    10
  );
  const diversityInsight =
    diversityScore >= 6
      ? "Good mode variety — you can flex across formats."
      : diversityScore >= 3
        ? "Some variety. Add company or system-design modes to transfer better."
        : "Low variety. Being good at one mode may not transfer — cross-train.";

  const timed = sessions.filter((s) => !s.untimed);
  const untimed = sessions.filter((s) => s.untimed);
  const timedAvg = timed.length ? average(timed.map(sessionScore)) : null;
  const untimedAvg = untimed.length ? average(untimed.map(sessionScore)) : null;
  let timedInsight =
    "Not enough timed vs untimed data yet to map how the clock messes with you.";
  if (timedAvg != null && untimedAvg != null) {
    const d = Math.round((untimedAvg - timedAvg) * 10) / 10;
    if (d >= 0.8) {
      timedInsight = `Untimed scores run ~${d} higher — the clock may be costing you. Practice timed drills to desensitize.`;
    } else if (d <= -0.8) {
      timedInsight = `Timed scores are higher — light pressure might actually help you focus. Keep light timers.`;
    } else {
      timedInsight =
        "Timed and untimed are similar — solid under clock pressure.";
    }
  } else if (timedAvg != null) {
    timedInsight =
      "Mostly timed practice — good stress exposure. Add one untimed deep drill weekly for reflection.";
  }

  const topStrengths = countThemes(
    answers.flatMap((a) => a.feedback.strengths || [])
  );
  const topImprovements = countThemes(
    answers.flatMap((a) => a.feedback.improvements || [])
  );

  const structureScore =
    dimensions.find((d) => d.key === "structure")?.score || 0;
  const narrativeMaturity = structureScore;
  const narrativeInsight =
    structureScore >= 8
      ? "Story skill is high — narratives are coherent and stick."
      : structureScore >= 6
        ? "Stories work but Results/Learning often thin. Interviewers remember endings."
        : "Build STAR muscle memory; unstructured stories overload their working memory.";

  const avgWords = average(answers.map((a) => wordCount(a.answerText)));
  const avgDurationSec = average(answers.map((a) => a.durationSeconds || 0));
  let depthInsight = "Answer length shows up after a few responses.";
  if (answers.length) {
    if (avgWords < 40) {
      depthInsight =
        "Answers are super short — might under-share evidence. Aim ~90–150 words for behavioral stories.";
    } else if (avgWords > 280) {
      depthInsight =
        "Answers run long — listeners check out. Tighten Actions; cut backstory.";
    } else {
      depthInsight =
        "Answer length is in a workable band for interview attention spans.";
    }
  }

  const deliberate = deliberatePractice(
    sessions,
    answers,
    cadence,
    diversityScore
  );

  const partial = {
    dimensions,
    trajectory,
    cadence,
    calibration,
    growthMindsetScore: growth.score,
    growthInsight: growth.insight,
    deliberatePracticeScore: deliberate.score,
    deliberateInsight: deliberate.insight,
    modeProfiles,
    diversityScore,
    diversityInsight,
    timedVsUntimed: {
      timedAvg,
      untimedAvg,
      insight: timedInsight,
    },
    topStrengths,
    topImprovements,
    narrativeMaturity,
    narrativeInsight,
    answerDepth: {
      avgWords: Math.round(avgWords),
      avgDurationSec: Math.round(avgDurationSec),
      insight: depthInsight,
    },
    weeklyVolume: buildWeekly(sessions),
  };

  const recommendations = buildRecommendations(partial, sessions);

  // Readiness index 0–100
  const avgAll = scores.length ? average(scores) : 0;
  const readinessIndex = Math.round(
    clamp(
      (avgAll / 10) * 40 +
        (trajectory.direction === "rising" ? 15 : trajectory.direction === "stable" ? 10 : trajectory.direction === "falling" ? 5 : 8) +
        (cadence.spacingLabel === "healthy" ? 15 : cadence.spacingLabel === "sparse" ? 8 : 5) +
        (calibration.label === "calibrated" ? 15 : 8) +
        (deliberate.score / 10) * 15,
      0,
      100
    )
  );

  let readinessLabel = "Foundation";
  if (readinessIndex >= 80) readinessLabel = "Interview-ready momentum";
  else if (readinessIndex >= 65) readinessLabel = "Competitive range";
  else if (readinessIndex >= 45) readinessLabel = "Getting there";
  else if (readinessIndex >= 25) readinessLabel = "Early skill building";
  else readinessLabel = "Just getting started";

  const readinessInsight =
    sessions.length === 0
      ? "Readiness stacks with deliberate reps. Start with one behavioral session for a baseline."
      : `Mix of score level, trajectory, practice rhythm, confidence check, and deliberate-practice habits. Streak: ${streak} day${streak === 1 ? "" : "s"}.`;

  const coachingNarrative = buildNarrative({
    ...partial,
    recommendations,
    readinessIndex,
    readinessLabel,
    readinessInsight,
    coachingNarrative: [],
  });

  return {
    ...partial,
    recommendations,
    readinessIndex,
    readinessLabel,
    readinessInsight,
    coachingNarrative,
  };
}

function buildWeekly(
  sessions: InterviewSession[]
): { week: string; sessions: number; avgScore: number }[] {
  const map = new Map<string, number[]>();
  sessions.forEach((s) => {
    const d = new Date(s.completedAt || s.startedAt);
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(
      ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
    );
    const key = `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
    const arr = map.get(key) || [];
    arr.push(sessionScore(s));
    map.set(key, arr);
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([week, scores]) => ({
      week,
      sessions: scores.length,
      avgScore: average(scores),
    }));
}

function buildNarrative(p: PsychProfile): string[] {
  const lines: string[] = [];
  lines.push(
    `**Interview readiness:** ${p.readinessLabel} (${p.readinessIndex}/100). ${p.readinessInsight}`
  );
  lines.push(`**Trajectory:** ${p.trajectory.label}. ${p.trajectory.insight}`);
  lines.push(`**Practice rhythm:** ${p.cadence.spacingInsight}`);
  lines.push(
    `**Confidence check:** ${p.calibration.label}. ${p.calibration.insight}`
  );
  lines.push(`**Story skill:** ${p.narrativeInsight}`);
  lines.push(`**Deliberate practice:** ${p.deliberateInsight}`);
  if (p.topStrengths[0]) {
    lines.push(
      `**What keeps showing up as a strength:** “${p.topStrengths[0].text}” (recurring in feedback).`
    );
  }
  if (p.topImprovements[0]) {
    lines.push(
      `**Main growth edge:** “${p.topImprovements[0].text}” — make this week’s focus, fr.`
    );
  }
  lines.push(`**Mode transfer:** ${p.diversityInsight}`);
  lines.push(`**You vs the clock:** ${p.timedVsUntimed.insight}`);
  return lines;
}

export function dimensionBarColor(score: number): string {
  if (score >= 8) return "bg-emerald-500";
  if (score >= 6) return "bg-indigo-500";
  if (score >= 4) return "bg-amber-500";
  return "bg-rose-500";
}
