#!/usr/bin/env python3
"""Render actual-source localized wave/spectrum evidence; no automatic approval."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

RATE = 16000


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--repo-root', required=True, type=Path)
    p.add_argument('--candidates', required=True, type=Path)
    p.add_argument('--source-track', required=True)
    p.add_argument('--background-reference', action='append', default=[], metavar='START:END',
                   help='Explicit source seconds inside observed foreground pauses; observation only')
    p.add_argument('--output', required=True, type=Path)
    args = p.parse_args()
    root = args.repo_root.resolve()
    review_path = Path(__file__).with_name('review-crops.py')
    spec = importlib.util.spec_from_file_location('independent_review', review_path)
    review = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(review)
    document_bytes = args.candidates.read_bytes()
    candidates = [c for c in json.loads(document_bytes)['targets'] if c['sourceTrack'] == args.source_track]
    track = review.source_registry(root)[args.source_track]
    source = review.inside(root, track['disk'])
    if sha(source.read_bytes()) != track['sha256'] or source.stat().st_size != track['bytes']:
        raise ValueError('actual original track identity mismatch')
    raw = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(source), '-ac', '1', '-ar', str(RATE),
                          '-f', 'f32le', '-'], check=True, capture_output=True, timeout=120).stdout
    pcm = np.frombuffer(raw, dtype='<f4')
    args.output.mkdir(parents=True, exist_ok=True)
    reference_windows = []
    for value in args.background_reference:
        start, end = map(float, value.split(':'))
        first, last = round(start * RATE), round(end * RATE)
        if not 0 <= first < last <= len(pcm):
            raise ValueError('reference source frames are invalid')
        reference_windows.append({'sourceSampleRange16k': [first, last], 'start': first/RATE, 'end': last/RATE,
                                  'actualPCM_SHA256': sha(raw[first*4:last*4]),
                                  'rmsDbFS': review.db_window(raw, first, last),
                                  'referenceType': 'declared-foreground-pause-needs-independent-context-review'})
    plots = []
    for c in candidates:
        first, last = c['sourceSampleRange16k']
        if sha(raw) != c['sourcePCM_SHA256'] or sha(raw[first*4:last*4]) != c['cropPCM_SHA256']:
            raise ValueError('actual source/crop PCM identity differs for ' + c['id'])
        begin, stop = max(0, first - RATE), min(len(pcm), last + RATE)
        local = pcm[begin:stop]
        fig, axes = plt.subplots(3, 1, figsize=(14, 7), sharex=True, gridspec_kw={'height_ratios': [1, 1, 2]})
        time = np.arange(begin, stop) / RATE
        axes[0].plot(time, local, linewidth=.45, color='#1d4ed8')
        axes[0].set_ylabel('Actual amplitude')
        hop = 160
        windows = len(local) // hop
        db = 20*np.log10(np.maximum(np.sqrt(np.mean(local[:windows*hop].astype('f8').reshape(windows, hop)**2, axis=1)), 1e-12))
        axes[1].plot((begin + np.arange(windows)*hop)/RATE, db, color='#166534', linewidth=.8)
        axes[1].axhline(-45, color='#dc2626', linewidth=.7, linestyle='--', label='default quiet gate -45 dBFS')
        axes[1].set_ylim(-100, 0)
        axes[1].set_ylabel('RMS / 10 ms (dBFS)')
        power, frequencies, times, _ = axes[2].specgram(local, Fs=RATE, NFFT=256, noverlap=192,
                                                      cmap='magma', vmin=-115, vmax=-30,
                                                      xextent=(begin/RATE, stop/RATE))
        axes[2].set_ylim(0, 5000)
        axes[2].set_ylabel('Actual spectrum (Hz)')
        axes[2].set_xlabel('Original source time (seconds)')
        for ax in axes:
            ax.axvline(first/RATE, color='#06b6d4', linewidth=1, label='actual proposed source start')
            ax.axvline(last/RATE, color='#22c55e', linewidth=1, label='actual proposed source end')
            for ref in reference_windows:
                if ref['end'] >= begin/RATE and ref['start'] <= stop/RATE:
                    ax.axvspan(ref['start'], ref['end'], alpha=.12, color='#64748b')
            ax.grid(alpha=.15)
        fig.suptitle(c['id'] + ' | actual source/crop identity bound; no phoneme or listening approval', fontsize=10)
        fig.tight_layout()
        filename = re.sub(r'[^A-Za-z0-9_.-]', '_', c['id']) + '.png'
        path = args.output / filename
        fig.savefig(path, dpi=140)
        plt.close(fig)
        plots.append({'id': c['id'], 'sourceText': c['sourceZH'], 'unit': c['unit'],
                      'sourceSampleRange16k': [first,last], 'cropPCM_SHA256': c['cropPCM_SHA256'],
                      'sourceLessonFile': c['sourceLessonFile'], 'sourceLessonSHA256': c['sourceLessonSHA256'],
                      'sourceJSONPointer': c.get('sourceJSONPointer'), 'file': str(path), 'sha256': sha(path.read_bytes()),
                      'edgeRMSDbFS20ms': {name: review.db_window(raw, a, b) for name,a,b in [
                          ('beforeStart',first-320,first),('afterStart',first,first+320),
                          ('beforeEnd',last-320,last),('afterEnd',last,last+320)]},
                      'foregroundBoundaryClassified': False, 'phonemeCompletenessCertified': False,
                      'productionApproved': False})
    report = {'schemaVersion':1, 'sourceTrack':args.source_track,'sourceSHA256':track['sha256'],
              'sourcePCM_SHA256':sha(raw),'sourceSampleCount16k':len(pcm),
              'candidateInputSHA256':sha(document_bytes), 'scriptSHA256':sha(Path(__file__).read_bytes()),
              'backgroundReferenceWindows':reference_windows,'plots':plots,
              'purpose':'Actual original waveform/spectral observations for explicit per-ID boundary review.',
              'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,
              'sourceChineseChanged':False,'sourceAudioChanged':False,'runtimeModified':False,
              'productionApproved':False}
    (args.output/'boundary-observations.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'plots':len(plots),'references':len(reference_windows),'sourceSHA256':track['sha256']}))


if __name__ == '__main__':
    sys.exit(main())
