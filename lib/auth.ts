import { v4 as uuidv4 } from "uuid";
import type { User } from "./types";
import { getUser, setUser } from "./storage";

/**
 * Lightweight client-side auth for the PoC.
 * Swap for NextAuth.js or Clerk when you need real sessions.
 */

const DEMO_USERS_KEY = "if_demo_users";

interface StoredCredentials {
  email: string;
  password: string;
  user: User;
}

function getDemoUsers(): StoredCredentials[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveDemoUsers(users: StoredCredentials[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

export function signUp(
  email: string,
  password: string,
  name: string
): { ok: true; user: User } | { ok: false; error: string } {
  const users = getDemoUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: "An account with this email already exists." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  const user: User = {
    id: uuidv4(),
    email: email.toLowerCase().trim(),
    name: name.trim() || email.split("@")[0],
    isGuest: false,
    createdAt: new Date().toISOString(),
    streak: 0,
    lastPracticeDate: null,
  };

  users.push({ email: user.email, password, user });
  saveDemoUsers(users);
  setUser(user);
  return { ok: true, user };
}

export function signIn(
  email: string,
  password: string
): { ok: true; user: User } | { ok: false; error: string } {
  const users = getDemoUsers();
  const match = users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase().trim() &&
      u.password === password
  );
  if (!match) {
    return { ok: false, error: "Invalid email or password." };
  }
  setUser(match.user);
  return { ok: true, user: match.user };
}

export function continueAsGuest(name?: string): User {
  const user: User = {
    id: `guest-${uuidv4()}`,
    email: "guest@interviewforge.local",
    name: name?.trim() || "Guest Candidate",
    isGuest: true,
    createdAt: new Date().toISOString(),
    streak: 0,
    lastPracticeDate: null,
  };
  setUser(user);
  return user;
}

export function signOut(): void {
  setUser(null);
}

export function getCurrentUser(): User | null {
  return getUser();
}

export function updateUserProfile(partial: Partial<User>): User | null {
  const current = getUser();
  if (!current) return null;
  const updated = { ...current, ...partial, id: current.id };
  setUser(updated);

  // Keep demo registry in sync for non-guests
  if (!updated.isGuest) {
    const users = getDemoUsers();
    const idx = users.findIndex((u) => u.user.id === updated.id);
    if (idx >= 0) {
      users[idx].user = updated;
      saveDemoUsers(users);
    }
  }
  return updated;
}
