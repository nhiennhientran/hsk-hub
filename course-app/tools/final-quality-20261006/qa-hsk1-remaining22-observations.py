#!/usr/bin/env python3
"""Fresh byte/source/panel evidence for 22 remaining original spoken H1 IDs."""
import hashlib,importlib.util,json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006'
OUT=BASE/'audio-context-peer-hsk1-spoken22'
def module(name,p):
    spec=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
shared=module('spoken22_actual_raw_checks',Path(__file__).with_name('qa-hsk1-peer-context-observations.py'))
support=module('spoken22_original_pcm',ROOT/'tools/final-quality-20261006/review-decisions.py')
syllable=module('spoken22_real_voiced_features',ROOT/'tools/final-quality-20261006/review-syllable-evidence.py')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def dump(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def plot_pair(axes,pcm,first,last,title,displayfirst=0,displaylast=None):
    displaylast=len(pcm)if displaylast is None else displaylast;clip=pcm[displayfirst:displaylast];ax,sx=axes
    ax.plot(np.arange(displayfirst,displaylast)/16000,clip,lw=.4,color='#1c3e52')
    f,t,p=spectrogram(clip,fs=16000,nperseg=256,noverlap=192,scaling='spectrum')
    sx.pcolormesh(t+displayfirst/16000,f,10*np.log10(np.maximum(p,1e-12)),vmin=-95,vmax=-20,cmap='magma',shading='auto');sx.set_ylim(0,6500)
    display_title=title.translate(str.maketrans({'？':'?','！':'!','。':'.','，':',','、':','}))
    ax.set_title(display_title,fontsize=9);sx.set_title(f'Actual integer original cut [{first},{last}]; machine spectrum, no native/tone certificate',fontsize=9)
    for axis in (ax,sx):axis.axvspan(first/16000,last/16000,color='#22b573',alpha=.15);axis.axvline(first/16000,color='#00aa66',lw=.6);axis.axvline(last/16000,color='#00aa66',lw=.6);axis.set_xlabel('Actual original seconds');axis.grid(alpha=.12);axis.tick_params(labelsize=8)
def main():
    handofffile=BASE/'audio-hsk1/remaining22-nonword-evidence-handoff.json';assert sha(handofffile)=='0665fef79a8e2423dd36ab978d19c49d581e858eb767c9a18dfecc00d8b848c3'
    handoff=json.loads(handofffile.read_text());OUT.mkdir(parents=True,exist_ok=True);decoded={};observations=[];sources={};geometries={}
    for entry in handoff['targets']:
        reportref=entry['exactOriginalMainModelReport'];_,report=shared.pinned(reportref);row=reportref['record'];matches=[r for r in report['targets']if r['id']==row['id']and r['sourceSampleRange16k']==row['sourceSampleRange16k']]
        assert len(matches)==1 and matches[0]==row
        track=row['sourceTrack'];raw=decoded.setdefault(track,support.original_pcm(ROOT,row));pcm=np.frombuffer(raw,dtype='<f4');a,b=row['sourceSampleRange16k']
        assert hashlib.sha256(raw).hexdigest()==row['sourcePCM_SHA256'] and hashlib.sha256(raw[a*4:b*4]).hexdigest()==row['cropPCM_SHA256']
        _,canon=shared.pinned(row['canonicalSource']);line=shared.pointer(canon,row['canonicalSource']['sourceJSONPointer']);assert line['zh']==row['canonicalSource']['parentZH'] and line['py']==row['sourcePinyin']
        whole=[]
        for e in entry['wholeSourceRawEvidence']:
            p,v=shared.pinned(e);shared.unprompted(v)
            assert v.get('cropPCM_SHA256',v.get('track',{}).get('pcm',{}).get('sha256'))==row['sourcePCM_SHA256']
            transcript=''.join(s.get('text','')for s in v['rawSegments'])
            whole.append({**ref(p),'modelRepository':v['modelRepository'],'modelRevision':v['modelRevision'],'rawTranscriptRetainedVerbatim':transcript,'rawTimestampNotPhonemeBoundary':True})
        assert whole
        models=[]
        for e in row['rawModelEvidence']:
            p,v=shared.pinned(e);shared.unprompted(v)
            assert v['candidateId']==row['id']and v['sourceSampleRange16k']==[a,b]and v['cropPCM_SHA256']==row['cropPCM_SHA256']and v['originalSourceTrack']==track and v['originalSourceSHA256']==row['sourceSHA256']
            transcript=''.join(s.get('text','')for s in v['rawSegments']);assert transcript==e['rawTranscript']
            bp,bv=shared.pinned({'file':v['deduplicatedRawASRFile'],'sha256':v['deduplicatedRawASRSHA256']});shared.unprompted(bv);assert bv['rawSegments']==v['rawSegments']and bv['cropPCM_SHA256']==row['cropPCM_SHA256']
            models.append({**ref(p),'actualInference':ref(bp),'modelRepository':v['modelRepository'],'modelRevision':v['modelRevision'],'rawTranscript':transcript,
             'warningSegmentsRetained':[{'id':s['id'],'no_speech_prob':s.get('no_speech_prob'),'compression_ratio':s.get('compression_ratio')}for s in v['rawSegments']],
             'holdsUnchanged':e['holds'],'flagsUnchanged':e['flags']})
        windows=[('beforeStart',a-320,a),('afterStart',a,a+320),('beforeEnd',b-320,b),('afterEnd',b,b+320)]
        edges={k:shared.db(pcm[x:y])if 0<=x<y<=len(pcm)else None for k,x,y in windows}
        assert all(v is None or v<=-45 for v in edges.values())
        ctc=None
        if entry['actualCTCSupplementalEvidence']:
            cp,cv=shared.pinned(entry['actualCTCSupplementalEvidence']);assert cv['cropPCM_SHA256']==row['cropPCM_SHA256']and cv['actualInputSamples']==b-a and json.loads(cv['rawResultString'])==cv['rawResult']
            assert cv['producerAddedSilenceFrames']==0
            for k in ['expectedTextPromptUsed','hotwordsUsed','externalLanguageModelUsed','inverseTextNormalizationUsed','homophoneReplacementUsed','producerAlteredSourceSamples']:assert cv[k]is False
            ctc={**ref(cp),'rawText':cv['rawText'],'modelRevision':cv['modelRevision'],'onlyAuxiliary':True}
        t={k:row[k]for k in ['id','unit','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']}
        t.update({'sourceText':row['sourceZH'],'sourcePinyin':row['sourcePinyin'],'canonicalPrintedSource':row['canonicalSource'],'originalSourceSampleCount16k':len(pcm),
          'actualFourEdgeRMSDbFS20ms':edges,'actualCropModelEvidence':models,'wholeSourceEvidence':whole,'actualCTCSupplementalEvidence':ctc,
          'holdsUnchanged':row['holds'],'flagsUnchanged':row['flags'],'noNewInference':True,'sourceOrProposalsModified':False,'productionApproved':False})
        observations.append(t);geometries.setdefault((track,a,b),[]).append(t);sources.setdefault(track,{'row':row,'targets':[]})['targets'].append(t)
        if set(row['holds'])=={'crop-ASR-hallucination-or-no-speech-warning'}:
            bins=syllable.features(raw,a,b);feature={k:t[k]for k in ['sourceText','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']}
            feature.update({'featureBins':bins,'featureBinsSHA256':syllable.feature_sha(bins),'method':'actual-original-PCM-normalized-autocorrelation-32ms-5ms-75-to-500Hz-energy-gated','fullPhonemeCertification':False,'pronunciationToneCertified':False,'productionApproved':False})
            name=OUT/'actual-features'/(row['id']+'.json');name.parent.mkdir(exist_ok=True);dump(name,feature);t['actualSyllableFeatureEvidence']=ref(name)
    geometrieslist=list(geometries.items());localpages=[]
    for offset in range(0,len(geometrieslist),5):
        batch=geometrieslist[offset:offset+5];fig,axes=plt.subplots(len(batch),2,figsize=(23,len(batch)*3.1),squeeze=False)
        page=OUT/f'actual-current-spoken-source-crop-panels-{offset//5+1:02}.png'
        for i,((track,a,b),aliases)in enumerate(batch):
            pcm=np.frombuffer(decoded[track],dtype='<f4');title=aliases[0]['id']+' '+aliases[0]['sourcePinyin']
            plot_pair(axes[i],pcm,a,b,title,max(0,a-16000),min(len(pcm),b+16000))
        fig.tight_layout();fig.savefig(page,dpi=110);plt.close(fig);localpages.append(ref(page))
        for i,(_,aliases)in enumerate(batch,1):
            for t in aliases:t['actualCurrentCropSourceSpectrum']={**ref(page),'id':t['id'],'sourceSampleRange16k':t['sourceSampleRange16k'],'cropPCM_SHA256':t['cropPCM_SHA256'],'panelOrdinal':i}
    sourceitems=list(sources.items());fullpages=[]
    for offset in range(0,len(sourceitems),6):
        batch=sourceitems[offset:offset+6];fig,axes=plt.subplots(len(batch),2,figsize=(23,len(batch)*2.9),squeeze=False);page=OUT/f'complete-original-spoken-source-panels-{offset//6+1:02}.png'
        for i,(track,s)in enumerate(batch):
            row=s['row'];a,b=row['sourceSampleRange16k'];plot_pair(axes[i],np.frombuffer(decoded[track],dtype='<f4'),a,b,Path(track).name+' complete ORIGINAL; first target printed py='+row['sourcePinyin'])
        fig.tight_layout();fig.savefig(page,dpi=110);plt.close(fig);fullpages.append(ref(page))
        for i,(track,s)in enumerate(batch,1):
            row=s['row'];wave={k:row[k]for k in ['sourceTrack','sourceSHA256','sourcePCM_SHA256']}
            wave.update({'sourceSampleCount16k':len(decoded[track])//4,'plots':[t['actualCurrentCropSourceSpectrum']for t in s['targets']],
             'completeOriginalSourcePlot':{**ref(page),'panelOrdinal':i},'sourceOrProposalsModified':False,'newInferencePerformed':False})
            path=OUT/(Path(track).stem+'-actual-source-observations.json');dump(path,wave)
            for t in s['targets']:t['waveformObservation']=ref(path);t['completeOriginalSourcePlot']=wave['completeOriginalSourcePlot']
    output=OUT/'remaining22-actual-original-observation-index.json'
    dump(output,{'schemaVersion':1,'status':'actual-source-raw-panel-observations-not-approval','inputEvidence':ref(handofffile),'scriptEvidence':ref(Path(__file__)),
      'targets':observations,'localPages':localpages,'completeOriginalSourcePages':fullpages,
      'counts':{'IDs':22,'geometries':len(geometries),'sourceTracks':len(sources),'soleNoSpeechIDs':6,'WhisperBindingAndUnderlyingRawPairs':44},
      'noNewInference':True,'sourceOrProposalsModified':False,'productionApproved':False,'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False})
    print(json.dumps(ref(output)))
if __name__=='__main__':main()
