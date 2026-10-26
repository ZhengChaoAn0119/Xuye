# Self-hosted production stack (docker-compose.prod.yml): start, close, or restart.
# Run through startserver.bat / closeserver.bat / restartserver.bat at the repository root.
# start: creates .env.production on first run, starts Docker Desktop, checks GitHub CI for the
#        checked-out commit, builds and starts the stack, then waits for the health check.
# close: stops the containers; the database volume is kept.
# Saved as UTF-8 with BOM so Windows PowerShell 5.1 reads the Chinese messages correctly.
param(
  [ValidateSet("start", "close", "restart")]
  [string]$Action = "start",
  # Start without asking when CI has not passed.
  [switch]$SkipCi
)

# Native tools write progress to stderr; never let that abort the script.
$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$envFile = Join-Path $root ".env.production"
$compose = @("compose", "-f", "docker-compose.prod.yml", "--env-file", ".env.production")

function Step($text) { Write-Host "`n== $text" -ForegroundColor Cyan }
function Ok($text) { Write-Host "  [OK] $text" -ForegroundColor Green }
function Warn($text) { Write-Host "  [!] $text" -ForegroundColor Yellow }
function Fail($text) {
  Write-Host "  [X] $text" -ForegroundColor Red
  exit 1
}

function New-Secret([int]$bytes) {
  $buffer = New-Object byte[] $bytes
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
  -join ($buffer | ForEach-Object { $_.ToString("x2") })
}

function Read-EnvFile($path) {
  $values = @{}
  if (Test-Path $path) {
    foreach ($line in Get-Content $path -Encoding UTF8) {
      if ($line -match '^\s*([A-Z_][A-Z0-9_]*)=(.*)$') { $values[$Matches[1]] = $Matches[2].Trim() }
    }
  }
  $values
}

function Test-Docker {
  docker info --format "{{.ServerVersion}}" *> $null
  $LASTEXITCODE -eq 0
}

function Assert-Docker {
  Step "Docker"
  if (Test-Docker) {
    Ok "Docker 已在執行"
    return
  }
  $desktop = Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
  if (-not (Test-Path $desktop)) { Fail "找不到 Docker Desktop：$desktop" }
  Write-Host "  啟動 Docker Desktop，最多等 3 分鐘..."
  Start-Process $desktop
  for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 3
    if (Test-Docker) {
      Ok "Docker 已啟動"
      return
    }
  }
  Fail "Docker 沒有在 3 分鐘內啟動，請手動開啟 Docker Desktop 後再試"
}

function Initialize-EnvFile {
  Step "設定檔 .env.production"
  if (-not (Test-Path $envFile)) {
    $dev = Read-EnvFile (Join-Path $root ".env")
    $template = Get-Content (Join-Path $root ".env.production.example") -Encoding UTF8
    $filled = foreach ($line in $template) {
      switch -Regex ($line) {
        '^POSTGRES_PASSWORD=$' { "POSTGRES_PASSWORD=$(New-Secret 24)"; break }
        '^AUTH_SECRET=$' { "AUTH_SECRET=$(New-Secret 32)"; break }
        '^VISITOR_ID_SECRET=$' { "VISITOR_ID_SECRET=$(New-Secret 32)"; break }
        '^AUTH_GOOGLE_ID=$' { "AUTH_GOOGLE_ID=$($dev['AUTH_GOOGLE_ID'])"; break }
        '^AUTH_GOOGLE_SECRET=$' { "AUTH_GOOGLE_SECRET=$($dev['AUTH_GOOGLE_SECRET'])"; break }
        default { $line }
      }
    }
    # No BOM, so docker compose reads the first key correctly.
    [IO.File]::WriteAllLines($envFile, [string[]]$filled, (New-Object Text.UTF8Encoding $false))
    Ok "已建立：資料庫密碼與密鑰為隨機產生，只存在這台電腦；Google 金鑰取自 .env"
  }
  $prod = Read-EnvFile $envFile
  foreach ($key in "POSTGRES_PASSWORD", "AUTH_SECRET", "VISITOR_ID_SECRET", "AUTH_URL") {
    if (-not $prod[$key]) { Fail "$key 是空的，請編輯 .env.production" }
  }
  if ($prod["AUTH_GOOGLE_ID"]) { Ok "Google 登入已設定" }
  else { Warn "沒有 Google 登入金鑰：網站無法登入（閱讀不受影響）" }
  if ($prod["CLOUDFLARE_TUNNEL_TOKEN"]) { Ok "Cloudflare Tunnel 已設定" }
  else { Warn "CLOUDFLARE_TUNNEL_TOKEN 是空的：只啟動本機版本，外部網址還連不到" }
  $prod
}

