#!/usr/bin/env python3
"""Six residual TEXT-only heads: immutable observations, never approval."""
import hashlib,importlib.util,json,subprocess
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006'
OUT=BASE/'audio-context-peer-hsk2-words/residual-six';ORDINALS=[3,61,79,86,89,93]
spec=importlib.util.spec_from_file_location('actual_peer_checks',Path(__file__).with_name('qa-hsk1-peer-context-observations.py'))
shared=importlib.util.module_from_spec(spec);spec.loader.exec_module(shared)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def dump(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def main():
    factsfile=BASE/'audio-hsk2/closure-followup/current173-source-frame-facts-v2.json'
    assert sha(factsfile)=='2e64fa8d8ea7a6b1d44f10ee906c8f23e51fadf264f3069155b7865e622caa95'
    facts=json.loads(factsfile.read_text());poolfile,pool=shared.pinned(facts['poolEvidence'])
    oldfile=BASE/'audio-context-peer-hsk2-words/actual-original-word-observation-index.json'
    assert sha(oldfile)=='993b5002a9b8af5c646350e7221468675f44c53c8d681cb13549a82b88bb2646'
    old=json.loads(oldfile.read_text());sources={s['sourceTrack']:s for s in old['originalSources']}
    OUT.mkdir(parents=True,exist_ok=True);targets=[];fig,axes=plt.subplots(6,2,figsize=(23,18),squeeze=False)
    fullfig,fullaxes=plt.subplots(6,2,figsize=(23,18),squeeze=False);fullpage=OUT/'six-complete-original-source-waveform-spectrum.png'
    page=OUT/'six-actual-source-target-and-neighbor-waveform-spectrum.png'
    for panel,i in enumerate(ORDINALS):
        fact=facts['targets'][i];row=pool['targets'][i];assert fact['poolOrdinal']==i and row['id']==fact['id']
        source=ROOT/'course-app/public'/row['sourceTrack'];assert sha(source)==row['sourceSHA256']
        raw=subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(source),'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True,check=True,timeout=30).stdout
        assert hashlib.sha256(raw).hexdigest()==row['sourcePCM_SHA256'];pcm=np.frombuffer(raw,dtype='<f4');a,b=row['sourceSampleRange16k']
        assert hashlib.sha256(raw[a*4:b*4]).hexdigest()==row['cropPCM_SHA256']
        _,sourcejson=shared.pinned(row['canonicalSource']);word=shared.pointer(sourcejson,row['canonicalSource']['sourceJSONPointer']);assert word['zh']==row['sourceZH'] and word['py']==row['sourcePinyin']
        whole=[]
        for evidence in fact['wholeSourceUnpromptedEvidence']:
            p,v=shared.pinned(evidence);shared.unprompted(v);assert v.get('cropPCM_SHA256',v.get('track',{}).get('pcm',{}).get('sha256'))==row['sourcePCM_SHA256']
            transcript=''.join(s['text'] for s in v['rawSegments']);assert transcript==evidence['wholeSourceTranscript']
            whole.append({**ref(p),'modelRepository':v['modelRepository'],'modelRevision':v['modelRevision'],'rawTranscriptRetainedVerbatim':transcript,'rawTimeNotPhonemeBoundary':True})
        models=[]
        for e in row['rawModelEvidence']:
            p,v=shared.pinned(e);shared.unprompted(v);assert v['sourceSampleRange16k']==[a,b] and v['cropPCM_SHA256']==row['cropPCM_SHA256'] and v['originalSourceTrack']==row['sourceTrack'] and v['originalSourceSHA256']==row['sourceSHA256']
            transcript=''.join(s['text'] for s in v['rawSegments']);assert transcript==e['rawTranscript']
            rp,rv=shared.pinned({'file':v['deduplicatedRawASRFile'],'sha256':v['deduplicatedRawASRSHA256']});shared.unprompted(rv);assert rv['rawSegments']==v['rawSegments']
            models.append({**ref(p),'actualInference':ref(rp),'rawTranscript':transcript,'modelRepository':v['modelRepository'],'modelRevision':v['modelRevision'],'holdsUnchanged':e['holds'],'flagsUnchanged':e['flags']})
        ctcpath,ctc=shared.pinned(fact['independentCTCActualCropEvidence']);assert ctc['cropPCM_SHA256']==row['cropPCM_SHA256'] and ctc['actualInputSamples']==b-a and json.loads(ctc['rawResultString'])==ctc['rawResult']
        assert ctc['producerAddedSilenceFrames']==0
        for k in ['expectedTextPromptUsed','hotwordsUsed','externalLanguageModelUsed','inverseTextNormalizationUsed','homophoneReplacementUsed','producerAlteredSourceSamples']:assert ctc[k] is False
        edges={name:shared.db(pcm[x:y])for name,x,y in [('beforeStart',a-320,a),('afterStart',a,a+320),('beforeEnd',b-320,b),('afterEnd',b,b+320)]};assert all(x<=-45 for x in edges.values())
        original=sources.get(row['sourceTrack'])
        if original:
            assert original['sourceSHA256']==row['sourceSHA256'] and original['sourcePCM_SHA256']==row['sourcePCM_SHA256']
            assert sha(ROOT/original['actualWholeSourceWaveformSpectrum']['file'])==original['actualWholeSourceWaveformSpectrum']['sha256']
        left=max(0,a-6400);right=min(len(pcm),b+24000);clip=pcm[left:right];ax,sx=axes[panel]
        ax.plot(np.arange(left,right)/16000,clip,lw=.5,color='#193b4e');f,t,p=spectrogram(clip,fs=16000,nperseg=256,noverlap=192,scaling='spectrum')
        sx.pcolormesh(t+left/16000,f,10*np.log10(np.maximum(p,1e-12)),vmin=-95,vmax=-20,cmap='magma',shading='auto');sx.set_ylim(0,6500)
        ax.set_title(f"pool {i} {row['sourcePinyin']} source {source.name}; actual first reading plus following original reading",fontsize=9)
        sx.set_title(f"actual integer frames [{a},{b}]; original PCM and model raw unchanged",fontsize=9)
        for axis in (ax,sx):axis.axvspan(a/16000,b/16000,color='#22b573',alpha=.17);axis.axvline(a/16000,color='#00a860',lw=.8);axis.axvline(b/16000,color='#00a860',lw=.8);axis.set_xlabel('Actual original seconds');axis.grid(alpha=.15)
        fax,fsx=fullaxes[panel];fax.plot(np.arange(len(pcm))/16000,pcm,lw=.4,color='#193b4e')
        ff,ft,fp=spectrogram(pcm,fs=16000,nperseg=256,noverlap=192,scaling='spectrum');fsx.pcolormesh(ft,ff,10*np.log10(np.maximum(fp,1e-12)),vmin=-95,vmax=-20,cmap='magma',shading='auto');fsx.set_ylim(0,6500)
        fax.set_title(f"{source.name} complete original; printed head py="+' | '.join(h['sourcePinyin']for h in fact['printedWordHeadsInSourceTrackOrder']),fontsize=9)
        fsx.set_title('Actual full original spectrum; printed order is auxiliary, not phoneme certification',fontsize=9)
        for axis in (fax,fsx):axis.axvspan(a/16000,b/16000,color='#22b573',alpha=.17);axis.set_xlabel('Actual original seconds');axis.grid(alpha=.15)
        targets.append({'poolOrdinal':i,**{k:row[k]for k in ['id','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']},'sourceText':row['sourceZH'],'sourcePinyin':row['sourcePinyin'],
          'actualOriginalSampleCount16k':len(pcm),'canonicalPrintedSource':row['canonicalSource'],'sourceGroupEvidence':whole[0],'fullOriginalSourceEvidence':whole,
          'printedHeadsInOriginalSourceOrder':fact['printedWordHeadsInSourceTrackOrder'],'originalReadingOrdinal':row['repetition'],'actualEdgeRMSDbFS20ms':edges,
          'actualCropModelEvidence':models,'actualCTCAuxiliaryOnly':{**ref(ctcpath),'rawText':ctc['rawText'],'modelRevision':ctc['modelRevision'],'notPhonemeOrTimestampCertification':True},
          'holdsUnchanged':row['holds'],'flagsUnchanged':row['flags'],
          'panelOrdinal':panel+1,'newInferencePerformed':False,'productionApproved':False})
    fig.tight_layout();fig.savefig(page,dpi=110);plt.close(fig)
    fullfig.tight_layout();fullfig.savefig(fullpage,dpi=110);plt.close(fullfig)
    for t in targets:
        t['actualSourceWaveformAndSpectrum']={**ref(page),'id':t['id'],'sourceSampleRange16k':t['sourceSampleRange16k'],'cropPCM_SHA256':t['cropPCM_SHA256'],'panelOrdinal':t['panelOrdinal']}
        t['actualCompleteOriginalSourceWaveformSpectrum']={**ref(fullpage),'panelOrdinal':t['panelOrdinal']}
    output=OUT/'residual-six-actual-observation-index.json'
    dump(output,{'status':'actual-source-and-raw-observations-not-approval','factsEvidence':ref(factsfile),'sourcePoolEvidence':ref(poolfile),'existingCompleteOriginalSourceEvidence':ref(oldfile),
      'scriptEvidence':ref(Path(__file__)),'targets':targets,'counts':{'targets':6,'actualSources':6,'WhisperBindingsAndUnderlyingActualRaws':12},
      'noNewInference':True,'sourceOrProposalsModified':False,'productionApproved':False,'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False})
    print(json.dumps(ref(output)))
if __name__=='__main__':main()
