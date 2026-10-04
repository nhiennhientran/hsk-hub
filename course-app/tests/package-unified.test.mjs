import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync,symlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {hash} from '../tools/package-core.mjs';
import {packageUnified,unifiedEntryDirectories,unifiedEntryHTML,unifiedInputPath,assertUnifiedAcceptance,currentSourceFigures,currentAuxiliaryIllustrations,runtimeSourceDirty,runtimeSourceSnapshot} from '../tools/package-unified.mjs';
import {protectedBaselineManifest,baselineExclusion} from '../tools/assemble-unified-checkpoint.mjs';
const html='<!doctype html><html><head><meta name="hsk-level" content="2"><script type="module" src="./assets/index-a.js"></script><link rel="stylesheet" href="./assets/index-a.css"></head><body><div id="app"></div></body></html>';
function fixture(){
  const root=mkdtempSync(join(tmpdir(),'hsk-unified-package-')),input=join(root,'input'),output=join(root,'output'),figures=new Map(),tracks=[],hsk1Tracks=[];
  const write=(p,b)=>{mkdirSync(join(input,p,'..'),{recursive:true});writeFileSync(join(input,p),b);};
  write('index.html',html);write('assets/index-a.js','export const ok=1;');write('assets/index-a.css','body{margin:0}');
  for(const level of [2,3])for(let n=1;n<=(level===2?15:18);n++)for(let t=1;t<=8;t++){
    const file=`course-assets/hsk${level}/audio/${n}-${t}.mp3`,b=Buffer.from(file);write(file,b);tracks.push({file,bytes:b.length,sha256:hash(b)});
  }
  for(let n=1;n<=15;n++)for(let t=1;t<=(n<=3?7:6);t++){
    const id=`${n}-${t}`,b=Buffer.from(id);write('course-assets/audio/'+id+'.mp3',b);hsk1Tracks.push({id,bytes:b.length,sha256:hash(b)});
  }
  for(let n=1;n<=150;n++){const path=`source-activities/figures/fixture-${n}.png`,b=Buffer.from('approved-crop-'+n);write(path,b);figures.set(path,{lesson:Math.ceil(n/10),id:'figure-'+n,sha256:hash(b)});}
  const b=Buffer.from('{"strokes":["M 0 0"]}');write('course-assets/hanzi/一.json',b);write('course-assets/HANZI-PROVENANCE.json',JSON.stringify({characters:[{character:'一',sha256:hash(b)}]}));
  write('content-manifest.json',JSON.stringify({schemaVersion:1,mode:'release',audio:tracks,lessons:[...Array.from({length:15},(_,i)=>({level:2,number:i+1})),...Array.from({length:18},(_,i)=>({level:3,number:i+1}))]}));
  return {root,input,output,figures,hsk1Tracks,sourceCommit:'a'.repeat(40),sourceDirty:true,sourceSnapshot:{sha256:'b'.repeat(64),files:[]}};
}
function withFixture(fn){const f=fixture();try{return fn(f);}finally{rmSync(f.root,{recursive:true,force:true});}}
test('all seven routeable entries resolve activity crops and shared textbook/audio against real packaged paths',()=>withFixture(f=>{
  const m=packageUnified(f);assert.equal(m.mode,'checkpoint');assert.equal(m.originalAudioTracks,357);assert.equal(m.originalSourceCrops,150);
  for(const dir of unifiedEntryDirectories){
    const entry=(dir?dir+'/':'')+'index.html',e=readFileSync(join(f.output,entry),'utf8');
    const base=e.match(/name="asset-base" content="([^"]+)"/)?.[1];assert.ok(base,entry);
    const documentURL=new URL(entry,'https://example.test/hsk-hub/');
    for(const p of ['source-activities/figures/fixture-1.png','source-activities/figures/fixture-150.png']){
      const url=new URL('./'+p,documentURL);const path=url.pathname.slice('/hsk-hub/'.length);assert.equal(hash(readFileSync(join(f.output,path))),f.figures.get(p).sha256);
    }
    const audioURL=new URL('course-assets/audio/1-1.mp3',new URL(base,documentURL));assert.equal(readFileSync(join(f.output,audioURL.pathname.slice('/hsk-hub/'.length)),'utf8'),'1-1');
    const strokeURL=new URL('course-assets/hanzi/一.json',new URL(base,documentURL));assert.ok(existsSync(join(f.output,decodeURIComponent(strokeURL.pathname.slice('/hsk-hub/'.length)))));
  }
  for(const file of m.files)assert.equal(hash(readFileSync(join(f.output,file.path))),file.sha256);
  assert.throws(()=>packageUnified(f),/must be new/);
}));
test('unknown source images, PDF, changed accepted crops/audio/strokes and symlinks fail before freezing',()=>{
  for(const kind of ['unknown-image','pdf','crop','audio','stroke','symlink','extra-track','missing-crop'])withFixture(f=>{
    const target=join(f.input,'source-activities/figures/fixture-1.png');
    if(kind==='unknown-image')writeFileSync(join(f.input,'source-activities/figures/whole-page.png'),'private');
    if(kind==='pdf')writeFileSync(join(f.input,'book.pdf'),'private');
    if(kind==='crop')writeFileSync(target,'changed');
    if(kind==='audio')writeFileSync(join(f.input,'course-assets/audio/1-1.mp3'),'changed');
    if(kind==='stroke')writeFileSync(join(f.input,'course-assets/hanzi/一.json'),'changed');
    if(kind==='symlink')symlinkSync(target,join(f.input,'source-activities/figures/link.png'));
    if(kind==='extra-track')writeFileSync(join(f.input,'course-assets/audio/99-1.mp3'),'extra');
    if(kind==='missing-crop')rmSync(target);
    assert.throws(()=>packageUnified(f),undefined,kind);assert.equal(existsSync(f.output),false,kind);
  });
});
test('source or frozen-input drift fails before output; dirty or prebuilt data cannot be labeled release',()=>{
  withFixture(f=>{f.assertStable=()=>{throw Error('source drift');};assert.throws(()=>packageUnified(f),/source drift/);assert.equal(existsSync(f.output),false);});
  withFixture(f=>{f.assertStable=()=>writeFileSync(join(f.input,'assets/index-a.js'),'changed');assert.throws(()=>packageUnified(f),/input changed/);assert.equal(existsSync(f.output),false);});
  withFixture(f=>{assert.throws(()=>packageUnified({...f,mode:'release'}),/clean source/);assert.throws(()=>packageUnified({...f,mode:'release',sourceDirty:false}),/verified build/);assert.equal(existsSync(f.output),false);});
});
test('release gate still requires exact commit, 48 lessons, 33 textbook lessons, 579 pages, sixteen stages and both engines',()=>{
  const source='a'.repeat(40),g={sourceCommit:source,lessons:48,textbookLessons:33,pages:579,stages:Array.from({length:16},()=>({status:'passed'})),browsers:{chromium:true,webkit:true}};
  assert.doesNotThrow(()=>assertUnifiedAcceptance(g,source));
  for(const invalid of [{...g,sourceCommit:'b'.repeat(40)},{...g,lessons:47},{...g,textbookLessons:32},{...g,pages:578},{...g,stages:g.stages.slice(1)},{...g,stages:g.stages.map((s,i)=>i===2?{status:'pending'}:s)},{...g,browsers:{chromium:true}}])assert.throws(()=>assertUnifiedAcceptance(invalid,source));
});
test('actual current crop registry uses lesson 4 current version and rejects path traversal/private sources',()=>{
  const repo=resolve(import.meta.dirname,'../..'),figures=currentSourceFigures(repo);assert.equal(currentAuxiliaryIllustrations(repo).size,438);assert.equal(figures.size,150);assert.equal([...figures.values()].filter(f=>f.lesson===4).length,13);
  for(const p of ['book.pdf','docs/private.json','source-activities/figures/page.png','../index.html','assets/app.js.map','illustrations/unapproved-full-page.svg'])assert.equal(unifiedInputPath(p,figures),false,p);
  assert.throws(()=>unifiedEntryHTML('<html/>',1,'./course-engine/'));
});
test('production assembly anchors the actual 1446-file 2da tree and explicitly separates developer-only files',()=>{
  const repo=resolve(import.meta.dirname,'../..'),m=protectedBaselineManifest(repo);assert.equal(m.productionCommit,'2da6a5c80c62d4ff5bdfa72a5bdb929b2b1ff3d4');assert.equal(m.productionTree,'34dc16aa1e042f5f6fc6ea6edb80b9b6926cb344');assert.equal(m.files.length,1446);
  assert.ok(baselineExclusion('qa/source-canonical-audit.mjs'));assert.ok(baselineExclusion('tools/tests/results/legacy-gates.json'));assert.equal(baselineExclusion('hsk4/data.js'),undefined);assert.equal(baselineExclusion('practice/reviewed/hsk3-v1.1.part01.b64'),undefined);
});

