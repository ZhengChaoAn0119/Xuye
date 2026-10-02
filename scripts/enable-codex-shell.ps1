# Dot-source this once at the start of a PowerShell command running inside the
# managed Codex Windows sandbox:
#   . .\scripts\enable-codex-shell.ps1
#
# It keeps the workaround out of normal local development, dependency install,
# CI, and production while making pnpm/tsx-based project commands reliable here.

if ($env:CODEX_PERMISSION_PROFILE) {
  $preload = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot 'codex-windows-userinfo.cjs')).Path
  $requireOption = "--require=$preload"
  if (-not ($env:NODE_OPTIONS -split '\s+' | Where-Object { $_ -eq $requireOption })) {
    $env:NODE_OPTIONS = "$requireOption $env:NODE_OPTIONS".Trim()
  }

  $pnpmBin = Join-Path $env:TEMP 'xuye-pm-bin'
  $env:COREPACK_HOME = Join-Path $env:TEMP 'xuye-corepack'
  New-Item -ItemType Directory -Force -Path $pnpmBin | Out-Null
  corepack enable --install-directory $pnpmBin
  if (-not (($env:PATH -split ';') -contains $pnpmBin)) {
    $env:PATH = "$pnpmBin;$env:PATH"
  }
}
