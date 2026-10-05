#!/usr/bin/env python3
"""Bounded independent V2 review after original full-page review and fresh POS visual read."""
from pathlib import Path
import json,hashlib,shutil
from PIL import Image
B=Path('/workspace/scratch/28b55072841a/hsk-hub-resume-recovered/course-app/docs/recovery-20261005')
A=B/'official-vi-source/hsk2-l09';V=A/'source-correction-v2';P=B/'qa-official-vi/hsk2-l09';Q=B/'qa-official-vi/hsk2-l09-v2'
Q.mkdir(exist_ok=True);assert not (Q/'FREEZE.json').exists()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
vs=lambda v:hashlib.sha256(json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def out(n,v): (Q/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def diff(a,b,path=''):
    if type(a)!=type(b):return [{'pointer':path,'old':a,'new':b}]
    if isinstance(a,dict):
        result=[]
        for k in sorted(a.keys()|b.keys()):
            pp=path+'/'+str(k).replace('~','~0').replace('/','~1')
            if k not in a:result.append({'pointer':pp,'oldMissing':True,'new':b[k]})
            elif k not in b:result.append({'pointer':pp,'old':a[k],'newMissing':True})
            else:result+=diff(a[k],b[k],pp)
        return result
    if isinstance(a,list):
        assert len(a)==len(b), path
        return sum((diff(x,y,path+'/'+str(i)) for i,(x,y) in enumerate(zip(a,b))),[])
    return [] if a==b else [{'pointer':path,'old':a,'new':b}]
assert sha(V/'source-transcription.json')=='7a938c2c334160691650b75ad74eaeda563994d7e07c83bc2a693c2ef1895aa3'
assert sha(P/'review.json')=='7e417af758dd9c0a44c313e5533f45eb10e088fd14cd70362c195f3f773f3aeb'
assert sha(P/'FREEZE.json')=='f2d6fb4fd0fdc1014564e6543d084a35571dc34f2e9510bb4f27a9371792556e'
pins=[]
for folder in [A,V,P]:
    for r in json.loads((folder/'FREEZE.json').read_text())['files']:
        p=folder/r['file'];assert sha(p)==r['sha256'] and p.stat().st_size==r['bytes']
        if p.suffix=='.png':
            with Image.open(p) as im:im.load()
            with Image.open(p) as im:im.verify()
        pins.append({'file':str(p.relative_to(B)),'sha256':sha(p),'bytes':p.stat().st_size,'matchesFrozenSHA':True,'fullPNGDecode':True if p.suffix=='.png' else None})
old=json.loads((P/'author-source-transcription.json').read_text());new=json.loads((V/'source-transcription.json').read_text())
full=diff(old,new);recorddiff=diff(old['records'],new['records'],'/records')
sid='hsk2-official-vi:l09:p074:word04';i=next(i for i,r in enumerate(old['records']) if r['sourceId']==sid)
assert recorddiff==[{'pointer':f'/records/{i}/printedPOSRaw','old':'dt.','new':'đt.'}]
assert [r['sourceId'] for r in old['records']]==[r['sourceId'] for r in new['records']] and len(new['records'])==124
assert {x['pointer'].split('/')[1] for x in full}=={'records','sourceRevision','correctionOfSourceSHA256','correctionQualification','independentRepairInput'}
assert new['correctionOfSourceSHA256']==sha(P/'author-source-transcription.json')
assert new['independentRepairInput']['sha256']==sha(P/'repair-list.json')
assert new['independentRepairInput']['file']=='course-app/docs/recovery-20261005/qa-official-vi/hsk2-l09/repair-list.json'
assert new['correctionQualification']=='source author correction awaiting a different reviewer to accept corrected actual bytes; no automatic website replacement'
assert new['records'][i]['printedPOSRaw']=='đt.'
out('exact-diff.json',{'allJSONLeafDiffs':full,'recordLeafDiffs':recorddiff,'unchangedRecords':123,'recordOrderAndIDsUnchanged':True,'allOtherCandidateFieldsUnchanged':True,'nonRecordDiffsOnlyFourExplicitRevisionAndProvenanceKeys':True})
for src,name in [(V/'source-transcription.json','author-v2-source-transcription.json'),(V/'FREEZE.json','author-v2-FREEZE.json'),(V/'STAGE-FILES.txt','author-v2-STAGE-FILES.txt'),(P/'review.json','prior-full-manual-review.json'),(P/'FREEZE.json','prior-review-FREEZE.json'),(P/'repair-list.json','prior-repair-list.json'),(P/'details/pdf088-words4-7-pos.png','pdf088-words4-7-pos.png'),(P/'details/pdf088-words4-7-pos.json','pdf088-words4-7-pos-receipt.json')]:shutil.copyfile(src,Q/name)
out('actual-final-integrity.json',{'qualification':'actual-readback-and-complete-PNG-decode-not-manual-language-review-substitute','pins':pins,'freshOriginalPOSCropViewedAgain':True,'freshOriginalPOSCropSHA256':sha(Q/'pdf088-words4-7-pos.png'),'oldInputsNotModified':True})
decisions=[]
for r in new['records']:
    decisions.append({'sourceId':r['sourceId'],'recordSHA256':vs(r),'decision':'accepted-source-fidelity-only','pdfPagesReviewed':r['pdfPages'],'basis':'fresh-five-times-original-PDF-POS-visual-read-plus-exact-all-other-field-equality' if r['sourceId']==sid else 'prior-full-original-page-manual-review-exact-record-equality','priorFullManualReviewSHA256':sha(P/'review.json'),'allOtherRawFieldsExactlyUnchanged':True})
out('review.json',{'reviewer':'/root/qa_hsk1_05_08','author':'/root/remaining_media_audit','differentAuthorAndReviewer':True,'decision':'accepted-source-fidelity-only','officialPDFSHA256':new['officialPDFSHA256'],'inputSourceSHA256':sha(V/'source-transcription.json'),'inputAuthorFREEZESHA256':sha(V/'FREEZE.json'),'inputAuthorSTAGESHA256':sha(V/'STAGE-FILES.txt'),'priorFullOriginalPageReviewSHA256':sha(P/'review.json'),'priorReviewAcceptedCount':123,'freshRepairVisuallyAcceptedCount':1,'acceptedSourceCount':124,'acceptedSourceIds':[r['sourceId'] for r in new['records']],'repairCount':0,'heldCount':0,'missingCount':0,'full124RecordProjectionCompared':True,'onlyChangedRecordField':recorddiff,'allPrior13FullPageAndDetailRastersFullDecodedBeforeFreeze':True,'perSourceDecisions':decisions,'websiteComparisonPerformed':False,'semanticErrataAccepted':False,'sharedAppendixAcceptedHere':False,'productionChanges':0,'oldLostAcceptedReportsReused':False})
(Q/'README.md').write_text('# HSK2 L9 V2 独立修复确认\n\n原V1全13页/124ID人工审查保留：123忠实接受、1词性修复。现另冻结V2，不覆盖旧结论。实际再次view原PDF五倍图确认这样为đt.；比较全部124完整record只有这一叶dt.→đt.，123record深等，修复record其他叶深等，原ID/顺序/中文/拼音/越文/角色/页绑定/物理片段均相同。顶层另有四项明确修订/来源metadata：sourceRevision、correctionOfSourceSHA256、correctionQualification、independentRepairInput，实际逐一核其旧SHA和冻结repair-list绑定，没有其他变化。明确当前V2全124来源忠实接受，0repair/hold/missing，不能将此次一叶复核冒称又重复全页视觉。原13全页+crop全部冻结SHA/实际decode复验，authorV1/V2所有冻结bytes保持。0网站/语义erratum/共享附录批准，0production/Git变更。\n')
shutil.copyfile(Path(__file__),Q/'review-correction.py')
rel=str(Q.relative_to(B.parent.parent.parent))
files=sorted([str(p.relative_to(Q)) for p in Q.rglob('*') if p.is_file()]+['FREEZE.json','STAGE-FILES.txt'])
assert len(files)==len(set(files))
(Q/'STAGE-FILES.txt').write_text(''.join(rel+'/'+n+'\n' for n in files))
out('FREEZE.json',{'qualification':'independent-one-leaf-visual-repair-and-full124-exact-projection-linked-to-prior-full-page-review','inputSourceSHA256':sha(V/'source-transcription.json'),'reviewSHA256':sha(Q/'review.json'),'acceptedSourceCount':124,'files':[{'file':n,'bytes':(Q/n).stat().st_size,'sha256':sha(Q/n)} for n in files if n!='FREEZE.json']})
print(json.dumps({'reviewSHA256':sha(Q/'review.json'),'FREEZESHA256':sha(Q/'FREEZE.json'),'STAGESHA256':sha(Q/'STAGE-FILES.txt'),'stageFiles':len(files),'stageBytes':sum((Q/n).stat().st_size for n in files),'stagePrefix':rel}))
