import {readFileSync} from 'node:fs';
import {createCompatibility} from '../../../hsk1-app/src/services/storage/compatibility.ts';
import {getHomework30Bank} from '../../../hsk1-app/src/services/content/homework30.ts';
import {HOMEWORK30_PARTS,homework30Group,submitHomework30} from '../../../hsk1-app/src/domain/homework30/engine.ts';
import legacy from '../../../hsk1-app/src/domain/homework/engine.js';
import {blank,grade,recordAttempt,parts,validateState} from '../../src/state.ts';
import {configs} from '../../src/config.ts';

const read=(file:string)=>JSON.parse(readFileSync(new URL('../../../'+file,import.meta.url),'utf8'));
const time=1791244800000;
/** Existing exhaustive submission suites start with valid completed reading and empty homework. */
export function allReadingCompletedFixture():Record<string,string>{
  const compat=createCompatibility(read('hsk1-app/content/stage2-bank.json'),read('hsk1-app/content/stage3-catalog.json'),read('hsk1-app/content/textbook.json'));
  const data=compat.blank();for(let n=1;n<=15;n++)data.reading.lessons[String(n)]={visited:true,complete:true};
  const envelope=(app:string,data:unknown)=>JSON.stringify({app,schema:1,revision:1,updatedAt:time,data,recovery:null});
  const out:Record<string,string>={ran_hsk1_modular_v1:envelope('hsk1-modular',compat.validate(data))};
  for(const level of [2,3] as const){const c=configs[level],d=blank(c);d.completed=Array.from({length:c.count},(_,i)=>`${c.id}:l${String(i+1).padStart(2,'0')}`);out[c.storageKey]=envelope(c.id,validateState(d,c));}return out;
}
function order(q:any):number[]{
  const target=legacy.normal(q.answers[0]);
  const walk=(used:number[],remaining:string):number[]|null=>{
    if(used.length===q.tokens.length)return remaining?null:used;
    for(let i=0;i<q.tokens.length;i++)if(!used.includes(i)){
      const text=legacy.normal(q.tokens[i]);if(remaining.startsWith(text)){const result=walk([...used,i],remaining.slice(text.length));if(result)return result;}
    }return null;
  };
  const result=walk([],target);if(!result)throw Error('Invalid QA sort fixture '+q.id);return result;
}
/** Isolated, validated historical homework fixtures; never written to a user profile. */
export function allLessonsUnlockedFixture():Record<string,string>{
  const compat=createCompatibility(read('hsk1-app/content/stage2-bank.json'),read('hsk1-app/content/stage3-catalog.json'),read('hsk1-app/content/textbook.json'));
  const data=compat.blank();
  for(const lesson of getHomework30Bank())for(const part of HOMEWORK30_PARTS){
    homework30Group(data.homework30!,lesson.lesson,part).draft=Object.fromEntries(lesson[part].map(q=>[q.id,q.kind==='translation'?'Synthetic QA historical writing':q.kind==='sort'?order(q):q.answer]));
    if(!submitHomework30(data.homework30!,lesson,part,time).ok)throw Error('QA HSK1 fixture did not submit');
  }
  const envelope=(app:string,data:unknown)=>JSON.stringify({app,schema:1,revision:1,updatedAt:time,data,recovery:null});
  const out:Record<string,string>={ran_hsk1_modular_v1:envelope('hsk1-modular',compat.validate(data))};
  for(const level of [2,3] as const){
    const config=configs[level],d=blank(config);
    for(let n=1;n<=config.count;n++){
      const lesson=read(`course-app/content/hsk${level}/lesson-${String(n).padStart(2,'0')}.json`);
      for(const part of parts){const questions=lesson.homework.filter((q:any)=>q.part===part);const answers=Object.fromEntries(questions.map((q:any)=>[q.id,part==='writing'?'Synthetic QA historical writing':structuredClone(q.answer)]));recordAttempt(d,lesson.id+':'+part,grade(questions,answers,time,d.profile));}
    }
    out[config.storageKey]=envelope(config.id,validateState(d,config));
  }
  return out;
}
