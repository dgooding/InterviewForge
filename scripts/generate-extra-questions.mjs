import fs from "fs";

const items = [];

function add(id, text, category, difficulty, tips, extra = {}) {
  items.push({ id, text, category, difficulty, tips, ...extra });
}

const behavioral = [
  ["Describe a time you changed your mind after receiving new information.", "medium", "Show intellectual humility and how evidence updated your view."],
  ["Tell me about a time you had to deliver difficult feedback.", "hard", "Focus on care and clarity: behavior, impact, path forward."],
  ["Describe a situation where you managed ambiguity with little direction.", "hard", "Highlight sense-making: hypotheses, small experiments, communication."],
  ["Tell me about a time you advocated for someone else.", "medium", "Allyship and fairness without self-aggrandizing."],
  ["Describe a time you balanced speed and quality under pressure.", "medium", "Name the trade-off explicitly and the risk you accepted."],
  ["Tell me about a time you recovered from a public mistake.", "hard", "Ownership first; then repair and systems change."],
  ["Describe when you had to say no to a stakeholder.", "medium", "Protect constraints while offering alternatives."],
  ["Tell me about a time you built trust with a skeptical colleague.", "medium", "Consistency, small deliveries, listening."],
  ["Describe a time you adapted your communication style for your audience.", "easy", "Audience analysis is a core professional skill."],
  ["Tell me about a goal you set that required sustained effort over months.", "medium", "Grit plus systems (habits, metrics), not just motivation."],
  ["Describe a time you handled competing priorities from two managers.", "hard", "Negotiation and transparent prioritization."],
  ["Tell me about a time you learned from someone more junior than you.", "easy", "Status-free learning signals growth mindset."],
  ["Describe a conflict you resolved without authority.", "hard", "Influence without power; interests over positions."],
  ["Tell me about a time you improved a process nobody asked you to fix.", "medium", "Proactive ownership with measured impact."],
  ["Describe when you had to work with incomplete data.", "medium", "Decision under uncertainty; what you monitored after."],
  ["Tell me about a time you supported a teammate through stress or burnout.", "hard", "Psychological safety and boundaries; avoid oversharing others."],
  ["Describe a time you received recognition that belonged to the team.", "easy", "Redirect credit; culture of fairness."],
  ["Tell me about a time you challenged a popular idea.", "hard", "Courage, data, and respect; outcome matters."],
  ["Describe when you rebuilt confidence after a setback.", "medium", "Self-regulation and recovery strategies."],
  ["Tell me about a time you managed up effectively.", "medium", "Anticipating needs, concise updates, options."],
  ["Describe a time you handled an ethical gray area.", "hard", "Principles, stakeholders, and the decision you made."],
  ["Tell me about a time you turned a critic into a collaborator.", "hard", "Perspective-taking and joint problem-solving."],
  ["Describe when you had to unlearn a habit that was holding you back.", "medium", "Self-awareness and deliberate practice."],
  ["Tell me about a time you prepared thoroughly and still had to improvise.", "medium", "Flexibility without abandoning structure."],
  ["Describe a time you set boundaries at work.", "medium", "Sustainable performance, not avoidance."],
  ["Tell me about a time you celebrated someone else's success.", "easy", "Team climate and secure self-concept."],
  ["Describe when you had to motivate yourself without external recognition.", "medium", "Intrinsic motivation and personal standards."],
  ["Tell me about a time you managed a high-stakes conversation.", "hard", "Preparation, emotional regulation, clear ask."],
  ["Describe a time you used data to change a narrative.", "medium", "Story plus evidence; avoid data-dumping."],
  ["Tell me about a time you helped a team recover after a failure.", "hard", "Blameless learning energy; forward path."],
  ["Describe when you prioritized learning over short-term delivery.", "medium", "Investment thesis and how you justified it."],
  ["Tell me about a time you noticed a bias in your own decision-making.", "hard", "Metacognition; what you changed."],
  ["Describe a time you onboarded yourself into a complex domain quickly.", "medium", "Learning strategy: experts, docs, feedback loops."],
  ["Tell me about a time you had to represent your team externally.", "easy", "Clarity, confidence, and accurate representation."],
  ["Describe when you disagreed with a peer in a public forum.", "hard", "Disagree and commit; protect relationship."],
  ["Tell me about a time you improved how your team gives feedback.", "medium", "Process and psychological safety."],
  ["Describe a time you handled customer or user anger.", "medium", "De-escalate, validate, solve, follow up."],
  ["Tell me about a time you worked across cultures or time zones.", "medium", "Inclusion, async norms, assumption-checking."],
  ["Describe when you chose team integrity over personal loyalty.", "hard", "Values hierarchy; transparent reasoning."],
  ["Tell me about a time you made a decision that was unpopular but right.", "hard", "Courage, communication, results."],
  ["Describe a time you coached someone through a skill gap.", "medium", "Scaffolding, practice, feedback."],
  ["Tell me about a time you managed your energy during a crunch period.", "easy", "Recovery is part of performance."],
  ["Describe when you had to reverse a decision you championed.", "hard", "Ego strength and learning velocity."],
  ["Tell me about a time you created alignment without a formal meeting.", "medium", "Async influence and stakeholder maps."],
  ["Describe a time you handled confidential information carefully.", "medium", "Trust and professionalism."],
  ["Tell me about a time you used storytelling to persuade.", "medium", "Narrative structure plus proof points."],
  ["Describe when you had to perform under evaluation or observation.", "medium", "Performance anxiety coping and preparation."],
  ["Tell me about a time you integrated feedback you initially resisted.", "hard", "Defensiveness to curiosity pipeline."],
  ["Describe a time you helped reduce team anxiety during change.", "hard", "Change leadership and transparent communication."],
  ["Tell me about a time you set a standard that raised team quality.", "medium", "Modeling and reinforcement."],
  ["Describe when you triaged emotional and technical issues at once.", "hard", "Dual awareness; address people then problem."],
  ["Tell me about a time you built a relationship before you needed a favor.", "easy", "Relationship capital, not transactional networking."],
  ["Describe a time you simplified a complex explanation for a non-expert.", "easy", "Teach-back and analogies."],
  ["Tell me about a time you owned an outcome you did not fully control.", "hard", "Accountability with influence maps."],
  ["Describe when you stayed calm while others escalated.", "medium", "Emotional contagion and co-regulation."],
  ["Tell me about a time you improved inclusion in a meeting or process.", "medium", "Concrete behavior change, not slogans."],
  ["Describe a time you closed the loop after a commitment slipped.", "easy", "Reliability repair protocol."],
  ["Tell me about a time you used a retrospective to change behavior.", "medium", "Learning systems, not venting sessions."],
  ["Describe when you chose depth over breadth of work.", "medium", "Strategic focus."],
  ["Tell me about a time you mentored across a difference in style or background.", "medium", "Perspective-taking and tailored coaching."],
];
behavioral.forEach((row, i) => {
  add(`pb${String(i + 1).padStart(3, "0")}`, row[0], "behavioral", row[1], row[2], { mode: "behavioral" });
});

