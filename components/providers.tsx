"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Toaster } from "sonner";
import type {
  User,
  InterviewSession,
  ResumeAnalysis,
} from "@/lib/types";
import {
  getUser,
  setUser as persistUser,
  getSessions,
  saveSession as persistSession,
  getResumeAnalysis,
  setResumeAnalysis as persistResume,
  getSelectedRole,
  setSelectedRole as persistRole,
  getTheme,
  setTheme as persistTheme,
  updateStreak,
} from "@/lib/storage";
import { ensureLocalUser } from "@/lib/auth";
import { computeStats } from "@/lib/stats";
import type { UserStats } from "@/lib/types";

interface AppContextValue {
  hydrated: boolean;
  user: User | null;
  setUser: (u: User | null) => void;
  sessions: InterviewSession[];
  addOrUpdateSession: (s: InterviewSession) => void;
  resumeAnalysis: ResumeAnalysis | null;
  setResumeAnalysis: (r: ResumeAnalysis | null) => void;
  selectedRole: string | null;
  setSelectedRole: (r: string | null) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  stats: UserStats;
  refreshFromStorage: () => void;
  completeSessionStreak: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUserState] = useState<User | null>(null);
  const [sessions, setSessionsState] = useState<InterviewSession[]>([]);
  const [resumeAnalysis, setResumeState] = useState<ResumeAnalysis | null>(null);
  const [selectedRole, setRoleState] = useState<string | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">("dark");

  const refreshFromStorage = useCallback(() => {
    const profile = ensureLocalUser();
    setUserState(profile);
    setSessionsState(getSessions());
    setResumeState(getResumeAnalysis());
    setRoleState(getSelectedRole());
    const t = getTheme();
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  useEffect(() => {
    refreshFromStorage();
    setHydrated(true);
  }, [refreshFromStorage]);

  const setUser = useCallback((u: User | null) => {
    if (u === null) {
      const fresh = ensureLocalUser();
      setUserState(fresh);
      return;
    }
    persistUser(u);
    setUserState(u);
  }, []);

  const addOrUpdateSession = useCallback((s: InterviewSession) => {
    persistSession(s);
    setSessionsState(getSessions());
  }, []);

  const setResumeAnalysis = useCallback((r: ResumeAnalysis | null) => {
    persistResume(r);
    setResumeState(r);
  }, []);

  const setSelectedRole = useCallback((r: string | null) => {
    persistRole(r);
    setRoleState(r);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      persistTheme(next);
      return next;
    });
  }, []);

  const completeSessionStreak = useCallback(() => {
    const current = getUser() || ensureLocalUser();
    const updated = updateStreak(current);
    setUserState(updated);
  }, []);

  const stats = useMemo(
    () => computeStats(sessions, user?.streak ?? 0),
    [sessions, user?.streak]
  );

  const value = useMemo(
    () => ({
      hydrated,
      user,
      setUser,
      sessions,
      addOrUpdateSession,
      resumeAnalysis,
      setResumeAnalysis,
      selectedRole,
      setSelectedRole,
      theme,
      toggleTheme,
      stats,
      refreshFromStorage,
      completeSessionStreak,
    }),
    [
      hydrated,
      user,
      setUser,
      sessions,
      addOrUpdateSession,
      resumeAnalysis,
      setResumeAnalysis,
      selectedRole,
      setSelectedRole,
      theme,
      toggleTheme,
      stats,
      refreshFromStorage,
      completeSessionStreak,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        theme={theme}
        richColors
        closeButton
      />
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within Providers");
  return ctx;
}
