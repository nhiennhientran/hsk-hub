import {test,expect,type Page,type BrowserContext} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {getHomework30Bank} from '../../../hsk1-app/src/services/content/homework30.ts';
import {allLessonsUnlockedFixture} from './unlocked-fixtures.ts';

const lessons=[...Array.from({length:15},(_,i)=>[1,i+1]),...Array.from({length:15},(_,i)=>[2,i+1]),...Array.from({length:18},(_,i)=>[3,i+1])];
const keys=['ran_hsk1_modular_v1','ran_hsk2_fltrp_2026_v1','ran_hsk3_fltrp_2026_v1'];
const unlocked=allLessonsUnlockedFixture();
async function authorize(context:BrowserContext){await context.addInitScript(()=>sessionStorage.setItem('hsk_portal_unlocked_v2','1'));}
test.beforeEach(async({context,page})=>{await authorize(context);await page.setViewportSize({width:390,height:900});});
async function ready(page:Page,level:number){
  await expect(page.locator('main h1').first()).toBeVisible();
  if(level===1)await expect(page.locator('main')).toHaveAttribute('data-module-state','ready');
  else {
    await expect(page.locator('.save-status')).toHaveAttribute('data-status',/^(empty|saved)$/);
    await expect(page.locator('.save-status')).toHaveAttribute('data-problem','false');
  }
  await expect(page.locator('main')).not.toContainText('暂时无法打开');
}
function network(page:Page){
  const errors:string[]=[],loaded=new Set<string>();
  page.on('pageerror',e=>errors.push('runtime: '+e.message));
  page.on('response',r=>{const u=new URL(r.url());if(u.origin===new URL(page.url()).origin){loaded.add(u.pathname);if(r.status()>=400&&!u.pathname.endsWith('/favicon.ico'))errors.push('HTTP '+r.status()+': '+u.pathname);}});
  page.on('requestfailed',r=>{if(!/abort|cancel|interrupted/i.test(r.failure()?.errorText??''))errors.push('request: '+new URL(r.url()).pathname);});
  return {errors,loaded};
}
async function imagesAndLayout(page:Page){
  for(const img of await page.locator('main img').all()){
    if(!await img.isVisible())continue;
    await img.scrollIntoViewIfNeeded();
    await expect.poll(()=>img.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
}
for(const [level,lesson]of lessons)test(`HSK${level} L${lesson} all teaching sections load actual deferred assets at 390px`,async({page},info)=>{
  test.setTimeout(150000);
  await page.addInitScript(values=>{for(const [key,value]of Object.entries(values))if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},unlocked);
  const evidence=network(page),sections=level===1?['vocab','text','grammar','hanzi','practice']:['overview','vocab','text','grammar','hanzi','practice','culture'];
  for(const section of sections){
    await page.goto(`./#view=lesson&level=${level}&lesson=${lesson}&section=${section}`);
    await ready(page,level);await imagesAndLayout(page);
    if(section==='practice'){
      expect(await page.locator('main input,main select,main textarea,main button').count()).toBeGreaterThan(0);
      expect(await page.locator('main [data-activity-id]').count()).toBeGreaterThan(0);
    }
  }
  await page.reload();await ready(page,level);await imagesAndLayout(page);
  expect(evidence.errors).toEqual([]);
  expect([...evidence.loaded].some(p=>p.endsWith('.js'))).toBe(true);
  await info.attach('all-section-deferred-assets.json',{body:JSON.stringify({level,lesson,width:390,sections,fixture:'Isolated validated historical five-part homework completion; not a production access bypass.',loaded:[...evidence.loaded].sort(),errors:evidence.errors}),contentType:'application/json'});
});

const firstChoice=getHomework30Bank()[0].choice[0];
function workRoute(level:number){return `./#view=homework&level=${level}&lesson=1&part=${level===1?'vocabGrammar':'writing'}&version=30-v1`;}
function workLocator(page:Page,level:number){return level===1?page.locator('#homework-name'):page.locator('#assignment textarea').first();}
function studentDraft(level:number,student:'A'|'B'){return `Student ${student} / HSK${level}${level===1?' · ':'\n'}${student==='A'?'甲':'乙'}学生独立记录`;}
function backupDraft(level:number){return `Exported student / HSK${level}${level===1?' · ':'\n'}保留首尾空格  `;}
async function exposeProfile(page:Page,level:number){if(level===1&&!await page.locator('#homework-name').isVisible())await page.locator('#homework-submission-details-toggle').click();}
async function expectH1Draft(page:Page,text:string,choice:number){
  const question=page.locator(`[data-question-id="${firstChoice.id}"]`),options=question.locator('input[type=radio]');
  await expect(options).toHaveCount(firstChoice.options.length);await expect(question.locator(`input[value="${choice}"]`)).toBeChecked();
  await expect(question.locator('label').nth(choice)).toContainText(`${String.fromCharCode(65+choice)}. ${firstChoice.options[choice]}`);
  const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).data.homework30,keys[0]);
  expect(stored.profile.name).toBe(text);expect(stored.lessons['1'].choice.draft[firstChoice.id]).toBe(choice);
}
async function saveDraft(page:Page,level:number,text:string,choice=0){
  await page.goto(workRoute(level));await ready(page,level);await exposeProfile(page,level);
  await expect(workLocator(page,level)).toBeVisible();
  await workLocator(page,level).fill(text);
  if(level===1){await page.locator(`[data-question-id="${firstChoice.id}"] input[value="${choice}"]`).check();await expect(page.locator('#homework-save-status')).toHaveAttribute('data-state','saved');}
  else await expect(page.locator('.save-status')).toHaveAttribute('data-status','saved');
  await page.reload();await ready(page,level);await exposeProfile(page,level);await expect(workLocator(page,level)).toHaveValue(text);
  if(level===1)await expectH1Draft(page,text,choice);
}
for(const level of [1,2,3])test(`HSK${level} independent student contexts keep different saved work after reload`,async({browser,baseURL})=>{
  const first=await browser.newContext({baseURL}),second=await browser.newContext({baseURL});
  try{
    await authorize(first);await authorize(second);const a=await first.newPage(),b=await second.newPage();
    await saveDraft(a,level,studentDraft(level,'A'),0);
    await b.goto(workRoute(level));await ready(b,level);await exposeProfile(b,level);
    await expect(workLocator(b,level)).toHaveValue('');
    if(level===1)await expect(b.locator(`[data-question-id="${firstChoice.id}"] input:checked`)).toHaveCount(0);
    await saveDraft(b,level,studentDraft(level,'B'),1);
    await a.reload();await ready(a,level);await exposeProfile(a,level);await expect(workLocator(a,level)).toHaveValue(studentDraft(level,'A'));
    if(level===1){await expectH1Draft(a,studentDraft(level,'A'),0);await expectH1Draft(b,studentDraft(level,'B'),1);}
    expect(await a.evaluate(k=>localStorage.getItem(k),keys[level-1])).not.toEqual(await b.evaluate(k=>localStorage.getItem(k),keys[level-1]));
  }finally{await first.close();await second.close();}
});

