#!/usr/bin/env python3
"""Reproduce harmonic observations for explicitly fixed original source nuclei.

This does not identify a phoneme or certify F0/tone. Source/onset/rime/final,
printed occurrence and paired containing probes remain independently required.
The existing voiced-bin method and all its failed observations remain intact.
"""
import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
from scipy.signal import find_peaks

METHOD='fixed-original-nucleus-80ms-hann-spectral-three-harmonics-v1'
SCOPES={
 'v-l04-lex-501367f953-s1': ('2df2a5cedd55bb39cd3217b3','new-hsk1/hsk1/audio/10-5.mp3','d3a9b907316cbf9c4246e950e7b664640c269cf79b6e7cbd5b204b2459b62743',(68240,71760),'43a502060970b9c84ccc35dd2d1886c3a0b9963187841f06aee21cb1d7a39132',(69040,71520)),
 'v-l04-lex-aa107f05b6-s1': ('a45a20efcbde78b7416208d0','new-hsk1/hsk1/audio/3-7.mp3','d74473c7bad006a4ec9f00c90cf8bb57b5cd861c2af78c2a65477252b90d8043',(54400,63760),'3d9782b7e6c75664b1c527c8521ab78d1f2c09308fb52dc9b557e75191e32e2b',(60000,63680)),
 'v-l08-lex-073d852840-s1': ('ba608e2156c235005882d866','new-hsk1/hsk1/audio/8-4.mp3','7a70b8a953038715f5cace793b2aae702852ab7ff4da38789c2b024d52cc8829',(136000,150240),'27489497c116881dcf60567a10f54035419cdbe597413170e73644a64e16a733',(140128,146672)),
 'v-l09-lex-a5b467a9c9-s1': ('7fc35269dbb3657c660ecf81','new-hsk1/hsk1/audio/9-2.mp3','eef902211863227dcd7bc8d9661c25995cb1db3dc4c1bdcd2f47f569e4c874da',(6880,22720),'9e8a0b7d21aa41fb9d496ad1b1d8c4e3663ac075f7d2e2d8115fdcde1de7da66',(18656,21680)),
 'v-l13-lex-a682cf4c9c-s1': ('951de10f2b79f6390680ba27','new-hsk1/hsk1/audio/13-2.mp3','0a859e84ffeb42fed429115d5cddf87d64cbe5d5d39b7d81662d4a25e6d7332f',(242880,260480),'de4272e5e2fc5033d9d654043503bdcea0b9eacd38d21d2b444a201f4707a4b7',(254352,257248)),
 'hsk3-fltrp-2026:l14:word01': ('6b7536c68e2abe15deff5433','course-assets/hsk3/audio/14-2.mp3','9919bb96a2142003c765addaac251812d7ae817a86a6284ea1fa4b95b27b4771',(0,23201),'8590018dded08c4fad9c9cbb9675d493ff09c88ee45c2cc6027d7a6265fb4cdb',(14240,19840)),
 'hsk3-fltrp-2026:l10:word03': ('f51f5cf3dac0c4e8a9e26c2b','course-assets/hsk3/audio/10-2.mp3','b2f3f66a9cd03e650c2311b6bbb761604f923dacdb98b6bdad37f85fd2c6397c',(91360,106880),'a0f929aa9f9193e59840f8433a7e372cb0bb681f41252552f7a5d6481d548ba4',(93440,97600)),
 'hsk3-fltrp-2026:l12:word06': ('2dda5e65e592392b8f1f3399','course-assets/hsk3/audio/12-2.mp3','efa7694877fbda2a7a67c362f8cf2da898c6f13a5ee022ca8bdd551dd0b0febc',(186720,201280),'c506c229d3993a93b9f9740b6503aa827c009915518ab41b23195a5f15289e14',(195520,196960)),
 'hsk3-fltrp-2026:l13:word15': ('08173d2dbae15bb447c17347','course-assets/hsk3/audio/13-6.mp3','3c891959d007b2ca76c55809acf5a2669f2fd18e2ea9e02b1b2a52f37e112b5a',(45120,61441),'2d2cc8d43a83103da50aa9f57f5575f79a74e2d52ea203111f76e069bbd59241',(47040,50400)),
 'hsk2-fltrp-2026:l02:word04': ('75369ab48f478ec1823db1e2','course-assets/hsk2/audio/2-2.mp3','acb688b3cd2f74cabea57ae04e84ab069abeb83a4639274e32d62975cb5bd497',(133632,147120),'ac915f51b10126313b5dfb4435e9f31671e9d300cccd9a51430ce37c0193882a',(136480,141280)),
}
ADDITIONAL_SOURCE_PHYSICAL_SCOPES={
 'v-l08-lex-073d852840-s1':'449407dd0205926cd00f52bc8d4f9a1fbeb7b222da3ebd799e4d4ae75ce2fcaa',
 'v-l09-lex-a5b467a9c9-s1':'449407dd0205926cd00f52bc8d4f9a1fbeb7b222da3ebd799e4d4ae75ce2fcaa',
 'v-l13-lex-a682cf4c9c-s1':'449407dd0205926cd00f52bc8d4f9a1fbeb7b222da3ebd799e4d4ae75ce2fcaa',
 'hsk3-fltrp-2026:l14:word01':'7d14e8f4c121096b70e40692f1214727668127ae1d6d03dff0f0af55b4d60b07',
 'hsk3-fltrp-2026:l10:word03':'3180577334f83dff9a3b41331d6e29cb8c95711310bafaec19305a40ceab0068',
 'hsk3-fltrp-2026:l12:word06':'3180577334f83dff9a3b41331d6e29cb8c95711310bafaec19305a40ceab0068',
 'hsk3-fltrp-2026:l13:word15':'3180577334f83dff9a3b41331d6e29cb8c95711310bafaec19305a40ceab0068',
 'hsk2-fltrp-2026:l02:word04':'1af15d37e057d8760b05c268672e611613196c26bed90ea044ccd54438a9546b',
}
# These are explicit original-source observations, not a general shorter gate.
PINNED_HARMONIC_WINDOW_RUNS={'hsk3-fltrp-2026:l10:word03': [93440,93760]}
SINGLE_ORIGINAL_80MS_NUCLEUS={'hsk3-fltrp-2026:l12:word06'}


