import { v4 as uuidv4 } from "uuid";
import type { User } from "./types";
import { getUser, setUser } from "./storage";
import {
  signInWithGoogle as cloudGoogle,
  signOutCloud,
} from "./cloud-sync";
import { isSupabaseConfigured } from "./supabase/client";

/**
 * Local guest profile + Google/Supabase cloud auth helpers.
 * Guest progress stays in localStorage; Google users sync to Supabase.
 */

const DEFAULT_NAME = "Candidate";

export function ensureLocalUser(): User {
  const existing = getUser();
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

export function getCurrentUser(): User | null {
  return getUser();
}

export function updateUserProfile(partial: Partial<User>): User {
  const current = getUser() || ensureLocalUser();
  const updated = { ...current, ...partial, id: current.id };
  setUser(updated);
  return updated;
}

export function resetToGuest(): User {
  if (typeof window !== "undefined") {
    // Keep sessions/resume so they can merge on next Google login;
    // only clear the identity slot if it was a cloud user.
    localStorage.removeItem("if_user");
  }
  return ensureLocalUser();
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Google login needs Supabase. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then enable the Google provider (see README).",
    };
  }
  return cloudGoogle();
}

export async function signOut(): Promise<void> {
  await signOutCloud();
  resetToGuest();
}

export { isSupabaseConfigured };