test('all three nonempty student drafts export and restore in a fresh context without cross-level replacement',async({browser,page,baseURL},info)=>{
  test.setTimeout(180000);
  for(const level of [1,2,3])await saveDraft(page,level,backupDraft(level));
  await page.getByRole('button',{name:'统一备份与恢复'}).click();
  const panel=page.getByRole('dialog',{name:'学习记录备份'});await expect(panel).toBeVisible();
  const [download]=await Promise.all([page.waitForEvent('download'),panel.getByRole('button',{name:'下载全部三级备份',exact:false}).click()]);
  const path=await download.path();expect(path).toBeTruthy();const bytes=readFileSync(path!);const backup=JSON.parse(bytes.toString());
  expect(backup.app).toBe('hsk123-unified-backup');expect(backup.schema).toBe(2);expect(backup.courses.map((c:any)=>c.level)).toEqual([1,2,3]);
  const before=await page.evaluate(ks=>Object.fromEntries(ks.map(k=>[k,JSON.parse(localStorage.getItem(k)!)])),keys);
  const fresh=await browser.newContext({baseURL});
  try{
    await authorize(fresh);const p=await fresh.newPage();await p.goto('./#view=progress&level=2');await ready(p,2);
    await p.getByRole('button',{name:'统一备份与恢复'}).click();const target=p.getByRole('dialog',{name:'学习记录备份'});
    await target.locator('#unified-backup-file').setInputFiles({name:'complete-student-backup.json',mimeType:'application/json',buffer:bytes});
    await expect(target.locator('.backup-preview')).toHaveCount(3);
    const initial=await p.evaluate(ks=>ks.map(k=>localStorage.getItem(k)),keys);
    await target.getByRole('button',{name:'确认恢复HSK 2',exact:false}).click();await expect(target).toContainText('HSK 2已恢复');
    const intermediate=await p.evaluate(ks=>ks.map(k=>localStorage.getItem(k)),keys);
    expect(intermediate[0]).toBe(initial[0]);expect(intermediate[2]).toBe(initial[2]);
    for(const level of [1,3]){const beforeSelected=await p.evaluate(ks=>ks.map(k=>localStorage.getItem(k)),keys);await target.getByRole('button',{name:`确认恢复HSK ${level}`,exact:false}).click();await expect(target).toContainText(`HSK ${level}已恢复`);const afterSelected=await p.evaluate(ks=>ks.map(k=>localStorage.getItem(k)),keys);for(const other of [1,2,3].filter(n=>n!==level))expect(afterSelected[other-1]).toBe(beforeSelected[other-1]);}
    const restored=await p.evaluate(ks=>Object.fromEntries(ks.map(k=>[k,JSON.parse(localStorage.getItem(k)!)])),keys);
    for(const key of keys)expect(restored[key].data).toEqual(before[key].data);
    await target.getByRole('button',{name:'关闭',exact:false}).click();
    for(const level of [1,2,3]){await p.goto(workRoute(level));await ready(p,level);await exposeProfile(p,level);await expect(workLocator(p,level)).toHaveValue(backupDraft(level));if(level===1)await expectH1Draft(p,backupDraft(level),0);}
    await info.attach('backup-coverage.json',{body:JSON.stringify({schema:2,levels:[1,2,3],freshContext:true,selectedLevelIsolation:true,nonemptyDrafts:true,HSK1ActualChoice:{id:firstChoice.id,value:0,option:firstChoice.options[0],singleLineProfile:true},HSK2And3ExactMultilineWriting:true,exactDataRoundtrip:true,bytes:bytes.length}),contentType:'application/json'});
  }finally{await fresh.close();}
});

test('shared browser profiles expose the local-only progress notice in both languages',async({page})=>{
  await page.goto('./#view=progress&level=2');await ready(page,2);
  await expect(page.locator('main')).toContainText('记录保存在当前浏览器');
  await expect(page.locator('main')).toContainText('Dữ liệu được lưu trong trình duyệt hiện tại');
  await page.getByRole('button',{name:'统一备份与恢复'}).click();const panel=page.getByRole('dialog',{name:'学习记录备份'});
  await expect(panel).toContainText('记录只保存在浏览器中');await expect(panel).toContainText('Dữ liệu chỉ lưu trong trình duyệt');
});
