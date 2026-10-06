#!/usr/bin/env python3
"""Formal nine decisions for the exact, independently registered version 04."""
import hashlib,importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006';OUT=BASE/'audio-context-peer-hsk3-remaining-spoken-hard15'
REPORT=BASE/'audio-review/hsk3-paired-full-03.json';OBS=OUT/'hard15-independent-actual-source-observations.json'
REGISTRY=BASE/'audio-review/fixed-original-utterance-decoder-scopes-04.json'
PROPOSALS={
 'seven-complete-original-utterance-physical-fixed-scope-proposals.json':'fcb6b15fac23c60dc065457322c26ee5641d525d31b90896c40b2ce0cb235955',
 'two-zero-complete-original-utterance-physical-fixed-scope-proposals.json':'e5d79952af554a73207d287b4526c0b53600eda524702a4326aabc46116ed881'}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def dump(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def mod(n,p):s=importlib.util.spec_from_file_location(n,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def main():
 assert sha(REGISTRY)=='1fe836401e849a918ae9fbd85df24ae293ae19afe8d17598b39adcbb3c47da08'
 assert sha(REPORT)=='0311e6d565ce6e0ea579e3bfd8b7f4d4f1f4514fc26bd4fd30d41a7fd1c4731d'
 registry=json.loads(REGISTRY.read_text());rows={x['id']:x for x in json.loads(REPORT.read_text())['targets']};obs={x['id']:x for x in json.loads(OBS.read_text())['targets']}
 proposals=[]
 for name,expected in PROPOSALS.items():
  p=OUT/name;assert sha(p)==expected;proposals.extend(json.loads(p.read_text())['decisions'])
 assert len(proposals)==9
 support=mod('nine_fixed_source_context',ROOT/'tools/final-quality-20261006/review-decisions.py');validator=mod('nine_fixed_utterance_validator',ROOT/'tools/final-quality-20261006/review-fixed-utterance.py')
 decisions=[];results=[]
 for proposal in proposals:
  r=rows[proposal['id']];o=obs[r['id']];physical=proposal['actualOriginalUtteranceSourcePhysicalEvidence']
  entry=next(x for x in registry['targets']if x['id']==r['id'])
  assert entry['originalPhysicalEvidence']==physical and entry['originalRawResultWhitelist']==proposal['originalRawResultWhitelist']
  assert entry['onlyAuthorizedZeroDecoderWordEmissions']==proposal['onlyAuthorizedZeroDecoderWordEmissions']
  identity={k:r[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')};identity['sourceText']=r['sourceZH']
  explanation=physical['explanation']
  proof={**identity,'category':'fixed-complete-original-utterance-decoder-diagnostic-review','authorizedFixedSourceScope':ref(REGISTRY),
    'originalSourcePhysicalEvidence':physical,'phonemeIdentityUnknown':False,'completeOriginalCoreUtteranceIndependentlyReviewed':True,
    'independentCoreSourceSpectrumExplanation':explanation,'humanListening':False,'nativeSpeakerReview':False,
    'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False}
  decoder=sorted(set(r['holds'])&support.DECODER_DIAGNOSTIC_HOLDS);text=sorted(set(r['holds'])&support.TEXT_REVIEW_HOLDS)
  d={'id':r['id'],'candidateId':r['candidateId'],'sourceSampleRange16k':r['sourceSampleRange16k'],'cropPCM_SHA256':r['cropPCM_SHA256'],
    'decision':'accept','sourceContextChecked':True,'rationale':explanation,'acknowledgedFlags':r['flags'],
    'fixedOriginalUtteranceDecoderDecisionEvidence':proof,'resolvedDecoderASRDiagnosticHolds':decoder,'resolvedTextHolds':text,
    'resolvedSourceHolds':[],'resolvedBoundaryHolds':[],'humanListening':False,'nativeSpeakerReview':False,
    'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False,'automaticProductionApproval':False}
  if text:
   context={**identity,'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,'neighborSpeechExcluded':True,
     'actualCropBoundariesChecked':True,'phoneticEquivalenceIsAuxiliaryOnly':True,'sourceGroupEvidence':o['sourceGroupEvidence'],
     'sourcePinyin':r['sourcePinyin'],'explanation':explanation,
     'rawDifferences':[{'modelRepository':e['modelRepository'],'actualRaw':e['rawTranscript'],'canonicalUnchanged':r['sourceZH'],
       'originalBindingEvidence':{k:e[k]for k in ('file','sha256')}}for e in r['rawModelEvidence']],
     'canonicalPrintedSource':r['canonicalSource'],'canonicalParentPinyinRetained':o['canonicalPrintedParentPinyin'],
     'actualOriginalPhysicalEvidence':physical,'globalGlyphOrNumericSubstitution':False,
     'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False}
   support.contextual_decision(r,{'sourceContextEvidence':context},ROOT);d['sourceContextEvidence']=context
  validated=validator.validate(r,d,ROOT);assert validated['allRawEvidenceUnchanged']is True
  results.append({'id':r['id'],'status':'passed','exactScope':ref(REGISTRY),'resolvedTextHolds':text,
    'retainedZeroDecoderWordEmissions':validated['retainedZeroDecoderWordEmissions'],
    'retainedWhisperNoSpeechWarnings':validated['retainedWhisperNoSpeechWarnings'],'originalSourcePhysicalEvidenceUnchanged':True})
  decisions.append(d)
 p=OUT/'nine-complete-original-fixed-decoder-explicit-decisions.json'
 dump(p,{'schemaVersion':1,'status':'independent-nine-complete-original-utterance-decisions-not-authority','reviewer':'acceptance_scope_plan',
   'reviewReportSHA256':sha(REPORT),'sourceReportEvidence':ref(REPORT),'authorizedFixedSourceScope':ref(REGISTRY),
   'immutablePhysicalProposalsEvidence':[ref(OUT/x)for x in PROPOSALS],'scriptEvidence':ref(Path(__file__)),'decisions':decisions,
   'newASR':False,'sourceModified':False,'runtimeModified':False,'automaticApproval':False})
 q=OUT/'nine-complete-original-fixed-decoder-read-only-validation.json'
 dump(q,{'status':'passed','passed':len(results),'decisionEvidence':ref(p),'validatorEvidence':ref(ROOT/'tools/final-quality-20261006/review-fixed-utterance.py'),
   'authorizedFixedSourceScope':ref(REGISTRY),'results':results,'allRawEvidenceUnchanged':True,'authorityModified':False,'automaticProductionApproval':False})
 print(json.dumps({'decisions':ref(p),'validation':ref(q),'passed':len(results)}))
if __name__=='__main__':main()
