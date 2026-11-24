'use strict';
// Перетягування за маркер працює однаково для миші, пера й сенсорного екрана.
globalThis.ResourceOrder=(()=>{
 const active=new Set();
 function move(values,id,to){const next=values.slice(),from=next.indexOf(id);if(from<0)return next;next.splice(from,1);next.splice(Math.max(0,Math.min(to,next.length)),0,id);return next;}
 const correct=(values,steps)=>values.every((id,i)=>steps?steps[id]===steps[i]:id===i);
 function mount(host,initial,{locked,onCheck,onReset,steps}){
  let values=initial.slice(),dragging=null,pointerId=null,frame=null,lastY=0,lastX=0;
  const list=host.querySelector('[data-order-list]'),rows=new Map([...host.querySelectorAll('[data-row]')].map(r=>[+r.dataset.row,r]));
  const handles=[...host.querySelectorAll('[data-handle]')],up=[...host.querySelectorAll('[data-up]')],down=[...host.querySelectorAll('[data-down]')],ranks=[...host.querySelectorAll('[data-rank]')];
  const check=host.querySelector('[data-check]'),reset=host.querySelector('[data-reset]'),announcement=host.querySelector('[data-order-status]');
  function sync(){list.append(...values.map(id=>rows.get(id)));for(const b of up)b.disabled=locked()||values.indexOf(+b.dataset.up)===0;for(const b of down)b.disabled=locked()||values.indexOf(+b.dataset.down)===values.length-1;for(const r of ranks)r.textContent=String(values.indexOf(+r.dataset.rank)+1);for(const row of rows.values()){row.classList.remove('position-correct');row.classList.remove('position-incorrect');}check.disabled=locked();}
  function change(id,to,keyboard=false){if(locked())return;values=move(values,id,to);sync();announcement.textContent=`Картку переміщено на позицію ${values.indexOf(id)+1} з ${values.length}.`;if(keyboard)handles.find(h=>+h.dataset.handle===id)?.focus?.({preventScroll:true});}
  for(const b of up)b.onclick=()=>change(+b.dataset.up,values.indexOf(+b.dataset.up)-1,true);
  for(const b of down)b.onclick=()=>change(+b.dataset.down,values.indexOf(+b.dataset.down)+1,true);
  function stop(){if(frame!==null)cancelAnimationFrame(frame);frame=null;if(dragging!==null)rows.get(dragging).classList.remove('dragging');dragging=null;pointerId=null;active.delete(stop);}
  function placeAtPointer(){if(dragging===null)return;const target=document.elementFromPoint(lastX,lastY)?.closest('[data-row]');if(!target||target.parentElement!==list)return;const id=+target.dataset.row;if(id===dragging)return;const rect=target.getBoundingClientRect(),from=values.indexOf(dragging),to=values.indexOf(id);if(from<to&&lastY>rect.top+rect.height/2||from>to&&lastY<rect.top+rect.height/2)change(dragging,to);}
  function autoscroll(){if(dragging===null)return;const edge=70,delta=lastY<edge?-12:lastY>window.innerHeight-edge?12:0;if(delta){window.scrollBy(0,delta);placeAtPointer();}frame=requestAnimationFrame(autoscroll);}
  for(const handle of handles){handle.onkeydown=e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();const id=+handle.dataset.handle;change(id,values.indexOf(id)+(e.key==='ArrowUp'?-1:1),true);}};handle.onpointerdown=e=>{if(locked()||e.button!==0)return;e.preventDefault();stop();dragging=+handle.dataset.handle;pointerId=e.pointerId;lastY=e.clientY;lastX=e.clientX;rows.get(dragging).classList.add('dragging');active.add(stop);list.setPointerCapture?.(pointerId);frame=requestAnimationFrame(autoscroll);};}
  list.onpointermove=e=>{if(dragging===null||e.pointerId!==pointerId)return;lastX=e.clientX;lastY=e.clientY;placeAtPointer();};list.onpointerup=list.onpointercancel=list.onlostpointercapture=()=>stop();
  check.onclick=()=>{if(locked())return;const ok=correct(values,steps);if(!ok)values.forEach((id,i)=>rows.get(id).classList.add((steps?steps[id]===steps[i]:id===i)?'position-correct':'position-incorrect'));onCheck(ok);};
  reset.onclick=()=>{if(locked())return;stop();values=initial.slice();sync();onReset?.();announcement.textContent='Повернуто початковий порядок карток.';};sync();
  return {move:(id,to)=>change(id,to),values:()=>values.slice(),stop};
 }
 return {move,correct,mount,stopAll:()=>[...active].forEach(stop=>stop())};
})();
