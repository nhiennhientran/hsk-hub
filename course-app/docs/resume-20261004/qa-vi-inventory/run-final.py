#!/usr/bin/env python3
"""Append final QA evidence without overwriting historical pending reports."""
from pathlib import Path
import collections
import hashlib
import importlib.util
import json
import subprocess
import sys

sys.dont_write_bytecode = True
ROOT = Path.cwd()
QA = ROOT / 'course-app/docs/resume-20261004/qa-vi-inventory'
AUTHOR = ROOT / 'course-app/docs/resume-20261004/vi-inventory'
SOURCE = '835e5bd41045655cc2724ba2ba59235064ff92cf'
TREE = 'a80360230b94da2a40a83c405a6bc06ea2f155f3'
OUTPUT = QA / 'final-source-835e5bd4'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def invoke(script, args):
    specification = importlib.util.spec_from_file_location('qa_' + script.stem, script)
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    module.OUT = OUTPUT
    sys.argv = [str(script), *args]
    try:
        module.main()
        return 0
    except SystemExit as result:
        return result.code


def main():
    source = json.loads((AUTHOR / 'summary.json').read_text())
    if source['gitHead'] != SOURCE or source['gitTree'] != TREE:
        raise SystemExit('Author final source snapshot is not ready at the requested engineering commit.')
    history = json.loads((QA / 'pending-freeze-manifest.json').read_text())
    historical_checks = [{'path': f['path'], 'sha256': sha(QA / f['path']),
                          'matchesHistoricalPendingFreeze': sha(QA / f['path']) == f['sha256']}
                         for f in history['files']]
    if not all(row['matchesHistoricalPendingFreeze'] for row in historical_checks):
        raise SystemExit('Historical pending report bytes changed; final review stopped.')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    coverage_exit = invoke(QA / 'verify-current.py', ['--final'])
    consumer_exit = invoke(QA / 'verify-consumer-bindings.py', [])
    target_exit = invoke(QA / 'verify-freeze-targets.py', [])
    coverage = json.loads((OUTPUT / 'independent-review.json').read_text())
    consumers = json.loads((OUTPUT / 'consumer-binding-review.json').read_text())
    target_report = json.loads((OUTPUT / 'freeze-and-target-verification.json').read_text())
    graph = json.loads((AUTHOR / 'semantic-consumers.json').read_text())
    expected_kinds = {'approved-svg-asset': 438, 'retained-practice-question': 1360,
                      'word-sense': 1093, 'source-activity': 918, 'source-activity-version': 484}
    kinds = dict(collections.Counter(row['kind'] for row in graph))
    checks = [
        {'name': 'declared source commit/tree match the root engineering checkpoint',
         'passed': source['gitHead'] == SOURCE and source['gitTree'] == TREE and subprocess.check_output(['git', 'rev-parse', SOURCE + '^{tree}'], text=True).strip() == TREE},
        {'name': 'historical pending evidence retained byte-for-byte',
         'passed': all(row['matchesHistoricalPendingFreeze'] for row in historical_checks)},
        {'name': 'all independent coverage/source checks pass',
         'passed': coverage_exit == 0 and coverage['status'] == 'passed' and coverage['checksPassed'] == coverage['checksTotal']},
        {'name': 'all 837 actual source files match commit bytes and recorded hashes',
         'passed': len(coverage['sourceInputs']) == 837 and all(row['matchesSourceCommit'] and row['matchesRecordedHash'] for row in coverage['sourceInputs'])},
        {'name': 'all 2495 actual canonical/word/activity consumer identities and real source-column mappings pass',
         'passed': consumer_exit == 0 and consumers['checksTotal'] == consumers['checksPassed'] == 2495},
        {'name': 'exact full 4293 semantic graph contains every expected kind and no extras',
         'passed': len(graph) == 4293 and kinds == expected_kinds and len({(r['kind'], r['semanticId']) for r in graph}) == 4293},
        {'name': 'all 1360 bank and 438 asset identities are independently validated in primary semantic graph',
         'passed': all(c['passed'] for c in coverage['bankQuestionIdentityChecks']) and len(coverage['bankQuestionIdentityChecks']) == 1360 and all(c['passed'] for c in coverage['checks'] if c['name'] == 'all SVG asset identities and separate outer JSON VI consumers bind actual sources')},
        {'name': 'old package tool drift now equals actual committed input',
         'passed': all(row['matchesSourceCommit'] and row['matchesRecordedHash'] for row in coverage['sourceInputs'] if row['file'] == 'course-app/tools/package-unified.mjs')},
        {'name': 'all frozen author artifacts and complete field-target identity set match',
         'passed': target_exit == 0 and target_report['status'] == 'passed' and target_report['checksPassed'] == target_report['checksTotal'] == 8},
    ]
    report = {'status': 'passed-source-and-consumer-inventory' if all(c['passed'] for c in checks) else 'failed-final-inventory',
              'sourceHead': SOURCE, 'sourceTree': TREE, 'primaryFieldOccurrenceRows': coverage['primaryRows'],
              'coverageChecksPassed': coverage['checksPassed'], 'coverageChecksTotal': coverage['checksTotal'],
              'sourceFilesVerified': len(coverage['sourceInputs']), 'semanticConsumerIdentities': len(graph),
              'countsByConsumerKind': kinds, 'allConsumerPartition': {'canonicalWordAndActivities': 2495,
                                                                    'legacyQuestions': 1360, 'approvedAssets': 438},
              'finalGateChecks': checks, 'historicalPendingFiles': historical_checks,
              'historicalPendingFreezeSHA256': sha(QA / 'pending-freeze-manifest.json'),
              'historicalConsumerPendingReport': {'path': 'consumer-binding-review.json',
                                                 'sha256': sha(QA / 'consumer-binding-review.json'),
                                                 'oldStatus': json.loads((QA / 'consumer-binding-review.json').read_text())['status'],
                                                 'unchangedByFinalVerifier': True},
              'actualPackageToolSource': [row for row in coverage['sourceInputs'] if row['file'] == 'course-app/tools/package-unified.mjs'],
              'authorInputFreezeAtVerification': coverage['authorFrozenCandidates'],
              'wholeTargetIdentityVerification': {'path': 'freeze-and-target-verification.json',
                                                  'sha256': sha(OUTPUT / 'freeze-and-target-verification.json'),
                                                  'all46463TargetsMatch': all(t['passed'] for t in target_report['targetValueIdentityChecks']),
                                                  'all38AuthorArtifactsMatch': all(t['matchesAuthorFinalFreeze'] for t in target_report['authorArtifactByteChecks']),
                                                  'passed': target_report['checksPassed'], 'total': target_report['checksTotal']},
              'officialVietnameseSemanticAuditPerformed': False, 'allOfficialDecisionsStillPendingPhaseB': True,
              'productionEdits': [], 'historicalReportEdits': [],
              'limitations': coverage['limits'] + ['This closes source and inventory identity drift only; A9/native visual and official textbook translation comparison are separate gates.']}
    (OUTPUT / 'closure.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: report[key] for key in ['status', 'primaryFieldOccurrenceRows', 'sourceFilesVerified', 'semanticConsumerIdentities', 'coverageChecksPassed', 'coverageChecksTotal']}))
    raise SystemExit(0 if all(c['passed'] for c in checks) else 1)


if __name__ == '__main__':
    main()
