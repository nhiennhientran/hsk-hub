const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=__dirname;
function assert(c,m){if(!c)throw new Error(m)}
function read(n){return fs.readFileSync(path.join(root,n),'utf8')}
// Modular release: verify the actual frozen payload instead of classic-script ordering.
// Either marker opts into strict validation; a partial or corrupt release must fail.
if(fs.existsSync(path.join(root,'release-manifest.json')) || /<script\s+type="module"/.test(read('index.html'))){
  const manifest=JSON.parse(read('release-manifest.json'));
  assert(manifest.schema===1 && /^[a-f0-9]{40}$/.test(manifest.sourceCommit),'Invalid release identity');
  assert(manifest.productionBase==='/hsk-hub/new-hsk1/hsk1/','Wrong production base');
  assert(manifest.productionRecoveryCommit==='a74bd15736e894e1640a4a1848942f4cbc7ca9f8','Wrong production recovery point');
  assert(Array.isArray(manifest.files)&&manifest.files.length>360,'Incomplete release inventory');
  const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
  assert(hash(JSON.stringify(manifest.files))===manifest.buildId,'Build identity mismatch');
  const paths=new Set();
  for(const file of manifest.files){
    assert(typeof file.path==='string'&&!path.isAbsolute(file.path)&&!file.path.includes('\\')&&!file.path.includes('\0')&&file.path.split('/').every(part=>part&&part!=='.'&&part!=='..')&&!paths.has(file.path),'Unsafe or duplicate release path');
    paths.add(file.path);
    const bytes=fs.readFileSync(path.join(root,file.path));
    assert(bytes.length===file.bytes && hash(bytes)===file.sha256,'Release payload mismatch: '+file.path);
  }
  for(const entry of ['index.html','lesson.html','learning.html','lesson9-pilot.html','help.html'])assert(paths.has(entry),'Required release entry missing: '+entry);
  assert(!manifest.files.some(file=>file.path.endsWith('.map')),'Public source maps are forbidden');
  for(const file of manifest.files.filter(file=>/\.(?:js|css)$/.test(file.path)))assert(!/sourceMappingURL=|PASSWORD_SIGNATURE/.test(read(file.path)),'Public source-map or reversible fallback reference');
  const html=read('index.html');
  assert(read('lesson.html')===html&&read('learning.html')===html,'Entry alias drift');
  assert((html.match(/<script\b/g)||[]).length===1&&/<script type="module"/.test(html),'Expected one modular boot');
  for(const match of html.matchAll(/(?:src|href)="(\.\/[^"#?]+)"/g))assert(paths.has(match[1].slice(2)),'Untracked entry asset');
  assert(manifest.files.filter(f=>/^course-assets\/audio\/.*\.mp3$/.test(f.path)).length===93,'Original audio inventory mismatch');
  assert(manifest.files.filter(f=>/^course-assets\/hanzi\/.*\.json$/.test(f.path)).length===267,'Hanzi inventory mismatch');
  for(const file of manifest.files.filter(f=>/\.(?:js|css|html|map)$/.test(f.path)))assert(!/learning-integrated\.js|createEntryModule|stopExternal|window\.(?:HSK1Stage2|HSK1Stage3|HSKLearning)/.test(read(file.path)),'Legacy runtime in modular release: '+file.path);
  console.log(JSON.stringify({ok:true,architecture:'modular',sourceCommit:manifest.sourceCommit,buildId:manifest.buildId,verifiedFiles:manifest.files.length,originalTracks:93,hanzi:267}));
  process.exit(0);
}
const core=read('app-core.js'),lesson=read('lesson.html'),player=read('textbook-segment-audio.js'),guard=read('textbook-audio-guard.js'),tts=read('tts-only.js'),segments=read('textbook-audio-segments.js'),parity=read('../assets/hsk2-parity.js');

assert(!core.includes('speak(w.zh)'),'app-core still routes vocab to TTS');
assert(!/function speakAllVocab\(\)\{speak/.test(core),'app-core still routes whole vocab to TTS');
assert(!core.split('\n').find(x=>x.startsWith('function showWordDetail'))?.includes('onclick="speak('),'word detail still uses TTS');
assert(!core.split('\n').find(x=>x.startsWith('function drawScene'))?.includes('onclick="speak('),'text dialogue still uses TTS');
assert(core.includes('playOfficialVocab(w.zh)'),'official vocab route missing');
assert(core.includes('playOfficialVocabLesson()'),'official whole-vocab route missing');
assert(core.includes('playOfficialTextScene(${sceneIndex})'),'rendered scene route must bind the numeric scene index');
assert(core.includes('playOfficialTextLine(${sceneIndex},${i})'),'rendered line route must bind numeric scene and line indexes');
assert(!core.includes('onclick="playOfficialTextScene(sceneIndex)"'),'inline scene handler still depends on lexical sceneIndex');
assert(!core.includes('onclick="playOfficialTextLine(sceneIndex,'),'inline line handler still depends on lexical sceneIndex');
assert(core.includes('function renderGrammar')&&core.includes('onclick="speak('),'grammar/Hanzi TTS unexpectedly removed');
assert(parity.includes('function playParityWord(v)'),'parity official word router missing');
assert(parity.includes("if(LEVEL!==1){if(typeof speak==='function')speak(v.zh);return true}"),'shared parity no longer preserves HSK3 TTS');
assert(!parity.includes("q('.speak-word',card).onclick=e=>{e.stopPropagation();speak(v.zh)}"),'parity card still routes HSK1 vocab to TTS');
assert(!parity.includes("q('#parityWordSpeak').onclick=()=>speak(v.zh)"),'parity detail still routes HSK1 vocab to TTS');
assert(parity.includes('configureParityWordAudioButton(speakWordBtn,v)'),'parity card official-state decoration missing');
assert(parity.includes('configureParityWordAudioButton(parityWordSpeak,v)'),'parity detail official-state decoration missing');

assert(!player.includes('_audio-work'),'player still depends on underscore work directory');
assert(!/\bfetch\s*\(/.test(player),'player still fetches runtime maps');
assert(!player.includes("addEventListener('click'"),'player still intercepts click events');
assert(!/speechSynthesis\s*\.\s*speak/.test(player),'player synthesizes speech');
assert(player.includes("a.preload='auto'"),'player preload auto missing');
assert(player.includes('function seekThen('),'seek-settle protection missing');
assert(player.includes('window.HSK1_OFFICIAL_SEGMENTS'),'static segment source missing');
assert(player.includes("#vocabGrid .vcard"),'player does not recognize parity vocab cards');
assert(player.includes("#parityWordSpeak"),'player does not recognize parity word detail button');

assert(!tts.includes("addEventListener('click'"),'TTS-only layer still captures buttons globally');
assert(tts.includes('window.speak=robustSpeak'),'TTS-only global speak missing');
assert(tts.includes('synth.speak(u)'),'TTS-only engine does not synthesize grammar/Hanzi');

assert(!guard.includes('loadScript('),'guard still dynamically loads official layer');
assert(!guard.includes('textbook-segment-audio.js?v='),'guard still owns player loading');
assert(!/speechSynthesis\s*\.\s*speak/.test(guard),'guard synthesizes speech');

const required=['new-enrichment.js','textbook-data-corrections.js','textbook-audio-segments.js','textbook-segment-audio.js','app-core.js','../assets/hsk2-parity.js','tts-only.js','textbook-audio-guard.js','textbook-audio.js'];
let prev=-1;
for(const name of required){const p=lesson.indexOf(name);assert(p>prev,`bad/missing script order at ${name}`);prev=p}
assert(!lesson.includes('audio-fix.js'),'lesson still loads legacy audio-fix');
assert(!lesson.includes('_audio-work'),'lesson references underscore runtime assets');
assert(lesson.includes('../assets/hsk2-parity.js?v=20260818-5'),'parity cache-bust missing');
assert(lesson.includes('textbook-segment-audio.js?v=20261001-i2'),'current player cache-bust missing');
assert(player.includes('const remaining=end-audio.currentTime'),'native-clock range stop missing');
assert(!player.includes('audio.currentTime=end'),'range completion must not be manufactured by seeking to end');

const sandbox={window:{},console};sandbox.window.window=sandbox.window;
vm.runInNewContext(segments,sandbox,{filename:'textbook-audio-segments.js'});
const data=sandbox.window.HSK1_OFFICIAL_SEGMENTS;
assert(data&&data.version==='20260818-arch-v1','static segment object/version missing');
assert(Object.keys(data.text||{}).length===45,'expected 45 text tracks');
assert(Object.keys(data.vocab||{}).length===45,'expected 45 vocab tracks');
let textRows=0,vocabRows=0;
for(const a of Object.values(data.text))for(const r of a){assert(r[1]>r[0]&&r[0]>=0,'invalid text range');textRows++}
for(const a of Object.values(data.vocab))for(const r of a){assert(r[2]>r[1]&&r[1]>=0,'invalid vocab range');vocabRows++}
assert(textRows===202,`expected 202 text rows, got ${textRows}`);
assert(vocabRows===330,`expected 330 vocab rows, got ${vocabRows}`);
assert(data.unsupported['4'].length===12,'unsupported vocab exception count mismatch');
assert(data.crossLessonReuse['6']['西安'][0]==='15-4','西安 reuse missing');

const manifest=JSON.parse(read('textbook-audio-manifest.json'));
assert(manifest.count===93&&manifest.entries.length===93,'audio manifest count mismatch');
for(const e of manifest.entries){
  const p=path.join(root,e.file);assert(fs.existsSync(p),`missing audio ${e.file}`);
  const b=fs.readFileSync(p);assert(b.length===e.bytes,`${e.id}: byte size mismatch`);
  assert(crypto.createHash('sha256').update(b).digest('hex')===e.sha256,`${e.id}: SHA mismatch`);
}
console.log(JSON.stringify({status:'PASS',architecture:'static-direct-routing-with-parity',textTracks:45,textRows,vocabTracks:45,vocabRows,audioFiles:93,legacyAudioFixLoaded:false,runtimeFetch:false,playerClickInterception:false,parityOfficialVocab:true,parityDetailOfficialVocab:true,hsk3TtsPreserved:true,literalSceneBinding:true}));
