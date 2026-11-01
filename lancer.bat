@echo off
rem Lance le serveur local du jeu et ouvre le navigateur.
cd /d "%~dp0"
set PORT=8080

where node >nul 2>nul
if %errorlevel%==0 (
  start "Les Quatre Vents - serveur" cmd /k node scripts\serve.mjs %PORT%
) else (
  where python >nul 2>nul
  if errorlevel 1 (
    echo Node.js ou Python est necessaire : https://nodejs.org
    pause
    exit /b 1
  )
  start "Les Quatre Vents - serveur" cmd /k python -m http.server %PORT% --bind 127.0.0.1
)

rem Laisse le temps au serveur de demarrer.
timeout /t 1 /nobreak >nul
start "" http://localhost:%PORT%/
