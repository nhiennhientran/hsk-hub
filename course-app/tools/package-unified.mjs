import {existsSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {hash,walkFiles} from './package-core.mjs';
import {assertReleaseReadiness,assertTestedBuildInput,snapshotRuntimeSource} from './release-readiness.mjs';

export const protectedProduction='2da6a5c80c62d4ff5bdfa72a5bdb929b2b1ff3d4';
// Hash routes can select HSK1 in every unified entry. Activity pictures resolve
// against document.baseURI; textbook pictures/audio resolve against asset-base.
export const unifiedEntryDirectories=['','new-hsk1','new-hsk1/hsk1','new-hsk2','new-hsk2/hsk2','new-hsk3','new-hsk3/hsk3'];
const safePath=p=>typeof p==='string'&&!p.includes('\\')&&!p.startsWith('/')&&!p.split('/').some(x=>['','.','..'].includes(x));
export function unifiedOutputPath(p){
  if(!safePath(p))return false;
  return p==='index.html'||/^course-engine\//.test(p)||/^new-hsk([123])\/(?:index\.html|hsk\1\/(?:index|lesson|learning|lesson9-pilot)\.html)$/.test(p)||unifiedEntryDirectories.some(d=>p.startsWith((d?d+'/':'')+'source-activities/figures/'));
}
export function unifiedInputPath(p,figures=new Map(),illustrations=new Map()){
  if(!safePath(p))return false;
  return p==='index.html'||p==='content-manifest.json'||p==='course-assets/HANZI-PROVENANCE.json'||
    /^assets\/[\w.-]+\.(js|css|json)$/.test(p)||illustrations.has(p)||
    /^course-assets\/(?:hsk[23]\/audio\/\d+-[1-8]\.mp3|audio\/\d+-[1-7]\.mp3|hanzi\/[^/]+\.json|[A-Z-]+LICENSE\.txt|HANZI-[A-Z-]+\.txt)$/.test(p)||figures.has(p);
}
export function currentSourceFigures(repo){
  const result=new Map();
  for(let n=1;n<=15;n++){
    const file=join(repo,'hsk1-app/content/source-activities',n===4?'lesson-04-current.json':`lesson-${String(n).padStart(2,'0')}.json`);
    const lesson=JSON.parse(readFileSync(file,'utf8'));
    if(lesson.lesson!==n||lesson.schema!==1||!Array.isArray(lesson.figures))throw Error('Invalid current source catalogue '+n);
    for(const f of lesson.figures){
      if(f.kind!=='original-crop'||!/^figures\/[A-Za-z0-9][A-Za-z0-9_-]*\.png$/.test(f.file)||!/^[0-9a-f]{64}$/.test(f.sha256)||f.source?.textbookSHA256!==lesson.textbookSHA256)throw Error('Unapproved source figure '+n+'/'+f.id);
      const path='source-activities/'+f.file;
      if(result.has(path))throw Error('Duplicate source figure asset '+path);
      result.set(path,{lesson:n,id:f.id,sha256:f.sha256,printedPage:f.source.printedPage,pdfPage:f.source.pdfPage,textbookSHA256:lesson.textbookSHA256});
    }
  }
  if(result.size!==150)throw Error('Expected all 150 current reviewed source crops');
  return result;
}
export function currentAuxiliaryIllustrations(repo){
  const result=new Map();
  for(const level of [2,3])for(let n=1;n<=(level===2?15:18);n++){
    const lesson=JSON.parse(readFileSync(join(repo,'course-app/content',`hsk${level}`,`lesson-${String(n).padStart(2,'0')}.json`),'utf8'));
    for(const f of lesson.illustrationManifest??[]){
      if(f.publicationStatus!=='approved'||!/^illustrations\/[A-Za-z0-9_.-]+\.svg$/.test(f.file)||!/^[0-9a-f]{64}$/.test(f.assetSha256))throw Error('Unapproved auxiliary illustration '+f.id);
      if(result.has(f.file)&&result.get(f.file).sha256!==f.assetSha256)throw Error('Conflicting auxiliary illustration '+f.file);
      result.set(f.file,{sha256:f.assetSha256,originalTextbookImage:f.originalTextbookImage===true});
    }
  }
  if(result.size!==438)throw Error('Expected 438 approved auxiliary illustrations');
  return result;
}
export function assertUnifiedAcceptance(gate,source,{repo}={}){
  return assertReleaseReadiness(gate,source,{repo,scopes:runtimeSourceScopes});
}
export function unifiedEntryHTML(html,level,base,view='courses'){
  if(![1,2,3].includes(level)||!['courses','portal'].includes(view)||!['./course-engine/','../course-engine/','../../course-engine/'].includes(base)||!html?.includes('<meta name="hsk-level" content="2">')||!html.includes('<div id="app"></div>')||!html.includes('src="./assets/'))throw Error('Unrecognized unified build entry');
  return html.replace('<meta name="hsk-level" content="2">',`<meta name="hsk-level" content="${level}"><meta name="asset-base" content="${base}"><meta name="hsk-entry-view" content="${view}">`).replaceAll('"./assets/',`"${base}assets/`);
}
// sync-shared-assets also reads retained original audio and stroke data here.
// They must participate in both the clean-input check and the build snapshot.
export const runtimeSourceScopes=['course-app/src','course-app/content','course-app/public','course-app/tools','course-app/index.html','course-app/package.json','course-app/package-lock.json','course-app/vite.config.ts','course-app/tsconfig.json','hsk1-app/src','hsk1-app/content','hsk1-app/public','new-hsk1/hsk1/audio','new-hsk1/assets/hanzi-data'];
export function runtimeSourceDirty(repo){return !!execFileSync('git',['status','--porcelain','--',...runtimeSourceScopes],{cwd:repo,encoding:'utf8'}).trim();}
export function runtimeSourceSnapshot(repo){
  return snapshotRuntimeSource(repo,runtimeSourceScopes);
}
export function packageUnified({input,output,sourceCommit,figures,hsk1Tracks,sourceSnapshot,releaseReadiness,illustrations=new Map(),sourceDirty=false,mode='checkpoint',buildProvenance='prebuilt-diagnostic',assertStable=()=>{}}){
  input=resolve(input);output=resolve(output);
  if(!/^[0-9a-f]{40}$/.test(sourceCommit)||!['checkpoint','release'].includes(mode))throw Error('Invalid source identity or packaging mode');
  if(!(figures instanceof Map)||figures.size!==150)throw Error('Expected 150 current source crops');
  if(mode==='release'&&(sourceDirty||buildProvenance!=='built-from-recorded-worktree'))throw Error('Release requires a clean source and a verified build');
  if(mode==='release'&&(releaseReadiness?.phase!=='pre-publication'||releaseReadiness.publicationApproved!==false||releaseReadiness.deployed!==false||releaseReadiness.stage16!=='awaiting-authorization'||releaseReadiness.runtimeSourceSnapshotSHA256!==sourceSnapshot?.sha256))throw Error('Release requires validated pre-publication readiness');
  if(existsSync(output))throw Error('Frozen output must be new; never overwrite a tested artifact');
  const names=walkFiles(input),bytes=new Map();
  for(const path of names){if(!unifiedInputPath(path,figures,illustrations))throw Error('Unapproved public input '+path);bytes.set(path,readFileSync(join(input,path)));}
  const inputFiles=names.map(path=>({path,bytes:bytes.get(path).length,sha256:hash(bytes.get(path))}));
  if(mode==='release')assertTestedBuildInput(releaseReadiness,inputFiles);
  const manifest=JSON.parse(bytes.get('content-manifest.json')??'null');
  if(manifest?.schemaVersion!==1||manifest.lessons?.length!==33||manifest.lessons.filter(l=>l.level===2).length!==15||manifest.lessons.filter(l=>l.level===3).length!==18)throw Error('Course 2/3 content missing');
  if(mode==='release'&&manifest.mode!=='release')throw Error('Pilot content cannot enter a release');
  const tracks=[...(manifest.audio??[]),...hsk1Tracks.map(t=>({file:'course-assets/audio/'+t.id+'.mp3',bytes:t.bytes,sha256:t.sha256}))];
  if(tracks.length!==357||new Set(tracks.map(t=>t.file)).size!==357||names.filter(p=>p.endsWith('.mp3')).length!==357)throw Error('Expected 357 unique authorized original audio tracks');
  for(const t of tracks){const b=bytes.get(t.file);if(!b||b.length!==t.bytes||hash(b)!==t.sha256)throw Error('Original audio identity mismatch '+t.file);}
  for(const [path,f]of illustrations){const b=bytes.get(path);if(!b||hash(b)!==f.sha256)throw Error('Auxiliary illustration identity mismatch '+path);}
  for(const [path,figure]of figures){const b=bytes.get(path);if(!b||hash(b)!==figure.sha256)throw Error('Original crop identity mismatch '+path);}
  const provenance=JSON.parse(bytes.get('course-assets/HANZI-PROVENANCE.json')??'null');
  if(!Array.isArray(provenance?.characters)||!provenance.characters.length||new Set(provenance.characters.map(c=>c.character)).size!==provenance.characters.length)throw Error('Invalid handwriting provenance');
  if(names.filter(p=>/^course-assets\/hanzi\/.+\.json$/.test(p)).length!==provenance.characters.length)throw Error('Unexpected handwriting assets');
  for(const c of provenance.characters){const b=bytes.get('course-assets/hanzi/'+c.character+'.json');if(!b||hash(b)!==c.sha256)throw Error('Handwriting identity mismatch '+c.character);}
  const html=bytes.get('index.html')?.toString('utf8'),outputs=new Map();
  for(const [path,b]of bytes)if(path!=='index.html')outputs.set('course-engine/'+path,b);
  outputs.set('index.html',Buffer.from(unifiedEntryHTML(html,1,'./course-engine/','portal')));
  for(const level of [1,2,3]){
    outputs.set(`new-hsk${level}/index.html`,Buffer.from(unifiedEntryHTML(html,level,'../course-engine/')));
    outputs.set(`new-hsk${level}/hsk${level}/index.html`,Buffer.from(unifiedEntryHTML(html,level,'../../course-engine/')));
  }
  for(const file of ['lesson.html','learning.html','lesson9-pilot.html'])outputs.set('new-hsk1/hsk1/'+file,Buffer.from(unifiedEntryHTML(html,1,'../../course-engine/')));
  for(const dir of unifiedEntryDirectories)for(const path of figures.keys())outputs.set((dir?dir+'/':'')+path,bytes.get(path));
  const files=[...outputs].sort(([a],[b])=>a.localeCompare(b,'en')).map(([path,b])=>({path,bytes:b.length,sha256:hash(b)}));
  for(const f of files)if(!unifiedOutputPath(f.path))throw Error('Unscoped unified output '+f.path);
  const result={schemaVersion:2,mode,sourceCommit,protectedProduction,app:'hsk123-unified',sharedEngine:'course-engine',sourceDirty,buildProvenance,sourceSnapshot,...(mode==='release'?{releaseReadiness}:{}),lessons:48,entries:unifiedEntryDirectories,originalAudioTracks:tracks.length,originalSourceCrops:figures.size,auxiliaryIllustrations:[...illustrations].map(([path,f])=>({path,...f})),sourceFigures:[...figures].map(([path,f])=>({path,...f})),inputFiles,files};
  // Fail before output creation if either the source or frozen input drifted.
  assertStable();
  for(const path of names)if(hash(readFileSync(join(input,path)))!==hash(bytes.get(path)))throw Error('Build input changed during freeze '+path);
  if(JSON.stringify(walkFiles(input))!==JSON.stringify(names))throw Error('Build input paths changed during freeze');
  for(const [path,b]of outputs){mkdirSync(join(output,path,'..'),{recursive:true});writeFileSync(join(output,path),b);}
  writeFileSync(join(output,'course-engine/unified-release-manifest.json'),JSON.stringify(result,null,2)+'\n');
  return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=resolve(import.meta.dirname,'..'),repo=resolve(root,'..'),args=process.argv.slice(2),option=(n,d)=>{const i=args.indexOf(n);return i<0?d:args[i+1]};
  const actualCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),source=option('--source',actualCommit),release=args.includes('--release');
  const dirty=runtimeSourceDirty(repo);
  if(dirty&&(release||!args.includes('--allow-dirty-checkpoint')))throw Error('Commit the tested runtime before freezing; dirty checkpoints require explicit diagnostic flag');
  if(!/^[0-9a-f]{40}$/.test(source)||release&&source!==actualCommit)throw Error('Invalid source commit');
  execFileSync('git',['cat-file','-e',source+'^{commit}'],{cwd:repo});
  const gatePath=resolve(root,option('--gate','docs/unified-final-acceptance.json'));
  const gateBytes=release?readFileSync(gatePath):undefined;
  const releaseReadiness=release?{...assertUnifiedAcceptance(JSON.parse(gateBytes.toString('utf8')),source,{repo}),gateSHA256:hash(gateBytes)}:undefined;
  const before=runtimeSourceSnapshot(repo);
  if(release&&!args.includes('--build'))throw Error('Release requires --build and exact recorded source');
  if(args.includes('--build'))execFileSync('npm',['run','build','--','--outDir',resolve(root,option('--input','dist'))],{cwd:root,stdio:'inherit'});
  const assertStable=()=>{
    if(runtimeSourceSnapshot(repo).sha256!==before.sha256)throw Error('Runtime source changed during build or freeze');
    if(release){
      if(hash(readFileSync(gatePath))!==hash(gateBytes))throw Error('Release gate changed during build or freeze');
      assertUnifiedAcceptance(JSON.parse(gateBytes.toString('utf8')),source,{repo});
    }
  };assertStable();
  const result=packageUnified({input:resolve(root,option('--input','dist')),output:resolve(root,option('--output','unified-frozen')),sourceCommit:source,figures:currentSourceFigures(repo),illustrations:currentAuxiliaryIllustrations(repo),hsk1Tracks:JSON.parse(readFileSync(join(repo,'hsk1-app/content/media-references.json'),'utf8')).originalTracks,sourceSnapshot:before,releaseReadiness,sourceDirty:dirty,mode:release?'release':'checkpoint',buildProvenance:args.includes('--build')?'built-from-recorded-worktree':'prebuilt-diagnostic',assertStable});
  console.log(JSON.stringify({source,mode:result.mode,output:resolve(root,option('--output','unified-frozen')),files:result.files.length,lessons:48,sourceSnapshotSHA256:before.sha256,buildProvenance:result.buildProvenance},null,2));
}
