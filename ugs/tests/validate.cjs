const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
function walk(dir) { return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]); }
const files = walk(root);
for (const file of files.filter(f => /\.(?:js|cjs)$/.test(f))) new vm.Script(fs.readFileSync(file,'utf8'), { filename:file });
for (const file of files.filter(f => f.endsWith('.html'))) {
  const source=fs.readFileSync(file,'utf8');
  for (const match of source.matchAll(/(?:src|href)="([^"#?]+)"/g)) {
    if (/^[a-z]+:/i.test(match[1])) continue;
    assert.ok(fs.existsSync(path.resolve(path.dirname(file),match[1])), `Missing HTML resource: ${file}: ${match[1]}`);
  }
}
const context={window:{}};
vm.createContext(context);
for (const file of ['js/data.js','js/lesson-ui.js','js/lesson-media.js','js/icons.js','js/lessons/devices-lessons.js','js/lessons/info-lessons.js','js/lessons/online-lessons.js','js/lessons/algo-lessons.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const w=context.window;
const lessons={...w.DeviceLessons,...w.InfoLessons,...w.OnlineLessons,...w.AlgoLessons};
for (const file of ['js/practice-bank.js','js/components/word-search.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
for (const [id, practice] of Object.entries(w.PracticeBank)) {
  assert.ok(practice.draw.length > 20, `Drawing prompt: ${id}`);
  for(const round of practice.sort.rounds) for(const item of round.items) assert.ok(round.bins.some(b=>b.id===item.bin));
  for(let attempt=0;attempt<100;attempt++) {
    const board=w.WordSearch.build(practice.words);
    assert.equal(board.grid.length,36);
    assert.equal(board.targets.length,practice.words.length);
    for(const target of board.targets) {
      assert.equal(target.cells.map(i=>board.grid[i]).join(''),target.word,`Unsolvable word: ${id}`);
      assert.ok(target.cells.every(i=>i>=0 && i<36));
    }
  }
}
assert.equal(Object.keys(lessons).length,16);
for(const [id,lesson] of Object.entries(lessons)) {
  assert.ok(lesson.watch.frames.length && lesson.remember.length);
  assert.ok(w.LessonMedia[id]);
  for(const stage of ['try','practice','assessment']) {
    const config=lesson[stage]; assert.ok(config?.kind, `${id} ${stage}`);
    for(const round of config.rounds||[]) {
      if(round.options) assert.equal(round.options.filter(o=>o.correct).length,1,`Answer ambiguity: ${id} ${stage}`);
      if(round.results) assert.equal(round.results.filter(o=>o.correct).length,1,`Search result ambiguity: ${id}`);
      if(round.bins) for(const item of round.items) assert.ok(round.bins.some(bin=>bin.id===item.bin));
      if(round.pages && round.goal.visit) assert.ok(round.pages[round.goal.visit]);
    }
  }
}
for(const asset of Object.values(w.AppIcons.assets)) assert.ok(fs.existsSync(path.join(root,'assets/optimized',asset+'.webp')),asset);
const sw={URL,self:{location:{href:'https://example.test/ugs/sw.js'},addEventListener(){}}};
vm.createContext(sw);
vm.runInContext(fs.readFileSync(path.join(root,'sw.js'),'utf8')+'\nglobalThis.testCore = CORE;',sw);
for(const asset of sw.testCore) assert.ok(fs.existsSync(path.resolve(root,asset)),`Missing precache resource ${asset}`);
for(const file of files.filter(f=>/\.(?:js|css|webp)$/.test(f) && f !== path.join(root,'sw.js') && !f.includes(path.sep+'tools'+path.sep) && !f.includes(path.sep+'tests'+path.sep))) {
  assert.ok(sw.testCore.includes('./'+path.relative(root,file).replaceAll('\\','/')),`Uncached runtime resource: ${file}`);
}
const a=[1,2,3,4],b=w.LessonUI.shuffle(a); assert.equal(a.join(), '1,2,3,4');assert.equal([...b].sort().join(),'1,2,3,4');
assert.equal(w.LessonUI.status(3,4),'almost');assert.equal(w.LessonUI.status(2,4),'training');assert.equal(w.LessonUI.status(4,4),'mastered');
// A storage quota failure after initial availability must retain the current progress in memory.
const storage={window:{},localStorage:{getItem:()=>null,removeItem(){},setItem(k){if(k!=='__dm_test__')throw Error('quota');}}};
vm.createContext(storage);vm.runInContext(fs.readFileSync(path.join(root,'js/storage.js'),'utf8'),storage);
storage.window.ProgressStore.set(1,'mastered');assert.equal(storage.window.ProgressStore.get(1),'mastered');assert.equal(storage.window.ProgressStore.isPersistent,false);
console.log(`PASS: syntax, HTML references, 16 lesson contracts, image mappings, ${sw.testCore.length} precache resources, scoring, shuffle and storage fallback.`);
