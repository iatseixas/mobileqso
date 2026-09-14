@echo off
setlocal
cd /d "%~dp0"
where powershell.exe >nul 2>nul || (
  echo ERRO: Windows PowerShell nao encontrado.
  pause
  exit /b 1
)
powershell.exe -NoProfile -File "%~dp0PUBLICAR-GITHUB.ps1"
set "qso_result=%ERRORLEVEL%"
pause
exit /b %qso_result%
