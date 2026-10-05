#!/usr/bin/env python3
import pathlib,json,hashlib,fitz,sys
from PIL import Image
L=int(sys.argv[1]);BASE=pathlib.Path('/workspace/scratch/28b55072841a/hsk-hub-resume-recovered/course-app/docs/recovery-20261005')
A=BASE/f'official-vi-source/hsk2-l{L:02d}';Q=BASE/f'qa-official-vi/hsk2-l{L:02d}'
Q.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
P=pathlib.Path('/workspace/scratch/28b55072841a/upload/HSK2 ( 3.0).pdf')
assert sha(P)=='6465777a77f8d9cb0d29b47f00b36a8e9e9ff627509f0f02a9909c7aaeaa231b'
S=json.loads((A/'source-transcription.json').read_text());F=json.loads((A/'FREEZE.json').read_text());M=json.loads((A/'render-manifest.json').read_text())
pin=[]
for name in ['source-transcription.json','FREEZE.json','STAGE-FILES.txt','render-manifest.json']:
    p=A/name;(Q/('author-'+name)).write_bytes(p.read_bytes());pin.append({'file':str(p),'sha256':sha(p),'bytes':p.stat().st_size})
incidents=[];author_checks=[]
for r in F['files']:
    p=A/r['file']; ok=sha(p)==r['sha256'] and p.stat().st_size==r['bytes']
    error=None
    if p.suffix=='.png':
        try:
            with Image.open(p) as im:im.load()
            with Image.open(p) as im:im.verify()
        except Exception as e:error=repr(e);ok=False
    author_checks.append({'file':r['file'],'sha256':sha(p),'bytes':p.stat().st_size,'matchesFreezeAndDecodes':ok,'error':error})
    if not ok:
        dest=Q/'author-byte-incidents'/r['file'];dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(p.read_bytes())
        incidents.append(author_checks[-1])
D=fitz.open(P);manifest=[];(Q/'renders').mkdir(exist_ok=True)
for r in M['records']:
    n=r['pdfPage']; page=D[n-1];p=Q/'renders'/f'pdf-{n:03d}.png'
    assert not p.exists(),f'Do not overwrite existing QA raster {p}'
    p.write_bytes(page.get_pixmap(matrix=fitz.Matrix(1.8,1.8),alpha=False).tobytes('png'))
    with Image.open(p) as im:im.load()
    with Image.open(p) as im:im.verify()
    manifest.append({'file':str(p.relative_to(Q)),'pdfPage':n,'printedPageCandidate':r['printedPage'],'sha256':sha(p),'bytes':p.stat().st_size,'originalCropBox':list(page.cropbox),'rotation':page.rotation,'matrix':[1.8,1.8],'role':r['role'],'visualRead':False,'byteIdenticalToAuthorFrozenRaster':sha(p)==r['sha256']})
(Q/'input-intake.json').write_text(json.dumps({'qualification':'independent-actual-PDF-byte-and-image-integrity-intake-only-before-visual-source-review','officialPDFSHA256':sha(P),'authorPins':pin,'frozenAuthorFileChecks':author_checks,'incidents':incidents,'sourceCount':len(S['records']),'independentLanguageAcceptance':0},ensure_ascii=False,indent=2)+'\n')
(Q/'render-manifest.json').write_text(json.dumps({'officialPDFSHA256':sha(P),'renderer':fitz.VersionBind,'records':manifest},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'lesson':L,'sourceItems':len(S['records']),'pages':len(manifest),'authorByteIncidents':len(incidents),'allOwnPNGsDecode':True,'qa':str(Q)}))
