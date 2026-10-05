#!/usr/bin/env python3
"""Author consistency record for the newly generated inventory; not an independent review."""
import gzip
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
HISTORICAL = REPO.parent / 'hsk-hub-recovery-v2/course-app/docs/resume-20261004'
OLD_BYTES = 12667967
OLD_SHA256 = 'e9cec5c4be50577b5c45d68a81ee3c9d4127dca021dd63ec3c692dd660611966'
OLD_BLOB = '5544c811bc98fa0814e7be0f797af5c18d5ce895'


def read(path):
    payload = path.read_bytes()
    return json.loads(gzip.decompress(payload) if path.suffix == '.gz' else payload)


def pin(path):
    data = path.read_bytes()
    return {'file': path.name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def main():
    summary = read(HERE / 'summary.json')
    rows = read(HERE / 'inventory.json.gz')
    bindings = read(HERE / 'semantic-consumers.json')
    inputs = read(HERE / 'runtime-files.json')
    old_inputs = read(HISTORICAL / 'vi-inventory-b10/runtime-files.json')
    old_identity_file = HISTORICAL / 'qa-vi-inventory-b10-full/final-target-identities.json.gz'
    old = read(old_identity_file)
    source = read(HERE / 'input-snapshot-manifest.json')
    row_map = {row['recordId']: row for row in rows}
    old_map = {row['recordId']: row for row in old['fieldTargets']}
    shared = sorted(set(row_map) & set(old_map))
    changed = [key for key in shared if {k: row_map[key].get(k) for k in old_map[key]} != old_map[key]]
    new_bindings = {(x['course'],x['kind'],x['semanticId']):x for x in bindings}
    old_bindings = {(x['course'],x['kind'],x['semanticId']):x for x in old['consumerBindings']}
    binding_shared = set(new_bindings) & set(old_bindings)
    binding_changed = [list(key) for key in sorted(binding_shared)
                       if {k:new_bindings[key].get(k) for k in old_bindings[key]} != old_bindings[key]]
    inputs_new = {x['file']: x['sha256'] for x in inputs}
    inputs_old = {x['file']: x['sha256'] for x in old_inputs}
    input_changed = [{'file':name,'historicalSHA256':inputs_old[name],'baselineSHA256':inputs_new[name]}
                     for name in sorted(set(inputs_new) & set(inputs_old)) if inputs_new[name] != inputs_old[name]]
    values = HERE.joinpath('inventory.json.gz').read_bytes()
    actual_blob = hashlib.sha1(b'blob ' + str(len(values)).encode() + b'\0' + values).hexdigest()
    fingerprint_match = len(values) == OLD_BYTES and hashlib.sha256(values).hexdigest() == OLD_SHA256 and actual_blob == OLD_BLOB
    validation = read(HERE / 'validation.json')
    checks = [
        {'name':'declared source head/tree equal exact materialization','passed':summary['gitHead']==source['sourceHEAD'] and summary['gitTree']==source['sourceTree']},
        {'name':'840 declared producer inputs all match Git commit','passed':len(inputs)==840 and summary['exactHEADInputChecks']['allMatch']},
        {'name':'all historical field identities unchanged','passed':not changed and set(row_map)==set(old_map)},
        {'name':'all historical semantic consumer projections unchanged','passed':not binding_changed and set(new_bindings)==set(old_bindings)},
        {'name':'author structural validation has no failures','passed':all(x['passed'] for x in validation['checks'])},
        {'name':'deterministic new gzip equals three recorded historical fingerprints','passed':fingerprint_match},
    ]
    delta = {'schemaVersion':1,'status':'author-comparison-awaiting-independent-review',
             'historicalSourceHEAD':old['sourceHead'],'historicalSourceTree':old['sourceTree'],
             'newSourceHEAD':summary['gitHead'],'newSourceTree':summary['gitTree'],
             'historicalFieldTargets':len(old_map),'newFieldTargets':len(row_map),
             'fieldIDsAdded':sorted(set(row_map)-set(old_map)), 'fieldIDsRemoved':sorted(set(old_map)-set(row_map)),
             'sharedFieldIdentityProjectionChanges':changed,
             'historicalConsumers':len(old_bindings),'newConsumers':len(new_bindings),
             'consumerIDsAdded':[list(x) for x in sorted(set(new_bindings)-set(old_bindings))],
             'consumerIDsRemoved':[list(x) for x in sorted(set(old_bindings)-set(new_bindings))],
             'consumerIdentityProjectionChanges':binding_changed,
             'inputFilesAdded':sorted(set(inputs_new)-set(inputs_old)),
             'inputFilesRemoved':sorted(set(inputs_old)-set(inputs_new)),
             'inputByteChanges':input_changed,
             'directHistoricalFullPayloadComparisonPerformed':False,
             'historicalIdentityArtifact':{'path':str(old_identity_file),**pin(old_identity_file)},
             'valuesDisposition':'55,430 newly extracted current-baseline values. The new gzip matches historical length/SHA256/Git blob fingerprints; original archived gzip was not retrieved.'}
    HERE.joinpath('historical-delta.json').write_text(json.dumps(delta,ensure_ascii=False,indent=2)+'\n')
    report = {'schemaVersion':1,'createdAtUTC':datetime.now(timezone.utc).isoformat(),
              'status':'new-deterministic-inventory-author-validated-independent-review-pending',
              'version':'continue-20261005-inventory-new-baseline-1874b4a',
              'sourceHEAD':summary['gitHead'],'sourceTree':summary['gitTree'],
              'sourceMode':'new extraction from immutable git cat-file input snapshot, not current mutable worktree',
              'currentGitHEADAtManifest':subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip(),
              'inventoryCandidates':len(rows),'semanticConsumers':len(bindings),'runtimeProducerInputs':len(inputs),
              'materializedSourceFiles':len(source['inputFiles']),
              'allAuthorChecksPassed':all(x['passed'] for x in checks), 'checks':checks,
              'independentReview':{'performed':False,'reviewer':None},
              'historicalPayload':{'originalPathChanged':False,'originalArtifactRetrieved':False,
                                   'missingOriginalPath':str(HISTORICAL/'vi-inventory-b10/inventory.json.gz'),
                                   'generatedBytes':len(values),'generatedSHA256':hashlib.sha256(values).hexdigest(),
                                   'generatedGitBlobSHA':actual_blob,'recordedExpectedBytes':OLD_BYTES,
                                   'recordedExpectedSHA256':OLD_SHA256,'recordedExpectedGitBlobSHA':OLD_BLOB,
                                   'allRecordedFingerprintsMatch':fingerprint_match,
                                   'provenance':'deterministic regeneration after restoration; no original archive retrieval receipt',
                                   'oldVIValueLimitation':'Direct reading of the historical original artifact remains unavailable. New extraction supplies every baseline VI value and cryptographically matches the historical payload fingerprints; independent reproducibility review is still pending.'},
              'scope':{'definition':'Field occurrences and producer candidates; counts do not imply unique meanings, visible reachability, or textbook matches.',
                       'primaryLessons':48, 'hsk1':15,'hsk2':15,'hsk3':18,
                       'retainedLegacyPracticeQuestions':1360,
                       'historicalAndMetadataConsumersAreSeparate':True,
                       'pastLearnerStorageRead':False,'sourceTextbookAuditReperformed':False,
                       'websiteSemanticAdoptionCertified':False,'nativeBrowserAcceptanceCertified':False,
                       'supplement':read(HERE/'scope-supplement.json') if (HERE/'scope-supplement.json').exists() else None},
              'refreshPolicy':'Keep this baseline directory immutable after independent review. Commit runtime changes, generate a new sibling version bound to that exact HEAD/tree, compare IDs and producer values, review additions/removals and history/grading adapters, and bind final native acceptance to the final changed source/package.',
              'sourceInputPins':sorted(inputs_new.items()),
              'files':[pin(p) for p in sorted(HERE.iterdir()) if p.is_file() and p.name not in {'manifest.json','manifest-build.log'}]}
    HERE.joinpath('manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'status':report['status'],'allAuthorChecksPassed':report['allAuthorChecksPassed'],
                      'recordedHistoricalFingerprintMatch':fingerprint_match,'fieldIdentityChanges':len(changed),
                      'consumerIdentityChanges':len(binding_changed),'inputChanges':input_changed},ensure_ascii=False))
    if not report['allAuthorChecksPassed']:
        raise SystemExit(1)


if __name__=='__main__':
    main()