const situational = [
  ["A peer takes credit for your work in a meeting. What do you do?", "medium", "Address privately first; focus on facts and future credit norms."],
  ["Your manager asks you to ship something you believe is unsafe. How do you respond?", "hard", "Escalate with risk framing and alternatives; document."],
  ["Two stakeholders give you opposite priorities. How do you decide?", "medium", "Clarify success metrics, escalate trade-offs, communicate decision."],
  ["A teammate is missing deadlines and seems overwhelmed. What's your approach?", "medium", "Curiosity before judgment; support plus accountability."],
  ["You discover a bug in production that you introduced. Walk me through your first hour.", "easy", "Stabilize, communicate, fix, prevent."],
  ["A customer threatens to churn over a delay you didn't cause. How do you handle it?", "hard", "Own the relationship; options, empathy, plan."],
  ["You're asked to estimate a project with huge uncertainty. What do you say?", "medium", "Ranges, assumptions, risks, re-estimate triggers."],
  ["A meeting is going off the rails. How do you intervene?", "easy", "Facilitation: goal, parking lot, next steps."],
  ["You disagree with the technical direction but the team has decided. What next?", "medium", "Disagree and commit; earn right to revisit with data."],
  ["You notice exclusionary language in a code review or doc. What do you do?", "medium", "Direct, kind correction; model inclusive norms."],
  ["Leadership wants a hero metric that you think is gameable. How do you respond?", "hard", "Second-order effects; propose balanced metrics."],
  ["You're the only one who knows a critical system and you're going on PTO. Plan?", "easy", "Documentation, buddy, runbooks, risk register."],
  ["A recruiter asks you to badmouth a former employer. How do you answer?", "easy", "Professional boundaries; lessons without blame."],
  ["Your idea fails after launch. How do you present results to leadership?", "medium", "Outcome honesty, learning, next experiment."],
  ["Someone on your team is quietly underperforming. Day-one plan?", "hard", "Private conversation, clarity, support, timeline."],
  ["You're given an impossible deadline. What do you do in the first 24 hours?", "medium", "Scope negotiation, risk, phased delivery."],
  ["A junior asks you a question you don't know. How do you handle it?", "easy", "Model learning: look it up together, no bluffing."],
  ["You overhear gossip that could harm a teammate. Response?", "medium", "Don't amplify; redirect to constructive channels if needed."],
  ["Security reports a vulnerability in your feature. Prioritization approach?", "medium", "Severity, exploitability, user impact, fix path."],
  ["Two team members refuse to work together. Your move?", "hard", "Mediate interests; set behavioral expectations."],
  ["You're asked to present without enough prep time. Strategy?", "easy", "Structure over polish: problem, options, ask."],
  ["A stakeholder rewrites your requirements mid-sprint. How do you protect delivery?", "medium", "Change control, impact analysis, renegotiate scope."],
  ["You suspect burnout in yourself. What do you do?", "medium", "Self-awareness, support systems, sustainable plan."],
  ["An AI tool produces a confident wrong answer in your work. How do you catch it?", "medium", "Verification habits and human judgment."],
  ["You're the new person and something feels off culturally. How do you investigate?", "medium", "Observe, ask open questions, avoid early judgment."],
  ["A demo fails live. Recovery script?", "easy", "Acknowledge, diagnose, fallback, follow-up."],
  ["You're offered a shortcut that violates policy slightly. Decision framework?", "hard", "Ethics over expedience; escalate if needed."],
  ["Your team is celebrating but you see a risk. How do you raise it?", "medium", "Timing and framing: protect success by addressing risk."],
  ["A user reports accessibility barriers. How do you respond?", "medium", "Urgency, inclusion, concrete remediation."],
  ["You must choose who gets limited resources. Criteria?", "hard", "Transparent criteria, fairness, impact."],
  ["A peer is consistently late to meetings. Address it how?", "easy", "Private, specific, impact, ask for commitment."],
  ["You're asked to work a weekend again. Boundary strategy?", "medium", "Sustainable yes or no with trade-offs."],
  ["A project is green on status but red in reality. What do you report?", "hard", "Truth over comfort; early warning is leadership."],
  ["Someone takes a joke too far in standup. What do you do?", "medium", "Interrupt harm, restate norms, follow up."],
  ["You inherit messy code before a deadline. Approach?", "medium", "Stabilize, smallest safe changes, plan cleanup."],
  ["A mentor gives advice that conflicts with your values. Response?", "medium", "Integrate selectively; own your principles."],
  ["You're evaluated on a metric you disagree with. How do you still succeed?", "hard", "Deliver on shared goals while influencing metrics."],
  ["A stakeholder wants daily updates that waste time. Redesign the cadence?", "easy", "Propose async update format with value."],
  ["You find a critical dependency on one person. Risk plan?", "medium", "Bus factor: docs, pairing, cross-training."],
  ["During an interview loop you realize the role is different than expected. What do you do?", "medium", "Clarify role, needs, and mutual fit honestly."],
];
situational.forEach((row, i) => {
  add(`ps${String(i + 1).padStart(3, "0")}`, row[0], "situational", row[1], row[2], { mode: "behavioral" });
});

