import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,rmSync,openSync,closeSync} from 'node:fs';
import {resolve,join,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {hash,walkFiles} from '../../../tools/package-core.mjs';
import {runtimeSourceSnapshot,protectedProduction,runtimeSourceScopes} from '../../../tools/package-unified.mjs';
import {protectedProductionTree,protectedBaselineManifest,baselineExclusion} from '../../../tools/assemble-unified-checkpoint.mjs';
import {snapshotRuntimeSource} from '../../../tools/release-readiness.mjs';

// This wrapper invokes the existing CHECKPOINT tools. It never writes a final
// acceptance certificate, invokes --release, or changes publication authority.
const course=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const repo=resolve(course,'..');
const browser=process.env.HSK_PHASE2_BROWSER??'local';
assert.match(browser,/^[a-z0-9_-]+$/,'Unsafe output namespace');
const output=join(course,'.repro-output/continue-phase2',browser,'package');
assert.ok(!existsSync(output),'Use a fresh browser output directory; existing artifacts are never overwritten');
mkdirSync(join(output,'logs'),{recursive:true});
const paths=Object.fromEntries(['dist','unified-frozen','unified-site','standalone-dist','baseline-protected'].map(name=>[name,join(output,name)]));
const commands=[];
const execute=(label,command,args,cwd=course)=>{
  const log=join(output,'logs',label+'.log');
  const fd=openSync(log,'wx');
  let status=0;
  console.log('START '+label);
  try {execFileSync(command,args,{cwd,stdio:['ignore',fd,fd],env:process.env});}
  catch(error){status=error.status??-1;throw error;}
  finally {closeSync(fd);const bytes=readFileSync(log);commands.push({label,command,args,cwd:relative(repo,cwd)||'.',exitCode:status,log:relative(course,log),bytes:bytes.length,sha256:hash(bytes)});writeFileSync(join(output,'commands.json'),JSON.stringify(commands,null,2)+'\n');console.log((status===0?'PASS ':'FAIL ')+label);}
};
const currentCommit=()=>execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
const commit=currentCommit();
const hsk1Registry=JSON.parse(readFileSync(join(repo,'hsk1-app/content/official-vi-registry.json'),'utf8'));
const sharedRegistry=JSON.parse(readFileSync(join(course,'content/official-vi-registry.json'),'utf8'));
assert.equal(hsk1Registry.active,null,'This engineering stage must keep official VI inactive');
assert.deepEqual(sharedRegistry.courses,{hsk2:null,hsk3:null},'This engineering stage must keep official VI inactive');
const scopes=[...new Set([...runtimeSourceScopes,'hsk1-app/tools','hsk1-app/review','hsk1-app/index.html','hsk1-app/package.json','hsk1-app/package-lock.json','hsk1-app/vite.config.ts','hsk1-app/tsconfig.json','new-hsk1/hsk1/auth-patch.js'])];
const before=runtimeSourceSnapshot(repo),buildInputsBefore=snapshotRuntimeSource(repo,scopes);
assert.equal(execFileSync('git',['status','--porcelain','--',...scopes],{cwd:repo,encoding:'utf8'}).trim(),'','Build inputs must be clean; commit the candidate first');
writeFileSync(join(output,'build-inputs-before.json'),JSON.stringify({sourceCommit:commit,scopes,...buildInputsBefore},null,2)+'\n');
const acceptance=join(course,'docs/unified-final-acceptance.json');
const gateBefore=existsSync(acceptance)?hash(readFileSync(acceptance)):null;
try {
  execute('build-unified-checkpoint',process.execPath,['tools/package-unified.mjs','--build','--input',paths.dist,'--output',paths['unified-frozen']]);
  // The archive is accepted only after checking every Git-tree entry's mode,
  // safe path and fixed production identity. The assembler then checks bytes.
  protectedBaselineManifest(repo);
  const archive=join(output,'baseline.tar');
  execute('archive-protected-baseline','git',['archive','--format=tar','--output='+archive,protectedProduction],repo);
  mkdirSync(paths['baseline-protected']);
  execute('extract-protected-baseline','tar',['-xf',archive,'-C',paths['baseline-protected']]);
  rmSync(archive);
  execute('assemble-draft-checkpoint',process.execPath,['tools/assemble-unified-checkpoint.mjs',paths['baseline-protected'],paths['unified-frozen'],paths['unified-site'],join(output,'assembly.json')]);
  // The standalone compiled HSK1 host is a separate engineering companion.
  // Existing build:release audits use hard-coded hsk1-app/dist, so they cannot
  // certify this alternate outDir. Audit actual private maps here, then strip
  // them using the same public-artifact transform as prepare-public-dist.
  execute('build-standalone-private','npm',['run','build','--','--outDir',paths['standalone-dist']],join(repo,'hsk1-app'));
  const standalone=paths['standalone-dist'];
  const forbidden=/(?:learning-integrated|app-core|app-practice|auth-patch|textbook-[\w-]*corrections|tts-only|stage[23]\/app|stage3\/player|features\/entry\.ts|teacher[-_](?:answers?|reference))/i;
  const sourcePaths=new Map();
  const privateMaps=[];
  for(const path of walkFiles(standalone).filter(p=>p.endsWith('.map'))){
    const full=join(standalone,path),bytes=readFileSync(full),map=JSON.parse(bytes);
    assert.ok(Array.isArray(map.sources),'Malformed private source map');
    privateMaps.push({path,bytes:bytes.length,sha256:hash(bytes),sources:map.sources.length});
    for(const source of map.sources){
      const actual=resolve(dirname(full),source.split('?')[0]);
      const repoPath=relative(repo,actual).replaceAll('\\','/');
      assert.match(repoPath,/^hsk1-app\/(?:src|content)\//,'Non-candidate standalone source: '+repoPath);
      assert.doesNotMatch(repoPath,forbidden);
      sourcePaths.set(repoPath,{path:repoPath,sha256:hash(readFileSync(actual))});
    }
  }
  assert.ok(privateMaps.length>0&&sourcePaths.size>0,'Private source provenance missing');
  writeFileSync(join(output,'standalone-private-source-audit.json'),JSON.stringify({sourceCommit:commit,maps:privateMaps,sources:[...sourcePaths.values()].sort((a,b)=>a.path.localeCompare(b.path))},null,2)+'\n');
  for(const path of walkFiles(standalone)){
    const full=join(standalone,path);
    if(path.endsWith('.map'))rmSync(full);
    else if(/\.(?:js|css)$/.test(path)){
      const bytes=readFileSync(full,'utf8');
      const stripped=bytes.replace(/\n?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?/g,'\n').replace(/\/\*# sourceMappingURL=[\s\S]*?\*\//g,'');
      if(bytes!==stripped)writeFileSync(full,stripped);
    }
  }
  const html=readFileSync(join(standalone,'index.html'),'utf8');
  for(const alias of ['lesson.html','learning.html','lesson9-pilot.html'])assert.equal(readFileSync(join(standalone,alias),'utf8'),html,'Standalone one-app alias');
  assert.equal((html.match(/<script\b/g)??[]).length,1);
  assert.match(html,/<script type="module"/);
  const legacy=readFileSync(join(repo,'new-hsk1/hsk1/auth-patch.js'),'utf8');
  const signature=legacy.match(/const SIG='([0-9a-f.]+)'/)?.[1];
  assert.ok(signature,'Negative credential fixture missing');
  const password=signature.split('.').map(hex=>String.fromCodePoint(parseInt(hex,16))).join('');
  for(const path of walkFiles(standalone)){
    assert.doesNotMatch(path,forbidden,'Legacy/teacher artifact');
    assert.doesNotMatch(path,/\.(?:pdf|zip|rar|map)$/i,'Private source artifact');
    if(!/\.(?:js|css|html|json|txt)$/.test(path))continue;
    const text=readFileSync(join(standalone,path),'utf8');
    assert.ok(!text.includes(signature)&&!text.includes(password),'Credential leak in '+path);
    assert.doesNotMatch(text,/sourceMappingURL=|PASSWORD_SIGNATURE|learning-integrated\.js|createEntryModule|stopExternal|window\.(?:HSK1Stage2|HSK1Stage3|HSKLearning)/,'Debug/legacy marker in '+path);
  }
  const media=JSON.parse(readFileSync(join(repo,'hsk1-app/content/media-references.json'),'utf8'));
  assert.equal(media.originalTracks.length,93);
  for(const track of media.originalTracks){const bytes=readFileSync(join(standalone,'course-assets/audio',track.id+'.mp3'));assert.equal(bytes.length,track.bytes);assert.equal(hash(bytes),track.sha256);}
  const assets=walkFiles(join(repo,'hsk1-app/public'));
  for(const path of assets)assert.deepEqual(readFileSync(join(standalone,path)),readFileSync(join(repo,'hsk1-app/public',path)),'Standalone public source byte binding: '+path);
  const book=JSON.parse(readFileSync(join(repo,'hsk1-app/content/textbook.json'),'utf8'));
  const supplement=JSON.parse(readFileSync(join(repo,'hsk1-app/review/hanzi-supplement.json'),'utf8'));
  const supplements=new Map(supplement.entries.map(e=>[e.character,e]));
  const characters=new Set(book.lessons.flatMap(l=>[l.hanzi.chars,...l.vocab.map(v=>v.zh)]).join('').match(/\p{Script=Han}/gu)??[]);
  assert.equal(characters.size,267);
  for(const character of characters){const entry=supplements.get(character),source=entry?join(repo,'hsk1-app',entry.file):join(repo,'new-hsk1/assets/hanzi-data',character+'.json');assert.deepEqual(readFileSync(join(standalone,'course-assets/hanzi',character+'.json')),readFileSync(source),'Standalone Hanzi source binding');}
  const manifestBytes=readFileSync(join(paths['unified-site'],'course-engine/unified-release-manifest.json'));
  const manifest=JSON.parse(manifestBytes),assembly=JSON.parse(readFileSync(join(output,'assembly.json'),'utf8'));
  assert.equal(manifest.mode,'checkpoint');assert.equal(manifest.sourceCommit,commit);assert.equal(manifest.sourceDirty,false);assert.equal(manifest.sourceSnapshot.sha256,before.sha256);
  const inventory=root=>walkFiles(root).map(path=>{const bytes=readFileSync(join(root,path));return{path,bytes:bytes.length,sha256:hash(bytes)};});
  const unifiedFiles=inventory(paths['unified-site']),standaloneFiles=inventory(standalone);
  assert.deepEqual(unifiedFiles,assembly.files,'Complete assembled inventory');
  assert.equal(hash(Buffer.from(JSON.stringify(unifiedFiles))),assembly.inventorySHA256);
  assert.equal(hash(manifestBytes),assembly.unifiedManifestSHA256);
  const baseline=protectedBaselineManifest(repo),replacements=new Set(assembly.authorizedReplacements.map(r=>r.path));
  let preserved=0,hsk4=0;
  for(const file of baseline.files){if(baselineExclusion(file.path)||replacements.has(file.path))continue;const bytes=readFileSync(join(paths['unified-site'],file.path));assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),file.sha);preserved++;if(/^(?:hsk4|hsk4up|new-hsk4)\//.test(file.path))hsk4++;}
  assert.equal(preserved,assembly.protectedPublicFiles);assert.equal(baseline.files.length,1446);assert.equal(assembly.baselineUnservedExclusions.length,55);assert.equal(replacements.size,11);assert.equal(preserved,1380);
  const after=runtimeSourceSnapshot(repo),buildInputsAfter=snapshotRuntimeSource(repo,scopes);
  assert.equal(currentCommit(),commit,'HEAD changed while building');assert.deepEqual(after,before,'Unified runtime changed while building');assert.deepEqual(buildInputsAfter,buildInputsBefore,'Build inputs changed while building');
  assert.equal(existsSync(acceptance)?hash(readFileSync(acceptance)):null,gateBefore,'Final acceptance certificate must remain unchanged');
  writeFileSync(join(output,'build-inputs-after.json'),JSON.stringify({sourceCommit:commit,scopes,...buildInputsAfter},null,2)+'\n');
  writeFileSync(join(output,'standalone-file-inventory.json'),JSON.stringify(standaloneFiles,null,2)+'\n');
  const result={schemaVersion:1,status:'DRAFT-ENGINEERING-CHECKPOINT-NOT-RELEASE',sourceCommit:commit,generatedAt:new Date().toISOString(),publicationApproved:false,deployed:false,officialVIActivated:false,mode:'checkpoint',semanticAcceptance:'NOT_PERFORMED_BY_THIS_TOOL',runtimeSourceSHA256:before.sha256,buildInputSourceSHA256:buildInputsBefore.sha256,sourceBeforeAfterEqual:true,finalAcceptanceCertificateUnchanged:true,productionCommit:protectedProduction,productionTree:protectedProductionTree,baselineFiles:1446,excludedDeveloperFiles:55,authorizedEntryReplacements:11,protectedPublicFiles:preserved,protectedHSK4Files:hsk4,unified:{root:relative(course,paths['unified-site']),files:unifiedFiles.length,inventorySHA256:assembly.inventorySHA256,manifestSHA256:hash(manifestBytes),frozenFiles:manifest.files.length+1,originalAudioTracks:manifest.originalAudioTracks,originalSourceCrops:manifest.originalSourceCrops,auxiliaryIllustrations:manifest.auxiliaryIllustrations.length},standalone:{root:relative(course,standalone),files:standaloneFiles.length,inventorySHA256:hash(Buffer.from(JSON.stringify(standaloneFiles))),indexSHA256:hash(Buffer.from(html)),privateSourceMapsAudited:privateMaps.length,candidateSourceFilesAudited:sourcePaths.size,publicMaps:0,publicCredentialLeaks:0,originalAudioTracksVerified:93,requiredHanziVerified:267,releaseCertification:'NOT_RUN:alternate-output engineering companion'},commands};
  writeFileSync(join(output,'package-summary.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}catch(error){writeFileSync(join(output,'failure.json'),JSON.stringify({status:'FAILED-NOT-RELEASE',sourceCommit:commit,error:error.message,commands},null,2)+'\n');throw error;}
