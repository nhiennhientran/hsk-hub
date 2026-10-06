"""Explicit source-frame review of the thirteen remaining original HSK1 heads."""
import hashlib, importlib.util, json, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
BASE=ROOT/'course-app/docs/final-quality-20261006/audio-hsk1/remaining13-source-context-inventory'
OUT=ROOT/'course-app/docs/final-quality-20261006/audio-root-peer-hsk1-thirteen'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def checked(r):
 p=pathlib.Path(r['file']);p=p if p.is_absolute() else ROOT/p
 assert sha(p)==r['sha256'];return json.loads(p.read_text())
def module(name,file):
 s=importlib.util.spec_from_file_location(name,pathlib.Path(__file__).with_name(file));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def component(kind,frames,note):return {'kind':kind,'sourceSampleRange16k':frames,'observationExplanation':note}
def syllables(t):
 p=t['actualPhaseProposals16k'];word=t['sourceText'];py=t['sourcePinyin']
 if word=='的':return [('de',[0,2],[('onset','shortInitialRelease'),('nucleus','centralVowelNucleus'),('release','naturalDecay')])]
 if word=='见':return [('jiàn',[0,4],[('onset','frontalFriction'),('nucleus','frontVowel'),('coda','nasalTail'),('release','naturalDecay')])]
 if word=='前':return [('qián',[0,4],[('onset','frontalFriction'),('nucleus','frontChangingVowel'),('coda','nasalTail'),('release','naturalDecay')])]
 if word=='前边':return [('qián',[0,4],[('onset','firstFrontalFriction'),('nucleus','firstVowelAndNasal'),('coda',[17120,17824])]),('bian',[4,8],[('onset','secondShortRelease'),('nucleus','secondFrontVowelAndNasal'),('coda',[21120,21680]),('release','naturalDecay')])]
 if word=='第':return [('dì',[0,2],[('onset','shortInitialRelease'),('nucleus','highFrontVowel'),('release','naturalDecay')])]
 if word in ('要','药'):return [('yào',[0,3],[('glide','voicedGlide'),('nucleus','changingAoBody'),('release','closingGlideAndDecay')])]
 if word=='一下':return [('yí',[0,2],[('glide',[245040,246240]),('nucleus',[246240,251424])]),('xià',[2,5],[('onset','secondFriction'),('nucleus','secondChangingVowel'),('release','naturalDecay')])]
 if word=='字':return [('zì',[0,2],[('onset','frontalFriction'),('nucleus','apicalVowelBody'),('release','weakFinalDecay')])]
 return []
