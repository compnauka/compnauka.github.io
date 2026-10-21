// Shared interactive tasks with independent submission and delayed assessment feedback.
window.ComponentRegistry = window.ComponentRegistry || {};
window.SkillTasks = (() => {
  'use strict';
  const esc=LessonUI.escape;
  const art=icon=>AppIcons.svg(icon || 'info');
  const button=(label,attrs='')=>'<button type="button" class="secondary-btn" '+attrs+'>'+label+'</button>';
  function choice(root,task){
    let answer=null;
    root.innerHTML=(task.stimulus?stimulus(task.stimulus):'')+'<div class="picture-choice-grid">'+LessonUI.shuffle(task.options).map(o=>'<button class="picture-choice" type="button" data-answer="'+esc(o.id)+'" aria-pressed="false"><span aria-hidden="true">'+art(o.icon)+'</span><span>'+esc(o.label)+'</span></button>').join('')+'</div>';
    bindStimulus(root,task.stimulus);
    root.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{answer=b.dataset.answer;root.querySelectorAll('[data-answer]').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));});
    return {ready:()=>answer!==null,check:()=>answer===task.answerId};
  }
  function stimulus(s){
    if(s.kind==='text')return '<p class="task-stimulus">'+esc(s.text)+'</p>';
    if(s.kind==='sound')return button('Відтворити','data-sample')+'<details><summary>Не чую приклад</summary>Лунає короткий сигнал без слів і зображення.</details>';
    if(s.kind==='video')return '<video class="task-video" controls playsinline preload="metadata" aria-label="Короткий рухомий приклад"><source src="assets/video/motion.webm" type="video/webm"></video><p>Короткий рухомий приклад.</p>';
    if(s.kind==='count')return '<div class="task-count" role="img" aria-label="'+esc(s.label)+'">'+Array.from({length:s.count},()=>'<span aria-hidden="true">'+art(s.icon)+'</span>').join('')+'</div>';
    return '<div class="task-illustration" role="img" aria-label="'+esc(s.label || '')+'">'+art(s.icon)+'</div>';
  }
  function bindStimulus(root,s){root.querySelector('[data-sample]')?.addEventListener('click',()=>{
    const Audio=window.AudioContext || window.webkitAudioContext;if(!Audio)return;
    const audio=new Audio(),osc=audio.createOscillator(),gain=audio.createGain();osc.frequency.value=s.tone || 660;gain.gain.value=.08;osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+.5);osc.onended=()=>audio.close();
  });}
  function pairs(root,task){
    const answers={};let selected=null;
    root.innerHTML='<p>Обери картку, потім пару або групу.</p><div class="task-pairs"><div>'+task.items.map(i=>button('<span aria-hidden="true">'+art(i.icon)+'</span>'+esc(i.label), 'data-source="'+esc(i.id)+'" aria-pressed="false"')).join('')+'</div><div>'+LessonUI.shuffle(task.targets).map(t=>button(esc(t.label),'data-target="'+esc(t.id)+'"')).join('')+'</div></div><p data-mapping role="status"></p>';
    root.querySelectorAll('[data-source]').forEach(b=>b.onclick=()=>{selected=b.dataset.source;root.querySelectorAll('[data-source]').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));});
    root.querySelectorAll('[data-target]').forEach(b=>b.onclick=()=>{if(!selected)return;answers[selected]=b.dataset.target;root.querySelector('[data-mapping]').textContent=task.items.filter(i=>answers[i.id]).map(i=>i.label+' → '+task.targets.find(t=>t.id===answers[i.id]).label).join('; ');selected=null;root.querySelectorAll('[data-source]').forEach(o=>o.setAttribute('aria-pressed','false'));});
    return {ready:()=>task.items.every(i=>answers[i.id]),check:()=>task.items.every(i=>answers[i.id]===i.target)};
  }
  function pixels(root,task){
    const values=Array(task.code.length).fill(null);let paint=task.palette[0].id;
    root.innerHTML='<p>'+task.palette.map(c=>esc(c.id)+' = '+esc(c.label)).join('; ')+'</p><div class="stage-actions">'+task.palette.map((c,i)=>button(esc(c.label),'data-paint="'+esc(c.id)+'" aria-pressed="'+(i===0)+'"')).join('')+'</div><div class="pixel-grid" style="--columns:'+task.columns+'" role="group" aria-label="Клітинки коду">'+task.code.map((c,i)=>button(esc(c),'data-cell="'+i+'" aria-label="Клітинка '+(i+1)+', код '+esc(c)+'"')).join('')+'</div>';
    root.querySelectorAll('[data-paint]').forEach(b=>b.onclick=()=>{paint=b.dataset.paint;root.querySelectorAll('[data-paint]').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));});
    const cells=[...root.querySelectorAll('[data-cell]')];
    cells.forEach((b,i)=>{b.onclick=()=>{values[i]=paint;const color=task.palette.find(c=>c.id===paint);b.style.background=color.color;b.textContent=task.code[i]+' · '+color.label;b.setAttribute('aria-label','Клітинка '+(i+1)+', код '+task.code[i]+', '+color.label);};b.onkeydown=e=>{const shift={ArrowRight:1,ArrowLeft:-1,ArrowDown:task.columns,ArrowUp:-task.columns}[e.key];if(shift!==undefined){e.preventDefault();cells[Math.max(0,Math.min(cells.length-1,i+shift))].focus();}};});
    return {ready:()=>values.every(v=>v!==null),check:()=>values.every((v,i)=>v===task.code[i])};
  }
  function plan(root,task){
    const placed={};let item=task.items[0].id;
    root.innerHTML='<p>'+esc(task.guide)+'</p><div class="stage-actions">'+task.items.map((i,n)=>button(esc(i.label),'data-object="'+i.id+'" aria-pressed="'+(n===0)+'"')).join('')+'</div><div class="pixel-grid" style="--columns:3">'+Array.from({length:9},(_,i)=>button(String(i+1),'data-position="'+i+'" aria-label="Рядок '+(Math.floor(i/3)+1)+', стовпчик '+(i%3+1)+'"')).join('')+'</div>';
    root.querySelectorAll('[data-object]').forEach(b=>b.onclick=()=>{item=b.dataset.object;root.querySelectorAll('[data-object]').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));});
    root.querySelectorAll('[data-position]').forEach(b=>b.onclick=()=>{const pos=Number(b.dataset.position);for(const key of Object.keys(placed))if(placed[key]===pos)delete placed[key];placed[item]=pos;root.querySelectorAll('[data-position]').forEach(o=>{const obj=task.items.find(i=>placed[i.id]===Number(o.dataset.position));o.textContent=obj?obj.label:String(Number(o.dataset.position)+1);});});
    return {ready:()=>task.items.every(i=>Number.isInteger(placed[i.id])),check:()=>task.items.every(i=>placed[i.id]===i.position)};
  }
  function typing(root,task){
    let operated=!task.operation;
    root.innerHTML='<p>Зразок: <strong class="typing-target"></strong></p><label>Твій текст<textarea data-text rows="2" autocomplete="off" spellcheck="false"></textarea></label><div class="task-keyboard">'+[...'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ0123456789'].map(c=>button(c,'data-key="'+c+'"')).join('')+'</div><div class="stage-actions">'+button('Пробіл','data-key=" "')+button('Стерти','data-delete')+button('Новий рядок','data-enter')+'</div>';
    root.querySelector('.typing-target').textContent=task.target;
    const input=root.querySelector('[data-text]');input.value=task.start || '';input.setSelectionRange(input.value.length,input.value.length);
    function insert(text){input.setRangeText(text,input.selectionStart,input.selectionEnd,'end');if(task.operation==='enter' && text==='\n')operated=true;input.focus({preventScroll:true});}
    root.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>insert(b.dataset.key));
    root.querySelector('[data-enter]').onclick=()=>insert('\n');root.querySelector('[data-delete]').onclick=()=>{const start=input.selectionStart,end=input.selectionEnd;input.setRangeText('',start===end?Math.max(0,start-1):start,end,'end');if(task.operation==='backspace')operated=true;input.focus({preventScroll:true});};
    input.onkeydown=e=>{if(e.key==='Backspace' && task.operation==='backspace')operated=true;if(e.key==='Enter' && task.operation==='enter')operated=true;};
    return {ready:()=>input.value.length>0,check:()=>input.value.replace(/\r/g,'')===task.target && operated};
  }
  function route(root,task){
    let program=task.program?[...task.program]:[],runCount=0,edited=false,selected=0,result=null,originalRun=false;
    root.innerHTML='<div data-field></div><div class="robot-program" data-code></div><div class="robot-command-pad">'+RobotUI.commandButtons()+'</div><div class="stage-actions">'+button('Стерти крок','data-undo')+button('Запустити','data-execute')+(task.debug?button('Залишити як є','data-keep'):'')+'</div><p data-location role="status"></p>';
    function sync(){root.querySelector('[data-field]').innerHTML=RobotUI.gridHtml({size:task.size,start:task.start,goal:task.goal,obstacles:task.obstacles || [],robot:result?.position || task.start,trail:result?.trail || []});root.querySelector('[data-code]').innerHTML=RobotUI.programHtml(program,{editable:!!task.debug,selectedIndex:selected});root.querySelectorAll('[data-program-index]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.programIndex);sync();});}
    root.querySelectorAll('[data-command]').forEach(b=>b.onclick=()=>{if(task.debug){program[selected]=b.dataset.command;edited=true;}else if(program.length<(task.maxCommands || 12))program.push(b.dataset.command);result=null;sync();});
    root.querySelector('[data-undo]').onclick=()=>{if(task.debug){program.splice(selected,1);edited=true;selected=0;}else program.pop();result=null;sync();};
    root.querySelector('[data-execute]').onclick=()=>{if(!program.length)return;if(!edited)originalRun=true;result=RobotUI.simulate(task.start,program,task.size,task.obstacles || []);runCount++;root.querySelector('[data-location]').textContent='Юджі: рядок '+(result.position[0]+1)+', стовпчик '+(result.position[1]+1)+(result.collision?'. На шляху межа або перешкода.':'.');sync();};
    root.querySelector('[data-keep]')?.addEventListener('click',()=>{if(!result)return;edited=false;});sync();
    return {ready:()=>!!result,check:()=>!!result && !result.collision && RobotUI.same(result.position,task.goal) && (!task.debug || (task.correctInitially?!edited:originalRun && edited && runCount>=2))};
  }
  function repeat(root,task){
    let direction='right',count=1,result=null;
    root.innerHTML='<p class="task-stimulus">'+esc(task.sequence)+'</p><div data-field></div><div class="robot-command-pad">'+RobotUI.commandButtons({selected:direction})+'</div><label>Кількість повторів<select data-times>'+[1,2,3,4,5].map(n=>'<option>'+n+'</option>').join('')+'</select></label>'+button('Запустити','data-execute')+'<p role="status" data-steps></p>';
    function sync(){root.querySelector('[data-field]').innerHTML=RobotUI.gridHtml({size:task.size,start:task.start,goal:task.goal,robot:result?.position || task.start,trail:result?.trail || []});}
    root.querySelectorAll('[data-command]').forEach(b=>b.onclick=()=>{direction=b.dataset.command;result=null;root.querySelectorAll('[data-command]').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));sync();});
    root.querySelector('[data-times]').onchange=e=>{count=Number(e.target.value);result=null;sync();};
    root.querySelector('[data-execute]').onclick=()=>{result=RobotUI.simulate(task.start,Array(count).fill(direction),task.size);root.querySelector('[data-steps]').textContent='Кроки: '+Array.from({length:result.trail.length-1},(_,i)=>i+1).join(' → ');sync();};sync();
    return {ready:()=>!!result,check:()=>!!result && !result.collision && direction===task.direction && count===task.count && RobotUI.same(result.position,task.goal)};
  }
  function browser(root,task){
    let page=task.start,history=[];const visited=[];
    function render(){const entry=task.pages[page];root.innerHTML='<div class="task-browser"><h3>'+esc(entry.title)+'</h3>'+entry.links.map(id=>button(esc(task.pages[id].title),'data-page="'+esc(id)+'"')).join('')+button('Назад','data-browser-back '+(!history.length?'disabled':''))+'</div>';
      root.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{history.push(page);page=b.dataset.page;visited.push(page);render();});root.querySelector('[data-browser-back]').onclick=()=>{if(history.length){page=history.pop();visited.push(page);render();}};
    }render();return {ready:()=>visited.length>0,check:()=>page===task.goal && task.visit.every((id,i)=>visited[i]===id) && visited.length===task.visit.length};
  }
  function control(root,task){
    let done=false,selected=false,attempted=false;
    if(task.action==='scroll'){
      root.innerHTML='<div class="task-scroll" tabindex="0" role="region" aria-label="Прокрути список">'+['Кіт','Дім','Ліс','Квітка','Сонце'].map((label,i)=>'<div>'+button(label,'data-scroll-item="'+i+'"')+'</div>').join('')+'</div>';
      root.querySelectorAll('[data-scroll-item]').forEach(b=>b.onclick=()=>{done=b.dataset.scrollItem==='4';});
    }else if(task.action==='move'){
      root.innerHTML=button('Куб','data-cube aria-pressed="false"')+button('Коробка','data-box')+'<p data-moved role="status"></p>';
      root.querySelector('[data-cube]').onclick=e=>{selected=true;e.currentTarget.setAttribute('aria-pressed','true');};root.querySelector('[data-box]').onclick=()=>{if(selected){done=true;root.querySelector('[data-moved]').textContent='Куб у коробці.';}};
    }else{
      root.innerHTML='<div class="stage-actions">'+['Коло','Квадрат','Трикутник','Зірка'].map(label=>button(label,'data-shape="'+label+'" aria-pressed="false"')).join('')+'</div>';
      root.querySelectorAll('[data-shape]').forEach(b=>b.onclick=()=>{attempted=true;done=b.dataset.shape==='Квадрат';root.querySelectorAll('[data-shape]').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));});
    }
    return {ready:()=>done || attempted,check:()=>done};
  }
  function editor(root,task){
    let work=task.useSaved?ProgressStore.getWork('postcard'):{};
    work={background:'white',elements:[],caption:'',...work};
    if(!Array.isArray(work.elements))work.elements=[];
    if(task.removeExtra && !work.elements.length)work.elements=['extra'];
    const actions=new Set();let saved=false,phase='edit',opened=false;
    function preview(w){return '<div class="made-card" style="background:'+({white:'#fff',blue:'#e2f5ff',green:'#eef8d4'}[w.background] || '#fff')+'">'+w.elements.map(e=>'<span>'+art(e==='extra'?'block':e)+'</span>').join('')+'<strong>'+esc(w.caption)+'</strong></div>';}
    function render(){
      if(phase==='gallery'){
        const works=[{id:'mine',...work},{id:'other',background:'green',elements:['camera'],caption:'Інша робота'}];
        root.innerHTML='<h3>Мої роботи</h3>'+works.map(w=>button(preview(w),'data-work="'+w.id+'"')).join('');root.querySelectorAll('[data-work]').forEach(b=>b.onclick=()=>{if(b.dataset.work==='mine'){opened=true;phase='opened';actions.add('open');render();}});return;
      }
      if(phase==='opened'){root.innerHTML='<h3>Твоя робота</h3>'+preview(work);return;}
      if(phase==='closed'){root.innerHTML=button('Мої роботи','data-gallery');root.querySelector('[data-gallery]').onclick=()=>{actions.add('gallery');phase='gallery';render();};return;}
      root.innerHTML=preview(work)+'<div class="stage-actions">'+button('Блакитний фон','data-background="blue"')+button('Зелений фон','data-background="green"')+['star','flower','heart'].map((icon,i)=>button(['Зірка','Квітка','Серце'][i],'data-sticker="'+icon+'"')).join('')+button('Прибрати зайве','data-remove')+'</div><label>Підпис<input data-caption maxlength="45" autocomplete="off" value="'+esc(work.caption)+'"></label><div class="stage-actions">'+button('ВІТАЮ','data-preset')+(task.save?button('Зберегти','data-save')+button('Закрити роботу','data-close'):'')+'</div><p data-editor-status role="status"></p>';
      root.querySelectorAll('[data-background]').forEach(b=>b.onclick=()=>{work.background=b.dataset.background;actions.add('background');render();});
      root.querySelectorAll('[data-sticker]').forEach(b=>b.onclick=()=>{if(work.elements.length<8)work.elements.push(b.dataset.sticker);actions.add('image');render();});
      root.querySelector('[data-remove]').onclick=()=>{const extra=work.elements.indexOf('extra');if(extra>=0){work.elements.splice(extra,1);actions.add('remove');}else if(work.elements.length){work.elements.pop();actions.add('remove');}render();};
      root.querySelector('[data-caption]').oninput=e=>{work.caption=e.target.value;actions.add('caption');root.querySelector('.made-card strong').textContent=work.caption;};
      root.querySelector('[data-preset]').onclick=()=>{work.caption='ВІТАЮ';actions.add('caption');render();};
      root.querySelector('[data-save]')?.addEventListener('click',()=>{if(!work.elements.length || !work.caption.trim()){root.querySelector('[data-editor-status]').textContent='Додай малюнок і підпис.';return;}ProgressStore.saveWork('postcard',work);saved=true;actions.add('save');root.querySelector('[data-editor-status]').textContent='Збережено в «Моїх роботах».';});
      root.querySelector('[data-close]')?.addEventListener('click',()=>{if(!saved){root.querySelector('[data-editor-status]').textContent='Спочатку збережи роботу.';return;}phase='closed';render();});
    }render();
    return {ready:()=>task.save?opened:!!work.caption.trim() && work.elements.length>0,check:()=>!task.assessment?(!task.removeExtra || !work.elements.includes('extra')):task.save?[actions.has('image') || task.useSaved,saved,actions.has('gallery'),opened]:[actions.has('background'),work.elements.includes('star'),!!work.caption.trim(),task.removeExtra?actions.has('remove') && !work.elements.includes('extra'):true],save:()=>ProgressStore.saveWork('postcard',work)};
  }
  const builders={choice,pairs,pixels,plan,typing,route,repeat,browser,control,editor};
  return {builders};
})();
window.ComponentRegistry.skillTasks = function(root,config={},ctx={}){
  const tasks=config.tasks || [];let index=0;const results=[];
  function render(){
    const task=tasks[index];if(!task){ctx.onComplete?.({points:results.filter(Boolean).length,max:results.length,results});return;}
    root.innerHTML='<div class="stage-box" data-component="skill-tasks"><h3 tabindex="-1">'+LessonUI.escape(task.question)+'</h3><div data-task-body></div><p data-task-feedback role="status"></p><div class="stage-actions"><button type="button" class="primary-btn" data-submit>'+ (config.assessment?'Далі':'Перевірити')+'</button></div></div>';
    const controller=SkillTasks.builders[task.type](root.querySelector('[data-task-body]'),{...task,assessment:!!config.assessment});
    root.querySelector('[data-submit]').onclick=()=>{
      if(!controller.ready()){root.querySelector('[data-task-feedback]').textContent='Спочатку виконай дію.';return;}
      const checked=controller.check(),values=Array.isArray(checked)?checked:[checked];
      if(!config.assessment && values.some(v=>!v)){root.querySelector('[data-task-feedback]').textContent='Спробуй ще. Поглянь на правило.';return;}
      if(!config.assessment)controller.save?.();results.push(...values);index++;render();ctx.focusHeading?.();
    };
  }render();
};

