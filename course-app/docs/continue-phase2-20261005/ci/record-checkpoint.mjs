import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,lstatSync,existsSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {snapshotRuntimeSource,assertTestedRuntimeSource} from '../../../tools/release-readiness.mjs';
import {runtimeSourceScopes,protectedProduction} from '../../../tools/package-unified.mjs';
import {protectedProductionTree,protectedBaselineManifest} from '../../../tools/assemble-unified-checkpoint.mjs';
import {defaultHeadlessEntry,verifyBrowserLaunchLog} from '../../resume-20261004/b14-narrow-ui/ci/browser-launch.mjs';
import {completeNative} from './native-completion.mjs';
const repo=fileURLToPath(new URL('../../../../',import.meta.url)),browser=process.env.HSK_PHASE2_BROWSER;
assert.ok(['chromium','webkit'].includes(browser),'Actual matrix browser required');
const out=join(repo,'course-app/.repro-output/continue-phase2',browser);mkdirSync(out,{recursive:true});
const scopes=[...new Set([...runtimeSourceScopes,
  'hsk1-app/index.html','hsk1-app/package.json','hsk1-app/package-lock.json','hsk1-app/vite.config.ts','hsk1-app/tsconfig.json','hsk1-app/tools','hsk1-app/review',
  'new-hsk1/hsk1/auth-patch.js',
  'hsk1-app/tsconfig.vi-presentation-tests.json',
  'course-app/tsconfig.browser-check.json','course-app/tsconfig.flow-check.json','course-app/tsconfig.package-check.json','course-app/tsconfig.reviewed-sentences-check.json',
  'course-app/tests','hsk1-app/tests','course-app/docs/continue-phase2-20261005',
  'course-app/docs/resume-20261004/flow-compat-review','course-app/docs/resume-20261004/b14-narrow-ui',
  '.github/workflows/hsk-engineering-phase2-20261005.yml',
])].sort();
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim(),sha=b=>createHash('sha256').update(b).digest('hex');
const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}'),phase=process.argv[2];
assert.equal(process.env.GITHUB_SHA,head,'Actual GitHub checkout identity required');
const binding={checkoutCommit:head,checkoutTree:tree,githubSHA:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,runAttempt:process.env.GITHUB_RUN_ATTEMPT,browser};
const save=(name,value)=>writeFileSync(join(out,name),JSON.stringify(value,null,2)+'\n');
const read=name=>JSON.parse(readFileSync(join(out,name),'utf8'));
function files(dir){return readdirSync(dir).sort().flatMap(name=>{const file=join(dir,name),s=lstatSync(file);assert.equal(s.isSymbolicLink(),false,'Output symlink');return s.isDirectory()?files(file):[{path:relative(repo,file),bytes:s.size,sha256:sha(readFileSync(file))}];});}
const buildNames=['dist','standalone-dist','unified-frozen','unified-site'];
const built=()=>Object.fromEntries(buildNames.map(name=>[name,files(join(out,'package',name))]));
const nativePlan=[
  {scope:'history-shared',expected:67,report:'history-shared-results.json'},
  {scope:'history-hsk1',expected:16,report:'history-hsk1-results.json'},
  {scope:'history-legacy',expected:3,report:'history-legacy-results.json'},
  {scope:'visual',expected:14,report:'visual/native-results.json'},
  {scope:'package',expected:9,report:'package-results.json'},
];
if(phase==='before'){
  const sourceInputSnapshot=snapshotRuntimeSource(repo,scopes);assertTestedRuntimeSource(repo,head,sourceInputSnapshot,scopes);
  const protectedBaseline=protectedBaselineManifest(repo);assert.equal(protectedBaseline.productionTree,protectedProductionTree);
  save('before.json',{schemaVersion:1,...binding,scopes,sourceInputSnapshot,protectedProduction,protectedProductionTree,protectedBaselineFiles:protectedBaseline.files.length,nativePlan,publicationApproved:false,deployed:false});
}else if(phase==='builds'){
  const manifest=read('package/unified-site/course-engine/unified-release-manifest.json');
  assert.equal(manifest.mode,'checkpoint');assert.equal(manifest.sourceCommit,head);assert.equal(manifest.sourceDirty,false);
  assert.equal(manifest.buildProvenance,'built-from-recorded-worktree');assert.equal(manifest.lessons,48);
  assert.equal(manifest.protectedProduction,protectedProduction);
  const entry=defaultHeadlessEntry(repo,browser),binary=readFileSync(entry.path);
  save('builds.json',{schemaVersion:1,...binding,compiled:built(),contentValidation:{path:'course-app/docs/content-validation.json',sha256:sha(readFileSync(join(repo,'course-app/docs/content-validation.json')))},
    installedBrowser:{...entry,bytes:binary.length,sha256:sha(binary)},manifestSHA256:sha(readFileSync(join(out,'package/unified-site/course-engine/unified-release-manifest.json')))});
}else if(phase==='after'){
  const before=read('before.json');for(const [key,value]of Object.entries(binding))assert.equal(before[key],value,'Before binding mismatch: '+key);
  const source=assertTestedRuntimeSource(repo,head,before.sourceInputSnapshot,scopes);
  const builds=read('builds.json');for(const [key,value]of Object.entries(binding))assert.equal(builds[key],value,'Build binding mismatch: '+key);assert.deepEqual(builds.compiled,built(),'Compiled package bytes changed during native tests');
  assert.equal(builds.contentValidation.sha256,sha(readFileSync(join(repo,builds.contentValidation.path))));
  assert.equal(builds.installedBrowser.sha256,sha(readFileSync(builds.installedBrowser.path)));
  const native=[];
  for(const plan of nativePlan){
    const report=read(plan.report),collection=read(plan.scope+'-collection.json');
    const cases=completeNative(report,collection,{browser,expected:plan.expected});
    native.push({...plan,cases,reportSHA256:sha(readFileSync(join(out,plan.report))),collectionSHA256:sha(readFileSync(join(out,plan.scope+'-collection.json')))});
  }
  const launchLogs=nativePlan.map(plan=>readFileSync(join(out,plan.scope+'-browser-launches.log'),'utf8')).join('\n');
  const actualBrowserLaunch=verifyBrowserLaunchLog(launchLogs,{browser,entry:builds.installedBrowser});
  const units=[];
  // Six real L01 candidate regressions extend the existing 638 HSK1 cases.
  for(const [app,expected]of [['course',225],['hsk1',644]]){
    const path=join(out,app+'-units.log'),text=readFileSync(path,'utf8'),counts={};
    for(const key of ['tests','pass','fail','cancelled','skipped'])counts[key]=Number([...text.matchAll(new RegExp('^(?:ℹ |# )'+key+' (\\d+)\\s*$','gm'))].at(-1)?.[1]);
    assert.deepEqual(counts,{tests:expected,pass:expected,fail:0,cancelled:0,skipped:0},'Unit completion mismatch');
    units.push({app,counts,sha256:sha(readFileSync(path))});
  }
  const stress=read('ci-git/stress-results.json'),probes=read('ci-git/helper-negative-probes.json');
  assert.equal(stress.status,'passed-finite-current-fixture-stress');assert.equal(stress.runs,12);assert.equal(stress.parallel,3);
  assert.equal(stress.execution.length,12);assert.equal(stress.sourceBytesStable,true);
  assert.equal(stress.sourceSHA256,sha(readFileSync(join(repo,'course-app/tests/release-readiness.test.mjs'))));
  assert.equal(stress.historicalFailureReproduced,false);
  assert.deepEqual(stress.execution.map(row=>row.run).sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i+1));
  for(const row of stress.execution){
    assert.equal(row.passed,true);assert.equal(row.exitCode,0);assert.equal(row.signal,null);
    assert.equal(row.output.file,'stress-run-'+String(row.run).padStart(2,'0')+'.tap');
    const bytes=readFileSync(join(out,'ci-git',row.output.file));assert.equal(bytes.length,row.output.bytes);assert.equal(sha(bytes),row.output.sha256);
    const metrics={},text=bytes.toString('utf8');
    for(const key of ['tests','pass','fail','cancelled','skipped','todo'])metrics[key]=Number(text.match(new RegExp('^# '+key+' (\\d+)\\s*$','m'))?.[1]);
    assert.deepEqual(metrics,{tests:9,pass:9,fail:0,cancelled:0,skipped:0,todo:0});assert.deepEqual(row.metrics,metrics);
  }
  assert.equal(probes.sourceSHA256,stress.sourceSHA256);
  assert.ok(probes.probes.length>=4&&probes.probes.every(row=>row.passed));
  const moduleCoverage=read('history-module/all48-roundtrip-current-coverage.json'),preservation=read('history-module/historical-all48-artifact-preservation.json');
  assert.equal(moduleCoverage.totalLessons,48);assert.equal(moduleCoverage.totalHomeworkQuestions,1440);assert.equal(moduleCoverage.firstLatestGroups,240);
  for(const name of ['oldLegacyBytesUntouched','backupImportRecoveryAndQuota','crossLevelAndVersionRejection'])assert.equal(moduleCoverage[name],true);
  assert.equal(preservation.unchanged,true);assert.equal(preservation.originalArtifactSHA256,preservation.afterArtifactSHA256);
  const moduleLog=readFileSync(join(out,'all48-module.log'),'utf8');
  for(const [key,count]of [['tests',4],['pass',4],['fail',0],['cancelled',0],['skipped',0]])assert.ok(new RegExp('^(?:ℹ |# )'+key+' '+count+'\\s*$','m').test(moduleLog),'Module completion missing: '+key);
  const assembly=read('package/assembly.json');assert.equal(assembly.status,'assembled-checkpoint-not-release');assert.equal(assembly.sourceCommit,head);
  const packageSummary=read('package/package-summary.json');assert.equal(packageSummary.sourceCommit,head);assert.equal(packageSummary.mode,'checkpoint');
  assert.equal(packageSummary.status,'DRAFT-ENGINEERING-CHECKPOINT-NOT-RELEASE');assert.equal(packageSummary.sourceBeforeAfterEqual,true);assert.equal(packageSummary.finalAcceptanceCertificateUnchanged,true);
  assert.equal(packageSummary.protectedHSK4Files,79);assert.equal(packageSummary.protectedPublicFiles,1380);assert.equal(packageSummary.officialVIActivated,false);
  assert.equal(packageSummary.publicationApproved,false);assert.equal(packageSummary.deployed,false);
  assert.equal(assembly.productionCommit,protectedProduction);assert.equal(assembly.productionTree,protectedProductionTree);
  for(const row of assembly.files){const file=join(out,'package/unified-site',row.path),b=readFileSync(file);assert.equal(b.length,row.bytes);assert.equal(sha(b),row.sha256);}
  const guards=read('package/guard-probes.json');assert.equal(guards.sourceCommit,head);assert.equal(guards.negativeProbes,27);assert.equal(guards.results.length,27);
  assert.ok(guards.results.every(row=>row.status==='passed'&&row.outputCreated===false&&typeof row.error==='string'));
  assert.equal(guards.obsoleteMinimalCertificateRejected.status,'passed');assert.equal(guards.dirtyReleaseRejectedBeforeOutput,true);
  assert.equal(guards.frozenBytesUnchanged,true);assert.equal(guards.assembledBytesUnchanged,true);
  const clientBytes=read('compiled-client-bytes.json');assert.equal(clientBytes.sourceCommit,head);assert.equal(clientBytes.sourceTree,tree);
  for(const key of ['browser','runId','runAttempt'])assert.equal(clientBytes[key],binding[key]);
  assert.equal(clientBytes.verified,true);assert.ok(clientBytes.files>0);assert.equal(clientBytes.file,'compiled-client-bytes.zip');
  const clientArchive=readFileSync(join(out,clientBytes.file));assert.equal(clientArchive.length,clientBytes.bytes);assert.equal(sha(clientArchive),clientBytes.sha256);
  save('after.json',{schemaVersion:1,...binding,status:'passed-bounded-engineering-checkpoint',sourceInputSnapshotSHA256:source.sha256,native,units,
    diagnosticStress:{runs:12,parallel:3,actualExecutions:108,historicalFailureCause:'undetermined; controlled probes are not a reproduction of the historical CI failure'},actualBrowserLaunch,
    assembly:{files:assembly.assembledFiles,inventorySHA256:assembly.inventorySHA256},negativePackageProbes:27,compiledClientBytes:clientBytes,moduleCoverage:{lessons:48,homeworkQuestions:1440,firstLatestGroups:240,historicalArtifactUnchanged:true},publicationApproved:false,deployed:false,
    limitations:['compiled engineering candidate; not 48-lesson official VI semantic acceptance or final C15/publication approval','Historical WebKit git add exit128 cause still unknown despite finite successful stress','Local/CI counts are separate; screenshots require bounded manual review'],evidence:files(out)});
}else throw Error('Choose before, builds, or after');