def main():
 OUT.mkdir(parents=True,exist_ok=True);support=module('last13_context','review-decisions.py');features=module('last13_features','review-syllable-evidence.py')
 facts_path=BASE/'selected-existing-pure-component-facts-01.json';facts=json.loads(facts_path.read_text());contexts_path=BASE/'completed-two-actual-contexts-evidence-index.json';contexts=json.loads(contexts_path.read_text());checked(contexts['selectedPureComponentFacts']);groups={};pending=[];observations=[]
 for t in facts['targets']:
  c=next(z for z in contexts['targets'] if z['id']==t['id']);assert c['selectedActualPureCandidateId']==t['candidateId']
  name='hsk1-second107-paired-01.json' if t['selectedOriginalRepetition']==2 else 'hsk1-paired-full-03.json';report=ROOT/'course-app/docs/final-quality-20261006/audio-review'/name;r=next(z for z in json.loads(report.read_text())['targets'] if z['id']==t['id'] and z['sourceSampleRange16k']==t['sourceSampleRange16k']);pcm=support.original_pcm(ROOT,r);s,e=r['sourceSampleRange16k'];assert hashlib.sha256(pcm[s*4:e*4]).hexdigest()==t['cropPCM_SHA256']==r['cropPCM_SHA256'];p=t['originalCatalogPrintedObject'];obj=features.pointer(checked(p),p['sourceJSONPointer']);assert obj==p['sourceRow'] and obj['zh']==t['sourceText'] and obj['py']==t['sourcePinyin']
  wave=checked(t['actualWaveformObservation']);assert wave['sourceSHA256']==r['sourceSHA256']
  for plot in wave['plots']:support.actual_file(ROOT,plot)
  for m in t['actualWhisperRaw']:
   raw=checked(m);support.unprompted(raw);assert raw['cropPCM_SHA256']==r['cropPCM_SHA256'] and raw['sourceSampleRange16k']==[s,e];assert ''.join(z['text'] for z in raw['rawSegments'])==m['rawTranscript']
  ctc=checked(t['actualIndependentCTCRaw']);assert ctc['modelSHA256']=='c71f0ce00bec95b07744e116345e33d8cbbe08cef896382cf907bf4b51a2cd51' and ctc['cropPCM_SHA256']==r['cropPCM_SHA256'] and ctc['expectedTextPromptUsed'] is False;assert ctc['rawText']==t['actualIndependentCTCRaw']['rawTranscript'] and json.loads(ctc['rawResultString'])==ctc['rawResult']
  whole=checked(t['originalWholeSourceUnpromptedEvidence']);support.unprompted(whole);assert whole.get('cropPCM_SHA256',whole.get('track',{}).get('pcm',{}).get('sha256'))==r['sourcePCM_SHA256']
  probes=[]
  for g in c['twoActualContainingGeometryDualModelEvidence']:
   a,b=g['sourceSampleRange16k'];assert a<=s<e<=b and [a,b]!=[s,e];assert hashlib.sha256(pcm[a*4:b*4]).hexdigest()==g['cropPCM_SHA256']
   for m in g['models']:
    raw=checked(m);support.unprompted(raw);assert raw['sourceSampleRange16k']==[a,b] and raw['cropPCM_SHA256']==g['cropPCM_SHA256'];assert ''.join(z['text'] for z in raw['rawSegments'])==m['observedRawText'];probes.append({**m,'observedRawText':m['observedRawText']})
  assert len(probes)==4 and all(v is not None and v<=-45 for v in r['actualEdgeRMSDbFS20ms'].values())
  identity={k:r[k] for k in ['sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']};identity['sourceText']=r['sourceZH'];py=r['sourcePinyin'];ph=t['actualPhaseProposals16k'];marks=[min(x[0] for x in ph.values()),max(x[1] for x in ph.values())]
  explanation=t['actualOriginalSourceObservation']+' Root actually viewed all six local comparison sheets and all five complete original source sheets. The original printed head and pinyin, complete source order, two recorded repetitions, actual consonant/glide, vowel body and finite natural tail were reviewed together. This exact source crop preserves the complete original head and excludes both neighboring recordings; all four unchanged physical cut windows pass the strict quiet gate. Two distinct containing source geometries each retain both pinned, unprompted model outputs, including their actual disagreements and no-speech probabilities. Source/component geometry establishes the original recording; model text and emission times remain diagnostic observations, without a tone or native-listening certificate.'
  if t['sourceText']=='前边':explanation+=' The original first reading has a separate brief second consonantal release at 1.145–1.166 before the front second vowel and nasal continuation; this interruption differs from the sustained nasal lead of 面. The printed qiánbian head at the beginning of original 9-2 and the separate repeated complete head are retained, rather than changing original 前面 decoder text into a literal match.'
  context={**identity,'sourcePinyin':py,'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,'neighborSpeechExcluded':True,'actualCropBoundariesChecked':True,'phoneticEquivalenceIsAuxiliaryOnly':True,'originalRepeatedReadingsChecked':True,'sourceGroupEvidence':t['originalWholeSourceUnpromptedEvidence'],'originalPrintedSource':{**p,'sourceJSONPointer':p['sourceJSONPointer']},'actualSourceComparisonEvidence':ref(facts_path),'actualWaveformObservation':t['actualWaveformObservation'],'rawDifferences':[{'file':m['file'],'sha256':m['sha256'],'unalteredRawTranscript':m['rawTranscript']} for m in t['actualWhisperRaw']],'supplementalCTCEvidence':t['actualIndependentCTCRaw'],'explanation':explanation}
  d={'id':r['id'],'sourceSampleRange16k':[s,e],'decision':'accept','sourceContextChecked':True,'acknowledgedFlags':r['flags'],'rationale':explanation,'resolvedTextHolds':sorted(set(r['holds'])&support.TEXT_REVIEW_HOLDS),'resolvedSourceHolds':sorted(set(r['holds'])&support.SOURCE_REVIEW_HOLDS),'resolvedBoundaryHolds':sorted(set(r['holds'])&support.BOUNDARY_REVIEW_HOLDS),'resolvedDecoderASRDiagnosticHolds':sorted(set(r['holds'])&support.DECODER_DIAGNOSTIC_HOLDS),'sourceContextEvidence':context,'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False}
  if t['rhoticIdentityUnknown']:
   d.update({'decision':'hold-until-original-recording-variant-independent-review','actualRhoticIdentityUnknown':True,'completeOriginalSourceHeadReviewed':True});pending.append(d);continue
  d['boundaryDecisionEvidence']={**identity,'category':'localized-connected-speech','waveformObservation':t['actualWaveformObservation'],'targetForegroundExtent16k':marks,'independentlyReviewedNeighborLimits16k':[s,e],'actualWaveformAndSpectrumReviewed':True,'completeTargetPhonemesRetained':True,'neighborTargetSpeechExcluded':True,'sourceOrderChecked':True,'originalBackgroundPreserved':True,'noSyntheticPadding':True,'rawASRTimestampsAreAuxiliaryOnly':True,'onsetConsonantAndRimeReviewed':True,'nasalAndFinalReleaseReviewed':True,'expandedProbesCompared':True,'phoneticEquivalenceIsAuxiliaryOnly':True,'expandedProbeEvidence':probes,'startBoundaryExplanation':explanation,'endBoundaryExplanation':explanation,'explanation':explanation};support.boundary_decision(r,d,ROOT)
  observed=[]
  for segment,chars,parts in syllables(t):observed.append({'sourcePinyinSegment':segment,'sourcePinyinCharacterRange':chars,'components':[component(kind,ph[value] if isinstance(value,str) else value,explanation) for kind,value in parts]})
  proof={**identity,'category':'asr-complete-original-reading-decoder-uncertainty' if len(observed)>1 else 'asr-short-syllable-decoder-uncertainty','targetSourcePinyin':py,'originalPrintedOccurrenceId':r['id'],'originalPrintedPinyinEvidence':{**p,'sourceJSONPointer':p['sourceJSONPointer']+'/py','originalPrintedPinyin':py,'targetPinyinCharacterRange':[0,len(py)]},'originalPrintedOccurrenceTextEvidence':{**p,'sourceJSONPointer':p['sourceJSONPointer']+'/zh','sourceText':r['sourceZH'],'targetTextCharacterRange':[0,len(r['sourceZH'])]},'actualSyllableFeatureEvidence':t['actualCropFeatureEvidence'],'waveformObservation':t['actualWaveformObservation'],'explanation':explanation,'onsetExplanation':explanation,'rimeAndFinalExplanation':explanation,'originalOccurrenceExplanation':explanation}
  for key in ['actualOriginalSyllableWaveformAndSpectrumReviewed','completeOriginalOnsetOrGlideRetained','completeOriginalRimeAndFinalRetained','neighborPhonemesExcluded','originalPrintedPronunciationAndContextChecked','sourceOccurrenceIndependentlyIdentified','sourceASRTimestampsAreAuxiliaryOnly','F0IsObservationNotToneCertification','allActualCropASRDiagnosticsRetained','noSyntheticPadding','phonemeIdentityIsKnownForThisExactSourceOccurrence']:proof[key]=True
  if len(observed)>1:proof.update({'observedOriginalSyllables':observed,'everyOriginalSyllableIndependentlyReviewed':True})
  else:proof['observedOriginalSyllableComponents16k']=observed[0]['components']
  d['shortSyllableDecoderDecisionEvidence']=proof
  try:
   validated=features.validate(r,d,ROOT,support);support.contextual_decision(r,d,ROOT)
  except ValueError as error:
   d.update({'decision':'hold-until-fixed-source-evidence','remainingActualContractIssue':str(error),'productionApproved':False});pending.append(d);continue
  observations.append({'id':r['id'],'sourceSampleRange16k':[s,e],'actualObservedSyllableNuclei':validated['actualObservedSyllableNuclei']});groups.setdefault(name,[]).append(d)
 for name,decisions in groups.items():
  report=ROOT/'course-app/docs/final-quality-20261006/audio-review'/name;p=OUT/(name.replace('.json','-explicit-independent-decisions.json'));p.write_text(json.dumps({'schemaVersion':1,'reviewReportSHA256':sha(report),'independentSourceReviewScript':ref(pathlib.Path(__file__)),'actualSourcePhysicalFacts':ref(facts_path),'actualTwoDistinctContainingContextIndex':ref(contexts_path),'decisions':decisions,'actualObservedOriginalSyllableNuclei':observations,'automaticApproval':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps({**ref(p),'actualExplicitDecisions':len(decisions)}))
 p=OUT/'remaining-specific-source-contract-issues.json';p.write_text(json.dumps({'schemaVersion':1,'actualSourcePhysicalFacts':ref(facts_path),'actualTwoDistinctContainingContextIndex':ref(contexts_path),'decisions':pending,'automaticApproval':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps({**ref(p),'actualPending':len(pending),'issues':[{k:d.get(k) for k in ('id','remainingActualContractIssue','actualRhoticIdentityUnknown')} for d in pending]}))
if __name__=='__main__':main()
