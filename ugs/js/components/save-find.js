window.ComponentRegistry = window.ComponentRegistry || {};
window.ComponentRegistry.saveFind = (root, config = {}, ctx = {}) => {
  const rounds = config.rounds || [];
  let index = 0, points = 0;
  function round() {
    const task = rounds[index];
    if (!task) return ctx.onComplete?.({points,max:rounds.length*2});
    let phase='create', name='', caption='', icon=task.target.icon, color='#e2f5ff', saved=null, mistakes=0;
    const esc=LessonUI.escape;
    function card(work) { return `<div class="made-card" style="--card-color:${work.color}"><div aria-hidden="true">${AppIcons.svg(work.icon)}</div><strong>${esc(work.name)}</strong><span>${esc(work.caption)}</span></div>`; }
    function draft() { return {name,caption,icon,color}; }
    function render() {
      let body='';
      if(phase==='create') body=`<p>Створи листівку про пристрій «${esc(task.target.label)}».</p><div class="product-workspace"><div>${card(draft())}</div><div class="product-controls"><label>Назва роботи<input data-name maxlength="24" autocomplete="off" value="${esc(name)}" placeholder="Наприклад: Мій помічник"></label><label>Короткий підпис<input data-caption maxlength="45" autocomplete="off" value="${esc(caption)}" placeholder="Що вміє цей пристрій?"></label><fieldset><legend>Колір листівки</legend>${['#e2f5ff','#eef8d4','#efeaff'].map((c,i)=>`<button type="button" class="color-choice" data-color="${c}" aria-pressed="${color===c}">Колір ${i+1}</button>`).join('')}</fieldset></div></div><button class="primary-btn" type="button" data-create>Листівка готова</button>`;
      if(phase==='save') body=`${card(draft())}<p>${saved?'Роботу збережено в «Моїх роботах».':'Робота ще не збережена. Як відкрити її пізніше?'}</p><div class="stage-actions">${!saved?'<button class="primary-btn" type="button" data-save>Зберегти в «Мої роботи»</button>':''}<button class="secondary-btn" type="button" data-close>Закрити редактор</button></div>`;
      if(phase==='lost') body='<h3>Незбережена робота зникла</h3><p>Після створення збережи її, перш ніж закривати редактор.</p><button class="primary-btn" type="button" data-retry>Створити ще раз</button>';
      if(phase==='closed') body='<div class="closed-editor"><span aria-hidden="true">'+AppIcons.svg('folder')+'</span><h3>Редактор закрито</h3><p>Де знайти збережену листівку?</p><button class="primary-btn" type="button" data-gallery>Відкрити «Мої роботи»</button></div>';
      const works=saved?LessonUI.shuffle([{...saved,id:'mine'},{name:'Шкільна афіша',caption:'Наш клас',icon:'printer',color:'#efeaff',id:'other1'},{name:'План на день',caption:'Навчання й відпочинок',icon:'keyboard',color:'#eef8d4',id:'other2'}]):[];
      if(phase==='gallery')body=`<h3>Мої роботи</h3><p>Знайди листівку за своєю назвою.</p><div class="gallery-grid">${works.map(w=>`<button class="gallery-work" type="button" data-find="${w.id}">${card(w)}</button>`).join('')}</div>`;
      if(phase==='opened')body=`<h3>Твоя листівка знову відкрита!</h3>${card(saved)}<p>Назва, підпис і колір збереглися.</p>`;
      root.innerHTML=`<div class="lesson-content stage-box save-find-stage" data-component="save-find"><div class="stage-heading centered-heading"><div><span class="eyebrow">СТВОРИ → ЗБЕРЕЖИ → ВІДКРИЙ</span><div class="task-progress">${index+1} / ${rounds.length}</div><h2>${config.title||'Майстерня листівок'}</h2></div></div>${body}<p class="feedback" data-feedback role="status" aria-live="polite"></p><div class="stage-actions">${ctx.allowBack&&phase==='create'?'<button class="secondary-btn" type="button" data-back>Назад</button>':''}${phase==='opened'?'<button class="primary-btn" type="button" data-next>Далі</button>':''}</div></div>`;
      const feedback=root.querySelector('[data-feedback]');
      root.querySelector('[data-name]')?.addEventListener('input',event=>{name=event.target.value;root.querySelector('.made-card strong').textContent=name;});
      root.querySelector('[data-caption]')?.addEventListener('input',event=>{caption=event.target.value;root.querySelector('.made-card span').textContent=caption;});
      root.querySelectorAll('[data-color]').forEach(b=>b.addEventListener('click',()=>{color=b.dataset.color;render();}));
      root.querySelector('[data-create]')?.addEventListener('click',()=>{
        if(!name.trim()||!caption.trim()){feedback.textContent='Додай назву й короткий підпис.';return;}
        name=name.trim();caption=caption.trim();
        if(task.saveMode==='auto')saved={...draft()};
        phase='save';render();
        if(saved)root.querySelector('[data-feedback]').textContent='Ця майстерня зберегла роботу автоматично.';
      });
      root.querySelector('[data-save]')?.addEventListener('click',()=>{saved={...draft()};render();});
      root.querySelector('[data-close]')?.addEventListener('click',()=>{if(!saved){mistakes++;phase='lost';name='';caption='';}else phase='closed';render();});
      root.querySelector('[data-retry]')?.addEventListener('click',()=>{phase='create';render();});
      root.querySelector('[data-gallery]')?.addEventListener('click',()=>{phase='gallery';render();});
      root.querySelectorAll('[data-find]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.find!=='mine'){mistakes++;feedback.textContent='Це інша робота. Знайди свою назву.';return;}points+=mistakes===0?2:1;phase='opened';render();}));
      root.querySelector('[data-next]')?.addEventListener('click',()=>{index++;round();ctx.focusHeading?.();});
      root.querySelector('[data-back]')?.addEventListener('click',ctx.onBack);
      ctx.bindListenButtons?.(root);
    }
    render();
  }
  round();
};
