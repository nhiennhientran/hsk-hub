from pathlib import Path
import collections, hashlib, json, subprocess, tempfile
import fitz
from PIL import Image

B = Path(__file__).resolve().parent
R = B.parents[4]
A = R / 'course-app/docs/resume-20261004/official-vi-source-prep/hsk3-l04'
P = R.parent / 'upload/HSK3 (3.0).pdf'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
load = lambda p: json.loads(p.read_text())
a = load(B / 'author-input/source-transcription.json')
r = load(B / 'review.json')
o = load(B / 'independent-observations.json')
m = load(B / 'render-manifest.json')
c = load(B / 'fresh-crop-manifest.json')
assert sha(P) == a['officialPDFSHA256'] == '7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951'
assert P.stat().st_size == a['officialPDFBytes'] == 96266563
for name, expected in [('source-transcription.json','644727f2bfc774c0a6c8c3327afedcc7c72e0a09d12c4cd70361729628c49805'),('freeze-manifest.json','c56f180fdb3b81978757541a1a86732a9cefda9b83603b897e2a1f2faa420b32')]:
    assert sha(A/name) == sha(B/'author-input'/name) == expected
f = load(A / 'freeze-manifest.json')
assert len(f['artifacts']) == 31
for x in f['artifacts']:
    p = A / x['path']
    assert sha(p) == x['sha256'] and p.stat().st_size == x['bytes'], x['path']
    if p.suffix == '.png':
        with Image.open(p) as im: im.verify()
for name in ['source-page-evidence.json','source-detail-crop-evidence.json']:
    assert sha(A/name) == sha(B/'author-input'/name)
pages = list(range(41,50)) + [197,198]
assert r['manuallyReadOriginalPDFPages'] == pages
assert len(a['records']) == len(set(x['sourceId'] for x in a['records'])) == 112
assert [x['sourceId'] for x in r['perSourceItem']] == [x['sourceId'] for x in a['records']] == r['acceptedSourceIds']
assert [i for p in r['perPage'] for i in p['candidateIDsCompared']] == r['acceptedSourceIds']
assert collections.Counter(x['status'] for x in r['perSourceItem']) == {'accepted':112}
assert [x['candidateRecord'] for x in r['perSourceItem']] == a['records']
assert all(x['allCandidateFieldsReviewed'] for x in r['perSourceItem'])
assert not load(B/'repair-list.json')['repairs'] and not r['missing'] and not r['holds']
words = [x for x in a['records'] if x.get('sourceWordKind') == 'ordinary-numbered-word']
assert len(words) == 27 and [x['printedNumber'] for x in words] == list(range(1,28)) and all(x['posPrinted'] for x in words)
assert [[x['zhAnchor'],x['viPrinted'],x['printedPOSRaw'],x['printedPinyin']] for x in words] == o['independentWordReadings']
inline = [x for x in a['records'] if x.get('sourceWordKind') == 'inline-example-gloss']
assert [[x['zhAnchor'],x['viPrinted'],x['printedPOSRaw'],x['printedPinyin']] for x in inline] == o['independentInlineReadings']
assert len(inline) == 1 and not inline[0]['posPrinted']
assert not any(x.get('sourceWordKind') == 'proper-noun-word' for x in a['records'])
roles = [x for x in a['records'] if x.get('sourceAppendixKind') == 'role-dialogue-line']
assert len(roles) == 21
for n in [1,2,3]:
    rows = [x for x in roles if x['printedTextNumber'] == n]
    assert [x['printedDialogueOrdinal'] for x in rows] == list(range(1,8))
    assert [x['printedRoleVi'] for x in rows] == o['rolesVI'][n-1]
    assert [x['correspondingBodyRoleZh'] for x in rows] == o['rolesZH'][n-1]
byid = {x['sourceId']:x for x in a['records']}
body = a['bodyChineseOnlyTexts']
assert len(body) == len(set(x['bodySourceId'] for x in body)) == 22
assert [x['candidateRecord'] for x in r['bodyBindings']] == body and all(x['status']=='accepted' for x in r['bodyBindings'])
for x in body:
    assert not x['printedVietnameseInBody'] and len(x['appendixSourceIds']) == 1
    y = byid[x['appendixSourceIds'][0]]
    assert y['bodyChineseSourceRef'] == x['bodySourceId'] and y['zhAnchor'] == x['zhPrinted']
    assert (y['zhAnchorPDFPage'],y['zhAnchorPrintedPage']) == (x['pdfPage'],x['printedPage'])
    if x['sourceBodyKind'] == 'role-dialogue-line': assert y['correspondingBodyRoleZh'] == x['printedRoleZh']
