Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$serverProcess = Start-Process -FilePath "powershell" -ArgumentList "-ExecutionPolicy Bypass -File `"$root\server.ps1`"" -PassThru -WindowStyle Hidden

try {
  Start-Sleep -Seconds 2

  $chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
  if (-not (Test-Path $chromePath)) {
    throw "Google Chrome не знайдено за шляхом $chromePath"
  }

  $userDataDir = Join-Path $PSScriptRoot ".browser-profile"
  if (Test-Path $userDataDir) {
    Remove-Item -LiteralPath $userDataDir -Recurse -Force
  }

  $url = "http://127.0.0.1:4173/tests/browser-smoke.html"
  $dom = & $chromePath --headless=new --disable-gpu --disable-crash-reporter --no-first-run --user-data-dir="$userDataDir" --virtual-time-budget=12000 --dump-dom $url 2>&1
  $exitCodeVar = Get-Variable -Name LASTEXITCODE -ErrorAction SilentlyContinue
  $exitCode = if ($exitCodeVar) { [int]$exitCodeVar.Value } else { 0 }

  if ($exitCode -ne 0) {
    throw "Chrome завершився з кодом $exitCode"
  }

  if ($dom -notmatch "PASS") {
    throw "Browser smoke failed. DOM output did not contain PASS.`n$dom"
  }

  Write-Host ""
  Write-Host "Browser smoke passed." -ForegroundColor Green
} finally {
  if ($serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force
  }
}
