"""Re-render the exact supplied PDF. Default compares bytes without writing."""
from pathlib import Path
import argparse
import hashlib
import json
import fitz

here = Path(__file__).resolve().parent
args = argparse.ArgumentParser()
args.add_argument('--pdf', required=True)
args.add_argument('--write', action='store_true')
opts = args.parse_args()
manifest = json.loads((here / 'render-manifest.json').read_text())
source = Path(opts.pdf).read_bytes()
assert hashlib.sha256(source).hexdigest() == manifest['sourcePDFSHA256'], 'foreign PDF'
pdf = fitz.open(stream=source, filetype='pdf')
assert len(pdf) == manifest['pdfPageCount']
assert fitz.VersionBind == manifest['renderer'].split(' ')[1], 'use recorded renderer version for exact PNG bytes'
checked = []
for item in manifest['pages'] + manifest.get('crops', []):
    matrix = item.get('matrix', manifest['matrix'])
    rect = fitz.Rect(item['pdfRectPoints']) if 'pdfRectPoints' in item else None
    pixel = pdf[item['pdfPage'] - 1].get_pixmap(matrix=fitz.Matrix(*matrix), clip=rect, alpha=False)
    image = pixel.tobytes('png')
    assert len(image) == item['bytes'] and hashlib.sha256(image).hexdigest() == item['sha256'], item['file']
    path = here / 'renders' / Path(item['file']).name
    if opts.write:
        path.write_bytes(image)
    else:
        assert path.read_bytes() == image, path
    checked.append(item['file'])
print(json.dumps({'checkedRasters': len(checked), 'writes': opts.write, 'sourcePDFSHA256': manifest['sourcePDFSHA256']}))
