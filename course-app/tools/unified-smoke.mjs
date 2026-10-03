import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='checkpoints/unified-20261003/screens';await mkdir('../'+dir,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>sessionStorage.setItem('hsk_portal_unlocked_v2','1'));
const results=[];
for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});for(const level of [1,2,3]){for(const section of ['vocab','text','grammar','practice']){
const url=`http://127.0.0.1:4173/#view=lesson&level=${level}&lesson=1&section=${section}`;await page.goto(url);await page.waitForTimeout(650);await page.locator('main h1').first().waitFor();
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);const text=await page.locator('main').innerText();results.push({width,level,section,overflow,error:text.includes('暂时无法打开'),title:await page.title()});if(width===390||width===1440)await page.screenshot({path:`../${dir}/hsk${level}-${section}-${width}.png`,fullPage:true});
}}}
await page.goto('http://127.0.0.1:4173/#view=portal&level=2');await page.waitForTimeout(300);await page.screenshot({path:`../${dir}/portal-1440.png`,fullPage:true});
await writeFile('../checkpoints/unified-20261003/smoke.json',JSON.stringify({results,errors},null,2));await browser.close();console.log(JSON.stringify({cases:results.length,failures:results.filter(r=>r.overflow||r.error),errors},null,2));if(results.some(r=>r.overflow||r.error)||errors.length)process.exitCode=1;
