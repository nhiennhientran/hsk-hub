import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,lstatSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {completeNative} from '../../course-app/docs/continue-phase2-20261005/ci/native-completion.mjs';
import {defaultHeadlessEntry} from '../../course-app/docs/resume-20261004/b14-narrow-ui/ci/browser-launch.mjs';

const repo=fileURLToPath(new URL('../../',import.meta.url));
const browser=process.env.HSK_L01_BROWSER;
assert.ok(['chromium','webkit'].includes(browser));
const out=resolve(process.env.HSK_L01_OUTPUT??join(repo,'hsk1-app/.repro-output/continue-phase5',browser));
mkdirSync(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
assert.equal(process.env.GITHUB_SHA,head,'Actual GitHub checkout required');
const binding={sourceCommit:head,sourceTree:tree,browser,runId:process.env.GITHUB_RUN_ID,runAttempt:process.env.GITHUB_RUN_ATTEMPT};
assert.ok(binding.runId&&binding.runAttempt);
const save=(name,v)=>writeFileSync(join(out,name),JSON.stringify(v,null,2)+'\n');
const read=name=>JSON.parse(readFileSync(join(out,name),'utf8'));
const item=file=>{const bytes=readFileSync(join(repo,file));return {file,bytes:bytes.length,sha256:sha(bytes)};};
function inputs(){
  const paths=git('ls-files','hsk1-app/src','hsk1-app/content','hsk1-app/tests','hsk1-app/tools','hsk1-app/package.json','hsk1-app/package-lock.json','hsk1-app/vite.config.ts','hsk1-app/tsconfig.json','hsk1-app/playwright.l01-candidate.config.ts','hsk1-app/public/source-activities/figures/l01-text-1-photo.png','hsk1-app/public/source-activities/figures/l01-text-2-photo.png','hsk1-app/public/source-activities/figures/l01-text-3-photo.png','.github/workflows/hsk-official-l01-candidate.yml','course-app/package.json','course-app/package-lock.json','course-app/docs/continue-phase2-20261005/ci/native-completion.mjs','course-app/docs/resume-20261004/b14-narrow-ui/ci/browser-launch.mjs').split('\n').filter(Boolean).sort();
  for(const p of paths)assert.ok(readFileSync(join(repo,p)).equals(execFileSync('git',['show',head+':'+p],{cwd:repo})),'Tracked source differs from checkout: '+p);
  const files=paths.map(item);return {files,sha256:sha(JSON.stringify(files))};
}
function compiled(dir){return readdirSync(dir).sort().flatMap(n=>{const p=join(dir,n),s=lstatSync(p);assert.equal(s.isSymbolicLink(),false);return s.isDirectory()?compiled(p):[{file:relative(out,p),bytes:s.size,sha256:sha(readFileSync(p))}];});}
function candidateLaunches(log,entry){
  const launches=[],pids=[];
  for(const raw of log.split(/\r?\n/u)){
    const line=raw.replace(/\u001b\[[0-?]*[ -/]*[@-~]/gu,'');
    if(line.includes('<launching>')){
      const m=line.match(/\bpw:browser\s+<launching>\s+(\S+)\s+(.+)$/u);assert.ok(m);
      assert.equal(m[1],entry.path);assert.match(m[2],/(?:^|\s)--headless(?:\s|$)/u);
      const transport=browser==='chromium'?'--remote-debugging-pipe':'--inspector-pipe';assert.ok(m[2].split(/\s+/u).includes(transport));
      launches.push({path:m[1],headless:true,transport});
    }
    if(line.includes('<launched>')){const m=line.match(/\bpw:browser\s+<launched>\s+pid=(\d+)(?:\s.*)?$/u);assert.ok(m&&Number(m[1])>0);pids.push(Number(m[1]));}
  }
  assert.ok(launches.length>=1,'Single compiled candidate host requires an actual browser launch');
  assert.equal(pids.length,launches.length);assert.equal(new Set(pids).size,pids.length);
  return {scope:'Single compiled real-candidate host; actual launch commands and distinct PIDs',browser,selectedExecutable:entry.selectedExecutable,actualLaunchCount:launches.length,launches:launches.map((v,i)=>({...v,pid:pids[i]}))};
}
const scope={candidateFields:24,bookFields:15,vocabularyMirrors:9,coreCompared:23,coreExactMatches:8,coreDifferences:15,wholeLessonAccepted:false,wholeLessonAdoption:0,defaultActivated:false,publicationApproved:false,deployed:false};
assert.deepEqual(JSON.parse(readFileSync(join(repo,'hsk1-app/content/official-vi-registry.json'),'utf8')),{schemaVersion:1,active:null});
const phase=process.argv[2];
if(phase==='before')save('before.json',{schemaVersion:1,...binding,...scope,inputs:inputs(),time:new Date().toISOString()});
else if(phase==='builds'){
  const before=read('before.json');assert.deepEqual(before.inputs,inputs());
  const files=compiled(join(out,'compiled'));assert.ok(files.length>0);
  const entry=defaultHeadlessEntry(repo,browser);
  const entryBytes=readFileSync(entry.path);
  save('builds.json',{schemaVersion:1,...binding,files,compiledInventorySHA256:sha(JSON.stringify(files)),installedBrowser:entry,browserEntry:{bytes:entryBytes.length,sha256:sha(entryBytes)}});
}else if(phase==='after'){
  const before=read('before.json'),builds=read('builds.json');
  for(const v of [before,builds])for(const k of Object.keys(binding))assert.equal(v[k],binding[k]);
  assert.deepEqual(before.inputs,inputs());assert.deepEqual(builds.files,compiled(join(out,'compiled')));
  assert.deepEqual(builds.installedBrowser,defaultHeadlessEntry(repo,browser));
  const entryBytes=readFileSync(builds.installedBrowser.path);assert.deepEqual(builds.browserEntry,{bytes:entryBytes.length,sha256:sha(entryBytes)});
  const cases=completeNative(read('native-results.json'),read('native-collection.json'),{browser,expected:3});
  const actualBrowserLaunch=candidateLaunches(readFileSync(join(out,'browser-launches.log'),'utf8'),builds.installedBrowser);
  const units=readFileSync(join(out,'candidate-units.log'),'utf8');
  const counts={};for(const k of ['tests','pass','fail','cancelled','skipped','todo'])counts[k]=Number(units.match(new RegExp('^# '+k+' (\\d+)\\s*$','m'))?.[1]);
  assert.deepEqual(counts,{tests:6,pass:6,fail:0,cancelled:0,skipped:0,todo:0});
  const expectedUnitTitles=[...readFileSync(join(repo,'hsk1-app/tests/official-vi-l01-candidate.test.mjs'),'utf8').matchAll(/^test\('([^']+)'/gm)].map(m=>m[1]);
  const actualUnitTitles=[...units.matchAll(/^ok \d+ - (.+)$/gm)].map(m=>m[1]);
  assert.equal(expectedUnitTitles.length,6);assert.equal(new Set(expectedUnitTitles).size,6);
  assert.deepEqual(actualUnitTitles.sort(),expectedUnitTitles.sort(),'Missing or mismatched real-candidate unit case');
  save('after.json',{schemaVersion:1,...binding,status:'passed-real-official-l01-partial-candidate',...scope,cases,counts,actualUnitTitles,actualBrowserLaunch,browserEntry:builds.browserEntry,sourceInputsUnchanged:true,compiledBytesUnchanged:true,compiledInventorySHA256:builds.compiledInventorySHA256,time:new Date().toISOString(),limitations:['Explicit real-candidate projection only; default registry remains inactive','Does not accept all first-lesson consumers or any complete lesson','Does not replace full-site engineering or release certification','Browser fingerprint covers selected entry and locked implementation, not every system library']});
}else throw Error('Choose before, builds, or after');
