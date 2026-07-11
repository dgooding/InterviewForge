/**
 * Cloud progress sync via Supabase — ONLY for authenticated users.
 *
 * Guarantees:
 * - Never called for guests (enforced by providers + isCloudUser checks).
 * - Login is the explicit opt-in to upload/merge local progress.
 * - RLS in supabase/schema.sql ensures users only access their own rows.
 * - On Supabase failure, callers should keep serving localStorage data.
 */

import type { User, InterviewSession, ResumeAnalysis } from "./types";
import { getSupabaseBrowser } from "./supabase/client";
import {
  getSessions,
  setSessions,
  getResumeAnalysis,
  setResumeAnalysis as setLocalResume,
  getSelectedRole,
  setSelectedRole as setLocalRole,
  setUser as setLocalUser,
  setLastCloudSync,
  getUser,
} from "./storage";

type ProfileRow = {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  streak: number | null;
  last_practice_date: string | null;
  preferred_role: string | null;
  created_at: string | null;
};

type SessionRow = {
  id: string;
  user_id: string;
  role: string;
  mode: string;
  company_style: string | null;
  started_at: string;
  completed_at: string | null;
  overall_score: number | null;
  status: string;
  answers: InterviewSession["answers"];
};

type ResumeRow = {
  id: string;
  user_id: string;
  file_name: string | null;
  summary: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  experience_highlights: string[] | null;
  talking_points: string[] | null;
  sample_answers: ResumeAnalysis["sampleAnswers"] | null;
  suggested_roles: string[] | null;
  raw_text_excerpt: string | null;
  source: string | null;
  uploaded_at: string | null;
};

type AuthLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
  created_at?: string;
};

function metaStr(
  meta: Record<string, unknown> | null | undefined,
  key: string
): string | undefined {
  const v = meta?.[key];
  return typeof v === "string" ? v : undefined;
}

export function mapAuthUserToAppUser(
  authUser: AuthLike,
  profile?: Partial<ProfileRow> | null
): User {
  const meta = authUser.user_metadata || {};
  return {
    id: authUser.id,
    email: profile?.email || authUser.email || "",
    name:
      profile?.name ||
      metaStr(meta, "full_name") ||
      metaStr(meta, "name") ||
      authUser.email?.split("@")[0] ||
      "Candidate",
    avatarUrl:
      profile?.avatar_url ||
      metaStr(meta, "avatar_url") ||
      metaStr(meta, "picture") ||
      null,
    isGuest: false,
    isCloud: true,
    createdAt:
      profile?.created_at || authUser.created_at || new Date().toISOString(),
    streak: profile?.streak ?? 0,
    lastPracticeDate: profile?.last_practice_date ?? null,
    preferredRole: profile?.preferred_role ?? undefined,
  };
}

/** Prefer the session with more answers / completion / higher score. */
export function mergeSessions(
  a: InterviewSession[],
  b: InterviewSession[]
): InterviewSession[] {
  const map = new Map<string, InterviewSession>();

  const prefer = (x: InterviewSession, y: InterviewSession) => {
    const ax = x.answers?.length || 0;
    const ay = y.answers?.length || 0;
    if (ax !== ay) return ax > ay ? x : y;
    if (x.status === "completed" && y.status !== "completed") return x;
    if (y.status === "completed" && x.status !== "completed") return y;
    const sx = x.overallScore ?? 0;
    const sy = y.overallScore ?? 0;
    if (sx !== sy) return sx >= sy ? x : y;
    return new Date(x.startedAt).getTime() >= new Date(y.startedAt).getTime()
      ? x
      : y;
  };

  for (const s of a) map.set(s.id, s);
  for (const s of b) {
    const existing = map.get(s.id);
    map.set(s.id, existing ? prefer(existing, s) : s);
  }

  return Array.from(map.values()).sort(
    (x, y) =>
      new Date(y.startedAt).getTime() - new Date(x.startedAt).getTime()
  );
}

export function mergeResume(
  local: ResumeAnalysis | null,
  cloud: ResumeAnalysis | null
): ResumeAnalysis | null {
  if (!local) return cloud;
  if (!cloud) return local;
  return new Date(local.uploadedAt).getTime() >=
    new Date(cloud.uploadedAt).getTime()
    ? local
    : cloud;
}

