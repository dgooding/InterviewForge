# Enable Google and/or GitHub OAuth on InterviewForge Supabase project.
# Usage:
#   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
#   $env:GOOGLE_CLIENT_ID = "....apps.googleusercontent.com"
#   $env:GOOGLE_CLIENT_SECRET = "GOCSPX-..."
#   $env:GITHUB_CLIENT_ID = "Iv1...."   # optional
#   $env:GITHUB_CLIENT_SECRET = "..."   # optional
#   .\scripts\enable-oauth-providers.ps1

$ErrorActionPreference = "Stop"
$token = $env:SUPABASE_ACCESS_TOKEN
$ref = if ($env:SUPABASE_PROJECT_REF) { $env:SUPABASE_PROJECT_REF } else { "rdalzpkjkoixawanravg" }

if (-not $token) {
  Write-Host "Set SUPABASE_ACCESS_TOKEN first (https://supabase.com/dashboard/account/tokens)" -ForegroundColor Red
  exit 1
}

$h = @{
  Authorization = "Bearer $token"
  Accept        = "application/json"
  "Content-Type"= "application/json"
}

$body = @{}

if ($env:GOOGLE_CLIENT_ID -and $env:GOOGLE_CLIENT_SECRET) {
  $body.external_google_enabled = $true
  $body.external_google_client_id = $env:GOOGLE_CLIENT_ID.Trim()
  $body.external_google_secret = $env:GOOGLE_CLIENT_SECRET.Trim()
  Write-Host "Will enable Google" -ForegroundColor Cyan
}

if ($env:GITHUB_CLIENT_ID -and $env:GITHUB_CLIENT_SECRET) {
  $body.external_github_enabled = $true
  $body.external_github_client_id = $env:GITHUB_CLIENT_ID.Trim()
  $body.external_github_secret = $env:GITHUB_CLIENT_SECRET.Trim()
  Write-Host "Will enable GitHub" -ForegroundColor Cyan
}

if ($body.Count -eq 0) {
  Write-Host "Set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET and/or GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET" -ForegroundColor Red
  exit 1
}

$body.site_url = "https://interviewforge-zeta.vercel.app"
$body.uri_allow_list = "https://interviewforge-zeta.vercel.app/**,https://interviewforge-zeta.vercel.app/auth/callback,http://localhost:3000/**,http://localhost:3000/auth/callback"
$body.external_email_enabled = $true

$json = $body | ConvertTo-Json
Write-Host "Patching auth config for $ref ..."
try {
  Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ref/config/auth" -Headers $h -Method Patch -Body $json | Out-Null
  Write-Host "Success. Test: https://interviewforge-zeta.vercel.app/login" -ForegroundColor Green
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  exit 1
}

# Flip public flags on Vercel so UI shows buttons as live
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Set-Location (Join-Path $PSScriptRoot "..")
if ($body.external_google_enabled) {
  echo y | npx vercel env rm NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED production 2>$null | Out-Null
  "true" | npx vercel env add NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED production
}
if ($body.external_github_enabled) {
  echo y | npx vercel env rm NEXT_PUBLIC_GITHUB_OAUTH_ENABLED production 2>$null | Out-Null
  "true" | npx vercel env add NEXT_PUBLIC_GITHUB_OAUTH_ENABLED production
}
npx vercel --prod --yes
