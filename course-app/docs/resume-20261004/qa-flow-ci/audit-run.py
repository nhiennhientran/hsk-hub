"""Audit real CI downloads, exact reports and PNG/ledger sets; no browser or remote mutation.

Input: run-metadata.json {runId, head, tree, jobs, artifacts:[id,name,path,digest,head,bytes]}.
The native scope proof is separate from manual per-PNG visual adjudication.
"""
from pathlib import Path, PurePosixPath
import hashlib
import json
import shutil
import stat
import subprocess
import sys
import zipfile
from PIL import Image

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[3]
INPUT = Path(sys.argv[1])
metadata = json.loads((INPUT/(sys.argv[2] if len(sys.argv)>2 else 'run-metadata.json')).read_text())
run_id,head,tree = metadata['runId'],metadata['head'],metadata['tree']
expected = json.loads((OUT/'expected-collection.json').read_text())
DEST = OUT/('run-'+str(run_id)); DEST.mkdir(exist_ok=True)
issues = []

def sha(data):
    return hashlib.sha256(data).hexdigest()

def check(condition,reason):
    if not condition:
        issues.append(reason)
    return condition

def walk(suites,parents=()):
    for suite in suites:
        names = parents+(suite['title'],) if suite.get('line',0)>0 else parents
        for spec in suite.get('specs',[]):
            for test in spec['tests']:
                yield spec,test,' › '.join(names+(spec['title'],))
        yield from walk(suite.get('suites',[]),names)

def locate(directory,relative):
    suffix=PurePosixPath(relative).as_posix()
    stripped=suffix.removeprefix('course-app/')
    found={f for f in directory.rglob(PurePosixPath(relative).name) if f.as_posix().endswith('/'+suffix) or f==directory/stripped}
    if len(found)!=1:
        raise ValueError('Expected one report '+relative+'; found '+str(len(found)))
    return found.pop()

actual_tree = subprocess.check_output(['git','rev-parse',head+'^{tree}'],cwd=ROOT,text=True).strip()
check(actual_tree==tree,'Exact Git tree mismatch')
workflow = subprocess.check_output(['git','show',head+':.github/workflows/hsk-flow-package-checkpoint.yml'],cwd=ROOT)
accepted_workflow=expected.get('acceptedRemoteWorkflow')
expected_workflow_sha=accepted_workflow['SHA256'] if accepted_workflow and accepted_workflow['head']==head else expected['workflowSHA256']
check(sha(workflow)==expected_workflow_sha,'Workflow differs from independently accepted source')
for source in expected['fontSourceInputs']:
    data=subprocess.check_output(['git','show',head+':'+source['path']],cwd=ROOT)
    check(sha(data)==source['sha256'],'Target font source changed: '+source['path'])
check(len(metadata['jobs'])==6,'Expected six jobs')
check({j['name'] for j in metadata['jobs']}=={'flows ('+engine+', '+scope+')' for scope in ['shared','retained-hsk1','package'] for engine in ['chromium','webkit']},'Six exact job matrix names differ')
check(len({j['id'] for j in metadata['jobs']})==6,'Repeated flow job IDs')
for job in metadata['jobs']:
    check(job['run_id']==run_id and job['status']=='completed' and job['conclusion']=='success','Job not success/current run: '+job['name'])
log_rows=[]
check(len(metadata.get('logs',[]))==6,'Expected six actual job log downloads')
check({r['job_id'] for r in metadata.get('logs',[])}=={j['id'] for j in metadata['jobs']},'Logs do not cover exact six distinct job IDs')
job_map={j['id']:j['name'] for j in metadata['jobs']}
for log in metadata.get('logs',[]):
    file=Path(log['path']);data=file.read_bytes();text=data.decode()
    check(job_map.get(log['job_id'])=='flows ('+log['engine']+', '+log['scope']+')','Flow log matrix/job binding differs')
    check(head in text,'Actual job log missing exact checkout head: '+str(log['job_id']))
    check('Setting up fonts-noto-cjk (' in text,'Actual job log missing successful Noto CJK installation: '+str(log['job_id']))
    config={'shared':'playwright.flow.config.ts','retained-hsk1':'playwright.hsk1-retained.config.ts','package':'playwright.package-closure.config.ts'}[log['scope']]
    check(config+' --project='+log['engine'] in text,'Flow log lacks exact scope/engine invocation')
    lines=[{'line':n,'text':line} for n,line in enumerate(text.splitlines(),1) if head in line or 'Setting up fonts-noto-cjk (' in line or (' passed (' in line)]
    log_rows.append({'jobId':log['job_id'],'scope':log['scope'],'engine':log['engine'],'SHA256':sha(data),'bytes':len(data),'evidence':lines})
