"""Collect exact current fixture identities only; never executes a browser."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib
import json
import os
import re
import subprocess

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[3]
HEAD = '8dff803cc2f8d1956d5853ef40073c670e265cc0'
COURSE = ROOT / 'course-app'
FLOW = COURSE / 'docs/resume-20261004/flow-compat-review'
SPECS = {
    'shared':(FLOW, COURSE/'node_modules/@playwright/test/cli.js','playwright.flow.config.ts',64,{}),
    'retained':(FLOW,ROOT/'hsk1-app/node_modules/@playwright/test/cli.js','playwright.hsk1-retained.config.ts',35,{}),
    'fresh':(FLOW,ROOT/'hsk1-app/node_modules/@playwright/test/cli.js','playwright.hsk1-retained.config.ts',1,{'FLOW_HSK1_MATCH':'hsk1-fresh-backup.retained.ts'}),
    'package':(COURSE,COURSE/'node_modules/@playwright/test/cli.js','playwright.package-closure.config.ts',9,{}),
    'legacy':(FLOW,COURSE/'node_modules/@playwright/test/cli.js','playwright.legacy.config.ts',3,{}),
    'reviewed':(COURSE,COURSE/'node_modules/@playwright/test/cli.js','playwright.reviewed-sentences.config.ts',4,{}),
    'font':(COURSE,COURSE/'node_modules/@playwright/test/cli.js','docs/resume-20261004/source-font-visual/playwright.source-font-visual.config.ts',2,{}),
}

def collect(item):
    scope,(cwd,cli,config,count,overrides) = item
    env = dict(os.environ)
    for name in ['FLOW_TEST_MATCH','FLOW_HSK1_MATCH','FLOW_LEGACY_MATCH']:
        env.pop(name,None)
    env.update(overrides)
    env['FORCE_COLOR']='0'
    command = ['node',str(cli),'test','--config='+config,'--list','--reporter=list','--output='+str(OUT/'collection-output'/scope)]
    run = subprocess.run(command,cwd=cwd,env=env,text=True,capture_output=True)
    (OUT/('collection-'+scope+'.log')).write_text(run.stdout+run.stderr)
    assert run.returncode == 0,(scope,run.stderr)
    found = sorted(m.group(1)+' | '+m.group(2)+' | '+m.group(3) for m in re.finditer(r'^\s+\[([^\]]+)\] › (.*):\d+:\d+ › (.*)$',run.stdout,re.MULTILINE))
    assert len(found) == len(set(found)) == count*2,(scope,len(found))
    return scope,{'countPerEngine':count,'ids':found,'logSHA256':hashlib.sha256((run.stdout+run.stderr).encode()).hexdigest(),'command':command,'envOverrides':overrides}

assert subprocess.check_output(['git','rev-parse',HEAD+'^{tree}'],cwd=ROOT,text=True).strip() == '422f45046960d6148075ee81d891f0569839441c'
with ThreadPoolExecutor(max_workers=3) as pool:
    scopes = dict(pool.map(collect,SPECS.items()))
workflow = subprocess.check_output(['git','show',HEAD+':.github/workflows/hsk-flow-package-checkpoint.yml'],cwd=ROOT)
source = []
for number in [3,6,7,12,13,14,15]:
    path = f'hsk1-app/content/source-activities/lesson-{number:02}.json'
    value = subprocess.check_output(['git','show',HEAD+':'+path],cwd=ROOT)
    assert (ROOT/path).read_bytes() == value
    source.append({'path':path,'sha256':hashlib.sha256(value).hexdigest(),'lesson':json.loads(value)})
result = {'collectionOnly':True,'fixtureSourceCommit':HEAD,'fixtureSourceTree':'422f45046960d6148075ee81d891f0569839441c','workflowSHA256':hashlib.sha256(workflow).hexdigest(),'expectedTotal':sum(len(s['ids']) for s in scopes.values()),'scopes':scopes,'fontSourceInputs':source}
assert result['expectedTotal'] == 236
(OUT/'expected-collection.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'collectionOnly':True,'expectedTotal':236,'scopePerEngine':{k:v['countPerEngine'] for k,v in scopes.items()}}))
