const QUESTIONS_PER_TOPIC = 10;
const STORAGE_KEY = 'infoziirky_s_v3';
const PPOS = [[50,80],[75,220],[25,370],[60,510],[35,660],[50,800]];
const TOPICS = window.TOPICS || [];
if(!TOPICS.length){ throw new Error('TOPICS not loaded. Include questions.js before script.js'); }

const shuffle = (arr)=>{ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; };
const TOTAL_STARS = TOPICS.length * QUESTIONS_PER_TOPIC;
const makeDefaultProgress = ()=>TOPICS.map((_,i)=>({ unlocked:i===0, completed:false, questionIds:[], done:Array(QUESTIONS_PER_TOPIC).fill(false) }));

let S = { curTopic:0, curTask:0, progress:makeDefaultProgress() };
let taskAnswered = false;
let seqState = {placed:[], used:new Set()};
let sortState = {idx:0, answers:[], items:[]};
let dragState = {assignments:{}, selected:null};

function save(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); }catch(e){} }
function stateValid(v){
  if(!v || !Array.isArray(v.progress) || v.progress.length!==TOPICS.length) return false;
  return v.progress.every((p,idx)=>p && typeof p.unlocked==='boolean' && Array.isArray(p.done) && p.done.length===QUESTIONS_PER_TOPIC && Array.isArray(p.questionIds) && p.questionIds.length===QUESTIONS_PER_TOPIC && p.questionIds.every((id)=>Number.isInteger(id) && id>=0 && id<TOPICS[idx].bank.length));
}
function load(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw){
      const d=JSON.parse(raw);
      if(stateValid(d)){ S=d; return; }
    }
  }catch(e){}
  S={ curTopic:0, curTask:0, progress:makeDefaultProgress() };
  save();
}

function showScreen(id){ document.querySelectorAll('.screen').forEach((s)=>s.classList.remove('active')); document.getElementById(id).classList.add('active'); }
function initBubbles(){
  const c=document.getElementById('bubbles');
  for(let i=0;i<30;i++){
    const b=document.createElement('div');
    b.className='bubble';
    const sz=Math.random()*80+20;
    b.style.cssText=`width:${sz}px;height:${sz}px;left:${Math.random()*100}%;bottom:${-Math.random()*120}px;animation-duration:${(Math.random()*15+12).toFixed(1)}s;animation-delay:${(Math.random()*7).toFixed(1)}s;`;
    c.appendChild(b);
  }
}

const totalStars = ()=>S.progress.reduce((a,p)=>a+p.done.filter(Boolean).length,0);
const topicDone = (i)=>S.progress[i].done.filter(Boolean).length;
function ensureTopicSample(i){
  const p=S.progress[i];
  if(!p.questionIds.length){
    p.questionIds=shuffle([...Array(TOPICS[i].bank.length).keys()]).slice(0,QUESTIONS_PER_TOPIC);
    p.done=Array(QUESTIONS_PER_TOPIC).fill(false);
    save();
  }
}

