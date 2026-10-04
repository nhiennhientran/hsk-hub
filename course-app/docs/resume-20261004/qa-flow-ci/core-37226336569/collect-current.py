"""Independent exact-head collection; browser execution is certified separately."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib
import json
import os
import re
import subprocess

OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[4]
HEAD='dd8b22ccb1c1a9c41bc1243887f7a60558635782'
TREE='e2c89f9c2029cec09d8a8bbb1315e9cd99ea225c'
assert subprocess.check_output(['git','rev-parse',HEAD+'^{tree}'],cwd=ROOT,text=True).strip()==TREE
source_paths=subprocess.check_output(['git','ls-tree','-r','--name-only',HEAD,'course-app/tests/unified','hsk1-app/tests/browser','course-app/playwright.unified.config.ts','hsk1-app/playwright.config.ts','course-app/tools/verify-browser-shards.mjs'],cwd=ROOT,text=True).splitlines()
source=[]
for path in source_paths:
    data=subprocess.check_output(['git','show',HEAD+':'+path],cwd=ROOT)
    assert (ROOT/path).read_bytes()==data,'Collection source differs from exact head: '+path
    source.append({'path':path,'SHA256':hashlib.sha256(data).hexdigest()})

def collect(item):
    host,engine,shard=item
    app=ROOT/('course-app' if host=='unified' else 'hsk1-app')
    args=['node',str(app/'node_modules/@playwright/test/cli.js'),'test']
    if host=='unified':args+=['--config=playwright.unified.config.ts']
    else:args+=['textbook-scene-navigation.spec.ts','source-pilot.spec.ts','source-catalogue.spec.ts']
    args+=['--project='+engine,'--list','--reporter=list','--output='+str(OUT/'collection-output'/host/engine/str(shard))]
    if shard:args+=['--shard='+str(shard)+'/2']
    key=host+'/'+engine+('/shard'+str(shard) if shard else '')
    run=subprocess.run(args,cwd=app,env={**os.environ,'FORCE_COLOR':'0'},text=True,capture_output=True)
    log=OUT/('collection-'+key.replace('/','-')+'.log');log.write_text(run.stdout+run.stderr)
    assert run.returncode==0,(key,run.stderr)
    ids=sorted(m.group(1)+' | '+m.group(2)+' | '+m.group(3) for m in re.finditer(r'^\s+\[([^\]]+)\] › (.*):\d+:\d+ › (.*)$',run.stdout,re.MULTILINE))
    assert ids and len(ids)==len(set(ids)),key
    return key,{'count':len(ids),'identities':ids,'logSHA256':hashlib.sha256(log.read_bytes()).hexdigest(),'command':args}

tasks=[('unified',engine,shard) for engine in ['chromium','webkit'] for shard in [0,1,2]]+[('modular',engine,0) for engine in ['chromium','webkit']]
with ThreadPoolExecutor(max_workers=3) as pool:scopes=dict(pool.map(collect,tasks))
old=json.loads((ROOT/'course-app/docs/resume-20261004/native-catalogue/ci-37220700329-passed-identities.json').read_text())['identities']
retention={}
for engine in ['chromium','webkit']:
    full=scopes['unified/'+engine]['identities'];s1=scopes['unified/'+engine+'/shard1']['identities'];s2=scopes['unified/'+engine+'/shard2']['identities']
    assert not set(s1)&set(s2) and full==sorted(s1+s2)
    for host in ['unified','modular']:
        key=host+'/'+engine;ids=scopes[key]['identities'];prior=old[key]
        assert set(prior)<=set(ids),'Old860 identity removed: '+key
        retention[key]={'actual':len(ids),'prior860':len(prior),'missing':[],'newIdentities':sorted(set(ids)-set(prior))}
total=sum(scopes[host+'/'+engine]['count'] for host in ['unified','modular'] for engine in ['chromium','webkit'])
workflow=subprocess.check_output(['git','show',HEAD+':.github/workflows/hsk123-unified.yml'],cwd=ROOT)
result={'collectionOnly':True,'head':HEAD,'tree':TREE,'actualCollectedTotal':total,'workflowSHA256':hashlib.sha256(workflow).hexdigest(),'sourceInputs':source,'scopes':scopes,'prior860Retention':retention}
(OUT/'expected-collection.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'collectionOnly':True,'actualCollectedTotal':total,'fullCounts':{key:x['count'] for key,x in scopes.items()},'prior860Retained':sum(x['prior860'] for x in retention.values()),'newIdentities':sum(len(x['newIdentities']) for x in retention.values())},indent=2))
