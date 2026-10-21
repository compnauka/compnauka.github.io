const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const base=process.env.UGS_TEST_URL||'http://127.0.0.1:8765/ugs/';
(async()=>{
 let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({channel:'msedge',headless:true});}
 try{
  const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce',viewport:{width:320,height:740},hasTouch:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  async function layout(label){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow: '+label);}
  for(let id=1;id<=16;id++){
   await page.goto(base+'skill.html?id='+id);
   assert.equal(await page.locator('.document-section').count(),5);
   assert.equal(await page.locator('[role=tab]').count(),5);
   assert.ok(await page.locator('.explanation-card').count()>=2);
   assert.equal(await page.locator('[data-story-next]').count(),0);
   assert.equal(await page.locator('iframe').count(),0);
   for(const width of [320,768,1280]){
    await page.setViewportSize({width,height:900});
    for(const tab of ['try','train','sort','words','draw']){
     await page.locator(`[data-tab="${tab}"]`).click();
     await layout(`lesson ${id}, ${width}, ${tab}`);
     assert.equal(await page.locator('[role=tabpanel]:visible').count(),1);
    }
   }
   await page.locator('[data-start-check]').click();await layout('check '+id);
   const duplicateIds=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return ids.filter((v,i)=>ids.indexOf(v)!==i);});
   assert.deepEqual(duplicateIds,[],'Duplicate IDs lesson '+id);
   await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode().catch(()=>{}))));
   assert.deepEqual(await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.naturalWidth).map(i=>i.src)),[]);
  }
  await page.goto(base+'skill.html?id=3');
  await page.locator('#panel-try [data-input]').fill('Мій текст');
  await page.locator('[data-tab=words]').click();await page.locator('[data-tab=try]').click();
  assert.equal(await page.locator('#panel-try [data-input]').inputValue(),'Мій текст');
  // Solve an actual generated word search with its first/last cells, then preserve it across tabs.
  await page.locator('[data-tab=words]').click();
  const solutions=await page.evaluate(()=>{
   const letters=[...document.querySelectorAll('[data-cell]')].map(b=>b.textContent);
   return PracticeBank[3].words.map(word=>{for(let i=0;i<36;i++)for(const d of [1,6]){const end=i+(word.length-1)*d;if(end>=36||(d===1&&Math.floor(i/6)!==Math.floor(end/6)))continue;if([...word].every((c,j)=>letters[i+j*d]===c))return [i,end];}throw Error('Unplaced word '+word);});
  });
  for(const [first,last]of solutions){await page.locator(`[data-cell="${first}"]`).click();await page.locator(`[data-cell="${last}"]`).click();}
  assert.equal(await page.locator('[data-word].word-found').count(),4);
  await page.locator('[data-tab=draw]').click();
  await page.locator('[data-draw-done]').click();assert.match(await page.locator('#panel-draw [data-feedback]').textContent(),/Намалюй/);
  await page.locator('#panel-draw textarea').fill('Я створюю листівку');
  const canvas=page.locator('canvas');await canvas.evaluate(c=>c.scrollIntoView({block:'center',behavior:'instant'}));
  const box=await canvas.boundingBox();
  await page.mouse.move(box.x+30,box.y+30);await page.mouse.down();await page.mouse.move(box.x+100,box.y+80,{steps:6});await page.mouse.up();
  const hasInk=()=>page.evaluate(()=>{const c=document.querySelector('canvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=0;i<d.length;i+=4)if(d[i]<240)return true;return false;});
  assert.equal(await hasInk(),true);
  await page.locator('[data-tab=words]').click();assert.equal(await page.locator('[data-word].word-found').count(),4);
  await page.locator('[data-tab=draw]').click();assert.equal(await hasInk(),true);
  assert.equal(await page.locator('#panel-draw textarea').inputValue(),'Я створюю листівку');
  await page.locator('[data-undo]').click();assert.equal(await hasInk(),false);
  await page.locator('[data-draw-done]').click();assert.match(await page.locator('#panel-draw [data-feedback]').textContent(),/готова/);
  const downloadPromise=page.waitForEvent('download');await page.locator('[data-export]').click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'mii-maliunok.png');
  // Sorting persists independently of the existing trainers and final check.
  await page.locator('[data-tab=sort]').click();
  await page.locator('#panel-sort [data-item="0-0"]').click();await page.locator('#panel-sort [data-bin=a]').click();
  await page.locator('[data-tab=train]').click();await page.locator('[data-tab=sort]').click();assert.equal(await page.locator('#panel-sort [data-item="0-0"]').isDisabled(),true);
  // Keyboard tabs, then a complete assessment leaves the explanation and practice available.
  await page.locator('[data-tab=sort]').focus();await page.keyboard.press('End');assert.equal(await page.locator('[data-tab=draw]').getAttribute('aria-selected'),'true');
  await page.goto(base+'skill.html?id=1');await page.locator('[data-start-check]').click();
  const answers=await page.evaluate(()=>DeviceLessons[1].assessment.rounds.map(r=>r.options.find(o=>o.correct).label));
  for(const label of answers){await page.locator('[data-assessment-root]').getByRole('button',{name:label,exact:true}).click();await page.locator('[data-assessment-root] [data-next]').click();}
  assert.equal(await page.evaluate(()=>ProgressStore.get(1)),'mastered');assert.ok(await page.locator('.explanation-card').count()>0);assert.equal(await page.locator('[role=tab]').count(),5);
  // New document video: no iframe before opt-in; clicking keeps the rest of the lesson.
  await page.route('**/js/lesson-media.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nLessonMedia[1].youtube="https://youtu.be/abcdefghijk";'});});
  await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({contentType:'text/html',body:'Video test'}));
  await page.goto(base+'skill.html?id=1');assert.equal(await page.locator('iframe').count(),0);
  await page.locator('[data-open-video]').click();assert.equal(await page.locator('iframe').count(),1);assert.equal(await page.locator('[role=tab]').count(),5);
  await page.unroute('**/js/lesson-media.js');
  // Actual touch strokes and touch selection, rather than only synthetic component callbacks.
  await page.setViewportSize({width:390,height:844});await page.goto(base+'skill.html?id=1');await page.locator('[data-tab=draw]').click();
  await page.locator('canvas').evaluate(c=>c.scrollIntoView({block:'center',behavior:'instant'}));
  const touchBox=await page.locator('canvas').boundingBox(),cdp=await context.newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touchBox.x+30,y:touchBox.y+30,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touchBox.x+100,y:touchBox.y+80,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await hasInk(),true);
  await page.locator('[data-tab=words]').click();
  const touchWord=await page.evaluate(()=>{const b=[...document.querySelectorAll('[data-cell]')],w=PracticeBank[1].words[0];for(let i=0;i<36;i++)for(const d of [1,6]){const end=i+(w.length-1)*d;if(end>=36||(d===1&&Math.floor(i/6)!==Math.floor(end/6)))continue;if([...w].every((c,j)=>b[i+j*d].textContent===c))return [i,end];}});
  await page.locator(`[data-cell="${touchWord[0]}"]`).tap();await page.locator(`[data-cell="${touchWord[1]}"]`).tap();assert.equal(await page.locator('[data-word].word-found').count(),1);
  if(process.env.UGS_TEST_OUTPUT){for(const width of [360,1280]){await page.setViewportSize({width,height:900});await page.goto(base+'skill.html?id=1');await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:path.join(process.env.UGS_TEST_OUTPUT,`lesson-document-${width}.png`),fullPage:true});}}
  assert.deepEqual(errors,[]);await context.close();console.log('PASS: 16 single-page lessons × 5 tabs × 3 widths; no duplicate IDs or broken images; persistent tab state; word search solved; drawing/undo/export; keyboard tabs; final check retains whole lesson.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

