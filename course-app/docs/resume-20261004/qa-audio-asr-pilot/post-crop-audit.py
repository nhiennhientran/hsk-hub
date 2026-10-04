#!/usr/bin/env python3
"""Read-only independent verification of the three actual guarded crop inputs."""
import hashlib,json,math,subprocess,unicodedata,wave,zipfile
from pathlib import Path
import numpy as np
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[3];A=HERE.parent/'media-closure/asr-evidence'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text())
def cjk(s):return ''.join(c for c in unicodedata.normalize('NFKC',s)if '\u3400'<=c<='\u9fff'or'\U00020000'<=c<='\U000323af')
def parts(s):
 import re
 return [s.strip()for s in re.findall(r'[^。！？!?]+[。！？!?]*',s)if cjk(s)]
checks=[]
def ck(label,value):
 if not value:raise ValueError(label)
 checks.append(label)
recipe=read(A/'padded-crop-review-input.json');expected=read(A/'padded-crop-expected-source.json');author=read(A/'three-crop-crosscheck-verification.json')
ck('limited recipe fixed SHA',sha(A/'padded-crop-review-input.json')=='3ccb4354bc7ff3a899adb7543c97524989d6e9ca4ed5a348d7299456d7ee3ccf')
ck('expected source separately SHA bound',sha(A/'padded-crop-expected-source.json')==recipe['expectedSourceComparisonSHA256'])
ck('author post-crop frozen SHA',sha(A/'three-crop-crosscheck-verification.json')=='6bd4f764844b9b3dfda7b218e24028c993c0a47b89d07b8ea564cbcce90f1ac7')
ck('three unique IDs only',len(recipe['candidates'])==len({c['id']for c in recipe['candidates']})==3)
e={x['id']:x for x in expected['targets']};mapping={'為':'为','歡':'欢','們':'们','別':'别','氣':'气'}
opts={'language':'zh','task':'transcribe','beam_size':5,'best_of':5,'temperature':0.0,'word_timestamps':True,'vad_filter':False,'condition_on_previous_text':False,'initial_prompt':None,'prefix':None,'hotwords':None}
models={'small':'536b0662742c02347bc0e980a01041f333bce120','medium':'08e178d48790749d25932bbc082711ddcfdfbc4f'}
modelruns={};zips=[]
for model,revision in models.items():
 d=A/'crop-run-37219656715'/model;r=read(d/'run.json');modelruns[model]=r
 ck(model+' completed3',r['status']=='3-crop-ASR-evidence-complete-awaiting-independent-review'and len(r['completedCrops'])==3)
 ck(model+' actual committed head',r['repositoryCommit']=='70e001fa0cee9f6a01fe2dc7fed2a04d1cd5db5f')
 ck(model+' worker SHA',r['scriptSHA256']==sha(A/'transcribe-candidate-crops.py'))
 ck(model+' helper/requirements SHA',r['originalASRScriptSHA256']==sha(A/'transcribe-original-tracks.py')and r['requirementsSHA256']==sha(A/'requirements.txt'))
 ck(model+' frozen recipe actual',r['inputSHA256']==sha(A/'padded-crop-review-input.json'))
 ck(model+' exact all unprompted options',r['options']==opts)
 ck(model+' exact requested/actual model',r['model']['repository']=='Systran/faster-whisper-'+model and r['model']['requestedRevision']==r['model']['actualSnapshotRevision']==revision)
 ck(model+' model recorded file SHA match accepted fulltrack',r['model']['files']==[{k:f[k]for k in ['file','bytes','sha256']}for f in read(A/('final-run-37217540172'if model=='small'else'medium-run-37218301490')/'run.json')['model']['files']])
 for line in(A/'requirements.txt').read_text().splitlines():
  if line.strip()and not line.startswith('#'):
   n,v=line.split('==');ck(model+' actual pinned dependency '+n,r['packages'][n]==v)
 paths=list(Path('/workspace/scratch/28b55072841a/attachments').glob(f'*/hsk-three-crop-{model}-37219656715.zip'));ck(model+' exactly one actualZIP',len(paths)==1);zpath=paths[0]
 with zipfile.ZipFile(zpath)as z:
  ck(model+' ZIP CRC',z.testzip()is None);names=[n for n in z.namelist()if not n.endswith('/')]
  for n in names:ck(model+' ZIP exact expanded '+n,z.read(n)==(d/n).read_bytes())
  zips.append({'model':model,'path':str(zpath),'sha256':sha(zpath),'bytes':zpath.stat().st_size,'fileCount':len(names),'crc':'passed','expandedByteIdentity':'passed'})