function renderMap(){
  document.getElementById('total-stars').textContent=totalStars();
  document.getElementById('max-stars').textContent=TOTAL_STARS;
  const map=document.getElementById('planet-map');
  map.querySelectorAll('.pnode').forEach((n)=>n.remove());
  const svg=document.getElementById('path-svg');
  svg.innerHTML='';
  for(let i=0;i<PPOS.length-1;i++){
    const [x1,y1]=PPOS[i],[x2,y2]=PPOS[i+1];
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',x1/100*420); line.setAttribute('y1',y1+46);
    line.setAttribute('x2',x2/100*420); line.setAttribute('y2',y2+46);
    line.setAttribute('stroke',S.progress[i].completed?TOPICS[i].color:'rgba(255,255,255,.35)');
    line.setAttribute('stroke-width','4');
    line.setAttribute('stroke-dasharray','9 8');
    line.setAttribute('stroke-linecap','round');
    svg.appendChild(line);
  }
  TOPICS.forEach((t,i)=>{
    const p=S.progress[i], locked=!p.unlocked;
    const node=document.createElement('div');
    node.className='pnode'+(locked?' locked':'');
    node.style.left=PPOS[i][0]+'%'; node.style.top=PPOS[i][1]+'px';
    if(!locked) node.onclick=()=>openTopic(i);
    const circle=document.createElement('div');
    circle.className='pcircle';
    circle.style.background=`radial-gradient(circle at 35% 28%,${t.color},${t.colorDark})`;
    circle.innerHTML=`<span>${t.emoji}</span>${p.completed?'<div class="ck"><i class="fas fa-check"></i></div>':''}${locked?'<div class="plock"><i class="fas fa-lock"></i></div>':''}`;
    const name=document.createElement('div'); name.className='pname'; name.textContent=t.title;
    const stat=document.createElement('div'); stat.className='pstat'; stat.textContent=`${topicDone(i)}/${QUESTIONS_PER_TOPIC}`;
    node.appendChild(circle); node.appendChild(name); node.appendChild(stat); map.appendChild(node);
  });
}

function openTopic(i){ S.curTopic=i; ensureTopicSample(i); const next=S.progress[i].done.indexOf(false); S.curTask=next>=0?next:0; save(); showScreen('task-screen'); renderTask(); }
function returnToMap(){ showScreen('map-screen'); renderMap(); }
function getCurrentTask(){ const p=S.progress[S.curTopic]; return TOPICS[S.curTopic].bank[p.questionIds[S.curTask]]; }

function renderTask(){
  taskAnswered=false;
  const topic=TOPICS[S.curTopic], task=getCurrentTask(), done=topicDone(S.curTopic);
  document.getElementById('next-btn').classList.remove('vis');
  const fill=document.getElementById('tprog-fill');
  fill.style.width=(done/QUESTIONS_PER_TOPIC*100)+'%'; fill.style.background=topic.color;
  document.getElementById('tprog-count').textContent=`${done}/${QUESTIONS_PER_TOPIC}`;
  const body=document.getElementById('task-body');
  body.innerHTML=`
    <div class="topic-tag" style="background:${topic.color}dd;color:#fff">${topic.emoji} ${topic.title.replace('\n',' ')}</div>
    <div style="font-size:14px;font-weight:800;opacity:.95">Завдання ${S.curTask+1} з ${QUESTIONS_PER_TOPIC}</div>
    <div class="q-text">${task.question}</div>
    <div id="task-content"></div>
    <div class="fb-banner" id="fb-banner"></div>
  `;
  const wrap=document.getElementById('task-content');
  if(task.type==='mc') renderMC(task, wrap);
  if(task.type==='sequence') renderSequence(task, wrap);
  if(task.type==='sort') renderSort(task, wrap);
  if(task.type==='drag') renderDrag(task, wrap);
  document.getElementById('next-btn').style.background=topic.color;
}

function renderMC(task, wrap){
  const d=document.createElement('div'); d.className='mc-opts';
  task.options.forEach((opt,i)=>{
    const b=document.createElement('button');
    b.className='mc-opt'; b.type='button';
    b.innerHTML=`<span style="width:30px;height:30px;border-radius:50%;background:#e7f0ff;color:#1959aa;font-weight:900;display:flex;align-items:center;justify-content:center">${i+1}</span><span>${opt}</span>`;
    b.onclick=()=>checkMC(i,task); d.appendChild(b);
  });
  wrap.appendChild(d);
}
function checkMC(i, task){
  if(taskAnswered) return; taskAnswered=true;
  const opts=document.querySelectorAll('.mc-opt');
  opts.forEach((o)=>o.classList.add('dis'));
  const ok=i===task.correct;
  opts[i].classList.add(ok?'ok':'no');
  if(!ok) opts[task.correct].classList.add('ok');
  showFeedback(ok, ()=>document.querySelectorAll('.mc-opt').forEach((o)=>o.classList.remove('dis','ok','no')));
  if(ok) markDone();
}

