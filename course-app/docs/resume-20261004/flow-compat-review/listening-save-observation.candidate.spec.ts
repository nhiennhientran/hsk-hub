import {test,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {blank} from '../../../src/state.ts';
import {configs} from '../../../src/config.ts';
for(const level of [2,3] as const)for(const mode of ['quota','waiting'] as const)test(`observe actual HSK${level} independent listening ${mode} submission and ordinary retry`,async({page})=>{
 const config=configs[level],data=blank(config);
 data.profile.name='Nonempty probe profile';
 const lesson=JSON.parse(readFileSync(new URL(`../../../content/hsk${level}/lesson-01.json`,import.meta.url),'utf8'));
 const questions=new Map<string,any>(Array.from({length:config.count},(_,i)=>JSON.parse(readFileSync(new URL(`../../../content/hsk${level}/lesson-${String(i+1).padStart(2,'0')}.json`,import.meta.url),'utf8'))).flatMap(l=>l.listening.map((q:any)=>[q.id,q])));
 await page.addInitScript(({key,app,data})=>{
  sessionStorage.setItem('hsk_portal_unlocked_v2','1');
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({app,schema:1,revision:1,updatedAt:Date.now(),data,recovery:null}));
 },{key:config.storageKey,app:config.id,data});
 await page.goto(`/#view=listening&level=${level}&lesson=1`);
 const root=page.locator('.listening-module');await expect(root).toBeVisible();
 await root.getByRole('button',{name:'开始听力',exact:false}).click();
 const read=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).data,config.storageKey);
 await expect.poll(async()=>!!(await read()).listeningRound).toBe(true);
 const qid=(await read()).listeningRound.queue[0],q=questions.get(qid);
 await root.locator(`input[type=radio][name="${qid}"][value="${q.answer}"]`).check();
 await expect.poll(async()=>(await read()).listeningRound.answers[qid]).toBe(q.answer);
 const before=await read();
 if(mode==='quota')await page.evaluate(key=>{
  const original=Storage.prototype.setItem;
  (window as any).__restoreFlowWrite=()=>Storage.prototype.setItem=original;
  Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Synthetic quota','QuotaExceededError');return original.call(this,k,v)};
 },config.storageKey);
 else await page.evaluate(async key=>{
  await new Promise<void>(ready=>{void navigator.locks.request(key+'-write',async()=>{ready();await new Promise<void>(release=>(window as any).__releaseFlowLock=release)})});
 },config.storageKey);
 await root.getByRole('button',{name:'提交本题',exact:false}).click();
 if(mode==='quota')await expect(page.locator('.save-status')).toHaveAttribute('data-status','unsaved');
 else await expect(page.locator('.save-status')).toHaveAttribute('data-status','saving');
 const after=await read();
 const observation={level,mode,qid,
  feedbackVisible:await root.locator('.activity-feedback').isVisible(),
  submitDisabled:await root.getByRole('button',{name:'提交本题',exact:false}).isDisabled(),
  diskSubmitted:!!after.listeningRound.submitted[qid],
  diskIndividualRecord:!!after.listening[qid+':individual'],
  diskUnchanged:JSON.stringify(before)===JSON.stringify(after),
  status:await page.locator('.save-status').getAttribute('data-status'),
  ordinaryRetryPersistedSubmission:false,
 };
 expect(observation.diskSubmitted).toBe(false);expect(observation.diskIndividualRecord).toBe(false);expect(observation.diskUnchanged).toBe(true);
 await page.evaluate(()=>{(window as any).__restoreFlowWrite?.();(window as any).__releaseFlowLock?.()});
 if(mode==='quota')await page.locator('.save-status').getByRole('button',{name:'重试保存',exact:false}).click();
 await expect(page.locator('.save-status')).toHaveAttribute('data-status','saved');
 const retried=await read();observation.ordinaryRetryPersistedSubmission=!!retried.listening[qid+':individual'];
 writeFileSync(new URL(`./observation-hsk${level}-${mode}.json`,import.meta.url),JSON.stringify(observation,null,2)+'\n');
 // This is a diagnostic observation, not a declaration that the observed behavior is acceptable.
});
