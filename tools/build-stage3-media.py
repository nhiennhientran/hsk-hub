#!/usr/bin/env python3
"""Decode accurate source-time cuts; create lazy, self-contained lesson media bundles."""
import argparse
import base64
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / 'new-hsk1/hsk1/stage3'
ENCODING = {'codec': 'libmp3lame', 'bitrate': '48k', 'sampleRate': 24000,
            'channels': 1, 'cutMethod': 'decode then trim; no MP3 packet-copy cuts'}

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def run(command):
    return subprocess.run(command, check=True, capture_output=True).stdout

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--jobs', type=int, default=4)
    args = parser.parse_args()
    source_audit = json.loads((ROOT / 'docs/stage3/audio-source-manifest.json').read_text())
    tracks = {row['trackId']: row for row in source_audit['tracks']}
    records = []
    source_hashes = []
    for prefix in ('listening', 'vocabulary'):
        for suffix in ('01-05', '06-10', '11-15'):
            path = APP / 'data' / f'{prefix}-{suffix}.json'
            source_hashes.append({'file': str(path.relative_to(ROOT)), 'sha256': digest(path.read_bytes())})
            for row in json.loads(path.read_text()):
                if row['audio'] is not None:
                    records.append(row)
    assert len(records) == 405, f'Expected 75 listening plus 330 vocabulary source records, got {len(records)}'
    assert len({r['id'] for r in records}) == len(records)
    out = ROOT / 'tmp/stage3-clips'
    out.mkdir(parents=True, exist_ok=True)
    media_dir = APP / 'media'
    media_dir.mkdir(exist_ok=True)
    version = run(['ffmpeg', '-version']).decode().splitlines()[0]
    track_raw = {}
    track_durations = {}
    for track in sorted({r['audio']['track'] for r in records}):
        path = ROOT / 'new-hsk1/hsk1/audio' / f'{track}.mp3'
        assert path.is_file() and track in tracks, f'Missing original-audio evidence: {track}'
        track_raw[track] = digest(path.read_bytes())
        assert track_raw[track] == tracks[track]['siteSha256'], f'Source changed after audit: {track}'
        metadata = json.loads(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', str(path)]))
        track_durations[track] = float(metadata['format']['duration'])

    def cut(row):
        identity = row['id']
        assert all(c.isalnum() or c in '-_' for c in identity)
        audio = row['audio']; track = audio['track']
        start, end = float(audio['start']), float(audio['end'])
        assert 0 <= start < end <= track_durations[track] + 0.05, f'Invalid cut: {identity}'
        assert int(track.split('-')[0]) == row['lesson'], f'Borrowed lesson source: {identity}'
        settings = {'id':identity, 'sourceSha256':track_raw[track], 'start':start, 'end':end,
                    'encoding':ENCODING, 'ffmpeg':version}
        target = out / f'{identity}.mp3'
        cache = out / f'{identity}.build.json'
        settings_hash = digest(json.dumps(settings, sort_keys=True).encode())
        cached = json.loads(cache.read_text()) if cache.is_file() else None
        if not (target.is_file() and cached and cached.get('settingsHash') == settings_hash and
                digest(target.read_bytes()) == cached.get('sha256')):
            source = ROOT / 'new-hsk1/hsk1/audio' / f'{track}.mp3'
            run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source),
                 '-ss', str(start), '-t', str(round(end-start, 6)), '-vn', '-map_metadata', '-1',
                 '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '48k',
                 '-write_xing', '1', '-id3v2_version', '0', str(target)])
        raw = target.read_bytes()
        metadata = json.loads(run(['ffprobe', '-v', 'error', '-show_entries',
                                  'format=duration:stream=codec_name,sample_rate,channels', '-of', 'json', str(target)]))
        duration = float(metadata['format']['duration'])
        assert abs(duration - (end-start)) < 0.16 and len(raw) > 1000, identity
        source_info = tracks[track]
        entry = {'id':identity, 'lesson':row['lesson'], 'track':track, 'start':start, 'end':end,
                 'requestedDuration':round(end-start, 6), 'duration':duration,
                 'sha256':digest(raw), 'bytes':len(raw), 'timingBasis':audio['timingBasis'],
                 'siteSha256':source_info['siteSha256'], 'originalUploadTrackSha256':source_info['sourceSha256'],
                 'originalTimeOffsetSeconds':source_info['sourceTimeFromSiteOffsetSeconds'],
                 'sampleRate':int(metadata['streams'][0]['sample_rate']),
                 'channels':metadata['streams'][0]['channels']}
        cache.write_text(json.dumps({'settingsHash':settings_hash, 'sha256':entry['sha256']})+'\n')
        return entry

    with ThreadPoolExecutor(max_workers=max(1,min(args.jobs,8))) as pool:
        clips = list(pool.map(cut, records))
    manifest = {'schemaVersion':1, 'purpose':'Original textbook recordings decoded into standalone learner clips',
                'encoding':ENCODING, 'ffmpeg':version, 'timeReference':'site decoded PCM; see originalTimeOffsetSeconds per clip',
                'limitations':['Clips are re-encoded for the learning module; this is not lossless audio copying.',
                               'Waveform/ASR/textbook checks do not replace human auditory quality review.'],
                'listeningCount':75, 'vocabularyAudioRecords':330,
                'sourceData':source_hashes, 'clips':clips}
    (APP / 'media-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
    index = {'version':1, 'clips':{c['id']:{k:c[k] for k in ('lesson','duration','sha256','bytes')} for c in clips}}
    (APP / 'media-index.js').write_text('/* Generated media metadata; no audio is loaded on page open. */\nwindow.HSKStep3MediaIndex='+json.dumps(index,separators=(',',':'))+';\n')
    total_bytes = 0
    for lesson in range(1,16):
        rows = [c for c in clips if c['lesson']==lesson]
        # Identical cuts (e.g. one pronunciation shared by two senses) reuse one data literal in this bundle.
        blobs, names = {}, {}
        lines = ['/* Original textbook audio clips, generated by build-stage3-media.py. */',
                 '(function(){"use strict";const m=window.HSKStep3Media||(window.HSKStep3Media={});']
        for c in rows:
            if c['sha256'] not in blobs:
                name = 'b'+str(len(blobs)); blobs[c['sha256']] = name
                data = base64.b64encode((out / (c['id']+'.mp3')).read_bytes()).decode()
                lines.append(f'const {name}="data:audio/mpeg;base64,{data}";')
            names[c['id']] = blobs[c['sha256']]
        lines += [f'm[{json.dumps(identity)}]={name};' for identity,name in names.items()]
        lines.append('})();')
        text = '\n'.join(lines)+'\n'
        (media_dir / f'lesson-{lesson:02d}.js').write_text(text)
        total_bytes += len(text.encode())
    print(json.dumps({'clips':len(clips), 'listening':75, 'vocabularyAudio':330,
                      'rawMp3Bytes':sum(c['bytes'] for c in clips),'lazyBundles':15,'bundleBytes':total_bytes}))

if __name__ == '__main__':
    main()
