// NODE_PATH must contain Playwright. Start an HTTP server at UGS_TEST_URL first.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const base = process.env.UGS_TEST_URL || 'http://127.0.0.1:8765/ugs/';
const artifacts = process.env.UGS_TEST_OUTPUT;
(async () => {
  let browser;
  try { browser = await chromium.launch({ headless: true }); }
  catch { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    async function checkLayout() {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'Horizontal overflow');
      await page.evaluate(() => Promise.all([...document.images].map(img => img.decode().catch(() => {}))));
      const broken = await page.locator('img').evaluateAll(images => images.filter(i => !i.naturalWidth).map(i => i.src));
      assert.deepEqual(broken, [], 'Broken image URLs');
    }
    await page.goto(base);
    assert.equal(await page.locator('.skill-card').count(), 16);
    await checkLayout();
    if (artifacts) { fs.mkdirSync(artifacts, { recursive: true }); await page.screenshot({ path: path.join(artifacts, 'ugs-home-desktop.png'), fullPage: true }); }
    for (const width of [360, 390, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await checkLayout();
    }
    if (artifacts) { await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: path.join(artifacts, 'ugs-home-mobile.png'), fullPage: true }); }
    await page.setViewportSize({ width: 1280, height: 900 });
    // All direct routes must load, not only skill.html?id=N.
    for (let id = 1; id <= 16; id++) {
      await page.goto(`${base}lesson-${String(id).padStart(2, '0')}.html`);
      await page.locator('#explanation .explanation-card').first().waitFor();
      assert.equal(await page.locator('[role="tab"]').count(),5);
      await checkLayout();
    }
    await page.goto(`${base}skill.html?id=5`);
    // Exercise components with their real lesson data and a result callback.
    async function mount(id, phase, component) {
      await page.evaluate(({ id, phase, component }) => {
        const lesson = window.DeviceLessons?.[id] || window.InfoLessons?.[id] || window.OnlineLessons?.[id] || window.AlgoLessons?.[id];
        window.testResult = null;
        window.ComponentRegistry[component](document.getElementById('lessonStage'), { ...lesson[phase], assessment: phase === 'assessment' }, { onComplete: result => { window.testResult = result; }, allowBack: false });
      }, { id, phase, component });
    }
    for (const [id, component] of [[1,'quizRounds'],[2,'controlLab'],[3,'virtualKeyboard'],[4,'mediaLab'],[5,'sort'],[6,'sequence'],[7,'saveFind'],[8,'browserSim'],[9,'searchSim'],[10,'safetyScenarios'],[11,'safetyScenarios'],[12,'passwordGame'],[13,'commandLab'],[14,'routeRunner'],[15,'debugRunner'],[16,'repeatRunner']]) {
      for (const phase of ['practice', 'assessment']) {
        // Load the universal route once so every component is available.
        await mount(id, phase, component);
        for (const width of [360, 768, 1280]) { await page.setViewportSize({ width, height: 900 }); await checkLayout(); }
      }
    }
    // Sorting: wrong group gives no placement; mouse drag and keyboard placement work.
    await page.setViewportSize({ width: 1280, height: 900 });
    await mount(5, 'try', 'sort');
    await page.locator('[data-item="keyboard"]').click();
    await page.locator('[data-bin="listen"]').click();
    assert.equal(await page.locator('[data-item="keyboard"]').isDisabled(), false);
    const source = await page.locator('[data-item="keyboard"]').boundingBox();
    const target = await page.locator('[data-bin="input"]').boundingBox();
    await page.mouse.move(source.x + source.width/2, source.y + source.height/2);
    await page.mouse.down();
    await page.mouse.move(target.x + target.width/2, target.y + target.height/2, { steps: 12 });
    await page.mouse.up();
    assert.equal(await page.locator('[data-item="keyboard"]').isDisabled(), true);
    await page.locator('[data-item="mic"]').focus(); await page.keyboard.press('Enter');
    await page.locator('[data-bin="input"]').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-item="mic"]').isDisabled(), true);
    if (artifacts) await page.screenshot({path:path.join(artifacts,'ugs-sort.png'),fullPage:true});
    // Text entry: Enter inserts a newline only, preserving the text to be entered by the child.
    await page.evaluate(() => {
      window.testResult = null;
      ComponentRegistry.virtualKeyboard(document.getElementById('lessonStage'), { tasks: [{ type:'enter',start:'Я',target:'Я\nТут' }] }, { onComplete:r=>window.testResult=r });
    });
    await page.locator('[data-input]').evaluate(input => input.setSelectionRange(input.value.length,input.value.length));
    await page.locator('[data-enter]').click();
    assert.equal(await page.locator('[data-input]').inputValue(), 'Я\n');
    assert.equal(await page.locator('[data-next]').isVisible(), false);
    await page.locator('[data-input]').fill('Я\nТут');
    await page.locator('[data-check]').click(); await page.locator('[data-next]').click();
    assert.deepEqual(await page.evaluate(()=>testResult), { points:2,max:2 });
    // Search: the result cannot be skipped by selecting only the query.
    await mount(9,'try','searchSim');
    await page.getByRole('button',{name:'лев фото',exact:true}).click();
    assert.equal(await page.evaluate(()=>testResult), null);
    await page.getByRole('button',{name:/Лев і мишка/}).click();
    assert.equal(await page.locator('[data-continue]').count(),0);
    await page.getByRole('button',{name:/Лев у савані/}).click();
    await page.locator('[data-continue]').click();
    assert.deepEqual(await page.evaluate(()=>testResult), {points:1,max:2});
    // Save/reopen: unsaved work is lost; saved work retains the child's title and caption.
    await mount(7,'try','saveFind');
    await page.locator('[data-name]').fill('Мій планшет');
    await page.locator('[data-caption]').fill('Для уроків');
    await page.locator('[data-create]').click(); await page.locator('[data-close]').click();
    await page.getByRole('heading',{name:'Незбережена робота зникла'}).waitFor();
    await page.locator('[data-retry]').click();
    await page.locator('[data-name]').fill('Мій планшет'); await page.locator('[data-caption]').fill('Для уроків');
    await page.locator('[data-create]').click(); await page.locator('[data-save]').click(); await page.locator('[data-close]').click(); await page.locator('[data-gallery]').click(); await page.locator('[data-find="mine"]').click();
    assert.equal(await page.locator('.made-card strong').textContent(),'Мій планшет');
    assert.equal(await page.locator('.made-card > span').textContent(),'Для уроків');
    await page.locator('[data-next]').click();
    assert.deepEqual(await page.evaluate(()=>testResult),{points:1,max:2});
    // Password assessment never shows strength labels before an answer.
    await mount(12,'assessment','passwordGame');
    assert.equal(await page.locator('.password-meter').count(),0);
    // Browser rounds reset their counters; wrong destination plus Back does not satisfy the task.
    await mount(8,'practice','browserSim');
    await page.locator('[data-link="ocean"]').click(); await page.locator('[data-back]').click();
    assert.equal(await page.locator('[data-continue]').count(),0);
    await mount(8,'practice','browserSim');
    await page.locator('[data-link="dino"]').click(); await page.locator('[data-back]').click(); await page.locator('[data-continue]').click();
    await page.locator('[data-link="planets"]').click(); await page.locator('[data-link="mars"]').click(); await page.locator('[data-continue]').click();
    assert.deepEqual(await page.evaluate(()=>testResult),{points:4,max:4});
    // YouTube is opt-in and accepts only supported HTTPS hosts and valid video IDs.
    await page.evaluate(() => ComponentRegistry.storyboard(document.getElementById('lessonStage'), {title:'Відеоурок',frames:[{title:'Пояснення'}],media:{youtube:'https://youtu.be/abcdefghijk',title:'Перевірка відео'}}, {}));
    assert.equal(await page.locator('iframe').count(),0);
    await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({status:200,body:'<p>Test player</p>'}));
    await page.locator('[data-open-video]').click();
    assert.equal(await page.locator('iframe').getAttribute('src'),'https://www.youtube-nocookie.com/embed/abcdefghijk');
    assert.deepEqual(await page.evaluate(()=>[LessonUI.youtubeId('javascript:alert(1)'),LessonUI.youtubeId('https://evil.test/watch?v=abcdefghijk')]),[null,null]);
    assert.deepEqual(await page.evaluate(()=>[LessonUI.status(3,4),LessonUI.status(2,4),LessonUI.status(4,4)]),['almost','training','mastered']);
    assert.deepEqual(errors,[],'Browser exceptions');
    await context.close();
    const touchContext = await browser.newContext({viewport:{width:768,height:1024},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
    const touchPage = await touchContext.newPage();
    await touchPage.goto(`${base}skill.html?id=5`);
    await touchPage.evaluate(()=>ComponentRegistry.sort(document.getElementById('lessonStage'),InfoLessons[5].try,{}));
    await touchPage.locator('[data-item="mic"]').scrollIntoViewIfNeeded();
    const touchSource = await touchPage.locator('[data-item="mic"]').boundingBox();
    await touchPage.evaluate(y=>scrollBy(0,y-180),touchSource.y);
    const from = await touchPage.locator('[data-item="mic"]').boundingBox();
    const to = await touchPage.locator('[data-bin="input"]').boundingBox();
    const cdp=await touchContext.newCDPSession(touchPage);
    const start={x:from.x+from.width/2,y:from.y+from.height/2};
    const end={x:to.x+to.width/2,y:to.y+to.height/2};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});
    for(let n=1;n<=8;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*n/8,y:start.y+(end.y-start.y)*n/8,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await touchPage.locator('[data-item="mic"]').isDisabled(),true,'Touch drag');
    await touchContext.close();
    // Real service worker: precache, preserve a different application's cache, query routes offline.
    const offlineContext = await browser.newContext({serviceWorkers:'allow'});
    const offlinePage = await offlineContext.newPage();
    await offlinePage.goto(`${base}skill.html?id=1`);
    await offlinePage.evaluate(async()=>{
      await caches.open('another-course-test');
      await caches.open('digital-superpowers-shell-old-test');
      await navigator.serviceWorker.register('./sw.js');
      await navigator.serviceWorker.ready;
    });
    await offlinePage.reload();
    const cacheNames = await offlinePage.evaluate(()=>caches.keys());
    assert.ok(cacheNames.includes('another-course-test'));
    assert.ok(!cacheNames.includes('digital-superpowers-shell-old-test'));
    await offlineContext.setOffline(true);
    await offlinePage.goto(`${base}skill.html?id=5`);
    await offlinePage.locator('#explanation .explanation-card').first().waitFor();
    await offlinePage.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
    assert.equal(await offlinePage.locator('#skillTitle').textContent(),'Я сортую');
    await offlineContext.close();
    console.log('PASS: 16 direct routes; 32 practice/assessment screens at 3 widths; home at 5 widths; drag, keyboard, search, save/reopen, browser counters, password assessment, video and scoring.');
    console.log('PASS: service worker precache, isolated cache cleanup and offline query route with images.');
    console.log('PASS: touch drag on a tablet viewport.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});

