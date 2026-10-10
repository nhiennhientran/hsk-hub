import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {blank,grade,parts,recordAttempt,validateState,resolveDraftQuestions,questionRevision} from '../../src/state.ts';
import {configs} from '../../src/config.ts';
import {sharedLessonAccessible,sharedLessonComplete,hsk1LessonAccessible,hsk1LessonComplete} from '../../src/access-policy.ts';
import {appendReviewedTranslationChoices,validateTranslationChoiceOverlay} from '../../src/translation-choice-overlay.ts';
import {allLessonsUnlockedFixture,allReadingCompletedFixture} from './unlocked-fixtures.ts';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
const manifestText=read('../../content/translation-choice-distractors-20261006.json');
const reviewText=read('../../docs/final-quality-20261006/qa/abcd-distractor-independent-review.json');
const overlay=await validateTranslationChoiceOverlay(manifestText,reviewText);
const invalidLessons=count=>[0,-1,count+1,1.5,NaN,Infinity,-Infinity,'1',null,undefined];
for(const level of [2,3]){
  test(`HSK${level} every valid lesson is accessible to a new learner without changing progress`,()=>{
    const c=configs[level],state=blank(c),before=structuredClone(state);
    for(let n=1;n<=c.count;n++){
      assert.equal(sharedLessonAccessible(state,n,c.count),true,`lesson ${n}`);
      assert.equal(sharedLessonComplete(state,n),false,`lesson ${n} must remain incomplete`);
    }
    for(const n of invalidLessons(c.count))assert.equal(sharedLessonAccessible(state,n,c.count),false,`invalid lesson ${String(n)}`);
    assert.deepEqual(state,before);
  });
  test(`HSK${level} drafts stay incomplete and all five zero-score/manual submissions still count as real completion`,()=>{
    const c=configs[level],state=blank(c),lesson=JSON.parse(read(`../../content/hsk${level}/lesson-01.json`));
    state.drafts[lesson.id+':vocabGrammar']={answers:{[lesson.homework[0].id]:0},updatedAt:1};
    assert.equal(sharedLessonComplete(state,1),false);assert.equal(sharedLessonAccessible(state,2,c.count),true);
    for(const [index,part]of parts.entries()){
      const qs=lesson.homework.filter(q=>q.part===part);
      const answers=Object.fromEntries(qs.map(q=>[q.id,part==='writing'?'Synthetic submitted manual answer':part==='ordering'?[...q.answer].reverse():(q.answer+1)%q.options.length]));
      const attempt=grade(qs,answers,1791244800000,state.profile);assert.equal(attempt.correct,part==='writing'?null:0);
      recordAttempt(state,lesson.id+':'+part,attempt);
      assert.equal(sharedLessonComplete(state,1),index===4);assert.equal(sharedLessonAccessible(state,2,c.count),true);
    }
    const validated=validateState(state,c);assert.equal(sharedLessonComplete(validated,1),true);assert.equal(sharedLessonComplete(validated,2),false);assert.equal(sharedLessonAccessible(validated,3,c.count),true);
  });
  test(`HSK${level} access checks preserve homework, drafts, reading and mixed rounds without inventing completion`,()=>{
    const c=configs[level],state=blank(c),id=`${c.id}:l10`;
    const lesson=JSON.parse(read(`../../content/hsk${level}/lesson-01.json`)),questions=lesson.homework.filter(q=>q.part==='vocabGrammar');
    recordAttempt(state,lesson.id+':vocabGrammar',grade(questions,Object.fromEntries(questions.map(q=>[q.id,q.answer])),1791244800000,state.profile));
    state.drafts[id+':writing']={answers:{synthetic:'Saved draft'},updatedAt:1};
    state.reading[id]={visited:['vocab'],completed:['vocab'],lastSection:'vocab',scene:1,updatedAt:1};
    state.mixed={selected:[1,5,c.count],queue:[lesson.vocabulary[0].id],index:0,seed:'saved-mixed-round'};
    const before=structuredClone(state);
    for(let n=1;n<=c.count;n++)assert.equal(sharedLessonAccessible(state,n,c.count),true);
    for(const n of invalidLessons(c.count))assert.equal(sharedLessonAccessible(state,n,c.count),false);
    assert.deepEqual(state,before);assert.equal(sharedLessonComplete(state,1),false);assert.equal(sharedLessonComplete(state,10),false);assert.equal(sharedLessonComplete(state,11),false);
  });
}
test('all 48 valid historical homework fixtures retain exact first/latest snapshots during access checks',()=>{
  for(const[key,bytes]of Object.entries(allLessonsUnlockedFixture())){
    const data=JSON.parse(bytes).data,before=JSON.stringify(data),level=key.includes('hsk1')?1:key.includes('hsk2')?2:3;
    for(let n=1;n<=(level===3?18:15);n++)assert.equal(level===1?hsk1LessonAccessible(data,n):sharedLessonAccessible(data,n,configs[level].count),true);
    assert.equal(JSON.stringify(data),before);
    if(level!==1){const old=data.homework[`${configs[level].id}:l01:translationChoice`].first;assert.equal(old.questions[0].options.length,3);}
  }
});
test('HSK1 every valid lesson is accessible without changing completion, reading or drafts; invalid IDs are rejected',()=>{
  const empty=JSON.parse(allReadingCompletedFixture().ran_hsk1_modular_v1).data;empty.reading.lessons={};empty.reading.modules={};
  const before=structuredClone(empty);
  for(let n=1;n<=15;n++){
    assert.equal(hsk1LessonAccessible(empty,n),true,`lesson ${n}`);
    assert.equal(hsk1LessonComplete(empty,n),false,`lesson ${n} must remain incomplete`);
  }
  for(const n of invalidLessons(15))assert.equal(hsk1LessonAccessible(empty,n),false,`invalid lesson ${String(n)}`);
  assert.deepEqual(empty,before);
});
test('HSK1 completion counts submitted five groups, permits legacy completed reading, and never counts a draft',()=>{
  const full=JSON.parse(allLessonsUnlockedFixture().ran_hsk1_modular_v1).data;
  assert.equal(hsk1LessonComplete(full,1),true);
  const one=structuredClone(full);delete one.homework30.lessons['1'].translation;assert.equal(hsk1LessonComplete(one,1),false);
  const empty=JSON.parse(allReadingCompletedFixture().ran_hsk1_modular_v1).data;empty.reading.lessons={};empty.reading.modules={};
  empty.homework30.lessons['1']={choice:{draft:{'synthetic':0},first:null,latest:null}};assert.equal(hsk1LessonComplete(empty,1),false);assert.equal(hsk1LessonAccessible(empty,2),true);
  empty.reading.lessons['1']={complete:true};assert.equal(hsk1LessonComplete(empty,1),true);assert.equal(hsk1LessonComplete(empty,2),false);assert.equal(hsk1LessonAccessible(empty,2),true);
});
test('HSK1 access checks preserve existing homework, reading and mixed round records',()=>{
  const data=JSON.parse(allLessonsUnlockedFixture().ran_hsk1_modular_v1).data;
  data.reading.lessons['10']={visited:true,complete:false};data.reading.modules['10']={modules:['vocab']};
  data.mixedVocabulary={schema:1,round:{id:'mixed-1-1',lessons:[1,5,15],senseIds:['saved-sense'],anchor:0,fingerprints:{'saved-sense':'saved-fingerprint'},startedAt:1}};
  const before=structuredClone(data);
  for(let n=1;n<=15;n++)assert.equal(hsk1LessonAccessible(data,n),true);
  for(const n of invalidLessons(15))assert.equal(hsk1LessonAccessible(data,n),false);
  assert.deepEqual(data,before);
});
test('all 165 independent reviewed D entries append exactly once and preserve every original field and grading answer',()=>{
  let count=0;
  for(const level of [2,3])for(let n=1;n<=(level===2?15:18);n++){
    const raw=JSON.parse(read(`../../content/hsk${level}/lesson-${String(n).padStart(2,'0')}.json`)),before=structuredClone(raw),result=appendReviewedTranslationChoices(raw,overlay);
    for(const[qIndex,q]of result.homework.entries())if(q.part==='translationChoice'){
      assert.equal(q.options.length,4);assert.deepEqual(q.options.slice(0,3),raw.homework[qIndex].options);assert.equal(q.answer,raw.homework[qIndex].answer);
      assert.equal(grade([q],{[q.id]:3}).correct,0);count++;q.options=q.options.slice(0,3);
    }
    assert.deepEqual(result,before);assert.deepEqual(raw,before);
    assert.throws(()=>appendReviewedTranslationChoices(appendReviewedTranslationChoices(raw,overlay),overlay),/不匹配/);
  }
  assert.equal(count,165);
});
test('pending, self-reviewed, changed D, and replaced independent review are rejected',async()=>{
  const original=JSON.parse(manifestText);
  for(const mutate of [m=>{m.independentReviewStatus='pending'},m=>{m.independentReviewer=m.author},m=>{m.entries[0].distractor+='变更'}]){
    const changed=structuredClone(original);mutate(changed);await assert.rejects(validateTranslationChoiceOverlay(JSON.stringify(changed),reviewText));
  }
  const replaced=JSON.parse(reviewText);replaced.reviewer='other';await assert.rejects(validateTranslationChoiceOverlay(manifestText,JSON.stringify(replaced)));
});
test('old three-choice saved drafts keep their exact snapshot after current four-choice projection',()=>{
  const raw=JSON.parse(read('../../content/hsk2/lesson-01.json')),old=raw.homework.filter(q=>q.part==='translationChoice'),current=appendReviewedTranslationChoices(raw,overlay).homework.filter(q=>q.part==='translationChoice');
  const draft={answers:{[old[0].id]:0},updatedAt:1,questions:structuredClone(old),contentRevision:questionRevision(old)};
  const before=structuredClone(draft),resolved=resolveDraftQuestions(current,draft,true);
  assert.deepEqual(resolved.questions,old);assert.deepEqual(draft,before);assert.equal(resolved.status,'incompatible');
});
