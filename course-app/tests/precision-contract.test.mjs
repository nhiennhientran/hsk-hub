import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canonicalPrecisionJSON,precisionSHA256,validatePrecisionManifest} from '../src/precision-contract.ts';
const h=x=>x.repeat(64),source={file:'course-assets/hsk2/audio/1-2.mp3',sha256:h('a'),duration:5};
async function fixture(){
 const target={id:'hsk2-fltrp-2026:l01:word01',level:2,lesson:1,unit:'word',sourceText:'就',sourceLessonFile:'course-app/content/hsk2/lesson-01.json',sourceLessonSHA256:h('b')};
 const annotation={...target,id:'hsk3-fltrp-2026:l10:text3:line5',level:3,lesson:10,unit:'sentence',sourceText:'（李老师给学生讲题。）',sourceLessonFile:'course-app/content/hsk3/lesson-10.json'};
 const row={...target,sourceTrack:source.file,sourceSHA256:source.sha256,sourcePCM_SHA256:h('c'),sourceSampleRange16k:[8000,24000],cropPCM_SHA256:h('d'),clipUnit:'single-original-pronunciation',readingCount:1,reviewDecisionId:'independent-actual-source-frame-decision'};
 const manifestText=JSON.stringify({schemaVersion:1,status:'accepted',sampleRate:16000,records:[row]}),targetCatalogText=JSON.stringify({schemaVersion:1,targets:[target,annotation]});
 const authority={schemaVersion:1,status:'accepted',manifestSHA256:await precisionSHA256(manifestText),targetCatalogSHA256:await precisionSHA256(targetCatalogText),independentReportSHA256:h('e'),acceptedSourceFrameGates:[row],nonSpokenAnnotations:[{id:annotation.id,sourceLessonSHA256:annotation.sourceLessonSHA256,reason:'Printed stage direction is absent from the original recording.',reviewDecisionId:'independent-source-context-annotation'}],certifications:{humanListening:false,pronunciationToneCertified:false,devicePlaybackCertified:false}};
 return {manifestText,targetCatalogText,authority,authoritySHA256:await precisionSHA256(canonicalPrecisionJSON(authority)),sources:[source]};
}
test('one exact independently approved word and one source-bound nonspoken annotation pass',async()=>{const rows=await validatePrecisionManifest(await fixture());assert.equal(rows.length,1);assert.deepEqual(rows[0].sourceSampleRange16k,[8000,24000]);});
test('student recording notes stay bound to the independent source/frame decision',async()=>{
 const f=await fixture(),m=JSON.parse(f.manifestText),note={zh:'请结合整句跟读。',vi:'Hãy luyện đọc theo cả câu.'};
 m.records[0].recordingNote=note;f.manifestText=JSON.stringify(m);f.authority.acceptedSourceFrameGates=structuredClone(m.records);f.authority.manifestSHA256=await precisionSHA256(f.manifestText);f.authoritySHA256=await precisionSHA256(canonicalPrecisionJSON(f.authority));
 assert.deepEqual((await validatePrecisionManifest(f))[0].recordingNote,note);
 m.records[0].recordingNote.zh='未经审核的录音说明';f.manifestText=JSON.stringify(m);f.authority.manifestSHA256=await precisionSHA256(f.manifestText);f.authoritySHA256=await precisionSHA256(canonicalPrecisionJSON(f.authority));
 await assert.rejects(validatePrecisionManifest(f),/unaccepted frame or source binding/);
});
test('two agreeing altered manifests cannot replace the pinned independent authority',async()=>{const f=await fixture();const m=JSON.parse(f.manifestText);m.records[0].sourceSampleRange16k=[0,80000];f.manifestText=JSON.stringify(m);f.authority.acceptedSourceFrameGates=m.records;f.authority.manifestSHA256=await precisionSHA256(f.manifestText);await assert.rejects(validatePrecisionManifest(f),/authority checksum/);});
test('a different source recording with otherwise valid hashes is rejected',async()=>{const f=await fixture();f.sources=[{...source,sha256:h('f')}];await assert.rejects(validatePrecisionManifest(f),/original source identity/);});
test('omitting a required target cannot masquerade as complete precision',async()=>{const f=await fixture();f.authority.nonSpokenAnnotations=[];f.authoritySHA256=await precisionSHA256(canonicalPrecisionJSON(f.authority));await assert.rejects(validatePrecisionManifest(f),/complete target partition/);});
test('a vocabulary word cannot be excluded as an unspoken stage direction',async()=>{const f=await fixture();const r=f.authority.acceptedSourceFrameGates[0];f.authority.acceptedSourceFrameGates=[];f.authority.nonSpokenAnnotations.push({id:r.id,sourceLessonSHA256:r.sourceLessonSHA256,reason:'fake note',reviewDecisionId:'fake'});f.authoritySHA256=await precisionSHA256(canonicalPrecisionJSON(f.authority));await assert.rejects(validatePrecisionManifest(f),/annotation exclusion/);});
test('zero duration and extra repeated readings are held even if both JSON files agree',async()=>{for(const edit of [r=>{r.sourceSampleRange16k=[8000,8000];},r=>{r.readingCount=2;}]){const f=await fixture(),m=JSON.parse(f.manifestText);edit(m.records[0]);f.manifestText=JSON.stringify(m);f.authority.acceptedSourceFrameGates=m.records;f.authority.manifestSHA256=await precisionSHA256(f.manifestText);f.authoritySHA256=await precisionSHA256(canonicalPrecisionJSON(f.authority));await assert.rejects(validatePrecisionManifest(f),/sample range|pronunciation unit/);}});
test('duplicate runtime IDs and a partial approval status are rejected',async()=>{for(const edit of [m=>m.records.push(m.records[0]),m=>{m.status='candidate';}]){const f=await fixture(),m=JSON.parse(f.manifestText);edit(m);f.manifestText=JSON.stringify(m);f.authority.manifestSHA256=await precisionSHA256(f.manifestText);f.authoritySHA256=await precisionSHA256(canonicalPrecisionJSON(f.authority));await assert.rejects(validatePrecisionManifest(f),/duplicate|manifest or catalog shape/);}});
test('calling repeated readings alternatives cannot authorize an unrelated word',async()=>{
 const f=await fixture(),m=JSON.parse(f.manifestText);m.records[0].clipUnit='alternative-original-pronunciations';m.records[0].readingCount=2;
 f.manifestText=JSON.stringify(m);f.authority.acceptedSourceFrameGates=m.records;f.authority.manifestSHA256=await precisionSHA256(f.manifestText);f.authoritySHA256=await precisionSHA256(canonicalPrecisionJSON(f.authority));
 await assert.rejects(validatePrecisionManifest(f),/word pronunciation unit/);
});
test('the four registered HSK1 pronunciation alternatives remain eligible under exact independent authority',async()=>{
 for(const [id,sourceText,lesson]of [['v-l03-lex-f0ef38a883-s1','谁',3],['v-l07-lex-c5a8f40bc0-s1','里',7],['v-l09-lex-586e4f0ccf-s1','边',9],['v-l09-lex-b967ce841a-s1','上',9]]){
  const f=await fixture(),m=JSON.parse(f.manifestText),catalog=JSON.parse(f.targetCatalogText);
  const patch={id,sourceText,lesson,level:1,sourceLessonFile:'hsk1-app/content/stage3-catalog.json'};
  Object.assign(m.records[0],patch,{clipUnit:'alternative-original-pronunciations',readingCount:2});Object.assign(catalog.targets[0],patch);
  f.manifestText=JSON.stringify(m);f.targetCatalogText=JSON.stringify(catalog);f.authority.acceptedSourceFrameGates=m.records;f.authority.manifestSHA256=await precisionSHA256(f.manifestText);f.authority.targetCatalogSHA256=await precisionSHA256(f.targetCatalogText);f.authoritySHA256=await precisionSHA256(canonicalPrecisionJSON(f.authority));
  assert.equal((await validatePrecisionManifest(f))[0].id,id);
 }
});
