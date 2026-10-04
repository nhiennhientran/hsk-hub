#!/usr/bin/env python3
"""Independently inspect actual post-repair Chromium reports, not audio listening."""
import base64
import hashlib
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
APP = HERE.parents[2]
REPORT = APP / '.repro-output/media-reviewed-subset/browser-results.json'
EXPECTED_SHA = '440920105bce54d604e0fad0f8f3445b886e5d1733eb789879f186d5ca0cc7bd'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(REPORT) == EXPECTED_SHA
d = json.loads(REPORT.read_text())
assert d['stats']['expected'] == 4 and d['stats']['unexpected'] == 0
assert d['stats']['skipped'] == 0 and d['stats']['flaky'] == 0 and not d.get('errors')
subset = json.loads((APP / 'content/audio-segments-hsk2-reviewed-sentences.json').read_text())
ids = subset['acceptedRuntimeFragmentIds']
actual_tests = []


def suites(items):
    for item in items:
        yield from item.get('specs', [])
        yield from suites(item.get('suites', []))


observations = []
for spec in suites(d['suites']):
    for test in spec['tests']:
        assert test['projectName'] == 'chromium' and test['status'] == 'expected'
        assert len(test['results']) == 1 and test['results'][0]['status'] == 'passed'
        result = test['results'][0]
        actual_tests.append({'title': spec['title'], 'project': test['projectName'],
                             'status': result['status'], 'durationMs': result['duration']})
        for attachment in result.get('attachments', []):
            if attachment['name'] not in ids:
                continue
            a = json.loads(base64.b64decode(attachment['body']))
            segment = subset['lines'].get(a['id'], subset['subsegments'].get(a['id']))
            assert a['start'] == segment['start'] and a['end'] == segment['end']
            assert a['frames'] == segment['guardedEvidence']['sourceSampleRange']
            assert a['events'] and not any(e['event'] == 'error' for e in a['events'])
            assert all(e['source'].endswith(segment['track']) for e in a['events'])
            # Playback initialization at time zero is muted. The observer calls
            # the original native HTMLMediaElement.play, never replaces playback.
            unmuted = [e for e in a['events'] if not e['muted'] and not e['seeking']]
            playing = [e for e in unmuted if e['event'] == 'playing']
            pauses = [e for e in unmuted if e['event'] == 'pause' and e['ui'] == 'ended']
            assert playing and pauses
            assert playing[0]['time'] >= segment['start'] - .01
            assert abs(playing[0]['time'] - segment['start']) <= .03
            assert abs(pauses[-1]['time'] - segment['end']) <= .03
            assert max(e['time'] for e in unmuted) <= segment['end'] + .03
            observations.append({'id': a['id'], 'track': segment['track'], 'eventCount': len(a['events']),
                                 'firstUnmutedPlayingTime': playing[0]['time'],
                                 'endedPauseTime': pauses[-1]['time'],
                                 'requestedStart': a['start'], 'requestedEnd': a['end'],
                                 'sourceFrames16k': a['frames'],
                                 'maximumUnmutedObservedTime': max(e['time'] for e in unmuted),
                                 'errors': 0, 'status': 'native events consistent with fixed requests'})
assert len(actual_tests) == 4 and {o['id'] for o in observations} == set(ids)
assert any('color' in t['title'] for t in actual_tests)
assert any('failed new checksum' in t['title'] for t in actual_tests)
dist = APP / '.repro-output/media-reviewed-subset/dist'
index = dist / 'index.html'
entry = re.search(r'<script[^>]+src="([^\"]+)"', index.read_text()).group(1)
bundle = dist / entry.removeprefix('./')
text = bundle.read_text()
assert bundle.name == 'index-DHIMbq_c.js'
assert '5fde9de3374e597ecd7cffaf84223288f51ad6d1c48c41c109374cdefcb4869b' in text
assert "../content/audio-segments-hsk2-reviewed-sentences.json`?t.push(r)" in text
assert '.finally(()=>{Ce=void 0})' in text
assert (APP/'src/segments.ts').stat().st_mtime < index.stat().st_mtime
assert index.stat().st_mtime < REPORT.stat().st_mtime
(HERE / 'partial-overlay-native-chromium-results.json').write_bytes(REPORT.read_bytes())
summary = {'status': 'actual post-final-loader Chromium evidence independently accepted within the stated scope',
           'rawReportSHA256': EXPECTED_SHA, 'actualNativeCases': 4,
           'sourceLoaderSHA256': sha(APP / 'src/segments.ts'),
           'fixtureSHA256': sha(APP / 'tests/unified/reviewed-sentence-subset.spec.ts'),
           'configSHA256': sha(APP / 'playwright.reviewed-sentences.config.ts'),
           'testedBuildEntry': str(bundle.relative_to(APP)), 'testedBuildEntrySHA256': sha(bundle),
           'startTime': d['stats']['startTime'], 'durationMs': d['stats']['duration'],
           'tests': actual_tests, 'observations': observations,
           'scope': ['two original MP3 source ranges: native seek/play/stop',
                     'replay, seek to end, explicit stop, lesson navigation and back assertions in passed fixture',
                     'source ordinal2, no sibling/parent precision and complete-text fallback button availability',
                     'color has whole-vocabulary-track button and pending independent-word label',
                     'bad new checksum hides both new clips and preserves old accepted-word button'],
           'limitations': ['Chromium desktop only; local WebKit not run',
                           'headless browser events do not certify physical devices or audible pronunciation',
                           'fallback availability assertions do not claim a new full-track listening test',
                           'no human/native-speaker/tone listening certification',
                           'browser clock sampling is not a proof of sample-perfect hardware playback']}
(HERE / 'partial-overlay-native-observation.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'actualNativeCases': 4, 'observations': observations}, ensure_ascii=False))