test('entry, build configuration and retained source assets are included in the clean build snapshot',()=>{
  const repo=mkdtempSync(join(tmpdir(),'hsk-package-dirty-'));
  const run=args=>execFileSync('git',args,{cwd:repo,stdio:'ignore'});
  const names=['course-app/index.html','course-app/package.json','course-app/package-lock.json','course-app/vite.config.ts','course-app/tsconfig.json','new-hsk1/hsk1/audio/1-1.mp3','new-hsk1/assets/hanzi-data/一.json'];
  try{
    run(['init']);
    for(const path of names){mkdirSync(join(repo,path,'..'),{recursive:true});writeFileSync(join(repo,path),'original');}
    run(['add','.']);run(['-c','user.name=Package Guard Test','-c','user.email=package-guard-test@example.invalid','commit','-m','isolated fixture']);
    const before=runtimeSourceSnapshot(repo);assert.equal(runtimeSourceDirty(repo),false);
    for(const path of names){
      writeFileSync(join(repo,path),'changed');assert.equal(runtimeSourceDirty(repo),true,path);assert.notEqual(runtimeSourceSnapshot(repo).sha256,before.sha256,path);
      run(['restore',path]);assert.equal(runtimeSourceDirty(repo),false,path);
    }
    mkdirSync(join(repo,'course-app/docs'),{recursive:true});writeFileSync(join(repo,'course-app/docs/checkpoint.md'),'report only');assert.equal(runtimeSourceDirty(repo),false);assert.equal(runtimeSourceSnapshot(repo).sha256,before.sha256);
  }finally{rmSync(repo,{recursive:true,force:true});}
});
