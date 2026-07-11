"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cloud, LogOut, Settings, User as UserIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers";
import { cn } from "@/lib/utils";

/**
 * Compact signed-in chip + menu (avoids overlapping badge/toast clutter).
 */
export function UserMenu() {
  const { user, isCloudUser, signOut, cloudOnline } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "IF";

  const handleSignOut = async () => {
    setSigningOut(true);
    setOpen(false);
    try {
      await signOut();
      toast.success("Signed out. Progress stays on this device.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Sign out failed — try again or clear site data.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex max-w-[200px] items-center gap-2 rounded-full border border-border/60 bg-card/80 py-1 pl-1 pr-2.5 text-left text-sm transition-colors hover:bg-muted/60",
          open && "ring-2 ring-primary/30"
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar className="h-7 w-7">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt="" />
          ) : null}
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden min-w-0 flex-1 truncate font-medium sm:inline">
          {user.name}
        </span>
        {isCloudUser && (
          <Cloud
            className={cn(
              "hidden h-3.5 w-3.5 shrink-0 sm:block",
              cloudOnline ? "text-emerald-500" : "text-amber-500"
            )}
            aria-label={cloudOnline ? "Synced" : "Cloud offline"}
          />
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
          >
            <div className="border-b border-border/60 px-3 py-2">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {isCloudUser ? user.email : "Guest on this device"}
              </p>
              {isCloudUser && (
                <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                  {cloudOnline
                    ? "Signed in — progress syncs"
                    : "Signed in — using local cache"}
                </p>
              )}
            </div>
            <Link
              href="/settings"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Settings & privacy
            </Link>
            {!isCloudUser && (
              <Link
                href="/login"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                <UserIcon className="h-4 w-4" />
                Sign in to sync
              </Link>
            )}
            {isCloudUser && (
              <button
                type="button"
                role="menuitem"
                disabled={signingOut}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-muted dark:text-rose-400"
                onClick={() => void handleSignOut()}
              >
                {signingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Sign out
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
