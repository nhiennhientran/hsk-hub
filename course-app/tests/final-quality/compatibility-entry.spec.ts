import {test,expect,type Page,type Locator} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {allReadingCompletedFixture} from './unlocked-fixtures.ts';
import {getHomework30Bank} from '../../../hsk1-app/src/services/content/homework30.ts';

// Real credentials must not enter Playwright call traces. Failure screenshots
// retain the browser's normal masked password input; evidence contains no value.
test.use({trace:'off'});

const repo=new URL('../../../',import.meta.url);
const productionBaseline='5d890eb59cdaf8ad3b134b3d141d2ef6fee2ecb7';
const sessionKey='hsk_portal_unlocked_v2';
const firstChoice=getHomework30Bank()[0].choice[0];
const oldRecords={
  hsk2_ranteacher_progress_v1:' { "15": { "score": 7 } } ',
  hsk3_ranteacher_progress_v1:' { "20": { "score": 8 } } ',
  hsk4_upper_ranteacher_progress_v1:' { "1": { "complete": true } } ',
  hsk4_lower_ranteacher_progress_v1:' { "20": { "complete": true } } '
};
const entries=[
  {path:'index.html',level:1,view:'portal'},
  ...[1,2,3].flatMap(level=>[`${level}`,`${level}/hsk${level}`].map(path=>({path:`new-hsk${path}/index.html`,level,view:'courses'}))),
  {path:'new-hsk1/hsk1/lesson.html',level:1,view:'lesson'},
  {path:'new-hsk1/hsk1/learning.html',level:1,view:'homework'},
  {path:'new-hsk1/hsk1/lesson9-pilot.html',level:1,view:'archive'}
];
const digest=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
function password(){
  const value=process.env.HSK_TEST_PASSWORD;
  expect(value,'Use the existing tools/run-browser.mjs password fixture; real unlock acceptance cannot be skipped.').toBeTruthy();
  return value!;
}
async function settled(page:Page,level:number,view?:string){
  await expect(page.locator('#app')).toHaveAttribute('data-level',String(level));
  if(view)await expect(page.locator('#app')).toHaveAttribute('data-view',view);
  await expect(page.locator('.auth-gate')).toHaveCount(0);
  await expect(page.locator('main h1').first()).toBeVisible();
  if(level===1&&view!=='portal')await expect(page.locator('main')).toHaveAttribute('data-module-state','ready');
  if(level!==1){await expect(page.locator('.save-status')).toHaveAttribute('data-status',/^(empty|saved)$/);await expect(page.locator('.save-status')).toHaveAttribute('data-problem','false');}
  await expect(page.locator('main')).not.toContainText('暂时无法打开');
}
async function unlock(page:Page){
  await expect(page.locator('.auth-gate')).toBeVisible();
  await page.locator('#class-password').fill(password());await page.locator('#class-password').press('Enter');
  await expect(page.locator('.auth-gate')).toHaveCount(0);
}
async function keyActivate(control:Locator){await expect(control).toBeVisible();await control.focus();await expect(control).toBeFocused();await control.press('Enter');}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}

