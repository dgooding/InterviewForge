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

/** Theme tags derived from question text for story matching. */
type StoryTheme =
  | "conflict"
  | "failure"
  | "leadership"
  | "deadline"
  | "customer"
  | "teamwork"
  | "initiative"
  | "feedback"
  | "ambiguity"
  | "change"
  | "ethics"
  | "strength"
  | "weakness"
  | "why_company"
  | "tell_me"
  | "priority"
  | "mentor"
  | "communication"
  | "data"
  | "technical"
  | "system_design"
  | "debug"
  | "service_desk"
  | "sales"
  | "product"
  | "influence"
  | "generic";

interface StarStory {
  themes: StoryTheme[];
  situation: string;
  task: string;
  action: string;
  result: string;
  /** One memorable closer / learning line */
  closer: string;
}

const STAR_STORIES: StarStory[] = [
  {
    themes: ["conflict", "communication", "teamwork"],
    situation:
      "Six weeks before a product launch, our design lead and backend lead stopped talking — literally. Design wanted a real-time collaboration feature; backend said it would blow the deadline. Standups got tense, and the PM started mediating every conversation.",
    task:
      "I wasn't the manager, but I owned the shared API contract and was the only person both sides still trusted. My job was to unstick the decision without picking a political side — and still ship something users would love.",
    action:
      "I booked a 45-minute working session (not a status meeting). I walked in with two prototypes on a whiteboard: a full WebSocket design, and a \"good enough\" optimistic-UI path that reused our existing REST endpoints. I asked each person to rate risk, effort, and user impact out loud. Then I proposed a hybrid: ship the optimistic path for launch day, instrument where users actually hit conflicts, and schedule the real-time work as a fast-follow with a named owner. I put the decision and numbers in a one-pager so nobody had to re-litigate it in Slack.",
    result:
      "We launched on time. Post-launch data showed only 4% of sessions needed true real-time conflict resolution — so the hybrid was the right call. The design lead later told me the session \"felt like someone finally put the problem on the table instead of our egos.\" We shipped real-time six weeks later with far less drama.",
    closer:
      "What stuck with me: conflict often looks like a people problem when it's actually an unframed trade-off. Make the trade-off visible and most of the heat disappears.",
  },
  {
    themes: ["failure", "feedback"],
    situation:
      "Early in my last role I owned a migration of our billing export. I was confident — too confident. I ran it in a staging environment that only had clean data, greenlit production for a Friday evening \"quiet window,\" and went to dinner.",
    task:
      "By Saturday morning, 12% of invoices had wrong tax lines. Support tickets were piling up. I had to own the mess, fix production, and regain trust from finance and my manager.",
    action:
      "I didn't hide. I messaged the #incidents channel within ten minutes of waking up, paged myself, and wrote a blunt status: what broke, who was affected, and that I was the decision-maker who skipped the dirty-data test. I rolled back first (customer pain > pride), then built a re-export path with a parity check against the old system. Before the postmortem I drafted my own blameless write-up so nobody else had to chase me for the timeline.",
    result:
      "We restored correct invoices within 6 hours and issued corrected PDFs to every affected customer. Finance's trust recovered faster than I expected — they said the honesty mattered more than the bug. Personally, I now treat \"happy-path staging\" as a red flag. Every migration I own has a chaos checklist: dirty data, partial failures, and a rollback drill.",
    closer:
      "The line I still use in interviews: I failed once by shipping confidence instead of evidence — and I never want to tell that story again for the same reason.",
  },
  {
    themes: ["leadership", "deadline", "teamwork"],
    situation:
      "Our team of five had three weeks to deliver a compliance feature regulators had already delayed once. Two engineers were out with burnout risk, the PM was new, and leadership kept asking for \"just one more field.\"",
    task:
      "I was the senior IC on the squad — not the manager — but someone had to set a realistic plan and protect the team from thrash while still landing the legal requirement.",
    action:
      "I split the work into \"must ship for audit\" vs \"nice for ops.\" I put both lists in a shared doc with effort sizes, then walked leadership through a 20-minute decision: ship the audit set, defer the rest, and freeze scope. I paired with our newest engineer on the riskiest path so we weren't blocked on one hero. Every morning I posted a three-line update: done / today / blockers — no fluff. When a late request came in, I didn't say no in the hallway; I said, \"Here's what drops if we add this,\" and let them choose.",
    result:
      "We passed the audit with zero findings on our piece. The deferred ops work shipped two sprints later with better UX because we weren't rushing. Two teammates later said the daily updates were the first time they'd felt \"not drowning\" on a hard deadline. I learned that leadership under pressure is often just making the trade-offs legible.",
    closer:
      "Memorable takeaway: people don't need a hero speech — they need a clear \"yes / no / not yet\" and a leader who absorbs ambiguity so the team can execute.",
  },
  {
    themes: ["customer", "service_desk", "communication"],
    situation:
      "I was on service desk when a VP's laptop refused to join our VPN an hour before she had to present to the board. Chat was already full of \"has anyone seen this?\" and she was clearly stressed — not angry, which somehow made it worse.",
    task:
      "Fix her connectivity fast, keep her dignity intact in front of her team, and leave a trail so the next person with the same issue wasn't starting from zero.",
    action:
      "I called her instead of bouncing tickets. While she talked, I pulled her device record and saw a cert renewal had failed silently overnight. I walked her through a two-click fix, stayed on the line until the board deck opened, then wrote a 5-minute runbook and a proactive message to anyone else on the same cert wave. I also opened a ticket with identity engineering about the silent failure — not just the symptom.",
    result:
      "She made the meeting. CSAT on that ticket was a 5 with a note: \"Felt like a human, not a queue.\" Over the next week we cleared 40 similar cases before users hit them. That runbook is still the first hit when someone searches \"VPN board day.\"",
    closer:
      "Service moments stick when you treat urgency as emotional, not just technical — fix the person, then fix the system.",
  },
  {
    themes: ["customer", "sales"],
    situation:
      "A mid-market account worth about $180k ARR went dark three weeks before renewal. Their champion had left the company, and the new ops lead thought our product was \"nice but not essential.\"",
    task:
      "I owned the relationship. My job was to re-earn the seat at the table without discounting out of panic — and figure out if we actually deserved the renewal.",
    action:
      "I stopped pitching. I asked for a 30-minute \"usage autopsy\" with their team, not a sales call. We pulled their last 90 days of product data together on a screen share. They were underusing the one workflow that saved their analysts ~6 hours a week. I built a two-week pilot with success criteria they wrote, not me, and paired their analyst with our CS engineer daily for five days. I also looped in our product manager with a honest note: \"If this pilot fails, we should let them go cleanly.\"",
    result:
      "They renewed for 14 months — slightly expanded, not discounted. The ops lead became a reference customer. Internally, that \"usage autopsy\" format became our default play when a champion leaves. I still remember the moment she said, \"Oh — we were paying for a tool we weren't actually using.\" That honesty saved the deal more than any slide deck.",
    closer:
      "Renewals aren't won with charm; they're won when the customer rediscovers their own ROI out loud.",
  },
  {
    themes: ["initiative", "ambiguity", "product"],
    situation:
      "Our onboarding completion sat at 41%. Everyone had opinions — \"make the tour shorter,\" \"add video,\" \"blame sales for bad-fit accounts\" — but nobody owned a hypothesis. It wasn't on the roadmap.",
    task:
      "I wasn't the PM, but I cared. I decided to treat it like a product problem I could time-box without derailing sprint commitments.",
    action:
      "I spent two evenings watching 12 session replays and tagging where people bounced. Pattern: users stalled on a permissions screen that looked like an error. I wrote a one-page brief with a screenshot, a proposed copy change, and a success metric. I asked the PM for half a sprint of design + eng if the change was \"obvious,\" not a redesign. We A/B tested a clearer empty state and a \"skip and invite later\" path.",
    result:
      "Activation moved from 41% to 58% in three weeks. The PM put a fuller onboarding rethink on the next quarter plan using the same replay method. My manager brought it up in my review as an example of initiative with restraint — I didn't boil the ocean; I proved a slice.",
    closer:
      "The story interviewers remember: I didn't wait for a ticket. I brought evidence, a small bet, and a number.",
  },
  {
    themes: ["priority", "deadline", "ambiguity"],
    situation:
      "In one planning week I had three \"P0\" asks: a security patch, a sales demo environment, and a partner integration that legal wanted yesterday. My calendar looked like a lost cause.",
    task:
      "I had to sequence the work so nothing truly critical burned down — and so stakeholders felt heard even when I said not yet.",
    action:
      "I listed each ask with: blast radius if delayed, reversibility, and who felt the pain. Security patch won (irreversible risk). Demo env was next because revenue depended on a live meeting that week. Partner work got a written partial: schema agreed, code the following week. I sent the same priority table to all three stakeholders so nobody thought they were being quietly deprioritized. Then I blocked focus time and turned off Slack for two deep-work blocks a day.",
    result:
      "Patch shipped in 36 hours, demo env was live the morning of the meeting, partner integration landed four days later without drama. Sales closed the deal. The priority table got reused by two other teams. People stopped pinging me \"just checking\" because the plan was public.",
    closer:
      "Priority isn't saying yes faster — it's making the \"no for now\" visible and fair.",
  },
  {
    themes: ["mentor", "leadership", "feedback"],
    situation:
      "A junior engineer on my team kept missing PR feedback cycles. Reviews piled up, and senior folks started quietly avoiding assigning them critical paths. I could feel the isolation forming.",
    task:
      "As their mentor (not manager), I needed to raise the bar without crushing confidence — and change how the team onboarded feedback.",
    action:
      "I asked them to lunch offsite, not a 1:1 in a glass room. I opened with what I respected: their debugging instincts. Then I showed two of their PRs side-by-side with a senior's — not to shame, but to make the gap concrete: tests, edge cases, commit messages. We agreed on a four-week pact: I would review their work within 24 hours if they posted a short design note first. I also coached two seniors to leave one \"teaching comment\" per review instead of only nits.",
    result:
      "Within a month their PR cycle time dropped by half and they owned a small feature end-to-end. Six months later they were reviewing others. The design-note habit spread; our review thrash went down. They still send me \"remember that lunch?\" messages when they mentor someone else.",
    closer:
      "Mentorship that sticks is specific, private first, and systemic second — fix the person and the process.",
  },
  {
    themes: ["change", "ambiguity", "communication"],
    situation:
      "Our company announced a reorg that merged two product lines overnight. Half my stakeholders changed, our OKRs were rewritten mid-quarter, and the roadmap I had sold two weeks earlier was obsolete.",
    task:
      "Keep delivery moving while the org chart was wet paint — and translate chaos into something the team could act on.",
    action:
      "I ran a 30-minute \"what still true / what's unknown\" workshop. We froze only the in-flight work that customers already expected, and parked speculative projects. I rebuilt our stakeholder map on a wiki page with faces and decision rights. Every Friday I sent a short \"reorg reality\" note: decisions made, open questions, and what we were shipping anyway. When rumors flew, I refused to speculate; I said \"I'll confirm and write it down.\"",
    result:
      "We hit two of three quarter goals despite the reorg. Attrition on the team was zero that quarter. Leadership later reused the \"still true / unknown\" format company-wide. The lesson I carry: in change, people don't need certainty — they need a cadence of honesty.",
    closer:
      "Memorable line: I can't control the reorg, but I can control whether my team hears silence or a clear next step.",
  },
  {
    themes: ["ethics", "conflict"],
    situation:
      "A stakeholder asked me to \"soft-launch\" a feature to a subset of customers before legal finished the privacy review. The feature touched personal data. Sales was excited; the timeline was aggressive.",
    task:
      "Protect users and the company without becoming the person who only says no — and keep the relationship with sales intact.",
    action:
      "I paused the launch path and scheduled a same-day call with legal, security, and the sales lead. I framed it as risk, not morality theater: what data, what consent, what happens if a journalist asks. I proposed a path that still helped sales — a synthetic demo environment with realistic but fake data — so the deal cycle didn't die. I documented the decision and the temporary workaround so nobody had to re-argue it under pressure later.",
    result:
      "We didn't soft-launch. The real launch happened two weeks later with approval. Sales still closed using the demo environment. Legal thanked us in the post-launch review for not creating a cleanup project. I learned you can be both commercially helpful and non-negotiable on user trust.",
    closer:
      "The story ends with: I gave them a yes to something better than a no to the wrong thing.",
  },
  {
    themes: ["strength", "tell_me"],
    situation:
      "When people ask what I'm known for, I think about a quarter when our team kept missing \"almost done\" estimates — not because we were lazy, but because hidden complexity kept surfacing late.",
    task:
      "I wanted to make delivery predictable without turning into a process cop.",
    action:
      "I introduced a lightweight \"pre-mortem in 15 minutes\" before any work larger than a few days: what could make this late, what's unknown, what's the thinnest vertical slice. I modeled it on my own tickets first so it didn't feel like surveillance. I also started publishing a weekly confidence percentage on commitments — not green/yellow/red theater, but \"I'm 70% sure this lands Friday.\"",
    result:
      "Our hit rate on committed dates went from roughly half to about 85% over two quarters. PMs said planning got calmer. My strength isn't raw coding speed — it's making uncertainty discussable before it becomes a surprise. That's the muscle I bring to any team.",
    closer:
      "If you remember one thing about me: I turn \"we'll see\" into a plan people can trust.",
  },
  {
    themes: ["weakness", "feedback"],
    situation:
      "For a long time my weakness was over-owning. If something looked shaky, I grabbed the keyboard. Teammates got fewer reps; I got more tickets and quieter evenings.",
    task:
      "I had to relearn that helping the team scale meant leaving some problems on the table longer than felt comfortable.",
    action:
      "I told my manager out loud: \"I'm going to be worse at heroics on purpose.\" I set a rule — if a problem would take me two hours and a teammate six, I still coached first unless production was on fire. I blocked \"office hours\" instead of drive-by takeovers. In code review I started asking \"what would you try?\" before pasting my solution.",
    result:
      "Two people on the team leveled up into owning areas I used to hoard. My personal ticket count dropped; the team's throughput rose. The weakness isn't gone — I still feel the itch — but I catch it. Interview version: I'm still learning the difference between being useful and being load-bearing.",
    closer:
      "The memorable fix: I measure success by how rarely the team needs me in the critical path.",
  },
  {
    themes: ["why_company", "tell_me"],
    situation:
      "I don't pick companies from a logo wall. Last time I changed roles, I was looking for a place where the product pain matched skills I already had scars in — and where the team still had unsolved problems I could touch in year one.",
    task:
      "Convince myself — and later the interview panel — that this wasn't a rebound application, but a deliberate fit.",
    action:
      "I used the product for a week like a real customer and wrote down three friction points. I read engineering blog posts and a recent launch postmortem if one existed. In conversations I asked about the unsolved problems, not the perks. I mapped two stories from my background to those problems so the \"why us\" was really \"why this work.\"",
    result:
      "That preparation made the interviews two-way. I could say, \"Your onboarding drop-off looks like a problem I've already measured,\" instead of \"I love your mission.\" Whether or not I got the offer, I knew I was aiming at work I'd still care about on a hard Wednesday in February.",
    closer:
      "Why this company, for me, is always: a specific problem I can point to, a skill I bring, and a reason the timing is now.",
  },
  {
    themes: ["data", "product", "initiative"],
    situation:
      "Marketing claimed a new landing page was \"killing it.\" Product wasn't sure. Leadership wanted a bigger ad spend. Nobody had connected signup quality to the page variant — only top-of-funnel clicks.",
    task:
      "I owned analytics for growth. My job was to answer whether more spend would buy real customers or just louder vanity metrics.",
    action:
      "I defined a clean activation event (first value moment, not just email verify). I joined ad spend data to cohort retention at day 7 and day 30. The \"winning\" page had higher signups but 22% worse day-7 retention — it was attracting tire-kickers. I built a simple dashboard and walked marketing through it without jargon. We rewrote the page to set expectations earlier and shifted budget to the slower page with better retention.",
    result:
      "Cost per activated user dropped 18% the following month. Marketing became an ally, not a debate partner. The activation definition stuck as the north star for three more experiments. Data work that matters is storytelling with receipts.",
    closer:
      "The punchline people remember: the page that looked best was quietly buying us the wrong users.",
  },
  {
    themes: ["technical", "debug"],
    situation:
      "On a Tuesday morning our p95 API latency jumped from 120ms to almost 2 seconds. Error rates were fine — which made it scarier. Customers felt \"slowness,\" not outages, so classic alerts lagged.",
    task:
      "I was on-call. Find the bottleneck, stop the bleeding, and leave the system easier to diagnose next time.",
    action:
      "I checked the obvious: deploys, dependency status, DB CPU. CPU was fine; lock waits were not. A new report query had landed without a covering index and was holding row locks during peak traffic. I killed the heavy query path with a feature flag, added the index in a forward-only migration after verifying on a production snapshot, and added a latency alert on that endpoint alone — not just global 5xx. I wrote a short incident note with the exact EXPLAIN plan so the next person wouldn't start from superstition.",
    result:
      "Latency returned to baseline in under an hour. The report still ran — just off the hot path via async export. We added a PR checklist item: \"Does this query run in the request path at peak?\" That incident is still the example I use when people ask how I debug under pressure.",
    closer:
      "Debugging story, short version: symptoms lied (no errors), locks told the truth, and I fixed the path and the alarm.",
  },
  {
    themes: ["system_design", "technical"],
    situation:
      "We needed a notification system that could fan out to email, push, and in-app — starting small, but with a clear path to millions of events a day without rewriting everything.",
    task:
      "Design something a small team could ship in weeks, without painting us into a corner on reliability or multi-channel delivery.",
    action:
      "I started with the user journeys, not the tech: password reset must be fast and reliable; marketing digests can be eventually consistent. That split drove the design. Core: an immutable event log, a worker pool per channel, and idempotency keys so retries don't double-send. First version: one Postgres table + a queue, not Kafka day one. I drew failure modes on the board — poison messages, provider outages, user preference changes mid-flight — and decided what was automated vs. page-worthy. We agreed on SLOs before code: password reset p99 under 30s end-to-end.",
    result:
      "We shipped the MVP in three weeks. It handled a 10x traffic spike during a launch with only delayed marketing mail, not security mail. A year later we swapped the queue implementation without changing producers — because the contract was the event schema, not the broker. Design principle I still preach: separate \"must never fail the same way\" paths from \"best effort\" paths early.",
    closer:
      "If you remember the architecture: boring storage, strict idempotency, and different guarantees for different notification types.",
  },
  {
    themes: ["technical", "deadline"],
    situation:
      "Sales promised a custom export format to a pilot customer in ten days. Engineering hadn't been in that meeting. The format was almost, but not quite, what our API already returned.",
    task:
      "Deliver something honest that wouldn't become a permanent snowflake fork — under a calendar that wasn't my idea.",
    action:
      "I met the customer success lead and the customer the next morning. I showed them our existing export and highlighted the three fields they truly needed differently. We agreed on a thin transformation layer with a customer-specific config, not a fork of the pipeline. I time-boxed a spike to one day, then implemented with tests around the weird edge cases they cared about (null currencies, multi-entity accounts). I scheduled a debrief with sales about including eng earlier next time — privately, after we delivered.",
    result:
      "Pilot got their export on day nine. Two other customers later reused the same config pattern. We avoided a one-off codebase. Sales still jokes that I \"taxed\" them one process change for every emergency — and they pay it.",
    closer:
      "Technical delivery under a sales promise: shrink the real requirement, isolate the special case, then fix the process that created the fire drill.",
  },
  {
    themes: ["service_desk", "teamwork", "deadline"],
    situation:
      "During a company-wide laptop refresh, 200 people needed admin rights, disk wipes, and SSO re-enrollment in one week. The queue looked like a storm front. Two technicians were new.",
    task:
      "As a senior on the desk, keep throughput high without burning the new folks out or creating security shortcuts.",
    action:
      "I built a station model: wipe bay, enroll bay, verify bay — instead of each tech doing the whole journey alone. I wrote a one-page checklist with photos for the new techs and ran a 20-minute dry run the night before. I took the angry VIP walk-ups so juniors could build speed on standard cases. When we hit a firmware bug on one model, I escalated with a single clear thread and a workaround, rather than 40 duplicate tickets.",
    result:
      "We finished the refresh with half a day to spare and zero security exceptions. New techs said the stations made them feel competent by day two. The checklist became the template for the next hardware event. Chaos turned into a production line with a human face.",
    closer:
      "High-volume support isn't heroics — it's choreography, checklists, and protecting focus for the people still learning.",
  },
  {
    themes: ["teamwork", "communication"],
    situation:
      "Our frontend and data teams were shipping past each other. Dashboards broke twice in one month because schema changes landed without a heads-up. Trust was thin; standups were polite and useless.",
    task:
      "I sat on the frontend side but cared about the relationship. Someone had to create a shared contract people would actually follow.",
    action:
      "I proposed a lightweight \"schema office hours\" twice a week and a versioned contract file in a shared repo — boring on purpose. I volunteered to write the first three change notes myself so data engineering could see the format. When a break happened again, we blamelessly walked the timeline and added a CI check that failed if the contract drifted. I celebrated the first clean week publicly so the new habit felt rewarding, not bureaucratic.",
    result:
      "Dashboard breaks from schema surprises dropped to near zero for the next two quarters. The office hours shrank to once a week because they worked. Cross-team slack got shorter and kinder. Collaboration improved when the interface between teams became explicit.",
    closer:
      "Teamwork story people remember: we stopped relying on memory and goodwill, and put the promise in a file with a test.",
  },
  {
    themes: ["influence", "leadership", "communication"],
    situation:
      "I was accountable for a company-wide launch date, but I didn't own half the dependencies: legal had to approve copy, marketing owned the email blast, and a vendor controlled the payment SDK we embedded. My name was still on the OKR.",
    task:
      "Hit the public launch date without having direct authority over those teams — pure influence, full accountability.",
    action:
      "I built a single shared countdown board: every dependency, owner, and \"what fails if this slips\" note. I stopped status meetings and replaced them with 12-minute risk huddles twice a week where only blockers spoke. When legal slipped two days, I didn't escalate with panic — I brought them a redlined draft and sat in their office for an hour so review time collapsed. With the vendor, I negotiated a staging environment we controlled so their delay wouldn't block our dry run. I sent a Friday note to leadership that was brutally clear: green items, yellow items, and the one decision only they could make.",
    result:
      "We launched on the announced date. Two dependencies moved because the risk was visible, not because I outranked anyone. Post-launch incident count was zero for the first 48 hours. My manager's review line was: \"You owned the outcome without owning the org chart.\" That sentence is the skill this question is testing.",
    closer:
      "Owning what you don't control means making other people's work impossible to ignore — shared boards, collapsed review loops, and honest risk notes — not heroic solo coding.",
  },
  {
    themes: ["generic", "initiative"],
    situation:
      "Mid-project, our main integration partner changed their API deprecation timeline with six weeks' notice. Our roadmap assumed nine months. Panic was the default mood in the channel.",
    task:
      "I owned the integration surface. I needed a plan that protected customers, told leadership the truth, and gave engineering a sequence they could execute without hero weekends every week.",
    action:
      "I inventoried every call site in a spreadsheet with volume and criticality. I built a compatibility shim for the highest-traffic endpoints first, with feature flags so we could roll forward in slices. I set a public countdown doc: what dies when, what's done, what's at risk. I negotiated with the partner for a two-week extension on one endpoint that truly blocked us — armed with traffic numbers, not vibes.",
    result:
      "We migrated 100% before the hard cutoff. One minor feature stayed on a temporary shim for an extra sprint, deliberately. No customer-facing outage. Leadership used our countdown doc as a template for the next vendor change. Pressure became a project instead of a vague dread.",
    closer:
      "When the ground moves, inventory → shim → slice → communicate. That's the pattern I reuse.",
  },
];

