import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync,chmodSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {hash} from '../tools/package-core.mjs';
import {assertUnifiedAcceptance,runtimeSourceSnapshot} from '../tools/package-unified.mjs';
import {semanticLessonScopes,crossSiteScopes} from '../tools/release-readiness.mjs';

function fixture(){
  const repo=mkdtempSync(join(tmpdir(),'hsk-readiness-'));
  const git=args=>execFileSync('git',args,{cwd:repo,encoding:'utf8',stdio:['pipe','pipe','ignore']}).trim();
  const write=(path,bytes)=>{mkdirSync(join(repo,path,'..'),{recursive:true});writeFileSync(join(repo,path),bytes);return {path,sha256:hash(Buffer.from(bytes))};};
  const json=(path,value)=>write(path,JSON.stringify(value));
  const commit=message=>{git(['add','.']);git(['-c','user.name=Readiness Test','-c','user.email=readiness@example.invalid','commit','-m',message]);return git(['rev-parse','HEAD']);};
  git(['init']);
  for(const path of ['course-app/src/main.ts','course-app/tools/package-unified.mjs','course-app/index.html','new-hsk1/hsk1/audio/1-1.mp3','new-hsk1/assets/hanzi-data/一.json'])write(path,'runtime fixture '+path);
  const testedSourceCommit=commit('tested runtime fixture'),runtimeSourceSnapshotValue=runtimeSourceSnapshot(repo);
  const evidence=write('course-app/docs/evidence.txt','Synthetic test evidence, never a real acceptance certificate.');
  const binding={testedSourceCommit,runtimeSourceSnapshotSHA256:runtimeSourceSnapshotValue.sha256};
  const sources=[1,2,3].map(level=>{
    const pages={1:148,2:162,3:212}[level],pdf=write(`course-app/docs/source-${level}.pdf`,'Synthetic PDF bytes '+level);
    const ledger={level,sourceSHA256:pdf.sha256,pages:Array.from({length:pages},(_,i)=>({pdfPage:i+1,disposition:'applicable',status:'accepted',author:'test author',independentReviewer:'test reviewer',evidence:[evidence]}))};
    return {level,pages,sha256:pdf.sha256,sourceFile:pdf.path,pageLedger:json(`course-app/docs/pages-${level}.json`,ledger)};
  });
  const lessons=[];
  for(const level of [1,2,3])for(let number=1;number<=(level===3?18:15);number++){
    const id=`synthetic-hsk${level}:l${number}`,items=semanticLessonScopes.map(scope=>({id:id+'/'+scope,scope}));
    lessons.push({level,number,id,status:'accepted',unresolved:0,author:'test author',independentReviewer:'test reviewer',consumerScope:json(`course-app/docs/consumers-${level}-${number}.json`,{level,number,lessonId:id,items}),coverage:semanticLessonScopes.map(scope=>({id:scope,status:'accepted',acceptedItemIDs:items.filter(item=>item.scope===scope).map(item=>item.id),evidence:[evidence]}))});
  }
  const semanticAcceptance=json('course-app/docs/semantic.json',{...binding,lessons});
  const coverage=crossSiteScopes.map(id=>{
    const items=Array.from({length:id==='legacy-questions'?1360:['asset-metadata','svg'].includes(id)?412:1},(_,i)=>({id:id+'/'+i}));
    return {id,status:'accepted',unresolved:0,scopeDescription:'Synthetic '+id+' scope',items:items.length,acceptedItemIDs:items.map(item=>item.id),consumerScope:json(`course-app/docs/cross-${id}.json`,{scope:id,items}),evidence:[evidence]};
  });
  const cross=json('course-app/docs/cross.json',{...binding,author:'test author',independentReviewer:'test reviewer',coverage});
  const buildInputManifest=json('course-app/docs/tested-build.json',{schemaVersion:1,...binding,files:[{path:'index.html',bytes:9,sha256:hash(Buffer.from('test html'))}]});
  const native=json('course-app/docs/native.json',{...binding,buildInputManifest,browsers:['chromium','webkit'].map(engine=>({engine,status:'passed',widths:[320,390,768,1440],evidence:[evidence]})),checks:['content-media-binding','language-layout','affected-full-release','nonempty-history-backup-legacy','student-build'].map(id=>({id,status:'passed',evidence:[evidence]}))});
  const gate={schemaVersion:2,phase:'pre-publication',publicationApproved:false,deployed:false,testedSourceCommit,runtimeSourceSnapshot:runtimeSourceSnapshotValue,lessons:48,textbookLessons:33,stages:Array.from({length:16},(_,i)=>({id:i+1,status:i===15?'awaiting-authorization':'passed',...(i<15?{evidence:[evidence]}:{}),...(i===13?{certificate:cross}:i===14?{certificate:native}:{})})),officialVI:{sources},semanticAcceptance};
  const head=()=>git(['rev-parse','HEAD']);
  const validate=()=>assertUnifiedAcceptance(gate,head(),{repo});
  const mutate=(reference,fn)=>{const value=JSON.parse(readFileSync(join(repo,reference.path),'utf8'));fn(value);const updated=json(reference.path,value);reference.sha256=updated.sha256;};
  return {repo,git,write,json,commit,gate,evidence,head,validate,mutate};
}
function withFixture(fn){const f=fixture();try{return fn(f);}finally{rmSync(f.repo,{recursive:true,force:true});}}

