<#
.SYNOPSIS
  Starts the Majlis Fund demo on the LAN: API (4000), web production build (3000) and Expo (8081),
  each in its own PowerShell window. See DEMO.md (pre-demo checklist) before running it.

.DESCRIPTION
  1. Works out the PC's LAN IP: -LanIp, else the host of EXPO_PUBLIC_API_URL in mobile/.env, else the
     first private IPv4 of an "up" Wi-Fi/Ethernet adapter.
  2. Refuses to start when port 3000, 4000 or 8081 is already in use (stop the old servers first).
  3. Optional -Reset: `npm run demo:reset` in backend/ (migrate reset + deterministic seed; refuses any
     database other than the local majlis_fund).
  4. Builds the API and starts `node dist/main` with WEB_ORIGIN extended by the LAN origins (Expo web
     from a phone) and PUBLIC_WEB_URL=http://<LAN-IP>:3000 (QR codes and wa.me links open on phones).
     These are process variables only: backend/.env is not changed.
  5. Builds the web app and starts `next start -H 0.0.0.0` with SESSION_COOKIE_SECURE=false (plain
     HTTP on the LAN; otherwise phones drop the session cookie) and SITE_URL=http://<LAN-IP>:3000.
  6. Starts Expo with REACT_NATIVE_PACKAGER_HOSTNAME=<LAN-IP> so the QR code uses the Wi-Fi address.
     mobile/.env must already point EXPO_PUBLIC_API_URL / EXPO_PUBLIC_SITE_URL at http://<LAN-IP>.

  It never prints secrets (it reads only the EXPO_PUBLIC_API_URL line of mobile/.env).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\demo-start.ps1 -Reset
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\demo-start.ps1 -LanIp 192.168.1.10 -SkipBuild
#>
param(
  [string]$LanIp = '',
  [switch]$Reset,
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$api = Join-Path $root 'backend'
$web = Join-Path $root 'frontend'
$mobile = Join-Path $root 'mobile'

# 1. LAN IP
if (-not $LanIp) {
  $envFile = Join-Path $mobile '.env'
  if (Test-Path $envFile) {
    $line = Select-String -Path $envFile -Pattern '^EXPO_PUBLIC_API_URL=' | Select-Object -First 1
    if ($line -and $line.Line -match 'https?://([0-9.]+)') { $LanIp = $Matches[1] }
  }
}
if (-not $LanIp) {
  $LanIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -match '^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[01]))' -and $_.PrefixOrigin -ne 'WellKnown' } |
    Select-Object -First 1).IPAddress
}
if (-not $LanIp) { throw 'Could not find the LAN IP. Pass -LanIp 192.168.x.x' }
Write-Host "LAN IP: $LanIp" -ForegroundColor Green

# 2. Ports must be free
$busy = Get-NetTCPConnection -LocalPort 3000, 4000, 8081 -State Listen -ErrorAction SilentlyContinue
if ($busy) {
  $busy | ForEach-Object { Write-Host "Port $($_.LocalPort) is used by PID $($_.OwningProcess)" -ForegroundColor Yellow }
  throw 'Stop the old servers first (Stop-Process -Id <PID>).'
}

function Invoke-Step([string]$dir, [string]$command) {
  Write-Host "> ($dir) $command" -ForegroundColor Cyan
  Push-Location $dir
  try {
    & cmd /c $command
    if ($LASTEXITCODE -ne 0) { throw "'$command' failed in $dir" }
  } finally { Pop-Location }
}

function Start-Window([string]$title, [string]$dir, [string]$command) {
  $script = "`$Host.UI.RawUI.WindowTitle = '$title'; Set-Location '$dir'; $command"
  Start-Process powershell -ArgumentList '-NoExit', '-Command', $script | Out-Null
  Write-Host "Started: $title" -ForegroundColor Green
}

# 3. Fresh demo data
if ($Reset) { Invoke-Step $api 'npm run demo:reset' }

# 4. API
if (-not $SkipBuild) { Invoke-Step $api 'npm run build' }
$origins = "http://localhost:3000,http://localhost:8081,http://${LanIp}:3000,http://${LanIp}:8081"
Start-Window 'Majlis API :4000' $api "`$env:WEB_ORIGIN='$origins'; `$env:PUBLIC_WEB_URL='http://${LanIp}:3000'; node dist/main"

# 5. Web (production build on all interfaces)
if (-not $SkipBuild) { Invoke-Step $web 'npm run build' }
Start-Window 'Majlis Web :3000' $web "`$env:SESSION_COOKIE_SECURE='false'; `$env:SITE_URL='http://${LanIp}:3000'; npm start -- -H 0.0.0.0"

# 6. Expo (donor app)
Start-Window 'Majlis Expo :8081' $mobile "`$env:REACT_NATIVE_PACKAGER_HOSTNAME='$LanIp'; npx expo start --port 8081"

Write-Host ''
Write-Host "Projector / PC : http://localhost:3000" -ForegroundColor Green
Write-Host "Phones (Wi-Fi) : http://${LanIp}:3000  (collector: /dashboard/collector)" -ForegroundColor Green
Write-Host "Expo Go        : scan the QR code in the 'Majlis Expo :8081' window" -ForegroundColor Green
Write-Host "Stop           : close the three windows, then check: Get-NetTCPConnection -LocalPort 3000,4000,8081 -State Listen"
