param(
  [int]$Port = 4173,
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

function Get-ChromePath {
  $candidates = @(
    'C:\Program Files\Google\Chrome\Application\chrome.exe',
    'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) { return $candidate }
  }

  throw 'Chrome is not installed in the expected location.'
}

function Wait-ForServer {
  param([int]$PortNumber)

  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    try {
      Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$PortNumber/tests/browser-smoke.html" | Out-Null
      return
    } catch {
      Start-Sleep -Milliseconds 250
    }
  }

  throw "Local smoke server did not start on port $PortNumber."
}

function Invoke-SmokePage {
  param(
    [string]$Url,
    [string]$PassPattern,
    [string]$Name
  )

  $dom = & $chromePath `
    '--headless=new' `
    '--disable-gpu' `
    '--disable-crash-reporter' `
    '--no-first-run' `
    "--user-data-dir=$profilePath" `
    '--virtual-time-budget=8000' `
    '--dump-dom' `
    $Url 2>&1 | Out-String

  if ($dom -notmatch $PassPattern) {
    throw "$Name failed.`n$dom"
  }

  Write-Host "$Name passed."
}

$chromePath = Get-ChromePath
$server = $null
$profilePath = Join-Path $PSScriptRoot ('.browser-profile-office-browser-smoke-' + [guid]::NewGuid().ToString())

try {
  $server = Start-Process powershell -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', (Join-Path $PSScriptRoot 'serve-office.ps1'),
    '-Port', $Port,
    '-Root', $Root
  ) -PassThru -WindowStyle Hidden

  Wait-ForServer -PortNumber $Port

  Invoke-SmokePage "http://127.0.0.1:$Port/tests/browser-smoke.html" 'data-smoke="passed"' 'Browser smoke'
  Invoke-SmokePage "http://127.0.0.1:$Port/tests/flowcharts-behavior.html" 'data-flowcharts="passed"' 'Flowcharts behavior smoke'
} finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
  }

  if (Test-Path $profilePath) {
    Remove-Item -LiteralPath $profilePath -Recurse -Force
  }
}
