import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,appendFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {verifyFinalNativeSet} from './verify-final-native-set.mjs';
import {stagingBranch} from './freeze-contract.mjs';
import {verifyGitTree} from './verify-git-tree.mjs';
import {productionCommit} from './assemble-site.mjs';
const repo=resolve(import.meta.dirname,'../../..');
const [bundleArg,nativeArg,expectedBuildSHA,expectedInventorySHA,outputArg]=process.argv.slice(2);
assert.ok(bundleArg&&nativeArg&&outputArg,'Usage: stage-final-freeze BUNDLE NATIVE_REPORTS BUILD_SHA INVENTORY_SHA OUTPUT_REPORT');
const bundle=resolve(bundleArg),nativeRoot=resolve(nativeArg),output=resolve(outputArg),{verified,browsers}=verifyFinalNativeSet({bundle,nativeRoot,expectedBuildSHA,expectedInventorySHA});
const branch=stagingBranch(process.env.GITHUB_RUN_ID,process.env.GITHUB_RUN_ATTEMPT);
assert.ok(branch.startsWith('work/hsk-final-staging-20261006-'));assert.notEqual(branch,'gh-pages');
assert.equal(execFileSync('git',['ls-remote','--heads','origin','refs/heads/'+branch],{cwd:repo,encoding:'utf8'}).trim(),'','Never replace an existing staging branch');
const temp=mkdtempSync(join(tmpdir(),'hsk-staging-index-'));
let commit,treeVerification;
try{
 const gitDir=execFileSync('git',['rev-parse','--absolute-git-dir'],{cwd:repo,encoding:'utf8'}).trim();
 const env={...process.env,GIT_INDEX_FILE:join(temp,'index'),GIT_AUTHOR_NAME:'HSK Final QA',GIT_AUTHOR_EMAIL:'hsk-final-qa@users.noreply.github.com',GIT_COMMITTER_NAME:'HSK Final QA',GIT_COMMITTER_EMAIL:'hsk-final-qa@users.noreply.github.com'};
 const git=args=>execFileSync('git',['--git-dir',gitDir,'--work-tree',verified.site,'-c','core.autocrlf=false','-c','core.filemode=false',...args],{cwd:verified.site,env,encoding:'utf8',maxBuffer:16*1024*1024}).trim();
 git(['read-tree','--empty']);git(['add','--force','--all','--','.']);const tree=git(['write-tree']);
 treeVerification=await verifyGitTree(repo,tree,verified.inventory);
 const message=`Freeze native-verified HSK website\n\nSource: ${verified.build.sourceCommit}\nInventory SHA-256: ${expectedInventorySHA}\nChromium/WebKit: 127 passed each, zero skips or retries\nPrecision authority: ${verified.build.precision.canonicalAuthoritySHA256}\nProduction publication remains pending.\n`;
 commit=execFileSync('git',['commit-tree',tree,'-p',productionCommit],{cwd:repo,env,input:message,encoding:'utf8'}).trim();
 assert.equal(execFileSync('git',['rev-list','--parents','-n','1',commit],{cwd:repo,encoding:'utf8'}).trim(),`${commit} ${productionCommit}`,'Staging must have the approved production commit as its sole parent');
 await verifyGitTree(repo,commit,verified.inventory);
}finally{rmSync(temp,{recursive:true,force:true});}
// Only this new staging ref is written. gh-pages is left for the root agent's
// separately verified native lease publication of this exact commit/tree.
execFileSync('git',['push','origin',`${commit}:refs/heads/${branch}`],{cwd:repo,stdio:'inherit'});
assert.equal(execFileSync('git',['ls-remote','--heads','origin','refs/heads/'+branch],{cwd:repo,encoding:'utf8'}).trim().split(/\s+/)[0],commit);
const receipt={schemaVersion:1,status:'native-verified-staging-only',sourceCommit:verified.build.sourceCommit,sourceTree:verified.build.sourceTree,stagingBranch:branch,stagingCommit:commit,stagingTree:treeVerification.gitTree,soleParent:productionCommit,siteInventorySHA256:expectedInventorySHA,buildReportSHA256:expectedBuildSHA,precisionAuthoritySHA256:verified.build.precision.canonicalAuthoritySHA256,treeVerification,browsers,runId:process.env.GITHUB_RUN_ID,runAttempt:process.env.GITHUB_RUN_ATTEMPT,productionBranchWritten:false,published:false};
mkdirSync(resolve(output,'..'),{recursive:true});writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');
if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,`staging_branch=${branch}\nstaging_commit=${commit}\nstaging_tree=${treeVerification.gitTree}\n`);
console.log(JSON.stringify(receipt));
