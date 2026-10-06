import type {Lesson} from './types.ts';
import {viSHA256} from './official-vi-revisions.ts';

export const translationChoiceEntriesSHA256='2abcb25eb30881b9d8631e7a9b36c541aa5ea6c938c640163d4ac7231baa1231';
interface Distractor {id:string;level:2|3;lesson:number;part:'translationChoice';originalOptions:string[];originalAnswer:number;distractor:string}
export interface ReviewedDistractors {readonly entries:readonly Distractor[]}
const object=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
/** Only the independently reviewed exact 165-entry vector is admissible. */
export async function validateTranslationChoiceOverlay(manifestText:string,reviewText:string):Promise<ReviewedDistractors>{
  const manifest:unknown=JSON.parse(manifestText),review:unknown=JSON.parse(reviewText);
  if(!object(manifest)||manifest.schemaVersion!==1||manifest.independentReviewStatus!=='accepted'||manifest.independentReviewer===manifest.author||
    !Array.isArray(manifest.entries)||manifest.entries.length!==165||!object(review)||review.status!=='accepted'||review.reviewer!==manifest.independentReviewer||
    review.canonicalEntriesSHA256!==translationChoiceEntriesSHA256||await viSHA256(JSON.stringify(manifest.entries))!==translationChoiceEntriesSHA256||
    await viSHA256(reviewText)!==manifest.independentReviewSHA256||!Array.isArray(review.acceptedIds)||review.acceptedIds.length!==165)throw Error('四选项独立审查不匹配 · Bản kiểm duyệt bốn lựa chọn không khớp');
  const entries=manifest.entries as unknown[];
  const ids=new Set<string>();
  for(const value of entries){
    if(!object(value)||typeof value.id!=='string'||![2,3].includes(Number(value.level))||!Number.isInteger(value.lesson)||
      value.part!=='translationChoice'||!Array.isArray(value.originalOptions)||value.originalOptions.length!==3||!value.originalOptions.every(x=>typeof x==='string')||
      !Number.isInteger(value.originalAnswer)||Number(value.originalAnswer)<0||Number(value.originalAnswer)>2||typeof value.distractor!=='string'||!value.distractor.trim()||
      value.originalOptions.includes(value.distractor)||!review.acceptedIds.includes(value.id)||ids.has(value.id))throw Error('四选项清单无效 · Danh sách bốn lựa chọn không hợp lệ');
    ids.add(value.id);
  }
  return {entries:structuredClone(entries) as Distractor[]};
}
/** The official VI projection runs first. A/B/C and their grading indices remain exact. */
export function appendReviewedTranslationChoices(lesson:Lesson,overlay:ReviewedDistractors):Lesson{
  const result=structuredClone(lesson),entries=overlay.entries.filter(e=>lesson.courseId===`hsk${e.level}-fltrp-2026`&&e.lesson===lesson.number);
  if(entries.length!==5)throw Error('本课四选项不完整 · Bốn lựa chọn của bài chưa đầy đủ');
  const questions=result.homework.filter(q=>q.part==='translationChoice');
  if(questions.length!==5)throw Error('Translation choice group mismatch');
  for(const q of questions){
    const entry=entries.find(e=>e.id===q.id);
    if(!entry||JSON.stringify(q.options)!==JSON.stringify(entry.originalOptions)||q.answer!==entry.originalAnswer)throw Error('原题选项或答案不匹配 · Lựa chọn hoặc đáp án gốc không khớp');
    q.options=[...entry.originalOptions,entry.distractor];
  }
  return result;
}
