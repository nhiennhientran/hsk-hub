import {registerSegments} from './segment-resolver.ts';
import {tracks} from './content.ts';
import {validateSegments,type SegmentData} from './audio-segment-contract.ts';
const modules=import.meta.glob('../content/audio-segments-*.json');let data:SegmentData|undefined;
export async function loadSegments():Promise<void>{if(data)return;const combined:SegmentData={schemaVersion:1,tracks:{},words:{},lines:{},subsegments:{},unresolved:[]};for(const load of Object.values(modules)){const value=validateSegments((await load() as {default:SegmentData}).default,tracks);for(const kind of ['tracks','words','lines','subsegments'] as const)Object.assign(combined[kind],value[kind]);combined.unresolved.push(...value.unresolved)}data=combined;registerSegments(combined)}
