import {mkdtempSync,readFileSync,writeFileSync,renameSync,rmSync,mkdirSync,existsSync,symlinkSync} from 'node:fs';
import {join,resolve,relative} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {assembleUnifiedCheckpoint,protectedBaselineManifest} from '../../../tools/assemble-unified-checkpoint.mjs';
import {assertUnifiedAcceptance,packageUnified,currentSourceFigures,currentAuxiliaryIllustrations,unifiedEntryDirectories,runtimeSourceScopes} from '../../../tools/package-unified.mjs';
import {hash,walkFiles} from '../../../tools/package-core.mjs';
const repo=resolve(import.meta.dirname,'../../../..'),course=join(repo,'course-app');
const browser=process.env.HSK_PHASE2_BROWSER??'local';
assert.match(browser,/^[a-z0-9_-]+$/,'Unsafe artifact namespace');
const out=join(course,'.repro-output/continue-phase2',browser,'package');
const baseline=join(out,'baseline-protected'),frozen=join(out,'unified-frozen'),assembled=join(out,'unified-site');
const manifestPath='course-engine/unified-release-manifest.json',original=JSON.parse(readFileSync(join(frozen,manifestPath)));
assert.equal(original.mode,'checkpoint');
const sandbox=mkdtempSync(join(tmpdir(),'phase2-package-negative-')),results=[];
const toolPaths=['course-app/tools/package-unified.mjs','course-app/tools/assemble-unified-checkpoint.mjs'];
const initialToolHashes=Object.fromEntries(toolPaths.map(p=>[p,hash(readFileSync(join(repo,p)))]));
const initialInventory=root=>walkFiles(root).map(path=>{const b=readFileSync(join(root,path));return {path,bytes:b.length,sha256:hash(b)};});
const frozenBefore=initialInventory(frozen),assembledBefore=initialInventory(assembled);
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
 const oldPlausibleCertificate={sourceCommit:original.sourceCommit,lessons:48,textbookLessons:33,pages:579,stages:Array.from({length:16},()=>({status:'passed'})),browsers:{chromium:true,webkit:true}};
 let gateError;try{assertUnifiedAcceptance(oldPlausibleCertificate,original.sourceCommit,{repo});}catch(error){gateError=error.message;}
 assert.ok(gateError,'Obsolete minimal certificate must not satisfy the current semantic release gate');
 const figures=currentSourceFigures(repo),illustrations=currentAuxiliaryIllustrations(repo);
 const forbiddenOutput=join(sandbox,'never-release');
 assert.throws(()=>packageUnified({input:join(out,'dist'),output:forbiddenOutput,sourceCommit:original.sourceCommit,figures,illustrations,hsk1Tracks:[],sourceDirty:true,mode:'release',buildProvenance:'built-from-recorded-worktree'}),/clean source/);
 assert.equal(existsSync(forbiddenOutput),false);
 assert.deepEqual(initialInventory(frozen),frozenBefore,'Frozen bytes changed by probes');
 assert.deepEqual(initialInventory(assembled),assembledBefore,'Assembled bytes changed by probes');
 for(const path of toolPaths)assert.equal(hash(readFileSync(join(repo,path))),initialToolHashes[path],'Runtime tools changed during probes');
 const result={schemaVersion:1,status:'PASS-NEGATIVE-GUARDS-NOT-RELEASE',generatedAt:new Date().toISOString(),sourceCommit:original.sourceCommit,mode:original.mode,manifestSHA256:hash(readFileSync(join(frozen,manifestPath))),negativeProbes:results.length,results,obsoleteMinimalCertificateRejected:{status:'passed',error:gateError},dirtyReleaseRejectedBeforeOutput:true,frozenBytesUnchanged:true,assembledBytesUnchanged:true,tools:initialToolHashes,scope:'Actual current frozen candidate negative probes only; no browser result, semantic acceptance, deployment, or activation'};
 writeFileSync(join(out,'guard-probes.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({status:result.status,sourceCommit:result.sourceCommit,negativeProbes:result.negativeProbes,obsoleteMinimalCertificateRejected:true,frozenBytesUnchanged:true,assembledBytesUnchanged:true}));
}finally{rmSync(sandbox,{recursive:true,force:true});}
