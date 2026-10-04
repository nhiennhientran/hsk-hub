import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {baselineViDisplayRevision,viBindingsForDocument,viProposalCanonicalJSON,validateTrustedViRegistry,projectLesson,projectLexicon,projectCourseIndex} from '../src/official-vi-revisions.ts';
import {listeningDisplayQuestion} from '../src/listening-view.ts';
import {blank,grade,recordAttempt,validateState} from '../src/state.ts';
import {configs} from '../src/config.ts';

const sha=text=>createHash('sha256').update(text).digest('hex');
const courseId='hsk2-fltrp-2026',lessonFile='course-app/content/hsk2/lesson-02.json',lexiconFile='course-app/content/hsk2-lexicon.json',indexFile='course-app/content/course-index.json';
const fileText=file=>readFileSync(new URL('../../'+file,import.meta.url),'utf8');
const rawText=fileText(lessonFile),raw=JSON.parse(rawText),reviewFile='course-app/content/hsk2-official-vi-synthetic-review.json';
const plainRef=b=>({baselineFile:b.baselineFile,field:b.field,ownerId:b.ownerId,component:b.component});
async function fixture(targets=[{file:lessonFile,field:'/homework/0/prompt/vi'}],mutate=()=>{}){
 const files=[...new Set(targets.map(t=>t.file))],documents=files.map(file=>({file,rawText:fileText(file)}));
 const bindings=documents.flatMap(doc=>viBindingsForDocument(JSON.parse(doc.rawText),doc.file,courseId));
 const changes=targets.map((t,i)=>{
  const b=bindings.find(b=>b.baselineFile===t.file&&b.field===t.field);assert.ok(b);
  const newValue=`SYNTHETIC reviewed wording ${i} — not official textbook text`;
  return {changeId:'synthetic-change-'+i,baselineFile:b.baselineFile,field:b.field,ownerId:b.ownerId,component:b.component,lesson:b.lesson,
   expectedEffectiveValue:b.value,newValue,classification:'official-wording-variant',
   sourceAnchor:{kind:'directOfficial',sourceId:'synthetic-occurrence-'+i,documentSourceId:'synthetic-book',pdfSHA256:'a'.repeat(64),pdfPages:[2],printedPages:[1],section:'synthetic test only',officialViText:newValue,zhContext:b.zhContext},
   consumers:[plainRef(b)],authorReview:{reviewer:'Synthetic author',status:'accepted'},independentReview:{reviewer:'Synthetic independent reviewer',status:'accepted',evidenceRef:reviewFile}};
 });
 const manifest={schemaVersion:1,revisionId:'synthetic-revision-not-active',engine:'hsk23',courseId,parentDisplayRevision:baselineViDisplayRevision(courseId),
  baselineFiles:documents.map(doc=>({file:doc.file,sha256:sha(doc.rawText)})),sources:[{sourceId:'synthetic-book',pdfSHA256:'a'.repeat(64),pdfPageCount:4}],changes,
  coverage:{acceptedOwnerIds:[...new Set(changes.map(c=>c.ownerId))],pendingOwnerIds:[],unresolvedOwnerIds:[]}};
 const proof={reviewer:'Synthetic independent reviewer',author:'Synthetic author',status:'accepted',proposalSHA256:'',acceptedChangeIds:changes.map(c=>c.changeId),acceptedConsumerRefs:changes.map(plainRef),sourceEvidenceRefs:changes.map(c=>c.sourceAnchor)};
 mutate(manifest,proof,documents);
 proof.proposalSHA256=sha(viProposalCanonicalJSON(manifest));
 const reviewText=JSON.stringify(proof),reviewSHA256=sha(reviewText);
 manifest.independentReview={reviewer:proof.reviewer,status:'accepted',proposalSHA256:proof.proposalSHA256,evidenceFile:reviewFile,evidenceSHA256:reviewSHA256,acceptedChangeIds:proof.acceptedChangeIds};
 const manifestText=JSON.stringify(manifest);
 return {manifest,proof,documents,input:{courseId,parentDisplayRevision:baselineViDisplayRevision(courseId),manifestText,manifestSHA256:sha(manifestText),reviewFile,reviewText,reviewSHA256,documents}};
}
const context=(file,text)=>({baselineFile:file,sourceSHA256:sha(text)});

