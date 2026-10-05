import pathlib,json,hashlib,tempfile,sys,datetime
import fitz
from PIL import Image
REPO=pathlib.Path(__file__).resolve().parents[5]
B=pathlib.Path(__file__).resolve().parent
A=REPO/'course-app/docs/recovery-20261005/official-vi-source/hsk2-l07'
PDF=REPO.parent/'upload/HSK2 ( 3.0).pdf'
H=lambda raw:hashlib.sha256(raw).hexdigest()
read=lambda p:json.loads(p.read_text())
checks=[]
def ck(name,ok,detail=None):
 checks.append({'check':name,'passed':bool(ok),'detail':detail})
def filecheck(p,row,name):
 raw=p.read_bytes();ck(name,len(raw)==row['bytes'] and H(raw)==row['sha256'])
def decode(p):
 im=Image.open(p);im.load();size=list(im.size);Image.open(p).verify();return size
s=read(A/'source-transcription.json');journal=read(B/'independent-read-journal.json');repair=read(B/'repair-list.json');f=read(A/'FREEZE.json')
ck('actual original PDF identity',H(PDF.read_bytes())==s['officialPDFSHA256'] and PDF.stat().st_size==69855983)
ck('exact frozen author source',H((A/'source-transcription.json').read_bytes())==repair['sourceSHA256'])
ck('exact frozen author FREEZE',H((A/'FREEZE.json').read_bytes())==repair['authorFreezeSHA256'])
for r in f['files']:filecheck(A/r['file'],r,'author freeze '+r['file'])
for p in (B/'author-input').iterdir():ck('archived author input '+p.name,p.read_bytes()==(A/p.name).read_bytes())
ck('actual fresh 8 source pages and 2 boundaries read',journal['fullPDFPagesActuallyRead']==list(range(70,78)) and {x['pdfPage'] for x in journal['actuallyReadBoundaries']}=={69,78})
ck('91 unique source records',len(s['records'])==91 and len({r['sourceId'] for r in s['records']})==91)
ck('exact four original-page transcription repairs',[(x['recordIndex'],x['sourceId']) for x in repair['repairs']]==[(i,s['records'][i]['sourceId']) for i in [59,61,77,78]])
rep={x['sourceId']:x for x in repair['repairs']}
for i,r in enumerate(s['records']):
 vi=r['viPrinted'];zh=r['zhAnchor'];e=r['literalEvidence']
 ck('literal integrity '+r['sourceId'],e=={'viCodePoints':len(vi),'viUTF16Units':len(vi.encode('utf-16-le'))//2,'viUTF8SHA256':H(vi.encode()),'zhCodePoints':len(zh),'zhUTF8SHA256':H(zh.encode()),'normalizationPerformed':False})
 ck('VI fragment join '+r['sourceId'],''.join(x['text']+x.get('joinerAfter','') for x in r['fragments'])==vi)
 ck('ZH fragment join '+r['sourceId'],''.join(x['text']+x.get('joinerAfter','') for x in r['zhFragments'])==zh)
 actual=sorted({x['pdfPage'] for x in r['fragments']+r['zhFragments']})
 ck('actual cross-language physical anchors '+r['sourceId'],actual==r['pdfPages'] and [n-14 for n in actual]==r['printedPages'] and all(70<=n<=77 for n in actual))
 if r['sourceId'] in rep:ck('known original-page mismatch '+r['sourceId'],vi==rep[r['sourceId']]['oldValue'] and vi!=rep[r['sourceId']]['correctOriginalPrintedValue'])
words=[r for r in s['records'] if r['category']=='word']
ck('all 15 original word/POS/PY tuples independently read',[(r['zhAnchor'],r['viPrinted'],r['printedPOSRaw'],r['printedPinyin']) for r in words]==[tuple(x) for x in journal['independentWordReadings']])
for note in journal['notes']:
 for text in [1,2,3]:
  if f'text{text}VI' not in note:continue
  roles=[r for r in s['records'] if r['category']=='dialogue' and r['sourceText']==text]
  ck('actual complete text '+str(text)+' roles and order',len(roles)==len(note[f'text{text}VI']) and [r['sourceOrdinal'] for r in roles]==list(range(1,len(roles)+1)) and [r['printedRoleVI'] for r in roles]==note[f'text{text}RolesVI'] and [r['printedRoleZh'] for r in roles]==note.get(f'bodyText{text}RolesZH',note.get('bodyRolesZH')))
  ck('actual complete text '+str(text)+' independent VI utterances',[rep.get(r['sourceId'],{}).get('correctOriginalPrintedValue',r['viPrinted']) for r in roles]==note[f'text{text}VI'])
diary=next(r for r in s['records'] if r['category']=='diary');n=next(n for n in journal['notes'] if n['pdfPage']==76)
ck('whole unlabelled diary, no invented role',diary['viPrinted']==n['wholeUnlabelledDiaryVI'] and diary['zhAnchor']==n['wholeDiaryZH'] and diary['printedRoleVI'] is None and diary['printedRoleZh'] is None and diary['rolePrinted'] is False)
ck('grammar cross-page ZH73 to VI74',s['records'][78]['pdfPages']==[73,74] and s['records'][78]['fragments'][0]['pdfPage']==74 and s['records'][78]['zhFragments'][0]['pdfPage']==73)
for name,key in [('render-manifest.json','renders'),('detail-render-manifest.json','details')]:
 for r in read(B/name)[key]:
  p=B/r['path'];filecheck(p,r,'independent PNG exact '+r['path']);ck('independent PNG full load+verify '+r['path'],bool(decode(p)))
  receipts=[p for p in (B/'pre-view-checks').glob('*.json') if r['sha256'] in p.read_text()]
  ck('actual pre-view guard receipt '+r['path'],len(receipts)>0)
rm=read(A/'render-manifest.json');rerenders=[]
with tempfile.TemporaryDirectory(prefix='hsk2-l07-original-exact-') as td:
 doc=fitz.open(PDF)
 for r in rm['records']:
  out=pathlib.Path(td)/pathlib.Path(r['file']).name
  doc[r['pdfPage']-1].get_pixmap(matrix=fitz.Matrix(*rm['matrix'])).save(out)
  raw=out.read_bytes();size=decode(out);ok=H(raw)==r['sha256'] and len(raw)==r['bytes'];ck('actual original PDF same-recipe author rerender '+r['file'],ok)
  rerenders.append({'pdfPage':r['pdfPage'],'authorFile':r['file'],'bytes':len(raw),'sha256':H(raw),'expectedBytes':r['bytes'],'expectedSHA256':r['sha256'],'fullLoadAndVerify':True,'imageSize':size,'exact':ok})
result={'schemaVersion':1,'reviewer':'release_assembly','sourceAuthor':'remaining_media_audit','sourceSHA256':H((A/'source-transcription.json').read_bytes()),'originalPDFSHA256':H(PDF.read_bytes()),'runAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checks':checks,'checkCount':len(checks),'passed':all(x['passed'] for x in checks),'failed':[x for x in checks if not x['passed']],'sameRecipeActualRerenders':rerenders,'qualification':'Integrity guards support fresh actual independent page reading; they do not replace it or accept website translations.'}
(B/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'checkCount':len(checks),'passed':result['passed'],'failed':result['failed'],'originalActualAuthorPNGExact':sum(x['exact'] for x in rerenders)},ensure_ascii=False));sys.exit(0 if result['passed'] else 1)
