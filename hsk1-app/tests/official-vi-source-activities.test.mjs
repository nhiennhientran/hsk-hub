import test from 'node:test';
import assert from 'node:assert/strict';
import {hsk1ViFields,hsk1SourceViFiles,viPointer,isViDisplayField,defaultOfficialViRegistry} from '../src/services/content/official-vi-revisions.ts';
import {sourceLessons,projectSourceLesson,getSourceLesson,sourceRecordKey} from '../src/services/source-activities/content.ts';
import {blankSourceData,editSourceDraft,validateSourceData,archivedSourceRecords} from '../src/services/source-activities/state.ts';
import {fixtureRegistry,json} from './helpers/official-vi-fixture.mjs';

const values=Object.fromEntries([...['textbook','textbook-display-revisions','stage2-bank','stage3-catalog','homework30-bank','course-index'].map(name=>`content/${name}.json`),...hsk1SourceViFiles].map(file=>[file,json(file.slice(8,-5))]));
const fields=hsk1ViFields(values);
const activityField=fields.find(f=>f.component==='source-activity'&&f.relativeField==='/instruction/vi'&&sourceLessons.find(l=>l.lesson===f.lesson).activities.find(a=>a.id===f.ownerId).fields.length);
const changed=f=>({...f,newValue:`${f.effectiveValue} (kiểm thử)`});

test('all fifteen active source sidecars expose exact VI leaves with unique owners and immutable Chinese context',()=>{
  assert.equal(hsk1SourceViFiles.length,15);
  const seen=new Set();
  for(const f of fields.filter(f=>f.component.startsWith('source-'))){
    let raw=values[f.baselineFile];for(const part of viPointer(f.field))raw=raw[part];assert.equal(raw,f.effectiveValue);
    assert.ok(isViDisplayField(f.component,f.relativeField));assert.equal(viPointer(f.relativeField).at(-1),'vi');
    const key=JSON.stringify([f.baselineFile,f.field,f.ownerId,f.component]);assert.equal(seen.has(key),false);seen.add(key);
  }
  assert.equal(new Set(fields.filter(f=>f.component==='source-activity').map(f=>f.lesson)).size,15);
  for(const component of ['source-activity','source-figure','source-numbers','source-bonus'])assert.ok(fields.some(f=>f.component===component));
  assert.ok(!fields.some(f=>f.baselineFile.endsWith('/lesson-04.json')),'the superseded frozen lesson is not the active display source');
});

test('inactive source display preserves exact catalogue identity and record keys',()=>{
  for(const raw of sourceLessons){assert.equal(projectSourceLesson(raw),raw);assert.equal(getSourceLesson(raw.lesson),raw);for(const a of raw.activities)assert.equal(defaultOfficialViRegistry().displayVersion(a.id,'source-activity',a.version),a.version);}
});

test('accepted activity VI gets a separate content version without altering Chinese, answer keys, IDs or raw source',async()=>{
  const raw=sourceLessons.find(l=>l.lesson===activityField.lesson),before=structuredClone(raw);
  const {registry}=await fixtureRegistry('source-A',[changed(activityField)]),shown=projectSourceLesson(raw,registry);
  const a=raw.activities.find(a=>a.id===activityField.ownerId),display=shown.activities.find(x=>x.id===a.id);
  assert.equal(display.instruction.vi,changed(activityField).newValue);assert.notEqual(display.version,a.version);
  assert.match(display.version,/-vi-[a-f0-9]{64}$/);assert.ok(display.version.length<=180);
  const {version,instruction,...sealed}=display,{version:oldVersion,instruction:oldInstruction,...original}=a;
  assert.deepEqual(sealed,original);assert.equal(instruction.zh,oldInstruction.zh);assert.deepEqual(raw,before);
  for(const other of shown.activities.filter(x=>x.id!==a.id))assert.equal(other,raw.activities.find(x=>x.id===other.id));
});

