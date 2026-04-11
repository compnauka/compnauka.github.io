Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$templatePath = Join-Path $root "lesson-page.template.html"
$template = Get-Content -Raw -Encoding UTF8 $templatePath

$lessons = @(
  @{
    Id = "info-types-1-2"
    File = "info-types-1-2.html"
    PageTitle = "Інтерактивний урок | Інформація. Як ми сприймаємо інформацію"
    H1 = "Інформація. Як ми сприймаємо інформацію"
    Description = "Інтерактивний урок для 1-2 класу: як ми сприймаємо інформацію різними органами чуття."
  },
  @{
    Id = "info-presentation-1-2"
    File = "info-presentation-1-2.html"
    PageTitle = "Інтерактивний урок | Види інформації та способи подання"
    H1 = "Види інформації та способи подання"
    Description = "Інтерактивний урок для 1-2 класу: як інформацію можна подати текстом, малюнком, звуком, знаком і сигналом."
  },
  @{
    Id = "message-actions-1-2"
    File = "message-actions-1-2.html"
    PageTitle = "Інтерактивний урок | Дії з інформацією. Що ми робимо з повідомленнями"
    H1 = "Дії з інформацією. Що ми робимо з повідомленнями"
    Description = "Інтерактивний урок для 1-2 класу: як ми отримуємо, передаємо й зберігаємо повідомлення."
  },
  @{
    Id = "objects-models-1-2"
    File = "objects-models-1-2.html"
    PageTitle = "Інтерактивний урок | Об’єкти, властивості, моделі"
    H1 = "Об’єкти, властивості, моделі"
    Description = "Інтерактивний урок для 1-2 класу: об’єкти, їхні властивості, значення властивостей і прості моделі."
  },
  @{
    Id = "info-history-coding-1-2"
    File = "info-history-coding-1-2.html"
    PageTitle = "Інтерактивний урок | Кодування інформації"
    H1 = "Кодування інформації"
    Description = "Інтерактивний урок для 1-2 класу: кодування інформації через знаки, сигнали, цифри й піктограми."
  },
  @{
    Id = "sources-truth-1-2"
    File = "sources-truth-1-2.html"
    PageTitle = "Інтерактивний урок | Джерела інформації. Правдиве і неправдиве"
    H1 = "Джерела інформації. Правдиве і неправдиве"
    Description = "Інтерактивний урок для 1-2 класу: джерела інформації, перевірка та відрізнення правдивих і неправдивих тверджень."
  },
  @{
    Id = "sets-order-1-2"
    File = "sets-order-1-2.html"
    PageTitle = "Інтерактивний урок | Множини. Групуємо та впорядковуємо"
    H1 = "Множини. Групуємо та впорядковуємо"
    Description = "Інтерактивний урок для 1-2 класу: групування предметів, порівняння груп і впорядкування за простою ознакою."
  },
  @{
    Id = "simple-tables-1-2"
    File = "simple-tables-1-2.html"
    PageTitle = "Інтерактивний урок | Прості схеми та таблиці"
    H1 = "Прості схеми та таблиці"
    Description = "Інтерактивний урок для 1-2 класу: прості схеми, рядки, стовпці й читання таблиць."
  }
)

foreach ($lesson in $lessons) {
  $html = $template
  $html = $html.Replace("{{LESSON_ID}}", $lesson.Id)
  $html = $html.Replace("{{PAGE_TITLE}}", $lesson.PageTitle)
  $html = $html.Replace("{{H1_TITLE}}", $lesson.H1)
  $html = $html.Replace("{{META_DESCRIPTION}}", $lesson.Description)
  $html = $html.Replace("{{OG_TITLE}}", $lesson.PageTitle)
  $html = $html.Replace("{{OG_DESCRIPTION}}", $lesson.Description)

  $targetPath = Join-Path $root $lesson.File
  [System.IO.File]::WriteAllText($targetPath, $html, [System.Text.UTF8Encoding]::new($false))
  Write-Host "Generated $($lesson.File)"
}
