"use client";

import { useCallback, useState } from "react";
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
} from "lucide-react";
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
import { cn } from "@/lib/utils";

async function extractTextFromPdf(file: File): Promise<string> {
  // Prefer pdfjs when available; fall back to raw text read for .txt
  if (file.type === "text/plain" || file.name.endsWith(".txt")) {
    return file.text();
  }

  try {
    const pdfjs = await import("pdfjs-dist");
    // Use CDN worker for pdfjs in browser
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({ data }).promise;
    const pages: string[] = [];
    const max = Math.min(doc.numPages, 8);
    for (let i = 1; i <= max; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? String(item.str) : ""))
        .join(" ");
      pages.push(text);
    }
    return pages.join("\n");
  } catch (err) {
    console.warn("PDF parse failed", err);
    // Last resort: try reading as text (won't work well for binary PDFs)
    try {
      return await file.text();
    } catch {
      return "";
    }
  }
}

export default function ResumePage() {
  const { resumeAnalysis, setResumeAnalysis } = useApp();
  const [loading, setLoading] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [fileName, setFileName] = useState("pasted-resume.txt");

  const analyze = async (text: string, name: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, fileName: name }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Analysis failed");
        return;
      }
      const analysis: ResumeAnalysis = {
        id: uuidv4(),
        fileName: name,
        uploadedAt: new Date().toISOString(),
        summary: data.analysis.summary,
        strengths: data.analysis.strengths,
        talkingPoints: data.analysis.talkingPoints,
        suggestedRoles: data.analysis.suggestedRoles,
        rawTextExcerpt: text.slice(0, 500),
      };
      setResumeAnalysis(analysis);
      toast.success(
        data.source === "xai"
          ? "Resume analyzed with SpaceXAI"
          : "Resume analyzed (local AI engine)"
      );
    } catch {
      toast.error("Network error analyzing resume");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      if (file.size > 4 * 1024 * 1024) {
        toast.error("Please upload a file under 4MB");
        return;
      }
      setFileName(file.name);
      toast.message("Extracting text…");
      const text = await extractTextFromPdf(file);
      if (!text || text.trim().length < 40) {
        toast.error(
          "Couldn't extract text from that PDF. Paste key bullets below instead."
        );
        return;
      }
      await analyze(text, file.name);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    disabled: loading,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">
          Resume Upload & Analysis
        </h1>
        <p className="mt-1 text-muted-foreground">
          Drop a PDF resume for AI strengths, talking points, and role suggestions.
        </p>

        <Card className="mt-8">
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/30",
                loading && "pointer-events-none opacity-60"
              )}
            >
              <input {...getInputProps()} />
              {loading ? (
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              ) : (
                <Upload className="h-10 w-10 text-primary" />
              )}
              <p className="mt-4 font-medium">
                {isDragActive
                  ? "Drop your resume here"
                  : "Drag & drop PDF or click to browse"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                PDF or TXT · max 4MB · processed in-browser then analyzed server-side
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium">Or paste resume text</p>
              <Textarea
                placeholder="Paste experience bullets, skills, education…"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="min-h-[140px]"
              />
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
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    {resumeAnalysis.fileName}
                  </CardTitle>
                  <Badge variant="secondary">
                    {new Date(resumeAnalysis.uploadedAt).toLocaleDateString()}
                  </Badge>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  {resumeAnalysis.summary}
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Strengths
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
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Talking points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {resumeAnalysis.talkingPoints.map((s, i) => (
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
                  <Briefcase className="h-4 w-4 text-primary" />
                  Suggested roles
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {resumeAnalysis.suggestedRoles.map((r) => (
                  <Badge key={r} variant="secondary">
                    {r}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
