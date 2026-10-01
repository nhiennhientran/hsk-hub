from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
p=ROOT/'tools/tests/integration-step1-browser.cjs';s=p.read_text()
s=s.replace("({key,raw})=>localStorage.getItem(key)||localStorage.setItem(key,raw)","({key,raw})=>{if(location.protocol!=='http:')return;localStorage.getItem(key)||localStorage.setItem(key,raw);}")
s=s.replace("({old,key})=>{if(!localStorage.getItem(key))", "({old,key})=>{if(location.protocol!=='http:')return;if(!localStorage.getItem(key))")
s=s.replace("await p.locator('[data-receipt]').click();assert.equal(await p.locator('.s1-receipt-item').count(),5);", "await p.locator('[data-receipt]').click();assert.equal(await p.locator('#exercise').isVisible(),false,'Receipt mode must hide the homework page');assert.equal(await p.locator('.s1-receipt-item').count(),5);")
if 'Rendered module ready' not in s:
 old="async function open(p,relative){await p.goto(BASE+relative,{waitUntil:'domcontentloaded'});const o=p.locator('#pwOverlay');if(await o.isVisible().catch(()=>false)){await p.locator('#pwInput').fill('Ranlaoshimeimei');await p.locator('#pwBtn').click();await o.waitFor({state:'hidden'});}}"
 new="""async function open(p,relative){
 await p.goto(BASE+relative,{waitUntil:'domcontentloaded'});const o=p.locator('#pwOverlay');
 if(await o.isVisible().catch(()=>false)){await p.locator('#pwInput').fill('Ranlaoshimeimei');await p.locator('#pwBtn').click();await o.waitFor({state:'hidden'});}
 // Rendered module ready: a static placeholder button is not a completed app.
 const url=new URL(p.url());if(url.pathname.endsWith('/learning.html')){
  const mode=url.searchParams.get('mode')||'homework';
  if(mode==='homework')await p.locator('#lesson-list [data-lesson="15"]').waitFor();
  else if(mode==='progress')await p.locator('.integrated-progress-table').waitFor();
  else {await p.locator('#lesson-checks input[data-lesson="15"]').waitFor({state:'attached'});await p.waitForFunction(()=>document.getElementById('selection-summary').textContent.trim().length>0);}
 }
}"""
 assert old in s;s=s.replace(old,new)
p.write_text(s)
p=ROOT/'tools/tests/integration-step1-extra.cjs';s=p.read_text()
s=s.replace("'#vocabGrid .vocab-card'", "'#vocabGrid .vcard'")
s=s.replace("page.locator(`.vocab-card[data-zh=\"${word}\"] .listen`).first()", "page.locator('#vocabGrid .vcard').filter({has:page.locator('.vzh',{hasText:new RegExp('^'+word+'$')})}).locator('.speak-word')")
s=s.replace("await page.locator('#sceneSelect').selectOption('1');", "await page.locator('#sceneTabs .scene-tab[data-i=\"1\"]').click();")
s=s.replace("await importBackup(p,first);assert.equal(await input.inputValue()", "await importBackup(p,first);await part(p,'translation');assert.equal(await input.inputValue()")
s=s.replace("await p.locator('#apply-backup').click();assert.equal(await input.inputValue()", "await p.locator('#apply-backup').click();await part(p,'translation');assert.equal(await input.inputValue()")
s=s.replace("await c.addInitScript(()=>{if(!localStorage", "await c.addInitScript(()=>{if(location.protocol!=='http:')return;if(!localStorage")
if 'Local storage access denied' not in s:
 pos=s.rfind('\n};')
 s=s[:pos]+'''\n await check('Local storage access denied: visible warning, usable answers and export',async()=>{
  const c=await newContext();await c.addInitScript(()=>{if(location.protocol!=='http:')return;Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Injected access denial','SecurityError');}});});
  const p=await c.newPage();await open(p,'learning.html?mode=homework&lesson=1');await homeworkReady(p);await p.locator('#storage-notice').waitFor();
  const q=BANK[0].choice[0];await p.locator(`[data-option="${q.id}"][data-index="${q.answer}"]`).click();const dest=await backup(p,false,'storage-access-denied');assert.equal(JSON.parse(fs.readFileSync(dest,'utf8')).lessons[1].choice.draft[q.id],q.answer);
 });\n'''+s[pos:]
p.write_text(s)
print('Tests now wait for the actual rendered modules, use visible scene tabs, and exercise storage denial.')
