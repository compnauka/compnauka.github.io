// Test course identities, migration safety and assessment contracts without a browser.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function env(initial={},fail=false){const values={...initial};const context={window:{},URLSearchParams,localStorage:{getItem:k=>values[k] ?? null,setItem(k,v){if(fail)throw Error('quota');values[k]=v;},removeItem:k=>delete values[k]}};vm.createContext(context);for(const p of ['js/data.js','js/storage.js'])vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),context);return {context,w:context.window,values};}
const old='digital-minimum-progress-v2',key='digital-superpowers-progress-v3';
const {w,context}=env();
assert.equal(w.AppData.categories.length,5);assert.equal(w.AppData.skills.length,18);assert.equal(new Set(w.AppData.skills.map(s=>s.skillKey)).size,18);
assert.deepEqual(Array.from(w.AppData.categories,c=>c.count),[3,5,2,5,3]);
for(const [id,skillKey] of Object.entries(w.AppData.legacyKeys))assert.equal(w.AppData.resolve(new URLSearchParams('id='+id)).skillKey,skillKey);
assert.equal(w.AppData.resolve(new URLSearchParams('id=7')).skillKey,'save-find');assert.equal(w.AppData.resolve(new URLSearchParams('order=7')).skillKey,'coding-symbols');assert.equal(w.AppData.resolve(new URLSearchParams('skill=bad')),null);
const oldData=JSON.stringify({1:'mastered',7:'almost',13:'mastered',14:'mastered'}),m=env({[old]:oldData});
assert.equal(m.values[old],oldData);assert.equal(m.w.ProgressStore.get('device-choice'),'training');assert.equal(m.w.ProgressStore.get('coding-symbols'),'new');assert.equal(m.w.ProgressStore.get('commands-route'),'training');assert.equal(m.w.ProgressStore.get('create-product'),'new');
m.w.ProgressStore.set('device-choice','mastered');m.w.ProgressStore.set('device-choice','training');assert.equal(m.w.ProgressStore.get('device-choice'),'mastered');m.w.ProgressStore.set('device-choice','almost',2);assert.equal(m.w.ProgressStore.get('device-choice',2),'almost');assert.equal(m.w.ProgressStore.get('device-choice',1),'new');assert.equal(JSON.parse(m.values[key]).skills['device-choice'].history[0].status,'mastered');
const again=env(m.values);assert.equal(again.w.ProgressStore.get('device-choice',2),'almost');again.w.ProgressStore.reset();const reset=env(again.values);assert.equal(reset.w.ProgressStore.get('device-choice'),'new');
for(const malformed of ['{','null','[]','123'])assert.equal(env({[old]:malformed}).w.ProgressStore.get('device-choice'),'new');
const quota=env({},true);quota.w.ProgressStore.set('device-choice','mastered');assert.equal(quota.w.ProgressStore.get('device-choice'),'mastered');quota.w.ProgressStore.saveWork('postcard',{caption:'ВІТАЮ',elements:['star']});assert.equal(quota.w.ProgressStore.getWork('postcard').caption,'ВІТАЮ');assert.equal(quota.w.ProgressStore.isPersistent,false);
for(const p of ['js/lessons/devices-lessons.js','js/lessons/info-lessons.js','js/lessons/online-lessons.js','js/lessons/algo-lessons.js'])vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),context);
Object.assign(context,{DeviceLessons:w.DeviceLessons,InfoLessons:w.InfoLessons,OnlineLessons:w.OnlineLessons,AlgoLessons:w.AlgoLessons,AppData:w.AppData});
vm.runInContext(fs.readFileSync(path.join(root,'js/course-lessons.js'),'utf8'),context);
assert.equal(Object.keys(w.CourseLessons).length,18);
for(const skill of w.AppData.skills){const lesson=w.CourseLessons[skill.skillKey];assert.ok(lesson.demo,skill.skillKey+' demo');assert.ok(lesson.activities.length>=2 && lesson.activities.length<=3,skill.skillKey+' tabs');assert.ok(lesson.remember.length>=2 && lesson.remember.length<=3);const checks=lesson.assessment.tasks;assert.equal(checks.length===1 && checks[0].type==='editor'?4:checks.length,4);for(const config of [lesson.demo,...lesson.activities.map(a=>a.config),lesson.assessment])for(const task of config.tasks || []){if(task.type==='choice'){assert.equal(task.options.length,4);assert.equal(task.options.filter(o=>o.id===task.answerId).length,1);}}}
const draft={caption:'First',elements:['star']};quota.w.ProgressStore.saveWork('postcard',draft);draft.caption='Unsaved';assert.equal(quota.w.ProgressStore.getWork('postcard').caption,'First');quota.w.ProgressStore.reset();assert.deepEqual(Object.keys(quota.w.ProgressStore.getWork('postcard')),[]);
console.log('PASS: 18 identities, 5 themes, legacy routes, versioned migration, reset, quota, shared work and four-outcome assessment contracts.');
