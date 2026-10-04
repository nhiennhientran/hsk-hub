from pathlib import Path
import hashlib,json
C=Path(__file__).resolve().parent;B=C.parent;R=B.parents[4]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for x in json.load(open(B/'freeze-manifest.json'))['files']:assert sha(B/x['file'])==x['sha256'] and (B/x['file']).stat().st_size==x['bytes']
A=R/'course-app/docs/resume-20261004/official-vi-source-prep/hsk1-l05/source-correction-v2'
for n,h in [('source-transcription.json','1a5c02d5e46e4adcd278652c4552722c96ff27c19b9805769bd77f4744103d8e'),('freeze-manifest.json','41927ffbf0f362f1701416e6e694c64b7083a2e9d2093482ef73852c9b182284')]:assert sha(A/n)==sha(C/'author-input'/n)==h
for x in json.load(open(A/'freeze-manifest.json'))['files']:assert sha(A/x['file'])==x['sha256'] and (A/x['file']).stat().st_size==x['bytes']
old=json.load(open(B/'author-input/source-transcription.json'));new=json.load(open(C/'author-input/source-transcription.json'));expected=json.loads(json.dumps(old));repairs=json.load(open(B/'independent-observations.json'))['repairs']
assert len(repairs)==4
for p in expected['occurrences']:
 p['renderRef']='../'+p['renderRef']
 for x in repairs:
  if x['occurrenceId']==p['occurrenceId']:
   if x['field']=='/zhContext':assert p['zhContext']==x['old'];p['zhContext']=x['new']
   else:assert x['field']=='/fragments/0/lineTexts';assert p['fragments'][0]['lineTexts']==x['old'];p['fragments'][0]['lineTexts']=x['new']
for p in expected['nonVietnamesePrintedHeaders']:p['renderRef']='../'+p['renderRef']
assert new['sourceTranscriptionRevision']==2
m=new['authorCorrection'];assert m['initialSourceSHA256']==sha(B/'author-input/source-transcription.json');assert m['initialFreezeSHA256']==sha(B/'author-input/freeze-manifest.json');assert set(m['changedOccurrenceIds'])=={x['occurrenceId'] for x in repairs}
expected['authorCorrection']=m;expected['sourceTranscriptionRevision']=2;assert expected==new
assert [x['viText'] for x in old['occurrences']]==[x['viText'] for x in new['occurrences']]
r=json.load(open(C/'review.json'));assert len(r['perOccurrence'])==141 and {x['status'] for x in r['perOccurrence']}=={'accepted'}
assert [x['occurrenceId'] for x in r['perOccurrence']]==[x['occurrenceId'] for x in new['occurrences']]
assert r['initialIndependentReviewSHA256']==sha(B/'review.json');assert r['initialIndependentFreezeSHA256']==sha(B/'freeze-manifest.json')
print('PASS L5 v1 author17/independent22 files preserved; isolatedv2 exactSHA/full expected JSON; four original-PDF requested source fields only +142 ../ renderRefs +2 correction metadata; all141 VI byte-equal;141accepted/0repair/0hold/0missing; no activation')
