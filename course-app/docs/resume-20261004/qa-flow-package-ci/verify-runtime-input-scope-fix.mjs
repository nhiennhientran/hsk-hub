import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runtimeSourceScopes,runtimeSourceDirty,runtimeSourceSnapshot} from '../../../tools/package-unified.mjs';

const repo=resolve(import.meta.dirname,'../../../..'),root=resolve(import.meta.dirname);
const oldHead='dd8b22ccb1c1a9c41bc1243887f7a60558635782';
const sha=b=>createHash('sha256').update(b).digest('hex');
const toolPath=join(repo,'course-app/tools/package-unified.mjs');
const oldTool=execFileSync('git',['show',oldHead+':course-app/tools/package-unified.mjs'],{cwd:repo});
const currentTool=readFileSync(toolPath),scopePattern=/export const runtimeSourceScopes=(\[[^;]+\]);/;
const oldScopeDeclaration=oldTool.toString().match(scopePattern)[0];
const oldScopes=JSON.parse(oldTool.toString().match(scopePattern)[1].replaceAll("'",'"'));
const expectedComment='// sync-shared-assets also reads retained original audio and stroke data here.\n// They must participate in both the clean-input check and the build snapshot.\n';
if(currentTool.toString().replace(expectedComment,'').replace(scopePattern,oldScopeDeclaration)!==oldTool.toString())throw Error('Unexpected tool code changes beyond input scopes');
if(JSON.stringify(runtimeSourceScopes)!==JSON.stringify([...oldScopes,'new-hsk1/hsk1/audio','new-hsk1/assets/hanzi-data']))throw Error('Unexpected scope delta');
const probe=mkdtempSync(join(tmpdir(),'hsk-scope-independent-'));
const targets=['new-hsk1/hsk1/audio/1-1.mp3','new-hsk1/assets/hanzi-data/一.json'];
const git=args=>execFileSync('git',args,{cwd:probe,stdio:'pipe',encoding:'utf8'});
const cases=[];
try{
 git(['init','-q']);git(['config','user.name','Independent Scope Probe']);git(['config','user.email','scope-probe@example.invalid']);
 const names=['course-app/src/probe.ts',...targets];
 for(const path of names){mkdirSync(join(probe,path,'..'),{recursive:true});writeFileSync(join(probe,path),'original-input:'+path+'\n');}
 git(['add','.']);git(['commit','-qm','Synthetic committed inputs for exported function probe']);
 const original=runtimeSourceSnapshot(probe);
 if(runtimeSourceDirty(probe)||original.files.length!==3)throw Error('Original isolated state failed');
 for(const path of targets){
  const before=readFileSync(join(probe,path));
  const changed=Buffer.from('changed-input:'+path+'\n');writeFileSync(join(probe,path),changed);
  const dirty=runtimeSourceDirty(probe),snapshot=runtimeSourceSnapshot(probe),row=snapshot.files.find(r=>r.path===path);
  if(!dirty||!row||row.sha256!==sha(changed)||snapshot.sha256===original.sha256)throw Error('Changed original input escaped scope '+path);
  git(['restore',path]);const restored=runtimeSourceSnapshot(probe);
  if(runtimeSourceDirty(probe)||restored.sha256!==original.sha256||!readFileSync(join(probe,path)).equals(before))throw Error('Restoration identity failed '+path);
  cases.push({path,reportedRuntimeDirty:dirty,changedInputSHA256:row.sha256,snapshotChanged:true,restoreDirty:false,restoreSnapshotExact:true});
 }
 const realSnapshot=runtimeSourceSnapshot(repo),trackedOriginalCounts={};
 for(const scope of targets.map(p=>p.slice(0,p.lastIndexOf('/')))){
  const paths=execFileSync('git',['ls-files','-z','--',scope],{cwd:repo,encoding:'utf8'}).split('\0').filter(Boolean);
  if(!runtimeSourceScopes.includes(scope)||paths.some(p=>!realSnapshot.files.find(r=>r.path===p)))throw Error('Actual tracked original missing '+scope);
  trackedOriginalCounts[scope]=paths.length;
 }
 const lock=JSON.parse(readFileSync(join(repo,'course-app/package-lock.json'))).packages['node_modules/hanzi-writer-data'];
 const [algorithm,expected]=lock.integrity.split('-',2),hex=Buffer.from(expected,'base64').toString('hex');
 const cache=execFileSync('npm',['config','get','cache'],{encoding:'utf8',stdio:['pipe','pipe','ignore']}).trim();
 const tar=readFileSync(join(cache,'_cacache/content-v2',algorithm,hex.slice(0,2),hex.slice(2,4),hex.slice(4)));
 if(createHash(algorithm).update(tar).digest('base64')!==expected||lock.version!=='2.0.1')throw Error('Locked npm tar identity failed');
 const reviewedFiles=['course-app/package.json','course-app/package-lock.json','course-app/index.html','course-app/tsconfig.json','course-app/vite.config.ts','course-app/tools/sync-shared-assets.mjs','course-app/tools/validate-content.mjs','course-app/tools/verify-activities.mjs','course-app/tools/verify-lexicon.mjs','course-app/tools/source-guards.mjs','course-app/tools/package-unified.mjs','course-app/tools/assemble-unified-checkpoint.mjs','course-app/playwright.config.ts'];
 const report={schemaVersion:1,status:'accepted-root-original-input-scope-fix-bounded-review-not-new-clean-package',checkedAtUTC:new Date().toISOString(),originalCICandidate:{head:oldHead,packageToolSHA256:sha(oldTool),originalCIManifestRemainsUnchanged:true},reviewedWorkingToolSHA256:sha(currentTool),scopeChangeOnly:['new-hsk1/hsk1/audio','new-hsk1/assets/hanzi-data'],toolCodeChangesBeyondScopeDeclaration:false,explanatoryCommentLinesAdded:2,oldScopeContainedBoth:false,currentScopes:runtimeSourceScopes,isolatedSyntheticProbe:{originalCommittedRows:3,cases,repoOriginalInputsChanged:false},actualWorkingSnapshot:{files:realSnapshot.files.length,sha256:realSnapshot.sha256,sourceDirty:runtimeSourceDirty(repo),trackedOriginalCounts,newCleanSourceIdentityClaim:false},boundedBuildReadReview:[
  {reader:'course-app/package.json:build',inputs:'sync-shared-assets → content:check → tsc → vite; scripts/config and lock are scoped'},
  {reader:'course-app/tools/sync-shared-assets.mjs:4-7',inputs:'protected H1 audio roots, H1 source-crop roots and H1 textbook; all source paths scoped; generated ignored public copies are outputs'},
  {reader:'course-app/tools/sync-shared-assets.mjs:9-10',inputs:'H2/H3 lesson JSON vocabulary; course-app/content scoped'},
  {reader:'course-app/tools/sync-shared-assets.mjs:14',inputs:'stroke priority hsk1-app/public → new-hsk1/assets/hanzi-data → course-app/node_modules/hanzi-writer-data; both original source roots now scoped; last dependency is covered by course-app/package-lock integrity'},
  {reader:'course-app/tools/sync-shared-assets.mjs:19',inputs:'two licenses from hsk1-app/public scoped'},
  {reader:'course-app/tools/validate-content.mjs:17-52',inputs:'33 lesson JSON/source-sentinels/2 lexicons and verifier modules scoped; docs/content-validation.json regenerated by build'},
  {reader:'course-app/vite.config.ts:4-6',inputs:'regenerated docs/content-validation.json and scoped audio-manifest produce content-manifest; docs validation is not an authoritative unchanged external input'},
  {reader:'course-app/src + hsk1-app/src',inputs:'shared and retained runtime modules/content/style/vendor sources scoped; vendored Hanzi renderer under hsk1-app/src/services/hanzi is scoped'},
  {reader:'course-app/index.html + vite.config.ts + package/lock',inputs:'shared HTML/bundler/config and installation lock scoped; clean npm ci remains a dependency-install precondition'},
  {reader:'course-app/tsconfig.json:include',inputs:'playwright.config.ts is typecheck-only configuration outside runtime scope; it cannot change emitted application consumer bytes. Browser acceptance configs/reports are separately versioned evidence, not application sourceSnapshot.'},
  {reader:'packageUnified/assertUnifiedAcceptance',inputs:'compiled input and source authority are checked before freeze; formal sixteen-stage gate is separate evidence and has not been marked passed'}
 ],lockedGlyphDependency:{version:lock.version,integrity:lock.integrity,tarBytes:tar.length,tarSHA256:sha(tar),lockIntegrityMatchesActualTar:true},reviewedFileRefs:reviewedFiles.map(path=>({path,sha256:sha(readFileSync(join(repo,path)))})),limitations:['This validates exported dirty/snapshot behavior and bounded input readers; it does not run a new production build or browser suite.','The old dd8b22 manifest/snapshot/consumer evidence remains exact to its original tool; this changed author tool requires a separate future clean checkpoint identity.','Ignored node_modules are dependency installation outputs; release verification must use clean npm ci and lock integrity, not claim worktree snapshot contains installed package bytes.']};
 writeFileSync(join(root,'runtime-input-scope-fix-review.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({status:report.status,toolSHA256:report.reviewedWorkingToolSHA256,cases,workingSnapshot:report.actualWorkingSnapshot,lockedNpmIntegrity:true},null,2));
}finally{rmSync(probe,{recursive:true,force:true});}
