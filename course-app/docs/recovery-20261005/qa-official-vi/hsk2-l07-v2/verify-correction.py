import pathlib,json,hashlib,sys,copy
from PIL import Image
R=pathlib.Path(__file__).resolve().parents[5];B=pathlib.Path(__file__).resolve().parent;Q=B.parent/'hsk2-l07';A=R/'course-app/docs/recovery-20261005/official-vi-source/hsk2-l07';V=A/'source-correction-v2'
H=lambda raw:hashlib.sha256(raw).hexdigest();J=lambda p:json.loads(p.read_text());checks=[]
def ck(name,ok):checks.append({'check':name,'passed':bool(ok)})
def freezecheck(b):
 for row in J(b/'FREEZE.json')['files']:
  p=R/row['file'] if row['file'].startswith('course-app/') else b/row['file'];raw=p.read_bytes();ck('frozen byte identity '+str(p.relative_to(R)),len(raw)==row['bytes'] and H(raw)==row['sha256'])
  if p.suffix=='.png':Image.open(p).load();Image.open(p).verify();ck('frozen complete PNG decode '+str(p.relative_to(R)),True)
freezecheck(A);freezecheck(V);freezecheck(Q)
old=J(A/'source-transcription.json');new=J(V/'source-transcription.json');rep=J(Q/'repair-list.json');d=[]
def diff(a,b,p=''):
 if type(a)!=type(b):d.append({'pointer':p,'old':a,'new':b});return
 if isinstance(a,dict):
  for k in sorted(set(a)|set(b)):
   if k not in a or k not in b:d.append({'pointer':p+'/'+k,'old':a.get(k),'new':b.get(k)})
   else:diff(a[k],b[k],p+'/'+k)
 elif isinstance(a,list):
  if len(a)!=len(b):d.append({'pointer':p,'old':a,'new':b})
  else:
   for i,(x,y) in enumerate(zip(a,b)):diff(x,y,p+'/'+str(i))
 elif a!=b:d.append({'pointer':p,'old':a,'new':b})
diff(old,new)
expected=copy.deepcopy(old)
for x in rep['repairs']:
 r=expected['records'][x['recordIndex']];vi=x['correctOriginalPrintedValue'];r['viPrinted']=vi;r['fragments'][0]['text']=vi;e=r['literalEvidence'];e['viCodePoints']=len(vi);e['viUTF16Units']=len(vi.encode('utf-16-le'))//2;e['viUTF8SHA256']=H(vi.encode())
for k in ['sourceRevision','correctionOfSourceSHA256','correctionQualification','independentRepairInput']:expected[k]=new.get(k)
ck('exact four repaired records, their VI fragments and Unicode metadata only',expected==new)
ck('explicit source V1 provenance',new['correctionOfSourceSHA256']==H((A/'source-transcription.json').read_bytes()))
ck('explicit independent repair input identity',new['independentRepairInput']=={'file':str((Q/'repair-list.json').relative_to(R)),'sha256':H((Q/'repair-list.json').read_bytes()),'reviewer':'release_assembly'})
ck('author remains distinct and awaiting independent review',new['author']=='remaining_media_audit' and 'awaiting' in new['correctionQualification'])
ck('91 records unchanged identities/order',len(new['records'])==91 and [r['sourceId'] for r in old['records']]==[r['sourceId'] for r in new['records']])
for i,r in enumerate(new['records']):
 ck('all raw ZH/PY/POS/roles/physical scope unchanged '+r['sourceId'],{k:v for k,v in r.items() if k not in ['viPrinted','fragments','literalEvidence']}=={k:v for k,v in old['records'][i].items() if k not in ['viPrinted','fragments','literalEvidence']})
 if i not in [59,61,77,78]:ck('unrepaired complete record exact '+r['sourceId'],old['records'][i]==r)
 vi=r['viPrinted'];zh=r['zhAnchor'];e=r['literalEvidence'];ck('all actual literal metadata '+r['sourceId'],e=={'viCodePoints':len(vi),'viUTF16Units':len(vi.encode('utf-16-le'))//2,'viUTF8SHA256':H(vi.encode()),'zhCodePoints':len(zh),'zhUTF8SHA256':H(zh.encode()),'normalizationPerformed':False})
 ck('complete fragment text '+r['sourceId'],''.join(x['text']+x.get('joinerAfter','') for x in r['fragments'])==vi)
for x in rep['repairs']:ck('actual fresh original detail repaired text '+x['sourceId'],new['records'][x['recordIndex']]['viPrinted']==x['correctOriginalPrintedValue'])
result={'schemaVersion':1,'reviewer':'release_assembly','sourceAuthor':'remaining_media_audit','sourceSHA256':H((V/'source-transcription.json').read_bytes()),'authorV2FreezeSHA256':H((V/'FREEZE.json').read_bytes()),'freshPageEvidenceParentReviewSHA256':H((Q/'review.json').read_bytes()),'freshPageEvidenceParentFreezeSHA256':H((Q/'FREEZE.json').read_bytes()),'actualDiffCount':len(d),'diff':d,'checks':checks,'checkCount':len(checks),'passed':all(x['passed'] for x in checks),'failed':[x for x in checks if not x['passed']],'qualification':'All full original pages and four relevant details already independently read in recovered V1 evidence, and corrected strings/details actually reread; not lost-source acceptance or website proof.'}
(B/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'passed':result['passed'],'checkCount':len(checks),'actualDiffCount':len(d),'failed':result['failed']}));sys.exit(0 if result['passed'] else 1)
