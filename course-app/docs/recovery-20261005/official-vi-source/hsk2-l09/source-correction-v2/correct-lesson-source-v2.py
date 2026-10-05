#!/usr/bin/env python3
"""Apply a pinned independent source-fidelity repair list; never touches original pack."""
import argparse,copy,hashlib,json,pathlib,shutil
cli=argparse.ArgumentParser();cli.add_argument('--repo',type=pathlib.Path,required=True);cli.add_argument('--lesson',type=int,required=True);cli.add_argument('--repair-input',required=True);cli.add_argument('--repair-sha',required=True);args=cli.parse_args()
REPO=args.repo;old=REPO/f'course-app/docs/recovery-20261005/official-vi-source/hsk2-l{args.lesson:02d}';out=old/'source-correction-v2'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(name,v):(out/name).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
pin=REPO/args.repair_input;assert sha(pin)==args.repair_sha
review=json.loads(pin.read_text());a=json.loads((old/'source-transcription.json').read_text());frozen=json.loads((old/'FREEZE.json').read_text())
if 'repairList' in review:
 # Reviewer L9 schema pins source SHA and evidence; derive the current immutable V1 freeze separately.
 original_review=review
 repairs=[]
 for item in original_review['repairList']:
  ids=[i for i,r in enumerate(a['records']) if r['sourceId']==item['sourceId']];assert len(ids)==1
  repairs.append({'sourceId':item['sourceId'],'recordIndex':ids[0],'field':item['field'],'oldValue':item['actualCandidate'],'correctOriginalPrintedPOSRaw':item['requiredPrintedValue'],'sourcePDFPage':item['pdfPage'],'sourcePrintedPage':item['printedPage'],'evidenceFile':str((pin.parent/item['detailPNG']).relative_to(REPO)),'evidenceSHA256':item['detailPNGSHA256']})
 review={'sourceSHA256':original_review['inputSourceSHA256'],'authorFreezeSHA256':sha(old/'FREEZE.json'),'reviewer':'qa_hsk1_05_08','repairs':repairs}
assert sha(old/'source-transcription.json')==review['sourceSHA256']==frozen['sourceSHA256'];assert sha(old/'FREEZE.json')==review['authorFreezeSHA256']
for f in frozen['files']:assert sha(old/f['file'])==f['sha256'] and (old/f['file']).stat().st_size==f['bytes']
assert not (out/'FREEZE.json').exists();out.mkdir(exist_ok=True)
b=copy.deepcopy(a);b['sourceRevision']='20261005-fresh-recovery-v2-author-correction-from-independent-source-fidelity-review';b['correctionOfSourceSHA256']=sha(old/'source-transcription.json');b['correctionQualification']='source author correction awaiting a different reviewer to accept corrected actual bytes; no automatic website replacement';b['independentRepairInput']={'file':args.repair_input,'sha256':args.repair_sha,'reviewer':review['reviewer']}
repairs=[]
for item in review['repairs']:
 i=item['recordIndex'];r=b['records'][i];before=copy.deepcopy(r);assert r['sourceId']==item['sourceId']
 assert sha(REPO/item['evidenceFile'])==item['evidenceSHA256']
 if 'correctOriginalPrintedValue' in item:
  assert r['viPrinted']==item['oldValue'];r['viPrinted']=item['correctOriginalPrintedValue'];assert len(r['fragments'])==1
  r['fragments'][0]['text']=r['viPrinted'];r['literalEvidence']['viCodePoints']=len(r['viPrinted']);r['literalEvidence']['viUTF16Units']=len(r['viPrinted'].encode('utf-16-le'))//2;r['literalEvidence']['viUTF8SHA256']=hashlib.sha256(r['viPrinted'].encode()).hexdigest()
  guard=copy.deepcopy(r);guard['viPrinted']=before['viPrinted'];guard['fragments'][0]['text']=before['fragments'][0]['text'];guard['literalEvidence']=before['literalEvidence'];assert guard==before
 elif item.get('field')=='printedPOSRaw':
  assert r['printedPOSRaw']==item['oldValue'];r['printedPOSRaw']=item['correctOriginalPrintedPOSRaw'];guard=copy.deepcopy(r);guard['printedPOSRaw']=before['printedPOSRaw'];assert guard==before
 else:raise ValueError('Unrecognized bounded repair schema')
 repairs.append({'sourceId':r['sourceId'],'recordIndex':i,'oldRecord':before,'newRecord':copy.deepcopy(r),'classification':'author-transcription-repair-from-pinned-independent-original-PDF-review-not-semantic-book-erratum','evidenceFile':item['evidenceFile'],'evidenceSHA256':item['evidenceSHA256'],'pdfPage':item['sourcePDFPage'],'printedPage':item['sourcePrintedPage']})
