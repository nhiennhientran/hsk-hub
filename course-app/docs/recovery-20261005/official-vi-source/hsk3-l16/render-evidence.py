#!/usr/bin/env python3
"""Original Poppler renders in a separate output folder; no author freeze edits."""
from pathlib import Path
import argparse,hashlib,json,subprocess,os
from PIL import Image
BASE=Path(__file__).resolve().parent
PS='7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--pdf',type=Path,default=Path('/workspace/scratch/28b55072841a/upload/HSK3 (3.0).pdf'));p.add_argument('--out',type=Path,required=True);a=p.parse_args();out=a.out.resolve()
 if out==BASE or BASE in out.parents:raise SystemExit('Use separate output; source freeze is read-only.')
 if out.exists()and any(out.iterdir()):raise SystemExit('Output must be empty.')
 if sha(a.pdf)!=PS:raise SystemExit('Official PDF identity mismatch.')
 out.mkdir(parents=True,exist_ok=True)
 pages=json.loads((BASE/'source-page-evidence.json').read_text())['pages'];details=json.loads((BASE/'source-detail-crop-evidence.json').read_text())['details'];loc=json.loads((BASE/'source-locator-evidence.json').read_text())['locators'];rows=[];originalBytes={}
 for x in pages+details+loc:
  target=out/x['path'];target.parent.mkdir(parents=True,exist_ok=True);prefix=target.with_suffix('')
  args=['pdftoppm','-f',str(x['pdfPage']),'-l',str(x['pdfPage']),'-singlefile','-cropbox','-r',str(x['renderDPI'])]
  if x in details:
   xx,yy,w,h=x['rectOriginalRotatedCropBoxPixelsXYWH'];args+=['-x',str(xx),'-y',str(yy),'-W',str(w),'-H',str(h)]
  args+=['-png',str(a.pdf),str(prefix)];subprocess.run(args,check=True)
  with target.open('rb')as f:os.fsync(f.fileno())
  with Image.open(target)as im:im.load()
  with Image.open(target)as im:im.verify()
  originalBytes[target]=target.read_bytes();expected=x.get('sha256',x.get('renderSHA256'));rows.append({'path':x['path'],'sha256':sha(target),'expectedSHA256':expected,'matchesFrozenPNG':sha(target)==expected})
  print(target.name,flush=True)
 # second read after all subprocesses have exited proves no retained render process changed a previous file
 for x in rows:
  t=out/x['path']
  try:
   with Image.open(t)as im:im.load()
   with Image.open(t)as im:im.verify()
  except Exception as err:
   x['firstFinalIOReadbackIssue']=str(err);x['republishedSameOriginalBytesAfterIOReadbackFailure']=True;t.write_bytes(originalBytes[t])
   with t.open('rb')as fd:os.fsync(fd.fileno())
   with Image.open(t)as im:im.load()
   with Image.open(t)as im:im.verify()
  x['finalReadbackSHA256']=sha(t);x['finalReadbackMatches']=sha(t)==x['expectedSHA256']
 receipt={'sourcePDFSHA256':PS,'authorReproducibilityOnly':True,'independentVisualAcceptancePerformed':False,'images':rows,'allPNGBytesMatch':all(x['matchesFrozenPNG']and x['finalReadbackMatches']for x in rows)};(out/'rerender-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'images':len(rows),'allPNGBytesMatch':receipt['allPNGBytesMatch']}));return 0 if receipt['allPNGBytesMatch']else 1
if __name__=='__main__':raise SystemExit(main())
