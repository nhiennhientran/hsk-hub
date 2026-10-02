import{readFileSync,existsSync,mkdirSync,copyFileSync,writeFileSync}from'node:fs';import{resolve,join}from'node:path';import{createHash}from'node:crypto';import{fileURLToPath}from'node:url';
import{walkFiles,hash,deploymentPath}from'./package-core.mjs';
const gitBlob=b=>createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
export function assembleProduction({baseline,packageRoot,baselineManifest,output,sourceCommit}){
 baseline=resolve(baseline);packageRoot=resolve(packageRoot);output=resolve(output);
 if(existsSync(output))throw Error('Production assembly destination must not exist');
 const b=JSON.parse(readFileSync(baselineManifest)),m=JSON.parse(readFileSync(join(packageRoot,'course-engine/release-manifest.json')));
 if(b.productionCommit!=='caeac03798b91095f6fb0916e3c0bfd908381f45'||b.productionTree!=='c4711eaf5707ba21a2aff705ed7e507b4474c127'||b.files.length!==1141)throw Error('Unknown protected baseline');
 if(m.sourceCommit!==sourceCommit||!['pilot','release'].includes(m.mode))throw Error('Wrong frozen package identity');
 const originals=walkFiles(baseline),expected=b.files.map(f=>f.path).sort();if(JSON.stringify(originals)!==JSON.stringify(expected))throw Error('Missing or extra production baseline files');
 for(const f of b.files){if(f.type!=='blob'||f.mode!=='100644'||gitBlob(readFileSync(join(baseline,f.path)))!==f.sha)throw Error('Protected baseline mismatch: '+f.path)}
 const changes=walkFiles(packageRoot),listed=m.files.map(f=>f.path).concat('course-engine/release-manifest.json').sort();if(JSON.stringify(changes)!==JSON.stringify(listed))throw Error('Unexpected frozen package files');
 for(const f of m.files){const data=readFileSync(join(packageRoot,f.path));if(!deploymentPath(f.path)||data.length!==f.bytes||hash(data)!==f.sha256)throw Error('Changed frozen file: '+f.path)}
 for(const path of changes)if(!deploymentPath(path)||(path!=='index.html'&&originals.includes(path)))throw Error('Unapproved production overwrite: '+path);
 mkdirSync(output,{recursive:true});
 for(const [dir,paths]of [[baseline,originals],[packageRoot,changes]])for(const path of paths){mkdirSync(join(output,path,'..'),{recursive:true});copyFileSync(join(dir,path),join(output,path))}
 const protectedFiles=b.files.filter(f=>f.path!=='index.html');for(const f of protectedFiles)if(gitBlob(readFileSync(join(output,f.path)))!==f.sha)throw Error('Protected output changed: '+f.path);
 for(const path of changes)if(hash(readFileSync(join(output,path)))!==hash(readFileSync(join(packageRoot,path))))throw Error('Frozen output changed');
 const expectedOutput=[...new Set([...originals,...changes])].sort();if(JSON.stringify(walkFiles(output))!==JSON.stringify(expectedOutput))throw Error('Unexpected assembled output');
 return{schemaVersion:1,productionBaseline:b.productionCommit,sourceCommit,mode:m.mode,protectedFiles:protectedFiles.length,packageFiles:changes.length,assembledFiles:expectedOutput.length,rebuilt:false,releaseManifestSha256:hash(readFileSync(join(packageRoot,'course-engine/release-manifest.json')))};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [baseline,packageRoot,baselineManifest,output,sourceCommit,report]=process.argv.slice(2);if(!report)throw Error('Usage: assemble-production BASELINE PACKAGE BASELINE_MANIFEST OUTPUT SOURCE_SHA REPORT');
 const result=assembleProduction({baseline,packageRoot,baselineManifest,output,sourceCommit});mkdirSync(resolve(report,'..'),{recursive:true});writeFileSync(report,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}
