const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const path=require('node:path');
const PORT=Number(process.env.HSK_STAGE41_PORT||18768);
const BASE='http://127.0.0.1:'+PORT+'/hsk1/';
const PASSWORD='Ranlaoshimeimei';
const HARD_TIMER=setTimeout(()=>{console.error('STAGE41_HARD_TIMEOUT');process.exit(124);},8*60*1000);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,[path.resolve('tools/serve-stage4-1.cjs')],{env:{...process.env,HSK_STAGE41_PORT:String(PORT)},stdio:['ignore','pipe','pipe']});
let serverLog='';server.stdout.on('data',d=>serverLog+=d);server.stderr.on('data',d=>serverLog+=d);
async function waitServer(){for(let i=0;i<50;i++){try{const r=await fetch(BASE+'learning.html');if(r.ok)return;}catch(_e){}await sleep(100);}throw new Error('preview server did not start\n'+serverLog);}
async function login(page){
  const overlay=page.locator('#pwOverlay');
  if(await overlay.isVisible().catch(()=>false)){await page.locator('#pwInput').fill(PASSWORD);await page.locator('#pwBtn').click();await overlay.waitFor({state:'hidden'});}
}
async function goodOrder(page,lesson,qid){
  return page.evaluate(({lesson,qid})=>{
    const q=window.HSKStep2Bank.find(x=>x.id===lesson).sort.find(x=>x.id===qid),E=window.HSKStep2Engine;
    const target=E.normal(q.answers[0]),tokenText=q.tokens.map(t=>E.normal(t));
    function walk(prefix,left,built){
      if(!left.length)return built===target?prefix:null;
      for(let p=0;p<left.length;p++){
        const idx=left[p],next=built+tokenText[idx];
        if(!target.startsWith(next))continue;
        const found=walk(prefix.concat(idx),left.slice(0,p).concat(left.slice(p+1)),next);
        if(found)return found;
      }
      return null;
    }
    const order=walk([],Array.from({length:q.tokens.length},(_,i)=>i),'');
    if(!order||!E.check(q,order))throw new Error('no accepted order '+qid);
    return order;
  },{lesson,qid});
}
async function doHomework(page,lesson,makeLowScore){
  await page.goto(BASE+'learning.html?mode=homework&lesson='+lesson,{waitUntil:'domcontentloaded'});await login(page);
  await page.locator('#exercise').waitFor();
  assert.equal(await page.locator('textarea.s1-translation').count(),0);
  const choice=await page.evaluate(l=>window.HSKStep2Bank.find(x=>x.id===l).choice.map(q=>({id:q.id,answer:q.answer})),lesson);
  for(let i=0;i<choice.length;i++){
    let answer=choice[i].answer;if(makeLowScore&&i===0)answer=(answer+1)%4;
    await page.locator('[data-option="'+choice[i].id+'"][data-index="'+answer+'"]').click();
  }
  await page.locator('#submit-group').click();await page.locator('#submitted-result').waitFor();
  const choiceScore=await page.locator('#submitted-result').innerText();
  if(makeLowScore)assert.match(choiceScore,/4\/5/);else assert.match(choiceScore,/5\/5/);
  const sortStage=page.locator('button[data-stage="sort"]');assert.equal(await sortStage.isDisabled(),false,'sort must unlock on submission, not score');await sortStage.click();
  const sorts=await page.evaluate(l=>window.HSKStep2Bank.find(x=>x.id===l).sort.map(q=>q.id),lesson);
  for(const qid of sorts){const order=await goodOrder(page,lesson,qid);for(const idx of order)await page.locator('[data-token="'+qid+'"][data-index="'+idx+'"]').click();}
  await page.locator('#submit-group').click();await page.locator('#submitted-result').waitFor();
  assert.match(await page.locator('#submitted-result').innerText(),/5\/5/);
  const transStage=page.locator('button[data-stage="translation"]');assert.equal(await transStage.isDisabled(),false);await transStage.click();
  const translations=await page.evaluate(l=>window.HSKStep2Bank.find(x=>x.id===l).translation.map(q=>q.id),lesson);
  assert.equal(translations.length,5);
  for(let i=0;i<translations.length;i++)await page.locator('#input-'+translations[i]).fill('学生作答 '+lesson+'-'+(i+1)+'。\n第二行保留。');
  await page.locator('#submit-group').click();await page.locator('#submitted-result').waitFor();
  const text=await page.locator('#submitted-result').innerText();assert.match(text,/5 câu dịch/);assert.doesNotMatch(text,/\d+\/5 câu đúng/);
  await page.locator('[data-receipt]').click();assert.equal(await page.locator('.s1-receipt-item').count(),5);assert.match(await page.locator('#receipt').innerText(),/Không chấm điểm/);await page.locator('[data-close-receipt]').click();
  const totals=await page.evaluate(l=>{const E=window.HSKStep2Engine,B=window.HSKStep2Bank,s=E.validateImport(JSON.parse(localStorage.getItem(E.KEY)),B);return E.totals(s,l,B.find(x=>x.id===l));},lesson);
  assert.equal(totals.homework.submitted,15);assert.equal(totals.manual.submitted,5);assert.equal(totals.automatic.submitted,10);
  return {lesson,choiceScore:totals.automatic.firstCorrect,submitted:15};
}
async function doListening(page,lesson){
  await page.goto(BASE+'learning.html?mode=listening&lesson='+lesson,{waitUntil:'domcontentloaded'});await login(page);
  await page.locator('#start-listening').waitFor();
  await page.locator('#audio-rate').selectOption('1.5');
  await page.locator('#start-listening').click();await page.locator('#listening-question').waitFor();
  for(let i=0;i<5;i++){
    const qid=await page.locator('#listening-question').getAttribute('data-question-id');
    const qLesson=await page.evaluate(id=>window.HSKStep3Catalog.listening.find(q=>q.id===id).lesson,qid);assert.equal(qLesson,lesson);
    assert.equal(await page.locator('#listen-transcript').count(),0,'transcript must be hidden before submission');
    await page.locator('#play-audio').click();
    await page.waitForFunction(()=>{const a=document.getElementById('lesson-audio');return !!a&&Number.isFinite(a.duration)&&a.duration>0&&a.ended;},null,{timeout:12000});
    const answer=await page.evaluate(id=>window.HSKStep3Catalog.listening.find(q=>q.id===id).answer,qid);
    await page.locator('[data-listen-option="'+answer+'"]').click();await page.locator('#listen-submit').click();await page.locator('#listening-feedback').waitFor();
    assert.equal(await page.locator('#listen-transcript').count(),1);
    if(i<4)await page.locator('#listen-next').click();
  }
  const summary=await page.evaluate(()=>{const E=window.HSKStep3Engine,C=window.HSKStep3Catalog,s=E.importBackup(JSON.parse(localStorage.getItem(E.KEY)),C);return E.listeningSummary(s,C);});
  const lessonAnswered=await page.evaluate(l=>{const E=window.HSKStep3Engine,C=window.HSKStep3Catalog,s=E.importBackup(JSON.parse(localStorage.getItem(E.KEY)),C);return C.listening.filter(q=>q.lesson===l&&s.listening.records[q.id]).length;},lesson);
  assert.equal(lessonAnswered,5);
  return {lesson,answered:5,overall:summary.overall.answered};
}
async function mobileCheck(page,url,selector,shot){
  await page.setViewportSize({width:390,height:844});await page.goto(url,{waitUntil:'domcontentloaded'});await login(page);await page.locator(selector).waitFor();
  const dims=await page.evaluate(()=>({innerWidth:window.innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert.ok(dims.scrollWidth<=dims.innerWidth+1,'horizontal overflow '+JSON.stringify(dims));
  if(shot)await page.screenshot({path:'tools/tests/results/'+shot,fullPage:false});
  await page.setViewportSize({width:1104,height:900});
}
(async()=>{
  await waitServer();
  const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1104,height:900}});const page=await context.newPage();
  const errors=[],failures=[];page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>failures.push({url:r.url(),error:r.failure()?.errorText}));
  const homework=[];for(let l=1;l<=4;l++){console.log('STAGE41 homework lesson',l);homework.push(await doHomework(page,l,l===4));console.log('STAGE41 homework done',l);}
  const stage2Before=await page.evaluate(()=>localStorage.getItem('ran_hsk1_stage2_v3'));
  const listening=[];for(let l=1;l<=4;l++){console.log('STAGE41 listening lesson',l);listening.push(await doListening(page,l));console.log('STAGE41 listening done',l);}
  const stage2After=await page.evaluate(()=>localStorage.getItem('ran_hsk1_stage2_v3'));assert.equal(stage2After,stage2Before,'stage3 listening must not mutate stage2 homework state');
  const states=await page.evaluate(()=>({s2:JSON.parse(localStorage.getItem('ran_hsk1_stage2_v3')),s3:JSON.parse(localStorage.getItem('ran_hsk1_stage3_v1'))}));
  assert.equal(states.s2.app,'hsk1-stage2');assert.equal(states.s3.app,'hsk1-stage3');
  await page.goto(BASE+'learning.html?mode=progress&lesson=4',{waitUntil:'domcontentloaded'});await login(page);await page.locator('.integrated-progress-table').waitFor();
  assert.match(await page.locator('#integratedMiniProgress').innerText(),/80\/300/);assert.match(await page.locator('#integratedMiniProgress').innerText(),/4\/15/);
  const table=await page.locator('.integrated-progress-table').innerText();for(let l=1;l<=4;l++){assert.match(table,new RegExp('Bài '+l));}
  await page.screenshot({path:'tools/tests/results/stage4-1-progress-desktop.png',fullPage:false});
  await mobileCheck(page,BASE+'learning.html?mode=homework&lesson=1','#exercise','stage4-1-homework-390.png');
  await mobileCheck(page,BASE+'learning.html?mode=listening&lesson=1','#stage3Module','stage4-1-listening-390.png');
  await page.goto(BASE+'index.html',{waitUntil:'domcontentloaded'});await login(page);await page.locator('#learningModuleLinks').waitFor();assert.match(await page.locator('#learningModuleProgress').innerText(),/80\/300/);
  await page.goto(BASE+'lesson.html?id=1&sec=vocab',{waitUntil:'domcontentloaded'});await login(page);await page.locator('#learningModuleLinks').waitFor();assert.equal(await page.locator('a[href*="mode=homework"][href*="lesson=1"]').count()>0,true);
  const legacyContext=await browser.newContext({viewport:{width:1104,height:900}});
  await legacyContext.addInitScript(()=>{localStorage.setItem('ran_hsk1_learning_v2',JSON.stringify({schema:2,lessons:{},preferences:{},words:{}}));});
  const legacyPage=await legacyContext.newPage();await legacyPage.goto(BASE+'learning.html?mode=homework&lesson=1',{waitUntil:'domcontentloaded'});await login(legacyPage);await legacyPage.locator('#exercise').waitFor();
  const migration=await legacyPage.evaluate(()=>({old:localStorage.getItem('ran_hsk1_learning_v2'),next:JSON.parse(localStorage.getItem('ran_hsk1_stage2_v3'))}));
  assert.ok(migration.old);assert.equal(migration.next.app,'hsk1-stage2');assert.equal(migration.next.archive.migration.sourceSchema,2);assert.equal(migration.next.lessons[1]?.translation?.completed||false,false);
  await legacyContext.close();
  assert.equal(errors.length,0,'page errors: '+errors.join('\n'));
  const unexpected=failures.filter(x=>!x.url.includes('fonts.googleapis.com')&&!x.url.includes('fonts.gstatic.com'));assert.equal(unexpected.length,0,'network failures: '+JSON.stringify(unexpected));
  const result={passed:true,homework,listening,totalTasksExercised:80,homeworkTasks:60,listeningTasks:20,stage2UnaffectedByListening:stage2After===stage2Before,progress:'80/300 · 4/15',viewports:[390,1104],pageErrors:errors,networkFailures:unexpected,completedAt:new Date().toISOString(),serverLog};
  require('fs').mkdirSync('tools/tests/results',{recursive:true});require('fs').writeFileSync('tools/tests/results/stage4-1-browser.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
  await context.close();await browser.close();clearTimeout(HARD_TIMER);
})().catch(async e=>{console.error(e);process.exitCode=1;}).finally(()=>{server.kill('SIGTERM');});
