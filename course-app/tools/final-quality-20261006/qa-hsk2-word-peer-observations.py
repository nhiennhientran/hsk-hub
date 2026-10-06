#!/usr/bin/env python3
"""Pin existing H2 word evidence and actual original PCM; never run ASR."""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram

ROOT=Path(__file__).resolve().parents[3]
BASE=ROOT/'course-app/docs/final-quality-20261006'
INPUT=BASE/'audio-hsk2/closure-followup'
OUT=BASE/'audio-context-peer-hsk2-words'
spec=importlib.util.spec_from_file_location('peer_raw_checks',Path(__file__).with_name('qa-hsk1-peer-context-observations.py'))
shared=importlib.util.module_from_spec(spec);spec.loader.exec_module(shared)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}

def main():
    facts_path=INPUT/'current173-source-frame-facts-v2.json'
    selection_path=INPUT/'pure-text-word-physical-scope-selection.json'
    plots_path=INPUT/'current-text-words-source-plot-index.json'
    pool_path=BASE/'audio-review/hsk2-remaining-171-source-followup-pool-01.json'
    for p,h in [(facts_path,'2e64fa8d8ea7a6b1d44f10ee906c8f23e51fadf264f3069155b7865e622caa95'),
                (selection_path,'74a9389ef93df1e79bccb781056a99fbcba09bf15a52d1b35fc6b1d9c3369b29'),
                (plots_path,'80c572e013aa27c92e1f7ea29f907d2b58f5588ba9750b6c0458aae52b0a5380'),
                (pool_path,'5d326e8eaf7ebfa9ad9f7304045defd99affaee396ff857a71513e9c94d606b5')]:assert sha(p)==h
    facts=json.loads(facts_path.read_text())
    selected=json.loads(selection_path.read_text())['poolOrdinals']
    rows=[r for r in facts['targets'] if r['poolOrdinal'] in selected]
    pool=json.loads(pool_path.read_text());paired_ref=pool['sourceReviewReport'];shared.pinned(paired_ref)
    local_plots={}
    for page in json.loads(plots_path.read_text())['pages']:
        assert sha(ROOT/page['file'])==page['sha256']
        for panel,target in enumerate(page['targets'],1):local_plots[target['ordinal']]={**page,'targets':None,'panelOrdinal':panel,'id':target['id'],'sourceSampleRange16k':target['sourceSampleRange16k'],'cropPCM_SHA256':target['cropPCM_SHA256']}
    assert len(rows)==len(local_plots)==71
    OUT.mkdir(parents=True,exist_ok=True)
    decoded={};observations=[];sources={}
    for row in rows:
        source=ROOT/'course-app/public'/row['sourceTrack']
        assert sha(source)==row['sourceSHA256']
        if row['sourceTrack'] not in decoded:
            raw=subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(source),'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True,check=True,timeout=30).stdout
            assert hashlib.sha256(raw).hexdigest()==row['sourcePCM_SHA256']
            decoded[row['sourceTrack']]=raw
        raw=decoded[row['sourceTrack']];pcm=np.frombuffer(raw,dtype='<f4');first,last=row['sourceSampleRange16k']
        assert len(pcm)==row['actualSourceFrames'] and hashlib.sha256(raw[first*4:last*4]).hexdigest()==row['cropPCM_SHA256']
        canonical_path,canonical_json=shared.pinned(row['canonicalPrintedSource'])
        word=shared.pointer(canonical_json,row['canonicalPrintedSource']['sourceJSONPointer'])
        assert word['zh']==row['sourceText'] and word['py']==row['sourcePinyin']==row['canonicalPrintedSource']['sourcePinyin']
        edge={name:shared.db(pcm[a:b]) for name,a,b in [('beforeStart',first-320,first),('afterStart',first,first+320),('beforeEnd',last-320,last),('afterEnd',last,last+320)]}
        assert first>=320 and last+320<=len(pcm) and all(v<=-45 for v in edge.values())
        for key,given in zip(edge,row['actualEdgeWindows']):assert abs(edge[key]-given['RMSDbFS'])<.001
        whole=[]
        for evidence in row['wholeSourceUnpromptedEvidence']:
            path,value=shared.pinned(evidence);shared.unprompted(value)
            full_pcm=value.get('cropPCM_SHA256',value.get('track',{}).get('pcm',{}).get('sha256'))
            assert full_pcm==row['sourcePCM_SHA256']
            assert evidence['sourceSampleRange16k']==[0,len(pcm)]
            transcript=''.join(v.get('text','') for v in value['rawSegments'])
            assert transcript==evidence['wholeSourceTranscript']
            whole.append({**ref(path),'modelRepository':value['modelRepository'],'modelRevision':value['modelRevision'],
                          'originalFullPCM_SHA256':full_pcm,'originalFullFrames16k':[0,len(pcm)],'rawTranscriptRetainedVerbatim':transcript,
                          'actualUnpromptedOptions':value['options'],'rawSourceHeadObservationsAuxiliaryOnly':evidence.get('sourceRawHeadObservations',[]),
                          'sourceModelMaySuppressRepetitions':True,'rawTimeNotPhonemeBoundary':True})
        models=[]
        for evidence in row['actualCropModelEvidence']:
            path,value=shared.pinned(evidence);shared.unprompted(value)
            assert value['cropPCM_SHA256']==row['cropPCM_SHA256'] and value['sourceSampleRange16k']==[first,last]
            assert value['candidateId']==row['id'] and value['originalSourceTrack']==row['sourceTrack'] and value['originalSourceSHA256']==row['sourceSHA256']
            transcript=''.join(v.get('text','') for v in value['rawSegments']);assert transcript==evidence['rawTranscript']
            rawref={'file':value['deduplicatedRawASRFile'],'sha256':value['deduplicatedRawASRSHA256']}
            rawpath,unbound=shared.pinned(rawref);shared.unprompted(unbound)
            assert unbound['cropPCM_SHA256']==row['cropPCM_SHA256'] and unbound['rawSegments']==value['rawSegments']
            models.append({**ref(path),'actualInference':ref(rawpath),'modelRepository':value['modelRepository'],'modelRevision':value['modelRevision'],
                           'rawTranscript':transcript,'options':value['options'],'rawHoldsUnchanged':evidence['holds'],'rawFlagsUnchanged':evidence['flags']})
        ctc_path,ctc=shared.pinned(row['independentCTCActualCropEvidence'])
        assert ctc['cropPCM_SHA256']==row['cropPCM_SHA256'] and ctc['actualInputSamples']==last-first
        assert ctc['rawText']==row['independentCTCActualCropEvidence']['rawText'] and ctc['producerAddedSilenceFrames']==0 and ctc['producerAlteredSourceSamples'] is False
        for key in ('expectedTextPromptUsed','hotwordsUsed','externalLanguageModelUsed','inverseTextNormalizationUsed','homophoneReplacementUsed'):assert ctc[key] is False
        for filekey,hashkey in [('scriptFile','scriptSHA256'),('provenanceFile','provenanceSHA256')]:assert sha(ROOT/ctc[filekey])==ctc[hashkey]
        original_observation=row['sourceOccurrenceEvidenceUnchanged']
        shared.pinned(original_observation)
        observations.append({'poolOrdinal':row['poolOrdinal'],'id':row['id'],'sourceText':row['sourceText'],'sourcePinyin':row['sourcePinyin'],
                             'sourceTrack':row['sourceTrack'],'sourceSHA256':row['sourceSHA256'],'sourcePCM_SHA256':row['sourcePCM_SHA256'],
                             'sourceSampleRange16k':[first,last],'cropPCM_SHA256':row['cropPCM_SHA256'],'actualOriginalSampleCount16k':len(pcm),
                             'canonicalPrintedSource':row['canonicalPrintedSource'],'sourceGroupEvidence':whole[0],
                             'fullOriginalSourceEvidence':whole,'printedHeadsInOriginalSourceOrder':row['printedWordHeadsInSourceTrackOrder'],
                             'originalOccurrenceObservationAuxiliaryOnly':original_observation,'originalReadingOrdinal':row['originalRepetition'],
                             'actualEdgeRMSDbFS20ms':edge,'actualAllFourEdgesBelowExistingMinus45DbFS':True,'actualCropModelEvidence':models,
                             'actualCTCAuxiliaryOnly':{**ref(ctc_path),'modelRevision':ctc['modelRevision'],'rawText':ctc['rawText'],'notPhonemeOrTimestampCertification':True},
                             'actualSourceWaveformAndSpectrum':local_plots[row['poolOrdinal']],'holdsUnchanged':row['holdsUnchanged'],'flagsUnchanged':row['flagsUnchanged'],
                             'noInferencePerformed':True,'nativeSpeakerReview':False,'humanListening':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False})
        source_data=sources.setdefault(row['sourceTrack'],{'sourceTrack':row['sourceTrack'],'sourceSHA256':row['sourceSHA256'],'sourcePCM_SHA256':row['sourcePCM_SHA256'],
                                         'originalFrames16k':[0,len(pcm)],'printedHeads':row['printedWordHeadsInSourceTrackOrder'],'fullOriginalSourceEvidence':whole,'ids':[],'poolOrdinals':[]})
        source_data['ids'].append(row['id']);source_data['poolOrdinals'].append(row['poolOrdinal'])
    pages=[];source_list=list(sources.values())
    for offset in range(0,len(source_list),7):
        batch=source_list[offset:offset+7];fig,axes=plt.subplots(len(batch),2,figsize=(21,len(batch)*2.3),squeeze=False)
        page=OUT/f'whole-original-word-sources-{offset//7+1:02d}.png'
        for index,source in enumerate(batch):
            pcm=np.frombuffer(decoded[source['sourceTrack']],dtype='<f4');ax,sx=axes[index]
            ax.plot(np.arange(len(pcm))/16000,pcm,lw=.35,color='#203847')
            f,t,p=spectrogram(pcm,fs=16000,nperseg=256,noverlap=192,scaling='spectrum')
            sx.pcolormesh(t,f,10*np.log10(np.maximum(p,1e-12)),shading='auto',cmap='magma',vmin=-95,vmax=-20);sx.set_ylim(0,6500)
            heads=' | '.join(h['sourcePinyin'] for h in source['printedHeads'])
            ax.set_title(f"{Path(source['sourceTrack']).name} entire original PCM; printed head sequence: {heads}",fontsize=8)
            sx.set_title('Actual original spectrum; green spans are current selected crop bytes, not an automatic approval',fontsize=8)
            for row in observations:
                if row['sourceTrack']!=source['sourceTrack']:continue
                a,b=np.array(row['sourceSampleRange16k'])/16000
                for axis in (ax,sx):axis.axvspan(a,b,color='#22b573',alpha=.14)
                ax.text(a,.82*max(abs(pcm)),str(row['poolOrdinal']),fontsize=7)
            for axis in (ax,sx):axis.set_xlabel('Actual original seconds');axis.tick_params(labelsize=7);axis.grid(alpha=.12)
            source['fullSourcePagePanelOrdinal']=index+1
        fig.tight_layout();fig.savefig(page,dpi=110);plt.close(fig)
        pages.append({**ref(page),'sourceTracks':[s['sourceTrack'] for s in batch]})
        for source in batch:source['actualWholeSourceWaveformSpectrum']={**ref(page),'panelOrdinal':source['fullSourcePagePanelOrdinal']}
    report={'schemaVersion':1,'status':'actual-byte-observations-not-semantic-approval','reviewer':'/root/acceptance_scope_plan',
            'factsEvidence':ref(facts_path),'selectionEvidence':ref(selection_path),'sourcePoolEvidence':ref(pool_path),'pairedReviewReportEvidence':paired_ref,
            'producerLocalPlotIndexEvidence':ref(plots_path),'scriptEvidence':ref(Path(__file__)),
            'counts':{'uniqueIDs':len(observations),'originalTracks':len(decoded),'exactGeometries':len({(r['sourceTrack'],tuple(r['sourceSampleRange16k'])) for r in observations}),
                      'sourceLocalPages':9,'sourceFullPages':len(pages),'actualPinnedCropWhisperBindings':len(observations)*2},
            'targets':observations,'originalSources':source_list,'fullSourcePages':pages,'newInferencePerformed':False,'originalSamplesAltered':False,'proposalsModified':False,
            'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False,'productionApproved':False}
    path=OUT/'actual-original-word-observation-index.json';path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'file':str(path.relative_to(ROOT)),'sha256':sha(path),'counts':report['counts']}))

if __name__=='__main__':main()
