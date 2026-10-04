import {mkdtempSync,readFileSync,writeFileSync,renameSync,rmSync,mkdirSync,existsSync,symlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {assembleUnifiedCheckpoint,protectedBaselineManifest} from '../../../tools/assemble-unified-checkpoint.mjs';
import {assertUnifiedAcceptance,packageUnified,currentSourceFigures,currentAuxiliaryIllustrations,unifiedEntryDirectories,runtimeSourceScopes} from '../../../tools/package-unified.mjs';
import {hash,walkFiles} from '../../../tools/package-core.mjs';
const repo=resolve(import.meta.dirname,'../../../..'),base='/workspace/scratch/28b55072841a',baseline=join(base,'package-closure-baseline'),frozen=join(base,'package-closure-frozen-v2'),assembled=join(base,'package-closure-assembled-v2');
const out=resolve(import.meta.dirname),manifestPath='course-engine/unified-release-manifest.json',original=JSON.parse(readFileSync(join(frozen,manifestPath)));
const sandbox=mkdtempSync(join(tmpdir(),'qa-package-independent-')),results=[];
const toolPaths=['course-app/tools/package-unified.mjs','course-app/tools/assemble-unified-checkpoint.mjs'];
const initialToolHashes=Object.fromEntries(toolPaths.map(p=>[p,hash(readFileSync(join(repo,p)))]));
const replace=(file,b)=>{writeFileSync(file+'.probe',b);renameSync(file+'.probe',file);};
const removed=(m,path)=>{m.files=m.files.filter(f=>f.path!==path);m.inputFiles=m.inputFiles.filter(f=>'course-engine/'+f.path!==path);};
const poisoned=(m,path,bytes)=>{for(const f of m.files.filter(f=>f.path===path)){f.bytes=bytes.length;f.sha256=hash(bytes);}for(const f of m.inputFiles.filter(f=>'course-engine/'+f.path===path)){f.bytes=bytes.length;f.sha256=hash(bytes);}};
const mainJS=original.files.find(f=>f.path.endsWith('/'+readFileSync(join(frozen,'index.html'),'utf8').match(/src="[^"]*\/([^"/]+\.js)"/)[1])).path;
const cases=[
 ['baseline-byte',/Protected baseline mismatch/],['baseline-extra',/Missing or extra protected baseline/],
 ['symlink',/Symbolic links/],['forged-legacy-overwrite',/Frozen checkpoint mismatch|Unapproved baseline overwrite/],
 ['extra-private-pdf',/Frozen checkpoint mismatch/],['extra-backend',/Frozen checkpoint mismatch/],
 ['poisoned-source-png',/Unapproved frozen original crop/],['poisoned-auxiliary-svg',/Unapproved frozen auxiliary illustration/],
 ['poisoned-original-hsk1-audio',/Missing or changed required original audio/],
 ['poisoned-stroke-json',/stroke|Stroke|handwriting|Handwriting|provenance/],
 ['poisoned-handwriting-provenance',/stroke|Stroke|handwriting|Handwriting|provenance/],
 ['poisoned-handwriting-license',/license|License|LICENSE/],
 ['missing-entry-crop',/Missing required unified output/],['missing-engine-crop',/Missing required unified output/],
 ['missing-entry-html',/Missing required unified output/],['missing-main-js',/Missing required bundle dependency/],
 ['missing-course-index-json',/Missing required bundle dependency/],['missing-textbook-json',/Missing required bundle dependency/],
 ['missing-media-json',/Missing required bundle dependency/],['missing-stage2-json',/Missing required bundle dependency/],
 ['missing-stage3-json',/Missing required bundle dependency/],['missing-display-revisions-json',/Missing required bundle dependency/],
 ['missing-stroke-json',/Missing required unified output/],['missing-approved-svg',/Missing required unified output/],
 ['manifest-duplicate',/Missing or extra frozen checkpoint files/],['wrong-production',/Wrong unified checkpoint identity/],
 ['fake-release',/Wrong unified checkpoint identity/]
];
try{
 for(const [kind,expectedError]of cases){
  const local=join(sandbox,kind),b=join(local,'baseline'),p=join(local,'package'),output=join(local,'output');mkdirSync(local);
  execFileSync('cp',['-al',baseline,b]);execFileSync('cp',['-al',frozen,p]);
  const m=JSON.parse(readFileSync(join(p,manifestPath)));let target;
  if(kind==='baseline-byte')replace(join(b,'hsk4/index.html'),Buffer.from('changed protected H4'));
  if(kind==='baseline-extra')writeFileSync(join(b,'unexpected.html'),'extra');
  if(kind==='symlink'){target=m.files.find(f=>f.path.startsWith('source-activities/figures/')).path;rmSync(join(p,target));symlinkSync(join(frozen,target),join(p,target));}
  if(kind.startsWith('poisoned-')){
   target=kind==='poisoned-source-png'?m.files.find(f=>f.path.startsWith('course-engine/source-activities/figures/')).path:kind==='poisoned-auxiliary-svg'?m.files.find(f=>f.path.startsWith('course-engine/illustrations/')).path:kind==='poisoned-stroke-json'?'course-engine/course-assets/hanzi/一.json':kind==='poisoned-handwriting-provenance'?'course-engine/course-assets/HANZI-PROVENANCE.json':kind==='poisoned-handwriting-license'?'course-engine/course-assets/HANZI-DATA-LICENSE.txt':'course-engine/course-assets/audio/1-1.mp3';
   let bytes=Buffer.from('self-authorized incorrect bytes '+kind);
   if(kind==='poisoned-handwriting-provenance'){const prov=JSON.parse(readFileSync(join(p,target)));prov.characters[0].sha256='0'.repeat(64);bytes=Buffer.from(JSON.stringify(prov));}
   replace(join(p,target),bytes);poisoned(m,target,bytes);
  }
  if(kind.startsWith('missing-')){
   if(kind==='missing-entry-crop')target=m.files.find(f=>f.path.startsWith('new-hsk2/hsk2/source-activities/figures/')).path;
   if(kind==='missing-engine-crop')target=m.files.find(f=>f.path.startsWith('course-engine/source-activities/figures/')).path;
   if(kind==='missing-entry-html')target='new-hsk3/hsk3/index.html';
   if(kind==='missing-main-js')target=mainJS;
   if(kind==='missing-course-index-json')target=m.files.find(f=>f.path.startsWith('course-engine/assets/course-index-')&&f.path.endsWith('.json')).path;
   if(kind==='missing-textbook-json')target=m.files.find(f=>f.path.startsWith('course-engine/assets/textbook-')&&!f.path.includes('display-revisions')&&f.path.endsWith('.json')).path;
   if(kind==='missing-media-json')target=m.files.find(f=>f.path.startsWith('course-engine/assets/media-references-')&&f.path.endsWith('.json')).path;
   if(kind==='missing-stage2-json')target=m.files.find(f=>f.path.startsWith('course-engine/assets/stage2-bank-')&&f.path.endsWith('.json')).path;
   if(kind==='missing-stage3-json')target=m.files.find(f=>f.path.startsWith('course-engine/assets/stage3-catalog-')&&f.path.endsWith('.json')).path;
   if(kind==='missing-display-revisions-json')target=m.files.find(f=>f.path.startsWith('course-engine/assets/textbook-display-revisions-')&&f.path.endsWith('.json')).path;
   if(kind==='missing-stroke-json')target=m.files.find(f=>f.path.startsWith('course-engine/course-assets/hanzi/')).path;
   if(kind==='missing-approved-svg')target=m.files.find(f=>f.path.startsWith('course-engine/illustrations/')).path;
   assert.ok(target,'real fixture target for '+kind);rmSync(join(p,target));removed(m,target);
  }
  if(['forged-legacy-overwrite','extra-private-pdf','extra-backend'].includes(kind)){
   target=kind==='forged-legacy-overwrite'?'hsk4/index.html':kind==='extra-private-pdf'?'course-engine/source-activities/figures/private-book.pdf':'course-engine/tools/backend.js';
   const bytes=Buffer.from('manifest cannot authorize this file');mkdirSync(join(p,target,'..'),{recursive:true});writeFileSync(join(p,target),bytes);m.files.push({path:target,bytes:bytes.length,sha256:hash(bytes)});
  }
  if(kind==='manifest-duplicate')m.files.push(m.files[0]);
  if(kind==='wrong-production')m.protectedProduction='0'.repeat(40);
  if(kind==='fake-release')m.mode='release';
  if(!['baseline-byte','baseline-extra','symlink'].includes(kind))replace(join(p,manifestPath),Buffer.from(JSON.stringify(m)));
  let error;try{assembleUnifiedCheckpoint({repo,baseline:b,packageRoot:p,output});}catch(e){error=e.message;}
  assert.ok(error,kind+' unexpectedly accepted');assert.match(error,expectedError,kind+' unrelated failure');assert.equal(existsSync(output),false,kind+' must reject before creation');
  results.push({kind,target,status:'passed',error,outputCreated:false});rmSync(local,{recursive:true,force:true});
 }
 const rows=protectedBaselineManifest(repo).files;assert.equal(rows.length,1446);
 const ar=JSON.parse(readFileSync(join(repo,'course-app/docs/resume-20261004/package-closure/assembly-report-v2.json')));
 const excluded=new Set(ar.baselineUnservedExclusions.map(f=>f.path)),replaced=new Set(ar.authorizedReplacements.map(f=>f.path));
 const allowedReplacements=new Set(['index.html','course-engine/content-manifest.json',...[1,2,3].flatMap(n=>['new-hsk'+n+'/index.html','new-hsk'+n+'/hsk'+n+'/index.html']),...['lesson.html','learning.html','lesson9-pilot.html'].map(f=>'new-hsk1/hsk1/'+f)]);
 assert.equal(excluded.size,55);assert.deepEqual([...replaced].sort(),[...allowedReplacements].sort());
 const gitBlob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
 let protectedCount=0;for(const f of rows){
  assert.equal(gitBlob(readFileSync(join(baseline,f.path))),f.sha,'all 1446 original blobs');
  if(excluded.has(f.path)){assert.equal(existsSync(join(assembled,f.path)),false,'55 explicitly unserved');continue;}
  if(replaced.has(f.path))continue;
  assert.equal(gitBlob(readFileSync(join(assembled,f.path))),f.sha,'protected public bytes '+f.path);protectedCount++;
 }
 assert.equal(protectedCount,1380);assert.equal(walkFiles(assembled).length,3893);
 const figures=currentSourceFigures(repo),illustrations=currentAuxiliaryIllustrations(repo);let cropCopies=0;
 for(const [path,f]of figures)for(const prefix of ['course-engine',...unifiedEntryDirectories]){
  const p=(prefix?prefix+'/':'')+path;assert.equal(hash(readFileSync(join(assembled,p))),f.sha256,p);cropCopies++;
 }
 assert.equal(cropCopies,1200);for(const [path,f]of illustrations)assert.equal(hash(readFileSync(join(assembled,'course-engine/'+path))),f.sha256,path);
 const tracks=[...JSON.parse(readFileSync(join(repo,'course-app/content/audio-manifest.json'))).tracks,...JSON.parse(readFileSync(join(repo,'hsk1-app/content/media-references.json'))).originalTracks.map(t=>({...t,file:'course-assets/audio/'+t.id+'.mp3'}))];
 for(const t of tracks){const b=readFileSync(join(assembled,'course-engine/'+t.file));assert.equal(b.length,t.bytes);assert.equal(hash(b),t.sha256);}
 assert.equal(tracks.length,357);assert.equal(illustrations.size,438);
 const proofBytes=readFileSync(join(assembled,'course-engine/course-assets/HANZI-PROVENANCE.json'));
 assert.deepEqual(proofBytes,readFileSync(join(repo,'course-app/public/course-assets/HANZI-PROVENANCE.json')));
 const proof=JSON.parse(proofBytes);assert.equal(proof.characters.length,671);assert.equal(new Set(proof.characters.map(c=>c.character)).size,671);
 for(const c of proof.characters){const b=readFileSync(join(assembled,'course-engine/course-assets/hanzi/'+c.character+'.json'));assert.equal(hash(b),c.sha256);const data=JSON.parse(b);assert.ok(data.strokes.length>0);assert.equal(data.strokes.length,data.medians.length);assert.ok(data.medians.every(s=>s.length>1&&s.every(p=>p.length===2&&p.every(Number.isFinite))));}
 for(const name of ['HANZI-DATA-LICENSE.txt','HANZI-WRITER-LICENSE.txt'])assert.deepEqual(readFileSync(join(assembled,'course-engine/course-assets/'+name)),readFileSync(join(repo,'hsk1-app/public/course-assets/'+name)));
 for(const dir of unifiedEntryDirectories){
  const entry=(dir?dir+'/':'')+'index.html',html=readFileSync(join(assembled,entry),'utf8'),base=html.match(/name="asset-base" content="([^"]+)"/)[1],docURL=new URL(entry,'https://qa.invalid/hsk-hub/');
  assert.equal(new URL(base,docURL).pathname,'/hsk-hub/course-engine/');
  for(const [path,f]of figures){const p=new URL('./'+path,docURL).pathname.slice('/hsk-hub/'.length);assert.equal(hash(readFileSync(join(assembled,p))),f.sha256);}
 }
 const source=original.sourceCommit,g={sourceCommit:source,lessons:48,textbookLessons:33,pages:579,stages:Array.from({length:16},()=>({status:'passed'})),browsers:{chromium:true,webkit:true}};
 assertUnifiedAcceptance(g,source);let releaseGateRejected=0;
 for(const wrong of [{...g,sourceCommit:'0'.repeat(40)},{...g,lessons:47},{...g,textbookLessons:32},{...g,pages:578},{...g,stages:g.stages.slice(1)},{...g,stages:g.stages.map((s,i)=>i? s:{status:'pending'})},{...g,browsers:{chromium:true}}]){assert.throws(()=>assertUnifiedAcceptance(wrong,source));releaseGateRejected++;}
 for(const f of ['course-app/index.html','course-app/package.json','course-app/package-lock.json','course-app/vite.config.ts','course-app/tsconfig.json'])assert.ok(runtimeSourceScopes.includes(f));
 const privateOutput=join(sandbox,'never-release');
 assert.throws(()=>packageUnified({input:join(base,'package-closure-build-v2'),output:privateOutput,sourceCommit:source,figures,hsk1Tracks:[],sourceDirty:true,mode:'release',buildProvenance:'built-from-recorded-worktree'}),/clean source/);
 assert.equal(existsSync(privateOutput),false);
 const evidence={reviewedAtUtc:new Date().toISOString(),status:'passed',scope:'Independent actual negative probes and byte inventory. No browser rerun, no deployment, no modification of original baseline/frozen/dist.',negativeProbes:results.length,results,positive:{baselineGitObjects:1446,unservedDeveloperFiles:55,authorizedReplacementSlots:11,protectedPublicBytes:protectedCount,assembledFiles:3893,uniqueSourceCrops:figures.size,verifiedCropPathCopies:cropCopies,sevenEntriesAllCropsResolve:true,approvedSVGs:438,trustedMP3s:357,releaseGateRejectedCases:releaseGateRejected},artifact:{sourceCommit:source,sourceDirty:original.sourceDirty,sourceSnapshotSHA256:original.sourceSnapshot.sha256,mode:original.mode,manifestSHA256:hash(readFileSync(join(frozen,manifestPath)))},reviewedTools:{packageUnifiedSHA256:hash(readFileSync(join(repo,'course-app/tools/package-unified.mjs'))),assemblerSHA256:hash(readFileSync(join(repo,'course-app/tools/assemble-unified-checkpoint.mjs')))},priorFindings:[{id:'release-dirty-build-scopes',status:'fixed with shared runtimeSourceScopes'},{id:'missing-entry-crop-and-manifest-row',before:'Actual assembly accepted 3892 files and omitted required aliased crop',status:'now rejected'},{id:'missing-static-json-and-manifest-rows',before:'Actual assembly accepted 3892 files and omitted course-index-BKGnz4SX.json',status:'now rejected'}]};
 evidence.positive.handwritingJSONs=671;evidence.positive.handwritingLicenses=2;evidence.priorFindings.push({id:'self-authorized-stroke-json',before:'Actual assembly accepted non-JSON 一.json after file/input SHA metadata updates; unchanged provenance was ignored',status:'now rejected'});
 for(const p of toolPaths)assert.equal(hash(readFileSync(join(repo,p))),initialToolHashes[p],'tool code changed during QA');
 writeFileSync(join(out,'independent-guards.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({status:evidence.status,negativeProbes:results.length,positive:evidence.positive}));
}finally{rmSync(sandbox,{recursive:true,force:true});}
