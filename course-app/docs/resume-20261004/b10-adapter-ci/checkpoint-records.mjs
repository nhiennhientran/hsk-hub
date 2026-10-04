import {readFileSync,readdirSync,lstatSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {runtimeSourceScopes,runtimeSourceSnapshot} from '../../../tools/package-unified.mjs';
import {snapshotRuntimeSource,assertTestedRuntimeSource} from '../../../tools/release-readiness.mjs';
import {verifyNativeResults} from './verify-native-results.mjs';

const repo=fileURLToPath(new URL('../../../../',import.meta.url)),browser=process.env.HSK_ADAPTER_CI_BROWSER;
assert.ok(['chromium','webkit'].includes(browser),'Actual matrix browser must be explicit');
const dir=resolve(repo,'course-app/.repro-output/b10-adapter-ci',browser);mkdirSync(dir,{recursive:true});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=args=>execFileSync('git',args,{cwd:repo,encoding:'utf8',maxBuffer:32*1024*1024}).trim();
const read=file=>JSON.parse(readFileSync(resolve(repo,file),'utf8'));
const ref=file=>{const bytes=readFileSync(resolve(repo,file));return {file,bytes:bytes.length,sha256:sha(bytes)}};
const write=(name,value)=>writeFileSync(resolve(dir,name),JSON.stringify(value,null,2)+'\n');
const sourceScopes=[...new Set([...runtimeSourceScopes,'new-hsk1','hsk1-app/tools','hsk1-app/review','hsk1-app/index.html',
 'hsk1-app/package.json','hsk1-app/package-lock.json','hsk1-app/vite.config.ts','hsk1-app/tsconfig.json',
 'hsk1-app/tests','course-app/tests','hsk1-app/playwright.vi-presentation.config.ts','hsk1-app/tsconfig.vi-presentation-tests.json',
 'course-app/playwright.config.ts','course-app/docs/resume-20261004/b10-hsk23-adapter/playwright.history.config.ts',
 'course-app/docs/resume-20261004/b10-adapter-ci','.github/workflows/hsk-official-vi-adapter-checkpoint.yml'])];
const identity=()=>({checkoutCommit:git(['rev-parse','HEAD']),checkoutTree:git(['rev-parse','HEAD^{tree}']),
 githubSHA:process.env.GITHUB_SHA??null,githubRef:process.env.GITHUB_REF??null,runId:process.env.GITHUB_RUN_ID??null,
 runAttempt:process.env.GITHUB_RUN_ATTEMPT??null,browser,node:process.version});
const registries=()=>['course-app/content/official-vi-registry.json','hsk1-app/content/official-vi-registry.json'].map(file=>({...ref(file),value:read(file)}));
function inputs(){const official=runtimeSourceSnapshot(repo),extended=snapshotRuntimeSource(repo,sourceScopes);return {officialRuntimeScopes:runtimeSourceScopes,officialRuntimeSourceSnapshot:official,extendedBuildAndFixtureScopes:sourceScopes,extendedBuildAndFixtureSnapshot:extended}}
function currentSource(head){const value=inputs();assertTestedRuntimeSource(repo,head,value.officialRuntimeSourceSnapshot,runtimeSourceScopes);assertTestedRuntimeSource(repo,head,value.extendedBuildAndFixtureSnapshot,sourceScopes);return value}
function manifest(folder){
 const root=resolve(repo,folder),files=[];
 function visit(path){for(const name of readdirSync(path).sort()){const file=resolve(path,name),stat=lstatSync(file);assert.ok(!stat.isSymbolicLink(),'Built output symlink');if(stat.isDirectory())visit(file);else {assert.ok(stat.isFile());files.push(ref(relative(repo,file).replaceAll('\\','/')))}}}
 visit(root);assert.ok(files.some(f=>f.file===folder+'/index.html'),'Built entry HTML missing');
 return {folder,fileCount:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0),inventorySHA256:sha(JSON.stringify(files)),files};
}
async function decodedRawSources(){
 const content=resolve(repo,'course-app/content'),sources=[...['hsk2','hsk3'].flatMap(level=>readdirSync(resolve(content,level)).filter(f=>/^lesson-\d{2}\.json$/.test(f)).map(f=>`course-app/content/${level}/${f}`)),
  'course-app/content/hsk2-lexicon.json','course-app/content/hsk3-lexicon.json','course-app/content/course-index.json'].sort();
 assert.equal(sources.length,36);const assets=resolve(repo,'course-app/.repro-output/b10-hsk23-adapter/dist/assets'),chunks=[];
 for(const name of readdirSync(assets).sort())if(/^(?:lesson-\d{2}|hsk[23]-lexicon|course-index)-.+\.js$/.test(name)){
  const file=resolve(assets,name),raw=(await import(pathToFileURL(file).href)).default;if(typeof raw==='string')chunks.push({file:relative(repo,file).replaceAll('\\','/'),raw,sha256:sha(raw)});
 }
 return sources.map(file=>{const source=ref(file),matches=chunks.filter(c=>c.sha256===source.sha256);assert.equal(matches.length,1,'One exact decoded raw chunk required: '+file);assert.equal(matches[0].raw,readFileSync(resolve(repo,file),'utf8'));return {...source,compiledChunk:ref(matches[0].file),decodedBytesEqual:true}});
}
function versions(){
 const installed=[];
 for(const app of ['course-app','hsk1-app']){const require=createRequire(resolve(repo,app,'package.json'));
  const packageFile=require.resolve('@playwright/test/package.json'),value=JSON.parse(readFileSync(packageFile,'utf8')),lock=read(app+'/package-lock.json');
  assert.equal(value.version,'1.62.1');assert.equal(lock.packages['node_modules/@playwright/test'].version,value.version);
  const pw=require('playwright'),entry=pw[browser].executablePath();assert.ok(existsSync(entry),'Actual installed browser launch entry missing');
  const core=require.resolve('playwright-core/package.json'),descriptor=resolve(core,'../browsers.json');
  installed.push({app,packageVersion:value.version,lock:ref(app+'/package-lock.json'),
   installedPackageSHA256:sha(readFileSync(packageFile)),browserDescriptorSHA256:sha(readFileSync(descriptor)),
   browserLaunchEntry:{path:entry,bytes:readFileSync(entry).length,sha256:sha(readFileSync(entry)),meaning:'launch entry only; not a hash of all browser/system libraries'}});
 }
 assert.equal(installed[0].browserDescriptorSHA256,installed[1].browserDescriptorSHA256,'Different Playwright browser revisions');return installed;
}
const required=['course-install','hsk1-install','course-units','hsk1-units','course-source','hsk1-source','hsk1-migration-fixtures',
 'course-types','hsk1-types','native-fixture-types','native-report-guards','browser-install','font-install','hsk1-build','course-build','hsk1-asset-bytes','hsk1-native','hsk23-native'];