test('display changes retain old drafts and submitted contexts as read-only archived versions',async()=>{
  const raw=sourceLessons.find(l=>l.lesson===activityField.lesson),a=raw.activities.find(a=>a.id===activityField.ownerId),data=blankSourceData();
  editSourceDraft(data,a,{[a.fields[0].id]:'旧答案'},100);const old=structuredClone(data.records[sourceRecordKey(a)]);
  const {registry}=await fixtureRegistry('source-A',[changed(activityField)]),shown=projectSourceLesson(raw,registry),current=shown.activities.find(x=>x.id===a.id);
  editSourceDraft(data,current,{[a.fields[0].id]:'新答案'},200);
  assert.deepEqual(data.records[sourceRecordKey(a)],old);assert.equal(Object.keys(data.records).length,2);
  assert.deepEqual(archivedSourceRecords(data,raw.lesson,shown.activities),[old]);assert.deepEqual(validateSourceData(data),data);
  assert.throws(()=>editSourceDraft(data,{...current,version:a.version},{[a.fields[0].id]:'overwrite'},300),/版本已改变/);
});

test('same accepted source fields across registry IDs keep the same activity version; changed wording gets a new version',async()=>{
  const a=sourceLessons.find(l=>l.lesson===activityField.lesson).activities.find(a=>a.id===activityField.ownerId);
  const {registry:first}=await fixtureRegistry('revision-A',[changed(activityField)]),{registry:second}=await fixtureRegistry('revision-B',[changed(activityField)]);
  assert.equal(first.displayVersion(a.id,'source-activity',a.version),second.displayVersion(a.id,'source-activity',a.version));
  const {registry:third}=await fixtureRegistry('revision-C',[{...activityField,newValue:'Một câu khác để kiểm thử.'}]);
  assert.notEqual(first.displayVersion(a.id,'source-activity',a.version),third.displayVersion(a.id,'source-activity',a.version));
});

test('figure captions, number tables and bonus titles project only their registered Vietnamese leaf',async()=>{
  for(const component of ['source-figure','source-numbers','source-bonus']){
    const f=fields.find(f=>f.component===component&&f.effectiveValue.trim()),raw=sourceLessons.find(l=>l.lesson===f.lesson),before=structuredClone(raw);
    const {registry}=await fixtureRegistry('sidecar-A',[changed(f)]),shown=projectSourceLesson(raw,registry);
    const owner=component==='source-figure'?shown.figures.find(x=>x.id===f.ownerId):component==='source-numbers'?shown.numberTables:shown.bonus;
    let leaf=owner;for(const part of viPointer(f.relativeField))leaf=leaf[part];assert.equal(leaf,changed(f).newValue);
    assert.deepEqual(raw,before);assert.deepEqual(shown.activities,raw.activities);
  }
});

test('a source display revision cannot register Chinese, grading, source, identity or media fields',async()=>{
  for(const relativeField of ['/prompt/zh','/fields/0/answer','/fields/0/answerSource/vi','/source/vi','/id','/audio/vi','/fields/0/options/0/id']){
    assert.equal(isViDisplayField('source-activity',relativeField),false);
    await assert.rejects(fixtureRegistry('bad',[{...changed(activityField),relativeField}]));
  }
});

test('source select VI revisions cannot duplicate an unchanged label or collapse two original option identities',async()=>{
  const field=fields.find(f=>f.component==='source-activity'&&/\/options\/0\/vi$/.test(f.relativeField)&&f.originalOptions.length>1);
  const group=fields.filter(f=>f.ownerId===field.ownerId&&f.component===field.component&&f.relativeField.startsWith(field.relativeField.slice(0,-5)));
  assert.ok(group.length>1);
  await assert.rejects(fixtureRegistry('duplicate-source',[{...field,newValue:field.originalOptions[1]}]),/source option/);
  await assert.rejects(fixtureRegistry('duplicate-source',group.map(f=>({...f,newValue:'Trùng nhãn'}))),/ambiguous/);
  await assert.rejects(fixtureRegistry('missing-source-binding',[{...field,originalOptions:undefined,newValue:'Nhãn mới'}]),/binding/);
  const {registry}=await fixtureRegistry('valid-source',[{...field,newValue:'Nhãn riêng để kiểm thử'},...group.filter(f=>f.field!==field.field).map(f=>({...f,newValue:f.effectiveValue}))]);
  const raw=sourceLessons.find(l=>l.lesson===field.lesson).activities.find(a=>a.id===field.ownerId),before=structuredClone(raw),shown=registry.project(raw,raw.id,'source-activity');
  assert.deepEqual(raw,before);assert.equal(shown.fields[Number(viPointer(field.relativeField)[1])].options[0].id,raw.fields[Number(viPointer(field.relativeField)[1])].options[0].id);
  assert.equal(shown.fields[Number(viPointer(field.relativeField)[1])].answer,raw.fields[Number(viPointer(field.relativeField)[1])].answer);
});
