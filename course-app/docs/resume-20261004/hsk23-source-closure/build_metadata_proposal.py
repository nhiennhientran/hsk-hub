"""Generate a guarded, data-only integration proposal; never mutate lesson files."""
import copy
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
APP = HERE.parents[2]
SOURCE = HERE / 'official-vi-source-revision.json'
REVISION_ID = 'hsk3-official-vi-20261004'

POS_CATEGORIES = {
    'dt.': '名词', 'đgt.': '动词', 'tt.': '形容词', 'đt.': '代词',
    'phó.': '副词', 'giới.': '介词', 'liên.': '连词', 'trợ.': '助词',
    'số.': '数词', 'lượng.': '量词', 'sl.': '数量词', 'ct.': '叹词',
    'tượng.': '拟声词', 'đtnn.': '能愿动词', 'ttố.': '前缀', 'htố.': '后缀',
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def anchor(page, printed, section):
    return {'pdfPage': page, 'printedPage': printed, 'section': section,
            'provenance': 'textbook'}


def build_proposal():
    source = json.loads(SOURCE.read_text())
    if source['structuralIssues']:
        raise ValueError('The source join has unresolved structural issues')
    anchors = {item['wordId']: item for item in source['wordAnchors']}
    registry = copy.deepcopy(source['sourceRevision'])
    registry.update({
        'posLegend': {
            'source': anchor(186, 174, '词语表：词类缩写说明'),
            'printedLanguage': 'vi', 'rawLabelToChineseCategory': POS_CATEGORIES,
        },
        'sourceAudit': {
            'authorStatus': 'visual-reviewed',
            'independentStatus': source['reviewStatus']['independent'],
            'scope': 'Chinese, pinyin, printed number, POS, glossary page, lesson numbers and stars',
            'vietnameseGlossAlignment': 'deferred-to-Phase-B',
            'independentEvidence': source['independentReview'],
        },
    })
    plans, issues = [], []
    for path in sorted((APP / 'content/hsk3').glob('lesson-*.json')):
        relative = str(path.relative_to(APP))
        lesson = json.loads(path.read_text())
        if 'additionalSourceRevisions' in lesson:
            raise ValueError(f'Reserved field already exists: {relative}')
        plan = {
            'jsonFile': relative, 'expectedFileSha256': sha(path),
            'lessonId': lesson['id'],
            'registryOperation': {
                'operation': 'add', 'jsonPointer': '/additionalSourceRevisions',
                'expected': {'exists': False}, 'value': [copy.deepcopy(registry)],
            },
            'wordOperations': [],
        }
        for index, word in enumerate(lesson['vocabulary']):
            if 'additionalSourceEvidence' in word:
                raise ValueError(f'Reserved word field already exists: {word["id"]}')
            item = anchors[word['id']]
            row, glossary = item['officialVocabulary'], item['officialGlossary']
            if item['preservedCourseSource'] != word['source']:
                issues.append({'id': word['id'], 'issue': 'original course source changed'})
            if item['preservedAppendixSource'] != word.get('appendixSource'):
                issues.append({'id': word['id'], 'issue': 'original appendix source changed'})
            raw_pos = row['printedPOSRaw']
            categories = [POS_CATEGORIES[p.strip()] for p in raw_pos.split('/')] if raw_pos else []
            if categories != (row['posCategory'] or []):
                issues.append({'id': word['id'], 'issue': 'POS legend/category mismatch'})
            value = {
                'sourceRevisionId': REVISION_ID,
                'vocabulary': {
                    'source': anchor(row['pdfPage'], row['printedPage'],
                                     f'课文{row["sourceText"]}：生词与专有名词'),
                    'headword': row['zh'], 'printedPinyin': row['printedPinyin'],
                    'normalizedPinyin': row['normalizedPinyin'],
                    'printedNumber': row['printedNumber'], 'sourceList': row['sourceList'],
                    'printedPOSRaw': raw_pos, 'printedPOSLanguage': 'vi',
                    'posPrinted': raw_pos is not None, 'posCategoriesZh': categories,
                    'posScope': 'complete-printed-entry-POS-set; current stable senses remain distinct',
                },
                'glossary': {
                    'source': anchor(glossary['pdfPage'], glossary['printedPage'], '词语表'),
                    'headword': glossary['headword'],
                    'printedPinyin': glossary['printedPinyin'],
                    'lessonNumbers': glossary['lessonNumbers'],
                    'rawStarred': glossary['rawStarred'],
                },
            }
            variants = [v for v in source['sourceVariants'] if v['id'] == word['id']]
            if variants:
                value['preservedCourseDifferences'] = variants
            plan['wordOperations'].append({
                'operation': 'add', 'wordId': word['id'],
                'jsonPointer': f'/vocabulary/{index}/additionalSourceEvidence',
                'expected': {'exists': False}, 'expectedWord': copy.deepcopy(word),
                'value': [value],
            })
        plans.append(plan)
    if issues:
        raise ValueError(json.dumps(issues, ensure_ascii=False))
    total = sum(len(p['wordOperations']) for p in plans)
    if total != 523 or len(plans) != 18:
        raise ValueError('Incomplete current course coverage')
    result = {
        'schemaVersion': 1,
        'proposalStatus': ('not-applied; source-evidence-independently-accepted'
                           if source['reviewStatus']['independent'] == 'accepted-source-evidence'
                           else 'not-applied; full-independent-source-review-pending'),
        'strategy': 'additional source registries and word evidence in actual lesson JSON; preserve all existing fields',
        'sourceEvidenceFile': str(SOURCE.relative_to(APP)),
        'sourceEvidenceSha256': sha(SOURCE),
        'sourceInputSha256': source['inputSha256'],
        'independentReview': source['independentReview'],
        'sourceRevisionId': REVISION_ID,
        'sourceSha256': source['sourceRevision']['sha256'],
        'oldSourceSha256': source['sourceRevision']['originalChinesePdfSha256'],
        'counts': {'lessonRegistries': len(plans), 'wordEvidenceAdditions': total,
                   'originalMissingAppendixSource': 306,
                   'originalMissingNumberPosMetadata': 349,
                   'originalMissingNumberPosSource': 523},
        'preservationGuards': {
            'canonicalLexiconSha256': sha(APP / 'content/hsk3-lexicon.json'),
            'wholeLessonFileGuardRequired': True,
            'wholeWordEqualityGuardRequired': True,
            'originalKeysMayNotBeReplaced': True,
            'originalEnglishAppendixRevalidated': False,
            'vietnameseTranslationsMayNotBeChanged': True,
        },
        'postIntegrationAssertions': [
            'All 18 lesson registries identify the uploaded official VI SHA explicitly.',
            'All 523 stable word IDs have one additional-source vocabulary and glossary anchor.',
            'Removing the two new metadata fields restores every original lesson JSON object exactly.',
            'HSK3 canonical lexicon file bytes stay unchanged.',
            'Old source and metadata coverage stay 217/174/0; new official coverage is separately 523/523/523.',
            'Raw printed POS and raw source variations are preserved without canonical value replacement.',
        ],
        'lessons': plans,
    }
    return result


def main():
    result = build_proposal()
    destination = HERE / 'official-vi-metadata-proposal.json'
    destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'proposal': str(destination.relative_to(APP)),
                      'sha256': sha(destination), 'counts': result['counts'],
                      'courseFilesChanged': False}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
