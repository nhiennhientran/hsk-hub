"""Freshly bind the original recorded 那个 and 八千八 utterances."""
import hashlib, importlib.util, json, pathlib
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'course-app/docs/final-quality-20261006/audio-root-peer-two-fixed-sources'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def checked(r):
 p=pathlib.Path(r['file']);p=p if p.is_absolute() else ROOT/p
 assert sha(p)==r['sha256'];return json.loads(p.read_text())
def module(name,file):
 s=importlib.util.spec_from_file_location(name,pathlib.Path(__file__).with_name(file));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def main():
 OUT.mkdir(parents=True,exist_ok=True);support=module('two_fixed_support','review-decisions.py');features=module('two_fixed_features','review-syllable-evidence.py');records=[]
 configs=[('hsk1-paired-full-03.json','v-l09-lex-2161f1ab5a-s1',[179520,193120]),('hsk2-paired-full-01.json','hsk2-fltrp-2026:l08:text1:line6:sentence2',[269760,286400])]
 for name,id,frames in configs:
  report=ROOT/'course-app/docs/final-quality-20261006/audio-review'/name;d=json.loads(report.read_text());found=[r for r in d['targets'] if r['id']==id and r['sourceSampleRange16k']==frames];assert len(found)==1;r=found[0];pcm=support.original_pcm(ROOT,r);s,e=frames;assert hashlib.sha256(pcm[s*4:e*4]).hexdigest()==r['cropPCM_SHA256'];models=[]
  for m in r['rawModelEvidence']:
   raw=checked(m);support.unprompted(raw);assert raw['sourceSampleRange16k']==frames and raw['cropPCM_SHA256']==r['cropPCM_SHA256'];assert ''.join(q['text'] for q in raw['rawSegments'])==m['rawTranscript'];models.append({'file':pathlib.Path(m['file']).relative_to(ROOT).as_posix() if pathlib.Path(m['file']).is_absolute() else m['file'],'sha256':m['sha256'],'unalteredRawTranscript':m['rawTranscript'],'holds':m['holds']})
  if id.startswith('v-'):
   source=ROOT/'course-app/docs/final-quality-20261006/audio-hsk1/nage-original-reading-observations/two-original-vowel-and-existing-model-facts.json';f=json.loads(source.read_text());variant=next(v for v in f['immutableExistingActualCropVariants'] if v['sourceSampleRange16k']==frames);whole=[variant['wholeSourceEvidence']];ctc=variant['actualIndependentCTCRaw'];printed=ROOT/'hsk1-app/content/stage3-catalog.json';word=json.loads(printed.read_text())['vocabulary'][184];assert word['zh']=='那个' and word['py']=='nàge / nèige';original={'file':ref(printed)['file'],'sha256':sha(printed),'sourceJSONPointer':'/vocabulary/184','zh':word['zh'],'py':word['py']}
  else:
   source=ROOT/'course-app/docs/final-quality-20261006/audio-hsk2/closure-followup/current173-source-frame-facts-v2.json';f=json.loads(source.read_text())['targets'][134];whole=f['wholeSourceUnpromptedEvidence'];ctc=f['independentCTCActualCropEvidence'];c=r['canonicalSource'];obj=features.pointer(checked(c),c['sourceJSONPointer']);assert obj['zh']==c['parentZH'] and obj['py']==c['sourcePinyin'];original={**ref(ROOT/c['file']),'sourceJSONPointer':c['sourceJSONPointer'],'zh':obj['zh'],'py':obj['py']}
  for w in whole:
   raw=checked(w);support.unprompted(raw);assert raw.get('cropPCM_SHA256',raw.get('track',{}).get('pcm',{}).get('sha256'))==r['sourcePCM_SHA256']
  cr=checked(ctc);assert cr['cropPCM_SHA256']==r['cropPCM_SHA256'] and cr['expectedTextPromptUsed'] is False;assert cr['rawText']==ctc.get('rawText',ctc.get('rawTranscript'));assert json.loads(cr['rawResultString'])==cr['rawResult']
  x=np.frombuffer(pcm,dtype='<f4');a=max(0,s-12000);b=min(len(x),e+8000);fig,ax=plt.subplots(3,1,figsize=(15,8));ax[0].plot(np.arange(a,b)/16000,x[a:b],lw=.4);ax[1].specgram(x[a:b],NFFT=512,Fs=16000,noverlap=448,xextent=(a/16000,b/16000),vmin=-105,vmax=-20,cmap='magma');ax[1].set_ylim(0,6000);ax[2].plot(np.arange(s,e)/16000,x[s:e],lw=.6)
  for z in ax[:2]:z.axvline(s/16000,color='green');z.axvline(e/16000,color='green')
  ax[0].set_title(id+' | actual unchanged original source and complete selected utterance');ax[2].set_xlabel('Original source seconds; no synthetic padding or phoneme/tone certificate');fig.tight_layout();plot=OUT/(r['candidateId']+'-actual-original-source.png');fig.savefig(plot,dpi=140);plt.close(fig)
  record={k:r[k] for k in ['id','sourceZH','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']};record.update({'sourceText':r['sourceZH'],'reviewReport':ref(report),'sourceFact':ref(source),'originalPrintedSource':original,'actualWhisperBindings':models,'originalWholeSourceEvidence':[{'file':w['file'],'sha256':w['sha256']} for w in whole],'actualCTCBinding':{'file':ctc['file'],'sha256':ctc['sha256'],'unalteredRawTranscript':cr['rawText']},'actualSourcePlot':ref(plot),'rawEvidenceUnchanged':True,'automaticApproval':False,'pronunciationToneCertified':False})
  if id.startswith('hsk2-'):
   bins=features.features(pcm,s,e);fp=OUT/(r['candidateId']+'-actual-source-features.json');fp.write_text(json.dumps({**record,'featureBins':bins,'featureBinsSHA256':features.feature_sha(bins),'nucleusThresholds':{'rmsDbFS':-45,'autocorrelationAtLeast':0.65,'pitchHz':[75,500]},'method':'Original 32ms source windows at 5ms hops; F0 estimates are not tone certification.'},ensure_ascii=False,indent=2)+'\n');record['actualSyllableFeatureEvidence']=ref(fp)
  records.append(record)
 p=OUT/'fresh-two-fixed-original-source-observations.json';p.write_text(json.dumps({'schemaVersion':1,'producer':ref(pathlib.Path(__file__)),'records':records,'automaticApproval':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps(ref(p)))
if __name__=='__main__':main()
