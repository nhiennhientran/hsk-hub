"""Independent actual-results verifier; never runs a browser or changes runtime."""
import json, hashlib, collections, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
FLOW = ROOT / 'course-app/docs/resume-20261004/flow-compat-review'
HEAD = 'dd8b22ccb1c1a9c41bc1243887f7a60558635782'
TREE = 'e2c89f9c2029cec09d8a8bbb1315e9cd99ea225c'
RUN = 37226015769
LOCAL_EQUIVALENT = '4d08a314fd0be96536b32982f4eabe598b8bbd48'

def sha(value):
    return hashlib.sha256(value).hexdigest()

def read(path):
    return json.loads(path.read_text())

def flatten(suites, parents=()):
    for suite in suites:
        lineage = parents + (suite['title'],)
        for spec in suite.get('specs', []):
            for test in spec['tests']:
                yield {'sourceCase': {'file': spec['file'], 'line': spec['line'], 'column': spec['column'],
                                     'title': spec['title'], 'suiteTitles': list(lineage)},
                       'specID': spec['id'], 'ok': spec['ok'], 'test': test}
        yield from flatten(suite.get('suites', []), lineage)

def key(case):
    return json.dumps(case['sourceCase'], ensure_ascii=False, sort_keys=True)

metadata = read(HERE / 'run-37226015769-metadata.json')
logs = read(HERE / 'run-37226015769-log-review.json')
byte_review = read(HERE / 'artifact-byte-review.json')
assert metadata['head'] == HEAD and metadata['tree'] == TREE and metadata['runID'] == RUN
local_head = subprocess.check_output(['git','rev-parse',LOCAL_EQUIVALENT],cwd=ROOT,text=True).strip()
local_tree = subprocess.check_output(['git','rev-parse',local_head+'^{tree}'],cwd=ROOT,text=True).strip()
assert local_tree == TREE
artifacts = {item['name']: item for item in metadata['artifacts']}
assert len(byte_review['artifacts']) == 4
for item in byte_review['artifacts']:
    actual = artifacts[item['artifactName']]
    assert item['observedZIP_SHA256'] == actual['digest'].split(':')[1]
    assert item['observedZIPBytes'] == actual['size_in_bytes']
    assert item['matchesGitHubDigest'] and item['matchesGitHubBytes']
    assert item['head'] == HEAD and item['runID'] == RUN
jobs = {item['name']: item for item in metadata['jobs']}
definitions = [('shared','shared','native-flow-results.json',64),
               ('retained-hsk1','retained-hsk1','hsk1-retained-ci-results.json',35),
               ('fresh-hsk1','retained-hsk1','hsk1-fresh-backup-ci-results.json',1)]
