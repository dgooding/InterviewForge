# InterviewForge — exact Google OAuth configuration

**Supabase ref:** `rdalzpkjkoixawanravg`  
**Production app:** `https://interviewforge-zeta.vercel.app`  
**GCP project:** `interviewforge-auth-37599`

---

## 1. Google Cloud Console

### OAuth consent screen
- App name: **InterviewForge** (this brands the Google screen, not “Supabase”)
- User type: External
- Support / developer email: yours
- If **Testing**: add every login email under **Test users**

### OAuth Client — type **Web application**

| Field | Exact value |
|--------|-------------|
| Name | `InterviewForge Supabase` |
| **Authorized JavaScript origins** | `https://interviewforge-zeta.vercel.app` |
| | `http://localhost:3000` |
| | `https://interviewforge-auth-37599.web.app` (ID-token bridge) |
| | `https://interviewforge-auth-37599.firebaseapp.com` |
| **Authorized redirect URIs** | `https://rdalzpkjkoixawanravg.supabase.co/auth/v1/callback` |

**Critical:** Google’s redirect URI is the **Supabase** callback, not Vercel.

After create/reset, copy **Client ID** + **Client secret** (`GOCSPX-…`).

Deep link (current client):

```
https://console.cloud.google.com/apis/credentials/oauthclient/170042599086-htoa2qhhcs9nvrnkaksrpk3e1alsu94b.apps.googleusercontent.com?project=interviewforge-auth-37599
```

---

## 2. Supabase Dashboard

### Authentication → Providers → Google
https://supabase.com/dashboard/project/rdalzpkjkoixawanravg/auth/providers

| Field | Value |
|--------|--------|
| Enable Google | ON |
| Client ID | `….apps.googleusercontent.com` (same web client) |
| Client Secret | matching `GOCSPX-…` (reset if exchange fails) |

### Authentication → URL Configuration
https://supabase.com/dashboard/project/rdalzpkjkoixawanravg/auth/url-configuration

| Field | Value |
|--------|--------|
| **Site URL** | `https://interviewforge-zeta.vercel.app` |
| **Redirect URLs** | see below |

```
https://interviewforge-zeta.vercel.app/**
https://interviewforge-zeta.vercel.app/auth/callback
http://localhost:3000/**
http://localhost:3000/auth/callback
http://127.0.0.1:3000/**
http://127.0.0.1:3000/auth/callback
```

---

## 3. Apply via script (recommended)

```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_..."   # https://supabase.com/dashboard/account/tokens
$env:GOOGLE_CLIENT_ID = "170042599086-htoa2qhhcs9nvrnkaksrpk3e1alsu94b.apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET = "GOCSPX-..." # from Google after Reset secret
cd C:\Users\danie\InterviewForge
.\scripts\apply-google-oauth.ps1
```

The script validates the secret with Google, then PATCHes Supabase auth config.

---

## 4. App / env

```bash
NEXT_PUBLIC_SUPABASE_URL=https://rdalzpkjkoixawanravg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=https://interviewforge-zeta.vercel.app
NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true
# auto | oauth | id_token
NEXT_PUBLIC_GOOGLE_AUTH_MODE=auto
```

- `redirectTo` for OAuth = `${origin}/auth/callback` (app)
- PKCE exchange = `app/auth/callback/route.ts` + `@supabase/ssr` cookies
- `id_token` mode uses Firebase bridge popup (no client secret needed for exchange)

After a valid secret is in Supabase, set:

```bash
NEXT_PUBLIC_GOOGLE_AUTH_MODE=oauth
```

---

## 5. Test

1. Incognito → https://interviewforge-zeta.vercel.app/login  
2. Continue with Google  
3. Expect dashboard + user in Supabase → Authentication → Users  

| Error | Fix |
|--------|-----|
| `Unable to exchange external code` | Reset Google secret → paste into Supabase (same web client) |
| `redirect_uri_mismatch` | Google redirect URI = exact Supabase `/auth/v1/callback` |
| `PKCE code verifier not found` | Same browser; don’t clear cookies mid-flow |
| Popup blocked | Allow popups or set `GOOGLE_AUTH_MODE=oauth` |

---

## 6. Flow diagram

```
OAuth mode:
  App → Supabase authorize → Google
     → https://…supabase.co/auth/v1/callback   (secret exchange)
     → https://interviewforge-zeta.vercel.app/auth/callback?code=
     → session cookies → /dashboard

ID-token mode:
  App popup → interviewforge-auth-37599.web.app (GIS)
     → postMessage credential
     → supabase.auth.signInWithIdToken → /dashboard
```
