"""Fresh source/crop verification and explicit contextual review of fourteen heads."""
import hashlib,importlib.util,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
BASE=ROOT/'course-app/docs/final-quality-20261006/audio-hsk1/remaining14-original-reading-contrast'
OUT=ROOT/'course-app/docs/final-quality-20261006/audio-root-peer-hsk1-fourteen'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def checked(r):
 p=pathlib.Path(r['file']);p=p if p.is_absolute() else ROOT/p
 assert sha(p)==r['sha256'];return json.loads(p.read_text())
def module(name,file):
 s=importlib.util.spec_from_file_location(name,pathlib.Path(__file__).with_name(file));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def main():
 OUT.mkdir(parents=True,exist_ok=True);support=module('fourteen_context','review-decisions.py');features=module('fourteen_features','review-syllable-evidence.py');source=BASE/'actual-reading-components-and-source-proposals-01.json';proposal=json.loads(source.read_text());records=[];groups={}
 # These choices are original complete recorded heads after the seven local
 # two-reading sheets and four original source sheets were actually reviewed.
 extra_choices={'v-l04-lex-68bf29eb00-s1':2,'v-l11-lex-be9cb728a5-s1':1}
 # Actual vowel distinction for these two remains unresolved, not promoted.
 held_ids={'v-l04-lex-dcf66dcd60-s1','v-l12-lex-8995b89799-s1'}
 for t in proposal['targets']:
  ordinal=t['preferredOriginalRepetition'] or extra_choices.get(t['id']);observed=[]
  for v in t['variants']:
   pcm=support.original_pcm(ROOT,{**v,'sourceZH':t['sourceText']});s,e=v['sourceSampleRange16k'];assert hashlib.sha256(pcm[s*4:e*4]).hexdigest()==v['cropPCM_SHA256'];p=v['originalCatalogPrintedObject'];book=features.pointer(checked(p),p['sourceJSONPointer']);assert book['id']==t['id'] and book['zh']==t['sourceText'] and book['py']==t['sourcePinyin'];assert v['allFourActualQuietWindows'] is True
   for m in v['actualWhisperRaw']:
    raw=checked(m);support.unprompted(raw);assert raw['sourceSampleRange16k']==[s,e] and raw['cropPCM_SHA256']==v['cropPCM_SHA256'];assert ''.join(q['text'] for q in raw['rawSegments'])==m['rawTranscript']
   ctc=checked(v['actualIndependentCTCRaw']);assert ctc['cropPCM_SHA256']==v['cropPCM_SHA256'] and ctc['expectedTextPromptUsed'] is False;assert ctc['rawText']==v['actualIndependentCTCRaw']['rawTranscript']
   whole=checked(v['wholeSourceEvidence']);support.unprompted(whole);assert whole.get('cropPCM_SHA256',whole.get('track',{}).get('pcm',{}).get('sha256'))==v['sourcePCM_SHA256']
   wave=checked(v['actualWaveformObservation']);assert wave['sourceSHA256']==v['sourceSHA256'];
   for plot in wave['plots']:
    path=ROOT/plot['file'];assert sha(path)==plot['sha256']
   component=v['actualComponentTransitionProposals'];phases=[component[k] for k in ['originalOnsetTransitionFrames16k','originalNucleusFrames16k','originalFinalAndReleaseFrames16k']];assert s<=phases[0][0]<phases[0][1]==phases[1][0]<phases[1][1]==phases[2][0]<phases[2][1]<=e
   observed.append({'candidateId':v['candidateId'],'sourceSampleRange16k':[s,e],'cropPCM_SHA256':v['cropPCM_SHA256'],'actualPrintedSource':p,'actualUnchangedWhisperEvidence':v['actualWhisperRaw'],'actualCTCEvidence':v['actualIndependentCTCRaw'],'actualWholeSourceEvidence':v['wholeSourceEvidence'],'actualWaveformObservation':v['actualWaveformObservation'],'actualOriginalComponentProposals':component})
  records.append({'id':t['id'],'actualOriginalVariantsFreshChecked':observed,'rootActuallyViewedOriginalAndComparisonPlots':True,'sourceText':t['sourceText'],'sourcePinyin':t['sourcePinyin'],'selectedOriginalRepetition':ordinal,'actualVowelContrastUnresolved':t['id'] in held_ids,'rawEvidenceUnchanged':True,'pronunciationToneCertified':False})
  if t['id'] in held_ids:continue
  v=next(z for z in t['variants'] if z['selectedOriginalRepetition']==ordinal);name='hsk1-second107-paired-01.json' if ordinal==2 else 'hsk1-paired-full-03.json';rp=ROOT/'course-app/docs/final-quality-20261006/audio-review'/name;r=next(z for z in json.loads(rp.read_text())['targets'] if z['id']==t['id'] and z['sourceSampleRange16k']==v['sourceSampleRange16k']);assert not set(r['holds'])&support.DECODER_DIAGNOSTIC_HOLDS
  identity={k:r[k] for k in ['sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']};identity['sourceText']=r['sourceZH'];physical=v['physicalObservation'];explanation=physical+' The actual complete original reading, original printed head/pinyin, whole unprompted source order and preceding/following original reading groups were reviewed together. The decoder strings are retained as predictions; this source/frame decision does not certify tones or replace phonemes using CTC. The complete original source pronunciation is selected, preserving textbook text and the real onset, nucleus and natural final decay.'
  if t['id']=='v-l04-lex-68bf29eb00-s1':explanation+=' The second reading has the real front consonantal release/frication beginning around 12.46, followed by the full high/front i body through 13.2; its original printed head is 几/jǐ between 哥哥 and 不. Both G predictions and CTC 几 are retained; no tone certificate is inferred from G/几 or the first-read 起 spelling.'
  if t['id']=='v-l11-lex-be9cb728a5-s1':explanation+=' The first reading preserves the low rounded/gliding onset around 20.39–20.5, central voiced vowel and complete nasal final/decay through 21.01, before the next recorded repetition. Whole-source 问 anchors this exact printed 问/wèn head between 看见 and 电脑. Pure 1/One and CTC when remain unchanged; English labels do not change the original Chinese source head or authorize a general phonetic replacement.'
  context={**identity,'sourcePinyin':r['sourcePinyin'],'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,'neighborSpeechExcluded':True,'actualCropBoundariesChecked':True,'phoneticEquivalenceIsAuxiliaryOnly':True,'originalRepeatedReadingsChecked':True,'sourceGroupEvidence':v['wholeSourceEvidence'],'originalPrintedSource':v['originalCatalogPrintedObject'],'actualSourceComparisonEvidence':ref(source),'actualWaveformObservation':v['actualWaveformObservation'],'originalSourcePhases':v['actualComponentTransitionProposals'],'rawDifferences':[{'model':x['file'],'unalteredRawTranscript':x['rawTranscript']} for x in v['actualWhisperRaw']],'supplementalCTCEvidence':v['actualIndependentCTCRaw'],'explanation':explanation}
  text_holds=set(r['holds'])&support.TEXT_REVIEW_HOLDS;source_holds=set(r['holds'])&support.SOURCE_REVIEW_HOLDS;assert not set(r['holds'])-text_holds-source_holds
  if source_holds:context.update({'originalPrintedSourceOccurrenceChecked':True,'targetAndOriginalPronunciationCompared':True,'telephoneYaoNotSubstitutedForYi':True,'originalPrintedSource':{**v['originalCatalogPrintedObject'],'sourceJSONPointer':v['sourceJSONPointer']+'/zh','sourceText':r['sourceZH']}})
  decision={'id':r['id'],'sourceSampleRange16k':r['sourceSampleRange16k'],'decision':'accept','sourceContextChecked':True,'rationale':explanation,'acknowledgedFlags':r['flags'],'resolvedTextHolds':sorted(text_holds),'resolvedSourceHolds':sorted(source_holds),'resolvedBoundaryHolds':[],'resolvedDecoderASRDiagnosticHolds':[],'sourceContextEvidence':context,'humanListening':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False};support.contextual_decision(r,decision,ROOT);groups.setdefault(name,[]).append(decision)
 observation=OUT/'fresh-fourteen-original-source-verification.json';observation.write_text(json.dumps({'schemaVersion':1,'producer':ref(pathlib.Path(__file__)),'originalSourceProposal':ref(source),'records':records,'automaticApproval':False},ensure_ascii=False,indent=2)+'\n')
 for name,decisions in groups.items():
  report=ROOT/'course-app/docs/final-quality-20261006/audio-review'/name;p=OUT/(name.replace('.json','-explicit-independent-decisions.json'));p.write_text(json.dumps({'schemaVersion':1,'reviewReportSHA256':sha(report),'actualOriginalSourceVerification':ref(observation),'decisions':decisions,'automaticApproval':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps({**ref(p),'actualExplicitDecisions':len(decisions)}))
 print('Actual fourteen fresh source/crop verification; 12 explicit complete original-head decisions; two original vowel contrasts remain unresolved.')
if __name__=='__main__':main()
