# Exact Google OAuth setup for InterviewForge

Your Supabase project ref: **`rdalzpkjkoixawanravg`**

## Step 1 — Google Cloud (2–3 minutes)

1. Open https://console.cloud.google.com/apis/credentials  
2. Select or create a Google Cloud project.  
3. If prompted, configure **OAuth consent screen**:
   - User type: **External**
   - App name: `InterviewForge`
   - User support email: your email
   - Developer contact: your email
   - Save → continue (scopes can stay default)
   - Add yourself as a **test user** if app is in Testing mode  
4. **Credentials** → **+ Create credentials** → **OAuth client ID**  
5. Application type: **Web application**  
6. Name: `InterviewForge Supabase`  
7. Under **Authorized redirect URIs** → **Add URI** — paste **exactly**:

```
https://rdalzpkjkoixawanravg.supabase.co/auth/v1/callback
```

8. **Create** → copy:
   - Client ID  
   - Client secret  

## Step 2 — Supabase (1 minute)

1. Open https://supabase.com/dashboard/project/rdalzpkjkoixawanravg/auth/providers  
2. Open **Google**  
3. Enable  
4. Paste **Client ID** and **Client secret**  
5. Save  

## Step 3 — Test

1. https://interviewforge-zeta.vercel.app/login  
2. **Continue with Google**  

---

## Works right now without Google

Use **Email magic link** on the login page — already live after deploy.
