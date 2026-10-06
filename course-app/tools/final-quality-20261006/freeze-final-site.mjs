import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,appendFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {preflight,repo} from './freeze-preflight.mjs';
import {assembleSite} from './assemble-site.mjs';
import {hash} from '../package-core.mjs';
import {runtimeSourceSnapshot} from '../package-unified.mjs';
import {verifyInventory} from './freeze-contract.mjs';
const [requestFile,destination]=process.argv.slice(2);assert.ok(requestFile&&destination,'Usage: freeze-final-site REQUEST_FILE NEW_OUTPUT_DIRECTORY');
const output=resolve(destination);assert.equal(existsSync(output),false,'Frozen output must be new');
const seal=await preflight(requestFile),reports=join(output,'reports'),working=join(output,'working');mkdirSync(reports,{recursive:true});mkdirSync(working);
writeFileSync(join(reports,'preflight.json'),JSON.stringify(seal,null,2)+'\n');
const cwd=join(repo,'course-app'),built=join(working,'built'),packageRoot=join(working,'package');
// This is the single build. Both engines and the staging commit consume its
// exact assembled output; neither rebuilds or promotes a previous test run.
execFileSync(process.execPath,['tools/package-unified.mjs','--build','--source',seal.sourceCommit,'--input',built,'--output',packageRoot],{cwd,stdio:'inherit'});
assert.equal(runtimeSourceSnapshot(repo).sha256,seal.sourceSnapshot.sha256,'Source drift during single build');
const baselines={};
for(const [name,ref]of [['production',seal.productionCommit],['legacy',seal.legacyProvenanceCommit]]){
 const archive=join(working,name+'.tar'),directory=join(working,name);mkdirSync(directory);
 execFileSync('git',['archive','--format=tar','--output',archive,ref],{cwd:repo});execFileSync('tar',['-xf',archive,'--directory',directory]);baselines[name]=directory;
}
const site=join(output,'site'),inventory=assembleSite({repo,baseline:baselines.production,legacyBaseline:baselines.legacy,packageRoot,output:site,report:join(reports,'site-inventory.json')});
verifyInventory(site,inventory);assert.equal(inventory.sourceCommit,seal.sourceCommit);assert.equal(inventory.sourceSnapshotSHA256,seal.sourceSnapshot.sha256);
const build={...seal,status:'frozen-single-build-awaiting-native',buildCount:1,rebuilt:false,siteInventorySHA256:inventory.inventorySHA256,siteInventoryFile:'reports/site-inventory.json',siteInventoryFileSHA256:hash(readFileSync(join(reports,'site-inventory.json'))),unifiedManifestSHA256:hash(readFileSync(join(site,'course-engine/unified-release-manifest.json'))),runId:process.env.GITHUB_RUN_ID??null,runAttempt:process.env.GITHUB_RUN_ATTEMPT??null};
const bytes=Buffer.from(JSON.stringify(build,null,2)+'\n');writeFileSync(join(reports,'build.json'),bytes);
if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,`inventory_sha=${inventory.inventorySHA256}\nbuild_sha=${hash(bytes)}\nsource_sha=${seal.sourceCommit}\nauthority_sha=${seal.precision.canonicalAuthoritySHA256}\n`);
console.log(JSON.stringify({status:build.status,sourceCommit:seal.sourceCommit,siteInventorySHA256:inventory.inventorySHA256,buildReportSHA256:hash(bytes),site,buildCount:1}));
