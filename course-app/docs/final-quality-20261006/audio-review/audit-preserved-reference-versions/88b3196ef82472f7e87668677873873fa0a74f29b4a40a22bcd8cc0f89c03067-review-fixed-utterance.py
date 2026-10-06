#!/usr/bin/env python3
"""Validate explicitly registered complete-source utterance diagnostics.

This never infers a pronunciation from a decoder word or moves its timestamp.
Exact versioned source/crop scopes retain their actual raw text, no-speech probability
or zero-width word emission. Acceptance still requires an independent decision
about the complete original utterance, spectrum and excluded neighbours.
"""
import hashlib
import importlib.util
import json
from pathlib import Path

SCOPE_REFERENCE = {
    'file': 'course-app/docs/final-quality-20261006/audio-review/fixed-original-utterance-decoder-scopes-01.json',
    'sha256': 'cc7ec87940b019c0b51bd993bb0048b49785656abacdac91165dbae79cced9d8',
}
SCOPE_REFERENCES = [
    SCOPE_REFERENCE,
    {'file': 'course-app/docs/final-quality-20261006/audio-review/fixed-original-utterance-decoder-scopes-02.json',
     'sha256': '6b1e5286b435fdce27d239799c88d27952617d04a8b0a2dc06553ab164360995'},
    {'file': 'course-app/docs/final-quality-20261006/audio-review/fixed-original-utterance-decoder-scopes-03.json',
     'sha256': '1a592b5b918b43c6f82f77a395031b93d48a88a655c05dc28131c55996acdccd'},
    {'file': 'course-app/docs/final-quality-20261006/audio-review/fixed-original-utterance-decoder-scopes-04.json',
     'sha256': '1fe836401e849a918ae9fbd85df24ae293ae19afe8d17598b39adcbb3c47da08'},
]
NO_SPEECH = 'crop-ASR-hallucination-or-no-speech-warning'
ZERO_WORD = 'crop-ASR-zero-inverted-or-out-of-bounds-word'
MODEL_SHA = 'c71f0ce00bec95b07744e116345e33d8cbbe08cef896382cf907bf4b51a2cd51'


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def integer_pair(value):
    return isinstance(value, list) and len(value) == 2 and all(type(x) is int for x in value)


