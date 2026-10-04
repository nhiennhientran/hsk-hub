import type {CourseId, Lesson} from './types.ts';
import type {Lexicon} from './lexicon.ts';

export type ViDocumentKind = 'lesson' | 'lexicon' | 'course-index';
export interface ViConsumerRef {baselineFile:string;field:string;ownerId:string;component:string}
export interface ViBinding extends ViConsumerRef {lesson:number;zhContext:string;value:string}
export interface ViDocumentInput {file:string;rawText:string}
export interface TrustedViRevisionInput {
 courseId:CourseId;parentDisplayRevision:string;
 manifestText:string;manifestSHA256:string;
 reviewFile:string;reviewText:string;reviewSHA256:string;
 documents:readonly ViDocumentInput[];
}
export interface ViProjectionContext {baselineFile:string;sourceSHA256:string}
export interface CourseSummary {level:number;id:string;number:number;title:{zh:string;vi:string;py:string};[key:string]:unknown}
export interface ValidatedViRevisionRegistry {
 readonly courseId:CourseId;readonly revisionId:string;readonly manifestSHA256:string;readonly reviewSHA256:string;
 projectLesson(raw:Lesson,context:ViProjectionContext):Lesson;
 projectLexicon(raw:Lexicon,context:ViProjectionContext):Lexicon;
 projectCourseIndex(raw:readonly CourseSummary[],context:ViProjectionContext):CourseSummary[];
}

type Obj=Record<string,unknown>;
const object=(v:unknown):v is Obj=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
function fail(message:string):never {throw Error('Official VI revision rejected: '+message)}
const record=(v:unknown,label:string):Obj=>object(v)?v:fail(label);
const array=(v:unknown,label:string):unknown[]=>Array.isArray(v)?v:fail(label);
const string=(v:unknown,label:string):string=>text(v)?v:fail(label);
const escapePointer=(v:string)=>v.replaceAll('~','~0').replaceAll('/','~1');
const uniqueStrings=(v:unknown,label:string):string[]=>{
 const values=array(v,label).map(x=>string(x,label));
 if(new Set(values).size!==values.length)fail('duplicate '+label);
 return values;
};
const setEqual=(a:readonly string[],b:readonly string[])=>a.length===b.length&&a.every(x=>b.includes(x));
const consumerKey=(r:ViConsumerRef)=>JSON.stringify([r.baselineFile,r.field,r.ownerId,r.component]);
const consumer=(v:unknown):ViConsumerRef=>{const r=record(v,'consumer');return {
 baselineFile:string(r.baselineFile,'consumer baselineFile'),field:string(r.field,'consumer field'),
 ownerId:string(r.ownerId,'consumer ownerId'),component:string(r.component,'consumer component'),
}};
export const baselineViDisplayRevision=(courseId:CourseId)=>courseId+':baseline:2026.1';
export async function viSHA256(textValue:string):Promise<string>{
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(textValue));
 return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
/** Shared proposal algorithm: remove exactly independentReview, recursively sort keys. */
export function viProposalCanonicalJSON(value:unknown):string {
 function sorted(v:unknown):unknown{
  if(v===null||typeof v==='string'||typeof v==='boolean')return v;
  if(typeof v==='number'&&Number.isFinite(v))return v;
  if(Array.isArray(v))return v.map(sorted);
  if(object(v))return Object.fromEntries(Object.keys(v).filter(k=>k!=='independentReview').sort().map(k=>[k,sorted(v[k])]));
  return fail('non-JSON proposal value');
 }
 return JSON.stringify(sorted(value));
}

