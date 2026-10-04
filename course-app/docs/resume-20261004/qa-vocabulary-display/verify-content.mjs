import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=new URL('../../../../',import.meta.url);
const at=path=>new URL(path,root);
const bytes=path=>readFileSync(at(path));
const json=path=>JSON.parse(bytes(path));
const hash=value=>createHash('sha256').update(value).digest('hex');
const {createVocabularyContent}=await import(at('hsk1-app/src/services/content/vocabulary.ts'));
const {createTextbookContent}=await import(at('hsk1-app/src/services/content/textbook.ts'));
const {default:engine}=await import(at('hsk1-app/src/domain/practice/engine.js'));
const book=json('hsk1-app/content/textbook.json');
const catalog=json('hsk1-app/content/stage3-catalog.json');
const media=json('hsk1-app/content/media-references.json');
const revision=json('hsk1-app/content/textbook-display-revisions.json');
const initialInput=JSON.stringify([book,catalog,media,revision]);
const sourceCommit='f8ef8ed5cf094dd230a30fd9c2dc0797497472c5';
const frozenFiles=['textbook','stage3-catalog','media-references'].map(name=>{
  const path=`hsk1-app/content/${name}.json`,current=bytes(path);
  assert.deepEqual(current,execFileSync('git',['show',sourceCommit+':'+path],{cwd:fileURLToPath(root)}));
  return {path,sha256:hash(current),exactEngineeringSourceCommitBytes:true};
});

// Keep the five-argument pure caller and separately opt in to display revisions.
const baseline=await createVocabularyContent(catalog,media,undefined,undefined,book);
const live=await createVocabularyContent(catalog,media,undefined,undefined,book,revision);
const display=createTextbookContent(book,media,catalog,undefined,revision);
assert.equal(revision.changes.length,34);
assert.equal(live.displayRevision,revision.revision);
assert.equal(baseline.displayRevision,undefined);
assert.deepEqual(live.catalog,baseline.catalog);
assert.deepEqual(live.items,baseline.items);
assert.deepEqual(live.lessons,baseline.lessons);

const targets=lessons=>new Map(lessons.flatMap(lesson=>[
  [`textbook-l${String(lesson.id).padStart(2,'0')}-title`,lesson],
  ...[...lesson.vocab,...lesson.scenes,...lesson.scenes.flatMap(scene=>scene.lines),
      ...lesson.grammar,...lesson.phonetics,...lesson.xiaoyuTips].map(item=>[item.id,item])
]));
const oldTargets=targets(book.lessons),newTargets=targets(display.lessons);
const examples=new Map(display.lessons.flatMap(lesson=>[
  ...lesson.scenes.flatMap(scene=>scene.lines.map(line=>[line.id,{lesson:lesson.id,section:'text',sourceId:scene.id,zh:line.zh,py:line.py,vi:line.vn}])),
  ...lesson.grammar.flatMap(grammar=>grammar.examples.map((line,index)=>[`${grammar.id}:example:${index+1}`,{lesson:lesson.id,section:'grammar',sourceId:grammar.id,zh:line.zh,py:line.py,vi:line.vn}]))
]));
const changedSenses=[],allBindings=[];
let audioRecords=0,missingAudio=0;
for(const item of live.items){
  const oldExamples=baseline.examplesForSense(item.senseId),newExamples=live.examplesForSense(item.senseId);
  assert.deepEqual(live.resolveAudio(item.id),baseline.resolveAudio(item.id));
  item.audio?audioRecords++:missingAudio++;
  for(const example of newExamples){
    const expected=examples.get(example.id);assert.ok(expected,example.id);
    assert.deepEqual(example,{id:example.id,...expected});
  }
  allBindings.push({senseId:item.senseId,recordId:item.id,lesson:item.lesson,zh:item.zh,
                    examples:newExamples.map(example=>({id:example.id,sourceId:example.sourceId,zh:example.zh,py:example.py,vi:example.vi}))});
  if(JSON.stringify(oldExamples)!==JSON.stringify(newExamples)){
    changedSenses.push({senseId:item.senseId,recordId:item.id,lesson:item.lesson,zh:item.zh,
                       before:oldExamples,after:newExamples});
  }
}
assert.equal(live.items.length,344);assert.equal(audioRecords,330);assert.equal(missingAudio,14);
const changes=revision.changes.map(change=>{
  assert.deepEqual(oldTargets.get(change.target)[change.field],change.expected);
  assert.deepEqual(newTargets.get(change.target)[change.field],change.value);
  const consumers=allBindings.flatMap(binding=>binding.examples.filter(example=>
    example.id===change.target||example.sourceId===change.target).map(example=>({senseId:binding.senseId,recordId:binding.recordId,exampleId:example.id})));
  return {target:change.target,field:change.field,lesson:change.lesson,source:change.source,
          mainBookDisplayExactApprovedValue:true,exampleAPIBindings:consumers,
          apiConsumersVisibleOnMixedCard:false,
          beforeExampleCount:change.field==='examples'?change.expected.length:undefined,
          afterExampleCount:change.field==='examples'?change.value.length:undefined};
});

