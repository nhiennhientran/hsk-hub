#!/usr/bin/env python3
"""Verify independent CTC evidence bytes and actual source frames; never approve."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

MODEL='c71f0ce00bec95b07744e116345e33d8cbbe08cef896382cf907bf4b51a2cd51'
TOKENS='f449eb28dc567533d7fa59be34e2abca8784f771850c78a47fb731a31429a1dc'
OPTIONS=dict(sample_rate=16000,feature_dim=80,num_threads=2,language='zh',use_itn=False,
             decoding_method='greedy_search',provider='cpu',debug=False)
sha=lambda b:hashlib.sha256(b).hexdigest()


def verify(root,index_path):
    def path(p):
        p=Path(p);return p if p.is_absolute()else root/p
    def pinned(p,digest):
        p=path(p);b=p.read_bytes()
        if sha(b)!=digest:raise ValueError('evidence SHA mismatch: '+str(p))
        return json.loads(b)
    index=json.loads(index_path.read_text())
    inp=pinned(index['inputFile'],index['inputSHA256'])
    run=pinned(index['runFile'],index['runSHA256'])
    if run['options']!=OPTIONS or run['inputSHA256']!=index['inputSHA256']:
        raise ValueError('CTC execution options/input mismatch')
    by_key={(x['id'],x['candidateId']):x for x in inp['targets']}
    bindings={(x['id'],x['candidateId']):x for x in run['completedCrops']}
    index_keys=[(x['id'],x['candidateId'])for x in index['targets']]
    if len(by_key)!=len(inp['targets'])or len(bindings)!=len(run['completedCrops'])or set(bindings)!=set(by_key):
        raise ValueError('CTC target coverage/unique binding mismatch')
    if len(set(index_keys))!=len(index_keys)or set(index_keys)!=set(by_key):
        raise ValueError('CTC evidence index must bind every exact target key once')
    originals={};observations=[];raw_checked=set();proof_checked=set()
    fields=('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')
    for item in index['targets']:
        key=(item['id'],item['candidateId']);candidate=by_key[key];binding=bindings[key]
        if any(candidate[k]!=item[k] or binding[k]!=item[k] for k in fields):
            raise ValueError('CTC semantic binding/source geometry mismatch')
        if binding['inputSHA256']!=index['inputSHA256'] or binding['sourcePromptUsed'] is not False:
            raise ValueError('CTC source prompt/input mismatch')
        source_key=(item['sourceTrack'],item['sourceSHA256'])
        if source_key not in originals:
            source=path(item['sourceTrack'])
            if not source.is_file():source=root/'course-app/public'/item['sourceTrack']
            if sha(source.read_bytes())!=item['sourceSHA256']:raise ValueError('original MP3 mismatch')
            pcm=subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(source),'-map','0:a:0',
                                '-ac','1','-ar','16000','-f','f32le','-'],capture_output=True,
                               check=True,timeout=60).stdout
            if len(pcm)%4 or sha(pcm)!=item['sourcePCM_SHA256']:raise ValueError('original PCM mismatch')
            originals[source_key]=pcm
        pcm=originals[source_key];a,b=item['sourceSampleRange16k']
        if type(a)is not int or type(b)is not int or not 0<=a<b<=len(pcm)//4:
            raise ValueError('invalid actual CTC input frame range')
        if sha(pcm[a*4:b*4])!=item['cropPCM_SHA256']:raise ValueError('actual crop PCM mismatch')
        ref=item['independentCTC'];raw=pinned(ref['file'],ref['sha256'])
        if ref['file']!=binding['inferenceFile'] or ref['sha256']!=binding['inferenceSHA256']:
            raise ValueError('CTC raw/binding bytes mismatch')
        if raw['modelSHA256']!=MODEL or raw['tokensSHA256']!=TOKENS or raw['options']!=OPTIONS:
            raise ValueError('CTC model/options mismatch')
        if raw['actualInputSamples']!=b-a or raw['cropPCM_SHA256']!=item['cropPCM_SHA256']:
            raise ValueError('CTC actual input identity mismatch')
        for name in ('expectedTextPromptUsed','hotwordsUsed','externalLanguageModelUsed',
                     'inverseTextNormalizationUsed','homophoneReplacementUsed','producerAlteredSourceSamples'):
            if raw[name]is not False:raise ValueError('CTC conditioning/source alteration prohibited')
        if raw['producerAddedSilenceFrames']!=0:raise ValueError('synthetic silence prohibited')
        for kind in ('script','provenance'):
            file,digest=raw[kind+'File'],raw[kind+'SHA256'];proofkey=(file,digest)
            if proofkey not in proof_checked:
                bytes_=path(file).read_bytes()
                if sha(bytes_)!=digest:raise ValueError('CTC '+kind+' bytes mismatch')
                if kind=='provenance':
                    provenance=json.loads(bytes_);modeldir=Path(provenance['modelDirectory'])
                    for f in provenance['modelFiles']:
                        if sha((modeldir/f['name']).read_bytes())!=f['sha256']:
                            raise ValueError('CTC actual model-file bytes mismatch')
                    for package in provenance['packages']:
                        if sha(Path(package['localPath']).read_bytes())!=package['sha256']:
                            raise ValueError('CTC package wheel bytes mismatch')
                proof_checked.add(proofkey)
        native=json.loads(raw['rawResultString'])
        if native!=raw['rawResult']or native['text']!=raw['rawText']or raw['rawText']!=ref['rawText']:
            raise ValueError('CTC native raw prediction modified')
        # Native timestamps are CTC token emission points, never word durations or cut anchors.
        stamps=native.get('timestamps',[])
        if len(stamps)!=len(native.get('tokens',[]))or any(not isinstance(x,(int,float))or x<0 or x>(b-a)/16000+.1 for x in stamps):
            raise ValueError('CTC native token emission-point schema mismatch')
        raw_checked.add(ref['file'])
        observations.append({'id':item['id'],'candidateId':item['candidateId'],
                             **{k:item[k]for k in fields},'rawText':raw['rawText'],
                             'rawEvidence':{'file':ref['file'],'sha256':ref['sha256']},
                             'tokenEmissionPointsAreNotPhonemeBoundaries':True,
                             'completePhonemeDecisionStillRequired':True})
    return {'schemaVersion':1,'status':'independent-CTC-bytes-source-frames-verified-not-approved',
            'reviewerScriptSHA256':sha(Path(__file__).read_bytes()),
            'evidenceIndex':{'file':str(index_path.relative_to(root)),'sha256':sha(index_path.read_bytes())},
            'originalSourcesIndependentlyDecoded':len(originals),'actualCandidateVariants':len(observations),
            'rawPredictionsIndependentlyVerified':len(raw_checked),'automaticApproval':False,
            'certifications':{'humanListening':False,'nativeSpeakerReview':False,
                              'phonemeCompleteCertified':False,'pronunciationToneCertified':False},
            'observations':observations}


if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--repo-root',required=True);ap.add_argument('--index',required=True);ap.add_argument('--output',required=True)
    args=ap.parse_args();root=Path(args.repo_root).resolve();index=Path(args.index);index=index if index.is_absolute()else root/index
    result=verify(root,index);output=Path(args.output);output=output if output.is_absolute()else root/output
    output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items()if k!='observations'},ensure_ascii=False))