const leadership = [
  ["How do you build psychological safety on a team?", "hard", "Name concrete behaviors: blameless learning, turn-taking, inclusion."],
  ["Describe your philosophy on performance management.", "hard", "Clarity, fairness, growth, documentation."],
  ["How do you decide what not to do as a leader?", "medium", "Strategy is subtraction; criteria for no."],
  ["Tell me how you develop high performers vs struggling performers.", "hard", "Differentiation without favoritism."],
  ["How do you handle a top performer with poor teamwork?", "hard", "Values enforcement; skills and culture both matter."],
  ["Describe how you run an effective 1:1.", "easy", "Their agenda, coaching, career, blockers."],
  ["How do you communicate bad news to a team?", "medium", "Timely, honest, with agency and next steps."],
  ["What's your approach to hiring for potential vs experience?", "medium", "Role needs, risk, onboarding plan."],
  ["How do you prevent burnout on your team during peak seasons?", "hard", "Capacity planning, recovery, priorities."],
  ["Describe how you create a culture of continuous feedback.", "medium", "Rituals, modeling, safety."],
  ["How do you align a team around a vague company strategy?", "hard", "Translate strategy into local goals and narratives."],
  ["Tell me about leading through a reorg.", "hard", "Empathy, clarity, stability of mission."],
  ["How do you measure team health beyond output?", "medium", "Engagement, quality, learning, attrition signals."],
  ["Describe your approach to conflict between two strong ICs.", "hard", "Mediate interests; set collaboration norms."],
  ["How do you sponsor someone who isn't in the room?", "medium", "Visibility and opportunity, not just praise."],
  ["What's your framework for saying no to executives?", "hard", "Options, risk, data, recommendation."],
  ["How do you onboard a new manager under you?", "medium", "Role clarity, trust ladder, early wins."],
  ["Describe how you handle a failed hire.", "hard", "Own the process; fair outcome; system fix."],
  ["How do you balance autonomy and alignment?", "medium", "Guardrails, principles, inspect outcomes."],
  ["Tell me how you keep remote or hybrid teams cohesive.", "medium", "Intentional rituals, async docs, inclusion."],
  ["How do you set goals that stretch without breaking people?", "medium", "Challenge plus support; mid-course correction."],
  ["Describe your decision rights model on a team.", "easy", "Clear owners and escalation paths."],
  ["How do you handle credit and blame as a leader?", "medium", "Credit out, responsibility in, with honesty."],
  ["What's your approach to technical debt as a manager?", "medium", "Portfolio risk, capacity allocation."],
  ["How do you coach someone who is more expert than you technically?", "hard", "Ask powerful questions; remove blockers; career growth."],
  ["Describe leading a team through an incident.", "hard", "Calm command, roles, communication, learning."],
  ["How do you ensure diverse perspectives influence decisions?", "medium", "Process design, not just intent."],
  ["Tell me how you plan succession and knowledge transfer.", "medium", "Bus factor and growth paths."],
  ["How do you handle under-communication from your own manager?", "medium", "Manage up with structured asks."],
  ["Describe building trust after you make a leadership mistake.", "hard", "Apology, repair, changed behavior."],
  ["How do you prioritize people development against delivery pressure?", "hard", "Sustainable capacity is a delivery strategy."],
  ["What's your philosophy on meetings?", "easy", "Purpose, agenda, outcomes, or cancel."],
  ["How do you evaluate whether a process is helping or hurting?", "medium", "Friction audit and feedback."],
  ["Describe how you handle politics without playing dirty.", "hard", "Transparency, coalitions around shared goals."],
  ["How do you support someone returning from leave?", "medium", "Re-entry plan, reduced load, dignity."],
  ["Tell me about creating a vision people actually remember.", "medium", "Simple story, repeated, tied to daily work."],
  ["How do you decide when to step in vs let the team struggle productively?", "hard", "Zone of proximal development for teams."],
  ["What's your approach to performance calibration fairness?", "hard", "Rubrics, bias checks, evidence."],
  ["How do you keep high standards without fear culture?", "medium", "High bar plus high support."],
  ["Describe leading without formal authority across orgs.", "hard", "Influence map, shared metrics, trust."],
];
leadership.forEach((row, i) => {
  add(`pl${String(i + 1).padStart(3, "0")}`, row[0], "leadership", row[1], row[2], {
    mode: "behavioral",
    roles: ["engineering-manager", "project-manager", "product-manager", "all"],
  });
});

