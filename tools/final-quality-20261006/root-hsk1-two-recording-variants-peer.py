"""Keep complete original heads and disclose the two unclear recorded -r tails."""
import hashlib,importlib.util,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
BASE=ROOT/'course-app/docs/final-quality-20261006/audio-root-peer-hsk1-thirteen'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def main():
 source=BASE/'remaining-specific-source-contract-issues.json';assert sha(source)=='449407dd0205926cd00f52bc8d4f9a1fbeb7b222da3ebd799e4d4ae75ce2fcaa'
 note_source=ROOT/'course-app/docs/final-quality-20261006/audio-hsk1/remaining13-source-context-inventory/two-rhotic-unknown-recording-note-proposals-01.json';assert sha(note_source)=='33389e127847bb8ce69cbddc822f253e89c4c23bc7793fbe18b016fa09b355db'
 spec=importlib.util.spec_from_file_location('two_original_variants',pathlib.Path(__file__).with_name('review-decisions.py'));support=importlib.util.module_from_spec(spec);spec.loader.exec_module(support)
 report=ROOT/'course-app/docs/final-quality-20261006/audio-review/hsk1-paired-full-03.json';rows=json.loads(report.read_text())['targets'];notes=json.loads(note_source.read_text())['targets'];decisions=[];signed=[]
 for d in json.loads(source.read_text())['decisions']:
  if not d.get('actualRhoticIdentityUnknown'):continue
  r=next(z for z in rows if z['id']==d['id'] and z['sourceSampleRange16k']==d['sourceSampleRange16k']);n=next(z for z in notes if z['id']==d['id']);assert r['sourceZH'] in ('面条儿','那儿');support.actual_identity(r,n,'original-recording-note');assert set(r['holds'])<=support.TEXT_REVIEW_HOLDS
  assert n['actualRhoticIdentityUnknown'] is True and n['claimsRhoticAbsent'] is False and n['claimsRhoticPresent'] is False and n['changesExpectedAnswerOrCanonicalPinyin'] is False
  pcm=support.original_pcm(ROOT,r);s,e=r['sourceSampleRange16k'];assert hashlib.sha256(pcm[s*4:e*4]).hexdigest()==r['cropPCM_SHA256'];assert all(v is not None and v<=-45 for v in r['actualEdgeRMSDbFS20ms'].values())
  explanation=d['rationale']+' This complete original vocabulary recording is selected as a disclosed recording variant. The exact rhotic tail is not independently resolved, and neither absence nor presence of rhotic articulation is certified. The textbook head/pinyin and expected answers remain intact. A bilingual source/frame-bound recording note must accompany this exact original audio and says that the textbook -r is not clear in this recording; it does not present this clip as a certified rhotic pronunciation model.'
  note={'zh':'教材标注的儿化在这段原录音中不够清晰。','vi':'Âm uốn lưỡi “-r” ghi trong giáo trình chưa rõ trong đoạn ghi âm gốc này.'}
  d.update({'decision':'accept','rationale':explanation,'recordingVariantScope':'complete-original-head-with-unclear-recorded-rhotic-tail','recordingNote':note,'requiredStudentVisibleRecordingNote':True,'recordingNoteSourceProposal':ref(note_source),'rhoticIdentityCertified':False,'resolvedDecoderASRDiagnosticHolds':[]});d['sourceContextEvidence'].update({'explanation':explanation,'actualRhoticIdentityUnknown':True,'recordingVariantDisclosed':True,'recordingNote':note});support.contextual_decision(r,d,ROOT);decisions.append(d)
  signed.append({**{k:n[k] for k in ['id','candidateId','sourceText','sourcePinyin','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']},'proposedRecordingNoteZH':note['zh'],'proposedRecordingNoteVI':note['vi'],'actualRhoticIdentityUnknown':True,'claimsRhoticAbsent':False,'claimsRhoticPresent':False,'canonicalSourceAndAnswersUnchanged':True,'independentlyReviewedSourceVariant':True,'originalIndependentPhysicalReview':ref(source),'producerNoteProposal':ref(note_source)})
 assert len(decisions)==2
 p=BASE/'two-complete-original-recording-variants-independent-decisions.json';p.write_text(json.dumps({'schemaVersion':1,'reviewReportSHA256':sha(report),'independentReviewScript':ref(pathlib.Path(__file__)),'originalIndependentPhysicalReview':ref(source),'decisions':decisions,'automaticApproval':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps(ref(p)))
 p=BASE/'two-original-rhotic-variant-student-visible-recording-note-proposal.json';p.write_text(json.dumps({'schemaVersion':1,'targets':signed,'automaticPrecisionApproval':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps(ref(p)))
if __name__=='__main__':main()