// Creative work is saved independently of assessment and survives tab changes and reloads.
window.ComponentRegistry.postcardStudio=(root,config,ctx)=>{
  root.innerHTML='<div data-studio></div><button type="button" class="primary-btn" data-save-studio>Зберегти листівку</button><p data-studio-status role="status"></p>';
  const editor=SkillTasks.builders.editor(root.querySelector('[data-studio]'),{useSaved:true});
  root.querySelector('[data-save-studio]').onclick=()=>{if(!editor.ready()){root.querySelector('[data-studio-status]').textContent='Додай малюнок і підпис.';return;}editor.save();root.querySelector('[data-studio-status]').textContent='Листівка у «Моїх роботах».';};
};
window.ComponentRegistry.pixelStudio=root=>{
  const stored=ProgressStore.getWork('pixel-code'), code=Array.isArray(stored.code) && stored.code.length===9?stored.code.map(c=>c==='2'?'2':'1'):Array(9).fill('1');let copying=false,copy=Array(9).fill(null);
  function render(){root.innerHTML='<p>Натискай клітинки: 1 — синій, 2 — жовтий.</p><div class="pixel-grid" style="--columns:3">'+code.map((c,i)=>'<button type="button" class="secondary-btn" data-pixel="'+i+'" style="background:'+(c==='1'?'#70d0ff':'#f3c84a')+'">'+c+'</button>').join('')+'</div><p>Твій код: <strong>'+code.join(' ')+'</strong></p><button type="button" class="primary-btn" data-save-code>Зберегти код</button><button type="button" class="secondary-btn" data-copy-code>Відтвори код</button><div data-copy-root></div><p data-code-status role="status"></p>';
    root.querySelectorAll('[data-pixel]').forEach(b=>b.onclick=()=>{code[Number(b.dataset.pixel)]=b.textContent==='1'?'2':'1';copying=false;copy=Array(9).fill(null);render();});
    root.querySelector('[data-save-code]').onclick=()=>{ProgressStore.saveWork('pixel-code',{code:[...code]});root.querySelector('[data-code-status]').textContent='Код збережено.';};
    root.querySelector('[data-copy-code]').onclick=()=>{copying=true;copy=Array(9).fill(null);renderCopy();};
    if(copying)renderCopy();
  }
  function renderCopy(){const area=root.querySelector('[data-copy-root]');area.innerHTML='<h3>Повтори в іншій сітці</h3><div class="pixel-grid" style="--columns:3">'+copy.map((c,i)=>'<button type="button" class="secondary-btn" data-copy-pixel="'+i+'">'+(c || '—')+'</button>').join('')+'</div><button type="button" class="secondary-btn" data-check-copy>Перевірити</button>';area.querySelectorAll('[data-copy-pixel]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.copyPixel);copy[i]=copy[i]==='1'?'2':'1';b.textContent=copy[i];});area.querySelector('[data-check-copy]').onclick=()=>{root.querySelector('[data-code-status]').textContent=copy.every((c,i)=>c===code[i])?'Вийшло! Код відтворено.':'Звір клітинки зі своїм кодом.';};}
  render();
};

// Fictional privacy card; no upload or child information is requested.
window.ComponentRegistry.privacyStudio=root=>{
  root.innerHTML='<p>Перед надсиланням закрий адресу й телефон.</p><div class="privacy-picture"><span aria-hidden="true">'+AppIcons.svg('school')+'</span><p>Моя школа</p><button type="button" class="secondary-btn" data-private="address">Адреса: вул. Прикладова, 1</button><button type="button" class="secondary-btn" data-private="phone">Телефон: 000 000 00 00</button><span>Улюблений колір — синій</span></div><p data-private-status role="status"></p>';
  let covered=0;root.querySelectorAll('[data-private]').forEach(b=>b.onclick=()=>{b.textContent='Закрито наліпкою';b.disabled=true;covered++;root.querySelector('[data-private-status]').textContent=covered===2?'Особисті деталі приховані.':'Знайди ще одну особисту деталь.';});
};
