#!/usr/bin/env python3
import sys,pathlib,json,hashlib,time
from PIL import Image
L=int(sys.argv[1]);nums=[int(x) for x in sys.argv[2:]]
Q=pathlib.Path('/workspace/scratch/28b55072841a/hsk-hub-resume-recovered/course-app/docs/recovery-20261005/qa-official-vi')/f'hsk2-l{L:02d}'
M=json.loads((Q/'render-manifest.json').read_text());out=[]
for n in nums:
 r=next(x for x in M['records'] if x['pdfPage']==n);p=Q/r['file']
 sha=hashlib.sha256(p.read_bytes()).hexdigest();ok=sha==r['sha256'] and p.stat().st_size==r['bytes']
 try:
  with Image.open(p) as im:im.load()
  with Image.open(p) as im:im.verify()
 except Exception as e:ok=False;error=repr(e)
 assert ok,f'Current raster changed or corrupt: {p}'
 out.append({'pdfPage':n,'sha256':sha,'bytes':p.stat().st_size,'fullDecodeAndVerify':True,'matchesManifest':True,'visualReadNotImplied':True})
folder=Q/'pre-view-checks';folder.mkdir(exist_ok=True)
name=f'{time.time_ns()}.json';(folder/name).write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checkedPages':nums,'passed':True,'receipt':name}))