function detectThemes(question: string, mode: InterviewMode): StoryTheme[] {
  const q = question.toLowerCase();
  const themes: StoryTheme[] = [];

  // Use stems (no trailing \b on prefixes) so "failure", "mentored", "leadership" all match.
  const rules: [RegExp, StoryTheme][] = [
    // Avoid "conflicting priorities" (priority theme) — match interpersonal conflict
    [/\b(conflicts?\b|conflicted|disagre\w*|pushback|difficult (person|colleague|stakeholder)|argument with|tension with)/i, "conflict"],
    [/\b(fail\w*|mistake|regret|went poorly|lesson learned|post-?mortem)/i, "failure"],
    [/\b(led|leads|leader\w*|leading|leadership|manag\w+|drove)/i, "leadership"],
    [/\b(influence|did not (fully )?control|didn't (fully )?control|without authority|no direct authority|accountab\w*|owned an outcome|own(ed|ing)? (an |the )?outcome)/i, "influence"],
    [/\b(owned|owning)\b/i, "leadership"],
    [/\b(deadline|time pressure|tight timeline|under pressure|urgent|last minute)/i, "deadline"],
    [/\b(customer|client|users?|csat|support ticket|escalat\w*)/i, "customer"],
    [/\b(service desk|help desk|it support|ticket queue|tier\s*[12])/i, "service_desk"],
    [/\b(teams?\b|teamwork|teammate|collaborat\w*|cross-functional|worked with|partnered)/i, "teamwork"],
    [/\b(initiative|proactive|without being asked|saw a problem|side project)/i, "initiative"],
    [/\b(feedback|criticism|performance review|hard conversation)/i, "feedback"],
    [/\b(ambigu\w*|unclear|uncertain|vague|not sure what|figure out)/i, "ambiguity"],
    [/\b(reorg|pivot|transition|new process|major change|organiz\w+ change)/i, "change"],
    [/\b(ethic\w*|integrity|privacy|compliance|right thing|pressure to cut)/i, "ethics"],
    [/\b(strength|proud of|known for|best at|excel at)/i, "strength"],
    [/\b(weakness|improv(e|ing)|struggle|working on)\b/i, "weakness"],
    [/\b(why (this|our|the) (company|role|team)|why us|why do you want)/i, "why_company"],
    [/\b(tell me about yourself|walk me through your|introduce yourself)/i, "tell_me"],
    [/\b(priorit\w*|too much on|juggle|multiple projects|trade-?offs?)/i, "priority"],
    [/\b(mentor\w*|coach\w*|help(ed)? (someone|a junior|teammate) grow|develop others)/i, "mentor"],
    [/\b(communicat\w*|present\w*|stakeholder|explain|document\w*)/i, "communication"],
    [/\b(data|metric|analy\w*|a\/b|experiment|dashboard|\bsql\b)/i, "data"],
    [/\b(debug\w*|outage|incident|latency|bug|on-?call|root cause)/i, "debug"],
    [/\b(architect\w*|system design|distributed|microservice|at scale|design a \w+)/i, "system_design"],
    [/\b(sales|quota|pipeline|renewal|deals?\b|closed a deal|arr\b|revenue)/i, "sales"],
    [/\b(product|roadmap|onboarding|activation|feature priorit)/i, "product"],
    [/\b(technical|implement\w*|algorithm|database|cache|deploy\w*|codebase)/i, "technical"],
  ];

  for (const [re, theme] of rules) {
    if (re.test(q)) themes.push(theme);
  }

  if (mode === "technical" || mode === "mixed") {
    if (!themes.includes("technical")) themes.push("technical");
    if (/\b(design|architect|scale|system)\b/.test(q) && !themes.includes("system_design")) {
      themes.push("system_design");
    }
  }

  if (themes.length === 0) themes.push("generic");
  return themes;
}

function pickStory(question: string, mode: InterviewMode): StarStory {
  const themes = detectThemes(question, mode);
  const themeSet = new Set(themes);
  const primary = themes[0];

  // Stable hash so the same question maps to the same story
  let hash = 0;
  for (let i = 0; i < question.length; i++) hash = (hash + question.charCodeAt(i) * (i + 1)) % 997;

  const ranked = STAR_STORIES.map((story, idx) => {
    let score = 0;
    for (const t of story.themes) {
      if (themeSet.has(t)) score += 4;
    }
    // Strong boost when the story's first theme is the question's primary theme
    if (story.themes[0] === primary) score += 6;
    // Prefer tighter theme lists (more specific stories)
    if (score > 0) score += Math.max(0, 3 - story.themes.length) * 0.3;
    // Tiny hash jitter only among true ties
    score += ((hash + idx) % 5) * 0.01;
    return { story, score };
  }).sort((a, b) => b.score - a.score);

  const bestScore = ranked[0]?.score ?? 0;
  if (bestScore < 4) {
    const generics = STAR_STORIES.filter(
      (s) => s.themes.includes("generic") || s.themes.includes("initiative")
    );
    return generics[hash % generics.length] || STAR_STORIES[hash % STAR_STORIES.length];
  }

  const top = ranked.filter((r) => r.score >= bestScore - 0.2);
  return top[hash % top.length].story;
}

function formatStarStory(story: StarStory): string {
  return (
    `Situation: ${story.situation}\n\n` +
    `Task: ${story.task}\n\n` +
    `Action: ${story.action}\n\n` +
    `Result: ${story.result}\n\n` +
    `${story.closer}`
  );
}

/**
 * Build a personable, memorable STAR sample answer matched to the question.
 * Offline-safe; theme detection keeps stories relevant without calling an LLM.
 */
function sampleBetterAnswer(question: string, mode: InterviewMode): string {
  const story = pickStory(question, mode);

  // Light personalization: if question names a domain, weave a bridging opener
  const qShort = question.replace(/\s+/g, " ").trim();
  const opener =
    qShort.length > 12
      ? `Here's how I'd answer a question like this in a real interview — a specific story, not a template:\n\n`
      : "";

  return opener + formatStarStory(story);
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
  mode: InterviewMode | string
): AIFeedback {
  const m = (mode === "jd" || mode === "system-design" ? "technical" : mode) as InterviewMode;
  const clarity = scoreClarity(answer);
  const relevance = scoreRelevance(answer, question);
  const structure =
    m === "technical" || m === "mixed"
      ? scoreTechnical(answer, m)
      : scoreSTAR(answer);
  const technicalAccuracy = scoreTechnical(answer, m);
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
    improvements: buildImprovements(scores, answer, m),
    sampleBetterAnswer: sampleBetterAnswer(question, m),
    keyPhrases: keyPhrases(m),
    followUpQuestion: followUp(scores, m),
    summary:
      overall >= 8
        ? "Excellent response — polished, relevant, and interview-ready."
        : overall >= 6
          ? "Solid foundation with clear room to sharpen structure and specificity."
          : "Needs more structure and concrete detail to compete at top companies.",
  };
}

export interface LocalResumeResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  experienceHighlights: string[];
  talkingPoints: string[];
  sampleAnswers: { prompt: string; answer: string }[];
  suggestedRoles: string[];
  suggestedQuestions: string[];
  atsScore: number;
  atsTips: string[];
}

