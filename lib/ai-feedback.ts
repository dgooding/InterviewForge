import type { AIFeedback, AnswerScores, InterviewMode } from "./types";
import { clamp } from "./utils";

/**
 * Heuristic AI feedback engine (always available offline).
 * When XAI_API_KEY is set, API routes enhance results via SpaceXAI/xAI.
 */

const FILLER = /\b(um|uh|like|you know|basically|actually|sort of|kind of)\b/gi;
const STAR_MARKERS = {
  situation: /\b(situation|context|background|when i|at my|while working|during)\b/i,
  task: /\b(task|goal|objective|needed to|responsible for|my role|challenge was)\b/i,
  action: /\b(i |we |implemented|built|designed|led|created|analyzed|negotiated|decided)\b/i,
  result: /\b(result|outcome|impact|increased|decreased|saved|improved|achieved|led to|metric|%|percent)\b/i,
};

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function scoreClarity(text: string): number {
  const words = wordCount(text);
  const fillers = (text.match(FILLER) || []).length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5).length;
  let score = 6;
  if (words >= 40 && words <= 250) score += 1.5;
  if (words < 25) score -= 2;
  if (words > 350) score -= 1;
  if (fillers === 0) score += 1;
  else score -= Math.min(2, fillers * 0.3);
  if (sentences >= 3) score += 0.5;
  return clamp(Math.round(score * 10) / 10, 1, 10);
}

function scoreRelevance(text: string, question: string): number {
  const qWords = new Set(
    question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4)
  );
  const aWords = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/);
  let hits = 0;
  aWords.forEach((w) => {
    if (qWords.has(w)) hits++;
  });
  const density = hits / Math.max(1, qWords.size);
  let score = 5 + density * 5;
  if (wordCount(text) < 15) score -= 2;
  return clamp(Math.round(score * 10) / 10, 1, 10);
}

function scoreSTAR(text: string): number {
  let parts = 0;
  if (STAR_MARKERS.situation.test(text)) parts++;
  if (STAR_MARKERS.task.test(text)) parts++;
  if (STAR_MARKERS.action.test(text)) parts++;
  if (STAR_MARKERS.result.test(text)) parts++;
  // Action + result weigh more
  const hasNumbers = /\d/.test(text);
  let score = 3 + parts * 1.5;
  if (hasNumbers) score += 1;
  return clamp(Math.round(score * 10) / 10, 1, 10);
}

function scoreTechnical(text: string, mode: InterviewMode): number {
  const techTerms =
    /\b(api|database|latency|scale|algorithm|cache|queue|microservice|react|sql|index|complexity|security|auth|deploy|test|architecture|trade-?off|throughput|consistency)\b/gi;
  const matches = text.match(techTerms) || [];
  let score = mode === "technical" || mode === "mixed" ? 5 : 6;
  score += Math.min(3, matches.length * 0.4);
  if (/\b(because|trade-?off|pros|cons|for example)\b/i.test(text)) score += 1;
  if (wordCount(text) < 30 && mode === "technical") score -= 1.5;
  return clamp(Math.round(score * 10) / 10, 1, 10);
}

