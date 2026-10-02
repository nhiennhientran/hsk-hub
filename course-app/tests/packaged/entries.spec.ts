import{test,expect}from'@playwright/test';import{createHash}from'node:crypto';
async function open(page:any,level:number){await page.goto(`./new-hsk${level}/hsk${level}/?level=${level===2?3:2}#view=lesson&lesson=1`);if(await page.locator('#class-password').count()){await page.locator('#class-password').fill(process.env.HSK_TEST_PASSWORD!);await page.locator('.auth-card button').click()}await expect(page.locator('.auth-gate')).toHaveCount(0);await expect(page.locator('.text-section')).toHaveCount(4)}
for(const level of[2,3])test(`nested HSK${level} entry is level-locked, plays original media and survives deep-link refresh`,async({page})=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await open(page,level);await expect(page.locator('.brand')).toContainText(`HSK ${level}`);await page.locator('.text-section .audio-control button').first().click();await expect(page.locator('.player-bar')).toHaveAttribute('data-state','playing');await expect(page.locator('.player-bar>span')).not.toContainText('0.0s');await page.locator('nav.feature-nav a[data-view=practice]').click();await expect(page.locator('.player-bar')).toBeHidden();await page.locator('.practice-setup button').click();await expect(page.locator('.mixed-flip').first()).toBeVisible();await page.reload();await expect(page.locator('.mixed-flip').first()).toBeVisible();expect(errors).toEqual([])});
test('production-shaped level switches keep versioned state and nonempty20-lesson legacy history independent',async({page})=>{await page.addInitScript(()=>localStorage.setItem('hsk3_ranteacher_progress_v1','{"20":{"score":8}}'));await open(page,2);await page.getByRole('button',{name:'标记本课已学'}).click();await expect(page.locator('.save-status')).toHaveAttribute('data-status','saved');await open(page,3);await page.locator('nav.feature-nav a[data-view=progress]').click();await expect(page.locator('.progress-summary')).toContainText('已学 0/18');await expect(page.locator('.data-panel').last()).toContainText('20');const data=await page.evaluate(()=>({h2:JSON.parse(localStorage.getItem('ran_hsk2_fltrp_2026_v1')!).data.completed.length,old:localStorage.getItem('hsk3_ranteacher_progress_v1')}));expect(data).toEqual({h2:1,old:'{"20":{"score":8}}'})});
test('frozen manifest matches shared JS/CSS and first/last original tracks over HTTP with real404s',async({request})=>{const response=await request.get('./course-engine/release-manifest.json');expect(response.ok()).toBe(true);const manifest=await response.json();expect(manifest.sharedEngine).toBe('course-engine');const selected=manifest.files.filter((x:any)=>/\.(js|css)$/.test(x.path)||/audio\/(?:1-1|15-8|18-8)\.mp3$/.test(x.path));for(const file of selected){const r=await request.get('./'+file.path);expect(r.status()).toBe(200);const bytes=await r.body();expect(bytes.length).toBe(file.bytes);expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256)}const r=await request.get('./course-engine/course-assets/hsk3/audio/18-8.mp3',{headers:{Range:'bytes=0-31'}});expect(r.status()).toBe(206);expect((await r.body()).length).toBe(32);expect((await request.get('./course-engine/no-such-file.mp3')).status()).toBe(404)});

