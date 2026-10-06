"""Fresh original-byte observations for six source reading corrections; no ASR."""
import hashlib,json,pathlib,subprocess,math
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
ROOT=pathlib.Path(__file__).resolve().parents[2]
BASE=ROOT/'course-app/docs/final-quality-20261006/audio-hsk3/scoped-word-source-followup'
OUT=ROOT/'course-app/docs/final-quality-20261006/audio-root-peer-source-corrections'
INPUTS=[BASE/'partial-core-observations/unchanged-two-candidates.json',BASE/'corrected-1-8-source/unchanged-four-candidates.json']
def sha(b):return hashlib.sha256(b).hexdigest()
def ref(p):return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p.read_bytes())}
def checked(r):
 p=ROOT/r['file'];assert sha(p.read_bytes())==r['sha256'];return json.loads(p.read_text())
def db(x):return round(20*math.log10(max(float(np.sqrt(np.mean(x.astype(np.float64)**2))),1e-8)),5)
def plot(ax,pcm,start,end):
 a=max(0,int(start*16000));b=min(len(pcm),int(end*16000));x=pcm[a:b];t=np.arange(a,b)/16000
 ax[0].plot(t,x,lw=.35);ax[0].set_xlim(a/16000,b/16000);ax[0].set_ylim(-.3,.3)
 ax[1].specgram(x,NFFT=256,Fs=16000,noverlap=224,cmap='magma',vmin=-115,vmax=-45,xextent=(a/16000,b/16000));ax[1].set_ylim(0,8000)
