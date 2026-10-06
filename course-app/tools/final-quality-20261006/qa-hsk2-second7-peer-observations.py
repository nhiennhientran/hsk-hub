#!/usr/bin/env python3
"""Independent actual-byte observations for seven new second-reading NS cases."""
import hashlib,importlib.util,json,subprocess
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006';INPUT=BASE/'audio-hsk2/closure-followup';OUT=BASE/'audio-context-peer-hsk2-words/second7'
spec=importlib.util.spec_from_file_location('peer_raw_checks',Path(__file__).with_name('qa-hsk1-peer-context-observations.py'));shared=importlib.util.module_from_spec(spec);spec.loader.exec_module(shared)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def main():
    poolpath=INPUT/'targeted-second41-tripleLiteralSoleNoSpeech-source-pool.json';assert sha(poolpath)=='d97cc69224b95d81a02f2f518ecd50ea19a70b59eeee0badd48392b129775c86';pool=json.loads(poolpath.read_text())
    featurepath=INPUT/'actual-phoneme-feature-index.json';assert sha(featurepath)=='daffa89461329818078b8af01fc133dfa61856653f64dd39e4561b3d2a6fd461';features={(r['id'],tuple(r['sourceSampleRange16k'])):r for r in json.loads(featurepath.read_text())['targets']}
    plotindex=INPUT/'new-second-words-source-plot-index.json';assert sha(plotindex)=='c4ad2168be883331ffcc3f7567ace6aefe49ffe5bd1c0a58b67d26be5fc10a17';plots={}
    for p in json.loads(plotindex.read_text())['pages']:
        assert sha(ROOT/p['file'])==p['sha256']
        for panel,r in enumerate(p['targets'],1):plots[r['id'],tuple(r['sourceSampleRange16k'])]={k:p[k] for k in ('file','sha256')}|{'id':r['id'],'sourceSampleRange16k':r['sourceSampleRange16k'],'cropPCM_SHA256':r['cropPCM_SHA256'],'panelOrdinal':panel}
    OUT.mkdir(parents=True,exist_ok=True);ctcs=[];observations=[];sourceplots=[]
    fig,axes=plt.subplots(7,2,figsize=(23,18),squeeze=False);page=OUT/'seven-complete-original-source-waveform-spectrum.png'
    for index,entry in enumerate(pool['targets']):
        row=entry['currentProducerPreflight'];prepared=entry['preparedCandidate'];source=ROOT/'course-app/public'/row['sourceTrack'];assert sha(source)==row['sourceSHA256']
        raw=subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(source),'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True,check=True,timeout=30).stdout;assert hashlib.sha256(raw).hexdigest()==row['sourcePCM_SHA256']
        pcm=np.frombuffer(raw,dtype='<f4');first,last=row['sourceSampleRange16k'];assert hashlib.sha256(raw[first*4:last*4]).hexdigest()==row['cropPCM_SHA256']
        sourcepath,sourcejson=shared.pinned(row['canonicalSource']);word=shared.pointer(sourcejson,row['canonicalSource']['sourceJSONPointer']);assert word['zh']==row['sourceZH'] and word['py']==row['sourcePinyin']
        models=[]
        for e in row['rawModelEvidence']:
            path,value=shared.pinned(e);shared.unprompted(value);assert value['candidateId']==row['id'] and value['sourceSampleRange16k']==[first,last] and value['cropPCM_SHA256']==row['cropPCM_SHA256'] and value['originalSourceTrack']==row['sourceTrack'] and value['originalSourceSHA256']==row['sourceSHA256']
            transcript=''.join(s['text'] for s in value['rawSegments']);assert transcript==e['rawTranscript']
            inference,base=shared.pinned({'file':value['deduplicatedRawASRFile'],'sha256':value['deduplicatedRawASRSHA256']});shared.unprompted(base);assert base['rawSegments']==value['rawSegments'] and base['cropPCM_SHA256']==row['cropPCM_SHA256']
            models.append({**ref(path),'actualInference':ref(inference),'modelRepository':value['modelRepository'],'modelRevision':value['modelRevision'],'rawTranscriptRetainedVerbatim':transcript,
                           'warningSegmentsRetained':[{'id':s['id'],'no_speech_prob':s.get('no_speech_prob'),'compression_ratio':s.get('compression_ratio')} for s in value['rawSegments']],
                           'holdsUnchanged':e['holds'],'flagsUnchanged':e['flags']})
        ctcpath,ctc=shared.pinned(entry['independentCTCActualCropEvidence']);assert ctc['cropPCM_SHA256']==row['cropPCM_SHA256'] and ctc['actualInputSamples']==last-first and ctc['rawText']==entry['independentCTCActualCropEvidence']['rawText'] and json.loads(ctc['rawResultString'])==ctc['rawResult']
        for key in ('expectedTextPromptUsed','hotwordsUsed','externalLanguageModelUsed','inverseTextNormalizationUsed','homophoneReplacementUsed','producerAlteredSourceSamples'):assert ctc[key] is False
        assert ctc['producerAddedSilenceFrames']==0
        ctcs.append({'id':row['id'],'sourceTrack':row['sourceTrack'],'sourceSHA256':row['sourceSHA256'],'sourcePCM_SHA256':row['sourcePCM_SHA256'],
                     'sourceSampleRange16k':[first,last],'cropPCM_SHA256':row['cropPCM_SHA256'],'rawText':ctc['rawText'],'rawEvidence':ref(ctcpath),'nativeRawResultUnchanged':True,'CTCIsAuxiliaryNotPhonemeCertification':True})
        whole=[]
        for e in prepared['sourceOccurrenceEvidence']['wholeSourceUnpromptedEvidence']:
            path,value=shared.pinned(e);shared.unprompted(value);assert value.get('cropPCM_SHA256',value.get('track',{}).get('pcm',{}).get('sha256'))==row['sourcePCM_SHA256'];transcript=''.join(s['text'] for s in value['rawSegments']);assert transcript==e['wholeSourceTranscript']
            whole.append({**ref(path),'modelRepository':value['modelRepository'],'modelRevision':value['modelRevision'],'rawTranscriptRetainedVerbatim':transcript,'rawTimestampOnlyAuxiliary':True})
        edges={name:shared.db(pcm[a:b]) for name,a,b in [('beforeStart',first-320,first),('afterStart',first,first+320),('beforeEnd',last-320,last),('afterEnd',last,last+320)]};assert all(v<=-45 for v in edges.values()) and all(abs(edges[k]-row['actualEdgeRMSDbFS20ms'][k])<.001 for k in edges)
        fr=features[row['id'],tuple([first,last])];fpath,fvalue=shared.pinned(fr);assert fvalue['cropPCM_SHA256']==row['cropPCM_SHA256'] and fvalue['sourceSampleRange16k']==[first,last] and fvalue['sourcePCM_SHA256']==row['sourcePCM_SHA256']
        ax,sx=axes[index];ax.plot(np.arange(len(pcm))/16000,pcm,lw=.4,color='#1d4052');f,t,p=spectrogram(pcm,fs=16000,nperseg=256,noverlap=192,scaling='spectrum');sx.pcolormesh(t,f,10*np.log10(np.maximum(p,1e-12)),vmin=-95,vmax=-20,cmap='magma',shading='auto');sx.set_ylim(0,6500)
        heads=prepared['sourceOccurrenceEvidence']['sourceHeads'];head_pinyin=[next(v['py'] for v in sourcejson['vocabulary'] if v['zh']==head) for head in heads]
        ax.set_title(f"{row['id']} {row['sourcePinyin']} complete original {Path(source).name}; printed py={' | '.join(head_pinyin)}",fontsize=9);sx.set_title('Actual entire source spectrum; green=current second reading; head order is not a phoneme certificate',fontsize=9)
        for axis in (ax,sx):axis.axvspan(first/16000,last/16000,color='#22b573',alpha=.2);axis.set_xlabel('Actual original seconds');axis.grid(alpha=.12);axis.tick_params(labelsize=8)
        local=plots[row['id'],tuple([first,last])]
        observations.append({'id':row['id'],'sourceText':row['sourceZH'],'sourcePinyin':row['sourcePinyin'],'sourceTrack':row['sourceTrack'],'sourceSHA256':row['sourceSHA256'],'sourcePCM_SHA256':row['sourcePCM_SHA256'],
                             'sourceSampleRange16k':[first,last],'cropPCM_SHA256':row['cropPCM_SHA256'],'originalSourceSampleCount16k':len(pcm),'canonicalPrintedSource':row['canonicalSource'],
                             'canonicalHeads':heads,'selectedHeadOrdinal0Based':prepared['sourceOccurrenceEvidence']['sourceHeadOrdinal']-1,'selectedRepetition1Based':2,
                             'actualFourEdgeRMSDbFS20ms':edges,'actualCropModelsRetained':models,'wholeSourceEvidence':whole,'actualSyllableFeatureEvidence':ref(fpath),
                             'actualFeatureVoicedBinCount':sum(b['voicedObservation'] for b in fvalue['featureBins']),'actualLocalWaveformSpectrum':local,'fullSourcePanelOrdinal':index+1,
                             'holdsUnchanged':row['holds'],'flagsUnchanged':row['flags'],'productionApproved':False,'humanListening':False,'nativeSpeakerReview':False,'fullPhonemeCertification':False})
        sourceplots.append({'sourceTrack':row['sourceTrack'],'sourceSHA256':row['sourceSHA256'],'sourcePCM_SHA256':row['sourcePCM_SHA256'],'sourceSampleCount16k':len(pcm),
                            'plots':[local],'fullSourcePanelOrdinal':index+1})
    fig.tight_layout();fig.savefig(page,dpi=110);plt.close(fig)
    for s in sourceplots:
        s['completeOriginalSourcePlot']=ref(page);s['newInferencePerformed']=False;s['sourceModified']=False
        name=OUT/(Path(s['sourceTrack']).stem+'-actual-source-observations.json');name.write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n')
        for r in observations:
            if r['sourceTrack']==s['sourceTrack']:r['waveformObservation']=ref(name);r['completeOriginalSourcePlot']={**ref(page),'panelOrdinal':s['fullSourcePanelOrdinal']}
    ctcfile=OUT/'independently-verified-ctc-seven-second-readings.json';ctcfile.write_text(json.dumps({'schemaVersion':1,'status':'independent-CTC-bytes-source-frames-verified-not-approved','observations':ctcs,
                'inputEvidence':ref(poolpath),'newInferencePerformed':False,'productionApproved':False,'humanListening':False,'fullPhonemeCertification':False},ensure_ascii=False,indent=2)+'\n')
    report={'schemaVersion':1,'status':'independent-actual-original-byte-observations-not-approval','sourcePoolEvidence':ref(poolpath),'featureIndexEvidence':ref(featurepath),'localPlotIndexEvidence':ref(plotindex),
            'scriptEvidence':ref(Path(__file__)),'targets':observations,'independentlyVerifiedCTCSupplementalEvidence':ref(ctcfile),'actualCompleteOriginalSourcePlot':ref(page),
            'counts':{'targets':7,'originalSources':7,'actualCropWhisperBindingsAndUnderlyingRaws':14},'newInferencePerformed':False,'originalSourceUnchanged':True,'proposalsModified':False,
            'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False,'productionApproved':False}
    index=OUT/'second7-actual-original-observation-index.json';index.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'file':str(index.relative_to(ROOT)),'sha256':sha(index)}))
if __name__=='__main__':main()
