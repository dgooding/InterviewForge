# InterviewForge

**Master Any Interview with AI**

InterviewForge is a production-ready, full-stack **AI-Powered Job Interview Prep Platform** built with Next.js 14 (App Router), TypeScript, and Tailwind CSS. It delivers mock interviews, resume analysis, performance analytics, and exportable coaching reports — designed as a polished SaaS-style proof of concept.

---

## Screenshots

> Add screenshots after running locally:

| Landing | Dashboard | Live Interview |
|---------|-----------|----------------|
| `docs/screenshots/landing.png` | `docs/screenshots/dashboard.png` | `docs/screenshots/interview.png` |

| Analytics | Resume Analysis | History / PDF |
|-----------|-----------------|---------------|
| `docs/screenshots/analytics.png` | `docs/screenshots/resume.png` | `docs/screenshots/history.png` |

---

## Features

1. **Landing page** — Hero, feature grid, testimonials, CTA  
2. **No authentication** — Open the app immediately; progress saved in localStorage  
3. **Dashboard** — Scores, streak, recommendations, recent sessions  
4. **Job role selector** — Searchable roles + custom role input  
5. **Resume upload & analysis** — Drag-and-drop PDF/TXT → strengths & talking points  
6. **Interview modes** — Behavioral, Technical, Mixed (12Q), Company-specific  
7. **Live mock simulator** — Timer, text + Web Speech API recording, AI feedback, follow-ups  
8. **AI feedback engine** — Clarity, relevance, STAR/structure, technical, confidence  
9. **Analytics** — Recharts trends, radar category scores, weak areas  
10. **Question bank** — **200+** filterable questions  
11. **History & PDF reports** — jsPDF export  
12. **Polish** — Dark/light mode, Framer Motion, toasts, confetti on high scores, mobile-first UI  

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn-style Radix UI |
| Charts | Recharts |
| Motion | Framer Motion |
| Icons | lucide-react |
| PDF | jsPDF + jspdf-autotable |
| Voice | Web Speech API |
| AI | **SpaceXAI / xAI** (`XAI_API_KEY`) with local heuristic fallback |
| Persistence | localStorage (Supabase schema documented in code) |

### Why these decisions?

- **No auth barrier** — Instant demo experience; a local profile is auto-created for streak/PDF labels only.  
- **localStorage first** — Zero-setup demo; easy to pitch without a backend. Migration path + SQL schema live in `lib/storage.ts`.  
- **Heuristic AI + optional xAI** — Works offline out of the box; add `XAI_API_KEY` for Grok-powered feedback.  
- **Deep blue / purple palette** — Premium SaaS aesthetic with glass cards and soft glows.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm  
- (Optional) [xAI API key](https://console.x.ai) for enhanced AI feedback  

### Install & run

```bash
cd InterviewForge
npm install
cp .env.example .env.local
# Optional: set XAI_API_KEY in .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |

---

## Environment Variables

Copy `.env.example` → `.env.local`:

```env
XAI_API_KEY=your_xai_api_key_here
# XAI_MODEL=grok-4.5
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Without `XAI_API_KEY`, resume analysis and answer feedback use the built-in local coaching engine (always available).

---

## Project Structure

```
InterviewForge/
├── app/
│   ├── api/
│   │   ├── feedback/route.ts   # AI answer scoring (xAI + local)
│   │   └── resume/route.ts     # Resume analysis
│   ├── analytics/
│   ├── dashboard/
│   ├── history/
│   ├── interview/
│   ├── questions/
│   ├── resume/
│   ├── roles/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Landing
├── components/
│   ├── ui/                     # Button, Card, Input, …
│   ├── layout/                 # Navbar
│   ├── feedback-panel.tsx
│   └── providers.tsx           # App state + theme
├── lib/
│   ├── auth.ts
│   ├── ai-feedback.ts
│   ├── questions.ts            # 200+ questions
│   ├── roles.ts
│   ├── storage.ts              # localStorage + Supabase notes
│   ├── stats.ts
│   ├── speech.ts
│   ├── pdf-report.ts
│   ├── types.ts
│   └── utils.ts
├── .env.example
├── package.json
└── README.md
```

---

## Deploy to Vercel

1. Push this repo to GitHub (commands below).  
2. Import the project at [vercel.com/new](https://vercel.com/new).  
3. Add env var `XAI_API_KEY` (optional but recommended).  
4. Deploy — Vercel auto-detects Next.js.

```bash
npx vercel
# or connect via the Vercel dashboard
```

---

## Future Roadmap

- [ ] Optional auth (NextAuth / Clerk) + multi-device sync  
- [ ] Supabase/Postgres persistence (schema already sketched)  
- [ ] Streaming AI feedback & practice plans  
- [ ] Video mock interviews  
- [ ] Team / coach dashboards  
- [ ] Stripe billing for Pro tiers  
- [ ] Mobile apps (React Native shared API)  

---

## GitHub: create repo, commit, push

Run from the project root (`InterviewForge/`):

```bash
# 1. Create a new GitHub repository (requires GitHub CLI)
gh repo create InterviewForge --public --source=. --remote=origin --description "AI-Powered Job Interview Prep Platform"

# 2. If you prefer the website instead:
#    Create an empty repo at https://github.com/new named InterviewForge
#    then:
#    git remote add origin https://github.com/YOUR_USERNAME/InterviewForge.git

# 3. Initialize git (if not already)
git init
git branch -M main

# 4. Add, commit, push
git add .
git commit -m "Initial commit: InterviewForge AI interview prep platform"
git push -u origin main
```

Without GitHub CLI:

```bash
git init
git branch -M main
git add .
git commit -m "Initial commit: InterviewForge AI interview prep platform"
git remote add origin https://github.com/YOUR_USERNAME/InterviewForge.git
git push -u origin main
```

---

## License

MIT — use this as a portfolio piece, demo, or foundation for a product.

---

Built with care as a **strong proof-of-concept** for AI interview coaching.
