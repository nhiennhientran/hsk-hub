#!/usr/bin/env python3
"""Read-only independent provenance and candidate risk audit (not acoustic approval)."""
import argparse, hashlib, importlib.util, json, subprocess, math
from pathlib import Path
from collections import Counter
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
AUTHOR=HERE.parent/'media-closure/asr-evidence'
parser=argparse.ArgumentParser();parser.add_argument('--variant',choices=['small','medium'],default='small');args=parser.parse_args()
variant=args.variant
runid=37217540172 if variant=='small' else 37218301490
revision='536b0662742c02347bc0e980a01041f333bce120' if variant=='small' else '08e178d48790749d25932bbc082711ddcfdfbc4f'
FINAL=AUTHOR/('final-run-37217540172' if variant=='small' else 'medium-run-37218301490')
REPORT=AUTHOR/('pilot-exact-match-report.json' if variant=='small' else 'medium-exact-match-report.json')
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p): return json.loads(p.read_text())
spec=importlib.util.spec_from_file_location('matcher',AUTHOR/'compare-raw-source.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
run=read(FINAL/'run.json');pre=read(FINAL/'preflight.json');src=read(FINAL/'source-comparison-input.json');report=read(REPORT)
checks=[]
def check(label,condition):
 if not condition: raise ValueError(label)
 checks.append(label)
check('script SHA matches actual evidence',sha(AUTHOR/'transcribe-original-tracks.py')==run['scriptSHA256'])
check('requirements SHA matches actual evidence',sha(AUTHOR/'requirements.txt')==run['requirementsSHA256'])
check('run requested/actual official pinned revision equal',run['model']['repository']=='Systran/faster-whisper-'+variant and run['model']['requestedRevision']==run['model']['actualSnapshotRevision']==revision)
check('actual unprompted full options',run['options']=={'language':'zh','task':'transcribe','beam_size':5,'best_of':5,'temperature':0.0,'word_timestamps':True,'vad_filter':False,'condition_on_previous_text':False,'initial_prompt':None,'prefix':None,'hotwords':None})
for line in (AUTHOR/'requirements.txt').read_text().splitlines():
 if line.strip() and not line.startswith('#'):
  name,version=line.split('==');check('actual dependency '+name,run['packages'].get(name)==version)
check('24 unique raw track ids',len(run['completedTracks'])==len(set(x['id']for x in run['completedTracks']))==24)
check('preflight SHA linked to run',sha(FINAL/'preflight.json')==run['preflightSHA256'])
check('source comparison SHA linked to preflight',sha(FINAL/'source-comparison-input.json')==pre['sourceComparisonInputSHA256'])
check('source manifest SHA current and report',sha(ROOT/'course-app/content/audio-manifest.json')==pre['audioManifestSHA256']==report['sourceAudioManifestSHA256'])
for s in src['lessons']:check('frozen lesson SHA '+s['id'],sha(ROOT/s['file'])==s['sha256'])
risk=[];tracks=[]
for completed in run['completedTracks']:
 rp=FINAL/completed['file'];raw=read(rp);t=next(x for x in pre['tracks'] if x['id']==completed['id']);tr=next(x for x in report['tracks']if x['track']['id']==completed['id'])
 check('raw artifact SHA '+t['id'],sha(rp)==completed['sha256']==tr['rawEvidenceSHA256'])
 check('original MP3 SHA/bytes '+t['id'],sha(ROOT/'course-app/public'/t['file'])==t['sha256']and(ROOT/'course-app/public'/t['file']).stat().st_size==t['bytes'])
 check('raw full track identity '+t['id'],raw['track']==t)
 check('raw exact model/options '+t['id'],raw['modelRepository']==run['model']['repository']and raw['modelRevision']==run['model']['actualSnapshotRevision']and raw['options']==run['options'])
 m.validate_raw_track(raw,tr['track'])
 words,cjk,owners=m.observations(raw)
 check('raw CJK regenerated '+t['id'],cjk==tr['rawCJK'])
 canonical_source=next(s for s in src['lessons']if s['id'].endswith(f":l{t['lesson']:02d}"))
 check('target lesson SHA source comparison '+t['id'],canonical_source['sha256']==tr['sourceLessonSHA256'])
 for target in tr['targets']:
  # Full frozen source ID/Chinese binding, including sentence derivation.
  if target['unit']=='word': original=next(s for s in canonical_source['vocabulary']if s['id']==target['id']);check('printed word binding '+target['id'],original['zh']==target['zh']and original['audioTrack']==f"{t['lesson']}-{t['track']}"and original['sourceText']==t['text']and original['source']==target['source'])
  else:
   original=next(s for text in canonical_source['texts']if text['audioTrack']==f"{t['lesson']}-{t['track']}"for s in text['lines']if s['id']==target.get('parentLineId',target['id']))
   expected=original['zh']if target['unit']=='line'else m.sentences(original['zh'])[int(target['id'].rsplit('sentence',1)[1])-1]
   check('printed line/sentence binding '+target['id'],expected==target['zh']and original['source']==target['source'])
  regenerated=m.exact_occurrences({k:v for k,v in target.items()if k not in ['sourceHasNonCJKLettersOrDigits','exactOccurrences','uniqueWholeWordOccurrence','status']},words,cjk,owners)
  check('raw exact occurrence regenerated '+target['id'],regenerated==target)
  for idx,occ in enumerate(target['exactOccurrences']):
   refs=occ['rawWordReferences'];matched=[raw['rawSegments'][r['segment']]['words'][r['word']]for r in refs]
   gaps=[b['start']-a['end']for a,b in zip(matched,matched[1:])]
   ignored=[]
   for a,b in zip(refs,refs[1:]):
    if a['segment']==b['segment']:
     ignored.extend(raw['rawSegments'][a['segment']]['words'][a['word']+1:b['word']])
   risks=[]
   if not target['uniqueWholeWordOccurrence']:risks.append('not-unique-or-blocked')
   if occ['minimumRawProbability']<.8:risks.append('min-probability-below-0.8-triage-only')
   if occ['rawStart']==0:risks.append('start-at-track-origin-not-acoustic-onset')
   if any(g<-.001 for g in gaps):risks.append('overlapping-ASR-word-times')
   if any(g>1 for g in gaps):risks.append('internal-gap-over-1s-triage-only')
   if len(set(r['segment']for r in refs))>1:risks.append('cross-ASR-segment-needs-context')
   if any(any(c.isalnum()for c in w['word'])for w in ignored):risks.append('ignored-non-CJK-lexical-token')
   # Adjacent CJK ownership is recorded independently; model ends can include pauses.
   first=owners[occ['observedCJKRange'][0]];last=owners[occ['observedCJKRange'][1]-1]
   prev=words[first-1]['raw']if first else None;nxt=words[last+1]['raw']if last+1<len(words)else None
   risk.append({'trackId':t['id'],'targetId':target['id'],'unit':target['unit'],'zh':target['zh'],'occurrence':idx+1,'unique':target['uniqueWholeWordOccurrence'],'status':occ['status'],'rawStart':occ['rawStart'],'rawEnd':occ['rawEnd'],'minimumProbability':occ['minimumRawProbability'],'maxInternalGap':max(gaps)if gaps else None,'minInternalGap':min(gaps)if gaps else None,'previousRawWord':prev,'nextRawWord':nxt,'riskFlags':risks,'acousticApproved':False,'productionApproved':False})
 tracks.append({'trackId':t['id'],'rawSHA256':sha(rp),'rawCJK':cjk,'rawWordCount':sum(len(s.get('words')or[])for s in raw['rawSegments']),'uniqueByUnit':dict(Counter(a['unit']for a in tr['targets']if a['uniqueWholeWordOccurrence'])),'residual':tr.get('wholeSourceResidual'),'allTokensNonoverlap':all(a['raw']['end']<=b['raw']['start']+.001 for a,b in zip(words,words[1:]))})
# Meaningful counterexamples: accepted textual candidates must never automatically promote.
def obs(ws):return m.observations({'rawSegments':[{'words':ws}]})
def w(s,a,b,p=.99):return {'word':s,'start':a,'end':b,'probability':p}
examples=[]
for name,target,ws in [('ignored-lexical-token','妈妈你好',[w('妈妈',0,1),w('NO',1,2),w('你好',2,3)]),('long-internal-gap','妈妈你好',[w('妈妈',0,1),w('你好',11,12)]),('overlapping-word-times','妈妈你好',[w('妈妈',0,2),w('你好',1,3)]),('low-probability','妈妈',[w('妈妈',0,1,.01)])]:
 ws2,text,ow=obs(ws);result=m.exact_occurrences({'zh':target},ws2,text,ow)
 check('counterexample textual candidate remains unapproved '+name,result['uniqueWholeWordOccurrence']and result['exactOccurrences'][0]['productionApproved']is False)
 examples.append({'name':name,'inputWords':ws,'target':target,'result':result})
inputs=[AUTHOR/'transcribe-original-tracks.py',AUTHOR/'requirements.txt',AUTHOR/'compare-raw-source.py',REPORT,AUTHOR/'printed-target-cues.json',FINAL/'run.json',FINAL/'preflight.json',FINAL/'source-comparison-input.json']
output={'schemaVersion':1,'scope':'independent read-only evidence, target binding and risk audit; no listening or production approval','checksPassed':len(checks),'checks':checks,'inputFiles':[{'path':str(p.relative_to(ROOT)),'sha256':sha(p)}for p in inputs],'runId':runid,'commit':run['repositoryCommit'],'model':run['model'],'totalDecodedSeconds':pre['totalDecodedSeconds'],'totalInferenceSeconds':run['totalInferenceSeconds'],'candidateCounts':report['sourceTargetCounts'],'uniqueEndpointCandidates':dict(Counter(a['unit']for tr in report['tracks']for a in tr['targets']if a['uniqueWholeWordOccurrence'])),'riskCountsAmongUniqueOccurrences':dict(Counter(flag for r in risk if r['unique']for flag in r['riskFlags'])),'tracks':tracks,'occurrences':risk,'counterexamples':examples,'humanListening':False,'productionApprovedClipCount':0}
(HERE/f'independent-{variant}-inspection.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'checks':len(checks),'unique':output['uniqueEndpointCandidates'],'riskCounts':output['riskCountsAmongUniqueOccurrences']},ensure_ascii=False))
