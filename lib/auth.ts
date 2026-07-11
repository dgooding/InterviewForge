import { v4 as uuidv4 } from "uuid";
import type { User } from "./types";
import { getUser, setUser } from "./storage";

/**
 * No authentication — a local profile is created automatically for progress
 * (streak, name on PDF reports). All data stays in localStorage.
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
  const current = ensureLocalUser();
  const updated = { ...current, ...partial, id: current.id };
  setUser(updated);
  return updated;
}

export function resetLocalProfile(): User {
  if (typeof window !== "undefined") {
    localStorage.removeItem("if_user");
  }
  return ensureLocalUser();
}
