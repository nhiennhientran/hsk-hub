import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createExerciseCatalogue, checkAnswer, validAnswer } from '../src/domain/exercises/catalogue.ts';
import { blankExercisesState, validateExercisesState, answerExercise, submitExercise, restartExercise, exerciseQueue, exerciseReview, exerciseTotals, resetExercises } from '../src/domain/exercises/engine.ts';
import { migrateLegacyExercises } from '../src/domain/exercises/migration.ts';
const json = file => JSON.parse(readFileSync(new URL(`../content/${file}.json`, import.meta.url), 'utf8'));
const legacy = json('legacy-exercises'), bank = json('stage2-bank'), catalogue = createExerciseCatalogue(legacy, bank);
const task = id => catalogue.tasks.get(id);
const q = task('legacy:l01-choice-01'), manual = task('legacy:9-t1');
const clone = value => structuredClone(value);

test('submissions retain first/latest order across clock rollback, reject double submit, schedule from answers', () => {
  const state = blankExercisesState();
  assert.equal(submitExercise(state,q,1000),null);
  answerExercise(state,q,(q.answer+1)%4); assert.equal(submitExercise(state,q,2000).correct,false);
  assert.equal(submitExercise(state,q,3000),null); assert.equal(answerExercise(state,q,q.answer),false);
  assert.equal(exerciseReview(state,q).dueAt,2000);
  restartExercise(state,q);answerExercise(state,q,q.answer);submitExercise(state,q,1000);
  assert.equal(state.records[q.id].submissions[0].correct,false);assert.equal(state.records[q.id].submissions.at(-1).correct,true);
  assert.equal(exerciseReview(state,q).dueAt,1000+86400000);
  assert.deepEqual(validateExercisesState(state,catalogue),state);
  const bad=clone(state);bad.records[q.id].submissions[0].correct=true;assert.throws(()=>validateExercisesState(bad,catalogue));
  const fingerprint=clone(state);fingerprint.records[q.id].submissions[0].fingerprint='0'.repeat(64);assert.throws(()=>validateExercisesState(fingerprint,catalogue));
});
test('manual tasks never gain grades, invisible-only strings are incomplete, mistakes/due exclude them',()=>{
  for(const answer of ['', ' \n\t', '\u200b\u200d\ufe0f\u00ad'])assert.equal(validAnswer(manual,answer,true),false);
  const state=blankExercisesState();answerExercise(state,manual,'我明天上午在学校学习。');assert.equal(submitExercise(state,manual,1000).correct,null);
  const entries=catalogue.entries.filter(e=>e.set==='pilot'&&e.group==='translation');const totals=exerciseTotals(catalogue,state,entries);assert.equal(totals.manual,5);assert.equal(totals.manualSubmitted,1);assert.equal(totals.automatic,0);
  assert.equal(exerciseQueue(catalogue,state,{set:'pilot',lesson:9,group:'translation',filter:'wrong'}).length,0);assert.equal(exerciseQueue(catalogue,state,{set:'pilot',lesson:9,group:'translation',filter:'due'}).length,0);
  const tampered=clone(state);tampered.records[manual.id].submissions[0].correct=true;assert.throws(()=>validateExercisesState(tampered,catalogue));
});
test('wrong/due questions preserve shared authorities, lesson scope and current homework first scores',()=>{
  const state=blankExercisesState();answerExercise(state,q,0);submitExercise(state,q,1000);
  assert.deepEqual(exerciseQueue(catalogue,state,{set:'original',lesson:1,filter:'wrong'}).map(e=>e.oldId),['l01-choice-01']);
  assert.equal(exerciseQueue(catalogue,state,{set:'original',lesson:2,filter:'due',now:1000}).length,0);
  const existing=task('homework:l03-choice-01');const homework={questionReviews:{'l03-choice-01':{attempts:1,streak:0,mistakes:1,lastCorrect:false,lastAt:1000,dueAt:1000}}};
  const before=clone(homework);assert.equal(exerciseQueue(catalogue,state,{set:'homework-review',lesson:3,filter:'wrong',homework}).length,1);
  answerExercise(state,existing,existing.answer);submitExercise(state,existing,2000);
  assert.equal(exerciseQueue(catalogue,state,{set:'homework-review',lesson:3,filter:'wrong',homework}).length,0);assert.deepEqual(homework,before);
  assert.equal(exerciseQueue(catalogue,state,{set:'original',lesson:3,filter:'due',now:2000+86400000}).length,1);
});
test('drafts, token domains, retry flags, positions, reset and unsupported data are validated',()=>{
  const state=blankExercisesState();const sort=task('legacy:l01-sort-01');answerExercise(state,sort,[0]);answerExercise(state,q,q.answer);submitExercise(state,q,1000);
  assert.equal(validAnswer(sort,[0,0]),false);assert.equal(validAnswer(sort,[999]),false);assert.throws(()=>checkAnswer(sort,[0]));
  state.positions['original:1:sort:all']='original:l01-sort-01';assert.deepEqual(validateExercisesState(state,catalogue),state);
  for(const mutate of [s=>s.drafts[q.id]=0,s=>s.retrying=['unknown'],s=>s.positions['original:2:sort:all']='original:l01-sort-01',s=>s.score=100]){const bad=clone(state);mutate(bad);assert.throws(()=>validateExercisesState(bad,catalogue));}
  const reset=resetExercises(state,catalogue,1);assert.deepEqual(reset,blankExercisesState());assert.ok(state.records[q.id]);assert.deepEqual(validateExercisesState(undefined,catalogue),blankExercisesState());
});
function oldGroup(lesson=1,group='choice'){
 const entries=catalogue.entries.filter(e=>e.set==='original'&&e.lesson===lesson&&e.group===group);
 const answers=Object.fromEntries(entries.map(e=>[e.oldId,task(e.authorityId).answer]));
 return {schema:2,lessons:{[lesson]:{[group]:{draft:answers,first:{answers,at:2000,correct:999},attempt:{answers,at:1000,correct:-1},history:[{at:1000,correct:5,total:5}],completed:true}}}};
}
test('v2 migration uses pinned identity witness, recomputes first/attempt, never score-only history',()=>{
  const raw=oldGroup(), original=clone(raw);const result=migrateLegacyExercises(raw,catalogue);
  assert.equal(result.submitted,5);assert.equal(result.state.records[q.id].submissions.length,2);assert.equal(result.state.records[q.id].submissions[0].correct,true);assert.equal(result.state.records[q.id].submissions.at(-1).at,1000);assert.deepEqual(raw,original);
  const scoreOnly={schema:2,lessons:{1:{choice:{history:[{at:1000,correct:5,total:5}],completed:true}}}};
  assert.equal(migrateLegacyExercises(scoreOnly,catalogue).submitted,0);assert.equal(scoreOnly.lessons[1].choice.history[0].correct,5);
  const bad=oldGroup();bad.lessons[1].choice.first.answers[q.id.slice(7)]=99;assert.throws(()=>migrateLegacyExercises(bad,catalogue));
  const changed=clone(legacy);changed.tasks.find(x=>x.id===q.id).fingerprint='1'.repeat(64);const modified=createExerciseCatalogue(changed,bank);assert.equal(migrateLegacyExercises(oldGroup(),modified).submitted,4);
  const corrected=migrateLegacyExercises(oldGroup(10,'listening'),catalogue);assert.equal(corrected.submitted,4);assert.equal(corrected.state.records['legacy:l10-listening-04'],undefined);
  const base=blankExercisesState();answerExercise(base,q,0);submitExercise(base,q,500);const merged=migrateLegacyExercises(raw,catalogue,base);assert.deepEqual(merged.state.records[q.id],base.records[q.id]);
});
test('current-homework review uses attempt sequence instead of wall clock and old records remain readable',()=>{
 const state=blankExercisesState(),q=task('homework:l03-choice-01');
 const homework={questionReviews:{'l03-choice-01':{attempts:7,streak:0,mistakes:4,lastCorrect:false,lastAt:9000,dueAt:9000}}};
 answerExercise(state,q,q.answer);submitExercise(state,q,1000,homework);
 assert.equal(state.records[q.id].submissions[0].homeworkAttempts,7);
 assert.equal(exerciseReview(state,q,homework).lastCorrect,true);
 assert.equal(exerciseQueue(catalogue,state,{set:'homework-review',lesson:3,filter:'wrong',homework}).length,0);
 homework.questionReviews['l03-choice-01']={attempts:8,streak:0,mistakes:5,lastCorrect:false,lastAt:500,dueAt:500};
 assert.equal(exerciseReview(state,q,homework).lastCorrect,false);
 restartExercise(state,q);answerExercise(state,q,q.answer);submitExercise(state,q,250,homework);assert.equal(exerciseReview(state,q,homework).lastCorrect,true);
 assert.deepEqual(validateExercisesState(state,catalogue),state);
 const old=clone(state);for(const submission of old.records[q.id].submissions)delete submission.homeworkAttempts;
 homework.questionReviews['l03-choice-01'].lastAt=999999;assert.equal(exerciseReview(old,q,homework).lastCorrect,true);assert.deepEqual(validateExercisesState(old,catalogue),old);
 for(const value of [-1,1.5,NaN,'7']){const bad=clone(state);bad.records[q.id].submissions[0].homeworkAttempts=value;assert.throws(()=>validateExercisesState(bad,catalogue));}
 const unrelated=blankExercisesState();const originalTask=task('legacy:l01-choice-01');answerExercise(unrelated,originalTask,originalTask.answer);submitExercise(unrelated,originalTask,1000);unrelated.records[originalTask.id].submissions[0].homeworkAttempts=1;assert.throws(()=>validateExercisesState(unrelated,catalogue));
});


test('v2 restarted groups keep every previously submitted question open even when new drafts are empty or partial', () => {
  for (const partial of [false, true]) {
    const raw = oldGroup(); raw.lessons[1].choice.attempt = null;
    raw.lessons[1].choice.draft = partial ? { 'l01-choice-01': 0 } : {};
    const result = migrateLegacyExercises(raw, catalogue);
    const entries = catalogue.entries.filter(entry => entry.set === 'original' && entry.lesson === 1 && entry.group === 'choice');
    assert.equal(result.state.retrying.length, 5);
    for (const entry of entries) assert.ok(result.state.retrying.includes(entry.authorityId));
    assert.equal(Object.keys(result.state.drafts).length, partial ? 1 : 0);
    for (const record of Object.values(result.state.records)) assert.equal(record.submissions.length, 1);
    assert.deepEqual(validateExercisesState(result.state, catalogue), result.state);
  }
});
