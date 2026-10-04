import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createLearningStore,blank,grade,recordAttempt,parts,validateState} from '../../../src/state.ts';
import {configs} from '../../../src/config.ts';
import {createStore,STORAGE_KEY} from '../../../../hsk1-app/src/services/storage/index.ts';
import {createCompatibility} from '../../../../hsk1-app/src/services/storage/compatibility.ts';
import {getHomework30Bank} from '../../../../hsk1-app/src/services/content/homework30.ts';
import {HOMEWORK30_PARTS,homework30Group,submitHomework30,restartHomework30} from '../../../../hsk1-app/src/domain/homework30/engine.ts';
import legacy from '../../../../hsk1-app/src/domain/homework/engine.js';

const json=name=>JSON.parse(fs.readFileSync(new URL('../../../../hsk1-app/content/'+name,import.meta.url),'utf8'));
const compatibility=createCompatibility(json('stage2-bank.json'),json('stage3-catalog.json'),json('textbook.json'));
const stamp=1791093600000;
const lock=async task=>task();
const oldRaw={hsk1_ranteacher_progress_v1:' {"15":{"visited":true}} ',hsk2_ranteacher_progress_v1:' {"15":{"score":7}} ',hsk3_ranteacher_progress_v1:' {"20":{"score":8}} ',hsk4_upper_ranteacher_progress_v1:' {"1":{"complete":true}} '};
function memory(){const values=new Map(Object.entries(oldRaw));return {values,failKey:null,getItem:k=>values.get(k)??null,setItem(k,v){if(k===this.failKey)throw new DOMException('Synthetic quota','QuotaExceededError');values.set(k,v);}};}
function ordered(q){
 const wanted=legacy.normal(q.answers[0]);
 const search=(indices,text)=>{if(indices.length===q.tokens.length)return text===wanted?indices:null;for(let i=0;i<q.tokens.length;i++)if(!indices.includes(i)){const next=text+legacy.normal(q.tokens[i]);if(wanted.startsWith(next)){const found=search([...indices,i],next);if(found)return found;}}return null;};
 const found=search([],'');assert.ok(found,q.id);return found;
}
function hsk1(){
 const data=compatibility.blank(),bank=getHomework30Bank();
 data.homework30.profile={name:'Đặng 中文',className:'48 lessons'};
 for(const lesson of bank){
  for(let run=0;run<2;run++)for(const part of HOMEWORK30_PARTS){
   if(run)restartHomework30(data.homework30,lesson.lesson,part,stamp+run);
   homework30Group(data.homework30,lesson.lesson,part).draft=Object.fromEntries(lesson[part].map(q=>[q.id,q.kind==='translation'?`  历史${run} ${q.id}\n越文 Đặng  `:q.kind==='sort'?ordered(q):q.answer]));
   assert.equal(submitHomework30(data.homework30,lesson,part,stamp+run+2).ok,true);
  }
  data.reading.lessons[String(lesson.lesson)]={visited:true,complete:true};
  data.reading.modules['hsk1:'+lesson.lesson]={modules:['vocab','text','grammar','hanzi','practice'],updatedAt:stamp};
 }
 data.navigation={feature:'homework',lesson:15,part:'translation',homeworkVersion:'30-v1'};
 data.legacyRaw={hsk1_ranteacher_progress_v1:oldRaw.hsk1_ranteacher_progress_v1};
 return {data:compatibility.validate(data),lessons:bank.map(l=>l.lesson),questions:450,key:STORAGE_KEY,
         create:storage=>createStore({storage,blank:compatibility.blank,validate:compatibility.validate,lock})};
}
function shared(level){
 const config=configs[level],data=blank(config),lessons=Array.from({length:config.count},(_,i)=>JSON.parse(fs.readFileSync(new URL(`../../../content/hsk${level}/lesson-${String(i+1).padStart(2,'0')}.json`,import.meta.url),'utf8')));
 data.profile={name:'Đặng 中文',className:'48 lessons'};
 for(const lesson of lessons){
  for(let run=0;run<2;run++)for(const part of parts){const questions=lesson.homework.filter(q=>q.part===part),answers=Object.fromEntries(questions.map(q=>[q.id,part==='writing'?`  历史${run} ${q.id}\n越文 Đặng  `:structuredClone(q.answer)]));recordAttempt(data,lesson.id+':'+part,grade(questions,answers,stamp+run+2,data.profile));}
  for(const q of lesson.listening)recordAttempt(data,q.id+':individual',grade([q],{[q.id]:q.answer},stamp,data.profile),'listening');
  data.completed.push(lesson.id);
  data.reading[lesson.id]={visited:['overview','vocab','text','grammar','hanzi','practice','culture'],completed:['overview','vocab','text','grammar','hanzi','practice','culture'],lastSection:'text',scene:4,updatedAt:stamp};
  const a=lesson.activities.find(a=>a.fields.length);if(a)data.activities[a.id]={values:{[a.fields[0].id]:'未提交的独立教材输入'},checkedAt:null,updatedAt:stamp};
 }
 const qs=lessons.flatMap(l=>l.listening),queue=qs.map(q=>q.id);
 data.listeningRound={selected:lessons.map(l=>l.number),limit:'all',wrongOnly:false,queue,index:queue.length-1,answers:Object.fromEntries(qs.map(q=>[q.id,q.answer])),submitted:Object.fromEntries(qs.map(q=>[q.id,data.listening[q.id+':individual'].latest])),playCounts:Object.fromEntries(qs.map(q=>[q.id,0])),startedAt:stamp};
 const lexicon=JSON.parse(fs.readFileSync(new URL(`../../../content/hsk${level}-lexicon.json`,import.meta.url),'utf8'));
 data.mixed={selected:lessons.map(l=>l.number),queue:lexicon.senses.map(s=>s.id),index:lexicon.senses.length-1,seed:'preserved-real-canonical-senses'};
 data.favorites=[lessons[0].vocabulary[0].id];
 return {data:validateState(data,config),lessons:lessons.map(l=>l.number),questions:lessons.length*30,independentQuestions:queue.length,key:config.storageKey,create:storage=>createLearningStore(config,storage,lock)};
}
const fixtures=[hsk1(),shared(2),shared(3)];
for(const [index,fixture]of fixtures.entries())test(`all actual HSK${index+1} lesson histories survive store save reload export import recovery and quota`,async()=>{
 const storage=memory(),make=()=>fixture.create(storage);let store=make();
 store.edit(d=>Object.assign(d,structuredClone(fixture.data)));assert.equal((await store.save()).ok,true);
 store=make();assert.deepEqual(store.snapshot().data,fixture.data);
 const backup=store.exportBackup();assert.deepEqual(JSON.parse(backup).data,fixture.data);
 const originalOtherKeys=Object.fromEntries(storage.values.entries());
 store.edit(d=>{if(index===0)d.homework30.profile.name='Later changed profile';else d.profile.name='Later changed profile';});assert.equal((await store.save()).ok,true);
 const later=structuredClone(store.snapshot().data),preview=store.previewBackup(backup);assert.deepEqual(store.snapshot().data,later);
 assert.equal((await store.confirm(preview)).ok,true);assert.deepEqual(store.snapshot().data,fixture.data);
 assert.equal((await store.restore()).ok,true);assert.deepEqual(store.snapshot().data,later);
 const beforeQuota=storage.getItem(fixture.key);storage.failKey=fixture.key;
 store.edit(d=>{if(index===0)d.homework30.profile.name='可导出失败草稿';else d.profile.name='可导出失败草稿';});assert.equal((await store.save()).ok,false);assert.equal(storage.getItem(fixture.key),beforeQuota);
 const exported=JSON.parse(store.exportBackup()).data;assert.equal(index===0?exported.homework30.profile.name:exported.profile.name,'可导出失败草稿');
 storage.failKey=null;assert.equal((await store.save()).ok,true);
 for(const [key,value]of Object.entries(oldRaw))assert.equal(storage.getItem(key),value);
 for(const [key,value]of Object.entries(originalOtherKeys))if(key!==fixture.key)assert.equal(storage.getItem(key),value);
});
test('complete nonempty shared-course backups reject cross-level imports and wrong course versions without disk writes',async()=>{
 const storage=memory(),two=fixtures[1].create(storage),three=fixtures[2].create(storage);
 two.edit(d=>Object.assign(d,structuredClone(fixtures[1].data)));three.edit(d=>Object.assign(d,structuredClone(fixtures[2].data)));await two.save();await three.save();
 const before=Object.fromEntries(storage.values.entries());
 assert.throws(()=>three.previewBackup(two.exportBackup()));assert.throws(()=>two.previewBackup(three.exportBackup()));
 const wrong=JSON.parse(two.exportBackup());wrong.data.version='future-unreviewed';assert.throws(()=>two.previewBackup(JSON.stringify(wrong)));
 assert.deepEqual(Object.fromEntries(storage.values.entries()),before);
 fs.writeFileSync(new URL('./all48-state-roundtrip-coverage.json',import.meta.url),JSON.stringify({scope:'Actual production engines/store/validators with isolated synthetic memory port; not native UI or user data',levels:fixtures.map((f,i)=>({level:i+1,lessons:f.lessons,questions:f.questions,independentQuestions:f.independentQuestions??'HSK1 listening not seeded by this added probe'})),totalLessons:48,totalHomeworkQuestions:1440,firstLatestGroups:240,oldLegacyBytesUntouched:true,backupImportRecoveryAndQuota:true,crossLevelAndVersionRejection:true},null,2)+'\n');
});
