"""V4 adds explicit per-boundary line joiners; preserve immutable V3."""
import argparse
import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[4]
ap=argparse.ArgumentParser();ap.add_argument('lesson',type=int,choices=range(12,16));args=ap.parse_args()
OUT=ROOT/f'course-app/docs/recovery-20261005/qa-official-vi/hsk1-l{args.lesson:02}'
sha=lambda b:hashlib.sha256(b).hexdigest()
notes=json.loads((OUT/'manual-notes.json').read_bytes())
assert notes['reviewer']=='/root' and notes['lesson']==args.lesson
assert notes['status']=='all-source-records-manually-reviewed'
source_bytes=(OUT/notes['selectedSource']).read_bytes();source=json.loads(source_bytes)
assert sha(source_bytes)==notes['selectedSourceSHA256']
assert source['authorReview']['reviewer']!='/root' and source['lesson']==args.lesson
render=json.loads((OUT/'render-manifest.json').read_bytes())
assert sha((OUT/'author-input/source.json').read_bytes())==render['authorSourceSHA256']
assert sha((OUT/'author-input/FREEZE.json').read_bytes())==render['authorFreezeSHA256']
body=source['occurrences'];app=source['appendixOccurrences'];records=body+app
assert len(body)==notes['bodyOccurrenceCount'] and len(app)==88
assert len({x['occurrenceId'] for x in records})==len(records)
assert len(source['wordTableRows'])==notes['wordRows']
assert len({x['zhPrinted'] for x in source['wordTableRows']})==notes['uniqueWordHeadwords']
assert sum(x['category']=='word-pos' for x in body)==notes['printedPOS']
assert dict(Counter(str(x['textNumber']) for x in body if x['category']=='dialogue-translation'))==notes['dialogueTurnsByText']
assert set(map(int,notes['pageObservations']))=={r['pdfPage'] for r in render['pages']}
for r in render['pages']:
    p=OUT/r['file'];b=p.read_bytes();assert len(b)==r['bytes'] and sha(b)==r['sha256']
    with Image.open(p) as im:im.load();assert list(im.size)==[r['width'],r['height']]
for r in render['verifiedFrozenAuthorFiles']:
    b=(ROOT/r['file']).read_bytes();assert len(b)==r['bytes'] and sha(b)==r['sha256']
for r in notes.get('verifiedAdditionalAuthorFiles',[]):
    b=(ROOT/r['file']).read_bytes();assert len(b)==r['bytes'] and sha(b)==r['sha256']
def physical_fragment_text(f):
    lines=f['lineTexts']
    assert lines
    if 'lineJoiners' not in f:return f.get('lineJoiner',' ').join(lines)
    assert 'lineJoiner' not in f
    joiners=f['lineJoiners'];assert len(joiners)==len(lines)-1
    assert all(j in [' ', ''] for j in joiners)
    return lines[0]+''.join(j+t for j,t in zip(joiners,lines[1:]))
for x in records:
    text=' '.join(physical_fragment_text(f) for f in x['fragments'])
    assert text==x['viText'],x['occurrenceId']
    assert x['printedPage']==f"{x['pdfPage']-16:03}"
    assert all(str(f['pdfPage']) in notes['pageObservations'] for f in x['fragments'])

# Shared physical source evidence may be reused only after exact input and
# raster equality, with the original actual manual reading explicitly linked.
prior=ROOT/'course-app/docs/recovery-20261005/qa-official-vi/hsk1-l11'
prior_bytes=(prior/'review.json').read_bytes();prior_review=json.loads(prior_bytes)
assert prior_review['status']=='accepted-source-transcription'
prior_source=json.loads((prior/'author-input/source.json').read_bytes())
assert app==prior_source['appendixOccurrences']
for p in range(138,146):
    assert (OUT/f'renders/pdf-{p:03}-independent.png').read_bytes()==(prior/f'renders/pdf-{p:03}-independent.png').read_bytes()
    assert prior_review['pageObservations'][str(p)]['actuallyViewedWholePage']
decisions=[]
for x in records:
    d={'occurrenceId':x['occurrenceId'],'decision':'accept-source-transcription',
        'scope':'lesson-body' if x in body else 'shared-appendix-deduplicate-by-source-id',
        'category':x['category'],'pdfPage':x['pdfPage'],'printedPage':x['printedPage'],
        'verifiedVietnamese':x['viText'],'verifiedChineseContext':x['zhContext'],
        'verifiedFragments':x['fragments'],'pageObservationRef':str(x['pdfPage']),
        'evidence':f"renders/pdf-{x['pdfPage']:03}-independent.png",
        'checks':['original printed words/diacritics/punctuation/case',
                  'complete phrase and actual line/page fragments',
                  'whole-page coverage and Chinese context/POS/speaker binding']}
    for k in ['speakerZh','speakerViPrinted','zhAnchorPDFPage','zhAnchorPrintedPage','textNumber','dialogueLine','printOrdinal','physicalColumnGroup','tableRow']:
        if k in x:d[k]=x[k]
    if x['category']=='dialogue-translation':
        assert str(x['zhAnchorPDFPage']) in notes['pageObservations']
        d['chineseAnchorEvidence']=f"renders/pdf-{x['zhAnchorPDFPage']:03}-independent.png"
        d['wholeBilingualTurnManuallyVerified']=True
    decisions.append(d)
