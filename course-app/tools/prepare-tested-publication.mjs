import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {walkFiles,hash} from './package-core.mjs';
import {protectedBaselineManifest,baselineExclusion,isApprovedUnifiedBaselineReplacement} from './assemble-unified-checkpoint.mjs';

// Inspect the downloaded, already tested website bytes. This never builds,
// changes production, or uploads a file; it prepares an exact Git blob vector.
const [siteDirectory,assemblyFile,testedCommit,outputFile] = process.argv.slice(2);
assert.ok(siteDirectory && assemblyFile && testedCommit && outputFile);
const repo = resolve(import.meta.dirname,'../..'), site = resolve(siteDirectory);
const assembly = JSON.parse(readFileSync(resolve(assemblyFile),'utf8'));
assert.equal(assembly.status,'assembled-checkpoint-not-release');
assert.equal(assembly.sourceCommit,testedCommit);
assert.equal(assembly.sourceDirty,false);
assert.equal(assembly.buildProvenance,'built-from-recorded-worktree');
assert.equal(assembly.rebuilt,false);
assert.equal(assembly.productionCommit,'2da6a5c80c62d4ff5bdfa72a5bdb929b2b1ff3d4');
const names = walkFiles(site);
assert.equal(names.length,assembly.assembledFiles);
assert.deepEqual(names,assembly.files.map(file=>file.path));
assert.equal(hash(Buffer.from(JSON.stringify(assembly.files))),assembly.inventorySHA256);
const replacements = new Set(assembly.authorizedReplacements.map(file=>file.path));
assert.equal(replacements.size,assembly.authorizedReplacements.length);
const baseline = protectedBaselineManifest(repo);
const original = new Map(baseline.files.map(file=>[file.path,file]));
const nameSet = new Set(names);
for(const file of baseline.files.filter(file=>!baselineExclusion(file.path))) assert.ok(nameSet.has(file.path),`Missing original public file ${file.path}`);
for(const replacement of assembly.authorizedReplacements){
  assert.ok(isApprovedUnifiedBaselineReplacement(replacement.path),`Unapproved original overwrite ${replacement.path}`);
  assert.equal(replacement.beforeGitBlob,original.get(replacement.path)?.sha);
}
assert.deepEqual(assembly.baselineUnservedExclusions,baseline.files.filter(file=>baselineExclusion(file.path)).map(file=>({...file,reason:baselineExclusion(file.path)})));
const actualReplacements = [];
const files = names.map((path,index)=>{
  assert.equal(baselineExclusion(path),undefined,`Private source ${path}`);
  assert.ok(!/\.(?:pdf|zip|rar|map)$/i.test(path));
  const bytes = readFileSync(join(site,path)), receipt = assembly.files[index];
  assert.equal(bytes.length,receipt.bytes,path);
  assert.equal(hash(bytes),receipt.sha256,path);
  const sha = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  if(original.has(path) && sha!==original.get(path).sha){
    assert.ok(replacements.has(path),`Unlisted original overwrite ${path}`);
    assert.equal(receipt.sha256,assembly.authorizedReplacements.find(file=>file.path===path).afterSHA256);
    actualReplacements.push(path);
  }
  return {path,mode:'100644',type:'blob',sha,bytes:bytes.length,sha256:receipt.sha256};
});
assert.deepEqual(actualReplacements.sort(),[...replacements].sort());
const protectedFiles = baseline.files.filter(file=>!baselineExclusion(file.path)&&!replacements.has(file.path));
assert.equal(protectedFiles.length,assembly.protectedPublicFiles);
assert.equal(protectedFiles.length,1380);
assert.equal(assembly.baselineUnservedExclusions.length,55);
const manifestPath='course-engine/unified-release-manifest.json';
const manifestBytes=readFileSync(join(site,manifestPath));
assert.equal(hash(manifestBytes),assembly.unifiedManifestSHA256);
const manifest=JSON.parse(manifestBytes);
assert.equal(manifest.sourceCommit,testedCommit);
assert.equal(manifest.sourceDirty,false);
assert.equal(manifest.sourceSnapshot.sha256,assembly.sourceSnapshotSHA256);
const metadata={schemaVersion:1,phase:'awaiting-user-publication-confirmation',
  testedSourceCommit:testedCommit,productionParentMustEqual:assembly.productionCommit,
  sourceSnapshotSHA256:assembly.sourceSnapshotSHA256,inventorySHA256:assembly.inventorySHA256,
  unifiedManifestSHA256:assembly.unifiedManifestSHA256,protectedPublicFiles:protectedFiles.length,
  excludedPrivateBaselineFiles:55,rebuiltAfterNativeTests:false,
  publicationInstruction:'Use these exact tested bytes after explicit confirmation; update gh-pages without force only if its live parent still matches.',files};
mkdirSync(dirname(resolve(outputFile)),{recursive:true});
writeFileSync(resolve(outputFile),JSON.stringify(metadata,null,2)+'\n');
console.log(JSON.stringify({phase:metadata.phase,testedSourceCommit:testedCommit,
  files:files.length,protectedPublicFiles:protectedFiles.length,inventorySHA256:assembly.inventorySHA256}));
