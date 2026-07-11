import { v4 as uuidv4 } from "uuid";
import type { User } from "./types";
import { getUser, setUser } from "./storage";
import {
  signInWithGoogle as cloudGoogle,
  signInWithGitHub as cloudGitHub,
  signInWithEmailMagicLink as cloudEmail,
  signInWithEmailPassword as cloudPassword,
  signUpWithEmailPassword as cloudSignUp,
  signOutCloud,
} from "./cloud-sync";
import { isSupabaseConfigured } from "./supabase/client";

/**
 * Guest identity (local only) + optional OAuth helpers.
 * Guest progress is never uploaded until sign-in succeeds.
 */

const DEFAULT_NAME = "Candidate";

export function ensureLocalUser(): User {
  const existing = getUser();
  // If we still have a cloud-shaped user but no session, demote carefully is
  // handled by providers. Here we only create a guest if empty.
  if (existing) return existing;

  const user: User = {
    id: `local-${uuidv4()}`,
    email: "local@interviewforge.app",
    name: DEFAULT_NAME,
    isGuest: true,
    isCloud: false,
    createdAt: new Date().toISOString(),
    streak: 0,
    lastPracticeDate: null,
  };
  setUser(user);
  return user;
}

export function createFreshGuest(): User {
  const user: User = {
    id: `local-${uuidv4()}`,
    email: "local@interviewforge.app",
    name: DEFAULT_NAME,
    isGuest: true,
    isCloud: false,
    createdAt: new Date().toISOString(),
    streak: 0,
    lastPracticeDate: null,
  };
  setUser(user);
  return user;
}

export function getCurrentUser(): User | null {
  return getUser();
}

export function updateUserProfile(partial: Partial<User>): User {
  const current = getUser() || ensureLocalUser();
  const updated = { ...current, ...partial, id: current.id };
  setUser(updated);
  return updated;
}

export function resetToGuest(preserveProgress = true): User {
  if (typeof window !== "undefined") {
    // Keep sessions/resume/role so practice history stays on-device after logout
    if (!preserveProgress) {
      localStorage.removeItem("if_sessions");
      localStorage.removeItem("if_resume");
      localStorage.removeItem("if_selected_role");
    }
    localStorage.removeItem("if_user");
  }
  return createFreshGuest();
}

export async function signInWithGoogle(): Promise<{
  error?: string;
  redirecting?: boolean;
  signedIn?: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Google login needs Supabase. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then enable the Google provider (see README).",
    };
  }
  return cloudGoogle();
}

export async function signInWithGitHub(): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "GitHub login needs Supabase. Add env vars and enable the GitHub provider.",
    };
  }
  return cloudGitHub();
}

export async function signInWithEmail(
  email: string
): Promise<{ error?: string; ok?: boolean }> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Cloud login needs Supabase. Env vars should already be set on Vercel.",
    };
  }
  return cloudEmail(email);
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ error?: string; ok?: boolean }> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Cloud login needs Supabase. Env vars should already be set on Vercel.",
    };
  }
  return cloudPassword(email, password);
}

export async function signUpWithPassword(
  email: string,
  password: string,
  name?: string
): Promise<{ error?: string; ok?: boolean; needsConfirm?: boolean }> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Cloud signup needs Supabase. Env vars should already be set on Vercel.",
    };
  }
  return cloudSignUp(email, password, name);
}

export async function signOut(): Promise<void> {
  try {
    await signOutCloud();
  } finally {
    // Always clear cloud identity locally even if network sign-out fails
    clearSupabaseAuthStorage();
    resetToGuest(true);
  }
}

/** Remove Supabase auth keys from localStorage so sessions don't resurrect. */
function clearSupabaseAuthStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith("sb-") ||
          k.includes("supabase.auth") ||
          k.includes("supabase-auth"))
      ) {
        keys.push(k);
      }
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export { isSupabaseConfigured };

/**
 * Google is enabled in production Supabase.
 * Env flag can force-enable; default true when Supabase is configured
 * so the button is not stuck on "setup required" after provider is live.
 */
export function isGoogleOAuthEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "false") return false;
  if (process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true") return true;
  return isSupabaseConfigured();
}

export function isGitHubOAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GITHUB_OAUTH_ENABLED === "true";
}
