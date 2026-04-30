// Факти для гри. Щоб додати новий факт, скопіюйте обʼєкт і змініть поля text, explanation, sourceTitle, sourceUrl.
// id має бути унікальним, щоб легше знаходити й редагувати конкретне твердження.
// sourceLanguage: "uk" або "en". Для дитячої гри бажано надавати перевагу україномовним джерелам.
// sourceCheckedAt — дата останньої ручної перевірки джерела.
window.FACTS_DATA = [
  {
    "id": "fact-water-freezing",
    "text": "За нормального атмосферного тиску вода замерзає за температури 0 °C.",
    "explanation": "Це факт: температуру замерзання води можна перевірити вимірюванням. У побуті важливо пам'ятати, що домішки у воді можуть трохи змінювати цю температуру.",
    "sourceTitle": "Велика українська енциклопедія — Вода",
    "sourceUrl": "https://vue.gov.ua/Вода",
    "sourceLanguage": "uk",
    "sourceNote": "Україномовне енциклопедичне джерело; підтверджує температуру плавлення/замерзання води.",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-earth-third-planet",
    "text": "Земля — третя планета від Сонця.",
    "explanation": "Це факт про розташування планет у Сонячній системі: Меркурій і Венера ближчі до Сонця, ніж Земля.",
    "sourceTitle": "Велика українська енциклопедія — Земля",
    "sourceUrl": "https://vue.gov.ua/Земля",
    "sourceLanguage": "uk",
    "sourceNote": "Україномовне енциклопедичне джерело; підтверджує, що Земля є третьою планетою від Сонця.",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-sun-star",
    "text": "Сонце — це зірка.",
    "explanation": "Це факт: Сонце випромінює світло й тепло, як інші зорі, але воно є найближчою зіркою до Землі.",
    "sourceTitle": "Енциклопедія Сучасної України — Зорі",
    "sourceUrl": "https://esu.com.ua/article-17092",
    "sourceLanguage": "uk",
    "sourceNote": "Україномовне енциклопедичне джерело; підтверджує, що найближча до Землі зоря — Сонце.",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-moon-reflects-sunlight",
    "text": "Місяць не світиться сам, а відбиває світло Сонця.",
    "explanation": "Це факт: Місяць не є зіркою, тому не створює власного світла, а лише відбиває сонячне.",
    "sourceTitle": "Вікіпедія — Місяць (супутник)",
    "sourceUrl": "https://uk.wikipedia.org/wiki/Місяць_(супутник)",
    "sourceLanguage": "uk",
    "sourceNote": "Україномовне довідкове джерело; підтверджує, що Місяць відбиває світло Сонця.",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-everest-highest",
    "text": "Еверест — найвища гора світу за висотою над рівнем моря.",
    "explanation": "Це факт, але формулювання важливе: Еверест має найбільшу висоту саме над рівнем моря.",
    "sourceTitle": "Вікіпедія — Еверест",
    "sourceUrl": "https://uk.wikipedia.org/wiki/Еверест",
    "sourceLanguage": "uk",
    "sourceNote": "Україномовне довідкове джерело; підтверджує формулювання про висоту над рівнем моря.",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-ocean-covers-earth",
    "text": "Океан покриває понад 70% поверхні Землі.",
    "explanation": "Це факт, який можна перевірити за географічними даними про нашу планету.",
    "sourceTitle": "Основи океанології — навчальний посібник",
    "sourceUrl": "https://ev.vue.gov.ua/wp-content/uploads/2023/11/Osnovy-okeanolohii-2008.pdf",
    "sourceLanguage": "uk",
    "sourceNote": "Україномовний навчальний посібник; підтверджує, що океани й моря займають близько 70,8% поверхні Землі.",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-pacific-largest-ocean",
    "text": "Найбільший океан на Землі — Тихий океан.",
    "explanation": "Це факт: Тихий океан має найбільшу площу серед океанів нашої планети.",
    "sourceTitle": "Велика українська енциклопедія — Тихий океан",
    "sourceUrl": "https://vue.gov.ua/Тихий_океан",
    "sourceLanguage": "uk",
    "sourceNote": "Україномовне енциклопедичне джерело; підтверджує, що Тихий океан — найбільший океан Землі.",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-blue-whale-largest",
    "text": "Синій кит — найбільша тварина, відома науці.",
    "explanation": "Це факт: сині кити більші за будь-яких сучасних тварин і за більшість відомих давніх тварин.",
    "sourceTitle": "WWF — Blue Whale",
    "sourceUrl": "https://www.worldwildlife.org/species/blue-whale",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-cheetah-fastest-land",
    "text": "Гепард — найшвидша наземна тварина.",
    "explanation": "Це факт: гепард пристосований до дуже швидкого бігу на короткі дистанції.",
    "sourceTitle": "National Geographic Kids — Cheetah",
    "sourceUrl": "https://kids.nationalgeographic.com/animals/mammals/facts/cheetah",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-octopus-three-hearts",
    "text": "У восьминога три серця.",
    "explanation": "Це факт: два серця допомагають рухати кров через зябра, а третє — по тілу восьминога.",
    "sourceTitle": "Smithsonian Magazine — Octopuses",
    "sourceUrl": "https://www.smithsonianmag.com/science-nature/ten-wild-facts-about-octopuses-they-have-three-hearts-big-brains-and-blue-blood-7625828/",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-bee-dance",
    "text": "Бджоли можуть передавати інформацію про їжу за допомогою особливого танцю.",
    "explanation": "Це факт: так званий танець бджіл допомагає іншим бджолам знайти напрямок до джерела їжі.",
    "sourceTitle": "Britannica — Honeybee",
    "sourceUrl": "https://www.britannica.com/animal/honeybee",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-human-body-water",
    "text": "Тіло дорослої людини приблизно на 60% складається з води.",
    "explanation": "Це факт, але відсоток може відрізнятися залежно від віку, статури та інших особливостей людини.",
    "sourceTitle": "USGS — Water and the Human Body",
    "sourceUrl": "https://www.usgs.gov/water-science-school/science/water-you-water-and-human-body",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-adult-bones",
    "text": "У більшості дорослих людей 206 кісток.",
    "explanation": "Це факт у шкільному формулюванні. У деяких людей кількість кісток може трохи відрізнятися через індивідуальні особливості.",
    "sourceTitle": "Cleveland Clinic — Bones",
    "sourceUrl": "https://my.clevelandclinic.org/health/body/25176-bones",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-human-lungs",
    "text": "Людина дихає за допомогою легень.",
    "explanation": "Це факт: легені допомагають організму отримувати кисень і виводити вуглекислий газ.",
    "sourceTitle": "MedlinePlus — Lungs and Breathing",
    "sourceUrl": "https://medlineplus.gov/lungsandbreathing.html",
    "sourceLanguage": "en",
    "sourceNote": "Старе посилання Cleveland Clinic не відкривалося; замінено на стабільніше медичне джерело.",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-heart-fist",
    "text": "Серце людини приблизно завбільшки з її кулак.",
    "explanation": "Це факт-орієнтир: розмір серця змінюється разом із ростом людини, тому його часто порівнюють із кулаком.",
    "sourceTitle": "American Heart Association — Heart Anatomy Poster",
    "sourceUrl": "https://www2.heart.org/site/DocServer/AHC_Heart_Anatomy_Poster.pdf",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-ukrainian-alphabet",
    "text": "В українській абетці 33 літери.",
    "explanation": "Це факт про сучасну українську абетку, який можна перевірити за довідковими джерелами.",
    "sourceTitle": "Енциклопедія Сучасної України — Абетка",
    "sourceUrl": "https://esu.com.ua/article-42173",
    "sourceLanguage": "uk",
    "sourceNote": "Україномовне енциклопедичне джерело; підтверджує, що сучасна українська абетка має 33 літери.",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-insects-six-legs",
    "text": "Комахи мають шість ніг.",
    "explanation": "Це факт: шість ніг — одна з головних ознак комах.",
    "sourceTitle": "Britannica — Insect",
    "sourceUrl": "https://www.britannica.com/animal/insect",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-paper-wood",
    "text": "Папір часто виготовляють із деревинної целюлози.",
    "explanation": "Це факт. Не весь папір роблять однаково, але деревинна целюлоза є одним із найпоширеніших матеріалів для його виробництва.",
    "sourceTitle": "Britannica — Paper",
    "sourceUrl": "https://www.britannica.com/technology/paper",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-oxygen-colorless",
    "text": "Кисень не має кольору й запаху.",
    "explanation": "Це факт про властивості кисню за звичайних умов.",
    "sourceTitle": "Britannica — Oxygen",
    "sourceUrl": "https://www.britannica.com/science/oxygen",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-magnet-iron",
    "text": "Магніт притягує залізо.",
    "explanation": "Це факт: залізо належить до матеріалів, які добре взаємодіють із магнітним полем.",
    "sourceTitle": "Britannica — Magnetism",
    "sourceUrl": "https://www.britannica.com/science/magnetism",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-photosynthesis",
    "text": "Під час фотосинтезу зелені рослини утворюють кисень.",
    "explanation": "Це факт: рослини використовують світло, воду й вуглекислий газ, а кисень виділяється як один із продуктів фотосинтезу.",
    "sourceTitle": "Енциклопедія Сучасної України — Міксотрофи",
    "sourceUrl": "https://esu.com.ua/article-69330",
    "sourceLanguage": "uk",
    "sourceNote": "Україномовне енциклопедичне джерело; у статті є пояснення про фотосинтез і виділення кисню.",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-bats-mammals",
    "text": "Кажани — ссавці, які вміють літати.",
    "explanation": "Це факт: кажани народжують дитинчат і вигодовують їх молоком, а також активно літають.",
    "sourceTitle": "Bat Conservation International — Bats 101",
    "sourceUrl": "https://www.batcon.org/about-bats/bats-101/",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-penguins-southern",
    "text": "Пінгвіни живуть переважно в Південній півкулі.",
    "explanation": "Це факт: більшість видів пінгвінів мешкає на південь від екватора.",
    "sourceTitle": "WWF — Penguin",
    "sourceUrl": "https://www.worldwildlife.org/species/penguin",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-year-days",
    "text": "У календарному році зазвичай 365 днів, а у високосному — 366.",
    "explanation": "Це факт про календар: додатковий день у високосному році допомагає узгоджувати календар із рухом Землі навколо Сонця.",
    "sourceTitle": "Britannica — Leap year",
    "sourceUrl": "https://www.britannica.com/science/leap-year-calendar",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-ice-floats",
    "text": "Лід плаває на поверхні води.",
    "explanation": "Це факт: лід має меншу густину, ніж рідка вода, тому він не тоне.",
    "sourceTitle": "Britannica — Ice",
    "sourceUrl": "https://www.britannica.com/science/ice",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-sahara-hot-desert",
    "text": "Сахара — найбільша спекотна пустеля у світі.",
    "explanation": "Це факт, якщо говорити саме про спекотні пустелі. Антарктида більша, але вона є холодною пустелею.",
    "sourceTitle": "Britannica — Sahara",
    "sourceUrl": "https://www.britannica.com/place/Sahara-desert-Africa",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-mars-red-planet",
    "text": "Марс часто називають Червоною планетою.",
    "explanation": "Це факт: Марс здається червонуватим через оксиди заліза, тобто іржу, у ґрунті та пилу.",
    "sourceTitle": "NASA — Mars Facts",
    "sourceUrl": "https://science.nasa.gov/mars/facts/",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-owls-neck",
    "text": "Сови можуть повертати голову приблизно до 270 градусів.",
    "explanation": "Це факт: будова шиї та судин допомагає совам повертати голову значно далі, ніж може людина.",
    "sourceTitle": "Johns Hopkins University — How owls rotate their heads without injury",
    "sourceUrl": "https://hub.jhu.edu/2013/01/31/owls-rotate-heads-without-injury/",
    "sourceLanguage": "en",
    "sourceNote": "Старий URL не відкривався; замінено на актуальний шлях статті Johns Hopkins.",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-camels-humps-fat",
    "text": "Верблюди зберігають у горбах жир, а не воду.",
    "explanation": "Це факт: запас жиру допомагає верблюдам виживати в складних умовах.",
    "sourceTitle": "National Geographic Kids — Bactrian Camel",
    "sourceUrl": "https://kids.nationalgeographic.com/animals/mammals/facts/bactrian-camel",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-giraffe-neck",
    "text": "Жирафи, як і люди, мають сім шийних хребців.",
    "explanation": "Це факт: у жирафів ці хребці дуже довгі, тому їхня шия така велика.",
    "sourceTitle": "National Geographic Kids — Giraffe",
    "sourceUrl": "https://kids.nationalgeographic.com/animals/mammals/facts/giraffe",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-ostrich-flightless",
    "text": "Страус не літає, але може швидко бігати.",
    "explanation": "Це факт: страуси мають сильні ноги й пристосовані до швидкого бігу.",
    "sourceTitle": "San Diego Zoo — Ostrich",
    "sourceUrl": "https://animals.sandiegozoo.org/animals/ostrich",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-snakes-hearing",
    "text": "Змії не мають зовнішніх вух, але можуть відчувати вібрації.",
    "explanation": "Це факт: змії сприймають частину звуків і коливань інакше, ніж люди.",
    "sourceTitle": "Britannica — Snake",
    "sourceUrl": "https://www.britannica.com/animal/snake",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-bamboo-fast-growing",
    "text": "Деякі види бамбука належать до найшвидше зростаючих рослин у світі.",
    "explanation": "Це факт у точнішому формулюванні: не кожен бамбук росте однаково швидко, але рекордні види можуть рости дуже швидко.",
    "sourceTitle": "Guinness World Records — Fastest growing plant",
    "sourceUrl": "https://www.guinnessworldrecords.com/world-records/fastest-growing-plant",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-kyiv-capital",
    "text": "Столиця України — місто Київ.",
    "explanation": "Це факт, закріплений у Конституції України.",
    "sourceTitle": "Конституція України, стаття 20",
    "sourceUrl": "https://zakon.rada.gov.ua/laws/show/254%D0%BA/96-%D0%B2%D1%80#Text",
    "sourceLanguage": "uk",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-blood-red",
    "text": "Кров людини має червоний колір.",
    "explanation": "Це факт: червоний колір крові пов'язаний із гемоглобіном у червоних кров'яних клітинах.",
    "sourceTitle": "MedlinePlus — Blood",
    "sourceUrl": "https://medlineplus.gov/blood.html",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-cat-pupils",
    "text": "Зіниці котів розширюються в темряві.",
    "explanation": "Це факт: розширення зіниць допомагає очам отримувати більше світла в темному середовищі.",
    "sourceTitle": "Merck Veterinary Manual — Eye Structure and Function in Cats",
    "sourceUrl": "https://www.merckvetmanual.com/cat-owners/eye-disorders-of-cats/eye-structure-and-function-in-cats",
    "sourceLanguage": "en",
    "sourceNote": "Старий URL мав застарілий шлях; замінено на актуальну сторінку Merck Veterinary Manual.",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-water-boiling",
    "text": "За нормального атмосферного тиску вода кипить приблизно за температури 100 °C.",
    "explanation": "Це факт, який можна перевірити під час досліду. На висоті над рівнем моря температура кипіння може бути нижчою.",
    "sourceTitle": "Велика українська енциклопедія — Вода",
    "sourceUrl": "https://vue.gov.ua/Вода",
    "sourceLanguage": "uk",
    "sourceNote": "Україномовне енциклопедичне джерело; підтверджує температуру кипіння води близько 100 °C.",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-honey-storage",
    "text": "Натуральний мед може зберігатися дуже довго, якщо його правильно закрити й не забруднювати.",
    "explanation": "Це факт у точнішому формулюванні: мед має довгий термін зберігання, але його потрібно правильно зберігати.",
    "sourceTitle": "Mississippi State University Extension — Does Honey Go Bad?",
    "sourceUrl": "https://extension.msstate.edu/blogs/extension-for-real-life/does-honey-go-bad",
    "sourceLanguage": "en",
    "sourceNote": "Сторінка National Geographic не відкривалася; замінено на стабільніше університетське джерело.",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-atlantic-salty",
    "text": "Вода в Атлантичному океані солона.",
    "explanation": "Це факт: океанічна вода містить розчинені солі.",
    "sourceTitle": "NOAA — Why is the ocean salty?",
    "sourceUrl": "https://oceanservice.noaa.gov/facts/whysalty.html",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  },
  {
    "id": "fact-rainbow-light",
    "text": "Веселка виникає, коли світло заломлюється й відбивається у краплях води.",
    "explanation": "Це факт: веселку можна пояснити фізичними властивостями світла й води.",
    "sourceTitle": "Britannica — Rainbow",
    "sourceUrl": "https://www.britannica.com/science/rainbow-atmospheric-phenomenon",
    "sourceLanguage": "en",
    "sourceCheckedAt": "2026-04-30"
  }
];
