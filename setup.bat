@echo off
REM ── AI Testing Tool — One-Click Setup (Windows) ─────────────────────────
setlocal ENABLEDELAYEDEXPANSION

echo.
echo ============================================================
echo       AI Testing Tool -- One-Click Setup (Windows)
echo ============================================================
echo.

REM ── Prereq check ─────────────────────────────────────────────────────
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install from https://nodejs.org ^(v18+^)
  pause
  exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [OK] Node.js !NODE_VER!
for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo [OK] npm v!NPM_VER!
echo.

REM ── Backend setup ───────────────────────────────────────────────────
echo [1/4] Installing backend dependencies...
cd qa-tool\backend
call npm install --silent
if errorlevel 1 goto :error
echo [OK] Backend deps installed

REM ── Generate .env if missing ────────────────────────────────────────
if not exist .env (
  echo [2/4] Generating .env with secure random secrets...
  for /f "delims=" %%s in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set JWT_SECRET=%%s
  for /f "delims=" %%s in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set APP_SECRET=%%s

  REM Copy template then substitute
  copy /Y .env.example .env >nul
  node -e "const fs=require('fs');let e=fs.readFileSync('.env','utf8');e=e.replace(/JWT_SECRET=.*/,'JWT_SECRET=!JWT_SECRET!');e=e.replace(/APP_SECRET=.*/,'APP_SECRET=!APP_SECRET!');fs.writeFileSync('.env',e);"
  echo [OK] .env generated with fresh secrets
) else (
  echo [SKIP] .env already exists
)
echo.

REM ── Frontend setup ───────────────────────────────────────────────────
echo [3/4] Installing frontend dependencies...
cd ..\frontend
call npm install --silent
if errorlevel 1 goto :error
echo [OK] Frontend deps installed
echo.

cd ..\..
echo [4/4] Setup complete!
echo.
echo ============================================================
echo                   READY TO RUN
echo ============================================================
echo.
echo Open TWO separate Command Prompts and run:
echo.
echo   Terminal 1 ^(backend^):
echo     cd qa-tool\backend ^&^& npm start
echo.
echo   Terminal 2 ^(frontend^):
echo     cd qa-tool\frontend ^&^& npm run dev
echo.
echo Then open  http://localhost:3001  in your browser.
echo.
echo First user to sign up becomes the admin.
echo.
pause
exit /b 0

:error
echo.
echo [ERROR] Setup failed. Please scroll up to see the error message.
pause
exit /b 1
