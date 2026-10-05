import pathlib,json,hashlib,tempfile,sys,copy,collections,fitz
from PIL import Image
R=pathlib.Path(__file__).resolve().parents[5];B=pathlib.Path(__file__).resolve().parent;A=R/'course-app/docs/recovery-20261005/official-vi-source/hsk2-shared-appendix';V=A/'source-correction-v2';PDF=R.parent/'upload/HSK2 ( 3.0).pdf'
H=lambda x:hashlib.sha256(x).hexdigest();J=lambda p:json.loads(p.read_text());checks=[]
def ck(n,x):checks.append({'check':n,'passed':bool(x)})
def decode(p):Image.open(p).load();Image.open(p).verify();return True
old=J(A/'source-transcription.json');new=J(V/'source-transcription.json');journal=J(B/'independent-read-journal.json')
ck('actual original PDF exact',H(PDF.read_bytes())==new['officialPDFSHA256'] and PDF.stat().st_size==69855983)
for base,arc in [(A,'author-input-v1'),(V,'author-input-v2')]:
 f=J(base/'FREEZE.json')
 for x in f['files']:
  p=R/x['file'] if x['file'].startswith('course-app/') else base/x['file'];raw=p.read_bytes();ck('author frozen bytes '+str(p.relative_to(R)),len(raw)==x['bytes'] and H(raw)==x['sha256'])
  if p.suffix=='.png':ck('author PNG full decode '+str(p.relative_to(R)),decode(p))
 for p in (B/arc).iterdir():ck('archive byte exact '+arc+'/'+p.name,p.read_bytes()==(base/p.name).read_bytes())
