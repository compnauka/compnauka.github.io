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
  param([bool]$Condition, [string]$Message)
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

$textFiles = @(
  "index.html",
  "info-types-1-2.html",
  "info-presentation-1-2.html",
  "message-actions-1-2.html",
  "objects-models-1-2.html",
  "info-history-coding-1-2.html",
  "sources-truth-1-2.html",
  "sets-order-1-2.html",
  "simple-tables-1-2.html",
  "computer-what-is-1-2.html",
  "computer-types-1-2.html",
  "computer-parts-1-2.html",
  "device-purpose-1-2.html",
  "computer-problems-help-1-2.html",
  "computer-safety-1-2.html",
  "commands-executors-1-2.html",
  "action-sequence-1-2.html",
  "everyday-algorithm-1-2.html",
  "find-fix-order-1-2.html",
  "algorithm-representation-1-2.html",
  "lesson-page.template.html",
  "styles.css",
  "tokens.css",
  "offline.html",
  "manifest.json",
  "sw.js",
  "LESSON_TEMPLATE_GUIDE.md",
  "AI_LESSON_WORKFLOW.md",
  "scripts\generate-lesson-pages.ps1"
) + (Get-ChildItem -Path "js" -Recurse -Filter "*.js" | ForEach-Object { $_.FullName })

$decoded = @{}
foreach ($path in $textFiles) {
  try {
    $fullPath = if ([System.IO.Path]::IsPathRooted($path)) { $path } else { Join-Path $root $path }
    $decoded[$fullPath] = Read-Utf8Strict -Path $fullPath
  } catch {
    Add-Failure "UTF-8 decoding failed for $path. $($_.Exception.Message)"
  }
}

$indexPath = Join-Path $root "index.html"
$catalogPath = Join-Path $root "js\lessons\catalog.js"
$statePath = Join-Path $root "js\state.js"
$generatorPath = Join-Path $root "scripts\generate-lesson-pages.ps1"
$guidePath = Join-Path $root "LESSON_TEMPLATE_GUIDE.md"
$workflowPath = Join-Path $root "AI_LESSON_WORKFLOW.md"
$landingPath = Join-Path $root "js\landing.js"

$indexText = $decoded[$indexPath]
$catalogText = $decoded[$catalogPath]
$stateText = $decoded[$statePath]
$generatorText = $decoded[$generatorPath]
$guideText = $decoded[$guidePath]
$workflowText = $decoded[$workflowPath]
$landingText = $decoded[$landingPath]

Assert-True ($indexText -match "Інтерактивний підручник з інформатики для 1 та 2 класу") "index.html should contain the textbook heading."
Assert-True ($indexText -match "Поточний цикл") "index.html should describe the current lesson cycle."
Assert-True ($indexText -match "Алгоритми довкола нас") "index.html should mention the current algorithms cycle."
Assert-True ($indexText -match "Наступний цикл: творимо та ділимося") "index.html should mention the next cycle about creating and sharing."
Assert-True ($indexText -match "Покриття циклу") "index.html should describe expected outcomes coverage for the current cycle."
Assert-True ($indexText -match "Цикл 3. Алгоритми довкола нас") "index.html should include the roadmap for the next cycles."
Assert-True ($indexText -match "Цикл 4. Творимо та ділимося") "index.html should include the roadmap entry for cycle 4."
Assert-True ($indexText.Contains('id="lesson-links"')) "index.html should contain lessons list container."
Assert-True ($indexText.Contains('js/landing.js')) "index.html should load landing script."

$expectedLessons = @(
  "info-types-1-2",
  "info-presentation-1-2",
  "message-actions-1-2",
  "objects-models-1-2",
  "info-history-coding-1-2",
  "sources-truth-1-2",
  "sets-order-1-2",
  "simple-tables-1-2",
  "computer-what-is-1-2",
  "computer-types-1-2",
  "computer-parts-1-2",
  "device-purpose-1-2",
  "computer-problems-help-1-2",
  "computer-safety-1-2",
  "commands-executors-1-2",
  "action-sequence-1-2",
  "everyday-algorithm-1-2",
  "find-fix-order-1-2",
  "algorithm-representation-1-2"
)

