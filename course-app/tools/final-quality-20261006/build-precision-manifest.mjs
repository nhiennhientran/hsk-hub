import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,isAbsolute,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash} from '../package-core.mjs';
import {derivePrecisionTargets} from './build-precision-targets.mjs';
import {validatePrecisionManifest,canonicalPrecisionJSON,precisionSHA256,nonSpokenStageDirection} from '../../src/precision-contract.ts';

const repo=resolve(import.meta.dirname,'../../..');
const fields=['id','level','lesson','unit','sourceText','sourceLessonFile','sourceLessonSHA256','parentLineId','sentenceNumber','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256','clipUnit','readingCount','reviewDecisionId','sourceJSONPointer'];
export function requireCompleteReview(report,catalogSHA){
 assert.equal(report.schemaVersion,1);
 assert.equal(report.status,'accepted-complete-source-frame-review','Only the complete independent final decision set can create runtime authority');
 assert.equal(report.completeCoverage,true);assert.equal(report.independentTargetCatalogSHA256,catalogSHA);
 assert.equal(report.acceptedSourceFrameGates?.length,2539);
 assert.equal(new Set(report.acceptedSourceFrameGates.map(r=>r.id)).size,2539,'More than one final geometry for a target');
 assert.equal(report.nonSpokenAnnotations?.length,1);assert.equal(report.nonSpokenAnnotations[0].id,nonSpokenStageDirection.id);
 for(const key of ['humanListening','nativeSpeakerReview','pronunciationToneCertified','devicePlaybackCertified'])assert.equal(report.certifications?.[key]??report[key],false,'Unperformed review cannot be certified: '+key);
 for(const row of report.acceptedSourceFrameGates){
  assert.equal(row.status,'accepted-independent-machine-source-frame-review');assert.equal(row.rawEvidenceUnchanged,true);
  assert.match(row.reviewDecisionId??'',/^[a-f0-9]{64}$/);
  assert.equal(row.independentDecision?.decision,'accept');assert.equal(row.independentDecision?.sourceContextChecked,true);
  for(const key of ['humanListening','nativeSpeakerReview','pronunciationToneCertified','devicePlaybackCertified'])assert.equal(row[key]??false,false);
 }
}
// All audit references are checked against their actual bytes. The heavy raw,
// spectrum and decision reports remain outside the student-facing manifest.
export function verifyReviewReferences(value,root){
 let count=0;const seen=new Map();
 const recordedRoot=value?.recordedRepositoryRoot;
 if(recordedRoot!==undefined)assert.ok(typeof recordedRoot==='string'&&isAbsolute(recordedRoot),'Recorded repository root must be an absolute source identity');
 const visit=v=>{
  if(!v||typeof v!=='object')return;
  if(!Array.isArray(v)&&typeof v.file==='string'&&typeof v.sha256==='string'){
   assert.match(v.sha256,/^[a-f0-9]{64}$/);let p;
   if(isAbsolute(v.file)&&recordedRoot){const oldRelative=relative(resolve(recordedRoot),resolve(v.file));assert.ok(oldRelative&&!oldRelative.startsWith('../')&&!isAbsolute(oldRelative),'Audit absolute reference lies outside the recorded repository');p=resolve(root,oldRelative);}
   else p=isAbsolute(v.file)?resolve(v.file):resolve(root,v.file);
   const rel=relative(root,p);assert.ok(rel&&!rel.startsWith('../')&&!isAbsolute(rel),'Audit reference must remain in the recorded repository');
   if(seen.has(p))assert.equal(seen.get(p),v.sha256,'Conflicting audit reference identity');
   else {assert.equal(hash(readFileSync(p)),v.sha256,'Independent audit evidence changed: '+rel);seen.set(p,v.sha256);count++;}
  }
  for(const x of Object.values(v))visit(x);
 };visit(value);assert.ok(count>0,'Final decisions must reference actual retained evidence');return count;
}
export async function buildPrecisionManifest(reportFile,{write=false}={}){
 const reportPath=resolve(repo,reportFile),reportBytes=readFileSync(reportPath),report=JSON.parse(reportBytes);
 const targetPath=resolve(repo,'course-app/content/audio-precision-targets-20261006.json'),catalogBytes=readFileSync(targetPath),catalogSHA=hash(catalogBytes);
 assert.deepEqual(JSON.parse(catalogBytes),derivePrecisionTargets(repo),'Target catalog must match the current original teaching files');
 requireCompleteReview(report,catalogSHA);const checkedAuditFiles=verifyReviewReferences(report,repo);
 const records=report.acceptedSourceFrameGates.map(row=>Object.fromEntries(fields.map(k=>[k,row[k]??null]))).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 const manifestText=JSON.stringify({schemaVersion:1,status:'accepted',sampleRate:16000,records})+'\n';
 const authority={schemaVersion:1,status:'accepted',manifestSHA256:hash(Buffer.from(manifestText)),targetCatalogSHA256:catalogSHA,independentReportSHA256:hash(reportBytes),acceptedSourceFrameGates:records,nonSpokenAnnotations:report.nonSpokenAnnotations.map(r=>({id:r.id,sourceLessonSHA256:r.sourceLessonSHA256,reason:r.reason,reviewDecisionId:r.reviewDecisionId})),certifications:{humanListening:false,pronunciationToneCertified:false,devicePlaybackCertified:false}};
 const pin=await precisionSHA256(canonicalPrecisionJSON(authority));
 const read=file=>JSON.parse(readFileSync(resolve(repo,file)));
 const sources=[...read('course-app/content/audio-manifest.json').tracks.map(t=>({file:t.file,sha256:t.sha256,duration:t.duration})),...read('hsk1-app/content/media-references.json').originalTracks.map(t=>({file:t.path,sha256:t.sha256,duration:t.duration_s}))];
 await validatePrecisionManifest({manifestText,targetCatalogText:catalogBytes.toString(),authority,authoritySHA256:pin,sources});
 if(write){
  writeFileSync(resolve(repo,'course-app/content/audio-precision-20261006.json'),manifestText);
  writeFileSync(resolve(repo,'course-app/content/audio-precision-authority-20261006.json'),JSON.stringify(authority)+'\n');
  const loader=resolve(repo,'course-app/src/precision-loader.ts'),text=readFileSync(loader,'utf8');
  assert.equal((text.match(/export const precisionAuthoritySHA256=/gu)??[]).length,1);
  writeFileSync(loader,text.replace(/export const precisionAuthoritySHA256='[a-f0-9]*';/u,`export const precisionAuthoritySHA256='${pin}';`));
 }
 return {status:write?'written-accepted-precision-authority':'verified-complete-independent-precision',records:records.length,annotations:1,checkedAuditFiles,authoritySHA256:pin,manifestSHA256:authority.manifestSHA256,independentReportSHA256:authority.independentReportSHA256};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert.ok(process.argv[2],'Usage: build-precision-manifest INDEPENDENT_FINAL_REPORT [--write]');
 console.log(JSON.stringify(await buildPrecisionManifest(process.argv[2],{write:process.argv.includes('--write')})));
}