results=[]
for i,c in enumerate(recipe['candidates'],1):
 ck('frozen canonical lesson SHA '+c['id'],sha(ROOT/c['sourceLessonFile'])==c['sourceLessonSHA256']);lesson=read(ROOT/c['sourceLessonFile']);ex=e[c['id']]
 if c['unit']=='word':original=next(w for w in lesson['vocabulary']if w['id']==c['id']);zh=original['zh'];neighbors={'onlyPrintedHeadwordInSourceTrack':len([w for w in lesson['vocabulary']if w['audioTrack']==original['audioTrack']])==1,'wordAudioTrack':original['audioTrack']}
 else:
  parent=c['id'].split(':sentence')[0];text=next(t for t in lesson['texts']if any(l['id']==parent for l in t['lines']));line=next(l for l in text['lines']if l['id']==parent);original=line;zh=line['zh']if ':sentence'not in c['id']else parts(line['zh'])[int(c['id'].rsplit('sentence',1)[1])-1]
  index=text['lines'].index(line);neighbors={'parentLineZH':line['zh'],'previousLineZH':text['lines'][index-1]['zh']if index else None,'nextLineZH':text['lines'][index+1]['zh']if index+1<len(text['lines'])else None,'precedingSentenceWithinParent':parts(line['zh'])[int(c['id'].rsplit('sentence',1)[1])-2]if ':sentence'in c['id']and int(c['id'].rsplit('sentence',1)[1])>1 else None}
 ck('expected exact canonical Chinese/source '+c['id'],zh==ex['sourceText']and original['source']==ex['source']==c['source'])
 source=ROOT/'course-app/public'/c['sourceTrack'];ck('sourceMP3 exactSHA '+c['id'],sha(source)==c['sourceSHA256']);b=subprocess.check_output(['ffmpeg','-v','error','-i',str(source),'-map','0:a:0','-ac','1','-ar','16000','-f','f32le','-']);ck('full sourcePCM exactSHA '+c['id'],hashlib.sha256(b).hexdigest()==c['sourcePCM_SHA256']);p=np.frombuffer(b,dtype='<f4');f,l=c['sourceSampleRange16k'];ck('sourceframe times exact '+c['id'],0<=f<l<=len(p)and f/16000==c['start']and l/16000==c['end']);crop=b[f*4:l*4];ck('actualcrop PCM exactSHA '+c['id'],hashlib.sha256(crop).hexdigest()==c['cropPCM_SHA256'])
 def db(a,z):
  vals=p[max(0,a):min(len(p),z)].astype('f8');return None if not len(vals)else round(20*math.log10(max(1e-12,float(np.sqrt(np.mean(vals*vals))))),3)
 # Exact integer frame windows at the actual edges; no float rounding drift.
 edges={'beforeStart':db(f-320,f),'afterStart':db(f,f+320),'beforeEnd':db(l-320,l),'afterEnd':db(l,l+320)};decl=next(a for a in author['candidates']if a['id']==c['id']);ck('actual frame RMS author agreement '+c['id'],edges==decl['boundaryRMSDbFS20ms']);ck('all physical/quiet edges below57dB '+c['id'],all(v is None or v<-57 for v in edges.values()))
 wavpath=A/decl['waveProbe']['file'];ck('probe actualSHA '+c['id'],sha(wavpath)==decl['waveProbe']['sha256']);quant=np.clip(np.rint(np.frombuffer(crop,dtype='<f4').astype('f8')*32768),-32768,32767).astype('<i2').tobytes()
 with wave.open(str(wavpath),'rb')as w:ck('WAV header/frames/contentexact '+c['id'],(w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getnframes())==(1,2,16000,l-f)and w.readframes(w.getnframes())==quant)
 decoded=subprocess.check_output(['ffmpeg','-v','error','-i',str(wavpath),'-f','f32le','-']);ck('actual WAV complete decode '+c['id'],len(decoded)==(l-f)*4)
 rr=[]
 for model,revision in models.items():
  r=modelruns[model];completed=next(x for x in r['completedCrops']if x['candidateId']==c['id']);rawpath=A/'crop-run-37219656715'/model/completed['file'];ck('raw actual artifact SHA '+model+c['id'],sha(rawpath)==completed['sha256']);raw=read(rawpath)
  ck('raw original identity/samples/cropSHA '+model+c['id'],raw['candidateId']==c['id']and raw['originalSourceTrack']==c['sourceTrack']and raw['originalSourceSHA256']==c['sourceSHA256']and raw['sourceSampleRange16k']==[f,l]and raw['cropPCM_SHA256']==c['cropPCM_SHA256']and raw['cropDurationSeconds']==(l-f)/16000)
  ck('raw exact model/options '+model+c['id'],raw['options']==opts and raw['modelRevision']==revision and raw['modelRepository']=='Systran/faster-whisper-'+model)
  rawtext=''.join(s['text']for s in raw['rawSegments']);words=[w for s in raw['rawSegments']for w in s.get('words')or[]];observed=cjk(rawtext);norm=observed.translate(str.maketrans(mapping));wanted=cjk(zh)
  ck('full normalized Chinese exactly target,no neighboring CJK '+model+c['id'],norm==wanted)
  ck('word arrays coherent with raw segment Chinese '+model+c['id'],cjk(''.join(w['word']for w in words))==observed)
  ck('no foreign lexical tokens/digits hidden by CJK filter '+model+c['id'],not any(ch.isalnum()and not cjk(ch)for ch in rawtext))
  ck('no zero/inverted/out-of-bounds word '+model+c['id'],all(math.isfinite(w['start'])and math.isfinite(w['end'])and 0<=w['start']<w['end']<=(l-f)/16000 for w in words))
  ck('no overlapping words '+model+c['id'],all(a['end']<=b['start']+.001 for a,b in zip(words,words[1:])))
  rr.append({'model':model,'rawFile':str(rawpath.relative_to(ROOT)),'rawSHA256':sha(rawpath),'rawTranscript':rawtext,'rawCJK':observed,'explicitGlyphNormalizedCJK':norm,'strictCJKExact':observed==wanted,'afterFiveExplicitGlyphsExact':True,'noRecognizedNeighborCJK':True,'noHiddenForeignLexicalTokens':True,'allRawWords':words,'minimumRawWordProbability':min(w['probability']for w in words),'rawLowProbabilityWordsBelow0_5':[w for w in words if w['probability']<.5],'zeroDurationWordCount':0,'humanListening':False})
 results.append({'id':c['id'],'sourceChineseUnchanged':zh,'sourceLessonFile':c['sourceLessonFile'],'sourceLessonSHA256':c['sourceLessonSHA256'],'sourceTrack':c['sourceTrack'],'sourceSHA256':c['sourceSHA256'],'sourcePCM_SHA256':c['sourcePCM_SHA256'],'sourceSampleRange16k':[f,l],'sampleRate':16000,'start':f/16000,'end':l/16000,'cropPCM_SHA256':c['cropPCM_SHA256'],'guardedWAV':{'file':str(wavpath.relative_to(ROOT)),'sha256':sha(wavpath)},'actualFrameBoundaryRMSDbFS20ms':edges,'sourceContext':neighbors,'rawModels':rr,'humanListening':False})
inputs=[A/'padded-crop-review-input.json',A/'padded-crop-expected-source.json',A/'transcribe-candidate-crops.py',A/'three-crop-crosscheck-verification.json',A/'crop-run-37219656715/small/run.json',A/'crop-run-37219656715/medium/run.json']
report={'schemaVersion':1,'status':'independent actual source/crop/artifact/content/window verification passed; decision is separate','runId':37219656715,'checksPassed':len(checks),'checks':checks,'inputFiles':[{'file':str(p.relative_to(ROOT)),'sha256':sha(p)}for p in inputs],'actualZIPs':zips,'observationGlyphEquivalentsOnly':mapping,'glyphScope':'Only observed CJK glyphs in these six raw observations; raw unchanged, no textbook replacement, no homophone/number/erhua recovery','candidates':results,'modelBinaryVerificationScope':'recorded immutable snapshot and4file SHA match verified workers; model binaries not rehashed locally','humanListening':False,'nativeSpeakerReview':False,'productionMutationPerformed':False}
(HERE/'post-crop-review-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'passedChecks':len(checks),'crops':3,'raw':6,'ZIPs':2,'quietBoundaryWindows':10}))