def scope(row):
    expected=SCOPES.get(row['id'])
    actual=(row.get('candidateId'),row['sourceTrack'],row['sourceSHA256'],tuple(row['sourceSampleRange16k']),row['cropPCM_SHA256'])
    if expected is None or actual!=expected[:5]:
        raise ValueError('actual-spectrum alternative is limited to the exact independently reviewed source crops')
    return expected[-1]


def observations(pcm,a,b):
    values=np.frombuffer(pcm,dtype='<f4');windows=[]
    freqs=np.fft.rfftfreq(8192,1/16000)
    for first in range(a,b-1280+1,320):
        raw=values[first:first+1280].astype('f8')
        rms=20*np.log10(max(float(np.sqrt(np.mean(raw*raw))),1e-12))
        x=raw-float(raw.mean())
        spectrum=np.abs(np.fft.rfft(x*np.hanning(1280),8192))
        db=20*np.log10(np.maximum(spectrum,1e-12))
        peaks,_=find_peaks(db,prominence=3)
        maximum=float(np.max(db[(freqs>=75)&(freqs<=1600)]))
        peaks=[int(k)for k in peaks if 75<=freqs[k]<=1600 and db[k]>=maximum-30]
        triples=[]
        for k in peaks:
            f0=float(freqs[k])
            if f0>500:continue
            selected=[k]
            for harmonic in (2,3):
                choices=[p for p in peaks if p not in selected and abs(float(freqs[p])-harmonic*f0)/(harmonic*f0)<=.08]
                if not choices:break
                selected.append(min(choices,key=lambda p:abs(float(freqs[p])-harmonic*f0)))
            if len(selected)==3:
                triples.append([{'fftBin':p,'frequencyHz':round(float(freqs[p]),6),'amplitudeDb':round(float(db[p]),6)}for p in selected])
        windows.append({'sourceWindowFrames16k':[first,first+1280],
            'actualPCM_SHA256':hashlib.sha256(pcm[first*4:(first+1280)*4]).hexdigest(),
            'rmsDbFS':round(float(rms),6),'actualThreeHarmonicObservations':triples,
            'harmonicNucleusObservation':bool(rms>=-45 and triples)})
    return windows


