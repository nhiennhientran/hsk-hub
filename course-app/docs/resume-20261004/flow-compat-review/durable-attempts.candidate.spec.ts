import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {blank,grade,recordAttempt} from '../../../src/state.ts';
import {configs} from '../../../src/config.ts';
async function remount(page:Page,level:2|3){
 const other=level===2?3:2,config=configs[other],backup={app:config.id+'-backup',schema:1,exportedAt:Date.now(),data:blank(config)};
 await page.getByRole('button',{name:'统一备份与恢复'}).click();const dialog=page.getByRole('dialog',{name:'学习记录备份'});
 await dialog.locator('#unified-backup-file').setInputFiles({name:'isolated-other-course.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
 await dialog.getByRole('button',{name:`确认恢复HSK ${other}`,exact:false}).click();await expect(dialog).toContainText(`HSK ${other}已恢复`);
 await dialog.getByRole('button',{name:'关闭',exact:false}).click();
}
for(const level of [2,3] as const)for(const kind of ['homework','listening'] as const)for(const mode of ['quota','waiting'] as const)test(`durable HSK${level} ${kind} ${mode} rejects unconfirmed receipt across remount ordinary save and explicit retry`,async({page})=>{
 const config=configs[level],lesson=JSON.parse(readFileSync(new URL(`../../../content/hsk${level}/lesson-01.json`,import.meta.url),'utf8'));
 const data=blank(config);data.profile={name:'Nonempty original profile',className:'Isolated synthetic regression'};
 const choices=lesson.homework.filter((q:any)=>q.part==='vocabGrammar'),priorKey=lesson.id+':vocabGrammar';
 recordAttempt(data,priorKey,grade(choices,Object.fromEntries(choices.map((q:any)=>[q.id,q.answer])),1791093600000,data.profile));
 const q=lesson.listening[0],key=kind==='listening'?q.id+':individual':lesson.id+':writing';
 if(kind==='listening'){
  recordAttempt(data,key,grade([q],{[q.id]:(q.answer+1)%q.options.length},1791093600001,data.profile),'listening');
  data.listeningRound={selected:[1],limit:5,wrongOnly:false,queue:[q.id],index:0,answers:{[q.id]:q.answer},submitted:{},playCounts:{[q.id]:0},startedAt:1791093600002};
 }else data.drafts[key]={answers:Object.fromEntries(lesson.homework.filter((q:any)=>q.part==='writing').map((q:any)=>[q.id,'  原文保留\nĐặng 中文  '])),updatedAt:1791093600002};
 await page.addInitScript(({key,app,data})=>{sessionStorage.setItem('hsk_portal_unlocked_v2','1');if(localStorage.getItem(key)===null)localStorage.setItem(key,JSON.stringify({app,schema:1,revision:7,updatedAt:Date.now(),data,recovery:null}));},{key:config.storageKey,app:config.id,data});
 await page.goto(`/#view=${kind}&level=${level}&lesson=1&part=writing`);
 const submit=kind==='listening'?page.locator('.listening-module').getByRole('button',{name:'提交本题',exact:false}):page.locator('#assignment button[type=submit]');
 await expect(submit).toBeVisible();
 const read=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).data,config.storageKey);
 const before=await read(),prior=before.homework[priorKey],oldTarget=before[kind][key];
 if(mode==='quota')await page.evaluate(key=>{
  const original=Storage.prototype.setItem;(window as any).__restoreDurableWrite=()=>Storage.prototype.setItem=original;
  Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Synthetic quota','QuotaExceededError');return original.call(this,k,v)};
 },config.storageKey);
 else await page.evaluate(async key=>{await new Promise<void>(ready=>{void navigator.locks.request(key+'-write',async()=>{ready();await new Promise<void>(release=>(window as any).__releaseDurableLock=release)})})},config.storageKey);
 await submit.click();
 if(mode==='quota'){await expect(kind==='listening'?page.locator('.global-message'):page.locator('#assignment [role=status]')).toContainText('提交未确认');await expect(submit).toBeEnabled();}
 else {await expect(submit).toBeDisabled();}
 const feedback=()=>kind==='listening'?page.locator('.listening-module .activity-feedback'):page.locator('#receipt:visible');
 await expect(feedback()).toHaveCount(0);expect((await read())[kind][key]).toEqual(oldTarget);
 if(kind==='listening')expect((await read()).listeningRound.submitted[q.id]).toBeUndefined();
 await remount(page,level);await expect(submit).toBeVisible();await expect(feedback()).toHaveCount(0);
 if(kind==='homework')await expect(page.locator('#assignment textarea').first()).toHaveValue('  原文保留\nĐặng 中文  ');
 else await expect(page.locator(`.listening-module input[name="${q.id}"][value="${q.answer}"]`)).toBeChecked();
 await page.evaluate(()=>{(window as any).__restoreDurableWrite?.();(window as any).__releaseDurableLock?.()});
 // Save an ordinary profile edit to prove that no failed or retired attempt was adopted into live state.
 await page.goto(`/#view=progress&level=${level}`);await page.locator('#profile-name').fill('Later ordinary profile save');
 await page.locator('.data-panel').getByRole('button',{name:'重试保存',exact:false}).click();await expect(page.locator('.save-status')).toHaveAttribute('data-status','saved');
 expect((await read())[kind][key]).toEqual(oldTarget);expect((await read()).homework[priorKey]).toEqual(prior);
 await page.goto(`/#view=${kind}&level=${level}&lesson=1&part=writing`);await expect(submit).toBeEnabled();await expect(feedback()).toHaveCount(0);
 await submit.click();await expect(page.locator('.save-status')).toHaveAttribute('data-status','saved');
 await expect(feedback()).toBeVisible();const confirmed=(await read())[kind][key];
 expect(confirmed.submissions).toBe(kind==='listening'?2:1);if(oldTarget)expect(confirmed.first).toEqual(oldTarget.first);
 await page.reload();await expect(feedback()).toBeVisible();expect((await read())[kind][key]).toEqual(confirmed);expect((await read()).homework[priorKey]).toEqual(prior);
});
