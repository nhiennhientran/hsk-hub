#!/usr/bin/env python3
"""Actual source evidence for eleven remaining H3 text/boundary utterances.

Only immutable existing raw inference is read. Plots and source evidence grant
no acceptance, no new model inference, and no tone/native certification.
"""
import hashlib
import importlib.util
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
BASE = ROOT / 'course-app/docs/final-quality-20261006'
OUT = BASE / 'audio-context-peer-hsk3-remaining-spoken'
SELECT = ['l01:text4:line4', 'l02:text1:line2', 'l04:text2:line3',
          'l05:text1:line5:sentence2', 'l06:text2:line7:sentence1',
          'l07:text1:line6', 'l07:text4:line4', 'l10:text3:line3',
          'l12:text2:line3:sentence1', 'l14:text3:line6',
          'l18:text2:line1:sentence1']
IMPROVED = {'l02:text1:line2': 'hsk3-sentence114-paired-01.json',
            'l05:text1:line5:sentence2': 'hsk3-sentence114-paired-01.json',
            'l06:text2:line7:sentence1': 'hsk3-nine-sentence-repair-paired-01.json',
            'l07:text4:line4': 'hsk3-sentence114-paired-01.json',
            'l12:text2:line3:sentence1': 'hsk3-sentence114-paired-01.json'}


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ref(path):
    return {'file': path.relative_to(ROOT).as_posix(), 'sha256': sha(path)}


