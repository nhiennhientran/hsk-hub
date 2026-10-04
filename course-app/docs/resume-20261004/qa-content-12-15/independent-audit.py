"""Independent, bounded source/structure audit; does not change candidates."""
import collections
import hashlib
import io
import json
from pathlib import Path

import fitz
from PIL import Image

BASE = Path(__file__).resolve().parent
CANDIDATES = BASE.parent / 'content-12-15'
BOOK = Path('/workspace/scratch/67c4ddcee7f7/upload/新HSK教程1(HSK3.0) (郭风岚、汤旭编著) (z-library.sk, 1lib.sk, z-lib.sk) (1)(3).pdf')
ANSWERS = Path('/workspace/scratch/67c4ddcee7f7/upload/《新HSK教程1》客观题答案(5).pdf')
sha = lambda value: hashlib.sha256(value).hexdigest()

# Transcribed independently from visually inspected answer PDF pages 9--13.
EXPECTED = {
    12: [('warmup', 'FDBECA', [9]*6), ('text-1-listening', 'CB', [9]*2), ('text-2-listening', 'AC', [9]*2), ('text-3-listening', 'BC', [9]*2), ('comprehensive-cloze', 'BECAD', [10]*5)],
    13: [('warmup', 'CAFBDE', [10]*6), ('text-1-listening', 'AB', [10]*2), ('text-2-listening', 'CC', [10]*2), ('text-3-listening', 'BB', [10,11]), ('comprehensive-cloze', 'CEBDA', [11]*5)],
    14: [('warmup', 'BCDFEA', [11]*6), ('text-1-listening', 'BC', [11]*2), ('text-2-listening', 'CB', [11]*2), ('text-3-listening', 'BC', [12]*2), ('comprehensive-cloze', 'BDEAC', [12]*5)],
    15: [('warmup', 'BADECF', [12]*6), ('text-1-listening', 'BC', [12]*2), ('text-2-listening', 'AB', [13]*2), ('text-3-listening', 'BA', [13]*2), ('comprehensive-cloze', 'DACEB', [13]*5)],
}
report = {'method': 'Independent visual source reading plus key/topology/hash/pixel checks; not audio or browser certification.', 'sourceHashes': {'textbook': sha(BOOK.read_bytes()), 'answerBook': sha(ANSWERS.read_bytes())}, 'lessons': [], 'figures': [], 'issues': []}
pdf = fitz.open(BOOK)
all_ids = []
for n in range(12,16):
    f = CANDIDATES / f'lesson-{n}.json'
    d = json.loads(f.read_text())
    activities = d['activities']
    all_ids.extend(a['id'] for a in activities)
    record = {'lesson': n, 'sha256': sha(f.read_bytes()), 'activities': len(activities), 'fields': sum(len(a['fields']) for a in activities), 'keyed': sum(x['assessment']=='answer-key' for a in activities for x in a['fields']), 'readOnly': sum(not a['fields'] for a in activities), 'answerGroups': [], 'tables': [], 'printedStemPinyinCount': sum(bool(x.get('pinyin')) for a in activities if a['kind']=='listening-choice' for x in a['fields'])}
    assert d['textbookSHA256'] == report['sourceHashes']['textbook']
    assert d['answerBookSHA256'] == report['sourceHashes']['answerBook']
    for section, expected, pages in EXPECTED[n]:
        fields = [x for a in activities if a['source']['section']==section for x in a['fields']]
        got = ''.join(x['answer'] for x in fields)
        source_pages = [x['answerSource']['pdfPage'] for x in fields]
        assert got == expected, (n, section, got, expected)
        assert source_pages == pages, (n,section,source_pages,pages)
        assert all(x['answerSource']['sha256'] == report['sourceHashes']['answerBook'] for x in fields)
        record['answerGroups'].append({'section': section, 'expectedAndActual': expected, 'answerPdfPages': pages})
    for a in activities:
        assert a['source']['printedPage']+15 == a['source']['pdfPage']
        assert len(set(x['id'] for x in a['fields'])) == len(a['fields'])
        if a.get('audio'):
            assert a['audio']['verifiedByListening'] is False
        for x in a['fields']:
            if x['assessment']=='ungraded':
                assert 'answer' not in x and 'answerSource' not in x
            else:
                assert x['answer'] in [o['id'] for o in x['options']]
        if a.get('table'):
            table = a['table']
            width = len(table['columns'])
            assert all(len(row['cells'])==width for row in table['rows'])
            refs = [cell['fieldId'] for row in table['rows'] for cell in row['cells'] if 'fieldId' in cell]
            assert collections.Counter(refs) == collections.Counter(x['id'] for x in a['fields'])
            record['tables'].append({'id': a['id'], 'rows': len(table['rows']), 'columns': width, 'uniqueInteractiveCells': len(refs)})
    if n in (12,15):
        a = next(a for a in activities if 'summary-skills' in a['id'])
        rows = 12 if n==12 else 8
        assert len(a['table']['rows'])==rows and len(a['fields'])==2*rows
        assert [c['zh'] for c in a['table']['columns']] == ['内容','理解','会用']
    if n==14:
        a=next(a for a in activities if 'separable-table' in a['id'])
        assert len(a['table']['rows'])==5 and len(a['table']['columns'])==2
        completion=[a for a in activities if 'grammar-completion' in a['id']]
        assert [len(a['fields']) for a in completion] == [3,4]
        assert all(x['assessment']=='ungraded' for a in completion for x in a['fields'])
    for fig in d['figures']:
        path = CANDIDATES / fig['file']
        raw = path.read_bytes()
        src = fig['source']
        assert sha(raw)==fig['sha256']
        original = pdf[src['pdfPage']-1].get_pixmap(matrix=fitz.Matrix(2,2), clip=fitz.Rect(src['cropPdfPoints']))
        stored = Image.open(io.BytesIO(raw)).convert('RGB')
        exact = stored.size==(original.width,original.height) and stored.tobytes()==original.samples
        assert exact, fig['id']
        report['figures'].append({'id': fig['id'], 'sha256': sha(raw), 'size': list(stored.size), 'pdfPage':src['pdfPage'], 'cropPdfPoints':src['cropPdfPoints'], 'sourcePixelsExact': exact})
    report['lessons'].append(record)
assert len(set(all_ids))==len(all_ids)
report['status']='PASS for keyed answers, source-page/hash bindings, table topology and exact crop pixels; independent semantic review and remaining annotations are in review.md.'
(BASE/'independent-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'activities':sum(x['activities'] for x in report['lessons']), 'fields':sum(x['fields'] for x in report['lessons']), 'keyed':sum(x['keyed'] for x in report['lessons']), 'exactCrops':len(report['figures']), 'status':report['status']},ensure_ascii=False))
