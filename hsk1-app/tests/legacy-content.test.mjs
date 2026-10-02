import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { createExerciseCatalogue } from '../src/domain/exercises/catalogue.ts';
import { exerciseAudio } from '../src/services/content/exercises.ts';
const json = file=>JSON.parse(readFileSync(new URL(`../content/${file}.json`,import.meta.url),'utf8'));
const legacy=json('legacy-exercises'),bank=json('stage2-bank'),media=json('media-references'),current=json('stage3-catalog');
const catalogue=createExerciseCatalogue(legacy,bank);
const manifest=JSON.parse(readFileSync(new URL('../docs/legacy-exercise-manifest.json',import.meta.url),'utf8'));
const canonical=value=>Array.isArray(value)?`[${value.map(canonical).join(',')}]`:value&&typeof value==='object'?`{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`:JSON.stringify(value);
const hash=value=>createHash('sha256').update(canonical(value)).digest('hex');
const original='069f9d956c9a600a91e6b4ce82241ceccc184dce';
const source=file=>execFileSync('git',['show',`${original}:new-hsk1/hsk1/${file}`],{encoding:'utf8'});
const scope={window:{}};vm.runInNewContext(source('learning-bank.js'),scope);const old=JSON.parse(JSON.stringify(scope.window.HSK1_NEW_BANK));
const pilotScope={module:{exports:{}},globalThis:{}};vm.runInNewContext(source('pilot9-data.js'),pilotScope);const pilot=JSON.parse(JSON.stringify(pilotScope.module.exports));
function resolve(entry){const task=catalogue.tasks.get(entry.authorityId);return {...task,...Object.fromEntries(['prompt','stem','meaning','explanation'].filter(k=>k in entry).map(k=>[k,entry[k]]))};}

