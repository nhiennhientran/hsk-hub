#!/usr/bin/env python3
"""Independent byte/whole-target verification for the frozen 835e source inventory."""
from pathlib import Path
import gzip
import hashlib
import json

ROOT = Path.cwd()
AUTHOR = ROOT / 'course-app/docs/resume-20261004/vi-inventory'
OUT = ROOT / 'course-app/docs/resume-20261004/qa-vi-inventory/final-source-835e5bd4'
EXPECTED_FREEZE = '2e9a5d5fc2a06c5367382f997f35cfb1ffce87bd65ec25b4bdd8af058a4d9aba'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    freeze = json.loads((AUTHOR / 'final-freeze.json').read_text())
    rows = json.loads(gzip.decompress((AUTHOR / 'inventory.json.gz').read_bytes()))
    identities = json.loads(gzip.decompress((AUTHOR / 'final-target-identities.json.gz').read_bytes()))
    graph = json.loads((AUTHOR / 'semantic-consumers.json').read_text())
    coverage = json.loads((OUT / 'independent-review.json').read_text())
    checks = []

    def check(name, passed, detail=None):
        checks.append({'name': name, 'passed': bool(passed), 'detail': detail})

    check('author supplied final freeze content SHA256 exactly matches', sha((AUTHOR / 'final-freeze.json').read_bytes()) == EXPECTED_FREEZE)
    artifact_checks = []
    for entry in freeze['files']:
        data = (ROOT / entry['file']).read_bytes()
        artifact_checks.append({'file': entry['file'], 'bytes': len(data), 'sha256': sha(data),
                                'matchesAuthorFinalFreeze': sha(data) == entry['sha256'] and len(data) == entry['bytes']})
    check('all 38 final author artifact byte identities independently read and match', len(artifact_checks) == 38 and all(x['matchesAuthorFinalFreeze'] for x in artifact_checks))
    source = {x['file']: x for x in coverage['sourceInputs']}
    input_checks = []
    for entry in freeze['inputSHA256']:
        actual = source.get(entry['file'])
        input_checks.append({'file': entry['file'], 'matchesIndependentGitAndWorktreeVerification':
                             actual is not None and actual['sha256'] == entry['sha256'] and actual['bytes'] == entry['bytes'] and actual['matchesSourceCommit'] and actual['matchesRecordedHash']})
    check('all 837 author declared input identities agree with independently hashed commit/worktree', len(input_checks) == 837 and all(x['matchesIndependentGitAndWorktreeVerification'] for x in input_checks))
    actual_rows = {row['recordId']: row for row in rows}
    targets = []
    for entry in identities['fieldTargets']:
        row = actual_rows.get(entry['recordId'])
        good = row is not None and entry['semanticKey'] == row['semanticKey'] and entry['component'] == row['component'] and entry['file'] == row['file'] and entry['pointer'] == row.get('pointer') and entry['range'] == row.get('range') and entry['valueSHA256'] == sha(row['value'].encode('utf-8')) and entry['officialAuditStatus'] == row['officialAuditStatus'] == 'pending-phase-B'
        targets.append({'recordId': entry['recordId'], 'passed': good})
    check('exact complete 46463 target ID set has no missing/extra/duplicate', len(identities['fieldTargets']) == len(rows) == 46463 and len({x['recordId'] for x in identities['fieldTargets']}) == 46463 and {x['recordId'] for x in identities['fieldTargets']} == set(actual_rows))
    check('all 46463 target namespace/file/pointer/range/value SHA and pending status match primary rows', all(x['passed'] for x in targets))
    identity = lambda entry: (entry['kind'], entry['course'], entry['semanticId'])
    check('all 4293 consumer IDs exactly match primary graph with no missing/extra/duplicates', len(identities['consumerIdentities']) == len(graph) == 4293 and len({identity(x) for x in identities['consumerIdentities']}) == 4293 and {identity(x) for x in identities['consumerIdentities']} == {identity(x) for x in graph})
    check('source checkpoint and tree agree in target freeze and author freeze', identities['sourceHEAD'] == freeze['sourceHEAD'] == '835e5bd41045655cc2724ba2ba59235064ff92cf' and identities['sourceTree'] == freeze['sourceTree'] == 'a80360230b94da2a40a83c405a6bc06ea2f155f3')
    check('zero phantom sourceViews bindings and exactly 918 actual sourceColumnBindings', sum('sourceViews' in x for x in graph) == 0 and sum(x['kind'] == 'source-activity' and 'sourceColumnBinding' in x for x in graph) == 918)
    report = {'status': 'passed' if all(x['passed'] for x in checks) else 'failed', 'checks': checks,
              'checksPassed': sum(x['passed'] for x in checks), 'checksTotal': len(checks),
              'authorFinalFreezeSHA256': sha((AUTHOR / 'final-freeze.json').read_bytes()),
              'targetManifestSHA256': sha((AUTHOR / 'final-target-identities.json.gz').read_bytes()),
              'authorArtifactByteChecks': artifact_checks, 'authorInputIdentityChecks': input_checks,
              'targetValueIdentityChecks': targets, 'officialVietnameseSemanticAuditPerformed': False,
              'scope': 'Exact full identity set and source/artifact closure only; no semantic completion percentage or new translations.'}
    (OUT / 'freeze-and-target-verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: report[k] for k in ['status', 'checksPassed', 'checksTotal']}))
    raise SystemExit(0 if report['status'] == 'passed' else 1)


if __name__ == '__main__':
    main()
