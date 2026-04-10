Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$failures = New-Object System.Collections.Generic.List[string]

function Add-Failure {
  param([string]$Message)
  $script:failures.Add($Message)
}

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    Add-Failure $Message
  }
}

function Read-Utf8Strict {
  param([string]$Path)

  $bytes = [System.IO.File]::ReadAllBytes($Path)
  $encoding = [System.Text.UTF8Encoding]::new($false, $true)
  return $encoding.GetString($bytes)
}

function Count-Matches {
  param(
    [string]$Text,
    [string]$Pattern
  )

  return ([regex]::Matches($Text, $Pattern)).Count
}

$textFiles = @(
  "index.html",
  "info-types-1-2.html",
  "message-actions-1-2.html",
  "styles.css",
  "tokens.css",
  "offline.html",
  "manifest.json",
  "sw.js"
) + (Get-ChildItem -Path "js" -Recurse -Filter "*.js" | ForEach-Object { $_.FullName })

$suspiciousTokens = @(
  [string][char]0x00D0,
  [string][char]0x00D1,
  ([string][char]0x00E2) + ([string][char]0x20AC) + ([string][char]0x2122),
  ([string][char]0x00E2) + ([string][char]0x0153),
  ([string][char]0x00EF) + ([string][char]0x00B8),
  [string][char]0xFFFD
)

$decoded = @{}

foreach ($path in $textFiles) {
  try {
    $fullPath = if ([System.IO.Path]::IsPathRooted($path)) { $path } else { Join-Path $root $path }
    $decoded[$fullPath] = Read-Utf8Strict -Path $fullPath
  } catch {
    Add-Failure "UTF-8 decoding failed for $path. $($_.Exception.Message)"
    continue
  }
}

foreach ($entry in $decoded.GetEnumerator()) {
  foreach ($token in $suspiciousTokens) {
    Assert-True (-not $entry.Value.Contains($token)) "Suspicious mojibake token found in $($entry.Key)"
  }
}

$indexPath = Join-Path $root "index.html"
$stylesPath = Join-Path $root "styles.css"
$sharedPath = Join-Path $root "js\shared.js"
$lessonDataPath = Join-Path $root "js\lessons\info-types-1-2.js"
$messageLessonPath = Join-Path $root "js\lessons\message-actions-1-2.js"
$lessonFactoryPath = Join-Path $root "js\lesson-data.js"
$appPath = Join-Path $root "js\app.js"
$registryPath = Join-Path $root "js\activity-registry.js"
$statePath = Join-Path $root "js\state.js"
$swPath = Join-Path $root "sw.js"

$indexText = $decoded[$indexPath]
$stylesText = $decoded[$stylesPath]
$sharedText = $decoded[$sharedPath]
$lessonDataText = $decoded[$lessonDataPath]
$messageLessonText = $decoded[$messageLessonPath]
$lessonFactoryText = $decoded[$lessonFactoryPath]
$appText = $decoded[$appPath]
$registryText = $decoded[$registryPath]
$stateText = $decoded[$statePath]
$swText = $decoded[$swPath]

Assert-True ($indexText -match "[\u0400-\u04FF]{5,}") "index.html should contain readable Cyrillic text."
Assert-True ($lessonDataText -match "[\u0400-\u04FF]{5,}") "lesson-data.js should contain readable Cyrillic text."
Assert-True (-not ($indexText -match '\u0423\u043d\u0456\u0432\u0435\u0440\u0441\u0430\u043b\u044c\u043d\u0438\u0439\s+\u0448\u0430\u0431\u043b\u043e\u043d')) "index.html should not contain the removed template badge text."
Assert-True ($indexText -match '\u041a\u0430\u0442\u0430\u043b\u043e\u0433\s+\u0456\u043d\u0442\u0435\u0440\u0430\u043a\u0442\u0438\u0432\u043d\u0438\u0445\s+\u0443\u0440\u043e\u043a\u0456\u0432') "index.html should contain the lessons catalog heading."
Assert-True ($indexText.Contains('id="lesson-links"')) "index.html should contain lessons list container."
Assert-True ($indexText.Contains('js/landing.js')) "index.html should load landing script."

$assetRefs = [regex]::Matches($indexText, '(?:href|src)="([^"]+)"')
foreach ($match in $assetRefs) {
  $ref = $match.Groups[1].Value
  if ($ref.StartsWith("http://") -or $ref.StartsWith("https://") -or $ref.StartsWith("#")) {
    continue
  }

  $assetPath = Join-Path $root $ref
  Assert-True (Test-Path $assetPath) "Referenced asset is missing: $ref"
}

