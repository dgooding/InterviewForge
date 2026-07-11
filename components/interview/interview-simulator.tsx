"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { v4 as uuidv4 } from "uuid";
import {
  Mic,
  MicOff,
  Volume2,
  Send,
  Loader2,
  Clock,
  ChevronRight,
  Flag,
  RotateCcw,
  Pause,
  Play,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers";
import {
  getQuestions,
  COMPANY_STYLES,
  getQuestionById,
  buildPracticeSet,
  categoryToInterviewMode,
} from "@/lib/questions";
import { JOB_ROLES, searchRoles } from "@/lib/roles";
import { RoleSearch } from "@/components/role-search";
import {
  generateLocalFeedback,
  questionsFromJobDescription,
} from "@/lib/ai-feedback";
import { average } from "@/lib/utils";
import type {
  InterviewMode,
  CompanyStyle,
  InterviewSession,
  InterviewAnswer,
  AIFeedback,
  InterviewQuestion,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FeedbackPanel } from "@/components/feedback-panel";
import {
  createSpeechRecorder,
  isSpeechRecognitionSupported,
  speakText,
  stopSpeaking,
} from "@/lib/speech";
import { cn } from "@/lib/utils";

export const INTERVIEW_MODES: {
  id: InterviewMode;
  label: string;
  desc: string;
  count: number;
  href: string;
}[] = [
  {
    id: "behavioral",
    label: "Behavioral",
    desc: "STAR stories, leadership, collaboration",
    count: 8,
    href: "/interview/behavioral",
  },
  {
    id: "technical",
    label: "Technical",
    desc: "Concepts, systems, role-specific depth",
    count: 8,
    href: "/interview/technical",
  },
  {
    id: "system-design",
    label: "System design",
    desc: "Architecture, trade-offs, scale",
    count: 6,
    href: "/interview/system-design",
  },
  {
    id: "mixed",
    label: "Mixed Mock",
    desc: "Full simulation with 12 questions",
    count: 12,
    href: "/interview/mixed",
  },
  {
    id: "company",
    label: "Company-Specific",
    desc: "Google, Meta, Amazon LP styles, and more",
    count: 10,
    href: "/interview/company",
  },
  {
    id: "jd",
    label: "From job description",
    desc: "Paste a JD → tailored questions",
    count: 8,
    href: "/interview/jd",
  },
];

const TIMER_SECONDS = 120;

const VALID_MODES = new Set(INTERVIEW_MODES.map((m) => m.id));

export function isInterviewMode(value: string): value is InterviewMode {
  return VALID_MODES.has(value as InterviewMode);
}

type InterviewSimulatorProps = {
  /** When set (from /interview/[mode]), lock this practice mode */
  forcedMode?: InterviewMode;
};

export function InterviewSimulator({ forcedMode }: InterviewSimulatorProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    user,
    selectedRole,
    setSelectedRole,
    addOrUpdateSession,
    completeSessionStreak,
  } = useApp();

  const [phase, setPhase] = useState<"setup" | "live" | "feedback" | "done">(
    "setup"
  );
  const bankQuestionId =
    searchParams.get("q") || searchParams.get("question") || "";
  const bankCategory = searchParams.get("category") || "";
  const bankDifficulty = searchParams.get("difficulty") || "";
  const autostart = searchParams.get("autostart") === "1";

  const initialMode = useMemo((): InterviewMode => {
    if (forcedMode && isInterviewMode(forcedMode)) return forcedMode;
    const m = searchParams.get("mode") as InterviewMode | null;
    if (m && isInterviewMode(m)) return m;
    if (bankQuestionId) {
      const q = getQuestionById(bankQuestionId);
      if (q) return categoryToInterviewMode(q.category);
    }
    if (bankCategory) {
      return categoryToInterviewMode(
        bankCategory as InterviewQuestion["category"]
      );
    }
    return "mixed";
  }, [forcedMode, searchParams, bankQuestionId, bankCategory]);

  const [mode, setMode] = useState<InterviewMode>(initialMode);
  const [companyStyle, setCompanyStyle] = useState<CompanyStyle>("google");
  const [customRole, setCustomRole] = useState("");
  const [untimed, setUntimed] = useState(
    // Single-question bank drills default to untimed focus mode
    Boolean(bankQuestionId)
  );
  const [jdText, setJdText] = useState("");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [feedbackSource, setFeedbackSource] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachMsg, setCoachMsg] = useState("");
  const [coachReply, setCoachReply] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);
  const [bankBanner, setBankBanner] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const recorderRef = useRef<ReturnType<typeof createSpeechRecorder>>(null);
  const didAutostart = useRef(false);

  // Keep mode locked to the URL when navigating between /interview/[mode]
  useEffect(() => {
    if (forcedMode && isInterviewMode(forcedMode) && forcedMode !== mode) {
      setMode(forcedMode);
      setPhase("setup");
      setSession(null);
      setFeedback(null);
      setAnswer("");
      setQuestions([]);
      setIndex(0);
      didAutostart.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when forcedMode route changes
  }, [forcedMode]);

  const speechOk = useMemo(() => isSpeechRecognitionSupported(), []);

  const currentQ = questions[index];

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = useCallback(
    (fromSeconds?: number) => {
      clearTimer();
      if (untimed) {
        setSecondsLeft(0);
        startedAtRef.current = Date.now();
        return;
      }
      setSecondsLeft(fromSeconds ?? TIMER_SECONDS);
      startedAtRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearTimer();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    },
    [untimed]
  );

  useEffect(() => () => clearTimer(), []);

  const resolveRole = () => {
    if (customRole.trim()) {
      setSelectedRole(customRole.trim());
      return customRole.trim();
    }
    return selectedRole || "Software Engineer";
  };

  const buildQuestionList = (opts?: {
    questionId?: string;
    category?: string;
    difficulty?: string;
    role?: string;
    activeMode?: InterviewMode;
    activeUntimed?: boolean;
  }): InterviewQuestion[] => {
    const role = opts?.role ?? resolveRole();
    const activeMode = opts?.activeMode ?? mode;
    const count = INTERVIEW_MODES.find((m) => m.id === activeMode)?.count ?? 10;
    const qid = opts?.questionId ?? bankQuestionId;
    const cat = opts?.category ?? bankCategory;
    const diff = opts?.difficulty ?? bankDifficulty;

    // Deep link from question bank: pin this prompt + related
    if (qid) {
      const set = buildPracticeSet(qid, 4);
      if (set.length > 0) return set;
    }

    // Category practice from bank filters
    if (cat) {
      return getQuestions({
        category: cat,
        difficulty: diff || undefined,
        role,
        limit: count,
      });
    }

    if (activeMode === "jd") {
      if (jdText.trim().length < 40) return [];
      return questionsFromJobDescription(jdText, role).map((q) => ({
        id: q.id,
        text: q.text,
        category: q.category as InterviewQuestion["category"],
        mode: "jd" as const,
        roles: ["all"],
        difficulty: "medium" as const,
      }));
    }

    if (activeMode === "system-design") {
      let qs = getQuestions({
        mode: "technical",
        role,
        category: "system-design",
        difficulty: diff || undefined,
        limit: count,
      });
      if (qs.length < 3) {
        qs = getQuestions({ mode: "technical", role, limit: count });
      }
      return qs;
    }

    return getQuestions({
      mode: activeMode === "mixed" ? "mixed" : activeMode,
      role,
      companyStyle: activeMode === "company" ? companyStyle : undefined,
      difficulty: diff || undefined,
      limit: count,
    });
  };

  const startInterview = (override?: {
    questionId?: string;
    category?: string;
    difficulty?: string;
    forceUntimed?: boolean;
  }) => {
    const role = resolveRole();
    const useUntimed = override?.forceUntimed ?? untimed;

    if (
      mode === "jd" &&
      !override?.questionId &&
      !override?.category &&
      jdText.trim().length < 40
    ) {
      toast.error("Paste a job description (at least ~40 characters).");
      return;
    }

    const qs = buildQuestionList({
      questionId: override?.questionId,
      category: override?.category,
      difficulty: override?.difficulty,
      role,
      activeMode: mode,
      activeUntimed: useUntimed,
    });

    if (qs.length === 0) {
      toast.error("No questions found for this setup. Try another mode.");
      return;
    }

    if (override?.questionId || bankQuestionId) {
      const primary = getQuestionById(
        override?.questionId || bankQuestionId
      );
      if (primary) {
        setBankBanner(`Practicing from bank: ${primary.text}`);
        setMode(categoryToInterviewMode(primary.category));
      }
    } else if (override?.category || bankCategory) {
      setBankBanner(
        `Category drill: ${override?.category || bankCategory}`
      );
    }

    const newSession: InterviewSession = {
      id: uuidv4(),
      userId: user?.id || "anonymous",
      role,
      mode,
      companyStyle: mode === "company" ? companyStyle : undefined,
      untimed: useUntimed,
      jobDescriptionExcerpt:
        mode === "jd" ? jdText.trim().slice(0, 500) : undefined,
      startedAt: new Date().toISOString(),
      answers: [],
      status: "in_progress",
    };
    setSession(newSession);
    setQuestions(qs);
    setIndex(0);
    setAnswer("");
    setFeedback(null);
    setPaused(false);
    setPhase("live");
    if (useUntimed) {
      setUntimed(true);
      clearTimer();
      setSecondsLeft(0);
      startedAtRef.current = Date.now();
    } else {
      startTimer();
    }
    addOrUpdateSession(newSession);
    toast.success(
      useUntimed ? "Drill started (untimed)" : "Interview started — good luck!"
    );
  };

  // Deep links from /questions: ?q=b01&autostart=1 or ?category=behavioral&autostart=1
  useEffect(() => {
    if (didAutostart.current) return;
    if (!autostart) return;
    if (phase !== "setup") return;
    if (!bankQuestionId && !bankCategory) return;
    didAutostart.current = true;
    // Defer so role state is ready
    const t = window.setTimeout(() => {
      startInterview({
        questionId: bankQuestionId || undefined,
        category: bankCategory || undefined,
        difficulty: bankDifficulty || undefined,
        forceUntimed: Boolean(bankQuestionId),
      });
    }, 50);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on entry deep link
  }, [autostart, bankQuestionId, bankCategory, bankDifficulty, phase]);

  const pauseSession = () => {
    if (!session || phase !== "live") return;
    clearTimer();
    stopRecording();
    setPaused(true);
    const updated: InterviewSession = {
      ...session,
      status: "paused",
      pausedQuestionIds: questions.map((q) => q.id),
      pausedIndex: index,
      pausedSecondsLeft: secondsLeft,
    };
    setSession(updated);
    addOrUpdateSession(updated);
    toast.message("Session paused — resume anytime");
  };

  const resumeSession = () => {
    if (!session) return;
    setPaused(false);
    const updated: InterviewSession = {
      ...session,
      status: "in_progress",
    };
    setSession(updated);
    addOrUpdateSession(updated);
    startTimer(session.pausedSecondsLeft ?? TIMER_SECONDS);
    setPhase("live");
    toast.success("Resumed");
  };

  const askCoach = async () => {
    if (!coachMsg.trim()) return;
    setCoachLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: coachMsg,
          context: currentQ
            ? `Q: ${currentQ.text}\nDraft: ${answer.slice(0, 400)}`
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Coach unavailable");
        return;
      }
      setCoachReply(data.reply);
    } catch {
      toast.error("Could not reach coach");
    } finally {
      setCoachLoading(false);
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const toggleRecord = () => {
    if (recording) {
      stopRecording();
      return;
    }
    if (!speechOk) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }
    const rec = createSpeechRecorder(
      (transcript, isFinal) => {
        if (isFinal) {
          setAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript).trim());
          setInterim("");
        } else {
          setInterim(transcript);
        }
      },
      (err) => {
        toast.error(`Mic error: ${err}`);
        setRecording(false);
      }
    );
    if (!rec) return;
    recorderRef.current = rec;
    rec.start();
    setRecording(true);
    toast.message("Listening… speak your answer");
  };

  const speakQuestion = () => {
    if (currentQ) speakText(currentQ.text);
  };

  const applyFeedback = (
    fb: AIFeedback,
    text: string,
    source: string
  ) => {
    if (!currentQ || !session) return;
    setFeedback(fb);
    setFeedbackSource(source);

    const durationSeconds = Math.round(
      (Date.now() - startedAtRef.current) / 1000
    );
    const entry: InterviewAnswer = {
      questionId: currentQ.id,
      questionText: currentQ.text,
      answerText: text,
      feedback: fb,
      durationSeconds,
      answeredAt: new Date().toISOString(),
    };
    const updated: InterviewSession = {
      ...session,
      answers: [...session.answers, entry],
    };
    setSession(updated);
    addOrUpdateSession(updated);
    setPhase("feedback");

    if (fb.scores.overall >= 8.5) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#6366f1", "#8b5cf6", "#a78bfa", "#34d399"],
      });
    }
  };

  const submitAnswer = async () => {
    if (!currentQ || !session) return;
    const text = (answer + (interim ? ` ${interim}` : "")).trim();
    if (text.length < 10) {
      toast.error("Write a bit more before submitting (10+ characters).");
      return;
    }
    stopRecording();
    stopSpeaking();
    clearTimer();
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQ.text,
          answer: text,
          mode: session.mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const local = generateLocalFeedback(
          currentQ.text,
          text,
          session.mode
        );
        applyFeedback(local, text, "offline");
        toast.message("Used offline scoring (API error)");
        return;
      }
      applyFeedback(data.feedback as AIFeedback, text, data.source || "api");
    } catch {
      const local = generateLocalFeedback(
        currentQ.text,
        text,
        session.mode
      );
      applyFeedback(local, text, "offline");
      toast.message("Network offline — used local coaching engine");
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (!session) return;
    if (index + 1 >= questions.length) {
      finishSession(session);
      return;
    }
    setIndex((i) => i + 1);
    setAnswer("");
    setInterim("");
    setFeedback(null);
    setPhase("live");
    startTimer();
  };

  const finishSession = (s: InterviewSession) => {
    const overall = average(s.answers.map((a) => a.feedback.scores.overall));
    const completed: InterviewSession = {
      ...s,
      status: "completed",
      completedAt: new Date().toISOString(),
      overallScore: overall,
    };
    setSession(completed);
    addOrUpdateSession(completed);
    completeSessionStreak();
    setPhase("done");
    if (overall >= 8) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    }
    toast.success(`Session complete — overall ${overall.toFixed(1)}/10`);
  };

  const timerPct = (secondsLeft / TIMER_SECONDS) * 100;
  const timerUrgent = secondsLeft <= 20;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <AnimatePresence mode="wait">
        {phase === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="-ml-2 mb-2"
                >
                  <a href="/interview">← All modes</a>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">
                  {INTERVIEW_MODES.find((m) => m.id === mode)?.label ||
                    "Mock Interview"}
                </h1>
                <p className="mt-1 text-muted-foreground">
                  {INTERVIEW_MODES.find((m) => m.id === mode)?.desc ||
                    "Answer timed questions with text or voice. Progress saves on this device."}
                </p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {mode.replace("-", " ")} session
              </Badge>
            </div>

            {(bankQuestionId || bankCategory || bankBanner) && (
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">
                  {bankBanner ||
                    (bankQuestionId
                      ? `Loaded from question bank (${bankQuestionId})`
                      : `Category filter: ${bankCategory}`)}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {autostart
                    ? "Starting your practice set…"
                    : "Press Start when ready, or adjust role below."}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href="/questions">Back to question bank</a>
                  </Button>
                  {bankQuestionId && (
                    <Button asChild size="sm" variant="ghost">
                      <a href={`/questions/${bankQuestionId}`}>
                        Question details
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium">Target role</p>
              <div className="flex flex-wrap gap-2">
                {searchRoles("", 8).map((r) => {
                  const active =
                    (customRole.trim() || selectedRole || "") === r.title;
                  return (
                    <Button
                      key={r.id}
                      size="sm"
                      type="button"
                      variant={active ? "default" : "outline"}
                      onClick={() => {
                        setCustomRole("");
                        setSelectedRole(r.title);
                        toast.success(`Role set: ${r.title}`, {
                          id: "role-set",
                          duration: 1500,
                        });
                      }}
                    >
                      {r.title}
                    </Button>
                  );
                })}
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/roles")}
                >
                  Browse all roles
                </Button>
              </div>
              <RoleSearch
                value={
                  customRole.trim() ||
                  selectedRole ||
                  "Software Engineer"
                }
                onSelect={(title) => {
                  const known = JOB_ROLES.some((r) => r.title === title);
                  if (known) {
                    setCustomRole("");
                    setSelectedRole(title);
                  } else {
                    setCustomRole(title);
                    setSelectedRole(title);
                  }
                  toast.success(`Role set: ${title}`, {
                    id: "role-set",
                    duration: 1500,
                  });
                }}
                placeholder="Search roles (IT Service Desk, Frontend…)"
              />
            </div>

            {/* Mode is locked by URL; quick switch to other full modes */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">Switch mode</p>
              <div className="flex flex-wrap gap-2">
                {INTERVIEW_MODES.map((m) => (
                  <Button
                    key={m.id}
                    size="sm"
                    type="button"
                    variant={mode === m.id ? "default" : "outline"}
                    onClick={() => {
                      if (m.id === mode) return;
                      router.push(m.href);
                    }}
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
            </div>

            {mode === "company" && (
              <div className="mt-6">
                <p className="mb-3 text-sm font-medium">Company style</p>
                <div className="flex flex-wrap gap-2">
                  {COMPANY_STYLES.map((c) => (
                    <Button
                      key={c.id}
                      size="sm"
                      variant={companyStyle === c.id ? "default" : "outline"}
                      onClick={() => setCompanyStyle(c.id)}
                    >
                      {c.label}
                    </Button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {
                    COMPANY_STYLES.find((c) => c.id === companyStyle)?.blurb
                  }
                </p>
              </div>
            )}

            {mode === "jd" && (
              <div className="mt-6 space-y-2">
                <p className="text-sm font-medium">Paste job description</p>
                <Textarea
                  placeholder="Paste the JD here — we'll generate tailored questions…"
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  className="min-h-[140px]"
                />
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                size="sm"
                variant={!untimed ? "default" : "outline"}
                onClick={() => setUntimed(false)}
              >
                Timed (2 min)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={untimed ? "default" : "outline"}
                onClick={() => setUntimed(true)}
              >
                Untimed drill
              </Button>
              <span className="text-xs text-muted-foreground">
                {untimed
                  ? "No countdown — practice at your pace"
                  : "2-minute timer per question"}
              </span>
            </div>

            <div className="mt-10 flex justify-center">
              <Button
                variant="gradient"
                size="lg"
                type="button"
                onClick={() => startInterview()}
              >
                Begin interview
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {(phase === "live" || phase === "feedback") && currentQ && (
          <motion.div
            key={`q-${index}-${phase}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge variant="secondary">
                  Question {index + 1} of {questions.length}
                </Badge>
                <Badge variant="outline" className="ml-2 capitalize">
                  {currentQ.difficulty}
                </Badge>
                <Badge variant="outline" className="ml-2">
                  {currentQ.category}
                </Badge>
              </div>
              {phase === "live" && !untimed && !paused && (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
                    timerUrgent
                      ? "bg-rose-500/15 text-rose-500"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Clock className="h-4 w-4" />
                  {Math.floor(secondsLeft / 60)}:
                  {String(secondsLeft % 60).padStart(2, "0")}
                </div>
              )}
              {phase === "live" && untimed && (
                <Badge variant="secondary">Untimed</Badge>
              )}
              {paused && <Badge variant="warning">Paused</Badge>}
            </div>

            <Progress
              value={((index + (phase === "feedback" ? 1 : 0)) / questions.length) * 100}
            />

            {phase === "live" && !untimed && !paused && (
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full transition-all",
                    timerUrgent ? "bg-rose-500" : "bg-primary"
                  )}
                  style={{ width: `${timerPct}%` }}
                />
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-xl leading-snug">
                  {currentQ.text}
                </CardTitle>
                {currentQ.tips && (
                  <CardDescription>Tip: {currentQ.tips}</CardDescription>
                )}
              </CardHeader>
              {phase === "live" && (
                <CardContent className="space-y-4">
                  {paused ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <p className="text-muted-foreground">
                        Session paused. Your draft answer is saved.
                      </p>
                      <Button variant="gradient" onClick={resumeSession}>
                        <Play className="h-4 w-4" />
                        Resume
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={speakQuestion}
                        >
                          <Volume2 className="h-4 w-4" />
                          Read question
                        </Button>
                        <Button
                          type="button"
                          variant={recording ? "destructive" : "outline"}
                          size="sm"
                          onClick={toggleRecord}
                        >
                          {recording ? (
                            <>
                              <MicOff className="h-4 w-4" />
                              Stop recording
                            </>
                          ) : (
                            <>
                              <Mic className="h-4 w-4" />
                              Record answer
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={pauseSession}
                        >
                          <Pause className="h-4 w-4" />
                          Pause
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCoachOpen((o) => !o)}
                        >
                          <MessageCircle className="h-4 w-4" />
                          Ask coach
                        </Button>
                      </div>
                      {coachOpen && (
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
                          <Textarea
                            placeholder="Ask the coach anything (STAR tips, nerves, technical depth…)"
                            value={coachMsg}
                            onChange={(e) => setCoachMsg(e.target.value)}
                            className="min-h-[72px]"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={coachLoading}
                            onClick={() => void askCoach()}
                          >
                            {coachLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Get tip"
                            )}
                          </Button>
                          {coachReply && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {coachReply}
                            </p>
                          )}
                        </div>
                      )}
                      <Textarea
                        placeholder="Type your answer here… Use STAR for behavioral questions."
                        value={
                          interim
                            ? `${answer}${answer ? " " : ""}${interim}`
                            : answer
                        }
                        onChange={(e) => {
                          setAnswer(e.target.value);
                          setInterim("");
                        }}
                        className="min-h-[180px] text-base"
                        disabled={submitting}
                      />
                      {recording && (
                        <p className="animate-pulse-soft text-xs text-rose-500">
                          ● Recording — speech will append to your answer
                        </p>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="gradient"
                          onClick={submitAnswer}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Submit answer
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              )}
            </Card>

            {phase === "feedback" && feedback && (
              <>
                {feedbackSource && (
                  <p className="text-xs text-muted-foreground">
                    Feedback source:{" "}
                    {feedbackSource === "xai"
                      ? "AI enhanced"
                      : feedbackSource === "offline"
                        ? "Offline local coach"
                        : feedbackSource === "local" ||
                            feedbackSource === "local-fallback"
                          ? "Local coaching engine"
                          : feedbackSource}
                  </p>
                )}
                <FeedbackPanel feedback={feedback} />
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" onClick={() => finishSession(session!)}>
                    <Flag className="h-4 w-4" />
                    End session
                  </Button>
                  <Button variant="gradient" onClick={nextQuestion}>
                    {index + 1 >= questions.length
                      ? "Finish interview"
                      : "Next question"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {phase === "done" && session && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-glow">
              <Flag className="h-8 w-8" />
            </div>
            <h1 className="mt-6 text-3xl font-bold">Interview complete!</h1>
            <p className="mt-2 text-muted-foreground">
              Overall score for this session
            </p>
            <p className="mt-2 text-6xl font-bold text-primary">
              {session.overallScore?.toFixed(1)}
              <span className="text-2xl text-muted-foreground">/10</span>
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              {session.answers.length} questions · {session.role} · {session.mode}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => router.push("/history")}>
                View history & export
              </Button>
              <Button variant="outline" onClick={() => router.push("/analytics")}>
                Analytics
              </Button>
              <Button
                variant="gradient"
                onClick={() => {
                  setPhase("setup");
                  setSession(null);
                  setFeedback(null);
                  setAnswer("");
                  setQuestions([]);
                  setIndex(0);
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Practice again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/interview")}
              >
                All modes
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
