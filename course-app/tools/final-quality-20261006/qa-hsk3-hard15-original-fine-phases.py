#!/usr/bin/env python3
"""Real fine source panels for two zero emissions and two text differences."""
import hashlib,importlib.util,json,shutil
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'course-app/docs/final-quality-20261006/audio-context-peer-hsk3-remaining-spoken-hard15'
OBS=OUT/'hard15-independent-actual-source-observations.json'
WINDOWS=[
 ('l02:text4:line4',34.70,35.85,'First original mama: actual medium zero at 34.96 is auxiliary only'),
 ('l11:text4:line1:sentence1',1.94,2.56,'Original Shanghai: actual medium zero at 2.30 is auxiliary only'),
 ('l07:text2:line5',14.38,15.78,'Complete first price and original pause before second price'),
 ('l07:text3:line1',2.70,3.96,'Same original utterance: first tian and final qian/tian difference'),
 ('l07:text3:line1',2.74,3.10,'Original first tian onset/rime as same-speaker local control'),
 ('l07:text3:line1',3.36,3.91,'Original final disputed qian/tian onset and complete tail'),
 ('l07:text3:line1',9.05,10.25,'Original seller price wu kuai qian yi gong jin control'),
]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def main():
 s=importlib.util.spec_from_file_location('hard15_fine_original',ROOT/'tools/final-quality-20261006/review-decisions.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
 obs={x['id']:x for x in json.loads(OBS.read_text())['targets']};facts=[];cache={};pages=[]
 for offset in (0,4):
  batch=WINDOWS[offset:offset+4];fig,axes=plt.subplots(len(batch),3,figsize=(23,len(batch)*3.0),squeeze=False)
  path=OUT/f'hard15-localized-original-source-phase-panels-{offset//4+1:02}.png'
  for i,(tail,start,end,caption)in enumerate(batch):
   t=obs['hsk3-fltrp-2026:'+tail];report=json.loads((ROOT/t['currentActualReportEvidence']['file']).read_text());r=next(x for x in report['targets']if x['id']==t['id'])
   pcm_bytes=cache.setdefault(t['sourceTrack'],m.original_pcm(ROOT,r));pcm=np.frombuffer(pcm_bytes,dtype='<f4');a,b=round(start*16000),round(end*16000);sig=pcm[a:b]
   ax=axes[i,0];ax.plot(np.arange(a,b)/16000,sig,lw=.65);ax.set_title(t['id']+'\n'+caption,fontsize=9);ax.set_xlabel('Actual original source seconds');ax.grid(alpha=.12)
   for sx,nper,step in [(axes[i,1],512,16),(axes[i,2],128,8)]:
    f,ts,power=spectrogram(sig,fs=16000,nperseg=nper,noverlap=nper-step,scaling='spectrum')
    sx.pcolormesh(ts+a/16000,f,10*np.log10(np.maximum(power,1e-12)),vmin=-95,vmax=-25,shading='auto',cmap='magma')
    sx.set_ylim(0,7000);sx.set_title(f'Actual {nper/16:.0f}ms STFT / {step/16:.1f}ms step; no word alignment',fontsize=9);sx.set_xlabel('Actual original source seconds');sx.grid(alpha=.12)
   facts.append({**{k:t[k]for k in ('id','candidateId','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')},
     'caption':caption,'actualSourceScopeFrames16k':[a,b],'actualSourceScopePCM_SHA256':hashlib.sha256(pcm_bytes[a*4:b*4]).hexdigest(),'plotPanelOrdinal':i+1,'pageNumber':offset//4+1})
  fig.tight_layout();fig.savefig(path,dpi=140);plt.close(fig)
  from PIL import Image
  Image.open(path).verify();pages.append(ref(path));shutil.copyfile(path,ROOT.parent/f'inspect-{path.name}')
 for f in facts:f['actualPlot']=pages[f['pageNumber']-1]
 p=OUT/'hard15-localized-original-source-phase-evidence.json';p.write_text(json.dumps({'status':'actual-source-phases-not-authority','scriptEvidence':ref(Path(__file__)),
  'sourceObservationEvidence':ref(OBS),'actualSourcePlots':pages,'targets':facts,'sourceModified':False,'newASR':False,'automaticApproval':False,
  'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(ref(p)))
if __name__=='__main__':main()