/** Pull short “experience-like” lines from raw resume text for highlights. */
function extractHighlights(text: string): string[] {
  const lines = text
    .split(/[\n•·|]+/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length >= 28 && l.length <= 160);

  const scored = lines
    .filter((l) =>
      /\d|%|increased|decreased|led|built|launched|improved|managed|designed|reduced|grew|shipped|owned/i.test(
        l
      )
    )
    .slice(0, 6);

  if (scored.length >= 2) return scored.slice(0, 5);

  return lines.slice(0, 4);
}

export function generateLocalResumeAnalysis(
  text: string,
  fileName: string
): LocalResumeResult {
  const lower = text.toLowerCase();
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const talkingPoints: string[] = [];
  const suggestedRoles: string[] = [];
  const sampleAnswers: { prompt: string; answer: string }[] = [];

  if (/react|typescript|javascript|node|python|java|golang|rust|kotlin|swift/.test(lower)) {
    strengths.push(
      "Hands-on software engineering skills across modern stacks."
    );
    talkingPoints.push(
      "Prepare a 60-second story about a system you designed or shipped end-to-end."
    );
    suggestedRoles.push("Software Engineer", "Full Stack Engineer");
    sampleAnswers.push({
      prompt: "Tell me about a technical project you're proud of.",
      answer:
        "Situation: We needed a reliable feature under tight latency constraints. Task: I owned design and delivery of the core path. Action: I defined the API contract, added caching where safe, and instrumented metrics. Result: We shipped on time and improved p95 latency by a measurable margin — I can walk through the trade-offs if useful.",
    });
  }
  if (/product|roadmap|stakeholder|agile|scrum|priorit|backlog/.test(lower)) {
    strengths.push("Product sense and stakeholder alignment experience.");
    talkingPoints.push(
      "Use a RICE/MoSCoW example when discussing prioritization."
    );
    suggestedRoles.push("Product Manager");
    sampleAnswers.push({
      prompt: "How do you prioritize when everything is urgent?",
      answer:
        "I clarify the outcome metric, estimate impact vs effort, and force-rank with stakeholders. In one cycle I deferred a popular request that didn't move retention, freeing capacity for an onboarding fix that lifted activation — I document the decision so the team stays aligned.",
    });
  }
  if (/design|figma|ux|user research|wireframe|prototype|usability/.test(lower)) {
    strengths.push("Design craft and user-centered process.");
    talkingPoints.push(
      "Walk through one case study: problem → research → solution → impact."
    );
    suggestedRoles.push("UX Designer", "Product Designer");
  }
  if (
    /sql|tableau|power bi|analytics|machine learning|model|experiment|a\/b/.test(
      lower
    )
  ) {
    strengths.push("Analytical and data-driven decision making.");
    talkingPoints.push(
      "Quantify one insight that changed a business decision."
    );
    suggestedRoles.push("Data Analyst", "Data Scientist");
  }
  if (/sales|pipeline|quota|crm|revenue|customer success|account/.test(lower)) {
    strengths.push("Revenue ownership and customer-facing impact.");
    talkingPoints.push(
      "Prepare a win story and a loss-learn story with clear metrics."
    );
    suggestedRoles.push("Account Executive", "Customer Success Manager");
  }
  if (/lead|manage|mentor|team of|hired|performance review|1:1|one-on-one/.test(lower)) {
    strengths.push(
      "Leadership signals — mentoring, ownership, and team outcomes."
    );
    talkingPoints.push(
      "Have a leadership story ready: hard feedback, hiring, or delivery under pressure."
    );
  }

  // Weaknesses / gaps (constructive, interview-prep oriented)
  if (!/\d+%|\d+x|\$\d|increased|reduced|grew by|saved/.test(lower)) {
    weaknesses.push(
      "Impact is under-quantified — add metrics (% lift, $ impact, time saved) to key bullets."
    );
  }
  if (!/led|owned|drove|spearheaded|mentored/.test(lower)) {
    weaknesses.push(
      "Ownership language is light — rewrite bullets to emphasize what *you* decided and delivered."
    );
  }
  if (text.length < 800) {
    weaknesses.push(
      "Resume text is thin after extraction — flesh out 2–3 signature projects with STAR-ready detail."
    );
  }
  if (
    !/aws|gcp|azure|kubernetes|docker|ci\/cd|security|accessibility|a11y|privacy|gdpr/.test(
      lower
    ) &&
    /engineer|developer|software/.test(lower)
  ) {
    weaknesses.push(
      "Operational/infra keywords are sparse — mention reliability, CI/CD, or security if accurate."
    );
  }
  if (weaknesses.length === 0) {
    weaknesses.push(
      "Tighten top-third of resume for scannability: role title match, 3 quantified wins, clear tools."
    );
  }

  if (strengths.length === 0) {
    strengths.push(
      "Diverse experience that can be tailored to multiple role narratives."
    );
    talkingPoints.push(
      "Pick 3 signature stories and map each to STAR with measurable results."
    );
    suggestedRoles.push(
      "Software Engineer",
      "Product Manager",
      "Business Analyst"
    );
  }

  if (sampleAnswers.length === 0) {
    sampleAnswers.push({
      prompt: "Tell me about yourself.",
      answer:
        "I'm a [role] focused on [domain]. Recently I [signature win with metric]. I'm excited about this role because [mission fit] and I want to bring [strength] to the team.",
    });
  }

  sampleAnswers.push({
    prompt: "What's a challenge you overcame recently?",
    answer:
      "Situation: Ambiguous requirements threatened a deadline. Task: I owned alignment and delivery. Action: I ran a short discovery spike, proposed two options with trade-offs, and shipped the MVP with monitoring. Result: We hit the date and reduced rework the following sprint.",
  });

  const suggestedQuestions = [
    "Walk me through a project on your resume end-to-end.",
    "Tell me about a time you disagreed with a stakeholder.",
    "What is your greatest technical (or professional) strength?",
    "Describe a failure and what you changed afterward.",
    "Why this role / company, and why now?",
  ];

  // ATS-style heuristic (local, transparent)
  let ats = 55;
  if (/\d+%|\d+x|\$\d|increased|reduced|improved/.test(lower)) ats += 12;
  if (/led|owned|drove|managed|built|designed|shipped/.test(lower)) ats += 10;
  if (
    /react|python|sql|java|aws|figma|salesforce|excel|typescript|node/.test(
      lower
    )
  )
    ats += 8;
  if (text.length > 1200) ats += 6;
  if (text.length < 600) ats -= 10;
  if (!/@|email|linkedin|github|portfolio/.test(lower)) {
    ats -= 4;
  }
  ats = Math.max(28, Math.min(96, Math.round(ats)));

  const atsTips: string[] = [];
  if (ats < 70)
    atsTips.push("Add 3–5 quantified bullets (%, $, time) near the top.");
  if (!/skills|technologies|tools/.test(lower))
    atsTips.push("Include a clear Skills section with role-matched keywords.");
  if (weaknesses.length)
    atsTips.push("Address the gaps listed under improvements before applying.");
  if (atsTips.length === 0)
    atsTips.push("Tailor the top third of your resume to each job description.");

  const experienceHighlights = extractHighlights(text);
  const uniq = (arr: string[]) => Array.from(new Set(arr));

  return {
    summary: `Based on "${fileName}", your background shows transferable strengths that map well to interview storytelling. Lean into quantified wins and clear ownership; use the talking points below to convert resume bullets into spoken STAR answers.`,
    strengths: uniq(strengths).slice(0, 5),
    weaknesses: uniq(weaknesses).slice(0, 5),
    experienceHighlights:
      experienceHighlights.length > 0
        ? experienceHighlights
        : [
            "Add 3–5 accomplishment bullets with action + metric so highlights can be extracted next time.",
          ],
    talkingPoints: uniq(talkingPoints).slice(0, 6),
    sampleAnswers: sampleAnswers.slice(0, 4),
    suggestedRoles: uniq(suggestedRoles).slice(0, 5),
    suggestedQuestions: uniq(suggestedQuestions).slice(0, 6),
    atsScore: ats,
    atsTips: uniq(atsTips).slice(0, 4),
  };
}