def validate(row, decision, root, support=None):
    support = support or load('fixed_utterance_support', 'review-decisions.py')
    proof = decision.get('fixedOriginalUtteranceDecoderDecisionEvidence', {})
    support.actual_identity(row, proof, 'fixed original utterance')
    if proof.get('category') != 'fixed-complete-original-utterance-decoder-diagnostic-review':
        raise ValueError('fixed utterance requires its separate explicit diagnostic category')
    scope_reference = proof.get('authorizedFixedSourceScope')
    if scope_reference not in SCOPE_REFERENCES:
        raise ValueError('utterance diagnostic registry is not an exact immutable approved version')
    scopes = json.loads(support.actual_file(root, scope_reference).read_text())
    keys = ('id', 'candidateId', 'sourceTrack', 'sourceSHA256', 'sourcePCM_SHA256',
            'sourceSampleRange16k', 'cropPCM_SHA256')
    matches = [x for x in scopes['targets'] if all(x.get(k) == row.get(k) for k in keys)
               and x['canonicalSourceText'] == row['sourceZH'] and x['canonicalSource'] == row['canonicalSource']]
    if len(matches) != 1 or proof.get('authorizedFixedSourceScope') != scope_reference:
        raise ValueError('utterance diagnostic is outside the exact authorized source/crop scope')
    entry = matches[0]
    allowed = set(entry['allowedDecoderHolds'])
    if not allowed or allowed - {NO_SPEECH, ZERO_WORD} or set(row['holds']) & support.DECODER_DIAGNOSTIC_HOLDS != allowed:
        raise ValueError('only the explicitly registered decoder diagnostics may be reviewed')
    if set(row['holds']) - allowed - support.TEXT_REVIEW_HOLDS:
        raise ValueError('missing identity/model/boundary/occurrence evidence cannot use this utterance route')
    if row['unit'] != 'sentence' or row.get('expectedReadingCount', 1) != 1 or row.get('clipUnit') != 'single-original-sentence':
        raise ValueError('fixed utterance must be a single original source sentence')
    physical = proof.get('originalSourcePhysicalEvidence', {})
    if physical != entry['originalPhysicalEvidence']:
        raise ValueError('the original pinned physical source facts must remain unchanged')
    proposal = json.loads(support.actual_file(root, entry['originalSourcePhysicalProposal']).read_text())
    declared = [x for x in proposal['decisions'] if x['id'] == row['id'] and x['sourceSampleRange16k'] == row['sourceSampleRange16k']]
    if len(declared) != 1 or declared[0]['actualOriginalUtteranceSourcePhysicalEvidence'] != physical:
        raise ValueError('original physical facts are absent from their actual immutable source proposal')
    support.actual_identity(row, physical, 'original utterance physical evidence')
    for flag in ('completeOriginalOnsetRimeAndFinalReviewed', 'neighborPhonemesExcluded',
                 'sourceOrderChecked', 'originalPrintedPronunciationChecked', 'allASRWarningsRetained', 'noSyntheticPadding'):
        if physical.get(flag) is not True:
            raise ValueError('complete original utterance physical check is missing: ' + flag)
    if physical.get('phonemeIdentityUnknown') is not False or proof.get('phonemeIdentityUnknown') is not False:
        raise ValueError('unknown original core phonemes stay held')
    if proof.get('completeOriginalCoreUtteranceIndependentlyReviewed') is not True or not proof.get('independentCoreSourceSpectrumExplanation'):
        raise ValueError('actual full core utterance needs an explicit independent source-spectrum decision')
    if any(proof.get(k, False) or physical.get(k, False) for k in
           ('humanListening', 'nativeSpeakerReview', 'pronunciationToneCertified', 'devicePlaybackCertified', 'fullPhonemeCertification')):
        raise ValueError('this gate supplies no native, tone or full-phoneme certification')
    if not all(physical.get(k) for k in ('explanation', 'onsetExplanation', 'rimeAndFinalExplanation', 'originalReadingExplanation')):
        raise ValueError('concrete complete original onset, nucleus and tail explanations are required')
    pcm = support.original_pcm(root, row)
    first, last = row['sourceSampleRange16k']
    if not integer_pair([first, last]) or not 0 <= first < last <= len(pcm) // 4 or hashlib.sha256(pcm[first*4:last*4]).hexdigest() != row['cropPCM_SHA256']:
        raise ValueError('utterance crop bytes do not reproduce the actual original integer frames')
    marks = physical['selectedCompleteOriginalReadingFrames16k']
    limits = physical['independentlyReviewedNeighborLimits16k']
    if not integer_pair(marks) or not integer_pair(limits) or not 0 <= limits[0] <= first <= marks[0] < marks[1] <= last <= limits[1] <= len(pcm)//4:
        raise ValueError('complete utterance and neighbour limits do not fit the original crop')
    crop_gate = load('fixed_utterance_crop', 'review-crops.py')
    edges = {name: crop_gate.db_window(pcm, a, b) for name, a, b in
             [('beforeStart', first-320, first), ('afterStart', first, first+320),
              ('beforeEnd', last-320, last), ('afterEnd', last, last+320)]}
    if edges != row.get('actualEdgeRMSDbFS20ms') or any(v is not None and v > -45 for v in edges.values()):
        raise ValueError('every actual available original edge must remain strictly quiet')
    utterance = physical['sourceUtteranceEvidence']
    source = row['canonicalSource']
    if utterance.get('canonicalSourceId') != source['sourceId'] or utterance.get('sentenceOrdinal') != source['sentenceOrdinal'] or utterance.get('parentZH') != source['parentZH'] or utterance.get('actualUtteranceFrames16k') != marks or utterance.get('completeOriginalUtteranceIndependentlyReviewed') is not True:
        raise ValueError('complete original utterance does not bind its printed parent and ordinal')
    for key, side in [('previousActualSpeechFrames16k', 'previous'), ('followingActualSpeechFrames16k', 'following')]:
        bounds = utterance.get(key)
        if bounds is not None and (not integer_pair(bounds) or not 0 <= bounds[0] < bounds[1] <= len(pcm)//4 or (side == 'previous' and bounds[1] > first) or (side == 'following' and bounds[0] < last)):
            raise ValueError('actual utterance includes adjacent original foreground')
    if not utterance.get('wholeSourceEvidence'):
        raise ValueError('immutable complete original source context is required')
    for ref in utterance['wholeSourceEvidence']:
        whole = json.loads(support.actual_file(root, ref).read_text())
        support.unprompted(whole)
        if whole.get('cropPCM_SHA256', whole.get('track', {}).get('pcm', {}).get('sha256')) != row['sourcePCM_SHA256']:
            raise ValueError('whole source model context is not the actual complete original PCM')
    syllable = load('fixed_utterance_features', 'review-syllable-evidence.py')
    printed = physical['originalPrintedSource']
    printed_path = support.actual_file(root, printed)
    if printed != {k: source[k] for k in ('file', 'sha256', 'sourceJSONPointer')}:
        raise ValueError('printed original source is not the exact canonical parent object')
    obj = syllable.pointer(json.loads(printed_path.read_text()), printed['sourceJSONPointer'])
    if obj.get('zh') != source['parentZH'] or obj.get('py') != source['sourcePinyin']:
        raise ValueError('canonical original printed text/pinyin differs')
    wave = json.loads(support.actual_file(root, physical['waveformObservation']).read_text())
    support.actual_identity(row, wave, 'actual original source spectrum')
    plots = [x for x in wave.get('plots', []) if x['id'] == row['id'] and x['sourceSampleRange16k'] == [first,last] and x['cropPCM_SHA256'] == row['cropPCM_SHA256']]
    if len(plots) != 1:
        raise ValueError('actual spectrum must uniquely bind the current original crop')
    support.actual_file(root, plots[0])
    actual = json.loads(support.actual_file(root, physical['actualSyllableFeatureEvidence']).read_text())
    support.actual_identity(row, actual, 'original utterance voiced features')
    bins = syllable.features(pcm, first, last)
    if actual.get('featureBins') != bins or actual.get('featureBinsSHA256') != syllable.feature_sha(bins):
        raise ValueError('original utterance features do not reproduce its actual original PCM')
    voiced = [x for x in bins if x['voicedObservation'] and marks[0] <= x['sourceWindowFrames16k'][0] and x['sourceWindowFrames16k'][1] <= marks[1]]
    if len(voiced) < 10 or max(x['sourceWindowFrames16k'][1] for x in voiced)-min(x['sourceWindowFrames16k'][0] for x in voiced) < 1280:
        raise ValueError('complete original utterance has no adequate actual voiced observation')
    whitelist = entry['originalRawResultWhitelist']
    snapshots, zeros, warnings = set(), [], []
    for e in row['rawModelEvidence']:
        if {k:e[k] for k in ('file','sha256','modelRepository','modelRevision','rawTranscript')} not in whitelist:
            raise ValueError('actual pure Whisper result lies outside the exact raw whitelist')
        raw = json.loads(support.actual_file(root, e).read_text()); support.unprompted(raw)
        model = (raw.get('modelRepository'), raw.get('modelRevision'))
        if model not in support.PINNED_MODELS or set(e['holds']) - allowed - support.TEXT_REVIEW_HOLDS:
            raise ValueError('other pure decoder/model diagnostics remain closed')
        snapshots.add(model)
        if raw.get('candidateId') != row['id'] or raw.get('originalSourceTrack') != row['sourceTrack'] or raw.get('originalSourceSHA256') != row['sourceSHA256'] or raw.get('sourceSampleRange16k') != [first,last] or raw.get('cropPCM_SHA256') != row['cropPCM_SHA256']:
            raise ValueError('actual pure model binding differs from the original utterance')
        segments = raw.get('rawSegments', [])
        if not segments or ''.join(s.get('text','') for s in segments) != e['rawTranscript']:
            raise ValueError('actual pure transcript is missing or altered')
        for si, segment in enumerate(segments):
            if segment.get('compression_ratio',0) > 2.4:
                raise ValueError('caption/compression warning is not an authorized utterance diagnostic')
            if segment.get('no_speech_prob',0) > .6:
                warnings.append({'modelRepository':model[0], 'segmentId':segment.get('id'), 'no_speech_prob':segment['no_speech_prob']})
            words = segment.get('words', [])
            if not words:
                raise ValueError('empty pure word evidence stays held')
            for wi, word in enumerate(words):
                a,b=word['start'],word['end']
                if not 0 <= a <= b <= (last-first)/16000+.08:
                    raise ValueError('inverted or outside pure decoder word remains held')
                if a == b:
                    zeros.append({'modelRepository':model[0], 'segmentIndex':si, 'wordIndex':wi, 'word':word['word'], 'start':a, 'end':b})
    if snapshots != support.PINNED_MODELS or zeros != entry['onlyAuthorizedZeroDecoderWordEmissions'] or bool(warnings) != (NO_SPEECH in allowed):
        raise ValueError('all original warnings and the exact zero-width emission must remain preserved')
    checked = json.loads(support.actual_file(root, physical['independentlyVerifiedCTCSupplementalEvidence']).read_text())
    if checked.get('status') != 'independent-CTC-bytes-source-frames-verified-not-approved':
        raise ValueError('actual CTC byte/source-frame verification is required')
    observations = [x for x in checked['observations'] if x['id'] == row['id'] and x['sourceSampleRange16k'] == [first,last] and x['cropPCM_SHA256'] == row['cropPCM_SHA256']]
    if len(observations) != 1:
        raise ValueError('supplemental CTC does not uniquely bind the current original utterance')
    obs=observations[0];support.actual_identity(row,{**obs,'sourceText':row['sourceZH']},'fixed utterance CTC')
    ctc=json.loads(support.actual_file(root,obs['rawEvidence']).read_text())
    registered_ctc={**obs['rawEvidence'],'modelRepository':'SenseVoiceSmall-int8','rawTranscript':obs['rawText']}
    if registered_ctc not in whitelist or ctc.get('modelSHA256') != MODEL_SHA or ctc.get('expectedTextPromptUsed') is not False or ctc.get('rawText') != obs['rawText'] or json.loads(ctc['rawResultString']) != ctc['rawResult'] or ctc['rawResult']['text'] != ctc['rawText']:
        raise ValueError('actual original CTC model and native raw body differ')
    return {**proof, 'authorizedDecoderHolds': sorted(allowed), 'retainedWhisperNoSpeechWarnings': warnings,
            'retainedZeroDecoderWordEmissions': zeros, 'allRawEvidenceUnchanged': True,
            'noWordAlignmentCreated': True, 'CTCAloneNeverAccepts': True,
            'automaticProductionApproval': False}
