import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {validateSegments,validateReviewedSentenceSubset,mergeSegmentData} from '../src/audio-segment-contract.ts';
import {registerSegments,originalSegment,sentenceSegments} from '../src/segment-resolver.ts';
import {registerPrecisionRows} from '../src/precision-resolver.ts';
const read=file=>JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url)));
const subset=read('content/audio-segments-hsk2-reviewed-sentences.json'),authority=read('content/audio-segment-reviewed-sentences-authority.json'),tracks=read('content/audio-manifest.json').tracks;
const ids=['hsk2-fltrp-2026:l04:text2:line3','hsk2-fltrp-2026:l05:text2:line8:sentence2'];
const parent='hsk2-fltrp-2026:l05:text2:line8';
const legacyAuthority=read('content/audio-segment-authority.json'),legacy=[read('content/audio-segments-pilot.json'),read('content/audio-segments-hsk2-lessons02-03.json')];
test('frozen independent review authorizes exactly two source-frame sentences and retains low probability observations',async()=>{
 assert.deepEqual(await validateReviewedSentenceSubset(subset,tracks,authority),subset);
 const reviewPath=new URL('../'+subset.review.file.replace(/^course-app\//,''),import.meta.url);
 assert.equal(createHash('sha256').update(fs.readFileSync(reviewPath)).digest('hex'),subset.review.sha256);
 const report=JSON.parse(fs.readFileSync(reviewPath));assert.deepEqual(report.acceptedRuntimeFragmentIds,ids);
 for(const decision of report.sentenceDecisions){const segment=subset.lines[decision.id]??subset.subsegments[decision.id];assert.deepEqual(segment.guardedEvidence.sourceSampleRange,decision.sourceSampleRange);assert.deepEqual(segment.guardedEvidence.rawModelEvidence,decision.rawModelEvidence);assert.equal(segment.guardedEvidence.sourcePCM_SHA256,decision.sourcePCM_SHA256);assert.equal(segment.guardedEvidence.cropPCM_SHA256,decision.cropPCM_SHA256);assert.equal(segment.guardedEvidence.lowProbabilityFlagsRetained,true)}
 assert.equal(subset.lines[ids[0]].guardedEvidence.rawModelEvidence[0].rawLowProbabilityWordsBelow0_5.length,1);
 assert.equal(subset.subsegments[ids[1]].guardedEvidence.rawModelEvidence[1].rawLowProbabilityWordsBelow0_5.length,1);
});
test('subset source pinyin, actual lesson bytes, parent and ordinal match unchanged Chinese metadata',()=>{
 for(const binding of Object.values(authority.fragments)){const lessonPath=new URL('../'+binding.sourceLessonFile.replace(/^course-app\//,''),import.meta.url);assert.equal(createHash('sha256').update(fs.readFileSync(lessonPath)).digest('hex'),binding.sourceLessonSHA256);const lesson=JSON.parse(fs.readFileSync(lessonPath));const source=lesson.texts.flatMap(t=>t.lines).find(l=>l.id===(binding.segment.parentLineId??ids[0]));if(binding.sourceParent){assert.equal(source.zh,binding.sourceParent.sourceText);assert.equal(source.py,binding.sourceParent.sourcePinyin);assert.equal(binding.sourceParent.sentences[1].sourcePinyin,binding.segment.sourcePinyin)}else{assert.equal(source.zh,binding.segment.sourceText);assert.equal(source.py,binding.segment.sourcePinyin)}}
});
test('wrong ranges, missing gates, source substitutions and invented precision are rejected',async()=>{
 const mutations=[x=>x.lines[ids[0]].start+=1/16000,x=>x.subsegments[ids[1]].end+=1/16000,x=>delete x.lines[ids[0]],x=>x.acceptedRuntimeFragmentIds.pop(),x=>x.scope.lessons=[4],x=>x.lines[ids[0]].sourceText='错误',x=>x.subsegments[ids[1]].sourcePinyin='cuòwù',x=>x.subsegments[ids[1]].sentenceNumber=1,x=>x.subsegments[ids[1]].parentLineId='foreign',x=>x.lines[ids[0]].verification.humanListening=true,x=>x.subsegments[ids[1]].verification.devicePlaybackCertified=true,x=>x.lines[ids[0]].guardedEvidence.lowProbabilityFlagsRetained=false,x=>x.lines[parent]=structuredClone(x.subsegments[ids[1]]),x=>x.words['hsk2-fltrp-2026:l04:word16']={...x.lines[ids[0]],unit:'single-original-pronunciation',repetition:1}];
 for(const mutate of mutations){const copy=structuredClone(subset);mutate(copy);await assert.rejects(validateReviewedSentenceSubset(copy,tracks,authority))}
 assert.throws(()=>validateSegments(subset,tracks,legacyAuthority));
});
test('joint overlay and authority tampering cannot create a new independent-review acceptance',async()=>{
 for(const mutate of [(s,a)=>{s.lines[ids[0]].sourceText=a.fragments[ids[0]].segment.sourceText='错误'},(s,a)=>{s.lines[ids[0]].sourceHash=a.fragments[ids[0]].segment.sourceHash='0'.repeat(64)},(s,a)=>{s.lines[ids[0]].guardedEvidence.rawModelEvidence[0].rawLowProbabilityWordsBelow0_5=[];a.fragments[ids[0]].segment=structuredClone(s.lines[ids[0]])},(s,a)=>{s.lines[ids[0]].start=a.fragments[ids[0]].segment.start=10},(s,a)=>s.review.sha256=a.review.sha256='0'.repeat(64),(s,a)=>{s.subsegments[ids[1]].guardedEvidence.observationGlyphMapping['泥']='你';a.fragments[ids[1]].segment=structuredClone(s.subsegments[ids[1]])}]){const s=structuredClone(subset),a=structuredClone(authority);mutate(s,a);await assert.rejects(validateReviewedSentenceSubset(s,tracks,a))}
});
test('legacy manifest bytes and all 61 words, 13 holds, 78 lines and 33 children remain unchanged',async()=>{
 for(const [file,expected]of Object.entries({'audio-segments-pilot.json':'6989e0f2a7f9824bdde9e9003099c1ca98a4c212764e8c364149c81ee6882cda','audio-segments-hsk2-lessons02-03.json':'9bd2278cf872cf1d9bdccfbb3a8ff54ed96477833d73e258c724671746da91ef','audio-segment-authority.json':'4c28025a19057f63887c405b102dc6ece6bbad5509e14e288deda38b3f90504f'}))assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../content/'+file,import.meta.url))).digest('hex'),expected);
 const old=mergeSegmentData(legacy.map(value=>validateSegments(value,tracks,legacyAuthority))),all=mergeSegmentData([old,await validateReviewedSentenceSubset(subset,tracks,authority)]);
 assert.equal(Object.keys(old.words).length,61);assert.equal(old.unresolved.length,13);assert.equal(Object.keys(all.lines).length,79);assert.equal(Object.keys(all.subsegments).length,34);assert.deepEqual(all.words,old.words);assert.deepEqual(all.unresolved,old.unresolved);
 for(const kind of ['lines','subsegments'])for(const [id,segment]of Object.entries(old[kind]))assert.deepEqual(all[kind][id],segment);
 assert.throws(()=>mergeSegmentData([all,subset]));
});
test('partial child keeps original ordinal 2 without a precise parent, sibling or color word; legacy children retain sequence',async()=>{
 globalThis.location={href:'https://example.test/hsk/'};
 registerSegments(mergeSegmentData([...legacy.map(value=>validateSegments(value,tracks,legacyAuthority)),await validateReviewedSentenceSubset(subset,tracks,authority)]));
 const chunks=sentenceSegments(parent,'./');assert.equal(chunks.length,1);assert.equal(chunks[0].sentenceNumber,2);assert.equal(chunks[0].id,ids[1]);assert.equal(chunks[0].request.start,35.78);assert.equal(chunks[0].request.end,38.39);
 assert.equal(originalSegment('lines',parent,'./'),undefined);assert.equal(originalSegment('lines',parent+':sentence1','./'),undefined);assert.equal(originalSegment('words','hsk2-fltrp-2026:l04:word16','./'),undefined);
 const oldParent=Object.entries(legacy[0].lines).find(([,s])=>s.subsegments?.length);const oldChunks=sentenceSegments(oldParent[0],'./');assert.deepEqual(oldChunks.map(s=>s.id),oldParent[1].subsegments);assert.deepEqual(oldChunks.map(s=>s.sentenceNumber),oldChunks.map((_,i)=>i+1));
});
test('accepted non-spoken annotation blocks legacy line and child fallback while spoken legacy audio remains available',async()=>{
 const annotation='hsk3-fltrp-2026:l10:text3:line5',child=annotation+':sentence1';
 const original=mergeSegmentData([...legacy.map(value=>validateSegments(value,tracks,legacyAuthority)),await validateReviewedSentenceSubset(subset,tracks,authority)]);
 const historical=structuredClone(original),template=historical.lines[ids[0]];
 historical.lines[annotation]={...structuredClone(template),sourceText:'（李老师给学生讲题。）',subsegments:[child]};
 historical.subsegments[child]={...structuredClone(template),sourceText:'李老师给学生讲题。',parentLineId:annotation,sentenceNumber:1};
 historical.lines[child]=structuredClone(historical.subsegments[child]);
 globalThis.location={href:'https://example.test/hsk/'};
 registerSegments(historical);registerPrecisionRows([]);
 assert.ok(originalSegment('lines',annotation,'./'));assert.ok(originalSegment('lines',child,'./'));assert.equal(sentenceSegments(annotation,'./').length,1);
 try{
  registerPrecisionRows([],[annotation]);
  assert.equal(originalSegment('lines',annotation,'./'),undefined);
  assert.equal(originalSegment('lines',child,'./'),undefined);
  assert.deepEqual(sentenceSegments(annotation,'./'),[]);
  assert.ok(originalSegment('lines',ids[0],'./'));
 }finally{registerPrecisionRows([]);registerSegments(original)}
});
