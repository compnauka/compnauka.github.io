export const questions = {
  math: [
    { q:"Площа прямокутника зі сторонами 8 см і 5 см дорівнює...", a:["40 см","26 см","40 кв. см","13 см"], correct:2, explanation:"8×5 = 40 кв. см." },
    { q:"Розв'яжи рівняння: x - 25 = 50", a:["x = 25","x = 75","x = 50","x = 100"], correct:1, explanation:"x = 50 + 25 = 75." },
    { q:"Знайди 1/5 від числа 100.", a:["20","25","50","10"], correct:0, explanation:"100 / 5 = 20." },
    { q:"Скільки грамів у 3 кілограмах?", a:["300 г","30 г","3000 г","1000 г"], correct:2, explanation:"3 × 1000 = 3000 г." },
    { q:"Периметр квадрата 24 см. Яка довжина його сторони?", a:["6 см","4 см","8 см","12 см"], correct:0, explanation:"24 / 4 = 6 см." },
    { q:"В автобусі їхало 45 пасажирів. На зупинці вийшло 12, а зайшло 7. Скільки пасажирів стало в автобусі?", a:["40","33","52","43"], correct:0, explanation:"45-12=33; 33+7=40." },
    { q:"Який з дробів найбільший: 1/3, 1/8, 1/2, 1/5?", a:["1/3","1/8","1/2","1/5"], correct:2, explanation:"Більший дріб — з меншим знаменником (при однакових чисельниках)." },
    { q:"5 годин — це скільки хвилин?", a:["500 хв","250 хв","300 хв","360 хв"], correct:2, explanation:"5×60=300 хв." },
    { q:"Обчисли: 640 / 8 + 20", a:["100","80","82","660"], correct:0, explanation:"640/8=80; 80+20=100." },
    { q:"У книзі 120 сторінок. Оленка прочитала чверть. Скільки залишилося?", a:["30","90","60","80"], correct:1, explanation:"120/4=30; 120-30=90." }
  ],
  ukrainian: [
    { q:"Визнач рід іменника «собака».", a:["Чоловічий","Жіночий","Середній","Спільний"], correct:1, explanation:"«Собака» — жіночий рід." },
    { q:"Яке слово є прикметником у реченні: «Настала тепла весна.»?", a:["Настала","тепла","весна","На"], correct:1, explanation:"Прикметник відповідає на «який/яка?» — тепла." },
    { q:"Знайди слово, у якому допущено помилку.", a:["Свято","буряк","здоровя","морквяний"], correct:2, explanation:"Правильно: «здоров'я» з апострофом." },
    { q:"Добери антонім до слова «радість».", a:["Щастя","сміх","сум","веселість"], correct:2, explanation:"Протилежність — «сум»." },
    { q:"У якому слові потрібно написати м'який знак (ь)?", a:["бур..як","сіл..ський","дзв..якати","молод..ший"], correct:1, explanation:"Правильно: «сільський» (ь). Інші — без м'якого знака (тут або без нього, або вимагають апострофа)." },
    { q:"Визнач головні члени речення: «Діти весело гралися у дворі.»", a:["Діти гралися","весело гралися","гралися у дворі","діти у дворі"], correct:0, explanation:"Підмет — діти, присудок — гралися." },
    { q:"Яка частина слова є змінною?", a:["Корінь","Префікс","Суфікс","Закінчення"], correct:3, explanation:"Закінчення змінюється." },
    { q:"Постав слово «книга» в орудному відмінку.", a:["книги","книзі","книгою","на книзі"], correct:2, explanation:"(Чим?) — книгою." },
    { q:"У якому рядку всі слова — іменники?", a:["Стіл, бігти, зелений","Сонце, хмара, дощ","Гарний, високо, він","Читати, писати, малювати"], correct:1, explanation:"Сонце, хмара, дощ — іменники." },
    { q:"Яким є речення за метою висловлювання: «Коли ти прийдеш додому?»", a:["Розповідне","Питальне","Спонукальне","Окличне"], correct:1, explanation:"Це питальне речення." }
  ],
  english: [
    { q:"What ___ you doing now?", a:["is","are","am","do"], correct:1, explanation:"З «you» використовується «are» (Present Continuous)." },
    { q:"She ___ to school yesterday.", a:["go","goes","went","is going"], correct:2, explanation:"Маркер минулого часу «yesterday» вимагає дієслова «went»." },
    { q:"There are many ___ on the tree in autumn.", a:["leaf","leafs","leafes","leaves"], correct:3, explanation:"Множина від «leaf» — «leaves»." },
    { q:"My birthday is ___ July.", a:["on","at","in","by"], correct:2, explanation:"Для місяців та років використовується прийменник «in»." },
    { q:"He is ___ than his brother.", a:["tall","taller","the tallest","more tall"], correct:1, explanation:"Вищий ступінь порівняння: «taller»." },
    { q:"___ is your name?", a:["What","Where","Who","When"], correct:0, explanation:"Правильно: «What is your name?»" },
    { q:"Can you swim? — Yes, I ___.", a:["can't","can","am","is"], correct:1, explanation:"У відповіді повторюється модальне дієслово: «can»." },
    { q:"She has ___ nice dress.", a:["a","an","the","-"], correct:0, explanation:"Артикль «a» ставиться перед приголосним звуком." },
    { q:"They ___ football every Sunday.", a:["plays","play","are playing","played"], correct:1, explanation:"Регулярна дія вимагає Present Simple: «play»." },
    { q:"The book is ___ the table.", a:["under","on","behind","in front"], correct:1, explanation:"Книга знаходиться на столі: «on the table»." }
  ]
};

export const badges = {
  math_rookie:{ icon:'fas fa-calculator', name:'Математик-початківець', subject:'math', score:10 },
  math_adept:{ icon:'fas fa-ruler-combined', name:'Знавець формул', subject:'math', score:50 },
  ukrainian_rookie:{ icon:'fas fa-pen-nib', name:'Мовознавець-початківець', subject:'ukrainian', score:10 },
  ukrainian_adept:{ icon:'fas fa-book-reader', name:'Хранитель мови', subject:'ukrainian', score:50 },
  english_rookie:{ icon:'fas fa-language', name:'English Starter', subject:'english', score:10 },
  english_adept:{ icon:'fas fa-graduation-cap', name:'English Speaker', subject:'english', score:50 },
  genius:{ icon:'fas fa-brain', name:'Юний геній', subject:'total', score:100 },
  mastermind:{ icon:'fas fa-trophy', name:'Володар знань', subject:'total', score:200 }
};