const technical = [
  ["Explain a complex system you understand well to a non-engineer.", "medium", "Layered explanation; check understanding."],
  ["How do you approach debugging a problem you've never seen?", "easy", "Reproduce, isolate, hypothesize, verify."],
  ["What's your process for code review that improves quality and culture?", "medium", "Respectful, specific, teaching-oriented."],
  ["How do you design APIs that age well?", "hard", "Contracts, versioning, backward compatibility."],
  ["Explain CAP theorem in practical terms.", "medium", "Trade-offs with real examples."],
  ["How do you think about caching? When does it hurt?", "medium", "Invalidation, consistency, complexity cost."],
  ["Describe how you'd investigate a memory leak.", "hard", "Tools, profiles, ownership of allocations."],
  ["What makes a good abstraction?", "hard", "Stability of boundaries; leaky abstraction awareness."],
  ["How do you test asynchronous or distributed behavior?", "hard", "Determinism, fakes, chaos, contracts."],
  ["Explain eventual consistency to a product manager.", "easy", "User-visible implications."],
  ["How do you choose between SQL and NoSQL?", "medium", "Access patterns, consistency, ops."],
  ["What's your approach to observability in a new service?", "medium", "Logs, metrics, traces, SLOs."],
  ["How do you handle breaking changes for clients?", "medium", "Communication, migration path, dual-write if needed."],
  ["Describe a performance optimization you made and how you measured it.", "medium", "Baseline, change, validate."],
  ["How do you secure secrets in an application?", "medium", "Vaults, rotation, least privilege."],
  ["What is idempotency and why does it matter?", "easy", "Retries and distributed systems."],
  ["How do you design for failure?", "hard", "Timeouts, retries, bulkheads, fallbacks."],
  ["Explain how you'd migrate a monolith module to a service.", "hard", "Strangler pattern, data ownership."],
  ["How do you evaluate a new framework or library?", "medium", "Risk, community, fit, exit cost."],
  ["What's your strategy for feature flags?", "medium", "Risk control and progressive delivery."],
  ["How do you ensure accessibility in UI work?", "medium", "Standards, testing, inclusive design."],
  ["Describe your approach to database migrations in production.", "hard", "Expand/contract, zero-downtime."],
  ["How do you reason about concurrency bugs?", "hard", "Happens-before, races, tools."],
  ["What is a good SLO vs SLA vs SLI?", "medium", "Definitions and ownership."],
  ["How do you prevent SQL injection and similar flaws?", "easy", "Parameterized queries, validation, threat modeling."],
  ["Explain pagination strategies and trade-offs.", "medium", "Offset vs cursor."],
  ["How do you design rate limiting?", "medium", "Algorithms, fairness, multi-tenant."],
  ["What's your approach to CI/CD quality gates?", "medium", "Fast feedback, flaky test policy."],
  ["How do you handle large file uploads?", "medium", "Direct-to-storage, resumability, virus scan."],
  ["Describe event-driven architecture pros and cons.", "hard", "Coupling, ordering, exactly-once myths."],
  ["How do you version machine learning models in production?", "hard", "Reproducibility, monitoring, rollback."],
  ["What makes a good dashboard for on-call?", "medium", "Actionable signals, low noise."],
  ["How do you approach technical documentation that people actually use?", "easy", "Task-oriented docs near code."],
  ["Explain OAuth at a high level for a web app.", "medium", "Roles of client, auth server, resource server."],
  ["How do you think about multi-tenancy isolation?", "hard", "Data, performance, security boundaries."],
  ["What's your approach to flaky tests?", "medium", "Quarantine, fix root causes, don't ignore."],
  ["How do you profile a slow web page?", "easy", "Network, rendering, main thread, metrics."],
  ["Describe designing a search feature end-to-end.", "hard", "Indexing, ranking, relevance feedback."],
  ["How do you handle data deletion requests technically?", "hard", "Data map, cascading deletes, audit."],
  ["What's your strategy for dependency updates and security patches?", "medium", "Automation plus risk prioritization."],
  ["Explain blue/green vs canary deployments.", "medium", "Risk and rollback."],
  ["How do you design retries without amplifying outages?", "hard", "Backoff, jitter, budgets."],
  ["What is a circuit breaker and when would you use one?", "medium", "Failure isolation."],
  ["How do you approach schema design for evolving products?", "medium", "Flexibility vs integrity."],
  ["Describe building an audit log that is trustworthy.", "hard", "Immutability, identity, completeness."],
  ["How do you debug intermittent production issues?", "hard", "Telemetry, bisect, hypothesis journal."],
  ["What's your philosophy on comments in code?", "easy", "Why over what; keep them true."],
  ["How do you ensure mobile and desktop parity thoughtfully?", "medium", "Progressive enhancement, constraints."],
  ["Explain the difference between authentication and authorization.", "easy", "Identity vs permissions."],
  ["How would you design a notification system?", "hard", "Channels, preferences, reliability, spam."],
];
technical.forEach((row, i) => {
  add(`pt${String(i + 1).padStart(3, "0")}`, row[0], "technical", row[1], row[2], { mode: "technical" });
});

