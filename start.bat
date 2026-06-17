@echo off
chcp 65001 >nul
title WitaLine - System startowy
cls
echo ╔══════════════════════════════════════════════════╗
echo ║           WitaLine — Uruchamianie systemu        ║
echo ╚══════════════════════════════════════════════════╝
echo.

:: ── 1. Sprawdź czy .env istnieje ──
if not exist ".env" (
    echo [ERROR] Brak pliku .env. Skopiuj .env.example do .env i uzupelnij dane.
    pause
    exit /b 1
)

:: ── 2. Znajdź cloudflared ──
set CLOUDFLARED=cloudflared
where cloudflared >nul 2>&1
if %ERRORLEVEL% neq 0 (
    :: Szukaj w typowych lokalizacjach
    if exist "%LOCALAPPDATA%\cloudflare\cloudflared\cloudflared.exe" set CLOUDFLARED="%LOCALAPPDATA%\cloudflare\cloudflared\cloudflared.exe"
    if exist "%ProgramFiles%\cloudflared\cloudflared.exe" set CLOUDFLARED="%ProgramFiles%\cloudflared\cloudflared.exe"
    if exist "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" set CLOUDFLARED="%ProgramFiles(x86)%\cloudflared\cloudflared.exe"
)

echo [1/5] Sprawdzam zależności...
call npm ls next >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [1/5] Instaluję zależności...
    call npm install
)
echo [1/5] ✅ Zależności OK

:: ── 3. Zabij stare procesy ──
echo [2/5] Zatrzymuję stare procesy...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv /nh 2^>nul ^| findstr /i "next"') do taskkill /f /pid %%i >nul 2>&1
echo [2/5] ✅ Stare procesy zatrzymane

:: ── 4. Uruchom Next.js dev server ──
echo [3/5] Uruchamiam Next.js dev server...
start "WitaLine-Dev" cmd /c "title WitaLine Dev && npm run dev"
echo [3/5] ⏳ Czekam na gotowość serwera...

:wait_ready
timeout /t 2 /nobreak >nul
curl -s http://localhost:3000 >nul 2>&1
if %ERRORLEVEL% neq 0 goto wait_ready
echo [3/5] ✅ Next.js dev server działa na http://localhost:3000

:: ── 5. Uruchom Cloudflare tunnel ──
echo [4/5] Uruchamiam Cloudflare tunnel...
%CLOUDFLARED% tunnel --url http://localhost:3000 > "%TEMP%\witaline-tunnel.log" 2>&1 &
set TUNNEL_PID=!ERRORLEVEL!

:: Czekaj na URL tunelu
echo [4/5] ⏳ Czekam na URL tunelu...
set TUNNEL_URL=
:wait_tunnel
timeout /t 3 /nobreak >nul
for /f "tokens=*" %%a in ('findstr "https://" "%TEMP%\witaline-tunnel.log" 2^>nul') do set TUNNEL_URL=%%a
if "%TUNNEL_URL%"=="" goto wait_tunnel

:: Wyciągnij sam URL
for /f "tokens=3 delims= " %%a in ('findstr "trycloudflare" "%TEMP%\witaline-tunnel.log" 2^>nul') do set TUNNEL_URL=%%a
if "%TUNNEL_URL%"=="" (
    :: Alternatywny format loga
    for /f "tokens=*" %%a in ('findstr /r "https?://[a-z.-]*\.trycloudflare\.com" "%TEMP%\witaline-tunnel.log" 2^>nul') do set TUNNEL_URL=%%a
)
echo [4/5] ✅ Tunnel URL: %TUNNEL_URL%

:: ── 6. Skonfiguruj webhooki ──
echo [5/5] Konfiguruję webhooki...
if not "%TUNNEL_URL%"=="" (
    call node scripts/setup-tunnel.js %TUNNEL_URL%
)
echo.

:: ── 7. Podsumowanie ──
echo ╔══════════════════════════════════════════════════╗
echo ║              WitaLine — System gotowy!           ║
echo ╠══════════════════════════════════════════════════╣
echo ║  Aplikacja:    http://localhost:3000              ║
echo ║  Tunnel:       %TUNNEL_URL%                       ║
echo ║  Telefon:      +48 732 125 752                   ║
echo ║  Admin:        http://localhost:3000/admin        ║
echo ╚══════════════════════════════════════════════════╝
echo.
echo Nacisnij Ctrl+C w oknach terminala aby zatrzymac.
echo.

:: Keep the window open
pause >nul