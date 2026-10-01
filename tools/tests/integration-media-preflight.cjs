'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),assert=require('node:assert/strict'),pw=require('playwright');
const kind=process.env.HSK_BROWSER||'chromium',port=18769,base=`http://127.0.0.1:${port}/hsk-hub/new-hsk1/hsk1/`,out=`tools/tests/results/integration-final-${kind}-media-preflight.json`;
const result={browser:kind,startedAt:new Date().toISOString(),plays:[],passed:false};
let server,browser,page;const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 server=spawn(process.execPath,['tools/serve-integration-step1.cjs'],{env:{...process.env,HSK_STAGE41_PORT:String(port)},stdio:'ignore'});
 for(let i=0;i<60;i++){try{if((await fetch(base+'index.html')).ok)break;}catch{}await delay(100);}
 browser=await pw[kind].launch({headless:true});const context=await browser.newContext();
 await context.route('**/*',r=>r.request().url().startsWith(`http://127.0.0.1:${port}/`)?r.continue():r.fulfill({status:200,contentType:'text/javascript',body:''}));page=await context.newPage();page.setDefaultTimeout(15000);
 for(const lesson of [3,14]){
  await page.goto(base+`lesson.html?id=${lesson}&sec=text`,{waitUntil:'domcontentloaded'});
  if(await page.locator('#pwOverlay').isVisible()){await page.locator('#pwInput').fill('Ranlaoshimeimei');await page.locator('#pwBtn').click();}
  await page.locator('#sceneTabs .scene-tab[data-i="1"]').click();
  const count=await page.locator('#scenePane .speak-line').count();assert.equal(count,lesson===3?4:5);
  for(let i=0;i<count;i++){
   await page.locator('#scenePane .speak-line').nth(i).click();
   await page.waitForFunction(()=>{const d=window.HSK1_OFFICIAL_AUDIO.diagnostics();return d.playing||d.error;});
   const start=await page.evaluate(()=>window.HSK1_OFFICIAL_AUDIO.diagnostics());assert.equal(start.error,'');assert.equal(start.activeTrack,lesson+'-3');assert.ok(Math.abs(start.mediaCurrentTime-start.range[0])<.75,JSON.stringify(start));
   await page.waitForFunction(()=>window.HSK1_OFFICIAL_AUDIO.diagnostics().endedByRange,null,{timeout:Math.ceil((start.range[1]-start.range[0])*1000+6000)});
   const end=await page.evaluate(()=>window.HSK1_OFFICIAL_AUDIO.diagnostics());assert.ok(Math.abs(end.finishedAt-start.range[1])<.35,JSON.stringify(end));result.plays.push({lesson,line:i+1,start,end});
  }
 }
 result.passed=true;
})().catch(async e=>{result.error=e.stack;if(page)result.diagnostic=await page.evaluate(()=>window.HSK1_OFFICIAL_AUDIO?.diagnostics()).catch(()=>null);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.kill('SIGTERM');result.finishedAt=new Date().toISOString();fs.mkdirSync('tools/tests/results',{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));});
