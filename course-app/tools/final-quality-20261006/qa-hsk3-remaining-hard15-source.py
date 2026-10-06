#!/usr/bin/env python3
"""Actual source evidence for fifteen remaining H3 decoder-held utterances.

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
OUT = BASE / 'audio-context-peer-hsk3-remaining-spoken-hard15'
INPUT = BASE / 'audio-context-peer-hsk3-remaining-spoken/hard15-exact-existing-original-crops-CTC-prepared-input.json'
SELECT = [x['id'].removeprefix('hsk3-fltrp-2026:') for x in json.loads(INPUT.read_text())['targets']]
IMPROVED = {}



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
    global_whole_path = BASE/'audio-hsk1/original-source-full-raw-coverage-final.json'
    global_whole = json.loads(global_whole_path.read_text())['tracks']
    ctc_index_path = BASE/'audio-hsk3/remaining-spoken-hard15-ctc/evidence-index.json'
    assert sha(ctc_index_path) == '1fa4b74c5b63b0b9a0b5f2e737fcbef97a85dff905e423e55be6be742de4afa0'
    ctc_index = json.loads(ctc_index_path.read_text())
    ctc_targets = {x['id']: x for x in ctc_index['targets']}
    assert len(ctc_targets) == len(SELECT) == 15
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
        elif ident in old:
            prior = old[ident]
            assert prior['sourcePCM_SHA256'] == row['sourcePCM_SHA256']
            whole_reference = prior['sourceGroupEvidence']
        else:
            tracks = [x for x in global_whole
                      if x['sourceTrack'].removeprefix('course-app/public/') == row['sourceTrack']
                      and x['sourceSHA256'] == row['sourceSHA256']]
            assert len(tracks) == 1
            raw_references = []
            for candidate_reference in tracks[0]['rawEvidence']:
                _, candidate_raw = shared.pinned(candidate_reference)
                observed_pcm = candidate_raw.get('cropPCM_SHA256', candidate_raw.get('track', {}).get('pcm', {}).get('sha256'))
                observed_range = candidate_raw.get('sourceSampleRange16k')
                if observed_range is None and candidate_raw.get('track', {}).get('pcm', {}).get('samples') == len(pcm):
                    observed_range = [0, len(pcm)]
                if observed_pcm == row['sourcePCM_SHA256'] and observed_range == [0, len(pcm)]:
                    raw_references.append(candidate_reference)
            assert raw_references, (ident, row['sourcePCM_SHA256'])
            whole_reference = raw_references[0]
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
        ctc_target = ctc_targets[ident]
        for key in target:
            assert ctc_target[key] == target[key]
        ctc_path, ctc = shared.pinned(ctc_target['independentCTC'])
        assert ctc['modelSHA256'] == 'c71f0ce00bec95b07744e116345e33d8cbbe08cef896382cf907bf4b51a2cd51'
        assert ctc['cropPCM_SHA256'] == row['cropPCM_SHA256']
        assert ctc['actualInputSamples'] == last-first and ctc['sampleRate'] == 16000
        assert json.loads(ctc['rawResultString']) == ctc['rawResult']
        assert ctc['rawResult']['text'] == ctc['rawText'] == ctc_target['independentCTC']['rawText']
        assert ctc['producerAddedSilenceFrames'] == 0
        for key in ('expectedTextPromptUsed', 'hotwordsUsed', 'externalLanguageModelUsed',
                    'inverseTextNormalizationUsed', 'homophoneReplacementUsed',
                    'producerAlteredSourceSamples', 'automaticPrecisionApproval'):
            assert ctc[key] is False
        assert sha(ROOT/ctc['scriptFile']) == ctc['scriptSHA256']
        shared.pinned({'file': ctc['provenanceFile'], 'sha256': ctc['provenanceSHA256']})
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
                       'sourceOrProposalsModified': False, 'productionApproved': False,
                       'independentActualCTCSupplementalEvidence': {**ref(ctc_path),
                           'rawText': ctc['rawText'], 'actualNativeRawStringVerified': True,
                           'modelSHA256': ctc['modelSHA256'], 'emissionTimesNotPhonemeEdges': True,
                           'actualIndexEvidence': ref(ctc_index_path), 'notApproval': True}})
        targets.append(target)
        sources.setdefault(row['sourceTrack'], []).append(target)
    local_pages = []
    for offset in range(0, len(targets), 4):
        batch = targets[offset:offset+4]
        fig, axes = plt.subplots(len(batch), 2, figsize=(22, len(batch)*3.2), squeeze=False)
        path = OUT/f'hard15-actual-source-crop-panels-{offset//4+1:02}.png'
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
        path = OUT/f'hard15-complete-original-source-panels-{offset//4+1:02}.png'
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
    path = OUT/'hard15-independent-actual-source-observations.json'
    dump(path, {'status': 'actual-original-source-evidence-not-approval', 'scriptEvidence': ref(Path(__file__)),
               'originalFullSourceIndexEvidence': ref(index_path), 'exactPreparedActualInput': ref(INPUT),
               'allOriginalFullRawIndexEvidence': ref(global_whole_path),
               'priorExactOriginalSourceEvidence': ref(old_path), 'targets': targets,
               'localPages': local_pages, 'completeOriginalPages': full_pages,
               'newASR': False, 'sourceModified': False, 'runtimeModified': False,
               'humanListening': False, 'nativeSpeakerReview': False,
               'fullPhonemeCertification': False, 'pronunciationToneCertified': False})
    verified = OUT/'hard15-actual-CTC-independent-source-frame-verification.json'
    dump(verified, {'status': 'independent-CTC-bytes-source-frames-verified-not-approved',
        'reviewer': 'acceptance_scope_plan', 'observations': [
            {**{key: x[key] for key in ('id', 'candidateId', 'sourceTrack', 'sourceSHA256',
                'sourcePCM_SHA256', 'sourceSampleRange16k', 'cropPCM_SHA256')},
             'rawEvidence': {key: x['independentActualCTCSupplementalEvidence'][key] for key in ('file','sha256')},
             'rawText': x['independentActualCTCSupplementalEvidence']['rawText'],
             'actualSourceAndCropBytesVerified': True} for x in targets],
        'noNewInference': True, 'automaticApproval': False, 'humanListening': False,
        'pronunciationToneCertified': False})
    print(json.dumps(ref(path)))
    print(json.dumps(ref(verified)))


if __name__ == '__main__':
    main()
