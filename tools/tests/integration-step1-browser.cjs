'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {spawn}=require('node:child_process'),playwright=require('playwright');
const PORT=Number(process.env.HSK_STAGE41_PORT||18768),BROWSER=process.env.HSK_BROWSER||'chromium';
const BASE=`http://127.0.0.1:${PORT}/hsk-hub/new-hsk1/hsk1/`;
const OUT=path.resolve('tools/tests/results');fs.mkdirSync(OUT,{recursive:true});
const report={name:'integration-step1',browser:BROWSER,startedAt:new Date().toISOString(),basePath:'/hsk-hub/new-hsk1/hsk1/',checks:[],tasks:[],media:[],screenshots:[],errors:[],network:[],cancelledRequests:[],externalServices:'isolated, not an external-service availability test',passed:false};
const E2=require('../../new-hsk1/hsk1/stage2/engine.js'),BANK=require('../../new-hsk1/hsk1/stage2/bank.js');
const E1=require('../../new-hsk1/hsk1/stage1/engine.js'),SAMPLE=require('../../new-hsk1/hsk1/stage1/sample-bank.js')[0];
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('new-hsk1/hsk1/stage3/catalog.js','utf8'),sandbox);
const C=JSON.parse(JSON.stringify(sandbox.window.HSKStep3Catalog)),E3=require('../../new-hsk1/hsk1/stage3/engine.js');
const clone=x=>JSON.parse(JSON.stringify(x)),file=s=>path.join(OUT,`stage4-1-${BROWSER}-${s}`);
let browser=null,server=null,page=null,activeCheck='startup';
const contexts=[],delay=ms=>new Promise(r=>setTimeout(r,ms));
function persist(){fs.writeFileSync(file('report.json'),JSON.stringify(report,null,2));}
const hardTimer=setTimeout(()=>{report.errors.push({check:activeCheck,error:'suite deadline exceeded'});persist();server?.kill('SIGTERM');process.exit(124);},20*60*1000);
async function check(name,fn){activeCheck=name;const at=Date.now();try{await fn();report.checks.push({name,status:'passed',durationMs:Date.now()-at});console.log('PASS',name);}catch(e){report.checks.push({name,status:'failed',error:e.stack});throw e;}finally{persist();}}
async function newContext(options={}){
 const c=await browser.newContext({viewport:{width:1104,height:900},locale:'vi-VN',acceptDownloads:true,...options});contexts.push(c);
 await c.route('**/*',r=>{
  const u=r.request().url();if(u.startsWith(`http://127.0.0.1:${PORT}/hsk-hub/`)||u.startsWith('data:')||u.startsWith('blob:'))return r.continue();
  if(/fonts\.(googleapis|gstatic)\.com/.test(u))return r.fulfill({status:200,contentType:'text/css',body:''});
  return r.fulfill({status:200,contentType:'text/javascript',body:''});
 });
 c.on('page',p=>{
  p.setDefaultTimeout(15000);p.on('pageerror',e=>report.errors.push({check:activeCheck,error:e.message}));
  p.on('response',r=>{if(r.url().startsWith(BASE)&&r.status()>=400)report.network.push({check:activeCheck,url:r.url(),status:r.status()});});
  p.on('requestfailed',r=>{if(!r.url().startsWith(BASE))return;const error=r.failure()?.errorText,record={check:activeCheck,url:r.url(),error};if(['net::ERR_ABORTED','Load request cancelled'].includes(error))report.cancelledRequests.push(record);else report.network.push(record);});
  p.on('dialog',d=>d.accept());
 });return c;
}
async function open(p,relative){await p.goto(BASE+relative,{waitUntil:'domcontentloaded'});const o=p.locator('#pwOverlay');if(await o.isVisible().catch(()=>false)){await p.locator('#pwInput').fill('Ranlaoshimeimei');await p.locator('#pwBtn').click();await o.waitFor({state:'hidden'});}}
async function homeworkReady(p){await p.locator('#lesson-list [data-lesson="15"]').waitFor();}
async function saved(p,key=E2.KEY){await p.waitForTimeout(240);await p.waitForFunction(k=>{const n=document.getElementById('save-status');return !!localStorage.getItem(k)&&n&&/Đã lưu/.test(n.textContent);},key);}
async function state(p,key){return p.evaluate(k=>JSON.parse(localStorage.getItem(k)||'null'),key);}
function order(q,target=q.answers[0]){
 const goal=E2.normal(target),tokens=q.tokens.map(E2.normal);let visits=0;
 function walk(left,built,indices){if(++visits>100000)throw new Error('sort solver cap '+q.id);if(!left.length)return built===goal?indices:null;for(let n=0;n<left.length;n++){const i=left[n],next=built+tokens[i];if(goal.startsWith(next)){const found=walk(left.filter((_,j)=>j!==n),next,indices.concat(i));if(found)return found;}}return null;}
 const result=walk(q.tokens.map((_,i)=>i),'',[]);assert.ok(result,q.id);assert.equal(E2.check(q,result),true);return result;
}
async function choose(p,L,wrong=1){for(const [i,q] of L.choice.entries())await p.locator(`[data-option="${q.id}"][data-index="${(q.answer+(i<wrong?1:0))%4}"]`).click();}
async function sort(p,L){for(const q of L.sort)for(const i of order(q))await p.locator(`[data-token="${q.id}"][data-index="${i}"]`).click();}
async function submit(p){await p.locator('#submit-group').click();await p.locator('#submitted-result').waitFor();}
async function part(p,k){await p.locator(`#stages button[data-stage="${k}"]`).click();}
async function screenshot(p,name,full=true){const dest=file(name+'.png');await p.screenshot({path:dest,fullPage:full});report.screenshots.push(path.basename(dest));}
async function doHomework(p,l){
 const L=BANK.find(x=>x.id===l);await open(p,`learning.html?mode=homework&lesson=${l}`);await homeworkReady(p);
 assert.equal(await p.locator('#stages [data-stage="sort"]').isDisabled(),true);
 await p.locator('#submit-group').click();assert.equal(await p.locator('#form-error').isVisible(),true);
 await choose(p,L);await submit(p);assert.match(await p.locator('#submitted-result').innerText(),/4\/5/);
 for(const q of L.choice)report.tasks.push({id:q.id,lesson:l,kind:q.kind,status:'passed'});
 assert.equal(await p.locator('#stages [data-stage="sort"]').isDisabled(),false);await part(p,'sort');await sort(p,L);await submit(p);
 assert.match(await p.locator('#submitted-result').innerText(),/5\/5/);for(const q of L.sort)report.tasks.push({id:q.id,lesson:l,kind:q.kind,status:'passed'});
 await part(p,'translation');await p.locator('#student-name').fill('KIỂM THỬ / 测试');await p.locator('#student-class').fill('I1-'+l);
 const answers={};for(const [i,q] of L.translation.entries()){answers[q.id]=`测试第${l}课，第${i+1}题。\n  Học tiếng Trung — giữ nguyên  。`;await p.locator('#input-'+q.id).fill(answers[q.id]);}
 await submit(p);assert.doesNotMatch(await p.locator('#submitted-result').innerText(),/\d+\/5 câu đúng/);
 await p.locator('[data-receipt]').click();assert.equal(await p.locator('#exercise').isVisible(),false,'Receipt mode must hide the homework page');assert.equal(await p.locator('.s1-receipt-item').count(),5);
 for(const [i,q] of L.translation.entries()){assert.equal(await p.locator('.s1-written-answer').nth(i).textContent(),answers[q.id]);report.tasks.push({id:q.id,lesson:l,kind:q.kind,status:'passed'});}
 assert.match(await p.locator('#receipt').innerText(),/Không chấm điểm/);await screenshot(p,`receipt-lesson-${l}`);
 await p.locator('[data-close-receipt]').click();await saved(p);
 const st=await state(p,E2.KEY),t=E2.totals(st,l,L);assert.equal(t.homework.submitted,15);assert.equal(t.automatic.firstCorrect,9);assert.equal(t.automatic.submitted,10);assert.equal(t.manual.submitted,5);
 await p.reload({waitUntil:'domcontentloaded'});await homeworkReady(p);assert.equal(await p.locator('#stages [aria-current="step"]').getAttribute('data-stage'),'translation');
}
async function play(p,id){
 const audio=p.locator('#lesson-audio');await p.locator('#play-audio').click();
 const expected=C.listening.find(q=>q.id===id),timeout=Math.ceil((expected.audio.end-expected.audio.start)*1600+10000);
 await p.waitForFunction(()=>{const a=document.getElementById('lesson-audio');return a&&a.ended&&Number.isFinite(a.duration)&&a.duration>0;},null,{timeout});
 const record=await audio.evaluate(a=>({id:a.dataset.mediaId,duration:a.duration,time:a.currentTime,ended:a.ended,rate:a.playbackRate,src:a.getAttribute('src')}));
 assert.equal(record.id,id);assert.equal(record.ended,true);assert.ok(record.src.startsWith('data:audio/'));
 const bytes=Buffer.from(record.src.split(',')[1],'base64'),hash=require('node:crypto').createHash('sha256').update(bytes).digest('hex');
 const expectedMedia=await p.evaluate(id=>window.HSKStep3MediaIndex.clips[id],id);
 assert.equal(hash,expectedMedia.sha256);delete record.src;record.sha256=hash;record.bytes=bytes.length;report.media.push(record);
}
async function doListening(p,l){
 await open(p,`learning.html?mode=listening&lesson=${l}`);await p.locator('#start-listening').waitFor();await p.locator('#start-listening').click();await p.locator('#listening-question').waitFor();
 await p.locator('#audio-rate').selectOption('1.5');
 for(let i=0;i<5;i++){
  const id=await p.locator('#listening-question').getAttribute('data-question-id'),q=C.listening.find(q=>q.id===id);assert.equal(q.lesson,l);assert.equal(await p.locator('#listen-transcript').count(),0);
  await play(p,id);await p.locator(`[data-listen-option="${(q.answer+(i===0?1:0))%4}"]`).click();await p.locator('#listen-submit').click();await p.locator('#listening-feedback').waitFor();assert.equal(await p.locator('#listen-transcript').count(),1);
  report.tasks.push({id,lesson:l,kind:'listening',status:'passed'});if(i<4)await p.locator('#listen-next').click();
 }
 assert.equal(await p.locator('#listen-summary').getAttribute('data-answered'),'5');assert.equal(await p.locator('#listen-summary').getAttribute('data-correct'),'4');
}
async function backup(p,isMedia,name){await p.locator('#backup-details').evaluate(el=>el.open=true);const wait=p.waitForEvent('download');await p.locator('#export-backup').click();const d=await wait,dest=file(name+'.json');await d.saveAs(dest);return dest;}
async function importBackup(p,filename,isMedia=false){
 await p.locator('#backup-details').evaluate(el=>el.open=true);await p.locator('#backup-file').setInputFiles(filename);
 if(!isMedia){await p.waitForFunction(()=>document.getElementById('backup-result').textContent.includes('Đã đọc tệp'));await p.locator('#inspect-backup').click();}
 await p.locator('#apply-backup').waitFor();await p.locator('#apply-backup').click();
}
(async()=>{
 server=spawn(process.execPath,[path.resolve('tools/serve-integration-step1.cjs')],{env:{...process.env,HSK_STAGE41_PORT:String(PORT)},stdio:['ignore','pipe','pipe']});report.serverLog='';server.stdout.on('data',b=>report.serverLog+=b);server.stderr.on('data',b=>report.serverLog+=b);
 for(let n=0;n<60;n++){try{if((await fetch(BASE+'learning.html')).ok)break;}catch{}await delay(100);if(n===59)throw new Error('preview not ready');}
 browser=await playwright[BROWSER].launch({headless:true});report.browserVersion=browser.version();const main=await newContext();page=await main.newPage();
 for(let l=1;l<=8;l++)await check(`Lesson ${l}: 15 homework tasks, validation, score, receipt and refresh`,()=>doHomework(page,l));
 const originalHomework=await page.evaluate(k=>localStorage.getItem(k),E2.KEY);
 for(let l=1;l<=8;l++)await check(`Lesson ${l}: 5 actual audio questions and feedback`,()=>doListening(page,l));
 await check('160 unique tasks, separated scores, live summary and all 15 course links',async()=>{
  assert.equal(new Set(report.tasks.map(q=>q.id)).size,160);assert.equal(report.media.length,40);assert.equal(await page.evaluate(k=>localStorage.getItem(k),E2.KEY),originalHomework);
  const s3=await state(page,E3.KEY);assert.equal(E3.listeningSummary(s3,C).overall.firstCorrect,32);
  await open(page,'learning.html?mode=progress&lesson=8&intent=resume');await page.locator('.integrated-progress-table').waitFor();assert.match(await page.locator('#integratedMiniProgress').innerText(),/160\/300.*8\/15/);assert.equal(await page.locator('.integrated-progress-table tbody tr').count(),15);
  await screenshot(page,'progress');await open(page,'index.html');await page.locator('#learningModuleLinks').waitFor();assert.match(await page.locator('#learningModuleProgress').innerText(),/160\/300/);assert.equal(await page.locator('.learning-card-actions').count(),15);
  for(let l=1;l<=15;l++){await open(page,`lesson.html?id=${l}&sec=vocab`);await page.locator('#learningModuleLinks').waitFor();assert.equal(await page.locator(`#learningModuleLinks a[href*="mode=homework"][href*="lesson=${l}"]`).count(),1);}
 });
 await check('Homework: complete 0/5 redo does not relock or replace first score',async()=>{
  await open(page,'learning.html?mode=homework&lesson=8&stage=choice');await homeworkReady(page);await page.locator('[data-restart]').click();await choose(page,BANK[7],5);await submit(page);
  const t=E2.totals(await state(page,E2.KEY),8,BANK[7]);assert.equal(t.automatic.firstCorrect,9);assert.equal(t.automatic.latestCorrect,5);assert.equal(await page.locator('#stages [data-stage="translation"]').isDisabled(),false);
 });
 await check('Translation: long draft, last submitted receipt, reload and no automatic judgment',async()=>{
  await part(page,'translation');await page.locator('[data-restart]').click();const q=BANK[7].translation[0],value='  中文越文 đặng — <b>原文</b>\n'.repeat(90);
  await page.locator('#input-'+q.id).fill(value);await saved(page);await page.locator('[data-receipt]').click();assert.doesNotMatch(await page.locator('#receipt').innerText(),/đặng/);await page.locator('[data-close-receipt]').click();await page.reload({waitUntil:'domcontentloaded'});await homeworkReady(page);assert.equal(await page.locator('#input-'+q.id).inputValue(),value);assert.equal(await page.locator('#exercise .la-feedback').count(),0);
 });
 await check('Mixed course selection and frozen review queue survive navigation and reload',async()=>{
  await page.locator('#integratedNav [data-mode="vocab"]').click();await page.locator('#start-review').waitFor();await page.locator('#clear-lessons').click();for(const n of [3,6])await page.locator(`#lesson-checks [data-lesson="${n}"]`).check();await page.locator('#start-review').click();await page.locator('#review-card').waitFor();
  await page.locator('#reveal-card').click();await page.locator('[data-rating="good"]').click();const before=await state(page,E3.KEY);assert.deepEqual(before.preferences.lessons,[3,6]);
  await page.locator('#integratedNav [data-mode="homework"]').click();await homeworkReady(page);assert.match(page.url(),/lesson=8/);assert.match(await page.locator('#input-'+BANK[7].translation[0].id).inputValue(),/đặng/);await page.locator('#integratedNav [data-mode="vocab"]').click();await page.locator('#review-card').waitFor();
  let after=await state(page,E3.KEY);assert.deepEqual(after.preferences.lessons,[3,6]);assert.deepEqual(after.cards,before.cards);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#review-card').waitFor();after=await state(page,E3.KEY);assert.deepEqual(after.cards,before.cards);
  await page.locator('#module-listening').click();assert.equal(await page.locator('#integratedNav [aria-current="page"]').getAttribute('data-mode'),'listening');assert.match(page.url(),/mode=listening/);await page.locator('#module-vocabulary').click();assert.equal(await page.locator('#integratedNav [aria-current="page"]').getAttribute('data-mode'),'vocab');
 });
 let hfile,mfile;
 await check('Nonempty homework and media backup files restore in a fresh browser context',async()=>{
  mfile=await backup(page,true,'media-backup');await page.locator('#integratedNav [data-mode="homework"]').click();await homeworkReady(page);hfile=await backup(page,false,'homework-backup');
  const c=await newContext(),p=await c.newPage();await open(p,'learning.html?mode=homework&lesson=8');await homeworkReady(p);await importBackup(p,hfile);await saved(p);assert.equal(E2.courseTotals(await state(p,E2.KEY),BANK).homework.submitted,120);
  const hw=await p.evaluate(k=>localStorage.getItem(k),E2.KEY);await open(p,'learning.html?mode=vocab&lesson=8&intent=resume');await p.locator('#start-review').waitFor();await importBackup(p,mfile,true);
  assert.equal(E3.listeningSummary(await state(p,E3.KEY),C).overall.answered,40);assert.equal(await p.evaluate(k=>localStorage.getItem(k),E2.KEY),hw);assert.deepEqual((await state(p,E3.KEY)).preferences.lessons,[3,6]);
 });
 await check('Wrong-app backup and damaged JSON do not replace homework',async()=>{
  await page.locator('#backup-details').evaluate(el=>el.open=true);const before=await page.evaluate(k=>localStorage.getItem(k),E2.KEY);
  await page.locator('#backup-input').fill('{bad json');await page.locator('#inspect-backup').click();assert.equal(await page.locator('#apply-backup').count(),0);
  await page.locator('#backup-file').setInputFiles(mfile);await page.waitForFunction(()=>document.getElementById('backup-result').textContent.includes('Đã đọc tệp'));await page.locator('#inspect-backup').click();assert.equal(await page.locator('#apply-backup').count(),0);assert.equal(await page.evaluate(k=>localStorage.getItem(k),E2.KEY),before);
 });
 await check('A backup preview cannot overwrite edits made after inspection',async()=>{
  await page.locator('#backup-file').setInputFiles(hfile);await page.waitForFunction(()=>document.getElementById('backup-result').textContent.includes('Đã đọc tệp'));await page.locator('#inspect-backup').click();await page.locator('#apply-backup').waitFor();
  await part(page,'translation');await page.locator('#input-'+BANK[7].translation[0].id).fill('检查以后新增的草稿。');await saved(page);const before=await page.evaluate(k=>localStorage.getItem(k),E2.KEY);await page.locator('#apply-backup').click();assert.match(await page.locator('#backup-result').innerText(),/thay đổi/);assert.equal(await page.evaluate(k=>localStorage.getItem(k),E2.KEY),before);
 });
 await check('Two genuine tabs keep both drafts rather than silently overwriting',async()=>{
  const second=await main.newPage();await open(second,'learning.html?mode=homework&lesson=8');await homeworkReady(second);const q=BANK[7].translation[1];
  await page.locator('#input-'+q.id).fill('第一标签页的新增内容。');await saved(page);await second.locator('#storage-sync').waitFor();const stored=await page.evaluate(k=>localStorage.getItem(k),E2.KEY);
  await second.locator('#input-'+q.id).fill('第二标签页保留的不同草稿。');await delay(300);assert.equal(await second.evaluate(k=>localStorage.getItem(k),E2.KEY),stored);await backup(second,false,'tab-conflict-backup');await second.close();
 });
 await check('Nonempty legacy v2 data stays archived and never completes new free translation',async()=>{
  const oldContext={};oldContext.window=oldContext;vm.createContext(oldContext);for(const f of ['learning-bank.js','learning-engine.js'])vm.runInContext(fs.readFileSync('new-hsk1/hsk1/'+f,'utf8'),oldContext);
  const oldE=oldContext.HSKLearnEngine,oldBank=oldContext.HSK1_NEW_BANK;assert.ok(oldE&&oldBank);
  const old=oldE.blank(),L=oldBank.find(x=>x.lesson===3);for(const k of ['choice','sort','translation']){for(const q of L[k])oldE.group(old,3,k).draft[q.id]=k==='sort'?order(q):q.answer;assert.equal(oldE.submit(old,3,k,L[k]).ok,true);}
  const c=await newContext();await c.addInitScript(({key,raw})=>{if(location.protocol!=='http:')return;localStorage.getItem(key)||localStorage.setItem(key,raw);},{key:'ran_hsk1_learning_v2',raw:JSON.stringify(old)});const p=await c.newPage();await open(p,'learning.html?mode=homework&lesson=3');await homeworkReady(p);
  const migrated=await state(p,E2.KEY);assert.equal(migrated.archive.migration.sourceSchema,2);assert.equal(migrated.lessons[3]?.translation?.completed||false,false);assert.deepEqual(await state(p,'ran_hsk1_learning_v2'),clone(old));
 });
 await check('Nonempty approved Lesson 3 sample is retained ahead of older legacy records',async()=>{
  const old=E1.blank();for(const k of ['choice','sort','translation']){for(const q of SAMPLE[k])E1.group(old,3,k).draft[q.id]=k==='translation'?'样板原始译文。':k==='sort'?order(q):q.answer;assert.equal(E1.submit(old,3,k,SAMPLE[k]).ok,true);}
  const c=await newContext();await c.addInitScript(({old,key})=>{if(location.protocol!=='http:')return;if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(old));if(!localStorage.getItem('ran_hsk1_learning_v2'))localStorage.setItem('ran_hsk1_learning_v2',JSON.stringify({schema:2,lessons:{},preferences:{},words:{}}));},{old,key:E2.STEP1_KEY});const p=await c.newPage();await open(p,'learning.html?mode=homework&lesson=3');await homeworkReady(p);assert.equal(E2.totals(await state(p,E2.KEY),3,BANK[2]).manual.submitted,5);
 });
 await check('320 / 390 / 768 / 1104 layouts and free-text wrapping',async()=>{
  for(const width of [320,390,768,1104]){
   await page.setViewportSize({width,height:900});await open(page,'learning.html?mode=homework&lesson=8&intent=resume');await homeworkReady(page);await part(page,'translation');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'homework overflow '+width);await screenshot(page,'translation-'+width,false);
   await page.locator('[data-receipt]').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'receipt overflow '+width);await screenshot(page,'receipt-'+width);await page.locator('[data-close-receipt]').click();
   await open(page,'learning.html?mode=listening&lesson=8&intent=resume');await page.locator('#start-listening').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'listening overflow '+width);await screenshot(page,'listening-'+width,false);
   await open(page,'learning.html?mode=progress&lesson=8');await page.locator('.integrated-progress-table').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'progress overflow '+width);
  }
 });
 await require('./integration-step1-extra.cjs')({assert,fs,path,check,page,newContext,open,homeworkReady,saved,state,order,choose,sort,submit,part,screenshot,backup,importBackup,delay,BASE,OUT,file,E1,E2,E3,BANK,C,report});
 await check('No uncaught application errors or failed same-origin resources',async()=>{assert.deepEqual(report.errors,[]);assert.deepEqual(report.network,[]);});
 report.passed=true;report.completedAt=new Date().toISOString();console.log(JSON.stringify({passed:true,checks:report.checks.length,tasks:report.tasks.length,media:report.media.length,browser:BROWSER}));
})().catch(async e=>{report.error=e.stack;console.error(e);if(page&&!page.isClosed())try{await screenshot(page,'failure',false);}catch{}process.exitCode=1;}).finally(async()=>{
 clearTimeout(hardTimer);for(const c of contexts)try{await c.close();}catch{}if(browser)try{await browser.close();}catch{}if(server)server.kill('SIGTERM');report.completedAt=new Date().toISOString();persist();
});
