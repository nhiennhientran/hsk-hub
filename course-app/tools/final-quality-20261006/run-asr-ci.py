#!/usr/bin/env python3
"""Reproduce frozen source frames and run pinned unprompted ASR on a shard."""
import argparse
import hashlib
import gzip
import json
import os
from pathlib import Path
import subprocess
import sys

parser=argparse.ArgumentParser()
parser.add_argument('--level',type=int,choices=(1,2,3))
parser.add_argument('--batch')
parser.add_argument('--shard',type=int,choices=(0,1,2),required=True)
parser.add_argument('--model',choices=('small','medium'),default='medium')
args=parser.parse_args()
root=Path(__file__).resolve().parents[3]
if bool(args.batch)==bool(args.level):raise ValueError('Choose exactly one frozen main level or supplemental batch')
registry_path=root/('course-app/docs/final-quality-20261006/ci-audio-supplemental-inputs.json' if args.batch else 'course-app/docs/final-quality-20261006/ci-audio-inputs.json')
registry=json.loads(registry_path.read_text())
item=registry['batches'][args.batch] if args.batch else registry['inputs'][str(args.level)]
if args.batch and (args.model not in item['models'] or args.shard>=item['shards']):raise ValueError('Unregistered supplemental model or shard')
source=root/item['file']
if hashlib.sha256(source.read_bytes()).hexdigest()!=item['sha256']:
 raise ValueError('Frozen candidate input changed')
source_bytes=gzip.decompress(source.read_bytes()) if source.suffix=='.gz' else source.read_bytes()
if hashlib.sha256(source_bytes).hexdigest()!=item['expandedSHA256']:
 raise ValueError('Expanded frozen candidate input changed')
data=json.loads(source_bytes)
if args.batch:
 targets=[t for i,t in enumerate(data['targets']) if i%item['shards']==args.shard]
else:
 width=6 if args.level==3 else 5
 first=args.shard*width+1
 last=first+width-1
 targets=[t for t in data['targets']if first<=t['lesson']<=last]
if not targets:raise ValueError('Empty source-frame shard')
group=args.batch if args.batch else f'hsk{args.level}'
output=root/f'course-app/docs/final-quality-20261006/ci-asr/{group}-shard{args.shard}-{args.model}'
output.mkdir(parents=True,exist_ok=False)
input_path=output/'input.json'
input_path.write_text(json.dumps({**data,'targets':targets},ensure_ascii=False,indent=2)+'\n')
script=root/'course-app/tools/final-quality-20261006/audio_pipeline.py'
subprocess.run([sys.executable,str(script),'prepare-crops','--input',str(input_path),'--output',str(output)],check=True)
prepared_path=output/'candidates.json'
prepared=json.loads(prepared_path.read_text())
for before,after in zip(targets,prepared['targets'],strict=True):
 for field in ['id','sourceTrack','sourceSHA256','sourceSampleRange16k','sourcePCM_SHA256','cropPCM_SHA256']:
  if before[field]!=after[field]:raise ValueError('CI source/crop byte identity changed: '+before['id']+' '+field)
for name in ['HF_HUB_DISABLE_IMPLICIT_TOKEN','HF_HUB_DISABLE_XET','HF_HUB_DISABLE_TELEMETRY']:
 os.environ[name]='1'
os.environ['HF_HUB_DOWNLOAD_TIMEOUT']='60'
from huggingface_hub import snapshot_download
revision={'small':'536b0662742c02347bc0e980a01041f333bce120','medium':'08e178d48790749d25932bbc082711ddcfdfbc4f'}[args.model]
snapshot=snapshot_download(repo_id='Systran/faster-whisper-'+args.model,revision=revision,cache_dir=str(root/'course-app/.repro-output/asr-model-cache'),token=False,allow_patterns=['config.json','model.bin','tokenizer.json','vocabulary.*'],max_workers=2)
subprocess.run([sys.executable,str(script),'infer','--input',str(prepared_path),'--output',str(output/'inference'),'--model',args.model,'--model-path',snapshot,'--threads','2'],check=True)
print(json.dumps({'level':args.level,'batch':args.batch,'shard':args.shard,'model':args.model,'candidateCount':len(targets),'status':'actual-crop-ASR-complete-awaiting-independent-review'}),flush=True)
