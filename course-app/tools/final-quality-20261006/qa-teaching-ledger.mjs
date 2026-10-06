import assert from 'node:assert/strict';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {viBindingsForDocument} from '../../src/official-vi-revisions.ts';
import {hsk1ViFields, hsk1SourceViFiles} from '../../../hsk1-app/src/services/content/official-vi-revisions.ts';
import {appendReviewedTranslationChoices,validateTranslationChoiceOverlay,translationChoiceEntriesSHA256} from '../../src/translation-choice-overlay.ts';

const root=resolve(import.meta.dirname,'../../..');
const output=resolve(root,'course-app/docs/final-quality-20261006/qa');
const baseline='003cbae9fe3a8f9f085522bb66ea108d451fa52a';
const read=file=>readFileSync(resolve(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const sha=value=>createHash('sha256').update(value).digest('hex');
const issues=[],inputs=new Map(),fields=[],lessons=[];
const overlayFile='course-app/content/translation-choice-distractors-20261006.json',overlayReviewFile='course-app/docs/final-quality-20261006/qa/abcd-distractor-independent-review.json';
const overlay=await validateTranslationChoiceOverlay(read(overlayFile),read(overlayReviewFile));
const check=(ok,message)=>{if(!ok)issues.push(message)};
const identify=file=>{
  if(inputs.has(file))return inputs.get(file);
  const bytes=read(file),currentSHA256=sha(bytes);
  let originalSHA256=null;
  try{originalSHA256=sha(execFileSync('git',['show',baseline+':'+file],{cwd:root,maxBuffer:16*1024*1024}));}catch{}
  const entry={file,bytes:Buffer.byteLength(bytes),sha256:currentSHA256,acceptedBaselineSHA256:originalSHA256,identicalToAcceptedBaseline:currentSHA256===originalSHA256};
  inputs.set(file,entry);return entry;
};
const registry=json('course-app/content/official-vi-registry.json');
for(const level of [2,3]){
  const entry=registry.courses['hsk'+level],manifest=json(entry.manifestFile),review=json(entry.reviewFile);
  for(const f of [entry.manifestFile,entry.reviewFile])identify(f);
  check(sha(read(entry.manifestFile))===entry.manifestSHA256,'HSK'+level+' manifest identity');
  check(sha(read(entry.reviewFile))===entry.reviewSHA256,'HSK'+level+' review identity');
  check(review.status==='accepted'&&review.reviewer!==review.author,'HSK'+level+' independent review');
  const accepted=new Set(review.acceptedChangeIds);
  const changes=new Map(manifest.changes.map(c=>[c.baselineFile+'|'+c.field+'|'+c.ownerId+'|'+c.component,c]));
  for(const b of manifest.baselineFiles){
    const identity=identify(b.file);check(identity.sha256===b.sha256,'VI baseline drift: '+b.file);
    const doc=json(b.file);
    for(const f of viBindingsForDocument(doc,b.file,'hsk'+level+'-fltrp-2026')){
      const c=changes.get(f.baselineFile+'|'+f.field+'|'+f.ownerId+'|'+f.component);
      if(c)check(accepted.has(c.changeId),'Unaccepted VI field: '+c.changeId);
      fields.push({...f,level,value:c?.newValue??f.value,displayDisposition:c?'exact-independent-accepted-projection':'unchanged-editorial-field',sourceAnchor:c?.sourceAnchor??null,baselineSHA256:identity.sha256,currentByteIdentityValid:identity.identicalToAcceptedBaseline});
    }
  }
  for(let n=1;n<=(level===2?15:18);n++){
    const file=`course-app/content/hsk${level}/lesson-${String(n).padStart(2,'0')}.json`,l=json(file);
    check(l.homework.length===30,file+' 30 homework');
    const fourChoice=appendReviewedTranslationChoices(l,overlay);check(fourChoice.homework.filter(q=>q.part==='translationChoice'&&q.options.length===4).length===5,file+' ABCD five');
    const parts=Object.fromEntries(['vocabGrammar','ordering','listening','translationChoice','writing'].map(p=>[p,l.homework.filter(q=>q.part===p).length]));
    check(JSON.stringify(Object.values(parts))===JSON.stringify([10,5,5,5,5]),file+' part distribution');
    for(const q of l.homework.filter(q=>q.part==='writing'))for(const k of ['answer','modelAnswer','solution','explanation','tokens','options'])check(!(k in q),q.id+' manual answer leakage');
    lessons.push({level,lesson:n,file,sha256:identify(file).sha256,words:l.vocabulary.length,texts:l.texts.length,dialogueLines:l.texts.reduce((s,t)=>s+t.lines.length,0),grammar:l.grammar.length,homework:l.homework.length,homeworkParts:parts,independentListening:l.listening.length,activities:l.activities.length,sourcePageRange:l.source,sourceReviewDisposition:'unchanged-source-and-editorial-content; exact accepted VI projection verified separately'});
  }
}
const h1files=['textbook','textbook-display-revisions','stage2-bank','stage3-catalog','homework30-bank','course-index'].map(n=>'content/'+n+'.json').concat(hsk1SourceViFiles);
const h1values=Object.fromEntries(h1files.map(file=>[file,json('hsk1-app/'+file)]));
const h1entry=json('hsk1-app/content/official-vi-registry.json').active;
const h1manifest=json('hsk1-app/'+h1entry.manifestFile),h1review=json('hsk1-app/'+h1entry.reviewFile);
for(const f of ['hsk1-app/content/official-vi-registry.json','hsk1-app/'+h1entry.manifestFile,'hsk1-app/'+h1entry.reviewFile])identify(f);
check(sha(read('hsk1-app/'+h1entry.manifestFile))===h1entry.manifestSHA256,'HSK1 manifest identity');
check(sha(read('hsk1-app/'+h1entry.reviewFile))===h1entry.reviewSHA256,'HSK1 review identity');
check(h1review.status==='accepted'&&h1review.reviewer!==h1review.author,'HSK1 independent review');
for(const f of h1files)identify('hsk1-app/'+f);
for(const b of h1manifest.baselineFiles)check(identify('hsk1-app/'+b.file).sha256===b.sha256,'HSK1 VI baseline drift: '+b.file);
const h1accepted=new Set(h1review.acceptedChangeIds),h1changes=new Map(h1manifest.changes.map(c=>[c.baselineFile+'|'+c.field+'|'+c.ownerId+'|'+c.component,c]));
for(const f of hsk1ViFields(h1values)){
  const c=h1changes.get(f.baselineFile+'|'+f.field+'|'+f.ownerId+'|'+f.component);
  if(c)check(h1accepted.has(c.changeId),'Unaccepted HSK1 VI field: '+c.changeId);
  const identity=identify('hsk1-app/'+f.baselineFile);
  fields.push({...f,level:1,value:c?.newValue??f.effectiveValue,displayDisposition:c?'exact-independent-accepted-projection':'unchanged-editorial-field',sourceAnchor:c?.sourceAnchor??null,baselineSHA256:identity.sha256,currentByteIdentityValid:identity.identicalToAcceptedBaseline});
}
for(const l of h1values['content/textbook.json'].lessons){
  const hw=h1values['content/homework30-bank.json'].lessons.find(q=>q.lesson===l.id);
  const parts=Object.fromEntries(['choice','sort','listening','translationChoice','translation'].map(p=>[p,hw[p].length]));
  check(JSON.stringify(Object.values(parts))===JSON.stringify([10,5,5,5,5]),'HSK1 L'+l.id+' part distribution');
  for(const q of hw.translation)for(const k of ['answer','answers','modelAnswer','solution','explanation','tokens','options'])check(!(k in q),q.id+' manual answer leakage');
  const activities=h1values[hsk1SourceViFiles.find(f=>f.endsWith(`lesson-${String(l.id).padStart(2,'0')}${l.id===4?'-current':''}.json`))];
  lessons.push({level:1,lesson:l.id,file:'hsk1-app/content/textbook.json',sha256:identify('hsk1-app/content/textbook.json').sha256,words:l.vocab.length,texts:l.scenes.length,dialogueLines:l.scenes.reduce((s,t)=>s+t.lines.length,0),grammar:l.grammar.length,phonetics:l.phonetics.length,homework:Object.values(parts).reduce((a,b)=>a+b,0),homeworkParts:parts,independentListening:h1values['content/stage3-catalog.json'].listening.filter(q=>q.lesson===l.id).length,activities:activities?.activities.length??null,sourceReviewDisposition:'unchanged accepted HSK1 textbook/homework/source-activity input bytes; exact accepted VI projection verified separately'});
}
lessons.sort((a,b)=>a.level-b.level||a.lesson-b.lesson);
const unique=new Map();
const optionalEmpty=[];
for(const f of fields){
  check(typeof f.value==='string','Non-string VI field '+f.baselineFile+f.field);
  if(typeof f.value==='string'&&!f.value.trim()){
    const allowed=f.level===1&&((f.component==='homework30'&&f.field.endsWith('/meaning'))||(f.component==='source-activity'&&!f.zhContext));
    check(allowed,'Unexpected empty VI field '+f.baselineFile+f.field);
    optionalEmpty.push({baselineFile:f.baselineFile,field:f.field,ownerId:f.ownerId,reason:f.component==='homework30'?'Optional meaning supplement absent; complete Vietnamese prompt and explanation remain in the question.':'Source has an empty prompt/table header in both languages; retained as printed.'});
    continue;
  }
  const signature=sha(JSON.stringify([f.component,f.zhContext,f.value]));
  const u=unique.get(signature)??{signature,component:f.component,zhContext:f.zhContext,value:f.value,consumers:[]};
  u.consumers.push({level:f.level,lesson:f.lesson,baselineFile:f.baselineFile,field:f.field,ownerId:f.ownerId});unique.set(signature,u);
}
check(lessons.length===48,'48 lesson ledger');
check(lessons.reduce((n,l)=>n+l.homework,0)===1440,'1440 total homework questions');
check(fields.length===27735,'27735 registered VI consumer fields');
for(const f of inputs.values())check(f.identicalToAcceptedBaseline,'Teaching input changed since accepted baseline, requires new semantic review: '+f.file);
mkdirSync(output,{recursive:true});
const report={schemaVersion:1,status:issues.length?'failed':'passed-structural-and-current-byte-identity',generatedAt:new Date().toISOString(),acceptedSourceCommit:baseline,scope:{all48LessonTeachingStructures:true,allRegisteredVIConsumersTraversed:true,allDisplayedAcceptedVIAliasesIdentityVerified:true,changedTeachingInputRequiresFreshReview:true,freshAllFieldSemanticCertification:false,humanOrNativeSpeakerCertification:false,semanticScope:'Existing source/language review applies only to the verified unchanged teaching bytes. This ledger is fresh structural and accepted-byte/projection verification, not a new reading/listening claim.'},newFourChoiceOverlay:{questions:165,lessons:33,originalABCAndAnswerPositionsUnchanged:true,independentReview:'accepted',manifestFile:overlayFile,manifestSHA256:sha(read(overlayFile)),reviewFile:overlayReviewFile,reviewSHA256:sha(read(overlayReviewFile)),canonicalEntriesSHA256:translationChoiceEntriesSHA256},totals:{lessons:lessons.length,homework:lessons.reduce((n,l)=>n+l.homework,0),hsk23Homework:990,registeredVIConsumerFields:fields.length,uniqueNonemptyVIValueContexts:unique.size,optionalEmptyFields:optionalEmpty.length,verifiedInputFiles:inputs.size},lessons,inputs:[...inputs.values()],optionalEmpty,issues};
writeFileSync(resolve(output,'teaching-coverage-ledger.json'),JSON.stringify(report,null,2)+'\n');
writeFileSync(resolve(output,'unique-teaching-vi.ndjson'),[...unique.values()].map(u=>JSON.stringify(u)).join('\n')+'\n');
writeFileSync(resolve(output,'teaching-consumers.ndjson'),fields.map(f=>JSON.stringify(f)).join('\n')+'\n');
console.log(JSON.stringify({status:report.status,totals:report.totals,issues}));
assert.equal(issues.length,0,'Teaching coverage/identity failures; see ledger');
