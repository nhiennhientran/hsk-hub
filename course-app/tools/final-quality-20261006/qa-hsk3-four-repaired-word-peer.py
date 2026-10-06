#!/usr/bin/env python3
"""Independent exact-byte/source/neighbor review for four repaired H3 crops."""
import hashlib,importlib.util,json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006';OUT=BASE/'audio-context-peer-hsk3-four-repaired-words'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def stats(pcm,a,b):
 x=pcm[a:b];return {'sourceSampleRange16k':[a,b],'actualPCM_SHA256':hashlib.sha256(x.tobytes()).hexdigest(),
  'rmsDbFS':20*np.log10(max(float(np.sqrt(np.mean(x*x))),1e-15)), 'sampleMean':float(x.mean()),'standardDeviation':float(x.std()),'originalSamplesUnaltered':True}
def main():
 OUT.mkdir(parents=True,exist_ok=True);report=BASE/'audio-review/hsk3-four-weak-repairs-paired-01.json';facts=BASE/'audio-hsk3/four-weak-boundary-repairs/producer-source-facts.json'
 assert sha(report)=='ff87dcff419d34e5d451863fa80291da968c511b4a64b8a6ba1872cc3c074156'
 assert sha(facts)=='91b2102d3458e4270c259f663e5924ed20f44019cd08973da4a54c8535345a5f'
 rows=json.loads(report.read_text())['targets'];producer={r['id']:r for r in json.loads(facts.read_text())['targets']}
 sp=importlib.util.spec_from_file_location('four_words_peer_support',ROOT/'tools/final-quality-20261006/review-decisions.py');v=importlib.util.module_from_spec(sp);sp.loader.exec_module(v)
 source={};observed=[]
 for row in rows:
  f=producer[row['id']];raw=v.original_pcm(ROOT,row);pcm=np.frombuffer(raw,dtype='<f4');a,b=row['sourceSampleRange16k'];assert hashlib.sha256(raw[a*4:b*4]).hexdigest()==row['cropPCM_SHA256']
  source[row['sourcePCM_SHA256']]=(row,pcm)
  model=[]
  for q in row['rawModelEvidence']:
   p=v.actual_file(ROOT,q);d=json.loads(p.read_text());v.unprompted(d);assert d['cropPCM_SHA256']==row['cropPCM_SHA256'] and d['sourceSampleRange16k']==[a,b]
   assert d['modelRepository']==q['modelRepository'] and d['modelRevision']==q['modelRevision'];dp=ROOT/d['deduplicatedRawASRFile'];assert sha(dp)==d['deduplicatedRawASRSHA256']
   orig=json.loads(dp.read_text());assert orig['cropPCM_SHA256']==row['cropPCM_SHA256'];v.unprompted(orig)
   text=''.join(x['text']for x in orig['rawSegments']);assert text==q['rawTranscript']
   model.append({**ref(p),'actualInference':ref(dp),'modelRepository':d['modelRepository'],'modelRevision':d['modelRevision'],'rawTranscript':text,
    'warningSegmentsUnchanged':[{'id':s['id'],'no_speech_prob':s['no_speech_prob'],'compression_ratio':s['compression_ratio']}for s in orig['rawSegments']]})
  whole=[]
  for q in f['originalWholeSourceEvidence']:
   p=v.actual_file(ROOT,q);d=json.loads(p.read_text());v.unprompted(d);assert d.get('cropPCM_SHA256',d.get('track',{}).get('pcm',{}).get('sha256'))==row['sourcePCM_SHA256'];assert ''.join(x['text']for x in d['rawSegments'])==q['rawTranscript']
   whole.append({**ref(p),'modelRepository':d['modelRepository'],'modelRevision':d['modelRevision'],'rawTranscriptRetainedVerbatim':q['rawTranscript'],'rawTimesAreAuxiliaryOnly':True})
  printed=v.actual_file(ROOT,row['canonicalSource']);book=json.loads(printed.read_text());obj=book
  for k in row['canonicalSource']['sourceJSONPointer'].lstrip('/').split('/'):obj=obj[int(k)]if isinstance(obj,list)else obj[k]
  assert obj['zh']==row['sourceZH'] and obj['py']==row['sourcePinyin'] and row['sourceTrack'].endswith('/'+str(obj['audioTrack'])+'.mp3')
  panel=v.actual_file(ROOT,f['fixedOriginalSourceWaveformSpectrumReference'])
  edge={label:stats(pcm,x,y)for label,(x,y)in {'beforeStart':(a-320,a),'afterStart':(a,a+320),'beforeEnd':(b-320,b),'afterEnd':(b,b+320)}.items()}
  for label,z in edge.items():assert abs(z['rmsDbFS']-row['actualEdgeRMSDbFS20ms'][label])<.01
  record={**{k:row[k]for k in ('id','sourceZH','sourcePinyin','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')},
   'canonicalPrintedSource':row['canonicalSource'],'actualCropModelEvidence':model,'wholeSourceEvidence':whole,'allFourOriginalEdgeWindows':edge,
   'actualOriginalSourcePanel':ref(panel),'holdsRetained':row['holds'],'flagsRetained':row['flags'],'sourceFreshDecodedIndependently':True}
  if row['id'].endswith('l13:word02'):
   record['twoIndependentActualOriginalPauseWindows']=[stats(pcm,62400,63680),stats(pcm,64960,66240)]
  observed.append(record)
 fig,axes=plt.subplots(3,2,figsize=(24,11),squeeze=False)
 for i,(row,pcm)in enumerate(source.values()):
  ax,sx=axes[i];ax.plot(np.arange(len(pcm))/16000,pcm,lw=.4);ax.set_title(row['sourceTrack']+' exact original full PCM')
  f,t,p=spectrogram(pcm,fs=16000,nperseg=512,noverlap=384,scaling='spectrum');sx.pcolormesh(t,f,10*np.log10(np.maximum(p,1e-14)),vmin=-105,vmax=-25,cmap='magma',shading='auto');sx.set_ylim(0,5000)
  for axis in(ax,sx):axis.grid(alpha=.16);axis.set_xlabel('Original seconds')
 page=OUT/'actual-three-complete-original-word-track-panels.png';fig.tight_layout();fig.savefig(page,dpi=140);plt.close(fig)
 for r in observed:r['actualCompleteOriginalSourcePanel']={**ref(page),'panelOrdinal':list(source).index(r['sourcePCM_SHA256'])+1}
 index=OUT/'four-repaired-word-independent-actual-observations.json';index.write_text(json.dumps({'status':'independent-original-byte-observations-not-approval','pairedReportEvidence':ref(report),
  'producerFactsEvidence':ref(facts),'scriptEvidence':ref(Path(__file__)),'targets':observed,'freshIndependentlyDecodedOriginalSources':3,
  'newASR':False,'originalSamplesChanged':False,'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,
  'fullPhonemeCertification':False,'productionApproved':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps(ref(index)))
if __name__=='__main__':main()
