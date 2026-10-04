#!/usr/bin/env python3
"""Validate source-only author integrity; does not independently accept printed content."""
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone
from PIL import Image
import hashlib,json,csv,sys
BASE=Path(__file__).resolve().parent
PDF=Path('/workspace/scratch/28b55072841a/upload/HSK3 (3.0).pdf')
PDFSHA='7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951'
COUNTS={31:11,32:16,33:9,34:12,35:12,36:9,37:9,38:2,39:12,40:14,196:14,197:10}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(n):return json.loads((BASE/n).read_text())
def main():
 checks=[];issues=[]
 def c(name,v):
  checks.append({'check':name,'passed':bool(v)})
  if not v:issues.append(name)
 s=load('source-transcription.json');r=s['records'];ids=[x['sourceId'] for x in r]
 c('original-PDF-byte-identity',sha(PDF)==PDFSHA==s['officialPDFSHA256'] and PDF.stat().st_size==s['officialPDFBytes']==96266563)
 c('130-unique-actual-source-occurrences-per-observed-page',len(r)==len(set(ids))==130 and dict(Counter(x['pdfPage'] for x in r))==COUNTS)
 c('pending-distinct-independent-acceptance',s['status']=='source-only-transcribed-pending-independent-original-page-review' and s['level']==3 and s['lesson']==3 and s['boundaries']['independentSourceAcceptancePerformed'] is False)
 c('source-only-boundaries',all(s['boundaries'][k] is False for k in ['websiteVietnameseRead','websiteComparisonPerformed','websiteProposalPrepared','websiteVietnameseAlignmentComplete','productionChanged','historyOrGradingStorageChanged','OCRUsed','PDFTextLayerUsedAsAuthority']))
 w=[x for x in r if 'printedNumber' in x]
 c('26-numbered-word-identities-and-raw-POS',len(w)==26 and [x['printedNumber'] for x in w]==list(range(1,27)) and all(x['posPrinted'] is True and x['printedPOSRaw'] and x['sourceWordKind']=='ordinary-numbered-word' for x in w))
 c('decisive-printed-POS-pinyin-literal',w[1]['printedPOSRaw']=='đt.' and w[9]['printedPOSRaw']=='lượng.' and w[25]['printedPOSRaw']=='đgt./dt.' and w[14]['printedPinyin']=='wèishēng-jiān' and w[14]['printedPinyinLineBreakAfterHyphen'] is True)
 inline=[x for x in r if x.get('sourceWordKind')=='inline-example-gloss']
 c('two-printed-inline-glosses',[(x['zhAnchor'],x['viPrinted']) for x in inline]==[('打算','định, dự định'),('遇到','gặp phải')] and all(x['printedPOSRaw'] is None and x['posPrinted'] is False for x in inline))
 roles=[x for x in r if 'printedRoleVi' in x]
 c('22-role-translation-units-in-6-7-7-2',len(roles)==22 and dict(Counter(x['printedTextNumber'] for x in roles))=={1:6,2:7,3:7,4:2} and all(x['sourceScope']=='official-Vietnamese-translation-appendix' and 'printedRoleZh' not in x and x['pdfPage'] in [196,197] for x in roles))
 for t,n in [(1,6),(2,7),(3,7),(4,2)]:
  units=[x for x in roles if x['printedTextNumber']==t]
  c(f'actual-role-order:text{t}',[x['printedDialogueOrdinal'] for x in units]==list(range(1,n+1)))
 c('text2-complete-utterance-page-turn', [x['pdfPage'] for x in roles if x['printedTextNumber']==2]==[196]*6+[197] and all(x['thisUtterancePrintedOnOnePage'] is True and x['appendixDialoguePDFPages']==[196,197] and 'viPrintedFragments' not in x for x in roles if x['printedTextNumber']==2))
 para=[x for x in roles if x['printedTextNumber']==4]
 c('text4-two-explicitly-labelled-whole-paragraphs',len(para)==2 and [x['printedRoleVi'] for x in para]==['Lưu Minh','Vương Nhất Tuyết'] and all(x['sourceAppendixKind']=='role-labelled-whole-paragraph' and x['noWebsiteLinePartitionInferred'] is True for x in para) and not any('printedSpeaker' in x and x['printedSpeaker'] is None for x in r))
 body=s['bodyChineseOnlyTexts'];bids=[x['bodySourceId'] for x in body];byid={x['sourceId']:x for x in r}
 c('22-Chinese-only-body-units-unique',len(body)==len(set(bids))==22 and dict(Counter(x['printedTextNumber'] for x in body))=={1:6,2:7,3:7,4:2} and all(x['printedVietnameseInBody'] is False and len(x['appendixSourceIds'])==1 for x in body))
 for b in body:
  a=byid[b['appendixSourceIds'][0]]
  c('body-appendix-binding:'+b['bodySourceId'],a['bodyChineseSourceRef']==b['bodySourceId'] and a['zhAnchor']==b['zhPrinted'] and a['correspondingBodyRoleZh']==b['printedRoleZh'] and a['zhAnchorPDFPage']==b['pdfPage'] and a['zhAnchorPrintedPage']==b['printedPage'] and a['printedTextNumber']==b['printedTextNumber'] and a['printedDialogueOrdinal']==b['printedDialogueOrdinal'])
 c('bijective-all-four-text-bindings',{x['bodyChineseSourceRef'] for x in roles}==set(bids))
 summary=[x for x in r if x['section'].startswith('learning-summary-grammar-')]
 c('nine-complete-mixed-script-summary-rows',len(summary)==9 and [x['printedTableRow'] for x in summary]==list(range(1,10)) and all(x['pdfPage']==40 and x['ChineseExamplesRemainChineseInPrintedVietnameseRow'] is True and 'ví dụ:' in x['viPrinted'] for x in summary))
 c('actual-body-appendix-next-boundary',s['scope']['actualBodyPDFPages']==[31,40] and s['scope']['actualBodyPrintedPages']==[19,28] and s['scope']['actualAppendixPDFPages']==[196,197] and s['scope']['actualAppendixPrintedPages']==[184,185] and s['scope']['nextLessonBoundary']['observedPrintedFooter']=='029' and s['scope']['nextLessonBoundary']['printedLessonMarker']=='Bài 4' and s['scope']['supplementalConnectedSummaryPageCount']==1)
 pages=load('source-page-evidence.json')['pages'];details=load('source-detail-crop-evidence.json')['details'];loc=load('source-locator-evidence.json')['locators']
 c('12-source-pages-actually-read',[x['pdfPage'] for x in pages]==list(range(31,41))+[196,197] and len(s['readProof'])==12)
 c('5-details-and-3-locators',len(details)==5 and len(loc)==3 and [x['observedPrintedFooter'] for x in loc]==['VIII','X','029'])
 eids=set()
 for x in pages+details+loc:
  p=BASE/x['path']
  with Image.open(p) as im:im.load();dims=list(im.size)
  with Image.open(p) as im:im.verify()
  c('evidence-complete-decode-CRC-SHA:'+x['path'],sha(p)==x.get('sha256',x.get('renderSHA256')) and p.stat().st_size==x.get('bytes',x.get('renderBytes')) and dims==x.get('dimensions',x.get('renderDimensions')) and x['sourcePDFSHA256']==PDFSHA)
  if x in pages:
   c('actual-footer-full-page:'+str(x['pdfPage']),x['observedPrintedFooter']==f"{x['printedPage']:03}" and x['originalPDFCropBoxRendered'] is True and x['authorActuallyVisuallyRead'] is True);eids.add(x['evidenceId'])
  elif x in details:
   c('actual-detail-rectangle:'+x['evidenceId'],dims==x['rectOriginalRotatedCropBoxPixelsXYWH'][2:] and x['renderDPI']==360 and x['origin']=='direct-original-PDF-CropBox' and x['authorActuallyVisuallyViewed'] is True);eids.add(x['evidenceId'])
  else:c('actual-locator-view:'+x['path'],x['authorActuallyVisuallyViewed'] is True)
 c('all20-permanent-PNGs-declared',{str(p.relative_to(BASE)) for p in (BASE/'evidence').glob('*.png')}=={x['path'] for x in pages+details+loc})
 for x in r:
  c('record-ID-value-evidence:'+x['sourceId'],x['sourceId']==f"hsk3-official-vi:l03:p{x['printedPage']:03}:{x['section']}" and x['pdfPage']==x['printedPage']+12 and bool(x['zhAnchor']) and bool(x['viPrinted']) and x['reviewStatus']=='author-original-visual-transcription-awaiting-independent-review' and set(x['evidence'])<=eids and f"original-full-pdf{x['pdfPage']:03}" in x['evidence'])
 with (BASE/'source-transcription.tsv').open(newline='') as f:tsv=list(csv.DictReader(f,delimiter='\t'))
 c('TSV130-exact-identities-and-values',[x['sourceId'] for x in tsv]==ids and all(t['viPrinted']==x['viPrinted'] and t['zhAnchor']==x['zhAnchor'] for t,x in zip(tsv,r)))
 freeze=BASE/'freeze-manifest.json'
 if freeze.exists():
  f=load('freeze-manifest.json');c('complete-frozen-inventory',{x['path'] for x in f['artifacts']}=={str(p.relative_to(BASE)) for p in BASE.rglob('*') if p.is_file() and p!=freeze})
  for x in f['artifacts']:
   p=BASE/x['path'];c('frozen-byte-identity:'+x['path'],sha(p)==x['sha256'] and p.stat().st_size==x['bytes'])
 out={'schemaVersion':1,'verificationUTC':datetime.now(timezone.utc).isoformat(),'authorBundleChecksPass':not issues,'sourceOnly':True,'independentSourceAcceptancePerformed':False,'automatedChecksAreVisualReading':False,'websiteAlignmentCertified':False,'sourceItems':len(r),'bodyPrintedVI':106,'appendixPrintedVI':24,'words':len(w),'appendixRoleTranslationUnits':len(roles),'roleLabelledWholeParagraphs':2,'bodyAppendixBindings':len(body),'checksPassed':sum(x['passed'] for x in checks),'checksTotal':len(checks),'issues':issues,'checks':checks,'sourceTranscriptionSHA256':sha(BASE/'source-transcription.json')}
 if '--write' in sys.argv:
  if freeze.exists():raise SystemExit('Author freeze is read-only.')
  (BASE/'author-verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:v for k,v in out.items() if k!='checks'},ensure_ascii=False,indent=2));return 1 if issues else 0
if __name__=='__main__':sys.exit(main())
