@echo off
echo TITAN Guild Website Server
echo ==========================
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

echo Starting local server...
echo Admin panel: http://localhost:4000/admin.html
echo Website: http://localhost:4000
echo.
echo Password: titan2026
echo.
echo To deploy to Vercel:
echo   1. Install Vercel CLI: npm i -g vercel
echo   2. Run: vercel
echo   3. Follow prompts
echo.
node server.js
pause