const phase=process.argv[2];
try{
 if(phase==='before'){
  assert.equal(process.env.HSK_BROWSER_PATH,undefined,'CI must use the actually installed locked matrix browser, not an external executable override');
  const id=identity();assert.equal(id.checkoutCommit,process.env.GITHUB_SHA,'Actual checkout must equal GitHub run SHA');
  write('before.json',{schemaVersion:1,phase:'before',status:'recorded-clean-checkout',recordedAt:new Date().toISOString(),...id,...currentSource(id.checkoutCommit),registries:registries()});
 }else if(phase==='builds'){
  const before=readFileSync(resolve(dir,'before.json'),'utf8'),prior=JSON.parse(before),id=identity();assert.equal(id.checkoutCommit,prior.checkoutCommit);
  const source=currentSource(id.checkoutCommit);assert.equal(source.extendedBuildAndFixtureSnapshot.sha256,prior.extendedBuildAndFixtureSnapshot.sha256,'Build inputs drifted');
  const builds=[manifest('hsk1-app/dist'),manifest('course-app/.repro-output/b10-hsk23-adapter/dist')];
  write('builds.json',{schemaVersion:1,phase:'builds',status:'built-and-hashed',recordedAt:new Date().toISOString(),...id,extendedBuildAndFixtureSnapshotSHA256:source.extendedBuildAndFixtureSnapshot.sha256,
   installedPlaywright:versions(),installedNotoCJKVersion:execFileSync('dpkg-query',['-W','-f=${Version}\n','fonts-noto-cjk'],{encoding:'utf8'}).trim(),builds,hsk23RawCompiledSourceBytes:await decodedRawSources(),
   nativeConsumerModes:{hsk1:'Auth-free Vite dev source harness on18911; independent dist build is separately hashed and asset-checked.',hsk23:'Actual compiled isolated dist preview on4179.'}});
 }else if(phase==='after'){
  const prior=JSON.parse(readFileSync(resolve(dir,'before.json'),'utf8')),built=JSON.parse(readFileSync(resolve(dir,'builds.json'),'utf8')),id=identity();
  assert.equal(id.checkoutCommit,prior.checkoutCommit);assert.equal(id.checkoutTree,prior.checkoutTree);assert.equal(id.checkoutCommit,process.env.GITHUB_SHA);
  const source=currentSource(id.checkoutCommit);assert.equal(source.officialRuntimeSourceSnapshot.sha256,prior.officialRuntimeSourceSnapshot.sha256,'Runtime changed during native test');
  assert.equal(source.extendedBuildAndFixtureSnapshot.sha256,prior.extendedBuildAndFixtureSnapshot.sha256,'Build/fixture source changed during native test');
  for(const original of built.builds){const after=manifest(original.folder);assert.deepEqual(after,original,'Built bytes changed during native tests')}
  const commands=required.map(label=>{const file=relative(repo,resolve(dir,label+'.command.json')).replaceAll('\\','/'),value=read(file);assert.equal(value.browser,browser);assert.equal(value.exitCode,0,label+' command failed');assert.equal(value.signal,null);assert.equal(value.spawnError,null);
   assert.deepEqual(ref(value.log.file),value.log,'Log bytes changed');
   if(label.endsWith('-units')||label==='native-report-guards'){const log=readFileSync(resolve(repo,value.log.file),'utf8');assert.ok(!/(?:#|ℹ)\s*(?:fail|cancelled|skipped|todo)\s+[1-9]\d*/u.test(log),'Unit skip/fail/cancel/todo');}
   return {...ref(file),label,exitCode:0,log:value.log};});
  const native=[['hsk1',3],['hsk23',8]].map(([app,count])=>{const file=relative(repo,resolve(dir,app+'-results.json')).replaceAll('\\','/');return {app,report:ref(file),...verifyNativeResults(read(file),{browser,expectedCount:count,expectedFile:'official-vi-history.spec.ts'})}});
  write('after.json',{schemaVersion:1,phase:'after',status:'accepted-native-checkpoint-not-release',recordedAt:new Date().toISOString(),...id,
   officialRuntimeSourceSnapshotSHA256:source.officialRuntimeSourceSnapshot.sha256,extendedBuildAndFixtureSnapshotSHA256:source.extendedBuildAndFixtureSnapshot.sha256,
   actualNativeCases:native.reduce((n,r)=>n+r.passed,0),native,commands,buildManifest:ref(relative(repo,resolve(dir,'builds.json')).replaceAll('\\','/')),registries:registries(),publicationApproved:false,deployed:false});
 }else throw Error('Usage: checkpoint-records.mjs before|builds|after');
}catch(error){
 write(phase+'-failure.json',{schemaVersion:1,phase,status:'failed-no-native-acceptance',recordedAt:new Date().toISOString(),...identity(),error:String(error),stack:error.stack});
 process.stderr.write(String(error)+'\n');process.exitCode=1;
}
