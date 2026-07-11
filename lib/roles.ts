import type { JobRole } from "./types";

export const JOB_ROLES: JobRole[] = [
  {
    id: "software-engineer",
    title: "Software Engineer",
    category: "Engineering",
    description: "Full-stack, backend, or frontend engineering roles",
    popular: true,
  },
  {
    id: "frontend-engineer",
    title: "Frontend Engineer",
    category: "Engineering",
    description: "React, UI systems, web performance",
    popular: true,
  },
  {
    id: "backend-engineer",
    title: "Backend Engineer",
    category: "Engineering",
    description: "APIs, databases, distributed systems",
  },
  {
    id: "fullstack-engineer",
    title: "Full Stack Engineer",
    category: "Engineering",
    description: "End-to-end product development",
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    category: "Data",
    description: "ML models, analytics, experimentation",
    popular: true,
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    category: "Data",
    description: "SQL, dashboards, business insights",
  },
  {
    id: "ml-engineer",
    title: "ML Engineer",
    category: "Data",
    description: "Production ML systems and pipelines",
  },
  {
    id: "product-manager",
    title: "Product Manager",
    category: "Product",
    description: "Roadmaps, prioritization, stakeholder alignment",
    popular: true,
  },
  {
    id: "product-designer",
    title: "Product Designer",
    category: "Design",
    description: "UX research, interaction design, design systems",
  },
  {
    id: "ux-designer",
    title: "UX Designer",
    category: "Design",
    description: "User research, wireframes, usability",
    popular: true,
  },
  {
    id: "marketing-manager",
    title: "Marketing Manager",
    category: "Marketing",
    description: "Campaigns, growth, brand strategy",
    popular: true,
  },
  {
    id: "growth-marketer",
    title: "Growth Marketer",
    category: "Marketing",
    description: "Acquisition funnels, A/B testing, lifecycle",
  },
  {
    id: "sales-representative",
    title: "Sales Representative",
    category: "Sales",
    description: "Outbound, demos, pipeline management",
    popular: true,
  },
  {
    id: "account-executive",
    title: "Account Executive",
    category: "Sales",
    description: "Enterprise deals, negotiation, closing",
  },
  {
    id: "customer-success",
    title: "Customer Success Manager",
    category: "Customer",
    description: "Retention, onboarding, expansion",
  },
  {
    id: "devops-engineer",
    title: "DevOps / SRE",
    category: "Engineering",
    description: "CI/CD, reliability, cloud infrastructure",
  },
  {
    id: "engineering-manager",
    title: "Engineering Manager",
    category: "Leadership",
    description: "People management, delivery, tech strategy",
  },
  {
    id: "project-manager",
    title: "Project Manager",
    category: "Operations",
    description: "Timelines, risk, cross-functional delivery",
  },
  {
    id: "business-analyst",
    title: "Business Analyst",
    category: "Business",
    description: "Requirements, process improvement, reporting",
  },
  {
    id: "hr-business-partner",
    title: "HR Business Partner",
    category: "People",
    description: "Talent, culture, org design",
  },
  {
    id: "it-service-desk",
    title: "IT Service Desk",
    category: "IT Support",
    description: "Tickets, troubleshooting, end-user support, SLAs",
    popular: true,
  },
  {
    id: "help-desk-analyst",
    title: "Help Desk Analyst",
    category: "IT Support",
    description: "Tier-1 support, password resets, hardware basics",
  },
  {
    id: "desktop-support",
    title: "Desktop Support Specialist",
    category: "IT Support",
    description: "Endpoints, imaging, on-site support",
  },
  {
    id: "it-support-specialist",
    title: "IT Support Specialist",
    category: "IT Support",
    description: "Applications, networks, user enablement",
  },
  {
    id: "systems-administrator",
    title: "Systems Administrator",
    category: "IT Support",
    description: "Servers, identity, access, infrastructure",
  },
  {
    id: "network-administrator",
    title: "Network Administrator",
    category: "IT Support",
    description: "Routing, firewalls, connectivity, monitoring",
  },
  {
    id: "cybersecurity-analyst",
    title: "Cybersecurity Analyst",
    category: "Security",
    description: "Threats, incidents, compliance, hardening",
  },
];

/** Extra search aliases so casual queries match (e.g. "service desk", "helpdesk"). */
const ROLE_ALIASES: Record<string, string[]> = {
  "it-service-desk": [
    "service desk",
    "servicedesk",
    "it desk",
    "it support desk",
    "help desk",
    "helpdesk",
    "tier 1",
    "tier1",
  ],
  "help-desk-analyst": ["help desk", "helpdesk", "service desk"],
  "desktop-support": ["desktop", "pc support", "endpoint"],
  "it-support-specialist": ["it support", "tech support", "support specialist"],
  "customer-success": ["csm", "customer support"],
  "software-engineer": ["swe", "developer", "dev", "programmer"],
  "frontend-engineer": ["front end", "front-end", "ui engineer", "react"],
  "backend-engineer": ["back end", "back-end", "server"],
  "data-scientist": ["ds", "ml scientist"],
  "product-manager": ["pm", "product"],
  "ux-designer": ["ux", "ui/ux", "user experience"],
};

export function findRole(idOrTitle: string): JobRole | undefined {
  const q = idOrTitle.toLowerCase().trim();
  return JOB_ROLES.find(
    (r) => r.id === q || r.title.toLowerCase() === q
  );
}

/**
 * Live search across title, category, description, and aliases.
 * Returns ranked matches (best first). Empty query → popular roles first.
 */
export function searchRoles(query: string, limit = 12): JobRole[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    const popular = JOB_ROLES.filter((r) => r.popular);
    const rest = JOB_ROLES.filter((r) => !r.popular);
    return [...popular, ...rest].slice(0, limit);
  }

  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = JOB_ROLES.map((role) => {
    const title = role.title.toLowerCase();
    const category = role.category.toLowerCase();
    const description = role.description.toLowerCase();
    const aliases = (ROLE_ALIASES[role.id] || []).join(" ");
    const hay = `${title} ${category} ${description} ${aliases} ${role.id.replace(/-/g, " ")}`;

    let score = 0;
    if (title === q) score += 100;
    if (title.startsWith(q)) score += 50;
    if (title.includes(q)) score += 30;
    if (aliases.includes(q)) score += 40;
    if (category.includes(q)) score += 15;
    if (description.includes(q)) score += 10;
    if (role.id.replace(/-/g, " ").includes(q)) score += 20;

    // All tokens must appear somewhere
    const allTokens = tokens.every((t) => hay.includes(t));
    if (!allTokens && score === 0) return { role, score: 0 };
    if (allTokens) score += 5 * tokens.length;

    if (role.popular) score += 2;
    return { role, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.role);
}
