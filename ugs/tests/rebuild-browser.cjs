// Browser regression checks for the 18-skill course and the independent assessment flow.
const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const base=process.env.UGS_TEST_URL || 'http://127.0.0.1:8765/ugs/';const out=process.env.UGS_TEST_OUTPUT;
(async()=>{
  let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({channel:'msedge',headless:true});}
  try{
    const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    async function layout(){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'Overflow '+page.url());await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));assert.deepEqual(await page.locator('img').evaluateAll(images=>images.filter(i=>!i.naturalWidth).map(i=>i.src)),[]);}
    await page.goto(base);assert.equal(await page.locator('.skill-card').count(),18);assert.equal(await page.locator('.category-card').count(),5);
    const skills=await page.evaluate(()=>AppData.skills);
    for(const width of [320,375,390,768,1024,1440]){await page.setViewportSize({width,height:900});await layout();}
    if(out){fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'home-18.png'),fullPage:true});}
    for(const skill of skills){
      await page.goto(base+'skill.html?skill='+skill.skillKey);await page.locator('#remember .remember-card').first().waitFor();assert.equal(await page.locator('h1').textContent(),skill.title);assert.equal(await page.locator('[role=tab]').count()>=2,true);
      for(const tab of await page.locator('[role=tab]').all()){await tab.click();assert.equal(await page.locator('[role=tabpanel]:visible').count(),1);for(const width of [320,768,1440]){await page.setViewportSize({width,height:900});await layout();}}
      await page.locator('[data-start-check]').click();await layout();
    }
    for(let id=1;id<=18;id++){await page.goto(base+'lesson-'+String(id).padStart(2,'0')+'.html');await page.locator('#remember').waitFor();assert.ok(page.url().includes('?skill='));}
    await page.goto(base+'skill.html?id=7');assert.ok(page.url().includes('skill=save-find'));await page.goto(base+'skill.html?order=7');assert.ok(page.url().includes('skill=coding-symbols'));
    await page.goto(base+'skill.html?skill=device-choice');await page.locator('[data-start-check]').click();
    // A wrong first answer must be accepted without showing correctness or enabling retries.
    await page.locator('[data-assessment-root] [data-answer=o1]').click();await page.locator('[data-assessment-root] [data-submit]').click();assert.match(await page.locator('[data-assessment-root] h3').textContent(),/мультфільм/);assert.equal(await page.locator('[data-assessment-root] .correct,[data-assessment-root] .wrong').count(),0);
    for(let i=0;i<3;i++){await page.locator('[data-assessment-root] [data-answer=o0]').click();await page.locator('[data-assessment-root] [data-submit]').click();}
    assert.equal(await page.locator('[data-assessment-root] h3').textContent(),'Майже!');assert.equal(await page.evaluate(()=>ProgressStore.get('device-choice')),'almost');
    await page.locator('[data-check-again]').click();for(let i=0;i<4;i++){await page.locator('[data-assessment-root] [data-answer=o0]').click();await page.locator('[data-assessment-root] [data-submit]').click();}assert.equal(await page.evaluate(()=>ProgressStore.get('device-choice')),'mastered');
    await page.locator('[data-check-again]').click();for(let i=0;i<4;i++){await page.locator('[data-assessment-root] [data-answer=o1]').click();await page.locator('[data-assessment-root] [data-submit]').click();}assert.equal(await page.evaluate(()=>ProgressStore.get('device-choice')),'mastered');
    await page.goto(base+'skill.html?skill=create-product');
    const studio=page.locator('[data-create-root]');await studio.locator('[data-background=blue]').click();await studio.locator('[data-sticker=star]').click();await studio.locator('[data-preset]').click();await studio.locator('[data-save-studio]').click();await page.reload();assert.match(await page.locator('[data-create-root] .made-card').textContent(),/ВІТАЮ/);
    await page.goto(base+'skill.html?skill=save-find');await page.locator('[data-tab=shared]').click();assert.match(await page.locator('#panel-shared .made-card').textContent(),/ВІТАЮ/);
    await page.goto(base+'skill.html?skill=models-schemes');const first=page.locator('[role=tab]').first();await first.focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[role=tab][aria-selected=true]').evaluate(el=>document.activeElement===el),true);
    await page.goto(base+'skill.html?skill=info-types');await page.locator('[data-start-check]').click();await page.locator('[data-assessment-root] [data-answer=o0]').click();await page.locator('[data-assessment-root] [data-submit]').click();await page.locator('[data-assessment-root] [data-answer=o2]').click();await page.locator('[data-assessment-root] [data-submit]').click();await page.locator('[data-assessment-root] [data-answer=o1]').click();await page.locator('[data-assessment-root] [data-submit]').click();const video=page.locator('[data-assessment-root] video');await video.evaluate(v=>v.play());await page.waitForTimeout(250);assert.equal(await video.evaluate(v=>v.currentTime>0),true);
    if(out)await page.screenshot({path:path.join(out,'lesson-04.png'),fullPage:true});
    const offline=await browser.newContext({serviceWorkers:'allow'}),op=await offline.newPage();await op.goto(base);await op.evaluate(()=>navigator.serviceWorker.ready);await op.reload();await offline.setOffline(true);for(const key of ['models-schemes','coding-symbols','create-product','algorithm-repeat']){await op.goto(base+'skill.html?skill='+key);await op.locator('#remember').waitFor();assert.equal(await op.locator('h1').textContent(),skills.find(s=>s.skillKey===key).title);}await offline.close();
    const blocked=await browser.newContext({serviceWorkers:'block'});await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('blocked');}}));const bp=await blocked.newPage();bp.on('pageerror',e=>errors.push(e.message));await bp.goto(base+'skill.html?skill=create-product');const bs=bp.locator('[data-create-root]');await bs.locator('[data-sticker=star]').click();await bs.locator('[data-preset]').click();await bs.locator('[data-save-studio]').click();assert.equal(await bp.evaluate(()=>ProgressStore.getWork('postcard').caption),'ВІТАЮ');await bp.goto(base+'adults.html');assert.match(await bp.locator('#storageStatus').textContent(),/заборонив/);await blocked.close();
    assert.deepEqual(errors,[]);console.log('PASS: 18 lessons and routes, every practice tab at 320/768/1440px, delayed feedback, best status, shared editor, keyboard tabs and local video playback.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
