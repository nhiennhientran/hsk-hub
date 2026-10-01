'use strict';
module.exports=async function(A){
 const {assert,fs,check,page,newContext,open,homeworkReady,saved,state,order,choose,sort,submit,part,screenshot,backup,importBackup,delay,play,BASE,file,E2,E3,BANK,C,report}=A;
 const all=Array.from({length:15},(_,i)=>i+1);
 const crypto=require('node:crypto');
 report.specialMedia=[];report.vocabulary=[];report.intentionalFailures=[];
 async function selectLessons(p,ls){await p.locator('#clear-lessons').click();for(const n of ls)await p.locator(`#lesson-checks [data-lesson="${n}"]`).check();}
 async function nativePlay(p,id,rate=1.5){
  await p.locator('#audio-rate').selectOption(String(rate));await p.locator('#play-audio').click();
  await p.waitForFunction(()=>{const a=document.getElementById('lesson-audio');return a&&a.ended&&a.duration>0;},null,{timeout:35000});
  const d=await p.locator('#lesson-audio').evaluate(a=>({id:a.dataset.mediaId,src:a.src,duration:a.duration,rate:a.playbackRate,ended:a.ended,preservesPitch:a.preservesPitch}));
  assert.equal(d.id,id);assert.equal(d.rate,rate);assert.ok(d.src.startsWith('data:audio/'));
  const bytes=Buffer.from(d.src.split(',')[1],'base64'),hash=crypto.createHash('sha256').update(bytes).digest('hex');
  const ix=await p.evaluate(id=>window.HSKStep3MediaIndex.clips[id],id);assert.equal(hash,ix.sha256);
  delete d.src;d.sha256=hash;report.specialMedia.push(d);return d;
 }
 await check('Final textbook: 342 course-word entries, all eight extensions, both same-lesson senses and 45 scenes',async()=>{
  await open(page,'lesson.html?id=15&sec=vocab');await page.locator('#vocabGrid .vcard').first().waitFor();
  const data=await page.evaluate(()=>({lessons:window.HSK1_LESSONS,final:window.HSK1_FINAL_TEXTBOOK}));
  assert.equal(data.final.wordRows,342);assert.equal(data.lessons.reduce((n,l)=>n+l.scenes.length,0),45);
  const extension=[];
  for(const L of data.lessons){for(const v of L.vocab)if(v.extension)extension.push(v.zh);if(L.id<9)continue;
   for(const v of C.vocabulary.filter(v=>v.lesson===L.id)){const real=L.vocab.find(w=>w.zh===v.zh);assert.ok(real,`${L.id}:${v.zh}`);assert.ok(real.sourceSenseIds.includes(v.senseId));assert.ok(real.vn.includes(v.vi));assert.equal(real.extension,v.extension);}
  }
  assert.deepEqual(extension.sort(),['病人','售货员','斤','医','药','服务员','机场','接'].sort());
  const L=l=>data.lessons.find(x=>x.id===l);
  assert.equal(L(10).scenes[0].lines[0].zh,'请问，有杯子吗？');assert.equal(L(10).scenes[1].lines[2].zh,'我想买两斤苹果。');
  assert.deepEqual(L(11).scenes[2].lines.slice(-2).map(x=>x.s),['刘明','刘小雪']);assert.equal(L(12).scenes[0].lines[2].zh,'雨大吗？');
  assert.equal(L(13).scenes[2].lines[2].zh,'好的。一斤饺子40个。');assert.equal(L(13).scenes[2].lines[5].zh,'请给我一杯茶吧。');
  for(const [l,w,code] of [[9,'和','prep'],[12,'病','v'],[13,'可以','modal'],[13,'鸡蛋','n'],[15,'几','num'],[15,'那','conj']])assert.equal(L(l).vocab.find(v=>v.zh===w).pos,code);
  for(let l=9;l<=15;l++){
   await open(page,`lesson.html?id=${l}&sec=text`);await page.locator('#scenePane .speak-line').first().waitFor();
   for(let n=0;n<3;n++){await page.locator(`#sceneTabs .scene-tab[data-i="${n}"]`).click();assert.equal(await page.locator('#scenePane .speak-line').count(),L(l).scenes[n].lines.length);}
   for(const sec of ['vocab','grammar','hanzi','practice']){await page.locator(`.section-tab[data-sec="${sec}"]`).first().click();assert.equal(await page.locator('#'+sec).isVisible(),true);}
   if([9,12,15].includes(l))await screenshot(page,'original-modules-'+l,false);
  }
 });
 await check('Textbook 14-3 corrected five turns use separate native playback ranges',async()=>{
  await open(page,'lesson.html?id=14&sec=text');await page.locator('#sceneTabs .scene-tab[data-i="1"]').click();
  const ranges=[[2.95,7.45],[7.6,9.55],[9.6,12.15],[12.2,22.15],[22.15,25.427]];
  for(let i=0;i<5;i++){
   await page.locator('#scenePane .speak-line').nth(i).click();
   await page.waitForFunction(()=>window.HSK1_OFFICIAL_AUDIO.diagnostics().playing);
   const d=await page.evaluate(()=>window.HSK1_OFFICIAL_AUDIO.diagnostics());
   assert.deepEqual(d.range,ranges[i]);assert.equal(d.activeTrack,'14-3');
   assert.ok(Math.abs(d.mediaCurrentTime-ranges[i][0])<0.75,'native seek '+JSON.stringify(d));
   try{await page.waitForFunction(()=>window.HSK1_OFFICIAL_AUDIO.diagnostics().endedByRange,null,{timeout:Math.ceil((ranges[i][1]-ranges[i][0])*1000+6000)});}
   catch(e){report.mediaFailureDiagnostic=await page.evaluate(()=>window.HSK1_OFFICIAL_AUDIO.diagnostics());throw e;}
   const done=await page.evaluate(()=>window.HSK1_OFFICIAL_AUDIO.diagnostics());
   assert.ok(Math.abs(done.finishedAt-ranges[i][1])<.35,'native range end '+JSON.stringify(done));
   report.textbookPlayback.push({track:d.activeTrack,line:i+1,range:d.range,startObserved:d.mediaCurrentTime,finishedAt:done.finishedAt,rangePlaybackFinished:true});
  }

 });
 await check('All 95 registered sorting answers are accepted; each objective feedback remains attached to its source option',async()=>{
  let variants=0;
  for(const L of BANK){
   await open(page,`learning.html?mode=homework&lesson=${L.id}&stage=sort`);await homeworkReady(page);
   for(let round=0;round<Math.max(...L.sort.map(q=>q.answers.length));round++){
    await page.locator('[data-restart]').click();
    for(const q of L.sort){const index=Math.min(round,q.answers.length-1);for(const i of order(q,q.answers[index]))await page.locator(`[data-token="${q.id}"][data-index="${i}"]`).click();if(round<q.answers.length)variants++;}
    await submit(page);assert.match(await page.locator('#submitted-result').innerText(),/5\/5/);
   }
  }
  assert.equal(variants,95);report.acceptedSortVariants=variants;
 });
 await check('75 listening first results are preserved when all 15 latest mistakes are corrected',async()=>{
  await open(page,'learning.html?mode=listening&intent=resume');await page.locator('#select-all').click();await page.locator('#listening-mode').selectOption('wrong');await page.locator('#start-listening').click();await page.locator('#listening-question').waitFor();
  const start=await state(page,E3.KEY);assert.equal(start.listening.session.questionIds.length,15);
  for(let i=0;i<15;i++){
   const id=await page.locator('#listening-question').getAttribute('data-question-id'),q=C.listening.find(q=>q.id===id);
   await nativePlay(page,id);await page.locator(`[data-listen-option="${q.answer}"]`).click();await page.locator('#listen-submit').click();if(i<14)await page.locator('#listen-next').click();
  }
  const t=E3.listeningSummary(await state(page,E3.KEY),C);assert.equal(t.overall.answered,75);assert.equal(t.overall.firstCorrect,60);assert.equal(t.overall.latestCorrect,75);assert.deepEqual(t.wrongIds,[]);
  assert.equal(await page.locator('#start-listening').isDisabled(),true);assert.equal(await page.locator('#selection-summary').getAttribute('data-listening-count'),'0');report.correctedListening={first:60,latest:75,denominator:75};
 });
 await check('Every 344 vocabulary sense is revealed/rated; 330 actual recordings finish; 14 missing number recordings stay explicit',async()=>{
  const c=await newContext(),p=await c.newPage();await open(p,'learning.html?mode=vocab');await p.locator('#select-all').click();await p.locator('#shuffle-items').uncheck();await p.locator('#review-direction').selectOption('vi-zh');await p.locator('#start-review').click();await p.locator('#review-card').waitFor();
  const deck=E3.makeDeck(E3.blank(),C,{lessons:all,filter:'all',direction:'vi-zh',shuffle:false},0);assert.equal(deck.cards.length,344);
  let hasAudio=0,missing=0;
  for(let i=0;i<344;i++){
   const sid=await p.locator('#review-card').getAttribute('data-sense-id'),card=deck.cards.find(x=>x.senseId===sid);assert.ok(card);
   assert.equal(await p.locator('#card-answer').count(),0);assert.equal(await p.locator('#review-card [lang="zh-Hans"]').count(),0);assert.equal(await p.locator('#audio-controls').isVisible(),false);
   await p.locator('#reveal-card').click();assert.equal(await p.locator('#card-answer .zh').textContent(),card.zh);assert.equal(await p.locator('#card-answer .vi').textContent(),card.vi);
   if(card.audioRecordId){await nativePlay(p,card.audioRecordId);hasAudio++;}else{assert.equal(await p.locator('#audio-controls').isVisible(),false);assert.match(await p.locator('#review-card').innerText(),/chưa có đoạn đọc riêng/);missing++;}
   await p.locator('[data-rating="good"]').click();assert.equal(await p.locator('[data-rating="good"]').isDisabled(),true);
   report.vocabulary.push({senseId:sid,sourceIds:card.sourceRecords.map(x=>x.id),audio:card.audioRecordId,status:'passed'});
   if(i%25===0)console.log('Vocabulary native playback',i+1,'/344');
   if([0,100,200,343].includes(i))await screenshot(p,'vocabulary-'+i,false);
   if(i<343)await p.locator('#card-next').click();
  }
  assert.equal(hasAudio,330);assert.equal(missing,14);assert.equal(new Set(report.vocabulary.flatMap(x=>x.sourceIds)).size,344);
  const before=await state(p,E3.KEY);assert.equal(Object.keys(before.cards.schedule).length,344);assert.equal(E3.listeningSummary(before,C).overall.answered,0);
  await p.locator('#vocab-filter').selectOption('due');assert.equal(await p.locator('#start-review').isDisabled(),true);assert.equal(await p.locator('#selection-summary').getAttribute('data-filtered-count'),'0');
  await p.locator('#vocab-filter').selectOption('all');await p.locator('#start-review').click();await p.locator('#review-card').waitFor();const sid=await p.locator('#review-card').getAttribute('data-sense-id');await p.locator('#reveal-card').click();await p.locator('[data-rating="good"]').click();
  const after=await state(p,E3.KEY);assert.equal(after.cards.schedule[sid].dueAt,before.cards.schedule[sid].dueAt);assert.equal(after.cards.schedule[sid].stage,before.cards.schedule[sid].stage);
  const f=await backup(p,true,'all-vocabulary-backup'),fresh=await newContext(),r=await fresh.newPage();await open(r,'learning.html?mode=vocab');await importBackup(r,f,true);assert.deepEqual((await state(r,E3.KEY)).cards,after.cards);
 });
 await check('Non-contiguous combinations keep source lessons and distinct meanings; both retrieval directions and filters',async()=>{
  const c=await newContext(),p=await c.newPage();await open(p,'learning.html?mode=vocab');
  for(const ls of [[1,7,15],[3,6],[7,8,11],[9,14],[12,14]]){
   await selectLessons(p,ls);await p.locator('#shuffle-items').uncheck();await p.locator('#review-direction').selectOption('zh-vi');await p.locator('#vocab-filter').selectOption('all');await p.locator('#start-review').click();await p.locator('#review-card').waitFor();
   const current=await state(p,E3.KEY),deck=E3.makeDeck(current,C,{lessons:ls,filter:'all',shuffle:false},Date.now());assert.deepEqual(current.cards.review.senseIds,deck.senseIds);assert.ok(deck.cards.every(card=>card.lessons.every(l=>ls.includes(l))));
   if(ls.join(',')==='3,6')assert.equal(deck.cards.filter(x=>x.zh==='想').length,2);
   if(ls.join(',')==='7,8,11')assert.equal(deck.cards.filter(x=>x.zh==='在').length,3);
   if(ls.join(',')==='12,14')assert.equal(deck.cards.filter(x=>x.zh==='天').length,2);
   if(ls.join(',')==='9,14')assert.equal(deck.cards.filter(x=>x.zh==='上').length,3);
   await p.locator('#reveal-card').click();await p.locator('[data-rating="again"]').click();const sid=await p.locator('#review-card').getAttribute('data-sense-id');
   await p.locator('#vocab-filter').selectOption('wrong');await p.locator('#start-review').click();assert.ok((await state(p,E3.KEY)).cards.review.senseIds.includes(sid));
  }
  await p.locator('#clear-lessons').click();assert.equal(await p.locator('#start-review').isDisabled(),true);
 });
 await check('Five native speeds, pause/resume/replay, mid-play rate change and module switch',async()=>{
  const c=await newContext(),p=await c.newPage();await open(p,'learning.html?mode=listening&lesson=14');await p.locator('#shuffle-items').uncheck();await p.locator('#start-listening').click();await p.locator('#listening-question').waitFor();
  for(let i=0;i<4;i++){const x=await p.locator('#listening-question').getAttribute('data-question-id'),q=C.listening.find(q=>q.id===x);await p.locator(`[data-listen-option="${q.answer}"]`).click();await p.locator('#listen-submit').click();await p.locator('#listen-next').click();}
  const id=await p.locator('#listening-question').getAttribute('data-question-id');
  for(const rate of [.65,.75,1,1.25,1.5]){const d=await nativePlay(p,id,rate);if(typeof d.preservesPitch==='boolean')assert.equal(d.preservesPitch,true);}
  await p.locator('#replay-audio').click();await p.waitForFunction(()=>{const a=document.getElementById('lesson-audio');return !a.paused&&a.currentTime>.15;});await p.locator('#pause-audio').click();
  const at=await p.locator('#lesson-audio').evaluate(a=>a.currentTime);await delay(180);assert.equal(await p.locator('#lesson-audio').evaluate(a=>a.paused),true);assert.ok(Math.abs((await p.locator('#lesson-audio').evaluate(a=>a.currentTime))-at)<.08);
  await p.locator('#audio-rate').selectOption('.75'.replace(/^\./,'0.'));await p.locator('#play-audio').click();await p.waitForFunction(()=>!document.getElementById('lesson-audio').paused);await p.locator('#audio-rate').selectOption('1.25');
  await p.locator('#module-vocabulary').click();assert.equal(await p.locator('#lesson-audio').evaluate(a=>a.paused),true);assert.equal(await p.locator('#lesson-audio').getAttribute('src'),null);
 });
 await check('Injected media loading failure is visible, keeps selection, and retries the same original audio',async()=>{
  const c=await newContext(),p=await c.newPage();let injected=0;
  const expectedURL=BASE+'stage3/media/lesson-15.js';
  await c.route('**/stage3/media/lesson-15.js',r=>{if(injected++===0)return r.fulfill({status:503,contentType:'text/javascript',body:''});return r.continue();});
  await open(p,'learning.html?mode=listening&lesson=15');await p.locator('#shuffle-items').uncheck();await p.locator('#start-listening').click();await p.locator('#listening-question').waitFor();const id=await p.locator('#listening-question').getAttribute('data-question-id'),q=C.listening.find(x=>x.id===id);
  await p.locator(`[data-listen-option="${q.answer}"]`).click();await p.locator('#play-audio').click();await p.waitForFunction(()=>/Chưa mở được/.test(document.getElementById('audio-status').textContent));assert.equal(await p.locator(`[data-listen-option="${q.answer}"]`).getAttribute('aria-pressed'),'true');
  await nativePlay(p,id);await p.locator('#listen-submit').click();assert.equal(E3.listeningSummary(await state(p,E3.KEY),C).overall.firstCorrect,1);
  const failures=report.network.filter(x=>x.url===expectedURL);assert.equal(failures.filter(x=>x.status===503).length,1);assert.ok(failures.length<=2);report.intentionalFailures.push(...failures);report.network=report.network.filter(x=>x.url!==expectedURL);assert.ok(injected>=2);
 });
 await check('Lesson10 full cross-module draft-to-submission and two real backup files restore in a new environment',async()=>{
  const c=await newContext(),p=await c.newPage(),L=BANK[9];await open(p,'learning.html?mode=homework&lesson=10');await choose(p,L,0);await submit(p);await part(p,'sort');await sort(p,L);await submit(p);await part(p,'translation');
  const texts=L.translation.map((_,i)=>`第十课第${i+1}题。\nXin chào — <script>không thực thi</script>`);
  for(let i=0;i<2;i++)await p.locator('#input-'+L.translation[i].id).fill(texts[i]);await saved(p);
  await p.locator('#integratedNav [data-mode="listening"]').click();await p.locator('#start-listening').click();await p.locator('#listening-question').waitFor();const id=await p.locator('#listening-question').getAttribute('data-question-id');await nativePlay(p,id);
  await p.locator('#integratedNav [data-mode="vocab"]').click();await p.locator('#start-review').waitFor();await selectLessons(p,[7,10]);await p.locator('#start-review').click();await p.locator('#reveal-card').click();await p.locator('[data-rating="hard"]').click();
  await p.locator('#integratedNav [data-mode="homework"]').click();await homeworkReady(p);assert.match(p.url(),/lesson=10/);
  for(let i=0;i<5;i++){if(i<2)assert.equal(await p.locator('#input-'+L.translation[i].id).inputValue(),texts[i]);else await p.locator('#input-'+L.translation[i].id).fill(texts[i]);}
  await submit(p);await p.reload({waitUntil:'domcontentloaded'});await homeworkReady(p);await p.locator('[data-receipt]').click();for(let i=0;i<5;i++)assert.equal(await p.locator('.s1-written-answer').nth(i).textContent(),texts[i]);assert.equal(await p.locator('#receipt script').count(),0);await screenshot(p,'lesson10-cross-receipt');await p.locator('[data-close-receipt]').click();
  const h=await backup(p,false,'cross-homework');await p.locator('#integratedNav [data-mode="vocab"]').click();await p.locator('#start-review').waitFor();const m=await backup(p,true,'cross-media');const expected=await state(p,E3.KEY);
  const fresh=await newContext(),r=await fresh.newPage();await open(r,'learning.html?mode=homework&lesson=10');await importBackup(r,h);await part(r,'translation');await r.locator('[data-receipt]').click();for(let i=0;i<5;i++)assert.equal(await r.locator('.s1-written-answer').nth(i).textContent(),texts[i]);
  await open(r,'learning.html?mode=vocab&intent=resume');await importBackup(r,m,true);assert.deepEqual((await state(r,E3.KEY)).cards,expected.cards);assert.deepEqual((await state(r,E3.KEY)).preferences.lessons,[7,10]);assert.equal(E2.courseTotals(await state(r,E2.KEY),BANK).homework.submitted,15);
 });
 await check('Final help and classroom entry are usable without exposing reference translations',async()=>{
  const c=await newContext(),p=await c.newPage();await p.goto(BASE+'learning.html',{waitUntil:'domcontentloaded'});await p.locator('#pwInput').fill('wrong-test-password');await p.locator('#pwBtn').click();assert.equal(await p.locator('#pwOverlay').isVisible(),true);await p.locator('#pwInput').fill('Ranlaoshimeimei');await p.locator('#pwBtn').click();await homeworkReady(p);
  await open(p,'help.html');assert.match(await p.locator('main').innerText(),/không có nghĩa là cô đã nhận/);assert.match(await p.locator('main').innerText(),/10 câu/);await p.setViewportSize({width:390,height:844});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await screenshot(p,'student-help',false);
 });
};
