@echo off
rem Xuye production server: start. See scripts/server.ps1 and docker-compose.prod.yml.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\server.ps1" -Action start %*
echo.
pause
