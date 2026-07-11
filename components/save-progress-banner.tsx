"use client";

import Link from "next/link";
import { Cloud, X } from "lucide-react";
import { useApp } from "@/components/providers";
import { Button } from "@/components/ui/button";

/**
 * Subtle, dismissible prompt for guests with local progress.
 * Never uploads anything — only links to optional Google sign-in.
 */
export function SaveProgressBanner() {
  const { showSyncBanner, dismissSyncBanner } = useApp();

  if (!showSyncBanner) return null;

  return (
    <div
      role="region"
      aria-label="Save progress across devices"
      className="sticky top-16 z-40 border-b border-primary/20 bg-primary/10 px-4 py-2.5 backdrop-blur-md sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <p className="flex items-start gap-2 text-sm text-foreground sm:items-center">
          <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0" />
          <span>
            <span className="font-medium">Progress stays on this device.</span>{" "}
            <span className="text-muted-foreground">
              Sign in with Google to sync interviews &amp; scores across devices
              — nothing is uploaded until you choose to.
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