test('exactly300 original and30pilot entry paths resolve,12current original refs plus3pilot shared cores',()=>{
 assert.equal(legacy.entries.length,330);assert.equal(legacy.tasks.length,315);assert.equal(catalogue.entries.length,480);
 assert.equal(legacy.entries.filter(e=>e.set==='original').length,300);assert.equal(legacy.entries.filter(e=>e.set==='pilot').length,30);
 assert.equal(legacy.entries.filter(e=>e.set==='original'&&e.authorityId.startsWith('homework:')).length,12);
 assert.equal(legacy.entries.filter(e=>e.set==='pilot'&&(e.authorityId.startsWith('homework:')||e.authorityId==='legacy:l09-sort-03')).length,3);
 assert.equal(bank.lessons.reduce((n,l)=>n+l.choice.length+l.sort.length+l.translation.length,0),225);assert.equal(current.listening.length,75);assert.equal(current.vocabulary.length,344);
 assert.equal(new Set(legacy.entries.map(e=>e.id)).size,330);assert.equal(manifest.entries.length,330);
});
test('all300original prompts,contexts,choice domains,token domains and correct targets match source except documented transcript correction',()=>{
 for(const lesson of old)for(const group of ['choice','sort','translation','listening'])for(const sourceQuestion of lesson[group]){
  const entry=legacy.entries.find(e=>e.oldId===sourceQuestion.id&&e.set==='original');assert.ok(entry,sourceQuestion.id);const q=resolve(entry);
  for(const key of ['prompt','stem','meaning'])assert.equal(q[key]??'',sourceQuestion[key]??'',`${sourceQuestion.id}:${key}`);
  if(sourceQuestion.options){assert.deepEqual((entry.optionOrder??q.options.map((_,i)=>i)).map(i=>q.options[i]),sourceQuestion.options,sourceQuestion.id);assert.equal(q.options[q.answer],sourceQuestion.options[sourceQuestion.answer]);}
  if(sourceQuestion.tokens){assert.deepEqual((entry.tokenOrder??q.tokens.map((_,i)=>i)).map(i=>q.tokens[i]),sourceQuestion.tokens,sourceQuestion.id);assert.deepEqual([...q.answers].sort(),[...sourceQuestion.answers].sort(),sourceQuestion.id);}
  if(sourceQuestion.audio){for(const k of ['track','start','end'])assert.equal(q.audio[k],sourceQuestion.audio[k],`${sourceQuestion.id}:${k}`);if(sourceQuestion.id!=='l10-listening-04'){assert.equal(q.transcript,sourceQuestion.transcript);assert.equal(q.pinyin,sourceQuestion.pinyin);}}
  const row=manifest.entries.find(m=>m.entryId===entry.id);assert.equal(row.sourcePayloadSha256,hash(sourceQuestion));assert.equal(row.source.commit,original);assert.equal(entry.migration.authorityFingerprint,catalogue.tasks.get(entry.authorityId).fingerprint);
 }
 const corrected=resolve(legacy.entries.find(e=>e.oldId==='l10-listening-04'));assert.equal(corrected.transcript,'我想买两斤苹果。');assert.equal(corrected.pinyin,'Wǒ xiǎng mǎi liǎng jīn píngguǒ.');assert.equal(manifest.entries.filter(e=>e.status==='corrected').length,1);
});
test('pilot contexts/domains remain exact while5writing tasks contain prompt/source only',()=>{
 for(const group of pilot.groups)for(const sourceQuestion of group.questions){
  const entry=legacy.entries.find(e=>e.oldId===sourceQuestion.id&&e.set==='pilot');const q=resolve(entry);assert.equal(q.prompt,sourceQuestion.prompt,sourceQuestion.id);assert.equal(entry.source.page,sourceQuestion.source.page);
  assert.equal(manifest.entries.find(m=>m.entryId===entry.id).sourcePayloadSha256,hash(sourceQuestion));
  if(sourceQuestion.type==='translation'){assert.equal(q.assessment,'manual');for(const field of ['accepted','incorrect','answers','answer','explanation','explain','reference','options'])assert.ok(!(field in q),`${sourceQuestion.id}:${field}`);}
  else if(sourceQuestion.type==='order'){assert.deepEqual((entry.tokenOrder??q.tokens.map((_,i)=>i)).map(i=>q.tokens[i]),sourceQuestion.tokens);assert.deepEqual(q.answers,sourceQuestion.accepted);}
  else{assert.deepEqual(q.options,sourceQuestion.options);assert.equal(q.options[q.answer],sourceQuestion.answer);assert.equal(q.stem??'',sourceQuestion.stem??'');}
  if(sourceQuestion.audio){assert.equal(q.audio.track,sourceQuestion.audio.file.replace('.mp3',''));assert.equal(q.audio.start,sourceQuestion.audio.start);assert.equal(q.audio.end,sourceQuestion.audio.end);assert.equal(q.transcript,sourceQuestion.transcript);}
  if(group.id==='reading')assert.deepEqual(legacy.passages[entry.passageId].lines,group.passage);
 }
 assert.equal(legacy.oral.length,1);assert.equal(legacy.oral[0].stems.length,3);for(const stem of legacy.oral[0].stems)assert.ok(source('pilot9.js').includes(stem));
});
test('every authored fingerprint is content-exact and every original audio range fits the existing track',()=>{
 for(const q of legacy.tasks){const {fingerprint,...data}=q;assert.equal(fingerprint,hash(data),q.id);}
 for(const e of legacy.entries){const q=catalogue.tasks.get(e.authorityId);if(!q.audio)continue;const track=media.originalTracks.find(t=>t.id===q.audio.track);assert.ok(track,e.id);assert.equal(track.lesson,e.lesson);assert.ok(q.audio.start>=0&&q.audio.end<=track.duration_s,e.id);const request=exerciseAudio(catalogue,q.id,'https://example.org/hsk1/');assert.equal(request.url,`https://example.org/hsk1/course-assets/audio/${q.audio.track}.mp3`);assert.equal(request.start,q.audio.start);assert.equal(request.end,q.audio.end);}
 assert.equal(exerciseAudio(catalogue,'unknown','https://example.org/'),null);
});
test('manual answer leakage,missingpassage,aliasdomains andduplicatedentries are rejected',()=>{
 for(const mutate of [x=>x.tasks.find(q=>q.kind==='manual').answers=['secret'],x=>x.entries.find(e=>e.oldId==='9-r1').passageId='missing',x=>x.entries[0].optionOrder=[0,0,1,2],x=>x.entries.push(x.entries[0])]){const bad=structuredClone(legacy);mutate(bad);assert.throws(()=>createExerciseCatalogue(bad,bank));}
});
