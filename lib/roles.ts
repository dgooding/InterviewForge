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
];

export function findRole(idOrTitle: string): JobRole | undefined {
  const q = idOrTitle.toLowerCase();
  return JOB_ROLES.find(
    (r) => r.id === q || r.title.toLowerCase() === q
  );
}
