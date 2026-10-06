export interface PrecisionTarget {
 id:string;level:1|2|3;lesson:number;unit:'word'|'line'|'sentence';sourceText:string;
 sourceLessonFile:string;sourceLessonSHA256:string;parentLineId?:string|null;sentenceNumber?:number;
}
export interface PrecisionRow extends PrecisionTarget {
 sourceTrack:string;sourceSHA256:string;sourcePCM_SHA256:string;sourceSampleRange16k:[number,number];
 cropPCM_SHA256:string;clipUnit:string;readingCount:number;reviewDecisionId:string;
 sourceJSONPointer?:string|null;
 recordingNote?:{zh:string;vi:string}|null;
}
export interface PrecisionManifest {schemaVersion:1;status:'accepted';sampleRate:16000;records:PrecisionRow[];}
export interface PrecisionAuthority {
 schemaVersion:1;status:'accepted';manifestSHA256:string;targetCatalogSHA256:string;independentReportSHA256:string;
 acceptedSourceFrameGates:PrecisionRow[];
 nonSpokenAnnotations:{id:string;sourceLessonSHA256:string;reason:string;reviewDecisionId:string}[];
 certifications:{humanListening:boolean;pronunciationToneCertified:boolean;devicePlaybackCertified:boolean};
}
export interface PrecisionSource {file:string;sha256:string;duration:number;}
export const nonSpokenStageDirection={id:'hsk3-fltrp-2026:l10:text3:line5',sourceText:'（李老师给学生讲题。）',sourceLessonFile:'course-app/content/hsk3/lesson-10.json'} as const;
const alternativePronunciationWords=new Map([
 ['v-l03-lex-f0ef38a883-s1','谁'],['v-l07-lex-c5a8f40bc0-s1','里'],
 ['v-l09-lex-586e4f0ccf-s1','边'],['v-l09-lex-b967ce841a-s1','上']
]);
export function canonicalPrecisionTrack(path:string):string{
 if(/^course-app\/public\/course-assets\/(?:hsk[23]\/)?audio\/\d+-[1-8]\.mp3$/.test(path))path=path.slice('course-app/public/'.length);
 if(/^new-hsk1\/hsk1\/audio\/\d+-[1-7]\.mp3$/.test(path))path=path.replace('new-hsk1/hsk1/audio/','course-assets/audio/');
 return path;
}
const sha=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const object=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function fail(message:string):never{throw Error('Rejected precision-audio gate: '+message);}
export function canonicalPrecisionJSON(value:unknown):string{
 if(Array.isArray(value))return '['+value.map(canonicalPrecisionJSON).join(',')+']';
 if(object(value))return '{'+Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>JSON.stringify(k)+':'+canonicalPrecisionJSON(v)).join(',')+'}';
 return JSON.stringify(value)??'';
}
export async function precisionSHA256(text:string):Promise<string>{
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');
}
const binding=(r:PrecisionRow)=>({id:r.id,level:r.level,lesson:r.lesson,unit:r.unit,sourceText:r.sourceText,sourceLessonFile:r.sourceLessonFile,sourceLessonSHA256:r.sourceLessonSHA256,parentLineId:r.parentLineId??null,sentenceNumber:r.sentenceNumber??null,sourceTrack:r.sourceTrack,sourceSHA256:r.sourceSHA256,sourcePCM_SHA256:r.sourcePCM_SHA256,sourceSampleRange16k:r.sourceSampleRange16k,cropPCM_SHA256:r.cropPCM_SHA256,clipUnit:r.clipUnit,readingCount:r.readingCount,reviewDecisionId:r.reviewDecisionId,sourceJSONPointer:r.sourceJSONPointer??null,recordingNote:r.recordingNote??null});
/** Exact approved frame set plus an independently source-derived target set.
 * Runtime checks do not claim to listen to, or certify tones of, the audio. */
