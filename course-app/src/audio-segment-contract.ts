import type {Track} from './types.ts';
export interface Verification {status:string;method:string;contentMatch?:string;observedTranscript?:string;humanListening:boolean;devicePlaybackCertified?:boolean;pronunciationToneCertified?:boolean}
export interface VerifiedSegment {track:string;sourceHash?:string;start:number;end:number;sourceText:string;sourcePinyin?:string;unit?:string;repetition?:number;verification:Verification;subsegments?:string[];parentLineId?:string}
export interface UnresolvedSegment {id:string;kind:string;track:string;sourceHash?:string;sourceText:string;sourcePinyin?:string;status:string;fallback:string}
export interface SegmentData {humanListening?:boolean;devicePlaybackCertified?:boolean;pronunciationToneCertified?:boolean;schemaVersion:number;scope?:{levels:number[];lessons:number[]};tracks:Record<string,{sourceHash:string;duration:number;containerDuration?:number}>;words:Record<string,VerifiedSegment>;lines:Record<string,VerifiedSegment>;subsegments:Record<string,VerifiedSegment>;unresolved:UnresolvedSegment[]}
interface SourceBinding {level:number;lesson:number;track:string;sourceText:string;sourcePinyin:string;sentences?:{id:string;sourceText:string;sourcePinyin:string}[]}
interface RangeBinding {kind:string;track:string;start:number;end:number;unit?:string;repetition:number|null;parentLineId:string|null;method:string;contentMatch?:string;observedTranscript:string|null}
export interface SegmentAuthority {schemaVersion:number;tracks:Record<string,{sourceHash:string;decodedDuration:number;containerDuration:number}>;lessons:Record<string,{level:number;number:number;courseId:string}>;words:Record<string,SourceBinding>;lines:Record<string,SourceBinding>;ranges:Record<string,RangeBinding>}
function fail(message:string):never{throw Error('Invalid original-audio manifest: '+message)}
const sameSet=(actual:string[],expected:string[])=>actual.length===expected.length&&new Set(actual).size===actual.length&&actual.every(x=>expected.includes(x));
export function validateSegments(value:SegmentData,tracks:readonly Track[],authority:SegmentAuthority):SegmentData {
 if(!value||value.schemaVersion!==1||!value.tracks||!value.words||!value.lines||!value.subsegments||!Array.isArray(value.unresolved)||authority?.schemaVersion!==1)fail('shape or source/range authority missing');
 for(const key of ['humanListening','devicePlaybackCertified','pronunciationToneCertified'] as const)if(key in value&&value[key]!==false)fail('unsupported root certification '+key);
 const scope=value.scope;if(!scope||!Array.isArray(scope.levels)||!scope.levels.length||!scope.levels.every(n=>n===2||n===3)||new Set(scope.levels).size!==scope.levels.length||!Array.isArray(scope.lessons)||!scope.lessons.length||!scope.lessons.every(n=>Number.isInteger(n)&&n>0)||new Set(scope.lessons).size!==scope.lessons.length)fail('scope');
 const inScope=(s:{level:number;lesson:number})=>scope.levels.includes(s.level)&&scope.lessons.includes(s.lesson);
 for(const level of scope.levels)for(const n of scope.lessons){const id=`hsk${level}-fltrp-2026:l${String(n).padStart(2,'0')}`;if(!authority.lessons[id]||authority.lessons[id].level!==level||authority.lessons[id].number!==n)fail('unreviewed lesson scope '+id)}
 const sources=new Map(tracks.map(t=>[t.file,t]));if(!sameSet(Object.keys(value.tracks),tracks.filter(inScope).map(t=>t.file)))fail('missing or extra source tracks');
 for(const [file,declared]of Object.entries(value.tracks)){const source=sources.get(file);if(!source||!inScope(source)||!authority.tracks?.[file]||declared.duration!==authority.tracks[file].decodedDuration||(declared.containerDuration??declared.duration)!==authority.tracks[file].containerDuration||declared.sourceHash!==authority.tracks[file].sourceHash||source.sha256!==declared.sourceHash||Math.abs(source.duration-(declared.containerDuration??declared.duration))>.06||!Number.isFinite(declared.duration)||declared.duration<=0)fail('source hash/duration '+file)}
 const expectedWords=Object.entries(authority.words).filter(([,s])=>inScope(s)),expectedLines=Object.entries(authority.lines).filter(([,s])=>inScope(s));
 const unresolvedIds=value.unresolved.map(s=>s.id);if(!sameSet([...Object.keys(value.words),...unresolvedIds],expectedWords.map(([id])=>id)))fail('word/unresolved partition');if(!sameSet(Object.keys(value.lines),expectedLines.map(([id])=>id)))fail('source-line coverage');
 const children=new Map<string,{parent:string;source:SourceBinding}>();
 for(const [id,binding]of expectedLines){const parts=binding.sentences??[];if(!parts.length)fail('missing actual sentence definition '+id);if(parts.length>1)for(const p of parts)children.set(p.id,{parent:id,source:{...binding,sourceText:p.sourceText,sourcePinyin:p.sourcePinyin}})}
 if(!sameSet(Object.keys(value.subsegments),[...children.keys()]))fail('missing or orphan actual sentences');
 function sourceCheck(id:string,s:{track:string;sourceHash?:string;sourceText:string;sourcePinyin?:string},binding:SourceBinding|undefined){const track=sources.get(s.track);if(!binding||!track||!inScope(track)||s.track!==binding.track||s.sourceHash!==track.sha256||s.sourceText!==binding.sourceText||s.sourcePinyin!==binding.sourcePinyin)fail('source identity, text, pinyin or track '+id)}
 for(const item of value.unresolved){sourceCheck(item.id,item,authority.words[item.id]);if('start' in item||'end' in item||item.kind!=='word'||item.status!=='pending'||item.fallback!=='whole-source-vocabulary-track-with-explicit-label'||item.id in value.words)fail('unresolved word '+item.id)}
 for(const kind of ['words','lines','subsegments'] as const)for(const [id,s]of Object.entries(value[kind])){
  const binding=kind==='words'?authority.words[id]:kind==='lines'?authority.lines[id]:children.get(id)?.source;sourceCheck(id,s,binding);
  const original=sources.get(s.track)!,approved=authority.ranges[id];if(!approved||approved.kind!==kind||approved.track!==s.track||approved.start!==s.start||approved.end!==s.end||approved.unit!==s.unit||approved.repetition!==(s.repetition??null)||approved.parentLineId!==(s.parentLineId??null)||approved.method!==s.verification?.method||approved.contentMatch!==s.verification?.contentMatch||approved.observedTranscript!==(s.verification?.observedTranscript??null))fail('unreviewed timing/evidence binding '+id);
  if(s.verification.status!=='verified'||s.verification.humanListening!==false||s.verification.devicePlaybackCertified!==false||s.verification.pronunciationToneCertified!==false||!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.start<0||s.end<=s.start||s.end>Math.min(original.duration+.05,value.tracks[s.track]!.duration+.025)||original.kind!==(kind==='words'?'vocab':'text'))fail('range or unsupported certification '+id);
  if(kind==='words'&&(s.unit!=='single-original-pronunciation'||![1,2].includes(s.repetition??0)||s.subsegments||s.parentLineId))fail('single pronunciation '+id);
 }
 for(const [id,binding]of expectedLines){const line=value.lines[id]!,parts=binding.sentences!;if(parts.length===1){if(line.unit!=='sentence'||line.subsegments?.length)fail('single-sentence labeling '+id)}else{if(!['source-paragraph','source-multi-sentence-line','dialogue-turn'].includes(line.unit??'')||!sameSet(line.subsegments??[],parts.map(p=>p.id))||(line.subsegments??[]).some((s,i)=>s!==parts[i]!.id))fail('multi-sentence labeling/order '+id);let previous=line.start;for(const p of parts){const child=value.subsegments[p.id]!;if(child.unit!=='sentence'||child.parentLineId!==id||child.track!==line.track||child.start<previous-.025||child.end>line.end+.025||child.subsegments?.length)fail('child relationship/boundary '+p.id);previous=child.end}}
 }
 for(const file of Object.keys(value.tracks)){const lines=Object.values(value.lines).filter(s=>s.track===file).sort((a,b)=>a.start-b.start);for(let i=1;i<lines.length;i++)if(lines[i]!.start<lines[i-1]!.end-.025)fail('source lines overlap '+file)}
 return structuredClone(value);
}

export function mergeSegmentData(values:readonly SegmentData[]):SegmentData {
 const combined:SegmentData={schemaVersion:1,tracks:{},words:{},lines:{},subsegments:{},unresolved:[]};
 for(const value of values){for(const [file,track]of Object.entries(value.tracks)){if(combined.tracks[file]&&JSON.stringify(combined.tracks[file])!==JSON.stringify(track))fail('conflicting duplicate source track '+file);combined.tracks[file]=track}
  for(const kind of ['words','lines','subsegments'] as const)for(const [id,s]of Object.entries(value[kind])){if(combined.words[id]||combined.lines[id]||combined.subsegments[id]||combined.unresolved.some(s=>s.id===id))fail('duplicate segment across manifests '+id);combined[kind][id]=s}
  for(const item of value.unresolved){if(combined.words[item.id]||combined.lines[item.id]||combined.subsegments[item.id]||combined.unresolved.some(s=>s.id===item.id))fail('duplicate unresolved identity '+item.id);combined.unresolved.push(item)}
 }
 return combined;
}
