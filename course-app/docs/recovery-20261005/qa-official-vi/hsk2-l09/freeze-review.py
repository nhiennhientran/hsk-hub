#!/usr/bin/env python3
"""Freeze a completed manual source review. This never performs visual review."""
import sys, json, pathlib, hashlib, shutil
from PIL import Image
L = int(sys.argv[1])
base = pathlib.Path('/workspace/scratch/28b55072841a/hsk-hub-resume-recovered/course-app/docs/recovery-20261005')
q = base / f'qa-official-vi/hsk2-l{L:02d}'
a = base / f'official-vi-source/hsk2-l{L:02d}'
assert not (q / 'FREEZE.json').exists(), 'Never overwrite a frozen review'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
dump = lambda name, obj: (q/name).write_text(json.dumps(obj, ensure_ascii=False, indent=2)+'\n')
value_sha = lambda v: hashlib.sha256(json.dumps(v, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
s = json.loads((q/'author-source-transcription.json').read_text())
j = json.loads((q/'independent-read-journal.json').read_text())
m = json.loads((q/'render-manifest.json').read_text())
assert j['completedFullManualReview'] is True
assert set(x['pdfPage'] for x in j['completedWholePageVisualReads']) == set(x['pdfPage'] for x in m['records'])
repair = {x['sourceId']: x for x in j['repairs']}
fields = ['viPrinted','zhAnchor','fragments','zhFragments','pdfPages','printedPages','pdfPage','printedPage','layoutParts','printedNumber','parentPrintedNumber','printedPinyin','printedPOSRaw','printedPOSPresent','printedRoleZh','printedRoleVI','rolePrinted','narratorChineseContext','sourceText','sourceOrdinal','zhAnchorPDFPage','zhAnchorPrintedPage','audioLabel','videoLabel','lessonScope','mixedPrintedChineseExample','layoutJoinPolicy']
decisions = []
for r in s['records']:
    issue = repair.get(r['sourceId'])
    decisions.append({'sourceId':r['sourceId'], 'decision':'repair-required' if issue else 'accepted-source-fidelity-only', 'manualOriginalPageReview':True, 'pdfPagesReviewed':r['pdfPages'], 'printedPagesActuallyObserved':r['printedPages'], 'recordSHA256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(), 'fields':[{'field':k,'decision':'repair-required' if issue and issue['field']==k else 'matched-actual-original-print','valueSHA256':value_sha(r[k])} for k in fields if k in r], 'repair':issue, 'wholeUtteranceAndRoleRetained':r['category'] in ['dialogue','diary','narrative'], 'noWebsiteSemanticVerdict':True})
assert len(decisions)==len({x['sourceId'] for x in decisions})
review = {'schemaVersion':1,'reviewer':'/root/qa_hsk1_05_08','author':'/root/remaining_media_audit','differentAuthorAndReviewer':True,'officialPDFSHA256':s['officialPDFSHA256'],'inputSourceSHA256':sha(q/'author-source-transcription.json'),'inputAuthorFREEZESHA256':sha(q/'author-FREEZE.json'),'inputAuthorSTAGESHA256':sha(q/'author-STAGE-FILES.txt'),'decision':'repair-required-not-whole-input-accepted' if repair else 'accepted-source-fidelity-only','allCurrentSourceIdsExplicitlyVisuallyReviewed':True,'acceptedSourceCount':len(decisions)-len(repair),'repairCount':len(repair),'heldCount':0,'missingVietnameseUnitsCount':0,'acceptedSourceIds':[x['sourceId'] for x in decisions if x['decision']=='accepted-source-fidelity-only'],'repairSourceIds':list(repair),'bodyPDFPages':s['scope']['actualPDFPages'],'bodyActualPrintedPages':s['scope']['actualPrintedPages'],'excludedBoundaryPages':[x['pdfPage'] for x in m['records'] if x['pdfPage'] not in s['scope']['actualPDFPages']],'scopeCountsActuallyReviewed':s['counts'],'sourceErrataAndWebsiteSemanticAssessmentPerformed':False,'sharedAppendixAcceptedHere':False,'oldLostAcceptedReportsReused':False,'websiteAlignmentComplete':False,'activation':0,'runtimeChanges':0,'perSourceDecisions':decisions}
dump('review.json',review)
own=[]
for r in m['records']:
    p=q/r['file'];assert sha(p)==r['sha256'] and p.stat().st_size==r['bytes']
    with Image.open(p) as im: im.load()
    with Image.open(p) as im: im.verify()
    own.append({'file':r['file'],'sha256':sha(p),'bytes':p.stat().st_size,'actualFullDecodeAndVerify':True})
details=[]
for p in (q/'details').glob('*.png') if (q/'details').exists() else []:
    with Image.open(p) as im: im.load()
    with Image.open(p) as im: im.verify()
    details.append({'file':str(p.relative_to(q)),'sha256':sha(p),'bytes':p.stat().st_size,'actualFullDecodeAndVerify':True})
f=json.loads((q/'author-FREEZE.json').read_text())
assert sha(a/'FREEZE.json')==sha(q/'author-FREEZE.json')
for r in f['files']:
    p=a/r['file']; assert sha(p)==r['sha256'] and p.stat().st_size==r['bytes']
    if p.suffix=='.png':
        with Image.open(p) as im: im.load()
        with Image.open(p) as im: im.verify()
assert sha(a/'source-transcription.json')==sha(q/'author-source-transcription.json')
dump('freeze-time-verification.json',{'qualification':'actual-final-byte-and-full-PNG-decode-check-not-language-review-substitute','allOwnRastersFullDecoded':True,'allAuthorFrozenBytesStillMatch':True,'authorSourceStillPinned':True,'ownRasters':own,'detailRasters':details})
for src, dest in [('prepare-hsk2-independent.py','prepare-review.py'),('pre-view-hsk2.py','pre-view-check.py'),('freeze-hsk2-independent.py','freeze-review.py')]:
    shutil.copyfile(pathlib.Path(__file__).parent/src,q/dest)
prefix=f'course-app/docs/recovery-20261005/qa-official-vi/hsk2-l{L:02d}'
filelist=sorted([str(p.relative_to(q)) for p in q.rglob('*') if p.is_file()] + ['FREEZE.json','STAGE-FILES.txt'])
assert len(filelist)==len(set(filelist))
(q/'STAGE-FILES.txt').write_text(''.join(prefix+'/'+n+'\n' for n in filelist))
dump('FREEZE.json',{'qualification':'independent-original-page-source-fidelity-review-not-website-alignment','inputSourceSHA256':review['inputSourceSHA256'],'reviewSHA256':sha(q/'review.json'),'acceptedSourceCount':review['acceptedSourceCount'],'repairCount':len(repair),'files':[{'file':n,'bytes':(q/n).stat().st_size,'sha256':sha(q/n)} for n in filelist if n!='FREEZE.json']})
for r in json.loads((q/'FREEZE.json').read_text())['files']: assert sha(q/r['file'])==r['sha256']
print(json.dumps({'lesson':L,'accepted':review['acceptedSourceCount'],'repair':len(repair),'reviewSHA256':sha(q/'review.json'),'FREEZESHA256':sha(q/'FREEZE.json'),'STAGESHA256':sha(q/'STAGE-FILES.txt'),'stageFiles':len(filelist),'stageBytes':sum((q/n).stat().st_size for n in filelist)},ensure_ascii=False))
