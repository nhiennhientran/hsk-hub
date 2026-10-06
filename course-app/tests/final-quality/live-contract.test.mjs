import test from 'node:test';
import assert from 'node:assert/strict';
import {hash} from '../../tools/package-core.mjs';
import {validateLiveRequest,fileLiveURL,permittedLiveURL,verifyHTTPFile,verifyHTTPInventory,verifyLiveExecutionTarget,liveBaseURL} from '../../tools/final-quality-20261006/live-contract.mjs';
import {verifyFreezeRunIdentity} from '../../tools/final-quality-20261006/verify-final-freeze.mjs';

function request(){return {schemaVersion:1,status:'published-freeze-request-live-revalidation',baseURL:liveBaseURL,browserCasesPerEngine:127,originalAudioTracks:357,productionPublicationVerified:true,sourceCommit:'1'.repeat(40),publishedStagingCommit:'2'.repeat(40),publishedStagingTree:'3'.repeat(40),buildReportSHA256:'4'.repeat(64),siteInventorySHA256:'5'.repeat(64),freezeRunId:'12345',freezeRunAttempt:'2',singleBuildArtifactName:`hsk-final-single-build-${'1'.repeat(40)}-12345-2`,stagingBranch:'work/hsk-final-staging-20261006-12345-2'};}
function row(path='course-engine/assets/app.js',bytes=Buffer.from('中文原声')){return {path,bytes:bytes.length,sha256:hash(bytes)};}
function response(bytes,{url=liveBaseURL+'course-engine/assets/app.js',status=200,chunks=3}={}){
 return {url,status,body:(async function*(){for(let index=0;index<bytes.length;index+=chunks)yield bytes.subarray(index,index+chunks);})()};
}
test('live request pins exact source, original run artifact and already published staging identities',()=>{assert.equal(validateLiveRequest(request()).freezeRunAttempt,'2');for(const mutate of [r=>r.sourceCommit='HEAD',r=>r.singleBuildArtifactName='latest-build',r=>r.freezeRunAttempt='0',r=>r.baseURL='http://127.0.0.1/',r=>r.productionPublicationVerified=false]){const value=request();mutate(value);assert.throws(()=>validateLiveRequest(value));}});
test('HTTP path encoding stays within the approved website and rejects traversal',()=>{assert.equal(fileLiveURL('images/姓名 1.png'),liveBaseURL+'images/%E5%A7%93%E5%90%8D%201.png');for(const path of ['../index.html','/index.html','assets/../index.html','a\\b'])assert.throws(()=>fileLiveURL(path));});
test('redirects may retain approved host and base path but cannot escape either or use HTTP',()=>{assert.equal(permittedLiveURL(liveBaseURL+'index.html'),liveBaseURL+'index.html');for(const url of ['https://example.com/hsk-hub/index.html','https://nhiennhientran.github.io/other/index.html','http://nhiennhientran.github.io/hsk-hub/index.html'])assert.throws(()=>permittedLiveURL(url));});
test('streamed HTTP bodies retain exact multibyte bytes across arbitrary chunk boundaries',async()=>{const bytes=Buffer.from('中文原声'),actual=await verifyHTTPFile(row(),{fetchImpl:async()=>response(bytes)});assert.equal(actual.passed,true);assert.equal(actual.bytes,bytes.length);assert.equal(actual.sha256,hash(bytes));});
test('same byte length with different teaching bytes fails actual HTTP SHA',async()=>{const actual=await verifyHTTPFile(row(),{fetchImpl:async()=>response(Buffer.from('中文异声'))});assert.equal(actual.passed,false);assert.match(actual.error,/SHA-256 differs/);assert.equal(actual.sha256,hash(Buffer.from('中文异声')));});
test('404 responses preserve actual status and streamed error body SHA then fail',async()=>{const bytes=Buffer.from('Not found'),actual=await verifyHTTPFile(row(),{fetchImpl:async()=>response(bytes,{status:404})});assert.equal(actual.passed,false);assert.equal(actual.status,404);assert.equal(actual.sha256,hash(bytes));assert.match(actual.error,/complete 200/);});
test('a redirect outside the approved website cannot pass even with matching body bytes',async()=>{const actual=await verifyHTTPFile(row(),{fetchImpl:async()=>response(Buffer.from('中文原声'),{url:'https://example.com/hsk-hub/file.js'})});assert.equal(actual.passed,false);assert.match(actual.error,/host/);});
test('complete HTTP inventory hashes every path with bounded concurrency and retains a single mismatch',async()=>{
 const files=Array.from({length:31},(_,index)=>row(`assets/${index}.js`,Buffer.from(`file-${index}`))),inventory={files,inventorySHA256:hash(Buffer.from(JSON.stringify(files)))};let active=0,peak=0;
 const verified=await verifyHTTPInventory(inventory,{concurrency:16,fetchImpl:async url=>{active++;peak=Math.max(peak,active);await new Promise(resolve=>setImmediate(resolve));const index=Number(new URL(url).pathname.match(/\/(\d+)\.js$/)[1]);const bytes=Buffer.from(index===12?'alter-12':`file-${index}`);active--;return response(bytes,{url});}});
 assert.equal(verified.filesChecked,31);assert.equal(verified.failed,1);assert.equal(verified.files[12].passed,false);assert.equal(verified.allHTTPBodiesMatchFrozenInventory,false);assert.ok(peak>1&&peak<=16);assert.equal(verified.HTTPRetries,0);
});
test('explicit old freeze identity accepts a later live run without mutating actual CI run environment',()=>{
 const saved={id:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT};process.env.GITHUB_RUN_ID='99999';process.env.GITHUB_RUN_ATTEMPT='1';
 try{assert.throws(()=>verifyFreezeRunIdentity({runId:'12345',runAttempt:'2'}));verifyFreezeRunIdentity({runId:'12345',runAttempt:'2'},{runId:'12345',runAttempt:'2'});assert.equal(process.env.GITHUB_RUN_ID,'99999');assert.throws(()=>verifyFreezeRunIdentity({runId:'12345',runAttempt:'1'},{runId:'12345',runAttempt:'2'}));}
 finally{if(saved.id===undefined)delete process.env.GITHUB_RUN_ID;else process.env.GITHUB_RUN_ID=saved.id;if(saved.attempt===undefined)delete process.env.GITHUB_RUN_ATTEMPT;else process.env.GITHUB_RUN_ATTEMPT=saved.attempt;}
});
test('actual native report must record a live HTTPS target with no local server or permitted retry',()=>{
 const actual={config:{configFile:'/source/course-app/tests/final-quality/freeze-playwright.config.ts',metadata:{finalQATarget:{mode:'live',baseURL:liveBaseURL,webServerConfigured:false,casesPerEngine:127}},projects:[{retries:0}]}};
 verifyLiveExecutionTarget(actual);for(const mutate of [r=>r.config.metadata.finalQATarget.mode='frozen',r=>r.config.metadata.finalQATarget.baseURL='http://127.0.0.1:18836',r=>r.config.metadata.finalQATarget.webServerConfigured=true,r=>r.config.projects[0].retries=1]){const value=structuredClone(actual);mutate(value);assert.throws(()=>verifyLiveExecutionTarget(value));}
});