test('shared proposal canonicalization removes exact review keys and preserves array order',()=>{
 const a={z:1,a:{b:2,independentReview:{status:'x'},a:3},independentReview:{reviewer:'x'},list:[{z:1,a:2},3]};
 assert.equal(viProposalCanonicalJSON(a),' {"a":{"a":3,"b":2},"list":[{"a":2,"z":1},3],"z":1}'.trim());
 assert.notEqual(sha(viProposalCanonicalJSON(a)),sha(viProposalCanonicalJSON({...a,list:[3,{z:1,a:2}]})));
});
test('inactive lesson, canonical lexicon and course-index are private clones with identical content',()=>{
 for(const [value,project,file]of [[raw,projectLesson,lessonFile],[JSON.parse(fileText(lexiconFile)),projectLexicon,lexiconFile],[JSON.parse(fileText(indexFile)),projectCourseIndex,indexFile]]){
  const originalBytes=fileText(file);
  const projected=project(value,context(file,fileText(file)),null);assert.deepEqual(projected,value);assert.notEqual(projected,value);
  if(Array.isArray(projected))projected[0].title.vi='mutated clone';else if(projected.senses)projected.senses[0].vi='mutated clone';else projected.title.vi='mutated clone';
  assert.notDeepEqual(projected,value);assert.equal(fileText(file),originalBytes);
 }
});
test('a trusted accepted batch patches only VI; source, IDs, ZH, pinyin, answer and order remain exact',async()=>{
 const f=await fixture(),registry=await validateTrustedViRegistry(f.input),current=registry.projectLesson(raw,context(lessonFile,rawText));
 const expected=structuredClone(raw);expected.homework[0].prompt.vi=f.manifest.changes[0].newValue;
 assert.deepEqual(current,expected);assert.equal(fileText(lessonFile),rawText);assert.deepEqual(raw,JSON.parse(rawText));
 current.homework[0].prompt.vi='client mutated copy';assert.deepEqual(registry.projectLesson(raw,context(lessonFile,rawText)),expected);
 const different=structuredClone(raw);different.homework[0].answer=9;assert.throws(()=>registry.projectLesson(different,context(lessonFile,rawText)),/raw\/source identity/);
 assert.throws(()=>registry.projectLesson(raw,{baselineFile:lessonFile,sourceSHA256:'b'.repeat(64)}),/raw\/source identity/);
});
test('canonical sense and summary pointers bind their real IDs, original source indices and full raw SHA',async()=>{
 const lex=JSON.parse(fileText(lexiconFile)),index=JSON.parse(fileText(indexFile)),i=index.findIndex(e=>e.id===raw.id);
 const f=await fixture([{file:lexiconFile,field:'/senses/0/vi'},{file:indexFile,field:`/${i}/title/vi`}]);
 const registry=await validateTrustedViRegistry(f.input);
 const projectedLexicon=registry.projectLexicon(lex,context(lexiconFile,fileText(lexiconFile))),summary=registry.projectCourseIndex(index,context(indexFile,fileText(indexFile)));
 assert.equal(projectedLexicon.senses[0].vi,f.manifest.changes[0].newValue);assert.deepEqual(projectedLexicon.senses[0].sources,lex.senses[0].sources);
 assert.equal(summary[i].title.vi,f.manifest.changes[1].newValue);assert.deepEqual(summary.filter(e=>e.level===3),index.filter(e=>e.level===3));
 assert.deepEqual(registry.projectLesson(raw,context(lessonFile,rawText)),raw); // Unreviewed documents stay baseline.
});

