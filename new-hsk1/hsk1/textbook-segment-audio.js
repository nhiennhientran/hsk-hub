/* HSK1 official textbook segment player — architecture cleanup.
   Runtime data is loaded synchronously from textbook-audio-segments.js.
   This file owns playback only; it does not intercept click events and never synthesizes speech. */
(function(){
  'use strict';
  const VERSION='20261001-integration-i1';
  const AUDIO_DIR='audio/';
  const cache=new Map();
  let textTracks={};
  let vocabByLesson={};
  let ready=false;
  let activeAudio=null;
  let stopTimer=0;
  let runToken=0;
  let mutationObserver=null;
  const pendingSequence=[];

  function lessonId(){
    const n=Number(new URL(location.href).searchParams.get('id')||1);
    return Math.max(1,Math.min(15,Number.isFinite(n)?n:1));
  }
  function sceneIndex(){
    const s=document.querySelector('#sceneSelect');
    if(s&&s.value!=='')return Math.max(0,Math.min(2,Number(s.value)||0));
    const active=document.querySelector('#sceneTabs .scene-tab.active');
    return Math.max(0,Math.min(2,Number(active?.dataset?.i)||0));
  }
  function srcFor(track){return `${AUDIO_DIR}${track}.mp3`}
  function toastSafe(msg){
    if(typeof window.toast==='function'){window.toast(msg);return}
    let t=document.querySelector('.toast');
    if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}
    t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800);
  }
  function diagnostics(extra={}){
    window.__HSK1_OFFICIAL_AUDIO_DIAGNOSTICS={
      version:VERSION,ready,lesson:lessonId(),scene:sceneIndex(),
      cachedTracks:cache.size,activeTrack:activeAudio?.dataset?.officialTrack||'',
      pendingSequence:pendingSequence.length,...extra
    };
  }
  function cancelSpeech(){try{window.speechSynthesis?.cancel?.()}catch(_e){}}
  function stopVisibleAudio(except){
    document.querySelectorAll('audio').forEach(a=>{if(a!==except){try{a.pause()}catch(_e){}}});
  }
  function stop(){
    runToken++;
    if(stopTimer){clearTimeout(stopTimer);stopTimer=0}
    if(activeAudio){try{activeAudio.pause()}catch(_e){}}
    activeAudio=null;pendingSequence.length=0;diagnostics({playing:false,label:''});
  }
  function getAudio(track){
    let a=cache.get(track);if(a)return a;
    a=new Audio(srcFor(track));a.preload='auto';a.playsInline=true;a.dataset.officialTrack=track;
    a.addEventListener('error',()=>{delete a.dataset.warmed;diagnostics({error:`load-failed:${track}`,playing:false});});
    cache.set(track,a);return a;
  }
  function warmLesson(lesson){
    if(!ready)return;
    const ids=new Set();
    [1,3,5].forEach(t=>{if(textTracks[`${lesson}-${t}`])ids.add(`${lesson}-${t}`)});
    Object.values(vocabByLesson[String(lesson)]||{}).forEach(x=>ids.add(x.track));
    ids.forEach(track=>{
      const a=getAudio(track);
      // DOM decoration can run many times. Reloading an active or already warming
      // audio element cancels playback and pending seeks, notably in WebKit.
      if(a===activeAudio||a.dataset.warmed==='1')return;
      a.dataset.warmed='1';try{a.load()}catch(_e){delete a.dataset.warmed;}
    });
  }
  function scheduleStop(audio,end,token){
    const ms=Math.max(80,((end-audio.currentTime)/(audio.playbackRate||1))*1000+100);
    stopTimer=setTimeout(()=>{
      if(token!==runToken||audio!==activeAudio)return;
      try{audio.pause();audio.currentTime=end}catch(_e){}
      activeAudio=null;stopTimer=0;diagnostics({playing:false,endedByRange:true});
    },ms);
  }
  function seekThen(audio,start,token,fn){
    let settled=false,timer=0;
    const finish=()=>{
      if(settled)return;settled=true;
      if(timer)clearTimeout(timer);
      audio.removeEventListener('seeked',onSeeked);
      if(token===runToken&&audio===activeAudio)fn();
    };
    const onSeeked=()=>finish();
    const assign=()=>{
      if(token!==runToken||audio!==activeAudio)return;
      if(Math.abs((audio.currentTime||0)-start)<=0.025&&!audio.seeking){finish();return}
      audio.addEventListener('seeked',onSeeked);
      try{audio.currentTime=start}catch(_e){finish();return}
      if(!audio.seeking&&Math.abs((audio.currentTime||0)-start)<=0.035)queueMicrotask(finish);
      timer=setTimeout(finish,450);
    };
    if(audio.readyState>=1)assign();
    else{audio.addEventListener('loadedmetadata',assign,{once:true});try{audio.load()}catch(_e){}}
  }
  function startRange(track,start,end,label=''){
    if(!track||!Number.isFinite(start)||!Number.isFinite(end)||end<=start){
      toastSafe('教材原声时间轴不可用。');return false;
    }
    cancelSpeech();
    if(stopTimer){clearTimeout(stopTimer);stopTimer=0}
    const token=++runToken,audio=getAudio(track);
    if(activeAudio&&activeAudio!==audio){try{activeAudio.pause()}catch(_e){}}
    activeAudio=audio;stopVisibleAudio(audio);
    try{audio.pause()}catch(_e){}
    seekThen(audio,start,token,()=>{
      Promise.resolve(audio.play()).then(()=>{
        if(token!==runToken)return;
        scheduleStop(audio,end,token);
        diagnostics({playing:true,label,range:[start,end],seekSettled:true,preload:audio.preload,error:''});
      }).catch(()=>{diagnostics({playing:false,error:`play-blocked:${track}`,label});toastSafe('Không phát được audio giáo trình. Hãy chạm lại nút nghe.');});
    });
    return true;
  }
  function playFull(track,label=''){
    if(!track)return false;
    cancelSpeech();
    if(stopTimer){clearTimeout(stopTimer);stopTimer=0}
    const token=++runToken,audio=getAudio(track);
    if(activeAudio&&activeAudio!==audio){try{activeAudio.pause()}catch(_e){}}
    activeAudio=audio;stopVisibleAudio(audio);
    try{audio.pause();audio.currentTime=0}catch(_e){}
    const begin=()=>{
      if(token!==runToken)return;
      Promise.resolve(audio.play()).then(()=>diagnostics({playing:true,label,fullTrack:true,error:''}))
        .catch(()=>toastSafe('Không phát được audio giáo trình. Hãy chạm lại nút nghe.'));
    };
    if(audio.readyState>=1)begin();
    else{audio.addEventListener('loadedmetadata',begin,{once:true});try{audio.load()}catch(_e){}}
    return true;
  }
  function textTrack(lesson,scene){return `${lesson}-${[1,3,5][scene]||1}`}
  function textSegment(lesson,scene,line){
    const track=textTrack(lesson,scene),r=textTracks[track]?.[line];
    return r?{track,start:r[0],end:r[1]}:null;
  }
  function vocabSegment(lesson,word){return vocabByLesson[String(lesson)]?.[word]||null}
  function playVocab(word,lesson=lessonId()){
    if(!ready){toastSafe('教材真人原声尚未就绪，请刷新页面后重试。');return false}
    const seg=vocabSegment(lesson,word);
    if(!seg){toastSafe('教材没有这个词的独立真人录音。');diagnostics({missingVocab:word});return false}
    return startRange(seg.track,seg.start,seg.end,`vocab:${lesson}:${word}`);
  }
  function playTextLine(scene,line,lesson=lessonId()){
    if(!ready){toastSafe('教材真人原声尚未就绪，请刷新页面后重试。');return false}
    const seg=textSegment(lesson,scene,line);
    if(!seg){toastSafe('没有找到这一句的教材原声。');return false}
    return startRange(seg.track,seg.start,seg.end,`text:${lesson}:${scene+1}:${line+1}`);
  }
  function playTextScene(scene=sceneIndex(),lesson=lessonId()){
    const track=textTrack(lesson,scene);
    if(!ready||!textTracks[track]){toastSafe('没有找到这段课文原声。');return false}
    return playFull(track,`text-full:${lesson}:${scene+1}`);
  }
  function lessonVocabTracks(lesson){
    const tracks=[];
    Object.values(vocabByLesson[String(lesson)]||{}).forEach(x=>{
      if(x.track.startsWith(`${lesson}-`)&&!tracks.includes(x.track))tracks.push(x.track);
    });
    return tracks.sort((a,b)=>Number(a.split('-')[1])-Number(b.split('-')[1]));
  }
  function playNextSequence(token){
    if(token!==runToken)return;
    const next=pendingSequence.shift();
    if(!next){activeAudio=null;diagnostics({playing:false,sequenceDone:true});return}
    const audio=getAudio(next);
    if(activeAudio&&activeAudio!==audio){try{activeAudio.pause()}catch(_e){}}
    activeAudio=audio;stopVisibleAudio(audio);
    try{audio.pause();audio.currentTime=0}catch(_e){}
    const begin=()=>{
      if(token!==runToken)return;
      const onEnd=()=>{audio.removeEventListener('ended',onEnd);if(token===runToken)playNextSequence(token)};
      audio.addEventListener('ended',onEnd,{once:true});
      Promise.resolve(audio.play()).then(()=>diagnostics({playing:true,label:`vocab-full:${next}`,sequence:true,error:''}))
        .catch(()=>{audio.removeEventListener('ended',onEnd);toastSafe('Không phát được audio giáo trình.');});
    };
    if(audio.readyState>=1)begin();
    else{audio.addEventListener('loadedmetadata',begin,{once:true});try{audio.load()}catch(_e){}}
  }
  function playVocabLesson(lesson=lessonId()){
    if(!ready){toastSafe('教材真人原声尚未就绪，请刷新页面后重试。');return false}
    cancelSpeech();
    if(stopTimer){clearTimeout(stopTimer);stopTimer=0}
    const tracks=lessonVocabTracks(lesson);if(!tracks.length)return false;
    const token=++runToken;pendingSequence.splice(0,pendingSequence.length,...tracks);playNextSequence(token);return true;
  }
  function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
  function decorateVocab(){
    if(!ready)return;
    const lesson=lessonId();
    document.querySelectorAll('#vocabGrid .vocab-card').forEach(card=>{
      const word=card.dataset.zh||card.querySelector('.vocab-zh')?.textContent?.trim()||'';
      const available=!!vocabSegment(lesson,word);
      card.querySelectorAll('button.listen').forEach(b=>{
        b.dataset.officialAudio='1';
        if(available){b.disabled=false;setText(b,'🎧 教材');b.title='教材真人原声'}
        else{b.disabled=true;setText(b,'🔇 无独立教材音');b.title='教材 New Words 录音中没有该词的独立读音'}
      });
    });
    document.querySelectorAll('#vocabGrid .vcard').forEach(card=>{
      const word=card.querySelector('.vzh')?.textContent?.trim()||'';
      const b=card.querySelector('.speak-word'),available=!!vocabSegment(lesson,word);
      if(b){b.dataset.officialAudio='1';if(available){b.disabled=false;setText(b,'🎧');b.title='教材真人原声'}else{b.disabled=true;setText(b,'🔇');b.title='教材没有该词的独立真人录音'}}
    });
    const panel=document.querySelector('#wordPanel .word-detail');
    if(panel){
      const word=panel.querySelector('.word-main')?.textContent?.trim()||'';
      const b=panel.querySelector('.vocab-actions button'),available=!!vocabSegment(lesson,word);
      if(b){
        b.dataset.officialAudio='1';
        if(available){b.disabled=false;setText(b,'🎧 教材发音');b.title='教材真人原声'}
        else{b.disabled=true;setText(b,'🔇 无独立教材音');b.title='教材 New Words 录音中没有该词的独立读音'}
      }
    }
    const parityPanel=document.querySelector('#wordPanel.hsk2-word-panel');
    if(parityPanel){
      const word=parityPanel.querySelector('.word-panel-head h3')?.textContent?.trim()||'';
      const b=parityPanel.querySelector('#parityWordSpeak'),available=!!vocabSegment(lesson,word);
      if(b){b.dataset.officialAudio='1';if(available){b.disabled=false;setText(b,'🎧');b.title='教材真人原声'}else{b.disabled=true;setText(b,'🔇');b.title='教材没有该词的独立真人录音'}}
    }
    const all=[...document.querySelectorAll('#vocab .tool-row button')].find(b=>/Nghe từ|Nghe giáo trình/.test(b.textContent||''));
    if(all){all.dataset.officialAudio='1';setText(all,'🎧 Nghe giáo trình')}
  }
  function decorateText(){
    if(!ready)return;
    const titleBtn=document.querySelector('#scenePane .scene-title button');
    if(titleBtn){titleBtn.dataset.officialAudio='1';setText(titleBtn,'🎧 教材整段')}
    [...document.querySelectorAll('#scenePane .dialogue-card .dialogue-line')].forEach((row,i)=>{
      const b=row.querySelector('.speak-line');if(!b)return;
      b.dataset.officialAudio='1';setText(b,'🎧');
      b.title=textSegment(lessonId(),sceneIndex(),i)?'播放这一句教材真人原声':'未找到教材原声';
    });
  }
  // A rendering scan must not erase the active playback diagnostic state.
  function scan(){decorateVocab();decorateText();warmLesson(lessonId());}
  function buildMaps(data){
    textTracks=data?.text||{};
    vocabByLesson={};
    Object.entries(data?.vocab||{}).forEach(([track,items])=>{
      const lesson=track.split('-')[0],map=vocabByLesson[lesson]||(vocabByLesson[lesson]={});
      items.forEach(([word,start,end])=>{if(!map[word])map[word]={track,start,end}});
    });
    Object.entries(data?.crossLessonReuse||{}).forEach(([lesson,items])=>{
      const map=vocabByLesson[lesson]||(vocabByLesson[lesson]={});
      Object.entries(items||{}).forEach(([word,row])=>{map[word]={track:row[0],start:row[1],end:row[2],reusedFromLesson:Number(row[0].split('-')[0])}});
    });
    ready=Object.keys(textTracks).length===45&&Object.keys(data?.vocab||{}).length===45;
  }
  function install(){
    try{
      const data=window.HSK1_OFFICIAL_SEGMENTS;
      if(!data)throw new Error('static-segment-data-missing');
      buildMaps(data);
      mutationObserver?.disconnect();
      mutationObserver=new MutationObserver(()=>queueMicrotask(scan));
      mutationObserver.observe(document.body,{childList:true,subtree:true});
      document.addEventListener('play',e=>{
        const target=e.target;
        if(typeof HTMLMediaElement!=='undefined'&&target instanceof HTMLMediaElement&&target!==activeAudio){
          if(activeAudio){try{activeAudio.pause()}catch(_e){}}
          if(stopTimer){clearTimeout(stopTimer);stopTimer=0}
          activeAudio=null;
        }
      },true);
      scan();
      diagnostics({ready,textTrackCount:Object.keys(textTracks).length,vocabLessons:Object.keys(vocabByLesson).length,staticData:true,error:''});
    }catch(e){
      ready=false;diagnostics({ready:false,error:String(e?.message||e)});console.error('HSK1 official segment player failed to initialize',e);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();

  window.HSK1_OFFICIAL_AUDIO={
    version:VERSION,
    get ready(){return ready},
    playVocab,playVocabLesson,playTextLine,playTextScene,stop,scan,warmLesson,
    vocabSegment,textSegment,lessonVocabTracks,
    diagnostics:()=>window.__HSK1_OFFICIAL_AUDIO_DIAGNOSTICS
  };
})();
