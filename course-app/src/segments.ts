import {registerSegments} from './segment-resolver.ts';
import {tracks} from './content.ts';
import authority from '../content/audio-segment-authority.json';
import {validateSegments,mergeSegmentData,type SegmentData,type SegmentAuthority} from './audio-segment-contract.ts';
const modules=import.meta.glob('../content/audio-segments-*.json');let data:SegmentData|undefined;
export async function loadSegments():Promise<void>{if(data)return;const values:SegmentData[]=[];for(const load of Object.values(modules))values.push(validateSegments((await load() as {default:SegmentData}).default,tracks,authority as SegmentAuthority));data=mergeSegmentData(values);registerSegments(data)}
