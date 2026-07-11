/**
 * Local-first persistence (localStorage).
 *
 * PRIVACY CONTRACT:
 * - Anonymous/guest progress lives ONLY here until the user explicitly
 *   signs in (Google via Supabase). No progress sync runs for guests.
 * - AI feedback/resume API calls may send the text the user submitted for
 *   that one request; they do not store long-lived progress on our servers.
 * - Theme preference is device-local and never synced.
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
  /** User dismissed the "Save progress across devices" banner */
  bannerDismissed: "if_sync_banner_dismissed",
  /** Last successful cloud pull timestamp (ISO) */
  lastCloudSync: "if_last_cloud_sync",
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

function removeKey(key: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(key);
}

export function getUser(): User | null {
  return getJSON<User | null>(KEYS.user, null);
}

export function setUser(user: User | null): void {
  if (user === null) {
    removeKey(KEYS.user);
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
    removeKey(KEYS.resume);
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

export function isSyncBannerDismissed(): boolean {
  return getJSON<boolean>(KEYS.bannerDismissed, false);
}

export function setSyncBannerDismissed(dismissed: boolean): void {
  setJSON(KEYS.bannerDismissed, dismissed);
}

export function getLastCloudSync(): string | null {
  return getJSON<string | null>(KEYS.lastCloudSync, null);
}

export function setLastCloudSync(iso: string | null): void {
  if (iso === null) removeKey(KEYS.lastCloudSync);
  else setJSON(KEYS.lastCloudSync, iso);
}

/** Wipe practice data only (keeps theme + banner prefs). */
export function clearProgressData(): void {
  if (!isBrowser()) return;
  removeKey(KEYS.user);
  removeKey(KEYS.sessions);
  removeKey(KEYS.resume);
  removeKey(KEYS.selectedRole);
  removeKey(KEYS.lastCloudSync);
}

/** Nuclear: remove all InterviewForge keys including theme. */
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

/** Snapshot used for JSON export (user-owned data). */
export function exportProgressSnapshot() {
  return {
    exportedAt: new Date().toISOString(),
    app: "InterviewForge",
    version: 1,
    privacy:
      "This file was exported by you from InterviewForge. Keep it private.",
    user: getUser(),
    sessions: getSessions(),
    resumeAnalysis: getResumeAnalysis(),
    selectedRole: getSelectedRole(),
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

export function hasLocalProgress(): boolean {
  return (
    getSessions().length > 0 ||
    getResumeAnalysis() !== null ||
    Boolean(getSelectedRole()) ||
    (getUser()?.streak ?? 0) > 0
  );
}