export async function validatePrecisionManifest(args:{manifestText:string;targetCatalogText:string;authority:PrecisionAuthority;authoritySHA256:string;sources:readonly PrecisionSource[]}):Promise<readonly PrecisionRow[]>{
 const {manifestText,targetCatalogText,authority,authoritySHA256,sources}=args;
 if(!sha(authoritySHA256)||await precisionSHA256(canonicalPrecisionJSON(authority))!==authoritySHA256)fail('independent authority checksum');
 if(authority?.schemaVersion!==1||authority.status!=='accepted'||!sha(authority.manifestSHA256)||!sha(authority.targetCatalogSHA256)||!sha(authority.independentReportSHA256)||!Array.isArray(authority.acceptedSourceFrameGates)||!Array.isArray(authority.nonSpokenAnnotations))fail('authority shape');
 if(await precisionSHA256(manifestText)!==authority.manifestSHA256||await precisionSHA256(targetCatalogText)!==authority.targetCatalogSHA256)fail('registered content checksum');
 if(!object(authority.certifications)||['humanListening','pronunciationToneCertified','devicePlaybackCertified'].some(k=>authority.certifications[k as keyof typeof authority.certifications]!==false))fail('unperformed certification flags');
 const manifest:unknown=JSON.parse(manifestText),catalog:unknown=JSON.parse(targetCatalogText);
 if(!object(manifest)||manifest.schemaVersion!==1||manifest.status!=='accepted'||manifest.sampleRate!==16000||!Array.isArray(manifest.records)||!object(catalog)||catalog.schemaVersion!==1||!Array.isArray(catalog.targets))fail('manifest or catalog shape');
 const targets=new Map<string,PrecisionTarget>();
 for(const item of catalog.targets){
  if(!object(item)||typeof item.id!=='string'||targets.has(item.id)||typeof item.level!=='number'||![1,2,3].includes(item.level)||!Number.isInteger(item.lesson)||Number(item.lesson)<1||Number(item.lesson)>(item.level===3?18:15)||!['word','line','sentence'].includes(String(item.unit))||typeof item.sourceText!=='string'||!item.sourceText.trim()||typeof item.sourceLessonFile!=='string'||!sha(item.sourceLessonSHA256))fail('target identity');
  targets.set(item.id,item as unknown as PrecisionTarget);
 }
 const approved=new Map<string,PrecisionRow>(),annotations=new Set<string>(),sourceMap=new Map(sources.map(s=>[canonicalPrecisionTrack(s.file),s]));
 for(const row of authority.acceptedSourceFrameGates){if(!row||approved.has(row.id))fail('duplicate accepted decision');approved.set(row.id,row);}
 for(const item of authority.nonSpokenAnnotations){
  const target=targets.get(item.id);
  if(!target||target.unit==='word'||target.id!==nonSpokenStageDirection.id||target.sourceText!==nonSpokenStageDirection.sourceText||target.sourceLessonFile!==nonSpokenStageDirection.sourceLessonFile||target.level!==3||target.lesson!==10||annotations.has(item.id)||approved.has(item.id)||target.sourceLessonSHA256!==item.sourceLessonSHA256||!item.reason?.trim()||!item.reviewDecisionId?.trim())fail('annotation exclusion');
  annotations.add(item.id);
 }
 if(approved.size+annotations.size!==targets.size||[...targets.keys()].some(id=>!approved.has(id)&&!annotations.has(id)))fail('complete target partition');
 const seen=new Set<string>(),records:PrecisionRow[]=[];
 for(const item of manifest.records){
  if(!object(item)||typeof item.id!=='string'||seen.has(item.id))fail('duplicate or malformed runtime row');
  const r=item as unknown as PrecisionRow,target=targets.get(r.id),gate=approved.get(r.id),source=sourceMap.get(canonicalPrecisionTrack(r.sourceTrack));
  if(!target||!gate||annotations.has(r.id)||canonicalPrecisionJSON(binding(r))!==canonicalPrecisionJSON(binding(gate)))fail('unaccepted frame or source binding '+r.id);
  if(r.recordingNote!==undefined&&r.recordingNote!==null&&(!object(r.recordingNote)||Object.keys(r.recordingNote).sort().join(',')!=='vi,zh'||['zh','vi'].some(k=>typeof r.recordingNote![k as 'zh'|'vi']!=='string'||!r.recordingNote![k as 'zh'|'vi'].trim())))fail('recording note shape '+r.id);
  if(r.level!==target.level||r.lesson!==target.lesson||r.unit!==target.unit||r.sourceText!==target.sourceText||r.sourceLessonFile!==target.sourceLessonFile||r.sourceLessonSHA256!==target.sourceLessonSHA256||(r.parentLineId??null)!==(target.parentLineId??null)||(r.sentenceNumber??null)!==(target.sentenceNumber??null))fail('source target differs '+r.id);
  if(!source||source.sha256!==r.sourceSHA256||!sha(r.sourcePCM_SHA256)||!sha(r.cropPCM_SHA256)||typeof r.reviewDecisionId!=='string'||!r.reviewDecisionId.trim()||!Array.isArray(r.sourceSampleRange16k)||r.sourceSampleRange16k.length!==2)fail('original source identity '+r.id);
  const [start,end]=r.sourceSampleRange16k;
  if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||end/16000>source.duration+.05)fail('source sample range '+r.id);
  if(r.unit==='word'&&!((r.clipUnit==='single-original-pronunciation'&&r.readingCount===1)||(r.clipUnit==='alternative-original-pronunciations'&&r.readingCount===2&&r.level===1&&alternativePronunciationWords.get(r.id)===r.sourceText)))fail('word pronunciation unit '+r.id);
  if(r.unit!=='word'&&(!['single-original-sentence','original-source-line'].includes(r.clipUnit)||r.readingCount!==1))fail('sentence unit '+r.id);
  seen.add(r.id);records.push(r);
 }
 if(seen.size!==approved.size||[...approved.keys()].some(id=>!seen.has(id)))fail('runtime accepted set differs');
 return records;
}
