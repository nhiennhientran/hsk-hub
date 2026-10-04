import type { Copy, Source, SourceActivity, SourceField } from './content.ts';
export const SOURCE_EDITION = 'hsk1-print-2026-01';
export interface ActivityContext { title: Copy; instruction: Copy; prompt: Copy; source: Source; fields: SourceField[]; figure?: string; figureSHA256?:string; pinyin?:string; audio?:SourceActivity['audio']; example?:Copy; kind:string }
export interface SourceSubmission { id: string; at: number; values: Record<string,string> }
export interface SourceRecord { activityId: string; version: string; lesson: number; context: ActivityContext; draft: { values: Record<string,string>; updatedAt: number }; history: SourceSubmission[] }
export interface SourceData { schema: 1; edition: string; records: Record<string,SourceRecord> }
export const blankSourceData = (): SourceData => ({schema:1,edition:SOURCE_EDITION,records:{}});
function fail(): never { throw Error('原版活动记录格式无效 · Bản ghi hoạt động gốc không hợp lệ'); }
const object = (v: unknown): v is Record<string,unknown> => !!v && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const str = (v: unknown,max=10000): v is string => typeof v === 'string' && v.length<=max;
const identifier = (v: unknown): v is string => str(v,180) && /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(v);
const integer = (v: unknown,min=1,max=Number.MAX_SAFE_INTEGER): v is number => Number.isSafeInteger(v) && (v as number)>=min && (v as number)<=max;
function keys(v:Record<string,unknown>,allowed:string[]) {if(Object.keys(v).some(k=>!allowed.includes(k))) fail();}
function copy(v:unknown): asserts v is Copy {if(!object(v)||!str(v.zh)||!v.zh||!str(v.vi)||!v.vi)fail();keys(v,['zh','vi']);}
function source(v:unknown): asserts v is Source {if(!object(v)||!identifier(v.sourceRevision)||!str(v.textbookSHA256,64)||!/^[a-f0-9]{64}$/.test(v.textbookSHA256)||!integer(v.printedPage,1,999)||!integer(v.pdfPage,1,999)||!identifier(v.section)||!integer(v.ordinal,1,999))fail();keys(v,['sourceRevision','textbookSHA256','printedPage','pdfPage','section','ordinal']);}
function context(v:unknown): asserts v is ActivityContext {
  if(!object(v)||!Array.isArray(v.fields)||v.fields.length<1||v.fields.length>100)fail();keys(v,['title','instruction','prompt','source','fields','figure','figureSHA256','pinyin','audio','example','kind']);
  copy(v.title);copy(v.instruction);copy(v.prompt);source(v.source);if(!identifier(v.kind))fail();if(v.figure!==undefined&&!identifier(v.figure))fail();if(v.figureSHA256!==undefined&&(!str(v.figureSHA256,64)||!/^[a-f0-9]{64}$/.test(v.figureSHA256)))fail();if(v.pinyin!==undefined&&!str(v.pinyin))fail();if(v.example!==undefined)copy(v.example);if(v.audio!==undefined){if(!object(v.audio)||!identifier(v.audio.sceneId)||!identifier(v.audio.track)||!integer(v.audio.plays,1,10)||v.audio.verifiedByListening!==false)fail();keys(v.audio,['sceneId','track','plays','verifiedByListening']);}
  const ids=new Set<string>();for(const f of v.fields){if(!object(f)||!identifier(f.id)||ids.has(f.id))fail();keys(f,['id','label','options','input','assessment','answer','answerSource','reference','feedbackNote']);ids.add(f.id);copy(f.label);if(!['text','textarea','select'].includes(String(f.input))||!['answer-key','ungraded'].includes(String(f.assessment)))fail();if(f.reference!==undefined)copy(f.reference);if(f.feedbackNote!==undefined)copy(f.feedbackNote);if(f.assessment==='ungraded'&&(f.answer!==undefined||f.answerSource!==undefined))fail();if(f.assessment==='answer-key'){if(!identifier(f.answer)||!object(f.answerSource)||!str(f.answerSource.sha256,64)||!/^[a-f0-9]{64}$/.test(f.answerSource.sha256)||!integer(f.answerSource.pdfPage,1,999))fail();keys(f.answerSource,['sha256','pdfPage']);}
    if(f.input==='select'&&!Array.isArray(f.options))fail();if(f.options!==undefined){if(!Array.isArray(f.options)||f.options.length>100)fail();const options=new Set();for(const o of f.options){if(!object(o)||!identifier(o.id)||options.has(o.id)||!str(o.zh)||!str(o.vi)||!str(o.py))fail();keys(o,['id','zh','vi','py']);options.add(o.id);}if(f.answer!==undefined&&!options.has(f.answer))fail();}
  }
}
function values(v:unknown,ctx:ActivityContext): asserts v is Record<string,string> {if(!object(v)||Object.entries(v).some(([k,x])=>!ctx.fields.some(f=>f.id===k)||!str(x,5000)))fail();}
/** Historical versions validate structurally, without consulting today's catalogue or answer key. */
export function validateSourceData(input:unknown):SourceData {
  if(!object(input)||input.schema!==1||input.edition!==SOURCE_EDITION||!object(input.records)||Object.keys(input.records).length>5000)fail();keys(input,['schema','edition','records']);
  for(const [key,row] of Object.entries(input.records)){
    if(!object(row)||!identifier(row.activityId)||!identifier(row.version)||key!==row.activityId+'@'+row.version||!integer(row.lesson,1,15)||!object(row.draft)||!integer(row.draft.updatedAt,1,8640000000000000)||!Array.isArray(row.history)||row.history.length>1000)fail();
    keys(row,['activityId','version','lesson','context','draft','history']);keys(row.draft,['values','updatedAt']);context(row.context);values(row.draft.values,row.context);
    const submissions=new Set();for(const entry of row.history){if(!object(entry)||!identifier(entry.id)||submissions.has(entry.id)||!integer(entry.at,1,8640000000000000))fail();keys(entry,['id','at','values']);values(entry.values,row.context);submissions.add(entry.id);}
  }
  return structuredClone(input) as unknown as SourceData;
}
export function snapshotContext(a:SourceActivity):ActivityContext {
  return structuredClone({title:a.title,instruction:a.instruction,prompt:a.prompt,source:a.source,kind:a.kind,fields:a.fields,...(a.figure?{figure:a.figure,figureSHA256:a.figureSHA256}:{}),...(a.pinyin?{pinyin:a.pinyin}:{}),...(a.audio?{audio:a.audio}:{}),...(a.example?{example:a.example}:{})});
}
export function editSourceDraft(data:SourceData,a:SourceActivity,values:Record<string,string>,now:number):void {
  const key=a.id+'@'+a.version,context=snapshotContext(a),old=data.records[key];
  // Reusing a version for a semantic change must not silently rewrite its history.
  if(old&&JSON.stringify(old.context)!==JSON.stringify(context))throw Error('活动版本已改变，请保留旧记录并更新版本 · Hoạt động đã thay đổi; cần một phiên bản mới');
  data.records[key]={activityId:a.id,version:a.version,lesson:a.lesson,context,draft:{values:{...values},updatedAt:now},history:old?.history??[]};
}
