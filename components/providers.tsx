"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Toaster, toast } from "sonner";
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
  isSyncBannerDismissed,
  setSyncBannerDismissed,
  clearProgressData,
  hasLocalProgress,
  getLastCloudSync,
} from "@/lib/storage";
import {
  ensureLocalUser,
  createFreshGuest,
  signOut as authSignOut,
} from "@/lib/auth";
import {
  ensureCloudProfile,
  hydrateFromCloud,
  pushProfile,
  pushResume,
  pushSession,
  softSyncFromCloud,
  deleteAllCloudData,
} from "@/lib/cloud-sync";
import { downloadProgressExport } from "@/lib/export-data";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { computeStats } from "@/lib/stats";
import type { UserStats } from "@/lib/types";
import { SaveProgressBanner } from "@/components/save-progress-banner";

interface AppContextValue {
  hydrated: boolean;
  authLoading: boolean;
  cloudEnabled: boolean;
  cloudOnline: boolean;
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
  showSyncBanner: boolean;
  dismissSyncBanner: () => void;
  exportProgress: () => void;
  deleteLocalProgress: () => void;
  deleteCloudAndLocalProgress: () => Promise<boolean>;
  lastCloudSync: string | null;
  softSync: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [cloudOnline, setCloudOnline] = useState(true);
  const [user, setUserState] = useState<User | null>(null);
  const [sessions, setSessionsState] = useState<InterviewSession[]>([]);
  const [resumeAnalysis, setResumeState] = useState<ResumeAnalysis | null>(null);
  const [selectedRole, setRoleState] = useState<string | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">("dark");
  const [bannerDismissed, setBannerDismissed] = useState(true);
  const [lastCloudSync, setLastSyncState] = useState<string | null>(null);

  const cloudEnabled = isSupabaseConfigured();

  const applyLocalMirror = useCallback(() => {
    setSessionsState(getSessions());
    setResumeState(getResumeAnalysis());
    setRoleState(getSelectedRole());
    setBannerDismissed(isSyncBannerDismissed());
    setLastSyncState(getLastCloudSync());
  }, []);

