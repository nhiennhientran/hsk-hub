// Read-only actual-loader probe. Only Vite/JSON import boundaries are adapted;
// the production loadSegments body and real async validator are unchanged.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {stripTypeScriptTypes} from 'node:module';
import {createHash} from 'node:crypto';
import {originalSegment,sentenceSegments} from '../../../src/segment-resolver.ts';
const here=path.dirname(fileURLToPath(import.meta.url)),app=path.resolve(here,'../../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(app,p))),ids=['hsk2-fltrp-2026:l04:text2:line3','hsk2-fltrp-2026:l05:text2:line8:sentence2'];
const optionalLoadFailure=process.argv.includes('--optional-404');
let source=fs.readFileSync(path.join(app,'src/segments.ts'),'utf8');
const productionSHA256=createHash('sha256').update(source).digest('hex');
source=source.replace("from './segment-resolver.ts'","from '"+pathToFileURL(path.join(app,'src/segment-resolver.ts')).href+"'").replace("from './audio-segment-contract.ts'","from '"+pathToFileURL(path.join(app,'src/audio-segment-contract.ts')).href+"'");
source=source.replace("import {tracks} from './content.ts';",'const tracks='+JSON.stringify(read('content/audio-manifest.json').tracks)+';');
source=source.replace("import authority from '../content/audio-segment-authority.json';",'const authority='+JSON.stringify(read('content/audio-segment-authority.json'))+';');
source=source.replace("import reviewedSentenceAuthority from '../content/audio-segment-reviewed-sentences-authority.json';",'const reviewedSentenceAuthority='+JSON.stringify(read('content/audio-segment-reviewed-sentences-authority.json'))+';');
const files=['audio-segments-pilot.json','audio-segments-hsk2-lessons02-03.json','audio-segments-hsk2-reviewed-sentences.json'];
source=source.replace("import.meta.glob('../content/audio-segments-*.json')",'{'+files.map(f=>JSON.stringify('../content/'+f)+(optionalLoadFailure&&f==='audio-segments-hsk2-reviewed-sentences.json'?":async()=>{throw Error('controlled optional overlay chunk 404')}":':async()=>({default:'+JSON.stringify(read('content/'+f))+'})')).join(',')+'}');
const module=await import('data:text/javascript,'+encodeURIComponent(stripTypeScriptTypes(source)));
globalThis.location={href:'https://qa.example.test/'};
if(optionalLoadFailure){
 const first=module.loadSegments(),second=module.loadSegments();const sharedPromise=first===second;await Promise.all([first,second]);await module.loadSegments();
 const result={source:'course-app/src/segments.ts',productionSHA256,method:'actual loader body with only Vite/JSON imports adapted; exactly the new optional loader throws before JSON import completes',sharedPromise,oldWordAvailable:!!originalSegment('words','hsk2-fltrp-2026:l01:word01','./'),newLineUnavailable:!originalSegment('lines',ids[0],'./'),newChildUnavailable:sentenceSegments('hsk2-fltrp-2026:l05:text2:line8','./').length===0,status:'optional import failure keeps old registry and does not promote partial fragments'};
 fs.writeFileSync(path.join(here,'partial-overlay-loader-optional-failure-result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 if(!sharedPromise||!result.oldWordAvailable||!result.newLineUnavailable||!result.newChildUnavailable)process.exitCode=1;
}else{
const realDigest=crypto.subtle.digest.bind(crypto.subtle);let release,notifyStarted;
const barrier=new Promise(r=>release=r),started=new Promise(r=>notifyStarted=r);
const rejectChecksum=process.argv.includes('--checksum-fail');
crypto.subtle.digest=async(...args)=>{notifyStarted();await barrier;const real=await realDigest(...args);return rejectChecksum?new Uint8Array(32).buffer:real};
const first=module.loadSegments();await started;
let secondSettled=false;const second=module.loadSegments().then(()=>{secondSettled=true});
await new Promise(r=>setImmediate(r));
const settledBeforeRelease=secondSettled;
const legacyAvailable=!!originalSegment('words','hsk2-fltrp-2026:l01:word01','./');
const approvedMissingBeforeRelease=[originalSegment('lines',ids[0],'./')===undefined,sentenceSegments('hsk2-fltrp-2026:l05:text2:line8','./').length===0];
release();await Promise.all([first,second]);crypto.subtle.digest=realDigest;
const result={source:'course-app/src/segments.ts',productionSHA256,method:'actual loader body with only Vite glob/JSON imports adapted; actual contract SHA-256 digest temporarily delayed before real crypto call',checksumFailureInjected:rejectChecksum,secondCallResolvedBeforeAsyncGate:settledBeforeRelease,legacyAvailableDuringGate:legacyAvailable,approvedMissingBeforeRelease,approvedLinePresentAfterBothSettle:!!originalSegment('lines',ids[0],'./'),approvedChildOrdinalAfterBothSettle:sentenceSegments('hsk2-fltrp-2026:l05:text2:line8','./').map(v=>v.sentenceNumber),oldWordAvailableAfterBothSettle:!!originalSegment('words','hsk2-fltrp-2026:l01:word01','./'),finding:settledBeforeRelease?'concurrent loadSegments can return legacy-only data before the already-running reviewed gate completes':'concurrent loadSegments waits for the shared reviewed gate'};
fs.writeFileSync(path.join(here,rejectChecksum?'partial-overlay-loader-checksum-failure-result.json':'partial-overlay-loader-concurrency-result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
if(process.argv.includes('--expect-fixed')&&(settledBeforeRelease||!legacyAvailable||!result.oldWordAvailableAfterBothSettle||result.approvedLinePresentAfterBothSettle===rejectChecksum||JSON.stringify(result.approvedChildOrdinalAfterBothSettle)!==JSON.stringify(rejectChecksum?[]:[2])))process.exitCode=1;
}
