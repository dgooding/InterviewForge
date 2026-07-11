import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateLocalFeedback } from "@/lib/ai-feedback";
import type { AIFeedback, InterviewMode } from "@/lib/types";

/**
 * POST /api/feedback
 * Body: { question, answer, mode }
 *
 * Uses SpaceXAI (xAI) when XAI_API_KEY is set; otherwise heuristic engine.
 * Base URL: https://api.x.ai/v1  |  Model: grok-4.5 (or XAI_MODEL)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = String(body.question || "");
    const answer = String(body.answer || "");
    const mode = (body.mode || "behavioral") as InterviewMode;

    if (!question.trim() || !answer.trim()) {
      return NextResponse.json(
        { error: "Question and answer are required." },
        { status: 400 }
      );
    }

    const local = generateLocalFeedback(question, answer, mode);
    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        feedback: local,
        source: "local",
      });
    }

    try {
      const client = new OpenAI({
        apiKey,
        baseURL: "https://api.x.ai/v1",
      });

      const model = process.env.XAI_MODEL || "grok-4.5";

      const completion = await client.chat.completions.create({
        model,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: `You are an expert interview coach. Score the candidate's answer and return ONLY valid JSON matching this schema:
{
  "scores": {
    "clarity": number 1-10,
    "relevance": number 1-10,
    "structure": number 1-10,
    "technicalAccuracy": number 1-10,
    "confidence": number 1-10,
    "overall": number 1-10
  },
  "strengths": string[2-4],
  "improvements": string[2-4],
  "sampleBetterAnswer": string,
  "keyPhrases": string[3-5],
  "followUpQuestion": string,
  "summary": string
}
Be constructive, specific, and professional. Interview mode: ${mode}.`,
          },
          {
            role: "user",
            content: `Question: ${question}\n\nCandidate answer:\n${answer}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw) as AIFeedback;

      // Merge safeguards
      const feedback: AIFeedback = {
        scores: {
          clarity: num(parsed.scores?.clarity, local.scores.clarity),
          relevance: num(parsed.scores?.relevance, local.scores.relevance),
          structure: num(parsed.scores?.structure, local.scores.structure),
          technicalAccuracy: num(
            parsed.scores?.technicalAccuracy,
            local.scores.technicalAccuracy
          ),
          confidence: num(parsed.scores?.confidence, local.scores.confidence),
          overall: num(parsed.scores?.overall, local.scores.overall),
        },
        strengths:
          Array.isArray(parsed.strengths) && parsed.strengths.length
            ? parsed.strengths
            : local.strengths,
        improvements:
          Array.isArray(parsed.improvements) && parsed.improvements.length
            ? parsed.improvements
            : local.improvements,
        sampleBetterAnswer:
          parsed.sampleBetterAnswer || local.sampleBetterAnswer,
        keyPhrases:
          Array.isArray(parsed.keyPhrases) && parsed.keyPhrases.length
            ? parsed.keyPhrases
            : local.keyPhrases,
        followUpQuestion: parsed.followUpQuestion || local.followUpQuestion,
        summary: parsed.summary || local.summary,
      };

      return NextResponse.json({ feedback, source: "xai" });
    } catch (err) {
      console.error("xAI feedback error, falling back to local:", err);
      return NextResponse.json({
        feedback: local,
        source: "local-fallback",
      });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  if (Number.isFinite(n) && n >= 1 && n <= 10) return Math.round(n * 10) / 10;
  return fallback;
}
