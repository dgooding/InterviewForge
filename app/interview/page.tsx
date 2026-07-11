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
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers";
import { getQuestions, COMPANY_STYLES } from "@/lib/questions";
import { JOB_ROLES } from "@/lib/roles";
import { generateLocalFeedback } from "@/lib/ai-feedback";
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

const MODES: {
  id: InterviewMode;
  label: string;
  desc: string;
  count: number;
}[] = [
  {
    id: "behavioral",
    label: "Behavioral",
    desc: "STAR stories, leadership, collaboration",
    count: 8,
  },
  {
    id: "technical",
    label: "Technical",
    desc: "Concepts, systems, role-specific depth",
    count: 8,
  },
  {
    id: "mixed",
    label: "Mixed Mock",
    desc: "Full simulation with 12 questions",
    count: 12,
  },
  {
    id: "company",
    label: "Company-Specific",
    desc: "Google, Meta, Amazon LP styles, and more",
    count: 10,
  },
];

const TIMER_SECONDS = 120;

export default function InterviewPage() {
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
  const [mode, setMode] = useState<InterviewMode>(
    (searchParams.get("mode") as InterviewMode) || "mixed"
  );
  const [companyStyle, setCompanyStyle] = useState<CompanyStyle>("google");
  const [customRole, setCustomRole] = useState("");
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const recorderRef = useRef<ReturnType<typeof createSpeechRecorder>>(null);

  const speechOk = useMemo(() => isSpeechRecognitionSupported(), []);

  const currentQ = questions[index];

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = useCallback(() => {
    clearTimer();
    setSecondsLeft(TIMER_SECONDS);
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
  }, []);

  useEffect(() => () => clearTimer(), []);

  const resolveRole = () => {
    if (customRole.trim()) {
      setSelectedRole(customRole.trim());
      return customRole.trim();
    }
    return selectedRole || "Software Engineer";
  };

  const startInterview = () => {
    const role = resolveRole();
    const count = MODES.find((m) => m.id === mode)?.count ?? 10;
    const qs = getQuestions({
      mode,
      role,
      companyStyle: mode === "company" ? companyStyle : undefined,
      limit: count,
    });
    if (qs.length === 0) {
      toast.error("No questions found for this setup. Try another mode.");
      return;
    }
    const newSession: InterviewSession = {
      id: uuidv4(),
      userId: user?.id || "anonymous",
      role,
      mode,
      companyStyle: mode === "company" ? companyStyle : undefined,
      startedAt: new Date().toISOString(),
      answers: [],
      status: "in_progress",
    };
    setSession(newSession);
    setQuestions(qs);
    setIndex(0);
    setAnswer("");
    setFeedback(null);
    setPhase("live");
    startTimer();
    addOrUpdateSession(newSession);
    toast.success("Interview started — good luck!");
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
            <h1 className="text-3xl font-bold tracking-tight">
              Mock Interview Simulator
            </h1>
            <p className="mt-1 text-muted-foreground">
              Pick a role and mode, then answer timed questions with text or
              voice. Progress saves automatically on this device.
            </p>

            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium">Target role</p>
              <div className="flex flex-wrap gap-2">
                {JOB_ROLES.filter((r) => r.popular).map((r) => (
                  <Button
                    key={r.id}
                    size="sm"
                    type="button"
                    variant={
                      selectedRole === r.title && !customRole
                        ? "default"
                        : "outline"
                    }
                    onClick={() => {
                      setCustomRole("");
                      setSelectedRole(r.title);
                    }}
                  >
                    {r.title}
                  </Button>
                ))}
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/roles")}
                >
                  Browse all roles
                </Button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  aria-label="Custom role"
                  placeholder="Or type a custom role…"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Active:{" "}
                <span className="font-medium text-foreground">
                  {customRole.trim() ||
                    selectedRole ||
                    "Software Engineer (default)"}
                </span>
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {MODES.map((m) => (
                <Card
                  key={m.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    mode === m.id &&
                      "border-primary shadow-glow ring-1 ring-primary/30"
                  )}
                  onClick={() => setMode(m.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{m.label}</CardTitle>
                    <CardDescription>{m.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">{m.count} questions</Badge>
                  </CardContent>
                </Card>
              ))}
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

            <div className="mt-10 flex justify-center">
              <Button variant="gradient" size="lg" onClick={startInterview}>
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
              {phase === "live" && (
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
            </div>

            <Progress
              value={((index + (phase === "feedback" ? 1 : 0)) / questions.length) * 100}
            />

            {phase === "live" && (
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
                  </div>
                  <Textarea
                    placeholder="Type your answer here… Use STAR for behavioral questions."
                    value={
                      interim ? `${answer}${answer ? " " : ""}${interim}` : answer
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
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Practice again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