foreach ($lessonId in $expectedLessons) {
  Assert-True ($catalogText.Contains("id: `"$lessonId`"")) "catalog.js should include lesson id $lessonId."
  Assert-True ($generatorText.Contains("Id = `"$lessonId`"")) "generate-lesson-pages.ps1 should include lesson id $lessonId."
}

Assert-True ($catalogText.Contains("Види інформації та способи подання")) "catalog.js should include the presentation lesson label."
Assert-True ($catalogText.Contains("Об’єкти, властивості, моделі")) "catalog.js should include the objects/models lesson label."
Assert-True ($catalogText.Contains("Джерела інформації. Правдиве і неправдиве")) "catalog.js should include the sources/truth lesson label."
Assert-True ($catalogText.Contains("Множини. Групуємо та впорядковуємо")) "catalog.js should include the sets lesson label."
Assert-True ($catalogText.Contains("Прості схеми та таблиці")) "catalog.js should include the simple tables lesson label."
Assert-True ($catalogText.Contains("Що таке комп’ютер і де ми його зустрічаємо")) "catalog.js should include the first computer cycle lesson label."
Assert-True ($catalogText.Contains("Як працювати безпечно і дбайливо")) "catalog.js should include the safety lesson label."
Assert-True ($catalogText.Contains("Команди і виконавці")) "catalog.js should include the first algorithms lesson label."
Assert-True ($catalogText.Contains("Знайди і виправ помилку в порядку дій")) "catalog.js should include the final algorithms lesson label."
Assert-True ($catalogText.Contains("Як записати алгоритм")) "catalog.js should include the algorithm representation lesson label."
Assert-True ($landingText.Contains("Як ми отримуємо інформацію очима")) "landing.js should include readable lesson descriptions."
Assert-True ($landingText.Contains("Що таке комп’ютер")) "landing.js should include descriptions for the computer cycle."
Assert-True ($landingText.Contains("Хто такий виконавець")) "landing.js should include descriptions for the algorithms cycle."
Assert-True ($landingText.Contains("подати словами, числами, стрілками")) "landing.js should include the algorithm representation description."
Assert-True ($landingText.Contains("Відкрити урок")) "landing.js should include the primary lesson action label."

$lessonFiles = Get-ChildItem -Path (Join-Path $root "js\lessons") -Filter "*.js" |
  Where-Object { $_.Name -ne "catalog.js" } |
  Sort-Object Name |
  ForEach-Object { $_.FullName }

foreach ($lessonFile in $lessonFiles) {
  $text = $decoded[$lessonFile]
  $lessonName = Split-Path -Leaf $lessonFile
  Assert-True ($text -match "studentHook") "$lessonName should define studentHook."
  Assert-True ($text -match "teacherOverview") "$lessonName should define teacherOverview."
  Assert-True ($text -match "coverage:") "$lessonName should define coverage metadata."
  Assert-True ($text -match 'teacherTip:') "$lessonName should include teacher tips."
  Assert-True ($text -match '[А-Яа-яІіЇїЄєҐґ]{5,}') "$lessonName should contain readable Cyrillic content."

  $activityOrderMatch = [regex]::Match($text, 'activityOrder:\s*\[(?<body>[\s\S]*?)\]')
  if ($activityOrderMatch.Success) {
    $activityTypes = [regex]::Matches($activityOrderMatch.Groups["body"].Value, '"([^"]+)"') |
      ForEach-Object { $_.Groups[1].Value }

    Assert-True ($activityTypes.Count -gt 0) "$lessonName should include at least one activity in activityOrder."

    foreach ($activityType in $activityTypes) {
      Assert-True ($text -match ('type:\s*"' + [regex]::Escape($activityType) + '"')) "$lessonName should define activity data for type $activityType."
    }
  }
}

Assert-True ($stateText.Contains("return {};")) "state.js should reset persisted state to an empty object."
Assert-True ($stateText.Contains("void state;")) "state.js should ignore persisted state writes."
Assert-True (-not $stateText.Contains("localStorage")) "state.js should not persist lesson progress in localStorage."

Assert-True ($guideText.Contains("Рекомендована 8-урочна лінійка")) "LESSON_TEMPLATE_GUIDE.md should document the eight-lesson structure."
Assert-True ($guideText.Contains("Карта покриття результатів")) "LESSON_TEMPLATE_GUIDE.md should describe how lesson cycles map to outcomes."
Assert-True ($guideText.Contains("після оновлення сторінки або повторного відкриття браузера урок стартує з початку")) "LESSON_TEMPLATE_GUIDE.md should document state reset behavior."
Assert-True ($guideText.Contains("мотиваційний гачок")) "LESSON_TEMPLATE_GUIDE.md should document the student-first hero block."
Assert-True ($guideText.Contains("Комп’ютери та цифровий світ")) "LESSON_TEMPLATE_GUIDE.md should document the implemented computer cycle."
Assert-True ($guideText.Contains("Алгоритми довкола нас")) "LESSON_TEMPLATE_GUIDE.md should document the implemented algorithms cycle."
Assert-True ($guideText.Contains("Прості схеми та таблиці")) "LESSON_TEMPLATE_GUIDE.md should mention the tables lesson."
Assert-True ($guideText.Contains("Команди і виконавці")) "LESSON_TEMPLATE_GUIDE.md should mention the algorithms cycle lessons."
Assert-True ($guideText.Contains("Як записати алгоритм")) "LESSON_TEMPLATE_GUIDE.md should mention the algorithm representation lesson."

Assert-True ($workflowText.Contains("Основна лінійка для 1-2 класу")) "AI_LESSON_WORKFLOW.md should document the recommended lesson sequence."
Assert-True ($workflowText.Contains("Планувати від карти результатів")) "AI_LESSON_WORKFLOW.md should require planning from outcomes coverage."
Assert-True ($workflowText.Contains("урок не повинен зберігати прогрес")) "AI_LESSON_WORKFLOW.md should document the no-persistence rule."
Assert-True ($workflowText.Contains("перший блок у режимі учня має бути мотиваційним гачком")) "AI_LESSON_WORKFLOW.md should document the student hero rule."
Assert-True ($workflowText.Contains("Основні частини комп’ютера")) "AI_LESSON_WORKFLOW.md should document the next computer cycle."
Assert-True ($workflowText.Contains("Множини. Групуємо та впорядковуємо")) "AI_LESSON_WORKFLOW.md should mention the sets lesson."
Assert-True ($workflowText.Contains("table-read")) "AI_LESSON_WORKFLOW.md should document the table-read activity type."
Assert-True ($workflowText.Contains("Команди і виконавці")) "AI_LESSON_WORKFLOW.md should include the algorithms planning template."
Assert-True ($workflowText.Contains("Як записати алгоритм")) "AI_LESSON_WORKFLOW.md should include the algorithm representation lesson."

foreach ($htmlFile in @(
  "info-types-1-2.html",
  "info-presentation-1-2.html",
  "message-actions-1-2.html",
  "objects-models-1-2.html",
  "info-history-coding-1-2.html",
  "sources-truth-1-2.html",
  "sets-order-1-2.html",
  "simple-tables-1-2.html",
  "computer-what-is-1-2.html",
  "computer-types-1-2.html",
  "computer-parts-1-2.html",
  "device-purpose-1-2.html",
  "computer-problems-help-1-2.html",
  "computer-safety-1-2.html",
  "commands-executors-1-2.html",
  "action-sequence-1-2.html",
  "everyday-algorithm-1-2.html",
  "find-fix-order-1-2.html",
  "algorithm-representation-1-2.html"
)) {
  $fullPath = Join-Path $root $htmlFile
  $text = $decoded[$fullPath]
  Assert-True ($null -ne $text) "$htmlFile should be decoded and available for inspection."
  if ($null -ne $text) {
    Assert-True ($text.Contains("data-lesson-id")) "$htmlFile should include data-lesson-id in the body."
    Assert-True ($text.Contains('id="lesson-select"')) "$htmlFile should include the lesson selector."
  }
}

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
