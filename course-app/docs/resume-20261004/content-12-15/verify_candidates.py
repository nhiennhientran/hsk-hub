from pathlib import Path
import json,hashlib,fitz
from PIL import Image
B=Path(__file__).resolve().parent;R=B.parents[3]
baseline=json.loads((R/'hsk1-app/content/textbook.json').read_text())['lessons']
report={'scope':'author-structural-and-source-check-only','independentReview':'pending','runtimeTests':'not-run','audioHumanReview':'pending','lessons':[],'failures':[]}
page_map=[];allids=[]
# Structured source manifest covers every original printed page, including continuation pages.
for l in range(12,16):
 file=B/f'lesson-{l}.json';d=json.loads(file.read_text());figs={f['id']:f for f in d['figures']};acts=d['activities'];allids += [a['id'] for a in acts]
 for a in acts:
  assert a['source']['textbookSHA256']==d['textbookSHA256']
  assert a['source']['pdfPage']==a['source']['printedPage']+15
  assert a['title']['zh'] and a['title']['vi'];assert a['instruction']['zh'] and a['instruction']['vi'];assert a['prompt']['zh'] and a['prompt']['vi']
  fs={f['id']:f for f in a['fields']};assert len(fs)==len(a['fields'])
  for f in a['fields']:
   assert f['label']['zh'] and f['label']['vi']
   if f['assessment']=='answer-key':
    assert f['answer'] in {o['id'] for o in f['options']}
    assert f['answerSource']['sha256']==d['answerBookSHA256']
    assert 9<=f['answerSource']['pdfPage']<=13
   else:assert 'answer' not in f
   if 'options' in f:
    assert len(set(o['id'] for o in f['options']))==len(f['options'])
    assert all(o['zh'] and o['vi'] for o in f['options'])
  if 'table' in a:
   t=a['table'];refs=[]
   for row in t['rows']:
    assert len(row['cells'])==len(t['columns'])
    for c in row['cells']:
     assert not c or (('text' in c)^('fieldId' in c))
     if 'fieldId' in c:assert c['fieldId'] in fs;refs.append(c['fieldId'])
   assert set(refs)==set(fs),a['id'];assert len(refs)==len(set(refs))
  if 'figure' in a:
   assert a['figure'] in figs;assert a['figureSHA256']==figs[a['figure']]['sha256']
  if 'audio' in a:assert a['audio']['verifiedByListening'] is False;assert a['audio']['plays']==2
 for f in figs.values():
  p=B/f['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256'];assert f['kind']=='original-crop';assert len(f['source']['cropPdfPoints'])==4
  with Image.open(p) as im:assert min(im.size)>80;f['verifiedDimensions']=list(im.size)
 assert all(not a['fields'] for a in acts if a['kind'] in ['read-only','read-aloud'])
 for pp in d['coverage']['sourcePages']:
  targets=[]
  for a in acts:
   pages={a['source']['printedPage'],*a['source'].get('printedPages',[]),*a.get('dialoguePrintedPages',[])}
   pages.update(f.get('source',{}).get('printedPage',a['source']['printedPage']) for f in a['fields'])
   if pp in pages:targets.append(a['id'])
  figures=[f['id'] for f in figs.values() if f['source']['printedPage']==pp]
  bonus=d.get('bonus',{}).get('printedPage')==pp
  assert targets or figures or bonus,(l,pp)
  page_map.append({'lesson':l,'printedPage':pp,'pdfPage':pp+15,'visualInspection':'author-reviewed-original-page','candidateActivityIds':targets,'candidateFigureIds':figures,'unavailableBonus':d.get('bonus',{}).get('printedResourceId') if bonus else None,'existingSceneIds':[a['existingSceneId'] for a in acts if 'existingSceneId' in a and pp in a.get('dialoguePrintedPages',[])],'independentReview':'pending'})
 keyed=sum(f['assessment']=='answer-key' for a in acts for f in a['fields'])
 report['lessons'].append({'lesson':l,'activities':len(acts),'fields':sum(len(a['fields']) for a in acts),'answerKeyFields':keyed,'ungradedFields':sum(f['assessment']=='ungraded' for a in acts for f in a['fields']),'readOnlyActivities':sum(not a['fields'] for a in acts),'figures':len(figs),'tables':sum('table'in a for a in acts),'candidateSHA256':hashlib.sha256(file.read_bytes()).hexdigest(),'sourcePagesInspected':d['coverage']['sourcePages'],'vocabularyOriginalRows':len(d['vocabularySourceMap'])})
assert len(allids)==len(set(allids))
report['allActivityIdsUnique']=True;report['answerBookPagesVisuallyInspected']=[9,10,11,12,13];report['sourcePDFPagesVisuallyInspected']=list(range(101,137));report['assetVisualQA']='32 original crops visually inspected in eight contact sheets; no missing panels or invented replacements';report['totals']={k:sum(x[k] for x in report['lessons']) for k in ['activities','fields','answerKeyFields','ungradedFields','readOnlyActivities','figures','tables','vocabularyOriginalRows']}
(B/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(B/'page-coverage.json').write_text(json.dumps({'sourceTextbookSHA256':d['textbookSHA256'],'sourceAnswerBookSHA256':d['answerBookSHA256'],'scope':'L12-L15 additive candidates; source support and activities; author review only','pages':page_map},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report['totals'],ensure_ascii=False))
