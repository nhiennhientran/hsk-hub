from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
p=ROOT/'tools/tests/integration-step1-browser.cjs';s=p.read_text()
s=s.replace("({key,raw})=>localStorage.getItem(key)||localStorage.setItem(key,raw)","({key,raw})=>{if(location.protocol!=='http:')return;localStorage.getItem(key)||localStorage.setItem(key,raw);}")
s=s.replace("({old,key})=>{if(!localStorage.getItem(key))", "({old,key})=>{if(location.protocol!=='http:')return;if(!localStorage.getItem(key))")
s=s.replace("await p.locator('[data-receipt]').click();assert.equal(await p.locator('.s1-receipt-item').count(),5);", "await p.locator('[data-receipt]').click();assert.equal(await p.locator('#exercise').isVisible(),false,'Receipt mode must hide the homework page');assert.equal(await p.locator('.s1-receipt-item').count(),5);")
p.write_text(s)
p=ROOT/'tools/tests/integration-step1-extra.cjs';s=p.read_text()
s=s.replace("'#vocabGrid .vocab-card'", "'#vocabGrid .vcard'")
s=s.replace("page.locator(`.vocab-card[data-zh=\"${word}\"] .listen`).first()", "page.locator('#vocabGrid .vcard').filter({has:page.locator('.vzh',{hasText:new RegExp('^'+word+'$')})}).locator('.speak-word')")
s=s.replace("await importBackup(p,first);assert.equal(await input.inputValue()", "await importBackup(p,first);await part(p,'translation');assert.equal(await input.inputValue()")
s=s.replace("await p.locator('#apply-backup').click();assert.equal(await input.inputValue()", "await p.locator('#apply-backup').click();await part(p,'translation');assert.equal(await input.inputValue()")
s=s.replace("await c.addInitScript(()=>{if(!localStorage", "await c.addInitScript(()=>{if(location.protocol!=='http:')return;if(!localStorage")
if 'Human listening review page' not in s:
 pos=s.rfind('\n};')
 s=s[:pos]+'''\n await check('Human listening review page: 75 pending items, actual audio and device checklist export',async()=>{
  const c=await newContext(),p=await c.newPage();await open(p,'../../tools/review/hsk1-listening-device-review.html');
  await p.locator('#question-list [data-question]').first().waitFor();assert.equal(await p.locator('#question-list [data-question]').count(),75);assert.match(await p.locator('#review-count').innerText(),/^0\\/75/);
  await p.locator('#question-list [data-question]').first().click();await p.locator('#play-audio').click();await p.waitForFunction(()=>document.getElementById('lesson-audio').ended,null,{timeout:15000});
  await p.locator('#device').fill('Synthetic review test - not a real phone');const wait=p.waitForEvent('download');await p.locator('#export-review').click();const d=await wait,dest=file('human-review-test.json');await d.saveAs(dest);const data=JSON.parse(fs.readFileSync(dest,'utf8'));assert.equal(data.unchecked.length,75);assert.equal(Object.keys(data.items).length,0);assert.equal(await p.locator('[data-device]').count(),9);await screenshot(p,'human-review-page',false);
 });\n'''+s[pos:]
p.write_text(s)
print('Test-only DOM, import-navigation, screenshot and fixture-origin corrections applied.')
