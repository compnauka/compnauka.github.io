$ErrorActionPreference = 'Stop'

function Get-BrowserPath {
    $candidates = @(
        'C:\Program Files\Google\Chrome\Application\chrome.exe',
        'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
    )

    return $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}

$browserPath = Get-BrowserPath
if (-not $browserPath) {
    throw 'No supported headless browser was found for browser smoke test.'
}

$testPagePath = Join-Path $PSScriptRoot 'browser-smoke.html'
$testPageUri = [System.Uri]::new($testPagePath).AbsoluteUri
$browserName = [System.IO.Path]::GetFileNameWithoutExtension($browserPath)
$runId = [System.Guid]::NewGuid().ToString('N')
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) 'server-rescue-browser-smoke'
$profilePath = Join-Path $tempRoot "profile-$browserName-$runId"
$stdoutPath = Join-Path $tempRoot "browser-smoke.$runId.stdout.txt"
$stderrPath = Join-Path $tempRoot "browser-smoke.$runId.stderr.txt"

if (-not (Test-Path $tempRoot)) {
    New-Item -ItemType Directory -Path $tempRoot | Out-Null
}

New-Item -ItemType Directory -Path $profilePath | Out-Null

$arguments = @(
    '--headless=new',
    '--disable-gpu',
    '--disable-crash-reporter',
    '--no-first-run',
    "--user-data-dir=$profilePath",
    '--allow-file-access-from-files',
    '--virtual-time-budget=20000',
    '--dump-dom',
    $testPageUri
)

try {
    $process = Start-Process -FilePath $browserPath `
        -ArgumentList $arguments `
        -RedirectStandardOutput $stdoutPath `
        -RedirectStandardError $stderrPath `
        -Wait `
        -PassThru `
        -NoNewWindow

    $domDump = if (Test-Path $stdoutPath) { Get-Content -Path $stdoutPath -Raw -Encoding UTF8 } else { '' }
    $stderrDump = if (Test-Path $stderrPath) { Get-Content -Path $stderrPath -Raw -Encoding UTF8 } else { '' }

    if ($process.ExitCode -ne 0) {
        throw "Browser smoke command failed with exit code $($process.ExitCode). Stderr:`n$stderrDump"
    }

    if ($domDump -notmatch 'data-result="pass"' -and $domDump -notmatch "data-result='pass'") {
        throw "Browser smoke test failed. DOM output:`n$domDump`nStderr:`n$stderrDump"
    }
}
finally {
    if (Test-Path $stdoutPath) { Remove-Item -LiteralPath $stdoutPath -Force -ErrorAction SilentlyContinue }
    if (Test-Path $stderrPath) { Remove-Item -LiteralPath $stderrPath -Force -ErrorAction SilentlyContinue }
    if (Test-Path $profilePath) { Remove-Item -LiteralPath $profilePath -Recurse -Force -ErrorAction SilentlyContinue }
}

Write-Host 'Browser smoke passed.'
