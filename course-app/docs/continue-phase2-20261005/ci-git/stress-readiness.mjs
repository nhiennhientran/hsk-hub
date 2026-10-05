import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseSync} from '../../../node_modules/rolldown/dist/utils-index.mjs';

// Finite actual-fixture stress plus controlled failure probes. Never retries a
// failed execution. It certifies observations only, not the historical cause.
const dir=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(dir,'../../../..'),course=path.join(repo,'course-app');
// CI must write generated diagnostics outside the immutable source/docs vector.
// A relative override resolves against the caller's working directory.
const outputDir=process.env.HSK_PHASE2_DIAGNOSTIC_OUT?path.resolve(process.env.HSK_PHASE2_DIAGNOSTIC_OUT):dir;
const option=(name,fallback)=>Number(process.argv.find(x=>x.startsWith(name+'='))?.slice(name.length+1)??fallback);
const runs=option('--runs',12),parallel=option('--parallel',3);
if(!Number.isInteger(runs)||runs<1||runs>30||!Number.isInteger(parallel)||parallel<1||parallel>4)throw Error('Use --runs=1..30 --parallel=1..4');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sourcePath=path.join(course,'tests/release-readiness.test.mjs'),source=fs.readFileSync(sourcePath,'utf8');
const sourceSHA256=hash(source),baseline='a18a8cae149f3e63079b6d2b6b5b9f4ab630267d';
const oldSource=execFileSync('git',['show',baseline+':course-app/tests/release-readiness.test.mjs'],{cwd:repo,encoding:'utf8'});
function declared(text,name){const parsed=parseSync('readiness.js',text,{lang:'js'});assert.equal(parsed.errors.length,0);const node=parsed.program.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===name);assert.ok(node,name);return text.slice(node.start,node.end);}
const baseContext={...Object.fromEntries(['mkdtempSync','mkdirSync','writeFileSync','readFileSync','rmSync','symlinkSync','chmodSync','statSync'].map(k=>[k,fs[k]])),join:path.join,tmpdir:os.tmpdir,execFileSync,process};
const context=vm.createContext({...baseContext});vm.runInContext(declared(source,'runFixtureGit')+';globalThis.actualGit=runFixtureGit;',context);
const probes=[];
const controlled=fs.mkdtempSync(path.join(os.tmpdir(),'hsk-readiness-lock-probe-'));
try{
  context.actualGit(controlled,['init']);fs.writeFileSync(path.join(controlled,'probe.txt'),'Synthetic Git fixture data.');
  fs.writeFileSync(path.join(controlled,'.git/index.lock'),'explicit synthetic held lock');
  let failure;try{context.actualGit(controlled,['add','.']);}catch(error){failure=error;}
  assert.ok(failure?.fixtureGit);const d=failure.fixtureGit;
  assert.equal(d.command,'git');assert.deepEqual([...d.args],['add','.']);assert.equal(d.cwd,controlled);assert.equal(d.status,128);
  assert.match(d.stderr,/index\.lock/);assert.equal(d.indexLockState.exists,true);assert.equal(d.cwdState.exists,true);
  // Still blocked until the probe explicitly removes its own lock. No helper retry.
  assert.throws(()=>context.actualGit(controlled,['add','.']));
  probes.push({name:'actual controlled index.lock failure retains command/cwd/status/stderr and remains a failure',passed:true,diagnostics:d});
  fs.rmSync(path.join(controlled,'.git/index.lock'));assert.equal(context.actualGit(controlled,['add','.']),'');
  probes.push({name:'actual add succeeds only after explicit controlled lock removal',passed:true});
}finally{fs.rmSync(controlled,{recursive:true,force:true});}
for(const [label,text] of [['historical',oldSource],['current',source]]){
  const created=[],fake=vm.createContext({...baseContext,mkdtempSync:prefix=>{const p=fs.mkdtempSync(prefix);created.push(p);return p;},
    execFileSync:()=>{throw Object.assign(new Error('Synthetic constructor Git initialization failure'),{status:128,stdout:'',stderr:'synthetic-init-failure',signal:null});}});
  vm.runInContext((label==='current'?declared(text,'runFixtureGit')+'\n':'')+declared(text,'fixture')+';globalThis.make=fixture;',fake);
  let failure;try{fake.make();}catch(error){failure=error;}
  assert.ok(failure);assert.equal(created.length,1);const remains=fs.existsSync(created[0]);assert.equal(remains,label==='historical');
  probes.push({name:label+' construction failure cleanup observation',passed:true,temporaryDirectoryRemained:remains,
    expectedRemaining:label==='historical',diagnosticPreserved:label==='current'?failure.fixtureGit?.stderr==='synthetic-init-failure':null});
  for(const p of created)fs.rmSync(p,{recursive:true,force:true});
}
fs.mkdirSync(outputDir,{recursive:true});fs.writeFileSync(path.join(outputDir,'helper-negative-probes.json'),JSON.stringify({schemaVersion:1,sourceSHA256,baseline,baselineSHA256:hash(oldSource),probes,
  historicalCIExit128Cause:'undetermined; synthetic probes are deliberately induced and not evidence of the CI cause'},null,2)+'\n');
