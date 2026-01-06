@echo off
cd /d C:\firmanager-emergent\firmanager-emergent-main\firmanager-emergent-main
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000/dashboard"
npm run dev