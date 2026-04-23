param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

$services = @(
  @{ Key = 'text'; Path = 'text'; Menu = @('file', 'edit', 'insert', 'view', 'help') },
  @{ Key = 'tables'; Path = 'tables'; Menu = @('file', 'edit', 'insert', 'format', 'data', 'view', 'help') },
  @{ Key = 'paint'; Path = 'paint'; Menu = @('file', 'edit', 'view', 'help') },
  @{ Key = 'slides'; Path = 'slides'; Menu = @('file', 'edit', 'insert', 'slide', 'view', 'help') },
  @{ Key = 'flowcharts'; Path = 'flowcharts'; Menu = @('file', 'edit', 'insert', 'view', 'help') },
  @{ Key = 'vector'; Path = 'vector'; Menu = @('file', 'edit', 'insert', 'format', 'help') }
)

$requiredRootFiles = @(
  'ART_OFFICE_UI_STANDARD.md',
  'UI_INTEGRATION_GUIDE.md',
  'UI_TOKENS.css',
  'design-tokens.json',
  'SERVICE_THEME_MAP.json',
  'KEYBOARD_SHORTCUTS.md',
  'WORKSPACE_ACCESSIBILITY.md',
  'MODAL_STANDARD.md',
  'DROPDOWN_STANDARD.md',
  'CONTEXTUAL_UI_STANDARD.md',
  'COMPONENT_CHECKLIST.md',
  'office-ui.js',
  'offline.js',
  'sw.js'
)

$failures = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

function Assert-True {
  param([bool]$Condition, [string]$Message)
  if (-not $Condition) { $script:failures.Add($Message) }
}

function Add-Warning {
  param([string]$Message)
  $script:warnings.Add($Message)
}

function Assert-CommandOrder {
  param(
    [string]$Html,
    [string]$ServicePath
  )

  $requiredCommands = @('new', 'open', 'save', 'undo', 'redo')
  $lastIndex = -1
  foreach ($command in $requiredCommands) {
    $match = [regex]::Match($Html, "data-office-command=""$command""")
    Assert-True $match.Success "${ServicePath}: toolbar is missing standard command marker: $command"
    if ($match.Success) {
      Assert-True ($match.Index -gt $lastIndex) "${ServicePath}: standard toolbar command order is wrong near: $command"
      $lastIndex = $match.Index
    }
  }
}

foreach ($file in $requiredRootFiles) {
  Assert-True (Test-Path (Join-Path $Root $file)) "Missing required root standard file: $file"
}

$normativeDocFiles = @(
  'README.md',
  'UI_INTEGRATION_GUIDE.md',
  'COMPONENT_CHECKLIST.md',
  'APP_SHELL.html',
  'SHELL_COMPONENTS.md',
  'SERVICE_SHELL_BLUEPRINTS.md',
  'WORKSPACE_ACCESSIBILITY.md',
  'MODAL_STANDARD.md',
  'DROPDOWN_STANDARD.md',
  'CONTEXTUAL_UI_STANDARD.md',
  'UI_REVIEW_TEMPLATE.md',
  'CHANGELOG_STANDARD.md'
)

$legacyBrandPatterns = @(
  'data-art-service',
  '\.art-',
  '\bart-app\b',
  '\bart-header\b',
  '\bart-menubar\b',
  '\bart-toolbar\b',
  '\bart-statusbar\b',
  '\bart-workspace\b',
  '/office/art-',
  'UI_REVIEW_art-'
)

foreach ($docFile in $normativeDocFiles) {
  $fullPath = Join-Path $Root $docFile
  if (-not (Test-Path $fullPath)) { continue }
  $content = Get-Content -Raw -Encoding UTF8 $fullPath
  foreach ($pattern in $legacyBrandPatterns) {
    Assert-True ($content -notmatch $pattern) "${docFile}: contains legacy branded shell term matching ${pattern}"
  }
}

$rootIndexPath = Join-Path $Root 'index.html'
if (Test-Path $rootIndexPath) {
  $rootHtml = Get-Content -Raw -Encoding UTF8 $rootIndexPath
  Assert-True ($rootHtml -notmatch '/office/art-') "Root index still contains old /office/art-* links"
  Assert-True ($rootHtml -notmatch '/office/office-') "Root index contains invalid /office/office-* links"
  foreach ($service in $services) {
    Assert-True ($rootHtml -match "href=""$($service.Path)/""") "Root index is missing relative link to $($service.Path)/"
  }
}

$themeMapPath = Join-Path $Root 'SERVICE_THEME_MAP.json'
if (Test-Path $themeMapPath) {
  $themeMap = Get-Content -Raw -Encoding UTF8 $themeMapPath | ConvertFrom-Json
  foreach ($service in $services) {
    $serviceConfig = $themeMap.services.PSObject.Properties[$service.Key].Value
    Assert-True ($null -ne $serviceConfig) "SERVICE_THEME_MAP.json is missing $($service.Key)"
    Assert-True ($serviceConfig.serviceKey -eq $service.Key) "SERVICE_THEME_MAP.json has wrong serviceKey for $($service.Key)"
  }
}

