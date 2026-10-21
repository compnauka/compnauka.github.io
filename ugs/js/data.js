// Course identities and legacy route mappings for the 18-skill curriculum.
window.LegacyAppData = {
  categories: [
    { id:'devices', icon:'devices', label:'Пристрої', shortLabel:'Пристрої', description:'Користуйся пристроями', count:3 },
    { id:'info', icon:'info', label:'Інформація', shortLabel:'Інформація', description:'Розкладай і впорядковуй', count:4 },
    { id:'online', icon:'online', label:'Інтернет', shortLabel:'Інтернет', description:'Шукай і будь у безпеці', count:5 },
    { id:'algo', icon:'algo', label:'Команди', shortLabel:'Команди', description:'Допомагай Юджі', count:4 }
  ],
  skills: [
    { id:1, category:'devices', icon:'devices', title:'Я обираю потрібний пристрій', short:'Що допоможе зробити потрібну справу?', goal:'Обирай пристрій для потрібної справи.' },
    { id:2, category:'devices', icon:'pointer', title:'Я керую пристроєм безпечно', short:'Натискай, перетягуй, прокручуй.', goal:'Керуй пристроєм дотиком або мишею.' },
    { id:3, category:'devices', icon:'keyboard', title:'Я вводжу текст і числа', short:'Текст, числа, пробіл і новий рядок.', goal:'Набирай короткі слова та виправляй помилки.' },
    { id:4, category:'info', icon:'media', title:'Я впізнаю різну інформацію', short:'Що читаємо, бачимо, чуємо або дивимося?', goal:'Впізнавай текст, зображення, звук і відео.' },
    { id:5, category:'info', icon:'sort', title:'Я сортую', short:'Що до якої групи?', goal:'Розкладай схожі речі по групах.' },
    { id:6, category:'info', icon:'sequence', title:'Я ставлю по порядку', short:'Що спочатку, а що потім?', goal:'Складай правильний порядок.' },
    { id:7, category:'info', icon:'save', title:'Я зберігаю і знаходжу свою роботу', short:'Створи, збережи, знайди.', goal:'Зберігай роботу та знаходь її знову.' },
    { id:8, category:'online', icon:'browser', title:'Я переходжу сторінками', short:'Відкривай посилання і повертайся назад.', goal:'Переходь за посиланнями між сторінками.' },
    { id:9, category:'online', icon:'search', title:'Я шукаю інформацію', short:'Обирай слова, які допоможуть знайти відповідь.', goal:'Пиши точні слова для пошуку.' },
    { id:10, category:'online', icon:'privacy', title:'Я бережу особисте', short:'Подумай, перш ніж щось надсилати.', goal:'Перед надсиланням особистого запитай дорослого.' },
    { id:11, category:'online', icon:'danger', title:'Я звертаюся по допомогу', short:'СТОП → ЗАКРИЙ → СКАЖИ.', goal:'Зупинись, закрий і скажи дорослому.' },
    { id:12, category:'online', icon:'key', title:'Я бережу пароль', short:'Пароль захищає твій вхід.', goal:'Бережи пароль і не надсилай його іншим.' },
    { id:13, category:'algo', icon:'command', title:'Я даю команди Юджі', short:'Одна стрілка — один крок.', goal:'Обирай точну команду для Юджі.' },
    { id:14, category:'algo', icon:'route', title:'Я будую маршрут', short:'Допоможи Юджі дістатися зірки.', goal:'Складай команди у правильному порядку.' },
    { id:15, category:'algo', icon:'debug', title:'Я знаходжу помилку', short:'Знайди неправильний крок і виправ його.', goal:'Запусти, знайди помилку, виправ.' },
    { id:16, category:'algo', icon:'repeat', title:'Я використовую повтор', short:'Однакові команди? Використай повтор.', goal:'Заміни однакові команди повтором.' }
  ],
  steps: ['Розберімося', 'Разом', 'Твоя черга']
};

