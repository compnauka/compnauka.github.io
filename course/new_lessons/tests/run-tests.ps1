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
  "m1-01-info-types.html",
  "m1-02-info-presentation.html",
  "m1-03-message-actions.html",
  "m1-04-objects-models.html",
  "m1-05-info-history-coding.html",
  "m1-06-sources-truth.html",
  "m1-07-sets-order.html",
  "m1-08-simple-tables.html",
  "m2-01-computer-what-is.html",
  "m2-02-computer-types.html",
  "m2-03-computer-parts.html",
  "m2-04-device-purpose.html",
  "m2-05-computer-problems-help.html",
  "m2-06-computer-safety.html",
  "m3-01-commands-executors.html",
  "m3-02-action-sequence.html",
  "m3-03-everyday-algorithm.html",
  "m3-04-find-fix-order.html",
  "m3-05-algorithm-representation.html",
  "m4-01-draw-in-program.html",
  "m4-02-simple-info-product.html",
  "m4-03-sign-your-work.html",
  "m4-04-work-alone-together.html",
  "m5-01-internet-what-for.html",
  "m5-02-search-online.html",
  "m5-03-private-info.html",
  "m5-04-kind-online.html",
  "m5-05-check-before-share.html",
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
Assert-True ($indexText.Contains('id="landing-student-modules"')) "index.html should contain the student modules container."
Assert-True ($indexText.Contains('id="landing-teacher-modules"')) "index.html should contain the teacher modules container."
Assert-True ($indexText.Contains('id="mode-student"')) "index.html should expose the student mode toggle."
Assert-True ($indexText.Contains('id="mode-teacher"')) "index.html should expose the teacher mode toggle."
Assert-True ($indexText -match "Режим перегляду") "index.html should label the landing mode control group."
Assert-True ($indexText -match "офіційні формулювання ІФО") "index.html should mention official IFO wording for teachers."
Assert-True ($indexText.Contains('js/landing.js')) "index.html should load landing script."

$ifoCatalogPath = Join-Path $root "js\ifo-catalog.js"
$ifoCatalogText = $decoded[$ifoCatalogPath]
Assert-True ($ifoCatalogText.Contains("export const ifoByLessonCode")) "ifo-catalog.js should export the official IFO map."
Assert-True ($ifoCatalogText.Contains("Досліджує і оцінює вплив інформаційних технологій")) "ifo-catalog.js should include standard competency text."

$landingModulesPath = Join-Path $root "js\landing-modules.js"
$landingModulesText = $decoded[$landingModulesPath]
Assert-True ($landingModulesText.Contains("export const textbookModules")) "landing-modules.js should export the textbook module map."
Assert-True ($landingModulesText.Contains("emoji:")) "landing-modules.js should tag each module with a display emoji."
Assert-True ($landingModulesText.Contains("Алгоритми довкола нас")) "landing-modules.js should document the algorithms module."
Assert-True ($landingModulesText.Contains("Творимо та ділимося")) "landing-modules.js should document the creativity module."
Assert-True ($landingModulesText.Contains("Безпека та спілкування онлайн")) "landing-modules.js should document the online safety module."

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
  "algorithm-representation-1-2",
  "draw-in-program-1-2",
  "simple-info-product-1-2",
  "sign-your-work-1-2",
  "work-alone-together-1-2",
  "internet-what-for-1-2",
  "search-online-1-2",
  "private-info-1-2",
  "kind-online-1-2",
  "check-before-share-1-2"
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
Assert-True ($catalogText.Contains("Малюємо у програмі")) "catalog.js should include the first creativity cycle lesson label."
Assert-True ($catalogText.Contains("Створюємо простий інформаційний продукт")) "catalog.js should include the simple info product lesson label."
Assert-True ($catalogText.Contains("Підписуємо свою роботу і поважаємо авторство")) "catalog.js should include the authorship lesson label."
Assert-True ($catalogText.Contains("Працюємо самостійно і разом")) "catalog.js should include the teamwork lesson label."
Assert-True ($catalogText.Contains("Для чого нам інтернет")) "catalog.js should include the first online cycle lesson label."
Assert-True ($catalogText.Contains("Шукаємо інформацію онлайн")) "catalog.js should include the search lesson label."
Assert-True ($catalogText.Contains("Що можна і що не можна повідомляти")) "catalog.js should include the privacy lesson label."
Assert-True ($catalogText.Contains("Спілкуємося чемно онлайн")) "catalog.js should include the kind communication lesson label."
Assert-True ($catalogText.Contains("Перевіряємо повідомлення перед тим, як вірити")) "catalog.js should include the verification lesson label."
Assert-True ($landingText.Contains("Як ми отримуємо інформацію очима")) "landing.js should include readable lesson descriptions."
Assert-True ($landingText.Contains("Що таке комп’ютер")) "landing.js should include descriptions for the computer cycle."
Assert-True ($landingText.Contains("Хто такий виконавець")) "landing.js should include descriptions for the algorithms cycle."
Assert-True ($landingText.Contains("подати словами, числами, стрілками")) "landing.js should include the algorithm representation description."
Assert-True ($landingText.Contains("простий цифровий малюнок")) "landing.js should include descriptions for the creativity cycle."
Assert-True ($landingText.Contains("поважати авторство")) "landing.js should include the authorship description."
Assert-True ($landingText.Contains("самостійно, у парі та в групі")) "landing.js should include the teamwork description."
Assert-True ($landingText.Contains("Для чого інтернет допомагає людям")) "landing.js should include descriptions for the online cycle."
Assert-True ($landingText.Contains("берегти особисту інформацію")) "landing.js should include the privacy description."
Assert-True ($landingText.Contains("чемно спілкуватися онлайн")) "landing.js should include the kind communication description."
Assert-True ($landingText.Contains("перевіряти повідомлення")) "landing.js should include the verification description."
Assert-True ($landingText.Contains("Відкрити урок")) "landing.js should include the primary lesson action label."
Assert-True ($landingText.Contains("ifo-catalog.js")) "landing.js should load official IFO reference data."

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
Assert-True ($guideText.Contains("Творимо та ділимося")) "LESSON_TEMPLATE_GUIDE.md should document the implemented creativity cycle."
Assert-True ($guideText.Contains("Безпека та спілкування онлайн")) "LESSON_TEMPLATE_GUIDE.md should document the implemented online cycle."
Assert-True ($guideText.Contains("Прості схеми та таблиці")) "LESSON_TEMPLATE_GUIDE.md should mention the tables lesson."
Assert-True ($guideText.Contains("Команди і виконавці")) "LESSON_TEMPLATE_GUIDE.md should mention the algorithms cycle lessons."
Assert-True ($guideText.Contains("Як записати алгоритм")) "LESSON_TEMPLATE_GUIDE.md should mention the algorithm representation lesson."
Assert-True ($guideText.Contains("Малюємо у програмі")) "LESSON_TEMPLATE_GUIDE.md should mention the drawing lesson."
Assert-True ($guideText.Contains("Підписуємо свою роботу")) "LESSON_TEMPLATE_GUIDE.md should mention the authorship lesson."
Assert-True ($guideText.Contains("Для чого нам інтернет")) "LESSON_TEMPLATE_GUIDE.md should mention the internet lesson."
Assert-True ($guideText.Contains("Спілкуємося чемно онлайн")) "LESSON_TEMPLATE_GUIDE.md should mention the kind communication lesson."

