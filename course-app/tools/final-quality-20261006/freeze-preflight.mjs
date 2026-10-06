import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {validatePrecisionManifest,canonicalPrecisionJSON,canonicalPrecisionTrack,precisionSHA256,nonSpokenStageDirection} from '../../src/precision-contract.ts';
import {runtimeSourceDirty,runtimeSourceSnapshot,protectedProduction} from '../package-unified.mjs';
import {productionCommit,productionTree} from './assemble-site.mjs';
import {hash} from '../package-core.mjs';
import {finalSpecFiles,finalBrowserCases} from './freeze-contract.mjs';
import {requireCompleteReview} from './build-precision-manifest.mjs';
export const repo=resolve(import.meta.dirname,'../../..');
const read=file=>readFileSync(join(repo,file));
const json=file=>JSON.parse(read(file));
const relativeFile=file=>{assert.ok(typeof file==='string'&&!file.startsWith('/')&&!file.includes('\\')&&file.split('/').every(part=>part&&part!=='.'&&part!=='..'),'Unsafe source report path');return file;};
export async function preflight(requestFile){
 const request=json(relativeFile(requestFile));
 assert.equal(request.schemaVersion,1);assert.equal(request.status,'final-precision-accepted-request-freeze');
 assert.equal(request.productionCommit,productionCommit);assert.equal(request.productionTree,productionTree);
 assert.equal(request.browserCasesPerEngine,finalBrowserCases);assert.equal(request.lessons,48);
 assert.equal(request.stagingOnly,true);assert.equal(request.publicationApproved,true);
 const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),sourceTree=execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:repo,encoding:'utf8'}).trim();
 if(process.env.GITHUB_SHA)assert.equal(sourceCommit,process.env.GITHUB_SHA);
 assert.equal(runtimeSourceDirty(repo),false,'Final runtime source is dirty');
 assert.equal(execFileSync('git',['status','--porcelain','--','course-app/tests/final-quality','.github/workflows/hsk-final-freeze-20261006.yml'],{cwd:repo,encoding:'utf8'}).trim(),'','Final acceptance definitions changed outside recorded source');
 assert.equal(execFileSync('git',['rev-parse',productionCommit+'^{tree}'],{cwd:repo,encoding:'utf8'}).trim(),productionTree);
 execFileSync('git',['cat-file','-e',protectedProduction+'^{commit}'],{cwd:repo});
 const manifestFile='course-app/content/audio-precision-20261006.json',targetFile='course-app/content/audio-precision-targets-20261006.json',authorityFile='course-app/content/audio-precision-authority-20261006.json';
 const pin=read('course-app/src/precision-loader.ts').toString().match(/export const precisionAuthoritySHA256=['"]([a-f0-9]{64})['"]/u)?.[1];
 assert.ok(pin,'Final accepted precision authority pin is absent');assert.equal(request.precisionAuthoritySHA256,pin,'Freeze request does not bind the runtime authority');
 const manifestText=read(manifestFile).toString(),targetCatalogText=read(targetFile).toString(),authority=json(authorityFile),catalog=JSON.parse(targetCatalogText);
 const other=json('course-app/content/audio-manifest.json').tracks,h1=json('hsk1-app/content/media-references.json').originalTracks;
 const sourceRows=[...other.map(track=>({file:track.file,sourceFile:'course-app/public/'+track.file,sha256:track.sha256,bytes:track.bytes,duration:track.duration})),...h1.map(track=>({file:track.path,sourceFile:track.path,sha256:track.sha256,bytes:track.bytes,duration:track.duration_s}))];
 assert.equal(sourceRows.length,357);assert.equal(new Set(sourceRows.map(row=>canonicalPrecisionTrack(row.file))).size,357);
 for(const row of sourceRows){const bytes=read(relativeFile(row.sourceFile));assert.equal(bytes.length,row.bytes,'Original track length differs: '+row.sourceFile);assert.equal(hash(bytes),row.sha256,'Original track SHA differs: '+row.sourceFile);}
 assert.equal(catalog.targets.length,2540);assert.equal(new Set(catalog.targets.map(row=>row.id)).size,2540);
 for(const source of catalog.sourceFiles){assert.equal(hash(read(relativeFile(source.file))),source.sha256,'Precision source teaching bytes differ: '+source.file);}
 const accepted=await validatePrecisionManifest({manifestText,targetCatalogText,authority,authoritySHA256:pin,sources:sourceRows});
 assert.equal(accepted.length,2539);assert.equal(new Set(accepted.map(row=>`${row.level}:${row.lesson}`)).size,48);
 assert.equal(authority.nonSpokenAnnotations.length,1);assert.equal(authority.nonSpokenAnnotations[0].id,nonSpokenStageDirection.id);
 const independentFile=relativeFile(request.precisionIndependentReportFile),independentBytes=read(independentFile);
 assert.equal(hash(independentBytes),authority.independentReportSHA256,'Final independent source/frame report is absent or differs');
 const independent=JSON.parse(independentBytes);
 requireCompleteReview(independent,hash(Buffer.from(targetCatalogText)));
 const fields=Object.keys(authority.acceptedSourceFrameGates[0]);
 const selected=independent.acceptedSourceFrameGates.map(row=>Object.fromEntries(fields.map(key=>[key,row[key]??null]))).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 assert.equal(canonicalPrecisionJSON(selected),canonicalPrecisionJSON(authority.acceptedSourceFrameGates),'Final runtime rows differ from the independent final accepted decisions');
 assert.equal(await precisionSHA256(canonicalPrecisionJSON(authority)),pin);
 const specs=finalSpecFiles.map(file=>({file:'course-app/tests/final-quality/'+file,sha256:hash(read('course-app/tests/final-quality/'+file))}));
 return {schemaVersion:1,status:'passed-final-freeze-preflight',sourceCommit,sourceTree,productionCommit,productionTree,legacyProvenanceCommit:protectedProduction,sourceDirty:false,sourceSnapshot:runtimeSourceSnapshot(repo),browserCasesPerEngine:finalBrowserCases,lessons:48,originalAudioTracks:357,precision:{rows:2539,nonSpokenAnnotations:1,authorityFile,canonicalAuthoritySHA256:pin,authorityFileSHA256:hash(read(authorityFile)),manifestFile,manifestSHA256:hash(Buffer.from(manifestText)),targetFile,targetCatalogSHA256:hash(Buffer.from(targetCatalogText)),independentReportFile:independentFile,independentReportSHA256:hash(independentBytes)},requestFile,requestSHA256:hash(read(requestFile)),specs,nativeAccepted:false,published:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [requestFile,report]=process.argv.slice(2);assert.ok(requestFile,'Freeze request source file required');const result=await preflight(requestFile);
 if(report){mkdirSync(resolve(report,'..'),{recursive:true});writeFileSync(report,JSON.stringify(result,null,2)+'\n');}
 console.log(JSON.stringify({status:result.status,sourceCommit:result.sourceCommit,precisionAuthoritySHA256:result.precision.canonicalAuthoritySHA256,rows:2539,originalAudioTracks:357}));
}
