import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {validateSegments,validateReviewedSentenceSubset,mergeSegmentData} from '../../../src/audio-segment-contract.ts';
import {registerSegments,originalSegment,sentenceSegments,isSingleSentence} from '../../../src/segment-resolver.ts';

const here=dirname(fileURLToPath(import.meta.url)),app=resolve(here,'../../..');
const sha=value=>createHash('sha256').update(value).digest('hex');
const inputs=[];
const json=name=>{const bytes=readFileSync(resolve(app,name));inputs.push({path:'course-app/'+name,bytes:bytes.length,sha256:sha(bytes)});return JSON.parse(bytes)};
const tracks=json('content/audio-manifest.json').tracks,authority=json('content/audio-segment-authority.json');
const baseline=mergeSegmentData(['content/audio-segments-pilot.json','content/audio-segments-hsk2-lessons02-03.json'].map(name=>validateSegments(json(name),tracks,authority)));
const extra=await validateReviewedSentenceSubset(json('content/audio-segments-hsk2-reviewed-sentences.json'),tracks,json('content/audio-segment-reviewed-sentences-authority.json'));
const all=mergeSegmentData([baseline,extra]);registerSegments(all);
globalThis.location={href:'http://127.0.0.1:4173/hsk-hub/'};
const preciseWords=[],fallbackWords=[],lines=[],sentences=new Set(),knownWords=new Set(),knownLines=new Set();
const expectedTrack=(level,number,id)=>tracks.find(t=>t.level===level&&t.lesson===number&&`${number}-${t.track}`===id);
for(const level of [2,3])for(let number=1;number<=(level===2?15:18);number++){
 const lesson=json(`content/hsk${level}/lesson-${String(number).padStart(2,'0')}.json`);
 for(const word of lesson.vocabulary){
  assert.ok(!knownWords.has(word.id));knownWords.add(word.id);
  const track=expectedTrack(level,number,word.audioTrack);
  assert.ok(track);assert.equal(track.kind,'vocab');assert.equal(track.text,word.sourceText);
  const request=originalSegment('words',word.id,'./course-engine/');
  const row={id:word.id,level,lesson:number,zh:word.zh,pinyin:word.py,sourceText:word.sourceText,metadataTrackId:track.id,trackFile:track.file,trackSHA256:track.sha256,
   trackGroupBinding:'lesson word.audioTrack -> Track.kind=vocab + Track.text=word.sourceText; metadata/printed-label binding, not proof of spoken target',
   preciseRequest:request??null,originalWholeTrackRequest:{url:new URL('./course-engine/'+track.file,location.href).href,sourceKind:'original',start:null,end:null},
   humanListening:false,pronunciationToneCertified:false};
  if(request){assert.equal(all.words[word.id].sourceText,word.zh);if(all.words[word.id].sourcePinyin!==undefined)assert.equal(all.words[word.id].sourcePinyin,word.py);assert.equal(request.sourceKind,'segment');assert.equal(request.start,all.words[word.id].start);assert.equal(request.end,all.words[word.id].end);assert.ok(request.end>request.start);assert.ok(request.url.endsWith(track.file));preciseWords.push(row)}
  else fallbackWords.push({...row,legacyUnresolved:all.unresolved.find(item=>item.id===word.id)??null,
   rendererLabel:'听所在生词组原音 / Nghe nhóm từ gốc',rendererNotice:'本词独立原音尚待核验，可听所在整组原音。',
   noOriginalTargetSupport:'No runtime per-word absent-original-source state exists; raw unmatched cannot automatically mean source absent.'});
 }
 for(const text of lesson.texts)for(const line of text.lines){
  assert.ok(!knownLines.has(line.id));knownLines.add(line.id);
  const track=expectedTrack(level,number,text.audioTrack);assert.ok(track);assert.equal(track.kind,'text');assert.equal(track.text,text.number);
  const chunks=sentenceSegments(line.id,'./course-engine/'),original=originalSegment('lines',line.id,'./course-engine/');
  for(const item of chunks){assert.ok(item.request.url.endsWith(track.file));assert.equal(item.text,all.subsegments[item.id].sourceText);sentences.add(item.id)}
  if(!chunks.length&&original&&isSingleSentence(line.id)){assert.equal(all.lines[line.id].sourceText,line.zh);sentences.add(line.id)}
  lines.push({id:line.id,level,lesson:number,textNumber:text.number,zh:line.zh,trackFile:track.file,
   preciseLineRequest:original??null,rendererSentenceChildren:chunks.map(item=>({id:item.id,sentenceNumber:item.sentenceNumber,sourceText:item.text,request:item.request})),
   renderedPreciseControl:chunks.length?'sentence-children':original?(isSingleSentence(line.id)?'single-sentence':'paragraph'):'none; original complete-text track remains available',
   currentSourceMatchesAcceptedLine:all.lines[line.id]?all.lines[line.id].sourceText===line.zh:null});
 }
}
assert.equal(knownWords.size,749);assert.equal(knownLines.size,738);assert.equal(preciseWords.length,61);assert.equal(fallbackWords.length,688);
assert.equal(Object.keys(baseline.lines).length,78);assert.equal(Object.keys(baseline.subsegments).length,33);assert.equal(Object.keys(all.lines).length,79);assert.equal(Object.keys(all.subsegments).length,34);
assert.equal(sentences.size,97);assert.equal(all.unresolved.length,13);
assert.equal(lines.filter(row=>row.currentSourceMatchesAcceptedLine===false).length,0);
const newPartial=lines.find(row=>row.id==='hsk2-fltrp-2026:l05:text2:line8');
assert.equal(newPartial.preciseLineRequest,null);assert.deepEqual(newPartial.rendererSentenceChildren.map(row=>row.sentenceNumber),[2]);
assert.ok(!sentences.has('hsk2-fltrp-2026:l05:text2:line8:sentence1'));
for(const id of Object.keys(all.words))assert.ok(knownWords.has(id));
for(const id of Object.keys(all.lines))assert.ok(knownLines.has(id));
for(const id of Object.keys(all.subsegments))assert.ok(knownLines.has(all.subsegments[id].parentLineId));
for(const file of ['src/segment-resolver.ts','src/segments.ts','src/audio-segment-contract.ts','src/lesson-view.ts','src/main.ts']){const bytes=readFileSync(resolve(app,file));inputs.push({path:'course-app/'+file,bytes:bytes.length,sha256:sha(bytes)})}
const report={schemaVersion:1,status:'passed-real-current-resolver-functions',scope:'Stable-ID source/metadata and resolver routing; no audio listening, source-page rereview or precision promotion',
 counts:{lessons:33,lessonLocalWords:knownWords.size,sourceLines:knownLines.size,wordPreciseMetadata:preciseWords.length,wordFallback:688,legacyUnresolved:13,
  oldParentLineRecords:78,oldChildSentenceRecords:33,oldDistinctSentenceFragments:95,newAcceptedSentenceFragments:2,currentDistinctRenderedSentenceFragments:sentences.size},
 sourceBinding:{unknownWordIDs:0,unknownLineIDs:0,acceptedLineChineseMismatches:0,wordGroupMetadataBindingMismatches:0},
 rendererLimitation:'All fallback words have valid vocabulary track metadata. The current renderer has a blanket belongs-to-group label and no distinct absent-original-target state; actual source absences require independent source evidence and a per-ID fallback design, not inference from ASR unmatched.',
 partialSentenceChecks:{parent:newPartial.id,parentAccepted:false,acceptedOrdinals:[2],sentence1Accepted:false},
 certifications:{humanListening:false,nativeSpeakerReview:false,pronunciationToneCertified:false,devicePlaybackCertified:false},inputs,
 preciseWords,fallbackWords,sourceLines:lines,renderedSentenceFragmentIds:[...sentences].sort()};
writeFileSync(resolve(here,'resolver-review.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,counts:report.counts,sourceBinding:report.sourceBinding,partialSentenceChecks:report.partialSentenceChecks}));
