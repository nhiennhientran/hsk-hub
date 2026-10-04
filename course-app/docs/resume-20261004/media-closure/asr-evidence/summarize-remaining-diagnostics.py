#!/usr/bin/env python3
"""Aggregate 9 verified source/raw diagnostics; every result remains unapproved."""
import collections
import hashlib
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
COLLECTION = HERE / 'remaining-run-37219831025'


def read(path):
    return json.loads(path.read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


integrity = read(COLLECTION / 'verified-collection.json')
assert integrity['summary']['originalTracksAndRawRecordsVerified'] == 208
assert integrity['summary']['currentLessonHashMismatches'] == 0
raw_tracks = {track['id']: track for track in integrity['tracks']}
counts, cohorts, candidate_holds = collections.Counter(), {}, collections.Counter()
report = {'schemaVersion': 1, 'runId': integrity['runId'], 'sourceCommit': integrity['sourceCommit'],
          'scope': '26 lessons / 208 original tracks; strict literal diagnostic observations only',
          'verifiedCollectionSHA256': digest(COLLECTION / 'verified-collection.json'),
          'producerSHA256': digest(Path(__file__)), 'sourceTargetCounts': {}, 'targetCohorts': {},
          'batches': [], 'uniqueCandidates': [], 'punctuationOnlyAndStageDirectionSources': [],
          'sourceSentenceCountCorrection': [], 'unresolvedTrackGuards': [], 'productionApprovedClipCount': 0,
          'humanListening': False, 'nativeSpeakerReview': False}
for path in sorted(COLLECTION.glob('*-exact-source-diagnostics.json')):
    diagnostic = read(path)
    assert diagnostic['promotedClipCount'] == 0
    counts.update(diagnostic['sourceTargetCounts'])
    batch = path.name.replace('-exact-source-diagnostics.json', '')
    report['batches'].append({'id': batch, 'file': str(path.relative_to(HERE)), 'sha256': digest(path),
                              'sourceTargetCounts': diagnostic['sourceTargetCounts']})
    for track in diagnostic['tracks']:
        raw_guard = raw_tracks[track['track']['id']]
        raw = read(HERE / raw_guard['rawFile'])
        assert digest(HERE / raw_guard['rawFile']) == track['rawEvidenceSHA256']
        flat, refs = [], {}
        for segment_index, segment in enumerate(raw['rawSegments']):
            for word_index, word in enumerate(segment.get('words') or []):
                refs[(segment_index, word_index)] = len(flat)
                flat.append(word)
        for target in track['targets']:
            counter = cohorts.setdefault(target['unit'], collections.Counter())
            matches = target['exactOccurrences']
            category = ('unmatched' if not matches else 'multiple-observations' if len(matches) > 1 else
                        'unique-wholeword-candidate' if target['uniqueWholeWordOccurrence'] else matches[0]['status'])
            counter[category] += 1
            if target['unit'] == 'line':
                naive = [part.strip() for part in re.split('[。！？!?]', target['zh']) if part.strip()]
                if len(naive) != target['sentenceCount']:
                    report['sourceSentenceCountCorrection'].append({'id': target['id'], 'sourceText': target['zh'],
                                                                   'naivePunctuationCount': len(naive),
                                                                   'CJKSentenceCount': target['sentenceCount'],
                                                                   'reason': 'ellipsis/stage punctuation is not an extra spoken sentence'})
                if target['sentenceCount'] == 0 or re.fullmatch(r'[（(].*[）)]', target['zh']):
                    report['punctuationOnlyAndStageDirectionSources'].append({'id': target['id'], 'sourceText': target['zh'],
                                                                            'status': 'source-domain-review; not a spoken fragment approval'})
            if not target['uniqueWholeWordOccurrence']:
                continue
            match = matches[0]
            indices = [refs[(ref['segment'], ref['word'])] for ref in match['rawWordReferences']]
            selected = [flat[index] for index in indices]
            gaps = [after['start'] - before['end'] for before, after in zip(selected, selected[1:])]
            holds = list(raw_guard['holdReasons'])
            if match['minimumRawProbability'] < .5:
                holds.append('low-probability-below-0.5-retained')
            if any(gap < -.02 for gap in gaps):
                holds.append('overlapping-internal-raw-word-times')
            if max(gaps, default=0) > (.5 if target['unit'] == 'word' else 1.5):
                holds.append('long-internal-raw-gap')
            if indices and set(indices) != set(range(min(indices), max(indices) + 1)):
                holds.append('non-CJK-or-other-raw-token-inside-CJK-candidate')
            if target.get('sentenceCount') == 0 or re.fullmatch(r'[（(].*[）)]', target['zh']):
                holds.append('source-domain-not-an-established-spoken-sentence')
            holds = sorted(set(holds))
            candidate_holds.update(holds)
            report['uniqueCandidates'].append({'id': target['id'], 'unit': target['unit'], 'track': track['track']['id'],
                                              'rawStart': match['rawStart'], 'rawEnd': match['rawEnd'],
                                              'minimumRawProbability': match['minimumRawProbability'],
                                              'diagnosticHoldReasons': holds, 'sourceBoundaryEvidence': 'not generated for this raw collection',
                                              'independentBoundaryReview': False, 'productionApproved': False})
        if raw_guard['holdReasons']:
            report['unresolvedTrackGuards'].append({'id': raw_guard['id'], 'holdReasons': raw_guard['holdReasons'],
                                                   'rawFile': raw_guard['rawFile'], 'rawSHA256': raw_guard['rawSHA256'],
                                                   'invalidOrZeroDurationWordIndices': raw_guard['invalidOrZeroDurationWordIndices'],
                                                   'maximumIdenticalTokenCount': raw_guard['maxIdenticalCJKTokenOccurrences']})
report['sourceTargetCounts'] = dict(counts)
report['sourceTargetCounts']['actualCJKSentenceUnits'] = counts['singleSentenceLines'] + counts['multiSentenceChildren']
report['targetCohorts'] = {unit: dict(counter) for unit, counter in cohorts.items()}
report['summary'] = {'allUniqueLiteralCandidates': len(report['uniqueCandidates']),
                     'uniqueCandidatesWithAdditionalRawRisk': sum(bool(t['diagnosticHoldReasons']) for t in report['uniqueCandidates']),
                     'otherCandidatesAwaitingSourceAndBoundaryReview': sum(not t['diagnosticHoldReasons'] for t in report['uniqueCandidates']),
                     'candidateRawRiskCountsOverlapping': dict(candidate_holds),
                     'distinctWordCandidateRanges': len({(t['track'], t['rawStart'], t['rawEnd']) for t in report['uniqueCandidates'] if t['unit'] == 'word'}),
                     'tracksWithAdditionalRawGuards': len(report['unresolvedTrackGuards']),
                     'productionApprovedClipCount': 0}
assert counts == {'tracks': 208, 'vocabularyEntries': 624, 'lines': 597,
                  'singleSentenceLines': 422, 'multiSentenceChildren': 396}
(COLLECTION / 'diagnostic-summary.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
lines = ['# 26课 / 208轨实际 raw 诊断闭环', '',
         f"正式 run `{integrity['runId']}`，head `{integrity['sourceCommit']}`。9 ZIP/208 原轨及其全量 16k PCM、26 当前教材 JSON 全部 SHA 匹配。模型、26固定依赖、选项、raw 和源比较完整记录均已保存。此批没有生成/批准精切。", '',
         '| 目标层级 | 总数 | 唯一完整 raw 词边界候选 | 未匹配 | 多次观察 | 其他阻断 |',
         '|---|---:|---:|---:|---:|---:|']
for unit, counter in cohorts.items():
    other = sum(n for key, n in counter.items() if key not in ['unique-wholeword-candidate', 'unmatched', 'multiple-observations'])
    lines.append(f"| {unit} | {sum(counter.values())} | {counter['unique-wholeword-candidate']} | {counter['unmatched']} | {counter['multiple-observations']} | {other} |")
lines += ['', '行与子句有父子重叠，1055个 literal 候选不能相加成1055个独立精切。477个词义候选只对应 '+str(report['summary']['distinctWordCandidateRanges'])+' 个不同 raw 范围；同音多词义不能伪计多次朗读。', '',
          '严格 CJK 句子单位为818（422单句行+396多句子句）。旧标点计数823多出的5项是4个“……”行和1个舞台说明的末尾“）”；这不是教材正文缺失或自动删句。舞台说明本身也保留源条目、不得按正文说话片段自动剪裁。', '',
          f"10331个 raw word 中50个零/无效时长涉及23轨；14轨含非CJK语义，3轨同词频>=10，需源语域复核而非直接指称幻觉。{report['summary']['uniqueCandidatesWithAdditionalRawRisk']}个唯一候选有额外raw风险，余下{report['summary']['otherCandidatesAwaitingSourceAndBoundaryReview']}个仍缺逐候选实际声学边界与独立审校。", '',
          '当前全部208轨已有可播原音与诚实整轨/词组回退。未匹配、繁简/专名/数字差、重复、半词、零时长、跨度/语域残差均继续hold；不得据停顿、文字近似或单模型成功自动批准。此批0 production promotion、0真人听辨。', '',
          '## 复核入口', '',
          '- `artifact-download-ledger.json`：实际9 artifact IDs、ZIP路径/SHA与head。ZIP缓存不提交Git。',
          '- `verified-collection.json`：逐原轨/全PCM/26源课SHA/模型版本/原始raw检查结果。',
          '- 各批 `run.json`、`preflight.json`、`source-comparison-input.json`、`pip-freeze.txt`、`pip-install-report.json`、`tracks/*.json`：可保存的真实raw及依赖证据；不提交完整模型或原轨复制。',
          '- 九份 `*-exact-source-diagnostics.json`：严格NFKC+CJK目标比较、原词timestamp引用与残差；不修教材、无词内时间插值。',
          f"- `diagnostic-summary.json`：分层计数、逐候选额外风险、{report['summary']['tracksWithAdditionalRawGuards']}轨级guard、句数修正与原始SHA。", '',
          '```sh', 'python course-app/docs/resume-20261004/media-closure/asr-evidence/verify-remaining-collection.py',
          'python course-app/docs/resume-20261004/media-closure/asr-evidence/summarize-remaining-diagnostics.py', '```', '',
          '重跑首条命令需要尚存的实际ZIP缓存以亲验下载SHA；源track与raw JSON已保留，可另逐轨重新解码比对。后续精切需从此原始观察重新选择小范围、实际裁PCM、独立无prompt模型复核及原中文/相邻内容/边界审校，当前没有扩大原2句独立接受范围。']
(COLLECTION / 'README.md').write_text('\n'.join(lines) + '\n')
print(json.dumps({'sourceTargetCounts': report['sourceTargetCounts'], 'targetCohorts': report['targetCohorts'],
                  'summary': report['summary']}, ensure_ascii=False))
