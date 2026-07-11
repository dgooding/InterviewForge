# InterviewForge — apply Google OAuth + Supabase auth config
# Usage:
#   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
#   $env:GOOGLE_CLIENT_ID = "....apps.googleusercontent.com"
#   $env:GOOGLE_CLIENT_SECRET = "GOCSPX-..."
#   .\scripts\apply-google-oauth.ps1

$ErrorActionPreference = "Stop"
$ref = "rdalzpkjkoixawanravg"
$clientId = if ($env:GOOGLE_CLIENT_ID) { $env:GOOGLE_CLIENT_ID.Trim() } else { "170042599086-htoa2qhhcs9nvrnkaksrpk3e1alsu94b.apps.googleusercontent.com" }
$clientSecret = $env:GOOGLE_CLIENT_SECRET
$token = $env:SUPABASE_ACCESS_TOKEN

if (-not $token) { throw "Set SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)" }
if (-not $clientSecret) { throw "Set GOOGLE_CLIENT_SECRET (Google Cloud → Credentials → Web client → Reset secret)" }

# Validate secret against Google
$redirect = "https://rdalzpkjkoixawanravg.supabase.co/auth/v1/callback"
$body = "code=4%2F0AINVALID&client_id=$([uri]::EscapeDataString($clientId))&client_secret=$([uri]::EscapeDataString($clientSecret))&redirect_uri=$([uri]::EscapeDataString($redirect))&grant_type=authorization_code"
$resp = curl.exe -s -X POST "https://oauth2.googleapis.com/token" -H "Content-Type: application/x-www-form-urlencoded" -d $body
Write-Host "Google token probe: $resp"
if ($resp -match 'invalid_client' -and $resp -match 'client secret is invalid') {
  throw "Google rejected this Client Secret for this Client ID. Reset secret in Google Console and try again."
}
if ($resp -match 'OAuth client was not found') {
  throw "Google Client ID not found. Use a classic Web client (*.apps.googleusercontent.com)."
}
Write-Host "Secret is accepted by Google (invalid_grant expected for fake code)." -ForegroundColor Green

$h = @{
  Authorization = "Bearer $token"
  "Content-Type" = "application/json"
  Accept = "application/json"
}

$authBody = @{
  external_google_enabled = $true
  external_google_client_id = $clientId
  external_google_secret = $clientSecret
  site_url = "https://interviewforge-zeta.vercel.app"
  uri_allow_list = "https://interviewforge-zeta.vercel.app/**,https://interviewforge-zeta.vercel.app/auth/callback,http://localhost:3000/**,http://localhost:3000/auth/callback,http://127.0.0.1:3000/**,http://127.0.0.1:3000/auth/callback"
  external_email_enabled = $true
} | ConvertTo-Json

Write-Host "Patching Supabase auth config..."
try {
  Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ref/config/auth" -Headers $h -Method Patch -Body $authBody | Out-Null
  Write-Host "Supabase Google + URL config updated." -ForegroundColor Green
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  throw
}

Write-Host "Done. Test: https://interviewforge-zeta.vercel.app/login"
