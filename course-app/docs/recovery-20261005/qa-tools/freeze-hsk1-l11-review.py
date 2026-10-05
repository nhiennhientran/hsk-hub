"""Freeze root's completed original-page manual review, separate from guards."""
import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
OUT = ROOT / 'course-app/docs/recovery-20261005/qa-official-vi/hsk1-l11'
sha = lambda data: hashlib.sha256(data).hexdigest()
source_bytes = (OUT/'author-input/source.json').read_bytes()
source = json.loads(source_bytes)
render = json.loads((OUT/'render-manifest.json').read_bytes())
assert sha(source_bytes) == '48845d6d2dc470586bdb38fd85cb2bcf79f90ff3019c525db926744d38896193'
assert source['lesson'] == 11 and source['pdfPages'] == list(range(94,102))
assert source['appendixPDFPages'] == list(range(138,145))
assert render['authorSourceSHA256'] == sha(source_bytes)
assert sha((OUT/'author-input/FREEZE.json').read_bytes()) == render['authorFreezeSHA256'] == '60e8a7b2ac2a5cdadb115bb5e235842edab4ab959ff15157a2b5d792f448fe6d'
body = source['occurrences']
appendix = source['appendixOccurrences']
records = body + appendix
assert len(body) == 120 and len(appendix) == 88
assert len({x['occurrenceId'] for x in records}) == 208
assert len(source['wordTableRows']) == 25
assert len([x for x in body if x['category']=='word-pos']) == 25
roles = [x for x in body if x['category']=='dialogue-translation']
assert Counter(x['textNumber'] for x in roles) == {1:4,2:4,3:6}
assert all(x['zhAnchorPDFPage']==99 for x in roles if x['textNumber']==3)
for row in render['pages']:
    path=OUT/row['file']; data=path.read_bytes()
    assert len(data)==row['bytes'] and sha(data)==row['sha256']
    with Image.open(path) as im:
        im.load(); assert list(im.size)==[row['width'],row['height']]
for row in render['verifiedFrozenAuthorFiles']:
    data=(ROOT/row['file']).read_bytes()
    assert len(data)==row['bytes'] and sha(data)==row['sha256']
for x in records:
    printed_lines = [line for fragment in x['fragments'] for line in fragment['lineTexts']]
    assert ' '.join(printed_lines) == x['viText'], x['occurrenceId']
    assert all(f['pdfPage']==x['pdfPage'] for f in x['fragments'])
    assert x['printedPage']==f"{x['pdfPage']-16:03}"

