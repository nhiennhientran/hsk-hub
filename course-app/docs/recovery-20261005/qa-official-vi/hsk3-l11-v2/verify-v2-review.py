#!/usr/bin/env python3
"""Independent scoped V2 closure; read all author/base freezes, write own receipts only."""
from pathlib import Path
import hashlib,json,copy,sys
from PIL import Image
B=Path(__file__).resolve().parent;R=B.parents[4];Q=B.with_name('hsk3-l11');A=R/'course-app/docs/recovery-20261005/official-vi-source/hsk3-l11';C=A.with_name('hsk3-l11-v2')
def sh(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ld(p):return json.loads(p.read_text())
checks=[]
def ck(ok,name):
 checks.append({'name':name,'passed':bool(ok)})
 if not ok:raise AssertionError(name)
def main():
 ck(sh(C/'source.json')=='de6a167085bf6fef8f60df83c99943e9a2a89cab6a0dfc984a1d239990ccf04f','exactauthorV2source')
 ck(sh(C/'freeze-manifest.json')=='f772c1a59528560b67c2b0ac0311118ad20817efccb29f435caff14487d6e007','exactauthorV2freeze')
 ck(sh(A/'source.json')=='72ced1f762bf0e44d26375f4bb58ecc3154049c12cd882b78c797c3d4d5918d0','authorV1source immutable')
 ck(sh(A/'freeze-manifest.json')=='95390ecc4ba27a106f77a377ae95bfb7a6bc7e023dc17cccbbbe1386365378f8','authorV1freeze immutable')
 ck(sh(Q/'FREEZE.json')=='c459924421e40adaab454d7b092302235fa4caa741b4b5528b65e3ef6bf6bae6','currentnewrecoverysource reading freeze exact')
 for x in ld(Q/'FREEZE.json')['files']:
  p=R/x['file'];ck(p.stat().st_size==x['bytes'] and sh(p)==x['sha256'],'frozen independent reading '+x['file'])
 for base in [A,C]:
  for x in ld(base/'freeze-manifest.json')['artifacts']:
   p=base/x['path'];ck(p.stat().st_size==x['bytes'] and sh(p)==x['sha256'],'author freeze '+base.name+'/'+x['path'])
 for p in (B/'author-input').iterdir():ck(p.read_bytes()==(C/p.name).read_bytes(),'V2exact archive '+p.name)
 old=ld(A/'source.json');new=ld(C/'source.json');norm=copy.deepcopy(new);journal=ld(Q/'independent-read-journal.json');review=ld(B/'review.json');d=ld(B/'actual-source-diff.json')
 ck(len(d['changes'])==41,'41 exact JSON differences fully disclosed')
 indices=[0,27,49,71,88,95]
 for idx in indices:
  r=norm['records'][idx];ze=r['sourceFieldEvidence']['zhAnchor']
  ck(r['zhAnchorKind']=='structural-locator-not-verbatim' and r['printedChineseAnchorPresent'] is False,'nonverbatim locator qualifier '+str(idx))
  ck(ze['scope']=='lesson-marker-location-only-not-verbatim-Chinese' and ze['printedChineseAnchorPresent'] is False and ze['actualPrintedLessonNumber']==11,'precise locator field scope '+str(idx))
  for key in ['zhAnchorKind','printedChineseAnchorPresent']:r.pop(key)
  for key in ['scope','printedChineseAnchorPresent','actualPrintedLessonNumber']:ze.pop(key)
  if idx in [27,49,71,88]:
   ck(r['printedChineseTitle']==ze['actualPrintedChineseTitle']=='看来我没办法解决这个问题','actual printed title kept separate '+str(idx))
   r.pop('printedChineseTitle');ze.pop('actualPrintedChineseTitle')
 originalDiary=next(x for x in journal['notes'] if x['pdfPage']==113)['bodyDiaryZH']
 ck(new['records'][118]['zhAnchor']==new['bodyChineseOnlyTexts'][22]['zhPrinted']==originalDiary,'corrected complete diary ZH matches actual freshly read original')
 norm['records'][118]['zhAnchor']=old['records'][118]['zhAnchor'];norm['bodyChineseOnlyTexts'][22]['zhPrinted']=old['bodyChineseOnlyTexts'][22]['zhPrinted']
 prov=norm['recoveryProvenance'].pop('isolatedSourceRevision')
 ck(prov['previousAuthorSourceSHA256']==sh(A/'source.json') and prov['previousAuthorFreezeSHA256']==sh(A/'freeze-manifest.json') and prov['independentRepairListSHA256']==sh(Q/'repair-list.json') and prov['printedVietnameseChanged'] is False,'isolated revision correctly binds independently frozen repair')
 ck(norm==old,'whole source JSON equalsV1 after only exact approved delta normalization')
 ck([x['sourceId'] for x in new['records']]==[x['sourceId'] for x in old['records']] and len(new['records'])==119,'119 IDs and order exactunchanged')
 for field in ['viPrinted','printedPinyin','printedPOSRaw']:
  ck([x.get(field) for x in new['records']]==[x.get(field) for x in old['records']],'all raw '+field+' unchanged')
 ck(all(r['decision']=='accepted' and r['sourceId']==x['sourceId'] and r['candidateRecordSHA256']==hashlib.sha256(json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest() for r,x in zip(review['sourceRecordDecisions'],new['records'])) and len(review['sourceRecordDecisions'])==119,'all119 complete accepted candidates exactbound')
 ck(len(review['bodyBindingDecisions'])==23 and all(r['decision']=='accepted' and r['actualFullBinding']==x for r,x in zip(review['bodyBindingDecisions'],new['bodyChineseOnlyTexts'])),'all23 accepted complete bindings exactbound')
 receipt=ld(Q/'original-rerender-result.json');actual={x['path']:x['sha256'] for x in receipt['images']}
 pngs=[]
 for x in ld(C/'freeze-manifest.json')['artifacts']:
  if x['path'].endswith('.png'):
   p=C/x['path'];ck(p.read_bytes()==(A/x['path']).read_bytes() and sh(p)==actual[x['path']],'actual originalPDF-proven PNG unchanged '+x['path'])
   with Image.open(p) as im:im.verify()
   pngs.append({'path':x['path'],'sha256':sh(p)})
 ck(len(pngs)==30 and receipt['allPNGBytesMatch'] and receipt['executionReturnCode']==0,'all30 actual rerender provenance proof retained')
 ck('Complete role03 text4 diary' not in (C/'README.md').read_text(),'misleading README role03 removed without creating sourceunit')
 ck(review['counts']=={'perIDAccepted':119,'perIDRepair':0,'perIDHold':0,'missingVIUnits':0,'bodyBindingsAccepted':23,'bodyBindingsRepair':0},'scope119/23 accepted sourcefidelity only')
 ck(sh(Q/'FREEZE.json')==review['freshOriginalReadEvidence']['freezeSHA256'] and sh(Q/'review.json')==review['freshOriginalReadEvidence']['reviewSHA256'],'current recovered independent reading evidence bound exact')
 ck(sh(Path('/workspace/scratch/28b55072841a/upload/HSK3 (3.0).pdf'))=='7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951','originalPDF still exact')
 return {'schemaVersion':1,'status':'passed-independent-source-V2-closure','checks':checks,'checksPassed':len(checks),'failures':0,'actualSourceDifferences':41,'completeSourceRecordsAccepted':119,'completeBodyBindingsAccepted':23,'authorPNGsExactUnchanged':pngs,'newOriginalPNGRerenderAsserted':False,'existingNewRecoveryActual30PNGRerenderRetained':True,'browserOrWebsiteAcceptanceAsserted':False,'runtimeActivated':False,'savedAcceptedAsserted':False}
if __name__=='__main__':
 try:
  v=main();(B/'verification.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v[k] for k in ['status','checksPassed','failures','actualSourceDifferences','completeSourceRecordsAccepted','completeBodyBindingsAccepted']}))
 except Exception as e:
  v={'status':'failed','error':str(e),'checks':checks};(B/'verification.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n');print(json.dumps(v));sys.exit(1)
