#!/usr/bin/env python3
"""Restore the exact independent report bytes from their recorded gzip.

This restores existing audit data. It neither makes review decisions nor
creates or changes the student-facing precision authority.
"""
import argparse
import gzip
import hashlib
import json
import tarfile
import tempfile
from pathlib import Path


def restore_audit(root, request, inside, report_sha, report):
    inventory_bytes = inside(request['precisionAuditInventoryFile']).read_bytes()
    if hashlib.sha256(inventory_bytes).hexdigest() != request['precisionAuditInventorySHA256']:
        raise ValueError('recorded final audit inventory differs')
    inventory = json.loads(inventory_bytes)
    version = inventory.get('schemaVersion')
    if type(version) is not int or version not in (1, 2) or inventory.get('status') != 'final-accepted-audit-bytes':
        raise ValueError('partial checkpoint cannot supply final audit identity')
    if inventory.get('independentReportSHA256') != report_sha:
        raise ValueError('audit inventory belongs to another independent report')
    policy_fields = ('historicalMetadataClassificationEvidence',
                     'immutableReferenceVersionEvidence', 'freshSourceFrameReverificationEvidence')
    if version == 2:
        policies = inventory.get('typedAuditGraphPolicyReferences')
        if not isinstance(policies, dict) or set(policies) != set(policy_fields):
            raise ValueError('typed final audit inventory lacks its exact policies')
        if any(not isinstance(report.get(key), dict) or policies[key] != report[key] for key in policy_fields):
            raise ValueError('typed audit policies differ from the pinned independent report')
        if inventory.get('freshSourceFrameReverificationEvidence') != policies[policy_fields[2]]:
            raise ValueError('typed audit fresh source identity differs')
        for key in ('trackedSourceReferences', 'historicalMetadataExclusions',
                    'immutableVersionResolutions', 'remoteModelMetadataReferences'):
            if not isinstance(inventory.get(key), list):
                raise ValueError('typed final audit inventory lacks recorded reference metadata')
        count = inventory.get('actualPinnedFileVersions')
        if type(count) is not int or count <= 0 or inventory.get('noOriginalReferenceEdited') is not True or inventory.get('noHistoricalBytesFabricated') is not True:
            raise ValueError('typed final audit inventory cannot assert original byte preservation')
    restored = set()
    for archive in inventory['archives']:
        listed = {row['path']: row for row in archive['files']}
        if len(listed) != len(archive['files']) or restored.intersection(listed):
            raise ValueError('duplicate final audit path')
        for name in listed:
            inside(name)
        digest = hashlib.sha256()
        length = 0
        with tempfile.TemporaryFile() as joined:
            for part in archive['parts']:
                body = inside(part['file']).read_bytes()
                if len(body) != part['bytes'] or hashlib.sha256(body).hexdigest() != part['sha256']:
                    raise ValueError('recorded audit archive part differs')
                joined.write(body)
                digest.update(body)
                length += len(body)
            if length != archive['bytes'] or digest.hexdigest() != archive['sha256']:
                raise ValueError('recorded joined audit archive differs')
            joined.seek(0)
            encountered = set()
            with tarfile.open(fileobj=joined, mode='r|gz') as unpacked:
                for member in unpacked:
                    name = member.name
                    if not member.isfile() or name not in listed or name in encountered:
                        raise ValueError('unexpected or unsafe final audit member')
                    destination = inside(name)
                    row = listed[name]
                    if member.size != row['bytes']:
                        raise ValueError('final audit member length differs')
                    stream = unpacked.extractfile(member)
                    body = stream.read()
                    if hashlib.sha256(body).hexdigest() != row['sha256']:
                        raise ValueError('final audit member SHA differs')
                    if destination.exists() and destination.read_bytes() != body:
                        raise ValueError('existing audit file has different actual bytes')
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    destination.write_bytes(body)
                    encountered.add(name)
            if encountered != set(listed):
                raise ValueError('missing final audit member')
        restored.update(listed)
    if not restored:
        raise ValueError('final audit inventory is empty')
    if version == 2:
        seen = set()
        for reference in inventory['trackedSourceReferences']:
            destination = inside(reference['file'])
            name = str(destination.relative_to(root))
            if name in seen or name in restored:
                raise ValueError('duplicate tracked final audit path')
            seen.add(name)
            if hashlib.sha256(destination.read_bytes()).hexdigest() != reference['sha256']:
                raise ValueError('tracked final audit source bytes differ')
        for reference in policies.values():
            if hashlib.sha256(inside(reference['file']).read_bytes()).hexdigest() != reference['sha256']:
                raise ValueError('restored typed audit policy bytes differ')
    return len(restored)


def restore(root, request_file):
    def inside(name):
        path = Path(name)
        if path.is_absolute() or not path.parts or any(p in ('', '.', '..') for p in path.parts):
            raise ValueError('unsafe recorded report path')
        target = (root / path).resolve()
        target.relative_to(root)
        return target

    request = json.loads(inside(request_file).read_text())
    destination = inside(request['precisionIndependentReportFile'])
    compressed = inside(request['precisionIndependentReportCompressedFile'])
    compressed_bytes = compressed.read_bytes()
    if hashlib.sha256(compressed_bytes).hexdigest() != request['precisionIndependentReportCompressedSHA256']:
        raise ValueError('recorded compressed independent report bytes differ')
    actual = gzip.decompress(compressed_bytes)
    authority = json.loads(inside('course-app/content/audio-precision-authority-20261006.json').read_text())
    sha = hashlib.sha256(actual).hexdigest()
    if sha != authority['independentReportSHA256']:
        raise ValueError('restored independent report is not the pinned authority report')
    report = json.loads(actual)
    if report.get('status') != 'accepted-complete-source-frame-review' or report.get('completeCoverage') is not True:
        raise ValueError('partial report cannot restore a final approval')
    if len(report.get('acceptedSourceFrameGates', [])) != 2539:
        raise ValueError('final source-frame coverage differs')
    if destination.exists() and destination.read_bytes() != actual:
        raise ValueError('existing independent report has different actual bytes')
    audit_files = restore_audit(root, request, inside, sha, report)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(actual)
    return {'status': 'materialized-pinned-independent-report', 'sha256': sha,
            'bytes': len(actual), 'file': str(destination.relative_to(root)), 'auditFiles': audit_files}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('request')
    parser.add_argument('--repo-root', type=Path, default=Path(__file__).resolve().parents[3])
    args = parser.parse_args()
    print(json.dumps(restore(args.repo_root.resolve(), args.request)))