test('an accepted terminology-derived or editorial change keeps its distinct source branch',async()=>{
 for(const kind of ['terminologyDerived','editorial']){
  const f=await fixture(undefined,(m,p)=>{
   const c=m.changes[0];c.sourceAnchor=kind==='terminologyDerived'
    ?{kind,sourceId:'synthetic-derived-occurrence',zhContext:c.sourceAnchor.zhContext,notVerbatim:true,terminologySourceRefs:[{documentSourceId:'synthetic-book',pdfSHA256:'a'.repeat(64),sourceId:'synthetic-term-occurrence',pdfPages:[2]}]}
    :{kind,sourceId:'synthetic-editorial-occurrence',zhContext:c.sourceAnchor.zhContext,directCounterpart:false,rationale:'Synthetic test: no direct book counterpart'};
   if(kind==='editorial')c.classification='editorial-no-direct-book-counterpart';p.sourceEvidenceRefs=[c.sourceAnchor];
  });
  const registry=await validateTrustedViRegistry(f.input);assert.equal(registry.projectLesson(raw,context(lessonFile,rawText)).homework[0].prompt.vi,f.manifest.changes[0].newValue);
 }
});
test('edited activity option translations cannot become ambiguous while index answers stay sealed',async()=>{
 const target={file:lessonFile,field:'/activities/1/fields/0/options/0/vi'};
 const f=await fixture([target],m=>{const c=m.changes[0];c.newValue='  PHÒNG HỌC  ';c.sourceAnchor.officialViText=c.newValue});
 await assert.rejects(validateTrustedViRegistry(f.input),/ambiguous translated options/);assert.equal(fileText(lessonFile),rawText);
});
test('derived/editorial anchors cannot counterfeit an official quotation or evade their source conditions',async()=>{
 for(const mutate of [
  c=>{c.sourceAnchor={kind:'terminologyDerived',sourceId:'synthetic-derived',zhContext:c.sourceAnchor.zhContext,notVerbatim:false,terminologySourceRefs:[]}},
  c=>{c.sourceAnchor={kind:'editorial',sourceId:'synthetic-editorial',zhContext:c.sourceAnchor.zhContext,directCounterpart:false,rationale:'test',pdfSHA256:'a'.repeat(64)};c.classification='editorial-no-direct-book-counterpart'},
 ]){const f=await fixture(undefined,(m,p)=>{mutate(m.changes[0]);p.sourceEvidenceRefs=[m.changes[0].sourceAnchor]});await assert.rejects(validateTrustedViRegistry(f.input),/Official VI revision rejected/)}
});
test('editorial anchors cannot attach an alleged printed book page or Chinese book quotation',async()=>{
 for(const bookField of [{printedPages:[1]},{officialZhText:'SYNTHETIC alleged book quotation'}]){
  const f=await fixture(undefined,(m,p)=>{const c=m.changes[0];c.classification='editorial-no-direct-book-counterpart';
   c.sourceAnchor={kind:'editorial',sourceId:'synthetic-editorial',zhContext:c.sourceAnchor.zhContext,directCounterpart:false,rationale:'Synthetic test: no direct counterpart',...bookField};p.sourceEvidenceRefs=[c.sourceAnchor]});
  await assert.rejects(validateTrustedViRegistry(f.input),/editorial source branch/);
 }
});

