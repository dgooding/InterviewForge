/**
 * Site-wide casual / teen-cadence helpers for UI chrome.
 * Interview question prompts stay realistic; tips & labels get the vibe.
 */

/** Difficulty chips people actually read. */
export function casualDifficulty(d: string | undefined | null): string {
  const x = (d || "").toLowerCase();
  if (x === "easy") return "chill";
  if (x === "medium") return "solid";
  if (x === "hard") return "spicy";
  return d || "solid";
}

/** Soften coach tips so they don't sound like a LinkedIn course. */
export function casualTip(tip: string | undefined | null): string {
  const raw = (tip || "").trim();
  if (!raw) {
    return "Keep it real: what happened, what you did, how it ended. Numbers help.";
  }

  // Already casual enough
  if (/\b(ngl|lowkey|tbh|bet|mid|just |ok |don't|don't)\b/i.test(raw)) {
    return raw;
  }

  const rewrites: [RegExp, string][] = [
    [
      /^keep it under 2 minutes.*/i,
      "Keep it under 2 min: who you are now → what you did → why this job. Done.",
    ],
    [
      /^use star\.?\s*emphasize ownership.*/i,
      "STAR it. Say what YOU owned and how you measured the ending.",
    ],
    [
      /^use full star.*/i,
      "Full STAR please — Situation, Task, Action (I…), Result (with a number if you can).",
    ],
    [
      /^structure:\s*clarify.*/i,
      "Walk it: goal → users → how you measure → ideas → trade-offs. Don't ramble.",
    ],
    [
      /^accountability with influence.*/i,
      "You didn't control everyone — say how you still made the outcome move. Influence > title.",
    ],
    [
      /^google values.*/i,
      "They like structured thinking + not being a know-it-all. Show both.",
    ],
    [
      /^meta values.*/i,
      "Impact, speed, ownership — sound like you ship, not like you run meetings about shipping.",
    ],
    [
      /^map answers to amazon.*/i,
      "Name the Leadership Principle out loud. Amazon interviewers collect those like Pokémon.",
    ],
    [
      /^apple values.*/i,
      "Taste + simplicity + details. Sound like you care how it feels, not just that it works.",
    ],
    [
      /^microsoft values.*/i,
      "Growth mindset + not being toxic. Show you learn and play nice.",
    ],
  ];

  for (const [re, out] of rewrites) {
    if (re.test(raw)) return out;
  }

  // Light polish for short formal tips
  if (raw.length <= 100) {
    const cleaned = raw.replace(/\.$/, "");
    return `${cleaned}. Don't overthink it.`;
  }

  return raw;
}

/** Mode / category labels for chips. */
export function casualCategory(cat: string | undefined | null): string {
  const c = (cat || "").toLowerCase();
  const map: Record<string, string> = {
    behavioral: "behavioral",
    technical: "techy",
    "system-design": "system design",
    leadership: "lead energy",
    product: "product",
    situational: "what-if",
    company: "company vibe",
    mixed: "mixed bag",
  };
  return map[c] || cat || "general";
}