test('a docs-only committed gate advances HEAD while the actual tested runtime remains accepted',()=>withFixture(f=>{
  const before=f.validate();
  f.json('course-app/docs/gate.json',f.gate);f.commit('documentation-only acceptance checkpoint');
  assert.notEqual(f.head(),f.gate.testedSourceCommit);
  const after=f.validate();assert.deepEqual(after,before);
  assert.equal(after.publicationApproved,false);assert.equal(after.deployed,false);assert.equal(after.stage16,'awaiting-authorization');
  assert.equal(after.officialVI.reduce((n,source)=>n+source.pages,0),522);
  assert.equal(JSON.stringify(after).includes('sourceFile'),false);
}));

test('clean committed runtime/tool/raw input drift fails even when both gate snapshot fields are forged to agree',()=>{
  for(const path of ['course-app/src/main.ts','course-app/tools/package-unified.mjs','new-hsk1/hsk1/audio/1-1.mp3','new-hsk1/assets/hanzi-data/一.json'])withFixture(f=>{
    f.write(path,'changed bytes');f.commit('runtime drift');
    assert.throws(f.validate,/Snapshot/);
    f.gate.runtimeSourceSnapshot=runtimeSourceSnapshot(f.repo);
    assert.throws(f.validate,/tested commit differs/,path);
  });
});

test('actual tested commit existence, complete paths, modes and clean worktree are verified',()=>{
  for(const kind of ['missing-commit','dirty','added','deleted','mode','symlink'])withFixture(f=>{
    if(kind==='missing-commit')f.gate.testedSourceCommit='a'.repeat(40);
    if(kind==='dirty')f.write('course-app/src/main.ts','dirty change');
    if(kind==='added'){f.write('course-app/src/extra.ts','extra');f.commit('extra file');}
    if(kind==='deleted'){rmSync(join(f.repo,'course-app/src/main.ts'));f.commit('deleted file');}
    if(kind==='mode'){chmodSync(join(f.repo,'course-app/src/main.ts'),0o755);f.commit('mode change');}
    if(kind==='symlink')symlinkSync(join(f.repo,'course-app/src/main.ts'),join(f.repo,'course-app/src/link.ts'));
    if(!['missing-commit','symlink'].includes(kind))f.gate.runtimeSourceSnapshot=runtimeSourceSnapshot(f.repo);
    assert.throws(f.validate,undefined,kind);
  });
});

test('stage identity and pre-publication status do not permit duplicate IDs or fabricated publication completion',()=>withFixture(f=>{
  for(const mutate of [g=>g.schemaVersion=1,g=>g.lessons=47,g=>g.textbookLessons=32,g=>g.publicationApproved=true,g=>g.deployed=true,g=>g.stages[0].id=2,g=>g.stages[0].id=99,g=>g.stages[14].status='pending',g=>g.stages[15].status='passed',g=>delete g.stages[0].evidence]){
    const gate=structuredClone(f.gate);mutate(gate);assert.throws(()=>assertUnifiedAcceptance(gate,f.head(),{repo:f.repo}));
  }
}));

test('official source bytes and every exact page identity/review must be present',()=>{
  for(const kind of ['missing-pdf','changed-pdf','duplicate-source','bad-ledger-sha','duplicate-page','different-page','unread-page','self-review','excluded-without-reason'])withFixture(f=>{
    const source=f.gate.officialVI.sources[0];
    if(kind==='missing-pdf')rmSync(join(f.repo,source.sourceFile));
    if(kind==='changed-pdf')f.write(source.sourceFile,'changed');
    if(kind==='duplicate-source')source.sha256=f.gate.officialVI.sources[1].sha256;
    if(kind==='bad-ledger-sha')source.pageLedger.sha256='0'.repeat(64);
    if(['duplicate-page','different-page','unread-page','self-review','excluded-without-reason'].includes(kind))f.mutate(source.pageLedger,ledger=>{
      const page=ledger.pages[0];
      if(kind==='duplicate-page')page.pdfPage=2;
      if(kind==='different-page')page.pdfPage=149;
      if(kind==='unread-page')page.status='pending';
      if(kind==='self-review')page.independentReviewer=page.author;
      if(kind==='excluded-without-reason'){page.disposition='blank';page.status='reviewed';page.reviewedBy='test reviewer';}
    });
    assert.throws(f.validate,undefined,kind);
  });
  withFixture(f=>{f.mutate(f.gate.officialVI.sources[0].pageLedger,ledger=>Object.assign(ledger.pages[0],{disposition:'blank',status:'reviewed',reason:'Visually reviewed synthetic blank page',reviewedBy:'test reviewer'}));assert.doesNotThrow(f.validate);});
});