function renderSequence(task, wrap){
  seqState={placed:[], used:new Set()};
  const idxs=shuffle([...task.items.keys()]);
  const d=document.createElement('div');
  d.className='seq-wrap';
  d.innerHTML='<div class="seq-hint">Натискай картки у правильному порядку.</div><div class="seq-slots" id="seq-slots"></div><div class="seq-cards" id="seq-cards"></div><button class="check-btn" id="seq-check">Перевірити</button>';
  wrap.appendChild(d);
  const slots=d.querySelector('#seq-slots');
  task.items.forEach((_,i)=>slots.innerHTML+=`<div class="seq-slot" id="seq-slot-${i}"><span>${i+1}</span><div></div></div>`);
  const cards=d.querySelector('#seq-cards');
  idxs.forEach((i)=>{ const c=document.createElement('button'); c.type='button'; c.className='seq-card'; c.id=`seq-card-${i}`; c.textContent=task.items[i]; c.onclick=()=>seqPick(i, task); cards.appendChild(c); });
  d.querySelector('#seq-check').onclick=()=>checkSequence(task);
}
function seqPick(origIdx, task){
  if(taskAnswered || seqState.used.has(origIdx)) return;
  seqState.used.add(origIdx); seqState.placed.push(origIdx);
  const pos=seqState.placed.length-1;
  const slot=document.getElementById(`seq-slot-${pos}`);
  slot.classList.add('filled'); slot.querySelector('div').textContent=task.items[origIdx];
  document.getElementById(`seq-card-${origIdx}`).classList.add('used');
  if(seqState.placed.length===task.items.length) document.getElementById('seq-check').classList.add('vis');
}
function checkSequence(task){
  if(taskAnswered || seqState.placed.length!==task.items.length) return;
  taskAnswered=true;
  let allOk=true;
  seqState.placed.forEach((origIdx,pos)=>{ const ok=origIdx===pos; document.getElementById(`seq-slot-${pos}`).classList.add(ok?'ok':'no'); if(!ok) allOk=false; });
  showFeedback(allOk, ()=>renderTask());
  if(allOk) markDone();
}

function renderSort(task, wrap){
  sortState={idx:0, answers:[], items:shuffle([...task.items])};
  const d=document.createElement('div');
  d.className='sort-wrap';
  d.innerHTML=`<div class="sort-dots" id="sort-dots"></div><div class="sort-item" id="sort-item"></div><div class="sort-cats"><button type="button" class="sort-cat c0" id="sort-c0">${task.cats[0]}</button><button type="button" class="sort-cat c1" id="sort-c1">${task.cats[1]}</button></div>`;
  wrap.appendChild(d);
  const dots=d.querySelector('#sort-dots');
  for(let i=0;i<sortState.items.length;i++) dots.innerHTML+=`<div class="dot${i===0?' cur':''}" id="dot-${i}"></div>`;
  d.querySelector('#sort-item').textContent=sortState.items[0].t;
  d.querySelector('#sort-c0').onclick=()=>sortChoose(0);
  d.querySelector('#sort-c1').onclick=()=>sortChoose(1);
}
function sortChoose(chosen){
  if(taskAnswered) return;
  const cur=sortState.items[sortState.idx], ok=cur.c===chosen;
  sortState.answers.push(ok);
  const dot=document.getElementById(`dot-${sortState.idx}`);
  if(dot) dot.classList.add(ok?'ok':'no');
  setTimeout(()=>{
    sortState.idx++;
    if(sortState.idx>=sortState.items.length){
      taskAnswered=true;
      const allOk=sortState.answers.every(Boolean);
      showFeedback(allOk, ()=>renderTask());
      if(allOk) markDone();
    }else{
      const nextDot=document.getElementById(`dot-${sortState.idx}`);
      if(nextDot) nextDot.classList.add('cur');
      document.getElementById('sort-item').textContent=sortState.items[sortState.idx].t;
    }
  },250);
}

