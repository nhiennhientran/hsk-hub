"""Fresh original-PDF rendering and immutable author-input verification for source QA."""
import argparse, hashlib, json
from pathlib import Path
import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
parser = argparse.ArgumentParser()
parser.add_argument('lesson', type=int, choices=range(8,16))
args = parser.parse_args()
pdf_path = ROOT.parent / 'upload' / 'HSK1  (3.0).pdf'
expected_pdf_sha = '99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764'
sha = lambda b: hashlib.sha256(b).hexdigest()
raw_pdf = pdf_path.read_bytes()
assert sha(raw_pdf) == expected_pdf_sha
pdf = fitz.open(stream=raw_pdf, filetype='pdf')
assert len(pdf) == 148
old = ROOT / f'course-app/docs/resume-20261004/official-vi-source-prep/hsk1-l{args.lesson:02}'
new = ROOT / f'course-app/docs/recovery-20261005/official-vi-source/hsk1-l{args.lesson:02}'
author = old if args.lesson <= 10 else new
source_name = 'source-transcription.json' if args.lesson <= 10 else 'source.json'
if not (author/source_name).exists():
    source_name = 'source-transcription.json'
freeze_candidates = [author/n for n in ['freeze-manifest.json','FREEZE.json','freeze.json']]
freeze_path = next((p for p in freeze_candidates if p.exists()), None)
assert freeze_path is not None, 'Wait for the exact frozen author source'
freeze_bytes = freeze_path.read_bytes()
freeze = json.loads(freeze_bytes)
rows = freeze.get('files', freeze.get('artifacts', []))
assert rows
verified = []
for row in rows:
    name = row.get('file', row.get('path'))
    p = ROOT/name if name.startswith('course-app/') else author/name
    data = p.read_bytes()
    assert len(data) == row.get('bytes',row.get('sizeBytes'))
    assert sha(data) == row['sha256'], name
    verified.append({'file':str(p.relative_to(ROOT)),'bytes':len(data),'sha256':sha(data)})
source_bytes = (author/source_name).read_bytes()
source = json.loads(source_bytes)
assert source['lesson'] == args.lesson
assert source['sourcePDF']['sha256'] == expected_pdf_sha
pages = source['pdfPages']
assert pages == sorted(set(pages)) and all(1 <= n <= len(pdf) for n in pages)
out = ROOT / f'course-app/docs/recovery-20261005/qa-official-vi/hsk1-l{args.lesson:02}'
out.mkdir(parents=True,exist_ok=True)
archive = out/'author-input'; archive.mkdir(exist_ok=True)
for name,data in [('source-transcription.json',source_bytes),('freeze-manifest.json',freeze_bytes)]:
    p = archive/name
    if p.exists(): assert p.read_bytes() == data, 'Never overwrite an earlier input'
    else: p.write_bytes(data)
renders = out/'renders'; renders.mkdir(exist_ok=True)
page_rows = []
for n in pages + [max(pages)+1]:
    if n > len(pdf): continue
    pix = pdf[n-1].get_pixmap(matrix=fitz.Matrix(3,3),alpha=False)
    data = pix.tobytes('png'); name = f'pdf-{n:03}-independent.png'
    p = renders/name
    if p.exists(): assert p.read_bytes() == data
    else: p.write_bytes(data)
    with Image.open(p) as image:
        image.load(); assert image.size == (pix.width,pix.height)
    page_rows.append({'file':str(p.relative_to(out)),'pdfPage':n,'printedPage':f'{n-16:03}',
                      'bytes':len(data),'sha256':sha(data),'width':pix.width,'height':pix.height,
                      'scope':'whole lesson page' if n in pages else 'next-lesson boundary only'})
manifest = {'schemaVersion':1,'lesson':args.lesson,'sourcePDFSHA256':expected_pdf_sha,
            'pdfPageCount':len(pdf),'renderer':'PyMuPDF '+fitz.VersionBind,'matrix':[3,3],
            'authorSource':str((author/source_name).relative_to(ROOT)),
            'authorSourceSHA256':sha(source_bytes),'authorFreeze':str(freeze_path.relative_to(ROOT)),
            'authorFreezeSHA256':sha(freeze_bytes),'verifiedFrozenAuthorFiles':verified,
            'pages':page_rows,'status':'input-and-fresh-raster-verified-manual-language-review-pending',
            'websiteVietnameseRead':False,'runtimeActivation':False}
target = out/'render-manifest.json'
content = json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
if target.exists(): assert target.read_text() == content
else: target.write_text(content)
print(json.dumps({'lesson':args.lesson,'freshWholePages':len(pages),'boundaryPages':len(page_rows)-len(pages),
                  'frozenAuthorFilesVerified':len(verified),'sourceSHA256':sha(source_bytes),
                  'manualReviewStatus':'pending','output':str(out)},ensure_ascii=False))