const execution=[];let next=0;
async function worker(){while(next<runs){const run=++next,name='stress-run-'+String(run).padStart(2,'0')+'.tap',file=path.join(outputDir,name),startedAt=new Date().toISOString(),start=Date.now();
  const output=fs.createWriteStream(file),args=['--experimental-strip-types','--test','--test-reporter=tap','tests/release-readiness.test.mjs'];
  const child=spawn(process.execPath,args,{cwd:course,env:process.env});child.stdout.pipe(output,{end:false});child.stderr.pipe(output,{end:false});
  const outcome=await new Promise(resolve=>{child.on('error',error=>resolve({spawnError:String(error),exitCode:null,signal:null}));child.on('close',(exitCode,signal)=>resolve({exitCode,signal}));});
  await new Promise(resolve=>output.end(resolve));const bytes=fs.readFileSync(file),text=bytes.toString('utf8'),metrics={};
  for(const key of ['tests','pass','fail','cancelled','skipped','todo'])metrics[key]=Number(text.match(new RegExp('^# '+key+' (\\d+)\\s*$','m'))?.[1]??NaN);
  execution.push({run,argv:[process.execPath,...args],cwd:course,startedAt,durationMilliseconds:Date.now()-start,...outcome,metrics,
    output:{file:name,bytes:bytes.length,sha256:hash(bytes)},passed:outcome.exitCode===0&&metrics.tests===9&&metrics.pass===9&&['fail','cancelled','skipped','todo'].every(k=>metrics[k]===0)});
  process.stdout.write(JSON.stringify({run,exitCode:outcome.exitCode,metrics})+'\n');
}}
const startedAt=new Date().toISOString();await Promise.all(Array.from({length:parallel},worker));
const stable=hash(fs.readFileSync(sourcePath))===sourceSHA256;
const report={schemaVersion:1,status:execution.every(x=>x.passed)&&stable?'passed-finite-current-fixture-stress':'failed-current-fixture-stress',
  startedAt,completedAt:new Date().toISOString(),runs,parallel,sourceSHA256,sourceBytesStable:stable,baseline,outputDirectory:outputDir,
  node:process.version,platform:process.platform,gitVersion:execFileSync('git',['--version'],{encoding:'utf8'}).trim(),
  inheritedGitEnvironmentNames:Object.keys(process.env).filter(k=>k.startsWith('GIT_')).sort(),execution:execution.sort((a,b)=>a.run-b.run),
  controlledProbes:probes.length,historicalFailureReproduced:false,
  limits:'Finite passing stress does not establish that the historical CI exit 128 is fixed. The old stderr was discarded; that cause remains unknown. Controlled index.lock and constructor-failure probes test diagnostics/cleanup only. No automatic retry, assertions removed, runtime changes, or production writes.'};
fs.writeFileSync(path.join(outputDir,'stress-results.json'),JSON.stringify(report,null,2)+'\n');
process.stdout.write(JSON.stringify({status:report.status,actualTestExecutions:execution.reduce((n,r)=>n+(r.metrics.tests||0),0),controlledProbes:probes.length,sourceBytesStable:stable})+'\n');
if(report.status!=='passed-finite-current-fixture-stress')process.exitCode=1;