const rejectedMutations={
 'stale effective value':m=>m.changes[0].expectedEffectiveValue='stale',
 'wrong engine':m=>m.engine='hsk1',
 'wrong course':m=>m.courseId='hsk3-fltrp-2026',
 'wrong parent':m=>m.parentDisplayRevision='unknown-previous-display',
 'wrong baseline SHA':m=>m.baselineFiles[0].sha256='b'.repeat(64),
 'foreign source file':m=>m.baselineFiles[0].file='course-app/content/hsk3/lesson-02.json',
 'foreign owner':m=>m.changes[0].ownerId='hsk3-fltrp-2026:l02:q1',
 'wrong original pointer index':m=>m.changes[0].field='/homework/99/prompt/vi',
 'sealed answer':m=>m.changes[0].field='/homework/0/answer',
 'sealed ZH':m=>m.changes[0].field='/homework/0/prompt/zh',
 'sealed options/order':m=>m.changes[0].field='/homework/0/options/0',
 'unsafe pointer':m=>m.changes[0].field='/__proto__/vi',
 'wrong lesson':m=>m.changes[0].lesson=3,
 'wrong actual Chinese anchor':m=>m.changes[0].sourceAnchor.zhContext='Different Chinese owner',
 'wrong book SHA':m=>m.changes[0].sourceAnchor.pdfSHA256='b'.repeat(64),
 'out of bounds official page':m=>m.changes[0].sourceAnchor.pdfPages=[5],
 'official text mismatch':m=>m.changes[0].sourceAnchor.officialViText='not the new wording',
 'unresolved not active':m=>m.changes[0].classification='unresolved-source',
 'match not active':m=>m.changes[0].classification='match',
 'pending author':m=>m.changes[0].authorReview.status='pending',
 'self-only independent acceptance':(m,p)=>p.author=p.reviewer,
 'missing accepted change':(m,p)=>p.acceptedChangeIds=[],
 'foreign accepted consumer':(m,p)=>p.acceptedConsumerRefs[0].component='answer',
 'missing declared consumer':m=>m.changes[0].consumers=[],
 'unknown source evidence':(m,p)=>p.sourceEvidenceRefs=[],
 'pending owner cannot be accepted':m=>m.coverage.pendingOwnerIds=[m.changes[0].ownerId],
 'duplicate target':(m,p)=>{const c=structuredClone(m.changes[0]);c.changeId='duplicate-target';m.changes.push(c);p.acceptedChangeIds.push(c.changeId)},
};
for(const [label,mutate]of Object.entries(rejectedMutations))test('atomic guard rejects '+label,async()=>{
 const before=structuredClone(raw),f=await fixture(undefined,mutate);await assert.rejects(validateTrustedViRegistry(f.input),/Official VI revision rejected/);assert.deepEqual(raw,before);assert.equal(fileText(lessonFile),rawText);
});
test('registered manifest/review exact bytes and independent accepted proposal are all required',async()=>{
 for(const field of ['manifestText','reviewText']){const f=await fixture();f.input[field]+=' ';await assert.rejects(validateTrustedViRegistry(f.input),/asset bytes changed/)}
 const f=await fixture();const m=JSON.parse(f.input.manifestText);m.changes[0].newValue='tampered after independent review';f.input.manifestText=JSON.stringify(m);f.input.manifestSHA256=sha(f.input.manifestText);await assert.rejects(validateTrustedViRegistry(f.input),/independent proof/);
});
test('a known consumer cannot be declared accepted without its own accepted VI projection',async()=>{
 const other=viBindingsForDocument(raw,lessonFile,courseId).find(b=>b.field==='/title/vi');assert.ok(other);
 const f=await fixture(undefined,(m,p)=>{m.changes[0].consumers.push(plainRef(other));p.acceptedConsumerRefs.push(plainRef(other))});
 await assert.rejects(validateTrustedViRegistry(f.input),/consumer has no accepted projection/);
});
test('changed raw whitespace is still a different pinned source; empty acceptance cannot activate',async()=>{
 const changed=await fixture();changed.input.documents=changed.documents.map(d=>({...d,rawText:d.rawText+' '}));
 await assert.rejects(validateTrustedViRegistry(changed.input),/baseline SHA/);
 const empty=await fixture(undefined,(m,p)=>{m.changes=[];p.acceptedChangeIds=[];p.acceptedConsumerRefs=[];p.sourceEvidenceRefs=[];m.coverage.acceptedOwnerIds=[]});
 await assert.rejects(validateTrustedViRegistry(empty.input),/empty active revision/);assert.equal(fileText(lessonFile),rawText);
});
test('new graded copy changes contentRevision while actual old first/questions/answers/score remain frozen',async()=>{
 const oldQ=structuredClone(raw.homework[0]),old=grade([oldQ],{[oldQ.id]:oldQ.answer},1000,{name:'Saved learner',className:'Saved class'}),oldBytes=JSON.stringify(old),s=blank(configs[2]),key=raw.id+':vocabGrammar';recordAttempt(s,key,old);
 const f=await fixture(),registry=await validateTrustedViRegistry(f.input),current=registry.projectLesson(raw,context(lessonFile,rawText)),q=current.homework[0],latest=grade([q],{[q.id]:q.answer},1000,old.profile);recordAttempt(s,key,latest);
 assert.equal(JSON.stringify(s.homework[key].first),oldBytes);assert.notEqual(latest.contentRevision,old.contentRevision);assert.equal(latest.correct,old.correct);assert.deepEqual(latest.answers,old.answers);assert.deepEqual(latest.questions[0].options,oldQ.options);
 assert.deepEqual(validateState(structuredClone(s),configs[2]).homework[key].first.questions,[oldQ]);assert.equal(fileText(lessonFile),rawText);
});
test('saved listening question is never reprojected; missing legacy snapshot cannot fall back to current q',()=>{
 const current=structuredClone(raw.listening[0]),saved=structuredClone(current);saved.prompt.vi='SYNTHETIC earlier saved Vietnamese';saved.explanation={zh:'旧解释',vi:'SYNTHETIC earlier explanation'};
 const attempt=grade([saved],{[saved.id]:saved.answer},1000);current.prompt.vi='SYNTHETIC current Vietnamese';
 assert.deepEqual(listeningDisplayQuestion(current,attempt),saved);assert.notEqual(listeningDisplayQuestion(current,attempt).prompt.vi,current.prompt.vi);
 const legacy=structuredClone(attempt);delete legacy.questions;const bytes=JSON.stringify(legacy);assert.equal(listeningDisplayQuestion(current,legacy),undefined);assert.equal(JSON.stringify(legacy),bytes);
 assert.equal(listeningDisplayQuestion(current,undefined),current);const s=blank(configs[2]);s.listeningRound={selected:[2],limit:5,wrongOnly:false,queue:[saved.id],index:0,answers:{[saved.id]:0},submitted:{[saved.id]:legacy},playCounts:{},startedAt:1000};
 assert.deepEqual(validateState(s,configs[2]).listeningRound.submitted[saved.id].answers,attempt.answers);
});
