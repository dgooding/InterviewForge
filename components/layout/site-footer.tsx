"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/roles", label: "Jobs" },
  { href: "/interview", label: "Practice" },
  { href: "/resume", label: "Resume" },
  { href: "/questions", label: "Question dump" },
  { href: "/history", label: "Past runs" },
  { href: "/analytics", label: "Stats" },
  { href: "/faq", label: "FAQ" },
  { href: "/privacy", label: "Privacy" },
  { href: "/settings", label: "Settings" },
  { href: "/login", label: "Log in" },
];

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/auth")) return null;

  return (
    <footer className="relative mt-auto border-t border-border/50 bg-card/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            InterviewForge
          </div>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Interview practice that talks like a real person. Your stuff stays on
            this device until you hit sync — no sneaky cloud drama.
          </p>
        </div>
        <nav
          className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground"
          aria-label="Footer links"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} InterviewForge · go get the bag (ethically)
      </div>
    </footer>
  );
}
