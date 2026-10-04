#!/usr/bin/env python3
"""Read one actual CI Playwright report and independently inspect its raw attachments.

This accepts neither screenshots as playback evidence nor planned tests as passed.
Run from the repository root. No production files or media approvals are modified.
"""
import argparse
import base64
import hashlib
import json
import math
import subprocess
from pathlib import Path

FIXTURE_SHA = '09c03fd071b8d416723f2bf52205d475ac43ad768cc115a4489ad41a1fe9e867'
CONFIG_SHA = 'fe7ac3c287bb1135b819979cab0845d4ba0d25f62f8a38c2ed5c1ef707a672cd'
IDS = ['hsk2-fltrp-2026:l04:text2:line3', 'hsk2-fltrp-2026:l05:text2:line8:sentence2']
OTHER_TITLES = [
    'whole-track color retains its honest pending independent-word label',
    'failed new checksum leaves legacy accepted clips and new whole-track fallback available',
]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def git_bytes(commit, name):
    return subprocess.check_output(['git', 'show', f'{commit}:{name}'])


def specs(suites):
    for suite in suites:
        yield from suite.get('specs', [])
        yield from specs(suite.get('suites', []))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--project', choices=['chromium', 'webkit'], required=True)
    parser.add_argument('--source-commit', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    checks = []

    def check(name, passed, detail=None):
        checks.append({'check': name, 'passed': bool(passed), 'detail': detail})

    fixture = git_bytes(args.source_commit, 'course-app/tests/unified/reviewed-sentence-subset.spec.ts')
    config = git_bytes(args.source_commit, 'course-app/playwright.reviewed-sentences.config.ts')
    check('frozen fixture bytes', digest(fixture) == FIXTURE_SHA, digest(fixture))
    check('frozen config bytes', digest(config) == CONFIG_SHA, digest(config))
    source_bytes = git_bytes(args.source_commit, 'course-app/content/audio-segments-hsk2-reviewed-sentences.json')
    source = json.loads(source_bytes)
    segments = dict(source['lines'], **source['subsegments'])
    check('only two previously signed runtime IDs', sorted(segments) == sorted(IDS), sorted(segments))
    original = args.report.read_bytes()
    report = json.loads(original)
    (args.output / 'browser-results.json').write_bytes(original)
    check('no global report errors', not report.get('errors'), report.get('errors'))
    stat = report['stats']
    check('exact actual four passed, no skipped/flaky/unexpected',
          (stat['expected'], stat['skipped'], stat['unexpected'], stat['flaky']) == (4, 0, 0, 0), stat)
    check('one worker', report['config']['workers'] == 1, report['config']['workers'])
    expected_titles = {f'guarded source-frame {i} plays its exact original range and retains fallback' for i in IDS} | set(OTHER_TITLES)
    actual_specs = list(specs(report['suites']))
    check('exact four fixture titles, no duplicates',
          len(actual_specs) == 4 and {s['title'] for s in actual_specs} == expected_titles,
          [s['title'] for s in actual_specs])
    attachment_rows = []
    case_rows = []
    for spec in actual_specs:
        tests = spec.get('tests', [])
        check(f"one actual project: {spec['title']}", len(tests) == 1 and tests[0]['projectName'] == args.project,
              [t.get('projectName') for t in tests])
        if len(tests) != 1:
            continue
        test = tests[0]
        results = test.get('results', [])
        passed = test.get('status') == 'expected' and test.get('expectedStatus') == 'passed' and len(results) == 1 and results[0].get('status') == 'passed' and results[0].get('retry', 0) == 0
        check(f"passed without retry: {spec['title']}", passed)
        row = {'title': spec['title'], 'project': args.project, 'passed': passed,
               'actualStatus': [r.get('status') for r in results]}
        case_rows.append(row)
        if len(results) != 1:
            continue
        result = results[0]
        check(f"no test errors: {spec['title']}", not result.get('errors'), result.get('errors'))
        attachments = {}
        for attachment in result.get('attachments', []):
            check(f"embedded JSON attachment: {attachment['name']}",
                  attachment.get('contentType') == 'application/json' and 'body' in attachment)
            if attachment.get('contentType') != 'application/json' or 'body' not in attachment:
                continue
            data = base64.b64decode(attachment['body'], validate=True)
            value = json.loads(data)
            check(f"unique attachment name: {attachment['name']}", attachment['name'] not in attachments)
            attachments[attachment['name']] = value
            name = f'{digest(data)}.json'
            (args.output / name).write_bytes(data)
            attachment_rows.append({'title': spec['title'], 'name': attachment['name'], 'file': name,
                                    'sha256': digest(data), 'bytes': len(data)})
        ids = [i for i in IDS if i in spec['title']]
        if not ids:
            row['scope'] = 'passed DOM assertions only; this case does not play an audio track'
            continue
        target_id = ids[0]
        check(f'{target_id}: actual natural and full native attachments',
              set(attachments) == {target_id, 'actual-native-audio-events'}, sorted(attachments))
        if target_id not in attachments or 'actual-native-audio-events' not in attachments:
            continue
        segment = segments[target_id]
        first = attachments[target_id]
        check(f'{target_id}: raw attachment ID, source time and fixed integer frames',
              first.get('id') == target_id and first.get('start') == segment['start'] and
              first.get('end') == segment['end'] and first.get('frames') == segment['guardedEvidence']['sourceSampleRange'])
        check(f'{target_id}: exact 16k source-frame clock',
              segment['start'] * 16000 == first['frames'][0] and
              abs(segment['end'] * 16000 - first['frames'][1]) < 0.0000001)
        natural = first['events']
        full = attachments['actual-native-audio-events']
        check(f'{target_id}: native event lists present', isinstance(natural, list) and bool(natural) and isinstance(full, list) and bool(full))
        check(f'{target_id}: natural source URL is only bound original MP3',
              all(str(e.get('source', '')).endswith('/' + segment['track']) for e in natural))
        check(f'{target_id}: no native media errors', not any(e.get('event') == 'error' for e in full))
        check(f'{target_id}: natural trace retained in later native attachment', full[:len(natural)] == natural)
        audible = [e for e in natural if not e.get('muted') and not e.get('seeking') and
                   e.get('event') in ['playing', 'pause', 'timeupdate', 'seeked', 'volumechange'] and
                   str(e.get('source', '')).endswith(segment['track'])]
        times = [float(e['time']) for e in audible]
        check(f'{target_id}: native unmuted nonseeking observations exist', bool(times) and all(math.isfinite(t) for t in times))
        if times:
            check(f'{target_id}: actual natural audible lower bound', min(times) >= segment['start'] - 0.08, min(times))
            check(f'{target_id}: actual natural audible upper bound', max(times) <= segment['end'] + 0.16, max(times))
        check(f'{target_id}: observed audible playing state', any(e.get('ui') == 'playing' and not e.get('paused') for e in audible))
        check(f'{target_id}: native paused at segment ended',
              any(e.get('paused') and e.get('ui') == 'ended' and abs(float(e['time']) - segment['end']) <= 0.16 for e in audible))
        row.update({'runtimeId': target_id, 'sourceTrack': segment['track'], 'sourceFrames': first['frames'],
                    'start': segment['start'], 'end': segment['end'], 'naturalEvents': len(natural),
                    'fullNativeEvents': len(full), 'naturalAudibleMin': min(times) if times else None,
                    'naturalAudibleMax': max(times) if times else None,
                    'sourceOrdinal': 2 if target_id.endswith(':sentence2') else 1,
                    'assertionScope': 'fixed fixture passed bilingual ordinal, complete-text fallback, no L5 precise parent/sibling, seek clamp, stop, route stop and history restoration; raw traces independently inspected for natural playback',
                    'nativeEventsAreHumanListening': False})
    summary = {'schemaVersion': 1, 'status': 'passed' if checks and all(c['passed'] for c in checks) else 'failed',
               'sourceCommitLocalEquivalent': args.source_commit, 'actualProject': args.project,
               'reportSHA256': digest(original), 'reportBytes': len(original), 'actualStats': stat,
               'inputFixtureSHA256': digest(fixture), 'inputConfigSHA256': digest(config),
               'inputSubsetSHA256': digest(source_bytes), 'checks': checks, 'cases': case_rows,
               'attachments': attachment_rows, 'checksPassed': sum(c['passed'] for c in checks),
               'checksTotal': len(checks), 'newAudioApproval': False, 'humanListeningCertification': False,
               'scopeLimit': 'Exact existing two machine-reviewed clips and fallback/runtime behavior only. A fresh dedicated preview build is used; this is not the assembled-package playback test. Delayed-digest concurrency is historical independent loader plus current CI unit coverage, not a new browser race stimulus.'}
    (args.output / 'verification.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: summary[k] for k in ['status', 'actualProject', 'reportSHA256', 'checksPassed', 'checksTotal']}))
    for failed in [c for c in checks if not c['passed']]:
        print(json.dumps(failed, ensure_ascii=False))
    raise SystemExit(0 if summary['status'] == 'passed' else 1)


if __name__ == '__main__':
    main()