for(const level of [2,3])test(`HSK${level} final lesson plays its original text and full vocabulary group`,async({page})=>{
 await open(page,level);const number=level===2?15:18;await page.goto(`./new-hsk${level}/hsk${level}/#view=lesson&lesson=${number}`);await expect(page.locator('.text-section')).toHaveCount(4);
 const last=page.locator('.text-section').last();await last.locator('.audio-control button').first().click();await expect(page.locator('.player-bar')).toHaveAttribute('data-state','playing');await expect(page.locator('.player-bar>span')).toContainText(`${number}-7`);await expect(page.locator('.player-bar>span')).not.toContainText('0.0s');
 await last.locator('.audio-control button').last().click();await expect(page.locator('.player-bar')).toHaveAttribute('data-state','playing');await expect(page.locator('.player-bar>span')).toContainText(`${number}-8`);await expect(page.locator('.player-bar>span')).not.toContainText('0.0s');
});
async function legacyGate(page:any){
 // Legacy pages may restore the already-authorized session after their dynamic loader finishes.
 if(new URL(page.url()).pathname.endsWith('/hsk2.html'))await expect(page.locator('#lessonGrid .lesson-card')).toHaveCount(15);
 else await page.waitForFunction(()=>Boolean((window as any).__HSK_SESSION_AUTH_API));
 for(let stage=0;stage<2&&await page.locator('#pwOverlay').isVisible();stage++){
  const title=await page.locator('#pwOverlay h2').textContent();await page.locator('#pwInput').fill(process.env.HSK_TEST_PASSWORD!);await page.locator('#pwBtn').click();
  await page.waitForFunction(previous=>{const gate=document.querySelector<HTMLElement>('#pwOverlay');return gate?.style.display==='none'||gate?.querySelector('h2')?.textContent!==previous||document.querySelector('#pwError')?.classList.contains('show')},title);
  await expect(page.locator('#pwError')).not.toHaveClass(/show/);
 }
 await expect(page.locator('#pwOverlay')).toBeHidden();
}
test('assembled portal preserves all protected course entries and nonempty histories',async({page})=>{
 const old={'hsk2_ranteacher_progress_v1':'{"15":{"score":7}}','hsk3_ranteacher_progress_v1':'{"20":{"score":8}}','hsk4_upper_ranteacher_progress_v1':'{"1":{"complete":true}}','hsk4_lower_ranteacher_progress_v1':'{"20":{"complete":true}}'};
 await page.addInitScript(data=>{for(const[k,v]of Object.entries(data))if(localStorage.getItem(k)===null)localStorage.setItem(k,v)},old);
 await open(page,2);await page.goto('./index.html');await legacyGate(page);await expect(page.locator('.level-card')).toHaveCount(5);
 await expect(page.locator('.level-card.h2')).toHaveAttribute('href','new-hsk2/hsk2/');await expect(page.locator('.level-card.h3')).toHaveAttribute('href','new-hsk3/hsk3/');
 const h1=page.locator('.level-card.h1');await expect(h1).toHaveAttribute('href','hsk1/index.html');await h1.click();if(await page.locator('#class-password').count()){await page.locator('#class-password').fill(process.env.HSK_TEST_PASSWORD!);await page.locator('.auth-card button').click()}await expect(page.locator('.lesson-card')).toHaveCount(15);
 for(const[path,count]of [['hsk2.html',15],['hsk3/',20],['hsk4up/',10],['hsk4/',10]]as const){await page.goto('./'+path);await legacyGate(page);await expect(page.locator('#lessonGrid .lesson-card')).toHaveCount(count);await expect(page.locator('.fatal-box')).toHaveCount(0)}
 expect(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(old))).toEqual(old);
});
for(const width of [320,390,768,1440])test(`assembled portal and final HSK3 homework fit at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await open(page,3);await page.goto('./index.html');await legacyGate(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`test-results-package/portal-${width}.png`,fullPage:true});
 await page.goto('./new-hsk3/hsk3/#view=homework&lesson=18&part=translationChoice');await expect(page.locator('#assignment fieldset')).toHaveCount(5);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`test-results-package/hsk3-homework-${width}.png`,fullPage:true});
});

test('protected production HSK1 original audio still plays, pauses, resumes and stops on navigation',async({page})=>{
 await page.addInitScript(()=>{const native=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){(window as any).__protectedAudio=this;return native.call(this)}});
 await open(page,2);await page.goto('./new-hsk1/hsk1/#/textbook?lesson=1&section=text');
 await expect(page.locator('#module-host')).toHaveAttribute('data-state','ready');await expect(page.locator('#module-host')).toHaveAttribute('data-feature','textbook');
 await page.locator('[data-scene-audio]').first().click();await expect(page.locator('#audio-player')).toHaveAttribute('data-state','playing');
 const snapshot=()=>page.evaluate(()=>{const a=(window as any).__protectedAudio as HTMLMediaElement|undefined;return{src:a?.currentSrc,time:a?.currentTime??0,duration:a?.duration??0,paused:a?.paused??true}});
 await expect.poll(async()=>(await snapshot()).time).toBeGreaterThan(.035);const first=await snapshot();expect(first.src).toContain('/new-hsk1/hsk1/course-assets/audio/1-1.mp3');expect(first.duration).toBeGreaterThan(0);expect(first.paused).toBe(false);
 await page.locator('#audio-pause').click();await expect(page.locator('#audio-player')).toHaveAttribute('data-state','paused');const paused=await snapshot();expect(paused.paused).toBe(true);
 await page.locator('#audio-resume').click();await expect(page.locator('#audio-player')).toHaveAttribute('data-state','playing');await expect.poll(async()=>(await snapshot()).time).toBeGreaterThan(paused.time+.035);
 await page.locator('#feature-nav [data-feature=home]').click();await expect(page.locator('#module-host')).toHaveAttribute('data-feature','home');expect((await snapshot()).paused).toBe(true);await expect(page.locator('#audio-player')).toHaveCount(0);
 await test.info().attach('protected-hsk1-native-media.json',{body:JSON.stringify({first,paused,afterNavigation:await snapshot()}),contentType:'application/json'});
});
