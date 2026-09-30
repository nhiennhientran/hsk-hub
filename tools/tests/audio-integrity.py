"""Compare uploaded recordings with deployed recordings and validate segment bounds.
Usage: python tools/tests/audio-integrity.py UPLOAD_AUDIO_DIR OUTPUT_JSON
No credentials are read or written by this test.
"""
import concurrent.futures, hashlib, json, pathlib, subprocess, sys
import numpy as np
from scipy.signal import correlate
ROOT = pathlib.Path(__file__).resolve().parents[2] / 'new-hsk1/hsk1'
UPLOADED = pathlib.Path(sys.argv[1]).resolve()
OUTPUT = pathlib.Path(sys.argv[2]).resolve()

def decode(path):
    return np.frombuffer(subprocess.check_output(['ffmpeg', '-v','error','-i',str(path),'-vn','-ac','1','-ar','8000','-f','f32le','-']), dtype=np.float32)

def compare(source):
    target=ROOT/'audio'/source.name
    a,b=decode(source),decode(target)
    c=correlate(a,b,mode='full',method='fft')
    lag=int(np.argmax(c))-(len(b)-1)
    aa=a[max(lag,0):min(len(a),len(b)+lag)]
    bb=b[max(-lag,0):min(len(b),len(a)-lag)]
    return {'name':source.name, 'sourceSeconds':len(a)/8000, 'deployedSeconds':len(b)/8000,
            'deployedOffsetSeconds':-lag/8000, 'alignedCorrelation':float(np.corrcoef(aa,bb)[0,1]),
            'byteIdentical':hashlib.sha256(source.read_bytes()).digest()==hashlib.sha256(target.read_bytes()).digest()}

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    comparisons=list(pool.map(compare,sorted(UPLOADED.glob('*.mp3'))))
js=(ROOT/'textbook-audio-segments.js').read_text()
segments=json.loads(js.split('window.HSK1_OFFICIAL_SEGMENTS=',1)[1].split(';})();')[0])
durations={x['name'][:-4]:x['deployedSeconds'] for x in comparisons}
manifest=json.loads((ROOT/'textbook-audio-manifest.json').read_text())
manifest_errors=[]
for entry in manifest['entries']:
    target=ROOT/entry['file']
    if target.stat().st_size!=entry['bytes'] or hashlib.sha256(target.read_bytes()).hexdigest()!=entry['sha256']:
        manifest_errors.append(entry['id'])
invalid=[]
count=0
for kind in ('text','vocab'):
    for track,rows in segments[kind].items():
        for i,row in enumerate(rows):
            start,end=row[-2:];count+=1
            if track not in durations or start<0 or end<=start or end>durations[track]+0.03:
                invalid.append({'kind':kind,'track':track,'index':i,'range':[start,end],'duration':durations.get(track)})
report={'recordingCount':len(comparisons),'manifestErrors':manifest_errors,'sourceAudioEquivalent':all(x['alignedCorrelation']>=.98 and abs(x['deployedOffsetSeconds'])<.1 for x in comparisons),
        'minAlignedCorrelation':min(x['alignedCorrelation'] for x in comparisons),
        'maxAbsoluteOffsetSeconds':max(abs(x['deployedOffsetSeconds']) for x in comparisons),
        'validatedSegmentCount':count,'invalidSegments':invalid,'comparisons':comparisons,
        'limitations':['Waveform comparison confirms same recording content, not linguistic correctness or perceptual segment-boundary quality.']}
OUTPUT.parent.mkdir(parents=True,exist_ok=True);OUTPUT.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in report.items() if k!='comparisons'},ensure_ascii=False,indent=2))
if invalid or manifest_errors or not report['sourceAudioEquivalent']:sys.exit(1)
