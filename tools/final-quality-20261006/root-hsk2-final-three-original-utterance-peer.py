#!/usr/bin/env python3
"""Explicit root peer decisions after viewing original full/local spectra."""
import argparse
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'course-app/docs/final-quality-20261006'
OUT = BASE / 'audio-root-peer-hsk2-final-three'
PROPOSAL = BASE / 'audio-context-peer-hsk2-final-three/three-fixed-original-utterance-independent-physical-proposals-v1.json'
FRESH = BASE / 'audio-context-peer-hsk2-final-three/three-fresh-original-utterance-observations-v1.json'
REPORT = BASE / 'audio-review/hsk2-paired-full-01.json'
REGISTRY = BASE / 'audio-review/fixed-original-utterance-decoder-scopes-05.json'
OBSERVATIONS = OUT / 'root-fresh-original-source-byte-and-frame-observations-v1.json'
DECISIONS = OUT / 'three-fixed-original-utterance-root-explicit-decisions-v1.json'
APPROVED = OUT / 'three-fixed-original-utterance-root-catalog-compiled-v1.json'
EXPECTED = {
    PROPOSAL: '9f2c1f3caad189e50177b7b19ff6940350d000c2103905ec608c060ac64b668a',
    FRESH: 'd03f74be95a024651aad0f549fd7234d94c62142af5095650076d0a525941ea5',
    REPORT: '31d7ebfec9e3fa3b97a6a9b196acc32d322f5222a2d5f3503e05349ecb02b3a2',
    REGISTRY: '0e17839d970908c507bf5702318e85c93a55d1d0f340ee07e4308e85cdfd9aee',
}
EXPLANATIONS = {
    'hsk2-fltrp-2026:l02:text3:line1': 'Root independently viewed the complete original source, complete current utterance spectrum and both fine boundary/name views. Cut .453 precedes the weak original initial noise and the continuous two-part Jia/yue named body .54–1.08; the vowel/formant transition is retained, with no model-token cut. Ni/kan form separate bodies about1.47–1.84, then the complete connected school/cinema clause follows after2.48. The final yuan body and weak natural decay through about4.56 precede cut4.629. The next original answer begins after5.42, outside the actual crop. The pinned printed Jiayue name, original medium Yue observation, source first-line context and CTC Jiayue are auxiliary source identity evidence; original small Jiale and all low confidence/no-speech diagnostics stay verbatim. This decision concerns the complete source utterance and does not make a global Le/Yue conversion or a tone/unique-phoneme certification.',
    'hsk2-fltrp-2026:l05:text3:line7': 'Root independently viewed the complete original source, current utterance spectrum and three fine views including the actual qian/bian transition. Cut27.98 lies before original weak onset and jiu/zai periodic bodies after28.52; the preceding answer release before26.97 is excluded. At the qian-to-bian transition near29.00 there is a short original constricted interval and subsequent vowel/nasal continuation, all retained before de; no decoder timestamp is used as a phone boundary. The complete location clause, original internal pause and chi-wan-fan/ni-men-ke-yi-gen-wo-qu-kan-kan clause remain in order. The last kan-kan continuation and natural irregular release through about32.93 precede cut32.96, with real original quiet after it through source end. Printed qianbian and unchanged small/CTC qianbian support the source occurrence; medium qianmian and no-speech diagnostics are preserved, without global Bian/Mian substitution or tone certification.',
    'hsk2-fltrp-2026:l13:text2:line7': 'Root independently viewed the complete original teaching dialogue, complete current utterance spectrum and three fine views. Cut28.08 precedes the whole weak r-like onset and initial periodic body about28.56–29.00. The following bi body is separate, followed by kou/duo/yi/bi and the genuine internal pause; the complete second clause starts with original x-like frication after31.36 and continues in source order through the written-character explanation. The connected final wen/le body, separate final central vowel and natural weak release through about33.79 are retained before cut33.88. Previous line release before26.90 and next answer about35.50 are excluded. The pinned printed Ri bi kou comparison and complete original character-teaching context/CTC are checked; pure Ri bi-kou spelled with Bi as pen stays unchanged, without a global homophone or tone rule.',
}

def sha(body):
    return hashlib.sha256(body).hexdigest()

def ref(path):
    return {'file': path.relative_to(ROOT).as_posix(), 'sha256': sha(path.read_bytes())}

def read(path):
    return json.loads(path.read_bytes())

def write_new(path, document):
    if path.exists():
        raise ValueError('immutable peer output already exists: ' + str(path))
    path.write_text(json.dumps(document, ensure_ascii=False, indent=2, allow_nan=False) + '\n')

def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def verify_reference(reference):
    path = Path(reference['file'])
    path = (path if path.is_absolute() else ROOT / path).resolve()
    path.relative_to(ROOT)
    if sha(path.read_bytes()) != reference['sha256']:
        raise ValueError('actual peer reference bytes differ: ' + str(path))
    return path

