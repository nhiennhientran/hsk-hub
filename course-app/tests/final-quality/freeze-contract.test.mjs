import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {hash} from '../../tools/package-core.mjs';
import {verifyInventory,verifyNative,stagingBranch,finalBrowserCases} from '../../tools/final-quality-20261006/freeze-contract.mjs';
import {verifyGitTree} from '../../tools/final-quality-20261006/verify-git-tree.mjs';
function fixture(run){
 const site=mkdtempSync(join(tmpdir(),'hsk-freeze-contract-'));
 try{
  mkdirSync(join(site,'assets'));writeFileSync(join(site,'index.html'),'<p>你好</p>');writeFileSync(join(site,'assets/app.js'),'export const ready=true;');
  const files=['assets/app.js','index.html'].map(path=>{const bytes=readFileSync(join(site,path));return {path,bytes:bytes.length,sha256:hash(bytes)};});
  const inventory={schemaVersion:1,sourceDirty:false,buildProvenance:'built-from-recorded-worktree',files,inventorySHA256:hash(Buffer.from(JSON.stringify(files)))};
  return run(site,inventory);
 }finally{rmSync(site,{recursive:true,force:true});}
}
test('frozen inventory accepts actual byte identity, including multibyte Chinese',()=>fixture((site,inventory)=>assert.equal(verifyInventory(site,inventory),inventory.inventorySHA256)));
test('same-length altered content cannot pass a frozen inventory',()=>fixture((site,inventory)=>{writeFileSync(join(site,'index.html'),'<p>您好</p>');assert.throws(()=>verifyInventory(site,inventory),/bytes differ/);}));
test('extra, duplicate or missing artifact paths cannot pass native-test identity',()=>{
 fixture((site,inventory)=>{writeFileSync(join(site,'extra.js'),'extra');assert.throws(()=>verifyInventory(site,inventory),/missing or extra/);});
 fixture((site,inventory)=>{inventory.files.push({...inventory.files[0]});assert.throws(()=>verifyInventory(site,inventory),/Duplicate/);});
 fixture((site,inventory)=>{rmSync(join(site,'assets/app.js'));assert.throws(()=>verifyInventory(site,inventory),/missing or extra/);});
});
function nativeFixture(){
 const specs=Array.from({length:finalBrowserCases},(_,n)=>({id:`case-${n}`,title:`Case ${n}`,tests:[{projectName:'chromium',status:'expected',results:[{status:'passed',retry:0,errors:[]}]}]}));
 const report={errors:[],stats:{expected:finalBrowserCases,unexpected:0,skipped:0,flaky:0},suites:[{specs}]};
 return {report,collection:structuredClone(report)};
}
test('complete native identity is required for all 127 individually executed cases',()=>{const f=nativeFixture();assert.equal(verifyNative(f.report,f.collection,'chromium').length,127);});
for(const [name,mutate]of [
 ['missing case',f=>f.report.suites[0].specs.pop()],
 ['skipped result',f=>{f.report.stats.skipped=1;f.report.suites[0].specs[0].tests[0].results[0].status='skipped';}],
 ['retry',f=>{f.report.suites[0].specs[0].tests[0].results[0].retry=1;}],
 ['multiple attempts',f=>{f.report.suites[0].specs[0].tests[0].results.push({status:'passed',retry:1,errors:[]});}],
 ['wrong engine',f=>{f.report.suites[0].specs[0].tests[0].projectName='webkit';}]
])test(`native publication evidence rejects ${name}`,()=>{const f=nativeFixture();mutate(f);assert.throws(()=>verifyNative(f.report,f.collection,'chromium'));});
test('staging destinations are bounded to new numeric run identities',()=>{assert.equal(stagingBranch('12345','1'),'work/hsk-final-staging-20261006-12345-1');for(const args of [['gh-pages','1'],['12','0'],['../main','2']])assert.throws(()=>stagingBranch(...args));});
test('real Git blob bytes are streamed and an incorrect SHA-256 is rejected without writing Git',async()=>{
 const repo=resolve(import.meta.dirname,'../../..'),path='hsk1-app/src/services/auth/index.ts';
 const bytes=execFileSync('git',['show','HEAD:'+path],{cwd:repo}),tree=execFileSync('git',['rev-parse','HEAD:hsk1-app/src/services/auth'],{cwd:repo,encoding:'utf8'}).trim();
 const inventory={files:[{path:'index.ts',bytes:bytes.length,sha256:hash(bytes)}]};
 const actual=await verifyGitTree(repo,tree,inventory);assert.equal(actual.paths,1);assert.equal(actual.gitTree,tree);assert.equal(actual.sha256Verified,true);
 await assert.rejects(verifyGitTree(repo,tree,{files:[{...inventory.files[0],sha256:'0'.repeat(64)}]}),/SHA-256 differs/);
});
