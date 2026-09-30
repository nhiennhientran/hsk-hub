'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const {serve,launch,login}=require('./browser-support.cjs');
const out=process.env.HSK_TEST_OUTPUT||path.resolve(__dirname,'../../../tmp/browser-test');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const server=await serve(),browser=await launch(),context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.addInitScript(()=>{const OriginalAudio=window.Audio;window.__testAudioInstances=[];window.Audio=function(...args){const a=new OriginalAudio(...args);window.__testAudioInstances.push(a);return a;};window.Audio.prototype=OriginalAudio.prototype;});
 const page=await context.newPage(),errors=[],clips=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
 const snap=()=>page.evaluate(()=>{const a=window.__testAudioInstances[0];return {src:a.currentSrc,paused:a.paused,currentTime:a.currentTime,rate:a.playbackRate,readyState:a.readyState,duration:a.duration,error:a.error?.message||null};});
 async function playing(q){await page.waitForFunction(({start,track})=>{const a=window.__testAudioInstances[0];return a&&!a.paused&&a.currentTime>start+.025&&a.currentSrc.endsWith(`/audio/${track}.mp3`);},{start:q.audio.start,track:q.audio.track},{timeout:12000});}
 try{
  await page.goto(server.baseURL+'learning.html?mode=listening&lesson=1',{waitUntil:'domcontentloaded'});await login(page);const bank=await page.evaluate(()=>window.HSK1_NEW_BANK);assert.equal(bank.length,15);
  const q0=bank[0].listening[0];await page.locator('#listeningRate').selectOption('0.65');await page.locator(`[data-play="${q0.id}"]`).click();await playing(q0);assert.equal((await snap()).rate,.65);await page.locator('#playerPause').click();const paused=await snap();assert.equal(paused.paused,true);await page.waitForTimeout(250);assert.ok(Math.abs((await snap()).currentTime-paused.currentTime)<.06);await page.locator('#playerPause').click();await playing(q0);await page.locator('#playerRate').selectOption('1.25');assert.equal((await snap()).rate,1.25);await page.locator('#playerStop').click();assert.equal((await snap()).paused,true);assert.equal(await page.locator('#learningPlayer').isVisible(),false);checks.push('slow 0.65×, pause, resume, speed change 1.25× and stop operate on actual audio');
  for(let lesson=1;lesson<=15;lesson++){
   await page.goto(server.baseURL+`learning.html?mode=listening&lesson=${lesson}`,{waitUntil:'domcontentloaded'});await login(page);await page.locator('#listeningRate').selectOption('1.5');
   for(const q of bank[lesson-1].listening){
    await page.locator(`[data-play="${q.id}"]`).click();await playing(q);const live=await snap();assert.equal(live.rate,1.5);assert.equal(live.error,null);
    await page.waitForFunction(end=>{const a=window.__testAudioInstances[0];return a.paused&&Math.abs(a.currentTime-end)<.12;},q.audio.end,{timeout:Math.ceil((q.audio.end-q.audio.start)/1.5*1000)+7000});
    const end=await snap();assert.ok(Math.abs(end.currentTime-q.audio.end)<.12);clips.push({id:q.id,track:q.audio.track,start:q.audio.start,end:q.audio.end,played:true,stoppedAt:end.currentTime,rate:live.rate});
   }
   console.log(`PASS played all 5 clips for lesson ${lesson}/15`);
  }
  checks.push('all 75 listening clips play from the mapped original recording and stop at segment end');
  await page.goto(server.baseURL+'learning.html?mode=listening&lesson=1',{waitUntil:'domcontentloaded'});await page.locator('#listeningRate').selectOption('0.75');await page.locator(`[data-play="${q0.id}"]`).click();await playing(q0);const q1=bank[0].listening[1];await page.locator(`[data-play="${q1.id}"]`).click();await playing(q1);assert.equal((await snap()).rate,.75);assert.equal(await page.evaluate(()=>window.__testAudioInstances.filter(a=>!a.paused).length),1);checks.push('switching questions leaves exactly one actual audio stream playing');
  await page.screenshot({path:path.join(out,'listening-playing-desktop.png'),fullPage:false});await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true);await page.screenshot({path:path.join(out,'listening-playing-mobile.png'),fullPage:false});
  await page.locator('[data-mode="vocab"]').click();assert.equal((await snap()).paused,true);checks.push('switching modules stops playback');
  await page.route('**/audio/1-1.mp3',r=>r.abort('failed'));await page.goto(server.baseURL+'learning.html?mode=listening&lesson=1',{waitUntil:'domcontentloaded'});await page.locator(`[data-play="${q0.id}"]`).click();await page.waitForFunction(()=>document.querySelector('#playerStatus').textContent.includes('Chưa phát được')||document.querySelector('#playerStatus').textContent.includes('Không tải được'),null,{timeout:14000});assert.equal(await page.evaluate(()=>window.HSKLearn.state.lessons[1].listening.first),null);checks.push('audio load failure offers retry and does not grade the unanswered listening group');
 }catch(error){errors.push(error.stack);throw error;}finally{await browser.close();await server.close();const report={browser:'Chromium 153.0.8010.0',checks,playedClips:clips.length,clips,errors,limitations:['Actual browser decoding, time progression and segment boundaries checked. This automated run does not replace perceptual listening or linguistic review.']};fs.writeFileSync(path.join(out,'listening-browser.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks,playedClips:clips.length,errors},null,2));}
 if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exit(1);});
