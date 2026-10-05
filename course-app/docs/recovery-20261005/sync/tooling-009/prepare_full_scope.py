#!/usr/bin/env python3
"""Prepare then commit one already frozen exact scope through the sole normal index."""
import argparse,json,pathlib,subprocess
ROOT=pathlib.Path('/workspace/scratch/28b55072841a/hsk-hub-resume-recovered')
HELPER=pathlib.Path('/workspace/scratch/28b55072841a/source-recovery-sync-tools')
p=argparse.ArgumentParser();p.add_argument('--scope',required=True);a=p.parse_args()
q=json.loads((HELPER/'sync-queue.json').read_text());rows=[x for x in q if x['scope']==a.scope];assert len(rows)==1
c=json.loads(pathlib.Path(rows[0]['capsule']).read_text());prepared=HELPER/(a.scope+'-full-prepared.json');committed=HELPER/(a.scope+'-full-committed.json')
subprocess.run(['python3',str(HELPER/'prepare_checkpoint.py'),'--repo',str(ROOT),'--stage',c['stage'],'--freeze',c['freezePath'],'--freeze-sha256',c['freezeSHA256'],'--scope',c['scope'],'--qualification',c['qualification'],'--output',str(prepared)],check=True)
subprocess.run(['python3',str(HELPER/'commit_checkpoint.py'),'--repo',str(ROOT),'--capsule',str(prepared),'--message','Preserve complete original frozen recovery evidence: '+a.scope,'--output',str(committed)],check=True)
