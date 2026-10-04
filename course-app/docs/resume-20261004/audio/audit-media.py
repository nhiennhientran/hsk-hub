from pathlib import Path
import hashlib,json,subprocess,concurrent.futures,datetime
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
issues=[]
manifest=json.loads((ROOT/'course-app/content/audio-manifest.json').read_text())['tracks']
old=json.loads((ROOT/'new-hsk1/hsk1/textbook-audio-manifest.json').read_text())['entries']
checked=[]
for tracks,base,group in [(manifest,ROOT/'course-app/public','hsk2-3'),(old,ROOT/'new-hsk1/hsk1','hsk1')]:
 for t in tracks:
  p=base/t['file']; ok=p.is_file() and sha(p)==t['sha256'] and p.stat().st_size==t['bytes'];checked.append({'group':group,'id':t['id'],'file':str(p.relative_to(ROOT)),'hashAndBytesMatch':ok})
  if not ok:issues.append('manifest bytes/hash '+str(p))
authority=json.loads((ROOT/'course-app/content/audio-segment-authority.json').read_text())
sourceCounts={'words':0,'lines':0,'sentences':0}
for lessonId,s in authority['lessons'].items():
 l=json.loads((ROOT/f"course-app/content/hsk{s['level']}/lesson-{s['number']:02d}.json").read_text())
 for w in l['vocabulary']:
  expected={'level':s['level'],'lesson':s['number'],'track':f"course-assets/hsk{s['level']}/audio/{w['audioTrack']}.mp3",'sourceText':w['zh'],'sourcePinyin':w['py']}
  if authority['words'].get(w['id'])!=expected:issues.append('word source binding '+w['id'])
  sourceCounts['words']+=1
 for text in l['texts']:
  for line in text['lines']:
   bound=authority['lines'].get(line['id']);expected={'level':s['level'],'lesson':s['number'],'track':f"course-assets/hsk{s['level']}/audio/{text['audioTrack']}.mp3",'sourceText':line['zh'],'sourcePinyin':line['py']}
   if not bound or any(bound.get(k)!=v for k,v in expected.items()):issues.append('line source binding '+line['id'])
   if bound and ''.join(v['sourceText'] for v in bound['sentences'])!=line['zh']:issues.append('sentence reconstruction '+line['id'])
   sourceCounts['lines']+=1;sourceCounts['sentences']+=len(bound['sentences']) if bound else 0

def decode(item):
 file,t=item;p=ROOT/'course-app/public'/file
 meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_entries','stream=sample_rate,channels:format=duration','-of','json',str(p)]))
 stream=meta['streams'][0];pcm=subprocess.run(['ffmpeg','-v','error','-i',str(p),'-map','0:a:0','-vn','-ac','1','-ar','16000','-f','f32le','-'],capture_output=True)
 duration=len(pcm.stdout)/(4*16000)
 row={'file':file,'sourceHashMatch':sha(p)==t['sourceHash'],'pcmSampleRate':16000,'pcmChannels':1,'decodedDuration':duration,'expectedDecodedDuration':t['decodedDuration'],'containerDuration':float(meta['format']['duration']),'expectedContainerDuration':t['containerDuration'],'decodeReturnCode':pcm.returncode,'decodeStderr':pcm.stderr.decode(),'pcmHash':hashlib.sha256(pcm.stdout).hexdigest()}
 row['passed']=row['sourceHashMatch'] and abs(duration-t['decodedDuration'])<.00001 and abs(row['containerDuration']-t['containerDuration'])<.00001 and pcm.returncode==0 and not pcm.stderr
 return row
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:decodes=list(pool.map(decode,authority['tracks'].items()))
for r in decodes:
 if not r['passed']:issues.append('decode/duration '+r['file'])
report={'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'manifestTracksChecked':len(checked),'hsk1Tracks':len(old),'hsk2And3Tracks':len(manifest),'authorityTracksDecoded':len(decodes),'sourceCounts':sourceCounts,'issues':issues,'manifestChecks':checked,'decodes':decodes,'limitations':['No human listening, lexical-tone certification, physical-device test or original uploaded archive comparison performed.','Source binding checked against current lesson JSON; source PDF semantics rely on prior reviews.']}
(OUT/'media-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['manifestChecks','decodes']},ensure_ascii=False,indent=2))
raise SystemExit(bool(issues))