for(const level of [1,2,3])test(`HSK${level} real password unlock respects keyboard focus, refresh, shared tab session and fresh profile boundaries`,async({page,context,browser,baseURL},info)=>{
  const start=`./new-hsk${level}/hsk${level}/index.html`;
  await page.goto(start);const gate=page.locator('.auth-gate'),input=page.locator('#class-password'),submit=gate.locator('button[type=submit]');
  await expect(gate).toBeVisible();expect(await page.locator('#app').evaluate((root:HTMLElement)=>root.inert)).toBe(true);
  await expect(input).toBeFocused();await input.press('Shift+Tab');await expect(submit).toBeFocused();await submit.press('Tab');await expect(input).toBeFocused();
  await input.fill('qa-incorrect-classroom-password');await input.press('Enter');
  await expect(gate.getByRole('alert')).toContainText('口令不正确');await expect(gate.getByRole('alert')).toContainText('Mật khẩu không đúng');
  await expect(input).toHaveValue('');await expect(input).toBeFocused();expect(await page.evaluate(key=>sessionStorage.getItem(key),sessionKey)).toBeNull();
  await unlock(page);await settled(page,level,'courses');expect(await page.locator('#app').evaluate((root:HTMLElement)=>root.inert)).toBe(false);
  expect(await page.evaluate(key=>sessionStorage.getItem(key),sessionKey)).toBe('1');
  await page.reload();await settled(page,level,'courses');
  for(const other of [1,2,3].filter(n=>n!==level)){await keyActivate(page.locator(`.level-switch a[data-level="${other}"]`));await settled(page,other,'courses');}
  await page.reload();await settled(page,[1,2,3].filter(n=>n!==level).at(-1)!,'courses');
  const savedOrigin=await context.storageState();
  await page.evaluate(()=>sessionStorage.clear());await page.reload();await expect(gate).toBeVisible();
  expect(await page.locator('#app').evaluate((root:HTMLElement)=>root.inert)).toBe(true);
  const fresh=await browser.newContext({baseURL,storageState:savedOrigin});
  try{const p=await fresh.newPage();await p.goto(start);await expect(p.locator('.auth-gate')).toBeVisible();expect(await p.evaluate(key=>sessionStorage.getItem(key),sessionKey)).toBeNull();expect(await p.locator('#app').evaluate((root:HTMLElement)=>root.inert)).toBe(true);}
  finally{await fresh.close();}
  await info.attach('real-session-boundaries.json',{body:JSON.stringify({level,realPasswordVerifier:true,wrongPasswordRejected:true,keyboardFocusTrap:true,refreshReusedSession:true,threeLevelsOneTabSession:true,clearedSessionRelocked:true,freshProfileWithCopiedLocalDataRelocked:true,passwordRecorded:false}),contentType:'application/json'});
});

