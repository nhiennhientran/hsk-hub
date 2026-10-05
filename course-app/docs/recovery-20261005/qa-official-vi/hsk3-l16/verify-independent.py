#!/usr/bin/env python3
"""Independent pinned byte/structure checks supporting a separate actual visual review."""
from pathlib import Path
import argparse,hashlib,json,collections
from PIL import Image
cli=argparse.ArgumentParser();cli.add_argument('--repo',type=Path,required=True);cli.add_argument('--pdf',type=Path,required=True);args=cli.parse_args()
repo=args.repo;qa=Path(__file__).resolve().parent;src=repo/'course-app/docs/recovery-20261005/official-vi-source/hsk3-l16-v2';v1=src.with_name('hsk3-l16')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text())
checks=[]
def c(label,value):
 checks.append({'check':label,'passed':bool(value)})
def canon(x):return hashlib.sha256(json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
ps='7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951';ss='60628d1641fdc944d7f5199f82e2fa2aa8a54b06e8b7d1b04b419f49e94d73ea';fs='9f3d73c2259f2bf7e6502fd5a93e3bcf2e5aeb1e75cf8e1ef62dd164c405b266';stage='7f32090ba0193928ec148b7b19e6c02d87d5ec46a30d94df468edd39c8164d81'
c('real-PDF-bytes-SHA',sha(args.pdf)==ps and args.pdf.stat().st_size==96266563)
c('candidate-source-SHA',sha(src/'source.json')==ss);c('candidate-freeze-SHA',sha(src/'freeze-manifest.json')==fs);c('candidate-stage-SHA',sha(src/'STAGE')==stage)
f=load(src/'freeze-manifest.json');s=load(src/'source.json');r=s['records'];ids=[x['sourceId'] for x in r];body=s['bodyChineseOnlyTexts']
c('manual-full-scope-literal-counts',len(r)==len(set(ids))==121 and collections.Counter(x['pdfPage'] for x in r)=={156:9,157:7,158:17,159:15,160:9,161:12,162:8,163:8,164:4,165:6,207:26})
c('actual-full-body-and-appendix-scope',s['scope']['actualBodyPDFPages']==[156,165] and s['scope']['actualAppendixPDFPages']==[207])
c('actual-next-body-boundary',s['scope']['nextLessonBoundary']['pdfPage']==166 and s['scope']['nextLessonBoundary']['printedChineseTitle']=='我要多向认真的人学习')
c('actual-next-appendix-boundary',s['scope']['nextAppendixLessonBoundary']['pdfPage']==208 and s['scope']['nextAppendixLessonBoundary']['printedLessonMarker']=='Bài 17')
inventory=f['artifacts'];c('exact-candidate-inventory-no-missing-extra',len(inventory)==49 and {x['path'] for x in inventory}=={str(p.relative_to(src)) for p in src.rglob('*') if p.is_file() and p.name!='freeze-manifest.json'})
for x in inventory:c('candidate-frozen-file:'+x['path'],sha(src/x['path'])==x['sha256'] and (src/x['path']).stat().st_size==x['bytes'])
st=(src/'STAGE').read_text().splitlines();c('exact-stage-50-unique-paths',len(st)==len(set(st))==50 and {str(repo/x) for x in st}=={str(p) for p in src.rglob('*') if p.is_file()})
pngs=[]
for p in sorted((src/'evidence').glob('*.png')):
 with Image.open(p) as im:im.load();dim=list(im.size)
 with Image.open(p) as im:im.verify()
 pngs.append({'file':str(p.relative_to(repo)),'sha256':sha(p),'bytes':p.stat().st_size,'dimensions':dim,'fullDecodeAndCRC':True})
c('all34actualPNG-fully-decoded',len(pngs)==34)
byid={x['sourceId']:x for x in r}
for x in r:
 c('ID-and-primary-source-page:'+x['sourceId'],x['pdfPage']==x['printedPage']+12 and x['sourceId']==f"hsk3-official-vi:l16:p{x['printedPage']:03d}:{x['section']}" and bool(x['viPrinted']) and f"original-full-pdf{x['pdfPage']:03d}" in x['evidence'])
 z=x['sourceFieldEvidence']['zhAnchor'];v=x['sourceFieldEvidence']['viPrinted'];c('exact-full-ZH-and-VI-page-pair:'+x['sourceId'],z['pdfPage']==x.get('zhAnchorPDFPage',x['pdfPage']) and z['printedPage']==z['pdfPage']-12 and v['pdfPages']==[x['pdfPage']] and v['printedPages']==[x['printedPage']])
words=[x for x in r if x.get('sourceWordKind')=='ordinary-numbered-word'];c('26actual-raw-word-rows',len(words)==26 and [x['printedNumber'] for x in words]==list(range(1,27)))
c('actual-rare-raw-PY-POS-fields',words[1]['printedPinyin']=='kě’ài' and words[10]['printedPinyin']=='dàxióng-māo' and words[22]['printedPOSRaw']=='sl.' and words[24]['printedPinyin']=='dàren' and words[25]['printedPinyin']=='xǐ’ài')
expectedroles={1:['刘小雪','服务员','刘小雪','服务员','刘小雪','服务员','刘小雪','王一雪'],2:['刘小明','王一雪','刘小明','王一雪','刘小明','王一雪','刘小明','王一雪','刘小雪'],3:['刘小雪','王一雪','刘小雪','王一雪','刘小雪','刘小明','刘小雪']}
for t,roles in expectedroles.items():
 bs=[x for x in body if x['printedTextNumber']==t];c('actual-Chinese-role-order:'+str(t),[x['printedRoleZh'] for x in bs]==roles and [x['printedDialogueOrdinal'] for x in bs]==list(range(1,len(roles)+1)))
for b in body:
 a=byid[b['appendixSourceIds'][0]];c('body-to-official-appendix-bijection:'+b['bodySourceId'],a['bodyChineseSourceRef']==b['bodySourceId'] and a['zhAnchor']==b['zhPrinted'] and a['zhAnchorPDFPage']==b['pdfPage'] and a.get('correspondingBodyRoleZh')==b['printedRoleZh'])
c('whole-unlabelled-diary-no-speaker-partition',len(body)==25 and [x['printedRoleZh'] for x in body if x['printedTextNumber']==4]==[None] and byid['hsk3-official-vi:l16:p195:appendix-text4-whole-paragraph']['printedSpeaker'] is None)
c('24printed-VI-role-labels',len([x for x in r if 'printedRoleVi' in x])==24)
c('no-fabricated-cross-page-VI-prose',not any('viPrintedFragments' in x for x in r))
c('source-only-no-OCR-website-runtime',all(s['boundaries'][k] is False for k in ['websiteVietnameseRead','websiteComparisonPerformed','websiteProposalPrepared','productionChanged','OCRUsed','PDFTextLayerUsedAsAuthority']))
a=load(v1/'source.json');b=json.loads(json.dumps(s));b['scope']['nextLessonBoundary']['printedChineseTitle']=a['scope']['nextLessonBoundary']['printedChineseTitle'];c('V2-exact-one-source-leaf-repair',a==b and a['records']==s['records'])
for p in (v1/'evidence').glob('*.png'):c('V1-V2-original-image-unchanged:'+p.name,sha(p)==sha(src/'evidence'/p.name))
out={'schemaVersion':1,'reviewer':'remaining_media_audit','sourceAuthor':'native_catalogue','inputSourceSHA256':ss,'inputFreezeSHA256':fs,'inputSTAGESHA256':stage,'officialPDFSHA256':ps,'checksTotal':len(checks),'checksPassed':sum(x['passed'] for x in checks),'issues':[x['check'] for x in checks if not x['passed']],'checks':checks,'actualAuthorPNGs':pngs,'qualification':'actual independent byte/structure checks; visual verdicts are separately recorded from actual original PDF reads, never inferred from these checks','websiteCompared':False,'runtimeChanged':False}
(qa/'independent-verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in out.items() if k not in ['checks','actualAuthorPNGs']},ensure_ascii=False));raise SystemExit(bool(out['issues']))
