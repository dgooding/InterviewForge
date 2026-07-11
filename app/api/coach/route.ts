import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";

/**
 * Lightweight AI coach chat (optional xAI; local tips otherwise).
 * POST { message, context? }
 */
export async function POST(req: NextRequest) {
  const rl = rateLimit(`coach:${clientKeyFromRequest(req)}`, 25, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry in ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const message = String(body.message || "").trim();
    const context = String(body.context || "").slice(0, 2000);

    if (message.length < 2) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const localReply = localCoach(message, context);
    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ reply: localReply, source: "local" });
    }

    try {
      const client = new OpenAI({
        apiKey,
        baseURL: "https://api.x.ai/v1",
      });
      const model = process.env.XAI_MODEL || "grok-4.5";
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content:
              "You are a concise interview coach. Give practical, encouraging advice in 2–5 short paragraphs or bullets. No fluff.",
          },
          {
            role: "user",
            content: context
              ? `Context:\n${context}\n\nQuestion: ${message}`
              : message,
          },
        ],
      });
      const reply =
        completion.choices[0]?.message?.content?.trim() || localReply;
      return NextResponse.json({ reply, source: "xai" });
    } catch {
      return NextResponse.json({ reply: localReply, source: "local-fallback" });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

function localCoach(message: string, context: string): string {
  const m = message.toLowerCase();
  if (/star|structure|story/.test(m)) {
    return "Use STAR: Situation (1 sentence), Task (your ownership), Action (what *you* did — verbs), Result (metric or clear outcome). Practice out loud until it fits ~90 seconds.";
  }
  if (/nervous|anxiety|confidence/.test(m)) {
    return "Before you answer: exhale, restate the question briefly, then start with a concrete example. Interviewers reward clarity over speed. It's OK to pause 3 seconds to think.";
  }
  if (/technical|system design|leetcode/.test(m)) {
    return "For technical: clarify requirements → outline approach → discuss trade-offs → complexity → failure modes. Speak your reasoning. Silence while coding is fine; narrate key decisions.";
  }
  if (/weak|gap|resume/.test(m)) {
    return "Turn gaps into forward motion: admit briefly, show what you did to improve, and land on a recent proof point. Never apologize for 30 seconds — reframe into growth.";
  }
  if (context) {
    return `Based on your session context, focus next on specificity: add one metric and one personal action verb to your last answer. Then re-run the same question once. Context note: ${context.slice(0, 180)}…`;
  }
  return "Pick one signature story, tighten it to STAR with a number, and practice it twice. Then ask me about structure, nerves, technical depth, or resume gaps.";
}
