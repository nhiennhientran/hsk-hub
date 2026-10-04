"""Independently inspect saved execution evidence; never execute or alter app/tests."""
import hashlib
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

OWN = Path(__file__).resolve().parent
BUNDLE = OWN.parent
REPO = BUNDLE.parents[3]

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def read(name):
    return json.loads((BUNDLE / name).read_text())

def cases(report):
    out = []
    def visit(suites):
        for suite in suites:
            visit(suite.get('suites', []))
            for spec in suite.get('specs', []):
                for test in spec.get('tests', []):
                    out.append({'title': spec['title'], 'file': spec.get('file'),
                                'project': test.get('projectName'), 'status': test.get('status'),
                                'expectedStatus': test.get('expectedStatus'),
                                'results': [result.get('status') for result in test.get('results', [])]})
    visit(report.get('suites', []))
    return out

def passed(name, expected):
    report = read(name)
    rows = cases(report)
    assert not report.get('errors'), name
    assert len(rows) == expected and report['stats']['expected'] == expected, name
    assert report['stats']['unexpected'] == report['stats']['skipped'] == report['stats']['flaky'] == 0, name
    assert all(row['project'] == 'chromium' and row['status'] == 'expected'
               and row['expectedStatus'] == 'passed' and row['results'] == ['passed'] for row in rows), name
    return rows

log_name = 'all-lessons-native-repaired.log'
log = re.sub(r'\x1b\[[0-9;]*m', '', (BUNDLE / log_name).read_text())
log_rows = []
pattern = r'^\s*([✓✘])\s+(\d+) \[chromium\] › (.*?\.spec\.ts):\d+:\d+ › (.*?) \([^\n]*\)$'
for match in re.finditer(pattern, log, re.MULTILINE):
    mark, ordinal, file, title = match.groups()
    log_rows.append({'title': title, 'file': file, 'project': 'chromium',
                     'status': 'passed' if mark == '✓' else 'failed', 'ordinal': int(ordinal)})
assert len(log_rows) == 52 and len({r['title'] for r in log_rows}) == 52
assert Counter(row['status'] for row in log_rows) == {'passed': 50, 'failed': 2}
assert '50 passed' in log and '2 failed' in log

homework_titles = {f'actual unified HSK{level} lesson {lesson} all five homework parts persist exact isolated receipts'
                   for level, count in [(1, 15), (2, 15), (3, 18)] for lesson in range(1, count + 1)}
listen_titles = {f'actual HSK{level} all independent listening questions preserve immutable first latest and wrong retry'
                 for level in [2, 3]}
mixed_titles = {f'actual HSK{level} complete canonical mixed queue renders all senses exact backs and survives responsive reload'
                for level in [2, 3]}
input_titles = {f'HSK{level} final lesson invalid old radio IME abort and redo preserve confirmed history' for level in [2, 3]}
durable_titles = {f'durable HSK{level} {kind} {mode} rejects unconfirmed receipt across remount ordinary save and explicit retry'
                  for level in [2, 3] for kind in ['homework', 'listening'] for mode in ['quota', 'waiting']}
mobile_titles = {f'HSK{level} longest mixed backs and independent listening preserve exact saved content at 320' for level in [2, 3]}
assert {r['title'] for r in log_rows if r['status'] == 'passed'} == homework_titles | listen_titles
assert {r['title'] for r in log_rows if r['status'] == 'failed'} == mixed_titles

final_rows = []
for name, number, expected_titles in [
    ('durable-native-final-results.json', 8, durable_titles),
    ('practice-input-native-final-results.json', 4, mixed_titles | input_titles),
    ('mobile-boundary-native-results.json', 2, mobile_titles),
]:
    rows = passed(name, number)
    assert {r['title'] for r in rows} == expected_titles
    final_rows += [{**row, 'evidence': name} for row in rows]
core = [{**row, 'evidence': log_name} for row in log_rows if row['status'] == 'passed'] + final_rows
assert len(core) == len({r['title'] for r in core}) == 64
assert {r['title'] for r in core} == homework_titles | listen_titles | mixed_titles | input_titles | durable_titles | mobile_titles

builds = []
for name in ['frozen-repaired-build.json', 'frozen-hsk1-standalone-build.json']:
    manifest = read(name)
    root = Path(manifest['root'])
    actual = {p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()}
    expected = {row['path'] for row in manifest['files']}
    assert actual == expected
    for row in manifest['files']:
        path = root / row['path']
        assert path.stat().st_size == row['bytes'] and sha(path) == row['sha256'], path
    runtime = []
    for row in manifest.get('runtimeSource', []):
        actual_sha = sha(REPO / row['path'])
        assert actual_sha == row['sha256'], row['path']
        runtime.append({**row, 'actualSha256': actual_sha, 'exactCurrentSource': True})
    builds.append({'manifest': name, 'root': str(root), 'fileCount': len(expected),
                   'allBytesAndHashesExact': True, 'noExtraOrMissingFiles': True, 'runtimeSource': runtime})

