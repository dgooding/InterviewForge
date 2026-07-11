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
2. **Privacy-first progress** — Guest data is **100% local** until optional Google/GitHub sign-in; then local merges to private Supabase account (RLS). Settings: export / delete.  

3. **Dashboard** — Scores, streak, recommendations, recent sessions  
4. **Job role selector** — Searchable roles + custom role input  
5. **Resume upload & analysis** — Drag-and-drop PDF/TXT → strengths & talking points  
6. **Interview modes** — Behavioral, Technical, Mixed (12Q), Company-specific  
7. **Live mock simulator** — Timer, text + Web Speech API recording, AI feedback, follow-ups  
8. **AI feedback engine** — Clarity, relevance, STAR/structure, technical, confidence  
9. **Analytics** — Recharts trends, radar category scores, weak areas  
10. **Question bank** — **500+** filterable questions  
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
| Auth | Supabase Auth (Google OAuth) |
| Persistence | localStorage always + Supabase Postgres when signed in |

### Why these decisions?

- **Google login optional** — Guest mode works immediately; sign in to sync progress.  
- **localStorage + cloud** — Offline-first UI with Supabase as the source of truth when authenticated.  
- **Heuristic AI + optional xAI** — Works offline; add `XAI_API_KEY` for Grok-powered feedback.  
- **Deep blue / purple palette** — Premium SaaS aesthetic with glass cards and soft glows.

---

## Google login & cloud progress (setup)

Code is ready. You need a free Supabase project + Google OAuth credentials:

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).  
2. **SQL Editor** → paste and run [`supabase/schema.sql`](./supabase/schema.sql).  
3. **Project Settings → API** → copy **Project URL** and **anon public** key.

### 2. Google Cloud OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.  
2. Create **OAuth 2.0 Client ID** (Web application).  
3. Authorized redirect URI (from Supabase):  
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`  
4. Copy Client ID + Client Secret.

### 3. Enable Google in Supabase

1. Supabase → **Authentication → Providers → Google** → enable.  
2. Paste Client ID + Secret.  
3. **Authentication → URL Configuration**:  
   - **Site URL:** `https://interviewforge-zeta.vercel.app` (and `http://localhost:3000` for local)  
   - **Redirect URLs:**  
     - `http://localhost:3000/auth/callback`  
     - `https://interviewforge-zeta.vercel.app/auth/callback`

### 4. Environment variables

Local (`.env.local`) and **Vercel → Project → Settings → Environment Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=https://interviewforge-zeta.vercel.app
```

Redeploy after adding env vars. Then open **/login** → **Continue with Google**.

What syncs when signed in:

| Data | Cloud table |
|------|-------------|
| Profile, streak, preferred role | `profiles` |
| Mock interview sessions + answers | `interview_sessions` |
| Resume analysis | `resume_analyses` |

Guest practice on a device **merges into your account** the first time you sign in on that browser.

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
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Without `XAI_API_KEY`, feedback uses the local coaching engine.  
Without Supabase vars, the app still runs in **guest / localStorage** mode (no Google button effect until configured).

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
│   ├── questions.ts            # 500+ questions
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
