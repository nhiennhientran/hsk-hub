import fs from 'node:fs';
import {createStore,STORAGE_KEY} from '../src/services/storage/index.ts';
import {createCompatibility} from '../src/services/storage/compatibility.ts';
import {getHomework30Bank} from '../src/services/content/homework30.ts';
import {homework30Group,submitHomework30,restartHomework30} from '../src/domain/homework30/engine.ts';
import {createSourceStore,SOURCE_STORAGE_KEY} from '../src/services/source-activities/store.ts';
import {sourceLesson} from '../src/services/source-activities/content.ts';
import {blankSourceData,editSourceDraft} from '../src/services/source-activities/state.ts';
import {createHSK1Pair} from '../src/services/source-activities/paired.ts';
const json=name=>JSON.parse(fs.readFileSync(new URL('../content/'+name,import.meta.url),'utf8'));
export const compatibility=createCompatibility(json('stage2-bank.json'),json('stage3-catalog.json'),json('textbook.json'));
export const stamp=1791093600000;
export function primaryData(label='before'){const d=compatibility.blank(),lesson=getHomework30Bank()[0];d.homework.profile.name=label;for(let n=0;n<2;n++){homework30Group(d.homework30,1,'choice').draft=Object.fromEntries(lesson.choice.map(q=>[q.id,n?0:q.answer]));submitHomework30(d.homework30,lesson,'choice',stamp+n);restartHomework30(d.homework30,1,'choice',stamp+n+1);}homework30Group(d.homework30,1,'choice').draft={[lesson.choice[0].id]:1};d.legacyRaw={ran_hsk1_stage2_v3:' { "keep": "legacy exact bytes" } '};return compatibility.validate(d);}
export function sourceData(label='before'){const d=blankSourceData(),a=sourceLesson.activities.find(a=>a.kind==='pair-work');editSourceDraft(d,a,{response:label},stamp);d.records[a.id+'@'+a.version].history=[{id:'old-1',at:stamp,values:{response:'submitted '+label}}];return d;}
export const envelope=(app,data)=>JSON.stringify({app,schema:1,revision:7,updatedAt:stamp,data,recovery:null});
export function memory(){const values=new Map(),ops=[];return {values,ops,getItem(k){ops.push(['get',k]);return values.get(k)??null;},setItem(k,v){ops.push(['set',k,v]);values.set(k,v);},removeItem(k){ops.push(['remove',k]);values.delete(k);}};}
export function serialLocks(){const tails=new Map(),order=[];return {order,request(name,task){order.push(name);const p=(tails.get(name)??Promise.resolve()).then(task);tails.set(name,p.catch(()=>{}));return p;}};}
export function setup({storage=memory(),absent=false,primaryAbsent=false,lock,isComposing}={}){if(storage.values&&!storage.values.has('seeded')){storage.values.set('seeded','1');if(!primaryAbsent)storage.values.set(STORAGE_KEY,envelope('hsk1-modular',primaryData()));if(!absent)storage.values.set(SOURCE_STORAGE_KEY,envelope('hsk1-textbook-source',sourceData()));storage.values.set('ran_hsk1_stage2_v3',' \n raw legacy ');}const locks=serialLocks();const request=lock??locks.request.bind(locks);const primary=createStore({storage,blank:compatibility.blank,validate:compatibility.validate,now:()=>stamp+10,lock:task=>request('ran-hsk1-modular-write',task)}),source=createSourceStore({storage,now:()=>stamp+10,lock:task=>request('ran-hsk1-textbook-source-write',task)});const pair=createHSK1Pair({primary,source,storage,now:()=>stamp+10,lock:request,isComposing});return {storage,primary,source,pair,locks};}
