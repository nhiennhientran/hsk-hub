import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {webcrypto} from 'node:crypto';
import {validateSegments,validateReviewedSentenceSubset,mergeSegmentData} from '../src/audio-segment-contract.ts';
const read=file=>JSON.parse(fs.readFileSync(new URL('../content/'+file,import.meta.url)));
const legacy=[read('audio-segments-pilot.json'),read('audio-segments-hsk2-lessons02-03.json')],subset=read('audio-segments-hsk2-reviewed-sentences.json'),authority=read('audio-segment-authority.json'),reviewedAuthority=read('audio-segment-reviewed-sentences-authority.json'),tracks=read('audio-manifest.json').tracks;
// Execute the actual loader body. Only Vite import/glob boundaries are supplied
// by this Node fixture; the registration/order/promise logic is unmodified.
function loader(modules,register){
 const source=fs.readFileSync(new URL('../src/segments.ts',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace("const modules=import.meta.glob('../content/audio-segments-*.json');",'').replace('export function loadSegments','function loadSegments');
 const body=stripTypeScriptTypes(source)+'\nreturn loadSegments;';
 return new Function('modules','registerSegments','tracks','authority','reviewedSentenceAuthority','validateSegments','validateReviewedSentenceSubset','mergeSegmentData',body)(modules,register,tracks,authority,reviewedAuthority,validateSegments,validateReviewedSentenceSubset,mergeSegmentData);
}
function sourceModules(extra=subset){return Object.fromEntries([...legacy,extra].map((value,i)=>[['../content/audio-segments-pilot.json','../content/audio-segments-hsk2-lessons02-03.json','../content/audio-segments-hsk2-reviewed-sentences.json'][i],async()=>({default:structuredClone(value)})]))}
function delayedDigest({reject=false}={}){
 const original=globalThis.crypto;let release,enteredResolve;const entered=new Promise(resolve=>enteredResolve=resolve),gate=new Promise(resolve=>release=resolve);
 Object.defineProperty(globalThis,'crypto',{configurable:true,value:{subtle:{digest:async(...args)=>{enteredResolve();await gate;if(reject)throw Error('controlled unavailable digest');return webcrypto.subtle.digest(...args)}}}});
 return {entered,release,restore(){Object.defineProperty(globalThis,'crypto',{configurable:true,value:original})}};
}
test('concurrent callers await the same delayed actual crypto gate before overlay-ready',async()=>{
 const registrations=[],digest=delayedDigest();const load=loader(sourceModules(),value=>registrations.push(value));
 try{let firstReady=false,secondReady=false;const first=load();first.then(()=>firstReady=true);await digest.entered;assert.equal(Object.keys(registrations.at(-1).lines).length,78);const second=load();second.then(()=>secondReady=true);assert.strictEqual(first,second);await new Promise(resolve=>setImmediate(resolve));assert.equal(firstReady,false);assert.equal(secondReady,false);digest.release();await Promise.all([first,second]);assert.equal(Object.keys(registrations.at(-1).words).length,61);assert.equal(registrations.at(-1).unresolved.length,13);assert.equal(Object.keys(registrations.at(-1).lines).length,79);assert.equal(Object.keys(registrations.at(-1).subsegments).length,34);const count=registrations.length;await load();assert.equal(registrations.length,count)}finally{digest.restore()}
});
test('concurrent rejection retains baseline and resolves only after rejection, with no phantom subset',async()=>{
 const registrations=[],digest=delayedDigest({reject:true});const load=loader(sourceModules(),value=>registrations.push(value));
 try{const first=load();await digest.entered;const second=load();assert.strictEqual(first,second);assert.equal(Object.keys(registrations.at(-1).lines).length,78);digest.release();await Promise.all([first,second]);assert.equal(registrations.length,1);assert.equal(Object.keys(registrations[0].words).length,61);assert.equal(registrations[0].unresolved.length,13);assert.equal(Object.keys(registrations[0].subsegments).length,33);await load();assert.equal(registrations.length,1)}finally{digest.restore()}
});
test('invalid legacy input rejects every concurrent caller and cannot cache false readiness',async()=>{
 let calls=0,release;const registrations=[],gate=new Promise(resolve=>release=resolve);
 const broken=structuredClone(legacy[0]);Object.values(broken.words)[0].sourceText='错误';
 const modules={broken:async()=>{calls++;await gate;return {default:broken}}};const load=loader(modules,value=>registrations.push(value));
 const first=load(),second=load();assert.strictEqual(first,second);release();await Promise.all([assert.rejects(first),assert.rejects(second)]);assert.equal(registrations.length,0);await assert.rejects(load());assert.equal(calls,2);assert.equal(registrations.length,0);
});
test('optional new overlay chunk load failure preserves completed legacy registry',async()=>{
 const registrations=[],modules=sourceModules();modules['../content/audio-segments-hsk2-reviewed-sentences.json']=async()=>{throw Error('controlled optional chunk load failure')};const load=loader(modules,value=>registrations.push(value));const first=load(),second=load();assert.strictEqual(first,second);await Promise.all([first,second]);assert.equal(registrations.length,1);assert.equal(Object.keys(registrations[0].words).length,61);assert.equal(registrations[0].unresolved.length,13);assert.equal(Object.keys(registrations[0].lines).length,78);await load();assert.equal(registrations.length,1);
});
