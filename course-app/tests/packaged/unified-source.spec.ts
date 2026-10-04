import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import {sourceLessons} from '../../../hsk1-app/src/services/source-activities/content.ts';
const unifiedEntryDirectories=['','new-hsk1','new-hsk1/hsk1','new-hsk2','new-hsk2/hsk2','new-hsk3','new-hsk3/hsk3'];
const current=sourceLessons.find(l=>l.lesson===4)!;
const originalKeys={old2:'hsk2_ranteacher_progress_v1',old3:'hsk3_ranteacher_progress_v1'};
async function authorize(page:any){await page.addInitScript(()=>sessionStorage.setItem('hsk_portal_unlocked_v2','1'));}
for(const dir of unifiedEntryDirectories)test(`unified packaged entry ${dir||'portal'} loads actual source crops with nonempty legacy state`,async({page,request})=>{
  await authorize(page);
  await page.addInitScript(keys=>{localStorage.setItem(keys.old2,' { "15": { "score": 7 } } ');localStorage.setItem(keys.old3,' { "20": { "score": 8 } } ');},originalKeys);
  await page.setViewportSize({width:390,height:900});
  const entry=(dir?dir+'/':'')+'index.html';
  await page.goto('./'+entry+'#view=lesson&level=1&lesson=4&section=practice');
  const host=page.locator('[data-hsk1-source-pilot="4"]');await expect(host).toBeVisible();await expect(host.locator('.activity-card')).toHaveCount(current.activities.length);
  const pictures=host.locator('img');expect(await pictures.count()).toBeGreaterThan(0);
  for(const image of await pictures.all()){await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate(i=>(i as HTMLImageElement).complete&&(i as HTMLImageElement).naturalWidth>0)).toBe(true);}
  const urls=await pictures.evaluateAll(images=>images.map(i=>(i as HTMLImageElement).src));
  for(const url of new Set<string>(urls)){
    const filename=new URL(url).pathname.split('/').pop()!,figure=current.figures.find(f=>f.file.endsWith('/'+filename));expect(figure,filename).toBeTruthy();
    const response=await request.get(url);expect(response.status()).toBe(200);expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(figure!.sha256);
    expect(new URL(url).pathname).toContain('/hsk-hub/'+(dir?dir+'/':'')+'source-activities/figures/');
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.evaluate(keys=>[localStorage.getItem(keys.old2),localStorage.getItem(keys.old3)],originalKeys)).toEqual([' { "15": { "score": 7 } } ',' { "20": { "score": 8 } } ']);
  await test.info().attach('packaged-entry-original-images.json',{body:JSON.stringify({entry,urls,lesson:4}),contentType:'application/json'});
});
test('nested HSK1 textbook originals and original audio resolve against shared course engine',async({page})=>{
  await authorize(page);
  await page.addInitScript(()=>{const native=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){(window as any).__packagedAudio=this;return native.call(this)};});
  await page.goto('./new-hsk1/hsk1/index.html#view=lesson&level=1&lesson=1&section=text');
  const images=page.locator('.textbook-scene-figures img');await expect(images).toHaveCount(1);await images.first().scrollIntoViewIfNeeded();await expect.poll(()=>images.first().evaluate(i=>(i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(await images.first().getAttribute('src')).toContain('/course-engine/source-activities/figures/');
  await page.locator('[data-scene-audio]').first().click();await expect(page.locator('#audio-player')).toHaveAttribute('data-state','playing');
  const audio=await page.evaluate(()=>{const a=(window as any).__packagedAudio as HTMLMediaElement;return {src:a.currentSrc,time:a.currentTime,duration:a.duration};});
  expect(audio.src).toContain('/course-engine/course-assets/audio/1-1.mp3');expect(audio.duration).toBeGreaterThan(0);
  await test.info().attach('nested-audio.json',{body:JSON.stringify(audio),contentType:'application/json'});
  await page.reload();await expect(page.locator('.textbook-scene-figures img')).toHaveCount(1);
});
test('assembled HTTP bytes match frozen identity and private baseline/source paths are not served',async({request})=>{
  const r=await request.get('./course-engine/unified-release-manifest.json');expect(r.status()).toBe(200);const m=await r.json();expect(m.mode).toBe('checkpoint');expect(m.lessons).toBe(48);expect(m.originalSourceCrops).toBe(150);
  const selected=m.files.filter((f:any)=>f.path==='index.html'||f.path.endsWith('l04-text-1-photo.png')||/^course-engine\/assets\/.+\.(?:js|css)$/.test(f.path)||f.path.endsWith('audio/18-8.mp3'));
  expect(selected.length).toBeGreaterThan(3);
  for(const f of selected){const response=await request.get('./'+f.path);expect(response.status()).toBe(200);const b=await response.body();expect(b.length).toBe(f.bytes);expect(createHash('sha256').update(b).digest('hex')).toBe(f.sha256);}
  for(const path of ['tools/build-learning-bank.cjs','qa/source-canonical-audit.mjs','.github/workflows/site-qa.yml','course-engine/book.pdf','course-engine/source-activities/figures/whole-page.png','course-engine/assets/app.js.map'])expect((await request.get('./'+path)).status(),path).toBe(404);
  const partial=await request.get('./course-engine/course-assets/hsk3/audio/18-8.mp3',{headers:{Range:'bytes=0-31'}});expect(partial.status()).toBe(206);expect((await partial.body()).length).toBe(32);
});
