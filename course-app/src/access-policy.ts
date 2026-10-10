import type {State,Attempt} from './state.ts';
import type {AppData} from '../../hsk1-app/src/services/storage/compatibility.ts';
import {HOMEWORK30_PARTS} from '../../hsk1-app/src/domain/homework30/engine.ts';
const sharedParts=['vocabGrammar','ordering','listening','translationChoice','writing'] as const;
const sharedCounts={vocabGrammar:10,ordering:5,listening:5,translationChoice:5,writing:5};
function sharedAttempt(a:Attempt|null|undefined,prefix:string,part?:typeof sharedParts[number]):boolean{
  return !!a&&a.version==='2026.1'&&a.total>0&&a.questionIds.length===a.total&&a.questionIds.every(id=>id.startsWith(prefix))&&
    (part===undefined||a.total===sharedCounts[part]&&a.assessment===(part==='writing'?'manual':'automatic'));
}
function id(state:State,lesson:number){return `${state.courseId}:l${String(lesson).padStart(2,'0')}`;}
export function sharedLessonComplete(state:State,lesson:number):boolean{
  const lessonId=id(state,lesson);
  if(state.completed.includes(lessonId))return true;
  return sharedParts.every(part=>{const r=state.homework[lessonId+':'+part];return sharedAttempt(r?.first??r?.latest,lessonId+':',part);});
}
export function sharedLessonHasPriorAccess(state:State,lesson:number):boolean{
  const lessonId=id(state,lesson);
  if(state.completed.includes(lessonId)||(state.reading[lessonId]?.completed.length??0)>0)return true;
  return [...Object.values(state.homework),...Object.values(state.listening)].some(r=>sharedAttempt(r.first??r.latest,lessonId+':'))||
    (state.listeningRound?.queue.some(q=>q.startsWith(lessonId+':'))??false)||(state.mixed?.queue.some(q=>q.startsWith(lessonId+':'))??false);
}
export function sharedLessonAccessible(_state:State,lesson:number,count:number):boolean{
  // Learning history records completion; every valid lesson is available for study.
  return Number.isInteger(lesson)&&lesson>=1&&lesson<=count;
}
function h1Submission(data:AppData,lesson:number,all:boolean):boolean{
  const row=data.homework30?.lessons[String(lesson)];
  const predicate=(part:typeof HOMEWORK30_PARTS[number])=>!!(row?.[part]?.first??row?.[part]?.latest);
  return all?HOMEWORK30_PARTS.every(predicate):HOMEWORK30_PARTS.some(predicate);
}
export function hsk1LessonComplete(data:AppData,lesson:number):boolean{
  if(data.reading.lessons[String(lesson)]?.complete||h1Submission(data,lesson,true))return true;
  const old=data.homework.lessons[String(lesson)];
  return (['choice','sort','translation'] as const).every(part=>!!old?.[part]?.first);
}
export function hsk1LessonHasPriorAccess(data:AppData,lesson:number):boolean{
  if(data.reading.lessons[String(lesson)]?.complete||(data.reading.modules[String(lesson)]?.modules.length??0)>0||h1Submission(data,lesson,false))return true;
  const old=data.homework.lessons[String(lesson)];
  return (['choice','sort','translation','listening'] as const).some(part=>!!old?.[part]?.first)||
    Object.keys(data.practice.listening.records).some(key=>key.startsWith(`l${String(lesson).padStart(2,'0')}-`))||
    (data.mixedVocabulary?.round?.lessons.includes(lesson)??false)||
    (Array.isArray(data.practice.listening.session?.questionIds)&&data.practice.listening.session.questionIds.some(id=>typeof id==='string'&&id.startsWith(`l${String(lesson).padStart(2,'0')}-`)));
}
export function hsk1LessonAccessible(_data:AppData,lesson:number):boolean{
  return Number.isInteger(lesson)&&lesson>=1&&lesson<=15;
}