function renderDrag(task, wrap){
  dragState={assignments:{}, selected:null};
  const d=document.createElement('div');
  d.className='drag-wrap';
  d.innerHTML='<div class="drag-hint">Перетягни картки у правильний кошик.</div><div class="drag-cards" id="drag-cards"></div><div class="drag-bins" id="drag-bins"></div><button type="button" class="check-btn" id="drag-check">Перевірити</button>';
  wrap.appendChild(d);
  const cardsBox=d.querySelector('#drag-cards');
  const cards=shuffle(task.cards.map((x,i)=>({...x,id:i})));
  cards.forEach((card)=>{
    const el=document.createElement('div');
    el.className='drag-card'; el.draggable=true; el.dataset.id=String(card.id); el.textContent=card.t;
    el.addEventListener('dragstart',(e)=>e.dataTransfer.setData('text/plain', String(card.id)));
    el.addEventListener('click',()=>selectDragCard(card.id));
    cardsBox.appendChild(el);
  });
  const binsBox=d.querySelector('#drag-bins');
  task.bins.forEach((label,idx)=>{
    const b=document.createElement('div');
    b.className='drag-bin';
    b.innerHTML=`<div class="drag-bin-title">${label}</div><div class="drag-bin-body" id="drag-bin-${idx}"></div>`;
    b.addEventListener('dragover',(e)=>e.preventDefault());
    b.addEventListener('drop',(e)=>{ e.preventDefault(); moveCardToBin(parseInt(e.dataTransfer.getData('text/plain'),10), idx); });
    b.addEventListener('click',(e)=>{
      if(dragState.selected===null) return;
      if(e.target && e.target.classList && e.target.classList.contains('drag-card')) return;
      moveCardToBin(dragState.selected, idx);
    });
    binsBox.appendChild(b);
  });
  d.querySelector('#drag-check').onclick=()=>checkDrag(task);
}
function selectDragCard(id){
  dragState.selected=id;
  document.querySelectorAll('.drag-card').forEach((c)=>c.classList.remove('sel'));
  const el=document.querySelector(`.drag-card[data-id="${id}"]`);
  if(el) el.classList.add('sel');
}
function moveCardToBin(id, binIdx){
  if(taskAnswered || Number.isNaN(id)) return;
  dragState.assignments[id]=binIdx;
  const card=document.querySelector(`.drag-card[data-id="${id}"]`);
  const dest=document.getElementById(`drag-bin-${binIdx}`);
  if(card && dest){ card.classList.remove('sel'); dest.appendChild(card); dragState.selected=null; }
  if(Object.keys(dragState.assignments).length===getCurrentTask().cards.length){
    const b=document.getElementById('drag-check');
    if(b) b.classList.add('vis');
  }
}
function checkDrag(task){
  if(taskAnswered || Object.keys(dragState.assignments).length!==task.cards.length) return;
  taskAnswered=true;
  let allOk=true;
  task.cards.forEach((card, idx)=>{ const ok=dragState.assignments[idx]===card.b; const el=document.querySelector(`.drag-card[data-id="${idx}"]`); if(el) el.classList.add(ok?'ok':'no'); if(!ok) allOk=false; });
  showFeedback(allOk, ()=>renderTask());
  if(allOk) markDone();
}

function showFeedback(ok, onWrongReset){
  const fb=document.getElementById('fb-banner');
  if(!fb) return;
  fb.className='fb-banner '+(ok?'ok':'no');
  if(ok){
    const msgs=['Чудово!','Супер!','Молодець!','Так тримати!','Класна відповідь!'];
    fb.innerHTML=`<i class="fas fa-check-circle"></i> ${msgs[Math.floor(Math.random()*msgs.length)]}`;
    document.getElementById('next-btn').classList.add('vis');
  }else{
    fb.innerHTML='<i class="fas fa-times-circle"></i> Майже! Спробуй ще раз.';
    setTimeout(()=>{
      taskAnswered=false;
      fb.className='fb-banner';
      fb.style.display='none';
      if(typeof onWrongReset==='function') onWrongReset();
    },1300);
  }
}