# Every observation below follows actual full-page image reading and candidate
# comparison. The structural checks above cannot create these manual decisions.
manual = {
94: 'Full title 我读大学呢 / Em đang học đại học, Bài 11, Mục tiêu, all three complete goals and warmup instruction match. The second goal wraps after cấu trúc, the first after ba, and the third after động từ. Picture choices are Chinese/pinyin only.',
95: 'Seven word rows, headwords/pinyin, all seven raw POS/glosses, scene and four complete role turns match. The second gloss wraps nhà hàng, / khách sạn. Vương Nhất Phi and Lý Văn roles correctly pair with the Chinese; all role prefixes and line wraps retained. The printed fourth VI turn explicitly says đang đi taxi đây for 坐车呢; source-faithful narrower wording recorded separately.',
96: 'Full Câu hỏi chính phản explanation matches, retaining the Chinese fragments x+不/没+x and 不/没 inside VI; two physical lines verified. Full text2 scene, grammar/read/dialogue/listening instructions match. The scene wraps after khi. Grammar examples and listening options have no printed VI translations.',
97: 'Words 8–13 (在/读/大学/大学生/学/医), all glosses, raw POS and pinyin match. 医 has no body star. Four complete text2 roles and both follow-up instructions match. The last pair instruction wraps before thực tế. Chinese/VI dialogue association and speakers verified.',
98: 'The complete four-line 在/正在 explanation retains all three structures, 呢, and 没(有); all fragments and punctuation match. Text3 scene about Lưu Minh leaving for hospital overtime, heading and listening instruction match. All grammar examples and listening options are Chinese/pinyin only.',
99: 'Twelve words 14–25, all raw POS/glosses and pinyin match, including giới. for 对 and đtnn. for 要. Chinese text3 has six whole roles, with turn6 extending across three Chinese bubble lines. Reading instruction and both full bilingual questions match; VI role translations continue on100 and are explicitly anchored here.',
100: 'Six full VI text3 roles match all Chinese turns on99 with correct Lưu Minh / Lưu Tiểu Tuyết attribution. Sixth VI role has two printed lines, split after hôm nay. Full 要 grammar title/explanation and all instructions, exercise heading and fill-blank instruction match. Grammar explanation wraps before gì đó.; no invented VI answers for Chinese-only examples.',
101: 'Picture instruction, Hoạt động trên lớp, pair activity title, complete instruction and Ví dụ của Tiểu Ngữ label match. Four picture stems and activity example remain Chinese only. Whole page reviewed to the end; lesson11 closes here.',
102: 'Whole boundary actually viewed: Bài12 / 昨天下雪了 / Hôm qua tuyết rơi rồi starts the next chapter, outside lesson11 accepted body records.',
138: 'Whole shared appendix reviewed: book header, Bảng đối chiếu từ loại, both groups of three headers, all16 Chinese/VI POS terms and actual abbreviations, Bảng từ vựng, six index headers and full star footnote match. Modal abbreviation is đtnn.; prefix/suffix are ttố./htố. The modal term has two printed lines. Quoted star is ASCII *. Index body has Chinese, pinyin and lesson numbers only.',
139: 'Both three-column index headers match; seven relevant rows 车/大学/大学生/弟弟/读/对/饭店 match actual Chinese/pinyin/lesson numbers. 对 explicitly lists3,11. No Vietnamese glosses in index body; whole page actually viewed.',
140: 'Shared book header and both three-column index headers match. Relevant 开车 / kāichē /11 row actually checked; index body contains no Vietnamese word definitions.',
141: 'Both three-column index headers match. Relevant 哪里/那里/起床/时候 rows, actual pinyin and lesson11 references checked. Whole appendix page has no VI glosses in index body.',
142: 'Shared book header and both three-column headers match. Relevant 睡/睡觉/说/问/小朋友/学 rows all checked for Chinese/pinyin/11; no VI index definitions.',
143: 'Both index header groups match. Relevant 要/医/在/找/正在/知道/昨天 rows checked. Appendix prints *医; separate from unstarred body医. 要 references11,13,15 and 在 references7,8,11 retained. No VI word glosses in index body.',
144: 'Whole final proper-name index page viewed. Book header, Danh từ riêng and both three-column VI header groups match. Proper names have Chinese/pinyin/lesson references only, no VI proper-name meanings to infer.',
145: 'Whole post-appendix boundary page viewed; it is blank, with no printed VI. Excluded from appendix source occurrences.'
}
assert set(manual)=={p['pdfPage'] for p in render['pages']}
decisions=[]
for x in records:
    row={
        'occurrenceId':x['occurrenceId'],'decision':'accept-source-transcription',
        'scope':'lesson-body' if x in body else 'shared-appendix-deduplicate-by-source-id',
        'category':x['category'],'pdfPage':x['pdfPage'],'printedPage':x['printedPage'],
        'verifiedVietnamese':x['viText'],'verifiedChineseContext':x['zhContext'],
        'verifiedFragments':x['fragments'],'pageObservationRef':str(x['pdfPage']),
        'evidence':f"renders/pdf-{x['pdfPage']:03}-independent.png",
        'checks':['original printed VI spelling/diacritics/case/punctuation',
                  'complete printed phrases and physical line fragments',
                  'whole original page coverage and context association']
    }
    for key in ['speakerZh','speakerViPrinted','zhAnchorPDFPage','zhAnchorPrintedPage','textNumber','dialogueLine','printOrdinal','physicalColumnGroup','tableRow']:
        if key in x:row[key]=x[key]
    if x['category']=='dialogue-translation':
        row['chineseAnchorEvidence']=f"renders/pdf-{x['zhAnchorPDFPage']:03}-independent.png"
        row['wholeBilingualTurnManuallyVerified']=True
    decisions.append(row)