def dump(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    shared = module('h3_remaining_exact_raw', Path(__file__).with_name('qa-hsk1-peer-context-observations.py'))
    support = module('h3_remaining_original_pcm', ROOT/'tools/final-quality-20261006/review-decisions.py')
    plot = module('h3_remaining_actual_plot', Path(__file__).with_name('qa-hsk1-remaining22-observations.py'))
    index_path = BASE/'audio-hsk3/context-closure/full-source-context-index-amendment-77.json'
    index = json.loads(index_path.read_text())
    originals = {(x['sourceTrack'], x['sourcePCM_SHA256']): x for x in index['sourceEvidence']}
    old_path = BASE/'audio-context-peer-hsk3/source-frame-observations.json'
    old = {x['id']: x for x in json.loads(old_path.read_text())['records']}
    reports = {}
    decoded = {}
    sources = {}
    targets = []
    for tail in SELECT:
        ident = 'hsk3-fltrp-2026:' + tail
        report_path = BASE/'audio-review'/IMPROVED.get(tail, 'hsk3-paired-full-03.json')
        data = reports.setdefault(str(report_path), json.loads(report_path.read_text()))
        row = next(x for x in data['targets'] if x['id'] == ident)
        pcm_bytes = decoded.setdefault(row['sourceTrack'], support.original_pcm(ROOT, row))
        pcm = np.frombuffer(pcm_bytes, dtype='<f4')
        first, last = row['sourceSampleRange16k']
        assert hashlib.sha256(pcm_bytes[first*4:last*4]).hexdigest() == row['cropPCM_SHA256']
        book_path, book = shared.pinned(row['canonicalSource'])
        parent = shared.pointer(book, row['canonicalSource']['sourceJSONPointer'])
        assert parent['zh'] == row['canonicalSource']['parentZH']
        assert parent['py'] == row['canonicalSource']['sourcePinyin']
        original = originals.get((row['sourceTrack'], row['sourcePCM_SHA256']))
        if original:
            whole_reference = {'file': original['rawASRFile'], 'sha256': original['rawASRSHA256']}
        else:
            prior = old[ident]
            assert prior['sourcePCM_SHA256'] == row['sourcePCM_SHA256']
            whole_reference = prior['sourceGroupEvidence']
        whole_path, whole = shared.pinned(whole_reference)
        shared.unprompted(whole)
        assert whole.get('cropPCM_SHA256', whole.get('track', {}).get('pcm', {}).get('sha256')) == row['sourcePCM_SHA256']
        raw_words = [{'segmentIndex': si, 'wordIndex': wi, **w}
                     for si, seg in enumerate(whole['rawSegments'])
                     for wi, w in enumerate(seg.get('words', []))]
        models = []
        for evidence in row['rawModelEvidence']:
            binding_path, binding = shared.pinned(evidence)
            shared.unprompted(binding)
            assert binding['candidateId'] == ident
            assert binding['sourceSampleRange16k'] == [first, last]
            assert binding['cropPCM_SHA256'] == row['cropPCM_SHA256']
            assert binding['originalSourceTrack'] == row['sourceTrack']
            assert binding['originalSourceSHA256'] == row['sourceSHA256']
            transcript = ''.join(s.get('text', '') for s in binding['rawSegments'])
            assert transcript == evidence['rawTranscript']
            actual = ref(binding_path)
            if binding.get('deduplicatedRawASRFile'):
                raw_path, raw = shared.pinned({'file': binding['deduplicatedRawASRFile'],
                                             'sha256': binding['deduplicatedRawASRSHA256']})
                shared.unprompted(raw)
                assert raw['cropPCM_SHA256'] == row['cropPCM_SHA256']
                assert raw['rawSegments'] == binding['rawSegments']
                actual = ref(raw_path)
            models.append({**ref(binding_path), 'actualInference': actual,
                           'modelRepository': binding['modelRepository'],
                           'modelRevision': binding['modelRevision'], 'rawTranscript': transcript,
                           'holdsUnchanged': evidence['holds'], 'flagsUnchanged': evidence['flags']})
        assert len(models) == 2
        edges = {key: shared.db(pcm[a:b]) if 0 <= a < b <= len(pcm) else None
                 for key, a, b in [('beforeStart', first-320, first), ('afterStart', first, first+320),
                                   ('beforeEnd', last-320, last), ('afterEnd', last, last+320)]}
        target = {key: row[key] for key in ('id', 'candidateId', 'unit', 'sourceTrack', 'sourceSHA256',
                   'sourcePCM_SHA256', 'sourceSampleRange16k', 'cropPCM_SHA256')}
        target.update({'sourceText': row['sourceZH'], 'sourcePinyin': row['sourcePinyin'],
                       'canonicalPrintedParentPinyin': parent['py'], 'canonicalPrintedSource': row['canonicalSource'],
                       'sourceDecodedFrames16k': len(pcm), 'actualFourEdgeRMSDbFS20ms': edges,
                       'actualCropModelEvidence': models, 'currentActualReportEvidence': ref(report_path),
                       'sourceGroupEvidence': {**ref(whole_path), 'sourcePCM_SHA256': row['sourcePCM_SHA256'],
                           'sourceSampleRange16k': [0, len(pcm)],
                           'rawTranscriptRetainedVerbatim': ''.join(s.get('text', '') for s in whole['rawSegments']),
                           'modelRepository': whole['modelRepository'], 'modelRevision': whole['modelRevision'],
                           'rawTimestampNotPhonemeBoundary': True},
                       'wholeSourceWordsIntersectingCurrentCropAuxiliaryOnly':
                           [w for w in raw_words if w['end'] > first/16000 and w['start'] < last/16000],
                       'precedingWholeSourceRawWordsAuxiliaryOnly': [w for w in raw_words if w['end'] <= first/16000][-3:],
                       'followingWholeSourceRawWordsAuxiliaryOnly': [w for w in raw_words if w['start'] >= last/16000][:3],
                       'holdsUnchanged': row['holds'], 'flagsUnchanged': row['flags'],
                       'sourceOrProposalsModified': False, 'productionApproved': False})
        targets.append(target)
        sources.setdefault(row['sourceTrack'], []).append(target)
    local_pages = []
    for offset in range(0, len(targets), 4):
        batch = targets[offset:offset+4]
        fig, axes = plt.subplots(len(batch), 2, figsize=(22, len(batch)*3.2), squeeze=False)
        path = OUT/f'text11-actual-source-crop-panels-{offset//4+1:02}.png'
        for n, target in enumerate(batch):
            first, last = target['sourceSampleRange16k']
            pcm = np.frombuffer(decoded[target['sourceTrack']], dtype='<f4')
            plot.plot_pair(axes[n], pcm, first, last,
                           target['id']+' '+target['canonicalPrintedParentPinyin'],
                           max(0, first-16000), min(len(pcm), last+16000))
        fig.tight_layout(); fig.savefig(path, dpi=120); plt.close(fig)
        local_pages.append(ref(path))
        for n, target in enumerate(batch, 1):
            target['actualCurrentSourceCropPlot'] = {**ref(path), 'panelOrdinal': n, 'id': target['id'],
                'sourceSampleRange16k': target['sourceSampleRange16k'], 'cropPCM_SHA256': target['cropPCM_SHA256']}
    full_pages = []
    entries = list(sources.items())
    for offset in range(0, len(entries), 4):
        batch = entries[offset:offset+4]
        fig, axes = plt.subplots(len(batch), 2, figsize=(22, len(batch)*3.2), squeeze=False)
        path = OUT/f'text11-complete-original-source-panels-{offset//4+1:02}.png'
        for n, (track, track_targets) in enumerate(batch):
            target = track_targets[0]
            first, last = target['sourceSampleRange16k']
            plot.plot_pair(axes[n], np.frombuffer(decoded[track], dtype='<f4'), first, last, track+' COMPLETE ORIGINAL')
        fig.tight_layout(); fig.savefig(path, dpi=120); plt.close(fig)
        full_pages.append(ref(path))
        for n, (_, track_targets) in enumerate(batch, 1):
            for target in track_targets:
                target['actualCompleteOriginalSourcePlot'] = {**ref(path), 'panelOrdinal': n,
                    'sourcePCM_SHA256': target['sourcePCM_SHA256']}
    path = OUT/'text11-independent-actual-source-observations.json'
    dump(path, {'status': 'actual-original-source-evidence-not-approval', 'scriptEvidence': ref(Path(__file__)),
               'originalFullSourceIndexEvidence': ref(index_path),
               'priorExactOriginalSourceEvidence': ref(old_path), 'targets': targets,
               'localPages': local_pages, 'completeOriginalPages': full_pages,
               'newASR': False, 'sourceModified': False, 'runtimeModified': False,
               'humanListening': False, 'nativeSpeakerReview': False,
               'fullPhonemeCertification': False, 'pronunciationToneCertified': False})
    print(json.dumps(ref(path)))


if __name__ == '__main__':
    main()