check(len({r['SHA256'] for r in log_rows})==6,'Repeated actual flow log bytes')

artifact_rows=[]
directories={}
for artifact in metadata['artifacts']:
    if not check(artifact['name'] in {'hsk-flow-package-'+scope+'-'+engine for scope in ['shared','retained-hsk1','package'] for engine in ['chromium','webkit']},'Unexpected artifact extraction directory name'):
        continue
    path=Path(artifact['path']);data=path.read_bytes()
    check(artifact['head']==head,'Artifact head mismatch: '+artifact['name'])
    check(artifact.get('run_id',run_id)==run_id,'Artifact run mismatch: '+artifact['name'])
    if not check(sha(data)==artifact['digest'].removeprefix('sha256:'),'Artifact ZIP digest mismatch: '+artifact['name']):
        continue
    check(len(data)==artifact['bytes'],'Artifact ZIP size mismatch: '+artifact['name'])
    directory=INPUT/artifact['name']
    with zipfile.ZipFile(path) as archive:
        if not check(archive.testzip() is None,'Artifact ZIP CRC failure: '+artifact['name']):
            continue
        assert len(archive.namelist())==len(set(archive.namelist()))
        assert all(not info.filename.startswith('/') and '..' not in PurePosixPath(info.filename).parts and not stat.S_ISLNK(info.external_attr>>16) for info in archive.infolist())
        if not check(not directory.is_symlink() and directory.resolve().parent==INPUT.resolve() and (not directory.exists() or directory.is_dir()),'Extraction destination is not owned direct child'):
            continue
        if directory.exists():
            shutil.rmtree(directory)
        directory.mkdir()
        archive.extractall(directory)
        members=len(archive.namelist())
    directories[artifact['name']]=directory
    artifact_rows.append({'id':artifact['id'],'name':artifact['name'],'head':artifact['head'],'bytes':len(data),'githubDigest':artifact['digest'],'actualSHA256':sha(data),'crc':'pass','members':members})
check(set(directories)=={'hsk-flow-package-'+scope+'-'+engine for scope in ['shared','retained-hsk1','package'] for engine in ['chromium','webkit']},'Six exact scope/engine artifact names missing or unexpected')

reports=[]
case_rows=[]
report_paths={
 'shared':('shared','course-app/docs/resume-20261004/flow-compat-review/native-flow-results.json'),
 'retained':('retained-hsk1','course-app/docs/resume-20261004/flow-compat-review/hsk1-retained-ci-results.json'),
 'fresh':('retained-hsk1','course-app/docs/resume-20261004/flow-compat-review/hsk1-fresh-backup-ci-results.json'),
 'package':('package','course-app/.repro-output/package-closure-browser.json'),
 'legacy':('package','course-app/docs/resume-20261004/flow-compat-review/legacy-native-results.json'),
 'reviewed':('package','course-app/.repro-output/media-reviewed-subset/browser-results.json'),
 'font':('package','course-app/docs/resume-20261004/source-font-visual/native-results.json'),
}
loaded={}
for engine in ['chromium','webkit']:
    for scope,(job_scope,relative) in report_paths.items():
        key=scope+'/'+engine
        try:
            directory=directories['hsk-flow-package-'+job_scope+'-'+engine]
            file=locate(directory,relative);data=file.read_bytes();raw=json.loads(data)
            loaded[key]=(raw,file)
            ci=raw['config']['metadata'].get('ci',{})
            check(ci.get('commitHash')==head,'Actual report exact CI head mismatch: '+key)
            check(ci.get('buildHref','').endswith('/'+str(run_id)),'Actual report exact run mismatch: '+key)
            check(raw['errors']==[],'Global report errors: '+key)
            check(all(raw['stats'][k]==0 for k in ['skipped','unexpected','flaky']),'Nonzero skipped/unexpected/flaky: '+key)
            ids=[]
            for spec,test,title in walk(raw['suites']):
                identity=test['projectName']+' | '+spec['file']+' | '+title
                ids.append(identity)
                results=test['results']
                passed=spec['ok'] and test['projectName']==engine and test['expectedStatus']=='passed' and test['status']=='expected' and len(results)==1 and results[0]['status']=='passed' and results[0]['retry']==0 and not results[0]['errors']
                check(passed,'Not exactly one ordinary passed retry0 result: '+key+' / '+identity)
                case_rows.append({'scope':scope,'engine':engine,'identity':identity,'passedOnceRetry0':passed,'expectedStatus':test['expectedStatus'],'status':test['status'],'results':[{'status':r['status'],'retry':r['retry'],'durationMs':r['duration'],'errors':r.get('errors',[])} for r in results]})
            expected_ids=[i for i in expected['scopes'][scope]['ids'] if i.startswith(engine+' | ')]
            check(len(ids)==len(set(ids)),'Duplicate identities: '+key)
            check(sorted(ids)==expected_ids,'Actual identities differ from independent collection: '+key)
            check(raw['stats']['expected']==len(ids),'Stats do not match actual cases: '+key)
            copied=DEST/(scope+'-'+engine+'.json');copied.write_bytes(data)
            reports.append({'scope':scope,'engine':engine,'artifact':'hsk-flow-package-'+job_scope+'-'+engine,'path':relative,'SHA256':sha(data),'stats':raw['stats'],'actualIdentities':len(ids),'actualExactHead':ci.get('commitHash')})
        except Exception as error:
            issues.append('Cannot audit report '+key+': '+repr(error))
    try:
        directory=directories['hsk-flow-package-retained-hsk1-'+engine]
        generic=locate(directory,'course-app/docs/resume-20261004/flow-compat-review/hsk1-retained-results.json')
        check(generic.read_bytes()==loaded['fresh/'+engine][1].read_bytes(),'Final generic retained reporter differs from fresh copy: '+engine)
    except Exception as error:
        issues.append('Cannot audit generic retained duplicate '+engine+': '+repr(error))

