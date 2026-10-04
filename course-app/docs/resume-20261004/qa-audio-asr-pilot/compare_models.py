#!/usr/bin/env python3
"""Independent model comparison; does not certify timing or production clips."""
import json,hashlib
from pathlib import Path
from collections import Counter
HERE=Path(__file__).resolve().parent;A=HERE.parent/'media-closure/asr-evidence'
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
S=read(A/'pilot-exact-match-report.json');M=read(A/'medium-exact-match-report.json');P=read(A/'candidate-boundary-evidence.json');pi={p['id']:p for p in P['probes']}
results=[];trackstats=[]
for st,mt in zip(S['tracks'],M['tracks']):
 assert st['track']==mt['track']and st['sourceLessonSHA256']==mt['sourceLessonSHA256']
 for s,m in zip(st['targets'],mt['targets']):
  assert all(s.get(k)==m.get(k)for k in ['id','unit','zh','source','parentLineId','sentenceCount'])
  su,mu=s['uniqueWholeWordOccurrence'],m['uniqueWholeWordOccurrence'];so=s['exactOccurrences'][0]if su else None;mo=m['exactOccurrences'][0]if mu else None;p=pi.get(s['id']);both=su and mu
  start_delta=mo['rawStart']-so['rawStart']if both else None;end_delta=mo['rawEnd']-so['rawEnd']if both else None
  triage=both and p is not None and not p['holdReasons']and max(abs(start_delta),abs(end_delta))<=.20 and min(so['minimumRawProbability'],mo['minimumRawProbability'])>=.5
  status='priority-for-actual-crop-verification-only'if triage else 'whole-track-fallback-until-independent-cut-proof'
  results.append({'id':s['id'],'unit':s['unit'],'sourceZH':s['zh'],'sourceTrackId':st['track']['id'],'sourceLessonSHA256':st['sourceLessonSHA256'],'singleSentenceLine':s['unit']=='line'and s['sentenceCount']==1,'smallUnique':su,'mediumUnique':mu,'smallExactStatus':[x['status']for x in s['exactOccurrences']],'mediumExactStatus':[x['status']for x in m['exactOccurrences']],'smallEndpoint':None if not so else{key:so[key]for key in ['rawStart','rawEnd','minimumRawProbability']},'mediumEndpoint':None if not mo else{key:mo[key]for key in ['rawStart','rawEnd','minimumRawProbability']},'startDelta':start_delta,'endDelta':end_delta,'authorSmallHoldReasons':p['holdReasons']if p else None,'status':status,'productionApproved':False,'humanListening':False})
 for label,dirname in [('small','final-run-37217540172'),('medium','medium-run-37218301490')]:
  raw=read(A/dirname/'tracks'/f"hsk2-l{st['track']['lesson']:02}-t{st['track']['track']}.json");ws=[w for seg in raw['rawSegments']for w in seg.get('words')or[]]
  trackstats.append({'trackId':st['track']['id'],'model':label,'rawWords':len(ws),'zeroDurationWords':sum(w['start']==w['end']for w in ws),'zeroDurationProbabilityOver0_9':sum(w['start']==w['end']and w['probability']>.9 for w in ws),'maxCompressionRatio':max(seg['compression_ratio']for seg in raw['rawSegments']),'maxNoSpeechProbability':max(seg['no_speech_prob']for seg in raw['rawSegments']),'observationInvalidWordTimeIndices':raw['observationChecks']['invalidWordTimeIndices'],'rawSHA256':sha(A/dirname/'tracks'/f"hsk2-l{st['track']['lesson']:02}-t{st['track']['track']}.json")})
count=lambda pred:dict(Counter(r['unit']for r in results if pred(r)))
report={'schemaVersion':1,'inputFiles':[{'path':str(p.relative_to(HERE.parents[3])),'sha256':sha(p)}for p in[A/'pilot-exact-match-report.json',A/'medium-exact-match-report.json',A/'candidate-boundary-evidence.json']], 'purpose':'same source target comparison using unchanged actual small/medium artifacts; no acoustic certification','normalizationUnchanged':S['normalization'],'counts':{'targetObjects':len(results),'smallUnique':count(lambda r:r['smallUnique']),'mediumUnique':count(lambda r:r['mediumUnique']),'bothUnique':count(lambda r:r['smallUnique']and r['mediumUnique']),'smallOnlyUnique':count(lambda r:r['smallUnique']and not r['mediumUnique']),'mediumOnlyUnique':count(lambda r:not r['smallUnique']and r['mediumUnique']),'bothUniqueEndpointsWithin200ms':count(lambda r:r['smallUnique']and r['mediumUnique']and max(abs(r['startDelta']),abs(r['endDelta']))<=.2),'unheldBothUniqueEndpointsWithin200ms':count(lambda r:r['status'].startswith('priority')),'printed83SentenceUnitsUniqueSmall':sum((r['singleSentenceLine']or r['unit']=='sentence')and r['smallUnique']for r in results),'printed83SentenceUnitsUniqueMedium':sum((r['singleSentenceLine']or r['unit']=='sentence')and r['mediumUnique']for r in results)},'triagePoliciesNotCalibration':{'endpointDeltaSeconds':.2,'minimumModelProbability':.5,'smallBoundaryHoldMustBeEmpty':True,'promotionRequires':'actual crop source/order/full phoneme-boundary and neighbor exclusion evidence; none yet available'},'targetDecisions':results,'trackDiagnostics':trackstats,'candidateCropPriorityIds':[r['id']for r in results if r['status'].startswith('priority')],'humanListening':False,'productionApprovedClipCount':0}
(HERE/'cross-model-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report['counts'],ensure_ascii=False))
