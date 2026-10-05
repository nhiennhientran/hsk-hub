#!/usr/bin/env python3
"""Fresh source-author-only PDF pack; does not load any website/canonical/runtime data."""
import json,hashlib,pathlib,shutil,sys,fitz,struct,zlib,argparse
cli=argparse.ArgumentParser();cli.add_argument("input");cli.add_argument("--work-dir",type=pathlib.Path);cli.add_argument("--repo",type=pathlib.Path);cli.add_argument("--pdf",type=pathlib.Path);args=cli.parse_args()
WORK=args.work_dir or pathlib.Path(__file__).resolve().parent
REPO=args.repo or WORK.parents[1]/'hsk-hub-resume-recovered'
PDF=args.pdf or WORK.parents[1]/'upload/HSK2 ( 3.0).pdf'
SHA='6465777a77f8d9cb0d29b47f00b36a8e9e9ff627509f0f02a9909c7aaeaa231b'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
x=json.loads((WORK/args.input).read_text());out=REPO/'course-app/docs/recovery-20261005/official-vi-source'/x['directory'];out.mkdir(parents=True,exist_ok=True)
assert sha(PDF)==SHA and PDF.stat().st_size==69855983
assert x['pages']==x['visuallyReadPages'];assert not (out/'FREEZE.json').exists()
records=x['records'];ids=[r['sourceId'] for r in records];assert len(ids)==len(set(ids))
pdf=fitz.open(PDF);assert len(pdf)==162
renders=[]
for n in x['pages']+x.get('boundaryPages',[]):
 png=WORK/f'pdf-{n:03d}.png';assert png.exists();dest=out/'original-pages'/png.name;dest.parent.mkdir(exist_ok=True);shutil.copyfile(png,dest)
 assert png.read_bytes()==dest.read_bytes();b=dest.read_bytes();assert b[:8]==b'\x89PNG\r\n\x1a\n'
 at=8;idat=b''
 while at<len(b):
  length=struct.unpack('>I',b[at:at+4])[0];typ=b[at+4:at+8];data=b[at+8:at+8+length];crc=struct.unpack('>I',b[at+8+length:at+12+length])[0];assert zlib.crc32(typ+data)&0xffffffff==crc
  if typ==b'IDAT':idat+=data
  at+=12+length
 assert zlib.decompress(idat)
 page=pdf[n-1];printed=n-14 if n<=159 else None
 renders.append({'file':str(dest.relative_to(out)),'pdfPage':n,'printedPage':printed,'sha256':sha(dest),'bytes':dest.stat().st_size,'cropBox':list(page.cropbox),'rotation':page.rotation,'actualVisualRead':True,'role':'source-page' if n in x['pages'] else 'excluded-neighbour-boundary'})
