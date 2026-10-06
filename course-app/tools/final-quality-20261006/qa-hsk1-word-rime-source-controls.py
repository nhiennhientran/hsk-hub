#!/usr/bin/env python3
"""Read-only printed-word original two-reading scopes; no positive r assumption."""
import hashlib,importlib.util,json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006';OUT=BASE/'audio-context-peer-hsk1-spoken22'
IDS=['v-l05-lex-60f87a79fc-s1','v-l12-lex-326051ebb3-s1','v-l12-lex-b34e4ca734-s1','v-l15-lex-472ea91119-s1']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def main():
 report=BASE/'audio-review/hsk1-paired-full-03.json';rows={r['id']:r for r in json.loads(report.read_text())['targets']}
 sp=importlib.util.spec_from_file_location('word_rime_source_control',ROOT/'tools/final-quality-20261006/review-decisions.py');v=importlib.util.module_from_spec(sp);sp.loader.exec_module(v)
 fig,axes=plt.subplots(4,2,figsize=(24,13),squeeze=False);scopes=[]
 for i,identifier in enumerate(IDS):
  row=rows[identifier];raw=v.original_pcm(ROOT,row);pcm=np.frombuffer(raw,dtype='<f4');c=row['canonicalSource'];book=json.loads(v.actual_file(ROOT,c).read_text());obj=book
  for k in c['sourceJSONPointer'].lstrip('/').split('/'):obj=obj[int(k)]if isinstance(obj,list)else obj[k]
  audio=obj['audio'];a,b=max(0,round((audio['start']-.05)*16000)),min(len(pcm),round((audio['end']+.05)*16000));x=pcm[a:b]
  ax,sx=axes[i];ax.plot(np.arange(a,b)/16000,x,lw=.5);ax.set_title(identifier+' printed '+row['sourcePinyin']+' original controls, not r certified')
  f,t,p=spectrogram(x,fs=16000,nperseg=512,noverlap=448,nfft=1024,scaling='spectrum');sx.pcolormesh(t+a/16000,f,10*np.log10(np.maximum(p,1e-14)),vmin=-108,vmax=-28,cmap='magma',shading='auto');sx.set_ylim(0,5000)
  for axis in(ax,sx):axis.grid(alpha=.15);axis.set_xlabel('Original word-track seconds')
  scopes.append({**{k:row[k]for k in ('id','sourceZH','sourcePinyin','sourceTrack','sourceSHA256','sourcePCM_SHA256')},
   'canonicalPrintedSource':c,'legacyDeclaredWholeHeadWindow':audio,'actualSourceScopeFrames16k':[a,b],
   'actualSourceScopePCM_SHA256':hashlib.sha256(raw[a*4:b*4]).hexdigest(),'panelOrdinal':i+1,
   'legacyWindowNotAcceptedPhoneBoundary':True,'positiveRhoticReferenceCertification':False})
 page=OUT/'actual-original-printed-word-rime-controls.png';fig.tight_layout();fig.savefig(page,dpi=150);plt.close(fig)
 for r in scopes:r['actualOriginalSourcePlot']={**ref(page),'panelOrdinal':r['panelOrdinal']}
 path=OUT/'actual-original-word-rime-source-controls.json';path.write_text(json.dumps({'status':'actual-original-word-scopes-not-automatic-r-reference',
  'pairedReportEvidence':ref(report),'scriptEvidence':ref(Path(__file__)),'scopes':scopes,'newASR':False,'sourceSamplesChanged':False,
  'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False,'productionApproved':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps(ref(path)))
if __name__=='__main__':main()