function scoreConfidence(text: string): number {
  let score = 6.5;
  if (/\b(i led|i owned|i decided|i delivered|i achieved)\b/i.test(text)) score += 1.5;
  if (/\b(maybe|i guess|i'm not sure|probably|sort of)\b/i.test(text)) score -= 1.5;
  if (wordCount(text) >= 50) score += 0.5;
  return clamp(Math.round(score * 10) / 10, 1, 10);
}

function buildStrengths(scores: AnswerScores, text: string): string[] {
  const s: string[] = [];
  if (scores.clarity >= 7) s.push("Clear and well-paced delivery with readable structure.");
  if (scores.structure >= 7) s.push("Strong use of situation → action → result framing.");
  if (scores.technicalAccuracy >= 7) s.push("Solid technical vocabulary and reasoned trade-offs.");
  if (scores.confidence >= 7) s.push("Confident ownership language — you sound like a driver, not a passenger.");
  if (/\d/.test(text)) s.push("You included concrete numbers or metrics — interviewers love this.");
  if (s.length === 0) s.push("You engaged with the question and provided a substantive attempt.");
  return s.slice(0, 4);
}

function buildImprovements(scores: AnswerScores, text: string, mode: InterviewMode): string[] {
  const s: string[] = [];
  if (scores.clarity < 7) s.push("Tighten the narrative: aim for 60–90 seconds with a crisp opening sentence.");
  if (scores.structure < 7 && (mode === "behavioral" || mode === "mixed" || mode === "company"))
    s.push("Use full STAR: Situation, Task, Action (with 'I'), Result (with metrics).");
  if (scores.relevance < 7) s.push("Mirror keywords from the question early so relevance is obvious.");
  if (scores.technicalAccuracy < 7 && (mode === "technical" || mode === "mixed"))
    s.push("Add one concrete example, complexity note, or trade-off to deepen technical credibility.");
  if (scores.confidence < 7) s.push("Replace hedging phrases with decisive ownership language.");
  if (wordCount(text) < 40) s.push("Expand with specifics — short answers leave interviewers guessing.");
  if ((text.match(FILLER) || []).length > 2) s.push("Reduce filler words for a more polished delivery.");
  if (s.length === 0) s.push("Level up with a sharper closing line that ties back to the role.");
  return s.slice(0, 4);
}

function sampleBetterAnswer(question: string, mode: InterviewMode): string {
  if (mode === "technical") {
    return `I'd start by clarifying requirements and constraints, then outline my approach: core components, data flow, and failure modes. For example, with "${question.slice(0, 60)}...", I'd define success metrics, propose a simple first version, discuss scaling bottlenecks (latency, storage, consistency), and call out trade-offs. I'd close with how I'd validate correctness (tests, monitoring) and what I'd improve next.`;
  }
  return `Situation: In my previous role, we faced a high-stakes scenario related to this theme. Task: I was responsible for driving a clear outcome under time pressure. Action: I aligned stakeholders, broke the work into milestones, and personally owned the riskiest piece — communicating progress daily. Result: We hit the goal (e.g., +X% metric / shipped on time) and documented a playbook the team still uses. This shows how I combine ownership, collaboration, and measurable impact.`;
}

function keyPhrases(mode: InterviewMode): string[] {
  if (mode === "technical") {
    return [
      "The main trade-off is…",
      "I'd start with the simplest correct design…",
      "At scale, the bottleneck becomes…",
      "I'd measure success with…",
      "Failure mode I'd watch for…",
    ];
  }
  return [
    "The situation was…",
    "My specific responsibility was…",
    "I decided to… because…",
    "The measurable result was…",
    "What I learned and applied next was…",
  ];
}

function followUp(scores: AnswerScores, mode: InterviewMode): string | undefined {
  if (scores.overall >= 8.5) {
    return mode === "technical"
      ? "Interesting. How would your design change under 10x traffic?"
      : "Strong answer. What would you do differently if you faced that situation again today?";
  }
  if (scores.structure < 6) {
    return "Can you restate that using STAR, focusing on your personal actions and the result?";
  }
  if (scores.technicalAccuracy < 6 && mode !== "behavioral") {
    return "Could you go one level deeper on the technical decision and its trade-offs?";
  }
  if (scores.overall < 6) {
    return "Thanks. Can you give a more specific example with numbers or a concrete outcome?";
  }
  return "What was the hardest part of that experience, and how did you navigate it?";
}

export function generateLocalFeedback(
  question: string,
  answer: string,
  mode: InterviewMode
): AIFeedback {
  const clarity = scoreClarity(answer);
  const relevance = scoreRelevance(answer, question);
  const structure =
    mode === "technical" ? scoreTechnical(answer, mode) : scoreSTAR(answer);
  const technicalAccuracy = scoreTechnical(answer, mode);
  const confidence = scoreConfidence(answer);
  const overall = clamp(
    Math.round(
      ((clarity + relevance + structure + technicalAccuracy + confidence) / 5) * 10
    ) / 10,
    1,
    10
  );

  const scores: AnswerScores = {
    clarity,
    relevance,
    structure,
    technicalAccuracy,
    confidence,
    overall,
  };

  return {
    scores,
    strengths: buildStrengths(scores, answer),
    improvements: buildImprovements(scores, answer, mode),
    sampleBetterAnswer: sampleBetterAnswer(question, mode),
    keyPhrases: keyPhrases(mode),
    followUpQuestion: followUp(scores, mode),
    summary:
      overall >= 8
        ? "Excellent response — polished, relevant, and interview-ready."
        : overall >= 6
          ? "Solid foundation with clear room to sharpen structure and specificity."
          : "Needs more structure and concrete detail to compete at top companies.",
  };
}

export function generateLocalResumeAnalysis(text: string, fileName: string) {
  const lower = text.toLowerCase();
  const strengths: string[] = [];
  const talkingPoints: string[] = [];
  const suggestedRoles: string[] = [];

  if (/react|typescript|javascript|node|python|java|golang|rust/.test(lower)) {
    strengths.push("Demonstrated hands-on software engineering skills across modern stacks.");
    talkingPoints.push("Prepare a 60-second story about a system you designed or shipped end-to-end.");
    suggestedRoles.push("Software Engineer", "Full Stack Engineer");
  }
  if (/product|roadmap|stakeholder|agile|scrum|priorit/.test(lower)) {
    strengths.push("Product sense and stakeholder alignment experience.");
    talkingPoints.push("Use a RICE/MoSCoW example when discussing prioritization.");
    suggestedRoles.push("Product Manager");
  }
  if (/design|figma|ux|user research|wireframe|prototype/.test(lower)) {
    strengths.push("Design craft and user-centered process.");
    talkingPoints.push("Walk through one case study: problem → research → solution → impact.");
    suggestedRoles.push("UX Designer", "Product Designer");
  }
  if (/sql|python|tableau|power bi|analytics|machine learning|model/.test(lower)) {
    strengths.push("Analytical and data-driven decision making.");
    talkingPoints.push("Quantify one insight that changed a business decision.");
    suggestedRoles.push("Data Analyst", "Data Scientist");
  }
  if (/sales|pipeline|quota|crm|revenue|customer success/.test(lower)) {
    strengths.push("Revenue ownership and customer-facing impact.");
    talkingPoints.push("Prepare a win story and a loss-learn story with clear metrics.");
    suggestedRoles.push("Account Executive", "Customer Success Manager");
  }
  if (/lead|manage|mentor|team of|hired|performance/.test(lower)) {
    strengths.push("Leadership signals — mentoring, ownership, and team outcomes.");
    talkingPoints.push("Have a leadership story ready: hard feedback, hiring, or delivery under pressure.");
  }
  if (strengths.length === 0) {
    strengths.push("Diverse experience that can be tailored to multiple role narratives.");
    talkingPoints.push("Pick 3 signature stories and map each to STAR with measurable results.");
    suggestedRoles.push("Software Engineer", "Product Manager", "Business Analyst");
  }

  // Unique
  const uniq = (arr: string[]) => Array.from(new Set(arr));

  return {
    summary: `Based on "${fileName}", your background shows transferable strengths that map well to interview storytelling. Focus on quantifying impact and aligning stories to the target role.`,
    strengths: uniq(strengths).slice(0, 5),
    talkingPoints: uniq(talkingPoints).slice(0, 5),
    suggestedRoles: uniq(suggestedRoles).slice(0, 5),
  };
}
