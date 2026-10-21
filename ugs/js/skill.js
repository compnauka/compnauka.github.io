(() => {
  'use strict';
  const id = Number(new URLSearchParams(location.search).get('id') || document.body.dataset.skillId) || 1;
  const skill = AppData.skills.find(s => s.id === id) || AppData.skills[0];
  const lesson = window.DeviceLessons?.[skill.id] || window.InfoLessons?.[skill.id] || window.OnlineLessons?.[skill.id] || window.AlgoLessons?.[skill.id];
  const bank = PracticeBank[skill.id], media = window.LessonMedia?.[skill.id] || {};
  const category = AppData.categories.find(c => c.id === skill.category);
  const stage = document.getElementById('lessonStage'), esc = LessonUI.escape;
  document.body.classList.add('lesson-document');
  document.title = `${skill.title} — Цифрові суперсили`;
  document.getElementById('skillTitle').textContent = skill.title;
  document.getElementById('skillTopTitle').textContent = category.label;
  document.getElementById('skillCategory').textContent = `Урок ${skill.id} із 16 · ${category.label}`;
  document.getElementById('skillIcon').innerHTML = AppIcons.svg(skill.icon);
  const nav = document.getElementById('stepper');
  nav.className = 'lesson-contents'; nav.setAttribute('aria-label','Розділи цього уроку');
  nav.innerHTML = [['video','Відео'],['explanation','Пояснення'],['practice','Практика'],['check','Перевір себе']].map(([anchor,title])=>`<a href="#${anchor}">${title}</a>`).join('');
  const activities = [
    {key:'try',label:'Спробуй',config:lesson.try},
    {key:'train',label:'Тренуйся',config:lesson.practice},
    {key:'sort',label:'Розклади',config:bank.sort},
    {key:'words',label:'Знайди слова',config:{kind:'wordSearch',words:bank.words}},
    {key:'draw',label:'Намалюй',config:{kind:'draw',prompt:bank.draw}}
  ];
  const videoId = LessonUI.youtubeId(media.youtube);
  stage.innerHTML = `
    <p class="document-mission">${esc(lesson.watch.intro || skill.goal)}</p>
    <p class="lesson-scope">У цьому уроці: ${lesson.watch.frames.length} пояснення · ${activities.length} видів практики · підсумкове завдання.</p>
    <section class="document-section" id="video" aria-labelledby="videoHeading"><span class="eyebrow">1 · Подивись</span><h2 id="videoHeading">Відеопояснення</h2>
      ${videoId ? `<div class="document-video"><button type="button" class="primary-btn" data-open-video>▶ Дивитися відео</button><p>YouTube · відео відкриється тут після натискання.</p><a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer">Відкрити на YouTube ↗</a></div>` : '<div class="video-pending"><span aria-hidden="true">'+AppIcons.svg('video')+'</span><p><strong>Відео ще готується.</strong> А поки розглянь приклади нижче — вони допоможуть виконати вправи.</p><a href="#explanation">До пояснення ↓</a></div>'}
    </section>
    <section class="document-section" id="explanation" aria-labelledby="explanationHeading"><span class="eyebrow">2 · Розберімося</span><h2 id="explanationHeading">${esc(lesson.watch.title)}</h2>
      <div class="explanation-grid">${lesson.watch.frames.map((frame,i)=>`<article class="explanation-card"><div class="explanation-art" aria-hidden="true">${AppIcons.svg(frame.icon)}</div><div><span class="eyebrow">${i+1} із ${lesson.watch.frames.length}</span><h3>${esc(frame.title)}</h3><p>${esc(frame.text)}</p></div></article>`).join('')}</div>
      <details class="document-reminder"><summary>Що варто запам’ятати</summary>${lesson.remember.map(card=>`<p><strong>${esc(card.title)}.</strong> ${esc(card.text)}</p>`).join('')}</details>
    </section>
    <section class="document-section" id="practice" aria-labelledby="practiceHeading"><span class="eyebrow">3 · Спробуй самостійно</span><h2 id="practiceHeading">Пограй і потренуйся</h2><p>Почни зі «Спробуй», а потім переходь до «Тренуйся». Для закріплення обери сортування, слова або малювання. Можна робити перерви.</p>
      <div class="practice-tabs" role="tablist" aria-label="Види практики">${activities.map((a,i)=>`<button type="button" role="tab" id="tab-${a.key}" aria-controls="panel-${a.key}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-tab="${a.key}">${a.label}<span data-done="${a.key}" hidden aria-label="виконано"> ✓</span></button>`).join('')}</div>
      <p class="practice-session" role="status" data-practice-status>Виконано 0 із 5 видів практики. Обирай додаткові вправи за бажанням.</p>
      ${activities.map((a,i)=>`<div role="tabpanel" class="practice-panel" id="panel-${a.key}" aria-labelledby="tab-${a.key}" tabindex="0" ${i?'hidden':''}><div data-activity-root="${a.key}"></div><button type="button" class="secondary-btn practice-restart" data-restart="${a.key}">Почати цю вправу заново</button></div>`).join('')}
    </section>
    <section class="document-section" id="check" aria-labelledby="checkHeading"><span class="eyebrow">4 · Що вже вмію</span><h2 id="checkHeading">Перевір себе</h2><p>Спробуй завдання без підказок. Не обов’язково завершувати всі додаткові вкладки. Якщо складно — повернися до пояснення чи практики.</p><div data-assessment-root><button type="button" class="primary-btn" data-start-check>Почати підсумкове завдання</button></div></section>
    <section class="document-section" id="resources" aria-labelledby="resourcesHeading"><h2 id="resourcesHeading">Ще цікаве з цієї теми</h2><div data-resources></div><a href="index.html#skills">Обрати інший урок</a></section>`;
  stage.querySelector('[data-open-video]')?.addEventListener('click',()=>{
    stage.querySelector('.document-video').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="${esc(media.title || skill.title)}" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer">Відкрити на YouTube ↗</a>`;
  });
  const resources = (media.resources || []).filter(r=>{try{return new URL(r.url).protocol==='https:';}catch{return false;}});
  const resourceRoot = stage.querySelector('[data-resources]');
  resourceRoot.innerHTML = resources.length ? resources.map(r=>`<p><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)} ↗</a>${r.description?`<br>${esc(r.description)}`:''}</p>`).join('') : '<p>Розкажи комусь удома, що ти сьогодні навчився або навчилася робити. Покажи свій приклад.</p>';
  const mounted = new Set(), completed = new Set();
  const names = {quiz:'quizRounds',control:'controlLab',controlLab:'controlLab',controlAssessment:'controlLab',keyboard:'virtualKeyboard',media:'mediaLab',safetyScenario:'safetyScenarios'};
  function mount(root,config,onComplete){
    const component=ComponentRegistry[names[config.kind] || config.kind];
    if(!component)throw Error(`Unknown activity: ${config.kind}`);
    component(root,{...config,finishLabel:'Готово'}, {allowBack:false,onComplete,focusHeading(){},bindListenButtons(){}});
  }
  function markStarted(){if(ProgressStore.get(skill.id)==='new')ProgressStore.set(skill.id,'training');}
  stage.querySelector('#practice').addEventListener('pointerdown',markStarted,{once:true});
  stage.querySelector('#practice').addEventListener('keydown',markStarted,{once:true});
  function mountPractice(key){
    const activity=activities.find(a=>a.key===key), root=stage.querySelector(`[data-activity-root="${key}"]`);
    mounted.add(key);
    mount(root,activity.config,()=>{
      markStarted();completed.add(key);stage.querySelector(`[data-done="${key}"]`).hidden=false;
      stage.querySelector('[data-practice-status]').textContent=`Виконано ${completed.size} із 5 видів практики. Можеш обрати іншу вправу або перевірити себе.`;
      if(!['draw','words'].includes(key))root.innerHTML='<div class="practice-finished" role="status"><h3>У тебе вийшло!</h3><p>Обери іншу вкладку, повтори цю вправу або переходь до підсумкового завдання.</p><a href="#check" class="primary-btn">Перевір себе ↓</a></div>';
    });
  }
  const tabs=[...stage.querySelectorAll('[data-tab]')];
  function selectTab(key){
    tabs.forEach(t=>{const active=t.dataset.tab===key;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;stage.querySelector(`#panel-${t.dataset.tab}`).hidden=!active;});
    if(!mounted.has(key))mountPractice(key);
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>selectTab(tab.dataset.tab));
    tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(i+1)%tabs.length;if(event.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();selectTab(tabs[next].dataset.tab);tabs[next].focus();}});
  });
  stage.querySelectorAll('[data-restart]').forEach(button=>button.addEventListener('click',()=>{if(!confirm('Почати цю вправу заново? Поточні відповіді або малюнок зникнуть.'))return;completed.delete(button.dataset.restart);stage.querySelector(`[data-done="${button.dataset.restart}"]`).hidden=true;stage.querySelector('[data-practice-status]').textContent=`Виконано ${completed.size} із 5 видів практики.`;mountPractice(button.dataset.restart);}));
  const checkRoot=stage.querySelector('[data-assessment-root]');
  function assessment(){markStarted();mount(checkRoot,{...lesson.assessment,assessment:true},result=>{
    const status=LessonUI.status(result.points,result.max);ProgressStore.set(skill.id,status);
    const copy={mastered:['У тебе вийшло!','Ти впорався або впоралася самостійно.'],almost:['Ти вже близько!','Повернися до вправ і спробуй ще раз.'],training:['Продовжуй тренуватися','Розглянь приклади та спробуй вправи з підказками.']}[status];
    checkRoot.innerHTML=`<div class="practice-finished" role="status"><h3>${copy[0]}</h3><p>${copy[1]}</p><div class="stage-actions"><button type="button" class="secondary-btn" data-check-again>Спробувати ще раз</button><a class="primary-btn" href="${skill.id<16?'skill.html?id='+(skill.id+1):'index.html'}">${skill.id<16?'Наступний урок':'На головну'}</a></div></div>`;
    checkRoot.querySelector('[data-check-again]').onclick=assessment;
  });}
  stage.querySelector('[data-start-check]').onclick=assessment;
  mountPractice('try');
  const speakButton=document.getElementById('speakPage');
  if(!('speechSynthesis' in window)){if(speakButton)speakButton.hidden=true;return;}
  speakButton?.addEventListener('click',()=>{
    try{if(localStorage.getItem('digital-minimum-audio-enabled')==='false')return;}catch{}
    const activePanel=stage.querySelector('[role="tabpanel"]:not([hidden])');
    const section=[...stage.querySelectorAll('.document-section')].find(el=>{const r=el.getBoundingClientRect();return r.bottom>120 && r.top<innerHeight;});
    const text=section?.id==='practice'?activePanel.innerText:section?.innerText || `${skill.title}. ${skill.goal}`;
    speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='uk-UA';utterance.rate=.92;speechSynthesis.speak(utterance);
  });
})();
