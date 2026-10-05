"""Fresh source and shared appendix rendering; no language acceptance here."""
import argparse,hashlib,json
from pathlib import Path
import fitz
from PIL import Image
ROOT=Path(__file__).resolve().parents[4]
ap=argparse.ArgumentParser();ap.add_argument('lesson',type=int,choices=range(11,16));args=ap.parse_args()
sha=lambda b:hashlib.sha256(b).hexdigest()
author=ROOT/f'course-app/docs/recovery-20261005/official-vi-source/hsk1-l{args.lesson:02}'
out=ROOT/f'course-app/docs/recovery-20261005/qa-official-vi/hsk1-l{args.lesson:02}'
assert not (out/'FREEZE.json').exists();out.mkdir(exist_ok=True)
freeze_bytes=(author/'FREEZE.json').read_bytes();f=json.loads(freeze_bytes)
verified=[]
for x in f['files']:
    p=ROOT/x['file'] if x['file'].startswith('course-app/') else author/x['file']
    b=p.read_bytes();assert len(b)==x['bytes'] and sha(b)==x['sha256'],p
    if p.suffix=='.png':
        with Image.open(p) as im:im.load()
    verified.append({'file':str(p.relative_to(ROOT)),'bytes':len(b),'sha256':sha(b)})
source_bytes=(author/'source.json').read_bytes();s=json.loads(source_bytes)
assert s['lesson']==args.lesson and sha(source_bytes)==f['sourceSHA256']
pdf_path=ROOT.parent/'upload/HSK1  (3.0).pdf';pdf_bytes=pdf_path.read_bytes()
assert sha(pdf_bytes)==s['sourcePDF']['sha256']=='99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764'
pdf=fitz.open(stream=pdf_bytes,filetype='pdf');assert len(pdf)==148
archive=out/'author-input';archive.mkdir(exist_ok=True)
for name,data in [('source.json',source_bytes),('FREEZE.json',freeze_bytes)]:
    p=archive/name
    if p.exists():assert p.read_bytes()==data
    else:p.write_bytes(data)
pages=sorted(set(s['pdfPages']+s['appendixPDFPages']))
boundaries=[max(s['pdfPages'])+1,max(s['appendixPDFPages'])+1]
renders=out/'renders';renders.mkdir(exist_ok=True);rows=[]
for page in sorted(set(pages+boundaries)):
    pix=pdf[page-1].get_pixmap(matrix=fitz.Matrix(2.5,2.5),alpha=False)
    data=pix.tobytes('png');p=renders/f'pdf-{page:03}-independent.png'
    if p.exists():assert p.read_bytes()==data
    else:p.write_bytes(data)
    with Image.open(p) as im:im.load();assert im.size==(pix.width,pix.height)
    rows.append({'file':str(p.relative_to(out)),'pdfPage':page,'printedPage':f'{page-16:03}',
                 'bytes':len(data),'sha256':sha(data),'width':pix.width,'height':pix.height,
                 'scope':'body' if page in s['pdfPages'] else ('shared-appendix' if page in s['appendixPDFPages'] else 'boundary-only')})
manifest={'schemaVersion':2,'lesson':args.lesson,'sourcePDFSHA256':sha(pdf_bytes),
           'authorSource':str((author/'source.json').relative_to(ROOT)),
           'authorSourceSHA256':sha(source_bytes),'authorFreeze':str((author/'FREEZE.json').relative_to(ROOT)),
           'authorFreezeSHA256':sha(freeze_bytes),'verifiedFrozenAuthorFiles':verified,
           'renderer':'PyMuPDF '+fitz.VersionBind,'matrix':[2.5,2.5],'pages':rows,
           'bodyOccurrenceCount':len(s['occurrences']),'sharedAppendixOccurrenceCount':len(s['appendixOccurrences']),
           'status':'inputs-and-fresh-rasters-verified-manual-language-review-pending',
           'websiteVietnameseRead':False,'runtimeActivation':False}
p=out/'render-manifest.json';b=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode()
if p.exists():assert p.read_bytes()==b
else:p.write_bytes(b)
print(json.dumps({'lesson':args.lesson,'frozenAuthorFilesVerified':len(verified),
                  'freshWholeSourcePages':len(pages),'boundaryPages':len(set(boundaries)-set(pages)),
                  'bodyCount':len(s['occurrences']),'sharedAppendixCount':len(s['appendixOccurrences']),
                  'status':'manual-review-pending'}))
