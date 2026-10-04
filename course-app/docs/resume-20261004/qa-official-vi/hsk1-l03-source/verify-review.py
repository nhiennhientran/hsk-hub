"""Reverify independent manual original-PDF readings against frozen source input.

The script does not perform visual QA. The reviewer separately viewed every
original-PDF render before recording independent-reading.tsv/observations.json.
No website material or author images are read by this script.
"""
import collections
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PDF_SHA = '99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    meta = json.loads((ROOT / 'independent-observations.json').read_text())
    lesson = meta['lesson']
    prefix = f'hsk1-official-vi-l{lesson:02d}-'
    input_path = ROOT / 'author-input/source-transcription.json'
    freeze_path = ROOT / 'author-input/freeze-manifest.json'
    assert sha(input_path) == meta['authorSHA256']
    assert sha(freeze_path) == meta['authorFreezeSHA256']
    author = json.loads(input_path.read_text())
    assert author['sourcePDF']['sha256'] == PDF_SHA
    assert author['sourcePDF']['pdfPageCount'] == 148
    assert author['lesson'] == lesson
    for key in ['pdfPages', 'printedPages']:
        assert author[key] == meta[key]
    source = {o['occurrenceId']: o for o in author['occurrences']}
    assert len(source) == len(author['occurrences']) == meta['occurrenceCount']
    renders = json.loads((ROOT / 'render-manifest.json').read_text())
    crops = json.loads((ROOT / 'crop-manifest.json').read_text())
    assert renders['sourcePDFSHA256'] == crops['sourcePDFSHA256'] == PDF_SHA
    assert [r['pdfPage'] for r in renders['renders']] == meta['pdfPages']
    for row in renders['renders']:
        p = ROOT / row['file']
        assert p.stat().st_size == row['bytes'] and sha(p) == row['sha256']
    for row in crops['crops']:
        p = ROOT / row['path']
        assert p.stat().st_size == row['bytes'] and sha(p) == row['sha256']
    seen = set()
    per_id = []
    for line in (ROOT / 'independent-reading.tsv').read_text().splitlines():
        suffix, zh, physical = line.split('\t')
        oid = prefix + suffix
        assert oid not in seen
        seen.add(oid)
        original = source[oid]
        page = int(suffix[3:6])
        printed = f'{page - 16:03d}'
        lines = physical.split('¦')
        joiners = meta['lineJoiners'].get(suffix, [' '] * (len(lines) - 1))
        assert len(joiners) == len(lines) - 1
        vi = lines[0] + ''.join(j + value for j, value in zip(joiners, lines[1:]))
        fragment = {'pdfPage': page, 'printedPage': printed, 'lineTexts': lines}
        if suffix in meta['lineJoiners']:
            fragment['lineJoiners'] = joiners
        expected = {'pdfPage': page, 'printedPage': printed,
                    'zhContext': zh, 'viText': vi, 'fragments': [fragment]}
        expected.update(meta['extraFields'].get(suffix, {}))
        if suffix in meta['speakers']:
            expected['speakerZh'] = meta['speakers'][suffix]
        if 'summary-' in suffix:
            expected['scopeLessons'] = meta['summaryScopeLessons']
            if 'summary-language-row-' in suffix:
                expected['mixedZhViExample'] = True
        if '-word-' in suffix:
            expected['printOrdinal'] = int(suffix.split('-word-')[1][:2])
        differences = {key: {'author': original.get(key), 'independentOriginalPDF': value}
                       for key, value in expected.items() if original.get(key) != value}
        per_id.append({'occurrenceId': oid, 'status': 'repair' if differences else 'accepted',
                       'independentOriginalPDFReading': expected,
                       'independentRender': f'renders/pdf-{page:03d}-independent.png',
                       'checked': ['diacritics/case/punctuation', 'physical line sequence',
                                   'nearby Chinese context', 'page identity'] +
                                  (['speaker identity/order'] if suffix in meta['speakers'] else []),
                       'differences': differences})
    missing = sorted(set(source) - seen)
    assert not missing and len(seen) == meta['occurrenceCount']
    keys = meta['wordTableKeys']
    assert [[r[k] for k in keys] for r in author['wordTableRows']] == meta['wordTableReadings']
    for row in author['wordTableRows']:
        assert row['glossOccurrenceId'] in seen
        if row['rawPosLabel'] is None:
            assert row['posOccurrenceId'] is None
        else:
            assert source[row['posOccurrenceId']]['viText'] == row['rawPosLabel']
    assert {str(k): v for k, v in collections.Counter(o['pdfPage'] for o in source.values()).items()} == meta['byPDFPage']
    for key, value in meta['wordCounts'].items():
        assert author['coverage'][key] == value
    for expected in meta['layoutReadings']:
        keys = [k for k in expected if k != 'note']
        assert any(all(row.get(k) == expected[k] for k in keys) for row in author.get('layoutContinuations', []))
    categories = dict(collections.Counter(o['category'] for o in source.values()))
    assert categories == author['coverage']['byCategory']
    counts = {'occurrences': len(seen), 'accepted': sum(r['status'] == 'accepted' for r in per_id),
              'repair': sum(r['status'] == 'repair' for r in per_id), 'missing': 0}
    report = {
        'schemaVersion': 1, 'reviewer': 'release_assembly', 'author': 'hsk23_remaining_source',
        'scope': f'HSK1 lesson {lesson} original-PDF source transcription only',
        'sourcePDF': author['sourcePDF'],
        'frozenAuthorInput': {'file': 'author-input/source-transcription.json', 'sha256': sha(input_path),
                              'freezeFile': 'author-input/freeze-manifest.json', 'freezeSHA256': sha(freeze_path)},
        'method': f"Direct original-PDF independent 3x rendering of all {len(meta['pdfPages'])} pages plus {len(crops['crops'])} direct original-PDF 5x crops; visually read every full page and crop, then recorded literal manual TSV and observations. No OCR or author-image substitute.",
        'pdfPages': meta['pdfPages'], 'printedPages': meta['printedPages'],
        'status': 'accepted-source-transcription' if counts['repair'] == 0 else 'repair-required',
        'counts': counts, 'coverageCounts': meta['wordCounts'], 'byPDFPage': meta['byPDFPage'],
        'byCategory': categories, 'missingPrintedVietnamese': [],
        'wordTables': {'status': 'accepted', 'keys': keys, 'readings': meta['wordTableReadings']},
        'layoutReadings': meta['layoutReadings'],
        'noPrintedVietnameseReadings': meta['noPrintedVietnameseReadings'],
        'printedSpellingsPreserved': meta['printedSpellingsPreserved'],
        'roleNote': meta['roleNote'], 'mixedLanguageNote': meta['mixedLanguageNote'],
        'evidence': [{'file': f, 'sha256': sha(ROOT / f)} for f in
                     ['render-manifest.json', 'crop-manifest.json', 'independent-reading.tsv', 'independent-observations.json']],
        'websiteOldVietnameseRead': False, 'authorFilesModified': False,
        'runtimeActivation': 'none', 'websiteVietnameseAuditComplete': False,
        'perOccurrence': per_id,
    }
    (ROOT / 'review.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    actual_repairs = sorted(r['occurrenceId'] for r in per_id if r['differences'])
    assert actual_repairs == sorted(meta['expectedRepairIds']), json.dumps([r for r in per_id if r['differences']], ensure_ascii=False)
    assert author['summaryScopeLessons'] == meta['summaryScopeLessons']
    print(json.dumps({'status': report['status'], 'counts': counts, 'reviewSHA256': sha(ROOT / 'review.json')}, ensure_ascii=False))


if __name__ == '__main__':
    main()
