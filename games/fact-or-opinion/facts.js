// Факти для гри. Щоб додати новий факт, скопіюйте обʼєкт і змініть поля text, explanation, sourceTitle, sourceUrl.
// id має бути унікальним, щоб легше знаходити й редагувати конкретне твердження.
window.FACTS_DATA = [
  {
    "id": "fact-water-freezing",
    "text": "За нормального атмосферного тиску вода замерзає за температури 0 °C.",
    "explanation": "Це факт: температуру замерзання води можна перевірити вимірюванням. У побуті важливо пам'ятати, що домішки у воді можуть трохи змінювати цю температуру.",
    "sourceTitle": "Britannica — freezing point",
    "sourceUrl": "https://www.britannica.com/science/freezing-point"
  },
  {
    "id": "fact-earth-third-planet",
    "text": "Земля — третя планета від Сонця.",
    "explanation": "Це факт про розташування планет у Сонячній системі: Меркурій і Венера ближчі до Сонця, ніж Земля.",
    "sourceTitle": "NASA — Earth Facts",
    "sourceUrl": "https://science.nasa.gov/earth/facts/"
  },
  {
    "id": "fact-sun-star",
    "text": "Сонце — це зірка.",
    "explanation": "Це факт: Сонце випромінює світло й тепло, як інші зорі, але воно є найближчою зіркою до Землі.",
    "sourceTitle": "NASA Space Place — The Sun",
    "sourceUrl": "https://spaceplace.nasa.gov/sun/en/"
  },
  {
    "id": "fact-moon-reflects-sunlight",
    "text": "Місяць не світиться сам, а відбиває світло Сонця.",
    "explanation": "Це факт: Місяць не є зіркою, тому не створює власного світла, а лише відбиває сонячне.",
    "sourceTitle": "ESA — Mission to the Moon",
    "sourceUrl": "https://cesar.esa.int/printable_section.php?Section=SSE_Mission_to_the_Moon"
  },
  {
    "id": "fact-everest-highest",
    "text": "Еверест — найвища гора світу за висотою над рівнем моря.",
    "explanation": "Це факт, але формулювання важливе: Еверест має найбільшу висоту саме над рівнем моря.",
    "sourceTitle": "Britannica — Mount Everest",
    "sourceUrl": "https://www.britannica.com/place/Mount-Everest"
  },
  {
    "id": "fact-ocean-covers-earth",
    "text": "Океан покриває понад 70% поверхні Землі.",
    "explanation": "Це факт, який можна перевірити за географічними даними про нашу планету.",
    "sourceTitle": "NOAA — How much water is in the ocean?",
    "sourceUrl": "https://oceanservice.noaa.gov/facts/oceanwater.html"
  },
  {
    "id": "fact-pacific-largest-ocean",
    "text": "Найбільший океан на Землі — Тихий океан.",
    "explanation": "Це факт: Тихий океан має найбільшу площу серед океанів нашої планети.",
    "sourceTitle": "NOAA — Which ocean is the biggest?",
    "sourceUrl": "https://oceanservice.noaa.gov/facts/biggestocean.html"
  },
  {
    "id": "fact-blue-whale-largest",
    "text": "Синій кит — найбільша тварина, відома науці.",
    "explanation": "Це факт: сині кити більші за будь-яких сучасних тварин і за більшість відомих давніх тварин.",
    "sourceTitle": "WWF — Blue Whale",
    "sourceUrl": "https://www.worldwildlife.org/species/blue-whale"
  },
  {
    "id": "fact-cheetah-fastest-land",
    "text": "Гепард — найшвидша наземна тварина.",
    "explanation": "Це факт: гепард пристосований до дуже швидкого бігу на короткі дистанції.",
    "sourceTitle": "National Geographic Kids — Cheetah",
    "sourceUrl": "https://kids.nationalgeographic.com/animals/mammals/facts/cheetah"
  },
  {
    "id": "fact-octopus-three-hearts",
    "text": "У восьминога три серця.",
    "explanation": "Це факт: два серця допомагають рухати кров через зябра, а третє — по тілу восьминога.",
    "sourceTitle": "Smithsonian Magazine — Octopuses",
    "sourceUrl": "https://www.smithsonianmag.com/science-nature/ten-wild-facts-about-octopuses-they-have-three-hearts-big-brains-and-blue-blood-7625828/"
  },
  {
    "id": "fact-bee-dance",
    "text": "Бджоли можуть передавати інформацію про їжу за допомогою особливого танцю.",
    "explanation": "Це факт: так званий танець бджіл допомагає іншим бджолам знайти напрямок до джерела їжі.",
    "sourceTitle": "Britannica — Honeybee",
    "sourceUrl": "https://www.britannica.com/animal/honeybee"
  },
  {
    "id": "fact-human-body-water",
    "text": "Тіло дорослої людини приблизно на 60% складається з води.",
    "explanation": "Це факт, але відсоток може відрізнятися залежно від віку, статури та інших особливостей людини.",
    "sourceTitle": "USGS — Water and the Human Body",
    "sourceUrl": "https://www.usgs.gov/water-science-school/science/water-you-water-and-human-body"
  },
  {
    "id": "fact-adult-bones",
    "text": "У більшості дорослих людей 206 кісток.",
    "explanation": "Це факт у шкільному формулюванні. У деяких людей кількість кісток може трохи відрізнятися через індивідуальні особливості.",
    "sourceTitle": "Cleveland Clinic — Bones",
    "sourceUrl": "https://my.clevelandclinic.org/health/body/25176-bones"
  },
  {
    "id": "fact-human-lungs",
    "text": "Людина дихає за допомогою легень.",
    "explanation": "Це факт: легені допомагають організму отримувати кисень і виводити вуглекислий газ.",
    "sourceTitle": "Cleveland Clinic — Lungs",
    "sourceUrl": "https://my.clevelandclinic.org/health/body/8967-lungs"
  },
  {
    "id": "fact-heart-fist",
    "text": "Серце людини приблизно завбільшки з її кулак.",
    "explanation": "Це факт-орієнтир: розмір серця змінюється разом із ростом людини, тому його часто порівнюють із кулаком.",
    "sourceTitle": "American Heart Association — Heart Anatomy Poster",
    "sourceUrl": "https://www2.heart.org/site/DocServer/AHC_Heart_Anatomy_Poster.pdf"
  },
  {
    "id": "fact-ukrainian-alphabet",
    "text": "В українській абетці 33 літери.",
    "explanation": "Це факт про сучасну українську абетку, який можна перевірити за довідковими джерелами.",
    "sourceTitle": "Вікіпедія — Українська абетка",
    "sourceUrl": "https://uk.wikipedia.org/wiki/%D0%A3%D0%BA%D1%80%D0%B0%D1%97%D0%BD%D1%81%D1%8C%D0%BA%D0%B0_%D0%B0%D0%B1%D0%B5%D1%82%D0%BA%D0%B0"
  },
  {
    "id": "fact-insects-six-legs",
    "text": "Комахи мають шість ніг.",
    "explanation": "Це факт: шість ніг — одна з головних ознак комах.",
    "sourceTitle": "Britannica — Insect",
    "sourceUrl": "https://www.britannica.com/animal/insect"
  },
  {
    "id": "fact-paper-wood",
    "text": "Папір часто виготовляють із деревинної целюлози.",
    "explanation": "Це факт. Не весь папір роблять однаково, але деревинна целюлоза є одним із найпоширеніших матеріалів для його виробництва.",
    "sourceTitle": "Britannica — Paper",
    "sourceUrl": "https://www.britannica.com/technology/paper"
  },
  {
    "id": "fact-oxygen-colorless",
    "text": "Кисень не має кольору й запаху.",
    "explanation": "Це факт про властивості кисню за звичайних умов.",
    "sourceTitle": "Britannica — Oxygen",
    "sourceUrl": "https://www.britannica.com/science/oxygen"
  },
  {
    "id": "fact-magnet-iron",
    "text": "Магніт притягує залізо.",
    "explanation": "Це факт: залізо належить до матеріалів, які добре взаємодіють із магнітним полем.",
    "sourceTitle": "Britannica — Magnetism",
    "sourceUrl": "https://www.britannica.com/science/magnetism"
  },
  {
    "id": "fact-photosynthesis",
    "text": "Під час фотосинтезу зелені рослини утворюють кисень.",
    "explanation": "Це факт: рослини використовують світло, воду й вуглекислий газ, а кисень виділяється як один із продуктів фотосинтезу.",
    "sourceTitle": "Britannica — Photosynthesis",
    "sourceUrl": "https://www.britannica.com/science/photosynthesis"
  },
  {
    "id": "fact-bats-mammals",
    "text": "Кажани — ссавці, які вміють літати.",
    "explanation": "Це факт: кажани народжують дитинчат і вигодовують їх молоком, а також активно літають.",
    "sourceTitle": "Bat Conservation International — Bats 101",
    "sourceUrl": "https://www.batcon.org/about-bats/bats-101/"
  },
  {
    "id": "fact-penguins-southern",
    "text": "Пінгвіни живуть переважно в Південній півкулі.",
    "explanation": "Це факт: більшість видів пінгвінів мешкає на південь від екватора.",
    "sourceTitle": "WWF — Penguin",
    "sourceUrl": "https://www.worldwildlife.org/species/penguin"
  },
  {
    "id": "fact-year-days",
    "text": "У календарному році зазвичай 365 днів, а у високосному — 366.",
    "explanation": "Це факт про календар: додатковий день у високосному році допомагає узгоджувати календар із рухом Землі навколо Сонця.",
    "sourceTitle": "Britannica — Leap year",
    "sourceUrl": "https://www.britannica.com/science/leap-year-calendar"
  },
  {
    "id": "fact-ice-floats",
    "text": "Лід плаває на поверхні води.",
    "explanation": "Це факт: лід має меншу густину, ніж рідка вода, тому він не тоне.",
    "sourceTitle": "Britannica — Ice",
    "sourceUrl": "https://www.britannica.com/science/ice"
  },
  {
    "id": "fact-sahara-hot-desert",
    "text": "Сахара — найбільша спекотна пустеля у світі.",
    "explanation": "Це факт, якщо говорити саме про спекотні пустелі. Антарктида більша, але вона є холодною пустелею.",
    "sourceTitle": "Britannica — Sahara",
    "sourceUrl": "https://www.britannica.com/place/Sahara-desert-Africa"
  },
  {
    "id": "fact-mars-red-planet",
    "text": "Марс часто називають Червоною планетою.",
    "explanation": "Це факт: Марс здається червонуватим через оксиди заліза, тобто іржу, у ґрунті та пилу.",
    "sourceTitle": "NASA — Mars Facts",
    "sourceUrl": "https://science.nasa.gov/mars/facts/"
  },
  {
    "id": "fact-owls-neck",
    "text": "Сови можуть повертати голову приблизно до 270 градусів.",
    "explanation": "Це факт: будова шиї та судин допомагає совам повертати голову значно далі, ніж може людина.",
    "sourceTitle": "Johns Hopkins University — Owl necks",
    "sourceUrl": "https://hub.jhu.edu/2013/01/31/owl-neck-blood-flow/"
  },
  {
    "id": "fact-camels-humps-fat",
    "text": "Верблюди зберігають у горбах жир, а не воду.",
    "explanation": "Це факт: запас жиру допомагає верблюдам виживати в складних умовах.",
    "sourceTitle": "National Geographic Kids — Bactrian Camel",
    "sourceUrl": "https://kids.nationalgeographic.com/animals/mammals/facts/bactrian-camel"
  },
  {
    "id": "fact-giraffe-neck",
    "text": "Жирафи, як і люди, мають сім шийних хребців.",
    "explanation": "Це факт: у жирафів ці хребці дуже довгі, тому їхня шия така велика.",
    "sourceTitle": "National Geographic Kids — Giraffe",
    "sourceUrl": "https://kids.nationalgeographic.com/animals/mammals/facts/giraffe"
  },
  {
    "id": "fact-ostrich-flightless",
    "text": "Страус не літає, але може швидко бігати.",
    "explanation": "Це факт: страуси мають сильні ноги й пристосовані до швидкого бігу.",
    "sourceTitle": "San Diego Zoo — Ostrich",
    "sourceUrl": "https://animals.sandiegozoo.org/animals/ostrich"
  },
  {
    "id": "fact-snakes-hearing",
    "text": "Змії не мають зовнішніх вух, але можуть відчувати вібрації.",
    "explanation": "Це факт: змії сприймають частину звуків і коливань інакше, ніж люди.",
    "sourceTitle": "Britannica — Snake",
    "sourceUrl": "https://www.britannica.com/animal/snake"
  },
  {
    "id": "fact-bamboo-fast-growing",
    "text": "Деякі види бамбука належать до найшвидше зростаючих рослин у світі.",
    "explanation": "Це факт у точнішому формулюванні: не кожен бамбук росте однаково швидко, але рекордні види можуть рости дуже швидко.",
    "sourceTitle": "Guinness World Records — Fastest growing plant",
    "sourceUrl": "https://www.guinnessworldrecords.com/world-records/fastest-growing-plant"
  },
  {
    "id": "fact-kyiv-capital",
    "text": "Столиця України — місто Київ.",
    "explanation": "Це факт, закріплений у Конституції України.",
    "sourceTitle": "Конституція України, стаття 20",
    "sourceUrl": "https://zakon.rada.gov.ua/laws/show/254%D0%BA/96-%D0%B2%D1%80#Text"
  },
  {
    "id": "fact-blood-red",
    "text": "Кров людини має червоний колір.",
    "explanation": "Це факт: червоний колір крові пов'язаний із гемоглобіном у червоних кров'яних клітинах.",
    "sourceTitle": "MedlinePlus — Blood",
    "sourceUrl": "https://medlineplus.gov/blood.html"
  },
  {
    "id": "fact-cat-pupils",
    "text": "Зіниці котів розширюються в темряві.",
    "explanation": "Це факт: розширення зіниць допомагає очам отримувати більше світла в темному середовищі.",
    "sourceTitle": "Merck Veterinary Manual — Cat eye structure and function",
    "sourceUrl": "https://www.merckvetmanual.com/cat-owners/eye-disorders-of-cats/structure-and-function-of-the-eye-in-cats"
  },
  {
    "id": "fact-water-boiling",
    "text": "За нормального атмосферного тиску вода кипить приблизно за температури 100 °C.",
    "explanation": "Це факт, який можна перевірити під час досліду. На висоті над рівнем моря температура кипіння може бути нижчою.",
    "sourceTitle": "Britannica — Boiling point",
    "sourceUrl": "https://www.britannica.com/science/boiling-point"
  },
  {
    "id": "fact-honey-storage",
    "text": "Натуральний мед може зберігатися дуже довго, якщо його правильно закрити й не забруднювати.",
    "explanation": "Це факт у точнішому формулюванні: мед має довгий термін зберігання, але його потрібно правильно зберігати.",
    "sourceTitle": "National Geographic — Honey preservation",
    "sourceUrl": "https://www.nationalgeographic.com/science/article/151219-honey-spoil-preservation-food-science"
  },
  {
    "id": "fact-atlantic-salty",
    "text": "Вода в Атлантичному океані солона.",
    "explanation": "Це факт: океанічна вода містить розчинені солі.",
    "sourceTitle": "NOAA — Why is the ocean salty?",
    "sourceUrl": "https://oceanservice.noaa.gov/facts/whysalty.html"
  },
  {
    "id": "fact-rainbow-light",
    "text": "Веселка виникає, коли світло заломлюється й відбивається у краплях води.",
    "explanation": "Це факт: веселку можна пояснити фізичними властивостями світла й води.",
    "sourceTitle": "Britannica — Rainbow",
    "sourceUrl": "https://www.britannica.com/science/rainbow-atmospheric-phenomenon"
  }
];