test('48 semantic lessons require exact identities and all actual scoped consumer IDs',()=>{
  for(const kind of ['duplicate-lesson','different-lesson','self-review','missing-scope','wrong-consumer-id','pending'])withFixture(f=>{
    f.mutate(f.gate.semanticAcceptance,semantic=>{
      const lesson=semantic.lessons[0];
      if(kind==='duplicate-lesson')lesson.number=2;
      if(kind==='different-lesson')lesson.number=16;
      if(kind==='self-review')lesson.independentReviewer=lesson.author;
      if(kind==='missing-scope')lesson.coverage.pop();
      if(kind==='wrong-consumer-id')lesson.coverage[0].acceptedItemIDs=['same count, wrong identity'];
      if(kind==='pending')lesson.status='pending';
    });assert.throws(f.validate,undefined,kind);
  });
});

test('cross-site scopes and final native certificates cannot be replaced by course counts or browser booleans',()=>{
  for(const kind of ['missing-shared','legacy-short','asset-short','svg-pending','errata-open','wrong-id','webkit-pending','missing-width','missing-history','stale-native-binding','missing-build-manifest','broken-evidence'])withFixture(f=>{
    if(['missing-shared','legacy-short','asset-short','svg-pending','errata-open','wrong-id'].includes(kind))f.mutate(f.gate.stages[13].certificate,certificate=>{
      if(kind==='missing-shared')certificate.coverage.shift();
      if(kind==='legacy-short')certificate.coverage.find(scope=>scope.id==='legacy-questions').items=1359;
      if(kind==='asset-short')certificate.coverage.find(scope=>scope.id==='asset-metadata').items=411;
      if(kind==='svg-pending')certificate.coverage.find(scope=>scope.id==='svg').status='pending';
      if(kind==='errata-open')certificate.coverage.find(scope=>scope.id==='resolved-errata').unresolved=1;
      if(kind==='wrong-id')certificate.coverage[0].acceptedItemIDs=['wrong ID'];
    });
    if(['webkit-pending','missing-width','missing-history','stale-native-binding','missing-build-manifest'].includes(kind))f.mutate(f.gate.stages[14].certificate,certificate=>{
      if(kind==='webkit-pending')certificate.browsers[1].status='pending';
      if(kind==='missing-width')certificate.browsers[1].widths.pop();
      if(kind==='missing-history')certificate.checks.splice(3,1);
      if(kind==='stale-native-binding')certificate.runtimeSourceSnapshotSHA256='0'.repeat(64);
      if(kind==='missing-build-manifest')delete certificate.buildInputManifest;
    });
    if(kind==='broken-evidence')f.write(f.evidence.path,'damaged evidence');
    assert.throws(f.validate,undefined,kind);
  });
});

test('native-tested build vectors reject unsafe, duplicate, empty and stale identities',()=>{
  for(const kind of ['unsafe','duplicate','empty','invalid-bytes','stale-commit','schema'])withFixture(f=>{
    f.mutate(f.gate.stages[14].certificate,native=>f.mutate(native.buildInputManifest,build=>{
      if(kind==='unsafe')build.files[0].path='../index.html';
      if(kind==='duplicate')build.files.push({...build.files[0]});
      if(kind==='empty')build.files=[];
      if(kind==='invalid-bytes')build.files[0].bytes=-1;
      if(kind==='stale-commit')build.testedSourceCommit='b'.repeat(40);
      if(kind==='schema')build.schemaVersion=2;
    }));assert.throws(f.validate,undefined,kind);
  });
});

test('asset metadata accepts its complete actual identity ledger independently of the 412 SVG desc count',()=>withFixture(f=>{
  f.mutate(f.gate.stages[13].certificate,certificate=>{
    const scope=certificate.coverage.find(scope=>scope.id==='asset-metadata');
    const items=Array.from({length:1981},(_,i)=>({id:'synthetic-metadata/'+i}));
    scope.consumerScope=f.json('course-app/docs/full-metadata-scope.json',{scope:scope.id,items});
    scope.items=items.length;scope.acceptedItemIDs=items.map(item=>item.id);
  });
  assert.doesNotThrow(f.validate);
  f.mutate(f.gate.stages[13].certificate,certificate=>certificate.coverage.find(scope=>scope.id==='asset-metadata').acceptedItemIDs.pop());
  assert.throws(f.validate,/accepted consumer IDs/);
}));
