# InterviewForge — Production Audit

**Date:** 2026-07-11  
**Live:** https://interviewforge-zeta.vercel.app  
**Stack:** Next.js 14 App Router, TypeScript, Tailwind, Supabase (optional), xAI optional

## Project structure (source)

```
app/           # Routes + API
components/    # UI, layout, feedback, onboarding
lib/           # domain logic, storage, cloud, AI
public/        # PWA manifest + icon
supabase/      # SQL schema + RLS
```

## Routes

| Route | Status | Notes |
|-------|--------|--------|
| `/` | OK | Landing, linked feature cards |
| `/dashboard` | OK | Stats, chart, recommendations |
| `/roles` | OK | Search + custom role |
| `/resume`, `/analyze-resume` | OK | PDF/txt, ATS, copy, offline |
| `/interview`, `/mock-interview` | OK | Modes, JD, pause, coach, voice |
| `/questions` | OK | 200+ bank |
| `/analytics` | OK | Recharts |
| `/history` | OK | Search/filter/PDF |
| `/settings` | OK | Privacy, export, delete |
| `/login` | OK | Google/GitHub when configured |
| `/auth/callback` | OK | OAuth PKCE |
| `/faq`, `/privacy` | OK | Content pages |
| `/signup` | Redirect → login | |

## What works

- Local-first progress + optional cloud migrate
- Mock interviews (timed/untimed, company, JD, system design)
- Resume intelligence + ATS heuristic
- Feedback panel + PDF export
- Dark/light theme, toasts, confetti, onboarding, shortcuts (`?`)

## Gaps / config (ops, not code)

- Supabase env required for real Google/GitHub cross-device sync
- `XAI_API_KEY` optional for stronger AI
- No formal email/password auth (OAuth only)
- Next remains on 14 (stable); not upgraded to 15 to avoid risk

## Testing checklist

1. Guest: complete interview → refresh → history persists  
2. Resume upload PDF + paste → ATS + copy buttons  
3. Interview JD mode with sample JD  
4. Pause/resume mid-question  
5. Coach tip panel  
6. History search/filter + PDF  
7. Settings export/delete  
8. Keyboard `g` then `d`/`i`  
9. FAQ/privacy/footer links  
10. With Supabase: login migrates local data  

## Prioritized remaining ideas

1. Wire Supabase env on Vercel (ops)  
2. Email magic link (Supabase)  
3. True IndexedDB for large histories  
4. Video mock / deeper speech metrics  
5. Full WCAG audit with axe  
