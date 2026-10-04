"""Replay source identities and structural links; visual judgments remain in review.json."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
PREP = ROOT / 'course-app/docs/resume-20261004/official-vi-source-prep/hsk3-l10'
PDF = Path('/workspace/scratch/28b55072841a/upload/HSK3 (3.0).pdf')
FROZEN = {
    PDF: '7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951',
    PREP / 'body-vietnamese-transcription.json': 'e5404cc8e0acd70af21997e0599edacab6eb290b22dc55ba91b25ee8d25d1b4e',
    PREP / 'appendix-lesson10-vietnamese-transcription.json': 'ff9d2f2ad097c4c46696dcf95f3e55e431c4f050c006ee3ff4073c6d4af00aa8',
    ROOT / 'course-app/content/hsk3/lesson-10.json': 'b7f106e2ece82f87921a16bf87b4dac345f9d5366c75fee0394da1b7597de828',
    ROOT / 'course-app/docs/resume-20261004/hsk23-source-closure/official-vi-l07-12.json': 'd36d94b7897b655c0830efe03b2742f284825f683e4fafba3bc21c87610fa5c4',
}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def check(name, ok, **detail):
    checks.append({'check': name, 'passed': bool(ok), **detail})

checks = []
for path, expected in FROZEN.items():
    actual = sha(path)
    check('frozen input bytes', actual == expected, file=str(path), expectedSHA256=expected, actualSHA256=actual)
body = json.loads((PREP / 'body-vietnamese-transcription.json').read_text())
appendix = json.loads((PREP / 'appendix-lesson10-vietnamese-transcription.json').read_text())
lesson = json.loads((ROOT / 'course-app/content/hsk3/lesson-10.json').read_text())
closure = json.loads((ROOT / 'course-app/docs/resume-20261004/hsk23-source-closure/official-vi-l07-12.json').read_text())
vocab = {w['id']: w for w in lesson['vocabulary']}
anchors = {w['id']: w for w in closure['rows'] if w['lesson'] == 10}
ids = {}

def walk(value, pointer=''):
    if isinstance(value, dict):
        if 'id' in value:
            check('stable ID unique', value['id'] not in ids, sourceID=value['id'])
            ids[value['id']] = (pointer, value)
        for key, child in value.items():
            walk(child, pointer + '/' + key)
    elif isinstance(value, list):
        for i, child in enumerate(value):
            walk(child, pointer + '/' + str(i))

walk(lesson)
all_rows = body['rows'] + appendix['rows']
check('body row count', len(body['rows']) == 93, actual=len(body['rows']))
check('appendix row count', len(appendix['rows']) == 26, actual=len(appendix['rows']))
check('source row ID uniqueness', len({r['recordId'] for r in all_rows}) == 119)
for row in all_rows:
    for source_id in row['sourceIDs']:
        check('source ID exists in unchanged Chinese lesson', source_id in ids, recordId=row['recordId'], sourceID=source_id)
        if row in appendix['rows']:
            check('appendix Chinese line anchor exact', ids[source_id][1].get('zh') == row['chineseAnchor'], recordId=row['recordId'], sourceID=source_id)
word_rows = [r for r in body['rows'] if r['role'] == 'vocabulary-gloss']
linked = [sid for r in word_rows for sid in r['sourceIDs']]
check('printed entries 1 through 28', sorted(r['printedNumber'] for r in word_rows) == list(range(1, 29)))
check('33 stable word IDs covered exactly once', len(linked) == 33 and len(set(linked)) == 33 and set(linked) == set(vocab))
pos_names = {'dt.':'danh từ','tt.':'tính từ','đgt.':'động từ','giới.':'giới từ','lượng.':'lượng từ','phó.':'phó từ'}
for row in word_rows:
    categories = [pos_names[t] for t in re.sub(r'\s+', '', row['printedPOSRaw']).split('/')]
    linked_pos = [vocab[sid]['pos'] for sid in row['sourceIDs']]
    check('word sense POS partition matches complete printed entry', sorted(categories) == sorted(linked_pos), recordId=row['recordId'], printedPOSRaw=row['printedPOSRaw'], linkedPOS=linked_pos)
    for sid in row['sourceIDs']:
        a, w = anchors[sid], vocab[sid]
        check('printed headword number page POS and stable ID link',
              a['zh'] == w['zh'] == row['chineseAnchor'] and a['normalizedPinyin'] == w['py'] and a['printedNumber'] == row['printedNumber'] and a['printedPOSRaw'] == row['printedPOSRaw'] and a['pdfPage'] == row['pdfPage'] and a['printedPage'] == row['printedPage'],
              recordId=row['recordId'], sourceID=sid, lessonPointer=ids[sid][0])
manifest = json.loads((PREP / 'source-preparation-manifest.json').read_text())
for ev in manifest['pageEvidence']:
    p = ROOT / ev['file']
    check('author page evidence bytes unchanged', sha(p) == ev['sha256'] and p.stat().st_size == ev['bytes'], file=ev['file'])
render = json.loads((HERE / 'render-evidence.json').read_text())
for ev in render['renderedPages']:
    p = HERE / 'page-evidence' / f"independent-p{ev['pdfPage']:03d}.png"
    check('independent rendered evidence unchanged', sha(p) == ev['sha256'] and p.stat().st_size == ev['bytes'], pdfPage=ev['pdfPage'])
line4 = next(r for r in appendix['rows'] if r['recordId'].endswith('text1:line4'))
check('cross-page source fragments retain order and exact text', [f['pdfPage'] for f in line4['sourceFragments']] == [201,202] and ' '.join(f['printedVietnamese'] for f in line4['sourceFragments']) == line4['printedVietnamese'] and line4['sourceFragments'][1]['speakerPrintedVietnamese'] is None)
check('role labels exact frozen source observation', appendix['printedRoleLabels'] == [{'printedVietnamese':'Bạn cùng lớp','chineseAnchor':'同学','scenes':[1,2,3]},{'printedVietnamese':'Lưu Tiểu Tuyết','chineseAnchor':'刘小雪','scenes':[1,2,3]},{'printedVietnamese':'Cô Lý','chineseAnchor':'李老师','scenes':[3]}])
check('letter has no invented printed speaker', all(r['speakerPrintedVietnamese'] is None for r in appendix['rows'] if r['scene'] == 4))
result = {'scope':'frozen source identity, explicit Chinese/stable-ID links, preserved render bytes; does not automate visual/language judgment', 'passed': all(c['passed'] for c in checks), 'checksCount': len(checks), 'checks':checks}
(HERE / 'input-verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'passed':result['passed'],'checksCount':len(checks),'failed':[c for c in checks if not c['passed']]}, ensure_ascii=False))
assert result['passed']
