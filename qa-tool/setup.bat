@echo off
echo.
echo =========================================================
echo   QA AI Testing Tool -- Setup Script
echo =========================================================
echo.

echo [1/3] Installing Backend dependencies...
cd backend
call npm install
cd ..

echo.
echo [2/3] Installing Playwright test runner...
cd playwright-tests
call npm install
call npx playwright install chromium
cd ..

echo.
echo [3/3] Installing Frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo =========================================================
echo   Setup Complete!
echo =========================================================
echo.
echo   To START the application:
echo     1. Open Terminal 1:  cd backend   ^& npm start
echo     2. Open Terminal 2:  cd frontend  ^& npm run dev
echo     3. Open browser:     http://localhost:3001
echo.
pause
