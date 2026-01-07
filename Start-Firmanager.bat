@echo off
title Firmanager - Starting...
cd /d "C:\firmanager-emergent\firmanager-emergent-main\firmanager-emergent-main\frontend"
echo Starting Firmanager...
echo.
echo Opening browser in 10 seconds...
echo.
start /B npm start
timeout /t 10 /nobreak > nul
start http://localhost:3000
echo.
echo Firmanager is running!
echo Press Ctrl+C to stop the server
echo.
pause
