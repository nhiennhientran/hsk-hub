import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sourceLesson} from '../src/services/source-activities/content.ts';
import {blankSourceData,editSourceDraft,validateSourceData} from '../src/services/source-activities/state.ts';

test('L4 additions preserve every original source-v2 activity and its historical meaning',()=>{
  const frozen=JSON.parse(readFileSync(new URL('./fixtures/source-l04-frozen-v2.json',import.meta.url)));
  assert.equal(Object.keys(frozen).length,21);
  for(const [id,sha] of Object.entries(frozen)) {
    const activity=sourceLesson.activities.find(a=>a.id===id);
    assert.ok(activity,id);
    assert.equal(createHash('sha256').update(JSON.stringify(activity)).digest('hex'),sha,id);
  }
});

test('L4 source omissions retain original examples and two distinct ungraded reading responses',()=>{
  const all=sourceLesson.activities;
  const question=all.filter(a=>a.source.section==='text3-questions');
  assert.deepEqual(question.map(a=>a.prompt.zh),['王一雪有几个儿子？几个女儿？','王一雪儿子今年几岁？']);
  assert.deepEqual(question.map(a=>a.fields[0].reference.zh),['她有一个儿子、一个女儿。','她儿子今年五岁。']);
  const data=blankSourceData();
  for(const a of question) {
    assert.equal(a.fields[0].assessment,'ungraded');
    assert.equal(a.fields[0].answer,undefined);
    editSourceDraft(data,a,{response:'这是学生自己的表达'},1791093600000);
  }
  assert.deepEqual(validateSourceData(data),data);
  assert.match(all.find(a=>a.source.section==='grammar1-read').prompt.zh,/她有一个姐姐/);
  assert.match(all.find(a=>a.source.section==='grammar3-read').prompt.zh,/我叫白家月，你呢/);
  assert.deepEqual(all.find(a=>a.source.section==='grammar4-read').prompt.zh.split('\n'),['（1）四口','（2）四口人','（3）两个','（4）两个学生']);
  const read=all.filter(a=>a.kind==='read-aloud');
  assert.equal(read.length,6);assert.ok(read.every(a=>a.fields.length===0));
  assert.match(read.find(a=>a.source.section==='text1-read-role').pinyin,/duōshao/);
});
