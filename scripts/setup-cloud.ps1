# InterviewForge one-shot cloud setup
# Run in PowerShell:  cd C:\Users\danie\InterviewForge; .\scripts\setup-cloud.ps1
# Opens browsers, then you paste keys once. Script writes .env.local, Vercel env, redeploys.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host ""
Write-Host "=== InterviewForge cloud setup ===" -ForegroundColor Cyan
Write-Host "Guest mode already works. This enables Google login + cloud save." -ForegroundColor Gray
Write-Host ""

# --- Open required pages ---
Write-Host "Opening setup pages in your browser..." -ForegroundColor Yellow
Start-Process "https://supabase.com/dashboard/projects"
Start-Sleep -Seconds 1
Start-Process "https://console.cloud.google.com/apis/credentials"
Start-Sleep -Seconds 1
Start-Process "https://vercel.com/dgoodings-projects/interviewforge/settings/environment-variables"
Start-Sleep -Seconds 1
Start-Process "https://github.com/dgooding/InterviewForge/blob/main/supabase/schema.sql"

Write-Host ""
Write-Host "Do these steps in the browser (checklist):" -ForegroundColor Cyan
Write-Host "  1. Supabase: New project (or open existing)."
Write-Host "  2. SQL Editor: paste schema.sql from GitHub tab, Run."
Write-Host "  3. Settings > API: copy Project URL + anon key."
Write-Host "  4. Auth > URL Configuration:"
Write-Host "       Site URL: https://interviewforge-zeta.vercel.app"
Write-Host "       Redirect: https://interviewforge-zeta.vercel.app/auth/callback"
Write-Host "                 http://localhost:3000/auth/callback"
Write-Host "  5. Google Cloud: OAuth Web client, redirect URI:"
Write-Host "       https://YOUR_REF.supabase.co/auth/v1/callback"
Write-Host "  6. Supabase Auth > Providers > Google: paste Client ID + Secret, Save."
Write-Host ""
Write-Host "When you have the keys, paste them below." -ForegroundColor Yellow
Write-Host ""

$supabaseUrl = Read-Host "NEXT_PUBLIC_SUPABASE_URL (https://xxxx.supabase.co)"
$anonKey = Read-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY (eyJ...)"
$xai = Read-Host "XAI_API_KEY (optional, press Enter to skip)"
$appUrl = "https://interviewforge-zeta.vercel.app"

if (-not $supabaseUrl -or -not $anonKey) {
  Write-Host "URL and anon key are required. Exiting." -ForegroundColor Red
  exit 1
}

$supabaseUrl = $supabaseUrl.Trim()
$anonKey = $anonKey.Trim()

# --- .env.local ---
$envLocal = @"
NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey
NEXT_PUBLIC_APP_URL=$appUrl
"@
if ($xai -and $xai.Trim().Length -gt 0) {
  $envLocal += "`nXAI_API_KEY=$($xai.Trim())`n"
}
$envLocal | Set-Content -Path ".env.local" -Encoding utf8
Write-Host "Wrote .env.local" -ForegroundColor Green

# --- Vercel env (non-interactive) ---
function Set-VercelEnv([string]$name, [string]$value) {
  Write-Host "Setting Vercel $name ..." -ForegroundColor Gray
  # Remove existing if present (ignore errors)
  echo "y" | npx vercel env rm $name production 2>$null | Out-Null
  $value | npx vercel env add $name production
}

Write-Host ""
Write-Host "Pushing env vars to Vercel production..." -ForegroundColor Yellow
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# vercel env add reads value from stdin
$supabaseUrl | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production --force 2>&1
$anonKey | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --force 2>&1
$appUrl | npx vercel env add NEXT_PUBLIC_APP_URL production --force 2>&1
if ($xai -and $xai.Trim().Length -gt 0) {
  $xai.Trim() | npx vercel env add XAI_API_KEY production --force 2>&1
}

Write-Host ""
Write-Host "Redeploying production..." -ForegroundColor Yellow
npx vercel --prod --yes

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
Write-Host "Check: https://interviewforge-zeta.vercel.app/api/health"
Write-Host "Login:  https://interviewforge-zeta.vercel.app/login"
Write-Host "Expect config.supabase: true after deploy finishes."
Write-Host ""