fields=[];tables=[]
for source in expected['fontSourceInputs']:
    lesson=source['lesson']
    for activity in lesson['activities']:
        if lesson['lesson']>=12:
            for field in activity['fields']:
                if field.get('pinyin'):
                    fields.append({'lesson':lesson['lesson'],'activityId':activity['id'],'activityVersion':activity['version'],'fieldId':field['id'],'label':field['label'],'pinyin':field['pinyin'],'source':field.get('source',activity['source'])})
        table=activity.get('table')
        if lesson['lesson']<12 and table and any(c['zh']==c['vi']=='' for c in table['columns']):
            tables.append({'lesson':lesson['lesson'],'activityId':activity['id'],'activityVersion':activity['version'],'source':activity['source'],'columns':table['columns'],'blankHeaderIndexes':[i for i,c in enumerate(table['columns']) if c['zh']==c['vi']==''],'rowCount':len(table['rows']),'blankBodyCells':sum(not c.get('text') and not c.get('fieldId') for r in table['rows'] for c in r['cells'])})
check(len(fields)==24 and len(tables)==5,'Font source expected24/5 changed')
png_rows=[];ledger_rows=[]
for engine in ['chromium','webkit']:
    try:
        raw,file=loaded['font/'+engine]
        own=file.parent
        ledgers=list((own/'native-output').glob('*/source-font-evidence.json'))
        check(len(ledgers)==2,'Expected two fresh native font ledgers: '+engine)
        widths=[]
        for ledger_file in ledgers:
            ledger=json.loads(ledger_file.read_text());width=ledger['viewport']['width'];widths.append(width)
            check(ledger['project']==engine,'Font ledger wrong engine')
            check(ledger['glyphFontCertification'] is False,'Fixture must leave glyph certification to manual review')
            check([{k:f[k] for k in fields[0]} for f in ledger['fields']]==fields,'Font field ledger differs from exact source: '+engine+'/'+str(width))
            check([{k:t[k] for k in tables[0]} for t in ledger['tables']]==tables,'Font table ledger differs from exact source: '+engine+'/'+str(width))
            ids={f['activityId'] for f in fields}|{t['activityId'] for t in tables}
            expected_names={f'{engine}-{width}-{name}.png' for name in ids}
            check(set(ledger['screenshots'])==expected_names and len(ledger['screenshots'])==17,'Font screenshots expected17 set mismatch')
            check({p.name for p in ledger_file.parent.glob('*.png')}==expected_names,'Font actual PNG set mismatch')
            for name in ledger['screenshots']:
                png=ledger_file.parent/name
                with Image.open(png) as image:
                    size=[image.width,image.height];image.verify()
                activity_id=name.removeprefix(f'{engine}-{width}-').removesuffix('.png')
                png_rows.append({'engine':engine,'viewportWidth':width,'activityId':activity_id,'path':str(png),'SHA256':sha(png.read_bytes()),'pixels':size,'expectedFields':[f for f in fields if f['activityId']==activity_id],'expectedTable':next((t for t in tables if t['activityId']==activity_id),None),'manualVisualVerdict':'pending'})
            ledger_rows.append({'engine':engine,'width':width,'SHA256':sha(ledger_file.read_bytes()),'fields':len(ledger['fields']),'tables':len(ledger['tables']),'screenshots':len(ledger['screenshots'])})
        check(sorted(widths)==[320,1440],'Font widths mismatch: '+engine)
    except Exception as error:
        issues.append('Cannot audit font assets '+engine+': '+repr(error))
