#!/usr/bin/env python3
"""Rehash the actual full new guarded assembly and compare exact old CI bytes."""
import ast
import hashlib
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
DOC = Path(__file__).resolve().parent
HEAD = '835e5bd41045655cc2724ba2ba59235064ff92cf'
TREE = 'a80360230b94da2a40a83c405a6bc06ea2f155f3'
PRODUCTION = '2da6a5c80c62d4ff5bdfa72a5bdb929b2b1ff3d4'
OLD_HEAD = 'dd8b22ccb1c1a9c41bc1243887f7a60558635782'
OUTPUT = REPO / 'course-app/unified-site-a9-guarded-835e5'
FROZEN = REPO / 'course-app/unified-frozen-a9-guarded-835e5'
BASELINE = REPO / 'course-app/.repro-output/a9-guarded-835e5/baseline'


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def canonical(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()


def git(*args):
    return subprocess.check_output(['git', *args], cwd=REPO)


def json_file(path):
    return json.loads(path.read_bytes())


def actual_inventory(root):
    return [{'path': str(p.relative_to(root)), 'bytes': p.stat().st_size, 'sha256': sha(p.read_bytes())}
            for p in sorted(root.rglob('*'), key=lambda p: str(p.relative_to(root))) if p.is_file()]


def main():
    assert git('rev-parse', 'HEAD').decode().strip() == HEAD
    assert git('rev-parse', HEAD + '^{tree}').decode().strip() == TREE
    tool = git('show', HEAD + ':course-app/tools/package-unified.mjs')
    scopes = ast.literal_eval(re.search(rb'export const runtimeSourceScopes=(\[[^;]+\]);', tool)[1].decode())
    assert not git('status', '--porcelain', '--', *scopes).strip()
    report = json_file(DOC / 'assembly.json')
    manifest_path = OUTPUT / 'course-engine/unified-release-manifest.json'
    manifest_bytes = manifest_path.read_bytes()
    manifest = json.loads(manifest_bytes)
    assert report['sourceCommit'] == manifest['sourceCommit'] == HEAD
    assert report['sourceDirty'] is False and manifest['sourceDirty'] is False
    assert report['buildProvenance'] == manifest['buildProvenance'] == 'built-from-recorded-worktree'
    assert report['status'] == 'assembled-checkpoint-not-release' and manifest['mode'] == 'checkpoint'
    assert report['unifiedManifestSHA256'] == sha(manifest_bytes)
    actual = actual_inventory(OUTPUT)
    assert actual == report['files'] and len(actual) == report['assembledFiles'] == 3894
    assert sha(canonical(actual)) == report['inventorySHA256']
    declared = {r['path']: r for r in actual}
    frozen = actual_inventory(FROZEN)
    assert len(frozen) == report['packageFiles'] == 2778
    assert {r['path']: r for r in frozen if r['path'] != 'course-engine/unified-release-manifest.json'} == {
        r['path']: r for r in manifest['files']}
    assert all(declared[r['path']] == r for r in frozen)

    names = sorted(filter(None, git('ls-tree', '-r', '-z', '--name-only', HEAD, '--', *scopes).decode().split('\0')))
    snapshot = []
    for path in names:
        committed = git('show', HEAD + ':' + path)
        assert (REPO / path).read_bytes() == committed, path
        snapshot.append({'path': path, 'sha256': sha(committed)})
    assert len(snapshot) == 1459
    assert snapshot == manifest['sourceSnapshot']['files']
    assert sha(canonical(snapshot)) == manifest['sourceSnapshot']['sha256'] == report['sourceSnapshotSHA256']
    assert report['sourceSnapshotSHA256'] == '333f2b56eaee6e8f28a8b69c9a5b3c1c5e018a1273b5590191a21226da0146cd'

    # Validate all protected source blobs from the exact production object.
    baseline = {}
    for line in filter(None, git('ls-tree', '-r', '-z', PRODUCTION).decode().split('\0')):
        metadata, path = line.split('\t')
        mode, kind, blob = metadata.split()
        assert mode == '100644' and kind == 'blob'
        raw = (BASELINE / path).read_bytes()
        assert hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest() == blob
        baseline[path] = {'path': path, 'bytes': len(raw), 'sha256': sha(raw)}
    assert len(baseline) == report['baselineFiles'] == 1446
    excluded = {r['path'] for r in report['baselineUnservedExclusions']}
    replaced = {r['path'] for r in report['authorizedReplacements']}
    assert len(excluded) == 55 and len(replaced) == 11 and not excluded.intersection(declared)
    protected = set(baseline) - excluded - replaced
    assert len(protected) == report['protectedPublicFiles'] == 1380
    assert all(declared[p] == baseline[p] for p in protected)

    old_doc = REPO / 'course-app/docs/resume-20261004/qa-flow-package-ci'
    old_report = json_file(old_doc / 'reports/chromium-assembly.json')
    old_manifest = json_file(old_doc / 'reports/common-unified-release-manifest.json')
    old_files = {r['path']: r for r in old_report['files']}
    assert set(old_files) == set(declared)
    changed = [p for p in sorted(declared) if declared[p] != old_files[p]]
    assert changed == ['course-engine/unified-release-manifest.json']
    changed_fields = [k for k in manifest if manifest[k] != old_manifest[k]]
    assert changed_fields == ['sourceCommit', 'sourceSnapshot']
    assert manifest['files'] == old_manifest['files'] and manifest['inputFiles'] == old_manifest['inputFiles']
    old_audit = json_file(old_doc / 'actual-chromium-package-audit.json')
    old_native_inputs = [r for r in old_audit['downloadedConsumers']['files'] if r['path'] != 'course-engine/unified-release-manifest.json']
    old_extracted = Path('/workspace/scratch/28b55072841a/ci-flow-audit-37226015769/hsk-flow-package-package-chromium/course-app/unified-site-flow-package')
    for row in old_native_inputs:
        raw = (OUTPUT / row['path']).read_bytes()
        assert raw == (old_extracted / row['path']).read_bytes()
        assert sha(raw) == row['sha256'] and len(raw) == row['bytes']
    assert len(old_native_inputs) == 142
    assert not git('status', '--porcelain', '--', *scopes).strip()
    assert git('rev-parse', 'HEAD').decode().strip() == HEAD
    result = {
        'schemaVersion': 1, 'status': 'accepted-full-private-clean-guarded-assembly-byte-scope-not-release',
        'checkedAtUTC': datetime.now(timezone.utc).isoformat(), 'head': HEAD, 'tree': TREE,
        'actualAssembledFilesRehashed': len(actual), 'actualAssembledBytes': sum(r['bytes'] for r in actual),
        'actualFrozenFilesRehashed': len(frozen), 'sourceSnapshotFiles': len(snapshot),
        'sourceSnapshotSHA256': report['sourceSnapshotSHA256'], 'sourceDirtyBeforeAndAfter': False,
        'buildAndFreeze': 'actual strict --build with unique input/output; no --allow-dirty',
        'protected': {'production': PRODUCTION, 'actualGitBlobIdentityChecked': 1446,
                      'actualPublicBytesUnchanged': 1380, 'unservedDeveloperExclusions': 55, 'authorizedSlots': 11},
        'newManifestSHA256': sha(manifest_bytes), 'newInventorySHA256': report['inventorySHA256'],
        'oldExactCI': {'runId': 37226015769, 'head': OLD_HEAD, 'identityRebound': False},
        'newVsOldManifestFieldsChanged': changed_fields, 'newVsOldAssembledFileBytesChanged': changed,
        'oldActualDownloadedConsumerBytesCompared': len(old_native_inputs),
        'newActual132CompiledAnd10HTMLExactOldBytes': True,
        'sameActualClientAndAllOther3893FileDeclarations': True,
        'sourceGuardExecution': 'fresh package-unified and assemble-unified-checkpoint invoked actual current source registries, mandatory paths, original-media identity, glyph provenance/licenses, static bundle closure and protected Git baseline validation before output',
        'limitations': ['Native tests and independent source-input review are separately reported in this directory.',
                        'Old CI case identities remain on old head. Exact byte equivalence supplies reuse evidence; it is not a new236-case execution or WebKit run.',
                        'No production deployment or formal sixteen-stage release gate.'
        ]
    }
    (DOC / 'actual-full-byte-audit.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
