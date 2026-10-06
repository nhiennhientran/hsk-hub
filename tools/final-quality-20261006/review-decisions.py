#!/usr/bin/env python3
"""Bind explicit independent decisions to immutable eligible actual-crop reports.

This does not infer acceptance, change runtime authority, or claim human/tone/
device certification. Explicit per-ID contextual and waveform/probe proof can
resolve specified text, source-reuse and boundary holds. Missing-model,
identity and actual zero-duration holds cannot pass. A separate fixed-ID
complete-syllable evidence gate may address preserved decoder diagnostics.
"""
import argparse
from collections import Counter
import datetime as dt
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

_SOURCE_PCM = {}
PINNED_MODELS = {
    ('Systran/faster-whisper-small', '536b0662742c02347bc0e980a01041f333bce120'),
    ('Systran/faster-whisper-medium', '08e178d48790749d25932bbc082711ddcfdfbc4f'),
}

TEXT_REVIEW_HOLDS = {
    'crop-ASR-Chinese-differs-from-source-needs-phonetic-or-glyph-review',
    'crop-ASR-meaningful-Roman-or-numeric-source-unit-not-proven',
    'crop-ASR-foreign-lexical-token-or-digit-needs-explicit-review',
}
SOURCE_REVIEW_HOLDS = {
    'cross-level-source-reuse-needs-independent-phonetic-review',
    'cross-lesson-source-reuse-needs-independent-phonetic-review',
    'word-from-text-track-needs-explicit-cross-source-review',
    'nonrepeated-original-word-occurrence-needs-independent-source-context-review',
}
BOUNDARY_REVIEW_HOLDS = {
    'non-quiet-boundary-needs-independent-phoneme-review',
    'actual-crop-outside-proposed-source-neighbor-guards-needs-independent-boundary-review',
    'source-neighbor-anchors-await-independent-context-review',
}

DECODER_DIAGNOSTIC_HOLDS = {
    'crop-ASR-hallucination-or-no-speech-warning',
    'crop-ASR-empty-segments-or-word-evidence',
    'crop-ASR-zero-inverted-or-out-of-bounds-word',
}


