#!/usr/bin/env python3
"""Source-only author structure/byte checks; never independent print acceptance."""
from pathlib import Path
from collections import Counter
from datetime import datetime,timezone
from PIL import Image
import hashlib,json,csv,sys
BASE=Path(__file__).resolve().parent
PDF=Path('/workspace/scratch/28b55072841a/upload/HSK3 (3.0).pdf');PS='7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(n):return json.loads((BASE/n).read_text())
def main():
 checks=[];issues=[]
 def c(n,v):
  checks.append({'check':n,'passed':bool(v)})
  if not v:issues.append(n)
 e=load('author-expected-scope.json');s=load('source-transcription.json');r=s['records'];ids=[x['sourceId'] for x in r];byid={x['sourceId']:x for x in r};l=e['lesson']
 c('actual-original-PDF-byte-identity',sha(PDF)==PS==s['officialPDFSHA256'] and s['officialPDFBytes']==PDF.stat().st_size==96266563)
 c('manually-observed-ID-and-page-counts',len(r)==len(set(ids))==e['sourceItems'] and {str(k):v for k,v in Counter(x['pdfPage'] for x in r).items()}==e['primaryPageCounts'])
 c('pending-distinct-independent-review',s['status']=='source-only-transcribed-pending-independent-original-page-review' and s['level']==3 and s['lesson']==l and s['boundaries']['independentSourceAcceptancePerformed'] is False)
 c('no-website-proposal-runtime-grading-or-OCR',all(s['boundaries'][k] is False for k in ['websiteVietnameseRead','websiteComparisonPerformed','websiteProposalPrepared','websiteVietnameseAlignmentComplete','productionChanged','historyOrGradingStorageChanged','OCRUsed','PDFTextLayerUsedAsAuthority']))
 c('body-appendix-VI-counts',sum(x['pdfPage']<195 for x in r)==e['bodyVI'] and sum(x['pdfPage']>=195 for x in r)==e['appendixVI'])
 words=[x for x in r if 'printedNumber' in x]
 c('all-actual-numbered-words-and-POS',len(words)==e['numberedWords'] and [x['printedNumber'] for x in words]==list(range(1,e['numberedWords']+1)) and all(x['printedPinyin'] and x['printedPOSRaw'] and x['posPrinted'] is True and x['sourceWordKind']=='ordinary-numbered-word' for x in words))
 for x in e['decisiveLiteralFields']:c('decisive-raw-field:'+x['section']+':'+x['field'],next(y for y in r if y['section']==x['section'])[x['field']]==x['value'])
 inline=[x for x in r if x.get('sourceWordKind')=='inline-example-gloss'];c('all-manually-read-small-inline-glosses',[[x['zhAnchor'],x['viPrinted']] for x in inline]==e['inlineGlosses'] and all(x['posPrinted'] is False and x['printedPOSRaw'] is None for x in inline))
 body=s['bodyChineseOnlyTexts'];bids=[x['bodySourceId'] for x in body]
 c('all-Chinese-only-body-units-unique',len(body)==len(set(bids))==sum(e['bodyTextUnits'].values()) and {str(k):v for k,v in Counter(x['printedTextNumber'] for x in body).items()}==e['bodyTextUnits'] and all(x['printedVietnameseInBody'] is False and len(x['appendixSourceIds'])==1 for x in body))
 roles=[x for x in r if 'printedRoleVi' in x]
 c('all-actual-role-units-and-order',{str(k):v for k,v in Counter(x['printedTextNumber'] for x in roles).items()}==e['roleTextUnits'] and all('printedRoleZh' not in x and x['sourceScope']=='official-Vietnamese-translation-appendix' for x in roles))
 for t,n in e['roleTextUnits'].items():c('role-order:text'+t,[x['printedDialogueOrdinal'] for x in roles if x['printedTextNumber']==int(t)]==list(range(1,n+1)))
 unlabelled=[x for x in r if x.get('sourceAppendixKind')=='whole-unlabelled-paragraph'];rolepara=[x for x in r if x.get('sourceAppendixKind')=='role-labelled-whole-paragraph']
 c('whole-paragraph-speaker-semantics',len(unlabelled)==e['wholeUnlabelledParagraphs'] and len(rolepara)==e['wholeRoleParagraphs'] and all(x['printedSpeaker'] is None and 'printedRoleVi' not in x and x['noWebsiteLinePartitionInferred'] is True for x in unlabelled) and all(x['printedRoleVi'] and x['noWebsiteLinePartitionInferred'] is True for x in rolepara))
 for b in body:
  a=byid[b['appendixSourceIds'][0]]
  c('body-appendix-1to1:'+b['bodySourceId'],a['bodyChineseSourceRef']==b['bodySourceId'] and a['zhAnchor']==b['zhPrinted'] and a['zhAnchorPDFPage']==b['pdfPage'] and a['zhAnchorPrintedPage']==b['printedPage'] and a['printedTextNumber']==b['printedTextNumber'] and a['printedDialogueOrdinal']==b['printedDialogueOrdinal'] and a['bodyVietnamesePrinted'] is False and (a.get('correspondingBodyRoleZh')==b['printedRoleZh']))
 c('bijective-four-official-texts',{x['bodyChineseSourceRef'] for x in r if 'bodyChineseSourceRef' in x}==set(bids))
 split=[x for x in r if 'viPrintedFragments' in x]
 c('actual-cross-page-occurrence-fragment-counts',len(split)==e['crossPageParagraphs'] and sum(len(x['viPrintedFragments']) for x in split)==e['crossPageFragments'])
 for a in split:
  fs=a['viPrintedFragments'];c('complete-fragment-join:'+a['sourceId'],a['viPrinted']==' '.join(f['viPrinted'] for f in fs) and list(dict.fromkeys(f['pdfPage'] for f in fs))==a['allSourcePDFPages'] and list(dict.fromkeys(f['printedPage'] for f in fs))==a['allSourcePrintedPages'] and all(f['pdfPage']==f['printedPage']+12 and f"original-full-pdf{f['pdfPage']:03}" in f['evidence'] for f in fs) and {f"original-full-pdf{x:03}" for x in a['allSourcePDFPages']}<=set(a['evidence']))
 c('observed-current-and-next-boundaries',s['scope']['actualBodyPDFPages']==[e['bodyPDFPages'][0],e['bodyPDFPages'][-1]] and s['scope']['actualAppendixPDFPages']==e['appendixPDFPages'] and s['scope']['nextLessonBoundary']['pdfPage']==e['nextPDFPage'] and s['scope']['nextLessonBoundary']['observedPrintedFooter']==f"{e['nextPrintedPage']:03}")
 pages=load('source-page-evidence.json')['pages'];details=load('source-detail-crop-evidence.json')['details'];loc=load('source-locator-evidence.json')['locators'];eids=set()
 c('actual-source-pages',[x['pdfPage'] for x in pages]==e['bodyPDFPages']+e['appendixPDFPages'] and len(s['readProof'])==len(pages))
 c('actual-detail-and-locator-counts',len(details)==e['detailCount'] and [x['observedPrintedFooter'] for x in loc]==e['locatorFooters'])
 for x in pages+details+loc:
  p=BASE/x['path']
  with Image.open(p) as im:im.load();dim=list(im.size)
  with Image.open(p) as im:im.verify()
  c('image-full-decode-CRC-SHA:'+x['path'],sha(p)==x.get('sha256',x.get('renderSHA256')) and p.stat().st_size==x.get('bytes',x.get('renderBytes')) and dim==x.get('dimensions',x.get('renderDimensions')) and x['sourcePDFSHA256']==PS)
  if x in pages:c('actual-source-footer:'+str(x['pdfPage']),x['observedPrintedFooter']==f"{x['printedPage']:03}" and x['authorActuallyVisuallyRead'] is True and x['originalPDFCropBoxRendered'] is True);eids.add(x['evidenceId'])
  elif x in details:c('original-detail-rectangle:'+x['evidenceId'],dim==x['rectOriginalRotatedCropBoxPixelsXYWH'][2:] and x['renderDPI']==360 and x['origin']=='direct-original-PDF-CropBox' and x['authorActuallyVisuallyViewed'] is True);eids.add(x['evidenceId'])
  else:c('actual-locator-view:'+x['path'],x['authorActuallyVisuallyViewed'] is True)
 c('all-permanent-PNGs-declared',len(list((BASE/'evidence').glob('*.png')))==e['permanentPNGs'] and {str(p.relative_to(BASE)) for p in (BASE/'evidence').glob('*.png')}=={x['path'] for x in pages+details+loc})
 for x in r:c('source-ID-value-evidence:'+x['sourceId'],x['sourceId']==f"hsk3-official-vi:l{l:02}:p{x['printedPage']:03}:{x['section']}" and bool(x['zhAnchor']) and bool(x['viPrinted']) and x['pdfPage']==x['printedPage']+12 and x['reviewStatus']=='author-original-visual-transcription-awaiting-independent-review' and set(x['evidence'])<=eids and f"original-full-pdf{x['pdfPage']:03}" in x['evidence'])
 with (BASE/'source-transcription.tsv').open(newline='') as f:tab=list(csv.DictReader(f,delimiter='\t'))
 c('TSV-exact-identities-values',[x['sourceId'] for x in tab]==ids and all(t['viPrinted']==x['viPrinted'] and t['zhAnchor']==x['zhAnchor'] for t,x in zip(tab,r)))
 freeze=BASE/'freeze-manifest.json'
 if freeze.exists():
  inv=load('freeze-manifest.json')['artifacts'];c('complete-frozen-inventory',{x['path'] for x in inv}=={str(p.relative_to(BASE)) for p in BASE.rglob('*') if p.is_file() and p!=freeze})
  for x in inv:
   p=BASE/x['path'];c('frozen-byte-identity:'+x['path'],sha(p)==x['sha256'] and p.stat().st_size==x['bytes'])
 out={'schemaVersion':1,'verificationUTC':datetime.now(timezone.utc).isoformat(),'authorBundleChecksPass':not issues,'sourceOnly':True,'independentSourceAcceptancePerformed':False,'automatedChecksAreVisualReading':False,'websiteAlignmentCertified':False,'lesson':l,'sourceItems':len(r),'bodyPrintedVI':e['bodyVI'],'appendixPrintedVI':e['appendixVI'],'words':len(words),'appendixRoleTranslationUnits':len(roles),'bodyAppendixBindings':len(body),'crossPageOccurrences':len(split),'crossPageFragments':sum(len(x['viPrintedFragments']) for x in split),'checksPassed':sum(x['passed'] for x in checks),'checksTotal':len(checks),'issues':issues,'checks':checks,'sourceTranscriptionSHA256':sha(BASE/'source-transcription.json')}
 if '--write' in sys.argv:
  if freeze.exists():raise SystemExit('Author freeze is read-only.')
  (BASE/'author-verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:v for k,v in out.items() if k!='checks'},ensure_ascii=False,indent=2));return 1 if issues else 0
if __name__=='__main__':sys.exit(main())