check(len(png_rows)==68,'Expected68 actual font PNGs')
check(len({(p['engine'],p['viewportWidth'],p['activityId']) for p in png_rows})==68,'Duplicate font PNG identities')
check(len(case_rows)==236,'Actual236 native case denominator mismatch')
check(len({c['identity'] for c in case_rows})==len(case_rows),'Cross-scope native identities duplicate')
assembly=[]
for engine in ['chromium','webkit']:
    try:
        directory=directories['hsk-flow-package-package-'+engine]
        file=locate(directory,'course-app/.repro-output/flow-package-assembly.json');raw=json.loads(file.read_text())
        check(raw['sourceCommit']==head,'Assembly source head mismatch: '+engine)
        check(raw['sourceDirty'] is False,'Unexpected dirty source in clean actual CI assembly: '+engine)
        check(raw['status']=='assembled-checkpoint-not-release','Assembly was not private checkpoint')
        assembly.append({k:raw[k] for k in ['sourceCommit','sourceDirty','sourceSnapshotSHA256','productionCommit','productionTree','assembledFiles','inventorySHA256','unifiedManifestSHA256','status']}|{'engine':engine,'reportSHA256':sha(file.read_bytes())})
        (DEST/('assembly-'+engine+'.json')).write_bytes(file.read_bytes())
    except Exception as error:
        issues.append('Cannot audit package assembly '+engine+': '+repr(error))

visual_issues=[]
visual_file=DEST/'visual-review.json'
visual_proof={'manualReviewed':0,'passed':0,'failed':0,'pending':len(png_rows),'glyphFontCertification':False}
if visual_file.exists():
    manual=json.loads(visual_file.read_text())
    actual_map={(p['engine'],p['viewportWidth'],p['activityId']):p for p in png_rows}
    manual_map={(p['engine'],p['viewportWidth'],p['activityId']):p for p in manual['PNGs']}
    if manual.get('runId')!=run_id or manual.get('head')!=head:
        visual_issues.append('Manual visual proof belongs to different run/head')
    if len(manual['PNGs'])!=68 or set(manual_map)!=set(actual_map):
        visual_issues.append('Manual visual proof does not cover exact68 unique actual PNGs')
    for identity,p in manual_map.items():
        actual=actual_map.get(identity)
        if not actual or any(p.get(k)!=actual[k] for k in ['SHA256','pixels','expectedFields','expectedTable']):
            visual_issues.append('Manual proof differs from actual PNG/source: '+str(identity))
        if p.get('manualVisualVerdict')!='pass' or not p.get('manualVisualNotes'):
            visual_issues.append('Manual visual verdict missing/not pass: '+str(identity))
    visual_proof={k:manual[k] for k in ['manualReviewed','passed','failed','pending','glyphFontCertification']}
    if visual_proof!={'manualReviewed':68,'passed':68,'failed':0,'pending':0,'glyphFontCertification':True}:
        visual_issues.append('Manual visual totals/certification not complete')
    visual_proof.update({'SHA256':sha(visual_file.read_bytes()),'file':visual_file.name,'method':manual.get('manualReviewMethod')})
else:
    visual_issues.append('Individual manual PNG review absent')
visual_gate=not issues and not visual_issues
audit={'runId':run_id,'head':head,'tree':tree,'actualMainCases':len(case_rows),'actualPassedOnceRetry0':sum(c['passedOnceRetry0'] for c in case_rows),'allNativeGatesPassed':not issues,'visualGatePassed':visual_gate,'manualVisualReviewRequired':True,'manualVisualProof':visual_proof,'visualIssues':visual_issues,'jobs':metadata['jobs'],'artifacts':artifact_rows,'reports':reports,'cases':case_rows,'fontLedgers':ledger_rows,'fontPNGs':png_rows,'assembly':assembly,'issues':issues,'scopeNote':'Scope-specific fresh reports only; committed historical JSON/PNGs from other scopes ignored. Native results are separate from manual Noto PNG adjudication.'}
audit['logs']=log_rows
(DEST/'audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'runId':run_id,'head':head,'actualMainCases':len(case_rows),'actualPassedOnceRetry0':audit['actualPassedOnceRetry0'],'actualFontPNGs':len(png_rows),'issues':issues,'visualGatePassed':visual_gate,'visualIssues':visual_issues},ensure_ascii=False,indent=2))
sys.exit(1 if issues else 0)
