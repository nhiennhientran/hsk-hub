"""Freeze the root review after actual manual reading of PDF 70–77, not OCR."""
import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
OUT = ROOT / 'course-app/docs/recovery-20261005/qa-official-vi/hsk1-l08'
sha = lambda b: hashlib.sha256(b).hexdigest()
source_bytes = (OUT/'author-input/source-transcription.json').read_bytes()
source = json.loads(source_bytes)
render = json.loads((OUT/'render-manifest.json').read_bytes())
assert sha(source_bytes) == '95a395d982916d7ad316e1ae3680235d2c91870505c5977d4479e4aa691344a5'
assert source['lesson'] == 8 and source['pdfPages'] == list(range(70, 77))
assert render['authorSourceSHA256'] == sha(source_bytes)
assert sha((OUT/'author-input/freeze-manifest.json').read_bytes()) == render['authorFreezeSHA256']
records = source['occurrences']
assert len(records) == 119 and len({x['occurrenceId'] for x in records}) == 119
assert len(source['wordTableRows']) == 24
assert len([x for x in records if x['category']=='dialogue-translation']) == 14
for row in render['pages']:
    p = OUT/row['file']; data=p.read_bytes()
    assert len(data)==row['bytes'] and sha(data)==row['sha256']
    with Image.open(p) as image:
        image.load(); assert list(image.size)==[row['width'],row['height']]
for row in render['verifiedFrozenAuthorFiles']:
    data=(ROOT/row['file']).read_bytes()
    assert len(data)==row['bytes'] and sha(data)==row['sha256']

# These observations were written after viewing each full page and comparing
# every candidate occurrence, raw POS row, bilingual dialogue and physical wrap.
manual = {
  70: 'Bài 8, complete title, Mục tiêu, three goals and warmup instruction all match. Goal 1 wraps after vị trí,; goal 2 after chỉ. Warmup photos/options contain Chinese and pinyin, without Vietnamese option translations.',
  71: 'Text 1 scene, four complete Chinese/Vietnamese speaker turns, ten ordinary word glosses/POS and both parts of Tiểu Ngữ giúp sức match. External/location ngoài, bên ngoài and lượng. con (chim, chó, hổ...) have physical wraps preserved. Role instruction and pair-activity instruction match; no missing Vietnamese on the page.',
  72: 'Full directional-noun explanation, grammar labels/read instruction and text 2 scene/listen instruction match. Chinese-only grammar examples and listening options have no invented Vietnamese. Scene continues structurally on page 73, not a truncated scene fragment.',
  73: 'Words 11–17, all POS labels (including giới. for 在 and đtnn. for 能), seven glosses, four complete dialogue turns, pair instruction and full 在 explanation match. The book prints trước cửa hiệu sách; retain this actual wording without silently deleting cửa. Raw ZH and pinyin are also paired with the printed word rows.',
  74: 'Full 能 grammar explanation, all instructions, text 3 scene and the actual inline gloss ít for 少 match. Other question/option text is Chinese-only. The scene speaker relation Lưu Minh / colleague bác sĩ Hồ is correct.',
  75: 'Words 18–23, six ordinary POS labels, proper noun 胡医生 / bác sĩ Hồ, complete six-turn text 3 dialogue and its physical wraps match. Both reading questions are complete. 小 + họ tip, all section labels, role/read/question instructions and fill-blank instruction match. Proper noun has no fabricated POS.',
  76: 'Whole next-page continuation of fill-blank Chinese items reviewed. Vietnamese picture instruction, classroom heading, two-person activity name/instruction and Ví dụ của Tiểu Ngữ label match. Chinese activity vocabulary and example turns have no Vietnamese printed. This page closes lesson 8.',
  77: 'Whole boundary page actually viewed: Bài 9 / 我明天上午在学校学习 begins a new lesson. Excluded from lesson 8 source occurrences.'
}
decisions=[]
for x in records:
    assert x['pdfPage'] in manual and x['fragments']
    decisions.append({
        'occurrenceId':x['occurrenceId'], 'decision':'accept-source-transcription',
        'category':x['category'], 'pdfPage':x['pdfPage'], 'printedPage':x['printedPage'],
        'verifiedVietnamese':x['viText'], 'verifiedChineseContext':x['zhContext'],
        'verifiedFragments':x['fragments'],
        'checks':['printed Vietnamese spelling/diacritics/punctuation',
                  'complete phrase and physical line/page fragments',
                  'category and original page anchor',
                  'Chinese context and speaker/POS association where applicable'],
        'pageObservationRef':str(x['pdfPage']),
        'evidence':f"renders/pdf-{x['pdfPage']:03}-independent.png"
    })
