import type {Copy,Lesson} from './types.ts';
import {viSHA256} from './official-vi-revisions.ts';

export const teachingClarificationEntriesSHA256='321873b4f7a33784713026acb70fb3013e588051b1caef5c7fa1bfe05126b46c';
interface Clarification {id:string;kind:'grammar'|'homework';courseId:string;lesson:number;sourceFile:string;sourceSHA256:string;field:'explanation'|'prompt';expectedValue:Copy;newValue:Copy;originalOptions:string[]|null;originalAnswer:number|null}
export interface ReviewedTeachingClarifications {readonly entries:readonly Clarification[]}
export async function validateTeachingClarifications(text:string):Promise<ReviewedTeachingClarifications>{
 const m=JSON.parse(text);
 if(m.schemaVersion!==1||m.status!=='accepted'||m.independentReviewer!=='/root'||!Array.isArray(m.entries)||m.entries.length!==7||await viSHA256(JSON.stringify(m.entries))!==teachingClarificationEntriesSHA256)throw Error('教学说明审查不匹配 · Bản kiểm duyệt nội dung không khớp');
 return {entries:structuredClone(m.entries)};
}
/** Source JSON, grading indices and stored historical receipts remain the source of truth. */
export function applyTeachingClarifications(lesson:Lesson,sourceFile:string,sourceSHA256:string,overlay:ReviewedTeachingClarifications):Lesson{
 const result=structuredClone(lesson);
 for(const e of overlay.entries.filter(e=>e.courseId===lesson.courseId&&e.lesson===lesson.number)){
  if(e.sourceFile!==sourceFile||e.sourceSHA256!==sourceSHA256)throw Error('Teaching clarification source changed');
  if(e.kind==='grammar'){
   const g=result.grammar.find(g=>g.id===e.id);
   if(!g||e.field!=='explanation'||JSON.stringify(g.explanation)!==JSON.stringify(e.expectedValue))throw Error('Grammar clarification baseline changed');
   g.explanation=structuredClone(e.newValue);
  }else{
   const q=result.homework.find(q=>q.id===e.id);
   if(!q||e.field!=='prompt'||JSON.stringify(q.prompt)!==JSON.stringify(e.expectedValue)||JSON.stringify(q.options??null)!==JSON.stringify(e.originalOptions)||JSON.stringify(q.answer??null)!==JSON.stringify(e.originalAnswer))throw Error('Question clarification baseline changed');
   q.prompt=structuredClone(e.newValue);
  }
 }
 return result;
}