const selected=[
  {senseId:'lex-4a1e3b19fa-s1',zh:'坐',expectedIds:['textbook-l06-grammar-02:example:3']},
  {senseId:'lex-dcf66dcd60-s2',zh:'呢',expectedIds:['textbook-l07-grammar-04:example:1','textbook-l07-grammar-04:example:3']},
  {senseId:'lex-a48f3ad06d-s2',zh:'想',expectedIds:['textbook-l06-grammar-01:example:1','textbook-l06-grammar-01:example:2']},
].map(check=>{
  const before=baseline.examplesForSense(check.senseId),after=live.examplesForSense(check.senseId);
  assert.deepEqual(after.map(example=>example.id),check.expectedIds);
  if(check.zh==='想')assert.equal(after[1].zh,'我哥哥不想休息。');
  return {...check,before,after,reviewedSourceSentenceAnchorRetained:true};
});

// The active textbook word-detail renderer selects a source scene line directly,
// rather than calling the optional word-card example API.
const detailBindings=[];
for(const lesson of display.lessons){
  const oldLesson=book.lessons.find(source=>source.id===lesson.id);
  for(const word of lesson.vocab){
    const selected=lesson.scenes.flatMap(scene=>scene.lines).find(line=>line.zh.includes(word.zh));
    const previous=oldLesson.scenes.flatMap(scene=>scene.lines).find(line=>line.zh.includes(word.zh));
    if(selected){
      assert.equal(selected.id,previous?.id);
      if(JSON.stringify([selected.zh,selected.py,selected.vn])!==JSON.stringify([previous.zh,previous.py,previous.vn])){
        detailBindings.push({lesson:lesson.id,wordId:word.id,zh:word.zh,lineId:selected.id,
                             current:{zh:selected.zh,py:selected.py,vi:selected.vn},activeRenderer:'features/textbook/vocabulary.ts:openDetail'});
      }
    }
  }
}

