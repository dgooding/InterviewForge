"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  InterviewSimulator,
  isInterviewMode,
  INTERVIEW_MODES,
} from "@/components/interview/interview-simulator";
import type { InterviewMode } from "@/lib/types";
import { Button } from "@/components/ui/button";

/**
 * Dedicated practice session for a single mode.
 * Routes: /interview/behavioral | technical | system-design | mixed | company | jd
 */
export default function InterviewModePage() {
  const params = useParams();
  const modeParam =
    typeof params?.mode === "string" ? params.mode.toLowerCase() : "";

  if (!isInterviewMode(modeParam)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Unknown interview mode</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a practice mode from the simulator hub.
        </p>
        <ul className="mt-6 space-y-2 text-sm">
          {INTERVIEW_MODES.map((m) => (
            <li key={m.id}>
              <Link
                href={m.href}
                className="text-indigo-600 hover:underline dark:text-indigo-300"
              >
                {m.label}
              </Link>
            </li>
          ))}
        </ul>
        <Button asChild className="mt-6" variant="gradient">
          <Link href="/interview">Interview hub</Link>
        </Button>
      </div>
    );
  }

  return <InterviewSimulator forcedMode={modeParam as InterviewMode} />;
}