Assert-True ($workflowText.Contains("Основна лінійка для 1-2 класу")) "AI_LESSON_WORKFLOW.md should document the recommended lesson sequence."
Assert-True ($workflowText.Contains("Планувати від карти результатів")) "AI_LESSON_WORKFLOW.md should require planning from outcomes coverage."
Assert-True ($workflowText.Contains("урок не повинен зберігати прогрес")) "AI_LESSON_WORKFLOW.md should document the no-persistence rule."
Assert-True ($workflowText.Contains("перший блок у режимі учня має бути мотиваційним гачком")) "AI_LESSON_WORKFLOW.md should document the student hero rule."
Assert-True ($workflowText.Contains("Основні частини комп’ютера")) "AI_LESSON_WORKFLOW.md should document the next computer cycle."
Assert-True ($workflowText.Contains("Множини. Групуємо та впорядковуємо")) "AI_LESSON_WORKFLOW.md should mention the sets lesson."
Assert-True ($workflowText.Contains("table-read")) "AI_LESSON_WORKFLOW.md should document the table-read activity type."
Assert-True ($workflowText.Contains("Команди і виконавці")) "AI_LESSON_WORKFLOW.md should include the algorithms planning template."
Assert-True ($workflowText.Contains("Як записати алгоритм")) "AI_LESSON_WORKFLOW.md should include the algorithm representation lesson."
Assert-True ($workflowText.Contains("Творимо та ділимося")) "AI_LESSON_WORKFLOW.md should include the creativity cycle roadmap."
Assert-True ($workflowText.Contains("Працюємо самостійно і разом")) "AI_LESSON_WORKFLOW.md should include the teamwork lesson."
Assert-True ($workflowText.Contains("Безпека та спілкування онлайн")) "AI_LESSON_WORKFLOW.md should include the online cycle roadmap."
Assert-True ($workflowText.Contains("Шукаємо інформацію онлайн")) "AI_LESSON_WORKFLOW.md should include the search lesson."
Assert-True ($workflowText.Contains("Перевіряємо повідомлення перед тим, як вірити")) "AI_LESSON_WORKFLOW.md should include the verification lesson."

foreach ($htmlFile in @(
  "m1-01-info-types.html",
  "m1-02-info-presentation.html",
  "m1-03-message-actions.html",
  "m1-04-objects-models.html",
  "m1-05-info-history-coding.html",
  "m1-06-sources-truth.html",
  "m1-07-sets-order.html",
  "m1-08-simple-tables.html",
  "m2-01-computer-what-is.html",
  "m2-02-computer-types.html",
  "m2-03-computer-parts.html",
  "m2-04-device-purpose.html",
  "m2-05-computer-problems-help.html",
  "m2-06-computer-safety.html",
  "m3-01-commands-executors.html",
  "m3-02-action-sequence.html",
  "m3-03-everyday-algorithm.html",
  "m3-04-find-fix-order.html",
  "m3-05-algorithm-representation.html",
  "m4-01-draw-in-program.html",
  "m4-02-simple-info-product.html",
  "m4-03-sign-your-work.html",
  "m4-04-work-alone-together.html",
  "m5-01-internet-what-for.html",
  "m5-02-search-online.html",
  "m5-03-private-info.html",
  "m5-04-kind-online.html",
  "m5-05-check-before-share.html"
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
