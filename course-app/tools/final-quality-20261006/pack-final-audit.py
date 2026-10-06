#!/usr/bin/env python3
"""Archive byte-pinned complete review, with exact historical metadata disclosure."""
import argparse
import gzip
import io
import json
import subprocess
import tarfile
from pathlib import Path
from audit_reference_graph import AuditGraph, digest, sha


def pack(root, report_name, output_name):
    root = Path(root).resolve()
    # Check real complete coverage and every reference before creating output.
    graph = AuditGraph(root, report_name, require_final=True)
    graph_result = graph.run()
    output = graph.resolve(output_name)
    tracked = set(subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0'))
    references = {}
    for reference in graph.files.values():
        name = reference['file']
        if name in references and references[name]['sha256'] != reference['sha256']:
            raise ValueError('one retained path cannot contain two byte versions')
        references[name] = reference
    evidence = {name:ref for name,ref in references.items() if name not in tracked and root/name != graph.report_path}
    if not evidence:
        raise ValueError('final report has no reachable retained audit files')
    output.mkdir(parents=True, exist_ok=True)
    report_bytes = graph.report_bytes
    compressed_report = gzip.compress(report_bytes, compresslevel=9, mtime=0)
    compressed_path = output / 'independent-final-report.json.gz'
    if compressed_path.exists() and compressed_path.read_bytes() != compressed_report:
        raise ValueError('recorded final report output already differs')
    archive_path = output / 'final-accepted-audit.tar.gz'
    temporary_archive = output / '.final-accepted-audit.tar.gz.tmp'
    try:
        with temporary_archive.open('wb') as raw:
            with gzip.GzipFile(filename='', fileobj=raw, mode='wb', compresslevel=9, mtime=0) as compressed:
                with tarfile.open(fileobj=compressed, mode='w|') as archive:
                    for name, reference in sorted(evidence.items()):
                        # Bound memory to one file; hash bytes actually archived.
                        body = (root/name).read_bytes()
                        if sha(body) != reference['sha256']:
                            raise ValueError('required audit bytes changed while packing: '+name)
                        info = tarfile.TarInfo(name)
                        info.size,info.mtime,info.mode = len(body),0,0o644
                        archive.addfile(info,io.BytesIO(body))
        for name,reference in references.items():
            if digest(root/name) != reference['sha256']:
                raise ValueError('required audit bytes changed before inventory: '+name)
        temporary_archive.replace(archive_path)
    finally:
        temporary_archive.unlink(missing_ok=True)
    compressed_path.write_bytes(compressed_report)
    length,parts = 0,[]
    with archive_path.open('rb') as archive:
        while body := archive.read(4*1024*1024):
            name = output/f'final-accepted-audit.tar.gz.part{len(parts):03d}'
            name.write_bytes(body)
            parts.append({'file':name.relative_to(root).as_posix(),'bytes':len(body),'sha256':sha(body)})
            length += len(body)
    inventory = {
        'schemaVersion':2,'status':'final-accepted-audit-bytes',
        'independentReportSHA256':sha(report_bytes),
        'archives':[{'bytes':length,'sha256':digest(archive_path),'parts':parts,
                     'files':[{'path':name,'bytes':ref['bytes'],'sha256':ref['sha256']} for name,ref in sorted(evidence.items())]}],
        'trackedSourceReferences':[{'file':name,'sha256':ref['sha256']} for name,ref in sorted(references.items()) if name in tracked],
        'historicalMetadataExclusions':graph_result['historicalMetadataExclusions'],
        'immutableVersionResolutions':graph_result['immutableVersionResolutions'],
        'remoteModelMetadataReferences':graph_result['remoteModelMetadataReferences'],
        'freshSourceFrameReverificationEvidence':graph_result['freshSourceFrameReverificationEvidence'],
        'typedAuditGraphPolicyReferences':graph.policy_refs,
        'actualPinnedFileVersions':graph_result['actualPinnedFileVersions'],
        'noOriginalReferenceEdited':True,'noHistoricalBytesFabricated':True,
    }
    inventory_bytes = (json.dumps(inventory,ensure_ascii=False,indent=2)+'\n').encode()
    inventory_path = output/'final-audit-inventory.json'
    inventory_path.write_bytes(inventory_bytes)
    return {
        'precisionIndependentReportFile':graph.report_path.relative_to(root).as_posix(),
        'precisionIndependentReportCompressedFile':compressed_path.relative_to(root).as_posix(),
        'precisionIndependentReportCompressedSHA256':sha(compressed_report),
        'precisionAuditInventoryFile':inventory_path.relative_to(root).as_posix(),
        'precisionAuditInventorySHA256':sha(inventory_bytes),
        'auditFiles':len(evidence),'archiveParts':len(parts),'archiveBytes':length,
        'trackedSourceReferences':len(inventory['trackedSourceReferences']),
        'historicalMetadataExclusionCount':len(graph.classified),
        'immutableVersionResolutionCount':len(graph.version_resolutions),
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('report')
    parser.add_argument('output')
    parser.add_argument('--repo-root',type=Path,default=Path(__file__).resolve().parents[3])
    args = parser.parse_args()
    print(json.dumps(pack(args.repo_root.resolve(),args.report,args.output)))