now=datetime.now(timezone.utc).isoformat()
review={
    'schemaVersion':1, 'courseId':'hsk1', 'lesson':8,
    'reviewer':'/root', 'author':source.get('authorReview',{}),
    'method':'independent manual review of the original uploaded PDF; full-page fresh raster and all author source records were actually read',
    'sourceSHA256':sha(source_bytes),'sourcePDFSHA256':source['sourcePDF']['sha256'],
    'authorFreezeSHA256':render['authorFreezeSHA256'],
    'status':'accepted-source-transcription',
    'acceptedOccurrenceCount':119,'repairs':[],'holds':[],'missingPrintedVietnamese':[],
    'pageObservations':{str(p):{'pdfPage':p,'printedPage':f'{p-16:03}',
                              'sourceOccurrenceCount':sum(x['pdfPage']==p for x in records),
                              'actuallyViewedWholePage':True,'observation':note}
                        for p,note in manual.items()},
    'categoryCounts':dict(Counter(x['category'] for x in records)),
    'decisions':decisions,
    'verifiedWordRows':source['wordTableRows'],
    'layoutContinuationsVerified':source.get('layoutContinuations',[]),
    'textbookSemanticObservations':[
        {'occurrenceId':'hsk1-official-vi-l08-pdf073-text-2-role-02',
         'observation':'The Vietnamese print has trước cửa hiệu sách while the Chinese has 在学校书店前见吧. This is the actual textbook wording and a contextually compatible location expression.',
         'classification':'source-faithful-compatible-expression','requiresErratum':False}
    ],
    'websiteVietnameseRead':False,'websiteFieldVerificationComplete':False,
    'runtimeActivation':False,'productionDeployment':False,'reviewCompletedAtUTC':now
}
def write_once(path, value):
    data=(json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode()
    assert not path.exists(), f'Immutable output already exists: {path}'
    path.write_bytes(data)
write_once(OUT/'review.json',review)
write_once(OUT/'validation.json',{
    'status':'passed','checkedAtUTC':now,
    'authorFreezeFilesVerified':len(render['verifiedFrozenAuthorFiles']),
    'sourceInputSHA256':sha(source_bytes),'freshWholePagePNGsDecodedAndHashed':8,
    'reviewDecisionIdsExactlyEqualSourceIds':True,
    'ordinaryWords':23,'properNames':1,'printedOrdinaryPOS':23,'dialogueTurns':14,
    'manualReviewIsSeparateFromStructuralValidation':True,
    'manualWholePagesViewed':list(manual),'boundaryPageExcludedFromAcceptedOccurrenceCount':77
})
files=[]
for p in sorted(OUT.rglob('*')):
    if p.is_file():
        data=p.read_bytes();files.append({'file':str(p.relative_to(ROOT)), 'bytes':len(data),'sha256':sha(data)})
for p in [Path(__file__),ROOT/'course-app/docs/recovery-20261005/qa-tools/render-independent-hsk1.py']:
    data=p.read_bytes();files.append({'file':str(p.relative_to(ROOT)), 'bytes':len(data),'sha256':sha(data)})
freeze={'schemaVersion':1,'capsuleId':'hsk1-l08-independent-source-review-20261005',
        'courseId':'hsk1','lesson':8,'reviewer':'/root','stage':'independent-source-review',
        'status':'accepted-source-transcription','acceptedOccurrenceCount':119,'files':files,
        'frozenAtUTC':now,'remoteSynchronizationStatus':'pending-readback'}
write_once(OUT/'FREEZE.json',freeze)
write_once(OUT/'STAGE.json',{
    'schemaVersion':1,'capsuleId':freeze['capsuleId'],'courseId':'hsk1','lesson':8,
    'stage':'independent-source-review','status':'accepted-source-transcription',
    'acceptedOccurrenceCount':119,'freeze':str((OUT/'FREEZE.json').relative_to(ROOT)),
    'freezeSHA256':sha((OUT/'FREEZE.json').read_bytes()),
    'files':files+[{'file':str((OUT/'FREEZE.json').relative_to(ROOT)),
                    'bytes':(OUT/'FREEZE.json').stat().st_size,'sha256':sha((OUT/'FREEZE.json').read_bytes())}],
    'productionDeployment':False
})
print(json.dumps({'lesson':8,'sourceOccurrencesAccepted':119,'capsuleFiles':len(files)+2,
                  'freezeSHA256':sha((OUT/'FREEZE.json').read_bytes()),
                  'stage':str((OUT/'STAGE.json').relative_to(ROOT))}))
