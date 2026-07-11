/** Core domain types for InterviewForge */

export type InterviewMode =
  | "behavioral"
  | "technical"
  | "mixed"
  | "company";

export type QuestionCategory =
  | "behavioral"
  | "technical"
  | "system-design"
  | "leadership"
  | "product"
  | "situational"
  | "company-culture";

export type CompanyStyle =
  | "google"
  | "meta"
  | "amazon"
  | "apple"
  | "microsoft"
  | "startup"
  | "general";

export interface User {
  id: string;
  email: string;
  name: string;
  isGuest: boolean;
  createdAt: string;
  streak: number;
  lastPracticeDate: string | null;
  preferredRole?: string;
}

export interface JobRole {
  id: string;
  title: string;
  category: string;
  description: string;
  popular?: boolean;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  category: QuestionCategory;
  mode: InterviewMode | "all";
  roles: string[]; // role ids or "all"
  companyStyle?: CompanyStyle;
  difficulty: "easy" | "medium" | "hard";
  tips?: string;
  sampleAnswerOutline?: string;
}

export interface AnswerScores {
  clarity: number;
  relevance: number;
  structure: number; // STAR for behavioral
  technicalAccuracy: number;
  confidence: number;
  overall: number;
}

export interface AIFeedback {
  scores: AnswerScores;
  strengths: string[];
  improvements: string[];
  sampleBetterAnswer: string;
  keyPhrases: string[];
  followUpQuestion?: string;
  summary: string;
}

export interface InterviewAnswer {
  questionId: string;
  questionText: string;
  answerText: string;
  feedback: AIFeedback;
  durationSeconds: number;
  answeredAt: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  role: string;
  mode: InterviewMode;
  companyStyle?: CompanyStyle;
  startedAt: string;
  completedAt?: string;
  answers: InterviewAnswer[];
  overallScore?: number;
  status: "in_progress" | "completed" | "abandoned";
}

export interface ResumeAnalysis {
  id: string;
  fileName: string;
  uploadedAt: string;
  summary: string;
  strengths: string[];
  talkingPoints: string[];
  suggestedRoles: string[];
  rawTextExcerpt?: string;
}

export interface UserStats {
  totalSessions: number;
  averageScore: number;
  streak: number;
  bestScore: number;
  categoryScores: {
    communication: number;
    technical: number;
    confidence: number;
    structure: number;
  };
  scoreHistory: { date: string; score: number; mode: InterviewMode }[];
  weakAreas: string[];
}

export interface AppState {
  user: User | null;
  sessions: InterviewSession[];
  resumeAnalysis: ResumeAnalysis | null;
  selectedRole: string | null;
  theme: "light" | "dark";
}
