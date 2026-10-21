// One vertical lesson, stable skill routes and a separate independent assessment.
(() => {
  'use strict';
  const skill=AppData.resolve(new URLSearchParams(location.search),document.body.dataset);
  const stage=document.getElementById('lessonStage'),esc=LessonUI.escape;
  document.body.classList.add('lesson-document');
  if(!skill){stage.innerHTML='<h1>Урок не знайдено</h1><a href="index.html#skills">Обрати урок</a>';return;}
  history.replaceState(null,'',AppData.href(skill)+location.hash);
  const lesson=CourseLessons[skill.skillKey], category=AppData.categories.find(c=>c.id===skill.category);
  document.title=skill.title+' — Цифрові суперсили';
  document.getElementById('skillTitle').textContent=skill.title;
  document.getElementById('skillTopTitle').textContent=category.label;
  document.getElementById('skillCategory').textContent='Урок '+skill.order+' із '+AppData.skills.length+' · '+category.label;
  document.getElementById('skillIcon').innerHTML=AppIcons.svg(skill.icon);
  const nav=document.getElementById('stepper');nav.className='lesson-contents';nav.setAttribute('aria-label','Розділи цього уроку');
  nav.innerHTML=[['video','Дивись'],['remember','Запам’ятай'],['practice','Потренуйся'],['check','Перевір себе']].map(([id,label])=>'<a href="#'+id+'">'+label+'</a>').join('');
  const listen=label=>'<button type="button" class="secondary-btn compact-btn" data-listen aria-label="'+esc(label || 'Послухати')+'">Послухати</button>';
  stage.innerHTML='<p class="document-mission">'+esc(skill.question)+'</p>'+ 
    '<section class="document-section" id="video" aria-labelledby="videoHeading"><h2 id="videoHeading">Дивись</h2><div class="explanation-grid">'+lesson.watch.frames.map(frame=>'<article class="explanation-card"><div class="explanation-art" aria-hidden="true">'+AppIcons.svg(frame.icon)+'</div><div><h3>'+esc(frame.title)+'</h3><p>'+esc(frame.text)+'</p>'+listen('Послухати пояснення')+'</div></article>').join('')+'</div></section>'+ 
    '<section class="document-section" id="remember" aria-labelledby="rememberHeading"><h2 id="rememberHeading">Запам’ятай</h2><div class="remember-grid">'+lesson.remember.map(card=>'<article class="remember-card"><span aria-hidden="true">'+AppIcons.svg(card.icon)+'</span><p>'+esc(card.text)+'</p>'+listen('Послухати картку')+'</article>').join('')+'</div></section>'+ 
    '<section class="document-section" id="demo" aria-labelledby="demoHeading"><h2 id="demoHeading">Спробуй</h2><div data-demo-root></div></section>'+ 
    '<section class="document-section" id="practice" aria-labelledby="practiceHeading"><h2 id="practiceHeading">Потренуйся</h2><div class="practice-tabs" role="tablist" aria-label="Вправи">'+lesson.activities.map((a,i)=>'<button type="button" role="tab" id="tab-'+a.id+'" aria-controls="panel-'+a.id+'" aria-selected="'+(i===0)+'" tabindex="'+(i===0?0:-1)+'" data-tab="'+a.id+'">'+esc(a.label)+'</button>').join('')+'</div><p class="practice-session" role="status" data-practice-status></p>'+lesson.activities.map((a,i)=>'<div role="tabpanel" id="panel-'+a.id+'" class="practice-panel" aria-labelledby="tab-'+a.id+'" tabindex="0" '+(i?'hidden':'')+'><div data-activity-root="'+a.id+'"></div><button type="button" class="secondary-btn practice-restart" data-restart="'+a.id+'">Спробувати знову</button></div>').join('')+'</section>'+ 
    (lesson.create?'<section class="document-section" id="create" aria-labelledby="createHeading"><h2 id="createHeading">Створи сам</h2><div data-create-root></div></section>':'')+
    '<section class="document-section" id="check" aria-labelledby="checkHeading"><h2 id="checkHeading">Перевір себе</h2><p>Спробуй без підказок.</p><div data-assessment-root><button type="button" class="primary-btn" data-start-check>Почати</button></div></section><a href="index.html#skills">Обрати інший урок</a>';
  const mounted=new Set(),completed=new Set();
  const names={quiz:'quizRounds',keyboard:'virtualKeyboard',media:'mediaLab',safetyScenario:'safetyScenarios',control:'controlLab',controlAssessment:'controlLab'};
  function markStarted(){ProgressStore.set(skill.skillKey,'training',lesson.assessmentVersion);}
  function mount(root,config,onComplete){
    if(!config)return;
    root.innerHTML='<div class="activity-audio">'+listen('Послухати завдання')+'</div><div data-mounted></div>';
    const body=root.querySelector('[data-mounted]'),component=ComponentRegistry[names[config.kind] || config.kind];
    if(!component)throw new Error('Unknown activity: '+config.kind);
    component(body,{...config,finishLabel:'Готово'},{allowBack:false,onComplete,focusHeading(){const heading=body.querySelector('h2,h3');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}},bindListenButtons(){}});
  }
  function practiceStatus(){stage.querySelector('[data-practice-status]').textContent=completed.size?'Виконано вправ: '+completed.size+'. Можеш спробувати ще.':'';}
  function mountPractice(id){const activity=lesson.activities.find(a=>a.id===id),root=stage.querySelector('[data-activity-root="'+id+'"]');mounted.add(id);mount(root,activity.config,()=>{markStarted();completed.add(id);practiceStatus();root.innerHTML='<p role="status">У тебе вийшло!</p>';});}
  function selectTab(id){stage.querySelectorAll('[data-tab]').forEach(tab=>{const active=tab.dataset.tab===id;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;stage.querySelector('#panel-'+tab.dataset.tab).hidden=!active;});if(!mounted.has(id))mountPractice(id);}
  const tabs=[...stage.querySelectorAll('[data-tab]')];
  tabs.forEach((tab,i)=>{tab.onclick=()=>selectTab(tab.dataset.tab);tab.onkeydown=e=>{const last=tabs.length-1;const next={ArrowRight:(i+1)%tabs.length,ArrowLeft:(i+last)%tabs.length,Home:0,End:last}[e.key];if(next!==undefined){e.preventDefault();selectTab(tabs[next].dataset.tab);tabs[next].focus();}};});
  stage.querySelectorAll('[data-restart]').forEach(b=>b.onclick=()=>{if(!confirm('Почати цю вправу знову? Поточні відповіді зникнуть.'))return;completed.delete(b.dataset.restart);practiceStatus();mountPractice(b.dataset.restart);});
  mount(stage.querySelector('[data-demo-root]'),lesson.demo,()=>{markStarted();stage.querySelector('[data-demo-root]').innerHTML='<p role="status">Вийшло! Спробуй інші вправи.</p>';});
  if(lesson.create)mount(stage.querySelector('[data-create-root]'),lesson.create,()=>{});
  if(tabs.length)selectTab(tabs[0].dataset.tab);
  for(const id of ['demo','practice','create'])stage.querySelector('#'+id)?.addEventListener('pointerdown',markStarted,{once:true});
  for(const id of ['demo','practice','create'])stage.querySelector('#'+id)?.addEventListener('keydown',markStarted,{once:true});
  const checkRoot=stage.querySelector('[data-assessment-root]');
  function assessment(){
    markStarted();mount(checkRoot,{...lesson.assessment,assessment:true},result=>{
      if(result.max!==4)throw new Error('Assessment must return four independent outcomes');
      const status=LessonUI.status(result.points,4);ProgressStore.set(skill.skillKey,status,lesson.assessmentVersion);
      const labels={mastered:'Вмію!',almost:'Майже!',training:'Тренуюся'},next=AppData.skills.find(s=>s.order===skill.order+1);
      checkRoot.innerHTML='<div class="practice-finished" role="status"><h3 tabindex="-1">'+labels[status]+'</h3><p>'+ (status==='mastered'?'У тебе вийшло!':'Потренуйся й спробуй ще.')+'</p><div class="stage-actions"><button type="button" class="secondary-btn" data-check-again>Спробувати ще</button><a class="primary-btn" href="'+(next?AppData.href(next):'index.html#skills')+'">'+(next?'Далі':'До уроків')+'</a></div></div>';
      checkRoot.querySelector('[data-check-again]').onclick=assessment;checkRoot.querySelector('h3').focus({preventScroll:true});
    });
  }
  stage.querySelector('[data-start-check]').onclick=assessment;
  function speak(text){if(!('speechSynthesis' in window) || !AppSettings.audioEnabled)return;speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='uk-UA';utterance.rate=.92;speechSynthesis.speak(utterance);}
  stage.addEventListener('click',event=>{const b=event.target.closest('[data-listen]');if(!b)return;const scope=b.closest('.remember-card,.explanation-card') || b.closest('[data-activity-root],[data-demo-root],[data-create-root],[data-assessment-root]');speak(scope?.innerText.replace(/Послухати/g,'') || skill.question);});
  const speakButton=document.getElementById('speakPage');
  if(!('speechSynthesis' in window)){speakButton.hidden=true;stage.querySelectorAll('[data-listen]').forEach(b=>b.hidden=true);}
  speakButton?.addEventListener('click',()=>{const section=[...stage.querySelectorAll('.document-section')].find(el=>el.getBoundingClientRect().bottom>120);speak(section?.innerText || skill.question);});
})();
