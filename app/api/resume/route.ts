import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateLocalResumeAnalysis } from "@/lib/ai-feedback";

/**
 * POST /api/resume
 * Body: { text, fileName }
 * Analyzes resume text for strengths & talking points.
 * Uses SpaceXAI when XAI_API_KEY is set.
 */
export async function POST(req: NextRequest) {
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

    const excerpt = text.slice(0, 8000);
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
            content: `You are a career coach. Analyze the resume text and return ONLY JSON:
{
  "summary": string,
  "strengths": string[3-5],
  "talkingPoints": string[3-5],
  "suggestedRoles": string[2-5]
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
      const parsed = JSON.parse(raw);

      return NextResponse.json({
        analysis: {
          summary: parsed.summary || local.summary,
          strengths: parsed.strengths || local.strengths,
          talkingPoints: parsed.talkingPoints || local.talkingPoints,
          suggestedRoles: parsed.suggestedRoles || local.suggestedRoles,
        },
        source: "xai",
      });
    } catch (err) {
      console.error("xAI resume error:", err);
      return NextResponse.json({ analysis: local, source: "local-fallback" });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
