#!/usr/bin/env python3
"""Record actual checkpoint wall times with an explicit start / end definition."""
import datetime,json,pathlib,subprocess
ROOT=pathlib.Path('/workspace/scratch/28b55072841a/hsk-hub-resume-recovered')
HELPER=pathlib.Path('/workspace/scratch/28b55072841a/source-recovery-sync-tools')
rows=[]
for p in (HELPER/'receipts').glob('*.json'):
    r=json.loads(p.read_text())
    if not r.get('allNewBytesVerified') or 'previous-attempt' in p.name:continue
    started=subprocess.run(['git','-C',str(ROOT),'show','-s','--format=%ct',r['localCommit']],capture_output=True,check=True).stdout.decode().strip()
    end=datetime.datetime.fromisoformat(r['verifiedAtUTC']).timestamp();seconds=round(end-int(started),3)
    assert seconds>=0
    rows.append(dict(scope=r['scope'],branch=r['branch'],localCommit=r['localCommit'],remoteCommit=r['remoteCommit'],tree=r['localAndRemoteTree'],startedAtLocalCommitUTC=datetime.datetime.fromtimestamp(int(started),datetime.timezone.utc).isoformat(),actualImmutableRawReceiptVerifiedAtUTC=r['verifiedAtUTC'],elapsedFromLocalCommitToRawReceiptSeconds=seconds,actualNetworkRawPathsVerified=r['remoteNetworkBlobsVerified'],actualBytesRead=sum(x['actualBytes'] for x in r['fileByteReadback'])))
rows.sort(key=lambda r:r['startedAtLocalCommitUTC'])
result=dict(schemaVersion=1,updatedAtUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),definition='Wall time from the actual local full/isolated checkpoint commit timestamp to all required immutable RAW byte reads completing. Includes any intervening urgent metadata protection; excludes author/reviewer work before the commit. This is observed time, not a future performance guarantee.',checkpoints=rows)
out=ROOT/'course-app/docs/recovery-20261005/sync/DURABILITY-TIMINGS.json';out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(dict(path=str(out),completedCheckpoints=len(rows),recent=[dict(scope=r['scope'],seconds=r['elapsedFromLocalCommitToRawReceiptSeconds'],paths=r['actualNetworkRawPathsVerified']) for r in rows[-4:]])))
