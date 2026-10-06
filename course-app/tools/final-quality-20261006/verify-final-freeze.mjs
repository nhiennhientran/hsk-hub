import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {hash} from '../package-core.mjs';
import {runtimeSourceSnapshot} from '../package-unified.mjs';
import {productionCommit,productionTree} from './assemble-site.mjs';
import {verifyInventory,verifyNative,finalBrowserCases} from './freeze-contract.mjs';
const repo=resolve(import.meta.dirname,'../../..');
const json=file=>JSON.parse(readFileSync(file));
export function verifyFreezeRunIdentity(build,expectedFreezeRunIdentity){
 if(expectedFreezeRunIdentity!==undefined){
  assert.match(String(expectedFreezeRunIdentity.runId??''),/^\d+$/);assert.match(String(expectedFreezeRunIdentity.runAttempt??''),/^[1-9]\d*$/);
  assert.equal(String(build.runId),String(expectedFreezeRunIdentity.runId),'Frozen build belongs to another freeze run');assert.equal(String(build.runAttempt),String(expectedFreezeRunIdentity.runAttempt),'Frozen build belongs to another freeze attempt');
 }else{
  if(process.env.GITHUB_RUN_ID)assert.equal(String(build.runId),process.env.GITHUB_RUN_ID);
  if(process.env.GITHUB_RUN_ATTEMPT)assert.equal(String(build.runAttempt),process.env.GITHUB_RUN_ATTEMPT);
 }
}
export function verifyFreeze(bundle,expectedBuildSHA,expectedInventorySHA,{expectedFreezeRunIdentity}={}){
 assert.match(expectedBuildSHA??'',/^[a-f0-9]{64}$/);assert.match(expectedInventorySHA??'',/^[a-f0-9]{64}$/);
 const reports=join(bundle,'reports'),buildBytes=readFileSync(join(reports,'build.json')),build=JSON.parse(buildBytes);
 assert.equal(hash(buildBytes),expectedBuildSHA,'Build report differs from independent build-job output');
 assert.equal(build.schemaVersion,1);assert.equal(build.status,'frozen-single-build-awaiting-native');assert.equal(build.buildCount,1);assert.equal(build.rebuilt,false);assert.equal(build.sourceDirty,false);
 assert.equal(build.productionCommit,productionCommit);assert.equal(build.productionTree,productionTree);assert.equal(build.nativeAccepted,false);assert.equal(build.published,false);
 assert.equal(build.sourceCommit,execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim());
 assert.equal(build.sourceTree,execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:repo,encoding:'utf8'}).trim());
 assert.equal(runtimeSourceSnapshot(repo).sha256,build.sourceSnapshot.sha256,'Recorded source does not match frozen build source');
 verifyFreezeRunIdentity(build,expectedFreezeRunIdentity);
 assert.equal(build.browserCasesPerEngine,finalBrowserCases);assert.equal(build.originalAudioTracks,357);assert.equal(build.precision.rows,2539);assert.equal(build.precision.nonSpokenAnnotations,1);
 for(const row of [...build.specs,{file:build.requestFile,sha256:build.requestSHA256},{file:build.precision.authorityFile,sha256:build.precision.authorityFileSHA256},{file:build.precision.manifestFile,sha256:build.precision.manifestSHA256},{file:build.precision.targetFile,sha256:build.precision.targetCatalogSHA256},{file:build.precision.independentReportFile,sha256:build.precision.independentReportSHA256}])assert.equal(hash(readFileSync(join(repo,row.file))),row.sha256,'Acceptance source input differs: '+row.file);
 const inventoryBytes=readFileSync(join(reports,'site-inventory.json')),inventory=JSON.parse(inventoryBytes);
 assert.equal(hash(inventoryBytes),build.siteInventoryFileSHA256);assert.equal(inventory.inventorySHA256,expectedInventorySHA);assert.equal(build.siteInventorySHA256,expectedInventorySHA);
 assert.equal(inventory.sourceCommit,build.sourceCommit);assert.equal(inventory.sourceSnapshotSHA256,build.sourceSnapshot.sha256);
 const site=join(bundle,'site');verifyInventory(site,inventory);assert.equal(hash(readFileSync(join(site,'course-engine/unified-release-manifest.json'))),build.unifiedManifestSHA256);
 return {build,inventory,site,expectedBuildSHA,expectedInventorySHA};
}
export function recordNative({bundle,browser,collectionFile,executionFile,output,expectedBuildSHA,expectedInventorySHA}){
 assert.ok(['chromium','webkit'].includes(browser));const verified=verifyFreeze(bundle,expectedBuildSHA,expectedInventorySHA);
 const collectionBytes=readFileSync(collectionFile),executionBytes=readFileSync(executionFile),cases=verifyNative(JSON.parse(executionBytes),JSON.parse(collectionBytes),browser);
 const binding={schemaVersion:1,status:'passed-native-on-exact-frozen-site',browser,sourceCommit:verified.build.sourceCommit,sourceTree:verified.build.sourceTree,buildReportSHA256:expectedBuildSHA,siteInventorySHA256:expectedInventorySHA,precisionAuthoritySHA256:verified.build.precision.canonicalAuthoritySHA256,collectionSHA256:hash(collectionBytes),executionSHA256:hash(executionBytes),cases:cases.length,skipped:0,flaky:0,retries:0,runId:process.env.GITHUB_RUN_ID??null,runAttempt:process.env.GITHUB_RUN_ATTEMPT??null,published:false};
 mkdirSync(resolve(output,'..'),{recursive:true});writeFileSync(output,JSON.stringify(binding,null,2)+'\n');return binding;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [mode,bundle,expectedBuildSHA,expectedInventorySHA,browser,collectionFile,executionFile,output]=process.argv.slice(2);
 if(mode==='verify'){const value=verifyFreeze(resolve(bundle),expectedBuildSHA,expectedInventorySHA);console.log(JSON.stringify({status:'verified-exact-single-build',sourceCommit:value.build.sourceCommit,siteInventorySHA256:expectedInventorySHA,files:value.inventory.files.length}));}
 else if(mode==='native'){console.log(JSON.stringify(recordNative({bundle:resolve(bundle),expectedBuildSHA,expectedInventorySHA,browser,collectionFile,executionFile,output})));}
 else throw Error('Usage: verify-final-freeze verify|native BUNDLE BUILD_SHA INVENTORY_SHA [BROWSER COLLECTION EXECUTION OUTPUT]');
}
