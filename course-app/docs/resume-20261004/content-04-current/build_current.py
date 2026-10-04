"""Create a new L4 display revision without mutating frozen source-v2 content."""
import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
BASE = ROOT / 'hsk1-app/content/source-activities/lesson-04.json'
TARGET = ROOT / 'hsk1-app/content/source-activities/lesson-04-current.json'
PUBLIC = ROOT / 'hsk1-app/public/source-activities/figures'
CROP_ROOT = HERE.parent / 'qa-l04'
MANIFEST = CROP_ROOT / 'source-crop-candidates.json'
REVIEW = HERE.parent / 'qa-l04-current/crop-review.json'
VERSION = 'source-v3-original-crops'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def canonical(data):
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()

def c(zh, vi):
    return {'zh': zh, 'vi': vi}

base_bytes = BASE.read_bytes()
base = json.loads(base_bytes)
manifest_bytes = MANIFEST.read_bytes()
manifest = json.loads(manifest_bytes)
review = json.loads(REVIEW.read_text())
assert review['manifestSHA256'] == sha(manifest_bytes)
assert review['sourceTextbookSHA256'] == base['textbookSHA256'] == manifest['sourcePdfSha256']
reviewed = {x['id']: x for x in review['crops']}
assert len(reviewed) == len(manifest['crops']) == 13
assert all(x['status'] == 'accepted-independent-original-page-and-crop-review'
           and x['visualSemanticCheck'] and x['independentRecropExactSHA256Match']
           for x in reviewed.values())

alts = {
    'warmup-01': c('一位戴眼镜的年长男性。', 'Một người đàn ông lớn tuổi đeo kính.'),
    'warmup-02': c('数字5。', 'Chữ số 5.'),
    'warmup-03': c('教室里几位正在举手的人。', 'Một số người đang giơ tay trong lớp học.'),
    'warmup-04': c('一位站在黑板前，手持指示杆和文件的人。', 'Một người đứng trước bảng, cầm que chỉ và tài liệu.'),
    'warmup-05': c('一位成年人抱着婴儿。', 'Một người lớn đang bế em bé.'),
    'warmup-06': c('一个孩子背着另一个孩子。', 'Một em nhỏ đang cõng một em nhỏ khác.'),
    'picture-01': c('六个人坐在屋外的台阶上。', 'Sáu người ngồi trên các bậc thềm ngoài nhà.'),
    'picture-02': c('一位男性和一位女性坐在沙发上。', 'Một người đàn ông và một người phụ nữ ngồi trên ghế sofa.'),
    'picture-03': c('一位穿白衬衫的男孩。图片未标明具体年龄。', 'Một cậu bé mặc áo sơ mi trắng. Hình không ghi tuổi cụ thể.'),
    'picture-04': c('两个男孩在一起，其中一人从身后抱着另一人。', 'Hai cậu bé ở cùng nhau; một em ôm em kia từ phía sau.'),
    'text1': c('刘明和王一雪在家里交谈。', 'Lưu Minh và Vương Nhất Tuyết trò chuyện ở nhà.'),
    'text2': c('杨同乐和王一雪交谈。', 'Dương Đồng Lạc và Vương Nhất Tuyết trò chuyện.'),
    'text3': c('王一雪与儿子在街上遇见杨同乐。', 'Vương Nhất Tuyết cùng con trai gặp Dương Đồng Lạc trên phố.'),
}
scene_map = {
    'text1': 'hsk1-original-2026-l04-p019-text1-read-role-01',
    'text2': 'hsk1-original-2026-l04-p022-text2-role-01',
    'text3': 'hsk1-original-2026-l04-p025-text3-role-01',
}

