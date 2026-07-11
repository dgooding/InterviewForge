import { NextResponse } from "next/server";

/**
 * Public health/config status (no secrets).
 * Used by Settings / Setup UI so operators know what's wired.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "InterviewForge",
    features: {
      resume: true,
      interview: true,
      history: true,
      analytics: true,
      coach: true,
      localProgress: true,
    },
    config: {
      supabase: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ),
      xai: Boolean(process.env.XAI_API_KEY),
      appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
    },
    timestamp: new Date().toISOString(),
  });
}