def validate(row,proof,root,support,nuclei):
    a,b=scope(row)
    if nuclei!=[[a,b]]:
        raise ValueError('fixed nucleus spectrum cannot replace another component range')
    support.actual_identity(row,proof,'fixed-actual-nucleus-spectrum')
    if row['id']in ADDITIONAL_SOURCE_PHYSICAL_SCOPES:
        reference=proof.get('independentlyReviewedSourcePhysicalEvidence',{})
        if reference.get('sha256')!=ADDITIONAL_SOURCE_PHYSICAL_SCOPES[row['id']]:
            raise ValueError('fixed source nucleus requires its exact independent physical decision')
        signed=json.loads(support.actual_file(root,reference).read_text())
        matching=[d for d in signed.get('decisions',[])if d.get('id')==row['id']and d.get('sourceSampleRange16k')==row['sourceSampleRange16k']]
        if len(matching)!=1:
            raise ValueError('fixed source nucleus physical decision is not this exact ID/frame')
        physical=matching[0].get('shortSyllableDecoderDecisionEvidence',{})
        support.actual_identity(row,physical,'fixed-nucleus-independent-source')
        if physical.get('phonemeIdentityIsKnownForThisExactSourceOccurrence')is not True or physical.get('actualOriginalSyllableWaveformAndSpectrumReviewed')is not True:
            raise ValueError('fixed nucleus cannot replace unknown source phonemes')
    if proof.get('category')!='fixed-ID-original-nucleus-spectrum-proxy-review':
        raise ValueError('actual spectrum requires a separate fixed-ID proxy category')
    for key in ('nucleusPhaseIndependentlyReviewed','actualThreeHarmonicSourceSpectrumReviewed','F0GateAndOriginalBinsUnchanged','noToneOrPhonemeCertificationClaimed'):
        if proof.get(key)is not True:raise ValueError('fixed nucleus spectrum lacks independent actual source observation')
    if not proof.get('explanation'):raise ValueError('fixed nucleus spectrum needs concrete actual nucleus explanation')
    data=json.loads(support.actual_file(root,proof.get('actualSpectrumObservation',{})).read_text())
    support.actual_identity(row,data,'actual-nucleus-spectrum-observation')
    if data.get('method')!=METHOD or data.get('nucleusSampleRange16k')!=[a,b]:
        raise ValueError('actual nucleus spectrum method/range differs')
    actual=observations(support.original_pcm(root,row),a,b)
    if data.get('windows')!=actual:
        raise ValueError('actual harmonic frequencies/windows do not reproduce the immutable original PCM')
    all_qualifying=[x for x in actual if x['harmonicNucleusObservation']]
    qualifying=all_qualifying
    if proof.get('singleOriginal80msNucleusLimitedScope')and row['id']not in SINGLE_ORIGINAL_80MS_NUCLEUS:
        raise ValueError('single-window nucleus review is not authorized for another source')
    if proof.get('reviewedHarmonicSourceWindowStarts16k')is not None and row['id']not in PINNED_HARMONIC_WINDOW_RUNS:
        raise ValueError('a selected harmonic run is not authorized for another source')
    if row['id']in PINNED_HARMONIC_WINDOW_RUNS:
        starts=PINNED_HARMONIC_WINDOW_RUNS[row['id']]
        if proof.get('reviewedHarmonicSourceWindowStarts16k')!=starts:
            raise ValueError('only the explicitly reviewed original harmonic run is authorized')
        qualifying=[x for x in all_qualifying if x['sourceWindowFrames16k'][0]in starts]
        if [x['sourceWindowFrames16k'][0]for x in qualifying]!=starts:
            raise ValueError('the fixed original run is not actually harmonic')
    minimum=2
    if row['id']in SINGLE_ORIGINAL_80MS_NUCLEUS:
        if proof.get('singleOriginal80msNucleusLimitedScope')is not True:
            raise ValueError('this exact 90ms source nucleus needs its separate single-80ms review')
        minimum=1
    if len(qualifying)<minimum or any(y['sourceWindowFrames16k'][0]-x['sourceWindowFrames16k'][0]!=320 for x,y in zip(qualifying,qualifying[1:])):
        raise ValueError('fixed nucleus lacks two contiguous actual 80ms harmonic observations')
    span=[qualifying[0]['sourceWindowFrames16k'][0],qualifying[-1]['sourceWindowFrames16k'][1]]
    if span[1]-span[0]<1280:raise ValueError('actual harmonic nucleus is shorter than 80ms')
    return dict(proof,actualHarmonicNucleusSourceExtent16k=span,
        actualHarmonicWindows=len(qualifying),originalVoicedProxyThresholdsUnchanged=True,
        allActualQualifyingHarmonicWindows=len(all_qualifying),
        originalTwoWindowPolicyUnchangedOutsideExactSingle80msScope=True,
        automaticApproval=False,pronunciationToneCertified=False)


def main():
    spec=importlib.util.spec_from_file_location('source_support',Path(__file__).with_name('review-decisions.py'))
    support=importlib.util.module_from_spec(spec);spec.loader.exec_module(support)
    root=Path.cwd();base=Path('course-app/docs/final-quality-20261006/audio-review')
    report=json.loads((base/'hsk1-numeral13-paired-02.json').read_text())
    for row in report['targets']:
        if row['id']not in SCOPES:continue
        a,b=scope(row);pcm=support.original_pcm(root,row)
        data={k:row[k]for k in ('id','candidateId','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')}
        data.update(sourceText=row['sourceZH'],method=METHOD,nucleusSampleRange16k=[a,b],windows=observations(pcm,a,b),
            sourceSamplesAltered=False,analysisWindowOnly=True,originalVoicedProxyThresholdsUnchanged=True,
            automaticApproval=False,phonemeCompletenessCertified=False,pronunciationToneCertified=False)
        p=base/f"{row['candidateId']}-actual-nucleus-spectrum-01.json"
        p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps({'sourceText':row['sourceZH'],'qualifyingWindows':sum(x['harmonicNucleusObservation']for x in data['windows']),'file':str(p)}))


if __name__=='__main__':main()
