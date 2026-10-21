window.ComponentRegistry = window.ComponentRegistry || {};
window.WordSearch = {
  build(words, random = Math.random) {
    if (!words.length || words.length > 6 || words.some(w => !/^[А-ЯІЇЄҐ]{2,6}$/.test(w)) || new Set(words).size !== words.length) throw Error('Invalid word-search vocabulary');
    const alphabet = 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ';
    const grid = Array.from({length:36}, () => alphabet[Math.floor(random()*alphabet.length)]);
    const lanes = [0,1,2,3,4,5];
    for (let i=5;i>0;i--) { const j=Math.floor(random()*(i+1)); [lanes[i],lanes[j]]=[lanes[j],lanes[i]]; }
    const vertical = random() > .5;
    const targets = words.map((word,i) => {
      const start = Math.floor(random()*(7-word.length));
      const cells = [...word].map((letter,j) => {
        const index = vertical ? (start+j)*6+lanes[i] : lanes[i]*6+start+j;
        grid[index] = letter; return index;
      });
      return {word,cells};
    });
    return {grid,targets};
  }
};
window.ComponentRegistry.wordSearch = function(root, config, ctx = {}) {
  const {grid, targets} = WordSearch.build(config.words);
  const found = new Set(); let start = null, suppressClick = false;
  root.innerHTML = `<div class="stage-box" data-component="word-search"><h2>Знайди слова з уроку</h2><p>Натисни першу й останню букви слова або проведи між ними пальцем. Слова йдуть праворуч або вниз.</p><ul class="word-targets">${targets.map((t,i)=>`<li data-word="${i}">${t.word}</li>`).join('')}</ul><div class="word-board" role="group" aria-label="Поле букв, шість рядків і шість стовпців">${grid.map((letter,i)=>`<button type="button" data-cell="${i}" aria-label="${letter}, рядок ${Math.floor(i/6)+1}, стовпець ${i%6+1}" aria-pressed="false" tabindex="${i===0?0:-1}">${letter}</button>`).join('')}</div><p class="micro-hint">Клавіатура: стрілки — рух, Enter — обрати букву, Escape — скасувати вибір.</p><p data-feedback role="status">Знайдено 0 із ${targets.length}. Потім поясни значення одного зі слів.</p></div>`;
  const buttons = [...root.querySelectorAll('[data-cell]')], feedback = root.querySelector('[data-feedback]');
  function paint() {
    const used = new Set(targets.filter((_,i)=>found.has(i)).flatMap(t=>t.cells));
    buttons.forEach((b,i)=>{b.classList.toggle('word-found',used.has(i));b.setAttribute('aria-pressed',String(start===i));});
  }
  function select(index) {
    if (start === null) {start=index;paint();feedback.textContent='Тепер обери останню букву слова.';return;}
    const match = targets.findIndex(t => (t.cells[0]===start && t.cells.at(-1)===index) || (t.cells.at(-1)===start && t.cells[0]===index));
    start=null;
    if (match<0) feedback.textContent='Такого слова у списку немає. Спробуй інші дві букви.';
    else if (found.has(match)) feedback.textContent='Це слово вже знайдено. Пошукай інше.';
    else {found.add(match);root.querySelector(`[data-word="${match}"]`).classList.add('word-found'); feedback.textContent=`Знайдено ${found.size} із ${targets.length}. ${found.size===targets.length?'Усі слова знайдено! Поясни значення одного зі слів.':'Шукай далі.'}`;if(found.size===targets.length)ctx.onComplete?.({points:found.size,max:targets.length});}
    paint();
  }
  buttons.forEach((b,i)=>{
    let pointerStart = null;
    b.addEventListener('click',event=>{if(event.detail===0){select(i);return;}if(suppressClick){suppressClick=false;return;}select(i);});
    b.addEventListener('pointerdown',event=>{if(event.button!==0)return;suppressClick=false;pointerStart=[event.clientX,event.clientY];b.setPointerCapture(event.pointerId);});
    b.addEventListener('pointercancel',()=>{pointerStart=null;});
    b.addEventListener('pointerup',event=>{if(event.button!==0||!pointerStart)return;const moved=Math.hypot(event.clientX-pointerStart[0],event.clientY-pointerStart[1])>8;pointerStart=null;const end=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-cell]');if(!end||!root.contains(end))return;const last=Number(end.dataset.cell);if(moved&&last!==i){start=i;select(last);suppressClick=true;}else if(!moved&&last===i){select(i);suppressClick=true;}});
    b.addEventListener('keydown',event=>{
      if(event.key==='Escape'){start=null;paint();feedback.textContent='Вибір скасовано.';return;}
      const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:6,ArrowUp:-6}[event.key];if(!delta)return;
      event.preventDefault();const next=Math.max(0,Math.min(35,i+delta));buttons.forEach(x=>x.tabIndex=-1);buttons[next].tabIndex=0;buttons[next].focus();
    });
  });
};
