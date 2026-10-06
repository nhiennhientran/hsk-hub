#!/usr/bin/env python3
"""Actual short-syllable observations and strict per-ID decoder-exception gate.

Observations never approve audio. A fixed source/phoneme/boundary decision is
also required. ASR diagnostics and all certification flags remain unchanged.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import unicodedata

import numpy as np

RATE=16000
WINDOW=512
HOP=80
MIN_RMS=-45
MIN_CORRELATION=.65
DIAGNOSTIC_HOLDS={
    'crop-ASR-hallucination-or-no-speech-warning',
    'crop-ASR-empty-segments-or-word-evidence',
    'crop-ASR-zero-inverted-or-out-of-bounds-word',
}
METHOD='normalized-autocorrelation-32ms-5ms-75to500Hz-energy-gated-v1'


def module():
    spec=importlib.util.spec_from_file_location('short_syllable_source',Path(__file__).with_name('review-decisions.py'))
    m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m


def features(pcm,first,last):
    values=np.frombuffer(pcm,dtype='<f4');result=[]
    for start in range(first,last-WINDOW+1,HOP):
        x=values[start:start+WINDOW].astype('f8');rms=float(np.sqrt(np.mean(x*x)))
        db=20*np.log10(max(rms,1e-12));x=x-float(np.mean(x))
        correlation=np.correlate(x,x,'full')[WINDOW-1:]
        lo,hi=32,213
        lag=lo+int(np.argmax(correlation[lo:hi+1]))
        strength=float(correlation[lag]/max(correlation[0],1e-12))
        voiced=bool(db>=MIN_RMS and strength>=MIN_CORRELATION)
        result.append({'sourceWindowFrames16k':[start,start+WINDOW],
                       'rmsDbFS':round(float(db),6),'periodicity':round(strength,6),
                       'estimatedF0Hz':round(RATE/lag,6) if voiced else None,
                       'voicedObservation':voiced})
    return result


def feature_sha(bins):
    return hashlib.sha256(json.dumps(bins,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def pinyin(value):
    return re.sub(r'\s+','',unicodedata.normalize('NFC',value).lower())


def pointer(value,path):
    if not isinstance(path,str)or not path.startswith('/'):
        raise ValueError('printed source needs an actual JSON pointer')
    for key in path[1:].split('/'):
        key=key.replace('~1','/').replace('~0','~')
        value=value[int(key)] if isinstance(value,list) else value[key]
    return value


def validate(row,decision,root,support=None,source_context_only=False):
    support=support or module()
    proof=decision.get('originalSyllableSourceContextEvidence' if source_context_only else 'shortSyllableDecoderDecisionEvidence',{})
    support.actual_identity(row,proof,'short-syllable-decoder')
    ctc=proof.get('independentlyVerifiedCTCSupplementalEvidence')
    if ctc:
        checked=json.loads(support.actual_file(root,ctc).read_text())
        if checked.get('status')!='independent-CTC-bytes-source-frames-verified-not-approved':
            raise ValueError('CTC supplement has not independently passed actual byte/frame verification')
        matching=[x for x in checked.get('observations',[])if x.get('id')==row['id']and x.get('sourceSampleRange16k')==row['sourceSampleRange16k']and x.get('cropPCM_SHA256')==row['cropPCM_SHA256']]
        if len(matching)!=1:
            raise ValueError('CTC supplement does not bind the exact target crop')
        support.actual_identity(row,{**matching[0],'sourceText':row['sourceZH']},'CTC-supplement')
        raw=json.loads(support.actual_file(root,matching[0]['rawEvidence']).read_text())
        if raw.get('rawText')!=matching[0]['rawText']or json.loads(raw['rawResultString'])!=raw['rawResult']or raw['rawResult']['text']!=raw['rawText']:
            raise ValueError('CTC native text has been changed')
        if raw.get('modelSHA256')!='c71f0ce00bec95b07744e116345e33d8cbbe08cef896382cf907bf4b51a2cd51'or raw.get('expectedTextPromptUsed')is not False:
            raise ValueError('CTC supplementary model/conditioning differs')
    category=proof.get('category')
    allowed_categories=('asr-original-syllable-source-context-review',) if source_context_only else ('asr-short-syllable-decoder-uncertainty','asr-complete-original-reading-decoder-uncertainty')
    if category not in allowed_categories:
        raise ValueError('short decoder needs a specific fixed-ID exception category')
    if row['unit']!='word' or not re.fullmatch(r'[\u3400-\u9fff]+',row['sourceZH']) or row.get('expectedReadingCount',1)!=1:
        raise ValueError('decoder exception is scoped to one complete original word reading')
    if category in ('asr-short-syllable-decoder-uncertainty','asr-original-syllable-source-context-review')and len(row['sourceZH'])!=1:
        raise ValueError('single-syllable decoder category cannot approve a multi-syllable word')
    if source_context_only and not (set(row['holds']) & support.SOURCE_REVIEW_HOLDS):
        raise ValueError('source-context phoneme proof requires an actual explicit original source-reuse hold')
    if not source_context_only and not (set(row['holds'])&DIAGNOSTIC_HOLDS):
        raise ValueError('decoder exception cannot replace ordinary text/source decisions')
    required=('actualOriginalSyllableWaveformAndSpectrumReviewed','completeOriginalOnsetOrGlideRetained',
              'completeOriginalRimeAndFinalRetained','neighborPhonemesExcluded',
              'originalPrintedPronunciationAndContextChecked','sourceOccurrenceIndependentlyIdentified',
              'sourceASRTimestampsAreAuxiliaryOnly','F0IsObservationNotToneCertification',
              'allActualCropASRDiagnosticsRetained','noSyntheticPadding',
              'phonemeIdentityIsKnownForThisExactSourceOccurrence')
    if any(proof.get(k)is not True for k in required):
        raise ValueError('short syllable lacks a complete explicit source/phoneme check')
    if not all(proof.get(k) for k in ('explanation','onsetExplanation','rimeAndFinalExplanation','originalOccurrenceExplanation')):
        raise ValueError('short syllable needs concrete per-component and occurrence explanations')
    if any(proof.get(k,False)for k in ('humanListening','nativeSpeakerReview','pronunciationToneCertified','devicePlaybackCertified')):
        raise ValueError('short decoder proof must not claim unsupported certification')
    expected=row.get('sourcePinyin') or row['canonicalSource'].get('sourcePinyin')
    if not expected or pinyin(proof.get('targetSourcePinyin',''))!=pinyin(expected):
        raise ValueError('short syllable target pinyin differs from canonical target')
    original=proof.get('originalPrintedPinyinEvidence',{})
    path=support.actual_file(root,original);printed=json.loads(path.read_text());value=pointer(printed,original.get('sourceJSONPointer',''))
    a,b=original.get('targetPinyinCharacterRange',[None,None])
    code=proof.get('printedNumeralCodeReadingEvidence')
    code_reading=bool(code)
    if code_reading:
        if row['id']!='v-l04-lex-e0d763a9ee-s1' or row['sourceZH']!='零' or pinyin(expected)!='líng' or row['sourceTrack']!='new-hsk1/hsk1/audio/6-1.mp3' or row['sourceSHA256']!='c9b113322c47103d52e5c1a062041d259519589923c1f077982439b18debab3a':
            raise ValueError('printed numeral code reading is scoped only to the actual final phone zero')
        if code.get('category')!='printed-numeral-code-reading' or code.get('literalPrintedPinyin')is not False or code.get('literalPrintedTargetGlyph')is not False or code.get('printedSymbol')!='0' or code.get('canonicalTargetZH')!='零' or pinyin(code.get('canonicalTargetPinyin',''))!='líng' or code.get('telephoneCodeContextIndependentlyReviewed')is not True or not code.get('explanation'):
            raise ValueError('printed code and canonical pronunciation must remain explicitly separate')
        if not ctc or raw['rawText']!='零':
            raise ValueError('final phone zero needs independent actual CTC zero evidence')
        if original.get('literalPrintedPinyin')is not False:
            raise ValueError('phone printed digits must never be labeled literal Chinese pinyin')
    if not isinstance(value,str) or value!=original.get('originalPrintedPinyin') or type(a)is not int or type(b)is not int or not 0<=a<b<=len(value) or (value[a:b]!='0' if code_reading else pinyin(value[a:b])!=pinyin(expected)):
        raise ValueError('original occurrence pinyin slice does not match the actual printed source/target')
    text_ref=proof.get('originalPrintedOccurrenceTextEvidence',{})
    text_path=support.actual_file(root,text_ref)
    if text_path.resolve()!=path.resolve():
        raise ValueError('original occurrence text/pinyin must refer to the same canonical source file')
    printed_text=pointer(printed,text_ref.get('sourceJSONPointer',''))
    x,y=text_ref.get('targetTextCharacterRange',[None,None])
    if not isinstance(printed_text,str)or printed_text!=text_ref.get('sourceText')or type(x)is not int or type(y)is not int or not 0<=x<y<=len(printed_text)or printed_text[x:y]!=('0' if code_reading else row['sourceZH']):
        raise ValueError('source target glyph occurrence is not the fixed printed source character slice')
    if code_reading and (text_ref.get('literalPrintedTargetGlyph')is not False or printed_text!='我的手机号是+33 601493190。'or y!=len(printed_text)-1 or original.get('sourceJSONPointer')!='/lessons/5/scenes/0/lines/1/py' or text_ref.get('sourceJSONPointer')!='/lessons/5/scenes/0/lines/1/zh'):
        raise ValueError('final zero must be the unchanged printed telephone-code occurrence')
    # A target catalog pinyin entry cannot be presented as the recording's
    # printed occurrence. Text and pinyin must be in the same original row,
    # whose nearest declared track is the actual reused source recording.
    py_parts=original['sourceJSONPointer'].split('/')[1:-1]
    text_parts=text_ref['sourceJSONPointer'].split('/')[1:-1]
    shared=[]
    for left,right in zip(py_parts,text_parts):
        if left!=right:break
        shared.append(left)
    parent='/'+'/'.join(shared) if shared else ''
    obj=pointer(printed,parent) if parent else None
    if not isinstance(obj,dict)or not obj.get('id')or obj['id']!=proof.get('originalPrintedOccurrenceId'):
        raise ValueError('original printed pinyin and glyph must belong to the same identified source row/activity')
    declared=None
    while parent:
        obj=pointer(printed,parent)
        if isinstance(obj,dict):
            declared=obj.get('audioTrack')or obj.get('printedAudioTrack')or obj.get('source',{}).get('audioTrack')or obj.get('audio',{}).get('track')
            if declared:break
        parent=parent.rpartition('/')[0]
    if not declared or not row['sourceTrack'].endswith('/'+str(declared)+'.mp3'):
        raise ValueError('printed original occurrence is not bound to the actual recording track')
    # This rejects, for example, a year-context yì offered for canonical yī,
    # and telephone yāo offered for 一, without changing spelling or source.
    first,last=row['sourceSampleRange16k']
    if category=='asr-complete-original-reading-decoder-uncertainty':
        syllables=proof.get('observedOriginalSyllables',[])
        if len(syllables)<2 or proof.get('everyOriginalSyllableIndependentlyReviewed')is not True:
            raise ValueError('complete-word decoder needs every original syllable independently observed')
        previous_character=0
        for syllable in syllables:
            a,b=syllable.get('sourcePinyinCharacterRange',[None,None])
            if type(a)is not int or type(b)is not int or a!=previous_character or not a<b<=len(expected)or pinyin(syllable.get('sourcePinyinSegment',''))!=pinyin(expected[a:b]):
                raise ValueError('observed syllable pinyin slices must cover actual canonical word in order')
            previous_character=b
        if previous_character!=len(expected):raise ValueError('a canonical source syllable is missing')
    else:
        syllables=[{'sourcePinyinSegment':expected,'components':proof.get('observedOriginalSyllableComponents16k',[])}]
    previous=first
    previous_nucleus_end=first
    for syllable in syllables:
        components=syllable.get('components',[]);kinds=[c.get('kind')for c in components]
        bare=''.join(c for c in unicodedata.normalize('NFD',pinyin(syllable['sourcePinyinSegment'])) if not unicodedata.combining(c))
        canonical_syllable=re.fullmatch(r'(?:(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcs])?(?:a|ai|ao|an|ang|o|ou|ong|e|ei|en|eng|er|i|ia|iao|ie|iu|ian|in|iang|ing|iong|u|ua|uo|uai|ui|uan|un|uang|ueng|v|ve|van|vn)|y(?:i|in|ing|a|ao|an|ang|ou|ong|e|ue|uan|un)|w(?:u|a|o|ai|ei|an|en|ang|eng))r?',bare)
        if not canonical_syllable:raise ValueError('component pinyin is not one source syllable')
        requires_glide=bare.startswith(('y','w'))
        requires_onset=not requires_glide and not bare.startswith(('a','e','o'))
        if 'nucleus'not in kinds or (requires_glide and not set(kinds)&{'onset','glide'}) or (requires_onset and 'onset'not in kinds) or (bare.endswith(('n','ng','r'))and 'coda'not in kinds):
            raise ValueError('required onset/glide/nucleus/nasal component is not observed')
        for component in components:
            a,b=component.get('sourceSampleRange16k',[None,None])
            if component.get('kind')not in ('onset','glide','nucleus','coda','release')or type(a)is not int or type(b)is not int or not first<=a<b<=last or a<previous or not component.get('observationExplanation'):
                raise ValueError('complete syllable component geometry/explanation is invalid')
            previous=a
        nuclei=[c['sourceSampleRange16k']for c in components if c.get('kind')=='nucleus']
        if min(x[0]for x in nuclei)<previous_nucleus_end:
            raise ValueError('separate source syllables cannot reuse one voiced nucleus')
        previous_nucleus_end=max(x[1]for x in nuclei)
    observed=json.loads(support.actual_file(root,proof.get('actualSyllableFeatureEvidence',{})).read_text())
    support.actual_identity(row,observed,'actual-syllable-observation')
    if observed.get('method')!=METHOD or observed.get('sampleRate')!=RATE:
        raise ValueError('actual short-syllable feature method differs')
    pcm=support.original_pcm(root,row)
    bins=features(pcm,first,last)
    if observed.get('featureBins')!=bins or observed.get('featureBinsSHA256')!=feature_sha(bins):
        raise ValueError('short-syllable observations do not reproduce actual original PCM')
    voiced=[];nucleus_observations=[]
    for syllable in syllables:
        nuclei=[c['sourceSampleRange16k']for c in syllable['components']if c['kind']=='nucleus']
        observed_voice=[x for x in bins if x['voicedObservation']and any(a<=x['sourceWindowFrames16k'][0]and x['sourceWindowFrames16k'][1]<=b for a,b in nuclei)]
        proxy_passed=bool(len(observed_voice)>=10 and max(x['sourceWindowFrames16k'][1]for x in observed_voice)-min(x['sourceWindowFrames16k'][0]for x in observed_voice)>=1280)
        spectrum_alternative=None
        if not proxy_passed:
            alternative=proof.get('fixedOriginalNucleusSpectrumEvidence')
            if not alternative:
                raise ValueError('actual original syllable has insufficient voiced nucleus observations')
            spec=importlib.util.spec_from_file_location('fixed_actual_nucleus',Path(__file__).with_name('review-fixed-nucleus-spectrum.py'))
            fixed=importlib.util.module_from_spec(spec);spec.loader.exec_module(fixed)
            spectrum_alternative=fixed.validate(row,alternative,root,support,nuclei)
        voiced.extend(observed_voice);nucleus_observations.append({'sourcePinyinSegment':syllable['sourcePinyinSegment'],
            'actualObservedVoicedNucleusFrames16k':[min(x['sourceWindowFrames16k'][0]for x in observed_voice),max(x['sourceWindowFrames16k'][1]for x in observed_voice)] if observed_voice else None,
            'originalVoicedNucleusProxyPassed':proxy_passed,'actualOriginalVoicedNucleusObservationCount':len(observed_voice),
            'independentFixedOriginalSpectrumAlternative':spectrum_alternative})
    wave=proof.get('waveformObservation',{});data=json.loads(support.actual_file(root,wave).read_text())
    if any(data.get(k)!=row[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256')):
        raise ValueError('short-syllable waveform is not this original source')
    plots=[p for p in data.get('plots',[])if p.get('id')==row['id']and p.get('sourceSampleRange16k')==[first,last]and p.get('cropPCM_SHA256')==row['cropPCM_SHA256']]
    if len(plots)!=1:raise ValueError('short syllable needs one actual exact-frame waveform/spectrum plot')
    support.actual_file(root,plots[0])
    # Reuse the strict localized original boundary/probe contract. At least
    # two different containing geometries each have BOTH pinned raw models.
    boundary=decision.get('boundaryDecisionEvidence',{})
    if boundary.get('category')!='localized-connected-speech':
        raise ValueError('short decoder proof requires independent localized syllable-boundary/probe review')
    support.boundary_decision(row,decision,root)
    return dict(proof,actualFeatureBinsSHA256=feature_sha(bins),
                minimumObservedVoicedNucleusFrames16k=[min(x['sourceWindowFrames16k'][0]for x in voiced),max(x['sourceWindowFrames16k'][1]for x in voiced)] if voiced else None,
                actualObservedSyllableNuclei=nucleus_observations,
                independentlyValidatedBoundaryDecisionEvidence=boundary,
                allASRWarningsRetained=True,automaticProductionApproval=False)


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--repo-root',required=True,type=Path)
    p.add_argument('--candidates',required=True,type=Path);p.add_argument('--output',required=True,type=Path)
    args=p.parse_args();support=module();root=args.repo_root.resolve();d=json.loads(args.candidates.read_text())
    args.output.mkdir(parents=True,exist_ok=True)
    for row in d['targets']:
        pcm=support.original_pcm(root,row);first,last=row['sourceSampleRange16k'];bins=features(pcm,first,last)
        result={k:row[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')}
        result.update(sourceText=row['sourceZH'],id=row['id'],sampleRate=RATE,method=METHOD,featureBins=bins,
            featureBinsSHA256=feature_sha(bins),featureScriptSHA256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            sourcePronunciationCertified=False,phonemeCompletenessCertified=False,accepted=False,
            limitations=['F0/periodicity are observations. They do not identify a full phoneme, tone, source word or neighbor exclusion.'])
        name=re.sub(r'[^A-Za-z0-9_.-]','_',row['id'])+'-'+hashlib.sha256(str([first,last]).encode()).hexdigest()[:12]+'.json'
        (args.output/name).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'actualSyllableObservations':len(d['targets']),'automaticApprovals':0}))


if __name__=='__main__':main()
