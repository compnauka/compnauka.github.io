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
  },
  @{
    Id = "computer-what-is-1-2"
    File = "computer-what-is-1-2.html"
    PageTitle = "Інтерактивний урок | Що таке комп’ютер і де ми його зустрічаємо"
    H1 = "Що таке комп’ютер і де ми його зустрічаємо"
    Description = "Інтерактивний урок для 1-2 класу: що таке комп’ютер, де ми його бачимо і як він допомагає людині."
  },
  @{
    Id = "computer-types-1-2"
    File = "computer-types-1-2.html"
    PageTitle = "Інтерактивний урок | Які бувають комп’ютери"
    H1 = "Які бувають комп’ютери"
    Description = "Інтерактивний урок для 1-2 класу: настільний комп’ютер, ноутбук, планшет і смартфон."
  },
  @{
    Id = "computer-parts-1-2"
    File = "computer-parts-1-2.html"
    PageTitle = "Інтерактивний урок | Основні частини комп’ютера"
    H1 = "Основні частини комп’ютера"
    Description = "Інтерактивний урок для 1-2 класу: монітор, клавіатура, миша та інші основні частини комп’ютера."
  },
  @{
    Id = "device-purpose-1-2"
    File = "device-purpose-1-2.html"
    PageTitle = "Інтерактивний урок | Для чого потрібні різні пристрої"
    H1 = "Для чого потрібні різні пристрої"
    Description = "Інтерактивний урок для 1-2 класу: які пристрої допомагають бачити, слухати, друкувати і говорити."
  },
  @{
    Id = "computer-problems-help-1-2"
    File = "computer-problems-help-1-2.html"
    PageTitle = "Інтерактивний урок | Коли щось не виходить: помічаю проблему і звертаюся по допомогу"
    H1 = "Коли щось не виходить: помічаю проблему і звертаюся по допомогу"
    Description = "Інтерактивний урок для 1-2 класу: що робити, якщо пристрій працює не так і як звертатися по допомогу."
  },
  @{
    Id = "computer-safety-1-2"
    File = "computer-safety-1-2.html"
    PageTitle = "Інтерактивний урок | Як працювати безпечно і дбайливо"
    H1 = "Як працювати безпечно і дбайливо"
    Description = "Інтерактивний урок для 1-2 класу: безпечна і охайна робота з комп’ютером."
  },
  @{
    Id = "commands-executors-1-2"
    File = "commands-executors-1-2.html"
    PageTitle = "Інтерактивний урок | Команди і виконавці"
    H1 = "Команди і виконавці"
    Description = "Інтерактивний урок для 1-2 класу: точні команди, виконавці та прості вказівки."
  },
  @{
    Id = "action-sequence-1-2"
    File = "action-sequence-1-2.html"
    PageTitle = "Інтерактивний урок | Послідовність дій"
    H1 = "Послідовність дій"
    Description = "Інтерактивний урок для 1-2 класу: як складати просту послідовність дій у правильному порядку."
  },
  @{
    Id = "everyday-algorithm-1-2"
    File = "everyday-algorithm-1-2.html"
    PageTitle = "Інтерактивний урок | Алгоритм у повсякденній справі"
    H1 = "Алгоритм у повсякденній справі"
    Description = "Інтерактивний урок для 1-2 класу: як скласти простий алгоритм для знайомої справи і помітити повторення."
  },
  @{
    Id = "find-fix-order-1-2"
    File = "find-fix-order-1-2.html"
    PageTitle = "Інтерактивний урок | Знайди і виправ помилку в порядку дій"
    H1 = "Знайди і виправ помилку в порядку дій"
    Description = "Інтерактивний урок для 1-2 класу: як знайти зайвий або переплутаний крок і виправити порядок дій."
  },
  @{
    Id = "algorithm-representation-1-2"
    File = "algorithm-representation-1-2.html"
    PageTitle = "Інтерактивний урок | Як записати алгоритм"
    H1 = "Як записати алгоритм"
    Description = "Інтерактивний урок для 1-2 класу: як подати алгоритм словами, кроками, стрілками або простими малюнками."
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
