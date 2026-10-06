#!/usr/bin/env python3
"""Fetch pinned public ASR snapshots once and record their actual identities."""
import hashlib
import json
import os
from pathlib import Path
import time

for name in ('HF_HUB_DISABLE_IMPLICIT_TOKEN', 'HF_HUB_DISABLE_XET', 'HF_HUB_DISABLE_TELEMETRY'):
    os.environ[name] = '1'
os.environ.setdefault('HF_HUB_DOWNLOAD_TIMEOUT', '60')
from huggingface_hub import snapshot_download

ROOT = Path(__file__).resolve().parents[2]
CACHE = Path('/workspace/scratch/11a289909f3c/audio-model-cache')
OUT = ROOT / 'docs/final-quality-20261006/audio-environment/model-provenance.json'
MODELS = [('Systran/faster-whisper-small', '536b0662742c02347bc0e980a01041f333bce120'),
          ('Systran/faster-whisper-medium', '08e178d48790749d25932bbc082711ddcfdfbc4f')]
FILES = ['config.json', 'model.bin', 'tokenizer.json', 'vocabulary.txt']
records = []
OUT.parent.mkdir(parents=True, exist_ok=True)
for repo, revision in MODELS:
    started = time.monotonic()
    print(json.dumps({'stage': 'model-download', 'repository': repo, 'revision': revision}), flush=True)
    snapshot = Path(snapshot_download(repo_id=repo, revision=revision, cache_dir=str(CACHE),
                                      allow_patterns=FILES, token=False, max_workers=2))
    assert snapshot.name == revision
    files = []
    for filename in FILES:
        path = snapshot / filename
        assert path.is_file() and path.stat().st_size > 0
        digest = hashlib.sha256()
        with path.open('rb') as stream:
            for block in iter(lambda: stream.read(8 * 1024 * 1024), b''):
                digest.update(block)
        files.append({'name': filename, 'bytes': path.stat().st_size, 'sha256': digest.hexdigest()})
    records.append({'repository': repo, 'revision': revision, 'localSnapshot': str(snapshot), 'files': files})
    OUT.write_text(json.dumps({'status': 'partial' if len(records) < len(MODELS) else 'ready',
                               'models': records}, indent=2) + '\n')
    print(json.dumps({'stage': 'model-ready', 'repository': repo, 'elapsedSeconds': round(time.monotonic()-started, 2)}), flush=True)
