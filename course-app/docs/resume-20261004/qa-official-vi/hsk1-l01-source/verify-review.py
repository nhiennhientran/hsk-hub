"""Compare frozen author input against independently visually read original PDF.

This verifies recorded observations, not vision: the full four page PNGs and two
original-PDF word-table crops were separately viewed before recording the TSV.
No website content is loaded. Run from any directory with Python 3.
"""
import collections
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
AUTHOR_SHA = 'b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6'
FREEZE_SHA = '622c359f5ff16ee1f2a196da007e50b2ff3fb510b563fa26c75ae6508e347ea6'
PDF_SHA = '99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764'
PREFIX = 'hsk1-official-vi-l01-'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    author_path = ROOT / 'author-input/source-transcription.json'
    freeze_path = ROOT / 'author-input/freeze-manifest.json'
    assert sha(author_path) == AUTHOR_SHA
    assert sha(freeze_path) == FREEZE_SHA
    author = json.loads(author_path.read_text())
    assert author['sourcePDF']['sha256'] == PDF_SHA
    assert author['sourcePDF']['pdfPageCount'] == 148
    assert author['lesson'] == 1
    assert author['pdfPages'] == [17, 18, 19, 20]
    assert author['printedPages'] == ['001', '002', '003', '004']
    source_occurrences = {o['occurrenceId']: o for o in author['occurrences']}
    assert len(source_occurrences) == len(author['occurrences']) == 67
    # These are original-PDF observations, not copied website or generated VI.
    speakers = {
        'pdf017-text-1-line-01': '王一飞', 'pdf017-text-1-line-02': '小语',
        'pdf018-text-2-line-01': '王一飞', 'pdf018-text-2-line-02': '学生们',
        'pdf018-text-2-line-03': '小语', 'pdf018-text-2-line-04': '学生们',
        'pdf019-text-3-line-01': '学生们', 'pdf019-text-3-line-02': '小语',
        'pdf019-text-3-line-03': '王一飞', 'pdf019-text-3-line-04': '学生们',
    }
    media = {
        'pdf017-text-1-read': ('audioPrinted', '1-1'),
        'pdf017-text-1-words': ('audioPrinted', '1-2'),
        'pdf018-text-2-read': ('audioPrinted', '1-3'),
        'pdf018-text-2-words': ('audioPrinted', '1-4'),
        'pdf019-text-3-read': ('audioPrinted', '1-5'),
        'pdf019-text-3-words': ('audioPrinted', '1-6'),
        'pdf020-tongue-heading': ('audioPrinted', '1-7'),
        'pdf020-video-heading': ('videoPrinted', '1-1'),
    }
    renders = json.loads((ROOT / 'render-manifest.json').read_text())
    crops = json.loads((ROOT / 'crop-manifest.json').read_text())
    assert renders['sourcePDFSHA256'] == crops['sourcePDFSHA256'] == PDF_SHA
    assert len(renders['renders']) == 4 and len(crops['crops']) == 2
    for row in renders['renders']:
        image_path = ROOT / 'renders' / Path(row['file']).name
        assert sha(image_path) == row['sha256']
        assert image_path.stat().st_size == row['bytes']
    for row in crops['crops']:
        image_path = ROOT / row['path']
        assert sha(image_path) == row['sha256']
        assert image_path.stat().st_size == row['bytes']
    per_id = []
    seen = set()
    for line in (ROOT / 'independent-reading.tsv').read_text().splitlines():
        suffix, zh, physical_lines = line.split('\t')
        oid = PREFIX + suffix
        assert oid not in seen
        seen.add(oid)
        o = source_occurrences[oid]
        page = int(suffix[3:6])
        printed = f'{page - 16:03d}'
        lines = physical_lines.split('¦')
        expected = {
            'pdfPage': page, 'printedPage': printed,
            'zhContext': zh, 'viText': ' '.join(lines),
            'fragments': [{'pdfPage': page, 'printedPage': printed, 'lineTexts': lines}],
        }
        if suffix in speakers:
            expected['speakerZh'] = speakers[suffix]
        if suffix in media:
            key, value = media[suffix]
            expected[key] = value
        if suffix in ['pdf017-lesson-label', 'pdf019-running-lesson']:
            expected['adjacentNumeralPrinted'] = '1'
        if '-word-' in suffix:
            expected['printOrdinal'] = int(suffix.split('-word-')[1][:2])
        if suffix == 'pdf017-proper-01-gloss':
            expected['printOrdinal'] = 1
        diffs = {key: {'author': o.get(key), 'independentOriginalPDF': value}
                 for key, value in expected.items() if o.get(key) != value}
        per_id.append({
            'occurrenceId': oid,
            'status': 'repair' if diffs else 'accepted',
            'independentOriginalPDFReading': expected,
            'checked': ['original lettering/case/diacritics', 'punctuation',
                        'full physical Vietnamese lines', 'nearby Chinese context',
                        'PDF/printed page identity'] +
                       (['speaker order and role'] if suffix in speakers else []) +
                       (['original media label'] if suffix in media else []),
            'independentRender': f'renders/pdf-{page:03d}-independent.png',
            'differences': diffs,
        })
    missing = sorted(set(source_occurrences) - seen)
    assert not missing
    # All 12 ordinary rows and the separately numbered proper-name row.
    table = [
        (17, 1, 'ordinary', '你好', 'nǐ hǎo', None),
        (17, 1, 'properName', '王老师', 'Wáng lǎoshī', None),
        (18, 2, 'ordinary', '大家', 'dàjiā', 'đt.'),
        (18, 3, 'ordinary', '好', 'hǎo', 'tt.'),
        (18, 4, 'ordinary', '学生', 'xuéshēng', 'dt.'),
        (18, 5, 'ordinary', '们', 'men', 'htố.'),
        (18, 6, 'ordinary', '老师', 'lǎoshī', 'dt.'),
        (18, 7, 'ordinary', '您', 'nín', 'đt.'),
        (18, 8, 'ordinary', '你们', 'nǐmen', 'đt.'),
        (19, 9, 'ordinary', '谢谢', 'xièxie', 'đgt.'),
        (19, 10, 'ordinary', '不客气', 'bú kèqi', None),
        (19, 11, 'ordinary', '同学', 'tóngxué', 'dt.'),
        (19, 12, 'ordinary', '再见', 'zàijiàn', 'đgt.'),
    ]
    keys = ['pdfPage', 'printOrdinal', 'kind', 'zhPrinted', 'pinyinPrinted', 'rawPosLabel']
    assert [[row[key] for key in keys] for row in author['wordTableRows']] == [list(t) for t in table]
    for row in author['wordTableRows']:
        assert row['glossOccurrenceId'] in seen
        if row['rawPosLabel'] is None:
            assert row['posOccurrenceId'] is None
        else:
            assert source_occurrences[row['posOccurrenceId']]['viText'] == row['rawPosLabel']
    counts = collections.Counter(o['category'] for o in author['occurrences'])
    assert dict(counts) == author['coverage']['byCategory']
    assert collections.Counter(o['pdfPage'] for o in author['occurrences']) == {17: 14, 18: 27, 19: 18, 20: 8}
    assert len(speakers) == author['coverage']['dialogueTranslatedLines'] == 10
    assert author['coverage']['ordinaryWordRows'] == 12
    assert author['coverage']['properNameRows'] == 1
    assert author['coverage']['printedPosOccurrences'] == 10
    assert author['coverage']['tongueTwisterTranslatedLines'] == 2
    assert author['coverage']['crossPageViTextFragments'] == 0
    report = {
        'schemaVersion': 1, 'reviewer': 'release_assembly',
        'author': 'hsk23_remaining_source', 'scope': 'HSK1 lesson 1 original-PDF source transcription only',
        'sourcePDF': author['sourcePDF'],
        'frozenAuthorInput': {
            'file': 'author-input/source-transcription.json', 'sha256': AUTHOR_SHA,
            'freezeFile': 'author-input/freeze-manifest.json', 'freezeSHA256': FREEZE_SHA,
        },
        'method': 'Independent direct original-PDF full-page rendering at 3x and 5x word-table crops; all 4 full pages and 2 crops visually read, then literal manual TSV compared. No OCR acceptance and no author-render substitution.',
        'pdfPages': [17, 18, 19, 20], 'printedPages': ['001', '002', '003', '004'],
        'status': 'accepted-source-transcription' if all(r['status'] == 'accepted' for r in per_id) else 'repair-required',
        'counts': {'occurrences': 67, 'accepted': sum(r['status'] == 'accepted' for r in per_id),
                   'repair': sum(r['status'] == 'repair' for r in per_id), 'missing': 0,
                   'ordinaryWordRows': 12, 'properNameRows': 1, 'printedPOS': 10,
                   'dialogueTranslations': 10, 'tongueTwisterTranslations': 2},
        'coverage': {'byPDFPage': {'17': 14, '18': 27, '19': 18, '20': 8},
                     'byCategory': dict(counts),
                     'missingPrintedVietnamese': [],
                     'crossPageVietnamese': 'No Vietnamese occurrence continues across pages in this lesson; dialogue boxes and tip end on their respective pages.',
                     'noPrintedVietnameseAreas': [
                         'No separate grammar section appears in lesson 1.',
                         'Chinese/pinyin speech bubbles and avatar labels are paired with the dedicated Vietnamese translation boxes; no extra inline Vietnamese is printed.',
                         'Photo AI生成合成 mark, audio/video numbers, media control icons and video blackboard 你好/pinyin have no extra Vietnamese gloss.',
                     ]},
        'printedSpellingsPreserved': ['Bài khoá 1', 'Bài khoá 2', 'Bài khoá 3', 'tốt, khoẻ', 'htố.'],
        'wordTables': {'status': 'accepted', 'rows': [dict(zip(keys, t)) for t in table],
                       'blankOriginalPOS': ['你好', '王老师', '不客气'],
                       'note': 'Printed raw POS and empty cells retained; no inference from modern dictionaries or runtime POS.'},
        'roles': {'status': 'accepted', 'note': 'Vương Nhất Phi is the woman teacher: cô Vương / cô ạ / các em follow printed dialogue boxes. 学生们 maps to Học sinh and 小语 to Tiểu Ngữ in the 10 printed translations.'},
        'renderManifest': {'file': 'render-manifest.json', 'sha256': sha(ROOT / 'render-manifest.json')},
        'cropManifest': {'file': 'crop-manifest.json', 'sha256': sha(ROOT / 'crop-manifest.json')},
        'independentReading': {'file': 'independent-reading.tsv', 'sha256': sha(ROOT / 'independent-reading.tsv')},
        'websiteOldVietnameseRead': False, 'authorFilesModified': False,
        'runtimeActivation': 'none', 'websiteVietnameseAuditComplete': False,
        'perOccurrence': per_id,
    }
    (ROOT / 'review.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    assert report['status'] == 'accepted-source-transcription', json.dumps([r for r in per_id if r['differences']], ensure_ascii=False)
    print(json.dumps({'status': report['status'], 'counts': report['counts'],
                      'reviewSHA256': sha(ROOT / 'review.json')}, ensure_ascii=False))


if __name__ == '__main__':
    main()
