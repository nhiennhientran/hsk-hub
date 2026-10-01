'use strict';
module.exports=async function(A){
 const {assert,fs,check,page,newContext,open,homeworkReady,saved,state,order,choose,submit,part,screenshot,backup,importBackup,delay,BASE,file,E1,E2,BANK,C,report}=A;
 await check('Textbook Lessons 1-8: 181 source-mapped words, 24 scenes and original module entry points',async()=>{
  const counts=[13,15,22,35,22,23,27,24];
  for(let l=1;l<=8;l++){
   await open(page,`lesson.html?id=${l}&sec=vocab`);await page.locator('#vocabGrid .vcard').first().waitFor();
   const data=await page.evaluate(l=>{const L=window.HSK1_LESSONS.find(x=>x.id===l);return {vocab:L.vocab,scenes:L.scenes,corrections:window.HSK1_INTEGRATION_TEXTBOOK};},l);
   assert.equal(data.corrections.audioCorrected,true);assert.equal(data.vocab.length,counts[l-1]);assert.equal(data.scenes.length,3);
   const expected=C.vocabulary.filter(v=>v.lesson===l);for(const v of expected){const actual=data.vocab.find(x=>x.zh===v.zh);assert.ok(actual,`${l}:${v.zh}`);assert.equal(actual.vn,v.vi);assert.equal(actual.py,v.py);assert.equal(actual.extension,v.extension);assert.ok(actual.posLabel,`missing POS ${l}:${v.zh}`);}
   for(const sec of ['text','grammar','hanzi','practice']){const tab=page.locator(`.section-tab[data-sec="${sec}"]`).first();await tab.click();assert.equal(await page.locator('#'+sec).isVisible(),true);}
   if(l===3){assert.deepEqual(data.scenes[1].lines.map(x=>x.zh),['这是谁？','这是我女朋友。','你女朋友是哪国人？','她也是泰国人。']);assert.equal(data.scenes[0].place,'在校园里');}
   if(l===4)assert.equal(data.scenes[2].lines[2].zh,'您儿子几岁？');
   if(l===5)assert.deepEqual(data.scenes[0].lines.map(x=>x.s),['王一雪','刘明','王一雪','刘明']);
   if(l===6){assert.equal(data.vocab.some(x=>x.zh==='西安'),false);assert.match(data.vocab.find(x=>x.zh==='西安饭店').vn,/nhà hàng/);}
   if(l===7){assert.equal(data.scenes[1].lines[0].zh,'下午我想去电影院看电影，你去吗？');assert.equal(data.scenes[2].lines[0].s,'王一雪');assert.equal(data.scenes[2].lines[1].s,'刘明');}
   if(l===8){assert.equal(data.scenes[1].lines[3].zh,'我能到。我在学校吃午饭。');assert.equal(data.scenes[2].lines[0].zh,'小胡，还没吃饭呢？');}
  }
 });
 await check('Corrected textbook line and word segment mappings are actually used by the original player',async()=>{
  await open(page,'lesson.html?id=3&sec=text');await page.locator('#sceneTabs .scene-tab[data-i="1"]').click();
  const expected=[[0.204,1.65],[1.75,3.873],[3.873,7.246],[7.246,9.653]];
  assert.equal(await page.locator('#scenePane .speak-line').count(),4);
  report.textbookPlayback=[];
  for(let i=0;i<4;i++){
   await page.locator('#scenePane .speak-line').nth(i).click();await page.waitForFunction(()=>window.HSK1_OFFICIAL_AUDIO.diagnostics()?.playing===true);
   const d=await page.evaluate(()=>window.HSK1_OFFICIAL_AUDIO.diagnostics());assert.deepEqual(d.range,expected[i]);assert.equal(d.activeTrack,'3-3');
   await page.waitForFunction(()=>window.HSK1_OFFICIAL_AUDIO.diagnostics()?.endedByRange===true);report.textbookPlayback.push({line:i+1,range:d.range,track:d.activeTrack,rangePlaybackFinished:true});
  }
  await open(page,'lesson.html?id=7&sec=vocab');await page.locator('#vocabGrid').waitFor();
  const segments=await page.evaluate(()=>Object.fromEntries(['里','晚上','医院','上班','店','菜','分钟','后','吧'].map(w=>[w,window.HSK1_OFFICIAL_AUDIO.vocabSegment(7,w)])));
  for(const [word,seg] of Object.entries(segments)){const v=C.vocabulary.find(v=>v.lesson===7&&v.zh===word);assert.equal(seg.start,v.audio.start);assert.equal(seg.end,v.audio.end);assert.equal(seg.track,v.audio.track);}
  await open(page,'lesson.html?id=4&sec=vocab');await page.locator('#vocabGrid').waitFor();
  for(const word of ['八','百']){const b=page.locator('#vocabGrid .vcard').filter({has:page.locator('.vzh',{hasText:new RegExp('^'+word+'$')})}).locator('.speak-word');assert.equal(await b.isDisabled(),true);}
  await screenshot(page,'textbook-corrected-lesson4');
 });
 await check('Keyboard sorting, genuine text editing and previous backup recovery',async()=>{
  const c=await newContext(),p=await c.newPage();await open(p,'learning.html?mode=homework&lesson=1');await homeworkReady(p);
  await choose(p,BANK[0],0);await submit(p);await part(p,'sort');
  for(const q of BANK[0].sort)for(const i of order(q)){const token=p.locator(`[data-token="${q.id}"][data-index="${i}"]`);await token.focus();await token.press('Enter');}
  await submit(p);assert.match(await p.locator('#submitted-result').innerText(),/5\/5/);await part(p,'translation');
  const input=p.locator('#input-'+BANK[0].translation[0].id);await input.fill('中文输入 — tiếng Việt');await input.press('End');await input.press('Enter');await input.pressSequentially('abc');await input.press('Backspace');
  assert.equal(await input.inputValue(),'中文输入 — tiếng Việt\nab');await saved(p);const first=await backup(p,false,'before-change');
  await input.fill('需要恢复保留的第二份草稿。');await saved(p);await importBackup(p,first);await part(p,'translation');assert.equal(await input.inputValue(),'中文输入 — tiếng Việt\nab');
  await p.locator('#backup-details').evaluate(el=>el.open=true);await p.locator('#restore-previous').click();await p.locator('#apply-backup').click();await part(p,'translation');assert.equal(await input.inputValue(),'需要恢复保留的第二份草稿。');
 });
 await check('A real Stage1 sample JSON file can be explicitly imported without grading translations',async()=>{
  const Sample=require('../../new-hsk1/hsk1/stage1/sample-bank.js')[0],s=E1.blank();
  for(const k of ['choice','sort','translation']){for(const q of Sample[k])E1.group(s,3,k).draft[q.id]=k==='translation'?'第一步样板原文。':k==='sort'?order(q):q.answer;assert.equal(E1.submit(s,3,k,Sample[k]).ok,true);}
  const dest=file('stage1-nonempty.json');fs.writeFileSync(dest,JSON.stringify(s));const c=await newContext(),p=await c.newPage();await open(p,'learning.html?mode=homework&lesson=3');await homeworkReady(p);await importBackup(p,dest);await part(p,'translation');await p.locator('[data-receipt]').click();assert.match(await p.locator('#receipt').innerText(),/第一步样板原文/);assert.match(await p.locator('#receipt').innerText(),/Không chấm điểm/);
 });
 await check('Quota failure retains the in-memory answer and permits a downloadable backup',async()=>{
  const c=await newContext();await c.addInitScript(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='ran_hsk1_stage2_v3')throw new DOMException('Injected quota failure','QuotaExceededError');return set.call(this,k,v);};});const p=await c.newPage();await open(p,'learning.html?mode=homework&lesson=1');await homeworkReady(p);const q=BANK[0].choice[0];await p.locator(`[data-option="${q.id}"][data-index="${q.answer}"]`).click();await p.locator('#storage-notice').waitFor();await delay(300);
  assert.equal(await p.locator(`[data-option="${q.id}"][data-index="${q.answer}"]`).getAttribute('aria-pressed'),'true');assert.equal(await p.evaluate(k=>localStorage.getItem(k),E2.KEY),null);
  const dest=await backup(p,false,'quota-protected-answer');const exported=JSON.parse(fs.readFileSync(dest,'utf8'));assert.equal(exported.lessons[1].choice.draft[q.id],q.answer);await screenshot(p,'quota-warning',false);
 });
 await check('Unreadable existing homework is never silently overwritten',async()=>{
  const c=await newContext();await c.addInitScript(()=>{if(location.protocol!=='http:')return;if(!localStorage.getItem('ran_hsk1_stage2_v3'))localStorage.setItem('ran_hsk1_stage2_v3','{original damaged data');});const p=await c.newPage();await open(p,'learning.html?mode=homework&lesson=1');await homeworkReady(p);await p.locator('#storage-notice').waitFor();await p.locator(`[data-option="${BANK[0].choice[0].id}"][data-index="0"]`).click();await delay(300);assert.equal(await p.evaluate(k=>localStorage.getItem(k),E2.KEY),'{original damaged data');await backup(p,false,'unreadable-storage-current-work');
 });
 await check('Human listening review page: 75 pending items, actual audio and device checklist export',async()=>{
  const c=await newContext(),p=await c.newPage();await open(p,'../../tools/review/hsk1-listening-device-review.html');
  await p.locator('#question-list [data-question]').first().waitFor();assert.equal(await p.locator('#question-list [data-question]').count(),75);assert.match(await p.locator('#review-count').innerText(),/^0\/75/);
  await p.locator('#question-list [data-question]').first().click();await p.locator('#play-audio').click();await p.waitForFunction(()=>document.getElementById('lesson-audio').ended,null,{timeout:15000});
  await p.locator('#device').fill('Synthetic review test - not a real phone');const wait=p.waitForEvent('download');await p.locator('#export-review').click();const d=await wait,dest=file('human-review-test.json');await d.saveAs(dest);const data=JSON.parse(fs.readFileSync(dest,'utf8'));assert.equal(data.unchecked.length,75);assert.equal(Object.keys(data.items).length,0);assert.equal(await p.locator('[data-device]').count(),9);await screenshot(p,'human-review-page',false);
 });

 await check('Local storage access denied: visible warning, usable answers and export',async()=>{
  const c=await newContext();await c.addInitScript(()=>{if(location.protocol!=='http:')return;Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Injected access denial','SecurityError');}});});
  const p=await c.newPage();await open(p,'learning.html?mode=homework&lesson=1');await homeworkReady(p);await p.locator('#storage-notice').waitFor();
  const q=BANK[0].choice[0];await p.locator(`[data-option="${q.id}"][data-index="${q.answer}"]`).click();const dest=await backup(p,false,'storage-access-denied');assert.equal(JSON.parse(fs.readFileSync(dest,'utf8')).lessons[1].choice.draft[q.id],q.answer);
 });

};