export async function ensureCloudProfile(authUser: AuthLike): Promise<User> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return mapAuthUserToAppUser(authUser);
  }

  const meta = authUser.user_metadata || {};
  const name =
    metaStr(meta, "full_name") ||
    metaStr(meta, "name") ||
    authUser.email?.split("@")[0] ||
    "Candidate";
  const avatar =
    metaStr(meta, "avatar_url") || metaStr(meta, "picture") || null;

  try {
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (!existing) {
      const local = getUser();
      const { data: created, error } = await supabase
        .from("profiles")
        .insert({
          id: authUser.id,
          email: authUser.email,
          name,
          avatar_url: avatar,
          streak: local && !local.isCloud ? local.streak || 0 : 0,
          last_practice_date:
            local && !local.isCloud ? local.lastPracticeDate : null,
          preferred_role: getSelectedRole(),
        })
        .select("*")
        .single();

      if (error) {
        console.warn("profile insert failed", error);
        return mapAuthUserToAppUser(authUser);
      }
      return mapAuthUserToAppUser(authUser, created as ProfileRow);
    }

    if ((!existing.name || !existing.avatar_url) && (name || avatar)) {
      await supabase
        .from("profiles")
        .update({
          name: existing.name || name,
          avatar_url: existing.avatar_url || avatar,
          email: authUser.email,
        })
        .eq("id", authUser.id);
    }

    return mapAuthUserToAppUser(authUser, existing as ProfileRow);
  } catch (e) {
    console.warn("ensureCloudProfile offline", e);
    return mapAuthUserToAppUser(authUser);
  }
}

export async function pushProfile(user: User): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  if (!supabase || user.isGuest || !user.isCloud) return false;

  try {
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatarUrl ?? null,
      streak: user.streak,
      last_practice_date: user.lastPracticeDate,
      preferred_role: user.preferredRole ?? null,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.warn("pushProfile", error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("pushProfile offline", e);
    return false;
  }
}

export async function pullSessions(userId: string): Promise<InterviewSession[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return getSessions();

  try {
    const { data, error } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    if (error) {
      console.warn("pullSessions", error);
      return getSessions();
    }

    return (data as SessionRow[]).map((row) => ({
      id: row.id,
      userId: row.user_id,
      role: row.role,
      mode: row.mode as InterviewSession["mode"],
      companyStyle:
        (row.company_style as InterviewSession["companyStyle"]) || undefined,
      startedAt: row.started_at,
      completedAt: row.completed_at || undefined,
      overallScore: row.overall_score ?? undefined,
      status: row.status as InterviewSession["status"],
      answers: row.answers || [],
    }));
  } catch (e) {
    console.warn("pullSessions offline", e);
    return getSessions();
  }
}

export async function pushSession(
  userId: string,
  session: InterviewSession
): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("interview_sessions").upsert({
      id: session.id,
      user_id: userId,
      role: session.role,
      mode: session.mode,
      company_style: session.companyStyle ?? null,
      started_at: session.startedAt,
      completed_at: session.completedAt ?? null,
      overall_score: session.overallScore ?? null,
      status: session.status,
      answers: session.answers,
    });
    if (error) {
      console.warn("pushSession", error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("pushSession offline", e);
    return false;
  }
}

export async function pullResume(
  userId: string
): Promise<ResumeAnalysis | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return getResumeAnalysis();

  try {
    const { data, error } = await supabase
      .from("resume_analyses")
      .select("*")
      .eq("user_id", userId)
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("pullResume", error);
      return getResumeAnalysis();
    }
    if (!data) return null;

    const row = data as ResumeRow;
    return {
      id: row.id,
      fileName: row.file_name || "resume.pdf",
      uploadedAt: row.uploaded_at || new Date().toISOString(),
      summary: row.summary || "",
      strengths: row.strengths || [],
      weaknesses: row.weaknesses || [],
      experienceHighlights: row.experience_highlights || [],
      talkingPoints: row.talking_points || [],
      sampleAnswers: row.sample_answers || [],
      suggestedRoles: row.suggested_roles || [],
      rawTextExcerpt: row.raw_text_excerpt || undefined,
      source: (row.source as ResumeAnalysis["source"]) || undefined,
    };
  } catch (e) {
    console.warn("pullResume offline", e);
    return getResumeAnalysis();
  }
}