// Explicit semantic leaves; source/review/answer/ID/media/ASR evidence never enter this registry.
const lessonVI=[
 /^\/title\/vi$/, /^\/objectives\/\d+\/vi$/,
 /^\/warmup\/\d+\/(?:title\/vi|items\/\d+\/vi)$/,
 /^\/texts\/\d+\/(?:title|context)\/vi$/, /^\/texts\/\d+\/lines\/\d+\/vi$/,
 /^\/texts\/\d+\/questions\/\d+\/(?:vi|editorialNote\/vi)$/,
 /^\/vocabulary\/\d+\/vi$/,
 /^\/grammar\/\d+\/(?:title|explanation)\/vi$/, /^\/grammar\/\d+\/(?:examples|practice)\/\d+\/vi$/,
 /^\/sections\/\d+\/title\/vi$/, /^\/sections\/\d+\/blocks\/\d+\/(?:vi|items\/\d+\/vi)$/,
 /^\/grammarSourceExplanations\/\d+\/explanation\/vi$/,
 /^\/grammarPresentations\/\d+\/groups\/\d+\/(?:title|explanation)\/vi$/,
 /^\/activities\/\d+\/(?:title|note|feedbackNote)\/vi$/,
 /^\/activities\/\d+\/fields\/\d+\/(?:prompt|referenceAnswer)\/vi$/,
 /^\/activities\/\d+\/fields\/\d+\/options\/\d+\/vi$/,
 /^\/activities\/\d+\/matrix\/(?:rowHeading\/vi|(?:contextHeaders|columns)\/\d+\/vi)$/,
 /^\/activities\/\d+\/matrix\/rows\/\d+\/(?:prompt\/vi|(?:contextCells|cellLabels)\/\d+\/vi)$/,
 /^\/activities\/\d+\/menu\/sections\/\d+\/(?:heading\/vi|items\/\d+\/text\/vi)$/,
 /^\/illustrationManifest\/\d+\/(?:alt|description|label)\/vi$/,
 /^\/(?:homework|listening)\/\d+\/(?:prompt|explanation)\/vi$/,
];
function documentKind(file:string,courseId:CourseId):ViDocumentKind {
 const level=courseId==='hsk2-fltrp-2026'?2:3;
 if(new RegExp(`^course-app/content/hsk${level}/lesson-\\d{2}\\.json$`).test(file))return 'lesson';
 if(file===`course-app/content/hsk${level}-lexicon.json`)return 'lexicon';
 if(file==='course-app/content/course-index.json')return 'course-index';
 return fail('foreign baseline file '+file);
}
function checkedDocument(value:unknown,file:string,courseId:CourseId):ViDocumentKind {
 const kind=documentKind(file,courseId),level=courseId==='hsk2-fltrp-2026'?2:3,count=level===2?15:18;
 if(kind==='course-index'){
  const entries=array(value,'course index');
  for(const entry of entries){const e=record(entry,'course index entry');if(e.level===level){
   if(!Number.isInteger(e.number)||Number(e.number)<1||Number(e.number)>count||e.id!==`${courseId}:l${String(e.number).padStart(2,'0')}`)fail('course index identity');
  }}
 }else{
  const v=record(value,'document');if(v.courseId!==courseId||v.version!=='2026.1'||v.schemaVersion!==1)fail('course document identity');
  if(kind==='lesson'){
   const n=Number(v.number);if(!Number.isInteger(n)||n<1||n>count||v.id!==`${courseId}:l${String(n).padStart(2,'0')}`||!file.endsWith(`/lesson-${String(n).padStart(2,'0')}.json`))fail('lesson/file identity');
  }
 }
 return kind;
}
/** IDs and original indices are derived from immutable actual JSON, never caller-provided owners. */
export function viBindingsForDocument(value:unknown,file:string,courseId:CourseId):ViBinding[] {
 const kind=checkedDocument(value,file,courseId),result:ViBinding[]=[];
 function walk(v:unknown,path:string,ownerId:string,lesson:number,ownerZh:string){
  if(Array.isArray(v)){v.forEach((item,i)=>walk(item,path+'/'+i,ownerId,lesson,ownerZh));return}
  if(!object(v))return;
  if(text(v.id))ownerId=v.id;
  else if(text(v.grammarId))ownerId=v.grammarId;
  if(typeof v.zh==='string')ownerZh=v.zh;
  if(kind==='course-index'&&typeof v.number==='number')lesson=v.number;
  if(kind==='lexicon'&&Array.isArray(v.sources)&&v.sources.length){const first=record(v.sources[0],'sense source');lesson=Number(first.lesson)}
  for(const [key,item]of Object.entries(v)){
   const field=path+'/'+escapePointer(key);
   const allowed=kind==='lesson'?lessonVI.some(pattern=>pattern.test(field)):
    kind==='lexicon'?/^\/senses\/\d+\/vi$/.test(field):/^\/\d+\/title\/vi$/.test(field);
   if(key==='vi'&&allowed&&typeof item==='string'&&ownerId.startsWith(courseId+':')){
    const zhContext=typeof v.zh==='string'?v.zh:ownerZh;
    if(!text(zhContext))continue; // Blank source headers are not translation targets.
    result.push({baselineFile:file,field,ownerId,component:kind==='lesson'?field.split('/')[1]!:kind,lesson,zhContext,value:item});
   }
   if(item!==null&&typeof item==='object')walk(item,field,ownerId,lesson,ownerZh);
  }
 }
 walk(value,'','',kind==='lesson'?Number(record(value,'lesson').number):0,'');
 return result;
}
function writeLeaf(value:unknown,pointer:string,newValue:string){
 const parts=pointer.slice(1).split('/').map(p=>p.replaceAll('~1','/').replaceAll('~0','~'));
 if(parts.some(p=>['__proto__','constructor','prototype'].includes(p))||parts.at(-1)!=='vi')fail('unsafe VI pointer');
 let parent=value as Obj;for(const part of parts.slice(0,-1))parent=parent[part] as Obj;
 parent[parts.at(-1)!]=newValue;
}

