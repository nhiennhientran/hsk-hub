#!/usr/bin/env python3
"""Propose source-bounded quiet edges; never approve phoneme completeness or clips."""
import argparse,collections,hashlib,importlib.util,json,math,sys
from pathlib import Path
import numpy as np
RATE=16000;WINDOW=320;QUIET_DB=-45;STEP=160;MAX_MOVE=5600

def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def import_pipeline(root,output):
 source=root/'course-app/tools/final-quality-20261006/audio_pipeline.py';blob=source.read_bytes();sha=hashlib.sha256(blob).hexdigest();folder=output/'producers';folder.mkdir(parents=True,exist_ok=True);p=folder/(sha+'.py');p.write_bytes(blob);spec=importlib.util.spec_from_file_location('frozen_shared_pipeline_for_edge_candidates',p);m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m);return m,p,blob

def extent(t):
 d=t.get('candidateDiagnostics',{})
 if d.get('firstRawWord')and d.get('lastRawWord'):return [float(d['firstRawWord']['start']),float(d['lastRawWord']['end'])]
 if t.get('rawRange'):return list(map(float,t['rawRange']))
 return [float(t['start']),float(t['end'])]

def run(root,inputfile,output):
 producer_blob=Path(__file__).read_bytes();producer_sha=hashlib.sha256(producer_blob).hexdigest();m,p,pipeline_blob=import_pipeline(root,output);pipeline_sha=hashlib.sha256(pipeline_blob).hexdigest();data=m.read(inputfile);targets=data['targets'];decoded={};prepared=[];changes=[];bytrack=collections.defaultdict(list)
 for t in targets:bytrack[t['sourceTrack']].append(t)
 cache=root/'course-app/.repro-output/final-quality/audio-pcm-cache'
 for source,ts in bytrack.items():
  pcm,blob,_=m.decoded(root,ts[0],cache);decoded[source]=(pcm,blob);fullruns=m.acoustic_runs(pcm)
  # Parent lines and their sentence children describe the same source speech.
  # Only leaf spoken units enter the true neighbor sequence; all records remain.
  speech=[z for z in ts if z.get('unit')in ['sentence','line']]
  def parent_id(z):return z.get('parentLineId')or z.get('lineId')or z.get('sourceId')or z['id'].split(':sentence')[0].split('-sentence-')[0]
  excluded={}
  for z in speech:
   if z.get('unit')=='line':
    children=[q for q in speech if q.get('unit')=='sentence'and q['id']!=z['id']and(parent_id(q)==z['id']or(q.get('lineId')and q.get('lineId')==z.get('lineId')))]
    if children:excluded[z['id']]=sorted({q['id']for q in children})
  keyed=collections.defaultdict(list)
  for z in speech:
   if z['id']not in excluded:keyed[z['id']].append(z)
  sentence_heads=[]
  for ident,records in keyed.items():
   ranges=[extent(q)for q in records];representative=records[0]
   sentence_heads.append({'id':ident,'sourceZH':representative['sourceZH'],'_extent':[min(q[0]for q in ranges),max(q[1]for q in ranges)],'_aliasIDs':[ident],'_sourceExtentAlternatives':ranges,'rawEvidence':representative.get('rawEvidence')})
  sentence_heads.sort(key=lambda z:(z['_extent'][0],z['_extent'][1]))
  for original in ts:
   t=dict(original);first,last=t.get('sourceSampleRange16k',[math.floor(t['start']*RATE),math.ceil(t['end']*RATE)]);old=[first,last];minimum,maximum=0,len(pcm);guards={'method':'no-production-approval; original source extent and neighbor source anchors retained','sourceTargetExtentSeconds':extent(t),'sourceTargetRawEvidence':t.get('rawEvidence'),'sourcePrevious':None,'sourceNext':None}
   if t.get('unit')=='word':
    # Adjacent source energy groups constrain extension; this is still not semantic certification.
    overlapping=[(i,a,b)for i,(a,b)in enumerate(fullruns)if a*RATE<last and b*RATE>first]
    raw=t.get('rawEvidence',{});order=t.get('acousticOrder',{});regions=order.get('regions');assigned=order.get('assignedRunIndex')
    if raw.get('previousWord'):
     minimum=max(minimum,math.floor(float(raw['previousWord']['end'])*RATE));guards['sourcePreviousRawWord']=raw['previousWord']
    if raw.get('followingWord'):
     maximum=min(maximum,math.ceil(float(raw['followingWord']['start'])*RATE));guards['sourceFollowingRawWord']=raw['followingWord']
    if regions and isinstance(assigned,int) and 0<=assigned<len(regions):
     if assigned:minimum=max(minimum,math.ceil(regions[assigned-1][1]*RATE)+WINDOW);guards['sourcePreviousAcousticOrderRegion']={'index':assigned-1,'rangeSeconds':regions[assigned-1]}
     if assigned+1<len(regions):maximum=min(maximum,math.floor(regions[assigned+1][0]*RATE)-WINDOW);guards['sourceFollowingAcousticOrderRegion']={'index':assigned+1,'rangeSeconds':regions[assigned+1]}
    if overlapping:
     left,right=overlapping[0][0],overlapping[-1][0]
     if left:minimum=max(minimum,math.ceil(fullruns[left-1][1]*RATE)+WINDOW);guards['sourcePrevious']={'kind':'independent-source-energy-region-end','seconds':fullruns[left-1][1],'regionIndex':left-1}
     if right+1<len(fullruns):maximum=min(maximum,math.floor(fullruns[right+1][0]*RATE)-WINDOW);guards['sourceNext']={'kind':'independent-source-energy-region-start','seconds':fullruns[right+1][0],'regionIndex':right+1}
     guards['sourceOverlappingSpeechLikeRegions']=[{'index':i,'rangeSeconds':[a,b]}for i,a,b in overlapping]
   elif t.get('unit')in ['sentence','line']:
    related=excluded.get(t['id'],[t['id']]);indices=[i for i,z in enumerate(sentence_heads)if z['id']in related]
    guards['skippedParentChildRelations']={'parentID':t['id'],'leafChildIDs':related}if t['id']in excluded else None
    guards['sameIDGeometryAlternativesPolicy']='Neighbor bounds use max previous raw end/min next raw start across alternatives, never arbitrary first geometry.'
    if indices:
     left,right=min(indices),max(indices)
     if left:prev=sentence_heads[left-1];minimum=max(0,math.floor(prev['_extent'][1]*RATE));guards['sourcePrevious']={'kind':'previous-canonical-leaf-source-unit-raw-end','id':prev['id'],'sourceZH':prev['sourceZH'],'extentSeconds':prev['_extent'],'sourceExtentAlternatives':prev['_sourceExtentAlternatives'],'rawEvidence':prev.get('rawEvidence')}
     if right+1<len(sentence_heads):nxt=sentence_heads[right+1];maximum=min(len(pcm),math.ceil(nxt['_extent'][0]*RATE));guards['sourceNext']={'kind':'next-canonical-leaf-source-unit-raw-start','id':nxt['id'],'sourceZH':nxt['sourceZH'],'extentSeconds':nxt['_extent'],'sourceExtentAlternatives':nxt['_sourceExtentAlternatives'],'rawEvidence':nxt.get('rawEvidence')}
   minimum=max(0,minimum);maximum=min(len(pcm),maximum);guards['minimumStartFrame']=minimum;guards['maximumEndFrame']=maximum
   def quiet(f):
    if not 0<=f<=len(pcm):return False
    a=m.db(pcm,max(0,f-WINDOW),f);b=m.db(pcm,f,min(len(pcm),f+WINDOW))
    return (a is None or a<=QUIET_DB)and(b is None or b<=QUIET_DB)
   def silence_only(a,b):
    if a>=b:return True
    for start in range(a,b,STEP):
     value=m.db(pcm,start,min(b,start+STEP))
     if value is not None and value>QUIET_DB:return False
    return True
   edge=[]
   for side,frame in [('start',first),('end',last)]:
    valid=lambda point:minimum<=point if side=='start'else point<=maximum
    if valid(frame)and quiet(frame):new=frame;method='original-edge-within-source-neighbor-limits-and-40ms-quiet'
    else:
     options=[]
     for move in range(STEP,MAX_MOVE+1,STEP):
      point=frame-move if side=='start'else frame+move
      if 0<=point<=len(pcm)and valid(point)and quiet(point):options.append((point,'nearest-outward-source-bounded-40ms-quiet-valley'));break
     if not options:
      # Inward moves are limited to entirely quiet padding, never any voiced source frames.
      for move in range(STEP,MAX_MOVE+1,STEP):
       point=frame+move if side=='start'else frame-move
       a,b=sorted([point,frame])
       if 0<=point<=len(pcm)and valid(point)and quiet(point)and silence_only(a,b):options.append((point,'silence-only-inward-padding-trim-within-source-neighbor-limits'));break
     if options:new,method=options[0]
     else:new=frame;method='held-no-source-bounded-quiet-cut-needs-independent-phoneme-context-review'
    if side=='start':first=new
    else:last=new
    edge.append({'side':side,'oldFrame':frame,'newFrame':new,'quiet40ms':quiet(new),'withinNeighborLimits':valid(new),'method':method})
   if not 0<=first<last<=len(pcm):raise ValueError('Invalid proposed clip '+t['id'])
   old_geometry={'sourceSampleRange16k':old,'cropPCM_SHA256':t.get('cropPCM_SHA256'),'candidateId':t.get('candidateId'),'start':t['start'],'end':t['end']}
   t.update({'sourceSampleRange16k':[first,last],'start':first/RATE,'end':last/RATE,'sourcePCM_SHA256':m.sha(blob),'boundaryRefinementOriginalGeometry':old_geometry,'boundaryRefinementSourceGuards':guards,'boundaryRefinementEdges':edge,'boundaryRefinementPolicy':{'sampleRate':RATE,'edgeWindowFrames':WINDOW,'quietEdgeDbFS':QUIET_DB,'maximumMovementFrames':MAX_MOVE,'paddingTrimRequiresEvery10msQuiet':True,'quietEdgesArePhonemeCertification':False},'boundaryRefinementStatus':'candidate-geometry-ready-for-independent-review'if all(e['quiet40ms']and e['withinNeighborLimits']for e in edge)else'held-needs-independent-phoneme-context-review','boundaryRefinementProducerSHA256':producer_sha,'boundaryRefinementPipelineSHA256':pipeline_sha,'productionApproved':False})
   for k in ['cropPCMFile','cropPCM_SHA256','cropDurationSeconds','candidateId','boundaryRMSDbFS20ms','wordPronunciationRunCount','wordPronunciationAcousticRuns']:t.pop(k,None)
   prepared.append(t);changes.append({'id':t['id'],'sourceTrack':source,'old':old,'proposed':[first,last],'edges':edge,'guards':guards})
 summary={'targets':len(prepared),'geometryChanged':sum(z['old']!=z['proposed']for z in changes),'candidateQuietAndSourceBounded':sum(all(e['quiet40ms']and e['withinNeighborLimits']for e in z['edges'])for z in changes),'heldPhonemeContext':sum(not all(e['quiet40ms']and e['withinNeighborLimits']for e in z['edges'])for z in changes)}
 result={**data,'targets':prepared,'boundaryRefinementSummary':summary};output.mkdir(parents=True,exist_ok=True);producers=output/'producers';producers.mkdir(exist_ok=True);(producers/(producer_sha+'.py')).write_bytes(producer_blob);(producers/(pipeline_sha+'.py')).write_bytes(pipeline_blob);m.prepare_crops(root,result,output,cache);m.save(output/'boundary-refinement.json',{'schemaVersion':1,'summary':summary,'producerSHA256':producer_sha,'pipelineSHA256':pipeline_sha,'targets':changes});print(json.dumps(summary));return result

def main():
 a=argparse.ArgumentParser(description=__doc__);a.add_argument('--repo-root');a.add_argument('--input',required=True);a.add_argument('--output',required=True);args=a.parse_args();root=Path(args.repo_root).resolve()if args.repo_root else next(p for p in Path(__file__).resolve().parents if(p/'course-app/content/audio-manifest.json').is_file());inputfile=Path(args.input);inputfile=inputfile if inputfile.is_absolute()else root/inputfile;output=Path(args.output);output=output if output.is_absolute()else root/output;run(root,inputfile,output)
if __name__=='__main__':main()
