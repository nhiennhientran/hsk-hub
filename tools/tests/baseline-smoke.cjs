'use strict';
const {serve,launch,login}=require('./browser-support.cjs');
const fs=require('node:fs'),path=require('node:path');
const out=process.env.HSK_TEST_OUTPUT||path.resolve(__dirname,'../../../tmp/browser-test');
(async()=>{
 fs.mkdirSync(out,{recursive:true}); const server=await serve(),browser=await launch();const page=await browser.newPage({viewport:{width:1440,height:1000}});const exceptions=[],failed=[],results=[];
 page.on('pageerror',e=>exceptions.push(e.message));page.on('response',r=>{if(r.url().startsWith(server.baseURL)&&r.status()>=400)failed.push({status:r.status(),url:r.url().replace(server.baseURL,'')});});
 try{
  await page.goto(server.baseURL+'index.html');await login(page);await page.locator('#lessonGrid .lesson-card').first().waitFor();
  results.push({test:'homepage lessons',count:await page.locator('#lessonGrid .lesson-card').count()});
  for(let id=1;id<=15;id++){
   await page.goto(server.baseURL+`lesson.html?id=${id}`,{waitUntil:'domcontentloaded'});await login(page);await page.locator('#vocabGrid > *').first().waitFor();
   const title=await page.locator('#lessonTitle').innerText();const words=await page.locator('#vocabGrid > *').count();
   for(const section of ['text','grammar','hanzi','practice']){await page.locator(`.top-section-tabs [data-sec="${section}"]`).click();await page.locator(`#${section}.active`).waitFor();if(section==='grammar'&&await page.locator('[data-grammar-speech]').count())await page.locator('[data-grammar-speech]').first().click();}
   results.push({test:'lesson tabs',id,title,words});
  }
  await page.screenshot({path:path.join(out,'baseline-desktop.png'),fullPage:false});
  await page.setViewportSize({width:390,height:844});await page.goto(server.baseURL+'lesson.html?id=1');await login(page);await page.locator('.mobile-section-tabs [data-sec="text"]').click();await page.screenshot({path:path.join(out,'baseline-mobile.png'),fullPage:false});
 }finally{await browser.close();await server.close();}
 const report={browser:'Chromium 153',results,exceptions,failed,limitations:['Automated initial baseline smoke test; pedagogical and audible boundary review separate.']};fs.writeFileSync(path.join(out,'baseline-smoke.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 if(exceptions.length||failed.length)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exit(1);});
