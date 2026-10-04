import type {Lesson} from './types.ts';
import type {ActivityRecord} from './state.ts';
/** Retain prior record identities without reinterpreting their answers or checked status. */
export function archivedActivities(lesson:Lesson,records:Record<string,ActivityRecord>):{id:string;record:ActivityRecord}[]{
 if(!lesson.activities?.length)return [];
 const mapped=(owner:string)=>lesson.activities!.some(a=>a.targetRef===owner||a.targetRef.startsWith(owner+':')||a.targetRef.startsWith(owner+'/'));
 const active=new Set(lesson.activities.map(a=>a.id));
 // A partially upgraded lesson can still have live fallback controls. They are not archives.
 for(const w of lesson.warmup)if(!mapped(w.id))w.items.forEach((_,i)=>active.add(w.id+':'+i));
 for(const t of lesson.texts)if(!mapped(t.id))t.questions.forEach(q=>active.add(q.id));
 for(const g of lesson.grammar)if(!mapped(g.id))g.practice.forEach((_,i)=>active.add(g.id+':practice'+(i+1)));
 for(const s of lesson.sections)if(!mapped(s.id))s.blocks.forEach((b,i)=>{if(b.kind==='question'||b.kind==='task'||/[□_＿]/.test(b.zh))active.add(s.id+':block'+i);b.items?.forEach((_,j)=>active.add(s.id+':block'+i+':item'+j))});
 return Object.entries(records).filter(([id,record])=>id.startsWith(lesson.id+':')&&!active.has(id)&&Object.keys(record.values).length>0).sort(([a],[b])=>a.localeCompare(b)).map(([id,record])=>({id,record:structuredClone(record)}));
}
/** Identify the corresponding source column without inventing a saved question snapshot. */
export function archivedActivityContext(lesson:Lesson,id:string):{title:{zh:string;vi:string};page?:number}{
 for(const t of lesson.texts){const i=t.questions.findIndex(q=>q.id===id);if(i>=0)return {title:{zh:`课文${t.number} · 原第${i+1}题`,vi:`Bài khóa ${t.number} · Câu cũ ${i+1}`},page:t.questions[i].source.printedPage}}
 for(const w of lesson.warmup){const i=w.items.findIndex((_,i)=>id===w.id+':'+i);if(i>=0)return {title:{zh:`${w.title.zh} · 原第${i+1}项`,vi:`${w.title.vi} · Mục cũ ${i+1}`},page:(w.items[i].source??w.source).printedPage}}
 for(const g of lesson.grammar){const i=g.practice.findIndex((_,i)=>id===g.id+':practice'+(i+1));if(i>=0)return {title:{zh:`${g.title.zh} · 原练习${i+1}`,vi:`${g.title.vi} · Bài tập cũ ${i+1}`},page:g.practice[i].source.printedPage}}
 for(const s of lesson.sections)for(const[i,b]of s.blocks.entries())if(id===s.id+':block'+i||b.items?.some((_,j)=>id===s.id+':block'+i+':item'+j))return {title:{zh:`${s.title.zh} · 原记录项${i+1}`,vi:`${s.title.vi} · Mục bản ghi cũ ${i+1}`},page:b.source.printedPage};
 return {title:{zh:'其他历史练习',vi:'Bài tập trước đây khác'}};
}