changed=[i for i,(x,y) in enumerate(zip(a['records'],b['records'])) if x!=y];assert changed==sorted(item['recordIndex'] for item in review['repairs'])
assert len(a['records'])==len(b['records']);unchanged=len(a['records'])-len(changed)
for r in b['records']:
 assert ''.join(x['text']+x.get('joinerAfter','') for x in r['fragments'])==r['viPrinted'];assert r['literalEvidence']['viUTF8SHA256']==hashlib.sha256(r['viPrinted'].encode()).hexdigest();assert r['literalEvidence']['viCodePoints']==len(r['viPrinted']);assert r['literalEvidence']['viUTF16Units']==len(r['viPrinted'].encode('utf-16-le'))//2
 assert r['officialPDFSHA256']==a['officialPDFSHA256']
save('source-transcription.json',b);shutil.copyfile(pin,out/'independent-repair-input.json')
save('repair.json',{'status':'author-only-correction-awaiting-independent-actual-v2-review','initialSourceSHA256':sha(old/'source-transcription.json'),'initialFreezeSHA256':sha(old/'FREEZE.json'),'correctedSourceSHA256':sha(out/'source-transcription.json'),'officialPDFSHA256':a['officialPDFSHA256'],'pinnedIndependentRepairInput':b['independentRepairInput'],'repairs':repairs,'unchangedRecordsDeepEqual':unchanged,'originalV1NotModified':True,'websiteReplacementAuthorized':False,'runtimeChanged':False})
save('author-verification.json',{'status':'bounded-author-structural-checks-not-independent-v2-acceptance','sourceItems':len(a['records']),'changedRecordIndices':changed,'unchangedRecordsDeepEqual':unchanged,'sourceIdsOrderAndZHAnchorsUnchanged':True,'allWholeVIFragmentsAndLiteralHashesVerified':len(a['records']),'allV1FreezeFilesActualHashAndBytesVerified':len(frozen['files']),'allEvidencePathsExistAndMatchActualSHA':len(repairs),'changedLeavesBoundedToIndependentRepairList':True,'acceptedSourceItems':0,'runtimeChanged':False})
(out/'README.md').write_text(f'HSK2 L{args.lesson} source correction v2. Exactly {len(changed)} records follow the pinned independent original-PDF fidelity repair list. All other {unchanged} records, source IDs/order, Chinese anchors and all original V1 frozen bytes remain equal. This author correction requires separate actual-v2 acceptance. A faithful unusual printed word is retained; source fidelity does not authorize website semantic replacements. Whole-page image evidence remains in immutable V1, enlarged detail evidence is pinned at the independent reviewer\'s repository-relative paths. No website VI was read, no runtime or trusted proof is changed.\n')
shutil.copyfile(pathlib.Path(__file__),out/'correct-lesson-source-v2.py')
files=sorted(p for p in out.rglob('*') if p.is_file() and p.name not in ['FREEZE.json','STAGE-FILES.txt']);stage=[str(p.relative_to(REPO)) for p in files]+[str((out/'FREEZE.json').relative_to(REPO)),str((out/'STAGE-FILES.txt').relative_to(REPO))];(out/'STAGE-FILES.txt').write_text('\n'.join(stage)+'\n');files.append(out/'STAGE-FILES.txt')
save('FREEZE.json',{'schemaVersion':1,'status':'author-only-correction-awaiting-independent-v2-review','sourceItems':len(a['records']),'changedRecords':len(changed),'sourceSHA256':sha(out/'source-transcription.json'),'initialSourceSHA256':sha(old/'source-transcription.json'),'initialFreezeSHA256':sha(old/'FREEZE.json'),'officialPDFSHA256':a['officialPDFSHA256'],'files':[{'file':str(p.relative_to(out)),'sha256':sha(p),'bytes':p.stat().st_size} for p in files],'sourceIndependentAccepted':False,'websiteComparisonPerformed':False,'runtimeChanged':False})
for f in frozen['files']:assert sha(old/f['file'])==f['sha256']
print(json.dumps({'directory':str(out.relative_to(REPO)),'sourceSHA256':sha(out/'source-transcription.json'),'freezeSHA256':sha(out/'FREEZE.json'),'stageSHA256':sha(out/'STAGE-FILES.txt'),'stagePaths':len(stage),'sourceItems':len(a['records']),'changedRecords':len(changed),'unchangedRecords':unchanged,'qualification':'author-only correction, pending different reviewer actual-v2 acceptance'},ensure_ascii=False))