export async function pushResume(
  userId: string,
  analysis: ResumeAnalysis | null
): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;

  try {
    if (!analysis) {
      await supabase.from("resume_analyses").delete().eq("user_id", userId);
      return true;
    }

    const { error } = await supabase.from("resume_analyses").upsert({
      id: analysis.id,
      user_id: userId,
      file_name: analysis.fileName,
      summary: analysis.summary,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses || [],
      experience_highlights: analysis.experienceHighlights || [],
      talking_points: analysis.talkingPoints,
      sample_answers: analysis.sampleAnswers || [],
      suggested_roles: analysis.suggestedRoles,
      raw_text_excerpt: analysis.rawTextExcerpt ?? null,
      source: analysis.source ?? null,
      uploaded_at: analysis.uploadedAt,
    });
    if (error) {
      console.warn("pushResume", error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("pushResume offline", e);
    return false;
  }
}

/**
 * Explicit migration after login (user chose Google sign-in):
 * 1) Merge local guest progress with cloud
 * 2) Upload merged result
 * 3) Mirror to localStorage for offline UI
 */
export async function hydrateFromCloud(user: User): Promise<{
  user: User;
  sessions: InterviewSession[];
  resume: ResumeAnalysis | null;
  preferredRole: string | null;
  migratedLocalSessions: number;
}> {
  const localSessions = getSessions();
  const localResume = getResumeAnalysis();
  const localRole = getSelectedRole();
  const localUser = getUser();

  let cloudSessions: InterviewSession[] = [];
  let cloudResume: ResumeAnalysis | null = null;

  try {
    cloudSessions = await pullSessions(user.id);
    cloudResume = await pullResume(user.id);
  } catch {
    // stay local-only if pull fails
  }

  const mergedSessions = mergeSessions(localSessions, cloudSessions).map(
    (s) => ({ ...s, userId: user.id })
  );
  const mergedResume = mergeResume(localResume, cloudResume);

  // Upload merge (only for signed-in user)
  for (const s of mergedSessions) {
    await pushSession(user.id, s);
  }
  if (mergedResume) {
    await pushResume(user.id, mergedResume);
  }

  // Streak: take the max of local guest + cloud
  let profileUser = { ...user };
  const localStreak =
    localUser && (localUser.isGuest || !localUser.isCloud)
      ? localUser.streak || 0
      : 0;
  if (localStreak > (profileUser.streak || 0)) {
    profileUser = {
      ...profileUser,
      streak: localStreak,
      lastPracticeDate:
        localUser?.lastPracticeDate || profileUser.lastPracticeDate,
    };
  }
  if (localRole && !profileUser.preferredRole) {
    profileUser = { ...profileUser, preferredRole: localRole };
  }
  await pushProfile(profileUser);

  // Re-pull profile for consistency
  const supabase = getSupabaseBrowser();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        profileUser = mapAuthUserToAppUser(
          { id: user.id, email: user.email, created_at: user.createdAt },
          data as ProfileRow
        );
        // preserve higher streak we just computed if cloud row lagged
        if (localStreak > (profileUser.streak || 0)) {
          profileUser = {
            ...profileUser,
            streak: localStreak,
            lastPracticeDate:
              localUser?.lastPracticeDate || profileUser.lastPracticeDate,
          };
          await pushProfile(profileUser);
        }
      }
    } catch {
      /* offline */
    }
  }

  const preferredRole = profileUser.preferredRole || localRole || null;

  setLocalUser(profileUser);
  setSessions(mergedSessions);
  setLocalResume(mergedResume);
  if (preferredRole) setLocalRole(preferredRole);
  setLastCloudSync(new Date().toISOString());

  const migratedLocalSessions = localSessions.filter(
    (ls) => !cloudSessions.some((cs) => cs.id === ls.id)
  ).length;

  return {
    user: profileUser,
    sessions: mergedSessions,
    resume: mergedResume,
    preferredRole,
    migratedLocalSessions,
  };
}

/** Soft pull for multi-device (signed-in only). Merges with local. */
export async function softSyncFromCloud(user: User): Promise<{
  sessions: InterviewSession[];
  resume: ResumeAnalysis | null;
} | null> {
  if (user.isGuest || !user.isCloud) return null;
  try {
    const cloudSessions = await pullSessions(user.id);
    const cloudResume = await pullResume(user.id);
    const merged = mergeSessions(getSessions(), cloudSessions).map((s) => ({
      ...s,
      userId: user.id,
    }));
    const resume = mergeResume(getResumeAnalysis(), cloudResume);
    setSessions(merged);
    setLocalResume(resume);
    setLastCloudSync(new Date().toISOString());
    return { sessions: merged, resume };
  } catch {
    return null;
  }
}

/** Delete all cloud rows for the signed-in user (account data wipe). */
export async function deleteAllCloudData(userId: string): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;
  try {
    await supabase.from("interview_sessions").delete().eq("user_id", userId);
    await supabase.from("resume_analyses").delete().eq("user_id", userId);
    await supabase
      .from("profiles")
      .update({
        streak: 0,
        last_practice_date: null,
        preferred_role: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    return true;
  } catch (e) {
    console.warn("deleteAllCloudData", e);
    return false;
  }
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return {
      error:
        "Google sign-in is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see README).",
    };
  }

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error) return { error: error.message };
  return {};
}

export async function signInWithGitHub(): Promise<{ error?: string }> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return {
      error:
        "GitHub sign-in is not configured. Add Supabase env vars and enable GitHub provider.",
    };
  }

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo },
  });

  if (error) return { error: error.message };
  return {};
}

export async function signOutCloud(): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("signOut", e);
    }
  }
}