function Test-Ci {
  Step "GitHub CI"
  $sha = (git rev-parse HEAD).Trim()
  $short = $sha.Substring(0, 7)
  $branch = (git rev-parse --abbrev-ref HEAD).Trim()
  Write-Host "  目前版本：$branch @ $short"
  if (git status --porcelain) { Warn "有未提交的改動：會用目前的檔案建置，CI 沒有測過這些改動" }

  git fetch --quiet origin *> $null
  if ($LASTEXITCODE -eq 0) {
    $behind = [int](git rev-list --count "HEAD..origin/$branch" 2> $null)
    if ($behind -gt 0) { Warn "GitHub 上有 $behind 個較新的提交；要更新請先執行 git pull" }
  }

  $remote = git remote get-url origin
  if ($remote -notmatch 'github\.com[:/](.+?)(\.git)?$') {
    Warn "origin 不是 GitHub，略過 CI 檢查"
    return $false
  }
  try {
    $runs = (Invoke-RestMethod "https://api.github.com/repos/$($Matches[1])/actions/runs?head_sha=$sha&per_page=20" `
        -Headers @{ "User-Agent" = "xuye-server-script" } -TimeoutSec 15).workflow_runs
  }
  catch {
    Warn "查詢 CI 失敗：$($_.Exception.Message)"
    return $false
  }
  if (-not $runs) {
    Warn "這個版本沒有 CI 紀錄（可能還沒推上 GitHub）"
    return $false
  }
  $pending = @($runs | Where-Object { $_.status -ne "completed" })
  $failed = @($runs | Where-Object { $_.status -eq "completed" -and $_.conclusion -notin "success", "skipped" })
  if ($failed.Count) {
    Warn "CI 失敗：$($failed[0].html_url)"
    return $false
  }
  if ($pending.Count) {
    Warn "CI 還在執行中：$($pending[0].html_url)"
    return $false
  }
  Ok "CI 通過（$short）"
  $true
}

function Start-Server {
  $prod = Initialize-EnvFile
  Assert-Docker
  if (-not (Test-Ci) -and -not $SkipCi) {
    $answer = Read-Host "  CI 尚未確認通過，仍要啟動嗎？(y/N)"
    if ($answer -notmatch '^[yY]') { Fail "已取消" }
  }

  Step "建置並啟動（第一次建置需要幾分鐘）"
  $upArgs = $compose
  if ($prod["CLOUDFLARE_TUNNEL_TOKEN"]) { $upArgs += @("--profile", "tunnel") }
  & docker @upArgs up -d --build --remove-orphans
  if ($LASTEXITCODE -ne 0) { Fail "啟動失敗，請看上面的訊息" }

  Step "健康檢查"
  $port = if ($prod["APP_PORT"]) { $prod["APP_PORT"] } else { "3080" }
  $healthy = $false
  for ($i = 0; $i -lt 40; $i++) {
    try {
      Invoke-RestMethod "http://127.0.0.1:$port/api/v1/health" -TimeoutSec 5 | Out-Null
      $healthy = $true
      break
    }
    catch { Start-Sleep -Seconds 3 }
  }
  if (-not $healthy) {
    & docker @compose logs --tail 40 app
    Fail "網站沒有回應，請看上面的紀錄"
  }
  Ok "網站正常（資料庫已連線）"
  Ok "本機查看：http://127.0.0.1:$port （登入請用正式網址）"

  if ($prod["CLOUDFLARE_TUNNEL_TOKEN"]) {
    $connected = $false
    for ($i = 0; $i -lt 10; $i++) {
      $logs = (& docker @compose logs --tail 80 cloudflared 2>&1) | Out-String
      if ($logs -match "Registered tunnel connection") {
        $connected = $true
        break
      }
      Start-Sleep -Seconds 3
    }
    if ($connected) { Ok "對外網址：$($prod['AUTH_URL'])" }
    else { Warn "Tunnel 尚未連上；查看紀錄：docker compose -f docker-compose.prod.yml logs cloudflared" }
  }

  Step "服務狀態"
  & docker @compose --profile tunnel ps
}

function Stop-Server {
  Step "關閉服務"
  if (-not (Test-Path $envFile)) {
    Ok "還沒有 .env.production，服務從未啟動過"
    return
  }
  if (-not (Test-Docker)) {
    Ok "Docker 沒有在執行，服務已是關閉狀態"
    return
  }
  # Never `down -v`: that would delete the production database volume.
  & docker @compose --profile tunnel down
  if ($LASTEXITCODE -ne 0) { Fail "關閉失敗，請看上面的訊息" }
  Ok "已關閉（資料庫資料保留）"
}

switch ($Action) {
  "start" { Start-Server }
  "close" { Stop-Server }
  "restart" {
    Stop-Server
    Start-Server
  }
}
