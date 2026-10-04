"""Read-only independent current core CI audit; accepts real ZIP/log downloads."""
from pathlib import Path, PurePosixPath
import collections
import hashlib
import json
import re
import shutil
import stat
import subprocess
import sys
import zipfile

OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[4]
INPUT=Path(sys.argv[1])
meta=json.loads((INPUT/'run-metadata.json').read_text())
expected=json.loads((OUT/'expected-collection.json').read_text())
RUN=37226336569
HEAD='dd8b22ccb1c1a9c41bc1243887f7a60558635782'
TREE='e2c89f9c2029cec09d8a8bbb1315e9cd99ea225c'
issues=[]

def sha(data):return hashlib.sha256(data).hexdigest()
def jsha(data):return sha(json.dumps(data,ensure_ascii=False,separators=(',',':')).encode())
def check(condition,reason):
    if not condition:issues.append(reason)
    return condition
def write(name,data):(OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def locate(directory,relative):
    suffix='/'+PurePosixPath(relative).as_posix()
    matches=[p for p in directory.rglob(PurePosixPath(relative).name) if p.as_posix().endswith(suffix)]
    if len(matches)!=1:raise ValueError('Expected one actual file '+relative+': '+str(len(matches)))
    return matches[0]
def walk(suites,parents=()):
    for suite in suites:
        names=parents+(suite['title'],) if suite.get('line',0)>0 else parents
        for spec in suite.get('specs',[]):
            for test in spec['tests']:yield spec,test,' › '.join(names+(spec['title'],))
        yield from walk(suite.get('suites',[]),names)
def inspect_report(file,scope,engine):
    data=file.read_bytes();raw=json.loads(data);ci=raw['config']['metadata'].get('ci',{})
    check(ci.get('commitHash')==HEAD,'Report wrong CI head: '+scope)
    check(ci.get('buildHref','').endswith('/'+str(RUN)),'Report wrong CI run: '+scope)
    check(raw['errors']==[],'Global report errors: '+scope)
    check(all(raw['stats'][k]==0 for k in ['skipped','unexpected','flaky']),'Skipped/unexpected/flaky report: '+scope)
    rows=[]
    for spec,test,title in walk(raw['suites']):
        identity=engine+' | '+spec['file']+' | '+title
        results=test['results']
        passed=spec['ok'] and test['projectName']==engine and test['status']=='expected' and test['expectedStatus']=='passed' and len(results)==1 and results[0]['status']=='passed' and results[0]['retry']==0 and not results[0]['errors']
        check(passed,'Not single passed retry0: '+scope+' / '+identity)
        rows.append({'identity':identity,'scope':scope,'passedOnceRetry0':passed,'status':test['status'],'expectedStatus':test['expectedStatus'],'results':[{'status':r['status'],'retry':r['retry'],'durationMs':r['duration'],'errors':r.get('errors',[])} for r in results]})
    ids=sorted(r['identity'] for r in rows)
    check(len(ids)==len(set(ids))==raw['stats']['expected'],'Report identity/stat mismatch: '+scope)
    destination=OUT/'reports';destination.mkdir(exist_ok=True)
    saved=destination/(scope.replace('/','-')+'.json');saved.write_bytes(data)
    summary={'scope':scope,'SHA256':sha(data),'stats':raw['stats'],'identities':ids,'savedReport':str(saved.relative_to(OUT)),'CIExactHead':ci.get('commitHash')}
    return raw,rows,summary

check(meta['runId']==RUN and meta['head']==HEAD and meta['tree']==TREE,'Input run/head/tree mismatch')
check(subprocess.check_output(['git','rev-parse',HEAD+'^{tree}'],cwd=ROOT,text=True).strip()==TREE,'Git object tree mismatch')
workflow=subprocess.check_output(['git','show',HEAD+':.github/workflows/hsk123-unified.yml'],cwd=ROOT)
check(sha(workflow)==expected['workflowSHA256'],'Exact workflow differs from independent collection')
check(b'timeout-minutes: 60' in workflow,'Actual workflow timeout differs')
for source in expected['sourceInputs']:
    check(sha(subprocess.check_output(['git','show',HEAD+':'+source['path']],cwd=ROOT))==source['SHA256'],'Expected collection source differs: '+source['path'])
job_names={'checkpoint ('+engine+', '+str(shard)+')' for engine in ['chromium','webkit'] for shard in [1,2]}
check(len(meta['jobs'])==4 and {j['name'] for j in meta['jobs']}==job_names,'Expected four unique core jobs')
for job in meta['jobs']:check(job['run_id']==RUN and job['status']=='completed' and job['conclusion']=='success','Job not actual current success: '+job['name'])
check(len({j['id'] for j in meta['jobs']})==4,'Repeated core job IDs')
artifacts=[];directories={}
accepted_artifact_names={'hsk123-'+scope+'-'+engine+'-shard'+str(shard) for scope in ['reports','pilot-screens'] for engine in ['chromium','webkit'] for shard in [1,2]}|{'hsk1-standalone-scene-'+engine for engine in ['chromium','webkit']}
for item in meta['artifacts']:
    try:
        if not check(item['name'] in accepted_artifact_names,'Artifact name is not an accepted owned directory name'):continue
        file=Path(item['path']);data=file.read_bytes()
        check(item['head']==HEAD and item['run_id']==RUN,'Wrong artifact head/run: '+item['name'])
        if not check(sha(data)==item['digest'].removeprefix('sha256:'),'Artifact actual ZIP digest mismatch: '+item['name']):continue
        check(len(data)==item['bytes'],'Artifact byte size mismatch: '+item['name'])
        with zipfile.ZipFile(file) as z:
            check(z.testzip() is None,'ZIP CRC failure: '+item['name'])
            check(len(z.namelist())==len(set(z.namelist())),'Duplicate ZIP members: '+item['name'])
            safe=all(not p.filename.startswith('/') and '..' not in PurePosixPath(p.filename).parts and not stat.S_ISLNK(p.external_attr>>16) for p in z.infolist())
            if not check(safe,'Unsafe ZIP paths/symlink: '+item['name']):continue
            directory=INPUT/item['name']
            if not check(not directory.is_symlink() and directory.resolve().parent==INPUT.resolve() and (not directory.exists() or directory.is_dir()),'Extraction destination is not an owned direct child directory'):continue
            if directory.exists():shutil.rmtree(directory)
            directory.mkdir();z.extractall(directory);members=len(z.namelist())
        directories[item['name']]=directory
        artifacts.append({'id':item['id'],'name':item['name'],'bytes':len(data),'githubDigest':item['digest'],'actualSHA256':sha(data),'head':HEAD,'runId':RUN,'CRC':'pass','members':members,'uniqueSafeMembers':safe})
    except Exception as error:issues.append('Cannot audit ZIP '+item['name']+': '+repr(error))
required={'hsk123-reports-'+engine+'-shard'+str(shard) for engine in ['chromium','webkit'] for shard in [1,2]}|{'hsk1-standalone-scene-'+engine for engine in ['chromium','webkit']}
check(required<=set(directories),'Missing current reports/standalone proof artifact')
reports=[];cases=[];identities={}
for engine in ['chromium','webkit']:
    for shard in [1,2]:
        artifact='hsk123-reports-'+engine+'-shard'+str(shard)
        for host,relative in [('unified','course-app/.repro-output/unified-browser.json')]+([('modular','hsk1-app/.repro-output/step8-browser.json')] if shard==2 else []):
            key=host+'/'+engine+('/shard'+str(shard) if host=='unified' else '')
            try:
                file=locate(directories[artifact],relative);raw,rows,summary=inspect_report(file,key,engine)
                summary.update({'artifact':artifact,'artifactPath':relative});reports.append(summary);cases+=rows;ids=summary['identities'];identities[key]=ids
                check(ids==expected['scopes'][key]['identities'],'Actual identity set differs from current independent collection: '+key)
                if host=='modular':
                    duplicate=locate(directories['hsk1-standalone-scene-'+engine],'.repro-output/step8-browser.json')
                    check(duplicate.read_bytes()==file.read_bytes(),'Standalone artifact reporter differs from actual same-job report: '+engine)
            except Exception as error:issues.append('Cannot audit report '+key+': '+repr(error))
retention={};baseline=json.loads(subprocess.check_output(['git','show',HEAD+':course-app/docs/browser-shard-review/baseline-600-main-test-ids.json'],cwd=ROOT))
prior860_bytes=subprocess.check_output(['git','show',HEAD+':course-app/docs/resume-20261004/native-catalogue/ci-37220700329-passed-identities.json'],cwd=ROOT)
prior860=json.loads(prior860_bytes)
check(prior860['runId']==37220700329 and prior860['sourceCommit']=='ce374837090017fd76e7e65ea8e6e1d95851a8db' and prior860['tree']=='09f9b5dd4ebb456c960103d679584f5b7bdc06c6','Prior860 provenance differs')
equiv=None
try:
    file=locate(directories['hsk123-reports-chromium-shard1'],'course-app/.repro-output/browser-shard-equivalence.json');data=file.read_bytes();equiv=json.loads(data);(OUT/'reports/browser-shard-equivalence.json').write_bytes(data)
    for engine in ['chromium','webkit']:
        s1=identities['unified/'+engine+'/shard1'];s2=identities['unified/'+engine+'/shard2'];full=sorted(s1+s2)
        check(not set(s1)&set(s2),'Shards overlap: '+engine);check(full==expected['scopes']['unified/'+engine]['identities'],'Actual shard union differs from current full collection: '+engine)
        check(full==equiv['projects'][engine]['fullTestIds'] and jsha(full)==equiv['projects'][engine]['fullSha256'],'Remote collection differs from actual union: '+engine)
        check([s1,s2]==equiv['projects'][engine]['shardTestIds'],'Remote collection shard identities differ: '+engine)
        identities['unified/'+engine]=full
        for host in ['unified','modular']:
            key=host+'/'+engine;actual=identities[key];old=baseline['hosts'][host]['projects'][engine];prior=expected['prior860Retention'][key]
            prior_ids=prior860['identities'][key]
            check(len(prior_ids)==len(set(prior_ids))==prior['prior860'] and set(prior_ids)<=set(actual),'Direct exact prior860 identities missing: '+key)
            check(len(old['testIds'])==old['count'] and jsha(old['testIds'])==old['sha256'],'Invalid old600 baseline: '+key)
            check(set(old['testIds'])<=set(actual),'Old600 identity missing: '+key)
            catalogue=sorted(i for i in actual if ' source catalogue ' in i)
            check(catalogue==equiv['catalogue'][key]['testIds'] and len(catalogue)==63,'Catalogue actual exact identities differ: '+key)
            for lesson in range(1,16):
                for width in [320,390,768,1440]:check(sum(i.endswith('source catalogue L'+str(lesson)+' complete DOM at '+str(width)) for i in actual)==1,'Missing unique source lesson/width: '+key+'/'+str(lesson)+'/'+str(width))
            gallery=[i for i in actual if 'all textbook scene galleries retain source bindings' in i]
            check(len(gallery)==2,'Actual45scene48gallery cases missing: '+key)
            added=sorted(set(actual)-set(old['testIds'])-set(catalogue)-set(gallery))
            check(added==prior['newIdentities'],'Unexpected extra/missing new12 identity: '+key)
            retention[key]={'actual':len(actual),'prior860Retained':prior['prior860'],'old600Retained':old['count'],'catalogue':len(catalogue),'gallery':len(gallery),'newFontPartialIdentities':added,'actualIdentitySHA256':jsha(actual),'missing':[]}
except Exception as error:issues.append('Cannot audit exact equivalence/retention: '+repr(error))
actual_ids=[c['identity'] for c in cases]
check(len(actual_ids)==len(set(actual_ids))==expected['actualCollectedTotal'],'Current actual native denominator/uniqueness differs')
logs=[]
check(len(meta.get('logs',[]))==4,'Missing four actual completed-job logs')
check({r['job_id'] for r in meta.get('logs',[])}=={j['id'] for j in meta['jobs']},'Logs do not cover exact distinct job IDs')
job_map={j['id']:j['name'] for j in meta['jobs']}
for row in meta.get('logs',[]):
    data=Path(row['path']).read_bytes();text=data.decode()
    check(job_map.get(row['job_id'])=='checkpoint ('+row['engine']+', '+str(row['shard'])+')','Log matrix/job binding differs')
    check(HEAD in text and 'Setting up fonts-noto-cjk (' in text,'Missing actual checkout/Noto setup log: '+str(row['job_id']))
    check('npx playwright test --config=playwright.unified.config.ts --project='+row['engine']+' --shard='+str(row['shard'])+'/2' in text,'Log lacks exact main matrix invocation')
    evidence=[{'line':n,'text':line} for n,line in enumerate(text.splitlines(),1) if HEAD in line or 'Setting up fonts-noto-cjk (' in line or ' passed (' in line]
    logs.append({'jobId':row['job_id'],'engine':row['engine'],'shard':row['shard'],'SHA256':sha(data),'bytes':len(data),'evidence':evidence})
check(len({r['SHA256'] for r in logs})==4,'Repeated actual job log bytes')
focused=[]
try:
    file=locate(directories['hsk123-reports-webkit-shard1'],'course-app/.repro-output/audio-startup-focused.json');raw,rows,summary=inspect_report(file,'focused-webkit-startup','webkit')
    focused_id='webkit | media.spec.ts | HSK 2 lesson 3 scene 4 all original sentences obey native boundaries'
    check(summary['identities']==[focused_id],'Focused WebKit exact startup identity differs');focused.append(summary)
except Exception as error:issues.append('Cannot audit focused native startup: '+repr(error))
flow=json.loads((OUT.parent/'run-37226015769/audit.json').read_text());flow_ids={c['identity'] for c in flow['cases']}
check(flow['runId']==37226015769 and flow['head']==HEAD and flow['tree']==TREE and flow['allNativeGatesPassed'] and flow['visualGatePassed'],'Other exact-head flow/visual gate not accepted')
check(len(flow['cases'])==len(flow_ids)==flow['actualMainCases']==flow['actualPassedOnceRetry0']==236 and all(c['passedOnceRetry0'] for c in flow['cases']),'Flow proof is not exact236 unique actual passed cases')
check(sha((OUT.parent/'run-37226015769/visual-review.json').read_bytes())==flow['manualVisualProof']['SHA256'],'Flow manual visual proof bytes changed')
overlap=sorted(set(actual_ids)&flow_ids)
independent_new12=sorted(i for x in expected['prior860Retention'].values() for i in x['newIdentities'])
check(overlap==independent_new12,'Actual overlap with flow236 differs from exact newly added12')
audit={'runId':RUN,'runURL':'https://github.com/nhiennhientran/hsk-hub/actions/runs/'+str(RUN),'head':HEAD,'tree':TREE,'workflowSHA256':sha(workflow),'actualMainCases':len(cases),'actualPassedOnceRetry0':sum(c['passedOnceRetry0'] for c in cases),'allNativeGatesPassed':not issues,'jobs':meta['jobs'],'artifacts':artifacts,'reports':reports,'cases':cases,'retention':retention,'prior860ProofSHA256':sha(prior860_bytes),'logs':logs,'focusedOutsideMain':focused,'crossRun':{'flowRunId':flow['runId'],'coreActualCases':len(actual_ids),'flowActualCases':len(flow_ids),'overlapCases':len(overlap),'overlapIdentities':overlap,'unionIdentities':len(set(actual_ids)|flow_ids),'note':'Counts are exact identities, not sum of duplicated executions. Both run scopes remain separately certified.'},'issues':issues,'visualScope':'68 font PNGs individually accepted in exact-head flow37226015769; current core main proof separately verifies every case. No claim to inspect all45 scenes as images.'}
write('audit.json',audit);write('passed-identities.json',{'runId':RUN,'head':HEAD,'tree':TREE,'identities':identities})
print(json.dumps({'actualMainCases':len(cases),'actualPassedOnceRetry0':audit['actualPassedOnceRetry0'],'artifacts':len(artifacts),'retention':retention,'overlapWithFlow':len(overlap),'issues':issues},ensure_ascii=False,indent=2))
sys.exit(1 if issues else 0)
