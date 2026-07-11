"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  Briefcase,
  AlertTriangle,
  MessageSquareQuote,
  RefreshCw,
  Trash2,
  Mic,
  Copy,
  HelpCircle,
} from "lucide-react";
import { copyToClipboard } from "@/lib/copy";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import type { ResumeAnalysis } from "@/lib/types";
import { generateLocalResumeAnalysis } from "@/lib/ai-feedback";
import { extractTextFromFile } from "@/lib/pdf-extract";
import { cn } from "@/lib/utils";

export default function ResumePage() {
  const { resumeAnalysis, setResumeAnalysis, setSelectedRole } = useApp();
  const [loading, setLoading] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [fileName, setFileName] = useState("pasted-resume.txt");
  const [extractHint, setExtractHint] = useState<string | null>(null);

  const analyze = useCallback(
    async (text: string, name: string) => {
      if (text.trim().length < 40) {
        toast.error("Need at least ~40 characters of resume stuff, fr.");
        return;
      }
      setLoading(true);
      setExtractHint(null);

      try {
        const res = await fetch("/api/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, fileName: name }),
        });
        const data = await res.json();

        if (!res.ok) {
          const local = generateLocalResumeAnalysis(text, name);
          const analysis: ResumeAnalysis = {
            id: uuidv4(),
            fileName: name,
            uploadedAt: new Date().toISOString(),
            ...local,
            rawTextExcerpt: text.slice(0, 500),
            source: "offline",
          };
          setResumeAnalysis(analysis);
          toast.message("Used offline coach (API was mid)");
          return;
        }

        const a = data.analysis;
        const analysis: ResumeAnalysis = {
          id: uuidv4(),
          fileName: name,
          uploadedAt: new Date().toISOString(),
          summary: a.summary,
          strengths: a.strengths || [],
          weaknesses: a.weaknesses || [],
          experienceHighlights: a.experienceHighlights || [],
          talkingPoints: a.talkingPoints || [],
          sampleAnswers: a.sampleAnswers || [],
          suggestedRoles: a.suggestedRoles || [],
          suggestedQuestions: a.suggestedQuestions || [],
          atsScore: a.atsScore,
          atsTips: a.atsTips || [],
          rawTextExcerpt: text.slice(0, 500),
          source: data.source,
        };
        setResumeAnalysis(analysis);

        if (data.source === "xai") {
          toast.success("Resume analyzed with AI — bet");
        } else {
          toast.success("Resume analyzed (local coach)");
        }
      } catch {
        const local = generateLocalResumeAnalysis(text, name);
        const analysis: ResumeAnalysis = {
          id: uuidv4(),
          fileName: name,
          uploadedAt: new Date().toISOString(),
          ...local,
          rawTextExcerpt: text.slice(0, 500),
          source: "offline",
        };
        setResumeAnalysis(analysis);
        toast.message("Offline rn — local coach took over");
      } finally {
        setLoading(false);
      }
    },
    [setResumeAnalysis]
  );

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      if (file.size > 4 * 1024 * 1024) {
        toast.error("Keep it under 4MB, please");
        return;
      }
      setFileName(file.name);
      toast.message("Pulling text from your resume…");
      const { text, error } = await extractTextFromFile(file);
      if (error) setExtractHint(error);
      if (!text || text.trim().length < 40) {
        toast.error(
          error ||
            "Couldn't grab the text. Paste the key bullets below instead."
        );
        return;
      }
      await analyze(text, file.name);
    },
    [analyze]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    disabled: loading,
    multiple: false,
  });

  const clearAnalysis = () => {
    setResumeAnalysis(null);
    setPasteText("");
    setExtractHint(null);
    toast.message("Cleared — drop a new resume whenever");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Resume Intelligence
            </h1>
            <p className="mt-1 text-muted-foreground">
              Upload a PDF and get strengths, gaps, talking points, and sample
              answers you can actually use. lowkey clutch.
            </p>
          </div>
          {resumeAnalysis && (
            <Button variant="outline" size="sm" onClick={clearAnalysis}>
              <Trash2 className="h-4 w-4" />
              Clear & re-upload
            </Button>
          )}
        </div>

        <Card className="mt-8">
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              role="button"
              tabIndex={0}
              aria-label="Upload resume PDF or text file"
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/30",
                loading && "pointer-events-none opacity-60"
              )}
            >
              <input {...getInputProps()} aria-hidden />
              {loading ? (
                <Loader2
                  className="h-10 w-10 animate-spin text-primary"
                  aria-hidden
                />
              ) : (
                <Upload className="h-10 w-10 text-primary" aria-hidden />
              )}
              <p className="mt-4 font-medium">
                {isDragActive
                  ? "Drop it here"
                  : "Drag & drop a PDF or click to browse"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                PDF or TXT · max 4MB · parsed in-browser, then analyzed
              </p>
              {loading && (
                <p className="mt-3 text-sm text-primary" role="status">
                  Cooking your resume analysis…
                </p>
              )}
            </div>

            {extractHint && (
              <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                {extractHint}
              </p>
            )}

            <div className="mt-6 space-y-2">
              <label htmlFor="resume-paste" className="text-sm font-medium">
                Or just paste the text
              </label>
              <Textarea
                id="resume-paste"
                placeholder="Paste experience bullets, skills, education…"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="min-h-[140px]"
                disabled={loading}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={loading || pasteText.trim().length < 40}
                  onClick={() => analyze(pasteText, fileName)}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Analyze pasted text
                </Button>
                {resumeAnalysis && (
                  <Button
                    variant="ghost"
                    disabled={loading}
                    onClick={() =>
                      analyze(
                        pasteText.length >= 40
                          ? pasteText
                          : resumeAnalysis.rawTextExcerpt || pasteText,
                        resumeAnalysis.fileName
                      )
                    }
                  >
                    <RefreshCw className="h-4 w-4" />
                    Run it again
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {resumeAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-4"
          >
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" aria-hidden />
                  <CardTitle className="text-lg">
                    {resumeAnalysis.fileName}
                  </CardTitle>
                  <Badge variant="secondary">
                    {new Date(resumeAnalysis.uploadedAt).toLocaleString()}
                  </Badge>
                  {resumeAnalysis.source && (
                    <Badge variant="outline" className="capitalize">
                      {resumeAnalysis.source === "xai"
                        ? "AI enhanced"
                        : resumeAnalysis.source === "offline"
                          ? "Offline coach"
                          : "Local coach"}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-base leading-relaxed">
                  {resumeAnalysis.summary}
                </CardDescription>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const ok = await copyToClipboard(resumeAnalysis.summary);
                      toast.success(ok ? "Summary copied" : "Copy failed, ngl");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy summary
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {typeof resumeAnalysis.atsScore === "number" && (
              <Card className="border-primary/15">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">ATS-style score</CardTitle>
                  <CardDescription>
                    Local heuristic for keywords + impact signals — not a
                    real employer ATS, tbh.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-primary">
                    {resumeAnalysis.atsScore}
                    <span className="text-lg text-muted-foreground">/100</span>
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {(resumeAnalysis.atsTips || []).map((t, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        · {t}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    What slapped
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {resumeAnalysis.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Gaps & upgrades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(resumeAnalysis.weaknesses?.length
                      ? resumeAnalysis.weaknesses
                      : ["No major gaps flagged — keep quantifying impact."]
                    ).map((s, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  Experience highlights
                </CardTitle>
                <CardDescription>
                  Pulled from your resume for quick interview prep
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(resumeAnalysis.experienceHighlights?.length
                    ? resumeAnalysis.experienceHighlights
                    : []
                  ).map((h, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                    >
                      {h}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Talking points
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const ok = await copyToClipboard(
                      resumeAnalysis.talkingPoints.join("\n• ")
                    );
                    toast.success(ok ? "Talking points copied" : "Copy failed, ngl");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy all
                </Button>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {resumeAnalysis.talkingPoints.map((s, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {(resumeAnalysis.suggestedQuestions?.length ?? 0) > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    Practice questions to try
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {resumeAnalysis.suggestedQuestions!.map((q, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-2 rounded-lg border border-border/50 px-3 py-2 text-sm"
                    >
                      <span>{q}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={async () => {
                          const ok = await copyToClipboard(q);
                          toast.success(ok ? "Copied" : "Copy failed");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {(resumeAnalysis.sampleAnswers?.length ?? 0) > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquareQuote className="h-4 w-4 text-primary" />
                    Sample interview answers
                  </CardTitle>
                  <CardDescription>
                    Use as outlines — personalize with your metrics, fr
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resumeAnalysis.sampleAnswers.map((sa, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-border/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-primary">
                          {sa.prompt}
                        </p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0"
                          onClick={async () => {
                            const ok = await copyToClipboard(
                              `${sa.prompt}\n\n${sa.answer}`
                            );
                            toast.success(ok ? "Copied" : "Copy failed");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {sa.answer}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Roles that fit
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {resumeAnalysis.suggestedRoles.map((r) => (
                  <Button
                    key={r}
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedRole(r);
                      toast.success(`Bet — target role: ${r}`);
                    }}
                  >
                    {r}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button asChild variant="gradient">
                <Link href="/interview">
                  <Mic className="h-4 w-4" />
                  Practice with a mock
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/roles">See all roles</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
