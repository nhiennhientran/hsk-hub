#!/usr/bin/env python3
"""Read-only input validation + real original-PDF rerender. Never grants visual acceptance."""
from pathlib import Path
import hashlib,json,subprocess,tempfile,sys
from PIL import Image
B=Path(__file__).resolve().parent
R=B.parents[4]
A=R/'course-app/docs/recovery-20261005/official-vi-source/hsk3-l11'
PDF=Path('/workspace/scratch/28b55072841a/upload/HSK3 (3.0).pdf')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text())
checks=[]
def check(ok,name):
 checks.append({'name':name,'passed':bool(ok)})
 if not ok:raise AssertionError(name)
def main():
 check(sha(PDF)=='7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951' and PDF.stat().st_size==96266563,'originalPDF exact bytes/SHA')
 check(sha(A/'source.json')=='72ced1f762bf0e44d26375f4bb58ecc3154049c12cd882b78c797c3d4d5918d0','current authorV1 exact source')
 check(sha(A/'freeze-manifest.json')=='95390ecc4ba27a106f77a377ae95bfb7a6bc7e023dc17cccbbbe1386365378f8','author exactfreeze')
 f=load(B/'author-input/freeze-manifest.json');s=load(B/'author-input/source.json');j=load(B/'independent-read-journal.json');v=load(B/'review.json')
 for p in (B/'author-input').iterdir():check(p.read_bytes()==(A/p.name).read_bytes(),'archive currentauthor exact '+p.name)
 for x in f['artifacts']:
  p=A/x['path'];check(p.stat().st_size==x['bytes'] and sha(p)==x['sha256'],'author frozen input '+x['path'])
  if p.suffix=='.png':
   with Image.open(p) as im:im.verify()
 check(len(s['records'])==119 and len({x['sourceId'] for x in s['records']})==119,'119 unique source IDs')
 check(len(v['decisions'])==119 and all(x['candidateRecord']==r for x,r in zip(v['decisions'],s['records'])),'all119 decisions bound exact complete input records')
 check(sum(x['decision']=='accepted' for x in v['decisions'])==112 and sum(x['decision']=='repair' for x in v['decisions'])==7,'fullrecord112accepted7repair nofalse allaccepted')
 check(all(x['viPrintedDecision']=='accepted' for x in v['decisions']),'printed VI119 manually accepted decisions')
 check(j['manuallyReadFullOriginalPDFPages']==list(range(107,116))+[202,203],'all11 actualfresh manual reads recorded')
 check(len(s['bodyChineseOnlyTexts'])==23 and len(v['bodyBindingDecisions'])==23,'23body bindings decisions')
 pmap={x['evidenceId']:x for x in s['readProof']}
 detail=load(B/'author-input/source-detail-crop-evidence.json')['details'];dmap={x['evidenceId']:x for x in detail}
 bmap={x['bodySourceId']:x for x in s['bodyChineseOnlyTexts']}
 for x in s['records']:
  e=x['sourceFieldEvidence'];ve=e['viPrinted'];pages=x.get('allSourcePDFPages',[x['pdfPage']])
  check(ve['pdfPages']==pages and ve['printedPages']==[p-12 for p in pages],'VI field pages '+x['sourceId'])
  check([pmap[k]['pdfPage'] for k in ve['primaryEvidenceIds']]==pages,'actual VI primary binding '+x['sourceId'])
  check(all(k in dmap and dmap[k]['pdfPage'] in pages for k in ve['detailEvidenceIds']),'known actual detail pages '+x['sourceId'])
  ze=e['zhAnchor'];check(pmap[ze['primaryEvidenceId']]['pdfPage']==ze['pdfPage'] and ze['printedPage']==ze['pdfPage']-12,'ZH source page provenance '+x['sourceId'])
  if x.get('bodyChineseSourceRef'):
   bb=bmap[x['bodyChineseSourceRef']];check(bb['zhPrinted']==x['zhAnchor'] and bb['pdfPage']==ze['pdfPage'] and x['sourceId'] in bb['appendixSourceIds'],'actual body/appendix pair '+x['sourceId'])
  if x.get('viPrintedFragments'):check(' '.join(z['viPrinted'] for z in x['viPrintedFragments'])==x['viPrinted'] and [z['pdfPage'] for z in x['viPrintedFragments']]==[203,203],'complete samephysical page column fragments')
 words=[x for x in s['records'] if x.get('sourceWordKind')=='ordinary-numbered-word']
 check([[x['zhAnchor'],x['viPrinted'],x['printedPOSRaw'],x['printedPinyin']] for x in words]==j['independentWordReadings'],'27 independently read ZH VI rawPOS PY tuples')
 props=[x for x in s['records'] if x.get('sourceWordKind')=='proper-noun']
 check(len(props)==1 and [[x['zhAnchor'],x['viPrinted'],x['printedPOSRaw'],x['printedPinyin']] for x in props]==j['independentProperReadings'],'proper LaoZhang rawblankPOS tuple')
 for text,count in [(1,7),(2,8),(3,7)]:
  rr=[x for x in s['records'] if x.get('sourceAppendixKind')=='role-dialogue-line' and x['printedTextNumber']==text]
  note=next(x for x in j['notes'] if 'text'+str(text)+'VI' in x)
  check(len(rr)==count and [x['viPrinted'] for x in rr]==note['text'+str(text)+'VI'],'independent full VI utterances text'+str(text))
  check([x['printedRoleVi'] for x in rr]==['Vương Nhất Tuyết' if i%2==0 else 'Dương Đồng Lạc' for i in range(count)],'VI roles actualprint text'+str(text))
  check([x['correspondingBodyRoleZh'] for x in rr]==['王一雪' if i%2==0 else '杨同乐' for i in range(count)],'ZH roles body actualprint text'+str(text))
 diary=s['records'][-1];dn=next(x for x in j['notes'] if x['pdfPage']==203)
 check(diary['viPrinted']==dn['wholeUnlabelledDiaryVI'] and diary['printedSpeaker'] is None,'wholeunlabelled diary VI complete faithful not partitioned')
 check('问我愿不愿意也去上海。' in diary['zhAnchor'] and '问我愿意不愿意也去上海。' in next(x for x in j['notes'] if x['pdfPage']==113)['bodyDiaryZH'],'known ZH omission correctly recorded repair')
 markers=[x for x in s['records'] if x['section'] in {'lesson-marker','lesson-running-header','appendix-lesson-marker'}]
 check(len(markers)==6 and all(next(z for z in v['decisions'] if z['sourceId']==x['sourceId'])['decision']=='repair' for x in markers),'6structural labels excluded from falseverbatim accepted')
 for name,key in [('render-manifest.json','renders'),('detail-render-manifest.json','details')]:
  for x in load(B/name)[key]:
   p=B/x['path'];check(p.stat().st_size==x['bytes'] and sha(p)==x['sha256'],'review PNG bytes '+x['path'])
   with Image.open(p) as im:im.verify()
 for x in load(B/'render-manifest.json')['renders']:check(x['exactAuthorFrozenPNGMatch'],'fresh reviewer fullPNG equals currentauthor sameoriginal '+str(x['pdfPage']))
 # Actual independent execution of frozen author's deterministic renderer, separate ephemeral output.
 # Byte identity proves physical PDF provenance, NOT human acceptance; human decisions above remain separate.
 with tempfile.TemporaryDirectory(prefix='review-hsk3-l11-rerender-') as t:
  out=Path(t)/'actual';p=subprocess.run([sys.executable,str(A/'render-evidence.py'),'--pdf',str(PDF),'--out',str(out)],capture_output=True,text=True)
  check(p.returncode==0,'actual30PNG originalPDF rerender exit0')
  receipt=load(out/'rerender-receipt.json');check(len(receipt['images'])==30 and receipt['allPNGBytesMatch'],'30 originalPNG actual reproduced exactSHA')
  receipt.update(executionReturnCode=p.returncode,rendererSHA256=sha(A/'render-evidence.py'),stdout=p.stdout,stderr=p.stderr,temporaryPNGsNotIncludedInArchive=True,qualification='Actual re-render byte proof only; fresh independent visual review is separately journaled.')
  (B/'original-rerender-result.json').write_text(json.dumps(receipt,indent=2)+'\n')
 check(sha(A/'source.json')==v['authorInput']['sourceSHA256'] and sha(A/'freeze-manifest.json')==v['authorInput']['freezeSHA256'],'author immutable afterverification')
 return {'schemaVersion':1,'status':'passed-inputguards-with-bounded-source-repairs-required','checks':checks,'checksPassed':len(checks),'failures':0,'sourceVisualDecisionsReplacedByTool':False,'fullRecordsAccepted':112,'fullRecordsRepair':7,'printedVIAccepted':119,'wholeSourceAccepted':False,'websiteAccepted':False,'runtimeActivated':False}
if __name__=='__main__':
 try:
  result=main();(B/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':result['status'],'checksPassed':result['checksPassed'],'failures':0}));sys.exit(0)
 except Exception as e:
  result={'status':'failed','checks':checks,'error':str(e)};(B/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result));sys.exit(1)