def inputs():
    for path, expected in EXPECTED.items():
        if sha(path.read_bytes()) != expected:
            raise ValueError('immutable peer input differs: ' + str(path))
    return read(PROPOSAL), {r['id']: r for r in read(REPORT)['targets']}, {r['id']: r for r in read(FRESH)['records']}

def observe():
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import numpy as np
    proposal, rows, fresh = inputs()
    support = load('root_three_support', 'review-decisions.py')
    features = load('root_three_features', 'review-syllable-evidence.py')
    crop = load('root_three_crop', 'review-crops.py')
    OUT.mkdir(exist_ok=True)
    records = []
    for decision in proposal['decisions']:
        row = rows[decision['id']]
        if row['id'] not in EXPLANATIONS:
            raise ValueError('unreviewed source ID')
        pcm = support.original_pcm(ROOT, row)
        start, end = row['sourceSampleRange16k']
        observed = fresh[row['id']]
        if sha(pcm[start*4:end*4]) != row['cropPCM_SHA256']:
            raise ValueError('fresh crop bytes differ')
        edges = {n: crop.db_window(pcm, a, b) for n, a, b in [
            ('beforeStart', start-320, start), ('afterStart', start, start+320),
            ('beforeEnd', end-320, end), ('afterEnd', end, end+320)]}
        if edges != row['actualEdgeRMSDbFS20ms'] or any(v is not None and v > -45 for v in edges.values()):
            raise ValueError('original strict quiet boundary differs')
        book = row['canonicalSource']
        printed = features.pointer(read(verify_reference(book)), book['sourceJSONPointer'])
        if printed['zh'] != book['parentZH'] or printed['py'] != book['sourcePinyin']:
            raise ValueError('original printed parent or pronunciation differs')
        checked = []
        for rawref in row['rawModelEvidence']:
            raw = read(verify_reference(rawref))
            support.unprompted(raw)
            if raw['candidateId'] != row['id'] or raw['proposalId'] != row['candidateId'] or raw['sourceSampleRange16k'] != [start,end] or raw['cropPCM_SHA256'] != row['cropPCM_SHA256'] or ''.join(x['text'] for x in raw['rawSegments']) != rawref['rawTranscript']:
                raise ValueError('actual original native result differs')
            checked.append(ref(verify_reference(rawref)))
        for whole in observed['actualWholeOriginalModels']:
            raw = read(verify_reference(whole)); support.unprompted(raw)
            if raw.get('cropPCM_SHA256', raw.get('track',{}).get('pcm',{}).get('sha256')) != sha(pcm) or ''.join(x['text'] for x in raw['rawSegments']) != whole['unalteredRawTranscript']:
                raise ValueError('actual complete original context differs')
            checked.append(ref(verify_reference(whole)))
        ctc = observed['actualCTCSupplementalEvidence']
        raw = read(verify_reference(ctc)); binding = read(verify_reference(ctc['semanticBinding']))
        if raw['rawText'] != ctc['originalRawText'] or json.loads(raw['rawResultString']) != raw['rawResult'] or raw['cropPCM_SHA256'] != row['cropPCM_SHA256'] or raw['actualInputSamples'] != end-start or raw['expectedTextPromptUsed'] is not False or binding['sourceSampleRange16k'] != [start,end] or binding['inferenceSHA256'] != ctc['sha256']:
            raise ValueError('actual original CTC body or frame binding differs')
        for fine in observed['actualFineOriginalPlots']:
            verify_reference(fine)
            a,b = fine['sourceSampleRange16k']
            if sha(pcm[a*4:b*4]) != fine['displayPCM_SHA256']:
                raise ValueError('viewed fine plot source PCM differs')
        verify_reference(observed['actualCompleteOriginalPlot'])
        actual_features = read(verify_reference(observed['actualSyllableFeatureEvidence']))
        bins = features.features(pcm,start,end)
        if bins != actual_features['featureBins'] or features.feature_sha(bins) != actual_features['featureBinsSHA256']:
            raise ValueError('actual original feature bins differ')
        array = np.frombuffer(pcm,dtype='<f4')
        figure, axes = plt.subplots(2,1,figsize=(16,6),constrained_layout=True)
        axes[0].plot(np.arange(0,len(array),8)/16000,array[::8],linewidth=.4)
        axes[1].specgram(array,NFFT=256,Fs=16000,noverlap=192,cmap='magma',vmin=-100,vmax=-20)
        axes[1].set_ylim(0,5000)
        for axis in axes:
            axis.axvline(start/16000,color='cyan');axis.axvline(end/16000,color='cyan')
        axes[0].set_title(row['id']+' complete fresh original source; cyan=current unchanged crop')
        axes[1].set_xlabel('Seconds in original source')
        path = OUT/(row['id'].replace(':','_')+'-root-fresh-complete-original-spectrum-v1.png')
        if path.exists():
            raise ValueError('whole original plot already exists')
        figure.savefig(path,dpi=160);plt.close(figure)
        records.append({'id':row['id'],'candidateId':row['candidateId'], 'sourceSHA256':row['sourceSHA256'],'sourcePCM_SHA256':sha(pcm),'sourceSampleRange16k':[start,end],'cropPCM_SHA256':sha(pcm[start*4:end*4]),'actualOriginalFourEdgeRMSDbFS20ms':edges,'actualPureAndWholeNativeBytesChecked':checked,'actualCTCBytesChecked':ref(verify_reference(ctc)),'originalFinePlotsSourcePCMRechecked':observed['actualFineOriginalPlots'],'freshOriginalWholeSourcePlot':ref(path),'unchangedNativeDecoderDiagnostics':row['holds'],'newASRExecutions':0})
    write_new(OBSERVATIONS,{'schemaVersion':1,'status':'actual-original-source-frames-rechecked-not-approved','scriptEvidence':ref(Path(__file__)),'proposalEvidence':ref(PROPOSAL),'originalFreshSourceEvidence':ref(FRESH),'records':records,'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False})
    print(json.dumps({'records':len(records),'observations':ref(OBSERVATIONS),'plots':[r['freshOriginalWholeSourcePlot']['file'] for r in records]}))

def approve():
    proposal, rows, _ = inputs()
    observations = read(OBSERVATIONS)
    if {r['id'] for r in observations['records']} != set(EXPLANATIONS):
        raise ValueError('fresh original observation coverage differs')
    scopes = {r['id']:r for r in read(REGISTRY)['targets']}
    support = load('root_three_decisions', 'review-decisions.py')
    decisions = []
    for original in proposal['decisions']:
        decision = copy.deepcopy(original); row = rows[decision['id']]
        physical = original['actualOriginalUtteranceSourcePhysicalEvidence']
        if scopes[row['id']]['originalPhysicalEvidence'] != physical:
            raise ValueError('independent original physical scope differs')
        identity = {key:row[key] for key in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')}
        explanation = EXPLANATIONS[row['id']]
        decision.update(decision='accept',cropPCM_SHA256=row['cropPCM_SHA256'],rationale=explanation,productionApproved=False)
        decision['sourceContextEvidence']['explanation'] = explanation
        decision['sourceContextEvidence']['rootFreshOriginalSourceEvidence'] = ref(OBSERVATIONS)
        decision['fixedOriginalUtteranceDecoderDecisionEvidence'] = {**identity,'sourceText':row['sourceZH'],'category':'fixed-complete-original-utterance-decoder-diagnostic-review','authorizedFixedSourceScope':ref(REGISTRY),'originalSourcePhysicalEvidence':physical,'phonemeIdentityUnknown':False,'completeOriginalCoreUtteranceIndependentlyReviewed':True,'independentCoreSourceSpectrumExplanation':explanation,'rootFreshOriginalSourceEvidence':ref(OBSERVATIONS),'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False}
        for key, allowed in [('resolvedTextHolds',support.TEXT_REVIEW_HOLDS),('resolvedSourceHolds',support.SOURCE_REVIEW_HOLDS),('resolvedBoundaryHolds',support.BOUNDARY_REVIEW_HOLDS),('resolvedDecoderASRDiagnosticHolds',support.DECODER_DIAGNOSTIC_HOLDS)]:
            decision[key] = sorted(set(row['holds']) & allowed)
        decisions.append(decision)
    write_new(DECISIONS,{'schemaVersion':1,'status':'three-explicit-root-original-source-utterance-decisions','reviewer':'root independent original-source peer after actual full/local spectrum review','reviewReportSHA256':ref(REPORT)['sha256'],'sourceReportEvidence':ref(REPORT),'authorizedFixedSourceScope':ref(REGISTRY),'immutablePhysicalProposalsEvidence':ref(PROPOSAL),'freshOriginalSourceEvidence':ref(OBSERVATIONS),'scriptEvidence':ref(Path(__file__)),'decisions':decisions,'automaticApproval':False,'newASR':False,'sourceModified':False,'runtimeModified':False})
    subprocess.run(['python3',str(Path(__file__).with_name('review-decisions.py')),'--repo-root',str(ROOT),'--report',str(REPORT),'--decisions',str(DECISIONS),'--target-catalog',str(ROOT/'course-app/content/audio-precision-targets-20261006.json'),'--output',str(APPROVED)],check=True)
    print(json.dumps({'decisions':ref(DECISIONS),'approved':ref(APPROVED)}))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('mode',choices=['observe','approve'])
    mode = parser.parse_args().mode
    observe() if mode == 'observe' else approve()
