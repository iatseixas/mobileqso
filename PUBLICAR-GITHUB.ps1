$ErrorActionPreference = 'Stop'

function Invoke-QsoGit {
  param([string[]]$GitArguments)
  $result = & git @GitArguments
  if ($LASTEXITCODE -ne 0) {
    throw "Git falhou (codigo $LASTEXITCODE). Publicacao interrompida."
  }
  return $result
}

try {
  Set-Location -LiteralPath $PSScriptRoot
  Write-Host 'QSO Logbook - Publicacao no GitHub' -ForegroundColor Cyan
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git nao encontrado. Instale Git for Windows e execute novamente.'
  }
  if (-not (Test-Path -LiteralPath '.git')) {
    throw 'Use um clone de iatseixas/mobileqso. A copia do Drive nao e uma fonte de publicacao.'
  }
  $repoPattern = '^(https://github\.com/iatseixas/mobileqso(\.git)?/?|git@github\.com:iatseixas/mobileqso(\.git)?)$'
  $fetchUrls = @(Invoke-QsoGit -GitArguments @('remote', 'get-url', '--all', 'origin'))
  $pushUrls = @(Invoke-QsoGit -GitArguments @('remote', 'get-url', '--push', '--all', 'origin'))
  if ($fetchUrls.Count -ne 1 -or $pushUrls.Count -ne 1 -or
      $fetchUrls[0] -notmatch $repoPattern -or $pushUrls[0] -notmatch $repoPattern) {
    throw 'O remoto origin deve apontar somente para iatseixas/mobileqso.'
  }
  $branch = Invoke-QsoGit -GitArguments @('rev-parse', '--abbrev-ref', 'HEAD')
  if ($branch -ne 'main') {
    throw 'Execute na branch main. Nenhuma branch sera criada ou redefinida pelo publicador.'
  }
  Invoke-QsoGit -GitArguments @('fetch', '--no-tags', 'origin', 'refs/heads/main:refs/remotes/origin/main') | Out-Host
  $localHead = Invoke-QsoGit -GitArguments @('rev-parse', 'HEAD')
  $remoteHead = Invoke-QsoGit -GitArguments @('rev-parse', 'refs/remotes/origin/main')
  if ($localHead -ne $remoteHead) {
    throw 'O historico local difere de origin/main. Alinhe os commits preservando suas alteracoes antes de publicar.'
  }

  $publishPaths = @('index.html', 'manifest.webmanifest', 'sw.js', 'icons', 'README.md',
                    'QSOs-REGRAS.md', '.nojekyll', 'PUBLICAR-GITHUB.bat', 'PUBLICAR-GITHUB.ps1')
  $staged = @(Invoke-QsoGit -GitArguments @('diff', '--cached', '--name-only'))
  foreach ($path in $staged) {
    if ($publishPaths -notcontains $path -and -not $path.StartsWith('icons/')) {
      throw 'Ha arquivos preparados fora do pacote QSO. Revise o staging antes de publicar.'
    }
  }
  Invoke-QsoGit -GitArguments (@('add', '-A', '--') + $publishPaths) | Out-Host
  & git diff --cached --quiet --exit-code
  $diffResult = $LASTEXITCODE
  if ($diffResult -eq 0) {
    Write-Host 'Nenhuma alteracao do pacote QSO para publicar.'
    exit 0
  }
  if ($diffResult -ne 1) {
    throw "Falha ao conferir alteracoes (codigo $diffResult)."
  }
  Invoke-QsoGit -GitArguments @('commit', '-m', 'Atualiza QSO Logbook') | Out-Host
  Invoke-QsoGit -GitArguments @('push', '-u', 'origin', 'main') | Out-Host
  Write-Host 'Commit enviado: https://github.com/iatseixas/mobileqso' -ForegroundColor Green
  Write-Host 'Acompanhe a publicacao do GitHub Pages na aba Actions do repositorio.'
  exit 0
}
catch {
  Write-Host ('FALHA NA PUBLICACAO: ' + $_.Exception.Message) -ForegroundColor Red
  exit 1
}
