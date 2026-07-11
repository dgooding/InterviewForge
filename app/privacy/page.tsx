"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">Privacy</h1>
        <p className="mt-1 text-muted-foreground">
          How InterviewForge handles your practice data — straight talk.
        </p>

        <div className="mt-8 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Local-first by default</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Guest mode? Interview history, resume analysis, streak, and
                prefs live in your browser (localStorage). We don&apos;t get
                that progress until you choose to log in.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Optional account sync</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                If you log in (Google / email when it&apos;s set up), progress
                goes to your private Supabase account with row-level security.
                Local guest data only merges after you log in.
              </p>
              <Button asChild size="sm" variant="outline" className="mt-2">
                <Link href="/login">Log in options</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI analysis requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                When you submit an answer or resume for analysis, that text hits
                our API (and optionally xAI/Grok) to generate feedback for that
                request. Not used to build ad profiles. No creepy stuff.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export & delete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Export progress as JSON or wipe local + cloud data from Settings
                whenever you want. Your call, always.
              </p>
              <Button asChild size="sm" variant="outline" className="mt-2">
                <Link href="/settings">Open settings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/faq">FAQ</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
