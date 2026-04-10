const lessonTemplate = {
  title: "Інформація. Види інформації",
  summary: "Спокійний, наочний ігровий урок про те, як ми пізнаємо світ очима, вухами, носом, язиком і шкірою.",
  meta: [
    "🧒 1-2 клас",
    "🏫 У класі або вдома",
    "⏱ 35-40 хв",
    "🙂 Простий режим для дітей",
    "👩‍🏫 Повний режим для вчителя"
  ],
  goal: "Допомогти дітям зрозуміти, що таке інформація, якою вона буває та як ми її отримуємо щодня.",
  goalNote: "Методична рамка: почніть із розмови про повсякденні ситуації, переходьте від конкретних прикладів до узагальнення, а наприкінці обов’язково поверніться до того, як дитина може застосувати знання вдома і в школі. Швидка діагностика: чи може учень назвати орган чуття, приклад інформації та пояснити свій вибір простими словами.",
  objectives: [
    "розпізнавати інформацію у знайомих ситуаціях",
    "називати основні види інформації",
    "добирати приклади до органів чуття",
    "виконувати короткі інтерактивні вправи без друкування",
    "оцінювати власну роботу наприкінці уроку"
  ],
  sections: [
    {
      title: "💡 Що таке інформація?",
      intro: "Інформація — це все, що допомагає нам дізнатися щось нове про себе, людей і світ навколо.",
      cards: [
        { title: "👀 Бачу", text: "Колір, форму, малюнок, рух." },
        { title: "👂 Чую", text: "Голос, музику, дзвінок, шум." },
        { title: "✋ Відчуваю", text: "Тепло, холод, м’якість, шорсткість." }
      ],
      teacherTip: "Фасилітація: почніть з трьох коротких запитань «Що ти зараз бачиш?», «Що ти зараз чуєш?», «Що ти можеш відчути рукою?». Типова помилка: діти інколи називають лише предмет, а не те, яку саме інформацію вони про нього отримують. Попросіть відповідати повним шаблоном: «Я бачу…», «Я чую…», «Я відчуваю…»."
    },
    {
      title: "🖐 П’ять помічників",
      intro: "Наші органи чуття допомагають помічати різну інформацію.",
      cards: [
        { title: "👀 Очі", text: "Зорова інформація" },
        { title: "👂 Вуха", text: "Слухова інформація" },
        { title: "👃 Ніс", text: "Нюхова інформація" },
        { title: "👅 Язик", text: "Смакова інформація" },
        { title: "✋ Шкіра", text: "Дотикова інформація" }
      ],
      teacherTip: "Методична порада: запропонуйте дітям показати долонькою, яким органом чуття вони дізнаються про предмет найбільше. Диференціація: сильніші учні можуть називати по два приклади для кожного органа чуття, а тим, кому складно, достатньо по одному прикладу."
    },
    {
      title: "🏡 Де ми зустрічаємо інформацію?",
      intro: "Інформація поруч із нами весь день: удома, на вулиці, у школі, у грі та під час відпочинку.",
      cards: [
        { title: "🏫 У школі", text: "Чуємо вчителя, бачимо дошку, читаємо підручник." },
        { title: "🏠 Удома", text: "Чуємо дзвінок, відчуваємо запах їжі, дивимося мультфільм." },
        { title: "🚦 На вулиці", text: "Бачимо світлофор, чуємо машини, відчуваємо вітер." }
      ],
      teacherTip: "Мета цього блоку — показати, що тема уроку пов’язана з реальним життям. Швидке формувальне оцінювання: попросіть кожну дитину дати один власний приклад з дому, класу або прогулянки. Якщо учень вагається, дайте початок фрази: «Коли я… я отримую інформацію через…»."
    },
    {
      title: "🧩 Інколи працюють кілька помічників одразу",
      intro: "Один і той самий предмет або подія можуть давати нам відразу кілька підказок.",
      bullets: [
        "морозиво бачимо очима, відчуваємо смак язиком і холод шкірою",
        "мультфільм дивимося очима і слухаємо вухами",
        "квітку можна бачити очима і нюхати носом"
      ],
      teacherTip: "Цей блок готує дітей до завдань із кількома правильними відповідями. Типова помилка: учень шукає лише одну правильну ознаку. Підкресліть, що інколи правильних відповідей кілька, і це нормально."
    }
  ],
  activities: {
    draw: {
      id: "draw",
      type: "draw",
      title: "🎨 Намалюй або обери",
      badge: "Завдання 1",
      prompt: "Намалюй приклад зорової інформації або обери готовий варіант зі списку.",
      fallbackOptions: ["🌈 Веселка", "🚦 Світлофор", "☀️ Сонце", "🌸 Квітка", "📘 Книга", "🖼️ Картина"],
      teacherTip: "Педагогічна мета: перевести дитину від впізнавання до самостійного прикладу. Якщо малювання складне, достатньо вибрати готовий варіант і пояснити, чому це саме зорова інформація. Для швидкого оцінювання поставте одне уточнення: «Що саме ти тут бачиш?»."
    },
    classify: {
      id: "classify",
      type: "classify",
      title: "🧩 Знайди відповідність",
      badge: "Завдання 2",
      prompt: "Обери або перетягни картку в правильну категорію.",
      categories: ["Зорова", "Слухова", "Нюхова", "Смакова", "Дотикова"],
      perCategory: 4,
      items: [
        { label: "веселка", emoji: "🌈", correct: "Зорова" },
        { label: "світлофор", emoji: "🚦", correct: "Зорова" },
        { label: "картина", emoji: "🖼️", correct: "Зорова" },
        { label: "книга", emoji: "📘", correct: "Зорова" },
        { label: "зірка", emoji: "⭐", correct: "Зорова" },
        { label: "сонце", emoji: "☀️", correct: "Зорова" },
        { label: "кулька", emoji: "🎈", correct: "Зорова" },

        { label: "дзвоник", emoji: "🔔", correct: "Слухова" },
        { label: "пісня", emoji: "🎵", correct: "Слухова" },
        { label: "барабан", emoji: "🥁", correct: "Слухова" },
        { label: "сирена", emoji: "🚨", correct: "Слухова" },
        { label: "голос", emoji: "🗣️", correct: "Слухова" },
        { label: "телефон", emoji: "📱", correct: "Слухова" },
        { label: "дзвін", emoji: "🔔", correct: "Слухова" },

        { label: "квітка", emoji: "🌸", correct: "Нюхова" },
        { label: "парфуми", emoji: "🧴", correct: "Нюхова" },
        { label: "кава", emoji: "☕", correct: "Нюхова" },
        { label: "апельсин", emoji: "🍊", correct: "Нюхова" },
        { label: "суп", emoji: "🍲", correct: "Нюхова" },
        { label: "мило", emoji: "🧼", correct: "Нюхова" },
        { label: "хліб", emoji: "🍞", correct: "Нюхова" },

        { label: "лимон", emoji: "🍋", correct: "Смакова" },
        { label: "морозиво", emoji: "🍦", correct: "Смакова" },
        { label: "цукерка", emoji: "🍬", correct: "Смакова" },
        { label: "яблуко", emoji: "🍎", correct: "Смакова" },
        { label: "піца", emoji: "🍕", correct: "Смакова" },
        { label: "печиво", emoji: "🍪", correct: "Смакова" },
        { label: "вишня", emoji: "🍒", correct: "Смакова" },

        { label: "кактус", emoji: "🌵", correct: "Дотикова" },
        { label: "сніг", emoji: "❄️", correct: "Дотикова" },
        { label: "подушка", emoji: "🛏️", correct: "Дотикова" },
        { label: "камінь", emoji: "🗿", correct: "Дотикова" },
        { label: "рукавичка", emoji: "🧤", correct: "Дотикова" },
        { label: "лід", emoji: "🧊", correct: "Дотикова" },
        { label: "м’яч", emoji: "⚽", correct: "Дотикова" }
      ],
      teacherTip: "Методична користь: учні не просто називають вид інформації, а співвідносять приклад із категорією. Завдяки випадковому добору карток кожна дитина отримує трохи інший набір. Після завершення можна провести мікрорефлексію: «Яку категорію було найлегше визначати? Яку — найважче?»."
    },
    truefalse: {
      id: "truefalse",
      type: "truefalse",
      title: "🕵️ Детектив: правда чи вигадка?",
      badge: "Завдання 3",
      prompt: "Прочитай твердження й обери: це правда чи хиба.",
      count: 4,
      statements: [
        { text: "Коли ми їмо яблуко, ми отримуємо смакову інформацію.", answer: true, emoji: "🍎" },
        { text: "Книгу ми читаємо за допомогою нюху.", answer: false, emoji: "📘" },
        { text: "Звук сирени — це слухова інформація.", answer: true, emoji: "🚨" },
        { text: "Колір веселки ми можемо почути вухами.", answer: false, emoji: "🌈" },
        { text: "Запах квітки ми відчуваємо носом.", answer: true, emoji: "🌸" },
        { text: "Холодний сніг можна відчути шкірою.", answer: true, emoji: "❄️" },
        { text: "Морозиво ми тільки бачимо, але не смакуємо.", answer: false, emoji: "🍦" },
        { text: "Музику ми сприймаємо вухами.", answer: true, emoji: "🎵" },
        { text: "Тепло від батареї можна відчути шкірою.", answer: true, emoji: "🔥" },
        { text: "Ніс допомагає нам чути звуки.", answer: false, emoji: "👃" }
      ],
      teacherTip: "Формувальне оцінювання: попросіть дитину коротко пояснити хоча б одне твердження після перевірки. Це показує не лише вгадування, а й розуміння. Випадковий набір тверджень зменшує механічне запам’ятовування."
    },
    pick: {
      id: "pick",
      type: "pick",
      title: "🔎 Знайди зайве",
      badge: "Завдання 4",
      prompt: "У кожному рядку обери те, що не підходить до інших.",
      count: 3,
      groups: [
        {
          question: "Який предмет тут зайвий?",
          options: [
            { label: "👀 очі", correct: false },
            { label: "👂 вуха", correct: false },
            { label: "👃 ніс", correct: false },
            { label: "⚽ м’яч", correct: true }
          ]
        },
        {
          question: "Яке слово тут зайве?",
          options: [
            { label: "🌈 бачимо", correct: false },
            { label: "🔔 чуємо", correct: false },
            { label: "🍋 смакуємо", correct: false },
            { label: "📚 читаємо як орган чуття", correct: true }
          ]
        },
        {
          question: "Що тут не є органом чуття?",
          options: [
            { label: "👅 язик", correct: false },
            { label: "✋ шкіра", correct: false },
            { label: "🪑 стілець", correct: true },
            { label: "👂 вухо", correct: false }
          ]
        },
        {
          question: "Що тут не підходить до решти?",
          options: [
            { label: "🎵 звук", correct: false },
            { label: "🗣️ голос", correct: false },
            { label: "🔔 дзвінок", correct: false },
            { label: "🎨 малюнок", correct: true }
          ]
        },
        {
          question: "Що тут зайве серед прикладів нюху?",
          options: [
            { label: "🌸 квітка", correct: false },
            { label: "☕ кава", correct: false },
            { label: "🧴 парфуми", correct: false },
            { label: "🥁 барабан", correct: true }
          ]
        },
        {
          question: "Що тут зайве серед смакових прикладів?",
          options: [
            { label: "🍋 лимон", correct: false },
            { label: "🍎 яблуко", correct: false },
            { label: "🍪 печиво", correct: false },
            { label: "🚦 світлофор", correct: true }
          ]
        }
      ],
      teacherTip: "Порада для вчителя: це добре працює як коротка пауза між складнішими вправами. Учень тренує класифікацію без перевантаження текстом. Випадкові ряди підтримують інтерес навіть при повторному проходженні."
    },
    fill: {
      id: "fill",
      type: "fill",
      title: "📝 Обери пропущене слово",
      badge: "Завдання 5",
      prompt: "У кожному реченні вибери правильне слово зі списку.",
      count: 4,
      sentences: [
        {
          text: "Очима ми сприймаємо ___ інформацію.",
          answer: "зорову",
          options: ["зорову", "смакову", "нюхову"]
        },
        {
          text: "Вухами ми сприймаємо ___ інформацію.",
          answer: "слухову",
          options: ["дотикову", "слухову", "зорову"]
        },
        {
          text: "Шкірою ми сприймаємо ___ інформацію.",
          answer: "дотикову",
          options: ["дотикову", "нюхову", "слухову"]
        },
        {
          text: "Носом ми сприймаємо ___ інформацію.",
          answer: "нюхову",
          options: ["нюхову", "зорову", "слухову"]
        },
        {
          text: "Язиком ми сприймаємо ___ інформацію.",
          answer: "смакову",
          options: ["смакову", "дотикову", "зорову"]
        },
        {
          text: "Дзвінок на урок — це ___ інформація.",
          answer: "слухова",
          options: ["слухова", "смакова", "дотикова"]
        },
        {
          text: "Запах апельсина — це ___ інформація.",
          answer: "нюхова",
          options: ["зорова", "нюхова", "слухова"]
        },
        {
          text: "Холодний лід у руці — це ___ інформація.",
          answer: "дотикова",
          options: ["дотикова", "зорова", "смакова"]
        }
      ],
      teacherTip: "Методичний акцент: це завдання добре закріплює словник теми. Завдяки ширшому пулу речень діти бачать різні формулювання, але інтерфейс залишається простим, бо не потрібно друкувати."
    },
    scenarios: {
      id: "scenarios",
      type: "scenarios",
      title: "🎯 Що відчуваю в цій ситуації?",
      badge: "Завдання 6",
      prompt: "Подумай про кожну ситуацію й обери всі правильні варіанти.",
      count: 3,
      situations: [
        {
          emoji: "🍦",
          text: "Ти їси смачне холодне морозиво.",
          options: [
            { label: "👀 Бачу колір", correct: true },
            { label: "👂 Чую звук", correct: false },
            { label: "👅 Відчуваю смак", correct: true },
            { label: "✋ Відчуваю холод", correct: true }
          ]
        },
        {
          emoji: "📺",
          text: "Ти дивишся мультик по телевізору.",
          options: [
            { label: "👀 Бачу зображення", correct: true },
            { label: "👂 Чую голоси", correct: true },
            { label: "👅 Відчуваю смак", correct: false },
            { label: "👃 Відчуваю запах", correct: false }
          ]
        },
        {
          emoji: "🌸",
          text: "Ти нюхаєш запашну квітку.",
          options: [
            { label: "👃 Відчуваю запах", correct: true },
            { label: "👀 Бачу колір", correct: true },
            { label: "👂 Чую грім", correct: false },
            { label: "👅 Відчуваю смак", correct: false }
          ]
        },
        {
          emoji: "🔥",
          text: "Ти сидиш біля теплого вогнища.",
          options: [
            { label: "✋ Відчуваю тепло", correct: true },
            { label: "👀 Бачу полум’я", correct: true },
            { label: "👅 Відчуваю смак", correct: false },
            { label: "👂 Можу чути тріск", correct: true }
          ]
        },
        {
          emoji: "🍞",
          text: "Ти дістаєш із духовки запашний хліб.",
          options: [
            { label: "👃 Відчуваю запах", correct: true },
            { label: "👀 Бачу хліб", correct: true },
            { label: "✋ Відчуваю тепло", correct: true },
            { label: "👂 Чую веселку", correct: false }
          ]
        },
        {
          emoji: "☔",
          text: "Ти йдеш під дощем з парасолькою.",
          options: [
            { label: "👂 Чую дощ", correct: true },
            { label: "✋ Відчуваю краплі або вологу", correct: true },
            { label: "👀 Бачу калюжі", correct: true },
            { label: "👅 Відчуваю смак цукерки", correct: false }
          ]
        }
      ],
      teacherTip: "Це завдання вчить бачити кілька правильних відповідей. Після перевірки попросіть учня пояснити хоча б одну пару «ситуація — орган чуття». Так ви побачите, чи дитина справді розуміє логіку, а не просто обирає навмання."
    }
  },
  quiz: {
    count: 4,
    questions: [
      {
        id: "q1",
        type: "single",
        question: "💡 Що таке інформація?",
        options: [
          "Відомості про світ навколо нас",
          "Тільки текст у книжці",
          "Лише те, що є в комп’ютері"
        ],
        answer: "Відомості про світ навколо нас",
        explanation: "Переконайтеся, що діти не зводять поняття інформації лише до тексту або комп’ютера."
      },
      {
        id: "q2",
        type: "multiple",
        question: "👀 Обери види інформації, які ми вивчали.",
        options: ["зорова", "слухова", "нюхова", "велика"],
        answer: ["зорова", "слухова", "нюхова"],
        explanation: "Поясніть, що слово «велика» описує розмір, а не вид інформації."
      },
      {
        id: "q3",
        type: "single",
        question: "👅 Яким органом чуття ми відчуваємо смак?",
        options: ["язиком", "носом", "очима"],
        answer: "язиком",
        explanation: "Якщо дитина плутається, поверніть її до прикладів із їжею."
      },
      {
        id: "q4",
        type: "single",
        question: "👂 Яким органом чуття ми сприймаємо звуки?",
        options: ["вухами", "очима", "язиком"],
        answer: "вухами",
        explanation: "Попросіть пригадати дзвоник, музику або голос."
      },
      {
        id: "q5",
        type: "single",
        question: "👃 Чим ми відчуваємо запах?",
        options: ["носом", "шкірою", "вухами"],
        answer: "носом",
        explanation: "Можна дати короткий приклад: квітка, кава, апельсин."
      },
      {
        id: "q6",
        type: "single",
        question: "✋ Яку інформацію ми можемо відчути шкірою?",
        options: ["холод і тепло", "музику", "запах"],
        answer: "холод і тепло",
        explanation: "Поверніть дітей до прикладів зі снігом, льодом або теплом."
      },
      {
        id: "q7",
        type: "single",
        question: "🌸 Який орган чуття найбільше допоможе дізнатися про запах квітки?",
        options: ["ніс", "вуха", "очі"],
        answer: "ніс",
        explanation: "Тут важливо відокремити «бачити квітку» і «відчувати її запах»."
      },
      {
        id: "q8",
        type: "single",
        question: "🔔 До якого виду інформації належить дзвоник?",
        options: ["слухова", "зорова", "смакова"],
        answer: "слухова",
        explanation: "Це швидка перевірка, чи дитина співвідносить подію зі способом сприйняття."
      },
      {
        id: "q9",
        type: "multiple",
        question: "🍦 Що можна відчути, коли їси морозиво?",
        options: ["смак", "холод", "зображення", "запах диму"],
        answer: ["смак", "холод", "зображення"],
        explanation: "Підкресліть, що інколи правильних відповідей кілька."
      },
      {
        id: "q10",
        type: "single",
        question: "📘 Яку інформацію ми найчастіше отримуємо, коли читаємо книжку?",
        options: ["зорову", "нюхову", "дотикову"],
        answer: "зорову",
        explanation: "Книжка може пахнути або відчуватися на дотик, але головне під час читання — зорове сприйняття."
      }
    ]
  },
  reflection: {
    prompt: "Обери картку, яка підходить до твого настрою після уроку.",
    options: [
      { emoji: "😃", label: "Все зрозуміло" },
      { emoji: "🤔", label: "Було складно" },
      { emoji: "🙋", label: "Потрібна допомога" }
    ],
    note: "Рефлексія допомагає швидко побачити, кому потрібне повторне пояснення."
  }
};

