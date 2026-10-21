// End-to-end submission of all 18 independent checks through actual controls.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.UGS_TEST_URL || 'http://127.0.0.1:8765/ugs/';
function pathTo(t){const dirs={up:[-1,0],right:[0,1],down:[1,0],left:[0,-1]},queue=[[t.start,[]]],seen=new Set();while(queue.length){const [pos,steps]=queue.shift(),key=pos.join();if(seen.has(key))continue;seen.add(key);if(pos.join()===t.goal.join())return steps;for(const [cmd,[dr,dc]]of Object.entries(dirs)){const next=[pos[0]+dr,pos[1]+dc];if(next.every(v=>v>=0 && v<t.size) && !(t.obstacles || []).some(o=>o.join()===next.join()))queue.push([next,[...steps,cmd]]);}}throw Error('Unreachable test board');}
(async()=>{let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({channel:'msedge',headless:true});}try{
 const page=await browser.newPage({serviceWorkers:'block',reducedMotion:'reduce',viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);const skills=await page.evaluate(()=>AppData.skills);
 for(const skill of skills){
  await page.goto(base+'skill.html?skill='+skill.skillKey);const tasks=await page.evaluate(key=>CourseLessons[key].assessment.tasks,skill.skillKey);await page.locator('[data-start-check]').click();const root=page.locator('[data-assessment-root]');
  for(const t of tasks){
   switch(t.type){
    case 'choice':await root.locator('[data-answer="'+t.answerId+'"]').click();break;
    case 'pairs':for(const i of t.items){await root.locator('[data-source="'+i.id+'"]').click();await root.locator('[data-target="'+i.target+'"]').click();}break;
    case 'pixels':for(let i=0;i<t.code.length;i++){await root.locator('[data-paint="'+t.code[i]+'"]').click();await root.locator('[data-cell="'+i+'"]').click();}break;
    case 'plan':for(const i of t.items){await root.locator('[data-object="'+i.id+'"]').click();await root.locator('[data-position="'+i.position+'"]').click();}break;
    case 'typing':if(t.operation==='backspace'){await root.locator('[data-text]').focus();await root.locator('[data-text]').press('End');await root.locator('[data-text]').press('Backspace');}else if(t.operation==='enter'){await root.locator('[data-enter]').click();await root.locator('[data-text]').fill(t.target);}else await root.locator('[data-text]').fill(t.target);break;
    case 'control':if(t.action==='tap')await root.locator('[data-shape="Квадрат"]').click();if(t.action==='move'){await root.locator('[data-cube]').click();await root.locator('[data-box]').click();}if(t.action==='scroll')await root.locator('[data-scroll-item="4"]').click();break;
    case 'editor':await root.locator('[data-background=blue]').click();await root.locator('[data-sticker=star]').click();await root.locator('[data-preset]').click();if(t.removeExtra)await root.locator('[data-remove]').click();if(t.save){await root.locator('[data-save]').click();await root.locator('[data-close]').click();await root.locator('[data-gallery]').click();await root.locator('[data-work=mine]').click();}break;
    case 'browser':for(const dest of t.visit){const next=root.locator('[data-page="'+dest+'"]');if(await next.count())await next.click();else await root.locator('[data-browser-back]').click();}break;
    case 'route':{const program=pathTo(t);if(t.debug){await root.locator('[data-execute]').click();if(!t.correctInitially){assert.equal(program.length,t.program.length);for(let i=0;i<program.length;i++){await root.locator('[data-program-index="'+i+'"]').click();await root.locator('[data-command="'+program[i]+'"]').click();}await root.locator('[data-execute]').click();}else await root.locator('[data-keep]').click();}else{for(const cmd of program)await root.locator('[data-command="'+cmd+'"]').click();await root.locator('[data-execute]').click();}break;}
    case 'repeat':await root.locator('[data-command="'+t.direction+'"]').click();await root.locator('[data-times]').selectOption(String(t.count));await root.locator('[data-execute]').click();break;
    default:throw Error('Untested task '+t.type);
   }
   await root.locator('[data-submit]').click();
  }
  assert.equal(await root.locator('h3').textContent(),'Вмію!',skill.skillKey);assert.equal(await page.evaluate(key=>ProgressStore.get(key),skill.skillKey),'mastered');console.log('PASS assessment:',skill.skillKey);
 }
 assert.deepEqual(errors,[]);console.log('PASS: every independent assessment completed with four verified outcomes.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