now=datetime.now(timezone.utc).isoformat()
review={'schemaVersion':3,'courseId':'hsk1','lesson':args.lesson,'reviewer':'/root',
    'author':source['authorReview'],'sourceSHA256':sha(source_bytes),
    'sourcePDFSHA256':source['sourcePDF']['sha256'],'originalAuthorFreezeSHA256':render['authorFreezeSHA256'],
    'selectedAuthorInput':notes['selectedSource'],'selectedAuthorRevision':notes['selectedAuthorRevision'],
    'status':'accepted-source-transcription','acceptedOccurrenceCount':len(body),
    'acceptedSharedAppendixOccurrenceCount':88,
    'sharedAppendixCountingPolicy':'88 shared physical source IDs; count once globally.',
    'method':'Root actually manually compared every body source record with whole original pages. Shared appendix is linked to the actual prior root reading only after exact source-object and original-raster equality. Structural guards do not confer manual acceptance.',
    'pageObservations':notes['pageObservations'],'decisions':decisions,
    'bodyCategoryCounts':dict(Counter(x['category'] for x in body)),
    'sharedAppendixCategoryCounts':dict(Counter(x['category'] for x in app)),
    'verifiedWordRows':source['wordTableRows'],'verifiedAppendixRelevantIndexRows':source['appendixRelevantIndexRows'],
    'layoutContinuationsVerified':source['layoutContinuations'],
    'sharedAppendixOriginalManualReview':str((prior/'review.json').relative_to(ROOT)),
    'sharedAppendixOriginalManualReviewSHA256':sha(prior_bytes),
    'resolvedAuthorTranscriptionRepairs':notes.get('resolvedAuthorTranscriptionRepairs',[]),
    'textbookSemanticObservations':notes.get('textbookSemanticObservations',[]),
    'repairs':[],'holds':[],'missingPrintedVietnamese':[],
    'websiteVietnameseRead':False,'websiteFieldVerificationComplete':False,
    'runtimeActivation':False,'productionDeployment':False,'reviewCompletedAtUTC':now}
def write_once(p,v):
    assert not p.exists(),f'Immutable output already exists: {p}'
    p.write_bytes((json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode())
write_once(OUT/'review.json',review)
write_once(OUT/'validation.json',{'status':'passed','checkedAtUTC':now,
    'bodyOccurrenceCount':len(body),'sharedAppendixPhysicalIds':88,
    'decisionIdsExactlyMatchSelectedSource':True,'sourceSHA256':sha(source_bytes),
    'frozenAuthorFilesVerified':len(render['verifiedFrozenAuthorFiles']),
    'additionalAuthorFilesVerified':len(notes.get('verifiedAdditionalAuthorFiles',[])),
    'freshPNGsDecodedAndHashed':len(render['pages']),
    'sharedAppendixInputObjectsDeepEqualPriorReviewedSource':True,
    'sharedAppendixPNGsByteEqualPriorActuallyViewedPages':True,
    'physicalLineJoinerChecksPassed':True,'manualReviewSeparateFromStructuralChecks':True,
    'ordinaryWordRows':notes['wordRows'],'uniqueHeadwords':notes['uniqueWordHeadwords'],
    'printedPOS':notes['printedPOS'],'dialogueTurnsByText':notes['dialogueTurnsByText'],
    'runtimeModified':False})
files=[]
paths=[p for p in sorted(OUT.rglob('*')) if p.is_file()]
paths += [Path(__file__),ROOT/'course-app/docs/recovery-20261005/qa-tools/render-independent-hsk1-new-source-v2.py',prior/'review.json',prior/'FREEZE.json']
for p in paths:
    b=p.read_bytes();files.append({'file':str(p.relative_to(ROOT)),'bytes':len(b),'sha256':sha(b)})
assert len({r['file'] for r in files})==len(files)
freeze={'schemaVersion':3,'capsuleId':f'hsk1-l{args.lesson:02}-independent-source-review-20261005',
    'courseId':'hsk1','lesson':args.lesson,'reviewer':'/root','stage':'independent-source-review',
    'status':'accepted-source-transcription','acceptedOccurrenceCount':len(body),
    'acceptedSharedAppendixOccurrenceCount':88,'files':files,'frozenAtUTC':now,
    'remoteSynchronizationStatus':'pending-readback'}
write_once(OUT/'FREEZE.json',freeze);fp=OUT/'FREEZE.json';fb=fp.read_bytes()
write_once(OUT/'STAGE.json',{'schemaVersion':3,'capsuleId':freeze['capsuleId'],
    'courseId':'hsk1','lesson':args.lesson,'stage':'independent-source-review',
    'status':'accepted-source-transcription','acceptedOccurrenceCount':len(body),
    'acceptedSharedAppendixOccurrenceCount':88,'freeze':str(fp.relative_to(ROOT)),
    'freezeSHA256':sha(fb),'files':files+[{'file':str(fp.relative_to(ROOT)),'bytes':len(fb),'sha256':sha(fb)}],
    'productionDeployment':False})
print(json.dumps({'lesson':args.lesson,'bodyAccepted':len(body),'sharedAcceptedDeduplicate':88,
    'freezeSHA256':sha(fb),'stageSHA256':sha((OUT/'STAGE.json').read_bytes()),
    'stage':str((OUT/'STAGE.json').relative_to(ROOT)),'stageFiles':len(files)+2}))
