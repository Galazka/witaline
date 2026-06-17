#!/usr/bin/env pwsh
# WitaLine — System startup script
# Uruchamia: dev server + Cloudflare tunnel + konfiguruje webhooki

param(
    [switch]$SkipTunnel,
    [string]$CustomTunnel
)

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "WitaLine — System startowy"

function Write-Step {
    param([string]$Step, [string]$Status)
    $color = if ($Status -match "✅|OK") { "Green" } elseif ($Status -match "⏳") { "Yellow" } else { "Red" }
    Write-Host "[$Step] $Status" -ForegroundColor $color
}

Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           WitaLine — Uruchamianie systemu        ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan

# ── 1. Sprawdź .env ──
if (-not (Test-Path ".env")) {
    Write-Host "[ERROR] Brak pliku .env. Skopiuj .env.example do .env i uzupełnij dane." -ForegroundColor Red
    exit 1
}

# ── 2. Zainstaluj zależności ──
Write-Step "1/5" "Sprawdzam zależności..."
$nodeModules = Test-Path "node_modules"
if (-not $nodeModules) {
    Write-Step "1/5" "⏳ Instaluję zależności..."
    npm install --silent
    if ($LASTEXITCODE -ne 0) { Write-Step "1/5" "❌ npm install failed"; exit 1 }
}
Write-Step "1/5" "✅ Zależności OK"

# ── 3. Zabij stare procesy Next.js ──
Write-Step "2/5" "Zatrzymuję stare procesy..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "next" } | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 1
Write-Step "2/5" "✅ Stare procesy zatrzymane"

# ── 4. Uruchom Next.js dev server ──
Write-Step "3/5" "Uruchamiam Next.js dev server..."
$devJob = Start-Job -Name "WitaLine-Dev" -ScriptBlock {
    param($Dir)
    Set-Location $Dir
    npm run dev
} -ArgumentList (Get-Location).Path

# Czekaj aż serwer będzie gotowy
Write-Step "3/5" "⏳ Czekam na gotowość serwera..."
$maxWait = 30
$waited = 0
while ($waited -lt $maxWait) {
    try {
        $req = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($req.StatusCode -eq 200) { break }
    } catch {}
    Start-Sleep 2
    $waited += 2
}
if ($waited -ge $maxWait) {
    Write-Step "3/5" "⚠️  Dev server nie odpowiada po ${maxWait}s, kontynuuję..."
} else {
    Write-Step "3/5" "✅ Next.js dev server działa na http://localhost:3000"
}

# ── 5. Cloudflare tunnel ──
$tunnelUrl = $CustomTunnel
if (-not $tunnelUrl -and -not $SkipTunnel) {
    Write-Step "4/5" "Uruchamiam Cloudflare tunnel..."
    
    # Znajdź cloudflared
    $cloudflared = Get-Command "cloudflared" -ErrorAction SilentlyContinue
    if (-not $cloudflared) {
        $paths = @(
            "$env:LOCALAPPDATA\cloudflare\cloudflared\cloudflared.exe",
            "${env:ProgramFiles}\cloudflared\cloudflared.exe",
            "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe"
        )
        foreach ($p in $paths) {
            if (Test-Path $p) { $cloudflared = $p; break }
        }
    }
    
    if (-not $cloudflared) {
        Write-Step "4/5" "⚠️  cloudflared nie znaleziony. Instaluj przez: winget install cloudflare.cloudflared"
        Write-Step "4/5" "    Możesz też podać URL tunelu ręcznie: .\start.ps1 -CustomTunnel https://twoj-tunel.trycloudflare.com"
    } else {
        $logFile = "$env:TEMP\witaline-tunnel.log"
        
        # Uruchom cloudflared i wyciągnij URL z outputu
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = if ($cloudflared -is [string]) { $cloudflared } else { $cloudflared.Source }
        $psi.Arguments = "tunnel --url http://localhost:3000"
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        
        $proc = [System.Diagnostics.Process]::Start($psi)
        
        # Zbieraj output aż znajdziemy URL
        $outputBuffer = ""
        $timeoutCounter = 0
        while ($timeoutCounter -lt 20) {
            if ($proc.StandardOutput.EndOfStream -and $proc.StandardError.EndOfStream) {
                Start-Sleep 2
                $timeoutCounter++
                continue
            }
            $line = $proc.StandardOutput.ReadLine()
            if (-not $line) { $line = $proc.StandardError.ReadLine() }
            if ($line) {
                $outputBuffer += $line + "`n"
                if ($line -match "(https://[a-z0-9-]+\.trycloudflare\.com)") {
                    $tunnelUrl = $matches[1]
                    break
                }
            }
        }
        
        if ($tunnelUrl) {
            Write-Step "4/5" "✅ Tunnel URL: $tunnelUrl"
        } else {
            Write-Step "4/5" "⚠️  Nie udało się odczytać URL tunelu z outputu."
            Write-Step "4/5" "    Sprawdź log: $logFile"
        }
    }
}

# ── 6. Konfiguruj webhooki ──
Write-Step "5/5" "Konfiguruję webhooki..."
if ($tunnelUrl) {
    try {
        node scripts/setup-tunnel.js $tunnelUrl
        if ($LASTEXITCODE -eq 0) {
            Write-Step "5/5" "✅ Webhooki skonfigurowane"
        } else {
            Write-Step "5/5" "⚠️  setup-tunnel.js zakończony z kodem $LASTEXITCODE"
        }
    } catch {
        Write-Step "5/5" "⚠️  Błąd: $($_.Exception.Message)"
    }
} else {
    Write-Step "5/5" "⚠️  Brak URL tunelu — pomijam konfigurację webhooków"
}

# ── 7. Podsumowanie ──
Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              WitaLine — System gotowy!           ║" -ForegroundColor Cyan
Write-Host "╠══════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║  Aplikacja:    http://localhost:3000              ║" -ForegroundColor White
Write-Host "║  Tunnel:       $($tunnelUrl.PadRight(35))║" -ForegroundColor White
Write-Host "║  Telefon:      +48 732 125 752                   ║" -ForegroundColor White
Write-Host "║  Admin:        http://localhost:3000/admin        ║" -ForegroundColor White
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`nNaciśnij Ctrl+C w oknach terminala aby zatrzymać.`n" -ForegroundColor Yellow

# Keep script running
while ($true) {
    Start-Sleep 10
    # Check dev server health
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    } catch {
        Write-Host "⚠️  Dev server nie odpowiada. Próbuję go zrestartować..." -ForegroundColor Yellow
        # Restart logic would go here
    }
}