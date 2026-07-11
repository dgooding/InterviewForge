/**
 * Client-side persistence via localStorage.
 *
 * ============================================================
 * FUTURE: Supabase / Postgres migration path
 * ============================================================
 * When you're ready for multi-device sync and real auth:
 *
 * 1. Create a Supabase project and enable email auth.
 * 2. Add env vars from .env.example (NEXT_PUBLIC_SUPABASE_URL, etc.).
 * 3. Run the SQL schema below in the Supabase SQL editor.
 * 4. Replace getJSON/setJSON calls with supabase.from(...).select/insert.
 * 5. Keep the same TypeScript interfaces in lib/types.ts.
 *
 * Suggested schema:
 *
 *   create table profiles (
 *     id uuid primary key references auth.users(id),
 *     email text,
 *     name text,
 *     streak int default 0,
 *     last_practice_date date,
 *     preferred_role text,
 *     created_at timestamptz default now()
 *   );
 *
 *   create table interview_sessions (
 *     id uuid primary key default gen_random_uuid(),
 *     user_id uuid references profiles(id) on delete cascade,
 *     role text not null,
 *     mode text not null,
 *     company_style text,
 *     started_at timestamptz not null,
 *     completed_at timestamptz,
 *     overall_score numeric,
 *     status text not null,
 *     answers jsonb not null default '[]'
 *   );
 *
 *   create table resume_analyses (
 *     id uuid primary key default gen_random_uuid(),
 *     user_id uuid references profiles(id) on delete cascade,
 *     file_name text,
 *     summary text,
 *     strengths jsonb,
 *     talking_points jsonb,
 *     suggested_roles jsonb,
 *     uploaded_at timestamptz default now()
 *   );
 *
 *   -- Enable RLS and policies scoped to auth.uid()
 */

import type {
  User,
  InterviewSession,
  ResumeAnalysis,
  AppState,
} from "./types";

const KEYS = {
  user: "if_user",
  sessions: "if_sessions",
  resume: "if_resume",
  selectedRole: "if_selected_role",
  theme: "if_theme",
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setJSON<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage write failed", e);
  }
}

export function getUser(): User | null {
  return getJSON<User | null>(KEYS.user, null);
}

export function setUser(user: User | null): void {
  if (user === null) {
    if (isBrowser()) localStorage.removeItem(KEYS.user);
    return;
  }
  setJSON(KEYS.user, user);
}

export function getSessions(): InterviewSession[] {
  return getJSON<InterviewSession[]>(KEYS.sessions, []);
}

export function setSessions(sessions: InterviewSession[]): void {
  setJSON(KEYS.sessions, sessions);
}

export function saveSession(session: InterviewSession): void {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) sessions[idx] = session;
  else sessions.unshift(session);
  setSessions(sessions);
}

export function getSessionById(id: string): InterviewSession | undefined {
  return getSessions().find((s) => s.id === id);
}

export function getResumeAnalysis(): ResumeAnalysis | null {
  return getJSON<ResumeAnalysis | null>(KEYS.resume, null);
}

export function setResumeAnalysis(analysis: ResumeAnalysis | null): void {
  if (analysis === null) {
    if (isBrowser()) localStorage.removeItem(KEYS.resume);
    return;
  }
  setJSON(KEYS.resume, analysis);
}

export function getSelectedRole(): string | null {
  return getJSON<string | null>(KEYS.selectedRole, null);
}

export function setSelectedRole(role: string | null): void {
  setJSON(KEYS.selectedRole, role);
}

export function getTheme(): "light" | "dark" {
  return getJSON<"light" | "dark">(KEYS.theme, "dark");
}

export function setTheme(theme: "light" | "dark"): void {
  setJSON(KEYS.theme, theme);
  if (isBrowser()) {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}

export function clearAllData(): void {
  if (!isBrowser()) return;
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

export function loadAppState(): AppState {
  return {
    user: getUser(),
    sessions: getSessions(),
    resumeAnalysis: getResumeAnalysis(),
    selectedRole: getSelectedRole(),
    theme: getTheme(),
  };
}

/** Update streak based on practice dates (call after completing a session). */
export function updateStreak(user: User): User {
  const today = new Date().toISOString().slice(0, 10);
  const last = user.lastPracticeDate;

  if (last === today) {
    return user;
  }

  let streak = user.streak || 0;
  if (last) {
    const lastDate = new Date(last);
    const todayDate = new Date(today);
    const diffDays = Math.round(
      (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    streak = diffDays === 1 ? streak + 1 : 1;
  } else {
    streak = 1;
  }

  const updated: User = {
    ...user,
    streak,
    lastPracticeDate: today,
  };
  setUser(updated);
  return updated;
}