  const refreshFromStorage = useCallback(() => {
    const profile = getUser() || ensureLocalUser();
    setUserState(profile);
    applyLocalMirror();
    const t = getTheme();
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, [applyLocalMirror]);

  useEffect(() => {
    let cancelled = false;
    /** Prevent toast spam / overlapping success bubbles on remount */
    let didWelcomeToast = false;

    async function applyCloudUser(
      authUser: {
        id: string;
        email?: string | null;
        user_metadata?: Record<string, unknown> | null;
        created_at?: string;
      },
      opts: { toastWelcome: boolean }
    ) {
      const base = await ensureCloudProfile(authUser);
      const cloud = await hydrateFromCloud(base);
      if (cancelled) return;
      setUserState(cloud.user);
      setSessionsState(cloud.sessions);
      setResumeState(cloud.resume);
      setRoleState(cloud.preferredRole);
      setLastSyncState(getLastCloudSync());
      setCloudOnline(true);
      setSyncBannerDismissed(true);
      setBannerDismissed(true);

      if (opts.toastWelcome && !didWelcomeToast) {
        didWelcomeToast = true;
        if (cloud.migratedLocalSessions > 0) {
          toast.success(
            `Synced ${cloud.migratedLocalSessions} local session${
              cloud.migratedLocalSessions === 1 ? "" : "s"
            } to your account`,
            { id: "if-signed-in", duration: 4000 }
          );
        } else {
          toast.success("Signed in — progress syncs across devices", {
            id: "if-signed-in",
            duration: 3500,
          });
        }
      }
    }

    async function boot() {
      const t = getTheme();
      setThemeState(t);
      document.documentElement.classList.toggle("dark", t === "dark");
      setBannerDismissed(isSyncBannerDismissed());

      const supabase = getSupabaseBrowser();
      if (!supabase) {
        const profile = ensureLocalUser();
        if (!cancelled) {
          setUserState(profile);
          applyLocalMirror();
          setCloudOnline(false);
          setAuthLoading(false);
          setHydrated(true);
        }
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;

        if (data.session?.user) {
          // Silent hydrate on refresh — no toast bubble every visit
          await applyCloudUser(data.session.user, { toastWelcome: false });
        } else {
          const existing = getUser();
          if (existing?.isCloud) {
            createFreshGuest();
          } else {
            ensureLocalUser();
          }
          setUserState(getUser());
          applyLocalMirror();
        }
      } catch (e) {
        console.warn("auth boot failed — staying local", e);
        if (!cancelled) {
          setCloudOnline(false);
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
        const guest = createFreshGuest();
        setUserState(guest);
        applyLocalMirror();
        setAuthLoading(false);
        return;
      }

      // Ignore INITIAL_SESSION here — boot() already hydrates once
      if (event === "INITIAL_SESSION") {
        return;
      }

      if (session?.user && event === "TOKEN_REFRESHED") {
        try {
          const base = await ensureCloudProfile(session.user);
          setUserState(base);
          setCloudOnline(true);
        } catch {
          setCloudOnline(false);
        }
        return;
      }

      if (session?.user && event === "SIGNED_IN") {
        try {
          setAuthLoading(true);
          await applyCloudUser(session.user, { toastWelcome: true });
        } catch (e) {
          console.warn("auth hydrate failed", e);
          setCloudOnline(false);
          toast.message(
            "Signed in, but cloud sync is offline. Data stays on this device.",
            { id: "if-signed-in-offline" }
          );
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

  // Soft multi-device sync when tab becomes visible (signed-in only)
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      const u = getUser();
      if (!u?.isCloud || u.isGuest) return;
      void softSyncFromCloud(u).then((res) => {
        if (res) {
          setSessionsState(res.sessions);
          setResumeState(res.resume);
          setLastSyncState(getLastCloudSync());
          setCloudOnline(true);
        }
      });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const setUser = useCallback((u: User | null) => {
    if (u === null) {
      const fresh = createFreshGuest();
      setUserState(fresh);
      return;
    }
    persistUser(u);
    setUserState(u);
    // Cloud write only for authenticated users
    if (u.isCloud && !u.isGuest) {
      void pushProfile(u).then((ok) => setCloudOnline(ok));
    }
  }, []);

  const addOrUpdateSession = useCallback(
    (s: InterviewSession) => {
      const withUser: InterviewSession = {
        ...s,
        userId: user?.id || s.userId,
      };
      // Always local first
      persistSession(withUser);
      setSessionsState(getSessions());
      // Cloud ONLY if explicitly signed in
      if (user?.isCloud && !user.isGuest) {
        void pushSession(user.id, withUser).then((ok) => setCloudOnline(ok));
      }
    },
    [user]
  );

  const setResumeAnalysis = useCallback(
    (r: ResumeAnalysis | null) => {
      persistResume(r);
      setResumeState(r);
      if (user?.isCloud && !user.isGuest) {
        void pushResume(user.id, r).then((ok) => setCloudOnline(ok));
      }
    },
    [user]
  );

  const setSelectedRole = useCallback(
    (r: string | null) => {
      persistRole(r);
      setRoleState(r);
      if (user?.isCloud && !user.isGuest) {
        const updated = { ...user, preferredRole: r || undefined };
        persistUser(updated);
        setUserState(updated);
        void pushProfile(updated).then((ok) => setCloudOnline(ok));
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
      void pushProfile(updated).then((ok) => setCloudOnline(ok));
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authSignOut();
    } finally {
      const guest = createFreshGuest();
      setUserState(guest);
      applyLocalMirror();
      setAuthLoading(false);
    }
  }, [applyLocalMirror]);

  const dismissSyncBanner = useCallback(() => {
    setSyncBannerDismissed(true);
    setBannerDismissed(true);
  }, []);

  const exportProgress = useCallback(() => {
    downloadProgressExport();
    toast.success("Export downloaded — keep this file private");
  }, []);

  const deleteLocalProgress = useCallback(() => {
    clearProgressData();
    const guest = createFreshGuest();
    setUserState(guest);
    setSessionsState([]);
    setResumeState(null);
    setRoleState(null);
    toast.success("Local progress deleted on this device");
  }, []);

  const deleteCloudAndLocalProgress = useCallback(async () => {
    const u = getUser();
    if (u?.isCloud && !u.isGuest) {
      const ok = await deleteAllCloudData(u.id);
      if (!ok) {
        toast.error("Could not delete cloud data. Check connection and try again.");
        return false;
      }
    }
    clearProgressData();
    if (u?.isCloud && !u.isGuest) {
      await authSignOut();
    }
    setUserState(createFreshGuest());
    setSessionsState([]);
    setResumeState(null);
    setRoleState(null);
    toast.success("All progress deleted (local + cloud)");
    return true;
  }, []);

  const softSync = useCallback(async () => {
    const u = getUser();
    if (!u?.isCloud || u.isGuest) return;
    const res = await softSyncFromCloud(u);
    if (res) {
      setSessionsState(res.sessions);
      setResumeState(res.resume);
      setLastSyncState(getLastCloudSync());
      setCloudOnline(true);
      toast.success("Synced latest progress");
    } else {
      setCloudOnline(false);
      toast.message("Could not reach cloud — using local copy");
    }
  }, []);

  const stats = useMemo(
    () => computeStats(sessions, user?.streak ?? 0),
    [sessions, user?.streak]
  );

  const isCloudUser = Boolean(user?.isCloud && !user?.isGuest);

  const showSyncBanner =
    hydrated &&
    !authLoading &&
    !isCloudUser &&
    !bannerDismissed &&
    hasLocalProgress() &&
    cloudEnabled;

  const value = useMemo(
    () => ({
      hydrated,
      authLoading,
      cloudEnabled,
      cloudOnline,
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
      showSyncBanner,
      dismissSyncBanner,
      exportProgress,
      deleteLocalProgress,
      deleteCloudAndLocalProgress,
      lastCloudSync,
      softSync,
    }),
    [
      hydrated,
      authLoading,
      cloudEnabled,
      cloudOnline,
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
      showSyncBanner,
      dismissSyncBanner,
      exportProgress,
      deleteLocalProgress,
      deleteCloudAndLocalProgress,
      lastCloudSync,
      softSync,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <SaveProgressBanner />
      <Toaster
        position="bottom-right"
        theme={theme}
        richColors
        closeButton
        gap={8}
        toastOptions={{
          className: "text-sm",
          duration: 3500,
        }}
      />
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within Providers");
  return ctx;
}
