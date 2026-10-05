#!/usr/bin/env python3
"""Source identity/partition checks; independent visual verdicts are authored evidence, not OCR."""
import json,pathlib,hashlib,sys,fitz
ROOT=pathlib.Path(__file__).resolve().parents[4]
HERE=pathlib.Path(__file__).resolve().parent
REPO=ROOT.parent
load=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
recordsha=lambda r:hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
review=load(HERE/'independent-review.json');lesson=review['lesson'];source=ROOT/f'docs/resume-20261004/official-vi-source-prep/hsk3-l{lesson:02d}';d=load(source/'source-transcription.json');af=load(source/'freeze-manifest.json');page=load(HERE/'independent-page-evidence.json');crops=load(HERE/'fresh-crop-evidence.json');checks=[]
def check(name,ok,detail=None):checks.append({'name':name,'pass':bool(ok),'detail':detail})
check('source bytes frozen',sha(source/'source-transcription.json')==review['authorSourceSHA256'])
check('source author freeze immutable',sha(source/'freeze-manifest.json')==review['authorFreezeSHA256'])
check('source recorded official PDF identity',d['officialPDFSHA256']==review['officialPDFSHA256'])
pdfpath=pathlib.Path(page['sourcePDF']);check('actual uploaded official PDF SHA',sha(pdfpath)==review['officialPDFSHA256']);check('actual uploaded PDF bytes',pdfpath.stat().st_size==review['officialPDFBytes']);pdf=fitz.open(pdfpath);check('actual uploaded PDF pages',len(pdf)==review['actualPDFPageCount'])
for a in af['artifacts']:
 p=source/a['path'];check('author artifact '+a['path'],p.is_file() and sha(p)==a['sha256'] and p.stat().st_size==a['bytes'])
rs=d['records'];ids=[r['sourceId'] for r in rs];rows=load(HERE/'source-id-review.json')['items'];ri={r['sourceId']:r for r in rs}
check('unique source IDs',len(ids)==len(set(ids)));check('manual exact source ID coverage',set(ids)=={r['sourceId'] for r in rows} and len(rows)==len(rs));check('total source count',len(rs)==review['counts']['sourceItems'])
for row in rows:
 r=ri[row['sourceId']];check('record literal '+row['sourceId'],row['viPrinted']==r['viPrinted'] and row['zhAnchor']==r['zhAnchor'] and row['sourceRecordSHA256']==recordsha(r));check('record page '+row['sourceId'],(row['pdfPage'],row['printedPage'])==(r['pdfPage'],r['printedPage']));check('verdict '+row['sourceId'],row['verdict'] in ['accepted','repair','held'])
for kind,key in [('accepted','accepted'),('repair','repair'),('held','hold')]:check('verdict count '+kind,sum(r['verdict']==kind for r in rows)==review['counts'][key])
check('numbered word count',sum('printedNumber' in r for r in rs)==review['counts']['numberedWordEntries']);check('numbered word ordinals',sorted(r['printedNumber'] for r in rs if 'printedNumber' in r)==list(range(1,review['counts']['numberedWordEntries']+1)))
check('body VI loci count',sum(r['pdfPage']<190 for r in rs)==review['counts']['bodyVietnameseLoci']);check('appendix loci count',sum(r['pdfPage']>=190 for r in rs)==review['counts']['appendixContextAndTextLoci'])
for r in rs:
 if 'printedNumber' in r:check('word original POS/PY '+r['sourceId'],isinstance(r.get('printedPOSRaw'),str) and bool(r['printedPOSRaw']) and bool(r.get('printedPinyin')))
bs=d['bodyChineseOnlyTexts'];br=load(HERE/'body-appendix-bindings-review.json')['items'];bmap={r['bodySourceId']:r for r in bs};check('exact body anchor IDs',set(bmap)=={r['bodySourceId'] for r in br} and len(bmap)==len(bs)==len(br)==review['counts']['bodyAppendixBindings'])
for row in br:
 b=bmap[row['bodySourceId']];check('body frozen whole record '+b['bodySourceId'],row['sourceRecordSHA256']==recordsha(b) and row['zhPrinted']==b['zhPrinted'] and row['appendixSourceIds']==b['appendixSourceIds']);check('body no VI '+b['bodySourceId'],b['printedVietnameseInBody'] is False and row['bodyVietnameseAbsent'] is True)
 for sid in b['appendixSourceIds']:
  a=ri[sid];check('appendix exact actual body anchor '+sid,a['bodyChineseSourceRef']==b['bodySourceId'] and a['zhAnchor']==b['zhPrinted'] and a['zhAnchorPDFPage']==b['pdfPage'] and a['zhAnchorPrintedPage']==b['printedPage']);check('appendix role '+sid,a.get('correspondingBodyRoleZh')==b.get('printedRoleZh'))
check('role line count',sum('printedRoleVi' in r for r in rs)==review['counts']['appendixRoleLines']);check('whole unlabelled paragraph count',sum(r['sourceBodyKind']=='whole-unlabelled-paragraph' for r in bs)==review['counts']['appendixWholeUnlabelledParagraphs'])
expected=set(review['actualBodyPDFPages']+review['actualAppendixPDFPages']);check('exact visually read source page set',expected=={p['pdfPage'] for p in page['pages']})
for p in page['pages']:
 actual=pdf[p['pdfPage']-1];fp=REPO/p['imagePath'];check('source original full PNG '+str(p['pdfPage']),fp.is_file() and sha(fp)==p['imageSHA256']);check('actual PDF CropBox/rotation '+str(p['pdfPage']),list(actual.cropbox)==p['actualPDFCropBox'] and actual.rotation==p['actualPDFRotation']);check('manual original page evidence '+str(p['pdfPage']),p['status']=='independently-visually-read' and p['observedPrintedFooter']==p['printedFooterExpected'] and p['freshWholePageRerenderClaimed'] is False)
for c in crops['crops']:
 fp=HERE/c['path'];check('fresh original crop '+c['path'],sha(fp)==c['sha256'] and fp.stat().st_size==c['bytes'] and c['status']=='independently-visually-read-fresh-original-crop')
check('fresh crop count',len(crops['crops'])==review['counts']['freshOriginalDetailCrops']);check('website/source boundary',review['boundaries']['websiteRead'] is False and review['boundaries']['websiteComparison'] is False and review['boundaries']['runtimeChanged'] is False)
result={'level':3,'lesson':lesson,'status':'pass' if all(c['pass'] for c in checks) else 'fail','actualChecks':len(checks),'failed':sum(not c['pass'] for c in checks),'scope':'Byte/ID/partition/actual page identity verification; manual visual source-fidelity judgments remain independent authored evidence, not machine semantic validation.','checks':checks}
(HERE/'verification-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='checks'},ensure_ascii=False));sys.exit(0 if result['failed']==0 else 1)
