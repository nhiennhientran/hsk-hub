import{test,expect}from'@playwright/test';import{readFileSync,writeFileSync}from'node:fs';import{join}from'node:path';import{createHash}from'node:crypto';
const old={'hsk1_ranteacher_progress_v1':' {"15":{"score":6}} ','hsk2_ranteacher_progress_v1':' {"15":{"score":7}} ','hsk3_ranteacher_progress_v1':' {"20":{"score":8}} ','hsk4_upper_ranteacher_progress_v1':' {"1":{"complete":true}} ','hsk4_lower_ranteacher_progress_v1':' {"20":{"complete":true}} '};
test.beforeEach(async({page})=>page.addInitScript(data=>{sessionStorage.setItem('hsk_portal_unlocked_v2','1');for(const[k,v]of Object.entries(data))if(localStorage.getItem(k)===null)localStorage.setItem(k,v)},old));
test.beforeEach(async({page})=>{
 if(process.env.FLOW_LEGACY_LOCAL_PAKO!=='1')return;
 const path=join(process.env.FLOW_PACKAGE_ROOT!,'assets/pako.min.js'),body=readFileSync(path),sha256=createHash('sha256').update(body).digest('hex');
 expect(sha256).toBe('ede2693a4a6a5126b9d35669062b358ecab6ae7b9b86a1cf302feb45a8514907');expect(body.subarray(0,80).toString()).toContain('pako 2.1.0');
 await page.route('https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js',r=>r.fulfill({status:200,contentType:'text/javascript',body}));
 writeFileSync(new URL('./legacy-local-dependency.json',import.meta.url),JSON.stringify({scope:'Only exact blocked CDN pako2.1.0 request fulfilled with already protected assembled baseline bytes; no application or source artifact changed; original CDN reachability remains unverified',url:'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js',localPath:path,bytes:body.length,sha256},null,2)+'\n');
});
test('verified assembled old HSK1 HSK2 HSK3 and both HSK4 routes preserve nonempty histories and extra HSK4 gate',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./index.html');await expect(page.locator('.auth-gate')).toHaveCount(0);await expect(page.locator('.level-card')).toHaveCount(3);
 const extra=page.locator('details.data-panel');await extra.evaluate((e:HTMLDetailsElement)=>e.open=true);
 for(const path of ['hsk1/','hsk2.html','hsk3/','hsk4up/','hsk4/'])await expect(extra.locator(`a[href$="/hsk-hub/${path}"]`)).toBeVisible();
 await expect(extra).toContainText('三级旧版20课，不对应新版18课');
 for(const[path,count]of [['hsk1/',15],['hsk2.html',15],['hsk3/',20],['hsk4up/',10],['hsk4/',10]]as const){
  await page.goto('./'+path);await expect(page.locator('#lessonGrid .lesson-card')).toHaveCount(count);if(path.startsWith('hsk4'))await page.waitForFunction(()=>Boolean((window as any).__HSK_SESSION_AUTH_API),undefined,{timeout:5000});
  if(path==='hsk4up/'){
   await expect(page.locator('#pwOverlay')).toBeVisible();expect(await page.evaluate(()=>(window as any).__HSK_SESSION_AUTH_API.currentStage())).toBe('hsk4');
   // Authorize the existing additional stage in this synthetic test session; password validation is not claimed here.
   await page.evaluate(()=>{sessionStorage.setItem('hsk4_extra_unlocked_v1','1');(window as any).__HSK_SESSION_AUTH_API.syncGate()});
  }
  await expect(page.locator('#pwOverlay')).toBeHidden();await expect(page.locator('#lessonGrid .lesson-card')).toHaveCount(count);await expect(page.locator('.fatal-box')).toHaveCount(0);
  await page.reload();await expect(page.locator('#lessonGrid .lesson-card')).toHaveCount(count);await expect(page.locator('#pwOverlay')).toBeHidden();
 }
 expect(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(old))).toEqual(old);expect(errors).toEqual([]);
});
for(const level of [2,3])test(`verified assembled HSK${level} nested default and explicit cross-level deep links survive reload`,async({page})=>{
 const other=level===2?3:2,last=level===2?15:18;
 const lesson=JSON.parse(readFileSync(new URL(`../../../content/hsk${level}/lesson-${String(last).padStart(2,'0')}.json`,import.meta.url),'utf8'));
 await page.goto(`./new-hsk${level}/hsk${level}/#view=lesson&lesson=${last}&section=text&scene=4`);await expect(page.locator('main h1')).toContainText(lesson.title.zh);await expect(page.locator('.textbook-module')).toHaveAttribute('data-section','text');await expect(page.locator('.scene-tabs a[aria-current=page]')).toContainText('课文4');await expect(page.locator(`.level-switch [data-level="${level}"]`)).toHaveAttribute('aria-current','true');
 await page.reload();await expect(page.locator('main h1')).toContainText(lesson.title.zh);await expect(page.locator('.scene-tabs a[aria-current=page]')).toContainText('课文4');
 await page.goto(`./new-hsk${level}/hsk${level}/#view=homework&lesson=${last}&part=translationChoice`);await expect(page.locator('#assignment fieldset')).toHaveCount(5);await expect(page.locator(`.level-switch [data-level="${level}"]`)).toHaveAttribute('aria-current','true');
 await page.goto(`./new-hsk${level}/hsk${level}/?level=${other}#view=lesson&lesson=1`);await expect(page.locator(`.level-switch [data-level="${other}"]`)).toHaveAttribute('aria-current','true');await expect(page.locator('.textbook-module')).toBeVisible();await page.reload();await expect(page.locator(`.level-switch [data-level="${other}"]`)).toHaveAttribute('aria-current','true');
 expect(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(old))).toEqual(old);
});
