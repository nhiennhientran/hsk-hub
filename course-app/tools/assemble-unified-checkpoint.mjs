import {readFileSync,existsSync,mkdirSync,writeFileSync,copyFileSync} from 'node:fs';
import {resolve,join,posix} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {walkFiles,hash} from './package-core.mjs';
import {protectedProduction,unifiedOutputPath,unifiedInputPath,currentSourceFigures,currentAuxiliaryIllustrations,unifiedEntryDirectories} from './package-unified.mjs';
export const protectedProductionTree='34dc16aa1e042f5f6fc6ea6edb80b9b6926cb344';
const gitBlob=b=>createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
export function protectedBaselineManifest(repo){
  const tree=execFileSync('git',['rev-parse',protectedProduction+'^{tree}'],{cwd:repo,encoding:'utf8'}).trim();
  if(tree!==protectedProductionTree)throw Error('Wrong protected production Git tree');
  const rows=execFileSync('git',['ls-tree','-rz',protectedProduction],{cwd:repo,encoding:'utf8'}).split('\0').filter(Boolean).map(row=>{
    const [meta,path]=row.split('\t'),[mode,type,sha]=meta.split(' ');
    if(type!=='blob'||mode!=='100644'||path.startsWith('/')||path.includes('\\')||path.split('/').some(p=>['','.','..'].includes(p)))throw Error('Unsupported protected production path');
    return {path,mode,type,sha};
  });
  if(rows.length!==1446)throw Error('Protected production inventory is not complete');
  return {productionCommit:protectedProduction,productionTree:tree,files:rows};
}
export function baselineExclusion(path){
  if(/^\.github\//.test(path))return 'CI workflow source, not a student runtime dependency';
  if(/^tools\//.test(path))return 'Build/audit/test code and test results, not a student runtime dependency';
  if(/^qa\//.test(path))return 'Audit/browser automation and source staging, not a student runtime dependency';
  if(/^new-hsk1\/hsk1\/_audio-work\//.test(path))return 'Unserved original audio audit metadata, not a student runtime dependency';
  if(/\.(?:cjs|mjs|py|md)$/.test(path))return 'Developer test/report source, not a student runtime dependency';
  return undefined;
}
const mutableEntries=new Set(['index.html','course-engine/content-manifest.json',...[1,2,3].flatMap(n=>[`new-hsk${n}/index.html`,`new-hsk${n}/hsk${n}/index.html`]),...['lesson.html','learning.html','lesson9-pilot.html'].map(p=>'new-hsk1/hsk1/'+p)]);
export const isApprovedUnifiedBaselineReplacement=path=>mutableEntries.has(path);
export function assembleUnifiedCheckpoint({repo,baseline,packageRoot,output,report}){
  repo=resolve(repo);baseline=resolve(baseline);packageRoot=resolve(packageRoot);output=resolve(output);
  if(existsSync(output))throw Error('Assembly destination must not exist');
  const baselineManifest=protectedBaselineManifest(repo),baseFiles=walkFiles(baseline);
  if(JSON.stringify(baseFiles)!==JSON.stringify(baselineManifest.files.map(f=>f.path).sort()))throw Error('Missing or extra protected baseline files');
  const baselineBytes=new Map();
  for(const f of baselineManifest.files){const b=readFileSync(join(baseline,f.path));if(gitBlob(b)!==f.sha)throw Error('Protected baseline mismatch '+f.path);baselineBytes.set(f.path,b);}
  const manifestPath='course-engine/unified-release-manifest.json',manifestBytes=readFileSync(join(packageRoot,manifestPath)),m=JSON.parse(manifestBytes);
  if(m.schemaVersion!==2||m.mode!=='checkpoint'||m.protectedProduction!==protectedProduction||m.app!=='hsk123-unified'||m.lessons!==48||!/^[0-9a-f]{40}$/.test(m.sourceCommit)||!m.sourceSnapshot?.sha256)throw Error('Wrong unified checkpoint identity');
  const figures=currentSourceFigures(repo),illustrations=currentAuxiliaryIllustrations(repo),approvedCrops=new Map();
  for(const [path,f]of figures){approvedCrops.set('course-engine/'+path,f.sha256);for(const dir of unifiedEntryDirectories)approvedCrops.set((dir?dir+'/':'')+path,f.sha256);}
  const approvedPath=path=>mutableEntries.has(path)||approvedCrops.has(path)||path.startsWith('course-engine/')&&unifiedInputPath(path.slice('course-engine/'.length),figures,illustrations)&&path!=='course-engine/index.html';
  const paths=walkFiles(packageRoot),listed=m.files.map(f=>f.path).concat(manifestPath).sort();
  if(new Set(listed).size!==listed.length||JSON.stringify(paths)!==JSON.stringify(listed))throw Error('Missing or extra frozen checkpoint files');
  const changes=new Map();
  for(const f of m.files){const b=readFileSync(join(packageRoot,f.path));if(!unifiedOutputPath(f.path)||!approvedPath(f.path)||b.length!==f.bytes||hash(b)!==f.sha256)throw Error('Frozen checkpoint mismatch '+f.path);if(approvedCrops.has(f.path)&&hash(b)!==approvedCrops.get(f.path))throw Error('Unapproved frozen original crop '+f.path);if(f.path.startsWith('course-engine/illustrations/')&&hash(b)!==illustrations.get(f.path.slice('course-engine/'.length))?.sha256)throw Error('Unapproved frozen auxiliary illustration '+f.path);changes.set(f.path,b);}
  changes.set(manifestPath,manifestBytes);
  // The candidate manifest cannot authorize deleting mandatory consumer assets.
  const requiredEntries=['index.html',...[1,2,3].flatMap(n=>[`new-hsk${n}/index.html`,`new-hsk${n}/hsk${n}/index.html`]),...['lesson.html','learning.html','lesson9-pilot.html'].map(p=>'new-hsk1/hsk1/'+p)];
  const required=new Set([...requiredEntries,...approvedCrops.keys(),...[...illustrations.keys()].map(p=>'course-engine/'+p),'course-engine/content-manifest.json','course-engine/course-assets/HANZI-PROVENANCE.json','course-engine/course-assets/HANZI-DATA-LICENSE.txt','course-engine/course-assets/HANZI-WRITER-LICENSE.txt']);
  const one=JSON.parse(readFileSync(join(repo,'hsk1-app/content/textbook.json'),'utf8'));
  const characters=new Set(one.lessons.flatMap(l=>[l.hanzi.chars,...l.vocab.map(w=>w.zh)]).join('').match(/\p{Script=Han}/gu)??[]);
  for(const level of [2,3])for(let n=1;n<=(level===2?15:18);n++){
    const lesson=JSON.parse(readFileSync(join(repo,'course-app/content',`hsk${level}`,`lesson-${String(n).padStart(2,'0')}.json`),'utf8'));
    for(const c of lesson.vocabulary.flatMap(w=>w.zh.match(/\p{Script=Han}/gu)??[]))characters.add(c);
  }
  for(const c of characters)required.add('course-engine/course-assets/hanzi/'+c+'.json');
  const audio=[...JSON.parse(readFileSync(join(repo,'course-app/content/audio-manifest.json'),'utf8')).tracks,...JSON.parse(readFileSync(join(repo,'hsk1-app/content/media-references.json'),'utf8')).originalTracks.map(t=>({...t,file:'course-assets/audio/'+t.id+'.mp3'}))];
  if(audio.length!==357)throw Error('Invalid original audio source registry');
  for(const t of audio){const path='course-engine/'+t.file;required.add(path);const b=changes.get(path);if(!b||b.length!==t.bytes||hash(b)!==t.sha256)throw Error('Missing or changed required original audio '+path);}
  for(const path of required)if(!changes.has(path))throw Error('Missing required unified output '+path);
  const provenancePath='course-engine/course-assets/HANZI-PROVENANCE.json',provenanceBytes=changes.get(provenancePath);
  const trustedProvenance=readFileSync(join(repo,'course-app/public/course-assets/HANZI-PROVENANCE.json'));
  if(hash(provenanceBytes)!==hash(trustedProvenance))throw Error('Untrusted frozen handwriting provenance');
  const provenance=JSON.parse(provenanceBytes);
  if(!Array.isArray(provenance.characters)||new Set(provenance.characters.map(c=>c.character)).size!==provenance.characters.length||JSON.stringify(provenance.characters.map(c=>c.character).sort())!==JSON.stringify([...characters].sort()))throw Error('Wrong frozen handwriting character registry');
  for(const c of provenance.characters){
    const path='course-engine/course-assets/hanzi/'+c.character+'.json',b=changes.get(path);
    if(!b||hash(b)!==c.sha256)throw Error('Frozen handwriting identity mismatch '+path);
    const d=JSON.parse(b);
    if(!Array.isArray(d.strokes)||!d.strokes.length||!d.strokes.every(p=>typeof p==='string'&&p.trim())||!Array.isArray(d.medians)||d.medians.length!==d.strokes.length||!d.medians.every(s=>Array.isArray(s)&&s.length>1&&s.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))))throw Error('Invalid frozen handwriting structure '+path);
  }
  for(const name of ['HANZI-DATA-LICENSE.txt','HANZI-WRITER-LICENSE.txt'])if(hash(changes.get('course-engine/course-assets/'+name))!==hash(readFileSync(join(repo,'hsk1-app/public/course-assets',name))))throw Error('Frozen handwriting license identity mismatch '+name);

  if(!Array.isArray(m.inputFiles)||new Set(m.inputFiles.map(f=>f.path)).size!==m.inputFiles.length)throw Error('Invalid frozen input inventory');
  for(const f of m.inputFiles){
    if(!unifiedInputPath(f.path,figures,illustrations))throw Error('Invalid frozen input path '+f.path);
    if(f.path==='index.html')continue;
    const b=changes.get('course-engine/'+f.path);if(!b||b.length!==f.bytes||hash(b)!==f.sha256)throw Error('Missing or changed frozen engine input '+f.path);
  }
  // Validate actual static bundle dependencies, rather than trusting m.files alone.
  const requireDependency=(path,owner)=>{if(!changes.has(path))throw Error('Missing required bundle dependency '+path+' from '+owner);};
  for(const path of requiredEntries){
    const html=changes.get(path).toString('utf8');
    for(const [,ref]of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css)(?:[?#][^"]*)?)"/g)){
      const url=new URL(ref,'https://checkpoint.invalid/'+path);if(url.origin==='https://checkpoint.invalid')requireDependency(decodeURIComponent(url.pathname.slice(1)),path);
    }
  }
  for(const [path,b]of changes)if(/^course-engine\/assets\/.+\.js$/.test(path)){
    for(const [,ref]of b.toString('utf8').matchAll(/["'`]((?:\.\/|assets\/)[A-Za-z0-9_./-]+\.(?:js|css))["'`]/g)){
      const target=ref.startsWith('assets/')?'course-engine/'+ref:posix.normalize(posix.join(posix.dirname(path),ref));requireDependency(target,path);
    }
    // Vite also emits bare JSON/media names through new URL(`asset`,import.meta.url).
    for(const [,quote,ref]of b.toString('utf8').matchAll(/new URL\(\s*(["'`])([^"'`]+)\1\s*,\s*import\.meta\.url\s*\)/g)){
      if(ref.includes('${'))continue; // Dynamic catalogue paths are required above.
      const url=new URL(ref,'https://checkpoint.invalid/'+path);
      if(url.origin==='https://checkpoint.invalid'){
        const target=decodeURIComponent(url.pathname.slice(1));
        if(target.endsWith('/')){if(![...changes.keys()].some(p=>p.startsWith(target)))throw Error('Missing required bundle directory '+target+' from '+path);}
        else requireDependency(target,path);
      }
    }
  }

  const exclusions=baselineManifest.files.filter(f=>baselineExclusion(f.path)).map(f=>({...f,reason:baselineExclusion(f.path)})),replacements=[],identical=[];
  for(const [path,b]of changes){
    if(baselineBytes.has(path)){
      if(hash(baselineBytes.get(path))===hash(b)){identical.push(path);continue;}
      if(!mutableEntries.has(path))throw Error('Unapproved baseline overwrite '+path);
      replacements.push({path,beforeGitBlob:gitBlob(baselineBytes.get(path)),beforeSHA256:hash(baselineBytes.get(path)),afterSHA256:hash(b),reason:path==='course-engine/content-manifest.json'?'New unified runtime content identity':'Authorized unified portal/course entry'});
    }
  }
  const protectedRows=baselineManifest.files.filter(f=>!baselineExclusion(f.path)&&!replacements.some(r=>r.path===f.path));
  // All validation completes before any assembled directory is created.
  mkdirSync(output,{recursive:true});
  for(const f of baselineManifest.files.filter(f=>!baselineExclusion(f.path))){mkdirSync(join(output,f.path,'..'),{recursive:true});copyFileSync(join(baseline,f.path),join(output,f.path));}
  for(const [path,b]of changes){mkdirSync(join(output,path,'..'),{recursive:true});writeFileSync(join(output,path),b);}
  for(const f of protectedRows)if(gitBlob(readFileSync(join(output,f.path)))!==f.sha)throw Error('Preserved baseline byte mismatch '+f.path);
  const files=walkFiles(output).map(path=>{const b=readFileSync(join(output,path));return{path,bytes:b.length,sha256:hash(b)};});
  for(const path of files.map(f=>f.path))if(baselineExclusion(path)||/\.(?:pdf|zip|rar|map)$/i.test(path))throw Error('Private source entered public checkpoint '+path);
  const inventorySHA256=hash(Buffer.from(JSON.stringify(files)));
  const result={schemaVersion:1,status:'assembled-checkpoint-not-release',generatedAt:new Date().toISOString(),sourceCommit:m.sourceCommit,sourceDirty:m.sourceDirty,sourceSnapshotSHA256:m.sourceSnapshot.sha256,buildProvenance:m.buildProvenance,productionCommit:protectedProduction,productionTree:protectedProductionTree,baselineFiles:baselineManifest.files.length,baselineUnservedExclusions:exclusions,authorizedReplacements:replacements,identicalExistingPackagePaths:identical,protectedPublicFiles:protectedRows.length,packageFiles:paths.length,assembledFiles:files.length,inventorySHA256,unifiedManifestSHA256:hash(manifestBytes),rebuilt:false,output,files};
  if(report){mkdirSync(resolve(report,'..'),{recursive:true});writeFileSync(report,JSON.stringify(result,null,2)+'\n');}
  return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [baseline,packageRoot,output,report]=process.argv.slice(2);
  if(!report)throw Error('Usage: assemble-unified-checkpoint BASELINE FROZEN_PACKAGE OUTPUT PRIVATE_REPORT');
  const r=assembleUnifiedCheckpoint({repo:resolve(import.meta.dirname,'../..'),baseline,packageRoot,output,report});
  console.log(JSON.stringify({status:r.status,sourceCommit:r.sourceCommit,baselineFiles:r.baselineFiles,baselineUnservedExclusions:r.baselineUnservedExclusions.length,authorizedReplacements:r.authorizedReplacements.length,protectedPublicFiles:r.protectedPublicFiles,assembledFiles:r.assembledFiles,inventorySHA256:r.inventorySHA256,output:r.output},null,2));
}
