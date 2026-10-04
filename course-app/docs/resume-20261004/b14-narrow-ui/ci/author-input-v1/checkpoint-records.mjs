import {readFileSync,readdirSync,lstatSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {runtimeSourceScopes,runtimeSourceSnapshot} from '../../../../tools/package-unified.mjs';
import {snapshotRuntimeSource,assertTestedRuntimeSource} from '../../../../tools/release-readiness.mjs';
import {actualBrowser,branch,evidenceRoot,commandPlan} from './contract.mjs';
import {verifyNativeResults,verifyScreenshotSet} from './verify-native-results.mjs';
import {inspectPNG} from './verify-png.mjs';
import {verifyCommands} from './verify-commands.mjs';

const repo=fileURLToPath(new URL('../../../../../',import.meta.url)),browser=actualBrowser(process.env.HSK_B14_CI_BROWSER),dir=resolve(repo,evidenceRoot(browser));
mkdirSync(dir,{recursive:true});const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=args=>execFileSync('git',args,{cwd:repo,encoding:'utf8',maxBuffer:32*1024*1024}).trim();
const read=file=>JSON.parse(readFileSync(resolve(repo,file),'utf8'));
const ref=file=>{const bytes=readFileSync(resolve(repo,file));return {file,bytes:bytes.length,sha256:sha(bytes)}};
const write=(name,value)=>writeFileSync(resolve(dir,name),JSON.stringify(value,null,2)+'\n');
const own='course-app/docs/resume-20261004/b14-narrow-ui';
const sourceScopes=[...new Set([...runtimeSourceScopes,'new-hsk1','hsk1-app/tools','hsk1-app/review','hsk1-app/index.html',
 'hsk1-app/package.json','hsk1-app/package-lock.json','hsk1-app/vite.config.ts','hsk1-app/tsconfig.json',
 'course-app/tests','hsk1-app/tests',own,'.github/workflows/hsk-b14-narrow-ui-checkpoint.yml'])];
const identity=()=>({checkoutCommit:git(['rev-parse','HEAD']),checkoutTree:git(['rev-parse','HEAD^{tree}']),githubSHA:process.env.GITHUB_SHA??null,
 githubRef:process.env.GITHUB_REF??null,runId:process.env.GITHUB_RUN_ID??null,runAttempt:process.env.GITHUB_RUN_ATTEMPT??null,browser,node:process.version});
function source(head){
 const official=runtimeSourceSnapshot(repo),extended=snapshotRuntimeSource(repo,sourceScopes);
 assertTestedRuntimeSource(repo,head,official,runtimeSourceScopes);assertTestedRuntimeSource(repo,head,extended,sourceScopes);
 assert.equal(git(['status','--porcelain','--',...sourceScopes]),'','Source/build/fixture scope must be clean at exact tested HEAD');
 return {officialRuntimeScopes:runtimeSourceScopes,officialRuntimeSourceSnapshot:official,extendedSourceScopes:sourceScopes,extendedSourceSnapshot:extended};
}
function registries(){
 const h1='hsk1-app/content/official-vi-registry.json',h23='course-app/content/official-vi-registry.json';
 assert.deepEqual(read(h1),{schemaVersion:1,active:null});assert.deepEqual(read(h23),{schemaVersion:1,courses:{hsk2:null,hsk3:null}});
 return [h1,h23].map(file=>({...ref(file),value:read(file)}));
}
function originalFreeze(){
 const freeze=read(own+'/FREEZE.json'),manifest=readFileSync(resolve(repo,own+'/STAGE-FILES.txt'),'utf8').trim().split('\n');
 assert.equal(manifest.length,21,'Frozen original B14 paths');
 assert.equal(ref(own+'/STAGE-FILES.txt').sha256,'6ea1ee60824bf5f9f4b03b6836489572b8040074eb5d7a7f61eddeaa5eb6e014','Original B14 path manifest changed');
 assert.equal(ref(own+'/FREEZE.json').sha256,'ad3e054abd7ab18bcff7630fbf8fa04ea5e3db84ce3af2cf238a515020454612','Original B14 freeze changed');
 for(const entry of freeze.entries)assert.deepEqual(ref(entry.path),{file:entry.path,bytes:entry.bytes,sha256:entry.sha256},'Original B14 candidate changed');
 return {manifest:ref(own+'/STAGE-FILES.txt'),freeze:ref(own+'/FREEZE.json'),entryCount:freeze.entries.length};
}
function manifest(folder){
 const files=[];function walk(path){for(const name of readdirSync(path).sort()){const file=resolve(path,name),stat=lstatSync(file);assert.ok(!stat.isSymbolicLink(),'Build symlink');
  if(stat.isDirectory())walk(file);else{assert.ok(stat.isFile());files.push(ref(relative(repo,file).replaceAll('\\','/')))}}}
 walk(resolve(repo,folder));assert.ok(files.some(row=>row.file===folder+'/index.html'),'Built entry missing');
 return {folder,fileCount:files.length,bytes:files.reduce((n,row)=>n+row.bytes,0),inventorySHA256:sha(JSON.stringify(files)),files};
}
function installedBrowser(){
 const require=createRequire(resolve(repo,'course-app/package.json')),packageFile=require.resolve('@playwright/test/package.json'),value=JSON.parse(readFileSync(packageFile,'utf8'));
 assert.equal(value.version,'1.62.1');assert.equal(read('course-app/package-lock.json').packages['node_modules/@playwright/test'].version,value.version);
 const h1Package=JSON.parse(readFileSync(resolve(repo,'hsk1-app/node_modules/@playwright/test/package.json'),'utf8'));assert.equal(h1Package.version,value.version);assert.equal(read('hsk1-app/package-lock.json').packages['node_modules/@playwright/test'].version,h1Package.version);
 const pw=require('playwright'),entry=pw[browser].executablePath();assert.ok(existsSync(entry),'Actual installed browser launch entry missing');
 const descriptor=resolve(require.resolve('playwright-core/package.json'),'../browsers.json'),entryBytes=readFileSync(entry);
 return {testPackage:'course-app/node_modules/@playwright/test',cli:'course-app/node_modules/@playwright/test/cli.js',version:value.version,
  installedPackageSHA256:sha(readFileSync(packageFile)),browserDescriptorSHA256:sha(readFileSync(descriptor)),
  browserLaunchEntry:{path:entry,bytes:entryBytes.length,sha256:sha(entryBytes),scope:'Default launch entry only; not all browser/system libraries'},
  notoCJKVersion:execFileSync('dpkg-query',['-W','-f=${Version}\n','fonts-noto-cjk'],{encoding:'utf8'}).trim(),
  actualCJKFont:execFileSync('fc-match',['Noto Serif CJK SC'],{encoding:'utf8'}).trim()};
}
function commands(before){
 const records=commandPlan(browser).map(task=>read(evidenceRoot(browser)+'/'+task.label+'.command.json'));
 const actual=readdirSync(dir).filter(file=>file.endsWith('.command.json'));assert.equal(actual.length,records.length,'Unexpected command receipts');
 verifyCommands(records,{browser,before,actualRef:ref,readLog:file=>readFileSync(resolve(repo,file),'utf8')});
 return records.map(value=>({...ref(evidenceRoot(browser)+'/'+value.label+'.command.json'),label:value.label,exitCode:0,log:value.log}));
}
function screenshots(cases){
 const entries=[];function walk(path){for(const name of readdirSync(path).sort()){const file=resolve(path,name),stat=lstatSync(file);assert.ok(!stat.isSymbolicLink(),'Native output symlink');
  if(stat.isDirectory())walk(file);else if(name.endsWith('.png')){assert.ok(stat.isFile());const bytes=readFileSync(file);entries.push({...ref(relative(repo,file).replaceAll('\\','/')),name:basename(file),...inspectPNG(bytes)})}}}
 walk(resolve(dir,'native-output'));return verifyScreenshotSet(entries,cases);
}
const phase=process.argv[2];
try{
 if(phase==='before'){
  for(const name of ['HSK_BROWSER_PATH','HSK_SOURCE_VISUAL_BROWSER_PATH','PLAYWRIGHT_JSON_OUTPUT_FILE','PLAYWRIGHT_JSON_OUTPUT_NAME','PLAYWRIGHT_JSON_OUTPUT_DIR'])assert.equal(process.env[name],undefined,'External launch/report override forbidden: '+name);
  const id=identity();assert.equal(id.node,'v24.19.0');assert.equal(id.githubRef,branch,'Private checkpoint branch required');assert.equal(id.checkoutCommit,id.githubSHA,'Checkout must equal actual run SHA');
  assert.ok(/^\d+$/.test(id.runId??'')&&/^\d+$/.test(id.runAttempt??''),'Actual CI run identity missing');
  for(const name of ['before.json','builds.json','after.json','native-results.json','native-output'])assert.ok(!existsSync(resolve(dir,name)),'Fresh CI output required: '+name);
  write('before.json',{schemaVersion:1,status:'exact-clean-checkout-before',recordedAt:new Date().toISOString(),...id,...source(id.checkoutCommit),registries:registries(),originalB14Freeze:originalFreeze(),requiredCommands:commandPlan(browser),publicationApproved:false,deployed:false});
 }else if(phase==='builds'){
  const prior=read(evidenceRoot(browser)+'/before.json'),id=identity();assert.equal(id.checkoutCommit,prior.checkoutCommit);assert.equal(id.checkoutTree,prior.checkoutTree);
  const now=source(id.checkoutCommit);assert.equal(now.extendedSourceSnapshot.sha256,prior.extendedSourceSnapshot.sha256,'Build input drift');
  write('builds.json',{schemaVersion:1,status:'actual-two-compiled-builds-hashed',recordedAt:new Date().toISOString(),...id,
   extendedSourceSnapshotSHA256:now.extendedSourceSnapshot.sha256,installedBrowser:installedBrowser(),originalB14Freeze:originalFreeze(),
   builds:[manifest('course-app/dist'),manifest('hsk1-app/dist')],
   nativeConsumers:{shared:{mode:'actual compiled Vite preview',port:18914,dist:'course-app/dist'},standalone:{mode:'actual compiled Vite preview',port:18915,dist:'hsk1-app/dist'}}});
 }else if(phase==='after'){
  const prior=read(evidenceRoot(browser)+'/before.json'),built=read(evidenceRoot(browser)+'/builds.json'),id=identity();
  assert.equal(id.checkoutCommit,prior.checkoutCommit);assert.equal(id.checkoutCommit,id.githubSHA);assert.equal(id.checkoutTree,prior.checkoutTree);assert.equal(id.runId,prior.runId);assert.equal(id.runAttempt,prior.runAttempt);assert.equal(id.githubRef,branch);
  const now=source(id.checkoutCommit);assert.equal(now.officialRuntimeSourceSnapshot.sha256,prior.officialRuntimeSourceSnapshot.sha256);assert.equal(now.extendedSourceSnapshot.sha256,prior.extendedSourceSnapshot.sha256);
  for(const entry of built.builds)assert.deepEqual(manifest(entry.folder),entry,'Compiled bytes changed during native execution');
  assert.deepEqual(installedBrowser(),built.installedBrowser,'Installed browser/font metadata changed');assert.deepEqual(registries(),prior.registries);
  const commandRecords=commands(prior),reportFile=evidenceRoot(browser)+'/native-results.json',native=verifyNativeResults(read(reportFile),{browser});
  const png=screenshots(native.cases);write('original-screenshots.json',{schemaVersion:1,scope:'Actual original native PNG files; validated complete chunks/raster, unedited byte hashes and exact case/viewport bindings; manual visual acceptance remains separate',browser,count:png.length,files:png});
  write('after.json',{schemaVersion:1,status:'accepted-private-native-ui-checkpoint-not-release',recordedAt:new Date().toISOString(),...id,
   officialRuntimeSourceSnapshotSHA256:now.officialRuntimeSourceSnapshot.sha256,extendedSourceSnapshotSHA256:now.extendedSourceSnapshot.sha256,
   originalB14Freeze:originalFreeze(),commandCount:commandRecords.length,commands:commandRecords,actualNativeCases:10,native,
   report:ref(reportFile),buildManifest:ref(evidenceRoot(browser)+'/builds.json'),originalPNGs:ref(evidenceRoot(browser)+'/original-screenshots.json'),registries:registries(),
   originalPNGManualReview:'pending independent reading; automated case/byte/raster guards passed',officialVietnameseSemanticAcceptance:false,sourceVersionLabelImplemented:false,publicationApproved:false,deployed:false});
  write('readiness.json',{schemaVersion:1,status:'private-layout-native-checkpoint-only',testedSourceCommit:id.checkoutCommit,testedSourceTree:id.checkoutTree,browser,actualNativeCases:10,actualOriginalPNGs:90,
   after:ref(evidenceRoot(browser)+'/after.json'),manualPNGReview:'pending',officialVietnameseSemanticAcceptance:false,releaseApproved:false,publicationApproved:false,deployed:false});
 }else throw Error('Use before|builds|after');
}catch(error){write(phase+'-failure.json',{schemaVersion:1,phase,status:'failed-no-native-acceptance',recordedAt:new Date().toISOString(),...identity(),error:String(error),stack:error.stack});process.stderr.write(String(error)+'\n');process.exitCode=1}