const systemDesign = [
  ["Design a URL shortener. What are the core components?", "medium", "Write path, read path, collisions, scale."],
  ["Design a news feed for a social app.", "hard", "Fan-out strategies, ranking, freshness."],
  ["Design a ride-sharing matching system.", "hard", "Geo-indexing, matching latency, fairness."],
  ["Design a real-time collaborative document editor.", "hard", "CRDTs/OT, presence, conflict resolution."],
  ["Design a rate limiter for a public API.", "medium", "Algorithms, distributed counters."],
  ["Design a video streaming platform at high level.", "hard", "CDN, encoding, adaptive bitrate."],
  ["Design a chat/messaging system.", "hard", "Delivery guarantees, offline, fan-out."],
  ["Design an e-commerce checkout that handles spikes.", "hard", "Inventory consistency, payment idempotency."],
  ["Design a metrics pipeline for product analytics.", "medium", "Ingest, storage, query patterns."],
  ["Design a notification fan-out for millions of users.", "hard", "Push vs pull, batching, preferences."],
  ["Design a multiplayer game session service.", "hard", "Matchmaking, state sync, anti-cheat basics."],
  ["Design a search autocomplete system.", "medium", "Prefix indexes, ranking, latency."],
  ["Design a photo sharing service.", "medium", "Object storage, thumbnails, CDN."],
  ["Design a ticket queue for IT support.", "medium", "Priority, SLA timers, assignment rules."],
  ["Design a feature flag service.", "medium", "Config distribution, targeting, consistency."],
  ["Design a job scheduler for background work.", "hard", "Exactly-once attempts, delays, scale."],
  ["Design a password reset flow securely.", "easy", "Tokens, expiry, abuse prevention."],
  ["Design a multi-tenant SaaS data model.", "hard", "Isolation, noisy neighbor, migrations."],
  ["Design an audit-compliant logging system.", "hard", "Retention, immutability, query."],
  ["Design a content moderation pipeline.", "hard", "Human plus ML, queues, appeals, latency."],
  ["Design a global session store for auth.", "medium", "TTL, revocation, regional failover."],
  ["Design a recommendation system high-level.", "hard", "Candidates, ranking, feedback loops."],
  ["Design a file sync service like Drive.", "hard", "Conflict resolution, deltas, offline."],
  ["Design an online judge / code execution sandbox.", "hard", "Isolation, resource limits, security."],
  ["Design a webhook delivery system.", "medium", "Retries, signatures, ordering."],
  ["Design a calendar availability service.", "medium", "Time zones, concurrency, invites."],
  ["Design a spam detection service for email or chat.", "hard", "Features, false positives, feedback."],
  ["Design a leaderboard for a game.", "medium", "Ranking structures, updates, scale."],
  ["Design a CI system for monorepos.", "hard", "Caching, scheduling, isolation."],
  ["Design an API gateway.", "medium", "Auth, routing, rate limits, observability."],
  ["Design a distributed lock service.", "hard", "Correctness under partitions."],
  ["Design a key-value store with TTL.", "hard", "Storage engine, eviction, replication."],
  ["Design a payment ledger.", "hard", "Double-entry, idempotency, reconciliation."],
  ["Design a location check-in system.", "medium", "Geo queries, privacy, spam."],
  ["Design an A/B experimentation platform.", "hard", "Assignment, metrics, stats validity."],
  ["Design a CDN-like cache hierarchy.", "hard", "Invalidation, origin shield, TTLs."],
  ["Design a multiplayer whiteboard.", "hard", "Realtime sync and presence."],
  ["Design an inventory system for flash sales.", "hard", "Oversell prevention, contention."],
  ["Design a secret management service.", "hard", "Access control, rotation, audit."],
  ["Design a healthcare appointment booking system.", "medium", "Privacy, reliability, reminders."],
];
systemDesign.forEach((row, i) => {
  add(`psd${String(i + 1).padStart(3, "0")}`, row[0], "system-design", row[1], row[2], { mode: "system-design" });
});

