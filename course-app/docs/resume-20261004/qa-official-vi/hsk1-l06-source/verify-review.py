from pathlib import Path
import hashlib,json,collections,fitz
B=Path(__file__).resolve().parent;R=B.parents[4];PDF=R.parent/'upload/HSK1  (3.0).pdf';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
a=json.load(open(B/'author-input/source-transcription.json'));r=json.load(open(B/'review.json'));o=json.load(open(B/'independent-observations.json'));A=R/'course-app/docs/resume-20261004/official-vi-source-prep/hsk1-l06'
assert sha(PDF)==a['sourcePDF']['sha256']=='99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764'
for n,h in [('source-transcription.json','69397844da7ca1ace40df14b57d46cedcd602ff0236a580582e12602c199be91'),('freeze-manifest.json','cf433f7adb0017d73440eb6956e58b95a4789432b4685581347c73d205d7834a')]:assert sha(A/n)==sha(B/'author-input'/n)==h
for x in json.load(open(A/'freeze-manifest.json'))['files']:assert sha(A/x['file'])==x['sha256'] and (A/x['file']).stat().st_size==x['bytes']
ids=[x['occurrenceId'] for x in a['occurrences']];assert len(ids)==len(set(ids))==147
assert [x['occurrenceId'] for x in r['perOccurrence']]==[x for p in o['manualPageDecisions'] for x in p['allIDsVisuallyCompared']]==ids
assert a['pdfPages']==o['manuallyReadOriginalPDFPages']==list(range(51,61))
assert dict(collections.Counter(x['status'] for x in r['perOccurrence']))=={'accepted':147}
for candidate,decision in zip(a['occurrences'],r['perOccurrence']):assert decision['candidateVIText']==candidate['viText'] and decision['candidateZHContext']==candidate['zhContext'] and decision['candidatePhysicalLines']==[x['lineTexts'] for x in candidate['fragments']] and decision['printedVITextAccepted'] and decision['originalOwnerFieldsAccepted']
byid={x['occurrenceId']:x for x in a['occurrences']};rows=[x for x in a['wordTableRows'] if x['kind']=='ordinary'];assert len(rows)==22
assert [[x['zhPrinted'],byid[x['glossOccurrenceId']]['viText'],x['rawPosLabel']] for x in rows]==o['independentWordTableReadings']
proper=[x for x in a['wordTableRows'] if x['kind']=='properName'];assert len(proper)==1 and [proper[0]['zhPrinted'],byid[proper[0]['glossOccurrenceId']]['viText'],proper[0]['rawPosLabel']]==o['properNameReading']
for n,roles in enumerate(o['independentRoles'],1):assert [x['speakerZh'] for x in a['occurrences'] if x['category']=='dialogue-translation' and x['textNumber']==n]==roles
summary=[x for x in a['occurrences'] if x['category']=='summary-language-row'];assert len(summary)==11 and [x['tableOriginalIndex'] for x in summary]==list(range(11))
assert [x['pdfPage'] for x in summary]==[59]*4+[60]*7 and all(x['scopeLessons']==[4,5,6] for x in summary)
assert not [x for x in a['occurrences'] if x['pdfPage']==60 and (x['category']=='summary-table-header' or x['occurrenceId'].endswith('-summary-heading'))]
D=fitz.open(PDF);assert len(D)==148
for p in range(51,61):assert hashlib.sha256(D[p-1].get_pixmap(matrix=fitz.Matrix(3,3),alpha=False).tobytes('png')).hexdigest()==sha(B/'renders'/f'pdf-{p:03}-independent.png')
for x in json.load(open(B/'render-manifest.json'))['renders']:assert sha(B/x['file'])==x['sha256']
print('PASS originalPDF exact SHA/148pages; all ten original3x pages byte-reproduced; authorfreeze allfiles unchanged;147exactIDs/147accepted/0repair/0hold/0missing;22words22POS1proper14roles4inline;sharedsummary11rows4+7 scope4–6/no duplicate60headers; no website audit/activation')
