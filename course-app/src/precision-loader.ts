import {registerReviewedTextbookAudio} from '../../hsk1-app/src/services/content/reviewed-audio.ts';
import type {OriginalTrack,TextbookAudio} from '../../hsk1-app/src/services/content/textbook.ts';
import media from '../../hsk1-app/content/media-references.json' with {type:'json'};
import {registerPrecisionRows,precisionRequest,precisionRecordingNotes} from './precision-resolver.ts';
import {tracks} from './content.ts';
import {canonicalPrecisionJSON,canonicalPrecisionTrack,precisionSHA256,validatePrecisionManifest,type PrecisionAuthority,type PrecisionRow,type PrecisionSource} from './precision-contract.ts';

const assets=import.meta.glob('../content/audio-precision*-20261006.json',{query:'?raw',import:'default'});
// Set only after the independent final source/frame report is complete.
export const precisionAuthoritySHA256='f8e842066c20d0fff5fe2e81e9fc2bb4696e1c70d83c429bb61a3a9d6dfdb639';
const h1Sources=media.originalTracks.map(t=>({file:t.path,sha256:t.sha256,duration:t.duration_s}));
export const precisionSources:readonly PrecisionSource[]=[...tracks.map(t=>({file:t.file,sha256:t.sha256,duration:t.duration})),...h1Sources];
let rows:readonly PrecisionRow[]=[];
let loading:Promise<boolean>|undefined;
const base=()=>document.querySelector<HTMLMetaElement>('meta[name="asset-base"]')?.content??'./';
function textbookAudio(row:PrecisionRow):TextbookAudio{
 const h1=media.originalTracks.find(t=>canonicalPrecisionTrack(t.path)===canonicalPrecisionTrack(row.sourceTrack)),other=tracks.find(t=>t.file===canonicalPrecisionTrack(row.sourceTrack));
 if(!h1&&!other)throw Error('Accepted precision source is missing');
 const track:OriginalTrack=h1 as OriginalTrack??{id:other!.id,lesson:other!.lesson,track:other!.track,kind:other!.kind==='text'?'text':'vocab',scene:null,file:other!.file,path:other!.file,duration_s:other!.duration,bytes:other!.bytes,sha256:other!.sha256,fingerprint:other!.sha256};
 return {available:true,track,request:precisionRequest(row,base())};
}
/** One in-flight gate prevents concurrent route renders from reading half a set.
 * A rejected optional overlay leaves the previously reviewed audio available. */
export function loadPrecisionSegments():Promise<boolean>{
 if(loading)return loading;
 if(rows.length)return Promise.resolve(true);
 loading=(async()=>{
  if(!precisionAuthoritySHA256)return false;
  const load=(name:string)=>{const fn=assets[`../content/${name}`];if(!fn)throw Error('Registered precision asset missing');return fn();};
  const [manifestText,targetCatalogText,authorityText]=await Promise.all([load('audio-precision-20261006.json'),load('audio-precision-targets-20261006.json'),load('audio-precision-authority-20261006.json')]);
  if([manifestText,targetCatalogText,authorityText].some(v=>typeof v!=='string'))throw Error('Registered precision asset is not raw JSON');
  const authority=JSON.parse(authorityText as string) as PrecisionAuthority;
  if(await precisionSHA256(canonicalPrecisionJSON(authority))!==precisionAuthoritySHA256)throw Error('Independent precision authority changed');
  const accepted=await validatePrecisionManifest({manifestText:manifestText as string,targetCatalogText:targetCatalogText as string,authority,authoritySHA256:precisionAuthoritySHA256,sources:precisionSources});
  rows=accepted;registerPrecisionRows(accepted,authority.nonSpokenAnnotations.map(r=>r.id));
  registerReviewedTextbookAudio({
   recordingNotes:precisionRecordingNotes,
   word(id){const row=rows.find(r=>r.level===1&&r.unit==='word'&&r.id===id);return row?textbookAudio(row):undefined;},
   line(id){const row=rows.find(r=>r.level===1&&r.unit==='line'&&r.id===id);return row?textbookAudio(row):undefined;},
   sentences(id){return rows.filter(r=>r.level===1&&r.unit==='sentence'&&r.parentLineId===id).sort((a,b)=>(a.sentenceNumber??1)-(b.sentenceNumber??1)).map(r=>({id:r.id,sourceText:r.sourceText,sentenceNumber:r.sentenceNumber??1,audio:textbookAudio(r)}));}
  });
  return true;
 })().catch(()=>{console.warn('Reviewed precision audio could not be verified. Original tracks and previously reviewed segments remain available.');return false;}).finally(()=>{loading=undefined;});
 return loading;
}
