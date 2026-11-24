'use strict';
// Сторінка «Для вчителів». Завантажується лише за потреби разом із teachers-data.js.
const GRADE_NOTES={
 2:'Для 2 класу окремих вчительських нотаток ще немає (крім теми 1.1). Коди Cambridge в цій таблиці орієнтовні: їх зіставлено за назвами й цілями уроків. Очікувані результати для 2 класу збігаються з цілями уроку.',
 3:'Тема шифрів вивчається у 4 класі (тема 1.8), тому цілі Stage 3 3DC.04 і 3DC.05 у 3 класі окремо не відпрацьовуються.',
 4:'Тут вивчаються шифри Цезаря та Pigpen (тема 1.8, ціль 4DC.06). Цілі Stage 3 про шифри (3DC.04–3DC.05) свідомо перенесено в цей клас.'
};
function teachersPage(g){
 const T=TEACHERS,grade=[1,2,3,4].includes(g)?g:1,ls=lessons.filter(l=>l.grade===grade),cov=T.coverage[grade];
 document.title='Для вчителів · '+siteTitle;
 const chip=c=>`<span class="code-chip" title="${esc(`Stage ${c[0]} · ${T.strands[c.replace(/^\d/,'').replace(/\.\d+$/,'')]||''}`)}">${esc(c)}</span>`;
 const tabs=`<nav class="grade-tabs" aria-label="Класи">${[1,2,3,4].map(n=>`<a href="#teachers/${n}" ${n===grade?'aria-current="page"':''}>${n} клас</a>`).join('')}</nav>`;
 const topicCard=l=>{const r=T.lessons[l.id];
  const outcome=r.core?`<p><b>Мінімум (CORE):</b> ${esc(r.core)}</p>${r.recovery?`<p><b>Підтримка (RECOVERY):</b> ${esc(r.recovery)}</p>`:''}${r.evidence?`<p><b>Підтвердження:</b> ${esc(r.evidence)}</p>`:''}`:'<p>Відповідає цілям уроку. Окремих критеріїв для цієї теми ще не складено.</p>';
  return `<article class="teacher-topic" id="t-${l.id}"><header><span class="topic-number">${l.module}.${l.number}</span><h3><a href="${href(l)}">${esc(l.title)}</a></h3></header>
   <div class="teacher-cols"><section><h4>Навчальні цілі</h4><ul>${r.goals.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section><h4>Очікуваний результат</h4>${outcome}</section></div>
   <footer>${r.codes.length?`<span class="teacher-label">Cambridge${r.provisional?' (орієнтовно)':''}:</span> ${r.codes.map(chip).join(' ')}`:'<span class="teacher-label">Cambridge:</span> тема розширює програму Stage 2'}${r.lines.length?`<span class="teacher-label">ІТ-студії:</span> ${r.lines.map(x=>`<span class="line-chip">${esc(x)}</span>`).join(' ')}`:''}</footer></article>`;};
 const mods=[...new Set(ls.map(l=>l.module))];
 app.innerHTML=`<main id="main" class="catalog teachers-page" tabindex="-1"><div class="catalog-toolbar"><h1>Для вчителів</h1><button type="button" id="print-teachers">Друкувати</button></div>
  <p class="teachers-intro">Підручник поєднує українську інформатику (змістові лінії ІТ-студій, засади НУШ) та програми Cambridge Primary: Computing (0059) і Digital Literacy (0072). Тут для кожної теми видно навчальні цілі, очікуваний результат і цілі Cambridge, на які вона спирається.</p>
  <details class="teachers-legend"><summary>Як читати сторінку</summary>
   <p><b>Код Cambridge</b>, наприклад <span class="code-chip">3CT.05</span>: цифра — Stage (рік навчання), літери — напрям, число — номер цілі. Повні формулювання є в офіційних програмах Cambridge.</p>
   <ul>${Object.entries(T.strands).map(([k,v])=>`<li><b>${k}</b> — ${esc(v)}</li>`).join('')}</ul>
   <p><b>CORE</b> — результат, який очікуємо від кожного учня. <b>RECOVERY</b> — спрощений варіант для тих, кому потрібна підтримка. <b>Підтвердження</b> — що вчитель може побачити чи почути як доказ.</p>
   <p><b>ІТ-студії:</b> п’ять змістових ліній. Лінію підібрано за напрямом цілі Cambridge (CT і P — «Обчислювальне мислення та програмування», MD — «Аналіз даних та моделювання», SW — «Цифрове громадянство», TC — «Медіатворчість», CS, DC і DW — «Цифрова грамотність»). Це орієнтир, а не офіційна таблиця відповідності.</p></details>
  ${tabs}
  <section class="teachers-summary"><h2>${grade} клас · Cambridge Stage ${grade}</h2><p>Охоплено цілей: <b>${cov.covered} з ${cov.total}</b>${cov.provisional?' (орієнтовно)':''}. Тем: ${ls.length}.</p>${GRADE_NOTES[grade]?`<p class="teachers-note">${esc(GRADE_NOTES[grade])}</p>`:''}${cov.missing.length&&grade!==3?`<p class="teachers-note">Не охоплено: ${cov.missing.map(chip).join(' ')}</p>`:''}${grade===3&&cov.missing.length?`<p class="teachers-note">Не відпрацьовуються у 3 класі: ${cov.missing.map(chip).join(' ')}</p>`:''}</section>
  ${mods.map(m=>{const ml=ls.filter(l=>l.module===m);return `<section class="teachers-module"><h2>Модуль ${m}. ${esc(ml[0].moduleTitle)}</h2>${ml.map(topicCard).join('')}</section>`;}).join('')}</main>`;
 document.getElementById('print-teachers').onclick=()=>window.print();
}
