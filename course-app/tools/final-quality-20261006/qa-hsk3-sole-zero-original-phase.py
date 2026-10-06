#!/usr/bin/env python3
"""Actual source phase and preserved decoder index, no inference or approval."""
import importlib.util,json,hashlib
from pathlib import Path
import matplotlib;matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram
ROOT=Path(__file__).resolve().parents[3];B=ROOT/'course-app/docs/final-quality-20261006';O=B/'audio-context-peer-hsk3-optional-r'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def loadmodule(name,p):s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
m=loadmodule('solezero_actual_pcm',ROOT/'tools/final-quality-20261006/review-decisions.py');rfile=B/'audio-review/hsk3-paired-full-03.json';r=next(z for z in json.loads(rfile.read_text())['targets']if z['id']=='hsk3-fltrp-2026:l16:text3:line1');raw=m.original_pcm(ROOT,r);pcm=np.frombuffer(raw,dtype='<f4');fig,axes=plt.subplots(3,2,figsize=(22,9.7));windows=[(.62,5.43),(1.66,2.32),(3.08,3.87)]
rows=[]
for i,(start,end)in enumerate(windows):
 a,z=round(start*16000),round(end*16000);x=pcm[a:z];ax,sx=axes[i];ax.plot(np.arange(a,z)/16000,x,lw=.55);f,t,p=spectrogram(x,fs=16000,nperseg=512,noverlap=496,scaling='spectrum');sx.pcolormesh(t+a/16000,f,10*np.log10(np.maximum(p,1e-12)),vmin=-95,vmax=-25,shading='auto',cmap='magma');sx.set_ylim(0,6000)
 for yy in [ax,sx]:yy.set_xlabel('Actual original source seconds');yy.grid(alpha=.15)
 ax.set_title(['Complete ORIGINAL panda utterance core, original sentence cut [.2499375,5.58]','ORIGINAL first yi/hui sequence; physical spectrum not model timestamps','ORIGINAL second yi/hui sequence; preserved medium ZERO yi timestamp =3.4699375 absolute'][i],fontsize=10)
 if i==2:
  for yy in [ax,sx]:yy.axvline(3.4699375,color='green',label='medium retained zero timestamp AUX, not boundary');yy.legend(fontsize=7)
 rows.append({'sourceSampleRange16k':[a,z],'observedPCM_SHA256':hashlib.sha256(raw[a*4:z*4]).hexdigest(),'plotPanelOrdinal':i+1})
fig.tight_layout();png=O/'sole-zero-original-yi-hui-physical-phases.png';fig.savefig(png,dpi=120);plt.close(fig)
from PIL import Image
Image.open(png).verify()
o={'status':'actual-source-physical-phases-and-retained-decoder-diagnostic-not-approval','identity':{k:r[k]for k in ['id','candidateId','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']},'currentReportEvidence':ref(rfile),'plotEvidence':ref(png),'windows':rows,'actualMediumZeroWordIndex':11,'actualMediumZeroWord':r['rawModelEvidence'][1]['words'][11],'zeroWordAbsoluteSourcePositionAuxiliaryOnly':3.4699375,'actualSmallSameWord':r['rawModelEvidence'][0]['words'][11],'noNewInference':True,'scriptEvidence':ref(Path(__file__)),'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False,'productionApproved':False}
q=O/'sole-zero-original-yi-hui-physical-phases.json';q.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n');print(ref(q))
