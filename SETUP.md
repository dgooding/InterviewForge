# InterviewForge — Production setup (Supabase + xAI)

Core product features (**resume, interview, history, analytics, guest progress**) work **without** any env vars, using localStorage + local AI heuristics.

Cloud Google/GitHub login and Grok-enhanced feedback need the steps below.

---

## 1. Supabase (Google / GitHub + cross-device sync)

### Create project
1. Go to [supabase.com](https://supabase.com) → New project  
2. **SQL Editor** → paste and run entire file: [`supabase/schema.sql`](./supabase/schema.sql)

### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials  
2. Create **OAuth 2.0 Client ID** (Web)  
3. Authorized redirect URI (from Supabase → Authentication → Providers → Google):  
   `https://<PROJECT_REF>.supabase.co/auth/v1/callback`  
4. Supabase → **Authentication → Providers → Google** → enable → paste Client ID + Secret  

### GitHub OAuth (optional)
1. GitHub → Settings → Developer settings → OAuth Apps  
2. Callback: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`  
3. Supabase → Providers → GitHub → enable  

### URL configuration (Supabase → Authentication → URL)
| Field | Value |
|--------|--------|
| Site URL | `https://interviewforge-zeta.vercel.app` |
| Redirect URLs | `https://interviewforge-zeta.vercel.app/auth/callback` |
| | `http://localhost:3000/auth/callback` |

### Env vars (local + Vercel)

**Local** — copy `.env.example` → `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Vercel** → Project **interviewforge** → Settings → Environment Variables  
(add for Production + Preview):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | from Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `NEXT_PUBLIC_APP_URL` | `https://interviewforge-zeta.vercel.app` |

Then **Redeploy** (Deployments → … → Redeploy).

---

## 2. xAI / Grok (stronger AI feedback)

1. Key: [console.x.ai](https://console.x.ai)  
2. Env (server-only — never `NEXT_PUBLIC_`):

```env
XAI_API_KEY=xai-...
# optional
XAI_MODEL=grok-4.5
```

Add the same on Vercel → Environment Variables → Redeploy.

Without this key, resume analysis and interview scoring still work via the **local coaching engine**.

---

## 3. Verify

```bash
# After deploy
curl https://interviewforge-zeta.vercel.app/api/health
```

Expect:

```json
{
  "ok": true,
  "config": { "supabase": true, "xai": true }
}
```

Also open **Settings** in the app — system status card shows the same flags.

---

## Guest vs signed-in

| Mode | Progress storage | AI |
|------|------------------|-----|
| Guest | Browser only (never uploaded until sign-in) | Local heuristics; + Grok if `XAI_API_KEY` set |
| Google/GitHub | Local + Supabase (RLS, your rows only) | Same |

---

## Feature map (already implemented)

| Feature | Route |
|---------|--------|
| Landing | `/` |
| Dashboard | `/dashboard` |
| Roles | `/roles` |
| Resume Intelligence | `/resume` or `/analyze-resume` |
| Mock interview | `/interview` or `/mock-interview` |
| Question bank | `/questions` |
| Analytics | `/analytics` |
| History + PDF | `/history` |
| Settings / export / delete | `/settings` |
| Login | `/login` |
| FAQ / Privacy | `/faq` · `/privacy` |
