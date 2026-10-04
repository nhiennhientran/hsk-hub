from pathlib import Path
import hashlib,json,collections,fitz
B=Path(__file__).resolve().parent
R=B.parents[4]
PDF=R.parent/'upload/HSK1  (3.0).pdf'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
a=json.load(open(B/'author-input/source-transcription.json'));r=json.load(open(B/'review.json'));o=json.load(open(B/'independent-observations.json'))
assert sha(PDF)==a['sourcePDF']['sha256']=='99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764'
assert sha(B/'author-input/source-transcription.json')=='1ae245d66f6dab2ecb5b0d77b4839bd1a42c7a70274e3dd4ed51b6b480943dff'
assert sha(B/'author-input/freeze-manifest.json')=='bb90392210f5442bf4d74be9e5c810597df6c0978171bd5b766544bd4ba727b5'
A=R/'course-app/docs/resume-20261004/official-vi-source-prep/hsk1-l05'
for n in ['source-transcription.json','freeze-manifest.json']:assert sha(A/n)==sha(B/'author-input'/n)
f=json.load(open(A/'freeze-manifest.json'))
for x in f['files']:assert sha(A/x['file'])==x['sha256'] and (A/x['file']).stat().st_size==x['bytes']
ids=[x['occurrenceId'] for x in a['occurrences']];assert len(ids)==len(set(ids))==141
assert [x['occurrenceId'] for x in r['perOccurrence']]==ids
assert [v for p in o['manualPageDecisions'] for v in p['allIDsVisuallyCompared']]==ids
assert o['manuallyReadOriginalPDFPages']==a['pdfPages']==list(range(43,51))
assert dict(collections.Counter(x['status'] for x in r['perOccurrence']))=={'accepted':137,'repair':4}
repairs={x['occurrenceId']:x for x in o['repairs']};assert set(repairs)=={x['occurrenceId'] for x in r['perOccurrence'] if x['status']=='repair'}
for candidate,decision in zip(a['occurrences'],r['perOccurrence']):
 assert decision['candidateVIText']==candidate['viText'] and decision['printedVITextAccepted'] is True
 assert decision['candidateZHContext']==candidate['zhContext']
 assert decision['candidatePhysicalLines']==[x['lineTexts'] for x in candidate['fragments']]
 if decision['status']=='repair':assert decision['repair']=={k:repairs[decision['occurrenceId']][k] for k in ['field','old','new']}
assert len(a['wordTableRows'])==22
assert [x['rawPosLabel'] for x in a['wordTableRows'] if x['zhPrinted']=='做饭']==[None]
assert [x['rawPosLabel'] for x in a['wordTableRows'] if x['zhPrinted']=='会']==['đtnn.']
D=fitz.open(PDF);assert len(D)==148
for p in range(43,51):
 expected=B/'renders'/f'pdf-{p:03}-independent.png'
 actual=D[p-1].get_pixmap(matrix=fitz.Matrix(3,3),alpha=False).tobytes('png')
 assert hashlib.sha256(actual).hexdigest()==sha(expected)
for n,name,rect in [(45,'grammar-02-lines',(60,525,435,616)),(48,'word-gloss-lines',(50,374,438,514)),(50,'activity-zh-context',(62,93,435,138))]:
 p=D[n-1];w,h=p.rect.width,p.rect.height;clip=fitz.Rect(rect[0]*w/438,rect[1]*h/624,rect[2]*w/438,rect[3]*h/624)
 q=B/'renders'/f'pdf-{n:03}-{name}-independent.png';assert hashlib.sha256(p.get_pixmap(matrix=fitz.Matrix(5,5),clip=clip,alpha=False).tobytes('png')).hexdigest()==sha(q)
for n in ['render-manifest.json','crop-manifest.json']:
 m=json.load(open(B/n))
 for x in m['renders']:assert sha(B/x['file'])==x['sha256']
print('PASS originalPDF exact SHA/148 pages, all eight 3x pages+three 5x crop bytes; author17 files unchanged; 141 exact IDs/137 accepted/4 precise repair/0missing/0hold; VI contents all accepted; no runtime or website audit claim')
