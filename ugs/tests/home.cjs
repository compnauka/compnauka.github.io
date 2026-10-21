const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const base=process.env.UGS_TEST_URL||'http://127.0.0.1:8765/ugs/';
const output=process.env.UGS_TEST_OUTPUT;
(async()=>{
  let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({channel:'msedge',headless:true});}
  try{
    const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce'});
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    for(const [width,height] of [[320,640],[360,640],[390,844],[768,1024],[1280,900]]){
      await page.setViewportSize({width,height});await page.goto(base);
      assert.match(await page.locator('h1').textContent(),/користуватися комп’ютером та інтернетом/);
      assert.match(await page.locator('.welcome-kicker').first().textContent(),/7–10/);
      assert.equal(await page.locator('#progress').isVisible(),false,'Empty progress must not dominate a first visit');
      assert.equal(await page.locator('#skills').evaluate(e=>e.open),false,'Catalog must start collapsed');
      assert.equal(await page.locator('.skill-card').count(),18);
      assert.equal(await page.locator('#continueLink').getAttribute('href'),'skill.html?skill=device-choice');
      const action=await page.locator('#continueLink').boundingBox(),nav=await page.locator('.bottom-nav').boundingBox();
      assert.ok(action.y+action.height<=nav.y,`Start action below the first screen at ${width}`);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
      await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode().catch(()=>{}))));
      assert.deepEqual(await page.locator('img').evaluateAll(images=>images.filter(image=>!image.naturalWidth).map(image=>image.src)),[],'Broken illustration');
      if(output&&[360,1280].includes(width))await page.screenshot({path:path.join(output,`home-purpose-${width}.png`),fullPage:true});
      for(const [theme,count]of [['devices',3],['info',5],['create',2],['online',5],['algo',3]]){
        await page.locator(`[data-category="${theme}"].category-card`).click();
        assert.equal(await page.locator('#skills').evaluate(e=>e.open),true);
        assert.equal(await page.locator('.skill-card').count(),count);
        assert.equal(await page.locator(`[data-category="${theme}"].category-card`).getAttribute('aria-pressed'),'true');
      }
      await page.locator('#filterReset').click();assert.equal(await page.locator('.skill-card').count(),18);
    }
    // The recommendation must explain that a returning learner reopens a lesson, not a saved step.
    await page.evaluate(()=>ProgressStore.set('online-search','training'));await page.reload();
    assert.equal(await page.locator('#continueLink').getAttribute('href'),'skill.html?skill=online-search');
    assert.match(await page.locator('#continueLink').textContent(),/Повернутися до уроку/);
    assert.equal(await page.locator('#progress').isVisible(),true);
    await page.evaluate(()=>{ProgressStore.reset();ProgressStore.set('device-choice','mastered');});await page.reload();
    assert.equal(await page.locator('#continueLink').getAttribute('href'),'skill.html?skill=device-control');
    await page.evaluate(()=>AppData.skills.forEach(s=>ProgressStore.set(s.skillKey,'mastered')));await page.reload();
    await page.locator('#continueLink').click();assert.equal(await page.locator('#skills').evaluate(e=>e.open),true);
    await page.evaluate(()=>{ProgressStore.reset();dispatchEvent(new Event('ugs-progress-reset'));});
    assert.equal(await page.locator('#progress').isVisible(),false);
    assert.equal(await page.locator('#continueLink').getAttribute('href'),'skill.html?skill=device-choice');
    await page.goto(base+'#skills');assert.equal(await page.locator('#skills').evaluate(e=>e.open),true);
    await page.goto(base);await page.locator('#skills > summary').focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#skills').evaluate(e=>e.open),true);
    assert.deepEqual(errors,[]);
    await context.close();console.log('PASS: first-visit purpose and start action at 5 widths; collapsed catalog; all topic filters; returning/finished/reset states; keyboard and direct catalog links.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