test('all ten approved HTML entries resolve shared resources and old deep links; protected HSK4 teaching bytes and history remain intact',async({page,baseURL},info)=>{
  test.setTimeout(360000);expect(entries).toHaveLength(10);expect(baseURL).toBeTruthy();
  const data={...allReadingCompletedFixture(),...oldRecords};
  // Valid historical reading opens old L9 pilot links. It does not unlock the
  // password gate, and these fixtures never touch an actual student profile.
  await page.addInitScript(values=>{for(const [key,value]of Object.entries(values))if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},data);
  const errors:string[]=[];page.on('pageerror',e=>errors.push('runtime: '+e.message));
  page.on('response',r=>{const url=new URL(r.url());if(url.origin===new URL(page.url()).origin&&r.status()>=400&&!url.pathname.endsWith('/favicon.ico'))errors.push(`HTTP ${r.status()}: ${url.pathname}`);});
  page.on('requestfailed',r=>{if(!/abort|cancel|interrupted/i.test(r.failure()?.errorText??''))errors.push('request: '+new URL(r.url()).pathname);});
  const engine=new URL('./course-engine/',baseURL).href,results:unknown[]=[];
  for(const [index,entry]of entries.entries()){
    const response=await page.goto('./'+entry.path);expect(response?.status(),entry.path).toBe(200);
    if(index===0)await unlock(page);await settled(page,entry.level,entry.view);
    expect(await page.locator('meta[name="hsk-level"]').getAttribute('content')).toBe(String(entry.level));
    expect(await page.evaluate(()=>new URL(document.querySelector<HTMLMetaElement>('meta[name="asset-base"]')!.content,location.href).href)).toBe(engine);
    const linked=await page.evaluate(()=>[...document.querySelectorAll<HTMLScriptElement|HTMLLinkElement>('script[type=module][src],link[rel=stylesheet][href]')].map(node=>node instanceof HTMLScriptElement?node.src:node.href));
    expect(linked.some(url=>url.endsWith('.js'))).toBe(true);expect(linked.some(url=>url.endsWith('.css'))).toBe(true);
    for(const url of linked){expect(url.startsWith(engine+'assets/'),entry.path).toBe(true);expect((await page.request.head(url)).status()).toBe(200);}
    if(entry.path.endsWith('/lesson.html')){await page.goto('./'+entry.path+'?id=1&sec=text');await settled(page,1,'lesson');await expect(page.locator('#textbook-text')).toBeVisible();}
    if(entry.path.endsWith('/learning.html')){await page.goto('./'+entry.path+'?mode=homework&lesson=1&stage=choice');await settled(page,1,'homework');await expect(page.locator('#module-host')).toHaveAttribute('data-feature','homework');}
    const hash=entry.level===1?'#/textbook?lesson=1&section=text':`#view=lesson&level=${entry.level}&lesson=1&section=text&scene=1`;
    await page.goto('./'+entry.path+hash);await settled(page,entry.level,'lesson');
    for(const image of await page.locator('main img').all())if(await image.isVisible()){await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);}
    const track=entry.level===1?'course-assets/audio/1-1.mp3':`course-assets/hsk${entry.level}/audio/1-1.mp3`;
    const source=entry.level===1?'new-hsk1/hsk1/audio/1-1.mp3':'course-app/public/'+track;
    const partial=await page.request.get(new URL(track,engine).href,{headers:{Range:'bytes=0-31'}});expect(partial.status()).toBe(206);
    expect(digest(await partial.body())).toBe(digest(readFileSync(new URL(source,repo)).subarray(0,32)));
    await page.reload();await settled(page,entry.level,'lesson');await noOverflow(page);
    const marker=await page.evaluate(()=>(window as any).__compatDocumentMarker=crypto.randomUUID()),other=entry.level===2?1:2;
    await keyActivate(page.locator(`.level-switch a[data-level="${other}"]`));await settled(page,other);
    expect(await page.evaluate(()=>(window as any).__compatDocumentMarker)).toBe(marker);
    results.push({entry:entry.path,defaultView:entry.view,defaultLevel:entry.level,deepLink:hash,sharedEngine:engine,originalTrackRange:true,refresh:true,sameDocumentLevelSwitch:true});
  }
  const content=await page.request.get(new URL('content-manifest.json',engine).href);expect(content.status()).toBe(200);const manifest=await content.json();
  expect(manifest.schemaVersion).toBe(1);expect(manifest.lessons).toHaveLength(33);expect(manifest.lessons.filter((l:any)=>l.level===2)).toHaveLength(15);expect(manifest.lessons.filter((l:any)=>l.level===3)).toHaveLength(18);
  const retained=['hsk4up/index.html','hsk4/index.html','hsk4/data.js',...Array.from({length:10},(_,i)=>`hsk4up/data/${String(i+1).padStart(2,'0')}.js`),...Array.from({length:10},(_,i)=>`hsk4/data/${i+11}.js`)];
  const protectedFiles:unknown[]=[];
  for(const path of retained){
    const expected=execFileSync('git',['show',`${productionBaseline}:${path}`],{cwd:fileURLToPath(repo),maxBuffer:8*1024*1024});
    const response=await page.request.get(new URL(path,baseURL).href);expect(response.status(),path).toBe(200);expect(digest(await response.body()),path).toBe(digest(expected));
    protectedFiles.push({path,sha256:digest(expected),baseline:productionBaseline});
  }
  expect(await page.evaluate(keys=>Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),Object.keys(oldRecords))).toEqual(oldRecords);
  expect(errors).toEqual([]);
  await info.attach('ten-entry-and-protected-byte-coverage.json',{body:JSON.stringify({entries:results,contentManifestIsAnAssetNotAnEntry:true,protectedFiles,protectedStorageKeys:Object.keys(oldRecords),errors}),contentType:'application/json'});
});

