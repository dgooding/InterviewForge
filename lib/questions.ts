import type { InterviewQuestion, InterviewMode, CompanyStyle } from "./types";

/**
 * 200+ pre-loaded interview questions across categories.
 * Filter with getQuestions({ mode, role, company, search }).
 */

const ALL = "all";

function q(
  id: string,
  text: string,
  category: InterviewQuestion["category"],
  difficulty: InterviewQuestion["difficulty"],
  opts: Partial<InterviewQuestion> = {}
): InterviewQuestion {
  return {
    id,
    text,
    category,
    mode: opts.mode ?? "all",
    roles: opts.roles ?? [ALL],
    difficulty,
    companyStyle: opts.companyStyle,
    tips: opts.tips,
    sampleAnswerOutline: opts.sampleAnswerOutline,
  };
}

export const QUESTIONS: InterviewQuestion[] = [
  // ========== BEHAVIORAL (STAR) ==========
  q("b01", "Tell me about yourself.", "behavioral", "easy", {
    mode: "behavioral",
    tips: "Keep it under 2 minutes: present → past → future, tied to the role.",
  }),
  q("b02", "Describe a time you faced a significant challenge at work. How did you handle it?", "behavioral", "medium", {
    mode: "behavioral",
    tips: "Use STAR. Emphasize ownership and measurable outcome.",
  }),
  q("b03", "Tell me about a time you failed. What did you learn?", "behavioral", "medium", {
    mode: "behavioral",
  }),
  q("b04", "Give an example of a time you had a conflict with a coworker. How did you resolve it?", "behavioral", "medium", {
    mode: "behavioral",
  }),
  q("b05", "Describe a situation where you had to meet a tight deadline.", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("b06", "Tell me about a time you went above and beyond for a project or customer.", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("b07", "Describe a time you had to persuade someone to see things your way.", "behavioral", "medium", {
    mode: "behavioral",
  }),
  q("b08", "Tell me about a time you received critical feedback. How did you respond?", "behavioral", "medium", {
    mode: "behavioral",
  }),
  q("b09", "Give an example of when you took initiative without being asked.", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("b10", "Describe a time you had to learn something quickly.", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("b11", "Tell me about a time you worked with a difficult stakeholder.", "behavioral", "hard", {
    mode: "behavioral",
  }),
  q("b12", "Describe a project you're particularly proud of.", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("b13", "Tell me about a time you had to make a decision with incomplete information.", "behavioral", "hard", {
    mode: "behavioral",
  }),
  q("b14", "Give an example of how you prioritized competing tasks.", "behavioral", "medium", {
    mode: "behavioral",
  }),
  q("b15", "Describe a time you mentored or helped a teammate grow.", "behavioral", "medium", {
    mode: "behavioral",
  }),
  q("b16", "Tell me about a time you disagreed with your manager.", "behavioral", "hard", {
    mode: "behavioral",
  }),
  q("b17", "Describe a situation where you improved a process or system.", "behavioral", "medium", {
    mode: "behavioral",
  }),
  q("b18", "Tell me about a time you had to adapt to a major change.", "behavioral", "medium", {
    mode: "behavioral",
  }),
  q("b19", "Give an example of when you delivered bad news. How did you handle it?", "behavioral", "hard", {
    mode: "behavioral",
  }),
  q("b20", "Describe a time you worked on a cross-functional team.", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("b21", "Tell me about a goal you set and how you achieved it.", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("b22", "Describe a time you had to manage ambiguity.", "behavioral", "hard", {
    mode: "behavioral",
  }),
  q("b23", "Tell me about a time you had to say no to a request.", "behavioral", "medium", {
    mode: "behavioral",
  }),
  q("b24", "Give an example of when you used data to influence a decision.", "behavioral", "medium", {
    mode: "behavioral",
  }),
  q("b25", "Describe a time you recovered from a production or customer issue.", "behavioral", "hard", {
    mode: "behavioral",
  }),
  q("b26", "Why do you want to leave your current role?", "behavioral", "medium", {
    mode: "behavioral",
  }),
  q("b27", "Where do you see yourself in five years?", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("b28", "What is your greatest strength?", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("b29", "What is your greatest weakness?", "behavioral", "medium", {
    mode: "behavioral",
  }),
  q("b30", "Why should we hire you?", "behavioral", "medium", {
    mode: "behavioral",
  }),
  q("b31", "Tell me about a time you led without formal authority.", "behavioral", "hard", {
    mode: "behavioral",
    category: "leadership",
  }),
  q("b32", "Describe how you handle stress and pressure.", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("b33", "Tell me about a time you had to juggle multiple stakeholders with conflicting needs.", "behavioral", "hard", {
    mode: "behavioral",
  }),
  q("b34", "Give an example of a time you owned a mistake publicly.", "behavioral", "medium", {
    mode: "behavioral",
  }),
  q("b35", "Describe a time you exceeded expectations.", "behavioral", "easy", {
    mode: "behavioral",
  }),

  // ========== TECHNICAL - SOFTWARE ==========
  q("t01", "Explain the difference between REST and GraphQL. When would you choose each?", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "frontend-engineer", "backend-engineer", "fullstack-engineer"],
  }),
  q("t02", "What is the difference between SQL and NoSQL databases? Give use cases for each.", "technical", "easy", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "fullstack-engineer", "data-scientist", "data-analyst"],
  }),
  q("t03", "Explain how HTTP works. What happens when you type a URL in the browser?", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "frontend-engineer", "fullstack-engineer"],
  }),
  q("t04", "What is a race condition and how would you prevent one?", "technical", "hard", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "fullstack-engineer"],
  }),
  q("t05", "Explain Big O notation and analyze the complexity of binary search.", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "fullstack-engineer", "ml-engineer"],
  }),
  q("t06", "What is the difference between authentication and authorization?", "technical", "easy", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "fullstack-engineer", "devops-engineer"],
  }),
  q("t07", "Explain the concept of CAP theorem.", "technical", "hard", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer"],
    category: "system-design",
  }),
  q("t08", "How would you design a URL shortener like bit.ly?", "system-design", "hard", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "fullstack-engineer"],
  }),
  q("t09", "Explain closures in JavaScript with an example.", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "frontend-engineer", "fullstack-engineer"],
  }),
  q("t10", "What is the virtual DOM and why does React use it?", "technical", "medium", {
    mode: "technical",
    roles: ["frontend-engineer", "fullstack-engineer", "software-engineer"],
  }),
  q("t11", "How does garbage collection work in managed languages?", "technical", "hard", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer"],
  }),
  q("t12", "Explain indexing in databases. When can indexes hurt performance?", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "data-analyst", "data-scientist"],
  }),
  q("t13", "What is the difference between processes and threads?", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "devops-engineer"],
  }),
  q("t14", "How would you optimize a slow web page?", "technical", "medium", {
    mode: "technical",
    roles: ["frontend-engineer", "fullstack-engineer", "software-engineer"],
  }),
  q("t15", "Explain ACID properties in databases.", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer"],
  }),
  q("t16", "What is dependency injection and why is it useful?", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "fullstack-engineer"],
  }),
  q("t17", "How would you design a rate limiter?", "system-design", "hard", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer"],
  }),
  q("t18", "Explain microservices vs monolith trade-offs.", "system-design", "medium", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "engineering-manager"],
  }),
  q("t19", "What is CORS and how do you configure it securely?", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "frontend-engineer", "fullstack-engineer"],
  }),
  q("t20", "Explain eventual consistency with a real-world example.", "technical", "hard", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer"],
  }),
  q("t21", "How do you approach debugging a production incident?", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "devops-engineer", "backend-engineer"],
  }),
  q("t22", "What is the difference between TCP and UDP?", "technical", "easy", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "devops-engineer"],
  }),
  q("t23", "Explain how you would implement pagination for a large dataset API.", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "fullstack-engineer"],
  }),
  q("t24", "What are design patterns you've used recently? Give an example.", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "fullstack-engineer"],
  }),
  q("t25", "How would you design a chat application?", "system-design", "hard", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "fullstack-engineer"],
  }),
  q("t26", "Explain React hooks: useState, useEffect, and useMemo.", "technical", "easy", {
    mode: "technical",
    roles: ["frontend-engineer", "fullstack-engineer"],
  }),
  q("t27", "What is CI/CD and how have you set it up?", "technical", "medium", {
    mode: "technical",
    roles: ["devops-engineer", "software-engineer", "backend-engineer"],
  }),
  q("t28", "How do containers (Docker) work? What problem do they solve?", "technical", "medium", {
    mode: "technical",
    roles: ["devops-engineer", "software-engineer", "backend-engineer"],
  }),
  q("t29", "Explain load balancing strategies.", "system-design", "medium", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "devops-engineer"],
  }),
  q("t30", "What is a memory leak and how do you detect one?", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "frontend-engineer", "backend-engineer"],
  }),
  q("t31", "Walk me through how you would write unit tests for a critical function.", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "frontend-engineer", "backend-engineer", "fullstack-engineer"],
  }),
  q("t32", "Explain the N+1 query problem and how to fix it.", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "fullstack-engineer"],
  }),
  q("t33", "How would you design a news feed?", "system-design", "hard", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer"],
  }),
  q("t34", "What is OAuth 2.0 and how does the authorization code flow work?", "technical", "hard", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "fullstack-engineer"],
  }),
  q("t35", "Explain caching strategies (CDN, Redis, browser cache).", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "frontend-engineer", "devops-engineer"],
  }),

  // ========== DATA / ML ==========
  q("d01", "Explain overfitting and how you prevent it.", "technical", "medium", {
    mode: "technical",
    roles: ["data-scientist", "ml-engineer"],
  }),
  q("d02", "What is the bias-variance tradeoff?", "technical", "medium", {
    mode: "technical",
    roles: ["data-scientist", "ml-engineer"],
  }),
  q("d03", "How do you evaluate a classification model?", "technical", "medium", {
    mode: "technical",
    roles: ["data-scientist", "ml-engineer", "data-analyst"],
  }),
  q("d04", "Explain the difference between supervised and unsupervised learning.", "technical", "easy", {
    mode: "technical",
    roles: ["data-scientist", "ml-engineer"],
  }),
  q("d05", "Walk me through a data analysis project from question to insight.", "technical", "medium", {
    mode: "technical",
    roles: ["data-analyst", "data-scientist", "business-analyst"],
  }),
  q("d06", "What is A/B testing and what pitfalls should you avoid?", "technical", "medium", {
    mode: "technical",
    roles: ["data-scientist", "data-analyst", "product-manager", "growth-marketer"],
  }),
  q("d07", "Explain precision vs recall. When would you optimize for each?", "technical", "medium", {
    mode: "technical",
    roles: ["data-scientist", "ml-engineer"],
  }),
  q("d08", "How would you handle missing data in a dataset?", "technical", "easy", {
    mode: "technical",
    roles: ["data-scientist", "data-analyst", "ml-engineer"],
  }),
  q("d09", "What is feature engineering? Give examples.", "technical", "medium", {
    mode: "technical",
    roles: ["data-scientist", "ml-engineer"],
  }),
  q("d10", "Explain how a decision tree works.", "technical", "easy", {
    mode: "technical",
    roles: ["data-scientist", "ml-engineer"],
  }),
  q("d11", "How do you detect and handle outliers?", "technical", "medium", {
    mode: "technical",
    roles: ["data-scientist", "data-analyst"],
  }),
  q("d12", "What is SQL window functions? Give a use case.", "technical", "medium", {
    mode: "technical",
    roles: ["data-analyst", "data-scientist", "backend-engineer"],
  }),
  q("d13", "How would you design an ML pipeline for production?", "technical", "hard", {
    mode: "technical",
    roles: ["ml-engineer", "data-scientist"],
  }),
  q("d14", "Explain gradient descent in simple terms.", "technical", "medium", {
    mode: "technical",
    roles: ["data-scientist", "ml-engineer"],
  }),
  q("d15", "What metrics would you use for a recommendation system?", "technical", "hard", {
    mode: "technical",
    roles: ["data-scientist", "ml-engineer", "product-manager"],
  }),

  // ========== PRODUCT ==========
  q("p01", "How do you prioritize a product backlog?", "product", "medium", {
    mode: "behavioral",
    roles: ["product-manager", "project-manager"],
  }),
  q("p02", "How would you improve [product X]?", "product", "hard", {
    mode: "behavioral",
    roles: ["product-manager", "ux-designer", "product-designer"],
    tips: "Structure: clarify goal → users → metrics → solutions → trade-offs.",
  }),
  q("p03", "Tell me about a product decision you made that failed.", "product", "hard", {
    mode: "behavioral",
    roles: ["product-manager"],
  }),
  q("p04", "How do you work with engineering when estimates slip?", "product", "medium", {
    mode: "behavioral",
    roles: ["product-manager", "project-manager", "engineering-manager"],
  }),
  q("p05", "Define success metrics for a new feature launch.", "product", "medium", {
    mode: "behavioral",
    roles: ["product-manager", "growth-marketer", "data-analyst"],
  }),
  q("p06", "How do you gather and validate user requirements?", "product", "easy", {
    mode: "behavioral",
    roles: ["product-manager", "business-analyst", "ux-designer"],
  }),
  q("p07", "Walk me through how you'd launch a product in a new market.", "product", "hard", {
    mode: "behavioral",
    roles: ["product-manager", "marketing-manager"],
  }),
  q("p08", "How do you handle conflicting requests from sales and engineering?", "product", "hard", {
    mode: "behavioral",
    roles: ["product-manager"],
  }),
  q("p09", "What frameworks do you use for prioritization (RICE, MoSCoW, etc.)?", "product", "easy", {
    mode: "behavioral",
    roles: ["product-manager", "project-manager"],
  }),
  q("p10", "Describe a time you had to kill a feature or project.", "product", "hard", {
    mode: "behavioral",
    roles: ["product-manager", "engineering-manager"],
  }),

  // ========== DESIGN / UX ==========
  q("u01", "Walk me through your design process.", "behavioral", "easy", {
    mode: "behavioral",
    roles: ["ux-designer", "product-designer"],
  }),
  q("u02", "How do you handle feedback that you disagree with from stakeholders?", "behavioral", "medium", {
    mode: "behavioral",
    roles: ["ux-designer", "product-designer"],
  }),
  q("u03", "Describe a project where research changed your design direction.", "behavioral", "medium", {
    mode: "behavioral",
    roles: ["ux-designer", "product-designer"],
  }),
  q("u04", "How do you ensure accessibility in your designs?", "technical", "medium", {
    mode: "technical",
    roles: ["ux-designer", "product-designer", "frontend-engineer"],
  }),
  q("u05", "How do you balance user needs with business goals?", "behavioral", "medium", {
    mode: "behavioral",
    roles: ["ux-designer", "product-designer", "product-manager"],
  }),
  q("u06", "Tell me about a time you designed for a constraint (time, tech, brand).", "behavioral", "medium", {
    mode: "behavioral",
    roles: ["ux-designer", "product-designer"],
  }),
  q("u07", "How do you measure design success?", "product", "medium", {
    mode: "behavioral",
    roles: ["ux-designer", "product-designer"],
  }),
  q("u08", "Explain the difference between UX and UI.", "technical", "easy", {
    mode: "technical",
    roles: ["ux-designer", "product-designer"],
  }),

  // ========== MARKETING / SALES ==========
  q("m01", "How do you measure campaign ROI?", "technical", "medium", {
    mode: "technical",
    roles: ["marketing-manager", "growth-marketer"],
  }),
  q("m02", "Describe a campaign you ran end-to-end.", "behavioral", "medium", {
    mode: "behavioral",
    roles: ["marketing-manager", "growth-marketer"],
  }),
  q("m03", "How would you acquire the first 1,000 users for a new product?", "product", "hard", {
    mode: "behavioral",
    roles: ["marketing-manager", "growth-marketer", "product-manager"],
  }),
  q("m04", "Walk me through your sales process from lead to close.", "behavioral", "medium", {
    mode: "behavioral",
    roles: ["sales-representative", "account-executive"],
  }),
  q("m05", "Tell me about a deal you lost. What would you do differently?", "behavioral", "hard", {
    mode: "behavioral",
    roles: ["sales-representative", "account-executive"],
  }),
  q("m06", "How do you handle price objections?", "situational", "medium", {
    mode: "behavioral",
    roles: ["sales-representative", "account-executive"],
  }),
  q("m07", "Describe how you build a pipeline.", "behavioral", "medium", {
    mode: "behavioral",
    roles: ["sales-representative", "account-executive"],
  }),
  q("m08", "How do you segment audiences for messaging?", "technical", "medium", {
    mode: "technical",
    roles: ["marketing-manager", "growth-marketer"],
  }),
  q("m09", "Tell me about a time you turned a churning customer around.", "behavioral", "hard", {
    mode: "behavioral",
    roles: ["customer-success", "account-executive"],
  }),
  q("m10", "How do you prioritize accounts in your book of business?", "behavioral", "medium", {
    mode: "behavioral",
    roles: ["customer-success", "account-executive"],
  }),

  // ========== LEADERSHIP / MANAGEMENT ==========
  q("l01", "How do you give difficult feedback to a direct report?", "leadership", "hard", {
    mode: "behavioral",
    roles: ["engineering-manager", "product-manager", "project-manager"],
  }),
  q("l02", "Describe how you build high-performing teams.", "leadership", "hard", {
    mode: "behavioral",
    roles: ["engineering-manager"],
  }),
  q("l03", "How do you handle underperformance?", "leadership", "hard", {
    mode: "behavioral",
    roles: ["engineering-manager", "hr-business-partner"],
  }),
  q("l04", "Tell me about a time you had to make an unpopular decision.", "leadership", "hard", {
    mode: "behavioral",
    roles: ["engineering-manager", "product-manager"],
  }),
  q("l05", "How do you balance technical debt with feature delivery?", "leadership", "hard", {
    mode: "behavioral",
    roles: ["engineering-manager", "software-engineer"],
  }),
  q("l06", "Describe your approach to 1:1s.", "leadership", "easy", {
    mode: "behavioral",
    roles: ["engineering-manager"],
  }),
  q("l07", "How do you hire great engineers?", "leadership", "medium", {
    mode: "behavioral",
    roles: ["engineering-manager"],
  }),
  q("l08", "Tell me about a time you managed a project that was at risk.", "leadership", "medium", {
    mode: "behavioral",
    roles: ["project-manager", "engineering-manager", "product-manager"],
  }),

  // ========== SITUATIONAL ==========
  q("s01", "You discover a critical bug the day before launch. What do you do?", "situational", "hard", {
    mode: "behavioral",
  }),
  q("s02", "A stakeholder wants a feature that you believe will harm the user experience. How do you respond?", "situational", "hard", {
    mode: "behavioral",
  }),
  q("s03", "You're asked to estimate a project with unclear requirements. How do you proceed?", "situational", "medium", {
    mode: "behavioral",
  }),
  q("s04", "Two teammates are in open conflict and it's affecting delivery. What do you do?", "situational", "hard", {
    mode: "behavioral",
  }),
  q("s05", "You inherit a codebase with no tests and frequent production issues. What's your plan?", "situational", "hard", {
    mode: "behavioral",
    roles: ["software-engineer", "engineering-manager"],
  }),
  q("s06", "A customer is angry on a support call. How do you handle it?", "situational", "medium", {
    mode: "behavioral",
    roles: ["customer-success", "sales-representative"],
  }),
  q("s07", "You have two high-priority projects and only enough capacity for one. How do you decide?", "situational", "medium", {
    mode: "behavioral",
  }),
  q("s08", "Leadership wants a metric that you think is vanity. How do you push back?", "situational", "hard", {
    mode: "behavioral",
    roles: ["data-analyst", "product-manager", "data-scientist"],
  }),

  // ========== COMPANY-SPECIFIC STYLES ==========
  q("g01", "Tell me about a time you solved a complex problem with limited resources.", "behavioral", "hard", {
    mode: "company",
    companyStyle: "google",
    tips: "Google values structured problem-solving and intellectual humility.",
  }),
  q("g02", "How would you design Google Docs collaborative editing?", "system-design", "hard", {
    mode: "company",
    companyStyle: "google",
    roles: ["software-engineer", "backend-engineer"],
  }),
  q("g03", "Describe a time you used data to make a decision under uncertainty.", "behavioral", "hard", {
    mode: "company",
    companyStyle: "google",
  }),
  q("g04", "Explain a technical concept to a non-technical audience.", "behavioral", "medium", {
    mode: "company",
    companyStyle: "google",
  }),
  q("g05", "What is something you've taught yourself recently and how?", "behavioral", "easy", {
    mode: "company",
    companyStyle: "google",
  }),

  q("f01", "Tell me about a time you moved fast and broke something. What happened next?", "behavioral", "hard", {
    mode: "company",
    companyStyle: "meta",
    tips: "Meta values impact, speed, and ownership.",
  }),
  q("f02", "How would you design Instagram Stories storage and delivery?", "system-design", "hard", {
    mode: "company",
    companyStyle: "meta",
    roles: ["software-engineer", "backend-engineer"],
  }),
  q("f03", "Describe a time you influenced without authority at scale.", "behavioral", "hard", {
    mode: "company",
    companyStyle: "meta",
  }),
  q("f04", "How do you prioritize when everything feels P0?", "behavioral", "medium", {
    mode: "company",
    companyStyle: "meta",
  }),
  q("f05", "Tell me about a product you love and how you'd improve it.", "product", "medium", {
    mode: "company",
    companyStyle: "meta",
  }),

  q("a01", "Tell me about a time you delivered results despite ambiguity. (Leadership Principle: Deliver Results)", "behavioral", "hard", {
    mode: "company",
    companyStyle: "amazon",
    tips: "Map answers to Amazon Leadership Principles explicitly.",
  }),
  q("a02", "Describe a time you had to dive deep into data to find root cause. (Dive Deep)", "behavioral", "hard", {
    mode: "company",
    companyStyle: "amazon",
  }),
  q("a03", "Tell me about a time you invented and simplified a process. (Invent and Simplify)", "behavioral", "hard", {
    mode: "company",
    companyStyle: "amazon",
  }),
  q("a04", "Describe a time you disagreed and committed. (Have Backbone; Disagree and Commit)", "behavioral", "hard", {
    mode: "company",
    companyStyle: "amazon",
  }),
  q("a05", "Tell me about a time you earned trust with a difficult stakeholder. (Earn Trust)", "behavioral", "medium", {
    mode: "company",
    companyStyle: "amazon",
  }),
  q("a06", "Describe a time you took ownership of a problem outside your job description. (Ownership)", "behavioral", "medium", {
    mode: "company",
    companyStyle: "amazon",
  }),
  q("a07", "Tell me about a time you were customer-obsessed. (Customer Obsession)", "behavioral", "medium", {
    mode: "company",
    companyStyle: "amazon",
  }),
  q("a08", "How would you design Amazon's order tracking system?", "system-design", "hard", {
    mode: "company",
    companyStyle: "amazon",
    roles: ["software-engineer", "backend-engineer"],
  }),

  q("ap01", "Tell me about a time you obsessively focused on quality or craft.", "behavioral", "hard", {
    mode: "company",
    companyStyle: "apple",
    tips: "Apple values design excellence, simplicity, and attention to detail.",
  }),
  q("ap02", "How do you approach simplicity in complex systems?", "behavioral", "hard", {
    mode: "company",
    companyStyle: "apple",
  }),
  q("ap03", "Describe a product decision where less was more.", "product", "medium", {
    mode: "company",
    companyStyle: "apple",
  }),
  q("ap04", "How would you design a seamless offline-first mobile experience?", "system-design", "hard", {
    mode: "company",
    companyStyle: "apple",
    roles: ["software-engineer", "frontend-engineer"],
  }),
  q("ap05", "Tell me about a time collaboration elevated the final outcome.", "behavioral", "medium", {
    mode: "company",
    companyStyle: "apple",
  }),

  q("ms01", "Describe a time you grew others while delivering results.", "behavioral", "medium", {
    mode: "company",
    companyStyle: "microsoft",
    tips: "Microsoft values growth mindset and inclusive collaboration.",
  }),
  q("ms02", "Tell me about a time you learned from failure and applied it.", "behavioral", "medium", {
    mode: "company",
    companyStyle: "microsoft",
  }),
  q("ms03", "How would you design a real-time collaboration feature for Office?", "system-design", "hard", {
    mode: "company",
    companyStyle: "microsoft",
    roles: ["software-engineer", "fullstack-engineer"],
  }),
  q("ms04", "Describe a time you partnered across teams with different goals.", "behavioral", "medium", {
    mode: "company",
    companyStyle: "microsoft",
  }),
  q("ms05", "How do you stay current with technology and share knowledge?", "behavioral", "easy", {
    mode: "company",
    companyStyle: "microsoft",
  }),

  q("st01", "Why do you want to join an early-stage startup?", "behavioral", "easy", {
    mode: "company",
    companyStyle: "startup",
  }),
  q("st02", "Tell me about a time you wore many hats to get something shipped.", "behavioral", "medium", {
    mode: "company",
    companyStyle: "startup",
  }),
  q("st03", "How do you decide what not to build when resources are scarce?", "product", "hard", {
    mode: "company",
    companyStyle: "startup",
  }),
  q("st04", "Describe a time you moved from 0 to 1 on a project.", "behavioral", "hard", {
    mode: "company",
    companyStyle: "startup",
  }),
  q("st05", "How comfortable are you with ambiguity and changing priorities?", "behavioral", "easy", {
    mode: "company",
    companyStyle: "startup",
  }),

  // ========== MORE GENERAL / MIXED FILL ==========
  q("x01", "What questions do you have for us?", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("x02", "How do you stay organized?", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("x03", "Describe your ideal work environment.", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("x04", "How do you handle remote collaboration?", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("x05", "What motivates you professionally?", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("x06", "Tell me about the most complex system you've worked on.", "technical", "hard", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "devops-engineer"],
  }),
  q("x07", "How do you approach code reviews?", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "frontend-engineer", "backend-engineer"],
  }),
  q("x08", "Explain idempotency and why it matters in APIs.", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer"],
  }),
  q("x09", "What is observability? How do logs, metrics, and traces differ?", "technical", "medium", {
    mode: "technical",
    roles: ["devops-engineer", "software-engineer", "backend-engineer"],
  }),
  q("x10", "How would you migrate a monolith to microservices?", "system-design", "hard", {
    mode: "technical",
    roles: ["software-engineer", "engineering-manager", "backend-engineer"],
  }),
  q("x11", "Explain JWT structure and security considerations.", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "fullstack-engineer"],
  }),
  q("x12", "What is the difference between optimistic and pessimistic locking?", "technical", "hard", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer"],
  }),
  q("x13", "How do webhooks work? How would you secure them?", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "fullstack-engineer"],
  }),
  q("x14", "Explain CSS specificity and the cascade.", "technical", "easy", {
    mode: "technical",
    roles: ["frontend-engineer", "fullstack-engineer"],
  }),
  q("x15", "What is server-side rendering vs client-side rendering vs SSG?", "technical", "medium", {
    mode: "technical",
    roles: ["frontend-engineer", "fullstack-engineer", "software-engineer"],
  }),
  q("x16", "How would you design a multi-tenant SaaS architecture?", "system-design", "hard", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer"],
  }),
  q("x17", "Explain message queues and when to use them (Kafka, SQS, RabbitMQ).", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer"],
  }),
  q("x18", "What is blue-green deployment vs canary releases?", "technical", "medium", {
    mode: "technical",
    roles: ["devops-engineer", "software-engineer"],
  }),
  q("x19", "How do you ensure GDPR/privacy compliance in a product?", "situational", "hard", {
    mode: "behavioral",
    roles: ["product-manager", "software-engineer", "data-scientist"],
  }),
  q("x20", "Describe a time you improved team documentation or knowledge sharing.", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("x21", "How do you prepare for a major product demo or presentation?", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("x22", "Tell me about a time you automated a repetitive task.", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("x23", "What is your approach to continuous learning?", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("x24", "Describe a time culture or values influenced a hard decision.", "behavioral", "medium", {
    mode: "behavioral",
    category: "company-culture",
  }),
  q("x25", "How do you build relationships with new teammates quickly?", "behavioral", "easy", {
    mode: "behavioral",
  }),
  q("x26", "Explain polymorphism and encapsulation with examples.", "technical", "easy", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer"],
  }),
  q("x27", "What is a CDN and how does it improve performance?", "technical", "easy", {
    mode: "technical",
    roles: ["software-engineer", "frontend-engineer", "devops-engineer"],
  }),
  q("x28", "How would you handle schema migrations with zero downtime?", "technical", "hard", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "devops-engineer"],
  }),
  q("x29", "Explain map-reduce at a high level.", "technical", "medium", {
    mode: "technical",
    roles: ["data-scientist", "data-analyst", "software-engineer"],
  }),
  q("x30", "What makes a good API? Principles you follow.", "technical", "medium", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer", "fullstack-engineer"],
  }),
  q("x31", "How do you approach technical documentation for APIs?", "technical", "easy", {
    mode: "technical",
    roles: ["software-engineer", "backend-engineer"],
  }),
  q("x32", "Describe how you'd onboard a new engineer in your first 90 days as a lead.", "leadership", "medium", {
    mode: "behavioral",
    roles: ["engineering-manager"],
  }),
  q("x33", "How would you structure OKRs for an engineering team?", "leadership", "hard", {
    mode: "behavioral",
    roles: ["engineering-manager", "product-manager"],
  }),
  q("x34", "Tell me about a negotiation that went well.", "behavioral", "medium", {
    mode: "behavioral",
    roles: ["sales-representative", "account-executive", "product-manager"],
  }),
  q("x35", "How do you create content or messaging that converts?", "technical", "medium", {
    mode: "technical",
    roles: ["marketing-manager", "growth-marketer"],
  }),
  q("x36", "What is customer lifetime value and how do you increase it?", "technical", "medium", {
    mode: "technical",
    roles: ["marketing-manager", "customer-success", "growth-marketer"],
  }),
  q("x37", "Walk me through a competitive analysis you performed.", "behavioral", "medium", {
    mode: "behavioral",
    roles: ["product-manager", "marketing-manager", "business-analyst"],
  }),
  q("x38", "How do you validate a design with users on a tight timeline?", "behavioral", "medium", {
    mode: "behavioral",
    roles: ["ux-designer", "product-designer"],
  }),
  q("x39", "Explain component libraries and design systems benefits.", "technical", "medium", {
    mode: "technical",
    roles: ["ux-designer", "product-designer", "frontend-engineer"],
  }),
  q("x40", "How do you partner with PMs as a designer?", "behavioral", "easy", {
    mode: "behavioral",
    roles: ["ux-designer", "product-designer"],
  }),
  q("x41", "Describe a time you used SQL to answer a business question.", "technical", "medium", {
    mode: "technical",
    roles: ["data-analyst", "business-analyst", "data-scientist"],
  }),
  q("x42", "What is cohort analysis and why is it useful?", "technical", "medium", {
    mode: "technical",
    roles: ["data-analyst", "product-manager", "growth-marketer"],
  }),
  q("x43", "How would you investigate a sudden drop in conversion rate?", "situational", "hard", {
    mode: "behavioral",
    roles: ["data-analyst", "product-manager", "growth-marketer"],
  }),
  q("x44", "Explain regularization in machine learning.", "technical", "medium", {
    mode: "technical",
    roles: ["data-scientist", "ml-engineer"],
  }),
  q("x45", "What is transfer learning and when is it helpful?", "technical", "medium", {
    mode: "technical",
    roles: ["ml-engineer", "data-scientist"],
  }),
  q("x46", "How do you prevent model drift in production?", "technical", "hard", {
    mode: "technical",
    roles: ["ml-engineer", "data-scientist"],
  }),
  q("x47", "Describe a time you had to escalate a risk.", "behavioral", "medium", {
    mode: "behavioral",
    roles: ["project-manager", "product-manager", "engineering-manager"],
  }),
  q("x48", "How do you manage scope creep?", "behavioral", "medium", {
    mode: "behavioral",
    roles: ["project-manager", "product-manager"],
  }),
  q("x49", "What HR metrics would you track for employee engagement?", "technical", "medium", {
    mode: "technical",
    roles: ["hr-business-partner"],
  }),
  q("x50", "Tell me about a time you navigated a sensitive employee issue.", "behavioral", "hard", {
    mode: "behavioral",
    roles: ["hr-business-partner", "engineering-manager"],
  }),
];

