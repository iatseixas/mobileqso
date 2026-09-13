@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo   QSO Logbook - Publicacao no GitHub
 echo   Repositorio: iatseixas/mobileqso
 echo ================================================
echo.
where git >nul 2>nul || (
  echo ERRO: Git nao encontrado neste computador.
  echo Instale o Git for Windows e execute novamente.
  pause
  exit /b 1
)

if not exist .git (
  git init || goto :erro
)

git checkout -B main || goto :erro
git add . || goto :erro
git commit -m "Publica QSO Logbook PWA v2.4" 2>nul

git remote get-url origin >nul 2>nul
if errorlevel 1 (
  git remote add origin https://github.com/iatseixas/mobileqso.git || goto :erro
) else (
  git remote set-url origin https://github.com/iatseixas/mobileqso.git || goto :erro
)

echo.
echo Enviando QSO Logbook para GitHub...
git push -u origin main || goto :erro

echo.
echo PUBLICACAO CONCLUIDA.
echo Repositorio: https://github.com/iatseixas/mobileqso
 echo O workflow do GitHub Pages sera executado automaticamente.
pause
exit /b 0

:erro
echo.
echo FALHA NA PUBLICACAO.
echo Se o GitHub solicitar autenticacao, conclua o login no navegador e execute novamente.
pause
exit /b 1
