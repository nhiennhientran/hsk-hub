import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {assembleUnifiedCheckpoint,baselineExclusion,isApprovedUnifiedBaselineReplacement} from '../assemble-unified-checkpoint.mjs';
import {hash,walkFiles} from '../package-core.mjs';

export const productionCommit='5d890eb59cdaf8ad3b134b3d141d2ef6fee2ecb7';
export const productionTree='702a23751e0eeaddfff5ba90da7d59bfc999875c';
const blob=b=>createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
function treeRows(repo,ref){
 return execFileSync('git',['ls-tree','-rz',ref],{cwd:repo,encoding:'utf8'}).split('\0').filter(Boolean).map(row=>{
  const [meta,path]=row.split('\t'),[mode,type,sha]=meta.split(' ');
  if(type!=='blob'||mode!=='100644'||path.startsWith('/')||path.includes('\\')||path.split('/').some(p=>['','.','..'].includes(p)))throw Error('Unsupported baseline entry '+path);
  return {path,mode,sha};
 });
}
export function assembleSite({repo,baseline,legacyBaseline,packageRoot,output,report}){
 for(const key of ['repo','baseline','legacyBaseline','packageRoot','output']){
  const value=({repo,baseline,legacyBaseline,packageRoot,output})[key];
  if(!value)throw Error('Missing '+key);
 }
 repo=resolve(repo);baseline=resolve(baseline);legacyBaseline=resolve(legacyBaseline);packageRoot=resolve(packageRoot);output=resolve(output);
 if(existsSync(output))throw Error('Final assembly destination must be new');
 const tree=execFileSync('git',['rev-parse',productionCommit+'^{tree}'],{cwd:repo,encoding:'utf8'}).trim();
 if(tree!==productionTree)throw Error('Wrong current production tree');
 const rows=treeRows(repo,productionCommit),paths=walkFiles(baseline);
 if(JSON.stringify(paths)!==JSON.stringify(rows.map(r=>r.path).sort()))throw Error('Incomplete current production baseline');
 for(const r of rows)if(blob(readFileSync(join(baseline,r.path)))!==r.sha)throw Error('Changed current baseline '+r.path);
 const manifestBytes=readFileSync(join(packageRoot,'course-engine/unified-release-manifest.json')),manifest=JSON.parse(manifestBytes);
 if(manifest.sourceDirty!==false||manifest.buildProvenance!=='built-from-recorded-worktree'||!manifest.sourceSnapshot?.sha256)throw Error('Final artifact requires clean, recorded build inputs');
 // Reuse the complete original-media, source-figure, handwriting and static
 // dependency checks. Their original production reference is a provenance
 // anchor; the deployment/rollback anchor below is the current live commit.
 const temp=mkdtempSync(join(tmpdir(),'hsk-final-assembly-'));
 let originalValidation;
 try{originalValidation=assembleUnifiedCheckpoint({repo,baseline:legacyBaseline,packageRoot,output:join(temp,'validated')});}
 finally{rmSync(temp,{recursive:true,force:true});}
 const packagePaths=walkFiles(packageRoot),baseMap=new Map(rows.map(r=>[r.path,r])),replacements=[],retired=[];
 for(const path of packagePaths){
  if(baselineExclusion(path)||/\.(?:pdf|zip|rar|map)$/i.test(path))throw Error('Private or unsupported final asset '+path);
  const prior=baseMap.get(path);if(!prior)continue;
  const before=readFileSync(join(baseline,path)),after=readFileSync(join(packageRoot,path));
  if(hash(before)===hash(after))continue;
  if(!path.startsWith('course-engine/')&&!isApprovedUnifiedBaselineReplacement(path))throw Error('Unapproved retained entry change '+path);
  replacements.push({path,beforeGitBlob:prior.sha,beforeSHA256:hash(before),afterSHA256:hash(after)});
 }
 for(const r of rows)if(r.path.startsWith('course-engine/')&&!packagePaths.includes(r.path))retired.push(r.path);
 const protectedRows=rows.filter(r=>!r.path.startsWith('course-engine/')&&!baselineExclusion(r.path)&&!isApprovedUnifiedBaselineReplacement(r.path));
 mkdirSync(output,{recursive:true});
 for(const r of rows){
  if(r.path.startsWith('course-engine/')||baselineExclusion(r.path))continue;
  mkdirSync(join(output,r.path,'..'),{recursive:true});copyFileSync(join(baseline,r.path),join(output,r.path));
 }
 for(const path of packagePaths){mkdirSync(join(output,path,'..'),{recursive:true});copyFileSync(join(packageRoot,path),join(output,path));}
 for(const r of protectedRows)if(blob(readFileSync(join(output,r.path)))!==r.sha)throw Error('Retained legacy entry changed '+r.path);
 const files=walkFiles(output).map(path=>{const bytes=readFileSync(join(output,path));return {path,bytes:bytes.length,sha256:hash(bytes)};});
 for(const f of files)if(baselineExclusion(f.path)||/\.(?:pdf|zip|rar|map)$/i.test(f.path))throw Error('Private source in assembled website '+f.path);
 const result={schemaVersion:1,status:'frozen-candidate-awaiting-browser-verification',generatedAt:new Date().toISOString(),sourceCommit:manifest.sourceCommit,sourceDirty:false,sourceSnapshotSHA256:manifest.sourceSnapshot.sha256,buildProvenance:manifest.buildProvenance,productionCommit,productionTree,baselineFiles:rows.length,protectedPublicFiles:protectedRows.length,authorizedReplacements:replacements,retiredEnginePaths:retired,packageFiles:packagePaths.length,assembledFiles:files.length,inventorySHA256:hash(Buffer.from(JSON.stringify(files))),unifiedManifestSHA256:hash(manifestBytes),originalValidation:{originalAudioTracks:357,currentSourceFigures:150,auxiliaryIllustrations:438,sourceCommit:originalValidation.sourceCommit,inventorySHA256:originalValidation.inventorySHA256},rebuilt:false,output,files};
 if(report){mkdirSync(resolve(report,'..'),{recursive:true});writeFileSync(report,JSON.stringify(result,null,2)+'\n');}
 return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [baseline,legacyBaseline,packageRoot,output,report]=process.argv.slice(2);
 if(!report)throw Error('Usage: assemble-site CURRENT_BASELINE LEGACY_BASELINE FROZEN_PACKAGE OUTPUT REPORT');
 const result=assembleSite({repo:resolve(import.meta.dirname,'../../..'),baseline,legacyBaseline,packageRoot,output,report});
 console.log(JSON.stringify({sourceCommit:result.sourceCommit,productionCommit,assembledFiles:result.assembledFiles,protectedPublicFiles:result.protectedPublicFiles,retiredEnginePaths:result.retiredEnginePaths.length,inventorySHA256:result.inventorySHA256}));
}