export interface QuestionFilter {
  mode?: InterviewMode | "all";
  role?: string | null;
  companyStyle?: CompanyStyle | "general";
  category?: string;
  search?: string;
  difficulty?: string;
  limit?: number;
}

export function getQuestions(filter: QuestionFilter = {}): InterviewQuestion[] {
  let list = [...QUESTIONS];

  if (filter.mode && filter.mode !== "all") {
    if (filter.mode === "mixed") {
      // mixed uses behavioral + technical
      list = list.filter(
        (q) =>
          q.mode === "behavioral" ||
          q.mode === "technical" ||
          q.mode === "all" ||
          q.category === "behavioral" ||
          q.category === "technical" ||
          q.category === "system-design"
      );
    } else if (filter.mode === "company") {
      list = list.filter(
        (q) =>
          q.mode === "company" ||
          (filter.companyStyle && q.companyStyle === filter.companyStyle)
      );
      if (filter.companyStyle && filter.companyStyle !== "general") {
        list = list.filter(
          (q) => !q.companyStyle || q.companyStyle === filter.companyStyle
        );
      }
    } else {
      list = list.filter(
        (q) => q.mode === filter.mode || q.mode === "all" || q.category === filter.mode
      );
    }
  }

  if (filter.role && filter.role !== "custom") {
    const roleId = filter.role.toLowerCase().replace(/\s+/g, "-");
    list = list.filter(
      (q) =>
        q.roles.includes(ALL) ||
        q.roles.includes(roleId) ||
        q.roles.some((r) => roleId.includes(r) || r.includes(roleId))
    );
    // If filter was too aggressive, fall back to general questions
    if (list.length < 5) {
      list = QUESTIONS.filter(
        (q) =>
          q.roles.includes(ALL) &&
          (!filter.mode ||
            filter.mode === "mixed" ||
            q.mode === filter.mode ||
            q.mode === "all" ||
            q.category === filter.mode)
      );
    }
  }

  if (filter.category) {
    list = list.filter((q) => q.category === filter.category);
  }

  if (filter.difficulty) {
    list = list.filter((q) => q.difficulty === filter.difficulty);
  }

  if (filter.search?.trim()) {
    const s = filter.search.toLowerCase();
    list = list.filter(
      (q) =>
        q.text.toLowerCase().includes(s) ||
        q.category.toLowerCase().includes(s) ||
        q.id.toLowerCase().includes(s)
    );
  }

  // Shuffle for interview sessions
  if (filter.limit) {
    list = shuffle(list).slice(0, filter.limit);
  }

  return list;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getQuestionCount(): number {
  return QUESTIONS.length;
}

export const CATEGORIES = [
  "behavioral",
  "technical",
  "system-design",
  "leadership",
  "product",
  "situational",
  "company-culture",
] as const;

export const COMPANY_STYLES: { id: CompanyStyle; label: string; blurb: string }[] = [
  { id: "google", label: "Google", blurb: "Structured problem-solving & GCA" },
  { id: "meta", label: "Meta", blurb: "Impact, speed, and ownership" },
  { id: "amazon", label: "Amazon", blurb: "Leadership Principles deep-dives" },
  { id: "apple", label: "Apple", blurb: "Craft, simplicity, collaboration" },
  { id: "microsoft", label: "Microsoft", blurb: "Growth mindset & partnership" },
  { id: "startup", label: "Startup", blurb: "Ambiguity, speed, wearing many hats" },
  { id: "general", label: "General", blurb: "Broad company-agnostic questions" },
];