current = copy.deepcopy(base)
current['version'] = VERSION
current['editorialStatus'] = 'candidate-awaiting-independent-current-revision-review'
current['figures'] = []
PUBLIC.mkdir(parents=True, exist_ok=True)
for crop in manifest['crops']:
    cid = crop['id']
    data = (CROP_ROOT / crop['file']).read_bytes()
    assert sha(data) == crop['sha256'] == reviewed[cid]['sha256']
    asset_id = 'l04-' + cid
    asset_file = asset_id + '.png'
    (PUBLIC / asset_file).write_bytes(data)
    cell = int(cid.rsplit('-', 1)[1]) if '-' in cid else cid
    current['figures'].append({
        'id': asset_id, 'file': 'figures/' + asset_file, 'alt': alts[cid],
        'source': {'textbookSHA256': base['textbookSHA256'],
                   'printedPage': crop['printedPage'], 'pdfPage': crop['pdfPage'],
                   'cell': cell, 'cropPdfPoints': crop['bboxPdfPoints']},
        'kind': 'original-crop', 'sha256': crop['sha256'],
        'note': c('教材原图裁切。', 'Hình được cắt trực tiếp từ sách.'),
    })

figures = {x['id']: x for x in current['figures']}
changed = []
for activity in current['activities']:
    old = activity.get('figure')
    cid = old or next((s for s, aid in scene_map.items() if aid == activity['id']), None)
    if cid is None:
        continue
    assert cid in alts
    activity['version'] = VERSION
    activity['figure'] = 'l04-' + cid
    activity['figureSHA256'] = figures[activity['figure']]['sha256']
    if cid.startswith('picture-'):
        for field in activity['fields']:
            assert field['assessment'] == 'ungraded' and 'answer' not in field
            field['referenceProvenance'] = 'editorial-model-not-official-answer'
    if cid == 'picture-01':
        activity['fields'][0]['feedbackNote'] = c(
            '原图中有六个人，可用“数词＋口＋人”表达。',
            'Hình gốc có sáu người; dùng “số từ + 口 + 人”.')
    changed.append({'activityId': activity['id'], 'previousVersion':
                    next(a['version'] for a in base['activities'] if a['id'] == activity['id']),
                    'currentVersion': VERSION, 'figureId': activity['figure'],
                    'figureSHA256': activity['figureSHA256']})

assert len(changed) == 13
assert len(current['activities']) == 36
assert [a['id'] for a in current['activities']] == [a['id'] for a in base['activities']]
changed_ids = {x['activityId'] for x in changed}
assert all(a == b for a, b in zip(base['activities'], current['activities']) if a['id'] not in changed_ids)
assert current['numberTables'] == base['numberTables'] and current['bonus'] == base['bonus']
assert all(a['figure'] in figures and a['figureSHA256'] == figures[a['figure']]['sha256']
           for a in current['activities'] if 'figure' in a)
assert BASE.read_bytes() == base_bytes
TARGET.write_text(json.dumps(current, ensure_ascii=False, indent=2) + '\n')
frozen = [a for a in base['activities'] if a['version'] == 'source-v2']
assert len(frozen) == 21
verification = {
    'status': 'author-current-revision-checks-complete-independent-review-pending',
    'baseFile': str(BASE.relative_to(ROOT)), 'baseFileSHA256': sha(base_bytes),
    'currentFile': str(TARGET.relative_to(ROOT)), 'currentFileSHA256': sha(TARGET.read_bytes()),
    'sourceCropManifestSHA256': sha(manifest_bytes), 'cropIndependentReviewFile': str(REVIEW.relative_to(ROOT)),
    'activityIdsPreserved': 36, 'currentRevisedActivities': 13, 'unchangedCurrentActivities': 23,
    'originalSourceV2ActivitiesPreserved': 21,
    'originalSourceV2CanonicalSHA256': sha(canonical(frozen)),
    'baseFileUnmodified': True, 'numberTablesPreserved': True, 'bonusPreserved': True,
    'cropExactCopyCount': 13, 'changes': changed,
    'notCertified': ['current-revision-independent-acceptance', 'native-browser-acceptance',
                     'official-Vietnamese-full-audit', 'human-listening-review', 'production-release'],
}
(HERE / 'verification.json').write_text(json.dumps(verification, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: verification[k] for k in ('status', 'baseFileSHA256', 'currentFileSHA256',
                                              'currentRevisedActivities', 'cropExactCopyCount')}, ensure_ascii=False))
