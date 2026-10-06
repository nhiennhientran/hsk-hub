#!/usr/bin/env python3
"""Independently inspect actual source-frame crops; never edit runtime authority.

ASR is evidence, not human listening or pronunciation certification. A clean
machine gate is an eligible candidate, never an automatic production approval.
"""
from __future__ import annotations

import argparse
from array import array
from collections import Counter, defaultdict
import datetime as dt
import hashlib
import importlib.metadata
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import unicodedata

RATE = 16000
POLICY = {
    'version': 'independent-crop-review-v1', 'sampleRate': RATE,
    'edgeWindowFrames': 320, 'quietEdgeDbFS': -45,
    'lowProbabilityFlagBelow': 0.5, 'minimumDistinctModelSnapshots': 2,
    'maximumCompressionRatioBeforeHold': 2.4,
    'maximumNoSpeechProbabilityBeforeHold': 0.6,
    'quietEdgesArePhonemeCertification': False,
    'lowProbabilityFlagsNeverDiscarded': True,
    'sourceTextNeverInferencePrompt': True,
    'automaticProductionApproval': False,
    'wordRunWindowFrames': 160, 'wordRunActiveDbFS': -42,
    'wordRunMergeGapSeconds': 0.16, 'wordRunMinimumSeconds': 0.06,
}
PINNED_MODELS = {
    'Systran/faster-whisper-small': '536b0662742c02347bc0e980a01041f333bce120',
    'Systran/faster-whisper-medium': '08e178d48790749d25932bbc082711ddcfdfbc4f',
}
OPTIONS = {
    'language': 'zh', 'task': 'transcribe', 'beam_size': 5, 'best_of': 5,
    'temperature': 0.0, 'word_timestamps': True, 'vad_filter': False,
    'condition_on_previous_text': False, 'initial_prompt': None,
    'prefix': None, 'hotwords': None,
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def file_sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def cjk(text):
    return ''.join(ch for ch in unicodedata.normalize('NFKC', str(text))
                   if '\u3400' <= ch <= '\u9fff' or '\U00020000' <= ch <= '\U000323af')


def lexical(text):
    """Retain all meaningful letters/digits; CJK-only comparison cannot prove AI/40."""
    return ''.join(ch for ch in unicodedata.normalize('NFKC', str(text)).casefold() if ch.isalnum())


def meaningful_non_cjk_units(text):
    """Keep actual Roman/digit unit order separate from unrelated CJK spelling."""
    units, current = [], []
    for ch in unicodedata.normalize('NFKC', str(text)).casefold():
        if ch.isalnum() and not cjk(ch):
            current.append(ch)
        elif current:
            units.append(''.join(current)); current = []
    if current:
        units.append(''.join(current))
    return units


def sentence_parts(text):
    return [s.strip() for s in re.findall(r'[^。！？!?]+[。！？!?]*', text) if cjk(s)]


def inside(root, path):
    value = (root / path).resolve()
    if not value.is_relative_to(root.resolve()):
        raise ValueError('path leaves the repository')
    return value


def evidence_path(root, path, mappings=()):
    """Resolve CI locations without rewriting a single original evidence byte."""
    for prefix, local in mappings:
        if path == prefix or path.startswith(prefix.rstrip('/') + '/'):
            remainder = path[len(prefix):].lstrip('/')
            value = (local / remainder).resolve()
            if not value.is_relative_to(local.resolve()):
                raise ValueError('mapped CI evidence path escapes declared local root')
            return value
    return inside(root, path)


def nodes(value, path=''):
    if isinstance(value, dict):
        yield path, value
        for key, item in value.items():
            yield from nodes(item, path + '/' + str(key).replace('~', '~0').replace('/', '~1'))
    elif isinstance(value, list):
        for key, item in enumerate(value):
            yield from nodes(item, path + '/' + str(key))


def pointer(value, path):
    if not path.startswith('/'):
        raise ValueError('sourceJSONPointer must be an RFC6901 pointer')
    for part in path[1:].split('/'):
        part = part.replace('~1', '/').replace('~0', '~')
        value = value[int(part)] if isinstance(value, list) else value[part]
    return value


def source_registry(root):
    registry = {}
    for track in read(root / 'course-app/content/audio-manifest.json')['tracks']:
        registry[track['file']] = dict(track, disk='course-app/public/' + track['file'])
        registry['course-app/public/' + track['file']] = registry[track['file']]
    for track in read(root / 'hsk1-app/content/media-references.json')['originalTracks']:
        registry[track['path']] = dict(track, level=1, disk=track['path'])
    return registry


def source_binding(candidate, lesson):
    source_id = candidate.get('sourceId') or candidate.get('parentLineId') or candidate.get('lineId') or candidate['id']
    if candidate.get('sourceJSONPointer'):
        obj = pointer(lesson, candidate['sourceJSONPointer'])
        path = candidate['sourceJSONPointer']
        if isinstance(obj, str):
            path, _, field = path.rpartition('/')
            obj = pointer(lesson, path)
            if field not in ('zh', 'sourceText'):
                raise ValueError('canonical text pointer must address zh or sourceText')
        if not isinstance(obj, dict) or str(obj.get('id')) != str(source_id):
            raise ValueError('canonical source pointer ID differs')
    else:
        source_id = re.sub(r':sentence\d+$', '', str(source_id))
        matches = [(p, obj) for p, obj in nodes(lesson) if str(obj.get('id')) == source_id
                   and isinstance(obj.get('zh', obj.get('sourceText')), str)]
        if len(matches) != 1:
            raise ValueError('canonical source ID is absent or ambiguous; provide sourceId/pointer')
        path, obj = matches[0]
    whole = obj.get('zh', obj.get('sourceText'))
    if not isinstance(whole, str):
        raise ValueError('canonical source has no Chinese text')
    ordinal = candidate.get('sentenceNumber')
    if ordinal is None and 'sentenceIndex' in candidate:
        ordinal = candidate['sentenceIndex'] + 1
    if ordinal is None:
        match = re.search(r':sentence(\d+)$', candidate['id'])
        ordinal = int(match[1]) if match else None
    parts = sentence_parts(whole)
    wanted = whole
    if ordinal is not None:
        if not isinstance(ordinal, int) or not 1 <= ordinal <= len(parts):
            raise ValueError('canonical sentence ordinal is invalid')
        wanted = parts[ordinal - 1]
    if wanted != candidate.get('sourceZH', candidate.get('sourceText')):
        raise ValueError('candidate Chinese differs from canonical source')
    source_pinyin = obj.get('pinyin', obj.get('py', obj.get('sourcePinyin')))
    if candidate.get('unit') == 'word' and candidate.get('sourcePinyin') is not None and source_pinyin != candidate.get('sourcePinyin'):
        raise ValueError('candidate word pinyin differs from canonical source')
    context = {'sourceId': obj.get('id'), 'sourceJSONPointer': path, 'parentZH': whole,
               'sentenceOrdinal': ordinal, 'sentenceCount': len(parts),
               'previousSentence': parts[ordinal - 2] if ordinal and ordinal > 1 else None,
               'nextSentence': parts[ordinal] if ordinal and ordinal < len(parts) else None,
               'source': obj.get('source'), 'sourcePinyin': source_pinyin}
    # Report actual adjacent rows from the containing source array, not producer cues.
    parent_path, _, index = path.rpartition('/')
    try:
        siblings = pointer(lesson, parent_path)
        if isinstance(siblings, list) and index.isdigit():
            number = int(index)
            for label, j in [('previousRow', number - 1), ('nextRow', number + 1)]:
                other = siblings[j] if 0 <= j < len(siblings) else None
                context[label] = {k: other.get(k) for k in ('id', 'zh', 'sourceText')} if isinstance(other, dict) else None
    except (ValueError, KeyError, IndexError):
        pass
    return wanted, context


def db_window(pcm, first, last):
    raw = pcm[max(0, first) * 4:min(len(pcm) // 4, last) * 4]
    if not raw:
        return None
    values = array('f')
    values.frombytes(raw)
    if sys.byteorder != 'little':
        values.byteswap()
    rms = math.sqrt(sum(float(x) ** 2 for x in values) / len(values))
    return round(20 * math.log10(max(rms, 1e-12)), 3)


def word_runs(crop, source_first):
    """Independent observable runs; not syllable, tone or repetition certificates."""
    windows = len(crop) // (POLICY['wordRunWindowFrames'] * 4)
    raw = []
    for j in range(windows):
        level = db_window(crop, j * 160, (j + 1) * 160)
        if level is not None and level > POLICY['wordRunActiveDbFS']:
            first, last = j * 160, (j + 1) * 160
            if raw and (first - raw[-1][1]) / RATE <= POLICY['wordRunMergeGapSeconds']:
                raw[-1][1] = last
            else:
                raw.append([first, last])
    return [[first + source_first, last + source_first] for first, last in raw
            if (last - first) / RATE >= POLICY['wordRunMinimumSeconds']]


def occurrence_files(root, value, mappings=()):
    """Verify actual referenced files/words, while keeping order claims provisional."""
    files = []
    for _, item in nodes(value):
        filename, declared_sha = item.get('file'), item.get('sha256')
        if not isinstance(filename, str) or not isinstance(declared_sha, str):
            continue
        path = evidence_path(root, filename, mappings)
        if file_sha(path) != declared_sha:
            raise ValueError('source occurrence referenced file SHA differs')
        checked = {'file': filename, 'sha256': declared_sha}
        references = item.get('wordReferences')
        if references:
            raw = read(path)
            chosen = []
            for ref in references:
                si, wi = ref['segment'], ref['word']
                if type(si) is not int or type(wi) is not int or si < 0 or wi < 0:
                    raise ValueError('source occurrence word reference index is invalid')
                word = raw['rawSegments'][si]['words'][wi]
                if ref.get('rawWord') and ref['rawWord'] != word:
                    raise ValueError('copied occurrence rawWord differs from actual original ASR')
                chosen.append(word)
            checked['actualReferencedWords'] = chosen
        files.append(checked)
    return files


def inspect_raw(raw, candidate, crop_sha, duration, path, expected_sha=None, normalizer=None, root=None, mappings=()):
    holds, flags = [], []
    identifier = candidate['id']
    if raw.get('candidateId', raw.get('id')) != identifier:
        holds.append('crop-ASR-candidate-ID-mismatch')
    expected_track = candidate['sourceTrack']
    if raw.get('originalSourceTrack', raw.get('sourceTrack')) != expected_track:
        holds.append('crop-ASR-source-track-mismatch')
    if raw.get('originalSourceSHA256', raw.get('sourceSHA256')) != candidate['sourceSHA256']:
        holds.append('crop-ASR-source-SHA-mismatch')
    if raw.get('sourceSampleRange16k') != candidate['sourceSampleRange16k']:
        holds.append('crop-ASR-source-frame-mismatch')
    if raw.get('cropPCM_SHA256') != crop_sha:
        holds.append('crop-ASR-actual-PCM-mismatch')
    if raw.get('cropDurationSeconds') != duration:
        holds.append('crop-ASR-duration-mismatch')
    if raw.get('options') != OPTIONS:
        holds.append('crop-ASR-options-not-frozen-unprompted-policy')
    actual_options = raw.get('rawTranscriptionInfo', {}).get('transcription_options', {})
    if any(actual_options.get(key) is not None for key in ('initial_prompt', 'prefix', 'hotwords')):
        holds.append('crop-ASR-actual-inference-metadata-contains-source-cue')
    for key in ('condition_on_previous_text', 'word_timestamps', 'beam_size', 'best_of'):
        if key in actual_options and actual_options[key] != OPTIONS[key]:
            holds.append('crop-ASR-actual-inference-metadata-options-differ')
    revision = raw.get('modelRevision', '')
    if not re.fullmatch(r'[0-9a-f]{40}', revision):
        holds.append('crop-ASR-model-revision-not-immutable')
    repository = raw.get('modelRepository', '')
    if not re.fullmatch(r'Systran/faster-whisper-(tiny|base|small|medium|large-v2|large-v3)', repository):
        holds.append('crop-ASR-model-repository-not-recorded-supported-model')
    if PINNED_MODELS.get(repository) != revision:
        holds.append('crop-ASR-model-not-approved-immutable-snapshot')
    if raw.get('deduplicatedRawASRFile'):
        if root is None:
            holds.append('deduplicated-crop-ASR-repository-root-not-bound')
        else:
            original_path = evidence_path(root, raw['deduplicatedRawASRFile'], mappings)
            original = read(original_path)
            if file_sha(original_path) != raw.get('deduplicatedRawASRSHA256'):
                holds.append('deduplicated-crop-ASR-actual-file-SHA-mismatch')
            for key in ('cropPCM_SHA256', 'cropDurationSeconds', 'options', 'modelRepository', 'modelRevision', 'rawSegments', 'modelFiles', 'packages', 'inferenceIdentity'):
                if original.get(key) != raw.get(key):
                    holds.append('deduplicated-crop-ASR-binding-altered-raw-evidence')
    segments = raw.get('rawSegments', [])
    transcript = ''.join(s.get('text', '') for s in segments)
    words = [word for segment in segments for word in segment.get('words', [])]
    if not segments or not words:
        holds.append('crop-ASR-empty-segments-or-word-evidence')
    zero = [j for j, word in enumerate(words) if word.get('start') == word.get('end')]
    invalid = [j for j, word in enumerate(words)
               if not all(isinstance(word.get(k), (int, float)) and math.isfinite(word[k]) for k in ('start', 'end'))
               or not 0 <= word['start'] < word['end'] <= duration + 1e-6]
    overlaps = [j for j in range(1, len(words)) if isinstance(words[j].get('start'), (int, float))
                and isinstance(words[j-1].get('end'), (int, float)) and words[j]['start'] < words[j-1]['end'] - .001]
    if invalid:
        holds.append('crop-ASR-zero-inverted-or-out-of-bounds-word')
    if overlaps:
        holds.append('crop-ASR-overlapping-words')
    if cjk(''.join(word.get('word', '') for word in words)) != cjk(transcript):
        holds.append('crop-ASR-segment-word-text-incoherent')
    low = [{k: word.get(k) for k in ('start', 'end', 'word', 'probability')} for word in words
           if not isinstance(word.get('probability'), (int, float)) or not math.isfinite(word['probability'])
           or not 0 <= word['probability'] <= 1 or word['probability'] < POLICY['lowProbabilityFlagBelow']]
    if low:
        flags.append('low-probability-word-observations-retained-for-independent-review')
    # No silent substitutions, homophone replacement, number expansion or broad glyph maps.
    wanted = candidate.get('sourceZH', candidate.get('sourceText'))
    reading_count = 2 if candidate.get('clipUnit') == 'alternative-original-pronunciations' and candidate.get('expectedReadingCount') == 2 else 1
    observed_cjk, source_cjk = cjk(transcript), cjk(wanted) * reading_count
    compared_observed = normalizer(observed_cjk) if normalizer else observed_cjk
    compared_source = normalizer(source_cjk) if normalizer else source_cjk
    if compared_observed != compared_source:
        holds.append('crop-ASR-Chinese-differs-from-source-needs-phonetic-or-glyph-review')
    normalized_transcript = normalizer(transcript) if normalizer else transcript
    normalized_wanted = normalizer(wanted) if normalizer else wanted
    if meaningful_non_cjk_units(normalized_wanted) and meaningful_non_cjk_units(normalized_transcript) != meaningful_non_cjk_units(normalized_wanted):
        holds.append('crop-ASR-meaningful-Roman-or-numeric-source-unit-not-proven')
    if any(ch.isalnum() and not cjk(ch) for ch in transcript) and lexical(normalized_transcript) != lexical(normalized_wanted):
        holds.append('crop-ASR-foreign-lexical-token-or-digit-needs-explicit-review')
    bad_segments = [s.get('id', j) for j, s in enumerate(segments)
                    if s.get('compression_ratio', 0) > POLICY['maximumCompressionRatioBeforeHold']
                    or s.get('no_speech_prob', 0) > POLICY['maximumNoSpeechProbabilityBeforeHold']]
    if bad_segments:
        holds.append('crop-ASR-hallucination-or-no-speech-warning')
    actual_sha = file_sha(path)
    if expected_sha and expected_sha != actual_sha:
        holds.append('crop-ASR-index-SHA-mismatch')
    return {'file': str(path), 'sha256': actual_sha, 'modelRepository': repository,
            'modelRevision': revision, 'rawTranscript': transcript, 'observedCJK': cjk(transcript),
            'sourceCJK': cjk(wanted), 'comparisonObservedCJK': compared_observed,
            'comparisonSourceCJK': compared_source, 'comparisonChangedRawText': compared_observed != observed_cjk,
            'comparisonObservedLexical': lexical(normalized_transcript), 'comparisonSourceLexical': lexical(normalized_wanted),
            'words': words, 'lowProbabilityWords': low,
            'zeroDurationIndices': zero, 'invalidTimeIndices': invalid,
            'overlapIndices': overlaps, 'warningSegmentIds': bad_segments,
            'holds': holds, 'flags': flags}


def main():
    executed_script_sha = file_sha(Path(__file__))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo-root', type=Path, required=True)
    parser.add_argument('--candidates', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--target-catalog', type=Path, help='Optional independent canonical full target catalog; checks semantic labels without changing PCM')
    parser.add_argument('--asr-dir', action='append', type=Path, default=[], help='Actual crop raw JSON directories only; full-track ASR is not crop proof')
    parser.add_argument('--asr-index', type=Path, help='JSON records with file and optional sha256; repository-relative paths')
    parser.add_argument('--comparison-normalization', choices=['none', 'opencc-t2s'], default='none',
                        help='Explicit orthographic comparison only; raw ASR is retained; no homophone substitution')
    parser.add_argument('--evidence-path-map', action='append', default=[], metavar='CI_PREFIX=LOCAL_ROOT',
                        help='Locate byte-identical original CI evidence; never edits raw paths/content/SHA')
    args = parser.parse_args()
    root = args.repo_root.resolve()
    mappings = []
    for setting in args.evidence_path_map:
        prefix, separator, local = setting.partition('=')
        if not separator or not prefix or not local:
            raise ValueError('evidence-path-map requires explicit prefix=local-root')
        mappings.append((prefix.rstrip('/'), Path(local).resolve()))
    normalizer = None
    normalization = {'mode': 'none', 'rawUnchanged': True, 'homophoneReplacement': False}
    if args.comparison_normalization == 'opencc-t2s':
        from opencc import OpenCC
        version = importlib.metadata.version('opencc-python-reimplemented')
        if version != '0.1.7':
            raise ValueError('OpenCC comparison requires pinned opencc-python-reimplemented 0.1.7')
        normalizer = OpenCC('t2s').convert
        normalization.update(mode='opencc-t2s', package='opencc-python-reimplemented', version=version,
                             configuration='t2s', expectedSourcePassedToInference=False)
    candidate_bytes = args.candidates.read_bytes()
    document = json.loads(candidate_bytes)
    candidates = document.get('targets', document.get('candidates', []))
    if not isinstance(candidates, list) or not candidates:
        raise ValueError('nonempty candidate targets/candidates array required')
    registry, source_cache, lesson_cache, raw_index = source_registry(root), {}, {}, defaultdict(list)
    catalog_bytes = args.target_catalog.read_bytes() if args.target_catalog else None
    target_catalog = {t['id']: t for t in json.loads(catalog_bytes)['targets']} if catalog_bytes else None
    paths = [(p, None) for directory in args.asr_dir for p in directory.rglob('*.json')]
    if args.asr_index:
        index = read(args.asr_index)
        items = index if isinstance(index, list) else index.get('files', index.get('records', []))
        paths += [(evidence_path(root, item['file'], mappings), item.get('sha256')) for item in items]
    seen = set()
    for path, expected_sha in paths:
        path = path.resolve()
        if path in seen:
            continue
        seen.add(path)
        try:
            raw = read(path)
            if isinstance(raw, dict) and raw.get('candidateId') and raw.get('sourceSampleRange16k'):
                raw_index[(raw['candidateId'], tuple(raw['sourceSampleRange16k']))].append((path, expected_sha, raw))
        except (OSError, ValueError):
            continue
    rows = []
    for number, candidate in enumerate(candidates, 1):
        row = {'id': candidate.get('id'), 'unit': candidate.get('unit'), 'holds': [], 'flags': [],
               'level': candidate.get('level'), 'lesson': candidate.get('lesson'),
               'sourceTrack': candidate.get('sourceTrack'), 'sourceZH': candidate.get('sourceZH', candidate.get('sourceText')),
               'parentLineId': candidate.get('parentLineId', candidate.get('lineId') if candidate.get('unit') == 'sentence' else None),
               'sentenceNumber': candidate.get('sentenceNumber', candidate.get('sentenceIndex', -1) + 1) or None,
               'sourcePinyin': candidate.get('sourcePinyin'), 'repetition': candidate.get('repetition'),
               'clipUnit': candidate.get('clipUnit') or {'word':'single-original-pronunciation', 'line':'original-source-line', 'sentence':'single-original-sentence'}.get(candidate.get('unit')),
               'expectedReadingCount': candidate.get('expectedReadingCount') if candidate.get('expectedReadingCount') is not None else 1,
               'declaredOriginalPronunciations': candidate.get('declaredOriginalPronunciations'),
               'sourceOccurrenceEvidence': candidate.get('sourceOccurrenceEvidence'),
               'candidateId': candidate.get('candidateId'),
               'boundaryRefinementSourceGuards': candidate.get('boundaryRefinementSourceGuards'),
               'boundaryRefinementEdges': candidate.get('boundaryRefinementEdges'),
               'contextAlternativeEvidence': candidate.get('contextAlternativeEvidence'),
               'humanListening': False, 'pronunciationToneCertified': False,
               'devicePlaybackCertified': False, 'productionApproved': False}
        try:
            track = registry.get(candidate.get('sourceTrack'))
            if not track:
                raise ValueError('source track absent from independent original-track registry')
            if row['level'] is None:
                row['level'] = track['level']
            if row['lesson'] is None:
                row['lesson'] = track['lesson']
            if candidate.get('sourceSHA256') != track['sha256']:
                raise ValueError('candidate source SHA differs from independent original registry')
            if candidate.get('level') not in (None, track['level']):
                row['holds'].append('cross-level-source-reuse-needs-independent-phonetic-review')
            if track.get('lesson') is not None and candidate.get('lesson') not in (None, track['lesson']):
                row['holds'].append('cross-lesson-source-reuse-needs-independent-phonetic-review')
            if track['kind'] == 'vocab' and candidate.get('unit') != 'word':
                row['holds'].append('sentence-or-line-uses-vocabulary-track')
            if track['kind'] == 'text' and candidate.get('unit') == 'word' and not candidate.get('crossLessonReuseEvidence'):
                row['holds'].append('word-from-text-track-needs-explicit-cross-source-review')
            lesson_path = inside(root, candidate['sourceLessonFile'])
            lesson_identity = file_sha(lesson_path)
            if lesson_identity != candidate['sourceLessonSHA256']:
                raise ValueError('actual canonical lesson SHA mismatch')
            if lesson_path not in lesson_cache:
                lesson_cache[lesson_path] = read(lesson_path)
            wanted, context = source_binding(candidate, lesson_cache[lesson_path])
            if row['sentenceNumber'] is None:
                row['sentenceNumber'] = context['sentenceOrdinal']
            row['canonicalSource'] = dict(context, file=candidate['sourceLessonFile'], sha256=lesson_identity)
            if candidate['unit'] == 'sentence':
                row['sentenceNumber'] = context['sentenceOrdinal'] or (1 if context['sentenceCount'] == 1 else None)
                row['parentLineId'] = context['sourceId'] if row['level'] == 1 or context['sentenceCount'] > 1 else None
            if candidate['unit'] == 'word':
                row['sourcePinyin'] = context['sourcePinyin']
            if target_catalog is not None:
                target = target_catalog.get(row['id'])
                expected = {'level': row['level'], 'lesson': row['lesson'], 'unit': row['unit'], 'sourceText': row['sourceZH'],
                            'sourceLessonFile': candidate['sourceLessonFile'], 'sourceLessonSHA256': lesson_identity,
                            'parentLineId': row['parentLineId'], 'sentenceNumber': row['sentenceNumber']}
                if target is None or any(target.get(k) != v for k, v in expected.items()):
                    raise ValueError('actual canonical semantic labels differ from independent target catalog')
                pointer_path = target.get('sourceJSONPointer', '')
                if pointer_path.endswith('/zh') or pointer_path.endswith('/sourceText'):
                    pointer_path = pointer_path.rpartition('/')[0]
                if pointer_path != context['sourceJSONPointer']:
                    raise ValueError('canonical object identity differs from target catalog pointer')
            track_path = inside(root, track['disk'])
            if track_path not in source_cache:
                actual_sha = file_sha(track_path)
                if actual_sha != track['sha256'] or track_path.stat().st_size != track['bytes']:
                    raise ValueError('actual MP3 bytes or SHA differ from original registry')
                process = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(track_path), '-map', '0:a:0', '-ac', '1', '-ar', str(RATE), '-f', 'f32le', '-'], capture_output=True, check=True, timeout=120)
                pcm = process.stdout
                if not pcm or len(pcm) % 4:
                    raise ValueError('empty or unaligned decoded PCM')
                source_cache[track_path] = (pcm, sha(pcm))
            pcm, pcm_sha = source_cache[track_path]
            if candidate.get('sourcePCM_SHA256') != pcm_sha:
                raise ValueError('actual independently decoded source PCM SHA differs')
            frames = candidate['sourceSampleRange16k']
            if not isinstance(frames, list) or len(frames) != 2 or not all(type(x) is int for x in frames) or not 0 <= frames[0] < frames[1] <= len(pcm) // 4:
                raise ValueError('source frames must be integral and inside actual full PCM')
            first, last = frames
            if any(candidate.get(key) != frame / RATE for key, frame in [('start', first), ('end', last)]):
                raise ValueError('declared seconds do not equal exact integer source frames')
            crop = pcm[first * 4:last * 4]
            crop_sha, duration = sha(crop), (last - first) / RATE
            if candidate.get('cropPCM_SHA256') and candidate['cropPCM_SHA256'] != crop_sha:
                raise ValueError('producer crop PCM differs from independent actual crop')
            row.update(sourceSHA256=track['sha256'], sourcePCM_SHA256=pcm_sha,
                       sourceDecodedDuration=(len(pcm) // 4) / RATE,
                       sourceContainerDuration=track.get('duration', track.get('duration_s')),
                       sourceSampleRange16k=frames, cropPCM_SHA256=crop_sha,
                       start=first / RATE, end=last / RATE, duration=duration)
            edges = {name: db_window(pcm, a, b) for name, a, b in [
                ('beforeStart', first - 320, first), ('afterStart', first, first + 320),
                ('beforeEnd', last - 320, last), ('afterEnd', last, last + 320)]}
            row['actualEdgeRMSDbFS20ms'] = edges
            if any(value is not None and value > POLICY['quietEdgeDbFS'] for value in edges.values()):
                row['holds'].append('non-quiet-boundary-needs-independent-phoneme-review')
            guards = candidate.get('boundaryRefinementSourceGuards')
            if guards:
                minimum, maximum = guards.get('minimumStartFrame'), guards.get('maximumEndFrame')
                if minimum is None and maximum is None and guards.get('method') == 'explicit-independent-source-context-review-required' and guards.get('notCertifiedByRawASRTimestamps') is True:
                    row['holds'].append('source-neighbor-anchors-await-independent-context-review')
                elif type(minimum) is not int or type(maximum) is not int or not 0 <= minimum <= maximum <= len(pcm) // 4:
                    row['holds'].append('source-neighbor-guard-invalid')
                elif first < minimum or last > maximum:
                    row['holds'].append('actual-crop-outside-proposed-source-neighbor-guards-needs-independent-boundary-review')
            if candidate['unit'] == 'sentence' and context['sentenceCount'] > 1 and context['sentenceOrdinal'] is None:
                row['holds'].append('multi-sentence-source-row-not-single-sentence')
            alternative = candidate.get('clipUnit') == 'alternative-original-pronunciations'
            expected_readings = 2 if alternative and candidate.get('expectedReadingCount') == 2 else 1
            if candidate['unit'] == 'word':
                if candidate.get('sourceOccurrenceEvidence'):
                    row['actualSourceOccurrenceFiles'] = occurrence_files(root, candidate['sourceOccurrenceEvidence'], mappings)
                if alternative:
                    pronunciations = candidate.get('declaredOriginalPronunciations')
                    if expected_readings != 2 or not isinstance(pronunciations, list) or len(pronunciations) != 2 or not candidate.get('sourceOccurrenceEvidence'):
                        row['holds'].append('alternative-original-pronunciation-source-binding-incomplete')
                elif candidate.get('repetition') not in (1, 2) or not candidate.get('sourceOccurrenceEvidence'):
                    # A word extracted from a printed source sentence has a unique
                    # occurrence, not a fictitious first/second vocabulary reading.
                    # Its actual full-source word references stay provisional and
                    # require a separate explicit source-context/phonetic decision.
                    actual_refs = [word for item in row.get('actualSourceOccurrenceFiles', []) for word in item.get('actualReferencedWords', [])]
                    occurrence=candidate.get('sourceOccurrenceEvidence', {})
                    explicit_single_original=(occurrence.get('singleOriginalSentenceOccurrence') is True
                                              and occurrence.get('originalSpokenSyllable')==candidate['sourceZH'])
                    if (occurrence.get('comparisonNumeral') or explicit_single_original) and actual_refs:
                        row['holds'].append('nonrepeated-original-word-occurrence-needs-independent-source-context-review')
                    else:
                        row['holds'].append('single-pronunciation-repetition-and-source-occurrence-unbound')
            if candidate['unit'] == 'word':
                runs = word_runs(crop, first)
                row['independentWordSpeechLikeRuns16k'] = runs
                row['independentWordSpeechLikeRunCount'] = len(runs)
                if len(runs) != expected_readings:
                    row['holds'].append('word-crop-multiple-or-missing-speech-like-runs-needs-phonetic-review')
            evidence = [inspect_raw(raw, candidate, crop_sha, duration, path, expected_sha, normalizer, root, mappings)
                        for path, expected_sha, raw in raw_index[(candidate['id'], tuple(frames))]]
            row['rawModelEvidence'] = evidence
            distinct = {(e['modelRepository'], e['modelRevision']) for e in evidence}
            if len(distinct) < POLICY['minimumDistinctModelSnapshots']:
                row['holds'].append('actual-crop-unprompted-multiple-model-evidence-incomplete')
            for item in evidence:
                row['holds'].extend(item['holds'])
                row['flags'].extend(item['flags'])
        except (OSError, ValueError, KeyError, TypeError, IndexError, subprocess.SubprocessError) as exc:
            row['holds'].append('source-or-crop-identity-failure')
            row['error'] = type(exc).__name__ + ': ' + str(exc)[:1200]
        row['holds'] = sorted(set(row['holds']))
        row['flags'] = sorted(set(row['flags']))
        row['status'] = 'held' if row['holds'] else 'machine-evidence-complete-awaiting-independent-decision'
        rows.append(row)
        if number % 100 == 0:
            print(json.dumps({'reviewedCandidates': number, 'total': len(candidates)}, ensure_ascii=False), flush=True)
    report = {'schemaVersion': 1, 'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
              'reviewer': 'independent original-source/crop/ASR evidence checker',
              'scriptSHA256': executed_script_sha, 'candidateInputSHA256': sha(candidate_bytes),
              'independentTargetCatalogSHA256': sha(catalog_bytes) if catalog_bytes else None,
              'comparisonNormalization': normalization,
              'evidencePathMaps': [{'originalPrefix': prefix, 'localRoot': str(local)} for prefix, local in mappings],
              'policy': POLICY, 'policySHA256': sha(json.dumps(POLICY, sort_keys=True).encode()),
              'counts': dict(Counter(row['status'] for row in rows)),
              'holdReasons': dict(Counter(reason for row in rows for reason in row['holds'])),
              'uniqueTargets': len({row['id'] for row in rows}), 'candidateVariants': len(rows),
              'independentlyDecodedSourceTracks': len(source_cache),
              'humanListening': False, 'nativeSpeakerReview': False,
              'automaticProductionApproval': False, 'runtimeModified': False,
              'limitations': ['Quiet windows and ASR agreement do not prove phoneme completeness or tones.',
                              'CJK mismatch and non-CJK units require explicit source/phonetic/glyph evidence; they are never silently normalized.',
                              'Complete machine evidence is a review candidate, not a production authority mutation.'],
              'targets': rows}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + '\n')
    print(json.dumps({k: report[k] for k in ('counts', 'uniqueTargets', 'candidateVariants', 'holdReasons')}, ensure_ascii=False), flush=True)
    return 0


if __name__ == '__main__':
    sys.exit(main())
