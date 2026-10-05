"""Verify isolated author corrections against root's actual original-page findings."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[5]
OUT=Path(__file__).resolve().parent
AUTHOR=ROOT/'course-app/docs/recovery-20261005/official-vi-source/hsk1-l12'
sha=lambda b:hashlib.sha256(b).hexdigest()
old=json.loads((AUTHOR/'source.json').read_bytes())
v2=json.loads((AUTHOR/'source.author-v2.json').read_bytes())
v3bytes=(AUTHOR/'source.author-v3.json').read_bytes();v3=json.loads(v3bytes)
assert sha(v3bytes)=='f56162bb2f62af6593a57af97e6f8d33ff2f5ef494a24ba6ff86e0861a326f64'
def diff(a,b,p=''):
    if isinstance(a,dict) and isinstance(b,dict):
        return [d for k in sorted(a.keys()|b.keys()) for d in
                (diff(a[k],b[k],p+'/'+k) if k in a and k in b else [(p+'/'+k,a.get(k),b.get(k))])]
    if isinstance(a,list) and isinstance(b,list):
        assert len(a)==len(b)
        return [d for i,(x,y) in enumerate(zip(a,b)) for d in diff(x,y,p+'/'+str(i))]
    return [] if a==b else [(p,a,b)]
d2=diff(old,v2);d3=diff(v2,v3)
assert d2==[('/appendixRelevantIndexRows/15/pinyinPrinted','xiàyǔ','xià yǔ')]
assert {d[0] for d in d3}=={'/occurrences/141/viText','/occurrences/141/fragments/0/lineJoiner','/textPolicy/viText'}
x=v3['occurrences'][141]
assert x['occurrenceId']=='hsk1-official-vi-l12-pdf110-summary-item-12'
assert x['viText']=='Miêu tả ngắn gọn tình trạng bệnh tật, ví dụ: 我病了，觉得很冷。'
assert x['fragments'][0]['lineTexts']==old['occurrences'][141]['fragments'][0]['lineTexts']
assert x['fragments'][0]['lineJoiner']==''
assert v3['appendixRelevantIndexRows'][15]['pinyinPrinted']=='xià yǔ'
verified=[]
for name,expected in [('FREEZE-V2.json','3ff1d5c1cdec451424c75e0e1ff4a402632a01b5ba9b798e0d3066a20b3020ae'),
                      ('FREEZE-V3.json','25188516bd1ad750c92d5877ddb14891c803a04b4717c12be8abe3ae37f44396')]:
    fbytes=(AUTHOR/name).read_bytes();assert sha(fbytes)==expected
    rows=json.loads(fbytes)['files']+[{'file':name,'bytes':len(fbytes),'sha256':expected}]
    for r in rows:
        p=AUTHOR/r['file'];b=p.read_bytes();assert len(b)==r['bytes'] and sha(b)==r['sha256']
        dest=OUT/'author-input'/p.name
        if dest.exists():assert dest.read_bytes()==b
        else:dest.write_bytes(b)
        verified.append({'file':str(p.relative_to(ROOT)),'bytes':len(b),'sha256':sha(b)})
prior=ROOT/'course-app/docs/recovery-20261005/qa-official-vi/hsk1-l11'
prior_review=json.loads((prior/'review.json').read_bytes())
assert v3['appendixOccurrences']==json.loads((prior/'author-input/source.json').read_bytes())['appendixOccurrences']
for page in [102,*range(138,146)]:
    assert (OUT/f'renders/pdf-{page:03}-independent.png').read_bytes()==(prior/f'renders/pdf-{page:03}-independent.png').read_bytes()
draft=json.loads((OUT/'manual-observations-before-v3.json').read_bytes())
observations={p:{'pdfPage':int(p),'printedPage':f'{int(p)-16:03}',
    'actuallyViewedWholePage':True,'observation':note,
    'scope':'body' if 102<=int(p)<=110 else 'boundary-only'}
    for p,note in draft['pageObservations'].items() if p!='138-145'}
observations['110']['observation'] += ' Exact V3 was subsequently independently checked: empty Chinese lineJoiner and original two physical lineTexts retained, with complete contiguous 觉得很冷。.'
for page in range(138,146):
    original=prior_review['pageObservations'][str(page)]
    observations[str(page)]={**original,'originalManualReadingReuse':'hsk1-l11 root review; whole original page actually viewed there, with exact source/raster equality now verified',
        'observation':original['observation']+' L12 relevant index rows checked against that original page; *药 context and 下雨 xià yǔ space retained where applicable.'}
notes={'schemaVersion':3,'lesson':12,'reviewer':'/root','status':'all-source-records-manually-reviewed',
    'selectedSource':'author-input/source.author-v3.json','selectedSourceSHA256':sha(v3bytes),
    'selectedAuthorRevision':'V3 preserving V1 and V2, with exact separately reviewed corrections',
    'bodyOccurrenceCount':144,'wordRows':24,'uniqueWordHeadwords':23,'printedPOS':23,
    'dialogueTurnsByText':{'1':4,'2':4,'3':6},'pageObservations':observations,
    'verifiedAdditionalAuthorFiles':verified,
    'resolvedAuthorTranscriptionRepairs':[
      {'scope':'appendix-index-pinyin','pointer':d2[0][0],'old':d2[0][1],'accepted':d2[0][2],
       'originalPDFPage':142,'status':'independently-verified-resolved'},
      {'occurrenceId':x['occurrenceId'],'scope':'mixed-Chinese-physical-line-join','originalPDFPage':110,
       'old':'觉得 很冷。','accepted':'觉得很冷。','originalPhysicalLinesUnchanged':True,
       'status':'independently-verified-resolved'}],
    'textbookSemanticObservations':[{'word':'天','observation':'Two different physical body rows retain dt./weather and lượng./day separately.'},
       {'word':'药','observation':'Body107 unstarred, appendix143 starred; actual contexts kept separate.'}]}
dest=OUT/'manual-notes.json';assert not dest.exists()
dest.write_bytes((json.dumps(notes,ensure_ascii=False,indent=2)+'\n').encode())
dest=OUT/'correction-validation.json';assert not dest.exists()
dest.write_bytes((json.dumps({'status':'passed','V1ToV2ExactDiff':d2,'V2ToV3ExactDiff':d3,
    'selectedSourceSHA256':sha(v3bytes),'additionalFrozenAuthorFilesVerified':verified,
    'originalPhysicalFragmentsRetained':True,'manualOriginalPagesAlreadyReadSeparately':True},ensure_ascii=False,indent=2)+'\n').encode())
print(json.dumps({'selectedSourceSHA256':sha(v3bytes),'verifiedAdditionalFiles':len(verified),'V1ToV2Leaves':len(d2),'V2ToV3Leaves':len(d3),'manualNotesReady':True}))