/** Validate every source/proof/consumer/target first; no partial projection escapes on rejection. */
export async function validateTrustedViRegistry(input:TrustedViRevisionInput):Promise<ValidatedViRevisionRegistry> {
 if(!hash(input.manifestSHA256)||!hash(input.reviewSHA256))fail('trusted asset SHA');
 const [manifestSHA,reviewSHA]=await Promise.all([viSHA256(input.manifestText),viSHA256(input.reviewText)]);
 if(manifestSHA!==input.manifestSHA256||reviewSHA!==input.reviewSHA256)fail('trusted asset bytes changed');
 const m=record(JSON.parse(input.manifestText),'manifest'),proof=record(JSON.parse(input.reviewText),'independent proof');
 if(m.schemaVersion!==1||m.engine!=='hsk23'||m.courseId!==input.courseId||m.parentDisplayRevision!==input.parentDisplayRevision)fail('engine/course/parent identity');
 const revisionId=string(m.revisionId,'revisionId'),proposalSHA=await viSHA256(viProposalCanonicalJSON(m));
 const reviewer=string(proof.reviewer,'independent reviewer'),author=string(proof.author,'author');
 if(reviewer===author||proof.status!=='accepted'||proof.proposalSHA256!==proposalSHA)fail('independent proof/author identity');
 const topReview=record(m.independentReview,'manifest independent review');
 if(topReview.status!=='accepted'||topReview.reviewer!==reviewer||topReview.proposalSHA256!==proposalSHA||topReview.evidenceFile!==input.reviewFile||topReview.evidenceSHA256!==reviewSHA)fail('manifest independent proof binding');
 const changes=array(m.changes,'changes');if(!changes.length)fail('empty active revision');
 const changeIds=changes.map(c=>string(record(c,'change').changeId,'changeId'));
 if(new Set(changeIds).size!==changeIds.length||!setEqual(changeIds,uniqueStrings(proof.acceptedChangeIds,'proof accepted IDs'))||!setEqual(changeIds,uniqueStrings(topReview.acceptedChangeIds,'manifest accepted IDs')))fail('accepted ID set');
 const documents=new Map<string,{value:unknown;sha256:string;kind:ViDocumentKind;serialization:string}>();
 const bindings=new Map<string,ViBinding>();
 for(const doc of input.documents){
  if(documents.has(doc.file))fail('duplicate source document');
  const value=JSON.parse(doc.rawText),kind=checkedDocument(value,doc.file,input.courseId),sourceSHA=await viSHA256(doc.rawText);
  documents.set(doc.file,{value,sha256:sourceSHA,kind,serialization:JSON.stringify(value)});
  for(const binding of viBindingsForDocument(value,doc.file,input.courseId)){const key=consumerKey(binding);if(bindings.has(key))fail('ambiguous registered owner');bindings.set(key,binding)}
 }
 const baselines=array(m.baselineFiles,'baselineFiles'),baselineNames=new Set<string>();
 for(const value of baselines){const b=record(value,'baseline'),file=string(b.file,'baseline file');
  if(baselineNames.has(file)||!hash(b.sha256)||documents.get(file)?.sha256!==b.sha256)fail('baseline SHA/file '+file);
  baselineNames.add(file);
 }
 if(!setEqual([...baselineNames],[...documents.keys()]))fail('baseline/document exact set');
 const sources=new Map<string,Obj>();
 for(const value of array(m.sources,'sources')){const source=record(value,'source'),sourceId=string(source.sourceId,'source document ID');
  if(sources.has(sourceId)||!hash(source.pdfSHA256)||!Number.isSafeInteger(source.pdfPageCount)||Number(source.pdfPageCount)<1)fail('official source identity');sources.set(sourceId,source);
 }
 const proofSources=array(proof.sourceEvidenceRefs,'source evidence refs').map(v=>record(v,'source evidence ref'));
 const sourceKeys=proofSources.map(v=>viProposalCanonicalJSON(v));if(new Set(sourceKeys).size!==sourceKeys.length)fail('duplicate proof source reference');
 const proofConsumers=array(proof.acceptedConsumerRefs,'accepted consumers').map(consumer),proofKeys=proofConsumers.map(consumerKey);
 if(new Set(proofKeys).size!==proofKeys.length||proofKeys.some(k=>!bindings.has(k)))fail('foreign/duplicate accepted consumer');
 const edits:{binding:ViBinding;value:string}[]=[],targets=new Set<string>(),declaredConsumerKeys=new Set<string>();
 for(const value of changes){
  const c=record(value,'change'),ref=consumer(c),key=consumerKey(ref),binding=bindings.get(key);
  if(!binding||targets.has(key)||!baselineNames.has(ref.baselineFile)||c.lesson!==binding.lesson)fail('unknown/duplicate owner/lesson target');
  if(c.expectedEffectiveValue!==binding.value||!text(c.newValue)||c.newValue===binding.value)fail('stale expected/no change '+c.changeId);
  if(!['official-wording-variant','meaning-error','official-book-erratum','editorial-no-direct-book-counterpart'].includes(String(c.classification)))fail('unreviewed/match classification');
  const authored=record(c.authorReview,'author review'),reviewed=record(c.independentReview,'change review');
  if(authored.status!=='accepted'||authored.reviewer!==author||reviewed.status!=='accepted'||reviewed.reviewer!==reviewer||reviewed.evidenceRef!==input.reviewFile)fail('per-change independent evidence');
  const anchor=record(c.sourceAnchor,'source anchor');
  if(!text(anchor.sourceId)||anchor.zhContext!==binding.zhContext||!sourceKeys.includes(viProposalCanonicalJSON(anchor)))fail('source occurrence/Chinese/proof anchor');
  if(anchor.kind==='directOfficial'){
   const source=sources.get(string(anchor.documentSourceId,'documentSourceId'));
   if(!source||anchor.pdfSHA256!==source.pdfSHA256||!text(anchor.section)||!text(anchor.officialViText))fail('direct source binding');
   const pdfPages=array(anchor.pdfPages,'PDF pages'),printed=array(anchor.printedPages,'printed pages');
   if(!pdfPages.length||pdfPages.length!==printed.length||pdfPages.some(p=>!Number.isSafeInteger(p)||Number(p)<1||Number(p)>Number(source.pdfPageCount))||printed.some(p=>!Number.isSafeInteger(p)||Number(p)<1))fail('source page bounds');
   if(c.classification==='official-book-erratum'){if(!text(anchor.correctionRationale))fail('erratum rationale')}
   else if(anchor.officialViText!==c.newValue)fail('official source text/newValue');
  }else if(anchor.kind==='terminologyDerived'){
   if(anchor.notVerbatim!==true||!array(anchor.terminologySourceRefs,'terminology references').length)fail('derived source not-verbatim');
   for(const value of array(anchor.terminologySourceRefs,'terminology references')){const r=record(value,'terminology source'),source=sources.get(string(r.documentSourceId,'terminology document'));if(!source||r.pdfSHA256!==source.pdfSHA256||!text(r.sourceId)||!array(r.pdfPages,'terminology pages').length||array(r.pdfPages,'terminology pages').some(p=>!Number.isSafeInteger(p)||Number(p)<1||Number(p)>Number(source.pdfPageCount)))fail('terminology source bounds')}
  }else if(anchor.kind==='editorial'){
   if(anchor.directCounterpart!==false||!text(anchor.rationale)||c.classification!=='editorial-no-direct-book-counterpart'||anchor.pdfSHA256!==undefined||anchor.pdfPages!==undefined||anchor.printedPages!==undefined||anchor.officialViText!==undefined||anchor.officialZhText!==undefined)fail('editorial source branch');
  }else fail('unresolved source');
  const consumers=array(c.consumers,'change consumers').map(consumer),keys=consumers.map(consumerKey);
  if(!keys.includes(key)||new Set(keys).size!==keys.length||keys.some(k=>!bindings.has(k)||!proofKeys.includes(k)))fail('missing/foreign consumer binding');
  keys.forEach(k=>declaredConsumerKeys.add(k));targets.add(key);edits.push({binding,value:c.newValue as string});
 }
 if(!setEqual([...declaredConsumerKeys],proofKeys))fail('consumer exact set');
 if(proofKeys.some(key=>!targets.has(key)))fail('declared consumer has no accepted projection');
 const coverage=record(m.coverage,'coverage'),accepted=uniqueStrings(coverage.acceptedOwnerIds,'accepted owners');
 const pending=uniqueStrings(coverage.pendingOwnerIds,'pending owners'),unresolved=uniqueStrings(coverage.unresolvedOwnerIds,'unresolved owners');
 const knownOwners=new Set([...bindings.values()].map(b=>b.ownerId));
 if(accepted.some(id=>!knownOwners.has(id))||edits.some(e=>!accepted.includes(e.binding.ownerId))||[...pending,...unresolved].some(id=>!id.startsWith(input.courseId+':')||accepted.includes(id))||pending.some(id=>unresolved.includes(id)))fail('coverage owner sets');
 // The full batch passed. Apply only known leaf assignments to private clones.
 const projected=new Map([...documents].map(([file,d])=>[file,structuredClone(d.value)]));
 for(const edit of edits)writeLeaf(projected.get(edit.binding.baselineFile),edit.binding.field,edit.value);
 const optionGroups=new Set(edits.filter(e=>/^\/activities\/\d+\/fields\/\d+\/options\/\d+\/vi$/.test(e.binding.field))
  .map(e=>JSON.stringify([e.binding.baselineFile,e.binding.field.replace(/\/\d+\/vi$/,'')])));
 for(const encoded of optionGroups){
  const [file,pointer]=JSON.parse(encoded) as [string,string];let options=projected.get(file);
  for(const part of pointer.slice(1).split('/'))options=(options as Obj)[part];
  const labels=array(options,'display options').map(v=>string(record(v,'option').vi,'display option VI').normalize('NFC').trim().toLocaleLowerCase('vi').replace(/\s+/gu,' '));
  if(new Set(labels).size!==labels.length)fail('ambiguous translated options');
 }
 function project<T>(raw:T,context:ViProjectionContext,kind:ViDocumentKind):T{
  const doc=documents.get(context.baselineFile);
  if(!doc){if(checkedDocument(raw,context.baselineFile,input.courseId)!==kind||!hash(context.sourceSHA256))fail('unreviewed document identity');return structuredClone(raw)}
  if(doc.kind!==kind||context.sourceSHA256!==doc.sha256||JSON.stringify(raw)!==doc.serialization)fail('projection raw/source identity');
  return structuredClone(projected.get(context.baselineFile)) as T;
 }
 return Object.freeze({courseId:input.courseId,revisionId,manifestSHA256:manifestSHA,reviewSHA256:reviewSHA,
  projectLesson:(raw:Lesson,c:ViProjectionContext)=>project(raw,c,'lesson'),
  projectLexicon:(raw:Lexicon,c:ViProjectionContext)=>project(raw,c,'lexicon'),
  projectCourseIndex:(raw:readonly CourseSummary[],c:ViProjectionContext)=>project(raw,c,'course-index') as CourseSummary[],
 });
}

export function projectLesson(raw:Lesson,context:ViProjectionContext,registry:ValidatedViRevisionRegistry|null):Lesson{return registry?registry.projectLesson(raw,context):structuredClone(raw)}
export function projectLexicon(raw:Lexicon,context:ViProjectionContext,registry:ValidatedViRevisionRegistry|null):Lexicon{return registry?registry.projectLexicon(raw,context):structuredClone(raw)}
export function projectCourseIndex(raw:readonly CourseSummary[],context:ViProjectionContext,registry:ValidatedViRevisionRegistry|null):CourseSummary[]{return registry?registry.projectCourseIndex(raw,context):structuredClone(raw) as CourseSummary[]}
