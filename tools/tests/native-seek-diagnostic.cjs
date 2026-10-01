'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),pw=require('playwright');
const source=fs.readFileSync('new-hsk1/hsk1/textbook-segment-audio.js','utf8'),kind=process.env.HSK_BROWSER||'webkit';
const PORT=18769,BASE=`http://127.0.0.1:${PORT}/hsk-hub/new-hsk1/hsk1/`,out={browser:kind,modes:[],startedAt:new Date().toISOString()};
const delay=ms=>new Promise(r=>setTimeout(r,ms));let server,browser;
(async()=>{
 server=spawn(process.execPath,['tools/serve-integration-step1.cjs'],{env:{...process.env,HSK_STAGE41_PORT:String(PORT)},stdio:'ignore'});
 for(let i=0;i<50;i++){try{if((await fetch(BASE+'index.html')).ok)break;}catch{}await delay(100);}
 browser=await pw[kind].launch({headless:true});
 for(const mode of ['baseline','fresh','reload']){
  const r={mode,plays:[],passed:false},c=await browser.newContext();out.modes.push(r);
  await c.route('**/*',route=>{
   const u=route.request().url();
   if(u.includes('/textbook-segment-audio.js')){
    let body=source;
    if(mode==='fresh')body=body.replace('const token=++runToken,audio=getAudio(track);','cache.delete(track); const token=++runToken,audio=getAudio(track);');
    if(mode==='reload')body=body.replace('try{audio.pause()}catch(_e){}\n    seekThen(audio,start,token,()=>{','try{audio.pause();audio.load()}catch(_e){}\n    seekThen(audio,start,token,()=>{');
    return route.fulfill({status:200,contentType:'text/javascript',body});
   }
   return u.startsWith(`http://127.0.0.1:${PORT}/`)?route.continue():route.fulfill({status:200,contentType:'text/javascript',body:''});
  });
  await c.addInitScript(()=>{
   window.mediaEvents=[];const Original=window.Audio;
   window.Audio=class extends Original{constructor(src){super(src);for(const event of ['loadedmetadata','canplay','seeking','seeked','play','playing','pause','ended','error','waiting'])this.addEventListener(event,()=>{window.mediaEvents.push({event,src:this.src,time:this.currentTime,seeking:this.seeking,ready:this.readyState,at:performance.now()});if(window.mediaEvents.length>600)window.mediaEvents.shift();});}};
  });
  const p=await c.newPage();p.setDefaultTimeout(10000);
  try{
   for(const lesson of [3,14]){
    await p.goto(BASE+`lesson.html?id=${lesson}&sec=text`,{waitUntil:'domcontentloaded'});
    if(await p.locator('#pwOverlay').isVisible()){await p.locator('#pwInput').fill('Ranlaoshimeimei');await p.locator('#pwBtn').click();}
    await p.locator('#sceneTabs .scene-tab[data-i="1"]').click();const count=await p.locator('#scenePane .speak-line').count();
    for(let i=0;i<count;i++){
     await p.locator('#scenePane .speak-line').nth(i).click();
     await p.waitForFunction(()=>{const d=window.HSK1_OFFICIAL_AUDIO.diagnostics();return d.playing||d.error;});
     const start=await p.evaluate(()=>window.HSK1_OFFICIAL_AUDIO.diagnostics());assert.equal(start.error,'');assert.equal(start.activeTrack,lesson+'-3');assert.ok(Math.abs(start.mediaCurrentTime-start.range[0])<.75,JSON.stringify(start));
     await p.waitForFunction(()=>window.HSK1_OFFICIAL_AUDIO.diagnostics().endedByRange,null,{timeout:Math.ceil((start.range[1]-start.range[0])*1000+6000)});
     const end=await p.evaluate(()=>window.HSK1_OFFICIAL_AUDIO.diagnostics());assert.ok(Math.abs(end.finishedAt-start.range[1])<.35,JSON.stringify(end));r.plays.push({lesson,line:i+1,start,end});
    }
   }
   r.passed=true;
  }catch(e){r.error=e.stack;r.diagnostic=await p.evaluate(()=>window.HSK1_OFFICIAL_AUDIO?.diagnostics()).catch(()=>null);}
  r.events=await p.evaluate(()=>window.mediaEvents).catch(()=>[]);await c.close();console.log(mode,r.passed,r.error||'');
 }
})().catch(e=>{out.error=e.stack;process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server?.kill('SIGTERM');fs.mkdirSync('seek-evidence',{recursive:true});out.finishedAt=new Date().toISOString();fs.writeFileSync(`seek-evidence/${kind}.json`,JSON.stringify(out,null,2));console.log(JSON.stringify(out.modes.map(m=>({mode:m.mode,passed:m.passed,plays:m.plays.length})),null,2));});