function markDone(){
  const p=S.progress[S.curTopic];
  if(!p.done[S.curTask]) p.done[S.curTask]=true;
  save();
  const done=topicDone(S.curTopic);
  document.getElementById('tprog-fill').style.width=(done/QUESTIONS_PER_TOPIC*100)+'%';
  document.getElementById('tprog-count').textContent=`${done}/${QUESTIONS_PER_TOPIC}`;
}
function completeTopic(){
  const p=S.progress[S.curTopic];
  p.completed=true;
  if(S.curTopic+1<TOPICS.length) S.progress[S.curTopic+1].unlocked=true;
  save();
  showBadge(S.curTopic);
}
function nextTask(){
  const p=S.progress[S.curTopic];
  const done=topicDone(S.curTopic);
  if(done>=QUESTIONS_PER_TOPIC && !p.completed){ completeTopic(); return; }
  let next=S.curTask+1;
  if(next>=QUESTIONS_PER_TOPIC){
    next=p.done.indexOf(false);
    if(next<0){
      if(!p.completed) completeTopic();
      else returnToMap();
      return;
    }
  }
  S.curTask=next;
  save();
  renderTask();
}

function showBadge(i){
  showScreen('badge-screen');
  const t=TOPICS[i];
  const box=document.getElementById('badge-box');
  box.innerHTML=`
    <div class="badge-big-e">${t.badgeEmoji}</div>
    <div class="badge-wow">Бейдж отримано!</div>
    <div class="badge-name">${t.badgeName}</div>
    <div class="badge-or"><strong>Я-орієнтир:</strong><br>${t.orientir}</div>
    <button class="cont-btn" onclick="afterBadge(${i})">${i===TOPICS.length-1?'Показати фінал':'До наступної теми'}</button>
  `;
  showConfetti();
}
function afterBadge(i){ if(i===TOPICS.length-1 && S.progress.every((p)=>p.completed)) showDone(); else returnToMap(); }
function showDone(){
  showScreen('done-screen');
  const box=document.getElementById('done-box');
  const badges=TOPICS.map((t)=>`<div class="b-item"><span class="be">${t.badgeEmoji}</span><span>${t.badgeName}</span></div>`).join('');
  box.innerHTML=`<div style="font-size:72px">🏆</div><div style="font-size:33px;font-weight:900">Ти досяг(ла) успіху!</div><div style="font-size:16px;line-height:1.4;max-width:330px">Усі теми завершено. Набрано ${totalStars()} зірок із ${TOTAL_STARS}. Відмінна робота!</div><div class="badges-grid">${badges}</div><button class="reset-btn" onclick="resetGame()">Почати спочатку</button>`;
  showConfetti();
}
function resetGame(){ S={curTopic:0,curTask:0,progress:makeDefaultProgress()}; save(); returnToMap(); }
function showConfetti(){
  const c=document.getElementById('confetti');
  c.innerHTML='';
  const colors=['#ff6b6b','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6','#fff'];
  for(let i=0;i<85;i++){
    const d=document.createElement('div');
    d.className='cf';
    d.style.cssText=`left:${Math.random()*100}%;width:${Math.random()*8+5}px;height:${Math.random()*10+5}px;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${(Math.random()*2+1.8).toFixed(1)}s;animation-delay:${(Math.random()*.8).toFixed(2)}s;`;
    c.appendChild(d);
  }
  setTimeout(()=>{c.innerHTML='';},3400);
}

initBubbles();
load();
renderMap();
showScreen('map-screen');

