import {readFileSync,lstatSync,existsSync,realpathSync} from 'node:fs';
import {resolve,join,isAbsolute,relative,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {hash} from './package-core.mjs';

const sha256=/^[0-9a-f]{64}$/;
const commitID=/^[0-9a-f]{40}$/;
const fail=message=>{throw Error('Release readiness: '+message);};
const safePath=p=>typeof p==='string'&&!p.includes('\\')&&!p.startsWith('/')&&!p.split('/').some(x=>['','.','..'].includes(x));
const nonempty=value=>typeof value==='string'&&value.trim().length>0;
const git=(repo,args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8',stdio:['pipe','pipe','pipe'],maxBuffer:32*1024*1024});
const uniqueExact=(values,expected,label)=>{
  if(!Array.isArray(values)||values.length!==expected.length||new Set(values).size!==values.length||values.some(value=>!expected.includes(value)))fail('incomplete or duplicate '+label);
};

function runtimeFile(repo,path){
  if(!safePath(path))fail('unsafe runtime path');
  let file=repo;
  for(const part of path.split('/')){file=join(file,part);if(lstatSync(file).isSymbolicLink())fail('runtime symlink '+path);}
  if(!lstatSync(file).isFile())fail('runtime input is not a file '+path);
  return file;
}

// The vector includes mode as well as bytes; documentation is deliberately not
// part of this scope. Callers supply the same explicit build-input scope list.
export function snapshotRuntimeSource(repo,scopes){
  const names=git(repo,['ls-files','-z','--cached','--others','--exclude-standard','--',...scopes]).split('\0').filter(Boolean);
  const files=[...new Set(names)].sort().filter(path=>existsSync(join(repo,path))).map(path=>{
    const file=runtimeFile(repo,path);
    return {path,mode:lstatSync(file).mode&0o100?'100755':'100644',sha256:hash(readFileSync(file))};
  });
  return {sha256:hash(Buffer.from(JSON.stringify(files))),files};
}

export function assertTestedRuntimeSource(repo,testedSourceCommit,snapshot,scopes){
  if(!commitID.test(testedSourceCommit??''))fail('invalid testedSourceCommit');
  try{git(repo,['cat-file','-e',testedSourceCommit+'^{commit}']);}catch{fail('testedSourceCommit is not a Git commit');}
  const actual=snapshotRuntimeSource(repo,scopes);
  if(!actual.files.length||!snapshot||snapshot.sha256!==actual.sha256||JSON.stringify(snapshot.files)!==JSON.stringify(actual.files))fail('runtimeSourceSnapshot does not match the actual worktree');
  const entries=git(repo,['ls-tree','-r','-z',testedSourceCommit,'--',...scopes]).split('\0').filter(Boolean).map(entry=>{
    const match=/^(\d+) (\w+) ([0-9a-f]{40})\t([\s\S]+)$/.exec(entry);
    if(!match||match[2]!=='blob'||!['100644','100755'].includes(match[1]))fail('unsupported tested runtime tree entry');
    return {mode:match[1],object:match[3],path:match[4]};
  }).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
  if(entries.length!==actual.files.length)fail('tested commit has a different runtime file set');
  for(let i=0;i<entries.length;i++){
    const entry=entries[i],current=actual.files[i];
    if(entry.path!==current.path||entry.mode!==current.mode)fail('tested commit has a different runtime path or mode');
    const bytes=readFileSync(runtimeFile(repo,entry.path));
    const object=createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
    if(object!==entry.object)fail('tested commit differs from runtime input '+entry.path);
  }
  return actual;
}

function readEvidence(repo,reference,label){
  if(!reference||!nonempty(reference.path)||!sha256.test(reference.sha256??''))fail('missing file/SHA evidence for '+label);
  if(!isAbsolute(reference.path)&&!safePath(reference.path))fail('unsafe evidence path for '+label);
  const file=resolve(repo,reference.path);
  if(!isAbsolute(reference.path)){
    const actual=relative(realpathSync(repo),realpathSync(file));
    if(actual==='..'||actual.startsWith('..'+sep)||isAbsolute(actual))fail('evidence escapes repository for '+label);
  }
  if(!lstatSync(file).isFile()||lstatSync(file).isSymbolicLink())fail('evidence is not a regular file for '+label);
  const bytes=readFileSync(file);
  if(hash(bytes)!==reference.sha256)fail('evidence SHA mismatch for '+label);
  return bytes;
}
function evidenceList(repo,evidence,label){
  if(!Array.isArray(evidence)||!evidence.length)fail('missing evidence for '+label);
  for(const reference of evidence)readEvidence(repo,reference,label);
}
function evidenceJSON(repo,reference,label){
  try{return JSON.parse(readEvidence(repo,reference,label).toString('utf8'));}catch(error){fail(label+' is not readable JSON: '+error.message);}
}
function independent(record,label){
  if(!nonempty(record.author)||!nonempty(record.independentReviewer)||record.author===record.independentReviewer)fail('independent acceptance missing for '+label);
}
function bound(record,gate,label){
  if(record.testedSourceCommit!==gate.testedSourceCommit||record.runtimeSourceSnapshotSHA256!==gate.runtimeSourceSnapshot.sha256)fail('candidate binding mismatch for '+label);
}
function buildInputVector(files){
  if(!Array.isArray(files)||!files.length||files.some(file=>!safePath(file.path)||!Number.isSafeInteger(file.bytes)||file.bytes<0||!sha256.test(file.sha256??''))||new Set(files.map(file=>file.path)).size!==files.length)fail('invalid tested build input vector');
  return files.map(({path,bytes,sha256})=>({path,bytes,sha256})).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
}
export function assertTestedBuildInput(readiness,inputFiles){
  if(JSON.stringify(buildInputVector(readiness?.testedBuildInputFiles))!==JSON.stringify(buildInputVector(inputFiles)))fail('build input differs from exact native-tested files');
}

export const semanticLessonScopes=['titles-goals','vocabulary-senses-pos','dialogue-roles','grammar-examples','instructions-activities-tables-feedback','reused-generated-displays'];
export const crossSiteScopes=['shared-editorial','legacy-questions','asset-metadata','svg','terminology','resolved-errata'];
export function assertReleaseReadiness(gate,sourceCommit,{repo,scopes}={}){
  if(!repo||!Array.isArray(scopes)||!scopes.length)fail('actual repository context is required');
  if(gate?.schemaVersion!==2||gate.phase!=='pre-publication'||gate.publicationApproved!==false||gate.deployed!==false||gate.lessons!==48||gate.textbookLessons!==33)fail('invalid pre-publication gate');
  if(!commitID.test(sourceCommit??'')||git(repo,['rev-parse','HEAD']).trim()!==sourceCommit)fail('package sourceCommit must be current HEAD');
  const actualSnapshot=assertTestedRuntimeSource(repo,gate.testedSourceCommit,gate.runtimeSourceSnapshot,scopes);
  if(git(repo,['status','--porcelain','--',...scopes]).trim())fail('runtime worktree must be clean');
  uniqueExact(gate.stages?.map(stage=>stage.id),Array.from({length:16},(_,i)=>i+1),'stage IDs');
  for(const stage of gate.stages){
    if(stage.id===16){if(stage.status!=='awaiting-authorization')fail('stage 16 must await publication authorization');}
    else{if(stage.status!=='passed')fail('stage '+stage.id+' is not passed');evidenceList(repo,stage.evidence,'stage '+stage.id);}
  }

  uniqueExact(gate.officialVI?.sources?.map(source=>source.level),[1,2,3],'official VI source levels');
  if(new Set(gate.officialVI.sources.map(source=>source.sha256)).size!==3)fail('official VI sources must have distinct identities');
  for(const source of gate.officialVI.sources){
    const pages={1:148,2:162,3:212}[source.level];
    if(source.pages!==pages||!sha256.test(source.sha256??'')||!nonempty(source.sourceFile))fail('invalid official VI source '+source.level);
    readEvidence(repo,{path:source.sourceFile,sha256:source.sha256},'official PDF '+source.level);
    const ledger=evidenceJSON(repo,source.pageLedger,'official page ledger '+source.level);
    if(ledger.level!==source.level||ledger.sourceSHA256!==source.sha256)fail('official page ledger source mismatch');
    uniqueExact(ledger.pages?.map(page=>page.pdfPage),Array.from({length:pages},(_,i)=>i+1),'official PDF page IDs '+source.level);
    for(const page of ledger.pages){
      const label=`HSK${source.level} PDF page ${page.pdfPage}`;
      evidenceList(repo,page.evidence,label);
      if(page.disposition==='applicable'){
        if(page.status!=='accepted')fail('applicable page is not accepted: '+label);
        independent(page,label);
      }else if(['blank','metadata','no-corresponding-site-content'].includes(page.disposition)){
        if(page.status!=='reviewed'||!nonempty(page.reason)||!nonempty(page.reviewedBy))fail('unreviewed excluded page: '+label);
      }else fail('unclassified official page: '+label);
    }
  }

  const semantic=evidenceJSON(repo,gate.semanticAcceptance,'48-lesson semantic acceptance');
  bound(semantic,gate,'semantic acceptance');
  const lessons=[...Array.from({length:15},(_,i)=>`1:${i+1}`),...Array.from({length:15},(_,i)=>`2:${i+1}`),...Array.from({length:18},(_,i)=>`3:${i+1}`)];
  uniqueExact(semantic.lessons?.map(lesson=>`${lesson.level}:${lesson.number}`),lessons,'semantic lesson identities');
  if(semantic.lessons.some(lesson=>!nonempty(lesson.id))||new Set(semantic.lessons.map(lesson=>lesson.id)).size!==48)fail('invalid stable semantic lesson IDs');
  for(const lesson of semantic.lessons){
    if(lesson.status!=='accepted'||lesson.unresolved!==0)fail('semantic lesson is not fully accepted '+lesson.id);
    independent(lesson,lesson.id);
    const inventory=evidenceJSON(repo,lesson.consumerScope,lesson.id+' consumer scope');
    if(inventory.level!==lesson.level||inventory.number!==lesson.number||inventory.lessonId!==lesson.id||!Array.isArray(inventory.items)||!inventory.items.length||inventory.items.some(item=>!nonempty(item.id)||!semanticLessonScopes.includes(item.scope))||new Set(inventory.items.map(item=>item.id)).size!==inventory.items.length)fail('invalid semantic consumer inventory '+lesson.id);
    uniqueExact(lesson.coverage?.map(scope=>scope.id),semanticLessonScopes,lesson.id+' semantic scopes');
    for(const scope of lesson.coverage){
      if(scope.status!=='accepted')fail('semantic scope is not accepted '+lesson.id+'/'+scope.id);
      uniqueExact(scope.acceptedItemIDs,inventory.items.filter(item=>item.scope===scope.id).map(item=>item.id),lesson.id+'/'+scope.id+' accepted consumer IDs');
      evidenceList(repo,scope.evidence,lesson.id+'/'+scope.id);
    }
  }

  const crossSite=evidenceJSON(repo,gate.stages.find(stage=>stage.id===14).certificate,'stage 14 cross-site certificate');
  bound(crossSite,gate,'cross-site certificate');independent(crossSite,'cross-site certificate');
  uniqueExact(crossSite.coverage?.map(scope=>scope.id),crossSiteScopes,'cross-site scopes');
  for(const scope of crossSite.coverage){
    if(scope.status!=='accepted'||scope.unresolved!==0||!nonempty(scope.scopeDescription))fail('incomplete cross-site scope '+scope.id);
    const inventory=evidenceJSON(repo,scope.consumerScope,'cross-site '+scope.id+' consumer scope');
    if(inventory.scope!==scope.id||!Array.isArray(inventory.items)||inventory.items.some(item=>!nonempty(item.id))||new Set(inventory.items.map(item=>item.id)).size!==inventory.items.length||scope.items!==inventory.items.length)fail('invalid cross-site consumer inventory '+scope.id);
    if(scope.id==='legacy-questions'&&scope.items!==1360||['asset-metadata','svg'].includes(scope.id)&&scope.items!==412)fail('incomplete cross-site item count '+scope.id);
    if(scope.id!=='resolved-errata'&&!scope.items)fail('empty cross-site consumer scope '+scope.id);
    uniqueExact(scope.acceptedItemIDs,inventory.items.map(item=>item.id),'cross-site '+scope.id+' accepted consumer IDs');
    evidenceList(repo,scope.evidence,'cross-site '+scope.id);
  }

  const native=evidenceJSON(repo,gate.stages.find(stage=>stage.id===15).certificate,'stage 15 final native certificate');
  bound(native,gate,'final native certificate');
  const testedBuild=evidenceJSON(repo,native.buildInputManifest,'native-tested build input manifest');
  if(testedBuild.schemaVersion!==1)fail('invalid native-tested build input manifest schema');
  bound(testedBuild,gate,'native-tested build input manifest');
  const testedBuildInputFiles=buildInputVector(testedBuild.files);
  uniqueExact(native.browsers?.map(browser=>browser.engine),['chromium','webkit'],'final native engines');
  for(const browser of native.browsers){
    if(browser.status!=='passed')fail('final native engine is not passed '+browser.engine);
    uniqueExact(browser.widths,[320,390,768,1440],browser.engine+' widths');
    evidenceList(repo,browser.evidence,browser.engine+' final native');
  }
  const checks=['content-media-binding','language-layout','affected-full-release','nonempty-history-backup-legacy','student-build'];
  uniqueExact(native.checks?.map(check=>check.id),checks,'final regression checks');
  for(const check of native.checks){if(check.status!=='passed')fail('final regression check is not passed '+check.id);evidenceList(repo,check.evidence,check.id);}
  return {schemaVersion:2,phase:'pre-publication',testedSourceCommit:gate.testedSourceCommit,runtimeSourceSnapshotSHA256:actualSnapshot.sha256,publicationApproved:false,deployed:false,stage16:'awaiting-authorization',officialVI:gate.officialVI.sources.map(source=>({level:source.level,pages:source.pages,sha256:source.sha256,pageLedgerSHA256:source.pageLedger.sha256})),semanticAcceptanceSHA256:gate.semanticAcceptance.sha256,stageEvidence:gate.stages.filter(stage=>stage.id<16).map(stage=>({id:stage.id,sha256:stage.evidence.map(reference=>reference.sha256)})),crossSiteCertificateSHA256:gate.stages.find(stage=>stage.id===14).certificate.sha256,finalNativeCertificateSHA256:gate.stages.find(stage=>stage.id===15).certificate.sha256,testedBuildInputManifestSHA256:native.buildInputManifest.sha256,testedBuildInputFiles};
}
