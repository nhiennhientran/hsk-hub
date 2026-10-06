#!/usr/bin/env python3
"""Pin and archive actual reachable audit bytes after complete independent review."""
import argparse
import gzip
import hashlib
import io
import json
import subprocess
import tarfile
from pathlib import Path

sha = lambda body: hashlib.sha256(body).hexdigest()


def pack(root, report_name, output_name):
    def inside(name):
        relative = Path(name)
        if relative.is_absolute() or not relative.parts or '..' in relative.parts:
            raise ValueError('audit path must remain in recorded repository')
        path = (root / relative).resolve()
        path.relative_to(root)
        return path

    report_path = inside(report_name)
    report_bytes = report_path.read_bytes()
    report = json.loads(report_bytes)
    gates = report.get('acceptedSourceFrameGates', [])
    if report.get('status') != 'accepted-complete-source-frame-review' or report.get('completeCoverage') is not True:
        raise ValueError('partial review cannot create final audit inventory')
    if len(gates) != 2539 or len({row['id'] for row in gates}) != 2539 or len(report.get('nonSpokenAnnotations', [])) != 1:
        raise ValueError('final precision coverage differs')
    for row in gates:
        if row.get('status') != 'accepted-independent-machine-source-frame-review' or row.get('independentDecision', {}).get('decision') != 'accept' or row.get('rawEvidenceUnchanged') is not True:
            raise ValueError('unaccepted geometry cannot be archived as final')
    output = inside(output_name)
    output.mkdir(parents=True, exist_ok=True)
    compressed_report = gzip.compress(report_bytes, compresslevel=9, mtime=0)
    compressed_path = output / 'independent-final-report.json.gz'
    if compressed_path.exists() and compressed_path.read_bytes() != compressed_report:
        raise ValueError('recorded final report output already differs')
    compressed_path.write_bytes(compressed_report)
    tracked = set(subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0'))
    pinned = {}
    visited = set()
    evidence = {}

    def visit(value):
        if isinstance(value, list):
            for item in value:
                visit(item)
        elif isinstance(value, dict):
            if isinstance(value.get('file'), str) and isinstance(value.get('sha256'), str):
                retain(value['file'], value['sha256'])
            # Producer metadata also uses scriptFile/scriptSHA256, inputFile/inputSHA256,
            # or waveformFile/waveformFileSHA256. Preserve the actual pinned producer.
            for key, name in value.items():
                if isinstance(name, str) and key.endswith('File'):
                    prefix = key[:-4]
                    digest = value.get(prefix + 'SHA256', value.get(key + 'SHA256'))
                    if isinstance(digest, str) and len(digest) == 64:
                        retain(name, digest)
            for item in value.values():
                visit(item)

    def retain(name, expected):
        path = inside(name)
        relative = path.relative_to(root).as_posix()
        if relative in pinned and pinned[relative] != expected:
            raise ValueError('conflicting actual audit identities: ' + relative)
        body = path.read_bytes()
        if sha(body) != expected:
            raise ValueError('referenced audit bytes changed: ' + relative)
        pinned[relative] = expected
        if relative not in tracked and path != report_path:
            evidence[relative] = body
        if path.suffix == '.json' and relative not in visited:
            visited.add(relative)
            visit(json.loads(body))

    visit(report)
    if not evidence:
        raise ValueError('final report has no reachable retained audit files')
    archive_path = output / 'final-accepted-audit.tar.gz'
    with archive_path.open('wb') as raw:
        with gzip.GzipFile(filename='', fileobj=raw, mode='wb', compresslevel=9, mtime=0) as compressed:
            with tarfile.open(fileobj=compressed, mode='w|') as archive:
                for name, body in sorted(evidence.items()):
                    info = tarfile.TarInfo(name)
                    info.size = len(body)
                    info.mtime = 0
                    info.mode = 0o644
                    archive.addfile(info, io.BytesIO(body))
    digest = hashlib.sha256()
    length = 0
    parts = []
    with archive_path.open('rb') as archive:
        while body := archive.read(4 * 1024 * 1024):
            name = output / f'final-accepted-audit.tar.gz.part{len(parts):03d}'
            name.write_bytes(body)
            parts.append({'file': name.relative_to(root).as_posix(), 'bytes': len(body), 'sha256': sha(body)})
            digest.update(body)
            length += len(body)
    inventory = {'schemaVersion': 1, 'status': 'final-accepted-audit-bytes',
                 'independentReportSHA256': sha(report_bytes),
                 'archives': [{'bytes': length, 'sha256': digest.hexdigest(), 'parts': parts,
                               'files': [{'path': name, 'bytes': len(body), 'sha256': sha(body)} for name, body in sorted(evidence.items())]}],
                 'trackedSourceReferences': [{'file': name, 'sha256': digest} for name, digest in sorted(pinned.items()) if name in tracked]}
    inventory_bytes = (json.dumps(inventory, ensure_ascii=False, indent=2) + '\n').encode()
    inventory_path = output / 'final-audit-inventory.json'
    inventory_path.write_bytes(inventory_bytes)
    return {'precisionIndependentReportFile': report_path.relative_to(root).as_posix(),
            'precisionIndependentReportCompressedFile': compressed_path.relative_to(root).as_posix(),
            'precisionIndependentReportCompressedSHA256': sha(compressed_report),
            'precisionAuditInventoryFile': inventory_path.relative_to(root).as_posix(),
            'precisionAuditInventorySHA256': sha(inventory_bytes),
            'auditFiles': len(evidence), 'archiveParts': len(parts), 'archiveBytes': length,
            'trackedSourceReferences': len(inventory['trackedSourceReferences'])}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('report')
    parser.add_argument('output')
    parser.add_argument('--repo-root', type=Path, default=Path(__file__).resolve().parents[3])
    args = parser.parse_args()
    print(json.dumps(pack(args.repo_root.resolve(), args.report, args.output)))