standalone = read('hsk1-retained-standalone-native-results.json')
standalone_rows = cases(standalone)
assert len(standalone_rows) == 35 and standalone['stats']['expected'] == 34 and standalone['stats']['unexpected'] == 1
blocked = [row for row in standalone_rows if row['status'] == 'unexpected']
assert blocked[0]['title'] == 'a downloaded nonempty backup restores identical data in a new context and one import-before recovery'
fresh = passed('hsk1-fresh-authorized-backup-native-final-results.json', 1)
legacy_first = read('legacy-native-first-results.json')
assert legacy_first['stats']['expected'] == 2 and legacy_first['stats']['unexpected'] == 1
legacy_final = passed('legacy-local-dependency-native-results.json', 1)
dependency = read('legacy-local-dependency.json')
assert dependency['sha256'] == 'ede2693a4a6a5126b9d35669062b358ecab6ae7b9b86a1cf302feb45a8514907'
assert sha(Path(dependency['localPath'])) == dependency['sha256']

input_manifest = read('flow-inputs.json')
assert len(input_manifest['files']) == len({row['path'] for row in input_manifest['files']}) == 37
for row in input_manifest['files']:
    assert sha(REPO / row['path']) == row['sha256'], row['path']
author_audit = read('coverage-audit.json')
assert author_audit['formalUnifiedActualPassed'] == 64
assert {(row['project'], row['title']) for row in author_audit['formalUnifiedCases']} == {(row['project'], row['title']) for row in core}
assert all(row['status'] == 'passed' for row in author_audit['formalUnifiedCases'])
for row in author_audit['reports']:
    assert sha(BUNDLE / row['path']) == row['sha256'], row['path']
summary = read('all-lessons-native-repaired-log-summary.json')
assert summary['originalLogSHA256'] == sha(BUNDLE / log_name)
assert summary['actualPassed'] == 50 and summary['homeworkCases'] == 48 and summary['independentListeningCases'] == 2
assert {(row['project'], row['title']) for row in summary['cases']} == {(row['project'], row['title']) for row in log_rows if row['status'] == 'passed'}
assert len(summary['cases']) == 50
collection = (BUNDLE / 'final-flow-collection.log').read_text()
collected_titles = re.findall(r'^\s*\[chromium\] › .*?:\d+:\d+ › (.*)$', collection, re.MULTILINE)
assert len(collected_titles) == 64 and set(collected_titles) == {row['title'] for row in core}
assert 'Total: 64 tests in 5 files' in collection
verification = read('verification-result.json')
assert verification['formalUnifiedActualPassed'] == 64
assert verification['terminalLogActualPassed'] == 50 and verification['structuredFormalActualPassed'] == 14
freeze = read('freeze-manifest.json')
assert sha(BUNDLE / 'freeze-manifest.json') == 'a91404a54eafa0b19250d37a8ac47be3086119a23b944265ae7f3bb38f5dfc39'
assert len(freeze['files']) == len({row['path'] for row in freeze['files']}) == 43
for row in freeze['files']:
    path = BUNDLE / row['path']
    assert path.stat().st_size == row['bytes'] and sha(path) == row['sha256'], row['path']
retained = read('retained-fixtures.json')
assert len(retained['files']) == len({row['path'] for row in retained['files']}) == 17
for row in retained['files']:
    assert sha(REPO / row['path']) == row['sha256'], row['path']

inventory = []
for path in sorted(BUNDLE.rglob('*.json')):
    if OWN in path.parents:
        continue
    try:
        data = json.loads(path.read_text())
    except (ValueError, UnicodeError):
        continue
    if 'stats' in data:
        inventory.append({'file': path.relative_to(BUNDLE).as_posix(), 'sha256': sha(path),
                          'stats': data['stats'], 'caseCount': len(cases(data)),
                          'collectionErrors': [e.get('message', '').splitlines()[0] for e in data.get('errors', [])]})

evidence = [log_name, 'durable-native-final-results.json', 'practice-input-native-final-results.json',
            'mobile-boundary-native-results.json', 'hsk1-retained-standalone-native-results.json',
            'hsk1-fresh-authorized-backup-native-final-results.json', 'legacy-native-first-results.json',
            'legacy-native-second-results.json', 'legacy-local-dependency-native-results.json',
            'legacy-local-dependency.json', 'legacy-hsk2-dependency-observation.json',
            'frozen-repaired-build.json', 'frozen-hsk1-standalone-build.json',
            'playwright.flow.config.ts', 'homework-all-lessons.candidate.spec.ts',
            'durable-attempts.candidate.spec.ts', 'shared-practice-listening.candidate.spec.ts',
            'input-abort.candidate.spec.ts', 'mobile-boundaries.candidate.spec.ts',
            'hsk1-preserved.retained.ts', 'hsk1-fresh-backup.retained.ts',
            'playwright.hsk1-retained.config.ts', 'legacy-entries.packaged.ts', 'playwright.legacy.config.ts',
            'all48-state-roundtrip.candidate.test.mjs', 'all48-state-roundtrip-coverage.json',
            'README.md', 'flow-inputs.json', 'coverage-audit.json',
            'all-lessons-native-repaired-log-summary.json', 'collection-shared-playwright-error-results.json',
            'verify-evidence.mjs', 'verification-result.json', 'final-flow-collection.log',
            'freeze-manifest.json', 'retained-fixtures.json']
