#!/usr/bin/env python3
"""Re-render the source evidence into a separate directory; never edit the freeze."""
from pathlib import Path
import argparse, hashlib, json, subprocess, tempfile
from PIL import Image

BASE = Path(__file__).resolve().parent
PS = '7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951'

def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pdf', type=Path, default=Path('/workspace/scratch/28b55072841a/upload/HSK3 (3.0).pdf'))
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    out = args.out.resolve()
    if out == BASE or BASE in out.parents:
        raise SystemExit('Use a separate output directory; author freeze is read-only.')
    if digest(args.pdf) != PS:
        raise SystemExit('Original PDF identity mismatch.')
    if out.exists() and any(out.iterdir()):
        raise SystemExit('Output directory must be empty.')
    out.mkdir(parents=True, exist_ok=True)
    pages = json.loads((BASE / 'source-page-evidence.json').read_text())['pages']
    details = json.loads((BASE / 'source-detail-crop-evidence.json').read_text())['details']
    locators = json.loads((BASE / 'source-locator-evidence.json').read_text())['locators']
    results = []
    with tempfile.TemporaryDirectory(prefix='hsk3-original-rerender-') as temporary:
        cache = {}
        def original(page, dpi):
            key = (page, dpi)
            if key not in cache:
                prefix = Path(temporary) / f'pdf{page:03}-{dpi}'
                subprocess.run(['pdftoppm', '-f', str(page), '-l', str(page), '-singlefile', '-cropbox', '-r', str(dpi), '-png', str(args.pdf), str(prefix)], check=True)
                path = prefix.with_suffix('.png')
                with Image.open(path) as im:
                    im.load()
                    cache[key] = (path.read_bytes(), im.copy())
            return cache[key]
        for item in pages + details + locators:
            raw, im = original(item['pdfPage'], item.get('renderDPI', 360))
            target = out / item['path']
            target.parent.mkdir(parents=True, exist_ok=True)
            if item in details:
                x, y, w, h = item['rectOriginalRotatedCropBoxPixelsXYWH']
                im.crop((x, y, x + w, y + h)).save(target)
            else:
                target.write_bytes(raw)
            with Image.open(target) as checked:
                checked.load()
            with Image.open(target) as checked:
                checked.verify()
            expected = item.get('sha256', item.get('renderSHA256'))
            results.append({'path': item['path'], 'sha256': digest(target), 'matchesFrozenPNG': digest(target) == expected})
    receipt = {'sourcePDFSHA256': PS, 'independentVisualAcceptancePerformed': False, 'images': results, 'allPNGBytesMatch': all(x['matchesFrozenPNG'] for x in results)}
    (out / 'rerender-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({'images': len(results), 'allPNGBytesMatch': receipt['allPNGBytesMatch']}))
    return 0 if receipt['allPNGBytesMatch'] else 1

if __name__ == '__main__':
    raise SystemExit(main())
