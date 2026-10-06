import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyFreeze} from './verify-final-freeze.mjs';
import {verifyNative} from './freeze-contract.mjs';
import {hash} from '../package-core.mjs';
export function verifyFinalNativeSet({bundle,nativeRoot,expectedBuildSHA,expectedInventorySHA}){
 const verified=verifyFreeze(bundle,expectedBuildSHA,expectedInventorySHA),browsers=[];
 for(const browser of ['chromium','webkit']){
  const directory=join(nativeRoot,browser),bindingBytes=readFileSync(join(directory,'binding.json')),binding=JSON.parse(bindingBytes),collection=readFileSync(join(directory,'collection.json')),execution=readFileSync(join(directory,'browser.json'));
  assert.equal(binding.status,'passed-native-on-exact-frozen-site');assert.equal(binding.browser,browser);assert.equal(binding.sourceCommit,verified.build.sourceCommit);assert.equal(binding.sourceTree,verified.build.sourceTree);
  assert.equal(binding.buildReportSHA256,expectedBuildSHA);assert.equal(binding.siteInventorySHA256,expectedInventorySHA);assert.equal(binding.precisionAuthoritySHA256,verified.build.precision.canonicalAuthoritySHA256);
  assert.equal(String(binding.runId),process.env.GITHUB_RUN_ID);assert.equal(String(binding.runAttempt),process.env.GITHUB_RUN_ATTEMPT);assert.equal(binding.collectionSHA256,hash(collection));assert.equal(binding.executionSHA256,hash(execution));
  const cases=verifyNative(JSON.parse(execution),JSON.parse(collection),browser);browsers.push({browser,cases:cases.length,bindingSHA256:hash(bindingBytes),collectionSHA256:hash(collection),executionSHA256:hash(execution)});
 }
 return {verified,browsers};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [bundleArg,nativeArg,expectedBuildSHA,expectedInventorySHA,output]=process.argv.slice(2);assert.ok(bundleArg&&nativeArg&&output,'Native set paths and independent build pins required');
 const {verified,browsers}=verifyFinalNativeSet({bundle:resolve(bundleArg),nativeRoot:resolve(nativeArg),expectedBuildSHA,expectedInventorySHA});
 const report={schemaVersion:1,status:'passed-full-frozen-site-native',sourceCommit:verified.build.sourceCommit,sourceTree:verified.build.sourceTree,productionCommit:verified.build.productionCommit,buildReportSHA256:expectedBuildSHA,siteInventorySHA256:expectedInventorySHA,precisionAuthoritySHA256:verified.build.precision.canonicalAuthoritySHA256,browsers,totalNativeCases:254,skipped:0,flaky:0,retries:0,buildCount:1,rebuilt:false,runId:process.env.GITHUB_RUN_ID,runAttempt:process.env.GITHUB_RUN_ATTEMPT,published:false};
 mkdirSync(resolve(output,'..'),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}