def main():
 OUT.mkdir(parents=True,exist_ok=True);rows=[]
 for p in INPUTS:
  for r in json.loads(p.read_text())['targets']:rows.append((p,r))
 pcms={};records=[];tracks={r['sourceTrack']:r for _,r in rows}
 for i,(track,r) in enumerate(tracks.items()):
  source=ROOT/'course-app/public'/track;assert sha(source.read_bytes())==r['sourceSHA256']
  b=subprocess.run(['ffmpeg','-nostdin','-v','error','-threads','1','-i',str(source),'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True,check=True).stdout
  assert sha(b)==r['sourcePCM_SHA256'];pcm=np.frombuffer(b,dtype='<f4');pcms[track]=b
  fig,axes=plt.subplots(2,1,figsize=(17,5),sharex=True);plot(axes,pcm,0,len(pcm)/16000)
  axes[0].set_title(track+' fresh original decode; no reading labels inferred from an energy count')
  for _,target in rows:
   if target['sourceTrack']!=track:continue
   s,e=np.array(target['sourceSampleRange16k'])/16000
   for ax in axes:ax.axvline(s,color='cyan');ax.axvline(e,color='lime');ax.axvspan(s,e,color='cyan',alpha=.08)
   axes[0].text(s,.22,target['id'].split(':')[-1],fontsize=8)
  p=OUT/f'original-source-{i+1}.png';fig.tight_layout();fig.savefig(p,dpi=150);plt.close(fig)
 for ordinal,(inputp,r) in enumerate(rows):
  b=pcms[r['sourceTrack']];pcm=np.frombuffer(b,dtype='<f4');s,e=r['sourceSampleRange16k'];assert sha(b[s*4:e*4])==r['cropPCM_SHA256']
  lesson=ROOT/r['sourceLessonFile'];assert sha(lesson.read_bytes())==r['sourceLessonSHA256'];v=json.loads(lesson.read_text())['vocabulary'][r['sourceOrdinal']];assert v['id']==r['id'] and v['zh']==r['sourceZH'] and v['py']==r['sourcePinyin']
  models=[]
  for name,m in r['actualCropModelEvidence'].items():
   p=ROOT/m['rawFile'];assert sha(p.read_bytes())==m['rawSHA256'];j=json.loads(p.read_text());assert j['cropPCM_SHA256']==r['cropPCM_SHA256'] and abs(j['cropDurationSeconds']-(e-s)/16000)<1e-6;assert ''.join(x['text'] for x in j['rawSegments'])==m['originalTranscript']
   binding=p.parent.parent/'bindings'/r['id'].replace(':','_')/(r['candidateId']+'.json');bj=json.loads(binding.read_text());assert bj['cropPCM_SHA256']==r['cropPCM_SHA256'] and bj['sourceSampleRange16k']==[s,e] and bj['originalSourceSHA256']==r['sourceSHA256'] and bj['deduplicatedRawASRSHA256']==m['rawSHA256'];assert bj['rawSegments']==j['rawSegments']
   options=j['options'];assert all(options.get(k) is None for k in ['initial_prompt','prefix','hotwords']);assert options['vad_filter'] is False and options['condition_on_previous_text'] is False
   models.append({**ref(p),'actualSourceFrameBinding':ref(binding),'model':m['modelRepository'],'revision':m['modelRevision'],'unalteredRawTranscript':m['originalTranscript'],'rawNoSpeechProbabilities':[x['no_speech_prob'] for x in j['rawSegments']]})
  whole=[]
  for rr in r['sourceOccurrenceEvidence']['originalTrackRawEvidenceRefs']:
   j=checked(rr);pcmsha=j.get('cropPCM_SHA256',j.get('track',{}).get('pcm',{}).get('sha256'));assert pcmsha==r['sourcePCM_SHA256'];whole.append({**rr,'unalteredRawTranscript':''.join(x['text'] for x in j['rawSegments'])})
  edges=[{'name':n,'sampleRange':[a,a+320],'rmsDbFS':db(pcm[a:a+320]),'quietBelowMinus45':db(pcm[a:a+320]) < -45} for n,a in [('beforeStart',s-320),('afterStart',s),('beforeEnd',e-320),('afterEnd',e)]]
  fig,axes=plt.subplots(2,1,figsize=(13,4.5),sharex=True);plot(axes,pcm,s/16000-.25,e/16000+.25)
  for ax in axes:ax.axvline(s/16000,color='cyan');ax.axvline(e/16000,color='lime')
  axes[0].set_title(r['id']+' | fresh original crop '+str([s,e]));p=OUT/f'crop-{ordinal+1}.png';fig.tight_layout();fig.savefig(p,dpi=160);plt.close(fig)
  records.append({'id':r['id'],'sourceZH':r['sourceZH'],'sourcePinyin':r['sourcePinyin'],'sourceLesson':ref(lesson),'sourcePointer':r['sourcePointer'],'sourceTrack':r['sourceTrack'],'sourceSHA256':r['sourceSHA256'],'sourcePCM_SHA256':r['sourcePCM_SHA256'],'sourceSampleRange16k':[s,e],'cropPCM_SHA256':r['cropPCM_SHA256'],'candidateId':r['candidateId'],'producerInput':ref(inputp),'unalteredActualCropModelEvidence':models,'unalteredActualWholeSourceEvidence':whole,'actualFourBoundaryWindows':edges,'allFourBoundaryWindowsQuiet':all(x['quietBelowMinus45'] for x in edges),'freshOriginalCropWaveformSpectrum':ref(p),'freshOriginalWholeSourceWaveformSpectrum':ref(OUT/f'original-source-{list(tracks).index(r["sourceTrack"])+1}.png'),'explicitIndependentDecision':None})
 output=OUT/'fresh-original-source-frame-observations.json';output.write_text(json.dumps({'schemaVersion':1,'producer':ref(pathlib.Path(__file__)),'inputs':[ref(p) for p in INPUTS],'freshlyDecodedOriginalTracks':len(tracks),'records':records,'certifications':{'humanListening':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False}},ensure_ascii=False,indent=2)+'\n');print(json.dumps(ref(output)));print('records',len(records),'quiet',sum(r['allFourBoundaryWindowsQuiet'] for r in records))
if __name__=='__main__':main()
