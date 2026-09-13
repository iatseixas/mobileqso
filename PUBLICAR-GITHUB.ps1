$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$repo = 'https://github.com/iatseixas/mobileqso.git'
Write-Host 'QSO MOBILE - Publicacao no GitHub' -ForegroundColor Cyan
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw 'Git nao encontrado. Instale Git for Windows e execute novamente.'
}
if (-not (Test-Path '.git')) { git init | Out-Host }
git checkout -B main | Out-Host
git add . | Out-Host
try { git commit -m 'Publica QSO MOBILE PWA v2.4' | Out-Host } catch { }
try { git remote get-url origin | Out-Null; git remote set-url origin $repo | Out-Host }
catch { git remote add origin $repo | Out-Host }
git push -u origin main | Out-Host
Write-Host 'Publicacao concluida: https://github.com/iatseixas/mobileqso' -ForegroundColor Green
