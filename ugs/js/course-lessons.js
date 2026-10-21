// Curriculum adapters preserve existing practice and supply explicit, independent checks.
window.CourseLessons = (() => {
  'use strict';
  const legacy={...DeviceLessons,...InfoLessons,...OnlineLessons,...AlgoLessons};
  const task=(...tasks)=>({kind:'skillTasks',tasks});
  function choice(question,labels,answer,icons=[],stimulus){return {type:'choice',question,options:labels.map((label,i)=>({id:'o'+i,label,icon:icons[i] || 'info'})),answerId:'o'+answer,...(stimulus?{stimulus}:{})};}
  function pairs(question,items,targets){return {type:'pairs',question,items:items.map(([label,target,icon],i)=>({id:'i'+i,label,target,icon:icon || 'info'})),targets:targets.map(([id,label])=>({id,label}))};}
  const route=(question,start,goal,extra={})=>({type:'route',question,size:4,start,goal,...extra});
  const palette=[{id:'1',label:'Синій',color:'#70d0ff'},{id:'2',label:'Жовтий',color:'#f3c84a'}];
  const pixels=(question,code,columns=4)=>({type:'pixels',question,code,columns,palette});
  const privateAction=question=>choice(question,['Не надсилати. Сказати дорослому','Надіслати одразу','Попросити подарунок','Переслати всім'],0,['adult','send','star','message']);
  const checks={
    'device-choice':task(
      choice('Що запише твій голос?',['Мікрофон','Екран','Миша','Принтер'],0,['microphone','devices','mouse','printer']),
      choice('Що покаже мультфільм?',['Екран','Клавіатура','Камера','Мікрофон'],0,['devices','keyboard','camera','microphone']),
      choice('Що надрукує малюнок на папері?',['Принтер','Колонки','Ноутбук','Камера'],0,['printer','speaker','laptop','camera']),
      choice('Чим рухати вказівник?',['Миша','Принтер','Навушники','Колонки'],0,['mouse','printer','headphones','speaker'])),
    'device-control':task({type:'control',question:'Натисни квадрат.',action:'tap'},{type:'control',question:'Перенеси куб у коробку.',action:'move'},{type:'control',question:'Прокрути список. Знайди сонце.',action:'scroll'},choice('Як працювати зручно й безпечно?',['Сидіти зручно. Напій осторонь','Пити над клавіатурою','Лежати на клавіатурі','Не робити перерв'],0,['posture','phone','keyboard','stop'])),
    'keyboard-input':task({type:'typing',question:'Набери слово.',target:'ЛІС'},{type:'typing',question:'Додай пробіл.',target:'Я ТУТ'},{type:'typing',question:'Зітри зайву літеру.',start:'САДД',target:'САД',operation:'backspace'},{type:'typing',question:'Новий рядок і цифра.',start:'Я',target:'Я\n2',operation:'enter'}),
    'info-types':task(...[
      [{kind:'text',text:'САД'},'text'],[{kind:'sound',tone:740},'sound'],[{kind:'image',icon:'squirrel',label:'Нерухоме зображення білки'},'image'],[{kind:'video'},'video']
    ].map(([stimulus,id])=>({...choice('Що це?',['Текст','Зображення','Звук','Відео'],['text','image','sound','video'].indexOf(id),['textinfo','photo','speaker','video'],stimulus)}))),
    'classification':task(
      pairs('Розклади іграшки за формою.',[['М’яч','round','circle'],['Кубик','square','square']],[['round','Кругле'],['square','Квадратне']]),
      pairs('Розклади: по землі чи воді?',[['Автобус','land','bus'],['Човен','water','boat']],[['land','По землі'],['water','По воді']]),
      choice('Що не потрібне для малювання?',['Ложка','Олівець','Фарби','Пензлик'],0,['spoon','pencil','palette','brush']),
      pairs('Нове правило: за призначенням.',[['Червоний автобус','transport','bus'],['Синій човен','transport','boat'],['Червона чашка','dishes','cup'],['Синя тарілка','dishes','plate']],[['transport','Транспорт'],['dishes','Посуд']])),
    'models-schemes':task(
      choice('Що є моделлю Землі?',['Глобус','Автобус','Клавіатура','Камера'],0,['globe','bus','keyboard','camera']),
      {type:'plan',question:'Розмісти кімнату за новим планом.',guide:'Стіл — клітинка 2. Двері — 7. Шафа — 9.',items:[{id:'desk',label:'Стіл',position:1},{id:'door',label:'Двері',position:6},{id:'shelf',label:'Шафа',position:8}]},
      pairs('З’єднай знак і місце.',[['Знак сходів','stairs','stairs'],['Знак книжки','library','book']],[['stairs','Сходи'],['library','Бібліотека']]),
      route('За схемою: від входу до книжки.',[2,0],[0,1],{size:3,obstacles:[[1,1]]})),
    'coding-symbols':task(
      choice('Нове правило: A = коло, B = квадрат. Покажи B.',['Квадрат','Коло','Зірка','Трикутник'],0,['square','circle','star','triangle']),
      pixels('Розфарбуй новий ряд за кодом.',['2','1','2','2']),
      pairs('Правило: коло — стій, трикутник — іди, квадрат — поверни.',[['Коло','stop','circle'],['Трикутник','go','triangle'],['Квадрат','turn','square']],[['stop','Стій'],['go','Іди'],['turn','Поверни']]),
      choice('Візерунок: жовтий, синій, синій. Який код?',['2 1 1','1 2 2','2 2 1','1 1 2'],0)),
    'verify-information':task(
      choice('Тут три квітки. Це…',['Факт','Думка','Команда','Назва'],0,[],{kind:'count',count:3,icon:'flower',label:'Три квітки'}),
      choice('«Блакитний — найгарніший». Це…',['Факт','Думка','Команда','Назва'],1),
      choice('Невідомий пише: «Завтра уроків немає». Що зробиш?',['Перевірю у школі з дорослим','Одразу повірю','Назву це брехнею','Перешлю всім'],0),
      choice('Де перевіриш скасування уроків?',['У вчителя або на офіційному каналі школи','За красивою картинкою','В анонімному чаті','За кількістю пересилань'],0,['school','photo','message','send'])),
    'create-product':task({type:'editor',question:'Зміни фон. Додай зірку й підпис. Прибери зайве.',removeExtra:true}),
    'save-find':task({type:'editor',question:'Створи, збережи, знайди й відкрий нову листівку.',save:true}),
    'browser-navigation':task(...[
      ['Відкрий «Планети».',['planets'],'planets'],['Відкрий «Марс».',['planets','mars'],'mars'],['Відкрий «Марс» і повернись до планет.',['planets','mars','planets'],'planets'],['Відкрий «Марс», повернись і відкрий «Земля».',['planets','mars','planets','earth'],'earth']
    ].map(([question,visit,goal])=>({type:'browser',question,start:'home',visit,goal,pages:{home:{title:'Космос',links:['planets']},planets:{title:'Планети',links:['mars','earth']},mars:{title:'Марс',links:[]},earth:{title:'Земля',links:[]}}}))),
    'online-search':task(
      choice('Чим харчується білка? Обери запит.',['Чим харчується білка','Ліс','Білка гра','Тварини'],0),
      choice('Шукаємо вигляд автобуса. Який запит?',['Як виглядає автобус','Місто','Автобус квиток','Транспорт'],0),
      choice('Шукаємо, де живе панда. Який результат?',['Панда: місця проживання','Вірш про кота','Розклад автобусів','Гра з м’ячем'],0,['panda','cat','bus','star']),
      choice('Погода — надто широко. Як точніше?',['Погода у Львові завтра','Все','Новини','Світ'],0)),
    'personal-privacy':task(
      privateAction('Незнайомець просить номер телефону.'),
      choice('Що приховати на фото перед надсиланням?',['Домашню адресу','Хмару','Дерево','Квітку'],0,['location','cloud','tree','flower']),
      choice('Хочеш викласти фото друга. Що спочатку?',['Запитати його дозволу','Викласти потай','Надіслати всім','Додати його адресу'],0),
      choice('Що можна розповісти незнайомцю в грі без особистих деталей?',['Улюблений колір','Домашню адресу','Номер телефону','Пароль'],0)),
    'password-safety':task(
      choice('Навчальні приклади. Який важче вгадати?',['Хмара-Ліхтар-Черепаха-Вітер','123456','111111','Юна2026'],0),
      privateAction('Незнайомець просить пароль.'),
      choice('Хтось дізнався пароль. Що зробиш?',['Скажу батькам або опікуну','Напишу пароль у чат','Нічого не робитиму','Надішлю друзям'],0),
      choice('Для чого пароль?',['Захищає вхід','Прикрашає фото','Шукає музику','Друкує малюнок'],0)),
    'online-response':task(...['Незнайомець просить зберегти від дорослих секрет.','Незнайомець пропонує зустріч.','У чаті надсилають образи.','Обіцяють подарунок за дивним посиланням.'].map(privateAction)),
    'commands-route':task(route('Одна команда до зірки.',[1,1],[1,2]),route('Два кроки до зірки.',[3,0],[2,1]),route('Три кроки до зірки.',[0,1],[2,2]),route('Обійди перешкоду.',[2,0],[2,2],{obstacles:[[2,1]]})),
    'algorithm-debugging':task(
      route('Запусти, зміни перший крок і перевір.',[2,0],[1,1],{debug:true,program:['down','right']}),
      route('Запусти, зміни середній крок і перевір.',[3,0],[2,2],{debug:true,program:['right','down','right']}),
      route('Запусти. Чи треба щось змінювати?',[0,0],[1,1],{debug:true,program:['right','down'],correctInitially:true}),
      route('Запусти й виправ шлях до перешкоди.',[2,0],[1,1],{debug:true,program:['right','right'],obstacles:[[2,1]]})),
    'algorithm-repeat':task(
      {type:'repeat',question:'Скороти чотири кроки вгору.',sequence:'↑ ↑ ↑ ↑',direction:'up',count:4,size:6,start:[5,1],goal:[1,1]},
      {type:'repeat',question:'Скільки повторів для п’яти кроків?',sequence:'→ → → → →',direction:'right',count:5,size:6,start:[0,0],goal:[0,5]},
      choice('Що дорівнює ↓ ↓ ↓?',['Повтори 3 рази ↓','Повтори 2 рази ↓','Повтори 3 рази ↑','Повтори 4 рази ↓'],0),
      {type:'repeat',question:'Запусти повтор. Порахуй кроки.',sequence:'← ←',direction:'left',count:2,size:4,start:[2,3],goal:[2,1]})
  };
  const remember=[
    ['Камера фотографує.','Навушники відтворюють звук.','Клавіатурою вводимо. На екрані бачимо.'],
    ['Натисни, щоб обрати.','Перетягни, щоб пересунути.','Сиди зручно. Роби перерви.'],
    ['Клавіші пишуть букви й цифри.','Пробіл розділяє слова.','Backspace стирає. Enter — новий рядок тут.'],
    ['Очима бачимо. Вухами чуємо.','Текст читаємо. Зображення розглядаємо.','Звук слухаємо. На відео є рух.'],
    ['Об’єкти мають ознаки.','Знайди, що в них спільне.','Спочатку подивись на правило.'],
    ['Модель показує головне.','План допомагає знайти місце.','Знаки на плані мають значення.'],
    ['Знак може щось означати.','Правило допомагає читати код.','Один код — одна домовленість.'],
    ['Факт можна перевірити.','Думка — це те, що хтось вважає.','Не знаєш напевно? Перевір.'],
    ['Обери фон або колір.','Додай малюнок.','Напиши короткий підпис.'],
    ['Роботу можна зберегти.','Шукай у «Моїх роботах».','Відкрий — і продовжуй.'],
    ['Сайт має сторінки.','Посилання відкриває сторінку.','Назад повертає.'],
    ['Подумай, що шукаєш.','Назви головні слова.','Перевір, чи це відповідь.'],
    ['Не надсилай адресу й номер телефону незнайомцям.','Перед фото — подумай і запитай дозволу.','Повідомлення можуть побачити інші.'],
    ['Пароль захищає вхід.','Не надсилай пароль друзям чи незнайомцям.','Потрібна допомога? Скажи дорослому.'],
    ['СТОП — не відповідай.','ЗАКРИЙ — припини розмову.','СКАЖИ дорослому, якому довіряєш.'],
    ['Одна команда — один крок.','Порядок команд важливий.','Запусти й подивись, куди йде Юджі.'],
    ['Спочатку запусти.','Знайди неправильний крок.','Виправ і перевір.'],
    ['Однакові дії можна повторити.','«Повтори 4 рази» — це чотири дії.','Коротший запис працює так само.']
  ];
  const lessons={};
  for(const skill of AppData.skills){
    const old=legacy[skill.legacyId];
    lessons[skill.skillKey]={...(old || {}),skillKey:skill.skillKey,assessmentVersion:skill.assessmentVersion,
      watch:old?.watch || {title:skill.title,intro:skill.question,frames:remember[skill.order-1].map((text,i)=>({icon:skill.icon,title:['Поглянь','Спробуй','Перевір'][i],text}))},
      remember:remember[skill.order-1].map(text=>({icon:skill.icon,text})),
      demo:old?.try,
      activities:old?[{id:'main',label:'Потренуйся',config:old.practice}]:[],
      assessment:checks[skill.skillKey]
    };
  }
  const add=(key,id,label,config)=>lessons[key].activities.push({id,label,config});
  const set=(key,demo,activities,create)=>Object.assign(lessons[key],{demo,activities,create});
  add('device-choice','pairs','З’єднай',task(pairs('З’єднай пристрій і дію.',[['Камера','photo','camera'],['Мікрофон','voice','microphone'],['Принтер','paper','printer']],[['photo','Фото'],['voice','Запис голосу'],['paper','Друк на папері']])));
  add('device-control','scroll','Знайди внизу',task({type:'control',question:'Знайди сонце внизу.',action:'scroll'}));
  add('keyboard-input','space','Пробіл',task({type:'typing',question:'Розділи слова пробілом.',start:'МІЙКІТ',target:'МІЙ КІТ'}));
  add('info-types','senses','З’єднай',task(pairs('Як відчуваємо в реальному світі?',[['Дзвоник','ears','speaker'],['Веселка','eyes','rainbow'],['Запах квітки','nose','flower'],['Холод снігу','skin','snow']],[['ears','Вухами'],['eyes','Очима'],['nose','Носом'],['skin','Шкірою']])));
  const classifyColor=pairs('За кольором: червоні чи сині?',[['Червоне яблуко','red','apple'],['Червона кулька','red','circle'],['Синя чашка','blue','cup'],['Синій квадрат','blue','square']],[['red','Червоні'],['blue','Сині']]);
  set('classification',task({...classifyColor,items:classifyColor.items.slice(0,2)}),[
    {id:'sort',label:'Розклади',config:task(classifyColor)},
    {id:'odd',label:'Зайве',config:task(choice('Що не для їжі?',['Олівець','Ложка','Тарілка','Чашка'],0,['pencil','spoon','plate','cup']))},
    {id:'rule',label:'Зміни правило',config:task(classifyColor,pairs('Тепер за формою.',[['Червоний круг','round','circle'],['Синій круг','round','circle'],['Червоний квадрат','square','square'],['Синій квадрат','square','square']],[['round','Кругле'],['square','Квадратне']]))}
  ]);
  set('models-schemes',task(choice('Що показує кімнату згори?',['План кімнати','Пісня','Клавіатура','Камера'],0,['roomPlan','speaker','keyboard','camera'])),[
    {id:'match',label:'З’єднай',config:task(pairs('Об’єкт і модель.',[['Земля','globe','earth'],['Кімната','plan','room'],['Дерево','tree','tree']],[['globe','Глобус'],['plan','План'],['tree','Схематичний малюнок дерева']]))},
    {id:'plan',label:'Знайди',config:task({type:'plan',question:'Покажи місця на плані.',guide:'Двері — 1. Стіл — 5. Шафа — 3.',items:[{id:'door',label:'Двері',position:0},{id:'desk',label:'Стіл',position:4},{id:'shelf',label:'Шафа',position:2}]})},
    {id:'route',label:'Покажи шлях',config:{kind:'routeRunner',rounds:[{size:3,start:[2,0],goal:[0,2],maxCommands:6,question:'Від входу до книжки.'}]}}
  ],task({type:'plan',question:'Створи план парку.',guide:'Вхід — 7. Дерево — 2. Лавка — 6.',items:[{id:'entrance',label:'Вхід',position:6},{id:'tree',label:'Дерево',position:1},{id:'bench',label:'Лавка',position:5}]}));
  set('coding-symbols',task(pixels('1 — синій. Обери колір і клітинку.',['1'],1)),[
    {id:'paint',label:'Розфарбуй',config:task(pixels('Розфарбуй за кодом.',['1','2','2','1','2','1','1','2','2','1','1','2','1','2','2','1']))},
    {id:'decode',label:'Розшифруй',config:task(pairs('Зірка — іди. Коло — стій. Трикутник — поверни.',[['Зірка','go','star'],['Коло','stop','circle'],['Трикутник','turn','triangle']],[['go','Іди'],['stop','Стій'],['turn','Поверни']]))},
    {id:'code',label:'Знайди код',config:task(choice('Синій, жовтий, синій. Який код?',['1 2 1','2 1 2','1 1 2','2 2 1'],0))}
  ],{kind:'pixelStudio'});
  set('verify-information',task(choice('На малюнку яблуко. Який підпис точний?',['Це яблуко','Це кіт','Це автобус','Це телефон'],0,['apple','cat','bus','phone'],{kind:'image',icon:'apple',label:'Яблуко'})),[
    {id:'fact',label:'Факт чи думка?',config:task(pairs('Розклади твердження.',[['На фото два коти','fact','cat'],['Коти наймиліші','opinion','cat'],['Жовтий найкращий','opinion','sun']],[['fact','Факт'],['opinion','Думка']]))},
    {id:'verify',label:'Треба перевірити',config:task(choice('Невідомий пише, що гурток скасовано. Що зробиш?',['Звірю з учителем','Перешлю всім','Одразу повірю','Одразу назву брехнею'],0))},
    {id:'evidence',label:'Знайди доказ',config:task(pairs('Де знайдеш відповідь?',[['Скільки квіток?','photo','flower'],['Коли гурток?','notice','school'],['Який колір любить Юна?','ask','think']],[['photo','Порахувати на фото'],['notice','Прочитати оголошення'],['ask','Запитати Юну']]))}
  ]);
  set('create-product',task({type:'editor',question:'Додай малюнок і підпис.'}),[
    {id:'image',label:'Намалюй',config:task({type:'editor',question:'Зміни фон. Додай зірку й підпис.'})},
    {id:'words',label:'Додай слова',config:task({type:'editor',question:'Обери зірку. Напиши або обери підпис.'})},
    {id:'edit',label:'Виправ',config:task({type:'editor',question:'Прибери зайве. Додай зірку й підпис.',removeExtra:true})}
  ],{kind:'postcardStudio'});
  // The old card maker remains available as practice; new work is shared with lesson 09.
  add('save-find','shared','Мої роботи',task({type:'editor',question:'Відкрий свою листівку або створи нову.',useSaved:true,save:true}));
  add('browser-navigation','pages','З’єднай',task(pairs('Що робить кнопка?',[['Посилання','open','link'],['Назад','back','back']],[['open','Відкриває сторінку'],['back','Повертає на попередню']])));
  add('online-search','precise','Скажи точніше',task(choice('Шукаємо погоду на завтра у Києві. Обери запит.',['Погода Київ завтра','Погода','Міста','Завтра'],0)));
  add('personal-privacy','consent','Що зробиш?',task(choice('Друг на фото. Що спочатку?',['Запитаю дозволу','Одразу викладу','Надішлю всім','Додам адресу'],0)));
  add('password-safety','help','Кому сказати?',task(choice('Забув пароль. До кого звернутись?',['До батьків або опікуна','До незнайомця в чаті','Написати пароль усім','Надіслати фото'],0)));
  add('online-response','order','Постав по порядку',legacy[11].practice);
  lessons['commands-route'].demo=legacy[13].try;
  add('commands-route','command','Команда',legacy[13].practice);
  add('algorithm-debugging','check','Перевір',task(route('Запусти й перевір готовий маршрут.',[2,1],[1,2],{debug:true,correctInitially:true,program:['up','right']})));
  add('algorithm-repeat','equivalent','Знайди повтор',task(choice('Де три однакові кроки?',['→ → →','→ ↓ →','↑ ↑','↓ ← →'],0)));
  lessons['personal-privacy'].create={kind:'privacyStudio'};
  const scenes={"models-schemes":[["globe","Земля й глобус","Глобус — модель Землі. На ньому видно материки й океани."],["room","Кімната","У кімнаті є стіл, двері та шафа. Подивись, де вони стоять."],["roomPlan","Кімната згори","На плані ті самі речі показані простими знаками."],["stairs","Знак на плані","Сходинки позначають сходи. Книжка може позначати бібліотеку."],["route","Знайди шлях","План допомагає дійти до потрібного місця. Не всі дрібниці треба малювати."]],"coding-symbols":[["star","Домовимось про знаки","Зірка означає «іди», а коло — «стій»."],["robot","Прочитай знак","Побачивши зірку, Юджі робить крок. Побачивши коло — зупиняється."],["square","Правило кольорів","Домовимось: 1 — синій, 2 — жовтий."],["sequence","Читаємо код","Код 1 2 1 означає: синій, жовтий, синій."],["think","Інше правило","За іншою домовленістю знаки можуть означати щось інше. Спочатку прочитай правило."]],"verify-information":[["apple","Це можна перевірити","На малюнку яблуко. Підпис «Це яблуко» підтверджує зображення."],["think","Це думка","«Яблука найсмачніші» — думка Юни. Комусь смакують інші фрукти."],["message","Чи знаємо напевно?","Невідомий пише: «Завтра уроків немає». Самого повідомлення недостатньо."],["school","Перевір з дорослим","Запитай учителя або звір з офіційним повідомленням школи."],["search","Перевір перед пересиланням","Красива картинка й багато пересилань не доводять правдивості."]],"create-product":[["photo","Власна листівка","Обери фон для своєї листівки."],["star","Додай малюнок","Додай зірку, квітку або серце."],["keyboard","Додай слова","Напиши короткий підпис або обери готове «ВІТАЮ»."],["backspace","Виправ зайве","Зайву наліпку можна прибрати. Підпис теж можна змінити."],["save","Збережи роботу","У «Створи сам» збережи листівку. Вона буде в наступному уроці."]]};
  for(const [key,frames] of Object.entries(scenes))lessons[key].watch.frames=frames.map(([icon,title,text])=>({icon,title,text}));
  lessons['verify-information'].activities[0].config.tasks[0].stimulus={kind:'count',count:2,icon:'cat',label:'Два коти на зображенні'};
  const ordered=(question,steps)=>({kind:'sequence',rounds:[{question,items:steps.map(([label,icon],i)=>({id:'step'+i,label,icon})).reverse(),correct:steps.map((_,i)=>'step'+i)}]});
  add('save-find','order','По порядку',ordered('Як повернутися до своєї роботи?',[['Створи','photo'],['Збережи','save'],['Знайди','folder'],['Відкрий','browser']]));
  lessons['online-response'].activities.find(a=>a.id==='order').config=ordered('Онлайн щось не так. Що спочатку?',[['СТОП','stop'],['ЗАКРИЙ','close'],['СКАЖИ','adult']]);
  add('algorithm-debugging','order','По порядку',ordered('Як перевірити й виправити команди?',[['Запусти','play'],['Знайди помилку','search'],['Зміни команду','debug'],['Перевір знову','check']]));
  return lessons;
})();
