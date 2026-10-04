import type {AudioRequest} from '../../hsk1-app/src/services/audio/index.ts';
import type {SegmentData,VerifiedSegment} from './audio-segment-contract.ts';
let data:SegmentData|undefined;
export function registerSegments(value:SegmentData){data=value}
function request(s:VerifiedSegment,assetBase:string):AudioRequest{return {url:new URL(s.track,new URL(assetBase,location.href)).href,start:s.start,end:s.end,sourceKind:'segment',label:`原音 · Âm thanh gốc · ${s.sourceText}`}}
export function originalSegment(kind:'words'|'lines',id:string,assetBase:string):AudioRequest|undefined{const s=data?.[kind][id];return s?request(s,assetBase):undefined}
export function sentenceSegments(id:string,assetBase:string):{id:string;text:string;sentenceNumber:number;request:AudioRequest}[]{const s=data?.lines[id],keys=s?s.subsegments??[]:Object.entries(data?.subsegments??{}).filter(([,p])=>p.parentLineId===id&&p.guardedEvidence).sort(([,a],[,b])=>a.sentenceNumber!-b.sentenceNumber!).map(([key])=>key);return keys.flatMap((key,index)=>{const p=data?.subsegments[key];return p?[{id:key,text:p.sourceText,sentenceNumber:p.sentenceNumber??index+1,request:request(p,assetBase)}]:[]})}
export function isSingleSentence(id:string):boolean{const s=data?.lines[id];return !!s&&s.sourceText.split(/[。！？!?]/).filter(t=>t.trim()).length<=1}
