'use strict';
const lessons=globalThis.CATALOG_INDEX,app=document.getElementById('app');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>s.toLocaleLowerCase('uk').replace(/[’'ʼ]/g,'').normalize('NFKC');
function shuffle(values){const a=values.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function stored(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}}
function persist(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
const progress=stored('it-studies-progress-v1',{});
const href=l=>'#topic/'+l.id;
const moduleLessons=(g,m)=>lessons.filter(l=>l.grade===g&&l.module===m);
const modules=g=>[...new Set(lessons.filter(l=>l.grade===g).map(l=>l.module))];
const countGames=l=>l.games.length+(l.practice?2:0);
const siteTitle='Інформатика / Computing & Digital Literacy';
const typeNames={quiz:'Вибір відповіді',sort:'Сортування',order:'Послідовність дій',cipher:'Шифрування'};
// Каталог завантажується по класах: у lessons спершу лише короткі записи, повні дані додаються після loadGrades.
const loadedGrades=new Set(),pendingLoads={};
function loadScript(name){const v=globalThis.ASSET_VERSIONS?.[name];return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='assets/'+name+(v?'?v='+v:'');s.onload=resolve;s.onerror=()=>{s.remove();reject(new Error(name));};document.head.append(s);});}
function loadGrades(list){return Promise.all(list.map(g=>loadedGrades.has(g)?null:pendingLoads[g]||(pendingLoads[g]=loadScript('catalog-g'+g+'.js').then(()=>{const byId=new Map(lessons.map(l=>[l.id,l]));for(const full of CATALOG_PARTS[g])Object.assign(byId.get(full.id),full);loadedGrades.add(g);}).finally(()=>{delete pendingLoads[g];}))));}
const loadTeachers=()=>globalThis.TEACHERS&&globalThis.teachersPage?Promise.resolve():Promise.all([loadScript('teachers-data.js'),loadScript('teachers.js')]);
let searchIndex=null,indexedGrades=-1,activeSearchUpdate=null,searchTimer,renderToken=0;
const entries=()=>{if(!searchIndex||indexedGrades!==loadedGrades.size){searchIndex=ResourceSearch.index(lessons);indexedGrades=loadedGrades.size;}return searchIndex;};
const filterOptions=(values,selected)=>values.map(([value,title])=>`<option value="${value}" ${String(value)===String(selected)?'selected':''}>${esc(title)}</option>`).join('');
function catalogRoute(g,m=1,state={}){const p=new URLSearchParams();if(state.type)p.set('type',state.type);if(state.status)p.set('status',state.status);return `#grade/${g}/module/${m}${p.size?'?'+p:''}`;}
function searchRoute(state){const p=new URLSearchParams();for(const key of ['q','grade','module','type','status'])if(state[key])p.set(key,state[key]);return '#search'+(p.size?'?'+p:'');}
function gradeTabs(active,state={}){return `<nav class="grade-tabs" aria-label="Класи">${[1,2,3,4].map(g=>`<a data-grade="${g}" href="${catalogRoute(g,1,state)}" ${g===active?'aria-current="page"':''}>${g} клас</a>`).join('')}</nav>`;}
function filters(state){return `<label>Тип вправи<select id="type-filter">${filterOptions([['','Усі типи'],...Object.entries(typeNames)],state.type)}</select></label><label>Опрацювання<select id="status-filter">${filterOptions([['','Усі теми'],['todo','Ще не опрацьовані'],['done','Опрацьовані']],state.status)}</select></label>`;}
function marked(text,q){const terms=ResourceSearch.words(q||'');if(!terms.length)return esc(text);let last=0,result='';for(const m of String(text).matchAll(/[\p{L}\p{N}]+(?:['’ʼ][\p{L}\p{N}]+)*/gu)){result+=esc(text.slice(last,m.index));result+=terms.some(t=>ResourceSearch.matches(ResourceSearch.words(m[0]),t))?'<mark>'+esc(m[0])+'</mark>':esc(m[0]);last=m.index+m[0].length;}return result+esc(text.slice(last));}
function initShell(){
 const input=document.getElementById('site-search'),form=document.getElementById('site-search-form');
 form.onsubmit=e=>{e.preventDefault();clearTimeout(searchTimer);const q=input.value.trim();if(activeSearchUpdate)activeSearchUpdate(q);else location.hash=searchRoute({q});};
 input.oninput=()=>{if(activeSearchUpdate){clearTimeout(searchTimer);searchTimer=setTimeout(()=>activeSearchUpdate?.(input.value.trim()),160);}};
 document.querySelectorAll('[data-scroll-top]').forEach(a=>a.onclick=e=>{e.preventDefault();const main=document.getElementById('main');main?.focus({preventScroll:true});main?.scrollIntoView({behavior:'smooth',block:'start'});});
 document.onkeydown=e=>{if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)&&!document.activeElement?.isContentEditable){e.preventDefault();input.focus();}};
}
function lessonNavigation(l){return `<nav class="lesson-navigation" aria-label="Вибір уроку"><button class="lesson-selector-toggle" id="lesson-selector-toggle" aria-expanded="false" aria-controls="lesson-nav-fields">${l.grade} клас · Тема ${l.module}.${l.number}<span>Змінити ▾</span></button><div class="navigation-fields" id="lesson-nav-fields"><label><span class="sr-only">Клас</span><select id="nav-grade">${[1,2,3,4].map(g=>`<option value="${g}" ${g===l.grade?'selected':''}>${g} клас</option>`).join('')}</select></label><label><span class="sr-only">Модуль</span><select id="nav-module">${modules(l.grade).map(m=>`<option value="${m}" ${m===l.module?'selected':''}>${m}. ${esc(moduleLessons(l.grade,m)[0].moduleTitle)}</option>`).join('')}</select></label><label class="topic-select"><span class="sr-only">Тема</span><select id="nav-topic">${moduleLessons(l.grade,l.module).map(t=>`<option value="${t.id}" ${t.id===l.id?'selected':''}>${t.module}.${t.number}. ${esc(t.title)}</option>`).join('')}</select></label></div></nav>`;}
function topic(id){const l=lessons.find(l=>l.id===id);if(!l){notFound();return;}const group=lessons.filter(x=>x.grade===l.grade),i=group.indexOf(l);document.title=l.title+' · '+siteTitle;app.innerHTML=`<main id="main" class="lesson-page" tabindex="-1">${lessonNavigation(l)}<article id="lesson-content" class="lesson-content" aria-label="${esc(l.title)}"></article><div class="lesson-done"><p>«Опрацьовано» — твоя позначка проходження теми. Результат практичної роботи покажи вчителю.</p><button id="mark-done" aria-pressed="${!!progress[id]}">${progress[id]?'✓ Опрацьовано':'○ Позначити як опрацьовану'}</button></div><nav class="topic-navigation" aria-label="Сусідні теми">${group[i-1]?`<a href="${href(group[i-1])}"><small>Попередня тема</small>← ${esc(group[i-1].title)}</a>`:'<span></span>'}${group[i+1]?`<a href="${href(group[i+1])}"><small>Наступна тема</small>${esc(group[i+1].title)} →</a>`:''}</nav></main>`;
 const doc=new DOMParser().parseFromString(l.html,'text/html');doc.querySelectorAll('script,style').forEach(n=>n.remove());doc.querySelectorAll('a[href]').forEach(a=>{a.target='_blank';a.rel='noopener noreferrer';});const content=document.getElementById('lesson-content');content.innerHTML=doc.body.innerHTML;
 prepareLesson(content,l);
 const headings=[...content.querySelectorAll('h2,h3')],root=content.firstElementChild||content;
 const activities=l.games.map(g=>({game:g.data,after:g.after,key:g.data.id}));
 if(l.practice){activities.push({key:id+'-quiz',after:l.practiceAfter.quiz,game:{title:'Перевір себе',type:'quiz',data:{questions:l.practice.slice(0,3).map(q=>({q:q[0],options:q.slice(1,4),correct:0,explain:q[4],wrong:q[4]}))}}},{key:id+'-order',after:l.practiceAfter.order,game:{title:'Склади послідовність дій',type:'order',data:{rounds:[{title:'Розташуй дії у правильному порядку',steps:l.practice[3],explain:'Дії розташовано у правильному порядку.',hint:'Подумай, яку дію потрібно виконати першою і чим перевірити результат.'}]}}});}
 activities.sort((a,b)=>a.after.index-b.after.index);
 const positions=new Map();
 activities.forEach((activity,n)=>{
  const heading=headings[activity.after.index];if(!heading)throw Error('Не знайдено пояснення для вправи '+activity.key);
  let block=heading;while(block.parentElement&&block.parentElement!==root&&block.parentElement!==content)block=block.parentElement;
  const parent=block.parentElement;let next=block.nextElementSibling;
  while(next&&!next.matches('h2,h3')&&!next.querySelector('h2,h3'))next=next.nextElementSibling;
  const anchor=positions.has(block)?positions.get(block):next;positions.set(block,anchor);
  const section=document.createElement('section');section.className='inline-exercise';section.dataset.exercise=activity.key;section.setAttribute('aria-label','Вправа: '+activity.game.title);
  section.innerHTML=`<header class="exercise-heading"><span>Перевірка розуміння ${n+1} · ${esc(typeNames[activity.game.type])}</span><h3>${esc(activity.game.title)}</h3></header><div class="exercise-body"></div>`;
  parent.insertBefore(section,anchor);mountExercise(section.querySelector('.exercise-body'),activity.game,activity.key);
 });
 document.getElementById('lesson-selector-toggle').onclick=e=>{const open=e.currentTarget.getAttribute('aria-expanded')!=='true';e.currentTarget.setAttribute('aria-expanded',String(open));document.getElementById('lesson-nav-fields').classList.toggle('is-open',open);};
 document.getElementById('nav-grade').onchange=e=>{location.hash='grade/'+e.target.value;};document.getElementById('nav-module').onchange=e=>{location.hash=href(moduleLessons(l.grade,+e.target.value)[0]);};document.getElementById('nav-topic').onchange=e=>{location.hash='topic/'+e.target.value;};
 document.getElementById('mark-done').onclick=e=>{progress[id]=!progress[id];persist('it-studies-progress-v1',progress);e.currentTarget.textContent=progress[id]?'✓ Опрацьовано':'○ Позначити як опрацьовану';e.currentTarget.setAttribute('aria-pressed',String(!!progress[id]));};
}
function prepareLesson(content,l){
 const title=content.querySelector('h1'),root=content.firstElementChild||content;
 if(title){const banner=title.parentElement;const subtitle=[...banner.querySelectorAll('p')].reverse().map(p=>p.textContent.trim()).find(s=>/[A-Za-z]{3}/.test(s));const english=subtitle?.match(/[A-Za-z].*/)?.[0]||'';const header=document.createElement('header');header.className='lesson-heading';header.innerHTML=`<p class="lesson-meta">${l.grade} клас · Модуль ${l.module} · Тема ${l.module}.${l.number}</p><h1>${esc(l.title)}</h1>${english?`<p class="lesson-subtitle" lang="en">${esc(english)}</p>`:''}`;if(banner!==root)banner.replaceWith(header);else title.replaceWith(header);}
 content.querySelectorAll('h2,h3').forEach(h=>h.classList.add(h.tagName==='H2'?'lesson-section-title':'lesson-subsection-title'));
 content.querySelectorAll('svg[viewBox]').forEach(svg=>{const width=+svg.getAttribute('viewBox').split(/[ ,]+/)[2];if(width<560)return;const wrapper=document.createElement('figure');wrapper.className='lesson-diagram';wrapper.setAttribute('tabindex','0');wrapper.setAttribute('aria-label',svg.querySelector('title')?.textContent||'Навчальна схема');svg.before(wrapper);wrapper.append(svg);const caption=document.createElement('figcaption');caption.textContent='На вузькому екрані схему можна прокручувати ↔';wrapper.append(caption);});
 content.querySelectorAll('table').forEach(table=>{const wrapper=document.createElement('div');wrapper.className='lesson-table';wrapper.setAttribute('tabindex','0');wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label','Навчальна таблиця');table.before(wrapper);wrapper.append(table);});
}
// Кожна вправа має власний стан, кнопки та результат. Без iframe.
function mountExercise(host,game,key){
 let rounds=shuffle(game.data.items||game.data.questions||game.data.rounds||game.data.tasks),index=0,score=0,first=true,locked=false;
 const find=s=>host.querySelector(s),all=s=>[...host.querySelectorAll(s)];
 const help=game.concept?`<details class="exercise-help"><summary>Підказка</summary><p>${esc(game.concept)}</p>${game.art||''}</details>`:'';
 function feedback(ok,text){const el=find('[data-feedback]');el.className='exercise-feedback '+(ok?'correct':'incorrect');el.textContent=text;}
 function completeRound(explanation){if(locked)return;locked=true;if(first)score++;host.orderController?.stop();all('button').forEach(b=>{if(!('next' in b.dataset))b.disabled=true;});feedback(true,'Правильно. '+(explanation||''));find('[data-next]').hidden=false;find('[data-next]').focus?.({preventScroll:true});}
 function finish(){const results=stored('it-studies-results-v2',{}),best=Math.max(results[key]?.score||0,score);results[key]={score:best,total:rounds.length};persist('it-studies-results-v2',results);host.innerHTML=`<div class="exercise-result" role="status"><strong>Правильно з першої спроби: ${score} з ${rounds.length}.</strong><p>Перевірку розуміння завершено.</p>${game.skill?`<p>Тема вправи: ${esc(game.conceptName||game.title)}.</p>`:''}<p>Найкращий результат у цьому браузері: ${best} з ${rounds.length}.</p><p>Практичну роботу з уроку покажи вчителю окремо.</p><button data-retry>Повторити вправу</button></div>`;find('[data-retry]').onclick=()=>mountExercise(host,game,key);}
 function render(){first=true;locked=false;const current=rounds[index];let body='';
  if(game.type==='quiz')body=`<h4>${esc(current.q)}</h4>${current.art?`<div class="exercise-art">${current.art}</div>`:''}<div class="answer-options">${shuffle(current.options.map((text,i)=>({text,i}))).map(a=>`<button data-answer="${a.i}">${esc(a.text)}</button>`).join('')}</div>`;
  if(game.type==='sort')body=`<h4>${esc(current.text)}</h4><div class="answer-options">${game.data.categories.map(c=>`<button data-answer="${esc(c.id)}">${esc(c.label)}</button>`).join('')}</div>`;
  let initialOrder;
  if(game.type==='order'){
   const steps=shuffle(current.steps.map((text,i)=>({text,i})));if(steps.every((s,i)=>s.text===current.steps[i]))steps.push(steps.shift());initialOrder=steps.map(s=>s.i);
   body=`<h4 tabindex="-1">${esc(current.title)}</h4><p class="order-instruction">Перетягуй картки за маркер ⠿. Кнопки ↑ ↓ або клавіші зі стрілками також змінюють порядок.</p><div class="order-list" data-order-list>${steps.map(s=>`<div class="order-row" data-row="${s.i}"><button class="drag-handle" data-handle="${s.i}" aria-label="Перетягнути: ${esc(s.text)}. Стрілки вгору та вниз змінюють позицію.">⠿</button><span class="order-rank" data-rank="${s.i}"></span><span class="order-text">${esc(s.text)}</span><div class="order-arrows"><button data-up="${s.i}" aria-label="Підняти: ${esc(s.text)}">↑</button><button data-down="${s.i}" aria-label="Опустити: ${esc(s.text)}">↓</button></div></div>`).join('')}</div><p class="sr-only" data-order-status role="status"></p><div class="exercise-controls"><button data-reset>Початковий порядок</button><button data-check>Перевірити</button></div>`;
  }
  if(game.type==='cipher'){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ',shift=(ch,d)=>alphabet[(alphabet.indexOf(ch)+d+26)%26],given=current.mode==='encrypt'?current.word:[...current.word].map(c=>shift(c,current.key)).join('');body=`<h4>${current.mode==='encrypt'?'Зашифруй':'Розшифруй'} слово. Ключ: ${current.key}.</h4><p>Зсувай літери на ${current.key} ${current.mode==='encrypt'?'уперед':'назад'} англійським алфавітом.</p><div class="cipher-word">${given}</div><div class="cipher-result" data-cipher-result aria-live="polite">${'· '.repeat(current.word.length)}</div><details><summary>Таблиця зсуву</summary><div class="cipher-table">${alphabet}<br>${[...alphabet].map(c=>shift(c,current.mode==='encrypt'?current.key:-current.key)).join('')}</div></details><div class="letter-options">${[...alphabet].map(c=>`<button data-letter="${c}">${c}</button>`).join('')}</div>`;}
  host.innerHTML=`<div class="exercise-progress">Завдання ${index+1} з ${rounds.length}</div>${help}${body}<div data-feedback role="status"></div><button class="next-answer" data-next hidden>${index===rounds.length-1?'Показати результат':'Наступне завдання →'}</button>`;
  all('[data-answer]').forEach(b=>b.onclick=()=>{if(locked)return;const ok=game.type==='quiz'?+b.dataset.answer===current.correct:b.dataset.answer===current.cat;if(ok){b.classList.add('answer-correct');completeRound(current.explain);}else{first=false;b.disabled=true;b.classList.add('answer-incorrect');feedback(false,game.type==='quiz'?(current.wrong||'Спробуй інший варіант.'):('Підказка: '+(current.hint||game.data.categories.find(c=>c.id===current.cat).hint||'Перечитай пояснення вище.')));}});
  if(game.type==='order')host.orderController=ResourceOrder.mount(host,initialOrder,{steps:current.steps,locked:()=>locked,onReset:()=>{find('[data-feedback]').textContent='';},onCheck:ok=>{if(ok)completeRound(current.explain);else{first=false;feedback(false,current.hint||'Порядок потребує виправлення. Перетягни картки й перевір ще раз.');}}});
  if(game.type==='cipher'){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ',target=current.mode==='encrypt'?[...current.word].map(c=>alphabet[(alphabet.indexOf(c)+current.key)%26]).join(''):current.word;let pos=0;all('[data-letter]').forEach(b=>b.onclick=()=>{if(locked)return;if(b.dataset.letter===target[pos]){pos++;find('[data-cipher-result]').textContent=target.slice(0,pos)+'·'.repeat(target.length-pos);if(pos===target.length)completeRound('Слово '+target+' відновлено правильно.');}else{first=false;feedback(false,'Перевір літеру за таблицею зсуву.');}});}
  find('[data-next]').onclick=()=>{if(!locked)return;index++;if(index===rounds.length)finish();else{render();find('h4')?.focus?.({preventScroll:true});}};
 }
 render();
}
function notFound(){app.innerHTML='<main id="main"><h1>Тему не знайдено</h1><a href="#">Повернутися до змісту</a></main>';}
function guide(){app.innerHTML='<main id="main" class="guide"><h1>Робота з підручником</h1><p>Оберіть клас, модуль і тему. Вправи для закріплення розміщені в тексті уроку після відповідних пояснень.</p><p>Позначки опрацьованих тем і результати вправ зберігаються у цьому браузері. На спільному пристрої вони можуть належати різним учням. Вправи допомагають перевірити розуміння; практичну роботу потрібно виконати й показати вчителю. Позначку «Опрацьовано» учень ставить сам.</p><p>Нотатки вчителя доступні в кінці уроку. Деякі зовнішні зображення й ресурси потребують інтернету.</p><a href="#">До змісту</a></main>';}
function loading(){app.innerHTML='<main id="main" class="loading" tabindex="-1" role="status"><p>Завантаження…</p></main>';}
function loadFailed(){app.innerHTML='<main id="main"><h1>Не вдалося завантажити матеріали</h1><p>Перевірте з’єднання й оновіть сторінку.</p><a href="#">Повернутися до змісту</a></main>';}
function settle(){document.getElementById('main')?.setAttribute('tabindex','-1');window.scrollTo(0,0);}
function after(promise,show){const token=renderToken;loading();promise.then(()=>{if(token===renderToken){show();settle();}},()=>{if(token===renderToken)loadFailed();});}
function render(){
 renderToken++;ResourceOrder.stopAll();document.title=siteTitle;activeSearchUpdate=null;clearTimeout(searchTimer);initShell();
 const raw=location.hash.slice(1),split=raw.indexOf('?'),path=split<0?raw:raw.slice(0,split),params=new URLSearchParams(split<0?'':raw.slice(split+1));let route;
 try{route=decodeURIComponent(path).split('/');}catch{notFound();return;}
 if(route[0]==='topic'){const l=lessons.find(x=>x.id===route[1]);if(l&&!loadedGrades.has(l.grade)){after(loadGrades([l.grade]),()=>topic(l.id));return;}topic(route[1]);}
 else if(route[0]==='search'){const state={q:params.get('q')||route.slice(1).join('/'),grade:params.get('grade'),module:params.get('module'),type:params.get('type'),status:params.get('status')};after(loadGrades([1,2,3,4]),()=>searchPage(state));return;}
 else if(route[0]==='teachers'){after(loadTeachers(),()=>teachersPage(+route[1]||0));return;}
 else if(route[0]==='guide')guide();
 else if(!route[0]||route[0]==='grade'||route[0]==='main')catalog(route[1]?+route[1]:1,route[3]?+route[3]:1,{type:params.get('type'),status:params.get('status')});
 else notFound();
 settle();
}
window.addEventListener('hashchange',render);render();