const product = [
  ["How do you decide what to build next?", "medium", "User value, business value, effort, risk."],
  ["Tell me about a product trade-off you made.", "hard", "Name losers and winners explicitly."],
  ["How would you improve our onboarding?", "medium", "Activation metric, friction audit, experiments."],
  ["How do you know a feature is successful?", "easy", "North star plus guardrails."],
  ["Design a product for job seekers practicing interviews.", "medium", "Jobs-to-be-done and loops."],
  ["How do you handle a CEO feature request you disagree with?", "hard", "Influence with data; escalate thoughtfully."],
  ["What's your approach to user research on a tight timeline?", "medium", "Lightweight methods with validity caveats."],
  ["How do you prioritize tech debt vs features?", "hard", "Risk and velocity framing."],
  ["Describe a time you killed a feature or project.", "hard", "Opportunity cost and courage."],
  ["How do you write a good PRD?", "easy", "Problem, users, success metrics, non-goals."],
  ["How would you price a freemium product?", "hard", "Willingness to pay, packaging, ethics."],
  ["How do you balance power users and new users?", "medium", "Segmented experiences."],
  ["What's your framework for roadmap communication?", "medium", "Themes over date promises."],
  ["How do you partner with design and engineering effectively?", "medium", "Shared goals, dual-track habits."],
  ["How would you reduce churn for a SaaS product?", "hard", "Diagnose cohorts; interventions."],
  ["Tell me how you'd launch in a new market.", "hard", "Assumptions, localization, GTM."],
  ["How do you handle conflicting qualitative vs quantitative data?", "hard", "Triangulation and further inquiry."],
  ["What's a metric you'd refuse to optimize alone?", "medium", "Goodhart's law awareness."],
  ["How do you scope an MVP?", "easy", "Riskiest assumptions first."],
  ["Describe building trust with enterprise customers.", "medium", "Reliability, support, roadmap transparency."],
  ["How would you improve accessibility as a product goal?", "medium", "Standards, incentives, measurement."],
  ["How do you run a product review meeting?", "easy", "Decisions, owners, evidence."],
  ["Tell me about influencing without authority as a PM.", "medium", "Narrative plus coalitions."],
  ["How do you evaluate build vs buy vs partner?", "medium", "Strategic control and speed."],
  ["How would you design notifications that don't annoy users?", "medium", "Value, control, frequency caps."],
  ["What's your approach to competitive analysis?", "easy", "Jobs not feature bingo."],
  ["How do you handle a failed experiment publicly?", "medium", "Learning culture."],
  ["How would you improve retention for InterviewForge?", "hard", "Habit loops, outcomes, reminders."],
  ["Describe stakeholder management for a cross-org initiative.", "hard", "RACI, narrative, rituals."],
  ["How do you incorporate ethics into product decisions?", "hard", "Harms, dual-use, mitigation."],
  ["How would you structure a beta program?", "medium", "Selection, feedback loops, exit criteria."],
  ["What's your philosophy on personalization?", "medium", "Value vs privacy vs filter bubbles."],
  ["How do you decide when to sunset a product?", "hard", "Costs, users, alternatives."],
  ["How would you measure quality of AI-generated feedback?", "hard", "Human eval, rubrics, abuse cases."],
  ["Tell me how you'd enter a crowded market.", "hard", "Differentiation and wedge."],
  ["How do you handle scope creep from sales?", "medium", "Packaging and exception process."],
  ["What's a product principle you operate by?", "easy", "Make it concrete with an example."],
  ["How do you partner with data science on experiments?", "medium", "Stats literacy and decision rules."],
  ["How would you design a mobile-first interview practice flow?", "medium", "Constraints and core loop."],
  ["Describe resolving a design-engineering impasse.", "medium", "User outcomes as tie-breaker."],
];
product.forEach((row, i) => {
  add(`pp${String(i + 1).padStart(3, "0")}`, row[0], "product", row[1], row[2], {
    mode: "behavioral",
    roles: ["product-manager", "product-designer", "all"],
  });
});

const culture = [
  ["What kind of culture helps you do your best work?", "easy", "Be specific; avoid generic platitudes."],
  ["Tell me about a company value you truly live.", "medium", "Evidence over slogans."],
  ["How do you handle politics in organizations?", "hard", "Integrity-preserving influence."],
  ["Describe a time culture helped or hurt delivery.", "medium", "Systems, not villains."],
  ["What does ownership mean to you day to day?", "easy", "Behaviors and examples."],
  ["How do you contribute to inclusion beyond good intentions?", "medium", "Actions and measurement."],
  ["Tell me about adapting to a culture different from your last company.", "medium", "Learning speed and authenticity."],
  ["How do you give feedback upward about culture problems?", "hard", "Courage plus constructive framing."],
  ["What rituals make teams healthy?", "easy", "Retros, 1:1s, recognition."],
  ["Describe a time you protected team culture under pressure.", "hard", "Trade-offs with delivery."],
  ["How do you respond when culture is move-fast but quality is slipping?", "hard", "Reframe speed as sustainable throughput."],
  ["What does customer obsession look like in your work?", "medium", "Depth without buzzwords."],
  ["How do you handle ambiguity that is cultural, not technical?", "medium", "Sense-making and norms."],
  ["Tell me about earning trust in a new group.", "easy", "Small promises kept."],
  ["How do you celebrate wins without creating complacency?", "medium", "Recognition plus next challenge."],
  ["Describe a time you saw a toxic pattern and intervened.", "hard", "Safety and escalation."],
  ["What do work-life boundaries mean in high-ambition cultures?", "medium", "Sustainable excellence."],
  ["How do you onboard into unwritten rules?", "easy", "Observation and curious questions."],
  ["Tell me about disagreeing with a cultural norm respectfully.", "hard", "Values plus impact."],
  ["How do you build belonging on a distributed team?", "medium", "Intentional connection."],
  ["What is psychological safety to you, practically?", "medium", "Mistakes, questions, dissent allowed."],
  ["How do you handle hero culture that rewards burnout?", "hard", "Model and reward healthy systems."],
  ["Describe aligning personal values with company mission.", "easy", "Authentic fit story."],
  ["How do you respond to failure culture vs blame culture?", "medium", "Learning systems."],
  ["Tell me about cross-functional culture clashes you've navigated.", "medium", "Translation between tribes."],
  ["How do you keep ethics visible when incentives push otherwise?", "hard", "Speak-up design and personal courage."],
  ["What does bias for action mean without recklessness?", "medium", "Reversible decisions."],
  ["How do you practice humility in high-status environments?", "medium", "Credit, listening, updating."],
  ["Describe a time you helped set a team norm.", "easy", "Proposal plus adoption."],
  ["How do you evaluate whether a company is a healthy place to grow?", "medium", "Signals in interviews and onboarding."],
];
culture.forEach((row, i) => {
  add(`pc${String(i + 1).padStart(3, "0")}`, row[0], "company-culture", row[1], row[2], { mode: "company" });
});

