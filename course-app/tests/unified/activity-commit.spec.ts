import {test,expect,type Page} from '@playwright/test';
import raw2 from '../../content/hsk2/lesson-01.json' with {type:'json'};
import raw3 from '../../content/hsk3/lesson-18.json' with {type:'json'};
import {blank} from '../../src/state.ts';import {configs} from '../../src/config.ts';
import {activityReady,openLesson,submitSaved,type LessonFixture} from './lesson-ready.ts';

async function remountThroughOtherCourseRestore(page:Page,level:2|3){
 const other=level===2?3:2,backup={app:configs[other].id+'-backup',schema:1,exportedAt:Date.now(),data:blank(configs[other])};
 await page.getByRole('button',{name:'统一备份与恢复'}).click();const dialog=page.getByRole('dialog',{name:'学习记录备份'});
 await expect(dialog.locator('#unified-backup-file')).toHaveAccessibleName(/选择备份文件.*Chọn tệp sao lưu/);await expect(dialog.locator('[data-pair-import]')).toHaveAccessibleName(/导入HSK1完整或单独备份/);
 await dialog.locator('#unified-backup-file').setInputFiles({name:'synthetic-other-course.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
 await expect(dialog.locator('.backup-preview')).toHaveCount(1);await dialog.getByRole('button',{name:`确认恢复HSK ${other}`}).click();await expect(dialog).toContainText(`HSK ${other}已恢复`);await dialog.getByRole('button',{name:'关闭',exact:false}).click();
}
for(const level of [2,3] as const)for(const mode of ['failed','waiting'] as const)test(`HSK${level} ${mode} submission cannot reveal feedback after actual remount or become a later ordinary save`,async({page})=>{
 const lesson=(level===2?raw2:raw3) as unknown as LessonFixture,config=configs[level],suffix=level===2?'grammar1-practice1':'grammar2-practice3',a=lesson.activities.find(a=>a.id.endsWith(':'+suffix))!,oldId=lesson.id+':activity:previous-confirmed';
 const initial=blank(config),old={values:{answer:'此前的非空已提交记录'},checkedAt:42,updatedAt:42};initial.activities[oldId]=old;
 await page.addInitScript(({key,app,data})=>{sessionStorage.setItem('hsk_portal_unlocked_v2','1');if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({app,schema:1,revision:1,updatedAt:Date.now(),data,recovery:null}))},{key:config.storageKey,app:config.id,data:initial});
 await page.setViewportSize({width:390,height:900});await openLesson(page,lesson,'grammar');const g=await activityReady(page,a),input=g.locator('input');await input.fill('测试草稿');
 const record=()=>page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)!).data.activities[id],{key:config.storageKey,id:a.id});
 await expect.poll(async()=>(await record())?.values[a.fields[0].id]).toBe('测试草稿');await expect.poll(async()=>(await record())?.checkedAt).toBeNull();
 if(mode==='failed')await page.evaluate(key=>{const original=Storage.prototype.setItem;(window as any).__restoreSetItem=()=>Storage.prototype.setItem=original;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Test quota','QuotaExceededError');return original.call(this,k,v)}},config.storageKey);
 else await page.evaluate(async key=>{await new Promise<void>(ready=>{void navigator.locks.request(key+'-write',async()=>{ready();await new Promise<void>(release=>(window as any).__releaseCourseLock=release)})})},config.storageKey);
 await g.getByRole('button',{name:'提交并查看反馈'}).click();if(mode==='failed')await expect(page.locator('body')).toContainText('提交未确认');
 await expect(g.locator('.activity-feedback')).toBeEmpty();await expect(g.locator('.activity-feedback-note')).toHaveCount(0);expect((await record()).checkedAt).toBeNull();
 await remountThroughOtherCourseRestore(page,level);await activityReady(page,a);await expect(input).toHaveValue('测试草稿');await expect(g.locator('.activity-feedback')).toBeEmpty();await expect(g.locator('.activity-feedback-note')).toHaveCount(0);
 await page.evaluate(()=>{(window as any).__restoreSetItem?.();(window as any).__releaseCourseLock?.()});
 await page.getByRole('button',{name:'标记本部分已学'}).click();await expect(page.getByRole('button',{name:'本部分已学',exact:false})).toBeDisabled();expect((await record()).checkedAt).toBeNull();
 expect(await page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)!).data.activities[id],{key:config.storageKey,id:oldId})).toEqual(old);
 if(mode==='waiting'){
  // IME start and a newer edit invalidate a second lock-waiting submission.
  await page.evaluate(async key=>{await new Promise<void>(ready=>{void navigator.locks.request(key+'-write',async()=>{ready();await new Promise<void>(release=>(window as any).__releaseCourseLock=release)})})},config.storageKey);
  await g.getByRole('button',{name:'提交并查看反馈'}).click();await input.dispatchEvent('compositionstart');await g.getByRole('button',{name:'提交并查看反馈'}).click();await expect(page.locator('body')).toContainText('请先完成当前输入法输入');await input.fill('更晚的新草稿');await input.dispatchEvent('compositionend');await page.evaluate(()=>(window as any).__releaseCourseLock());
  await expect.poll(async()=>(await record()).values[a.fields[0].id]).toBe('更晚的新草稿');expect((await record()).checkedAt).toBeNull();await expect(g.locator('.activity-feedback')).toBeEmpty();
 }
 await submitSaved(page,lesson,a);await page.reload();await activityReady(page,a);await expect(g.locator('.activity-feedback')).not.toBeEmpty();expect((await record()).checkedAt).toBeGreaterThan(0);
 expect(await page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)!).data.activities[id],{key:config.storageKey,id:oldId})).toEqual(old);
 await g.screenshot({path:`test-results/unified-course-durable-submit-hsk${level}-${mode}-${test.info().project.name}.png`});
});
