"""Fresh original-source observations for two printed-name utterances."""
import hashlib,importlib.util,json,pathlib
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
ROOT=pathlib.Path(__file__).resolve().parents[2]
BASE=ROOT/'course-app/docs/final-quality-20261006/audio-hsk2/closure-followup'
OUT=ROOT/'course-app/docs/final-quality-20261006/audio-root-peer-hsk2-names'
REPORT=ROOT/'course-app/docs/final-quality-20261006/audio-review/hsk2-paired-full-01.json'
SCOPES={120:(30.0,31.0),123:(2.72,3.5),118:(20.5,21.7)}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def checked(r):
 p=ROOT/r['file'];assert sha(p)==r['sha256'];return json.loads(p.read_text())
def module(name,file):
 s=importlib.util.spec_from_file_location(name,pathlib.Path(__file__).with_name(file));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def main():
 OUT.mkdir(parents=True,exist_ok=True);support=module('root_h2_name_support','review-decisions.py');syllable=module('root_h2_name_pointer','review-syllable-evidence.py');facts=json.loads((BASE/'current173-source-frame-facts-v2.json').read_text())['targets'];rows=json.loads(REPORT.read_text())['targets'];records=[]
 for ordinal,scope in SCOPES.items():
  f=facts[ordinal];report=ROOT/'course-app/docs/final-quality-20261006/audio-review/hsk2-meaningful-eleven-paired-02.json' if ordinal==118 else REPORT;selected_rows=json.loads(report.read_text())['targets'];r=next(t for t in selected_rows if t['id']==f['id'] and t['sourceSampleRange16k']==f['sourceSampleRange16k']);s,e=r['sourceSampleRange16k'];pcm=support.original_pcm(ROOT,r);assert hashlib.sha256(pcm[s*4:e*4]).hexdigest()==r['cropPCM_SHA256'];canonical=r['canonicalSource'];obj=syllable.pointer(checked(canonical),canonical['sourceJSONPointer']);assert obj['zh']==canonical['parentZH'] and obj['py']==canonical['sourcePinyin'];models=[]
  for m in r['rawModelEvidence']:
   raw=checked(m);support.unprompted(raw);assert raw['sourceSampleRange16k']==[s,e] and raw['cropPCM_SHA256']==r['cropPCM_SHA256'];assert ''.join(q['text'] for q in raw['rawSegments'])==m['rawTranscript'];models.append({'file':m['file'],'sha256':m['sha256'],'unalteredRawTranscript':m['rawTranscript'],'holdsUnchanged':m['holds']})
  whole=[]
  for w in f['wholeSourceUnpromptedEvidence']:
   raw=checked(w);support.unprompted(raw);assert raw.get('cropPCM_SHA256',raw.get('track',{}).get('pcm',{}).get('sha256'))==r['sourcePCM_SHA256'];assert ''.join(q['text'] for q in raw['rawSegments'])==w['wholeSourceTranscript'];whole.append({'file':w['file'],'sha256':w['sha256'],'unalteredRawTranscript':w['wholeSourceTranscript']})
  c=f['independentCTCActualCropEvidence'];raw=checked(c);assert raw['rawText']==c['rawText'] and raw['cropPCM_SHA256']==r['cropPCM_SHA256'] and raw['expectedTextPromptUsed'] is False and json.loads(raw['rawResultString'])==raw['rawResult'];ctc={'file':c['file'],'sha256':c['sha256'],'unalteredRawTranscript':raw['rawText']}
  x=np.frombuffer(pcm,dtype='<f4');fig,axes=plt.subplots(4,1,figsize=(15,8));a=max(0,s-4000);b=min(len(x),e+4000)
  for k,(a,b) in enumerate([(a,b),[int(scope[0]*16000),int(scope[1]*16000)]]):
   axes[k*2].plot(np.arange(a,b)/16000,x[a:b],lw=.4);axes[k*2+1].specgram(x[a:b],NFFT=512,Fs=16000,noverlap=448,xextent=(a/16000,b/16000),vmin=-100,vmax=-20,cmap='magma');axes[k*2+1].set_ylim(0,6000)
   if k==0:
    for ax in axes[:2]:ax.axvline(s/16000,color='green');ax.axvline(e/16000,color='green')
  axes[0].set_title(r['id']+' | complete original utterance and localized source-name phases');axes[3].set_xlabel('Original source seconds; no phoneme/tone classification');fig.tight_layout();p=OUT/(str(ordinal)+'-original-utterance-and-name.png');fig.savefig(p,dpi=140);plt.close(fig)
  records.append({k:r[k] for k in ['id','sourceZH','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256','canonicalSource']});records[-1].update({'poolOrdinal':ordinal,'reviewReport':ref(report),'actualPrintedParentPinyin':obj['py'],'actualCropRawEvidence':models,'actualWholeSourceRawEvidence':whole,'actualCTCRawEvidence':ctc,'freshOriginalUtteranceAndNamePlot':ref(p),'localSourceScope16k':[int(scope[0]*16000),int(scope[1]*16000)],'runtimeApproved':False,'humanListening':False,'pronunciationToneCertified':False})
 p=OUT/'fresh-name-original-source-observations-v2.json';p.write_text(json.dumps({'schemaVersion':1,'producer':ref(pathlib.Path(__file__)),'sourceFacts':ref(BASE/'current173-source-frame-facts-v2.json'),'records':records,'automaticApproval':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps(ref(p)))
if __name__=='__main__':main()