def short_decoder_decision(row, decision, root):
    spec = importlib.util.spec_from_file_location('independent_short_syllable', Path(__file__).with_name('review-syllable-evidence.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    # Passing this function still requires explicit per-ID acceptance, the
    # normal source/text decisions and independently reviewed actual boundaries.
    return module.validate(row, decision, root)


def triple_literal_decision(row, decision, root):
    spec = importlib.util.spec_from_file_location('independent_triple_literal', Path(__file__).with_name('review-triple-literal.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.validate(row, decision, root)


def fixed_utterance_decision(row, decision, root):
    spec = importlib.util.spec_from_file_location('independent_fixed_utterance', Path(__file__).with_name('review-fixed-utterance.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.validate(row, decision, root)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def actual_file(root, reference):
    path = Path(reference.get('file', ''))
    path = path if path.is_absolute() else root / path
    if not path.is_file() or reference.get('sha256') != digest(path):
        raise ValueError('explicit evidence file SHA does not match actual bytes')
    return path


def actual_identity(row, proof, name):
    for key, expected in [('sourceText', row['sourceZH']), ('sourceTrack', row['sourceTrack']),
                          ('sourceSHA256', row['sourceSHA256']), ('sourcePCM_SHA256', row['sourcePCM_SHA256']),
                          ('sourceSampleRange16k', row['sourceSampleRange16k']), ('cropPCM_SHA256', row['cropPCM_SHA256'])]:
        if proof.get(key) != expected:
            raise ValueError(name + ' decision identity is not the actual reviewed crop: ' + key)


def unprompted(raw):
    options = raw.get('options', {})
    if any(options.get(key) is not None for key in ('initial_prompt', 'prefix', 'hotwords')) or options.get('condition_on_previous_text') is not False:
        raise ValueError('context evidence must be unprompted')
    actual = raw.get('rawTranscriptionInfo', {}).get('transcription_options', {})
    if any(actual.get(key) is not None for key in ('initial_prompt', 'prefix', 'hotwords')):
        raise ValueError('context actual inference contains a source cue')


def original_pcm(root, row):
    key = (str(root), row['sourceTrack'], row['sourcePCM_SHA256'])
    if key not in _SOURCE_PCM:
        spec = importlib.util.spec_from_file_location('boundary_source_registry', Path(__file__).with_name('review-crops.py'))
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        track = module.source_registry(root)[row['sourceTrack']]
        path = module.inside(root, track['disk'])
        if digest(path) != row['sourceSHA256'] or path.stat().st_size != track['bytes']:
            raise ValueError('boundary source original bytes changed')
        pcm = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True, timeout=120).stdout
        if hashlib.sha256(pcm).hexdigest() != row['sourcePCM_SHA256']:
            raise ValueError('boundary original actual PCM changed')
        _SOURCE_PCM[key] = pcm
    return _SOURCE_PCM[key]


def contextual_decision(row, decision, root):
    """Original source group and canonical target stay distinct for reuse."""
    proof = decision.get('sourceContextEvidence', {})
    actual_identity(row, proof, 'source-context')
    for key in ('wholeSourceGroupUnpromptedASRReviewed', 'sourceOrderChecked', 'neighborSpeechExcluded',
                'actualCropBoundariesChecked', 'phoneticEquivalenceIsAuxiliaryOnly'):
        if proof.get(key) is not True:
            raise ValueError('source-context decision lacks explicit independent check: ' + key)
    if row['unit'] == 'word' and proof.get('originalRepeatedReadingsChecked') is not True:
        raise ValueError('word source-context review must check original repeated readings')
    if not proof.get('explanation') or not proof.get('rawDifferences'):
        raise ValueError('source-context review must retain raw differences and explain the decision')
    if row.get('sourcePinyin') and proof.get('sourcePinyin') != row['sourcePinyin']:
        raise ValueError('phonetic source context must retain actual source pinyin')
    group = proof.get('sourceGroupEvidence', {})
    path = actual_file(root, group)
    raw = json.loads(path.read_text())
    group_pcm = raw.get('cropPCM_SHA256', raw.get('track', {}).get('pcm', {}).get('sha256'))
    if group_pcm != row['sourcePCM_SHA256']:
        raise ValueError('whole-source-group ASR is not bound to the actual original decoded PCM')
    unprompted(raw)
    if set(row['holds']) & SOURCE_REVIEW_HOLDS:
        for key in ('originalPrintedSourceOccurrenceChecked', 'targetAndOriginalPronunciationCompared', 'telephoneYaoNotSubstitutedForYi'):
            if proof.get(key) is not True:
                raise ValueError('cross-source decision lacks pronunciation check: ' + key)
        original = proof.get('originalPrintedSource', {})
        source = json.loads(actual_file(root, original).read_text())
        pointer = original.get('sourceJSONPointer')
        if not isinstance(pointer, str) or not pointer.startswith('/'):
            raise ValueError('cross-source printed occurrence needs a JSON pointer')
        value = source
        for part in pointer[1:].split('/'):
            part = part.replace('~1', '/').replace('~0', '~')
            value = value[int(part)] if isinstance(value, list) else value[part]
        if value != original.get('sourceText') or not isinstance(value, str) or not value.strip():
            raise ValueError('original printed occurrence differs from pinned source')
    if decision.get('originalSyllableSourceContextEvidence'):
        spec = importlib.util.spec_from_file_location('independent_source_syllable', Path(__file__).with_name('review-syllable-evidence.py'))
        m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
        proof = dict(proof, validatedOriginalSyllableSourceContextEvidence=m.validate(row, decision, root, source_context_only=True))
    return proof


def boundary_decision(row, decision, root):
    """Fixed per-ID waveform/probe evidence, without a global quiet relaxation."""
    proof = decision.get('boundaryDecisionEvidence', {})
    actual_identity(row, proof, 'boundary')
    category = proof.get('category')
    if category not in ('continuous-original-background', 'localized-connected-speech', 'reviewed-source-neighbor-anchor-correction'):
        raise ValueError('boundary exception needs a specific evidence category')
    for key in ('actualWaveformAndSpectrumReviewed', 'completeTargetPhonemesRetained', 'neighborTargetSpeechExcluded',
                'sourceOrderChecked', 'originalBackgroundPreserved', 'noSyntheticPadding', 'rawASRTimestampsAreAuxiliaryOnly'):
        if proof.get(key) is not True:
            raise ValueError('boundary decision lacks explicit check: ' + key)
    if not proof.get('explanation') or not proof.get('startBoundaryExplanation') or not proof.get('endBoundaryExplanation'):
        raise ValueError('each actual cut needs a concrete explanation')
    observed = json.loads(actual_file(root, proof.get('waveformObservation', {})).read_text())
    if any(observed.get(k) != row[k] for k in ('sourceTrack', 'sourceSHA256', 'sourcePCM_SHA256')):
        raise ValueError('waveform observations are not this original source PCM')
    plots = [p for p in observed.get('plots', []) if p.get('id') == row['id'] and p.get('sourceSampleRange16k') == row['sourceSampleRange16k'] and p.get('cropPCM_SHA256') == row['cropPCM_SHA256']]
    if len(plots) != 1:
        raise ValueError('actual waveform plot is not bound to exact target/frame/crop')
    actual_file(root, plots[0])
    pcm = original_pcm(root, row)
    first, last = row['sourceSampleRange16k']
    marks = proof.get('targetForegroundExtent16k')
    limits = proof.get('independentlyReviewedNeighborLimits16k')
    if not all(isinstance(v, list) and len(v) == 2 and all(type(x) is int for x in v) for v in (marks, limits)):
        raise ValueError('foreground and neighbor limits require integer frame marks')
    if not 0 <= limits[0] <= first <= marks[0] < marks[1] <= last <= limits[1] <= round(row['sourceDecodedDuration'] * 16000):
        raise ValueError('foreground/neighbor source bounds do not contain this crop')
    if category == 'reviewed-source-neighbor-anchor-correction':
        permitted = {'actual-crop-outside-proposed-source-neighbor-guards-needs-independent-boundary-review', 'source-neighbor-anchors-await-independent-context-review'}
        boundary_holds = set(row['holds']) & BOUNDARY_REVIEW_HOLDS
        if not boundary_holds or boundary_holds - permitted or any(value is not None and value > -45 for value in row.get('actualEdgeRMSDbFS20ms', {}).values()) or not row.get('actualEdgeRMSDbFS20ms'):
            raise ValueError('neighbor-anchor correction requires actual unchanged strict quiet cuts')
        for key in ('incorrectRawASRNeighborAnchorDiagnosed', 'actualSilenceBetweenCanonicalTurnsReviewed', 'canonicalNeighborOrderVerified'):
            if proof.get(key) is not True:
                raise ValueError('neighbor-anchor correction lacks actual source review: ' + key)
        raw = json.loads(actual_file(root, proof.get('sourceGroupEvidence', {})).read_text())
        unprompted(raw)
        if raw.get('cropPCM_SHA256', raw.get('track', {}).get('pcm', {}).get('sha256')) != row['sourcePCM_SHA256']:
            raise ValueError('neighbor correction source group is not the original decoded PCM')
    elif category == 'continuous-original-background':
        references = observed.get('backgroundReferenceWindows', [])
        if len(references) < 2 or any(not p.get('actualPCM_SHA256') for p in references):
            raise ValueError('background exception needs two actual pause PCM observations')
        if proof.get('continuousBackgroundDistinctFromTargetVoice') is not True:
            raise ValueError('background has not been distinguished from target speech')
        for ref in references:
            a, b = ref.get('sourceSampleRange16k', [None, None])
            if type(a) is not int or type(b) is not int or not 0 <= a < b <= len(pcm)//4 or hashlib.sha256(pcm[a*4:b*4]).hexdigest() != ref['actualPCM_SHA256']:
                raise ValueError('background reference must be actual original pause PCM bytes')
    else:
        for key in ('onsetConsonantAndRimeReviewed', 'nasalAndFinalReleaseReviewed', 'expandedProbesCompared', 'phoneticEquivalenceIsAuxiliaryOnly'):
            if proof.get(key) is not True:
                raise ValueError('connected-speech decision lacks phoneme/probe check: ' + key)
        groups = {}
        for ref in proof.get('expandedProbeEvidence', []):
            raw = json.loads(actual_file(root, ref).read_text())
            unprompted(raw)
            frames = raw.get('sourceSampleRange16k')
            if raw.get('originalSourceTrack') != row['sourceTrack'] or raw.get('originalSourceSHA256') != row['sourceSHA256'] or not isinstance(frames, list) or len(frames) != 2 or not all(type(x) is int for x in frames) or not frames[0] <= first < last <= frames[1] or frames == [first, last]:
                raise ValueError('expanded probe must contain crop in same original source')
            # An actual empty decoder result is retained as a diagnostic. It
            # is neither a transcript match nor a missing model execution.
            # Fixed-ID phoneme/source decisions must resolve uncertainty.
            if 'observedRawText' not in ref or ref['observedRawText'] != ''.join(s.get('text', '') for s in raw.get('rawSegments', [])):
                raise ValueError('expanded probe raw transcript must be retained verbatim')
            if frames[0] < 0 or frames[1] > len(pcm)//4 or hashlib.sha256(pcm[frames[0]*4:frames[1]*4]).hexdigest() != raw.get('cropPCM_SHA256'):
                raise ValueError('expanded probe PCM is not its actual declared original frames')
            if (raw.get('modelRepository'), raw.get('modelRevision')) not in PINNED_MODELS:
                raise ValueError('expanded probe is not an approved pinned model')
            groups.setdefault(tuple(frames), set()).add((raw.get('modelRepository'), raw.get('modelRevision')))
        if len(groups) < 2 or any(len(models) < 2 for models in groups.values()):
            raise ValueError('connected-speech needs two expanded geometries with paired models')
    return proof


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--report', required=True, type=Path)
    p.add_argument('--decisions', required=True, type=Path)
    p.add_argument('--output', required=True, type=Path)
    p.add_argument('--repo-root', type=Path, default=Path.cwd())
    p.add_argument('--target-catalog', type=Path, help='Source-derived complete catalog; checks and derives semantic sentence labels, never audio geometry')
    args = p.parse_args()
    report = json.loads(args.report.read_text())
    decisions = json.loads(args.decisions.read_text())
    catalog_bytes = args.target_catalog.read_bytes() if args.target_catalog else None
    catalog = {t['id']: t for t in json.loads(catalog_bytes)['targets']} if catalog_bytes else None
    if decisions.get('reviewReportSHA256') != digest(args.report):
        raise ValueError('explicit decisions must pin actual review report SHA256')
    source_checks = None
    if decisions.get('sourceChecksEvidence'):
        source_checks = json.loads(actual_file(args.repo_root.resolve(), decisions['sourceChecksEvidence']).read_text())
        if source_checks.get('reviewReportSHA256') != digest(args.report):
            raise ValueError('independent source checks are not pinned to this actual report')
    selected, rejected, seen = [], [], set()
    for d in decisions['decisions']:
        key = (d['id'], tuple(d['sourceSampleRange16k']))
        if d['id'] in seen:
            raise ValueError('more than one final decision for a target ID')
        seen.add(d['id'])
        matches = [r for r in report['targets'] if r['id'] == key[0] and tuple(r.get('sourceSampleRange16k', [])) == key[1]]
        if len(matches) != 1:
            raise ValueError('explicit decision target/frame binding is absent or ambiguous')
        row = matches[0]
        if d['decision'] == 'hold':
            rejected.append(dict(d, reportHolds=row['holds']))
            continue
        if d['decision'] != 'accept':
            raise ValueError('decision must be accept or hold')
        if catalog is not None:
            original_labels = {k: row.get(k) for k in ('parentLineId', 'sentenceNumber')}
            row = dict(row)
            source = row['canonicalSource']
            if row['unit'] == 'sentence':
                row['parentLineId'] = source['sourceId'] if row['level'] == 1 or source['sentenceCount'] > 1 else None
                row['sentenceNumber'] = source['sentenceOrdinal'] or (1 if source['sentenceCount'] == 1 else None)
            target = catalog.get(row['id'])
            expected = {'level':row['level'], 'lesson':row['lesson'], 'unit':row['unit'], 'sourceText':row['sourceZH'],
                        'sourceLessonFile':source['file'], 'sourceLessonSHA256':source['sha256'],
                        'parentLineId':row.get('parentLineId'), 'sentenceNumber':row.get('sentenceNumber')}
            if target is None or any(target.get(k) != v for k,v in expected.items()):
                raise ValueError('canonical source-derived accepted semantics differ from target catalog')
            pointer = target.get('sourceJSONPointer', '')
            if pointer.endswith('/zh') or pointer.endswith('/sourceText'):
                pointer = pointer.rpartition('/')[0]
            if pointer != source['sourceJSONPointer']:
                raise ValueError('accepted canonical object pointer differs from target catalog')
            if any(row.get(k) != v for k,v in original_labels.items()):
                row['originalReportSemanticLabels'] = original_labels
                row['semanticLabelsDerivedFromPinnedCanonicalSource'] = True
        if source_checks is not None:
            checks = [c for c in source_checks.get('targets', []) if c.get('id') == row['id'] and c.get('sourceSampleRange16k') == row['sourceSampleRange16k']]
            if len(checks) != 1 or checks[0].get('cropPCM_SHA256') != row['cropPCM_SHA256'] or checks[0].get('sourceLessonSHA256') != row['canonicalSource']['sha256']:
                raise ValueError('independent source checks differ from selected canonical target/frame/crop')
        text_holds, source_holds, boundary_holds = set(row['holds']) & TEXT_REVIEW_HOLDS, set(row['holds']) & SOURCE_REVIEW_HOLDS, set(row['holds']) & BOUNDARY_REVIEW_HOLDS
        decoder_routes = ('shortSyllableDecoderDecisionEvidence', 'tripleLiteralNoSpeechDecisionEvidence', 'fixedOriginalUtteranceDecoderDecisionEvidence')
        if sum(bool(d.get(k)) for k in decoder_routes) > 1:
            raise ValueError('one explicit decoder route must be selected for the actual crop')
        decoder_holds = set(row['holds']) & DECODER_DIAGNOSTIC_HOLDS if d.get('shortSyllableDecoderDecisionEvidence') or d.get('fixedOriginalUtteranceDecoderDecisionEvidence') else ({'crop-ASR-hallucination-or-no-speech-warning'} & set(row['holds']) if d.get('tripleLiteralNoSpeechDecisionEvidence') else set())
        if set(row['holds']) - TEXT_REVIEW_HOLDS - SOURCE_REVIEW_HOLDS - BOUNDARY_REVIEW_HOLDS - decoder_holds:
            raise ValueError('identity, model, missing occurrence and other hard holds cannot be overridden')
        for key, expected in [('resolvedTextHolds', text_holds), ('resolvedSourceHolds', source_holds), ('resolvedBoundaryHolds', boundary_holds), ('resolvedDecoderASRDiagnosticHolds', decoder_holds)]:
            if set(d.get(key, [])) != expected:
                raise ValueError('resolved hold categories must match exact current row: ' + key)
        context_proof = contextual_decision(row, d, args.repo_root.resolve()) if text_holds or source_holds else None
        boundary_proof = boundary_decision(row, d, args.repo_root.resolve()) if boundary_holds else None
        triple_proof = triple_literal_decision(row, d, args.repo_root.resolve()) if decoder_holds and d.get('tripleLiteralNoSpeechDecisionEvidence') else None
        decoder_proof = short_decoder_decision(row, d, args.repo_root.resolve()) if decoder_holds and d.get('shortSyllableDecoderDecisionEvidence') else None
        utterance_proof = fixed_utterance_decision(row, d, args.repo_root.resolve()) if decoder_holds and d.get('fixedOriginalUtteranceDecoderDecisionEvidence') else None
        if decoder_proof and boundary_proof is None:
            boundary_proof=decoder_proof['independentlyValidatedBoundaryDecisionEvidence']
        if not row['holds'] and row['status'] != 'machine-evidence-complete-awaiting-independent-decision':
            raise ValueError('incomplete crop cannot be accepted by decision compiler')
        if not d.get('rationale') or d.get('sourceContextChecked') is not True:
            raise ValueError('acceptance requires explicit source-context review and rationale')
        if set(d.get('acknowledgedFlags', [])) != set(row['flags']):
            raise ValueError('low-confidence or other review flags must be acknowledged exactly')
        if any(d.get(k, False) for k in ('humanListening', 'nativeSpeakerReview', 'pronunciationToneCertified', 'devicePlaybackCertified')):
            raise ValueError('unsupported certification in machine-only review decision')
        models = row['rawModelEvidence']
        if len({(e['modelRepository'], e['modelRevision']) for e in models}) < 2 or any(set(e['holds']) - TEXT_REVIEW_HOLDS - decoder_holds for e in models):
            raise ValueError('actual crop evidence needs distinct model snapshots with complete gates')
        for model in models:
            raw = json.loads(actual_file(args.repo_root.resolve(), model).read_text())
            unprompted(raw)
            if (raw.get('modelRepository'), raw.get('modelRevision')) not in PINNED_MODELS or raw.get('modelRepository') != model['modelRepository'] or raw.get('modelRevision') != model['modelRevision']:
                raise ValueError('reviewed crop model identity differs from its actual raw bytes')
            if raw.get('candidateId') != row['id'] or raw.get('originalSourceTrack') != row['sourceTrack'] or raw.get('originalSourceSHA256') != row['sourceSHA256'] or raw.get('sourceSampleRange16k') != row['sourceSampleRange16k'] or raw.get('cropPCM_SHA256') != row['cropPCM_SHA256']:
                raise ValueError('reviewed raw crop binding differs from accepted target/source/frames')
            if ''.join(s.get('text', '') for s in raw.get('rawSegments', [])) != model['rawTranscript']:
                raise ValueError('review report altered actual raw transcript')
        decision_id = hashlib.sha256(json.dumps({'report': digest(args.report), 'decision': d}, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        selected.append({**row, 'status': 'accepted-independent-machine-source-frame-review',
                         'productionApproved': False, 'independentDecision': d,
                         'resolvedTextHolds': sorted(text_holds), 'sourceContextDecisionEvidence': context_proof,
                         'resolvedSourceHolds': sorted(source_holds),
                         'resolvedBoundaryHolds': sorted(boundary_holds), 'boundaryDecisionEvidence': boundary_proof,
                         'resolvedDecoderASRDiagnosticHolds': sorted(decoder_holds),
                         'shortSyllableDecoderDecisionEvidence': decoder_proof,
                         'tripleLiteralNoSpeechDecisionEvidence': triple_proof,
                         'fixedOriginalUtteranceDecoderDecisionEvidence': utterance_proof,
                         'sourceText': row['sourceZH'], 'readingCount': row.get('expectedReadingCount', 1),
                         'sourceLessonFile': row['canonicalSource']['file'],
                         'sourceLessonSHA256': row['canonicalSource']['sha256'],
                         'sourceJSONPointer': row['canonicalSource']['sourceJSONPointer'],
                         'reviewDecisionId': decision_id,
                         'method': 'independently-reviewed-unprompted-multi-model-actual-crop+source-frame-guards',
                         'rawEvidenceUnchanged': True, 'reviewReportSHA256': digest(args.report)})
    result = {'schemaVersion': 1, 'reviewer': 'independent audio reviewer',
              'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
              'reviewReportSHA256': digest(args.report), 'explicitDecisionsSHA256': digest(args.decisions),
              'independentSourceChecksEvidence': decisions.get('sourceChecksEvidence'),
              'independentTargetCatalogSHA256': hashlib.sha256(catalog_bytes).hexdigest() if catalog_bytes else None,
              'decisionCompilerSHA256': digest(Path(__file__)),
              'acceptedFragmentIds': [r['id'] for r in selected],
              'acceptedSourceFrameGates': selected, 'explicitHeldDecisions': rejected,
              'acceptedCountsByUnit': dict(Counter(r['unit'] for r in selected)),
              'allOtherReportTargetsRemainUnapproved': True,
              'humanListening': False, 'nativeSpeakerReview': False,
              'pronunciationToneCertified': False, 'devicePlaybackCertified': False,
              'runtimeModified': False, 'publicationPerformed': False}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + '\n')
    print(json.dumps({'acceptedIds': len(selected), 'explicitHeld': len(rejected)}, ensure_ascii=False))


if __name__ == '__main__':
    sys.exit(main())