const itSupport = [
  ["A user says the internet is down but only their laptop is affected. Walk through troubleshooting.", "easy", "Isolate layer by layer; communicate calmly."],
  ["How do you prioritize tickets when everything is marked urgent?", "medium", "Impact times urgency; SLA; transparent triage."],
  ["Describe handling a VIP user who is rude under stress.", "medium", "De-escalation without sacrificing process."],
  ["How do you document a fix so the next agent can reuse it?", "easy", "Repro steps, root cause, resolution, tags."],
  ["Tell me about reducing repeat tickets for the same issue.", "medium", "Trend analysis and permanent fixes."],
  ["A security alert fires during a password reset. What do you do?", "hard", "Verify identity; don't bypass security."],
  ["How do you explain a complex outage to non-technical users?", "easy", "Clarity, ETA ranges, workarounds."],
  ["Describe a time you escalated correctly vs too late.", "medium", "Judgment and thresholds."],
  ["How do you handle a ticket with incomplete information?", "easy", "Structured clarifying questions."],
  ["Walk through resetting access for a locked-out employee securely.", "medium", "Identity proofing and least privilege."],
  ["How do you stay current with tools while handling ticket load?", "medium", "Microlearning and knowledge bases."],
  ["A user insists on a risky workaround. Response?", "hard", "Risk communication and alternatives."],
  ["Describe collaborating with network or security teams during an incident.", "medium", "Handoffs and shared status."],
  ["How do you measure your effectiveness as a support engineer?", "medium", "FCR, CSAT, quality, learning."],
  ["Tell me about improving a runbook or knowledge article.", "easy", "Before/after usability."],
  ["How do you handle after-hours pages and fatigue?", "medium", "Handoff hygiene and health."],
  ["A laptop is lost with potential sensitive data. First steps?", "hard", "Remote wipe, access revoke, incident process."],
  ["How do you coach a user who is frustrated with technology?", "easy", "Patience, teach, empower."],
  ["Describe balancing speed of ticket closure with quality of diagnosis.", "medium", "Avoid reopen rates."],
  ["How would you design a better service desk triage flow?", "hard", "Categories, routing, self-service."],
];
itSupport.forEach((row, i) => {
  add(`pi${String(i + 1).padStart(3, "0")}`, row[0], "technical", row[1], row[2], {
    mode: "technical",
    roles: ["it-service-desk", "help-desk-analyst", "desktop-support", "it-support-specialist", "all"],
  });
});

const company = [
  ["Tell me about a time you delivered results with incomplete requirements.", "hard", "End-to-end ownership with incomplete specs.", "amazon"],
  ["Describe inventing a simpler solution that replaced a complex one.", "medium", "Invent and simplify with measured impact.", "amazon"],
  ["Tell me about diving deep into a metric that didn't look right.", "hard", "Show the investigation trail.", "amazon"],
  ["Describe earning trust when you had bad news to share.", "medium", "Honesty under pressure.", "amazon"],
  ["Tell me about a time you insisted on the highest standards.", "hard", "Specific bar you raised and impact.", "amazon"],
  ["Describe a time you were customer-obsessed against internal convenience.", "hard", "Customer as true north.", "amazon"],
  ["Tell me about learning and being curious outside your role.", "easy", "Breadth with application.", "amazon"],
  ["Describe thinking big on a small team.", "medium", "Ambition with a concrete plan.", "amazon"],
  ["Tell me about a time you had backbone; you disagreed and committed.", "hard", "Disagree and commit example.", "amazon"],
  ["Describe delivering on a tight deadline without sacrificing safety.", "medium", "Bias for action with guardrails.", "amazon"],
  ["How do you structure an ambiguous problem from scratch?", "hard", "Structured problem solving.", "google"],
  ["Explain a technical concept until I understand it; I'll ask questions.", "medium", "Communication under interactive probing.", "google"],
  ["Tell me about improving something by an order of magnitude, not 10%.", "hard", "Impact ambition.", "google"],
  ["Describe a time you used data to resolve a product debate.", "medium", "Analytical rigor.", "google"],
  ["How do you handle disagreement in a design review?", "medium", "Respectful technical debate.", "google"],
  ["Tell me about moving fast with incomplete information.", "hard", "Impact and iteration speed.", "meta"],
  ["Describe a time you focused on long-term impact over short-term metrics.", "hard", "Impact narrative.", "meta"],
  ["Tell me about building something that scaled to many users or teams.", "medium", "Scale mindset.", "meta"],
  ["Describe attention to craft when nobody was watching.", "medium", "Craft standards.", "apple"],
  ["Tell me about simplifying a user experience dramatically.", "medium", "Simplicity as hard work.", "apple"],
  ["Describe growth mindset after critical feedback from a peer.", "medium", "Growth mindset theme.", "microsoft"],
  ["Tell me about partnering across teams that didn't report to you.", "medium", "Cross-org collaboration.", "microsoft"],
  ["Describe wearing multiple hats at a startup.", "medium", "Ambiguity and ownership.", "startup"],
  ["Tell me about making a decision with almost no process in place.", "hard", "Startup judgment.", "startup"],
  ["Describe building culture when the team was tiny.", "medium", "Early culture encoding.", "startup"],
  ["How do you stay resilient through repeated rejection?", "medium", "Self-efficacy and recovery.", "general"],
  ["Tell me about a time you prepared for a high-stakes evaluation.", "easy", "Metacognition and practice.", "general"],
  ["Describe representing your values when incentives conflicted.", "hard", "Integrity under pressure.", "general"],
];
company.forEach((row, i) => {
  add(`pg${String(i + 1).padStart(3, "0")}`, row[0], "company-culture", row[1], row[2], {
    mode: "company",
    companyStyle: row[3],
  });
});

