import{test}from'@playwright/test';import{writeFileSync}from'node:fs';
test('observe actual protected HSK2 legacy dependency and boot status without substitutions',async({page})=>{
 const errors:string[]=[],failed:{url:string;failure:unknown}[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push({url:r.url(),failure:r.failure()}));
 await page.addInitScript(()=>sessionStorage.setItem('hsk_portal_unlocked_v2','1'));
 await page.goto('./hsk2.html');
 // Wait on the page's real readiness condition; never invent an unavailable dependency.
 try{await page.waitForFunction(()=>document.querySelectorAll('#lessonGrid .lesson-card').length===15,undefined,{timeout:10000})}catch{}
 const status=await page.evaluate(()=>({url:location.href,count:document.querySelectorAll('#lessonGrid .lesson-card').length,boot:document.getElementById('bootStatus')?.textContent,progress:document.getElementById('progressSummary')?.textContent,pako:typeof(window as any).pako,gate:document.getElementById('pwOverlay')?.style.display}));
 writeFileSync(new URL('./legacy-hsk2-dependency-observation.json',import.meta.url),JSON.stringify({purpose:'Actual diagnostic observation; no pass acceptance implied',errors,failed,status},null,2)+'\n');
});
