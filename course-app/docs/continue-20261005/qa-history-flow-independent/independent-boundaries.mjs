import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {configs} from '../../../src/config.ts';
import {blank, createLearningStore, captureDraftAnswer, resolveDraftQuestions,
  captureListeningDraftAnswer, grade} from '../../../src/state.ts';
import {commitCourseAttempt} from '../../../src/attempt-commit.ts';
import {mountListening} from '../../../src/listening-view.ts';

// Minimal deterministic DOM harness for the actual renderer. This is not a
// native browser, CSS/accessibility test, or textbook language certification.
class Element {
  constructor(tag) {this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.handlers={};this.disabled=false;this._text='';this.classList={values:new Set(),add:(...values)=>values.forEach(v=>this.classList.values.add(v))};}
  set textContent(text) {this._text=String(text);this.children=[];}
  get textContent() {return this._text+this.children.map(c=>c.textContent??String(c)).join('');}
  append(...nodes) {for(const n of nodes){if(n&&typeof n==='object')n.parent=this;this.children.push(n);}}
  prepend(...nodes) {this.children.unshift(...nodes);}
  replaceChildren(...nodes) {this.children=[];this._text='';this.append(...nodes);}
  setAttribute(name,value) {this[name]=String(value);}
  addEventListener(name,handler) {(this.handlers[name]??=[]).push(handler);}
  remove() {if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}
  click() {if(!this.disabled)for(const handler of this.handlers.click??[])handler();}
}
globalThis.document={createElement:tag=>new Element(tag)};
const all=(root,predicate)=>[...(predicate(root)?[root]:[]),...root.children.filter(n=>n instanceof Element).flatMap(n=>all(n,predicate))];
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const clone=x=>structuredClone(x);
const checks=[];
const check=(name,fn)=>{fn();checks.push({name,passed:true});};
const asynchronous=async(name,fn)=>{await fn();checks.push({name,passed:true});};

function question(level) {return {id:configs[level].id+':l01:independent-probe',part:'listening',
  prompt:{zh:'合成独审题',vi:'SYNTHETIC CURRENT PROMPT'},options:['A','B','C'],answer:1,
  focus:'synthetic-independent-review',source:{pdfPage:1,printedPage:1,section:'synthetic',provenance:'supplemental'}};}
function storageFor(config,data) {
  const key=config.storageKey,values=new Map([[key,JSON.stringify({app:config.id,schema:1,revision:7,updatedAt:1000,data,recovery:null})]]);
  let fail=false,writes=0;
  return {getItem:k=>values.get(k)??null,setItem(k,v){if(fail&&k===key)throw Object.assign(new Error('synthetic quota'),{name:'QuotaExceededError'});values.set(k,v);writes++;},
    failure:v=>fail=v,raw:()=>values.get(key),writes:()=>writes};
}

