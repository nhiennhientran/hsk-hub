#!/usr/bin/env python3
"""Materialize the nine explicitly reviewed original spoken source decisions."""
import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DOC = ROOT / 'course-app/docs/final-quality-20261006'
SOURCES = {
    'first6-independent-source-context-explicit-decisions.json': '19e17b794db2bf709962277ca76b1c867f5f45b049405b8135bb7f639df656ce',
    'background3-independent-source-context-explicit-decisions.json': '7396cf235561bc5918335b8c217f86ed68de0af0fd62e0c26b846e16210f7014',
}
EXPECTED = {
    'hsk3-fltrp-2026:l01:text4:line4': [518400, 601280],
    'hsk3-fltrp-2026:l02:text1:line2': [108800, 167360],
    'hsk3-fltrp-2026:l04:text2:line3': [143040, 174080],
    'hsk3-fltrp-2026:l05:text1:line5:sentence2': [345439, 391201],
    'hsk3-fltrp-2026:l06:text2:line7:sentence1': [461120, 496641],
    'hsk3-fltrp-2026:l07:text4:line4': [475519, 572160],
    'hsk3-fltrp-2026:l10:text3:line3': [192640, 287680],
    'hsk3-fltrp-2026:l12:text2:line3:sentence1': [158720, 172480],
    'hsk3-fltrp-2026:l18:text2:line1:sentence1': [6559, 37281],
}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def ref(path):
    return {'file': str(path.relative_to(ROOT)), 'sha256': sha(path)}

def main():
    groups, seen = {}, set()
    for name, expected_sha in SOURCES.items():
        path = DOC / 'audio-context-peer-hsk3-remaining-spoken' / name
        assert sha(path) == expected_sha
        doc = json.loads(path.read_text())
        for supplied in doc['decisions']:
            decision = copy.deepcopy(supplied)
            assert decision['id'] in EXPECTED and decision['id'] not in seen
            assert decision['sourceSampleRange16k'] == EXPECTED[decision['id']]
            assert decision['decision'] == 'accept'
            report = decision['sourceReportEvidence']
            assert sha(ROOT / report['file']) == report['sha256']
            decision['independentCentralSourceReview'] = {
                'reviewer': 'check_screenshot',
                'peerDecisionEvidence': ref(path),
                'actualCurrentSourceCropAndCompleteOriginalPlotsRead': True,
                'actualLocalizedPhasePlotRead': True,
                'scope': 'This exact original utterance and integer crop; source printed names, core phonemes and neighboring utterances independently reviewed. Actual model spellings and diagnostics retained; no tone/native/full-phoneme certification.',
            }
            groups.setdefault(report['file'], []).append(decision)
            seen.add(decision['id'])
    assert seen == set(EXPECTED)
    for i, (report, decisions) in enumerate(sorted(groups.items()), 1):
        output = DOC / 'audio-review' / f'hsk3-nine-spoken-source-independent-decisions-{i:02d}.json'
        result = {'schemaVersion': 1, 'reviewer': 'check_screenshot',
                  'reviewReportSHA256': sha(ROOT / report), 'reviewReportEvidence': ref(ROOT / report),
                  'scriptEvidence': ref(Path(__file__).resolve()), 'decisions': decisions,
                  'humanListening': False, 'nativeSpeakerReview': False,
                  'pronunciationToneCertified': False, 'devicePlaybackCertified': False,
                  'fullPhonemeCertification': False}
        data = (json.dumps(result, ensure_ascii=False, indent=2) + '\n').encode()
        if output.exists():
            assert output.read_bytes() == data
        else:
            output.write_bytes(data)
        print(json.dumps({'file': str(output.relative_to(ROOT)), 'sha256': sha(output),
                          'report': report, 'decisions': len(decisions)}))

if __name__ == '__main__':
    main()