reports, checks, total = [], [], 0
for scope, artifact_scope, filename, expected_count in definitions:
    collection_file = HERE / (scope+'-chromium-independent-collection.json')
    collection = read(collection_file)
    assert not collection['errors']
    expected = list(flatten(collection['suites']))
    assert len(expected) == expected_count and len({key(row) for row in expected}) == expected_count
    expected_keys = {key(row) for row in expected}
    for browser in ['chromium','webkit']:
        artifact_name = 'hsk-flow-package-'+artifact_scope+'-'+browser
        artifact = artifacts[artifact_name]
        assert not artifact['expired'] and artifact['workflow_run']['id'] == RUN
        assert artifact['workflow_run']['head_sha'] == HEAD
        path = HERE/'artifacts'/artifact_name/filename
        raw = path.read_bytes(); report = json.loads(raw)
        assert not report['errors']
        cases = list(flatten(report['suites']))
        assert len(cases) == expected_count and len({key(row) for row in cases}) == expected_count
        actual_keys = {key(row) for row in cases}
        assert expected_keys == actual_keys, (scope,browser,'case identity mismatch')
        assert len({row['specID'] for row in cases}) == expected_count
        stats = report['stats']
        assert stats['expected'] == expected_count
        assert all(stats[field] == 0 for field in ['skipped','unexpected','flaky'])
        project = next(p for p in report['config']['projects'] if p['name'] == browser)
        assert project['retries'] == 0 and project['repeatEach'] == 1
        ci = project['metadata']['ci']
        assert ci['commitHash'] == HEAD and ci['buildHref'].endswith('/'+str(RUN))
        case_results = []
        for row in cases:
            test = row['test']
            assert test['projectName'] == browser and test['projectId'] == browser
            assert row['ok'] and test['status'] == 'expected' and test['expectedStatus'] == 'passed'
            assert not any(a['type'] in ['skip','fixme','fail'] for a in test.get('annotations',[]))
            assert len(test['results']) == 1
            result = test['results'][0]
            assert result['status'] == 'passed' and result['retry'] == 0 and not result['errors']
            assert not any(a['type'] in ['skip','fixme','fail'] for a in result.get('annotations',[]))
            case_results.append({**row['sourceCase'],'specID':row['specID'],'project':browser,
                                 'status':result['status'],'retry':result['retry'],'resultCount':1,
                                 'errorCount':0,'startTime':result['startTime'],'durationMs':result['duration']})
        job = jobs['flows ('+browser+', '+artifact_scope+')']
        assert job['status'] == 'completed' and job['conclusion'] == 'success'
        required_steps = ['Build shared learning app','All-lesson homework, listening, mixed cards and save boundaries'] if scope=='shared' else ['Build retained HSK1 app','All original retained HSK1 flows with existing private test-fixture wrapper','Fresh-context backup with explicit test-session authorization']
        for step in required_steps:
            actual = next(s for s in job['steps'] if s['name']==step)
            assert actual['status']=='completed' and actual['conclusion']=='success'
        reports.append({'scope':scope,'browser':browser,'file':str(path.relative_to(ROOT)),
                        'reportSHA256':sha(raw),'artifactID':artifact['id'],'artifactName':artifact_name,
                        'artifactDigest':artifact['digest'],'jobID':job['id'],'stats':stats,
                        'actualUniqueCaseCount':len(cases),'independentCollectedCaseCount':len(expected),
                        'missingCases':[],'extraCases':[],'duplicateSourceCases':0,'duplicateSpecIDs':0,
                        'skipped':0,'retryResults':0,'globalErrors':0,'caseErrors':0,
                        'collectionFile':str(collection_file.relative_to(ROOT)),
                        'collectionSHA256':sha(collection_file.read_bytes()),'cases':case_results})
        total += len(cases)
assert total == 200
assert all(x['checkoutHeadObserved'] and not x['workflowFatalMarkers'] for x in logs['jobs'])

# Historical original definitions/fixtures remain unchanged, including the
# password-dependent original fresh-context case. No semantic substitute.
fixture_manifest = read(FLOW/'retained-fixtures.json')
for item in fixture_manifest['files']:
    actual = sha((ROOT/item['path']).read_bytes())
    assert actual == item['sha256'], ('retained fixture changed',item['path'])
    frozen = subprocess.check_output(['git','show',local_head+':'+item['path']],cwd=ROOT)
    assert sha(frozen)==actual
    checks.append({**item,'matchesHistoricalRetainedManifest':True,'matchesCITreeLocalEquivalent':True})
inputs = ['.github/workflows/hsk-flow-package-checkpoint.yml',
          'hsk1-app/tools/run-checkpoint.mjs',
          *['course-app/docs/resume-20261004/flow-compat-review/'+name for name in [
              'playwright.flow.config.ts','playwright.hsk1-retained.config.ts',
              'hsk1-retained-runtime.mjs','hsk1-preserved.retained.ts','hsk1-fresh-backup.retained.ts',
              'durable-attempts.candidate.spec.ts','homework-all-lessons.candidate.spec.ts',
              'shared-practice-listening.candidate.spec.ts','input-abort.candidate.spec.ts',
              'mobile-boundaries.candidate.spec.ts','serve-frozen.mjs']],
          *['course-app/src/'+name for name in ['state.ts','store.ts','config.ts','lexicon.ts','main.ts','lesson-view.ts','learning-view.ts']]]
source_checks=[]
for filename in inputs:
    path = ROOT/filename
    if not path.exists():
        continue
    raw=path.read_bytes(); frozen=subprocess.check_output(['git','show',local_head+':'+filename],cwd=ROOT)
    assert raw==frozen, ('source changed since CI tree',filename)
    source_checks.append({'file':filename,'sha256':sha(raw),'matchesCITreeLocalEquivalent':True})
