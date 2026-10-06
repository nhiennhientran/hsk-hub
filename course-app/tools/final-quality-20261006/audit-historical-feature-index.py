#!/usr/bin/env python3
"""Reproduce every immutable feature body in one historical observation index.

This checks actual bytes and bins using freshly decoded source PCM. It neither
restores unavailable historical producer bytes nor approves any audio target.
"""
import argparse
import hashlib
import importlib.util
import json
import mmap
from pathlib import Path


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def reference(root, path):
    return {'file': str(path.relative_to(root)), 'sha256': sha(path)}


def freeze(root, path, directory):
    body = path.read_bytes()
    digest = hashlib.sha256(body).hexdigest()
    target = directory / (digest + '-' + path.name)
    if target.exists():
        assert target.read_bytes() == body
    else:
        target.write_bytes(body)
        target.chmod(0o444)
    return target, reference(root, target)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo-root', type=Path, required=True)
    parser.add_argument('--index', type=Path, required=True)
    parser.add_argument('--index-sha256', required=True)
    parser.add_argument('--fresh-source-report', type=Path, required=True)
    parser.add_argument('--fresh-source-report-sha256', required=True)
    parser.add_argument('--scratch-pcm-cache', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    root = args.repo_root.resolve()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    producers = args.output.parent / 'historical-feature-recheck-producers'
    producers.mkdir(exist_ok=True)
    _, own_ref = freeze(root, Path(__file__).resolve(), producers)
    feature_path, feature_ref = freeze(root, root / 'tools/final-quality-20261006/review-syllable-evidence.py', producers)
    spec = importlib.util.spec_from_file_location('immutable_current_feature_recheck', feature_path)
    feature = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(feature)
    assert sha(args.index) == args.index_sha256
    assert sha(args.fresh_source_report) == args.fresh_source_report_sha256
    index = json.loads(args.index.read_text())
    sources = {x['sourceSHA256']: x for x in json.loads(args.fresh_source_report.read_text())['sources']}
    results, errors, checked_sources = [], [], {}
    for row in index['targets']:
        item = {**row, 'currentRecomputationProducer': feature_ref}
        try:
            path = root / row['file']
            assert sha(path) == row['sha256'], 'feature body SHA differs'
            data = json.loads(path.read_text())
            source = sources[data['sourceSHA256']]
            original = root / source['disk']
            if data['sourceSHA256'] not in checked_sources:
                assert sha(original) == data['sourceSHA256'], 'source MP3 SHA differs'
                cache = args.scratch_pcm_cache / (data['sourceSHA256'] + '-fresh-mono16000.f32')
                assert sha(cache) == source['sourcePCM_SHA256'], 'fresh source PCM SHA differs'
                checked_sources[data['sourceSHA256']] = reference(root, original)
            else:
                cache = args.scratch_pcm_cache / (data['sourceSHA256'] + '-fresh-mono16000.f32')
            assert data['sourcePCM_SHA256'] == source['sourcePCM_SHA256']
            assert data['id'] == row['id']
            assert data['sourceSampleRange16k'] == row['sourceSampleRange16k']
            assert data['cropPCM_SHA256'] == row['cropPCM_SHA256']
            first, last = row['sourceSampleRange16k']
            with cache.open('rb') as stream:
                with mmap.mmap(stream.fileno(), 0, access=mmap.ACCESS_READ) as pcm:
                    assert 0 <= first < last <= len(pcm) // 4
                    assert hashlib.sha256(pcm[first*4:last*4]).hexdigest() == row['cropPCM_SHA256']
                    bins = feature.features(pcm, first, last)
            assert bins == data['featureBins'], 'actual feature bins differ'
            assert feature.feature_sha(bins) == row['featureBinsSHA256'] == data['featureBinsSHA256']
            item.update(status='actual-feature-bins-freshly-reproduced',
                        sourceSHA256=data['sourceSHA256'], sourcePCM_SHA256=data['sourcePCM_SHA256'],
                        originalRecordedFeatureScriptSHA256=data.get('featureScriptSHA256'),
                        actualFeatureBinCount=len(bins),
                        historicalProducerCodeBytesRecovered=False)
        except Exception as error:
            item.update(status='feature-recomputation-error', error=str(error))
            errors.append({'featureFile': row['file'], 'error': str(error)})
        results.append(item)
    report = {'schemaVersion': 1,
              'status': 'historical-observation-feature-bins-actually-reproduced-not-new-approval' if not errors else 'FAILED',
              'historicalObservationIndexEvidence': reference(root, args.index),
              'freshOriginal357SourceReportEvidence': reference(root, args.fresh_source_report),
              'currentFrozenProducers': [own_ref, feature_ref],
              'actualFeatureDocumentsRecomputed': sum(x['status'] == 'actual-feature-bins-freshly-reproduced' for x in results),
              'actualDistinctSourcesChecked': len(checked_sources),
              'sourceEvidence': list(checked_sources.values()),
              'checks': results, 'errors': errors,
              'oldProducerBytesRecovered': False, 'originalIndexAndFeatureDocumentsModified': False,
              'newASRInferences': 0, 'newApprovalDecisions': 0}
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'file': str(args.output.relative_to(root)), 'sha256': sha(args.output),
                      'status': report['status'], 'actualFeatures': report['actualFeatureDocumentsRecomputed'],
                      'actualSources': len(checked_sources), 'errors': len(errors)}))
    return 1 if errors else 0


if __name__ == '__main__':
    raise SystemExit(main())
