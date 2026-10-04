import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {verifyActivities} from '../tools/verify-activities.mjs';
const load=n=>JSON.parse(fs.readFileSync(new URL(`../content/hsk3/lesson-${String(n).padStart(2,'0')}.json`,import.meta.url)));
const activity=(l,s)=>{const matches=l.activities?.filter(a=>a.id.endsWith(':'+s));assert.equal(matches?.length,1,s);return matches[0]};
for(const n of [8,9]){
 test(`HSK3 L${n} original source interaction inventory and immutable learning corpus`,()=>{
  const l=load(n);assert.deepEqual(verifyActivities(l),[]);assert.equal(l.illustrationManifest.length,n===8?13:12);assert.equal(l.vocabulary.length,n===8?31:33);assert.equal(l.texts.length,4);assert.equal(l.homework.length,30);
  assert.equal(activity(l,'objectives').fields.length,3);assert.equal(activity(l,'warmup1-matching').fields.length,6);assert.deepEqual(activity(l,'warmup1-matching').fields.map(f=>f.answer.charAt(0)),n===8?['D','C','F','A','B','E']:['B','D','A','F','E','C']);
  for(let scene=1;scene<=4;scene++){const a=activity(l,`text${scene}-listening`);assert.equal(a.audioTrack,`${n}-${scene*2-1}`);assert.equal(a.recommendedPlays,2);assert.equal(a.fields.length,2);assert.ok(a.fields.every(f=>f.assessment==='official'&&f.answerSource));const reading=activity(l,`text${scene}-reading`);assert.equal(reading.fields.length,3);assert.ok(reading.fields.every(f=>f.assessment==='reference'&&f.referenceAnswer?.zh.trim()&&f.referenceAnswer?.vi.trim()&&f.answer===undefined),'Every source reading response requires bilingual evidence-based editorial reference without an automatic answer')}
  for(const[i,count]of(n===8?[3,3,3]:[4,3,3]).entries()){const a=activity(l,`picture-dialogue${i+1}`);assert.equal(a.fields.length,count);assert.ok(a.fields.every(f=>f.input==='text'&&f.assessment==='reference'&&f.answer===undefined));}
  const practice=l.activities.filter(a=>/:grammar\d+-practice\d+$/.test(a.id));assert.equal(practice.flatMap(a=>a.fields).length,n===8?12:10);assert.ok(practice.flatMap(a=>a.fields).every(f=>f.assessment!=='official'));
 });
 test(`HSK3 L${n} official word-bank order and cross-page citations`,()=>{
  const l=load(n),expected=n===8?[['关心','得','方法','开','种'],['以后','突然','注意','其他','差不多']]:[['参加','球场','成绩','影响','世界'],['几乎','主要','只是','受到','得到']];
  for(const bank of [1,2]){const a=activity(l,`comprehensive-words${bank}`);assert.deepEqual(a.fields.map(f=>f.answer),expected[bank-1]);assert.ok(a.fields.every(f=>f.assessment==='official'&&f.input==='select'));if(n===9)assert.ok(a.fields.every(f=>(f.source??a.source).pdfPage===(bank===1?94:95)&&f.answerSource.pdfPage===13));else for(const[i,f]of a.fields.entries())assert.equal(f.answerSource.pdfPage,bank===1&&i<3?11:12)}
 });
}
test('HSK3 L9 review is open self-tracking, not a correctness score',()=>{
 const l=load(9),a=activity(l,'review-grammar');assert.equal(a.fields.length,22);assert.equal(a.matrix.rows.length,11);assert.equal(a.matrix.columns.length,2);assert.equal(new Set(a.matrix.rows.flatMap(r=>r.fieldIds)).size,22);assert.ok(a.fields.every(f=>f.input==='checkbox'&&f.assessment==='open'&&!('answer'in f)));assert.equal(activity(l,'review-vocabulary').fields.length,2);assert.equal(activity(l,'review-effort').fields.length,1);assert.equal(l.sections.filter(s=>s.kind==='culture').length,0);
});
test('HSK3 L9 exact source corrections and L8 scene provenance remain in primary data',()=>{
 const l8=load(8),l9=load(9),text=JSON.stringify(l9);assert.ok(text.includes('在那儿做运动'));assert.ok(text.includes('他们以前每年都是第一名'));assert.ok(!text.includes('在那里做运动'));assert.ok(!text.includes('他们以前年年都是第一名'));assert.equal(l8.texts[1].contextSource.pdfPage,81);assert.equal(l8.texts[3].contextSource.pdfPage,84);assert.equal(activity(l9,'grammar2-practice3').fields.length,2);
});
