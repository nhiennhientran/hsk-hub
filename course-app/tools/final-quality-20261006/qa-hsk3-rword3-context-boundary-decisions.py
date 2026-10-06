#!/usr/bin/env python3
"""Three fixed original word/context recommendations; no samples or ASR changed."""
import hashlib
import importlib.util
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
BASE = ROOT / 'course-app/docs/final-quality-20261006'
OUT = BASE / 'audio-context-peer-hsk3-rword3'
OBS = OUT / 'three-rword-four-current-variants-independent-source-observations.json'
OBS_SHA = '72cd3442627b928e82f8d3a9bb1051900056d609986e5b8a6a293bfd59d384bc'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ref(path):
    return {'file': path.relative_to(ROOT).as_posix(), 'sha256': sha(path)}


def dump(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def window_observation(pcm_bytes, start, end, description):
    first, last = round(start * 16000), round(end * 16000)
    samples = np.frombuffer(pcm_bytes[first * 4:last * 4], dtype='<f4').astype(np.float64)
    # Statistics only. No filtering, DC removal, padding or altered samples are played.
    fft_size = max(16384, 2 ** (len(samples) - 1).bit_length())
    power = np.abs(np.fft.rfft(samples * np.hanning(len(samples)), fft_size)) ** 2
    frequencies = np.fft.rfftfreq(fft_size, 1 / 16000)
    total = float(power.sum())
    return {'sourceSampleRange16k': [first, last],
            'actualPCM_SHA256': hashlib.sha256(pcm_bytes[first * 4:last * 4]).hexdigest(),
            'description': description,
            'originalUnfilteredRMSDbFS': float(20 * np.log10(max(np.sqrt(np.mean(samples ** 2)), 1e-15))),
            'meanOriginalAmplitude': float(samples.mean()),
            'HannFFTFrequencyPowerFraction0to80Hz': float(power[frequencies <= 80].sum() / total),
            'HannFFTFrequencyPowerFraction120to5000Hz': float(power[(frequencies >= 120) & (frequencies <= 5000)].sum() / total),
            'dominantHannFFTFrequencyHz': float(frequencies[np.argmax(power)]),
            'diagnosticFFTSize': fft_size, 'statisticsAlterPlaybackSamples': False}


def main():
    assert sha(OBS) == OBS_SHA
    support = load_module('hsk3_rword3_context_boundary', ROOT / 'tools/final-quality-20261006/review-decisions.py')
    observed = json.loads(OBS.read_text())
    targets = {(t['id'], t['candidateId']): t for t in observed['targets']}
    chat = targets[('hsk3-fltrp-2026:l13:word19', '6f3e708659010b4571bf964c')]
    rows = {}
    for t in observed['targets']:
        report = ROOT / t['actualReportEvidence']['file']
        assert sha(report) == t['actualReportEvidence']['sha256']
        rows[(t['id'], t['candidateId'])] = next(r for r in json.loads(report.read_text())['targets']
            if r['id'] == t['id'] and r['candidateId'] == t['candidateId'])
    chat_row = rows[(chat['id'], chat['candidateId'])]
    pcm = support.original_pcm(ROOT, chat_row)
    pauses = [window_observation(pcm, 12.40, 12.66,
        '原一边第二读voice结束后、聊天第一读起声前的真实低频背景暂停；不是邻词voice。'),
        window_observation(pcm, 13.77, 13.91,
        '原聊天第一读弱鼻尾结束后、下一聊天第二读开始前的真实暂停。')]
    control = window_observation(pcm, 12.73, 12.96,
        '第一聊天原liao的真实周期voice对照；展示120–5000Hz语音谱，与两pause低频背景不同。')
    wave_path = OUT / 'chat-first-two-original-pause-background-and-source-boundary-facts.json'
    dump(wave_path, {'schemaVersion': 1, 'status': 'actual-original-source-observations-not-authority',
        **{k: chat[k] for k in ('sourceTrack', 'sourceSHA256', 'sourcePCM_SHA256')},
        'sourceDecodedFrames16k': chat['sourceDecodedFrames16k'],
        'plots': [chat['actualCurrentSourceCropPlot']],
        'completeOriginalSourcePlot': chat['actualCompleteOriginalSourcePlot'],
        'actualFineSourcePhaseEvidence': chat['actualFineSourcePhaseEvidence'],
        'backgroundReferenceWindows': pauses, 'actualVoicedCoreControlWindow': control,
        'independentObservationExplanation':
          '实际看完整原轨和细谱：前一边第二读声体约12.37前结束；12.40–12.66只有原低频背景漂移。'
          '第一聊天弱l起声约12.68，liao周期体12.73–13.07，t释放/摩擦13.12–13.27，'
          'ian周期体13.28–13.65及弱鼻尾到约13.74均在本cut。下一聊天第二读约14.08另起。'
          '两真pause各含原PCM，Hann FFT的0–80Hz功率比例与周期voice对照及真实谱共同区别背景与邻词；'
          '不把RMS阈值或ASR字/time作为起尾证书。13-6晚会第二读两声群属同一词读，旧按声群简单2N分组的guard偏移不是真邻词界。',
        'plotSpectrogramDetrend': 'scipy per-window constant detrend is diagnostic only; source PCM remains unchanged',
        'backgroundRemovedFromAudio': False, 'syntheticSilence': False,
        'sourceModified': False, 'humanListening': False, 'nativeSpeakerReview': False,
        'pronunciationToneCertified': False, 'devicePlaybackCertified': False, 'fullPhonemeCertification': False,
        'independentSourceObservationEvidence': ref(OBS), 'scriptEvidence': ref(Path(__file__))})
    selected = [chat] + [t for t in observed['targets'] if t['id'].startswith('hsk3-fltrp-2026:l14:')]
    decisions = []; annotations = []; checks = []
    for t in selected:
        row = rows[(t['id'], t['candidateId'])]
        is_chat = t['id'] == chat['id']
        source_explanation = (
          '已独立实际看13-6全源、当前12.64–13.91和12.30–14.03细谱。'
          '前一边第二读完整声体约12.37前结束；第一聊天弱l起声约12.68、liao周期体12.73–13.07，'
          't释放/摩擦13.12–13.27、ian周期体13.28–13.65、弱鼻尾约13.74完整。'
          '第二聊天原读约14.08另起在cut13.91后；本cut只有第一完整liao-tian head和原背景，绝不复用旧混入一边的main cut。'
          '整源原small压成一个聊天字串原样保留，不据它假定只读一次；全源真实两原读和打印词序单独核，'
          '晚会第二读的两voice群属同一词读，不能将多群当额外head。'
          '本first无NS/empty/zero；两个pause原谱/PCM及周期控制区别低频原背景，不降全局quiet门。'
          if is_chat else
          '已独立实际看14-8全源、current12.83–14.02和12.67–14.19细谱。'
          '前最后第二读约12.67前声体已结束，目标第一一块儿弱yi起声约12.98/13.00，高前i周期体13.01–13.30，'
          'k闭塞/释放与送气13.34–13.50，uai复合韵周期体13.53–13.85及弱尾约13.91完整；'
          '第二一块儿原读约14.20另起在cut14.02后，未混网站或最后。全轨新年、班级、跳、留学生、最后、'
          '一块儿、网站、视频及各重复读的真实声群顺序逐源核；不由2N阈值分群证明身份。'
          '两个教材词义条目共用一个合法原单读crop，IDs与语义不改；4实际20ms edge均小于-45dBFS。')
        rationale = source_explanation + (
          ' 原book ZH/py保留；双Whisper与C71实际原字逐项保存，只作辅助。'
          '本审闭合完整合法原录音/core及source身份，学生显示教材标注儿化与原录音自然读法。'
          '不声称声学r绝对存在或缺失，不认证逐音素canonical-r/声调/母语者，绝不改教材、答案、旧记录或原声。')
        variant = {k: t[k] for k in ('id', 'candidateId', 'sourceTrack', 'sourceSHA256', 'sourcePCM_SHA256', 'sourceSampleRange16k', 'cropPCM_SHA256')}
        form = t['sourceText']
        variant.update({'canonicalPrintedZH': form, 'canonicalPrintedPinyin': t['sourcePinyin'],
            'canonicalPrintedSource': t['canonicalPrintedSource'],
            'sourceOriginalCoreUtteranceComplete': True, 'sourceSamplesAndCanonicalTextUnchanged': True,
            'studentVisibleAnnotationZH': f'教材标注儿化“{form}”；本词按原录音的自然读法播放。',
            'studentVisibleAnnotationVI': f'Sách ghi “{form}” với âm hóa 儿; từ này phát theo cách đọc tự nhiên trong bản ghi gốc.',
            'scope': 'fixed-complete-legal-original-recording-optional-rime-variant-context',
            'recordedPronunciationDifference': '原词核心与完整单读闭合；可选儿化强弱不作逐音素证书，不主张原r绝对缺失。',
            'actualOriginalObservationEvidence': ref(OBS), 'actualSourceExplanation': source_explanation,
            'acousticCanonicalRClaim': False, 'rAbsenceAbsoluteNativeClaim': False,
            'annotationSuggestedNotRuntimeModified': True, 'humanListening': False,
            'nativeSpeakerReview': False, 'pronunciationToneCertified': False, 'devicePlaybackCertified': False,
            'fullPhonemeCertification': False})
        identity = {k: t[k] for k in ('sourceTrack', 'sourceSHA256', 'sourcePCM_SHA256', 'sourceSampleRange16k', 'cropPCM_SHA256', 'sourceText', 'sourcePinyin')}
        proof = {**identity, 'canonicalPrintedSource': t['canonicalPrintedSource'],
            'sourceGroupEvidence': t['sourceGroupEvidence'], 'wholeSourceGroupUnpromptedASRReviewed': True,
            'sourceOrderChecked': True, 'originalRepeatedReadingsChecked': True,
            'neighborSpeechExcluded': True, 'actualCropBoundariesChecked': True, 'phoneticEquivalenceIsAuxiliaryOnly': True,
            'rawDifferences': [{**{k: m[k] for k in ('file', 'sha256', 'actualInference', 'modelRepository', 'modelRevision')},
                'observedRawText': m['rawTranscript'], 'canonicalUnchanged': form,
                'holdsUnchanged': m['holdsUnchanged'], 'flagsUnchanged': m['flagsUnchanged']}
                for m in t['actualCropModelEvidence']],
            'actualIndependentCTCEvidence': t['actualCTCRaw'], 'actualIndependentCTCBinding': t['actualCTCBinding'],
            'independentOriginalSourceObservation': ref(OBS),
            'actualCurrentSourceCropPlot': t['actualCurrentSourceCropPlot'],
            'actualCompleteOriginalSourcePlot': t['actualCompleteOriginalSourcePlot'],
            'actualFineSourcePhaseEvidence': t['actualFineSourcePhaseEvidence'],
            'actualFourEdgeRMSDbFS20ms': t['actualFourEdgeRMSDbFS20ms'],
            'sourceHeadProposalsPreservedAsProposalsNotCertification': t['sourceHeadProposalsPreserved'],
            'completeOriginalCoreUtteranceIndependentlyReviewed': True, 'corePhonemeIdentityUnknown': False,
            'recordedPronunciationVariantEvidence': variant, 'explanation': rationale,
            'globalGlyphOrErSubstitution': False, 'acousticCanonicalRClaim': False, 'fullPhonemeCertification': False}
        decision = {k: t[k] for k in ('id', 'candidateId', 'sourceSampleRange16k', 'cropPCM_SHA256')}
        decision.update({'decision': 'accept', 'recommendationOnly': True, 'sourceContextChecked': True,
            'rationale': rationale, 'sourceContextEvidence': proof,
            'resolvedTextHolds': sorted(set(row['holds']) & support.TEXT_REVIEW_HOLDS),
            'resolvedBoundaryHolds': sorted(set(row['holds']) & support.BOUNDARY_REVIEW_HOLDS),
            'resolvedSourceHolds': [], 'resolvedDecoderASRDiagnosticHolds': [],
            'acknowledgedFlags': row['flags'], 'sourceReportEvidence': t['actualReportEvidence'],
            'humanListening': False, 'nativeSpeakerReview': False, 'pronunciationToneCertified': False,
            'devicePlaybackCertified': False, 'fullPhonemeCertification': False, 'productionApproved': False})
        if is_chat:
            decision['boundaryDecisionEvidence'] = {**identity, 'category': 'continuous-original-background',
                'waveformObservation': ref(wave_path),
                'targetForegroundExtent16k': [202720, 220160],
                'independentlyReviewedNeighborLimits16k': [198400, 224640],
                'actualWaveformAndSpectrumReviewed': True, 'completeTargetPhonemesRetained': True,
                'neighborTargetSpeechExcluded': True, 'sourceOrderChecked': True,
                'originalBackgroundPreserved': True, 'noSyntheticPadding': True, 'rawASRTimestampsAreAuxiliaryOnly': True,
                'continuousBackgroundDistinctFromTargetVoice': True,
                'startBoundaryExplanation': '12.64cut位于一边voice已约12.37结束后的真实低频背景；liao弱起12.68及其声体完整留在cut内。前20ms RMS-37.376与后20ms-44.362是源背景观测，不把该值改成quiet或删原背景。两个pause的实际谱/PCM与liao周期对照区别低频漂移和目标/邻词voice。',
                'endBoundaryExplanation': '第一ian/n弱尾约13.74后在真实原pause衰减，13.91cut早于下一聊天14.08实际起声；原20ms beforeEnd-47.042/afterEnd-50.029。保留全部第一原读起韵鼻尾及自然背景，第二原读不入cut。',
                'explanation': source_explanation + ' 有界source背景例外只覆盖这一个真实first几何，背景不滤、PCM不改。completeTargetPhonemesRetained指该合法原读所含的全部原声，不声称教材可选r逐音素已认证。',
                'acousticCanonicalRClaim': False, 'canonicalOptionalRPhonemeCertified': False,
                'humanListening': False, 'nativeSpeakerReview': False,
                'pronunciationToneCertified': False, 'devicePlaybackCertified': False, 'fullPhonemeCertification': False}
            support.boundary_decision(row, decision, ROOT)
        support.contextual_decision(row, decision, ROOT)
        decisions.append(decision); annotations.append(variant)
        checks.append({'id': t['id'], 'candidateId': t['candidateId'], 'contextValidated': True,
            'exactBackgroundBoundaryValidated': is_chat, 'rawEvidenceUnchanged': True})
    packs = [('two-yikuai-original-single-reading-context-explicit-decisions.json', decisions[1:]),
             ('chat-first-original-background-single-reading-explicit-decision.json', decisions[:1])]
    written = []
    for name, entries in packs:
        path = OUT / name
        report_ref = entries[0]['sourceReportEvidence']
        dump(path, {'schemaVersion': 1, 'status': 'explicit-independent-recommendations-awaiting-central-compile',
            'reviewer': 'acceptance_scope_plan', 'reviewReportSHA256': report_ref['sha256'],
            'reviewReportEvidence': report_ref, 'actualObservationEvidence': ref(OBS),
            'scriptEvidence': ref(Path(__file__)), 'decisions': entries,
            'newASR': False, 'sourceModified': False, 'runtimeModified': False, 'automaticApproval': False})
        written.append(ref(path))
    note_path = OUT / 'three-original-single-reading-word-student-visible-recording-note-proposal.json'
    dump(note_path, {'schemaVersion': 1, 'status': 'source-bound-display-proposal-not-runtime-write',
        'decisionsEvidence': written, 'entries': annotations, 'count': 3,
        'canonicalTextPinyinIDsAndHistoryPreserved': True, 'sourceAudioAndFramesPreserved': True,
        'acousticCanonicalRClaim': False, 'runtimeModified': False})
    validation_path = OUT / 'three-original-word-context-and-first-background-read-only-validation.json'
    dump(validation_path, {'status': 'passed-read-only-schema-identity-and-actual-source-checks-not-authority',
        'passed': len(checks), 'checks': checks, 'decisionsEvidence': written,
        'waveformEvidence': ref(wave_path), 'allRawEvidenceUnchanged': True, 'authorityModified': False,
        'heldExistingSecondChatVariant': {'id': chat['id'], 'candidateId': 'b6ab1ba2bd5a5ec8f2875cec',
            'reason': 'strict quiet but original NS warning is retained; optional-r notice does not override decoder hard gate'}})
    print(json.dumps({'decisions': written, 'waveform': ref(wave_path), 'notes': ref(note_path),
        'validation': ref(validation_path), 'passed': len(checks)}))


if __name__ == '__main__':
    main()
