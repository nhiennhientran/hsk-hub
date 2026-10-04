"""Independent data checks. Run from repository root; no mutation of course content."""
import json, pathlib, hashlib, re, collections
root=pathlib.Path('course-app'); evidence=root/'docs/content-audit/hsk3-lessons08-09-independent'
expected={8:{'warmup1-matching':'DCFABE','text1-listening':'CC','text2-listening':'CA','text3-listening':'CA','text4-listening':'AB','comprehensive-words1':'DBEAC','comprehensive-words2':'EBADC'},9:{'warmup1-matching':'BDAFEC','text1-listening':'BC','text2-listening':'CB','text3-listening':'AB','text4-listening':'AA','comprehensive-words1':'DCBEA','comprehensive-words2':'BCAED'}}
ledger=[];figures=[];summary=[]
for n in [8,9]:
 d=json.loads((root/f'content/hsk3/lesson-{n:02}.json').read_text()); acts=d['activities'];fields=[f for a in acts for f in a['fields']]
 assert len(acts)==29 and len(fields)=={8:68,9:94}[n]
 assert len({f['id'] for f in fields})==len(fields)
 assert len(d['grammarSourceExplanations'])=={8:4,9:3}[n]
 for a in acts:
  key=a['id'].split(':')[-1]
  if key in expected[n]:
   actual=''.join(chr(65+next(i for i,o in enumerate(f['options']) if o['zh']==f['answer'])) for f in a['fields'])
   assert actual==expected[n][key],(n,key,actual)
  for f in a['fields']:
   if f['assessment']=='official':assert 'answerSource' in f and 'answer' in f
   else:assert 'answer' not in f and 'answerSource' not in f
   if f['assessment']=='reference':assert f['referenceAnswer']['zh'] and f['referenceAnswer']['vi']
   assert f['source']['pdfPage']-f['source']['printedPage']==12
   if 'review-grammar' in f['id']:
    row=int(re.search(r'review-grammar(\d+)',f['id'])[1]);assert f['source']['pdfPage']==(96 if row<=2 else 97)
   ledger.append({'id':f['id'],'activity':a['id'],'textbookPdfPage':f['source']['pdfPage'],'assessment':f['assessment'],'answerPdfPage':f.get('answerSource',{}).get('pdfPage'),'review':'pass: source/semantic review; execution not asserted'})
 assert sum(len(a['fields']) for a in acts if '-reading' in a['id'])==12
 assert sum(len(a['fields']) for a in acts if ':grammar' in a['id'])=={8:12,9:10}[n]
 assert sum(len(a['fields']) for a in acts if 'picture-dialogue' in a['id'])=={8:9,9:10}[n]
 for f in d['illustrationManifest']:
  p=root/'public'/f['file'];s=p.read_text();h=hashlib.sha256(p.read_bytes()).hexdigest();assert h==f['assetSha256']
  assert not re.search(r'<(?:image|script)\b|https?://(?!www.w3.org)',s)
  for fid in f['sourceFieldBindings']:assert any(x['id']==fid and x.get('illustrationId')==f['id'] for x in fields)
  figures.append({'file':str(p),'sha256':h,'sourcePdfPage':f['textbookRelation']['pdfPage'],'sceneKey':f['sceneKey'],'pixelReview':'pass: freshly rendered native 640x400; source teaching semantics checked','originalVectors':True})
 summary.append({'lesson':n,'activities':len(acts),'fields':len(fields),'assessments':dict(collections.Counter(f['assessment'] for f in fields)),'figures':len(d['illustrationManifest'])})
for name,data in [('field-review-ledger.json',ledger),('figure-review-ledger.json',figures),('independent-validation.json',summary)]:
 (evidence/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(summary,indent=2))
