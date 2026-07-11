"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">Privacy</h1>
        <p className="mt-1 text-muted-foreground">
          Placeholder policy for the InterviewForge proof-of-concept.
        </p>

        <div className="mt-8 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Local-first by default</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                If you use the app as a guest, interview history, resume
                analysis, streak, and preferences are stored in your browser
                (localStorage). We do not receive that progress data.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Optional account sync</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                If you sign in with Google or GitHub (when configured), progress
                is stored in your private Supabase account protected by row-level
                security. Local guest data is merged only after you choose to
                sign in.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI analysis requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                When you submit an answer or resume for analysis, that text is
                processed by our API (and optionally xAI/Grok) to generate
                feedback for that request. It is not used to build advertising
                profiles.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Settings lets you export JSON, delete local progress, or wipe
                cloud + local data. Signing out keeps local copies unless you
                delete them.
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
