import type {AudioRequest} from '../../hsk1-app/src/services/audio/index.ts';
import {canonicalPrecisionTrack,type PrecisionRow} from './precision-contract.ts';
let rows:readonly PrecisionRow[]=[];
let annotations=new Set<string>();
export function registerPrecisionRows(value:readonly PrecisionRow[],nonSpokenIds:readonly string[]=[]):void{rows=value;annotations=new Set(nonSpokenIds);}
export function precisionNonSpokenAnnotation(id:string):boolean{return annotations.has(id);}
export function precisionRequest(row:PrecisionRow,assetBase:string):AudioRequest{
 return {url:new URL(canonicalPrecisionTrack(row.sourceTrack),new URL(assetBase,location.href)).href,start:row.sourceSampleRange16k[0]/16000,end:row.sourceSampleRange16k[1]/16000,sourceKind:'segment',label:`原音 · Âm thanh gốc · ${row.sourceText}`};
}
export function precisionOriginalSegment(kind:'words'|'lines',id:string,assetBase:string):AudioRequest|undefined{
 const row=rows.find(r=>r.level!==1&&r.id===id&&(kind==='words'?r.unit==='word':r.unit!=='word'&&!r.parentLineId));
 return row?precisionRequest(row,assetBase):undefined;
}
export function precisionSentenceSegments(id:string,assetBase:string):{id:string;text:string;sentenceNumber:number;request:AudioRequest}[]{
 return rows.filter(r=>r.level!==1&&r.unit==='sentence'&&r.parentLineId===id).sort((a,b)=>(a.sentenceNumber??1)-(b.sentenceNumber??1)).map(r=>({id:r.id,text:r.sourceText,sentenceNumber:r.sentenceNumber??1,request:precisionRequest(r,assetBase)}));
}
export function precisionSingleSentence(id:string):boolean|undefined{
 const row=rows.find(r=>r.id===id&&r.unit!=='word');return row?row.unit==='sentence':undefined;
}
