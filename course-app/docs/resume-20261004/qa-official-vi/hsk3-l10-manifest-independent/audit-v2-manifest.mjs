import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {viBindingsForDocument, viProposalCanonicalJSON} from '../../../../src/official-vi-revisions.ts';

// Independent v2 read-only audit. Writes only this review directory, not the
// root author's proposal, source rows, raw course, registry or public assets.
const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'../../../../../');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=f=>fs.readFileSync(path.resolve(repo,f));
const json=f=>JSON.parse(raw(f));
const inputFile='course-app/docs/resume-20261004/qa-official-vi/hsk3-l10-manifest-independent/input-copy/author-manifest.v2.json';
const manifest=json(inputFile);
const comparisonFile='course-app/docs/resume-20261004/qa-official-vi/hsk3-l10-comparison/field-comparisons.json';
const comparisons=json(comparisonFile).filter(r=>r.oldValue!==r.newValue);
const comparisonById=new Map(comparisons.map(r=>['hsk3-l10:'+r.targetRecordId,r]));
const context=json('course-app/docs/resume-20261004/qa-official-vi/hsk3-l10-manifest-independent/input-copy/context-investigation.initial.json');
comparisonById.set('hsk3-l10:'+context.target.recordId,{file:context.target.file,field:context.target.field,oldValue:context.target.expectedEffectiveValue,newValue:context.target.newValue});
const sourceFiles=['body-vietnamese-transcription.json','appendix-lesson10-vietnamese-transcription.json'].map(n=>'course-app/docs/resume-20261004/official-vi-source-prep/hsk3-l10/'+n);
const sources=new Map(sourceFiles.flatMap(f=>json(f).rows).map(r=>[r.recordId,r]));
const committedInput='6f668b4f47ed22cffe0c02d1993263fb83b1304e';
const sourceCommitChecks=[comparisonFile,...sourceFiles].map(file=>{
 const bytes=raw(file),committed=execFileSync('git',['show',committedInput+':'+file],{cwd:repo,maxBuffer:8*1024*1024});
 assert.deepEqual(bytes,committed);
 return {file,sha256:sha(bytes),committedSHA256:sha(committed),byteIdentical:true};
});
assert.equal(sources.size,119);assert.equal(comparisons.length,135);assert.equal(manifest.changes.length,136);
const documents=new Map(),bindings=new Map();
const baselineChecks=manifest.baselineFiles.map(b=>{
 const bytes=raw(b.file),value=JSON.parse(bytes);assert.equal(sha(bytes),b.sha256);documents.set(b.file,{raw:value,projected:structuredClone(value)});
 for(const binding of viBindingsForDocument(value,b.file,manifest.courseId)) bindings.set(JSON.stringify([b.file,binding.field]),binding);
 const committed=execFileSync('git',['show',committedInput+':'+b.file],{cwd:repo,maxBuffer:12*1024*1024});
 assert.deepEqual(bytes,committed);
 return {file:b.file,actualSHA256:sha(bytes),manifestSHA256:b.sha256,committedSHA256:sha(committed),byteIdentical:true};
});
function pointerParent(value,pointer){let parts=pointer.slice(1).split('/').map(x=>x.replaceAll('~1','/').replaceAll('~0','~'));assert.equal(parts.at(-1),'vi');let p=value;for(const key of parts.slice(0,-1))p=p[key];return [p,parts.at(-1)];}
function sourcePages(s){const fragments=s.sourceFragments?.length?s.sourceFragments:[s];const pairs=[];for(const f of fragments)if(!pairs.some(p=>p[0]===f.pdfPage&&p[1]===f.printedPage))pairs.push([f.pdfPage,f.printedPage]);return pairs;}
const decisions=manifest.changes.map((c,index)=>{
 const binding=bindings.get(JSON.stringify([c.baselineFile,c.field])),comparison=comparisonById.get(c.changeId);
 assert.equal(c.authorReview.reviewer,'root');assert.equal(c.authorReview.status,'accepted');assert.equal(c.independentReview,undefined);
 assert.ok(binding);assert.ok(comparison);assert.equal(c.expectedEffectiveValue,binding.value);assert.equal(c.expectedEffectiveValue,comparison.oldValue);assert.equal(c.newValue,comparison.newValue);assert.equal(c.baselineFile,comparison.file);assert.equal(c.field,comparison.field);assert.equal(c.ownerId,binding.ownerId);assert.equal(c.component,binding.component);assert.equal(c.lesson,binding.lesson);assert.equal(c.sourceAnchor.zhContext,binding.zhContext);assert.deepEqual(c.consumers,[{baselineFile:c.baselineFile,field:c.field,ownerId:c.ownerId,component:c.component}]);
 const [original,key]=pointerParent(documents.get(c.baselineFile).raw,c.field);assert.equal(original[key],c.expectedEffectiveValue);
 const anchor=c.sourceAnchor,refs=anchor.kind==='directOfficial'?[anchor]:anchor.terminologySourceRefs;
 const cited=refs.map(ref=>{const s=sources.get(ref.sourceId);assert.ok(s);assert.equal(ref.pdfSHA256,'7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951');assert.equal(ref.documentSourceId,'hsk3-official-vietnamese-20261004');assert.equal(ref.section,s.section);return {sourceId:s.recordId,sourceChinese:s.chineseAnchor,sourceVietnamese:s.printedVietnamese,actualPages:sourcePages(s),anchorPages:ref.pdfPages.map((p,i)=>[p,ref.printedPages[i]]),fullSpanMatches:JSON.stringify(sourcePages(s))===JSON.stringify(ref.pdfPages.map((p,i)=>[p,ref.printedPages[i]]))};});
 const isContext=c.classification==='official-book-erratum';
 if(isContext){assert.equal(c.changeId,'hsk3-l10:'+context.target.recordId);assert.equal(anchor.officialViText,context.printedSource.vi);assert.equal(anchor.officialZhText,context.printedSource.zh);assert.equal(anchor.erratumId,context.erratumId);assert.equal(anchor.publisherIssuedCorrection,false);assert.equal(anchor.correctionRationale,context.rationale);assert.deepEqual(anchor.corroboratingSameBookSource,context.corroboratingSameBookSource);}
 const fragments=isContext?[]:anchor.kind==='directOfficial'?[{sourceId:anchor.sourceId,sourceStartUTF16:0,sourceEndUTF16:anchor.officialViText.length,targetStartUTF16:0,targetEndUTF16:c.newValue.length,text:c.newValue}]:anchor.sourceFragments;
 if(anchor.kind==='directOfficial'){assert.equal(anchor.officialViText,sources.get(anchor.sourceId).printedVietnamese);assert.equal(anchor.officialZhText,sources.get(anchor.sourceId).chineseAnchor);if(!isContext)assert.equal(c.newValue,anchor.officialViText)}
 else {assert.equal(anchor.notVerbatim,true);assert.equal(anchor.compositionReview.status,'accepted-by-author-awaiting-independent-proof');assert.equal(anchor.compositionReview.author,'root');}
 const covered=new Array(c.newValue.length).fill(false);
 for(const f of fragments){const s=sources.get(f.sourceId);assert.ok(s);assert.equal(s.printedVietnamese.slice(f.sourceStartUTF16,f.sourceEndUTF16),f.text);assert.equal(c.newValue.slice(f.targetStartUTF16,f.targetEndUTF16),f.text);assert.equal(f.sourceEndUTF16-f.sourceStartUTF16,f.targetEndUTF16-f.targetStartUTF16);for(let p=f.targetStartUTF16;p<f.targetEndUTF16;p++){assert.equal(covered[p],false);covered[p]=true}}
 const uncited=[];for(let p=0;p<covered.length;){if(covered[p]){p++;continue}const start=p;while(p<covered.length&&!covered[p])p++;const text=c.newValue.slice(start,p);uncited.push({targetStartUTF16:start,targetEndUTF16:p,text,existsVerbatimInOld:c.expectedEffectiveValue.includes(text)});}
 const gap=cited.some(s=>!s.fullSpanMatches);const [projected,leaf]=pointerParent(documents.get(c.baselineFile).projected,c.field);projected[leaf]=c.newValue;
 return {ordinal:index+1,changeId:c.changeId,file:c.baselineFile,field:c.field,ownerId:c.ownerId,component:c.component,lesson:c.lesson,chineseContext:binding.zhContext,oldValue:c.expectedEffectiveValue,newValue:c.newValue,kind:anchor.kind,sourceEvidence:cited,sourceFragments:fragments,uncitedRanges:uncited,guardChecks:'exact original pointer, actual registered owner/Chinese/component/lesson, source text and exact UTF16 intervals passed',decision:gap?'held-incomplete-source-page-span':'accepted-content-and-construction',acceptanceScope:gap?'new Vietnamese text agrees with complete accepted source; manifest source span is incomplete and is not accepted':'exact content/construction only; final aggregate author/proof/hash must still be reviewed',manualRationale:null};
});
function diff(a,b,p=''){if(typeof a!=='object'||a===null||typeof b!=='object'||b===null)return a===b?[]:[{pointer:p,before:a,after:b}];assert.equal(Array.isArray(a),Array.isArray(b));assert.deepEqual(Object.keys(a),Object.keys(b));return Object.keys(a).flatMap(k=>diff(a[k],b[k],p+'/'+k.replaceAll('~','~0').replaceAll('/','~1')));}
const projectionChecks=[...documents].map(([file,d])=>{const differences=diff(d.raw,d.projected),targets=manifest.changes.filter(c=>c.baselineFile===file).map(c=>c.field);assert.deepEqual(differences.map(r=>r.pointer).sort(),targets.sort());assert.ok(differences.every(r=>r.pointer.endsWith('/vi')));return {file,changedVILeaves:differences.length,changedNonVILeaves:0,structuralChanges:0,sourceOrAnswerOrHistoryChanges:0,rawFileSHA256:sha(raw(file)),rawFileWritten:false};});
const lesson=documents.get('course-app/content/hsk3/lesson-10.json').projected,lex=documents.get('course-app/content/hsk3-lexicon.json').projected;
const canonicalPairs=lesson.vocabulary.map(word=>{const id='hsk3-fltrp-2026:sense:l10-'+word.id.split(':').at(-1);const sense=lex.senses.find(s=>s.id===id);assert.ok(sense);assert.equal(word.zh,sense.zh);assert.equal(word.vi,sense.vi);assert.equal(word.py,sense.py);assert.equal(word.pos,sense.pos);const localChange=decisions.find(c=>c.ownerId===word.id&&c.field.startsWith('/vocabulary/'));const canonicalChange=decisions.find(c=>c.ownerId===id);if(localChange||canonicalChange){assert.ok(localChange&&canonicalChange);assert.deepEqual(localChange.sourceEvidence,canonicalChange.sourceEvidence);assert.deepEqual(localChange.sourceFragments,canonicalChange.sourceFragments);}return {localWordId:word.id,canonicalSenseId:id,Chinese:word.zh,POS:word.pos,newVI:word.vi,pairedProposal:!!localChange,identicalAnchorsAndSelectedSpans:true};});
assert.equal(canonicalPairs.length,33);
const pdf='/workspace/scratch/28b55072841a/upload/HSK3 (3.0).pdf',pdfBytes=fs.readFileSync(pdf);assert.equal(sha(pdfBytes),'7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951');
const visualEvidence=[98,99,100,101,102,103,104,105,106,201,202].map(n=>{const name=n===201||n===202?`independent-p${n}-3x.png`:`independent-p${String(n).padStart(3,'0')}.png`;const file='course-app/docs/resume-20261004/qa-official-vi/hsk3-l10-source/page-evidence/'+name;return {pdfPage:n,printedPage:n-12,file,sha256:sha(raw(file)),actuallyVisuallyViewedByThisReviewer:true,reusedCommittedSourceRaster:true,newRasterRenderClaim:false};});
const result={schemaVersion:1,status:'independent-v2-source-owner-span-and-private-projection-checks-complete',reviewer:'qa_hsk1_05_08',reviewIndependence:'Neither original H3L10 comparison author nor root proposal/context author.',inputManifestFile:inputFile,inputManifestSHA256:sha(raw(inputFile)),proposalSHA256:sha(viProposalCanonicalJSON(manifest)),officialPDF:{path:pdf,bytes:pdfBytes.length,sha256:sha(pdfBytes)},sourceOccurrenceCount:119,reviewedChangeCount:decisions.length,directOfficial:decisions.filter(d=>d.kind==='directOfficial').length,terminologyDerived:decisions.filter(d=>d.kind==='terminologyDerived').length,acceptedContentAndConstruction:decisions.filter(d=>d.decision==='accepted-content-and-construction').length,heldChangeIds:decisions.filter(d=>d.decision.startsWith('held')).map(d=>d.changeId),trustedRuntimeProofGenerated:false,productionChanged:false,sourceCommitChecks,baselineChecks,projectionChecks,canonicalPairs,visualEvidence,decisionFile:'change-decisions.v2-structural.json'};
fs.writeFileSync(path.join(here,'change-decisions.v2-structural.json'),JSON.stringify(decisions,null,2)+'\n');
fs.writeFileSync(path.join(here,'v2-structural-review.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({reviewed:decisions.length,acceptedContent:result.acceptedContentAndConstruction,held:result.heldChangeIds,proposalSHA256:result.proposalSHA256,nonVIChanged:0,localCanonicalPairs:canonicalPairs.length}));
