/* Browser integration checks in an isolated local test browser.
   Uses terminal.local, the repository's existing development hostname.
   Start a static server on 8765, then run with PILOT_CHROME_PATH set.
   Does not change the production password gate or use any credentials. */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const playwright=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const bank=require('./pilot9-data.js');
const URL='http://terminal.local:8765/new-hsk1/hsk1/lesson9-pilot.html?id=9&sec=practice';
const out=path.join(__dirname,'pilot9-review');fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[];
const mark=name=>{checks.push(name);console.log('PASS '+name);};
async function run(){
 const browser=await playwright.chromium.launch({executablePath:process.env.PILOT_CHROME_PATH,headless:true,args:['--host-resolver-rules=MAP terminal.local 127.0.0.1']});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(URL,{waitUntil:'domcontentloaded'});await page.locator('#pilot9Homework').waitFor();
  assert.equal(await page.locator('#pwOverlay').isVisible(),false);
  assert.equal(await page.locator('#pilot9Homework .p9-group-btn').count(),6);
  assert.equal(await page.locator('#pilot9Homework .p9-group-btn:disabled').count(),5);
  await page.locator('#pilot9Homework [data-p9-action="submit"]').click();
  assert.match(await page.locator('#pilot9Homework [role="alert"]').innerText(),/hoàn thành đủ 5/);
  assert.equal(await page.locator('#pilot9Homework .p9-feedback').count(),0);
  assert.equal(await page.locator('#pilot9Homework .p9-group-btn:disabled').count(),5);
  mark('incomplete submission shows a helpful error and keeps later groups locked');
  const w1=bank.groups[0].questions[0];await page.locator(`[data-p9-panel="practice"] [data-p9-q="${w1.id}"] [data-option="${w1.options.indexOf(w1.answer)}"]`).click();
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator(`[data-p9-panel="practice"] [data-p9-q="${w1.id}"] [aria-pressed=true]`).count(),1);
  mark('draft answers survive a real page reload');
  async function choose(g,wrongFirst=false,panel='practice'){
   for(let i=0;i<g.questions.length;i++){const q=g.questions[i],pick=wrongFirst&&i===0?q.options.find(x=>x!==q.answer):q.answer;
    await page.locator(`[data-p9-panel="${panel}"] [data-p9-q="${q.id}"] [data-option="${q.options.indexOf(pick)}"]`).click();}
   await page.locator(`[data-p9-panel="${panel}"] [data-p9-action="submit"]`).click();
  }
  await choose(bank.groups[0]);assert.equal(await page.locator('#pilot9Homework .p9-feedback').count(),5);
  assert.match(await page.locator('#pilot9Homework .p9-result').innerText(),/5\/5/);mark('submission grades 5 questions and reveals Vietnamese explanations');
  await page.locator('#pilot9Homework [data-index="1"]').click();await choose(bank.groups[1],true);
  assert.match(await page.locator('#pilot9Homework .p9-result').innerText(),/4\/5/);
  await page.locator('#pilot9Homework [data-p9-action="retry"]').click();await choose(bank.groups[1]);
  assert.match(await page.locator('#pilot9Homework .p9-result').innerText(),/Lần đầu: 4\/5/);
  mark('wrong answers are explained, and retry keeps first and latest scores separate');
  await page.locator('.top-section-tabs [data-sec="listening"]').click();
  assert.equal(await page.locator('#pilot9Listening .p9-model').count(),0);
  for(const q of bank.groups[2].questions){
   const row=page.locator(`#pilot9Listening [data-p9-q="${q.id}"]`);
   await row.locator('[data-p9-speed]').selectOption('0.8');await row.locator('[data-p9-action="play"]').click();
   const audio=row.locator('audio[data-p9-listening]');await audio.waitFor({state:'attached'});
   await page.waitForFunction(id=>{const a=document.querySelector(`#pilot9Listening audio[data-p9-listening="${id}"]`);return a&&a.readyState>=2&&!a.paused&&a.currentTime>0;},q.id);
   const playback=await audio.evaluate(a=>({time:a.currentTime,rate:a.playbackRate,duration:a.duration}));
   assert.equal(playback.rate,0.8);assert(playback.time>=q.audio.start-0.05&&playback.time<q.audio.end);
   await row.locator('[data-p9-action="play"]').click();assert.equal(await row.locator('audio').count(),0);
  }
  mark('all 5 original listening clips actually load, seek, play at 0.8×, and stop');
  const clip=bank.groups[2].questions[0];const clipRow=page.locator(`#pilot9Listening [data-p9-q="${clip.id}"]`);
  await clipRow.locator('[data-p9-speed]').selectOption('1');await clipRow.locator('[data-p9-action="play"]').click();
  await page.waitForFunction(id=>document.querySelector(`#pilot9Listening [data-p9-audio-status="${id}"]`)?.textContent.includes('Đã nghe xong'),clip.id,{timeout:10000});
  mark('clip playback stops at the configured sentence boundary');
  await choose(bank.groups[2],false,'listening');
  assert.equal(await page.locator('#pilot9Listening .p9-feedback').count(),5);
  assert.match(await page.locator('#pilot9Listening').innerText(),/学校前边有一家电影院/);
  await page.locator('.top-section-tabs [data-sec="practice"]').click();
  assert.match(await page.locator('#pilot9Homework .p9-stat').first().innerText(),/3\/6/);
  mark('listening hub and homework share one saved score without double counting');
  await page.locator('#pilot9Homework [data-index="3"]').click();await choose(bank.groups[3]);
  await page.locator('#pilot9Homework [data-index="4"]').click();
  for(const q of bank.groups[4].questions){
   for(let i=0;i<q.tokens.length;i++)await page.locator(`[data-p9-panel="practice"] [data-p9-q="${q.id}"] [data-p9-action="token"][data-token="${i}"]`).click();
  }
  await page.locator('[data-p9-panel="practice"] [data-p9-action="submit"]').click();
  assert.match(await page.locator('#pilot9Homework .p9-result').innerText(),/5\/5/);mark('all 5 sentence-ordering exercises can be completed by clicking');
  await page.locator('#pilot9Homework [data-index="5"]').click();
  for(const q of bank.groups[5].questions)await page.locator(`[data-p9-panel="practice"] [data-p9-q="${q.id}"] textarea`).fill(q.accepted[0]);
  await page.locator('[data-p9-panel="practice"] [data-p9-action="submit"]').click();
  const stats=await page.locator('#pilot9Homework .p9-stat').allTextContents();assert(stats[0].includes('6/6'));assert(stats[1].includes('29/30'));assert(stats[2].includes('30/30'));assert(stats[3].includes('30/30'));
  await page.reload({waitUntil:'domcontentloaded'});assert.match(await page.locator('.complete-card').innerText(),/30\/30/);
  mark('real completion reports 30 questions, 29 first-correct, and 30 latest-correct after refresh');
  await page.locator('.top-section-tabs [data-sec="vocab"]').click();
  assert.equal(await page.locator('.p9-word').count(),23);await page.locator('[data-p9-action="preset"][data-lessons="7,8,9"]').click();
  assert.equal(await page.locator('[data-p9-lesson]:checked').count(),3);
  assert((await page.locator('.p9-word').count())>23);
  await page.locator('[data-p9-search]').fill('ban ngay');assert.equal(await page.locator('.p9-word').count(),1);
  await page.locator('[data-p9-action="reveal"]').click();await page.locator('[data-p9-action="known"]').click();
  await page.locator('[data-p9-filter]').selectOption('known');assert.equal(await page.locator('.p9-word').count(),1);
  await page.reload({waitUntil:'domcontentloaded'});assert.equal(await page.locator('[data-p9-lesson]:checked').count(),3);
  mark('multi-lesson vocabulary, accent-insensitive search, known flags and selection persist');
  await page.locator('.top-section-tabs [data-sec="practice"]').click();
  const downloadPromise=page.waitForEvent('download');await page.locator('#pilot9Homework [data-p9-action="export"]').click();const download=await downloadPromise;
  const file=path.join(out,'test-progress.json');await download.saveAs(file);const exported=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(exported.bankVersion,bank.version);
  await page.locator('#pilot9Homework [data-p9-action="import"]').click();page.once('dialog',d=>d.accept());
  await page.locator('#pilot9Homework [data-p9-import]').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('.toast')?.textContent.includes('Đã nhập tiến độ'));
  assert.match(await page.locator('#pilot9Homework .p9-stat').first().innerText(),/6\/6/);
  mark('exported progress can be imported through the actual file input');
  await page.locator('#pilot9Homework [data-index="5"]').click();await page.locator('#pilot9Homework [data-p9-action="retry"]').click();
  for(const q of bank.groups[5].questions)await page.locator(`[data-p9-panel="practice"] [data-p9-q="${q.id}"] textarea`).fill(q.id==='9-t1'?'我将在明天上午于学校学习。':q.accepted[0]);
  await page.locator('[data-p9-panel="practice"] [data-p9-action="submit"]').click();assert.match(await page.locator('#pilot9Homework .p9-result').innerText(),/1 chờ đối chiếu/);
  await page.locator('.top-section-tabs [data-sec="review"]').click();assert.equal(await page.locator('#pilot9Review .p9-review-card').count(),1);
  mark('unrecognized translation is pending review, not falsely marked wrong, and appears in review');
  await page.locator('.top-section-tabs [data-sec="practice"]').click();await page.locator('#pilot9Homework [data-index="4"]').click();
  await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.locator('.mobile-section-tabs [data-sec="practice"]').click();
  const width=await page.evaluate(()=>({viewport:innerWidth,body:document.body.scrollWidth}));assert(width.body<=width.viewport+2,'mobile page overflows horizontally: '+JSON.stringify(width));
  await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
  mark('390px mobile layout has no horizontal overflow');
  await page.goto('http://terminal.local:8765/new-hsk1/hsk1/lesson.html?id=8&sec=practice',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#pilot9Homework').count(),0);assert.equal(await page.locator('#basicPractice .reviewed-card').count(),7);
  assert.equal(await page.locator('.section-tab[data-sec="listening"]').count(),0);
  mark('existing Lesson 8 keeps its original exercises and navigation');
  assert.deepEqual(errors,[]);mark('no uncaught JavaScript errors throughout the full exercise run');
  fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({passed:checks.length,checks,errors,viewportMobile:390},null,2));
  console.log(JSON.stringify({passed:checks.length,questions:30,errors}));
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