for(const level of [2,3]) {
  await asynchronous(`HSK${level} active listening legacy acknowledgement retains answers through failed save and retry, then submits only its captured question`,async()=>{
    const config=configs[level],q=question(level),initial=blank(config);
    initial.listeningRound={selected:[1],limit:5,wrongOnly:false,queue:[q.id],index:0,answers:{[q.id]:99},submitted:{},playCounts:{},startedAt:1000};
    const memory=storageFor(config,initial),store=createLearningStore(config,memory,async task=>task()),host=new Element('main'),messages=[];
    const original=memory.raw();memory.failure(true);
    const cleanup=mountListening(host,[{number:1,listening:[q],texts:[]}],{
      requireLegacyReview:true,state:()=>store.snapshot().data,edit:fn=>store.edit(fn),flush:async()=> (await store.save()).ok,
      commit:(id,a,r,signal)=>commitCourseAttempt(store,id+':individual',a,'listening',signal,()=>false,r),play:async()=>true,stop(){},message:text=>messages.push(text)});
    let card=all(host,n=>n.classList.values.has('activity-card'))[0];
    assert.equal(card.dataset.draftQuestionSnapshot,'missing');
    assert.ok(all(card,n=>n.tagName==='INPUT').every(n=>n.disabled));
    let acknowledge=all(card,n=>n.tagName==='BUTTON'&&n.textContent.includes('按当前题目继续'))[0];
    acknowledge.click();await tick();
    assert.equal(memory.raw(),original);assert.equal(memory.writes(),0);
    assert.equal(store.snapshot().data.listeningRound.answers[q.id],99);
    assert.equal(card.dataset.draftQuestionSnapshot,'missing');
    assert.deepEqual(store.snapshot().data.listeningRound.questionSnapshots[q.id].question,q);
    memory.failure(false);acknowledge.click();await tick();
    card=all(host,n=>n.classList.values.has('activity-card'))[0];
    assert.equal(card.dataset.draftQuestionSnapshot,'saved');
    assert.ok(all(card,n=>n.tagName==='INPUT').every(n=>!n.disabled));
    const radio=all(card,n=>n.tagName==='INPUT'&&n.value==='1')[0];radio.onchange();
    const submit=all(card,n=>n.tagName==='BUTTON'&&n.textContent.includes('提交本题'))[0];
    submit.click();await tick();
    assert.deepEqual(store.snapshot().data.listeningRound.submitted[q.id].questions,[q]);
    assert.equal(store.snapshot().data.listeningRound.submitted[q.id].correct,1);
    assert.equal(store.snapshot().data.listening[q.id+':individual'].submissions,1);
    cleanup();assert.equal(host.children.length,0);
  });
  await asynchronous(`HSK${level} inactive listening legacy answer remains editable and sealed saved snapshot stays read-only`,async()=>{
    const config=configs[level],q=question(level),initial=blank(config);
    initial.listeningRound={selected:[1],limit:5,wrongOnly:false,queue:[q.id],index:0,answers:{[q.id]:99},submitted:{},playCounts:{},startedAt:1000};
    const memory=storageFor(config,initial),store=createLearningStore(config,memory,async task=>task()),host=new Element('main');
    let cleanup=mountListening(host,[{number:1,listening:[q],texts:[]}],{state:()=>store.snapshot().data,edit:fn=>store.edit(fn),flush:async()=>true,
      commit:async()=>false,play:async()=>true,stop(){},message(){}});
    let card=all(host,n=>n.classList.values.has('activity-card'))[0];
    assert.equal(card.dataset.draftQuestionSnapshot,'current');assert.ok(all(card,n=>n.tagName==='INPUT').every(n=>!n.disabled));
    cleanup();const prior=clone(q);prior.prompt.zh='合成旧版封闭中文题';
    store.edit(s=>s.listeningRound=captureListeningDraftAnswer(s.listeningRound,prior,0));
    const before=JSON.stringify(store.snapshot().data);
    cleanup=mountListening(host,[{number:1,listening:[q],texts:[]}],{requireLegacyReview:true,state:()=>store.snapshot().data,edit:fn=>store.edit(fn),flush:async()=>true,
      commit:async()=>false,play:async()=>true,stop(){},message(){}});
    card=all(host,n=>n.classList.values.has('activity-card'))[0];
    assert.equal(card.dataset.draftQuestionSnapshot,'incompatible');assert.ok(card.textContent.includes(prior.prompt.zh));
    assert.ok(all(card,n=>n.tagName==='INPUT').every(n=>n.disabled));
    assert.equal(all(card,n=>n.tagName==='BUTTON'&&n.textContent.includes('提交本题'))[0].disabled,true);
    assert.equal(JSON.stringify(store.snapshot().data),before);cleanup();
  });
  await asynchronous(`HSK${level} VI-only draft is accepted but substitutions of every other authority field commit no bytes`,async()=>{
    const config=configs[level],q={...question(level),part:'vocabGrammar'},key=config.id+':l01:vocabGrammar';
    q.explanation={zh:'合成解析',vi:'SYNTHETIC EXPLANATION'};
    const initial=blank(config),draft=captureDraftAnswer(undefined,[q],q.id,1,1000,true);initial.drafts[key]=draft;
    const memory=storageFor(config,initial),store=createLearningStore(config,memory,async task=>task()),raw=memory.raw();
    const viOnly=clone(q);viOnly.prompt.vi='SYNTHETIC NEW';viOnly.explanation.vi='SYNTHETIC NEW EXPLANATION';
    assert.equal(resolveDraftQuestions([viOnly],draft,true).status,'saved');
    for(const change of [p=>p.stem='different',p=>p.focus='different',p=>p.audioTrack='different',p=>p.options[0]='different',
      p=>p.source.section='different',p=>p.prompt.en='unknown-added-leaf',p=>p.explanation.zh='不同解析']) {
      const substituted=clone(q);change(substituted);
      assert.equal(resolveDraftQuestions([substituted],draft,true).status,'incompatible');
      assert.equal(await commitCourseAttempt(store,key,grade([substituted],{[q.id]:1},2000),'homework',new AbortController().signal),false);
      assert.equal(memory.raw(),raw);assert.equal(memory.writes(),0);
    }
  });
}
const out=new URL('./independent-boundary-results.json',import.meta.url);
fs.writeFileSync(out,JSON.stringify({schemaVersion:1,status:'passed-bounded-independent-behavior-probes',reviewer:'/root/continue_inventory',
  generatedAt:new Date().toISOString(),actualNativeBrowser:false,checks,
  runnerSHA256:crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'),
  limits:'Actual state/attempt/listening renderer modules were executed in a deterministic minimal DOM and in-memory storage. Full main.ts wiring, native event/CSS behavior, true browser storage, active published registry and device tests are not certified by this harness.'},null,2)+'\n');
console.log(JSON.stringify({passed:checks.length,actualNativeBrowser:false}));