expected=copy.deepcopy(old);expected['records'][20]['printedAbbreviation']='đtnn.';x=expected['records'][57];x['viPrinted']='Những từ có đánh dấu “*” ở phía trước là từ vượt khung của cấp độ này.';x['fragments'][0]['text']=x['viPrinted'];x['literalEvidence']['viUTF8SHA256']=H(x['viPrinted'].encode());x['starGlyphTranscription']='Vietnamese quoted asterisk-like printed glyph is transcribed as *; Chinese quoted five-point star is represented as ★. These are manual visual glyph proxies from a scanned page, not extracted PDF codepoints.'
for k in ['sourceRevision','correctionOfSourceSHA256','correctionQualification']:expected[k]=new[k]
ck('only 2 precise source record changes plus disclosed provenance',expected==new)
ck('explicit V1 source identity',new['correctionOfSourceSHA256']==H((A/'source-transcription.json').read_bytes()))
ck('author qualification not independent acceptance',new['correctionQualification']=='same author correction; not independent acceptance')
ck('5 original whole pages actually read before candidates',journal['actualOriginalFullPDFPagesReadBeforeAuthorRecordComparison']==list(range(155,160)))
ck('61 unique VI occurrences',len(new['records'])==61 and len({x['sourceId'] for x in new['records']})==61)
ck('16 original fullname/abbreviation POS rows actual manual read',[[x['zhAnchor'],x['viPrinted'],x['printedAbbreviation']] for x in new['records'] if x['category']=='pos-name']==journal['notes'][0]['entirePOSRowsActuallyRead'])
for i,x in enumerate(new['records']):
 vi=x['viPrinted'];zh=x['zhAnchor'];e=x['literalEvidence']
 ck('literal Unicode/hash '+x['sourceId'],e=={'viCodePoints':len(vi),'viUTF16Units':len(vi.encode('utf-16-le'))//2,'viUTF8SHA256':H(vi.encode()),'zhCodePoints':len(zh),'zhUTF8SHA256':H(zh.encode()),'normalizationPerformed':False})
 ck('VI whole fragment '+x['sourceId'],''.join(r['text']+r.get('joinerAfter','') for r in x['fragments'])==vi)
 ck('ZH whole fragment '+x['sourceId'],''.join(r['text']+r.get('joinerAfter','') for r in x['zhFragments'])==zh)
 ck('actual PDF footer and fragment bindings '+x['sourceId'],x['pdfPages']==[x['pdfPage']] and x['printedPages']==[x['pdfPage']-14] and x['printedPage']==x['pdfPage']-14 and all(r['pdfPage']==x['pdfPage'] and r['printedPage']==x['printedPage'] for r in x['fragments']+x['zhFragments']))
 if i not in [20,57]:ck('other 59 complete author records unchanged '+x['sourceId'],x==old['records'][i])
 if x['category']=='table-header':ck('actual table header text '+x['sourceId'],(x['zhAnchor'],vi) in [('词性','Từ loại'),('越南文','Tiếng Việt'),('越南文简写','Viết tắt'),('词语','Từ/Cụm'),('拼音','Phiên âm'),('课号','Bài')])
ck('no fabricated per-word VI gloss or dialogue appendix',[x for x in new['records'] if x['category'] in ['word','dialogue','diary']]==[])
for name,key in [('render-manifest.json','renders'),('detail-render-manifest.json','details')]:
 for x in J(B/name)[key]:
  p=B/x['path'];raw=p.read_bytes();ck('fresh independent PNG exact '+x['path'],len(raw)==x['bytes'] and H(raw)==x['sha256']);ck('fresh independent PNG full decode '+x['path'],decode(p))
proof=[]
with tempfile.TemporaryDirectory(prefix='hsk2-shared-original-rerender-') as td:
 doc=fitz.open(PDF);m=J(A/'render-manifest.json')
 for x in m['records']:
  p=pathlib.Path(td)/pathlib.Path(x['file']).name;doc[x['pdfPage']-1].get_pixmap(matrix=fitz.Matrix(*m['matrix'])).save(p);raw=p.read_bytes();ok=H(raw)==x['sha256'] and len(raw)==x['bytes'];ck('actual same-recipe source/boundary author full PNG '+x['file'],ok and decode(p));proof.append({'file':str((A/x['file']).relative_to(R)),'pdfPage':x['pdfPage'],'bytes':len(raw),'sha256':H(raw),'exact':ok,'independentVisualAcceptance':155<=x['pdfPage']<=159})
 for i,x in enumerate(J(V/'render-manifest.json')['records']):
  p=pathlib.Path(td)/f'detail{i}.png';doc[154].get_pixmap(matrix=fitz.Matrix(*x['matrix']),clip=fitz.Rect(x['clipInRotatedPageCoordinates'])).save(p);raw=p.read_bytes();orig=R/x['evidenceFile'];ok=H(raw)==x['evidenceSHA256'] and raw==orig.read_bytes();ck('actual same-recipe author fresh detail '+x['evidenceFile'],ok and decode(p));proof.append({'file':x['evidenceFile'],'pdfPage':155,'bytes':len(raw),'sha256':H(raw),'exact':ok})
result={'schemaVersion':1,'reviewer':'release_assembly','sourceAuthor':'remaining_media_audit','sourceV1SHA256':H((A/'source-transcription.json').read_bytes()),'sourceV2SHA256':H((V/'source-transcription.json').read_bytes()),'originalPDFSHA256':H(PDF.read_bytes()),'checks':checks,'checkCount':len(checks),'passed':all(x['passed'] for x in checks),'failed':[x for x in checks if not x['passed']],'actualAuthorSameRecipeRerenders':proof,'qualification':'Eight author full PNGs and two details actual bytes reproduced; only source pages155–159 independently visually accepted. Boundary160–162 classification remains author-only; activation code not transcribed. Integrity checks do not substitute original visual reading.'}
(B/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'passed':result['passed'],'checkCount':len(checks),'actualAuthorPNGExact':sum(x['exact'] for x in proof),'failed':result['failed']},ensure_ascii=False));sys.exit(0 if result['passed'] else 1)