Assert-True ($sharedText.Contains("playTone")) "shared.js should contain playTone helper for sound feedback."
Assert-True ($sharedText -match '\u0417\u0432\u0443\u043a\s+\u0443\u0432\u0456\u043c\u043a\u043d\u0435\u043d\u043e') "shared.js should explain sound-on behavior."
Assert-True ($stylesText.Contains(".choice-button.is-selected")) "styles.css should define a strong selected state for choice buttons."
Assert-True ($stylesText.Contains(".truth-button.is-selected")) "styles.css should define a strong selected state for truth buttons."
Assert-True ($stylesText.Contains(".emotion-button.is-selected")) "styles.css should define a strong selected state for reflection buttons."
Assert-True ($stylesText.Contains("box-shadow: 0 0 0 5px")) "styles.css should use a stronger highlight ring for selected states."
Assert-True ($stylesText.Contains(".section-label--light")) "styles.css should contain reflection label styling."
Assert-True ($stylesText.Contains(".canvas-wrap.is-empty-warning")) "styles.css should highlight an empty drawing task."
Assert-True ($stylesText.Contains("flex: 0 0 132px")) "styles.css should keep the sound toggle width stable."
Assert-True ($stylesText.Contains(".hero-card__meta .meta-chip:last-child")) "styles.css should keep the last hero chip on its own row."
Assert-True ($stylesText.Contains("grid-template-columns: repeat(2, minmax(0, 1fr));")) "styles.css should compact classify areas on mobile."
Assert-True ($stylesText.Contains("min-height: 92px;")) "styles.css should reduce classify dropzone height on mobile."
Assert-True ($stylesText.Contains(".emotion-button:last-child")) "styles.css should let the last reflection card span the mobile row."

Assert-True ($appText.Contains('createActivityRegistry')) "app.js should consume a dedicated activity registry module."
Assert-True ($appText.Contains('resolveLessonConfig')) "app.js should resolve lesson config from catalog."
Assert-True ($appText.Contains('document.body.dataset.lessonId')) "app.js should support per-page lesson id."
Assert-True ($registryText.Contains("export function createActivityRegistry")) "activity-registry.js should define the activity registry."
Assert-True ($appText.Contains("function renderActivity(activityId")) "app.js should re-render one activity at a time."
Assert-True ($appText.Contains('data-activity-slot')) "app.js should render dedicated slots for single-task updates."
Assert-True (-not $appText.Contains('refs.goalNote.textContent')) "app.js should no longer render goalNote with textContent."
Assert-True ($sharedText.Contains("renderRichText")) "shared.js should expose a helper for safe rich text rendering."
Assert-True ($stateText.Contains("Object.fromEntries")) "state.js should build completion state dynamically from lesson activities."
Assert-True (-not (Test-Path (Join-Path $root "js\task-choose.js"))) "task-choose.js should be removed as dead code."
Assert-True ($swText.Contains("async function networkFirst")) "sw.js should use network-first for navigations."
Assert-True ($swText.Contains("async function staleWhileRevalidate")) "sw.js should use stale-while-revalidate for lesson assets."
Assert-True ($swText.Contains('CACHE_NAME = "interactive-lesson-v11"')) "sw.js cache version should be bumped after the update."
Assert-True ($appText.Contains("studentHook")) "app.js should render a dedicated student hero hook."
Assert-True ($appText.Contains("teacherOverview")) "app.js should render a dedicated teacher overview."
Assert-True ($lessonFactoryText.Contains("const studentHook")) "lesson-data.js should build student hook defaults."
Assert-True ($lessonFactoryText.Contains("const teacherOverview")) "lesson-data.js should build teacher overview defaults."
Assert-True ($messageLessonText -match '\u0414\u0436\u0435\u0440\u0435\u043b\u043e') "message-actions lesson should include source/channel/receiver theory."
Assert-True ($messageLessonText.Contains('type: "sequence"')) "message-actions lesson should include sequence activity."

Assert-True ((Count-Matches -Text $lessonDataText -Pattern 'teacherTip:') -ge 9) "lesson-data.js should contain rich teacher tips across sections and tasks."
Assert-True ((Count-Matches -Text $lessonDataText -Pattern 'answer: true') -ge 5) "lesson-data.js should contain enough true/false statements for variability."
Assert-True ((Count-Matches -Text $lessonDataText -Pattern 'answer: false') -ge 4) "lesson-data.js should contain enough false statements for variability."
Assert-True ((Count-Matches -Text $lessonDataText -Pattern 'question:') -ge 8) "lesson-data.js should contain a large enough quiz pool."
Assert-True ((Count-Matches -Text $lessonDataText -Pattern 'correct:') -ge 30) "lesson-data.js should contain a large enough pool of correct-answer mappings."
Assert-True ((Count-Matches -Text $lessonDataText -Pattern 'count:\s*4') -ge 2) "lesson-data.js should keep enough 4-item random pools."
Assert-True ((Count-Matches -Text $lessonDataText -Pattern 'count:\s*3') -ge 2) "lesson-data.js should keep enough 3-item random pools."
Assert-True ($lessonDataText -match '\u0424\u043e\u0440\u043c\u0443\u0432\u0430\u043b\u044c\u043d\u0435\s+\u043e\u0446\u0456\u043d\u044e\u0432\u0430\u043d\u043d\u044f') "lesson-data.js should include explicit methodical guidance about formative assessment."
Assert-True ($lessonDataText -match '\u0414\u0438\u0444\u0435\u0440\u0435\u043d\u0446\u0456\u0430\u0446\u0456\u044f') "lesson-data.js should include explicit differentiation guidance."
Assert-True ($lessonDataText -match '\u0422\u0438\u043f\u043e\u0432\u0430\s+\u043f\u043e\u043c\u0438\u043b\u043a\u0430') "lesson-data.js should include explicit notes about typical mistakes."
Assert-True ($lessonDataText -match '\u043a\u0430\u043c\u0456\u043d\u044c') "lesson-data.js should contain the stable replacement for the stone item label."

if ($failures.Count -gt 0) {
  Write-Host ""
  Write-Host "FAILED TESTS:" -ForegroundColor Red
  foreach ($failure in $failures) {
    Write-Host " - $failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host ""
Write-Host "All lesson regression tests passed." -ForegroundColor Green