result = {'schemaVersion':1,'reviewStatus':'accepted-independent-actual-shared-and-retained-HSK1-CI-results',
          'runID':RUN,'runURL':'https://github.com/nhiennhientran/hsk-hub/actions/runs/'+str(RUN),
          'remoteHead':HEAD,'gitTree':TREE,'localEquivalentHead':local_head,
          'scope':'Shared64, unchanged original retained HSK1 35, and separate explicitly session-authorized fresh backup1 in each Chromium and WebKit; 200 actual cases.',
          'counts':{'sharedPerBrowser':64,'sharedAcrossBrowsers':128,'originalRetainedH1PerBrowser':35,
                    'originalRetainedH1AcrossBrowsers':70,'separateFreshBackupPerBrowser':1,
                    'separateFreshBackupAcrossBrowsers':2,'actualCaseExecutions':200,
                    'uniqueSourceCases':100,'skipped':0,'retryResults':0,'unexpected':0,'flaky':0,
                    'globalErrors':0,'caseErrors':0,'missingExpectedCases':0,'extraActualCases':0},
          'evidenceMethod':['Four actual GitHub artifact ZIPs downloaded independently; byte SHA matched GitHub digest before reading reports.',
                            'Six current report identities and CI project metadata bind the run/head; unrelated historical JSON files shipped in artifacts are excluded.',
                            'Independent --list collection compared exact file/line/column/title/suite identities with all200 actual results. Collection-only skipped placeholders are not execution evidence.',
                            'Every actual result is expected/passed once, retry0, no skip/fixme/fail annotations or errors; zero duplicates per scope/project.',
                            'Four actual job logs independently confirm checkout head and 64/35/1 pass summaries; all required selected steps succeeded.',
                            'Matrix-conditioned nonapplicable workflow steps are not skipped test cases.'],
          'authenticationFixtureBoundary':{
              'original35':'Unchanged HSK1 wrapper imports the three original definitions. Most use original explicit session test authorization. The original password-dependent downloaded-backup definition remains present and actually passed in each browser.',
              'privateWrapper':'Existing hsk1-app/tools/run-checkpoint.mjs resolves baseline gate fixture into process memory, passes only child-process environment HSK_TEST_PASSWORD; contains no password file write or password log output. No credential value was copied into this report or new source.',
              'originalPasswordTest':'Original storage.spec.ts requires the fresh auth gate visible and session absent, then enters the environment fixture through #class-password before exact import/recovery assertions. Fixture-based path passed; this review does not certify production authentication security.',
              'separateFresh1':'Separate test observes a new context with gate visible and session absent, adds an explicit test session through initScript, then verifies exact nonempty downloaded backup restore, second-import recovery, rollback and reload. It does not test password validation.',
              'shared64':'Explicit per-test sessionStorage authorization and isolated synthetic localStorage fixture; no claim that shared suite exercises password entry.',
              'backupSemantics':'Original migration fixtures are unchanged; tests preserve exact old strings, first/latest records, drafts, cross-course isolation, and exclude authentication fields from exported backup.'},
          'artifactByteChecks':byte_review['artifacts'],
          'metadataEvidenceSHA256':{name:sha((HERE/name).read_bytes()) for name in ['run-37226015769-metadata.json','run-37226015769-log-review.json','artifact-byte-review.json']},
          'retainedHistoricalFileChecks':checks,'CITreeSourceSHA256':source_checks,'actualReports':reports,
          'limits':['This independent acceptance covers200 actual supplemental cases only. Package, legacy entry, source-font and reviewed audio subset results are outside this assignment.',
                    'Historical core860 acceptance remains bound to its historical ce374 head and is not re-executed or rebound by this supplement.',
                    'No official VI textbook audit, human audio listening, pronunciation/tone certification, physical-device testing, or deployment is claimed.'],
          'productionChangedByReviewer':False,'fixturesChangedByReviewer':False,'browserCasesRunLocallyByReviewer':0}
(HERE/'independent-actual-review.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':result['reviewStatus'],'counts':result['counts'],'reportSHA256':sha((HERE/'independent-actual-review.json').read_bytes())},ensure_ascii=False))
