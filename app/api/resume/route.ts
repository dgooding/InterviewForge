import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  generateLocalResumeAnalysis,
  type LocalResumeResult,
} from "@/lib/ai-feedback";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/resume
 * Body: { text, fileName }
 */
export async function POST(req: NextRequest) {
  const rl = rateLimit(`resume:${clientKeyFromRequest(req)}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry in ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const text = String(body.text || "");
    const fileName = String(body.fileName || "resume.pdf");

    if (!text.trim() || text.trim().length < 40) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough text from the resume. Paste key bullets or try another PDF.",
        },
        { status: 400 }
      );
    }

    const excerpt = text.slice(0, 10000);
    const local = generateLocalResumeAnalysis(excerpt, fileName);
    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ analysis: local, source: "local" });
    }

    try {
      const client = new OpenAI({
        apiKey,
        baseURL: "https://api.x.ai/v1",
      });
      const model = process.env.XAI_MODEL || "grok-4.5";

      const completion = await client.chat.completions.create({
        model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You are an expert career coach. Return ONLY valid JSON:
{
  "summary": string,
  "strengths": string[3-5],
  "weaknesses": string[2-4],
  "experienceHighlights": string[3-6],
  "talkingPoints": string[3-6],
  "sampleAnswers": [{"prompt": string, "answer": string}],
  "suggestedRoles": string[2-5],
  "suggestedQuestions": string[3-6],
  "atsScore": number 0-100,
  "atsTips": string[2-4]
}`,
          },
          {
            role: "user",
            content: `Resume file: ${fileName}\n\n${excerpt}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw) as Partial<LocalResumeResult>;

      const analysis: LocalResumeResult = {
        summary: parsed.summary || local.summary,
        strengths:
          Array.isArray(parsed.strengths) && parsed.strengths.length
            ? parsed.strengths
            : local.strengths,
        weaknesses:
          Array.isArray(parsed.weaknesses) && parsed.weaknesses.length
            ? parsed.weaknesses
            : local.weaknesses,
        experienceHighlights:
          Array.isArray(parsed.experienceHighlights) &&
          parsed.experienceHighlights.length
            ? parsed.experienceHighlights
            : local.experienceHighlights,
        talkingPoints:
          Array.isArray(parsed.talkingPoints) && parsed.talkingPoints.length
            ? parsed.talkingPoints
            : local.talkingPoints,
        sampleAnswers:
          Array.isArray(parsed.sampleAnswers) && parsed.sampleAnswers.length
            ? parsed.sampleAnswers
            : local.sampleAnswers,
        suggestedRoles:
          Array.isArray(parsed.suggestedRoles) && parsed.suggestedRoles.length
            ? parsed.suggestedRoles
            : local.suggestedRoles,
        suggestedQuestions:
          Array.isArray(parsed.suggestedQuestions) &&
          parsed.suggestedQuestions.length
            ? parsed.suggestedQuestions
            : local.suggestedQuestions,
        atsScore:
          typeof parsed.atsScore === "number"
            ? Math.max(0, Math.min(100, Math.round(parsed.atsScore)))
            : local.atsScore,
        atsTips:
          Array.isArray(parsed.atsTips) && parsed.atsTips.length
            ? parsed.atsTips
            : local.atsTips,
      };

      return NextResponse.json({ analysis, source: "xai" });
    } catch (err) {
      console.error("xAI resume error:", err);
      return NextResponse.json({ analysis: local, source: "local-fallback" });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
