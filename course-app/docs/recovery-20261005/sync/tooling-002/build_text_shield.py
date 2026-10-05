#!/usr/bin/env python3
"""Preserve original metadata through an isolated index; full evidence remains pending."""
import argparse, datetime, hashlib, json, os, pathlib, shutil, subprocess

ROOT=pathlib.Path('/workspace/scratch/28b55072841a/hsk-hub-resume-recovered')
HELPER=pathlib.Path('/workspace/scratch/28b55072841a/source-recovery-sync-tools')

def git(*args,env=None,data=None):
    return subprocess.run(['git','-C',str(ROOT),*args],input=data,capture_output=True,env=env,check=True).stdout

def entry(path):
    p=ROOT/path; raw=p.read_bytes(); mode='100755' if p.stat().st_mode & 0o111 else '100644'
    return dict(path=path,mode=mode,type='blob',gitBlobSHA=hashlib.sha1(f'blob {len(raw)}\0'.encode()+raw).hexdigest(),bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest(),alreadyInVerifiedRemoteBaseline=False)

def main():
    a=argparse.ArgumentParser();a.add_argument('--number',required=True);a.add_argument('--local-parent',required=True);a.add_argument('--remote-parent',required=True);a.add_argument('--parent-tree',required=True);args=a.parse_args()
    original_head=git('rev-parse','HEAD').decode().strip(); original_index=git('diff','--cached','--raw')
    assert not original_index,'Normal index must remain empty'
    queue=json.loads((HELPER/'sync-queue.json').read_text()); rows={};scopes=[]
    for q in queue:
        c=json.loads(pathlib.Path(q['capsule']).read_text()); metadata=[];pending=[]
        for e in c['entries']:
            assert (ROOT/e['path']).is_file()
            raw=(ROOT/e['path']).read_bytes();assert len(raw)==e['bytes'] and hashlib.sha256(raw).hexdigest()==e['sha256'],e['path']
            if pathlib.PurePosixPath(e['path']).suffix.lower() in {'.png','.jpg','.jpeg','.pdf','.gz','.zip','.mp3','.wav','.webp'}:pending.append(e)
            else:
                old=rows.get(e['path']);assert old is None or old['gitBlobSHA']==e['gitBlobSHA'],'Frozen paths conflict'
                rows[e['path']]=e;metadata.append(e)
        scopes.append(dict(scope=c['scope'],qualification=c['qualification'],freezePath=c['freezePath'],freezeSHA256=c['freezeSHA256'],stageSHA256=c['stageSHA256'],metadata=metadata,pendingBinaryEvidence=pending,wholeAcceptanceRequiresFreezeSHA256=q.get('wholeAcceptanceRequiresFreezeSHA256',[])))
    own=ROOT/'course-app/docs/recovery-20261005/sync'; tooling=own/f'tooling-{args.number}';tooling.mkdir(parents=True,exist_ok=False)
    for p in list(HELPER.glob('*.py'))+list(HELPER.glob('*.js'))+[HELPER/'sync-queue.json']:
        shutil.copyfile(p,tooling/p.name);rows[str((tooling/p.name).relative_to(ROOT))]=entry(str((tooling/p.name).relative_to(ROOT)))
    for p in (HELPER/'receipts').glob('*.json'):
        target=own/'receipts'/p.name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,target);rows[str(target.relative_to(ROOT))]=entry(str(target.relative_to(ROOT)))
    for p in [own/'CURRENT-PROGRESS.json',own/'initial-baseline/baseline-progress.json']:
        rows[str(p.relative_to(ROOT))]=entry(str(p.relative_to(ROOT)))
    draft=ROOT/'course-app/docs/recovery-20261005/qa-official-vi/hsk1-l12/manual-observations-before-v3.json'
    if draft.exists(): rows[str(draft.relative_to(ROOT))]=entry(str(draft.relative_to(ROOT)))
    record=own/'text-shield'/f'PARTIAL-TEXT-SHIELD-{args.number}.json';record.parent.mkdir(parents=True,exist_ok=True)
    record.write_text(json.dumps(dict(schemaVersion=2,createdAtUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),qualification='Original metadata shield only; binary evidence pending unless separate actual full receipts prove completion',fullPackagesAdded=0,newIndependentAcceptedLessonsCounted=0,sourceReviewNeverImpliedByAuthorFreeze=True,protectedHeads={'main':'3facc6aabe51dbbfbd36657b8e1e67f83015e22d','gh-pages':'2da6a5c80c62d4ff5bdfa72a5bdb929b2b1ff3d4'},scopes=scopes),ensure_ascii=False,indent=2)+'\n')
    rows[str(record.relative_to(ROOT))]=entry(str(record.relative_to(ROOT)))
    parent_paths={line.split('\t',1)[1]:line.split('\t',1)[0] for line in git('ls-tree','-r',args.parent_tree).decode().splitlines()}
    delta=[]
    for e in rows.values():
        if parent_paths.get(e['path'])!=f"{e['mode']} blob {e['gitBlobSHA']}":delta.append(e)
    assert delta
    env=os.environ.copy();env['GIT_INDEX_FILE']=str(HELPER/f'text-shield-{args.number}.index');assert not pathlib.Path(env['GIT_INDEX_FILE']).exists()
    git('read-tree',args.parent_tree,env=env)
    for e in delta:
        sha=git('hash-object','-w','--',e['path']).decode().strip();assert sha==e['gitBlobSHA']
    git('update-index','--index-info',env=env,data=''.join(f"{e['mode']} {e['gitBlobSHA']}\t{e['path']}\n" for e in sorted(delta,key=lambda r:r['path'])).encode())
    tree=git('write-tree',env=env).decode().strip()
    env.update(GIT_AUTHOR_NAME='Codex',GIT_AUTHOR_EMAIL='noreply@openai.com',GIT_COMMITTER_NAME='Codex',GIT_COMMITTER_EMAIL='noreply@openai.com')
    message=f'Preserve original text evidence and actual progress receipts for recovery checkpoint {args.number}; PNG backup pending'
    commit=git('commit-tree',tree,'-p',args.local_parent,env=env,data=(message+'\n').encode()).decode().strip()
    assert git('rev-parse','HEAD').decode().strip()==original_head and git('diff','--cached','--raw')==original_index
    digest=hashlib.sha256(record.read_bytes()).hexdigest()
    capsule=dict(schemaVersion=1,repository='nhiennhientran/hsk-hub',targetBranch='work/hsk-recovery-text-shield-20261005',scope=f'text-shield-{args.number}-{len(scopes)}-frozen-packages',qualification='partial-text-only-not-full-package-acceptance',localCommit=commit,localTree=tree,expectedLocalParentCommit=args.local_parent,remoteParent=args.remote_parent,remoteParentTree=args.parent_tree,entries=sorted(delta,key=lambda e:e['path']),stageSHA256=digest,freezePath=str(record.relative_to(ROOT)),freezeSHA256=digest,message=message,alternateIndexOnly=True,fullNormalIndexUnchanged=True,productionDeploymentPerformed=False,allScopeMetadataPaths=len(rows),frozenScopeCount=len(scopes))
    out=HELPER/f'text-shield-{args.number}-capsule.json';out.write_text(json.dumps(capsule,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(dict(capsule=str(out),scopeCount=len(scopes),newOrChangedMetadataFiles=len(delta),bytes=sum(e['bytes'] for e in delta),localCommit=commit,localTree=tree,normalHEADUnchanged=original_head)))

if __name__=='__main__':main()
