from pathlib import Path
import json, subprocess
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'new-hsk1/hsk1/learning-integrated.js'
s=p.read_text()
if 'function initializeSessionGate()' not in s:
 s=s.replace("function routeHref(nextMode,l){\n  const n=", "function routeHref(nextMode,l){\n  const savedHomework=readNav().homeworkLesson;\n  if(nextMode==='homework'&&mode!=='homework'&&Number.isInteger(savedHomework)&&savedHomework>=1&&savedHomework<=15)l=savedHomework;\n  const n=")
 s=s.replace('async function boot(){', "function initializeSessionGate(){if(typeof window.initGate==='function')window.initGate();}\nif(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeSessionGate,{once:true});else initializeSessionGate();\nasync function boot(){")
 p.write_text(s)
p=ROOT/'tools/tests/integration-step1-browser.cjs';s=p.read_text()
if 'cancelledRequests:[]' not in s:
 s=s.replace('errors:[],network:[]','errors:[],network:[],cancelledRequests:[]')
 s=s.replace("p.on('requestfailed',r=>{if(r.url().startsWith(BASE)&&r.failure()?.errorText!=='net::ERR_ABORTED')report.network.push({check:activeCheck,url:r.url(),error:r.failure()?.errorText});});", "p.on('requestfailed',r=>{if(!r.url().startsWith(BASE))return;const error=r.failure()?.errorText,record={check:activeCheck,url:r.url(),error};if(['net::ERR_ABORTED','Load request cancelled'].includes(error))report.cancelledRequests.push(record);else report.network.push(record);});")
 s=s.replace("await page.locator('#integratedNav [data-mode=\"homework\"]').click();await homeworkReady(page);await page.locator('#integratedNav [data-mode=\"vocab\"]').click();", "await page.locator('#integratedNav [data-mode=\"homework\"]').click();await homeworkReady(page);assert.match(page.url(),/lesson=8/);assert.match(await page.locator('#input-'+BANK[7].translation[0].id).inputValue(),/đặng/);await page.locator('#integratedNav [data-mode=\"vocab\"]').click();")
 p.write_text(s)
if "integration-step1-extra.cjs" not in s:
 s=s.replace(" await check('No uncaught application errors", " await require('./integration-step1-extra.cjs')({assert,fs,path,check,page,newContext,open,homeworkReady,saved,state,order,choose,sort,submit,part,screenshot,backup,importBackup,delay,BASE,OUT,file,E1,E2,E3,BANK,C,report});\n await check('No uncaught application errors",1);p.write_text(s)
catalog=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./new-hsk1/hsk1/stage3/catalog.js')))"],cwd=ROOT,text=True))
v=[{k:v[k] for k in ['lesson','zh','py','vi','category','extension']} for v in catalog['vocabulary'] if v['lesson']<=8]
a={}
for v0 in catalog['vocabulary']:
 if v0['lesson']<=8 and v0['audio']:
  q=v0['audio'];a.setdefault(q['track'],[]).append([v0['zh'],q['start'],q['end']])
s=(ROOT/'tools/integration-step1-textbook.js.in').read_text().replace('__VOCABULARY__',json.dumps(v,ensure_ascii=False,separators=(',',':'))).replace('__AUDIO__',json.dumps(a,ensure_ascii=False,separators=(',',':')))
(ROOT/'new-hsk1/hsk1/textbook-integration-corrections.js').write_text(s)
for name,anchor in [('index.html','<script src="new-enrichment.js'),('lesson.html','<script src="pos-tips.js')]:
 p=ROOT/'new-hsk1/hsk1'/name;s=p.read_text()
 if 'textbook-integration-corrections.js' not in s:
  start=s.index(anchor);end=s.index('</script>',start)+9
  s=s[:end]+'\n<script src="textbook-integration-corrections.js?v=20261001-i1"></script>'+s[end:];p.write_text(s)
print('First-eight textbook corrections, session initialization and review continuation prepared.')
