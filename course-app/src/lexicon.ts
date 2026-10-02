import type {Lesson,Word,Source,CourseId} from './types.ts';
export interface WordSense {id:string;zh:string;py:string;vi:string;pos:string;sources:{wordId:string;lessonId:string;lesson:number;sourceText:number;audioTrack:string;source:Source}[]}
export interface Lexicon {schemaVersion:1;courseId:CourseId;version:'2026.1';senses:WordSense[]}
export function senseMap(catalogue:Lexicon):Map<string,WordSense>{
 const map=new Map<string,WordSense>();
 for(const sense of catalogue.senses)for(const source of sense.sources){if(map.has(source.wordId))throw Error('Repeated source vocabulary identity');map.set(source.wordId,sense)}
 return map;
}
/** Keep lesson-local IDs for saved queues; canonical senses decide duplicates explicitly. */
export function canonicalWordPool(lessons:readonly Lesson[],selected:ReadonlySet<number>,catalogue:Lexicon):Word[]{
 const map=senseMap(catalogue),seen=new Set<string>(),result:Word[]=[];
 for(const lesson of lessons.filter(l=>selected.has(l.number))){
  if(lesson.courseId!==catalogue.courseId||lesson.version!==catalogue.version)throw Error('Lexicon/course identity mismatch');
  for(const word of lesson.vocabulary){const sense=map.get(word.id);if(!sense)throw Error('Missing canonical vocabulary identity');
   if(!seen.has(sense.id)){seen.add(sense.id);result.push(word)}
  }
 }
 return result;
}
