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
import { ensureLocalUser, signOut as authSignOut } from "@/lib/auth";
import {
  ensureCloudProfile,
  hydrateFromCloud,
  pushProfile,
  pushResume,
  pushSession,
} from "@/lib/cloud-sync";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { computeStats } from "@/lib/stats";
import type { UserStats } from "@/lib/types";

interface AppContextValue {
  hydrated: boolean;
  authLoading: boolean;
  cloudEnabled: boolean;
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
  signOut: () => Promise<void>;
  isCloudUser: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUserState] = useState<User | null>(null);
  const [sessions, setSessionsState] = useState<InterviewSession[]>([]);
  const [resumeAnalysis, setResumeState] = useState<ResumeAnalysis | null>(null);
  const [selectedRole, setRoleState] = useState<string | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">("dark");

  const cloudEnabled = isSupabaseConfigured();

  const applyLocalMirror = useCallback(() => {
    setSessionsState(getSessions());
    setResumeState(getResumeAnalysis());
    setRoleState(getSelectedRole());
  }, []);

  const refreshFromStorage = useCallback(() => {
    const profile = getUser() || ensureLocalUser();
    setUserState(profile);
    applyLocalMirror();
    const t = getTheme();
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, [applyLocalMirror]);

  // Initial hydrate + Supabase auth listener
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const t = getTheme();
      setThemeState(t);
      document.documentElement.classList.toggle("dark", t === "dark");

      const supabase = getSupabaseBrowser();
      if (!supabase) {
        // No cloud — guest local mode
        const profile = ensureLocalUser();
        if (!cancelled) {
          setUserState(profile);
          applyLocalMirror();
          setAuthLoading(false);
          setHydrated(true);
        }
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;

        if (data.session?.user) {
          const base = await ensureCloudProfile(data.session.user);
          const cloud = await hydrateFromCloud(base);
          if (cancelled) return;
          setUserState(cloud.user);
          setSessionsState(cloud.sessions);
          setResumeState(cloud.resume);
          setRoleState(cloud.preferredRole);
        } else {
          const profile = ensureLocalUser();
          setUserState(profile);
          applyLocalMirror();
        }
      } catch (e) {
        console.warn("auth boot failed", e);
        if (!cancelled) {
          setUserState(ensureLocalUser());
          applyLocalMirror();
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
          setHydrated(true);
        }
      }
    }

    boot();

    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUserState(ensureLocalUser());
        applyLocalMirror();
        return;
      }
      if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        try {
          setAuthLoading(true);
          const base = await ensureCloudProfile(session.user);
          const cloud = await hydrateFromCloud(base);
          setUserState(cloud.user);
          setSessionsState(cloud.sessions);
          setResumeState(cloud.resume);
          setRoleState(cloud.preferredRole);
        } catch (e) {
          console.warn("auth state change hydrate failed", e);
        } finally {
          setAuthLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [applyLocalMirror]);

  const setUser = useCallback((u: User | null) => {
    if (u === null) {
      const fresh = ensureLocalUser();
      setUserState(fresh);
      return;
    }
    persistUser(u);
    setUserState(u);
    if (u.isCloud && !u.isGuest) {
      void pushProfile(u);
    }
  }, []);

  const addOrUpdateSession = useCallback(
    (s: InterviewSession) => {
      const withUser: InterviewSession = {
        ...s,
        userId: user?.id || s.userId,
      };
      persistSession(withUser);
      setSessionsState(getSessions());
      if (user?.isCloud && !user.isGuest) {
        void pushSession(user.id, withUser);
      }
    },
    [user]
  );

  const setResumeAnalysis = useCallback(
    (r: ResumeAnalysis | null) => {
      persistResume(r);
      setResumeState(r);
      if (user?.isCloud && !user.isGuest) {
        void pushResume(user.id, r);
      }
    },
    [user]
  );

  const setSelectedRole = useCallback(
    (r: string | null) => {
      persistRole(r);
      setRoleState(r);
      if (user?.isCloud && !user.isGuest) {
        const updated = {
          ...(user),
          preferredRole: r || undefined,
        };
        persistUser(updated);
        setUserState(updated);
        void pushProfile(updated);
      }
    },
    [user]
  );

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
    if (updated.isCloud && !updated.isGuest) {
      void pushProfile(updated);
    }
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    // Keep local session data; switch identity to guest
    setUserState(ensureLocalUser());
    applyLocalMirror();
  }, [applyLocalMirror]);

  const stats = useMemo(
    () => computeStats(sessions, user?.streak ?? 0),
    [sessions, user?.streak]
  );

  const isCloudUser = Boolean(user?.isCloud && !user?.isGuest);

  const value = useMemo(
    () => ({
      hydrated,
      authLoading,
      cloudEnabled,
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
      signOut,
      isCloudUser,
    }),
    [
      hydrated,
      authLoading,
      cloudEnabled,
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
      signOut,
      isCloudUser,
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
