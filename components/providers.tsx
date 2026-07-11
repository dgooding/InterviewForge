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
          const base = await ensureCloudProfile(data.session.user);
          const cloud = await hydrateFromCloud(base);
          if (cancelled) return;
          setUserState(cloud.user);
          setSessionsState(cloud.sessions);
          setResumeState(cloud.resume);
          setRoleState(cloud.preferredRole);
          setLastSyncState(getLastCloudSync());
          setCloudOnline(true);
          if (cloud.migratedLocalSessions > 0) {
            toast.success(
              `Synced ${cloud.migratedLocalSessions} local session${
                cloud.migratedLocalSessions === 1 ? "" : "s"
              } to your account`
            );
          }
        } else {
          // Guest: local only — never touch cloud APIs
          const existing = getUser();
          if (existing?.isCloud) {
            // Stale cloud identity without session → guest id, keep local progress rows
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
        // Keep local progress; identity becomes guest
        setUserState(createFreshGuest());
        applyLocalMirror();
        return;
      }
      if (
        session?.user &&
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
      ) {
        // Only full migrate on SIGNED_IN (explicit login)
        if (event === "TOKEN_REFRESHED") {
          // light touch — don't re-toast migrate
          try {
            const base = await ensureCloudProfile(session.user);
            setUserState(base);
            setCloudOnline(true);
          } catch {
            setCloudOnline(false);
          }
          return;
        }
        try {
          setAuthLoading(true);
          const base = await ensureCloudProfile(session.user);
          const cloud = await hydrateFromCloud(base);
          setUserState(cloud.user);
          setSessionsState(cloud.sessions);
          setResumeState(cloud.resume);
          setRoleState(cloud.preferredRole);
          setLastSyncState(getLastCloudSync());
          setCloudOnline(true);
          if (cloud.migratedLocalSessions > 0) {
            toast.success(
              `Your local progress was saved to your account (${cloud.migratedLocalSessions} new session${
                cloud.migratedLocalSessions === 1 ? "" : "s"
              })`
            );
          } else {
            toast.success("Signed in — progress syncs across devices");
          }
        } catch (e) {
          console.warn("auth hydrate failed", e);
          setCloudOnline(false);
          toast.message("Signed in, but cloud sync is offline. Data stays on this device.");
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
    await authSignOut();
    setUserState(createFreshGuest());
    applyLocalMirror();
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
      <Toaster position="top-right" theme={theme} richColors closeButton />
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within Providers");
  return ctx;
}
