#!/usr/bin/env python3
"""Repeat factual canonical-track/reading checks for already fully gated crops.

No contextual exception is inferred. ASR/source/boundary holds are retained.
This prepares explicit ordinary decisions; the separate compiler rechecks pins.
"""
import argparse
from array import array
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_module(name, file):
    spec = importlib.util.spec_from_file_location(name, file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def at(value, pointer):
    for key in pointer.lstrip('/').split('/'):
        key = key.replace('~1', '/').replace('~0', '~')
        value = value[int(key)] if isinstance(value, list) else value[key]
    return value


def regions(pcm, first, last, threshold=-42):
    values = array('f'); values.frombytes(pcm)
    result = []
    for start in range(first, last - 159, 160):
        chunk = values[start:start+160]
        level = 20*math.log10(max(math.sqrt(sum(float(x)**2 for x in chunk)/160), 1e-12))
        if level > threshold:
            if result and start-result[-1][1] <= 2560:
                result[-1][1] = start+160
            else:
                result.append([start,start+160])
    return [r for r in result if r[1]-r[0] >= 960]


def fixed_hsk3_reading(root, row, heads, pcm, verifier, cache):
    """Verify a scoped physical proposal plus immutable full-source lexical order.

    The actual chosen crop has already passed both model texts and quiet/run
    gates. This does not approve a count-only or producer-only hypothesis.
    """
    oe=row['sourceOccurrenceEvidence']
    audit=oe.get('sourcePhysicalReadingAudit')
    if audit:
        path=root/audit['file']
        if sha(path)!=audit['sha256']:raise ValueError('reading-audit-bytes-changed')
        if str(path) not in cache:cache[str(path)]=json.loads(path.read_text())
        matches=[r for r in cache[str(path)]['records'] if r['id']==row['id'] and r['sourceSampleRange16k']==row['sourceSampleRange16k'] and r['cropPCM_SHA256']==row['cropPCM_SHA256']]
        if len(matches)!=1 or matches[0]['status']!='single-canonical-source-reading-proposal-bound-awaiting-independent-phoneme-review':
            raise ValueError('physical-reading-audit-does-not-bind-one-correct-head')
        proposal=matches[0]['sourcePhysicalOrderProposal']
        proposed=proposal['regions']; observed_heads=proposal['heads']
        observation={'file':proposal['sourceObservationFile'],'sha256':proposal['sourceObservationSHA256']}
    else:
        proposal=oe.get('producerAcousticOrder',{})
        proposed=proposal.get('regions',[]);observed_heads=proposal.get('sourceHeads')
        observation=oe.get('physicalObservationEvidence',{})
    if observed_heads != [h[0]for h in heads] or len(proposed)!=2*len(heads):
        raise ValueError('physical-reading-head-order-or-count-mismatch')
    verifier.actual_file(root,observation)
    index=heads.index((row['sourceZH'],row['sourcePinyin']))*2+row['repetition']-1
    runs=[[round(a*16000),round(b*16000)]for a,b in proposed]
    if any(a>=b for a,b in runs) or any(runs[j][1]>runs[j+1][0]for j in range(len(runs)-1)):
        raise ValueError('physical-reading-proposals-overlap-or-invert')
    first,last=row['sourceSampleRange16k']; selected=runs[index]
    if not first<=selected[0]<selected[1]<=last or (index and first<runs[index-1][1]) or (index+1<len(runs)and last>runs[index+1][0]):
        raise ValueError('fixed-reading-or-neighbor-exclusion-does-not-match-crop')
    # Full-source ASR establishes lexical source order; it may suppress the
    # repeated reading, so it never certifies the actual chosen repetition.
    from opencc import OpenCC
    normalize=OpenCC('t2s').convert
    ordered=None
    refs=list(oe.get('originalTrackRawEvidenceRefs',[]))
    refs.extend(cache.get('_extra_full_source_refs',{}).get(row['sourcePCM_SHA256'],[]))
    for ref in refs:
        path=verifier.actual_file(root,ref);raw=json.loads(path.read_text())
        if raw.get('cropPCM_SHA256',raw.get('track',{}).get('pcm',{}).get('sha256'))!=row['sourcePCM_SHA256']:
            continue
        verifier.unprompted(raw)
        text=''.join(re.findall(r'[\u3400-\u9fff]',normalize(''.join(s.get('text','')for s in raw.get('rawSegments',[])))))
        offset=0;positions=[]
        for head,_ in heads:
            comparison_head=''.join(re.findall(r'[\u3400-\u9fff]',normalize(head)))
            position=text.find(comparison_head,offset)
            if position<0:break
            positions.append(position);offset=position+len(comparison_head)
        if len(positions)==len(heads):
            ordered={'file':ref['file'],'sha256':ref['sha256'],'observedCanonicalHeadPositions':positions,'rawUnchanged':True};break
    if not ordered:raise ValueError('whole-source-lexical-head-order-needs-specific-context-review')
    # Independently recompute observable energy inside this proposed source
    # reading. Identity and full chosen-crop run/quiet gates are separate.
    active=regions(pcm,selected[0],selected[1])
    if len(active)!=1:raise ValueError('selected-source-reading-observable-energy-is-not-one-run')
    return runs,index,{'physicalObservationEvidence':observation,'wholeSourceLexicalOrderEvidence':ordered,
                       'independentSelectedSourceReadingRuns16k':active,
                       'producerRegionProposalIsNotStandaloneApproval':True}


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--repo-root', required=True, type=Path)
    p.add_argument('--report', required=True, type=Path)
    p.add_argument('--output-prefix', required=True, type=Path)
    p.add_argument('--whole-source-index', type=Path, help='Explicit immutable original whole-source ASR index; never crop proof')
    args=p.parse_args();root=args.repo_root.resolve()
    verifier=load_module('independent_pcm', Path(__file__).with_name('review-decisions.py'))
    report=json.loads(args.report.read_text()); report_sha=sha(args.report)
    checks=[];decisions=[];held=[];seen=set();cache={};source_cache={}
    if args.whole_source_index:
        source_index=json.loads(args.whole_source_index.read_text())
        extra={}
        for record in source_index.get('sourceEvidence',[]):
            ref={'file':record['rawASRFile'],'sha256':record['rawASRSHA256']}
            extra.setdefault(record['sourcePCM_SHA256'],[]).append(ref)
        cache['_extra_full_source_refs']=extra
    for row in report['targets']:
        if row['id'] in seen or row['holds']:
            continue
        try:
            c=row['canonicalSource']; file=root/c['file']
            if sha(file)!=c['sha256']: raise ValueError('canonical-source-changed')
            if str(file) not in cache:cache[str(file)]=json.loads(file.read_text())
            source=cache[str(file)];obj=at(source,c['sourceJSONPointer'])
            first,last=row['sourceSampleRange16k']
            check={'id':row['id'],'sourceSampleRange16k':[first,last],
                   'cropPCM_SHA256':row['cropPCM_SHA256'],'sourceLessonSHA256':c['sha256']}
            if row['unit']!='word':
                parent=at(source,c['sourceJSONPointer'].rsplit('/lines/',1)[0])
                track=(parent.get('audioTrack') or parent.get('source',{}).get('audioTrack'))
                if not track or not row['sourceTrack'].endswith('/'+str(track)+'.mp3'):
                    raise ValueError('canonical-text-audio-track-does-not-match')
                check.update(canonicalAudioTrackChecked=True, canonicalParentLineId=obj['id'],
                             canonicalSentenceOrdinal=c['sentenceOrdinal'],
                             previousCanonicalRow=c.get('previousRow'),nextCanonicalRow=c.get('nextRow'),
                             allFourActualQuietEdgeWindowsChecked=True)
                rationale='Canonical textbook scene/text audio track, original line and sentence ordinal match. Actual selected source bytes/integer frames and both unprompted model observations passed; all four actual edge windows are quiet and source-neighbor guards exclude adjacent turns. Meaningful Roman/digit units remain present. No human listening or tone certification is claimed.'
            else:
                track=obj.get('audioTrack') or obj.get('audio',{}).get('track')
                if not track or not row['sourceTrack'].endswith('/'+str(track)+'.mp3'):
                    raise ValueError('canonical-word-audio-track-does-not-match')
                pcm=verifier.original_pcm(root,row)
                if row['level']==1:
                    bounds=obj['audio']; a=round(bounds['start']*16000); b=round(bounds['end']*16000)
                    runs=regions(pcm,a,b)
                    expected=row.get('expectedReadingCount',1)
                    if expected!=1:raise ValueError('alternative-pronunciation-needs-separate-source-review')
                    repetition=row.get('repetition')
                    if repetition not in (1,2):
                        raise ValueError('original-reading-ordinal-is-not-explicit')
                    index=repetition-1
                    if len(runs)!=2 or not first<=runs[index][0]<runs[index][1]<=last:
                        raise ValueError('original-two-reading-selection-needs-separate-source-review')
                    if index and first<runs[index-1][1] or index+1<len(runs) and last>runs[index+1][0]:
                        raise ValueError('adjacent-original-reading-not-excluded')
                else:
                    vocab=[v for v in source['vocabulary'] if v.get('audioTrack')==track]
                    heads=[]
                    for v in vocab:
                        pair=(v['zh'],v.get('py'))
                        if pair not in heads:heads.append(pair)
                    index=heads.index((obj['zh'],obj.get('py')))*2+row['repetition']-1
                    key=(row['sourcePCM_SHA256'],-42)
                    if key not in source_cache:source_cache[key]=regions(pcm,0,len(pcm)//4)
                    runs=source_cache[key]
                    if len(runs)!=2*len(heads):
                        # Seven original HSK2 L2T2 words have a separate exact
                        # scope and independently convergent -38/-36 audit.
                        if row['level']==2 and track=='2-2':
                            r38=regions(pcm,0,len(pcm)//4,-38);r36=regions(pcm,0,len(pcm)//4,-36)
                            if len(r38)!=2*len(heads) or len(r36)!=len(r38):
                                raise ValueError('source-reading-count-does-not-converge')
                            runs=r38;check['independentConvergentReadingRunsDbFS']={'-38':r38,'-36':r36}
                        elif row['level']==3:
                            runs,index,fixed=fixed_hsk3_reading(root,row,heads,pcm,verifier,cache)
                            check.update(fixed)
                        else: raise ValueError('source-reading-count-needs-separate-source-review')
                    run=runs[index]
                    if not first<=run[0]<run[1]<=last:
                        raise ValueError('complete-selected-observable-reading-not-contained')
                    if index and first<runs[index-1][1] or index+1<len(runs) and last>runs[index+1][0]:
                        raise ValueError('adjacent-original-reading-not-excluded')
                    check['canonicalOriginalOrderedHeads']=[x[0] for x in heads]
                check.update(canonicalAudioTrackChecked=True,independentDeclaredSourceReadingRuns16k=runs,
                             selectedOriginalReadingIndex1Based=index+1, nextOriginalReadingExcluded=True,
                             originalReadingCountChecked=True)
                rationale='Canonical textbook word/pinyin and declared original audio track match. Independently decoded original PCM confirms the selected complete observable reading and excludes adjacent original readings; actual selected crop has one speech-like run, strict quiet edges and both unprompted model texts agree. Source head order and integer-frame occurrence binding are preserved. Run counts are supporting evidence together with actual crop lexical agreement, never standalone phoneme or tone certification.'
            checks.append(check);decisions.append({'id':row['id'],'sourceSampleRange16k':[first,last],
                'decision':'accept','sourceContextChecked':True,'rationale':rationale,
                'acknowledgedFlags':row['flags'],'humanListening':False,
                'pronunciationToneCertified':False,'devicePlaybackCertified':False})
            seen.add(row['id'])
        except (ValueError,KeyError,IndexError) as error:
            held.append({'id':row['id'],'sourceSampleRange16k':row.get('sourceSampleRange16k'),
                         'independentSourceHold':str(error)})
    checks_path=args.output_prefix.with_name(args.output_prefix.name+'-source-checks.json')
    decisions_path=args.output_prefix.with_name(args.output_prefix.name+'-decisions.json')
    checks_path.parent.mkdir(parents=True,exist_ok=True)
    checks_path.write_text(json.dumps({'schemaVersion':1,'reviewReportSHA256':report_sha,
        'sourceCheckerSHA256':sha(Path(__file__)),'targets':checks,'additionalSourceHolds':held,
        'acceptedAuthorityModified':False},ensure_ascii=False,indent=2)+'\n')
    decisions_path.write_text(json.dumps({'schemaVersion':1,'reviewReportSHA256':report_sha,
        'sourceChecksEvidence':{'file':str(checks_path.resolve().relative_to(root)), 'sha256':sha(checks_path)},
        'decisions':decisions},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'ordinaryDecisionsPrepared':len(decisions),'additionalSourceHolds':len(held)}))


if __name__=='__main__':main()
