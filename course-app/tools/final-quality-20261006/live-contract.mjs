import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {hash} from '../package-core.mjs';
import {finalBrowserCases,stagingBranch} from './freeze-contract.mjs';

export const liveBaseURL='https://nhiennhientran.github.io/hsk-hub/';
export function validateLiveRequest(value){
 assert.equal(value.schemaVersion,1);assert.equal(value.status,'published-freeze-request-live-revalidation');
 assert.equal(value.baseURL,liveBaseURL);assert.equal(value.browserCasesPerEngine,finalBrowserCases);assert.equal(value.originalAudioTracks,357);assert.equal(value.productionPublicationVerified,true);
 for(const key of ['sourceCommit','publishedStagingCommit','publishedStagingTree'])assert.match(value[key]??'',/^[a-f0-9]{40}$/,'Exact '+key+' required');
 for(const key of ['buildReportSHA256','siteInventorySHA256'])assert.match(value[key]??'',/^[a-f0-9]{64}$/,'Exact '+key+' required');
 assert.match(String(value.freezeRunId??''),/^\d+$/);assert.match(String(value.freezeRunAttempt??''),/^[1-9]\d*$/);
 assert.equal(value.singleBuildArtifactName,`hsk-final-single-build-${value.sourceCommit}-${value.freezeRunId}-${value.freezeRunAttempt}`);
 assert.equal(value.stagingBranch,stagingBranch(value.freezeRunId,value.freezeRunAttempt));
 return value;
}
export function readLiveRequest(file){const bytes=readFileSync(file);return {request:validateLiveRequest(JSON.parse(bytes)),requestSHA256:hash(bytes)};}
export function permittedLiveURL(url,baseURL=liveBaseURL){
 const candidate=new URL(url),base=new URL(baseURL);
 assert.equal(candidate.protocol,'https:','Live transport must remain HTTPS');assert.equal(candidate.origin,base.origin,'Live redirect left approved GitHub Pages host');
 assert.ok(candidate.pathname.startsWith(base.pathname),'Live redirect left approved website base path');assert.equal(candidate.username,'');assert.equal(candidate.password,'');
 return candidate.href;
}
export function fileLiveURL(path,baseURL=liveBaseURL){
 assert.ok(typeof path==='string'&&path.length>0&&!path.startsWith('/')&&!path.includes('\\')&&path.split('/').every(part=>part!==''&&part!=='.'&&part!=='..'),'Unsafe inventory URL path');
 return permittedLiveURL(new URL(path.split('/').map(encodeURIComponent).join('/'),baseURL).href,baseURL);
}
export async function verifyHTTPFile(row,{fetchImpl=fetch,baseURL=liveBaseURL,timeoutMs=90000}={}){
 const url=fileLiveURL(row.path,baseURL),result={path:row.path,requestedURL:url,status:null,finalURL:null,bytes:0,sha256:null,expectedBytes:row.bytes,expectedSHA256:row.sha256,passed:false};
 try{
  const response=await fetchImpl(url,{redirect:'follow',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(timeoutMs)});
  result.status=response.status;result.finalURL=response.url;assert.ok(response.body,'HTTP response body is absent');
  const digest=createHash('sha256');for await(const chunk of response.body){digest.update(chunk);result.bytes+=chunk.byteLength;}
  result.sha256=digest.digest('hex');permittedLiveURL(response.url,baseURL);assert.equal(response.status,200,'HTTP response is not complete 200');assert.equal(result.bytes,row.bytes,'HTTP body byte length differs');assert.equal(result.sha256,row.sha256,'HTTP body SHA-256 differs');result.passed=true;
 }catch(error){result.error=error instanceof Error?error.message:String(error);}
 return result;
}
export async function verifyHTTPInventory(inventory,{fetchImpl=fetch,baseURL=liveBaseURL,concurrency=16,onProgress}={}){
 assert.ok(Number.isInteger(concurrency)&&concurrency>0&&concurrency<=16);assert.ok(inventory.files.length>0);assert.equal(new Set(inventory.files.map(row=>row.path)).size,inventory.files.length);
 assert.equal(hash(Buffer.from(JSON.stringify(inventory.files))),inventory.inventorySHA256,'HTTP inventory seal differs');
 const results=new Array(inventory.files.length);let cursor=0,complete=0;
 await Promise.all(Array.from({length:Math.min(concurrency,inventory.files.length)},async()=>{
  while(cursor<inventory.files.length){const index=cursor++;results[index]=await verifyHTTPFile(inventory.files[index],{fetchImpl,baseURL});complete++;if(onProgress&&(complete%100===0||complete===results.length))onProgress({complete,total:results.length,failed:results.filter(row=>row&&!row.passed).length});}
 }));
 return {files:results,filesChecked:results.length,bytesChecked:results.reduce((sum,row)=>sum+row.bytes,0),failed:results.filter(row=>!row.passed).length,allHTTPBodiesMatchFrozenInventory:results.every(row=>row.passed),HTTPRetries:0,concurrency};
}
export function verifyLiveExecutionTarget(report){
 const target=report.config?.metadata?.finalQATarget;assert.ok(target,'Actual native report lacks target metadata');
 assert.equal(target.mode,'live');assert.equal(target.baseURL,liveBaseURL);assert.equal(target.webServerConfigured,false);assert.equal(target.casesPerEngine,127);
 assert.ok(report.config.configFile.endsWith('/freeze-playwright.config.ts'),'Actual live report used another case configuration');
 for(const project of report.config.projects??[])assert.equal(project.retries,0,'Actual live driver permits retries');
 return target;
}
