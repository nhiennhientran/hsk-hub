import{test,expect}from'./hsk1-retained-runtime.mjs';import{readFile}from'node:fs/promises';
const key='ran_hsk1_modular_v1',session='hsk_portal_unlocked_v2',root=new URL('../../../../hsk1-app/tests/fixtures/migration/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8')),rawByKey={...JSON.parse(await readFile(new URL('reading-shared.json',root),'utf8')),...JSON.parse(await readFile(new URL('navigation.json',root),'utf8'))};
for(const[k,path]of Object.entries(manifest.storageFiles))rawByKey[k]=await readFile(new URL(path as string,root),'utf8');
test('HSK1 downloaded nonempty backup restores exact fresh-context data and rollback with explicit session test authorization',async({page,browser})=>{
 await page.addInitScript(({rawByKey,session})=>{sessionStorage.setItem(session,'1');for(const[k,v]of Object.entries(rawByKey))localStorage.setItem(k,v as string)},{rawByKey,session});
 await page.goto('/#/progress?lesson=10');await expect(page.locator('#module-host')).toHaveAttribute('data-state','ready');await page.locator('#open-data-manager').click();await page.locator('#preview-migration').click();await page.locator('#confirm-data-import').click();await expect(page.locator('#data-status')).toHaveAttribute('data-state','saved');
 const downloaded=page.waitForEvent('download');await page.locator('#export-backup').click();const download=await downloaded;expect(await download.failure()).toBeNull();const stream=await download.createReadStream(),chunks:Buffer[]=[];for await(const b of stream!)chunks.push(Buffer.from(b));const raw=Buffer.concat(chunks).toString(),backup=JSON.parse(raw);expect(Object.keys(backup.data.homework.lessons).length).toBeGreaterThanOrEqual(2);expect(raw).not.toContain(`"${session}"`);
 const context=await browser.newContext();try{
  const fresh=await context.newPage();await fresh.goto(page.url());await expect(fresh.locator('#auth-gate')).toBeVisible();expect(await fresh.evaluate(k=>sessionStorage.getItem(k),session)).toBeNull();
  // Match the explicit fixture used by the retained suite's authenticatedPage helper.
  // This is backup behavior acceptance under authorized test session, not password validation.
  await context.addInitScript(k=>sessionStorage.setItem(k,'1'),session);await fresh.reload();await expect(fresh.locator('#module-host')).toHaveAttribute('data-state','ready');await fresh.locator('#open-data-manager').click();
  const disk=()=>fresh.evaluate(k=>JSON.parse(localStorage.getItem(k)!).data,key);
  const restore=async(data:unknown)=>{await fresh.locator('#backup-file').setInputFiles({name:'nonempty-original-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await expect(fresh.locator('#migration-preview')).toBeVisible();await fresh.locator('#confirm-data-import').click();await expect(fresh.locator('#data-status')).toHaveAttribute('data-state','saved')};
  await restore(backup);expect(await disk()).toEqual(backup.data);
  const changed=structuredClone(backup);changed.data.reading.lessons['2']={visited:true,complete:false};await restore(changed);expect(await disk()).toEqual(changed.data);expect(await fresh.evaluate(k=>JSON.parse(localStorage.getItem(k)!).recovery.data,key)).toEqual(backup.data);
  await fresh.locator('#restore-data').click();await expect(fresh.locator('#data-status')).toHaveAttribute('data-state','saved');expect(await disk()).toEqual(backup.data);await fresh.reload();expect(await disk()).toEqual(backup.data);
 }finally{await context.close()}
});
