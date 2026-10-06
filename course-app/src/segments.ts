import {registerSegments} from './segment-resolver.ts';
import {loadPrecisionSegments} from './precision-loader.ts';
import {tracks} from './content.ts';
import authority from '../content/audio-segment-authority.json';
import reviewedSentenceAuthority from '../content/audio-segment-reviewed-sentences-authority.json';
import {validateSegments,validateReviewedSentenceSubset,mergeSegmentData,type SegmentData,type SegmentAuthority,type ReviewedSentenceSubset,type ReviewedSentenceAuthority} from './audio-segment-contract.ts';
const modules=import.meta.glob('../content/audio-segments-*.json');let data:SegmentData|undefined,loading:Promise<void>|undefined;
export function loadSegments():Promise<void>{
 if(loading)return loading;
 if(data)return loadPrecisionSegments().then(()=>undefined);
 loading=(async()=>{
 const values:SegmentData[]=[],subsets:(()=>Promise<unknown>)[]=[];
 for(const [file,load]of Object.entries(modules)){if(file==='../content/audio-segments-hsk2-reviewed-sentences.json')subsets.push(load);else values.push(validateSegments((await load() as {default:SegmentData}).default,tracks,authority as SegmentAuthority))}
 data=mergeSegmentData(values);registerSegments(data);
 for(const load of subsets){try{const subset=(await load() as {default:ReviewedSentenceSubset}).default,reviewed=await validateReviewedSentenceSubset(subset,tracks,reviewedSentenceAuthority as unknown as ReviewedSentenceAuthority);data=mergeSegmentData([data,reviewed]);registerSegments(data)}catch{console.warn('Reviewed sentence overlay rejected; previously reviewed segments and original tracks remain available.')}}
 await loadPrecisionSegments();
 })().finally(()=>{loading=undefined});
 return loading;
}
