#!/usr/bin/env python3
from pathlib import Path
import json,hashlib,datetime,sys
from PIL import Image
B=Path(sys.argv[1]).resolve();page=int(sys.argv[2]);M=B/'render-manifest.json';m=json.loads(M.read_text());r=next(x for x in m['renders'] if x['pdfPage']==page);p=B/r['path'];sh=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();assert p.stat().st_size==r['bytes'] and sh(p)==r['sha256']
with Image.open(p) as im:im.load()
with Image.open(p) as im:im.verify()
e=B/'pre-view-checks';e.mkdir(exist_ok=True);i=1
while (e/f'pdf{page:03}-{i:02}.json').exists():i+=1
v={'schemaVersion':1,'checkedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'png':r['path'],'bytes':p.stat().st_size,'sha256':sh(p),'manifestSHA256':sh(M),'fullPILLoad':'passed','PILVerify':'passed','actualBeforeViewByteGuard':True,'visualAcceptanceGrantedByTool':False};(e/f'pdf{page:03}-{i:02}.json').write_text(json.dumps(v,indent=2)+'\n');print(json.dumps(v))