function shuffle(array) {
  const result = [...array];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function sample(array, count) {
  return shuffle(array).slice(0, count);
}

function randomizeOptions(question) {
  return {
    ...question,
    options: shuffle(question.options)
  };
}

function buildClassifyActivity(template) {
  const items = shuffle(
    template.categories.flatMap((category) =>
      sample(template.items.filter((item) => item.correct === category), template.perCategory)
    )
  );

  return {
    ...template,
    items
  };
}

function buildTrueFalseActivity(template) {
  return {
    ...template,
    statements: sample(template.statements, template.count)
  };
}

function buildPickActivity(template) {
  return {
    ...template,
    groups: sample(template.groups, template.count).map((group) => ({
      ...group,
      options: shuffle(group.options)
    }))
  };
}

function buildFillActivity(template) {
  return {
    ...template,
    sentences: sample(template.sentences, template.count).map((sentence) => ({
      ...sentence,
      options: shuffle(sentence.options)
    }))
  };
}

function buildScenariosActivity(template) {
  return {
    ...template,
    situations: sample(template.situations, template.count).map((situation) => ({
      ...situation,
      options: shuffle(situation.options)
    }))
  };
}

function buildQuiz(quizTemplate) {
  return sample(quizTemplate.questions, quizTemplate.count).map((question) => randomizeOptions(question));
}

export function createLessonData() {
  return {
    title: lessonTemplate.title,
    summary: lessonTemplate.summary,
    meta: [...lessonTemplate.meta],
    goal: lessonTemplate.goal,
    goalNote: lessonTemplate.goalNote,
    objectives: [...lessonTemplate.objectives],
    sections: lessonTemplate.sections.map((section) => ({
      ...section,
      cards: section.cards ? section.cards.map((card) => ({ ...card })) : undefined,
      bullets: section.bullets ? [...section.bullets] : undefined
    })),
    activities: [
      { ...lessonTemplate.activities.draw, fallbackOptions: [...lessonTemplate.activities.draw.fallbackOptions] },
      buildClassifyActivity(lessonTemplate.activities.classify),
      buildTrueFalseActivity(lessonTemplate.activities.truefalse),
      buildPickActivity(lessonTemplate.activities.pick),
      buildFillActivity(lessonTemplate.activities.fill),
      buildScenariosActivity(lessonTemplate.activities.scenarios)
    ],
    quiz: buildQuiz(lessonTemplate.quiz),
    reflection: {
      ...lessonTemplate.reflection,
      options: lessonTemplate.reflection.options.map((option) => ({ ...option }))
    }
  };
}