for r in records:
 r['documentSourceId']='hsk2-official-vietnamese-20261004';r['officialPDFSHA256']=SHA;r['reviewStatus']='author-only-pending-independent-original-PDF-review'
 assert r['pdfPage'] in x['pages'];assert r['printedPage']==r['pdfPage']-14
 r.setdefault('zhFragments',[{'pdfPage':r.get('zhAnchorPDFPage',r['pdfPage']),'printedPage':r.get('zhAnchorPrintedPage',r['printedPage']),'text':r['zhAnchor']}])
 r.setdefault('fragments',[{'pdfPage':r['pdfPage'],'printedPage':r['printedPage'],'text':r['viPrinted'],'joinerAfter':''}])
 assembled=''.join(f['text']+f.get('joinerAfter','') for f in r['fragments']);assert assembled==r['viPrinted']
 r['pdfPages']=sorted({f['pdfPage'] for f in r['zhFragments']+r['fragments']});r['printedPages']=[p-14 for p in r['pdfPages']]
 assert all(f['printedPage']==f['pdfPage']-14 for f in r['fragments']+r['zhFragments'])
 r['physicalSourceKey']=f"{SHA}:pdf{r['pdfPage']}:{r['section']}"
 r['literalEvidence']={'viCodePoints':len(r['viPrinted']),'viUTF16Units':len(r['viPrinted'].encode('utf-16-le'))//2,'viUTF8SHA256':hashlib.sha256(r['viPrinted'].encode()).hexdigest(),'zhCodePoints':len(r['zhAnchor']),'zhUTF8SHA256':hashlib.sha256(r['zhAnchor'].encode()).hexdigest(),'normalizationPerformed':False}
source={'schemaVersion':1,'sourceRevision':'20261005-fresh-recovery-v1','status':'author-source-transcription-awaiting-independent-original-page-review','author':'remaining_media_audit','level':2,'lesson':x.get('lesson'),'documentSourceId':'hsk2-official-vietnamese-20261004','officialPDFSHA256':SHA,'sourcePDF':{'bytes':69855983,'physicalPages':162,'physicalOffsetToPrinted':14,'offsetAppliesThroughPrinted145':True},'readProof':{'pdfPagesRead':x['visuallyReadPages'],'actualOriginalPDFFootersRead':[p-14 for p in x['pages']],'freshOriginalPDFRenders':True,'allWholeSourcePageImagesActuallyViewed':True,'OCRUsed':False,'PDFTextExtractionUsed':False,'websiteVietnameseRead':False},'scope':x['scope'],'counts':{'sourceItems':len(records),'numberedWords':sum(r.get('category')=='word' for r in records),'printedRoleTranslationLines':sum(bool(r.get('printedRoleZh')) for r in records),'wholeDiaryParagraphs':sum(r.get('category')=='diary' for r in records),'wholeUnlabelledNarratives':sum(r.get('category')=='full-narrative' for r in records),'unnumberedWordSubentries':sum(r.get('category')=='word-subentry' for r in records)},'transcriptionPolicy':{'layoutLineWrapsJoinedWithSpaces':True,'printedDiacriticsCapitalizationPunctuationPreserved':True,'rolesSeparateFromWholeUtterance':True,'noSilentSemanticRepair':True,'allActualZHAndVIPagesRecorded':True,'sourceOnlyDoesNotAuthorizeWebsiteChange':True},'candidateErrata':x.get('candidateErrata',[]),'sharedAppendix':x.get('sharedAppendix'),'noPrintedVietnameseAreas':x.get('noPrintedVietnameseAreas',[]),'records':records,'boundaries':{'websiteComparisonPerformed':False,'websiteAlignmentComplete':False,'productionChanged':False,'independentSourceAcceptancePerformed':False,'oldLostAcceptedReportsReused':False}}
write(out/'source-transcription.json',source);write(out/'render-manifest.json',{'officialPDFSHA256':SHA,'renderer':f'PyMuPDF {fitz.VersionBind}','matrix':[1.8,1.8],'respectCropBox':True,'preservePDFRotation':True,'freshRenderedFromRestoredActualPDF':True,'records':renders});write(out/'page-scope-ledger.json',x['pageLedger']);write(out/'author-input.json',x)
shutil.copyfile(pathlib.Path(__file__),out/'build-source-pack.py')
checks=[]
for r in records:
 checks.append({'sourceId':r['sourceId'],'uniqueID':ids.count(r['sourceId'])==1,'allPairPagesWithinScope':all(p in x['pages'] for p in r['pdfPages']),'nonemptyWholeVI':bool(r['viPrinted']),'allVIFragmentAssemblyExact':''.join(f['text']+f.get('joinerAfter','') for f in r['fragments'])==r['viPrinted'],'evidenceHashesRecorded':True})
assert all(all(v is True for k,v in c.items() if k!='sourceId') for c in checks)
write(out/'author-verification.json',{'status':'passed-structural-author-checks-not-independent-content-review','recordChecks':checks,'sourceItems':len(records),'pngCRCAndFullDecodeVerified':len(renders),'actualPdfSHA256':sha(PDF),'runtimeFilesLoaded':0,'runtimeMutations':0,'acceptedSourceItems':0})
(out/'README.md').write_text(f"HSK2 fresh recovery source-only author pack: {x['directory']}\n\n{len(records)} literal source records. Entire declared original pages were visually read from the actual restored PDF and retained PNG bytes. All source pages and explicit Chinese/Vietnamese paired fragments are recorded. No old lost acceptance report is adopted. This pack requires a different reviewer to inspect the original PDF and every source ID. No website VI was read or compared, no production change or trusted proof is generated. Chinese-only examples, options and response blanks are recorded as such, never invented as printed VI translations.\n")
files=sorted(p for p in out.rglob('*') if p.is_file() and p.name not in ['FREEZE.json','STAGE-FILES.txt']);stage=[str(p.relative_to(REPO)) for p in files]+[str((out/'FREEZE.json').relative_to(REPO)),str((out/'STAGE-FILES.txt').relative_to(REPO))];(out/'STAGE-FILES.txt').write_text('\n'.join(stage)+'\n');files.append(out/'STAGE-FILES.txt');freeze={'schemaVersion':1,'status':'author-only-pending-independent-review','officialPDFSHA256':SHA,'sourceSHA256':sha(out/'source-transcription.json'),'sourceItems':len(records),'sourcePages':x['pages'],'files':[{'file':str(p.relative_to(out)),'sha256':sha(p),'bytes':p.stat().st_size} for p in files],'runtimeChanged':False,'sourceIndependentAccepted':False,'websiteComparisonPerformed':False};write(out/'FREEZE.json',freeze)
for f in freeze['files']:assert sha(out/f['file'])==f['sha256']
print(json.dumps({'directory':str(out.relative_to(REPO)),'sourceItems':len(records),'sourceSHA256':freeze['sourceSHA256'],'freezeSHA256':sha(out/'FREEZE.json'),'stageSHA256':sha(out/'STAGE-FILES.txt'),'files':len(stage),'records':source['counts'],'qualification':'author-only-new-original-PDF-read-not-old-acceptance-not-website-comparison'},ensure_ascii=False))