foreach ($service in $services) {
  $serviceRoot = Join-Path $Root $service.Path
  $indexPath = Join-Path $serviceRoot 'index.html'
  Assert-True (Test-Path $serviceRoot) "Missing service directory: $($service.Path)"
  Assert-True (Test-Path $indexPath) "Missing index.html for service: $($service.Path)"
  Assert-True (Test-Path (Join-Path $serviceRoot 'UI_STANDARD.md')) "Missing UI_STANDARD.md for service: $($service.Path)"
  Assert-True (Test-Path (Join-Path $serviceRoot 'UI_MIGRATION_TO_STANDARD.md')) "Missing UI_MIGRATION_TO_STANDARD.md for service: $($service.Path)"

  if (-not (Test-Path $indexPath)) { continue }

  $html = Get-Content -Raw -Encoding UTF8 $indexPath
  Assert-True ($html -match 'href="\.\./UI_TOKENS\.css"') "$($service.Path): UI_TOKENS.css is not linked before local styling"
  Assert-True ($html -match 'src="\.\./office-ui\.js"') "$($service.Path): office-ui.js is not linked"
  Assert-True ($html -match 'src="\.\./offline\.js"') "$($service.Path): offline.js is not registered"
  Assert-True ($html -match '<body[^>]*class="[^"]*\boffice-app\b[^"]*"') "$($service.Path): body is missing office-app class"
  Assert-True ($html -match "<body[^>]*data-office-service=""$($service.Key)""") "$($service.Path): body has missing or wrong data-office-service"
  Assert-True ($html -match '<header[^>]*class="[^"]*\boffice-header\b[^"]*"') "$($service.Path): header is missing office-header class"
  Assert-True ($html -match '<nav[^>]*class="[^"]*\boffice-menubar\b[^"]*"') "$($service.Path): menubar is missing office-menubar class"
  Assert-True ($html -match 'class="[^"]*\boffice-toolbar\b[^"]*"') "$($service.Path): toolbar is missing office-toolbar class"
  Assert-True ($html -match 'class="[^"]*\boffice-workspace\b[^"]*"') "$($service.Path): workspace is missing office-workspace class"
  Assert-True ($html -match 'class="[^"]*\boffice-statusbar\b[^"]*"') "$($service.Path): statusbar is missing office-statusbar class"
  Assert-True ($html -match '<footer[^>]*class="[^"]*\boffice-statusbar\b[^"]*"[^>]*aria-label=') "$($service.Path): statusbar should have an aria-label"
  Assert-True ($html -match 'data-office-status-slot="primary"') "$($service.Path): statusbar is missing primary status slot"
  Assert-True ($html -match 'data-office-status-slot="secondary"') "$($service.Path): statusbar is missing secondary status slot"
  Assert-True ($html -match 'class="[^"]*\boffice-workspace-focusable\b[^"]*"') "$($service.Path): workspace is missing office-workspace-focusable class"
  Assert-True ($html -match 'office-workspace-focusable[^>]*tabindex="0"|tabindex="0"[^>]*office-workspace-focusable') "$($service.Path): focusable workspace should have tabindex=0"
  Assert-True ($html -match 'class="[^"]*\bmodal(?:-overlay)?\b[^"]*"') "$($service.Path): expected at least one modal surface for standard behavior checks"
  Assert-CommandOrder $html $service.Path

  foreach ($menuKey in $service.Menu) {
    Assert-True ($html -match "data-menu=""$menuKey""") "$($service.Path): expected menu key is missing: $menuKey"
  }

  $externalMatches = [regex]::Matches($html, '<(?:script|link|img|source)\b[^>]*(?:src|href)="https?://')
  if ($externalMatches.Count -gt 0) {
    Add-Warning "$($service.Path): external resources are still present ($($externalMatches.Count)); offline hardening is a later migration step."
  }
}

$runtimeFiles = @(
  'paint/js/ui.js',
  'paint/js/app.js',
  'vector/js/ui.js',
  'vector/js/app.js',
  'tables/js/ui.js',
  'tables/js/grid.js',
  'tables/js/main.js',
  'tables/js/workbook.js',
  'slides/js/app.js'
)

foreach ($runtimeFile in $runtimeFiles) {
  $fullPath = Join-Path $Root $runtimeFile
  if (-not (Test-Path $fullPath)) { continue }
  $content = Get-Content -Raw -Encoding UTF8 $fullPath
  Assert-True ($content -notmatch '\bshowAlert\b') "${runtimeFile}: legacy showAlert API should be renamed to modal semantics"
  Assert-True ($content -notmatch '\balertModal\b') "${runtimeFile}: legacy alertModal API should be renamed to modal semantics"
  Assert-True ($content -notmatch '\bshowTextPrompt\b') "${runtimeFile}: legacy showTextPrompt API should be renamed to modal semantics"
  Assert-True ($content -notmatch "confirmText\s*=\s*'Так'") "${runtimeFile}: confirm modal defaults should use specific actions, not Так"
}

$modalMarkupFiles = @(
  'tables/index.html',
  'paint/index.html',
  'vector/index.html',
  'slides/index.html',
  'text/index.html'
)

foreach ($modalMarkupFile in $modalMarkupFiles) {
  $fullPath = Join-Path $Root $modalMarkupFile
  if (-not (Test-Path $fullPath)) { continue }
  $content = Get-Content -Raw -Encoding UTF8 $fullPath
  Assert-True ($content -notmatch '>Так</button>') "${modalMarkupFile}: modal buttons should use specific action labels, not Так"
  Assert-True ($content -notmatch '>Ні</button>') "${modalMarkupFile}: modal buttons should use Скасувати instead of Ні"
}

if ($warnings.Count -gt 0) {
  Write-Host "WARNINGS"
  foreach ($warning in $warnings) {
    Write-Host "  - $warning"
  }
}

if ($failures.Count -gt 0) {
  Write-Host "FAILURES"
  foreach ($failure in $failures) {
    Write-Host "  - $failure"
  }
  exit 1
}

Write-Host "Static UI audit passed for $($services.Count) editors."