report = {
    'reviewer': 'qa_hsk1_01_03', 'reviewedAt': datetime.now(timezone.utc).isoformat(),
    'status': 'accepted-independent-saved-execution-evidence-with-explicit-scope',
    'scope': 'Read-only engineering audit of candidate assertions, raw reports/logs and frozen served builds; no rerun of author browser tests',
    'coreFinalCases': 64, 'uniqueCoreCases': core,
    'allLessonsRawLog': {'file': log_name, 'passed': 50, 'failed': 2, 'derivedFromRawLog': True,
                        'failedCasesExactlyRepairedInFinalJson': True},
    'additionalHSK1': {'originalRetainedCases': 35, 'passed': 34, 'passwordEnvironmentBlocked': 1,
                      'explicitSessionEquivalentBackupRestoreCasesPassed': 1, 'passwordValidationCertified': False},
    'additionalLegacy': {'nestedDirectCasesPassedWithoutSubstitution': 2, 'oldRoutesCasePassedWithExactProtectedPakoFulfill': 1,
                         'routes': ['hsk1/', 'hsk2.html', 'hsk3/', 'hsk4up/', 'hsk4/'],
                         'oldRawKeysExactlyPreserved': 5, 'originalCDNReachabilityCertified': False,
                         'passwordValidationCertified': False, 'dependency': dependency},
    'assertionReview': {
        'homework': '48 actual UI cases submit all five parts and preserve exact receipt objects, raw writing whitespace, first/latest and old legacy bytes; 1440 questions / 240 parts.',
        'independentListening': 'All HSK2 60 / HSK3 72 prompts/options/answers tested; deliberate wrong first attempt, immutable first/latest, wrong-only retry, empty scope and reload.',
        'mixed': 'All 226 + 523 canonical senses checked front/back at desktop1440; final-group responsive reload at390/768/1440.',
        'durable': 'Quota or actual navigator.locks write wait; no unconfirmed feedback/receipt adoption after remount or ordinary save; explicit retry preserves old first and confirms one new submission.',
        'input': 'Last lessons15/18 invalid old radio, synthetic composition abort while actual write lock waits, raw writing draft, redo and reload preserve prior confirmed history.',
        'mobile': 'Chromium viewport320: six longest VI mixed backs per level and one selected long listening question before/after confirmation/reload; not every item at every viewport.',
        'HSK1QuotaContract': 'Live unsaved submission/feedback remains usable and exportable after quota failure; normal retry persists it. This deliberately differs from HSK2/3 confirmed-only attempts.',
        'roundtripSupplement': 'Read actual state/validator/store/engine candidate and report: synthetic memory-port save/reload/export/import/recovery/quota for all48, not native UI.'
    },
    'boundedEvidenceRepair': {'incorrect50CaseJsonReference': 'Original incorrectly copied JSON was a zero-case Playwright double-load collection error, excluded from pass counts.',
                            'accepted50CaseEvidence': 'Use the retained original raw execution log; never fabricate a raw JSON report from it.',
                            'fixtureRepairs': 'Wait for actual saved state and card before mixed storage read; scope failed-homework-submit status to the assignment form, global status only for listening; legacy API wait limited to HSK4. Original failures retained.'},
    'authorDocumentationReview': {'READMEReadAndScopeAccepted': True, 'coverageAudit64CasesExactlyMatchIndependentEvidence': True,
                                'derived50LogSummaryExactlyMatchesIndependentExtraction': True,
                                'all37DeclaredCurrentBankHashesExact': True, 'all17RetainedDefinitionsAndFixturesHashesExact': True},
    'authorFinalFreeze': {'manifest': 'freeze-manifest.json', 'sha256': sha(BUNDLE / 'freeze-manifest.json'),
                          'authorFileCount': 43, 'allCurrentBytesAndHashesMatch': True, 'independentArtifactsOutsideAuthorManifest': True},
    'frozenBuildChecks': builds, 'rawJsonReportInventory': inventory,
    'evidenceHashes': [{'file': name, 'sha256': sha(BUNDLE / name)} for name in evidence],
    'limits': ['Chromium execution evidence only; configs listing WebKit do not mean WebKit executed.',
               'No physical device or human listening certification.',
               'No password authentication certification or live CDN availability certification.',
               'Not official source-answer correctness or comprehensive Vietnamese textbook alignment.',
               '48-homework native pass proof is retained raw reporter log; no original successful-run JSON remains.']
}
(OWN / 'independent-review.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': report['status'], 'coreFinalCases': 64, 'frozenBuildFiles': [b['fileCount'] for b in builds],
                  'reportSha256': sha(OWN / 'independent-review.json')}, ensure_ascii=False))