para = byid['hsk3-official-vi:l04:p185:appendix-text4-whole-paragraph']
assert para['printedSpeaker'] is None and para['noWebsiteLinePartitionInferred'] and para['viPrinted'] == o['wholeDiaryReading']
assert [(x['pdfPage'],x['printedPage'],x['column']) for x in para['viPrintedFragments']] == [(197,185,'right'),(198,186,'left'),(198,186,'right')]
assert ' '.join(x['viPrinted'] for x in para['viPrintedFragments']) == para['viPrinted']
assert para['allSourcePDFPages'] == [197,198] and para['allSourcePrintedPages'] == [185,186]
assert sum('explanation' in x['section'] for x in a['records']) == 6 == o['grammarExplanationOccurrences']
assert not o['summaryPrinted'] and not o['videoPrinted'] and not o['missingPrintedVietnamese']
assert not any('video' in x['section'] or 'summary' in x['section'] for x in a['records'])
assert o['nextLessonBoundary']['lessonNumber'] == 5 and o['nextLessonBoundary']['pdfPage'] == 50
D = fitz.open(P)
assert len(D) == 212 and [x['pdfPage'] for x in m['renders']] == pages and len(c['crops']) == 4
proof = {x['pdfPage']:x for x in a['readProof']}
for x in m['renders']:
    p = B / x['path']
    assert x['freshByIndependentReviewer'] and x['state']=='independently-visually-read-complete'
    assert sha(p) == x['sha256'] and p.stat().st_size == x['bytes']
    with Image.open(p) as im: im.verify()
    if x['pdfPage'] < 190: assert sha(p)==proof[x['pdfPage']]['renderSHA256']
rerenders = []
with tempfile.TemporaryDirectory(prefix='hsk3-l04-recovery-independent-') as td:
    for n in pages:
        x = proof[n]
        target = Path(td) / str(n)
        argv = ['pdftoppm','-f',str(n),'-l',str(n),'-r',str(x['renderDPI']),'-cropbox','-singlefile','-png',str(P),str(target)]
        result = subprocess.run(argv,check=True,capture_output=True,text=True)
        p = target.with_suffix('.png')
        with Image.open(p) as im: im.verify()
        assert sha(p)==x['renderSHA256']==sha(A/x['permanentRenderPath']) and p.stat().st_size==x['renderBytes']
        rerenders.append({'pdfPage':n,'renderDPI':x['renderDPI'],'sha256':sha(p),'bytes':p.stat().st_size,'matchesRecoveredFrozenAuthorBytes':True,'exitCode':result.returncode})
for x in c['crops']:
    p=D[x['pdfPage']-1];v=x['clipFraction'];q=p.rect;clip=fitz.Rect(q.width*v[0],q.height*v[1],q.width*v[2],q.height*v[3])
    assert hashlib.sha256(p.get_pixmap(matrix=fitz.Matrix(x['scale'],x['scale']),clip=clip,alpha=False).tobytes('png')).hexdigest()==x['sha256']==sha(B/x['path'])
    assert x['state']=='independently-visually-read-complete' and (B/x['path']).stat().st_size==x['bytes']
assert r['author'] != r['reviewer'] and not r['websiteVIRead'] and not r['runtimeActivation'] and not r['websiteAcceptanceAsserted'] and not r['savedAcceptedAsserted']
print(json.dumps({'status':'passed','scope':'HSK3L4 recovered source-only independent review','authorFrozenArtifacts':31,'sourceItems':112,'accepted':112,'repair':0,'hold':0,'missing':0,'bodyBindings':22,'originalPDFPages':212,'actualWholePagesRead':11,'originalPDFFullpageRerenderMatches':rerenders,'freshDetailAndBoundaryCropsReadAndRerenderMatches':4,'websiteAcceptance':False,'runtimeActivated':False,'durability':'remote-readback-pending-at-local-freeze'},ensure_ascii=False,indent=2))
