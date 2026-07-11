"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Global keyboard shortcuts:
 * ?  open help
 * g d dashboard, g i interview, g r resume, g h history, g s settings
 * Escape close help
 */
export function KeyboardHints() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [gPending, setGPending] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        setGPending(false);
        return;
      }

      if (e.key === "g" && !e.metaKey && !e.ctrlKey) {
        setGPending(true);
        window.setTimeout(() => setGPending(false), 800);
        return;
      }
      if (gPending) {
        const map: Record<string, string> = {
          d: "/dashboard",
          i: "/interview",
          r: "/resume",
          h: "/history",
          s: "/settings",
          a: "/analytics",
          q: "/questions",
        };
        if (map[e.key]) {
          e.preventDefault();
          router.push(map[e.key]);
          setGPending(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gPending, router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-label="Keyboard shortcuts"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Keyboard shortcuts</h2>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <kbd className="rounded border px-1.5">?</kbd> Toggle this help
          </li>
          <li>
            <kbd className="rounded border px-1.5">g</kbd> then{" "}
            <kbd className="rounded border px-1.5">d</kbd> Dashboard
          </li>
          <li>
            <kbd className="rounded border px-1.5">g</kbd>{" "}
            <kbd className="rounded border px-1.5">i</kbd> Interview
          </li>
          <li>
            <kbd className="rounded border px-1.5">g</kbd>{" "}
            <kbd className="rounded border px-1.5">r</kbd> Resume
          </li>
          <li>
            <kbd className="rounded border px-1.5">g</kbd>{" "}
            <kbd className="rounded border px-1.5">h</kbd> History
          </li>
          <li>
            <kbd className="rounded border px-1.5">g</kbd>{" "}
            <kbd className="rounded border px-1.5">s</kbd> Settings
          </li>
          <li>
            <kbd className="rounded border px-1.5">g</kbd>{" "}
            <kbd className="rounded border px-1.5">a</kbd> Analytics
          </li>
          <li>
            <kbd className="rounded border px-1.5">g</kbd>{" "}
            <kbd className="rounded border px-1.5">q</kbd> Questions
          </li>
          <li>
            <kbd className="rounded border px-1.5">Esc</kbd> Close
          </li>
        </ul>
      </div>
    </div>
  );
}
