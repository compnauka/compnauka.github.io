$ErrorActionPreference = 'Stop'

function Read-Utf8File {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $bytes = [System.IO.File]::ReadAllBytes($Path)
    return [System.Text.Encoding]::UTF8.GetString($bytes)
}

function Assert-True {
    param(
        [Parameter(Mandatory = $true)]
        [bool]$Condition,
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

function Assert-MatchCount {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Text,
        [Parameter(Mandatory = $true)]
        [string]$Pattern,
        [Parameter(Mandatory = $true)]
        [int]$Expected,
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    $count = ([regex]::Matches($Text, $Pattern)).Count
    Assert-True ($count -eq $Expected) "$Message Expected: $Expected. Actual: $count."
}

function Assert-NoBrokenEncoding {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Text,
        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    $replacementChar = [string][char]0xFFFD
    $badFragments = @(
        $replacementChar,
        ([string][char]0x00D0),
        ([string][char]0x00D1),
        ([string][char]0x00C2),
        ([string][char]0x00E2 + [char]0x20AC + [char]0x2122),
        ([string][char]0x00E2 + [char]0x20AC + [char]0x0153),
        ([string][char]0x00E2 + [char]0x20AC + [char]0x009D),
        ([string][char]0x00E2 + [char]0x20AC + [char]0x201C),
        ([string][char]0x00E2 + [char]0x20AC + [char]0x201D)
    )

    foreach ($fragment in $badFragments) {
        Assert-True (-not $Text.Contains($fragment)) "$Label contains signs of broken UTF-8 text: '$fragment'."
    }
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$indexPath = Join-Path $projectRoot 'index.html'
$mainPath = Join-Path $projectRoot 'main.js'
$quizContentPath = Join-Path $projectRoot 'quiz-content.uk.js'
$stylePath = Join-Path $projectRoot 'style.css'
$tokensPath = Join-Path $projectRoot 'tokens.css'
$manifestPath = Join-Path $projectRoot 'manifest.json'
$offlinePath = Join-Path $projectRoot 'offline.html'
$swPath = Join-Path $projectRoot 'sw.js'
$uiStringsPath = Join-Path $projectRoot 'ui-strings.js'
$gameServicesPath = Join-Path $projectRoot 'game-services.js'
$gameRenderersPath = Join-Path $projectRoot 'game-renderers.js'
$browserSmokePath = Join-Path $PSScriptRoot 'browser-smoke.html'
$browserSmokeRunnerPath = Join-Path $PSScriptRoot 'run-browser-smoke.ps1'
$checklistPath = Join-Path $projectRoot 'TESTING_CHECKLIST.md'

$indexHtml = Read-Utf8File -Path $indexPath
$mainJs = Read-Utf8File -Path $mainPath
$quizContentJs = Read-Utf8File -Path $quizContentPath
$styleCss = Read-Utf8File -Path $stylePath
$tokensCss = Read-Utf8File -Path $tokensPath
$manifestJson = Read-Utf8File -Path $manifestPath
$offlineHtml = Read-Utf8File -Path $offlinePath
$serviceWorker = Read-Utf8File -Path $swPath
$uiStrings = Read-Utf8File -Path $uiStringsPath
$gameServicesJs = Read-Utf8File -Path $gameServicesPath
$gameRenderersJs = Read-Utf8File -Path $gameRenderersPath
$browserSmokeHtml = Read-Utf8File -Path $browserSmokePath
$browserSmokeRunner = Read-Utf8File -Path $browserSmokeRunnerPath
$testingChecklist = Read-Utf8File -Path $checklistPath

Write-Host 'Running UTF-8 integrity checks...'
Assert-NoBrokenEncoding -Text $indexHtml -Label 'index.html'
Assert-NoBrokenEncoding -Text $mainJs -Label 'main.js'
Assert-NoBrokenEncoding -Text $quizContentJs -Label 'quiz-content.uk.js'
Assert-NoBrokenEncoding -Text $styleCss -Label 'style.css'
Assert-NoBrokenEncoding -Text $tokensCss -Label 'tokens.css'
Assert-NoBrokenEncoding -Text $manifestJson -Label 'manifest.json'
Assert-NoBrokenEncoding -Text $offlineHtml -Label 'offline.html'
Assert-NoBrokenEncoding -Text $serviceWorker -Label 'sw.js'
Assert-NoBrokenEncoding -Text $uiStrings -Label 'ui-strings.js'
Assert-NoBrokenEncoding -Text $gameServicesJs -Label 'game-services.js'
Assert-NoBrokenEncoding -Text $gameRenderersJs -Label 'game-renderers.js'
Assert-NoBrokenEncoding -Text $browserSmokeHtml -Label 'tests/browser-smoke.html'
Assert-NoBrokenEncoding -Text $browserSmokeRunner -Label 'tests/run-browser-smoke.ps1'
Assert-NoBrokenEncoding -Text $testingChecklist -Label 'TESTING_CHECKLIST.md'

Write-Host 'Running content structure checks...'
Assert-MatchCount -Text $quizContentJs -Pattern 'topic:\s*"' -Expected 13 -Message 'The number of topics changed.'
Assert-MatchCount -Text $quizContentJs -Pattern 'variations:\s*\[' -Expected 13 -Message 'Each topic must keep its variations block.'
Assert-MatchCount -Text $quizContentJs -Pattern 'correct:\s*true' -Expected 39 -Message 'Each variation must keep exactly one correct answer.'
Assert-MatchCount -Text $quizContentJs -Pattern 'dialogue:\s*"' -Expected 39 -Message 'The number of dialogue variations changed.'
Assert-MatchCount -Text $quizContentJs -Pattern 'storyCheckpoints\s*=\s*\{' -Expected 1 -Message 'storyCheckpoints block is missing or duplicated.'
Assert-True ($quizContentJs.Contains('window.QUIZ_CONTENT.missionDatabase')) 'quiz-content.uk.js lost the QUIZ_CONTENT missionDatabase registry.'
Assert-True ($quizContentJs.Contains('window.QUIZ_CONTENT.storyCheckpoints')) 'quiz-content.uk.js lost the QUIZ_CONTENT storyCheckpoints registry.'

$optionBlocks = [regex]::Matches($quizContentJs, 'options:\s*\[(.*?)\]\s*\}', [System.Text.RegularExpressions.RegexOptions]::Singleline)
Assert-True ($optionBlocks.Count -eq 39) "The number of options blocks changed. Expected: 39. Actual: $($optionBlocks.Count)."

foreach ($block in $optionBlocks) {
    $optionCount = ([regex]::Matches($block.Groups[1].Value, 'text:\s*"')).Count
    Assert-True ($optionCount -eq 4) "A variation does not contain exactly 4 answer options. Actual: $optionCount."

    $correctCount = ([regex]::Matches($block.Groups[1].Value, 'correct:\s*true')).Count
    Assert-True ($correctCount -eq 1) "A variation does not contain exactly 1 correct answer. Actual: $correctCount."
}

Write-Host 'Running app shell checks...'
Assert-True ($indexHtml.Contains('<html lang="uk">')) 'index.html lost lang="uk".'
Assert-True ($indexHtml.Contains('<meta charset="UTF-8">')) 'index.html lost UTF-8 charset.'
Assert-True (-not $indexHtml.Contains('user-scalable=no')) 'index.html must not disable zoom.'
Assert-True ($indexHtml.Contains('class="skip-link"')) 'index.html lost the skip link.'
Assert-True ($indexHtml.Contains('id="sr-status"')) 'index.html lost the polite live region.'
Assert-True ($indexHtml.Contains('id="sr-alert"')) 'index.html lost the assertive live region.'
Assert-True ($indexHtml.Contains('id="main-content"')) 'index.html lost the main content landmark.'
Assert-True ($indexHtml.Contains('id="start-screen-title"')) 'index.html lost the start screen heading id.'
Assert-True ($indexHtml.Contains('id="level-indicator" aria-live="polite"')) 'index.html lost live announcements on the level indicator.'
Assert-True ($indexHtml.Contains('id="progress-bar" role="progressbar"')) 'index.html lost the progress bar semantics.'
Assert-True ($indexHtml.Contains('href="manifest.json"')) 'index.html no longer links the web manifest.'
Assert-True ($indexHtml.Contains('href="tokens.css"')) 'index.html no longer loads tokens.css.'
Assert-True ($indexHtml.Contains('src="ui-strings.js"')) 'index.html no longer loads ui-strings.js.'
Assert-True ($indexHtml.Contains('src="quiz-content.uk.js"')) 'index.html no longer loads quiz-content.uk.js.'
Assert-True ($indexHtml.Contains('src="game-services.js"')) 'index.html no longer loads game-services.js.'
Assert-True ($indexHtml.Contains('src="game-renderers.js"')) 'index.html no longer loads game-renderers.js.'
Assert-True (-not $indexHtml.Contains('src="questions.js"')) 'index.html still loads removed legacy questions.js.'
Assert-True ($indexHtml.Contains('action-button action-button--success')) 'index.html lost the semantic success button class.'
Assert-True ($indexHtml.Contains('action-button action-button--light')) 'index.html lost the semantic light button class.'
Assert-True ($indexHtml.Contains('panel-card')) 'index.html lost the semantic panel-card class.'
Assert-True ($indexHtml.Contains('game-shell')) 'index.html lost the game-shell class.'
Assert-True ($indexHtml.Contains('hero-badge')) 'index.html lost the hero badge class.'
Assert-True ($indexHtml.Contains('footer-panel')) 'index.html lost the footer-panel class.'
Assert-True ($indexHtml.Contains('<script src="main.js" defer></script>')) 'index.html no longer loads main.js with defer.'
Assert-True ($mainJs.Contains("document.addEventListener('DOMContentLoaded'")) 'main.js lost the DOMContentLoaded entry point.'
Assert-True ($mainJs.Contains('window.ServerRescueModules')) 'main.js no longer reads the shared module registry.'
Assert-True ($mainJs.Contains('window.QUIZ_CONTENT')) 'main.js no longer reads from QUIZ_CONTENT.'
Assert-True ($mainJs.Contains("localStorage.setItem('serverRescue_progress'")) 'main.js lost progress persistence.'
Assert-True ($mainJs.Contains("localStorage.removeItem('serverRescue_progress'")) 'main.js lost progress reset handling.'
Assert-True ($mainJs.Contains('function announceStatus')) 'main.js lost status announcements.'
Assert-True ($mainJs.Contains('function announceAlert')) 'main.js lost alert announcements.'
Assert-True ($mainJs.Contains('function focusAnswerByOffset')) 'main.js lost arrow-key answer navigation.'
Assert-True ($mainJs.Contains('function setProgressState')) 'main.js lost the shared progress-state helper.'
Assert-True ($mainJs.Contains('function clearInteractionArea')) 'main.js lost the shared interaction-area helper.'
Assert-True ($mainJs.Contains('function stopTimer')) 'main.js lost the shared timer helper.'
Assert-True ($mainJs.Contains('renderTimerWarning')) 'main.js lost the timer extension warning flow.'
Assert-True ($mainJs.Contains('navigator.serviceWorker.register')) 'main.js lost service worker registration.'
Assert-True ($mainJs.Contains('function applyStaticStrings')) 'main.js lost static string application.'
Assert-True (($mainJs.Contains('action-button action-button--primary')) -or ($gameRenderersJs.Contains('action-button action-button--primary'))) 'Semantic primary action buttons are no longer defined in JS renderers.'
Assert-True ($mainJs.Contains('action-button action-button--warning')) 'main.js lost semantic warning action buttons.'
Assert-True ($mainJs.Contains('answer-option--correct')) 'main.js lost semantic correct answer state.'
Assert-True ($mainJs.Contains('answer-option--incorrect')) 'main.js lost semantic incorrect answer state.'
Assert-True ($styleCss.Contains('.typing-effect::after')) 'style.css lost the typing effect styles.'
Assert-True ($styleCss.Contains('.no-scrollbar')) 'style.css lost the scrollbar utility.'
Assert-True ($styleCss.Contains('.sr-only')) 'style.css lost the screen-reader-only utility.'
Assert-True ($styleCss.Contains('.skip-link')) 'style.css lost the skip-link styles.'
Assert-True ($styleCss.Contains('.action-button')) 'style.css lost the semantic action button class.'
Assert-True ($styleCss.Contains('.panel-card')) 'style.css lost the semantic panel card class.'
Assert-True ($styleCss.Contains('.answer-option')) 'style.css lost the semantic answer option class.'
Assert-True ($styleCss.Contains('.toolbar-button')) 'style.css lost the toolbar button class.'
Assert-True ($styleCss.Contains('.robot-avatar-shell')) 'style.css lost the robot avatar shell class.'
Assert-True ($styleCss.Contains('.footer-panel')) 'style.css lost the footer panel class.'
Assert-True ($styleCss.Contains('.progress-shell')) 'style.css lost the progress shell class.'
Assert-True ($styleCss.Contains('@media (prefers-reduced-motion: reduce)')) 'style.css lost reduced-motion protection.'
Assert-True ($tokensCss.Contains(':root')) 'tokens.css lost the root token block.'
Assert-True ($tokensCss.Contains('--color-focus-ring')) 'tokens.css lost focus ring token.'
Assert-True ($manifestJson.Contains('"display": "standalone"')) 'manifest.json lost standalone display mode.'
Assert-True ($manifestJson.Contains('"lang": "uk"')) 'manifest.json lost lang=uk.'
Assert-True ($offlineHtml.Contains('class="offline-card"')) 'offline.html lost its offline card container.'
Assert-True ($offlineHtml.Contains('href="./index.html"')) 'offline.html lost the return link to the app.'
Assert-True ($serviceWorker.Contains('offline.html')) 'sw.js lost the offline fallback.'
Assert-True ($serviceWorker.Contains('STATIC_ASSETS')) 'sw.js lost the static asset list.'
Assert-True ($serviceWorker.Contains('quiz-content.uk.js')) 'sw.js no longer caches quiz-content.uk.js.'
Assert-True ($serviceWorker.Contains('game-services.js')) 'sw.js no longer caches game-services.js.'
Assert-True ($serviceWorker.Contains('game-renderers.js')) 'sw.js no longer caches game-renderers.js.'
Assert-True (-not $serviceWorker.Contains('questions.js')) 'sw.js still caches removed legacy questions.js.'
Assert-True ($uiStrings.Contains('window.UI_STRINGS')) 'ui-strings.js lost the UI string registry.'
Assert-True ($gameServicesJs.Contains('window.ServerRescueModules.createSoundFX')) 'game-services.js lost createSoundFX.'
Assert-True ($gameServicesJs.Contains('window.ServerRescueModules.shuffleArray')) 'game-services.js lost shuffleArray.'
Assert-True ($gameRenderersJs.Contains('window.ServerRescueModules.createGameRenderers')) 'game-renderers.js lost createGameRenderers.'
Assert-True ($gameRenderersJs.Contains('function renderOptions')) 'game-renderers.js lost renderOptions.'
Assert-True ($browserSmokeHtml.Contains('../main.js')) 'browser-smoke.html no longer loads main.js.'
Assert-True ($browserSmokeHtml.Contains("output.dataset.result = 'pass'")) 'browser-smoke.html lost the pass marker.'
Assert-True ($browserSmokeHtml.Contains('timer-warning')) 'browser-smoke.html lost the timer-warning scenario marker.'
Assert-True ($browserSmokeHtml.Contains('checkpoint-continue')) 'browser-smoke.html lost the checkpoint continue scenario marker.'
Assert-True ($browserSmokeHtml.Contains('reset-top')) 'browser-smoke.html lost the reset-top scenario marker.'
Assert-True ($browserSmokeHtml.Contains('end-screen')) 'browser-smoke.html lost the end-screen scenario marker.'
Assert-True ($browserSmokeHtml.Contains('restart-end-screen')) 'browser-smoke.html lost the restart scenario marker.'
Assert-True ($browserSmokeRunner.Contains('--dump-dom')) 'run-browser-smoke.ps1 lost DOM dump mode.'
Assert-True ($browserSmokeRunner.Contains('Browser smoke passed.')) 'run-browser-smoke.ps1 lost success output.'
Assert-True ($uiStrings.Contains('app:')) 'ui-strings.js lost app strings.'
Assert-True ($uiStrings.Contains('runtime:')) 'ui-strings.js lost runtime strings.'
Assert-True ($uiStrings.Contains('offline:')) 'ui-strings.js lost offline strings.'
Assert-True ($testingChecklist.Contains('Fast Smoke')) 'TESTING_CHECKLIST.md lost the smoke-test section.'
Assert-True ($testingChecklist.Contains('Manual Accessibility')) 'TESTING_CHECKLIST.md lost the accessibility section.'

Write-Host 'Running browser smoke test...'
& powershell -ExecutionPolicy Bypass -File $browserSmokeRunnerPath
if ($LASTEXITCODE -ne 0) {
    throw "Browser smoke test process failed with exit code $LASTEXITCODE."
}

Write-Host ''
Write-Host 'All tests passed.' -ForegroundColor Green