/** Generate practice questions from a job description (local heuristic). */
export function questionsFromJobDescription(
  jd: string,
  role: string
): { id: string; text: string; category: string }[] {
  const lower = jd.toLowerCase();
  const qs: { id: string; text: string; category: string }[] = [];
  const push = (id: string, text: string, category: string) =>
    qs.push({ id, text, category });

  push(
    "jd-fit",
    `Why are you a strong fit for this ${role} role based on the job description?`,
    "behavioral"
  );
  push(
    "jd-impact",
    "Describe a past result that maps most closely to the outcomes this role needs.",
    "behavioral"
  );

  if (/react|frontend|typescript|javascript|ui/.test(lower)) {
    push(
      "jd-fe",
      "How would you structure a complex React application for maintainability and performance?",
      "technical"
    );
  }
  if (/backend|api|distributed|microservices|scala|java|go|python/.test(lower)) {
    push(
      "jd-be",
      "Walk through designing a reliable API that must handle traffic spikes.",
      "system-design"
    );
  }
  if (/product|roadmap|stakeholder|priorit/.test(lower)) {
    push(
      "jd-pm",
      "How would you prioritize the first 90 days of roadmap work for this product?",
      "product"
    );
  }
  if (/data|sql|analytics|machine learning|ml|model/.test(lower)) {
    push(
      "jd-data",
      "Tell me about an analysis or model that changed a business decision.",
      "technical"
    );
  }
  if (/lead|manage|mentor|people/.test(lower)) {
    push(
      "jd-lead",
      "Describe how you've grown others while delivering under pressure.",
      "leadership"
    );
  }
  if (/customer|sales|pipeline|quota/.test(lower)) {
    push(
      "jd-sales",
      "Walk me through a complex deal or customer save from discovery to close.",
      "behavioral"
    );
  }

  push(
    "jd-challenge",
    "What would be the hardest part of this job for you, and how would you ramp?",
    "situational"
  );
  push(
    "jd-values",
    "Which requirement in the JD are you most excited about, and why?",
    "behavioral"
  );

  // Fill to ~8
  while (qs.length < 8) {
    push(
      `jd-extra-${qs.length}`,
      "Tell me about a time you collaborated across teams to ship something ambiguous.",
      "behavioral"
    );
  }

  return qs.slice(0, 10);
}
