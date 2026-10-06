import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,appendFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from '../package-core.mjs';
import {readLiveRequest,verifyHTTPInventory,verifyLiveExecutionTarget,fileLiveURL,permittedLiveURL,liveBaseURL} from './live-contract.mjs';
import {verifyFreeze} from './verify-final-freeze.mjs';
import {verifyGitTree} from './verify-git-tree.mjs';
import {verifyNative} from './freeze-contract.mjs';

const repo=resolve(import.meta.dirname,'../../..');
function save(file,value){mkdirSync(resolve(file,'..'),{recursive:true});const bytes=Buffer.from(JSON.stringify(value,null,2)+'\n');writeFileSync(file,bytes);return hash(bytes);}
function currentLiveIdentity(request){
 const runId=process.env.GITHUB_RUN_ID,runAttempt=process.env.GITHUB_RUN_ATTEMPT,requestCommit=process.env.HSK_LIVE_REQUEST_COMMIT;
 assert.match(runId??'',/^\d+$/);assert.match(runAttempt??'',/^[1-9]\d*$/);assert.match(requestCommit??'',/^[a-f0-9]{40}$/);
 assert.notEqual(runId,String(request.freezeRunId),'Live report may not borrow freeze workflow run identity');
 return {runId,runAttempt,requestCommit};
}
function publishedRef(request){
 const rows=execFileSync('git',['ls-remote','--heads','origin','refs/heads/gh-pages','refs/heads/'+request.stagingBranch],{cwd:repo,encoding:'utf8'}).trim().split('\n').filter(Boolean).map(row=>row.split(/\s+/)),refs=new Map(rows.map(([commit,ref])=>[ref,commit]));
 const actual=refs.get('refs/heads/gh-pages');assert.equal(actual,request.publishedStagingCommit,'Actual published gh-pages ref differs from requested staging commit');
 assert.equal(refs.get('refs/heads/'+request.stagingBranch),request.publishedStagingCommit,'Actual frozen staging branch differs from publication request');return actual;
}
export async function verifyLiveBundle(bundle,requestFile){
 const {request,requestSHA256}=readLiveRequest(requestFile),live=currentLiveIdentity(request);
 const frozen=verifyFreeze(bundle,request.buildReportSHA256,request.siteInventorySHA256,{expectedFreezeRunIdentity:{runId:request.freezeRunId,runAttempt:request.freezeRunAttempt}});
 assert.equal(frozen.build.sourceCommit,request.sourceCommit);
 const tree=execFileSync('git',['rev-parse',request.publishedStagingCommit+'^{tree}'],{cwd:repo,encoding:'utf8'}).trim();assert.equal(tree,request.publishedStagingTree);
 assert.equal(execFileSync('git',['rev-list','--parents','-n','1',request.publishedStagingCommit],{cwd:repo,encoding:'utf8'}).trim(),`${request.publishedStagingCommit} ${frozen.build.productionCommit}`,'Published staging commit must retain the approved production baseline as its sole parent');
 await verifyGitTree(repo,request.publishedStagingCommit,frozen.inventory);
 return {request,requestSHA256,live,frozen,publishedCommit:publishedRef(request)};
}
function bindingIdentity(verified){
 const {request,requestSHA256,live,frozen,publishedCommit}=verified;
 return {schemaVersion:1,baseURL:liveBaseURL,requestSHA256,requestCommit:live.requestCommit,sourceCommit:request.sourceCommit,sourceTree:frozen.build.sourceTree,buildReportSHA256:request.buildReportSHA256,siteInventorySHA256:request.siteInventorySHA256,precisionAuthoritySHA256:frozen.build.precision.canonicalAuthoritySHA256,singleBuildArtifactName:request.singleBuildArtifactName,freezeRunId:String(request.freezeRunId),freezeRunAttempt:String(request.freezeRunAttempt),publishedStagingCommit:publishedCommit,publishedStagingTree:request.publishedStagingTree,runId:live.runId,runAttempt:live.runAttempt,rebuildPerformed:false,productionWritePerformed:false};
}
export function verifyLiveIntegrity(integrity,verified){
 const expected=bindingIdentity(verified);for(const [key,value]of Object.entries(expected))assert.equal(integrity[key],value,'Live HTTP report binding differs: '+key);
 assert.equal(integrity.status,'passed-all-published-http-bytes');assert.equal(integrity.failed,0);assert.equal(integrity.allHTTPBodiesMatchFrozenInventory,true);assert.equal(integrity.filesChecked,verified.frozen.inventory.files.length);assert.equal(integrity.files.length,verified.frozen.inventory.files.length);
 for(let index=0;index<integrity.files.length;index++){
  const row=integrity.files[index],frozen=verified.frozen.inventory.files[index];assert.equal(row.path,frozen.path);assert.equal(row.requestedURL,fileLiveURL(frozen.path));permittedLiveURL(row.finalURL);assert.equal(row.passed,true);assert.equal(row.status,200);assert.equal(row.bytes,frozen.bytes);assert.equal(row.expectedBytes,frozen.bytes);assert.equal(row.sha256,frozen.sha256);assert.equal(row.expectedSHA256,frozen.sha256);
 }
 assert.equal(integrity.HTTPRetries,0);assert.equal(integrity.originalAudioTracks,357);return expected;
}
export async function recordLiveNative({bundle,requestFile,integrityFile,expectedIntegritySHA,browser,collectionFile,executionFile,output}){
 assert.ok(['chromium','webkit'].includes(browser));assert.match(expectedIntegritySHA??'',/^[a-f0-9]{64}$/);
 const verified=await verifyLiveBundle(bundle,requestFile),integrityBytes=readFileSync(integrityFile);assert.equal(hash(integrityBytes),expectedIntegritySHA);
 verifyLiveIntegrity(JSON.parse(integrityBytes),verified);
 const collection=readFileSync(collectionFile),execution=readFileSync(executionFile),cases=verifyNative(JSON.parse(execution),JSON.parse(collection),browser);
 verifyLiveExecutionTarget(JSON.parse(collection));verifyLiveExecutionTarget(JSON.parse(execution));
 const binding={...bindingIdentity(verified),status:'passed-native-on-real-published-site',browser,integrityReportSHA256:expectedIntegritySHA,collectionSHA256:hash(collection),executionSHA256:hash(execution),cases:cases.length,skipped:0,flaky:0,retries:0,liveTransport:'actual-https-github-pages',localServerUsed:false};save(output,binding);return binding;
}
export async function verifyCompleteLive({bundle,requestFile,integrityFile,expectedIntegritySHA,nativeRoot,output}){
 const verified=await verifyLiveBundle(bundle,requestFile),integrity=readFileSync(integrityFile);assert.equal(hash(integrity),expectedIntegritySHA);verifyLiveIntegrity(JSON.parse(integrity),verified);
 const identity=bindingIdentity(verified),browsers=[];
 for(const browser of ['chromium','webkit']){
  const directory=join(nativeRoot,browser),bindingBytes=readFileSync(join(directory,'binding.json')),binding=JSON.parse(bindingBytes),collection=readFileSync(join(directory,'collection.json')),execution=readFileSync(join(directory,'browser.json'));
  for(const [key,value]of Object.entries(identity))assert.equal(binding[key],value,'Live native identity differs: '+key);
  assert.equal(binding.status,'passed-native-on-real-published-site');assert.equal(binding.browser,browser);assert.equal(binding.integrityReportSHA256,expectedIntegritySHA);assert.equal(binding.collectionSHA256,hash(collection));assert.equal(binding.executionSHA256,hash(execution));assert.equal(binding.liveTransport,'actual-https-github-pages');assert.equal(binding.localServerUsed,false);
  const cases=verifyNative(JSON.parse(execution),JSON.parse(collection),browser);assert.equal(binding.cases,cases.length);for(const key of ['skipped','flaky','retries'])assert.equal(binding[key],0);
  verifyLiveExecutionTarget(JSON.parse(collection));verifyLiveExecutionTarget(JSON.parse(execution));
  browsers.push({browser,cases:cases.length,bindingSHA256:hash(bindingBytes),collectionSHA256:hash(collection),executionSHA256:hash(execution)});
 }
 const report={...identity,status:'passed-full-published-site-http-and-native',integrityReportSHA256:expectedIntegritySHA,allPublishedHTTPFiles:verified.frozen.inventory.files.length,originalAudioTracks:357,browsers,totalNativeCases:254,skipped:0,flaky:0,retries:0,liveTransport:'actual-https-github-pages',localServerUsed:false};save(output,report);return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [mode,...args]=process.argv.slice(2);
 if(mode==='request'){
  const [file]=args,{request,requestSHA256}=readLiveRequest(file);
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,`source_sha=${request.sourceCommit}\nfreeze_run_id=${request.freezeRunId}\nfreeze_run_attempt=${request.freezeRunAttempt}\nbuild_artifact=${request.singleBuildArtifactName}\nrequest_sha=${requestSHA256}\n`);
  console.log(JSON.stringify({status:'validated-explicit-live-request',sourceCommit:request.sourceCommit,requestSHA256,freezeRunId:request.freezeRunId,freezeRunAttempt:request.freezeRunAttempt}));
 }else if(mode==='integrity'){
  const [bundle,requestFile,output]=args,verified=await verifyLiveBundle(resolve(bundle),requestFile);
  const HTTP=await verifyHTTPInventory(verified.frozen.inventory,{concurrency:16,onProgress:progress=>console.log(JSON.stringify({status:'live-http-progress',...progress}))});
  const result={...bindingIdentity(verified),status:HTTP.failed?'failed-published-http-byte-verification':'passed-all-published-http-bytes',...HTTP,originalAudioTracks:357};const integritySHA256=save(output,result);
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,`integrity_sha=${integritySHA256}\n`);
  assert.equal(HTTP.failed,0,'Published HTTP bytes differ; exact failed responses retained in integrity report');console.log(JSON.stringify({status:result.status,integritySHA256,files:HTTP.filesChecked,bytes:HTTP.bytesChecked}));
 }else if(mode==='verify'){
  const [bundle,requestFile,integrityFile,expectedIntegritySHA]=args,verified=await verifyLiveBundle(resolve(bundle),requestFile),bytes=readFileSync(integrityFile);assert.equal(hash(bytes),expectedIntegritySHA);verifyLiveIntegrity(JSON.parse(bytes),verified);console.log(JSON.stringify({status:'verified-published-http-bindings-before-native',...bindingIdentity(verified)}));
 }else if(mode==='native'){
  const [bundle,requestFile,integrityFile,expectedIntegritySHA,browser,collectionFile,executionFile,output]=args;console.log(JSON.stringify(await recordLiveNative({bundle:resolve(bundle),requestFile,integrityFile,expectedIntegritySHA,browser,collectionFile,executionFile,output})));
 }else if(mode==='complete'){
  const [bundle,requestFile,integrityFile,expectedIntegritySHA,nativeRoot,output]=args;console.log(JSON.stringify(await verifyCompleteLive({bundle:resolve(bundle),requestFile,integrityFile,expectedIntegritySHA,nativeRoot,output})));
 }else throw Error('Usage: verify-final-live request|integrity|verify|native|complete ...');
}
