'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const name=process.env.HSK_BROWSER||'chromium',pw=require('playwright'),OUT=path.resolve('tools/tests/results');fs.mkdirSync(OUT,{recursive:true});
const result={browser:name,passed:false,scope:'standalone teacher review, not human listening certification',checks:[],errors:[],requests:[]};let browser,context,page;
(async()=>{
 browser=await pw[name].launch({headless:true});context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>result.errors.push(e.message));page.on('request',r=>result.requests.push(r.url()));
 await page.goto(pathToFileURL(path.resolve('dist/integration-step1/HSK1-Listening-Device-Review.html')).href,{waitUntil:'load'});
 assert.equal(await page.locator('#question-list [data-question]').count(),75);assert.match(await page.locator('#review-count').innerText(),/^0\/75/);result.checks.push('75 questions; all human judgments remain pending');
 for(const id of ['l01-listen-01','l08-listen-01']){
  await page.locator(`[data-question="${id}"]`).click();await page.locator('#play-audio').click();await page.waitForFunction(()=>{const a=document.getElementById('lesson-audio');return a.ended&&a.duration>0;},null,{timeout:20000});
  assert.equal(await page.locator('#lesson-audio').getAttribute('data-media-id'),id);result.checks.push('embedded native playback '+id);
 }
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);result.checks.push('390px no horizontal overflow');
 const wait=page.waitForEvent('download');await page.locator('#export-review').click();const d=await wait;const dest=path.join(OUT,'stage4-1-'+name+'-standalone-human-test.json');await d.saveAs(dest);const data=JSON.parse(fs.readFileSync(dest,'utf8'));assert.equal(data.unchecked.length,75);result.checks.push('JSON export does not invent human approvals');
 assert.equal(result.requests.filter(u=>/^https?:/.test(u)).length,0);assert.deepEqual(result.errors,[]);result.checks.push('no HTTP dependency or application exception');
 await page.screenshot({path:path.join(OUT,'stage4-1-'+name+'-standalone-review.png'),fullPage:false});result.passed=true;
})().catch(e=>{result.error=e.stack;console.error(e);process.exitCode=1;}).finally(async()=>{await context?.close().catch(()=>{});await browser?.close().catch(()=>{});result.completedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'stage4-1-'+name+'-standalone-report.json'),JSON.stringify(result,null,2));});
