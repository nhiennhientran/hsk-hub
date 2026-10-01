'use strict';
// Focused regression for unchanged state notifications. The full UI suite still
// performs real rapid lesson selection; this checks the precise event boundary.
const {spawn}=require('node:child_process'),fs=require('node:fs'),assert=require('node:assert/strict'),pw=require('playwright');
const kind=process.env.HSK_BROWSER||'chromium',port=18770,base=`http://127.0.0.1:${port}/hsk-hub/new-hsk1/hsk1/`;
const report={browser:kind,startedAt:new Date().toISOString(),passed:false,errors:[]};let server,browser;
(async()=>{
 server=spawn(process.execPath,['tools/serve-integration-step1.cjs'],{env:{...process.env,HSK_STAGE41_PORT:String(port)},stdio:'ignore'});
 for(let i=0;i<50;i++){try{if((await fetch(base+'index.html')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await pw[kind].launch({headless:true});const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(base+'learning.html?mode=vocab&lesson=3',{waitUntil:'domcontentloaded'});await page.locator('#pwInput').fill('Ranlaoshimeimei');await page.locator('#pwBtn').click();await page.locator('#start-review').waitFor();
 report.observed=await page.evaluate(()=>{
  const preferences={module:'vocabulary',lessons:[3,6],vocabularyFilter:'all'};
  const fire=()=>window.dispatchEvent(new CustomEvent('hsk-learning-state',{detail:{app:'hsk1-stage3',preferences}}));
  fire();const before=location.href;let calls=0;const original=history.replaceState;
  history.replaceState=function(...args){calls++;return original.apply(this,args)};
  for(let i=0;i<500;i++)fire();
  const sameRouteCalls=calls;preferences.module='listening';fire();const changed=location.href;
  history.replaceState=original;
  return {before,changed,sameRouteCalls,totalCalls:calls,iterations:500};
 });
 assert.equal(report.observed.sameRouteCalls,0);assert.equal(report.observed.totalCalls,1);assert.match(report.observed.changed,/mode=listening/);assert.deepEqual(report.errors,[]);report.passed=true;
})().catch(e=>{report.error=e.stack;process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server?.kill('SIGTERM');report.finishedAt=new Date().toISOString();fs.mkdirSync('tools/tests/results',{recursive:true});fs.writeFileSync(`tools/tests/results/integration-final-${kind}-router-preflight.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));});