(() => {
  const rows = [
    ['device-choice','devices','Для чого цей пристрій?','Що допоможе це зробити?',1,'devices'],
    ['device-control','devices','Я керую пристроєм','Як сказати пристрою, що робити?',2,'pointer'],
    ['keyboard-input','devices','Я пишу на клавіатурі','Як написати слово?',3,'keyboard'],
    ['info-types','info','Я розрізняю інформацію','Як ми отримуємо інформацію?',4,'media'],
    ['classification','info','Я знаходжу спільне','Що між ними спільного?',5,'sort'],
    ['models-schemes','info','Я розумію моделі та схеми','Як малюнок допомагає знайти шлях?',null,'route'],
    ['coding-symbols','info','Я розгадую коди','Що ховається за знаками?',null,'sequence'],
    ['verify-information','info','Я перевіряю інформацію','Чи всьому можна вірити?',null,'search'],
    ['create-product','create','Я створюю текст і малюнок','Як зробити власну листівку?',null,'photo'],
    ['save-find','create','Я зберігаю свою роботу','Де знайти мій малюнок?',7,'save'],
    ['browser-navigation','online','Я відкриваю сторінки','Як перейти на іншу сторінку?',8,'browser'],
    ['online-search','online','Я знаходжу потрібне','Які слова допоможуть знайти відповідь?',9,'search'],
    ['personal-privacy','online','Я захищаю особисте','Що не варто надсилати незнайомцям?',10,'privacy'],
    ['password-safety','online','Я бережу свої паролі','Навіщо потрібен пароль?',12,'key'],
    ['online-response','online','Я знаю, що робити онлайн','Що робити, якщо онлайн щось не так?',11,'danger'],
    ['commands-route','algo','Я даю команди','Як допомогти Юджі дійти до зірки?',14,'command'],
    ['algorithm-debugging','algo','Я виправляю помилки','Чому Юджі пішов не туди?',15,'debug'],
    ['algorithm-repeat','algo','Я повторюю команди','Як записати коротше?',16,'repeat']
  ];
  const skills=rows.map(([skillKey,category,title,question,legacyId,icon],i)=>({id:i+1,order:i+1,skillKey,category,title,question,short:question,goal:question,legacyId,icon,assessmentVersion:1}));
  const categories=[
    {id:'devices',icon:'devices',label:'Пристрої',description:'Користуйся пристроями'},
    {id:'info',icon:'info',label:'Інформація',description:'Досліджуй інформацію'},
    {id:'create',icon:'photo',label:'Створюю',description:'Створюй і зберігай'},
    {id:'online',icon:'online',label:'Інтернет',description:'Шукай і будь у безпеці'},
    {id:'algo',icon:'algo',label:'Алгоритми',description:'Допомагай Юджі'}
  ].map(c=>({...c,shortLabel:c.label,count:skills.filter(s=>s.category===c.id).length}));
  const legacyKeys={1:'device-choice',2:'device-control',3:'keyboard-input',4:'info-types',5:'classification',6:'classification',7:'save-find',8:'browser-navigation',9:'online-search',10:'personal-privacy',11:'online-response',12:'password-safety',13:'commands-route',14:'commands-route',15:'algorithm-debugging',16:'algorithm-repeat'};
  window.AppData={categories,skills,legacyKeys,
    href(skill){return 'skill.html?skill='+encodeURIComponent(typeof skill==='string'?skill:skill.skillKey);},
    resolve(params,body={}){
      const key=params.get('skill') || body.skillKey;
      if(key) return skills.find(s=>s.skillKey===key) || null;
      const order=params.get('order');
      if(order) return skills.find(s=>String(s.order)===order) || null;
      const legacy=params.get('id') || body.skillId;
      return legacy ? skills.find(s=>s.skillKey===legacyKeys[legacy]) || null : skills[0];
    }
  };
})();
