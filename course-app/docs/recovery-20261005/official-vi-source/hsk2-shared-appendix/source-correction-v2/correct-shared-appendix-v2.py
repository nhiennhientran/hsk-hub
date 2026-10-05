#!/usr/bin/env python3
import copy,hashlib,json,pathlib,shutil,struct,zlib,fitz
BASE=pathlib.Path('/workspace/scratch/28b55072841a');REPO=BASE/'hsk-hub-resume-recovered';WORK=BASE/'source-recovery-work/hsk2';PDF=BASE/'upload/HSK2 ( 3.0).pdf'
old=REPO/'course-app/docs/recovery-20261005/official-vi-source/hsk2-shared-appendix';out=old/'source-correction-v2';out.mkdir(exist_ok=True);assert not (out/'FREEZE.json').exists()
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(name,v):(out/name).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
assert sha(PDF)=='6465777a77f8d9cb0d29b47f00b36a8e9e9ff627509f0f02a9909c7aaeaa231b'
a=json.loads((old/'source-transcription.json').read_text());b=copy.deepcopy(a);b['sourceRevision']='20261005-fresh-recovery-v2-author-transcription-correction';b['correctionOfSourceSHA256']=sha(old/'source-transcription.json');b['correctionQualification']='same author correction; not independent acceptance'
repairs=[]
for r in b['records']:
 if r['sourceId'].endswith('pos-row14'):
  before=copy.deepcopy(r);assert r['printedAbbreviation']=='đnn.';r['printedAbbreviation']='đtnn.';detail='pdf-155-pos-detail.png';clip=[295,325,530,395]
 elif r['sourceId'].endswith('star-legend'):
  before=copy.deepcopy(r);r['viPrinted']=r['viPrinted'].replace('“★”','“*”');r['fragments'][0]['text']=r['viPrinted'];r['starGlyphTranscription']='Vietnamese quoted asterisk-like printed glyph is transcribed as *; Chinese quoted five-point star is represented as ★. These are manual visual glyph proxies from a scanned page, not extracted PDF codepoints.';detail='pdf-155-star-detail.png';clip=[35,700,535,770]
  r['literalEvidence']['viUTF8SHA256']=hashlib.sha256(r['viPrinted'].encode()).hexdigest();r['literalEvidence']['viCodePoints']=len(r['viPrinted']);r['literalEvidence']['viUTF16Units']=len(r['viPrinted'].encode('utf-16-le'))//2
 else:continue
 dest=out/'original-details'/detail;dest.parent.mkdir(exist_ok=True);shutil.copyfile(WORK/detail,dest)
 repairs.append({'sourceId':r['sourceId'],'oldRecord':before,'newRecord':copy.deepcopy(r),'classification':'author-transcription-repair-not-book-semantic-erratum','evidenceFile':str(dest.relative_to(REPO)),'evidenceSHA256':sha(dest),'pdfPage':155,'printedPage':141,'clipInRotatedPageCoordinates':clip,'matrix':[4,4]})
changed=[x['sourceId'] for x,y in zip(a['records'],b['records']) if x!=y];assert changed==[r['sourceId'] for r in repairs] and len(changed)==2
for r in b['records']:
 assert ''.join(f['text']+f.get('joinerAfter','') for f in r['fragments'])==r['viPrinted'];assert r['literalEvidence']['viUTF8SHA256']==hashlib.sha256(r['viPrinted'].encode()).hexdigest()
for p in (out/'original-details').iterdir():
 data=p.read_bytes();at=8;idat=b'';assert data[:8]==b'\x89PNG\r\n\x1a\n'
 while at<len(data):
  n=struct.unpack('>I',data[at:at+4])[0];typ=data[at+4:at+8];d=data[at+8:at+8+n];crc=struct.unpack('>I',data[at+8+n:at+12+n])[0];assert zlib.crc32(typ+d)&0xffffffff==crc
  if typ==b'IDAT':idat+=d
  at+=12+n
 assert zlib.decompress(idat)
save('source-transcription.json',b);save('repair.json',{'status':'author-only-pending-independent-original-PDF-review','initialSourceSHA256':sha(old/'source-transcription.json'),'initialFreezeSHA256':sha(old/'FREEZE.json'),'correctedSourceSHA256':sha(out/'source-transcription.json'),'officialPDFSHA256':sha(PDF),'repairs':repairs,'other59RecordsEqual':True,'originalV1NotModified':True,'runtimeChanged':False})
save('author-verification.json',{'sourceItems':61,'changedSourceIDs':changed,'other59RecordsDeepEqual':True,'allSourceIdsAndChineseAnchorsUnchanged':True,'wholeVietnameseFragmentAssemblyAndUTF8HashChecks':61,'cropPNGCRCAndFullDecodeChecks':2,'acceptedSourceItems':0,'runtimeChanged':False})
save('render-manifest.json',{'officialPDFSHA256':sha(PDF),'renderer':f'PyMuPDF {fitz.VersionBind}','freshRenderedFromRestoredActualPDF':True,'actuallyViewed':True,'originalPage':155,'printedPage':141,'respectCropBox':True,'preservePDFRotation':True,'records':[{k:r[k] for k in ['evidenceFile','evidenceSHA256','clipInRotatedPageCoordinates','matrix']} for r in repairs]})
(out/'README.md').write_text('Shared appendix author correction v2. The original 61-record pack remains immutable. Exactly two records correct author transcription after fresh enlarged original-PDF crops: printed abbreviation and the Vietnamese quoted glyph. All other 59 records are equal. Original Chinese star transcription is a visual glyph proxy, not a decoded original Unicode assertion. No textbook semantic correction, website comparison or independent acceptance is claimed.\n')
shutil.copyfile(WORK/'correct-shared-appendix-v2.py',out/'correct-shared-appendix-v2.py')
files=sorted(p for p in out.rglob('*') if p.is_file() and p.name not in ['FREEZE.json','STAGE-FILES.txt']);stage=[str(p.relative_to(REPO)) for p in files]+[str((out/'FREEZE.json').relative_to(REPO)),str((out/'STAGE-FILES.txt').relative_to(REPO))];(out/'STAGE-FILES.txt').write_text('\n'.join(stage)+'\n');files.append(out/'STAGE-FILES.txt')
save('FREEZE.json',{'status':'author-only-pending-independent-review','sourceItems':61,'changedRecords':2,'sourceSHA256':sha(out/'source-transcription.json'),'initialSourceSHA256':sha(old/'source-transcription.json'),'officialPDFSHA256':sha(PDF),'files':[{'file':str(p.relative_to(out)),'sha256':sha(p),'bytes':p.stat().st_size} for p in files]})
print(json.dumps({'directory':str(out.relative_to(REPO)),'sourceSHA256':sha(out/'source-transcription.json'),'freezeSHA256':sha(out/'FREEZE.json'),'stageSHA256':sha(out/'STAGE-FILES.txt'),'stagePaths':len(stage),'qualification':'author-only; 0 independent accepted; only2source-record corrections'},ensure_ascii=False))
