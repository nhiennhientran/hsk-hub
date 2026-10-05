"""Correct only the reviewer's boundary note; never overwrite the earlier freeze."""
import hashlib,json
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'course-app/docs/recovery-20261005/qa-official-vi/hsk1-l10'
OUT=BASE/'boundary-observation-correction-v2';OUT.mkdir(exist_ok=False)
sha=lambda b:hashlib.sha256(b).hexdigest()
old=json.loads((BASE/'review.json').read_bytes())
new=json.loads((BASE/'review.json').read_bytes())
oldnote=next(x for x in old['pageObservations'] if x['pdfPage']==94)
row=next(x for x in new['pageObservations'] if x['pdfPage']==94)
row['observation']='Whole original boundary page actually viewed: Bài 11 / 我读大学呢 / Em đang học đại học starts the next lesson. The page is excluded from all121 accepted lesson10 source occurrences. Earlier reviewer note mistakenly named another lesson; this correction changes the boundary description only.'
assert new['decisions']==old['decisions'] and new['acceptedOccurrenceCount']==121
manifest=json.loads((BASE/'render-manifest.json').read_bytes())
png=next(x for x in manifest['pages'] if x['pdfPage']==94)
data=(BASE/png['file']).read_bytes();assert sha(data)==png['sha256'] and len(data)==png['bytes']
new['supersedesReviewSHA256']=sha((BASE/'review.json').read_bytes())
new['correctionRevision']=2
new['correctionCompletedAtUTC']=datetime.now(timezone.utc).isoformat()
def dump(name,obj):
    (OUT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
dump('review.json',new)
dump('correction.json',{'reason':'Reviewer boundary description copied from wrong lesson title; actual original PDF94 proves the next chapter title.',
     'classification':'review-metadata-correction','sourceTranscriptionChanged':False,
     'acceptedSourceOccurrencesChanged':False,'acceptedCount':121,
     'oldNote':oldnote,'correctedNote':row,'originalPDFSHA256':new['sourcePDFSHA256'],
     'boundaryPNG':png,'boundaryPNGPath':str((BASE/png['file']).relative_to(ROOT)),
     'originalReviewSHA256':sha((BASE/'review.json').read_bytes()),
     'originalFreezeSHA256':sha((BASE/'FREEZE.json').read_bytes()),
     'supersedesCapsuleId':'hsk1-l10-independent-source-review-20261005'})
dump('validation.json',{'status':'passed','originalSourceSHA256':new['sourceSHA256'],
     'unchangedAll121DecisionObjects':True,'singleBoundaryPageObservationReplaced':True,
     'correctedBoundaryTitleZH':'我读大学呢','correctedBoundaryTitleVI':'Em đang học đại học',
     'freshOriginalBoundaryRasterSHA256Verified':True,'oldFrozenArtifactsOverwritten':False,
     'websiteVerificationComplete':False,'productionDeployment':False})
# Preserve and synchronize the earlier package together with this superseding
# review so a future recovery can reproduce why the correction was necessary.
original_stage=json.loads((BASE/'STAGE.json').read_bytes())
files=original_stage['files']+[{'file':str((BASE/'STAGE.json').relative_to(ROOT)),
     'bytes':(BASE/'STAGE.json').stat().st_size,'sha256':sha((BASE/'STAGE.json').read_bytes())}]
for p in sorted(OUT.iterdir()):
    b=p.read_bytes();files.append({'file':str(p.relative_to(ROOT)),'bytes':len(b),'sha256':sha(b)})
p=Path(__file__);b=p.read_bytes();files.append({'file':str(p.relative_to(ROOT)),'bytes':len(b),'sha256':sha(b)})
freeze={'schemaVersion':1,'capsuleId':'hsk1-l10-independent-source-review-corrected-v2-20261005',
     'courseId':'hsk1','lesson':10,'reviewer':'/root','stage':'independent-source-review',
     'status':'accepted-source-transcription','acceptedOccurrenceCount':121,
     'supersedesCapsuleId':'hsk1-l10-independent-source-review-20261005',
     'files':files,'remoteSynchronizationStatus':'pending-readback'}
dump('FREEZE.json',freeze)
p=OUT/'FREEZE.json';b=p.read_bytes()
dump('STAGE.json',{'schemaVersion':1,'capsuleId':freeze['capsuleId'],'courseId':'hsk1','lesson':10,
     'stage':'independent-source-review','status':freeze['status'],'acceptedOccurrenceCount':121,
     'supersedesCapsuleId':freeze['supersedesCapsuleId'],'freeze':str(p.relative_to(ROOT)),
     'freezeSHA256':sha(b),'files':files+[{'file':str(p.relative_to(ROOT)),'bytes':len(b),'sha256':sha(b)}],
     'productionDeployment':False})
print(json.dumps({'stage':str((OUT/'STAGE.json').relative_to(ROOT)),
     'freezeSHA256':sha(b),'capsuleFiles':len(files)+2,'acceptedSourceOccurrenceCount':121}))
