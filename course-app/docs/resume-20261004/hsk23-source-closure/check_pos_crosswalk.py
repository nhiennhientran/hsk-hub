"""Compare stored POS categories using declared mappings, without replacing any POS label."""
import collections
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
APP = HERE.parents[2]
RAW_VI = {
    'dt.': '名词', 'đgt.': '动词', 'tt.': '形容词', 'đt.': '代词',
    'phó.': '副词', 'giới.': '介词', 'liên.': '连词', 'trợ.': '助词',
    'số.': '数词', 'lượng.': '量词', 'sl.': '数量词', 'ct.': '叹词',
    'tượng.': '拟声词', 'đtnn.': '能愿动词', 'ttố.': '前缀', 'htố.': '后缀',
}
STORED_ENGLISH = {
    'n.': '名词', 'v.': '动词', 'adj.': '形容词', 'pron.': '代词',
    'adv.': '副词', 'prep.': '介词', 'conj.': '连词', 'aux.': '助词',
    'num.': '数词', 'm.': '量词', 'mod.': '能愿动词', 'suf.': '后缀',
}
CANONICAL_VI = {
    'danh từ': '名词', 'động từ': '动词', 'tính từ': '形容词',
    'đại từ': '代词', 'phó từ': '副词', 'giới từ': '介词',
    'liên từ': '连词', 'trợ từ': '助词', 'số từ': '数词',
    'lượng từ': '量词', 'cụm số lượng': '数量词',
    'động từ năng nguyện': '能愿动词', 'hậu tố': '后缀',
    'danh từ chỉ thời gian': '名词',
}
UNPRINTED_EDITORIAL = {'danh từ riêng', 'cụm từ', 'cụm từ (sách không ghi từ loại)',
                      'từ mô phỏng tiếng cười (sách không ghi từ loại)'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    joined_path = HERE / 'official-vi-source-revision.json'
    joined = json.loads(joined_path.read_text())
    anchors = {a['wordId']: a for a in joined['wordAnchors']}
    rows, issues = [], []
    for path in sorted((APP / 'content/hsk3').glob('lesson-*.json')):
        for word in json.loads(path.read_text())['vocabulary']:
            source = anchors[word['id']]['officialVocabulary']
            raw = source['printedPOSRaw']
            categories = [RAW_VI[x.strip()] for x in raw.split('/')] if raw else []
            stored_category = CANONICAL_VI.get(word['pos'])
            if raw:
                compatible = stored_category in categories
                method = 'canonical-category-is-a-member-of-complete-printed-POS-set'
            else:
                compatible = word['pos'] in UNPRINTED_EDITORIAL
                method = 'no-POS-printed; preserved-editorial-classification'
            if not compatible:
                issues.append({'id': word['id'], 'kind': 'canonical-POS-not-supported-by-declared-mapping'})
            old = word.get('appendixMetadata')
            old_raw = old.get('sourcePos') if old else None
            old_categories = ([STORED_ENGLISH[x.strip()] for x in old_raw.split('/')]
                              if old_raw else [])
            if old is not None and old_categories != categories:
                issues.append({'id': word['id'], 'kind': 'stored-English-POS-set-differs-from-new-official-VI-set'})
            rows.append({
                'wordId': word['id'], 'canonicalVietnameseLabel': word['pos'],
                'canonicalCategoryZh': stored_category, 'officialRawLabel': raw,
                'officialCategoriesZh': categories, 'categoryCompatible': compatible,
                'comparisonMethod': method,
                'storedOriginalEnglishLabel': old_raw,
                'storedOriginalEnglishCategoriesZh': old_categories if old else None,
                'storedEnglishMetadataExists': old is not None,
                'originalEnglishSourceReopened': False,
            })
    result = {
        'schemaVersion': 1, 'status': 'declared-category-comparison; no-label-mutation',
        'sourceEvidenceSha256': sha(joined_path),
        'independentSourceEvidence': joined['independentReview'],
        'mappings': {'officialViLegendPdf186': RAW_VI, 'storedEnglishMetadata': STORED_ENGLISH,
                     'canonicalVietnameseCategories': CANONICAL_VI,
                     'editorialLabelsWhenPOSUnprinted': sorted(UNPRINTED_EDITORIAL)},
        'mappingNotes': [
            'danh từ chỉ thời gian is a preserved editorial subcategory of 名词.',
            'A printed multi-POS entry has one printed number and multiple distinct current stable senses.',
            'The old English labels are read from existing accepted data; this comparison does not reopen their unavailable original pages.',
            'No official POS is inferred for unlabeled expressions or proper names.',
        ],
        'counts': {'stableRows': len(rows), 'printedPOSRows': sum(bool(r['officialRawLabel']) for r in rows),
                   'unprintedPOSRows': sum(not r['officialRawLabel'] for r in rows),
                   'storedEnglishRowsCompared': sum(r['storedEnglishMetadataExists'] for r in rows),
                   'categoryIssues': len(issues)},
        'issues': issues, 'rows': rows,
    }
    (HERE / 'pos-category-crosswalk.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result['counts'], indent=2))
    if issues:
        print(json.dumps(issues, ensure_ascii=False, indent=2))
        raise SystemExit(1)


if __name__ == '__main__':
    main()
