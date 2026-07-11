/**
 * Cloud progress sync via Supabase (when signed in with Google).
 * Always keeps a localStorage mirror so the UI stays snappy offline.
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
    createdAt: profile?.created_at || authUser.created_at || new Date().toISOString(),
    streak: profile?.streak ?? 0,
    lastPracticeDate: profile?.last_practice_date ?? null,
    preferredRole: profile?.preferred_role ?? undefined,
  };
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

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!existing) {
    const { data: created, error } = await supabase
      .from("profiles")
      .insert({
        id: authUser.id,
        email: authUser.email,
        name,
        avatar_url: avatar,
        streak: 0,
        last_practice_date: null,
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

  // Refresh name/avatar from Google if empty
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
}

export async function pushProfile(user: User): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase || user.isGuest || !user.isCloud) return;

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
  if (error) console.warn("pushProfile", error);
}

export async function pullSessions(userId: string): Promise<InterviewSession[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return getSessions();

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
    companyStyle: (row.company_style as InterviewSession["companyStyle"]) || undefined,
    startedAt: row.started_at,
    completedAt: row.completed_at || undefined,
    overallScore: row.overall_score ?? undefined,
    status: row.status as InterviewSession["status"],
    answers: row.answers || [],
  }));
}

export async function pushSession(
  userId: string,
  session: InterviewSession
): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;

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
  if (error) console.warn("pushSession", error);
}

export async function pullResume(userId: string): Promise<ResumeAnalysis | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return getResumeAnalysis();

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
}

export async function pushResume(
  userId: string,
  analysis: ResumeAnalysis | null
): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;

  if (!analysis) {
    await supabase.from("resume_analyses").delete().eq("user_id", userId);
    return;
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
  if (error) console.warn("pushResume", error);
}

/**
 * On login: merge any local guest progress into the cloud account, then
 * reload the canonical cloud state into localStorage for the app.
 */
export async function hydrateFromCloud(user: User): Promise<{
  user: User;
  sessions: InterviewSession[];
  resume: ResumeAnalysis | null;
  preferredRole: string | null;
}> {
  const localSessions = getSessions();
  const localResume = getResumeAnalysis();
  const localRole = getSelectedRole();

  // Push local sessions that might not be in cloud yet (guest → Google upgrade)
  for (const s of localSessions) {
    await pushSession(user.id, { ...s, userId: user.id });
  }
  if (localResume) {
    await pushResume(user.id, localResume);
  }

  let profileUser = user;
  if (localRole && !user.preferredRole) {
    profileUser = { ...user, preferredRole: localRole };
  }
  await pushProfile(profileUser);

  const sessions = await pullSessions(user.id);
  const resume = await pullResume(user.id);

  // Refresh profile (streak etc.)
  const supabase = getSupabaseBrowser();
  if (supabase) {
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
    }
  }

  const preferredRole =
    profileUser.preferredRole || localRole || null;

  // Mirror to localStorage for offline UI
  setLocalUser(profileUser);
  setSessions(sessions);
  setLocalResume(resume);
  if (preferredRole) setLocalRole(preferredRole);

  return {
    user: profileUser,
    sessions,
    resume,
    preferredRole,
  };
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
        prompt: "consent",
      },
    },
  });

  if (error) return { error: error.message };
  return {};
}

export async function signOutCloud(): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (supabase) {
    await supabase.auth.signOut();
  }
}
