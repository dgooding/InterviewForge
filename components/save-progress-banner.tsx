"use client";

import Link from "next/link";
import { Cloud, X } from "lucide-react";
import { useApp } from "@/components/providers";
import { Button } from "@/components/ui/button";

/**
 * Subtle, dismissible prompt for guests with local progress.
 * Hidden when signed in (cloud user). Never uploads until login.
 */
export function SaveProgressBanner() {
  const { showSyncBanner, dismissSyncBanner, isCloudUser } = useApp();

  if (isCloudUser || !showSyncBanner) return null;

  return (
    <div
      role="region"
      aria-label="Save progress across devices"
      className="relative z-30 border-b border-primary/20 bg-primary/10 px-4 py-2.5 backdrop-blur-md sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <p className="flex items-start gap-2 text-sm text-foreground sm:items-center">
          <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0" />
          <span>
            <span className="font-medium">Progress stays on this device.</span>{" "}
            <span className="text-muted-foreground">
              Sign in (email magic link works now) to sync across devices —
              nothing is uploaded until you choose to.
            </span>
          </span>
        </p>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="gradient">
            <Link href="/login">Save across devices</Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={dismissSyncBanner}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
