"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  LayoutDashboard,
  Briefcase,
  FileText,
  Mic,
  BarChart3,
  BookOpen,
  History,
  Moon,
  Sun,
  Menu,
  X,
  Sparkles,
  LogIn,
  LogOut,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/roles", label: "Roles", icon: Briefcase },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/interview", label: "Interview", icon: Mic },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/questions", label: "Questions", icon: BookOpen },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const {
    theme,
    toggleTheme,
    stats,
    isCloudUser,
    signOut,
    cloudEnabled,
  } = useApp();
  const [open, setOpen] = useState(false);

  if (pathname === "/" || pathname === "/login" || pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2 font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-glow">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="hidden bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent sm:inline">
              InterviewForge
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 md:flex">
            <Flame className="h-3.5 w-3.5" />
            {stats.streak}d
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {cloudEnabled || isCloudUser ? (
            <UserMenu />
          ) : (
            <Button asChild size="sm" variant="gradient" className="hidden sm:inline-flex">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            </Button>
          )}

          {!isCloudUser && cloudEnabled && (
            <Button asChild size="sm" variant="outline" className="hidden xl:inline-flex">
              <Link href="/login">Sync</Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {isCloudUser ? (
              <button
                type="button"
                onClick={async () => {
                  setOpen(false);
                  await signOut();
                }}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-muted dark:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-primary"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
