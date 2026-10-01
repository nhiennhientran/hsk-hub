#!/usr/bin/env python3
"""Compare the uploaded MP3 sources with the site's remuxed copies.

Read-only with respect to audio inputs. Writes the requested JSON audit reports.
Requires Python 3 and ffmpeg/ffprobe on PATH; no Python third-party dependency.
This is a provenance and decoded-sample audit, not an auditory content review.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def run(*args: str) -> bytes:
    return subprocess.check_output(args, stderr=subprocess.PIPE)


def probe(filename: Path) -> dict:
    return json.loads(run(
        'ffprobe', '-v', 'error', '-select_streams', 'a:0',
        '-show_packets', '-show_data_hash', 'sha256', '-show_entries',
        'format=duration,start_time:stream=codec_name,sample_rate,channels,start_time,duration:'
        'packet=size,duration_time,pts_time,data_hash', '-of', 'json', str(filename)
    ))


def decode(filename: Path) -> bytes:
    # Preserve native rate/channels. f32le makes sample-frame offsets explicit.
    return run('ffmpeg', '-v', 'error', '-i', str(filename), '-map', '0:a:0',
               '-f', 'f32le', '-acodec', 'pcm_f32le', 'pipe:1')


def compare(source: Path, site: Path) -> dict:
    source_bytes, site_bytes = source.read_bytes(), site.read_bytes()
    source_probe, site_probe = probe(source), probe(site)
    source_stream = source_probe['streams'][0]
    site_stream = site_probe['streams'][0]
    source_rate = int(source_stream['sample_rate'])
    site_rate = int(site_stream['sample_rate'])
    source_channels = int(source_stream['channels'])
    site_channels = int(site_stream['channels'])
    source_pcm, site_pcm = decode(source), decode(site)
    source_frame_bytes, site_frame_bytes = 4 * source_channels, 4 * site_channels
    if len(source_pcm) % source_frame_bytes or len(site_pcm) % site_frame_bytes:
        raise ValueError(f'Incomplete decoded sample frame: {source.name}')
    source_frames = len(source_pcm) // source_frame_bytes
    site_frames = len(site_pcm) // site_frame_bytes
    extra_frames = source_frames - site_frames
    same_format = source_rate == site_rate and source_channels == site_channels
    aligned = source_pcm[extra_frames * source_frame_bytes:] if extra_frames >= 0 else b''
    same_pcm = same_format and extra_frames >= 0 and aligned == site_pcm
    source_packets = [packet['data_hash'] for packet in source_probe['packets']]
    site_packets = [packet['data_hash'] for packet in site_probe['packets']]
    id3_bytes = (10 + sum(value << (7 * (3 - index))
                         for index, value in enumerate(source_bytes[6:10]))) \
        if source_bytes[:3] == b'ID3' else 0
    return {
        'trackId': source.stem,
        'file': source.name,
        'sourceSha256': sha256(source_bytes),
        'siteSha256': sha256(site_bytes),
        'sourceBytes': len(source_bytes),
        'siteBytes': len(site_bytes),
        'sourceId3Bytes': id3_bytes,
        'sourceSampleRate': source_rate,
        'siteSampleRate': site_rate,
        'sourceChannels': source_channels,
        'siteChannels': site_channels,
        'sourcePacketCount': len(source_packets),
        'sitePacketCount': len(site_packets),
        'sourcePacketSequenceSha256': sha256('\n'.join(source_packets).encode()),
        'sitePacketSequenceSha256': sha256('\n'.join(site_packets).encode()),
        'audioPacketsIdentical': source_packets == site_packets,
        'sourceDecodedSampleFrames': source_frames,
        'siteDecodedSampleFrames': site_frames,
        'sourceExtraLeadingSampleFrames': extra_frames,
        'sourceTimeFromSiteOffsetSeconds': extra_frames / source_rate,
        'sourcePcmSha256': sha256(source_pcm),
        'sitePcmSha256': sha256(site_pcm),
        'alignedSourcePcmSha256': sha256(aligned),
        'pcmBytesIdenticalAfterLeadingOffset': same_pcm,
        'sourceReportedDuration': float(source_probe['format']['duration']),
        'siteReportedDuration': float(site_probe['format']['duration']),
        'sourceStartTime': float(source_stream['start_time']),
        'siteStartTime': float(site_stream['start_time']),
        'siteFirstPacketSideData': site_probe['packets'][0].get('side_data_list', []),
    }


def write_json(filename: Path, value: dict) -> None:
    filename.parent.mkdir(parents=True, exist_ok=True)
    filename.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main() -> int:
    repo = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', required=True, type=Path,
                        help='Directory containing the 93 MP3s extracted from the uploaded RAR.')
    parser.add_argument('--site-dir', type=Path, default=repo / 'new-hsk1/hsk1/audio')
    parser.add_argument('--manifest', required=True, type=Path)
    parser.add_argument('--full-report', required=True, type=Path)
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()
    source_files = {p.name: p for p in args.source_dir.glob('*.mp3')}
    site_files = {p.name: p for p in args.site_dir.glob('*.mp3')}
    if len(source_files) != 93 or source_files.keys() != site_files.keys():
        parser.error(f'Expected 93 matching source/site files; source={len(source_files)}, '
                     f'site={len(site_files)}, missing={sorted(source_files.keys() - site_files.keys())}, '
                     f'extra={sorted(site_files.keys() - source_files.keys())}')
    if any(not re.fullmatch(r'\d+-\d+\.mp3', name) for name in source_files):
        parser.error('Unexpected MP3 filename outside lesson-track.mp3 convention.')
    names = sorted(source_files, key=lambda name: tuple(map(int, Path(name).stem.split('-'))))
    with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 8))) as pool:
        rows = list(pool.map(lambda name: compare(source_files[name], site_files[name]), names))
    summary = {
        'files': len(rows),
        'audioPacketsIdenticalCount': sum(row['audioPacketsIdentical'] for row in rows),
        'pcmBytesIdenticalAfterOffsetCount': sum(row['pcmBytesIdenticalAfterLeadingOffset'] for row in rows),
        'sourceExtraLeadingSampleFrames': sorted({row['sourceExtraLeadingSampleFrames'] for row in rows}),
        'sourceTimeFromSiteOffsetSeconds': sorted({row['sourceTimeFromSiteOffsetSeconds'] for row in rows}),
        'sourceTotalBytes': sum(row['sourceBytes'] for row in rows),
        'siteTotalBytes': sum(row['siteBytes'] for row in rows),
        'sourceDecodedSeconds': sum(row['sourceDecodedSampleFrames'] / row['sourceSampleRate'] for row in rows),
        'siteDecodedSeconds': sum(row['siteDecodedSampleFrames'] / row['siteSampleRate'] for row in rows),
    }
    passed = all(row['audioPacketsIdentical'] and row['pcmBytesIdenticalAfterLeadingOffset'] for row in rows)
    environment = {
        'ffmpeg': run('ffmpeg', '-version').decode().splitlines()[0],
        'ffprobe': run('ffprobe', '-version').decode().splitlines()[0],
    }
    review = {
        'kind': 'automatic encoded-packet and decoded-PCM comparison',
        'auditoryContentReviewPerformed': False,
        'doesNotProve': ['spoken transcript correctness', 'word or sentence cut completeness',
                         'browser decoder timing equivalence', 'Vietnamese answer correctness'],
    }
    full_report = {'schemaVersion': 1, 'passed': passed, 'environment': environment,
                   'review': review, 'summary': summary, 'tracks': rows}
    manifest_fields = ['trackId', 'file', 'sourceSha256', 'siteSha256', 'sourceBytes', 'siteBytes',
                       'sourceSampleRate', 'sourceChannels', 'sourcePacketCount',
                       'sourcePacketSequenceSha256', 'audioPacketsIdentical',
                       'sourceDecodedSampleFrames', 'siteDecodedSampleFrames',
                       'sourceExtraLeadingSampleFrames', 'sourceTimeFromSiteOffsetSeconds',
                       'sitePcmSha256', 'alignedSourcePcmSha256', 'pcmBytesIdenticalAfterLeadingOffset']
    manifest = {'schemaVersion': 1, 'source': 'user-uploaded RAR, extracted MP3 files',
                'siteDirectory': 'new-hsk1/hsk1/audio', 'passed': passed,
                'environment': environment, 'review': review, 'summary': summary,
                'tracks': [{key: row[key] for key in manifest_fields} for row in rows]}
    write_json(args.full_report, full_report)
    write_json(args.manifest, manifest)
    print(json.dumps({'passed': passed, **summary}, ensure_ascii=False, indent=2))
    return 0 if passed else 1


if __name__ == '__main__':
    try:
        sys.exit(main())
    except subprocess.CalledProcessError as error:
        sys.stderr.write(error.stderr.decode(errors='replace'))
        raise