// Pad to ensure we clear 500 total when merged with ~212 base
// Add remaining general behavioral/psych items if needed
const pad = [
  ["Tell me about a time you practiced deliberate recovery after intense work.", "easy", "Performance psychology: rest is a skill."],
  ["Describe a time you used visualization or mental rehearsal before a high-stakes event.", "easy", "Preparation strategies used by elite performers."],
  ["Tell me about reframing a threat as a challenge.", "medium", "Stress appraisal theory in action."],
  ["Describe a time social support changed your performance.", "easy", "Buffering hypothesis; ask for help skillfully."],
  ["Tell me about a habit system you built that stuck.", "medium", "Implementation intentions and environment design."],
  ["Describe managing imposter feelings in a new role.", "medium", "Normalize, evidence log, mentor support."],
  ["Tell me about a time you used self-compassion after failure.", "easy", "Reduces rumination; enables learning."],
  ["Describe giving yourself feedback as rigorously as you give others.", "medium", "Metacognitive honesty."],
  ["Tell me about a time curiosity outperformed certainty.", "medium", "Explore-exploit balance."],
  ["Describe protecting focus in a distraction-heavy environment.", "easy", "Attention as a scarce resource."],
];
let pi = 0;
while (items.length < 300) {
  const row = pad[pi % pad.length];
  add(`pz${String(items.length + 1).padStart(3, "0")}`, row[0] + (pi >= pad.length ? ` (variant ${Math.floor(pi / pad.length) + 1})` : ""), "behavioral", row[1], row[2], { mode: "behavioral" });
  pi++;
}

const lines = [];
lines.push(`import type { InterviewQuestion } from "./types";`);
lines.push(``);
lines.push(`/**`);
lines.push(` * Extended psychologist-informed question bank.`);
lines.push(` * Competency-based & structured-interview items merged into QUESTIONS.`);
lines.push(` */`);
lines.push(``);
lines.push(`function qx(`);
lines.push(`  id: string,`);
lines.push(`  text: string,`);
lines.push(`  category: InterviewQuestion["category"],`);
lines.push(`  difficulty: InterviewQuestion["difficulty"],`);
lines.push(`  opts: Partial<InterviewQuestion> = {}`);
lines.push(`): InterviewQuestion {`);
lines.push(`  return {`);
lines.push(`    id,`);
lines.push(`    text,`);
lines.push(`    category,`);
lines.push(`    mode: opts.mode ?? "all",`);
lines.push(`    roles: opts.roles ?? ["all"],`);
lines.push(`    difficulty,`);
lines.push(`    companyStyle: opts.companyStyle,`);
lines.push(`    tips: opts.tips,`);
lines.push(`    sampleAnswerOutline: opts.sampleAnswerOutline,`);
lines.push(`  };`);
lines.push(`}`);
lines.push(``);
lines.push(`export const EXTRA_QUESTIONS: InterviewQuestion[] = [`);
for (const it of items) {
  const parts = [`tips: ${JSON.stringify(it.tips)}`];
  if (it.mode) parts.unshift(`mode: ${JSON.stringify(it.mode)}`);
  if (it.roles) parts.push(`roles: ${JSON.stringify(it.roles)}`);
  if (it.companyStyle) parts.push(`companyStyle: ${JSON.stringify(it.companyStyle)}`);
  lines.push(
    `  qx(${JSON.stringify(it.id)}, ${JSON.stringify(it.text)}, ${JSON.stringify(it.category)}, ${JSON.stringify(it.difficulty)}, { ${parts.join(", ")} }),`
  );
}
lines.push(`];`);
lines.push(``);

fs.writeFileSync("lib/questions-extra.ts", lines.join("\n"), "utf8");
console.log("Wrote", items.length, "extra questions");