test('1440px keyboard learning flow keeps Chinese and Vietnamese visible and three course drafts independent',async({page},info)=>{
  test.setTimeout(180000);await page.setViewportSize({width:1440,height:900});
  await page.goto('./index.html#view=lesson&level=2&lesson=1&section=text');await unlock(page);await settled(page,2,'lesson');
  const marker=await page.evaluate(()=>(window as any).__compatDocumentMarker=crypto.randomUUID());
  for(const level of [2,1,3]){
    if(level!==2){
      await keyActivate(page.locator(`.level-switch a[data-level="${level}"]`));await settled(page,level);
      await page.goto(`./index.html#view=lesson&level=${level}&lesson=1&section=text`);
    }
    await settled(page,level,'lesson');
    const skip=page.locator('.skip-link');await skip.focus();await expect(skip).toBeFocused();
    expect(await skip.evaluate(node=>{const r=node.getBoundingClientRect();return r.top>=0&&r.left>=0&&r.bottom<=innerHeight&&r.right<=innerWidth;})).toBe(true);
    const route=page.url();await skip.press('Enter');await expect(page.locator('main')).toBeFocused();expect(page.url()).toBe(route);
    for(const lang of ['zh','vi'])await expect(page.locator(`.feature-nav a[data-view="homework"] [lang="${lang}"]`)).toBeVisible();
    if(level===1){
      const original=page.locator('#scene-content .textbook-line [data-original-text]').first();await expect(original.locator('p').first()).toBeVisible();await expect(original.locator('p').nth(2)).toBeVisible();
      await page.locator('#text-show-original').focus();await page.locator('#text-show-original').press('Space');await expect(original).toBeHidden();
      await page.locator('#text-show-original').press('Space');await expect(original.locator('p').first()).toBeVisible();await expect(original.locator('p').nth(2)).toBeVisible();
    }else{
      const row=page.locator('.dialogue-line').first();await expect(row.locator('.chinese-line')).toBeVisible();await expect(row.locator('.vietnamese-line')).toBeVisible();
      const py=page.locator('#text-pinyin');await py.focus();if(await py.isChecked())await py.press('Space');await expect(row.locator('.pinyin-line')).toBeHidden();
      await py.press('Space');await expect(row.locator('.pinyin-line')).toBeVisible();await expect(row.locator('.chinese-line')).toBeVisible();await expect(row.locator('.vietnamese-line')).toBeVisible();
    }
    await noOverflow(page);await keyActivate(page.locator('.feature-nav a[data-view="homework"]'));await settled(page,level,'homework');
    if(level===1){
      await keyActivate(page.locator('[data-homework-part="choice"]'));await settled(page,level,'homework');
      const choice=page.locator(`[data-question-id="${firstChoice.id}"] input[value="1"]`);await choice.focus();await expect(choice).toBeFocused();await choice.press('Space');await expect(choice).toBeChecked();
      await keyActivate(page.locator('#homework-submission-details-toggle'));
    }else{await keyActivate(page.locator('.subnav a[href*="part=writing"]'));await settled(page,level,'homework');}
    const input=level===1?page.locator('#homework-name'):page.locator('#assignment textarea').first();await expect(input).toBeVisible();await input.focus();await expect(input).toBeFocused();
    await input.fill(`Desktop HSK${level}${level===1?' · ':'\n'}中文与 tiếng Việt 草稿  `);
    if(level===1)await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state','saved');else await expect(page.locator('.save-status')).toHaveAttribute('data-status','saved');
    await noOverflow(page);
  }
  expect(await page.evaluate(()=>(window as any).__compatDocumentMarker)).toBe(marker);
  for(const level of [2,1,3]){await keyActivate(page.locator(`.level-switch a[data-level="${level}"]`));await settled(page,level,'homework');if(level===1){await keyActivate(page.locator('#homework-submission-details-toggle'));await expect(page.locator(`[data-question-id="${firstChoice.id}"] input[value="1"]`)).toBeChecked();await expect(page.locator(`[data-question-id="${firstChoice.id}"] label`).nth(1)).toContainText(firstChoice.options[1]);}const input=level===1?page.locator('#homework-name'):page.locator('#assignment textarea').first();await expect(input).toHaveValue(`Desktop HSK${level}${level===1?' · ':'\n'}中文与 tiếng Việt 草稿  `);await noOverflow(page);}
  await page.reload();await settled(page,3,'homework');await expect(page.locator('#assignment textarea').first()).toHaveValue('Desktop HSK3\n中文与 tiếng Việt 草稿  ');
  await info.attach('desktop-keyboard-and-bilingual-visibility.json',{body:JSON.stringify({width:1440,levels:[1,2,3],passwordGateUsed:true,keyboardSkipLink:true,keyboardLevelAndHomeworkNavigation:true,bothChineseAndVietnameseVisible:true,languageMode:'Fixed simultaneous bilingual interface; no language-switch control exists.',existingTranscriptAndPinyinControls:true,exactIndependentDrafts:true,sameDocumentLevelSwitch:true,reloadedSavedDraft:true}),contentType:'application/json'});
});