now=datetime.now(timezone.utc).isoformat()
review={
    'schemaVersion':2,'courseId':'hsk1','lesson':11,'reviewer':'/root',
    'author':source['authorReview'],'sourceSHA256':sha(source_bytes),
    'sourcePDFSHA256':source['sourcePDF']['sha256'],'authorFreezeSHA256':render['authorFreezeSHA256'],
    'method':'Independent actual full-page review of original uploaded PDF and all frozen source records. Structural guards are a separate check, not a substitute for manual reading.',
    'status':'accepted-source-transcription','acceptedOccurrenceCount':120,
    'acceptedSharedAppendixOccurrenceCount':88,'acceptedTotalReviewedPhysicalOccurrenceCount':208,
    'sharedAppendixCountingPolicy':'Reuse 88 shared physical source IDs across lessons; never count them as new occurrences in each chapter.',
    'repairs':[],'holds':[],'missingPrintedVietnamese':[],
    'pageObservations':{str(p):{'pdfPage':p,'printedPage':f'{p-16:03}',
        'actuallyViewedWholePage':True,'sourceOccurrenceCount':sum(x['pdfPage']==p for x in records),
        'scope':next(x['scope'] for x in render['pages'] if x['pdfPage']==p),'observation':note}
        for p,note in manual.items()},
    'bodyCategoryCounts':dict(Counter(x['category'] for x in body)),
    'sharedAppendixCategoryCounts':dict(Counter(x['category'] for x in appendix)),
    'decisions':decisions,'verifiedWordRows':source['wordTableRows'],
    'verifiedAppendixRelevantIndexRows':source['appendixRelevantIndexRows'],
    'layoutContinuationsVerified':source['layoutContinuations'],
    'textbookSemanticObservations':[
        {'occurrenceId':'hsk1-official-vi-l11-pdf095-text-1-role-04',
         'observation':'Printed VI says đang đi taxi đây where Chinese says 坐车呢. Taxi is a narrower contextual interpretation of riding in a vehicle; retain actual book wording for source alignment, with no claim of a general synonym or textbook erratum.',
         'classification':'source-faithful-narrower-contextual-translation','requiresErratum':False},
        {'word':'医','observation':'Body97 has unstarred 医; appendix143 has *医. These independently observed markings are preserved in their own physical contexts.'}
    ],
    'websiteVietnameseRead':False,'websiteFieldVerificationComplete':False,
    'runtimeActivation':False,'productionDeployment':False,'reviewCompletedAtUTC':now
}
def write_once(path,value):
    assert not path.exists(),f'Immutable output already exists: {path}'
    path.write_bytes((json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode())
write_once(OUT/'review.json',review)
write_once(OUT/'validation.json',{
    'status':'passed','checkedAtUTC':now,'sourceInputSHA256':sha(source_bytes),
    'authorFreezeFilesVerified':len(render['verifiedFrozenAuthorFiles']),
    'freshWholePagePNGsDecodedAndHashed':17,'wholePagesActuallyViewed':list(manual),
    'bodyDecisionIdsExactlyEqual120SourceIds':True,'sharedDecisionIdsExactlyEqual88SourceIds':True,
    'ordinaryWords':25,'properNames':0,'printedOrdinaryPOS':25,'dialogueTurns':14,
    'dialogueTurnsByText':{'1':4,'2':4,'3':6},'crossPageZH99VI100Roles':6,
    'appendixPOSClasses':16,'appendixRelevantIndexRows':25,
    'physicalLineJoinEqualsExactVIText':True,'manualReviewSeparateFromStructuralGuards':True,
    'boundaryPagesExcludedFromAcceptedOccurrences':[102,145],
    'sourceDocumentsModified':False,'runtimeModified':False
})
files=[]
for p in sorted(OUT.rglob('*')):
    if p.is_file():
        b=p.read_bytes();files.append({'file':str(p.relative_to(ROOT)),'bytes':len(b),'sha256':sha(b)})
for p in [Path(__file__),ROOT/'course-app/docs/recovery-20261005/qa-tools/render-independent-hsk1-new-source-v2.py']:
    b=p.read_bytes();files.append({'file':str(p.relative_to(ROOT)),'bytes':len(b),'sha256':sha(b)})
freeze={'schemaVersion':2,'capsuleId':'hsk1-l11-independent-source-review-20261005',
    'courseId':'hsk1','lesson':11,'reviewer':'/root','stage':'independent-source-review',
    'status':'accepted-source-transcription','acceptedOccurrenceCount':120,
    'acceptedSharedAppendixOccurrenceCount':88,'files':files,'frozenAtUTC':now,
    'remoteSynchronizationStatus':'pending-readback'}
write_once(OUT/'FREEZE.json',freeze)
fp=OUT/'FREEZE.json';fb=fp.read_bytes()
write_once(OUT/'STAGE.json',{
    'schemaVersion':2,'capsuleId':freeze['capsuleId'],'courseId':'hsk1','lesson':11,
    'stage':'independent-source-review','status':'accepted-source-transcription',
    'acceptedOccurrenceCount':120,'acceptedSharedAppendixOccurrenceCount':88,
    'freeze':str(fp.relative_to(ROOT)),'freezeSHA256':sha(fb),
    'files':files+[{'file':str(fp.relative_to(ROOT)),'bytes':len(fb),'sha256':sha(fb)}],
    'productionDeployment':False
})
print(json.dumps({'lesson':11,'sourceOccurrencesAccepted':120,'sharedAppendixAccepted':88,
    'freezeSHA256':sha(fb),'stageSHA256':sha((OUT/'STAGE.json').read_bytes()),
    'stage':str((OUT/'STAGE.json').relative_to(ROOT)),'stageFileCount':len(files)+2}))
