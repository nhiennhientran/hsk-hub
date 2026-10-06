#!/usr/bin/env python3
"""Bind explicit independent decisions to immutable eligible actual-crop reports.

This does not infer acceptance, change runtime authority, or claim human/tone/
device certification. Only explicit per-ID contextual proof may resolve text
holds; other held identity/boundary/model evidence cannot pass.
"""
import argparse
from collections import Counter
import datetime as dt
import hashlib
import json
from pathlib import Path
import sys

TEXT_REVIEW_HOLDS = {
    'crop-ASR-Chinese-differs-from-source-needs-phonetic-or-glyph-review',
    'crop-ASR-meaningful-Roman-or-numeric-source-unit-not-proven',
    'crop-ASR-foreign-lexical-token-or-digit-needs-explicit-review',
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def contextual_decision(row, decision, root):
    """An explicit independent per-ID review can resolve only text holds."""
    resolved = set(decision.get('resolvedTextHolds', []))
    if not resolved or resolved != set(row['holds']) or not resolved <= TEXT_REVIEW_HOLDS:
        raise ValueError('only the exact explicit per-ID text holds can be resolved')
    proof = decision.get('sourceContextEvidence', {})
    for key, expected in [('sourceText', row['sourceZH']), ('sourceTrack', row['sourceTrack']),
                          ('sourceSHA256', row['sourceSHA256']), ('sourcePCM_SHA256', row['sourcePCM_SHA256']),
                          ('sourceSampleRange16k', row['sourceSampleRange16k']), ('cropPCM_SHA256', row['cropPCM_SHA256'])]:
        if proof.get(key) != expected:
            raise ValueError('source-context decision identity is not the actual reviewed crop: ' + key)
    for key in ('wholeSourceGroupUnpromptedASRReviewed', 'sourceOrderChecked', 'neighborSpeechExcluded',
                'actualCropBoundariesChecked', 'phoneticEquivalenceIsAuxiliaryOnly'):
        if proof.get(key) is not True:
            raise ValueError('source-context decision lacks explicit independent check: ' + key)
    if row['unit'] == 'word' and proof.get('originalRepeatedReadingsChecked') is not True:
        raise ValueError('word source-context review must check original repeated readings')
    if not proof.get('explanation') or not proof.get('rawDifferences'):
        raise ValueError('source-context review must retain raw differences and explain the decision')
    if row.get('sourcePinyin') and not proof.get('sourcePinyin'):
        raise ValueError('phonetic source context must retain actual source pinyin')
    group = proof.get('sourceGroupEvidence', {})
    path = Path(group.get('file', ''))
    path = path if path.is_absolute() else root / path
    if not path.is_file() or group.get('sha256') != digest(path):
        raise ValueError('actual whole-source-group ASR file and SHA are required')
    raw = json.loads(path.read_text())
    group_pcm = raw.get('cropPCM_SHA256', raw.get('track', {}).get('pcm', {}).get('sha256'))
    if group_pcm != row['sourcePCM_SHA256']:
        raise ValueError('whole-source-group ASR is not bound to the actual original decoded PCM')
    options = raw.get('options', {})
    if any(options.get(key) is not None for key in ('initial_prompt', 'prefix', 'hotwords')) or options.get('condition_on_previous_text') is not False:
        raise ValueError('whole-source-group evidence must be unprompted')
    return proof


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--report', required=True, type=Path)
    p.add_argument('--decisions', required=True, type=Path)
    p.add_argument('--output', required=True, type=Path)
    p.add_argument('--repo-root', type=Path, default=Path.cwd())
    args = p.parse_args()
    report = json.loads(args.report.read_text())
    decisions = json.loads(args.decisions.read_text())
    if decisions.get('reviewReportSHA256') != digest(args.report):
        raise ValueError('explicit decisions must pin actual review report SHA256')
    selected, rejected, seen = [], [], set()
    for d in decisions['decisions']:
        key = (d['id'], tuple(d['sourceSampleRange16k']))
        if d['id'] in seen:
            raise ValueError('more than one final decision for a target ID')
        seen.add(d['id'])
        matches = [r for r in report['targets'] if r['id'] == key[0] and tuple(r.get('sourceSampleRange16k', [])) == key[1]]
        if len(matches) != 1:
            raise ValueError('explicit decision target/frame binding is absent or ambiguous')
        row = matches[0]
        if d['decision'] == 'hold':
            rejected.append(dict(d, reportHolds=row['holds']))
            continue
        if d['decision'] != 'accept':
            raise ValueError('decision must be accept or hold')
        context_proof = contextual_decision(row, d, args.repo_root.resolve()) if row['holds'] else None
        if not row['holds'] and row['status'] != 'machine-evidence-complete-awaiting-independent-decision':
            raise ValueError('incomplete crop cannot be accepted by decision compiler')
        if not d.get('rationale') or d.get('sourceContextChecked') is not True:
            raise ValueError('acceptance requires explicit source-context review and rationale')
        if set(d.get('acknowledgedFlags', [])) != set(row['flags']):
            raise ValueError('low-confidence or other review flags must be acknowledged exactly')
        if any(d.get(k, False) for k in ('humanListening', 'nativeSpeakerReview', 'pronunciationToneCertified', 'devicePlaybackCertified')):
            raise ValueError('unsupported certification in machine-only review decision')
        models = row['rawModelEvidence']
        if len({(e['modelRepository'], e['modelRevision']) for e in models}) < 2 or any(set(e['holds']) - TEXT_REVIEW_HOLDS for e in models):
            raise ValueError('actual crop evidence needs distinct model snapshots with complete gates')
        decision_id = hashlib.sha256(json.dumps({'report': digest(args.report), 'decision': d}, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        selected.append({**row, 'status': 'accepted-independent-machine-source-frame-review',
                         'productionApproved': False, 'independentDecision': d,
                         'resolvedTextHolds': sorted(row['holds']), 'sourceContextDecisionEvidence': context_proof,
                         'sourceText': row['sourceZH'], 'readingCount': row.get('expectedReadingCount', 1),
                         'sourceLessonFile': row['canonicalSource']['file'],
                         'sourceLessonSHA256': row['canonicalSource']['sha256'],
                         'sourceJSONPointer': row['canonicalSource']['sourceJSONPointer'],
                         'reviewDecisionId': decision_id,
                         'method': 'independently-reviewed-unprompted-multi-model-actual-crop+source-frame-guards',
                         'rawEvidenceUnchanged': True, 'reviewReportSHA256': digest(args.report)})
    result = {'schemaVersion': 1, 'reviewer': 'independent audio reviewer',
              'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
              'reviewReportSHA256': digest(args.report), 'explicitDecisionsSHA256': digest(args.decisions),
              'decisionCompilerSHA256': digest(Path(__file__)),
              'acceptedFragmentIds': [r['id'] for r in selected],
              'acceptedSourceFrameGates': selected, 'explicitHeldDecisions': rejected,
              'acceptedCountsByUnit': dict(Counter(r['unit'] for r in selected)),
              'allOtherReportTargetsRemainUnapproved': True,
              'humanListening': False, 'nativeSpeakerReview': False,
              'pronunciationToneCertified': False, 'devicePlaybackCertified': False,
              'runtimeModified': False, 'publicationPerformed': False}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + '\n')
    print(json.dumps({'acceptedIds': len(selected), 'explicitHeld': len(rejected)}, ensure_ascii=False))


if __name__ == '__main__':
    sys.exit(main())
