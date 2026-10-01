#!/usr/bin/env python3
"""Traceable ASR assistance for supplied HSK recordings; not a human listening audit."""
import argparse
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import platform
import time
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent

def utc():
    return datetime.now(timezone.utc).isoformat()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', default='small')
    parser.add_argument('--lessons', default='1-15')
    parser.add_argument('--clips', action='store_true')
    parser.add_argument('--include-vocabulary', action='store_true')
    parser.add_argument('--output', default='tools/tests/results/stage3-asr-tracks.json')
    args = parser.parse_args()
    first, last = map(int, args.lessons.split('-'))
    assert 1 <= first <= last <= 15
    target = ROOT / args.output
    target.parent.mkdir(parents=True, exist_ok=True)
    from faster_whisper import WhisperModel
    from faster_whisper.utils import download_model
    model_path = Path(download_model(args.model))
    model_files = []
    for path in sorted(model_path.iterdir()):
        if path.is_file():
            model_files.append({'file': path.name, 'bytes': path.stat().st_size,
                                'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    model = WhisperModel(str(model_path), device='cpu', compute_type='int8', cpu_threads=4)
    inputs = []
    if args.clips:
        manifest = json.loads((ROOT / 'new-hsk1/hsk1/stage3/media-manifest.json').read_text())
        for entry in manifest['clips']:
            if (entry['id'].startswith('l') or args.include_vocabulary) and first <= entry['lesson'] <= last:
                inputs.append((entry['id'], ROOT / 'tmp/stage3-clips' / (entry['id'] + '.mp3')))
    else:
        for lesson in range(first, last + 1):
            for track in range(1, 7):
                name = f'{lesson}-{track}'
                inputs.append((name, ROOT / 'new-hsk1/hsk1/audio' / (name + '.mp3')))
    report = {
        'purpose': 'ASR evidence to compare against supplied textbook and reviewed audio boundaries',
        'method': 'automatic speech recognition; not direct human or assistant auditory perception',
        'startedAt': utc(), 'completedAt': None, 'completed': False,
        'sourceCommit': os.environ.get('GITHUB_SHA'),
        'runId': os.environ.get('GITHUB_RUN_ID'),
        'python': platform.python_version(),
        'fasterWhisperVersion': importlib.metadata.version('faster-whisper'),
        'model': args.model, 'modelFiles': model_files,
        'options': {'language': 'zh', 'beam_size': 5, 'word_timestamps': True,
                    'condition_on_previous_text': False, 'vad_filter': False,
                    'temperature': 0, 'initial_prompt': None},
        'expectedCount': len(inputs), 'entries': [], 'errors': [],
        'limitations': ['ASR can confuse homophones, names, isolated syllables and word boundaries.',
                        'Recognition text and probability are evidence for review, not an automatic correctness verdict.',
                        'No expected textbook transcript is supplied to the recognizer.']
    }
    for identity, path in inputs:
        t0 = time.monotonic()
        try:
            raw = path.read_bytes()
            segments, info = model.transcribe(str(path), **report['options'])
            rows = []
            for seg in segments:
                rows.append({'start': seg.start, 'end': seg.end, 'text': seg.text,
                             'avgLogprob': seg.avg_logprob, 'noSpeechProb': seg.no_speech_prob,
                             'words': [{'start': w.start, 'end': w.end, 'word': w.word,
                                        'probability': w.probability} for w in (seg.words or [])]})
            report['entries'].append({'id': identity, 'file': str(path.relative_to(ROOT)),
                                      'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest(),
                                      'duration': info.duration, 'language': info.language,
                                      'elapsedSeconds': round(time.monotonic() - t0, 3),
                                      'text': ''.join(s['text'] for s in rows), 'segments': rows})
            print(json.dumps({'id': identity, 'completed': len(report['entries']),
                              'total': len(inputs), 'text': report['entries'][-1]['text']}, ensure_ascii=False), flush=True)
        except Exception as exc:
            report['errors'].append({'id': identity, 'error': str(exc)})
            print(json.dumps({'id': identity, 'error': str(exc)}, ensure_ascii=False), flush=True)
        target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    report['completedAt'] = utc()
    report['completed'] = len(report['entries']) == len(inputs) and not report['errors']
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    if not report['completed']:
        raise SystemExit('One or more audio files failed ASR; inspect the evidence report.')
    print(json.dumps({'completed': True, 'count': len(inputs), 'report': str(target.relative_to(ROOT))}))

if __name__ == '__main__':
    main()
