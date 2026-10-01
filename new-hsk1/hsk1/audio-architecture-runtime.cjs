const fs=require('fs'),path=require('path');
const {JSDOM}=require('jsdom');
const root=__dirname;
const read=n=>fs.readFileSync(path.join(root,n),'utf8');

class FakeAudio{
  static log=[];
  constructor(src=''){this.src=src;this.preload='';this.playsInline=false;this.dataset={};this.readyState=1;this._currentTime=0;this.playbackRate=1;this.seeking=false;this.listeners={};this.paused=true}
  addEventListener(t,f,o){(this.listeners[t]||(this.listeners[t]=[])).push({f,once:!!o?.once})}
  removeEventListener(t,f){this.listeners[t]=(this.listeners[t]||[]).filter(x=>x.f!==f)}
  emit(t){const a=[...(this.listeners[t]||[])];for(const x of a){x.f({target:this});if(x.once)this.removeEventListener(t,x.f)}}
  load(){this.readyState=1;this.emit('loadedmetadata')}
  pause(){this.paused=true}
  play(){this.paused=false;FakeAudio.log.push({src:this.src,time:this.currentTime,track:this.dataset.officialTrack||''});return Promise.resolve()}
  get currentTime(){return this._currentTime}
  set currentTime(v){this._currentTime=Number(v)||0;this.seeking=false;queueMicrotask(()=>this.emit('seeked'))}
}
function html(){
  return `<!doctype html><html><head></head><body class="hsk1">
  <div id="pwOverlay"></div><input id="pwInput"><button id="pwBtn"></button><div id="pwError"></div>
  <div class="toast"></div><div id="lessonHero"></div><span id="lessonTag"></span><h1 id="lessonTitle"></h1><div id="lessonVn"></div>
  <b id="vocabCount"></b><b id="grammarCount"></b><span></span><span id="vocabChip"></span><span id="grammarChip"></span><span id="hanziChip"></span>
  <select id="lessonSelect"></select><div id="lessonSwitch"></div><aside id="xiaoyuTips"></aside>
  <section id="vocab" class="content-section"><div class="tool-row"><input id="vSearch"><button onclick="flipAll()">flip</button><button onclick="speakAllVocab()">🔊 Nghe từ</button></div><div id="vocabGrid"></div><div id="wordPanel"></div></section>
  <section id="text" class="content-section"><select id="sceneSelect"></select><div id="sceneTabs"></div><div id="scenePane"></div></section>
  <section id="grammar" class="content-section"><div class="section-head"><h2></h2></div><div id="grammarList"></div></section>
  <section id="hanzi" class="content-section"><div id="hanziWordMap"></div><div id="hanziMaster"></div></section>
  <section id="practice" class="content-section"><div id="basicPractice"></div><div id="advancedPractice"></div></section>
  <button id="prevModuleBtn"></button><button id="nextModuleBtn"></button><b id="moduleStepTitle"></b><button id="completeBtn"></button>
  <div class="section-tab" data-sec="vocab"></div><div class="section-tab" data-sec="text"></div><div class="section-tab" data-sec="grammar"></div>
  </body></html>`;
}
async function make(id){
  FakeAudio.log=[];
  const dom=new JSDOM(html(),{url:`https://example.test/new-hsk1/hsk1/lesson.html?id=${id}&sec=vocab`,runScripts:'dangerously',pretendToBeVisual:true});
  const w=dom.window;
  w.Audio=FakeAudio;w.HTMLMediaElement=FakeAudio;
  let speechCount=0;
  w.speechSynthesis={speaking:false,pending:false,paused:false,getVoices:()=>[{name:'fake zh',lang:'zh-CN',localService:true}],cancel(){},resume(){},speak(){speechCount++},addEventListener(){}};
  w.SpeechSynthesisUtterance=function(t){this.text=t};
  w.scrollTo=()=>{};w.confirm=()=>false;w.HTMLElement.prototype.scrollIntoView=()=>{};
  // Practice has its own production script. This regression isolates the lesson-shell/audio routes,
  // so provide the same callable boundary without importing unrelated practice-bank dependencies.
  w.renderPractice=()=>{};
  for(const n of ['new-data.js','new-enrichment.js','textbook-data-corrections.js','textbook-audio-segments.js','pos-tips.js','textbook-integration-corrections.js','stage3/catalog.js','textbook-final-corrections.js','textbook-segment-audio.js'])w.eval(read(n));
  // app-core defines top-level lexical bindings (id/L). Classic script tags share that global lexical environment;
  // separate window.eval() calls in JSDOM do not. Evaluate app-core + the production parity layer together
  // so the regression models browser classic-script binding semantics instead of inventing window.L.
  w.eval(read('app-core.js')+'\n'+fs.readFileSync(path.join(root,'../assets/hsk2-parity.js'),'utf8'));
  w.eval(read('tts-only.js'));
  // The production scripts are at the end of <body>; DOMContentLoaded follows immediately after them.
  // Reproduce that lifecycle before invoking the lesson's visible controls.
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  w.initLesson();
  await new Promise(r=>setTimeout(r,0));
  return {dom,w,get speechCount(){return speechCount}};
}
function cardFor(doc,word){return [...doc.querySelectorAll('.vcard')].find(c=>c.querySelector('.vzh')?.textContent===word)||null}
function wait(){return new Promise(r=>setTimeout(r,0))}
(async()=>{
  const a=await make(1);
  if(!a.w.HSK1_OFFICIAL_AUDIO?.ready)throw new Error('official player not ready after DOMContentLoaded');
  if(!a.w.document.querySelector('.hsk2-vocab-grid .vcard'))throw new Error('production parity vocabulary renderer did not take over');
  const card=cardFor(a.w.document,'不客气'),vocab=card?.querySelector('.speak-word');
  if(!vocab)throw new Error('lesson1 parity 不客气 button missing');
  vocab.click();await wait();
  if(a.speechCount!==0)throw new Error(`parity vocab clicked TTS ${a.speechCount} times`);
  if(!FakeAudio.log.at(-1)?.track)throw new Error('parity vocab did not route to Audio');
  if(vocab.textContent.trim()!=='🎧')throw new Error(`parity vocab button copy wrong: ${vocab.textContent}`);
  card.querySelector('.detail-tiny').click();await wait();
  const detail=a.w.document.querySelector('#parityWordSpeak');
  if(!detail||detail.textContent.trim()!=='🎧')throw new Error('parity detail official button missing');
  const audioBeforeDetail=FakeAudio.log.length;detail.click();await wait();
  if(a.speechCount!==0)throw new Error('parity detail fell back to TTS');
  if(FakeAudio.log.length<=audioBeforeDetail)throw new Error('parity detail did not route to Audio');
  const scene=a.w.document.querySelector('#scenePane .speak-line');
  if(!scene)throw new Error('text line button missing');
  scene.click();await wait();
  if(a.speechCount!==0)throw new Error(`text clicked TTS ${a.speechCount} times`);
  if(!FakeAudio.log.at(-1)?.track?.endsWith('-1'))throw new Error('text line did not route to text track');
  a.w.speak('老师');await wait();
  if(a.speechCount!==1)throw new Error('grammar/Hanzi TTS path no longer works');

  a.w.HSK1_OFFICIAL_AUDIO.stop();a.dom.window.close();
  const unsupportedWords=new Set(['一','二','三','四','五','六','七','八','九','百','十','千','两','零']);
  let total=0,official=0,unsupported=0,detailChecks=0;
  for(let lesson=1;lesson<=15;lesson++){
    const x=await make(lesson);
    const cards=[...x.w.document.querySelectorAll('.vcard')];
    if(!cards.length)throw new Error(`lesson ${lesson}: parity cards missing`);
    let checkedDetail=false;
    for(const c of cards){
      total++;const word=c.querySelector('.vzh')?.textContent||'',btn=c.querySelector('.speak-word');
      if(!btn)throw new Error(`lesson ${lesson} ${word}: speak button missing`);
      const speechBefore=x.speechCount,audioBefore=FakeAudio.log.length;
      if(btn.disabled){
        unsupported++;
        if(lesson!==4||!unsupportedWords.has(word))throw new Error(`unexpected unsupported vocab ${lesson}:${word}`);
        if(btn.textContent.trim()!=='🔇')throw new Error(`unsupported copy wrong ${lesson}:${word}`);
        btn.click();await wait();
        if(x.speechCount!==speechBefore||FakeAudio.log.length!==audioBefore)throw new Error(`unsupported vocab routed audio/TTS ${lesson}:${word}`);
      }else{
        official++;
        if(btn.textContent.trim()!=='🎧')throw new Error(`official copy wrong ${lesson}:${word}`);
        btn.click();await wait();
        if(x.speechCount!==speechBefore)throw new Error(`official parity vocab used TTS ${lesson}:${word}`);
        if(FakeAudio.log.length<=audioBefore||!FakeAudio.log.at(-1)?.track)throw new Error(`official parity vocab missed Audio ${lesson}:${word}`);
        if(!checkedDetail){
          c.querySelector('.detail-tiny').click();await wait();
          const d=x.w.document.querySelector('#parityWordSpeak');
          if(!d||d.disabled||d.textContent.trim()!=='🎧')throw new Error(`lesson ${lesson}: detail official button wrong`);
          const sb=x.speechCount,ab=FakeAudio.log.length;d.click();await wait();
          if(x.speechCount!==sb||FakeAudio.log.length<=ab)throw new Error(`lesson ${lesson}: detail did not stay official`);
          checkedDetail=true;detailChecks++;
        }
      }
    }
    x.w.HSK1_OFFICIAL_AUDIO.stop();x.dom.window.close();
  }
  if(total!==342)throw new Error(`expected 342 site vocab cards, got ${total}`);
  if(official!==328)throw new Error(`expected 328 official vocab cards, got ${official}`);
  if(unsupported!==14)throw new Error(`expected 14 unsupported cards, got ${unsupported}`);
  if(detailChecks!==15)throw new Error(`expected 15 detail route checks, got ${detailChecks}`);

  const six=await make(6);
  for(const word of ['包子','超市','吃','出租车','电话','东西','非常','好吃','号','买','米饭','明天','哪儿','那边','牛奶','去','手机','晚饭','想','些','怎么','坐','西安饭店']){
    const b=cardFor(six.w.document,word)?.querySelector('.speak-word');
    if(!b||b.disabled||b.textContent.trim()!=='🎧')throw new Error(`lesson6 official mapping missing: ${word}`);
    const sb=six.speechCount,ab=FakeAudio.log.length;b.click();await wait();
    if(six.speechCount!==sb||FakeAudio.log.length<=ab)throw new Error(`lesson6 routed incorrectly: ${word}`);
  }

  six.w.HSK1_OFFICIAL_AUDIO.stop();six.dom.window.close();
  const c=await make(11);
  const tabs=c.w.document.querySelectorAll('#sceneTabs .scene-tab');tabs[2].click();await wait();
  const rows=c.w.document.querySelectorAll('#scenePane .dialogue-line');
  if(rows.length!==6)throw new Error(`lesson11 scene3 expected 6 rows, got ${rows.length}`);
  if(![...rows].some(r=>r.querySelector('.line-zh')?.textContent==='去超市。'))throw new Error('lesson11 去超市 missing');
  c.w.HSK1_OFFICIAL_AUDIO.stop();c.dom.window.close();
  console.log(JSON.stringify({status:'PASS',productionParityLoaded:true,totalSiteVocab:total,officialVocab:official,unsupportedVocab:unsupported,detailOfficialChecks:detailChecks,lesson6VisibleWordsOfficial:23,lesson1TextOfficial:true,ttsOnlyGrammarHanzi:true,lesson11Rows:6,speechCountOfficialClicks:0}));
})().catch(e=>{console.error(e);process.exit(1)});
