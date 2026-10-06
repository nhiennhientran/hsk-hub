#!/usr/bin/env python3
"""Independently bind old fifteen strictly literal soleNS source/crop bytes."""
import hashlib, importlib.util, json, subprocess
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram

ROOT=Path(__file__).resolve().parents[3]
BASE=ROOT/'course-app/docs/final-quality-20261006'
INPUT=BASE/'audio-hsk2/closure-followup'
OUT=BASE/'audio-context-peer-hsk2-words/old15'
spec=importlib.util.spec_from_file_location('peer_checks',Path(__file__).with_name('qa-hsk1-peer-context-observations.py'))
shared=importlib.util.module_from_spec(spec);spec.loader.exec_module(shared)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def dump(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')

def main():
    selectedpath=INPUT/'current18-triple-literal-word-variants-strict-raw-v2-input.json'
    assert sha(selectedpath)=='85717a6019b46ef65c3dcc9bb7b6ba55868e0c247a5291257663e77716b6f17f'
    selected=json.loads(selectedpath.read_text())
    factpath=ROOT/selected['currentFactsFile'];assert sha(factpath)==selected['currentFactsSHA256']
    facts=json.loads(factpath.read_text());poolpath,pool=shared.pinned(facts['poolEvidence'])
    key=lambda r:(r['id'],tuple(r['sourceSampleRange16k']))
    rows={key(r):r for r in pool['targets']};frs={key(r):r for r in selected['factualSourceObservations']}
    featurepath=INPUT/'actual-phoneme-feature-index.json';assert sha(featurepath)=='daffa89461329818078b8af01fc133dfa61856653f64dd39e4561b3d2a6fd461'
    features={key(r):r for r in json.loads(featurepath.read_text())['targets']}
    plotpath=INPUT/'current-triple-words-source-plot-index.json';assert sha(plotpath)=='a2f3ffc16929d8686dd933439d77cfa894593118ac35c31f125b764fa86c1859'
    plots={}
    for p in json.loads(plotpath.read_text())['pages']:
        assert sha(ROOT/p['file'])==p['sha256']
        for i,r in enumerate(p['targets'],1):plots[key(r)]={**{k:p[k] for k in ['file','sha256']},'id':r['id'],'sourceSampleRange16k':r['sourceSampleRange16k'],'cropPCM_SHA256':r['cropPCM_SHA256'],'panelOrdinal':i}
    OUT.mkdir(parents=True,exist_ok=True);sources={};observations=[];ctcs=[]
    for prepared in selected['targets']:
        row=rows[key(prepared)];fact=frs[key(prepared)];first,last=row['sourceSampleRange16k']
        if row['sourceTrack'] not in sources:
            source=ROOT/'course-app/public'/row['sourceTrack'];assert sha(source)==row['sourceSHA256']
            raw=subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(source),'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True,check=True,timeout=30).stdout
            assert hashlib.sha256(raw).hexdigest()==row['sourcePCM_SHA256']
            sources[row['sourceTrack']]={'raw':raw,'pcm':np.frombuffer(raw,dtype='<f4'),'row':row,'targets':[]}
        s=sources[row['sourceTrack']];raw=s['raw'];pcm=s['pcm'];assert hashlib.sha256(raw[first*4:last*4]).hexdigest()==row['cropPCM_SHA256']
        _,sourcejson=shared.pinned(row['canonicalSource']);word=shared.pointer(sourcejson,row['canonicalSource']['sourceJSONPointer']);assert word['zh']==row['sourceZH'] and word['py']==row['sourcePinyin']
        heads=list(dict.fromkeys(x['sourceZH'] for x in fact['printedWordHeadsInSourceTrackOrder']));s['heads']=heads;s['pinyin']=[next(v['py'] for v in sourcejson['vocabulary'] if v['zh']==h) for h in heads]
        models=[]
        for e in row['rawModelEvidence']:
            path,value=shared.pinned(e);shared.unprompted(value)
            assert value['candidateId']==row['id'] and value['sourceSampleRange16k']==[first,last] and value['cropPCM_SHA256']==row['cropPCM_SHA256'] and value['originalSourceTrack']==row['sourceTrack'] and value['originalSourceSHA256']==row['sourceSHA256']
            transcript=''.join(z['text'] for z in value['rawSegments']);assert transcript==e['rawTranscript']
            basepath,base=shared.pinned({'file':value['deduplicatedRawASRFile'],'sha256':value['deduplicatedRawASRSHA256']});shared.unprompted(base)
            assert base['rawSegments']==value['rawSegments'] and base['cropPCM_SHA256']==row['cropPCM_SHA256']
            models.append({**ref(path),'actualInference':ref(basepath),'modelRepository':value['modelRepository'],'modelRevision':value['modelRevision'],
              'rawTranscriptRetainedVerbatim':transcript,'warningSegmentsRetained':[{'id':z['id'],'no_speech_prob':z.get('no_speech_prob'),'compression_ratio':z.get('compression_ratio')} for z in value['rawSegments']],
              'holdsUnchanged':e['holds'],'flagsUnchanged':e['flags']})
        ctcpath,ctc=shared.pinned(fact['independentCTCActualCropEvidence'])
        assert ctc['cropPCM_SHA256']==row['cropPCM_SHA256'] and ctc['actualInputSamples']==last-first and json.loads(ctc['rawResultString'])==ctc['rawResult']
        for k in ['expectedTextPromptUsed','hotwordsUsed','externalLanguageModelUsed','inverseTextNormalizationUsed','homophoneReplacementUsed','producerAlteredSourceSamples']:assert ctc[k] is False
        assert ctc['producerAddedSilenceFrames']==0
        ctcs.append({'id':row['id'],'sourceTrack':row['sourceTrack'],'sourceSHA256':row['sourceSHA256'],'sourcePCM_SHA256':row['sourcePCM_SHA256'],
          'sourceSampleRange16k':[first,last],'cropPCM_SHA256':row['cropPCM_SHA256'],'rawText':ctc['rawText'],'rawEvidence':ref(ctcpath),'nativeRawResultUnchanged':True,'CTCIsAuxiliaryNotPhonemeCertification':True})
        whole=[]
        for e in fact['wholeSourceUnpromptedEvidence']:
            path,value=shared.pinned(e);shared.unprompted(value)
            assert value.get('cropPCM_SHA256',value.get('track',{}).get('pcm',{}).get('sha256'))==row['sourcePCM_SHA256']
            transcript=''.join(z['text'] for z in value['rawSegments']);assert transcript==e['wholeSourceTranscript']
            whole.append({**ref(path),'modelRepository':value['modelRepository'],'modelRevision':value['modelRevision'],'rawTranscriptRetainedVerbatim':transcript,'rawTimestampOnlyAuxiliary':True})
        edges={name:shared.db(pcm[a:b]) for name,a,b in [('beforeStart',first-320,first),('afterStart',first,first+320),('beforeEnd',last-320,last),('afterEnd',last,last+320)]}
        assert all(v<=-45 for v in edges.values()) and all(abs(edges[k]-row['actualEdgeRMSDbFS20ms'][k])<.001 for k in edges)
        featurefile,feature=shared.pinned(features[key(row)]);assert feature['cropPCM_SHA256']==row['cropPCM_SHA256'] and feature['sourceSampleRange16k']==[first,last]
        target={'id':row['id'],'sourceText':row['sourceZH'],'sourcePinyin':row['sourcePinyin'],'sourceTrack':row['sourceTrack'],'sourceSHA256':row['sourceSHA256'],'sourcePCM_SHA256':row['sourcePCM_SHA256'],
          'sourceSampleRange16k':[first,last],'cropPCM_SHA256':row['cropPCM_SHA256'],'originalSourceSampleCount16k':len(pcm),'canonicalPrintedSource':row['canonicalSource'],
          'canonicalHeads':heads,'selectedHeadOrdinal0Based':heads.index(row['sourceZH']),'selectedRepetition1Based':row['repetition'],'actualFourEdgeRMSDbFS20ms':edges,
          'actualCropModelsRetained':models,'wholeSourceEvidence':whole,'actualSyllableFeatureEvidence':ref(featurefile),'actualFeatureVoicedBinCount':sum(v['voicedObservation'] for v in feature['featureBins']),
          'actualLocalWaveformSpectrum':plots[key(row)],'holdsUnchanged':row['holds'],'flagsUnchanged':row['flags'],'productionApproved':False,'humanListening':False,'nativeSpeakerReview':False,'fullPhonemeCertification':False}
        observations.append(target);s['targets'].append(target)
    pages=[];ordered=list(sources.values())
    for pageordinal,offset in enumerate(range(0,len(ordered),6),1):
        chunk=ordered[offset:offset+6];fig,axes=plt.subplots(len(chunk),2,figsize=(23,len(chunk)*2.9),squeeze=False)
        page=OUT/f'complete-old-strict-source-waveform-spectrum-{pageordinal:02}.png'
        for panel,s in enumerate(chunk):
            row=s['row'];pcm=s['pcm'];ax,sx=axes[panel]
            ax.plot(np.arange(len(pcm))/16000,pcm,lw=.4,color='#1d4052')
            f,t,p=spectrogram(pcm,fs=16000,nperseg=256,noverlap=192,scaling='spectrum')
            sx.pcolormesh(t,f,10*np.log10(np.maximum(p,1e-12)),vmin=-95,vmax=-20,cmap='magma',shading='auto');sx.set_ylim(0,6500)
            ax.set_title(f"Original {Path(row['sourceTrack']).name}; printed head py={' | '.join(s['pinyin'])}",fontsize=9)
            sx.set_title('Actual full original; green=reviewed candidate crops, not a phoneme certificate',fontsize=9)
            for v in s['targets']:
                for axis in (ax,sx):axis.axvspan(v['sourceSampleRange16k'][0]/16000,v['sourceSampleRange16k'][1]/16000,color='#22b573',alpha=.15)
            for axis in (ax,sx):axis.set_xlabel('Actual original seconds');axis.grid(alpha=.12);axis.tick_params(labelsize=8)
        fig.tight_layout();fig.savefig(page,dpi=110);plt.close(fig);pages.append(ref(page))
        for panel,s in enumerate(chunk,1):
            row=s['row'];data={k:row[k] for k in ['sourceTrack','sourceSHA256','sourcePCM_SHA256']}
            data.update({'sourceSampleCount16k':len(s['pcm']),'plots':[x['actualLocalWaveformSpectrum'] for x in s['targets']],
              'completeOriginalSourcePlot':{**ref(page),'panelOrdinal':panel},'newInferencePerformed':False,'sourceModified':False})
            wave=OUT/(Path(row['sourceTrack']).stem+'-actual-source-observations.json');dump(wave,data)
            for v in s['targets']:v['waveformObservation']=ref(wave);v['completeOriginalSourcePlot']=data['completeOriginalSourcePlot']
    ctcfile=OUT/'independently-verified-ctc-old15-word-readings.json'
    dump(ctcfile,{'schemaVersion':1,'status':'independent-CTC-bytes-source-frames-verified-not-approved','observations':ctcs,'inputEvidence':ref(selectedpath),
      'newInferencePerformed':False,'productionApproved':False,'humanListening':False,'fullPhonemeCertification':False})
    index=OUT/'old15-actual-original-observation-index.json'
    dump(index,{'schemaVersion':1,'status':'independent-actual-source-byte-observations-not-approval','sourceInputEvidence':ref(selectedpath),'pairedPoolEvidence':ref(poolpath),
      'featureIndexEvidence':ref(featurepath),'localPlotIndexEvidence':ref(plotpath),'scriptEvidence':ref(Path(__file__)),'targets':observations,
      'independentlyVerifiedCTCSupplementalEvidence':ref(ctcfile),'actualCompleteOriginalSourcePlots':pages,
      'counts':{'variants':15,'uniqueIDs':14,'originalSources':len(sources),'actualCropWhisperBindingsAndUnderlyingRaws':30},
      'newInferencePerformed':False,'originalSourceUnchanged':True,'proposalsModified':False,'productionApproved':False,
      'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False})
    print(json.dumps(ref(index)))
if __name__=='__main__':main()
