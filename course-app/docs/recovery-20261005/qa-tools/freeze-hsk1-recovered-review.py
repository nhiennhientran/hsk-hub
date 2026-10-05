"""Package explicitly supplied manual review notes; guards cannot assess language."""
import argparse, hashlib, json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
ap=argparse.ArgumentParser();ap.add_argument('lesson',type=int,choices=[9,10]);args=ap.parse_args()
OUT=ROOT/f'course-app/docs/recovery-20261005/qa-official-vi/hsk1-l{args.lesson:02}'
sha=lambda b:hashlib.sha256(b).hexdigest()
def dump(name,obj):
    p=OUT/name;assert not p.exists(),f'Never overwrite a frozen review: {p}'
    p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
source_bytes=(OUT/'author-input/source-transcription.json').read_bytes();s=json.loads(source_bytes)
notes=json.loads((OUT/'manual-page-observations.json').read_bytes())
manifest=json.loads((OUT/'render-manifest.json').read_bytes())
expected={9:('89b418c7af8880d4f71a7c25bbde1a4ca7e29aeb9f30fd86933d3dbf049fbdad',144,23,0,14),
          10:('440d516685e524134c62da255a74a5112ece1f61d4ad668cc088d2a8766f65c9',121,22,1,14)}
source_sha,count,ordinary,proper,roles=expected[args.lesson]
assert s['lesson']==args.lesson and sha(source_bytes)==source_sha==manifest['authorSourceSHA256']
assert notes['reviewer']=='/root' and notes['lesson']==args.lesson
assert notes['sourceSHA256']==source_sha and notes['method']=='actual-manual-original-PDF-review'
page_set=set(s['pdfPages'])|{max(s['pdfPages'])+1}
assert {x['pdfPage'] for x in notes['pages']}==page_set
assert all(x['actuallyViewedWholePage'] and x['observation'] for x in notes['pages'])
occ=s['occurrences'];ids=[x['occurrenceId'] for x in occ]
assert len(ids)==len(set(ids))==count
assert notes['allOccurrenceIdsActuallyCompared']==ids
assert sum(x['category']=='dialogue-translation' for x in occ)==roles
assert sum(x['kind']=='ordinary' for x in s['wordTableRows'])==ordinary
assert sum(x['kind']=='properName' for x in s['wordTableRows'])==proper
for row in manifest['verifiedFrozenAuthorFiles']:
    data=(ROOT/row['file']).read_bytes();assert len(data)==row['bytes'] and sha(data)==row['sha256']
for row in manifest['pages']:
    p=OUT/row['file'];b=p.read_bytes();assert len(b)==row['bytes'] and sha(b)==row['sha256']
    with Image.open(p) as im:
        im.load();assert im.size==(row['width'],row['height'])
assert sha((OUT/'author-input/freeze-manifest.json').read_bytes())==manifest['authorFreezeSHA256']
now=datetime.now(timezone.utc).isoformat()
review={'schemaVersion':1,'courseId':'hsk1','lesson':args.lesson,'reviewer':'/root',
        'author':s['authorReview'],'status':'accepted-source-transcription',
        'sourceSHA256':source_sha,'sourcePDFSHA256':s['sourcePDF']['sha256'],
        'authorFreezeSHA256':manifest['authorFreezeSHA256'],'acceptedOccurrenceCount':count,
        'method':notes['method'],'pageObservations':notes['pages'],
        'categoryCounts':dict(Counter(x['category'] for x in occ)),
        'decisions':[{'occurrenceId':x['occurrenceId'],'decision':'accept-source-transcription',
                      'pdfPage':x['pdfPage'],'printedPage':x['printedPage'],'category':x['category'],
                      'verifiedVietnamese':x['viText'],'verifiedChineseContext':x['zhContext'],
                      'verifiedFragments':x['fragments'],
                      'speakerZh':x.get('speakerZh'),'ChineseAnchorPDFPage':x.get('zhContextSourcePage',x['pdfPage']),
                      'scopeLessons':x.get('scopeLessons',[args.lesson]),
                      'checks':['whole printed Vietnamese spelling/accents/punctuation','complete physical fragments and page anchor','Chinese association and speaker/printed POS where present'],
                      'evidence':f"renders/pdf-{x['pdfPage']:03}-independent.png"} for x in occ],
        'verifiedWordRows':s['wordTableRows'],'layoutContinuationsVerified':s['layoutContinuations'],
        'repairs':[],'holds':[],'missingPrintedVietnamese':[],
        'textbookSemanticObservations':notes['textbookSemanticObservations'],
        'websiteVietnameseRead':False,'websiteFieldVerificationComplete':False,
        'runtimeActivation':False,'productionDeployment':False,'reviewCompletedAtUTC':now}
dump('review.json',review)
dump('validation.json',{'status':'passed','checkedAtUTC':now,
                       'frozenAuthorFilesVerified':len(manifest['verifiedFrozenAuthorFiles']),
                       'freshWholePagePNGsHashedAndDecoded':len(manifest['pages']),
                       'exactSourceSHA256':source_sha,'reviewDecisionIdsExactlyEqualSourceIds':True,
                       'manualNotesCoverEveryWholeSourcePageAndBoundary':True,
                       'ordinaryWords':ordinary,'properNames':proper,'dialogueTurns':roles,
                       'guardScope':'structural input/output integrity; manual language judgments remain separate'})
files=[]
for p in sorted(OUT.rglob('*')):
    if p.is_file():
        b=p.read_bytes();files.append({'file':str(p.relative_to(ROOT)),'bytes':len(b),'sha256':sha(b)})
for p in [Path(__file__),ROOT/'course-app/docs/recovery-20261005/qa-tools/render-independent-hsk1.py']:
    b=p.read_bytes();files.append({'file':str(p.relative_to(ROOT)),'bytes':len(b),'sha256':sha(b)})
freeze={'schemaVersion':1,'capsuleId':f'hsk1-l{args.lesson:02}-independent-source-review-20261005',
        'courseId':'hsk1','lesson':args.lesson,'reviewer':'/root','stage':'independent-source-review',
        'status':'accepted-source-transcription','acceptedOccurrenceCount':count,
        'files':files,'frozenAtUTC':now,'remoteSynchronizationStatus':'pending-readback'}
dump('FREEZE.json',freeze)
f=OUT/'FREEZE.json';b=f.read_bytes()
dump('STAGE.json',{'schemaVersion':1,'capsuleId':freeze['capsuleId'],'courseId':'hsk1',
                   'lesson':args.lesson,'stage':'independent-source-review','status':freeze['status'],
                   'acceptedOccurrenceCount':count,'freeze':str(f.relative_to(ROOT)),
                   'freezeSHA256':sha(b),'files':files+[{'file':str(f.relative_to(ROOT)),'bytes':len(b),'sha256':sha(b)}],
                   'productionDeployment':False})
print(json.dumps({'lesson':args.lesson,'acceptedOccurrenceCount':count,'files':len(files)+2,
                  'freezeSHA256':sha(b),'stage':str((OUT/'STAGE.json').relative_to(ROOT))}))
