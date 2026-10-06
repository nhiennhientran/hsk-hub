#!/usr/bin/env python3
"""Actual original localized spectra; no decoder alignment or automatic decisions."""
import hashlib
import importlib.util
import json
import shutil
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT/'course-app/docs/final-quality-20261006/audio-context-peer-hsk3-remaining-spoken'
WINDOWS = [('l07:text1:line6', 30.35, 31.27), ('l06:text2:line7:sentence1', 29.25, 30.02),
           ('l14:text3:line6', 25.80, 26.57), ('l18:text2:line1:sentence1', .91, 1.57),
           ('l04:text2:line3', 9.80, 10.35)]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ref(path):
    return {'file': path.relative_to(ROOT).as_posix(), 'sha256': sha(path)}


def main():
    spec = importlib.util.spec_from_file_location('h3_remaining_fine_actual_source',
            ROOT/'tools/final-quality-20261006/review-decisions.py')
    support = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(support)
    observations = OUT/'text11-independent-actual-source-observations.json'
    targets = {x['id']: x for x in json.loads(observations.read_text())['targets']}
    fig, axes = plt.subplots(len(WINDOWS), 2, figsize=(21, len(WINDOWS)*2.8), squeeze=False)
    facts = []
    for n, (tail, start, end) in enumerate(WINDOWS):
        target = targets['hsk3-fltrp-2026:'+tail]
        report = json.loads((ROOT/target['currentActualReportEvidence']['file']).read_text())
        row = next(x for x in report['targets'] if x['id'] == target['id'])
        pcm_bytes = support.original_pcm(ROOT, row)
        pcm = np.frombuffer(pcm_bytes, dtype='<f4')
        a, b = round(start*16000), round(end*16000)
        signal = pcm[a:b]
        ax, sx = axes[n]
        ax.plot(np.arange(a, b)/16000, signal, lw=.7)
        f, times, power = spectrogram(signal, fs=16000, nperseg=512, noverlap=496, scaling='spectrum')
        sx.pcolormesh(times+a/16000, f, 10*np.log10(np.maximum(power, 1e-12)),
                     vmin=-95, vmax=-25, shading='auto', cmap='magma')
        sx.set_ylim(0, 6000)
        ax.set_title(target['id']+' ACTUAL original fine source phase', fontsize=10)
        sx.set_title('Original 32ms STFT / 1ms step; no model timestamp or phoneme certificate', fontsize=9)
        for axis in (ax, sx):
            axis.set_xlabel('Actual original source seconds'); axis.grid(alpha=.12)
        facts.append({key: target[key] for key in ('id', 'candidateId', 'sourceTrack',
                      'sourceSHA256', 'sourcePCM_SHA256', 'sourceSampleRange16k', 'cropPCM_SHA256')})
        facts[-1].update({'actualSourceScopeFrames16k': [a, b],
                          'actualSourceScopePCM_SHA256': hashlib.sha256(pcm_bytes[a*4:b*4]).hexdigest(),
                          'plotPanelOrdinal': n+1})
    png = OUT/'text11-localized-original-source-phases.png'
    fig.tight_layout(); fig.savefig(png, dpi=120); plt.close(fig)
    from PIL import Image
    Image.open(png).verify()
    path = OUT/'text11-localized-original-source-phase-evidence.json'
    path.write_text(json.dumps({'status': 'actual-original-source-phases-not-approval',
        'observationsEvidence': ref(observations), 'scriptEvidence': ref(Path(__file__)),
        'actualSourcePlot': ref(png), 'targets': facts, 'newASR': False,
        'sourceModified': False, 'humanListening': False, 'nativeSpeakerReview': False,
        'fullPhonemeCertification': False, 'pronunciationToneCertified': False,
        'productionApproved': False}, ensure_ascii=False, indent=2)+'\n')
    shutil.copyfile(png, '/workspace/scratch/11a289909f3c/inspect-text11-localized-original-source-phases.png')
    print(json.dumps(ref(path)))


if __name__ == '__main__':
    main()
