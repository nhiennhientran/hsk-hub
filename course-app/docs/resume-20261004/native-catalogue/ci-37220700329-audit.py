"""Read-only audit of downloaded GitHub artifacts; writes only its CI doc prefix."""
import collections
import hashlib
import json
import pathlib
import re
import shutil
import subprocess
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[4]
INPUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path('/workspace/scratch/28b55072841a/ci-audit-37220700329')
OUT = pathlib.Path(__file__).parent
HEAD = 'ce374837090017fd76e7e65ea8e6e1d95851a8db'
TREE = '09f9b5dd4ebb456c960103d679584f5b7bdc06c6'
RUN = 37220700329

def sha(data):
    return hashlib.sha256(data).hexdigest()

def js_sha(value):
    return sha(json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode())

def write(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def walk(suites):
    for suite in suites:
        for spec in suite.get('specs', []):
            for test in spec['tests']:
                yield spec, test
        yield from walk(suite.get('suites', []))

assert subprocess.check_output(['git', 'rev-parse', HEAD+'^{tree}'], cwd=ROOT, text=True).strip() == TREE
workflow = subprocess.check_output(['git', 'show', HEAD+':.github/workflows/hsk123-unified.yml'], cwd=ROOT)
assert b'timeout-minutes: 60' in workflow
baseline_bytes = subprocess.check_output(['git', 'show', HEAD+':course-app/docs/browser-shard-review/baseline-600-main-test-ids.json'], cwd=ROOT)
baseline = json.loads(baseline_bytes)
jobs = json.loads((INPUT / 'jobs.json').read_text())
assert len(jobs) == 4 and all(j['status'] == 'completed' and j['conclusion'] == 'success' and j['run_id'] == RUN for j in jobs)
artifacts = []
for item in json.loads((INPUT / 'downloads.json').read_text()) + json.loads((INPUT / 'downloads-shard2.json').read_text()):
    file = pathlib.Path(item['path'])
    data = file.read_bytes()
    assert sha(data) == item['digest'].removeprefix('sha256:')
    assert item['head'] == HEAD
    assert len(data) == item.get('bytes', item.get('size_bytes'))
    with zipfile.ZipFile(file) as z:
        assert z.testzip() is None
        assert len(z.namelist()) == len(set(z.namelist()))
        assert all(not n.startswith('/') and '..' not in pathlib.PurePosixPath(n).parts for n in z.namelist())
        artifacts.append({'id':item['id'], 'name':item['name'], 'bytes':len(data), 'githubDigest':item['digest'], 'actualSha256':sha(data), 'head':HEAD, 'crc':'pass', 'uniqueMembers':True, 'members':len(z.namelist()), 'zipDownloadPath':str(file)})

equiv_file = next(INPUT.glob('**/browser-shard-equivalence.json'))
equiv = json.loads(equiv_file.read_text())
report_dir = OUT / 'ci-37220700329-reports'
report_dir.mkdir(exist_ok=True)
report_rows = []
identities = {}
for engine in ('chromium', 'webkit'):
    for shard in (1, 2):
        artifact = 'hsk123-reports-'+engine+'-shard'+str(shard)
        for host, relative in [('unified', 'course-app/.repro-output/unified-browser.json')] + ([('modular', 'hsk1-app/.repro-output/step8-browser.json')] if shard == 2 else []):
            file = INPUT / artifact / relative
            data = file.read_bytes()
            report = json.loads(data)
            assert report['config']['metadata']['ci']['commitHash'] == HEAD
            assert report['config']['metadata']['ci']['buildHref'].endswith('/'+str(RUN))
            assert report['errors'] == []
            assert all(report['stats'][k] == 0 for k in ('skipped','unexpected','flaky'))
            cases = []
            for spec, test in walk(report['suites']):
                assert spec['ok'] and test['projectName'] == engine
                assert test['status'] == 'expected' and test['expectedStatus'] == 'passed'
                assert len(test['results']) == 1
                result = test['results'][0]
                assert result['status'] == 'passed' and result['retry'] == 0 and not result['errors']
                cases.append(engine+' | '+spec['file']+' | '+spec['title'])
            cases.sort()
            assert len(cases) == len(set(cases)) == report['stats']['expected']
            key = host+'/'+engine+('/shard'+str(shard) if host == 'unified' else '')
            identities[key] = cases
            if host == 'unified':
                assert cases == equiv['projects'][engine]['shardTestIds'][shard-1]
            copied = key.replace('/','-')+'.json'
            shutil.copyfile(file, report_dir / copied)
            report_rows.append({'scope':key, 'artifact':artifact, 'path':relative, 'sha256':sha(data), 'stats':report['stats'], 'globalErrors':[], 'exactCommit':HEAD, 'allOneResultPassedRetry0':True, 'identitiesSha256':js_sha(cases), 'savedReport':'ci-37220700329-reports/'+copied})

retention = {}
per_file = {}
for engine in ('chromium','webkit'):
    s1 = identities['unified/'+engine+'/shard1']
    s2 = identities['unified/'+engine+'/shard2']
    assert not set(s1).intersection(s2)
    full = sorted(s1+s2)
    assert full == equiv['projects'][engine]['fullTestIds']
    assert js_sha(full) == equiv['projects'][engine]['fullSha256']
    identities['unified/'+engine] = full
    for host in ('unified','modular'):
        key = host+'/'+engine
        actual = identities[key]
        old = baseline['hosts'][host]['projects'][engine]
        assert js_sha(old['testIds']) == old['sha256']
        assert len(old['testIds']) == old['count']
        assert not set(old['testIds'])-set(actual)
        catalogue = sorted(i for i in actual if ' source catalogue ' in i)
        assert catalogue == equiv['catalogue'][key]['testIds']
        assert js_sha(catalogue) == equiv['catalogue'][key]['sha256']
        for lesson in range(1,16):
            for width in (320,390,768,1440):
                assert sum(i.endswith('source catalogue L'+str(lesson)+' complete DOM at '+str(width)) for i in actual) == 1
        gallery = [i for i in actual if 'all textbook scene galleries retain source bindings' in i]
        assert len(gallery) == 2
        remaining = sorted(set(actual)-set(old['testIds'])-set(catalogue)-set(gallery))
        assert not remaining
        retention[key] = {'actual':len(actual), 'old600IdentitiesPassed':old['count'], 'catalogueIdentitiesPassed':len(catalogue), 'newGalleryIdentitiesPassed':len(gallery), 'missingOld':[], 'otherNew':[], 'all15Lessons4Widths':True, 'actualIdentitiesSha256':js_sha(actual)}
        per_file[key] = dict(sorted(collections.Counter(i.split(' | ')[1] for i in actual).items()))

log_rows = []
for engine in ('chromium','webkit'):
    for shard in (1,2):
        file = INPUT / (engine+'-shard'+str(shard)+'.log')
        data = file.read_bytes()
        text = data.decode()
        assert HEAD in text and 'Setting up fonts-noto-cjk ' in text
        excerpt = [{'line':n, 'text':line} for n,line in enumerate(text.splitlines(),1) if HEAD in line or 'Setting up fonts-noto-cjk ' in line or re.search(r'\b(?:53|86|172|1) passed \(',line)]
        log_rows.append({'job':engine+'/shard'+str(shard), 'sha256':sha(data), 'bytes':len(data), 'fontInstallVerified':True, 'checkoutHashVerified':True, 'evidence':excerpt})

focused_file = INPUT / 'hsk123-reports-webkit-shard1/course-app/.repro-output/audio-startup-focused.json'
focused = json.loads(focused_file.read_text())
assert focused['config']['metadata']['ci']['commitHash'] == HEAD and focused['errors'] == []
assert focused['stats']['expected'] == 1 and all(focused['stats'][k] == 0 for k in ('skipped','unexpected','flaky'))
assert all(len(t['results']) == 1 and t['results'][0]['status'] == 'passed' and t['results'][0]['retry'] == 0 for s,t in walk(focused['suites']))
shutil.copyfile(focused_file,report_dir/'focused-webkit-startup.json')
shutil.copyfile(equiv_file,report_dir/'browser-shard-equivalence.json')
write('ci-37220700329-passed-identities.json', {'sourceCommit':HEAD,'tree':TREE,'runId':RUN,'identities':identities})
audit = {'runId':RUN,'runUrl':'https://github.com/nhiennhientran/hsk-hub/actions/runs/'+str(RUN),'sourceCommit':HEAD,'sourceTree':TREE,'workflowSha256':sha(workflow),'workflowTimeoutMinutes':60,'allFourJobsCompletedSuccess':True,'jobs':[{'id':j['id'],'name':j['name'],'status':j['status'],'conclusion':j['conclusion']} for j in jobs], 'actualMainPassed':sum(v['actual'] for v in retention.values()),'actualUnifiedPassed':sum(v['actual'] for k,v in retention.items() if k.startswith('unified/')),'actualModularPassed':sum(v['actual'] for k,v in retention.items() if k.startswith('modular/')),'skipped':0,'unexpected':0,'flaky':0,'retried':0,'reports':report_rows,'retention':retention,'countsByActualFile':per_file,'downloadedArtifacts':artifacts,'collectionReportSha256':sha(equiv_file.read_bytes()),'logs':log_rows,'extraFocusedOutsideMainDenominator':{'preflightChromium':{'passed':53,'evidence':'chromium-shard1.log; final JSON not uploaded'},'preflightWebkit':{'passed':53,'evidence':'webkit-shard1.log; final JSON not uploaded'},'focusedStartupWebkit':{'stats':focused['stats'],'sha256':sha(focused_file.read_bytes())}},'visualEvidence':'See ci-37220700329-review.md; no new24-field-pinyin or L3/L6/L7 blanktable screenshots in original run; no claim of visual review of all45 scenes'}
previous_audit = OUT / 'ci-37220700329-audit.json'
if previous_audit.exists():
    reviewed = json.loads(previous_audit.read_text()).get('visuallyReviewedFreshScreenshots')
    if reviewed:
        for sample in reviewed:
            assert sha((OUT / sample['file']).read_bytes()) == sample['sha256']
        audit['visuallyReviewedFreshScreenshots'] = reviewed
write('ci-37220700329-audit.json',audit)
print(json.dumps({'actualMainPassed':audit['actualMainPassed'],'actualUnifiedPassed':audit['actualUnifiedPassed'],'actualModularPassed':audit['actualModularPassed'],'retention':retention,'crcDigestHeadVerifiedArtifacts':len(artifacts)},ensure_ascii=False,indent=2))