// Rated affected senses and a still-pending historical queue must survive the
// overlay. Exercise the real backup restore and deck/schedule operations.
const stamp=1791158400000,state=engine.blank();
engine.startReview(state,baseline.catalog,{lessons:Array.from({length:15},(_,i)=>i+1),filter:'all',direction:'zh-vi',shuffle:false},stamp);
for(const [index,entry] of changedSenses.entries()){
  const position=state.cards.review.senseIds.indexOf(entry.senseId);assert.ok(position>=0);
  engine.moveCard(state,position,stamp+index);
  engine.revealCard(state,entry.senseId,stamp+index);
  engine.rateCard(state,baseline.catalog,['again','hard','good'][index%3],stamp+index);
}
const backup=engine.exportBackup(state,baseline.catalog);
const oldRestore=engine.importBackup(backup,baseline.catalog),newRestore=engine.importBackup(backup,live.catalog);
assert.deepEqual(newRestore,oldRestore);
assert.deepEqual(Object.keys(newRestore.cards.schedule).sort(),changedSenses.map(entry=>entry.senseId).sort());
assert.ok(newRestore.cards.review.senseIds.some(id=>!newRestore.cards.review.ratings[id]));
assert.equal(newRestore.cards.review.finishedAt,null);
const scheduleChecks=[];
for(const time of [stamp+1000,stamp+601000,stamp+86401000,stamp+604801000]){
  for(const filter of ['all','due','unfamiliar','wrong'])for(const direction of ['zh-vi','vi-zh']){
    const options={lessons:Array.from({length:15},(_,i)=>i+1),filter,direction,shuffle:false};
    assert.deepEqual(engine.makeDeck(newRestore,live.catalog,options,time),engine.makeDeck(oldRestore,baseline.catalog,options,time));
    scheduleChecks.push({time,filter,direction,exactDeckAndRatingKeysEqual:true});
  }
}
const pending=newRestore.cards.review.senseIds.find(id=>!newRestore.cards.review.ratings[id]);
for(const restored of [oldRestore,newRestore]){
  engine.moveCard(restored,restored.cards.review.senseIds.indexOf(pending),stamp+1001);
  engine.revealCard(restored,pending,stamp+1001);
}
assert.deepEqual(engine.rateCard(newRestore,live.catalog,'hard',stamp+1001),engine.rateCard(oldRestore,baseline.catalog,'hard',stamp+1001));
assert.deepEqual(newRestore,oldRestore);
assert.equal(JSON.stringify([book,catalog,media,revision]),initialInput);

const report={reviewer:'qa_hsk1_01_03',reviewedAt:new Date().toISOString(),
  status:'accepted-independent-display-example-index-and-history-compatibility',
  engineeringSourceCommit:sourceCommit,frozenFiles,
  reviewedFiles:['hsk1-app/src/services/content/vocabulary.ts','hsk1-app/tests/vocabulary-content.test.mjs',
                 'hsk1-app/src/services/content/textbook-display-revisions.ts','hsk1-app/content/textbook-display-revisions.json']
    .map(path=>({path,sha256:hash(bytes(path))})),
  displayRevision:revision.revision,approvedChangeCount:34,stableSenseCount:344,audioRecordCount:330,missingWordAudioCount:14,
  pureFiveArgumentCallCompatible:true,optionalSixthDisplayArgumentValidated:true,
  originalSourceFingerprintsValidatedBeforeDisplayApplication:true,callerInputsUnchanged:true,
  originalCatalogItemsLessonAndAudioRequestsExactlyPreserved:true,
  changedSenseCount:changedSenses.length,changedSenses,approvedChanges:changes,selectedReviewedSourceAnchors:selected,
  activeTextbookDetailChangedBindingCount:detailBindings.length,activeTextbookDetailChangedBindings:detailBindings,
  examplesForSenseConsumerClassification:'API currently unused by mixed-card renderers; not a visible mixed-card example repair',
  rendererReview:{primaryModularVocabularyAndReview:'features/vocabulary/view.ts:renderCard; zh front, py/vi back, audio; no example call',
    sharedHSK1:'course-app/src/hsk1-bridge.ts imports the same HSK1 vocabulary and review modules',
    sharedHSK2HSK3:'course-app/src/main.ts:drawCard; zh/py/vi/pos/audio; not an HSK1 example consumer',
    activeTextbookDetail:'features/textbook/vocabulary.ts:openDetail uses revised lesson.scenes first Chinese-matching line directly'},
  historyCompatibility:{ratedAffectedSenseCount:changedSenses.length,existingPendingQueueRetained:true,
    ratingAndScheduleKeysUnchanged:true,actualBackupRestoreExactlyEqual:true,
    scheduleChecks:32,pendingCardCanContinueRatingAfterRestore:true,checks:scheduleChecks},
  scopeLimits:['No native mixed-card example display certification','No new official Vietnamese full alignment',
               'No historical source/proposal or sense identity changes']};
writeFileSync(new URL('./content-binding-review.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,changes:34,stableSenses:344,changedExampleSenses:changedSenses.length,
  activeTextbookDetailChanges:detailBindings.length,scheduleComparisons:32,mixedCardExamplesVisible:false},null,2));
