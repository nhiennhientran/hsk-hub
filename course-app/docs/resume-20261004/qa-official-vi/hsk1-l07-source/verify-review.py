from pathlib import Path
import hashlib,json,collections,fitz
B=Path(__file__).resolve().parent;R=B.parents[4];PDF=R.parent/'upload/HSK1  (3.0).pdf';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
a=json.load(open(B/'author-input/source-transcription.json'));r=json.load(open(B/'review.json'));o=json.load(open(B/'independent-observations.json'));A=R/'course-app/docs/resume-20261004/official-vi-source-prep/hsk1-l07'
assert sha(PDF)==a['sourcePDF']['sha256']=='99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764'
for n,h in [('source-transcription.json','b9344c7665eef49b05f8518b917774b1775eb411c4b81ecda665252253f267ab'),('freeze-manifest.json','b4c268748fd9ee6a8fc3f91cd76ece0fb49f09fb507edd7d89bb48b3752b7b30')]:assert sha(A/n)==sha(B/'author-input'/n)==h
for x in json.load(open(A/'freeze-manifest.json'))['files']:assert sha(A/x['file'])==x['sha256'] and (A/x['file']).stat().st_size==x['bytes']
ids=[x['occurrenceId'] for x in a['occurrences']];assert len(ids)==len(set(ids))==142
assert [x['occurrenceId'] for x in r['perOccurrence']]==[x for p in o['manualPageDecisions'] for x in p['allIDsVisuallyCompared']]==ids
assert a['pdfPages']==o['manuallyReadOriginalPDFPages']==list(range(61,70))
assert dict(collections.Counter(x['status'] for x in r['perOccurrence']))=={'accepted':142}
for candidate,decision in zip(a['occurrences'],r['perOccurrence']):assert decision['candidateVIText']==candidate['viText'] and decision['candidateZHContext']==candidate['zhContext'] and decision['candidatePhysicalLines']==[x['lineTexts'] for x in candidate['fragments']] and decision['printedVITextAccepted'] and decision['originalOwnerFieldsAccepted']
byid={x['occurrenceId']:x for x in a['occurrences']};assert len(a['wordTableRows'])==27 and {x['kind'] for x in a['wordTableRows']}=={'ordinary'}
assert [[x['zhPrinted'],byid[x['glossOccurrenceId']]['viText'],x['rawPosLabel']] for x in a['wordTableRows']]==o['independentWordTableReadings']
for n,roles in enumerate(o['independentRoles'],1):assert [x['speakerZh'] for x in a['occurrences'] if x['category']=='dialogue-translation' and x['textNumber']==n]==roles
x=byid['hsk1-official-vi-l07-pdf066-grammar-03-explanation'];g=o['grammar03CrossPage'];assert x['pdfPage']==g['viSourcePDFPage']==66 and x['zhContextSourcePage']==g['zhSourcePDFPage']==65 and x['viText']==g['viText'] and x['fragments'][0]['lineTexts']==g['physicalLines']
inline=[x for x in a['occurrences'] if x['category']=='inline-table-gloss'];assert len(inline)==5
assert [x['viText'] for x in inline]==[x[1] for x in o['inlineReadings']]
assert [x['table'] for x in inline if x['pdfPage']==69]==['learner','learner','example','example']
D=fitz.open(PDF);assert len(D)==148
for p in range(61,70):assert hashlib.sha256(D[p-1].get_pixmap(matrix=fitz.Matrix(3,3),alpha=False).tobytes('png')).hexdigest()==sha(B/'renders'/f'pdf-{p:03}-independent.png')
for x in json.load(open(B/'render-manifest.json'))['renders']:assert sha(B/x['file'])==x['sha256']
m=json.load(open(B/'boundary-manifest.json'));assert m['pdfPage']==70 and m['scale']==3 and sha(B/m['file'])==m['sha256'];assert hashlib.sha256(D[69].get_pixmap(matrix=fitz.Matrix(3,3),clip=fitz.Rect(m['rect']),alpha=False).tobytes('png')).hexdigest()==m['sha256']
print('PASS originalPDF exact SHA/148pages; nine original3x fullpages +partialL8boundary bytes reproduced; authorfreeze allfiles unchanged;142exactIDs/142accepted/0repair/0hold/0missing;27words27rawPOS14roles5inline;grammar03 Chinese65/VI66 ownerbinding; no L8fullaudit/websiteVI/activation claim')
