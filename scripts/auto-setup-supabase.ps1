# Fully automated Supabase project + Vercel env + redeploy
# Requires: SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)
# Usage:
#   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
#   .\scripts\auto-setup-supabase.ps1

$ErrorActionPreference = "Stop"
$Api = "https://api.supabase.com/v1"
$Token = $env:SUPABASE_ACCESS_TOKEN

if (-not $Token) {
  Write-Host "Missing SUPABASE_ACCESS_TOKEN" -ForegroundColor Red
  Write-Host "1. Open https://supabase.com/dashboard/account/tokens"
  Write-Host "2. Generate token, then:"
  Write-Host '   $env:SUPABASE_ACCESS_TOKEN = "sbp_your_token"'
  Write-Host "   .\scripts\auto-setup-supabase.ps1"
  exit 1
}

$headers = @{
  Authorization = "Bearer $Token"
  "Content-Type" = "application/json"
}

Write-Host "Fetching organizations..." -ForegroundColor Cyan
$orgs = Invoke-RestMethod -Uri "$Api/organizations" -Headers $headers
if (-not $orgs -or $orgs.Count -eq 0) {
  throw "No Supabase organizations. Create one at https://supabase.com/dashboard"
}
$orgId = $orgs[0].id
Write-Host "Using org: $($orgs[0].name) ($orgId)" -ForegroundColor Green

# Check existing projects
$projects = Invoke-RestMethod -Uri "$Api/projects" -Headers $headers
$existing = $projects | Where-Object { $_.name -eq "interviewforge" } | Select-Object -First 1

if ($existing) {
  Write-Host "Project interviewforge already exists: $($existing.id)" -ForegroundColor Yellow
  $ref = $existing.id
} else {
  $dbPass = -join ((48..57 + 65..90 + 97..122 | Get-Random -Count 24 | ForEach-Object { [char]$_ }))
  $body = @{
    name            = "interviewforge"
    organization_id = $orgId
    region          = "us-east-1"
    db_pass         = $dbPass
  } | ConvertTo-Json

  Write-Host "Creating project interviewforge (us-east-1)..." -ForegroundColor Cyan
  try {
    $created = Invoke-RestMethod -Uri "$Api/projects" -Headers $headers -Method Post -Body $body
    $ref = $created.id
    Write-Host "Created project ref: $ref" -ForegroundColor Green
    Write-Host "Waiting for project to become ACTIVE..." -ForegroundColor Yellow
    for ($i = 0; $i -lt 60; $i++) {
      Start-Sleep -Seconds 5
      $p = Invoke-RestMethod -Uri "$Api/projects/$ref" -Headers $headers
      Write-Host "  status: $($p.status)"
      if ($p.status -eq "ACTIVE_HEALTHY" -or $p.status -eq "ACTIVE_UNHEALTHY" -or $p.status -eq "ACTIVE") {
        break
      }
    }
  } catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
    throw
  }
}

$supabaseUrl = "https://$ref.supabase.co"
Write-Host "Project URL: $supabaseUrl" -ForegroundColor Green

# API keys
Write-Host "Fetching API keys..." -ForegroundColor Cyan
$keys = Invoke-RestMethod -Uri "$Api/projects/$ref/api-keys" -Headers $headers
$anon = ($keys | Where-Object { $_.name -eq "anon" -or $_.name -eq "anon key" } | Select-Object -First 1).api_key
if (-not $anon) {
  # newer API shape
  $anon = ($keys | Where-Object { $_.name -match "anon" } | Select-Object -First 1).api_key
}
if (-not $anon -and $keys[0].api_key) {
  $anon = ($keys | Where-Object { $_.name -eq "anon" }).api_key
}
# Fallback structure
if (-not $anon) {
  Write-Host ($keys | ConvertTo-Json -Depth 5)
  throw "Could not find anon key in API response"
}
Write-Host "Got anon key (length $($anon.Length))" -ForegroundColor Green

# Run schema via database query API if available
$schemaPath = Join-Path $PSScriptRoot "..\supabase\schema.sql"
$schema = Get-Content $schemaPath -Raw

Write-Host "Applying schema SQL..." -ForegroundColor Cyan
# Management API: POST /v1/projects/{ref}/database/query
try {
  $sqlBody = @{ query = $schema } | ConvertTo-Json -Depth 3
  Invoke-RestMethod -Uri "$Api/projects/$ref/database/query" -Headers $headers -Method Post -Body $sqlBody | Out-Null
  Write-Host "Schema applied." -ForegroundColor Green
} catch {
  Write-Host "Auto SQL apply failed (you can run schema.sql in SQL Editor)." -ForegroundColor Yellow
  Write-Host $_.Exception.Message
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
}

# Auth URL config
Write-Host "Configuring auth URLs..." -ForegroundColor Cyan
try {
  $authBody = @{
    site_url = "https://interviewforge-zeta.vercel.app"
    uri_allow_list = "https://interviewforge-zeta.vercel.app/auth/callback,http://localhost:3000/auth/callback"
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$Api/projects/$ref/config/auth" -Headers $headers -Method Patch -Body $authBody | Out-Null
  Write-Host "Auth URLs configured." -ForegroundColor Green
} catch {
  Write-Host "Auth URL patch skipped (set manually if needed)." -ForegroundColor Yellow
}

# Write .env.local
$appUrl = "https://interviewforge-zeta.vercel.app"
@"
NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anon
NEXT_PUBLIC_APP_URL=$appUrl
"@ | Set-Content -Path (Join-Path $PSScriptRoot "..\.env.local") -Encoding utf8
Write-Host "Wrote .env.local" -ForegroundColor Green

# Vercel env
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Set-Location (Join-Path $PSScriptRoot "..")

function Add-VercelEnv($name, $value) {
  Write-Host "Vercel env: $name" -ForegroundColor Gray
  # --force overwrites if supported
  $value | npx vercel env add $name production 2>&1 | Out-String | Write-Host
}

Write-Host "Setting Vercel production env vars..." -ForegroundColor Cyan
# Remove old if any (ignore fail)
echo "y" | npx vercel env rm NEXT_PUBLIC_SUPABASE_URL production 2>$null | Out-Null
echo "y" | npx vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production 2>$null | Out-Null
echo "y" | npx vercel env rm NEXT_PUBLIC_APP_URL production 2>$null | Out-Null

$supabaseUrl | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
$anon | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
$appUrl | npx vercel env add NEXT_PUBLIC_APP_URL production

Write-Host "Redeploying..." -ForegroundColor Cyan
npx vercel --prod --yes

Write-Host ""
Write-Host "=== SUCCESS ===" -ForegroundColor Green
Write-Host "URL:  $supabaseUrl"
Write-Host "Check: https://interviewforge-zeta.vercel.app/api/health"
Write-Host ""
Write-Host "Google login still needs Google Cloud OAuth Client ID/Secret in Supabase:" -ForegroundColor Yellow
Write-Host "  Auth > Providers > Google"
Write-Host "  Redirect URI for Google: https://$ref.supabase.co/auth/v1/callback"
Write-Host ""
Write-Host "Project ref: $ref"
