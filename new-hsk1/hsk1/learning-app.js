(function(){
  'use strict';
  const E=window.HSKLearnEngine,bank=window.HSK1_NEW_BANK||[],data=window.HSK1_LESSONS||[];
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={choice:'Chọn đáp án',sort:'Xếp câu',translation:'Dịch Việt → Trung',listening:'Luyện nghe'};
  const modes=['homework','listening','vocab','review','progress'];
  const qMap=new Map(bank.flatMap(L=>E.KINDS.flatMap(k=>(L[k]||[]).map(q=>[q.id,q]))));
  let state=E.blank(),route={},storageError=false,notice='',toastTimer;
  try{const raw=localStorage.getItem(E.KEY);if(raw){const parsed=JSON.parse(raw);if(parsed.schema===2)state={...E.blank(),...parsed};else notice='Bản ghi cũ được giữ nguyên. Bắt đầu bộ bài tập mới.';}}catch(_e){storageError=true;}
  window.sha256=async text=>{if(!globalThis.crypto?.subtle)return null;const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('');};
  function save(){state.updatedAt=Date.now();try{localStorage.setItem(E.KEY,JSON.stringify(state));storageError=false;return true;}catch(_e){storageError=true;showStorageNotice();return false;}}
  function showStorageNotice(){const box=$('#storageNotice');if(!box)return;box.hidden=!storageError;box.textContent='Trình duyệt không lưu được tiến độ. Giữ trang này mở và tải bản sao lưu ở mục Tiến độ.';}
  function toast(message){const box=$('#learningToast');if(!box)return;box.textContent=message;box.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.classList.remove('show'),3500);}
  function shuffleIndices(n){const a=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}if(n>1&&a.every((x,i)=>x===i))a.push(a.shift());return a;}
  function questions(lesson,kind){return bank.find(L=>L.lesson===Number(lesson))?.[kind]||[];}
  function readRoute(){const u=new URL(location.href);const mode=modes.includes(u.searchParams.get('mode'))?u.searchParams.get('mode'):'homework';const raw=Number(u.searchParams.get('lesson')||state.preferences.lastLesson||1);const lesson=Number.isInteger(raw)&&raw>=1&&raw<=15?raw:1;return {mode,lesson,stage:E.PATH.includes(u.searchParams.get('stage'))?u.searchParams.get('stage'):'choice',question:u.searchParams.get('question')||'',mix:mode==='listening'&&u.searchParams.get('mix')==='1'};}
  function navigate(mode,lesson=route.lesson,extra={}){stopAudio();notice='';const u=new URL(location.href);u.search='';u.searchParams.set('mode',modes.includes(mode)?mode:'homework');if(lesson)u.searchParams.set('lesson',lesson);Object.entries(extra).forEach(([k,v])=>{if(v)u.searchParams.set(k,v);});history.pushState(null,'',u);route=readRoute();state.preferences.lastLesson=route.lesson;state.preferences.lastRoute=u.pathname+u.search;save();render();window.scrollTo({top:0,behavior:'instant'});}
  const app={data,segments:window.HSK1_OFFICIAL_SEGMENTS,state,save,esc,main:null,playRange,stopAudio,navigate,toast};
  window.HSKLearn=app;
  function lessonPicker(){return `<label for="learningLesson">Chọn bài<select id="learningLesson" data-testid="lesson-picker">${data.map(L=>`<option value="${L.id}" ${L.id===route.lesson?'selected':''}>Bài ${L.id} · ${esc(L.title)}</option>`).join('')}</select></label>`;}
  function hero(eyebrow,title,description,aside=''){return `<section class="la-hero"><div><p class="la-eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p>${esc(description)}</p></div>${aside?`<div class="la-hero-aside">${aside}</div>`:''}</section>`;}
  function lessonLinks(){return `<div class="la-course-links"><a href="lesson.html?id=${route.lesson}&sec=vocab">Từ vựng của bài ↗</a><a href="lesson.html?id=${route.lesson}&sec=grammar">Xem ngữ pháp ↗</a><a href="lesson.html?id=${route.lesson}&sec=text">Đọc bài khoá ↗</a></div>`;}
  function bindPicker(){const p=$('#learningLesson');if(p)p.onchange=()=>navigate(route.mode,Number(p.value));}
  function render(){
    app.state=state;state.preferences.lastLesson=route.lesson;state.preferences.lastRoute=location.pathname+location.search;save();showStorageNotice();$$('.la-nav a').forEach(a=>{const active=a.dataset.mode===route.mode;if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');a.href=`learning.html?mode=${a.dataset.mode}&lesson=${route.lesson}`;});
    if(bank.length!==15){app.main.innerHTML='<div class="la-alert">Bộ câu hỏi chưa tải đủ. Hãy tải lại trang khi có kết nối.</div>';return;}
    if(route.mode==='vocab'){document.title='Ghép bài ôn từ · 然老师';window.HSKLearnVocab.render(app);return;}
    if(route.mode==='progress'){renderProgress();return;}
    if(route.mode==='review'){renderReview();return;}
    if(route.mode==='listening'&&route.mix){renderListenMix();return;}
    renderGroup();
  }
  function kindForRoute(){return route.mode==='listening'?'listening':route.stage;}
  function renderGroup(){
    const kind=kindForRoute(),L=bank.find(x=>x.lesson===route.lesson),qs=questions(route.lesson,kind),g=E.group(state,route.lesson,kind),unlocked=E.canOpen(state,route.lesson,kind),listening=kind==='listening';
    document.title=`Bài ${route.lesson} · ${labels[kind]} · 然老师`;
    const title=listening?'Nghe tiếng Trung, hiểu bằng tiếng Việt':`Bài ${route.lesson} · Luyện từng bước`;
    const description=listening?'5 câu nghe mỗi bài · Audio gốc của giáo trình · Nghe lại và đổi tốc độ theo nhu cầu.':L.goal_vi;
    let html=hero(listening?'Luyện nghe · 听力':'Bài tập · 课后作业',title,description,lessonPicker());
    if(!listening)html+=`<div class="la-steps" aria-label="Thứ tự bài tập">${E.PATH.map((k,i)=>{const open=E.canOpen(state,route.lesson,k),done=state.lessons[route.lesson]?.[k]?.completed;return `<button type="button" class="la-step ${k===kind?'active':''}" data-stage="${k}" ${open?'':'disabled'} ${k===kind?'aria-current="step"':''}><span class="la-step-num">${done?'✓':open?i+1:'🔒'}</span><span><b>${esc(labels[k])}</b><small>${done?'Đã hoàn thành':open?'5 câu · Có thể làm':'Hoàn thành phần trước'}</small></span></button>`;}).join('')}</div><p class="la-small">Nộp đủ 5 câu và sửa các câu sai để mở phần tiếp theo. Điểm lần đầu luôn được giữ lại.</p>`;
    else html+=`<div class="la-panel la-settings"><label>Tốc độ nghe <select id="listeningRate" aria-label="Tốc độ nghe" data-testid="listening-rate">${rateOptions()}</select></label><p class="la-small">Nghe chậm hoặc nghe nhiều lần không bị trừ điểm. Chữ Hán và pinyin chỉ hiện sau khi nộp.</p><a href="learning.html?mode=listening&lesson=${route.lesson}&mix=1" id="openListenMix">Ghép nhiều bài để ôn nghe →</a></div>`;
    const lessonTotal=E.totals(state,route.lesson);
    html+=`<p class="la-small" data-testid="lesson-total">Bài ${route.lesson}: đã nộp ${lessonTotal.answered}/20 câu mới · Đúng lần đầu ${lessonTotal.correct}/${lessonTotal.answered} câu đã nộp · Hoàn thành ${lessonTotal.completed}/4 nhóm.</p>`;
    html+=lessonLinks();
    if(!unlocked){html+=`<div class="la-empty" data-testid="locked-message"><h2>Phần này chưa mở</h2><p>Hoàn thành và sửa bài ở phần trước để tiếp tục.</p><button class="la-button" id="backToFirst">Về phần đang học</button></div>`;app.main.innerHTML=html;bindPicker();$('#backToFirst').onclick=()=>navigate('homework',route.lesson,{stage:E.PATH.find(k=>!state.lessons[route.lesson]?.[k]?.completed)||'choice'});bindStages();return;}
    qs.forEach(q=>{if(!Array.isArray(g.orders[q.id])||g.orders[q.id].length!==(q.kind==='sort'?q.tokens.length:4))g.orders[q.id]=shuffleIndices(q.kind==='sort'?q.tokens.length:4);});save();
    const answered=qs.filter(q=>E.isAnswered(q,g.draft[q.id])).length;
    html+=`<div class="la-heading"><h2>${esc(labels[kind])} <span class="la-muted">· 5 câu</span></h2><span class="la-chip" data-testid="answered-count">Đã trả lời ${answered}/5</span></div>`;
    if(g.attempt)html+=summaryHtml(g,qs,kind);
    if(notice)html+=`<div class="la-alert" role="alert" data-testid="group-notice">${esc(notice)}</div>`;
    html+=qs.map((q,i)=>questionHtml(q,i,g)).join('');
    const remaining=g.attempt?qs.filter(q=>!g.attempt.results[q.id]&&!g.corrections[q.id]).length:0;
    html+=`<div class="la-toolbar"><span class="la-small">Tự động lưu câu trả lời trên trình duyệt này.</span><div class="la-toolbar">${!g.attempt?'<button class="la-button" data-testid="submit-group">Nộp 5 câu →</button>':remaining?`<button class="la-button" data-testid="correct-group">Kiểm tra phần sửa · ${remaining} câu</button>`:nextButton(kind)}${g.attempt?'<button class="la-ghost" data-testid="retry-group">Làm lại một lượt</button>':''}</div></div>`;
    if(g.completed)html+=`<div class="la-success" data-testid="group-complete">✓ Đã hoàn thành phần này. Điểm lần đầu được giữ nguyên; phần sửa không làm tăng điểm lần đầu.</div>`;
    if(listening)html+=`<div class="la-panel"><b>Nghe lại cả đoạn trong sách</b><p class="la-small">Luyện tự do sau bài nghe. Phần này không tính thêm câu hay điểm.</p><div class="la-toolbar">${[1,3,5].map((t,i)=>`<button class="la-ghost" data-full-track="${route.lesson}-${t}">Bài khoá ${i+1} · Nghe cả đoạn</button>`).join('')}</div></div>`;
    app.main.innerHTML=html;bindPicker();bindStages();bindQuestions(qs,g,kind);bindActions(qs,g,kind);
    if(listening){$('#listeningRate').onchange=e=>setRate(Number(e.target.value));$('#openListenMix').onclick=e=>{e.preventDefault();navigate('listening',route.lesson,{mix:'1'});};$$('[data-full-track]').forEach(b=>b.onclick=()=>playFullTrack(b.dataset.fullTrack));}
  }
  function rateOptions(){return [.65,.75,1,1.25,1.5].map(r=>`<option value="${r}" ${getRate()===r?'selected':''}>${r}×${r===1?' · Thường':r===.65?' · Chậm':''}</option>`).join('');}
  function bindStages(){$$('[data-stage]').forEach(b=>b.onclick=()=>{if(E.canOpen(state,route.lesson,b.dataset.stage))navigate('homework',route.lesson,{stage:b.dataset.stage});});}
  function nextButton(kind){if(kind==='translation')return `<a class="la-button" href="learning.html?mode=listening&lesson=${route.lesson}">Sang luyện nghe →</a>`;if(kind==='listening')return `<a class="la-button" href="learning.html?mode=progress&lesson=${route.lesson}">Xem tiến độ →</a>`;const next=E.PATH[E.PATH.indexOf(kind)+1];return `<button class="la-button" data-next-stage="${next}">Mở ${esc(labels[next])} →</button>`;}
  function summaryHtml(g,qs,kind){const a=g.attempt,remaining=qs.filter(q=>!a.results[q.id]&&!g.corrections[q.id]).length,first=g.first;return `<section class="la-summary" data-testid="score-summary"><div class="la-score-row"><div><p class="la-eyebrow">Kết quả lượt này</p><div class="la-score" data-testid="current-score">${a.correct}<small> / ${a.total} đúng · ${Math.round(a.correct/a.total*100)}%</small></div></div><div class="la-score-detail"><b data-testid="first-score">Lần đầu: ${first.correct}/${first.total}</b><p>${remaining?`Còn ${remaining} câu cần sửa. Chọn lại hoặc xếp lại câu, rồi kiểm tra phần sửa.`:'Đã hoàn thành phần sửa. Có thể chuyển sang phần tiếp theo.'}</p><span>Điểm này chỉ tính câu trả lời trước khi xem đáp án.</span></div></div></section>`;}
  function valueText(q,v){if(q.kind==='sort')return Array.isArray(v)?v.map(i=>q.tokens[i]||'').join(''):'Chưa trả lời';return Number.isInteger(v)?q.options[v]:'Chưa trả lời';}
  function questionHtml(q,index,g,review=false){
    const submitted=!!g.attempt,wasCorrect=submitted&&g.attempt.results[q.id],corrected=!!g.corrections[q.id],editable=!g.reviewChecked&&(!submitted||(!wasCorrect&&!corrected)),value=g.draft[q.id],order=g.orders[q.id]||Array.from({length:q.kind==='sort'?q.tokens.length:4},(_,i)=>i);
    let html=`<article class="la-question" id="${esc(q.id)}" data-testid="question-${esc(q.id)}" data-qid="${esc(q.id)}"><div class="la-qtop"><span>CÂU ${index+1}${review?'':' / 5'}</span><span class="la-qbadge">${esc(q.kind==='listening'&&!submitted?'Nghe hiểu':q.skill)}</span></div><p class="la-prompt">${esc(q.prompt)}</p>`;
    if(q.kind==='listening')html+=`<button class="la-audio-button" type="button" data-play="${esc(q.id)}" data-testid="play-${esc(q.id)}"><span class="la-audio-icon" aria-hidden="true">▶</span>Nghe câu ${index+1}</button><p class="la-small">Audio giáo trình · Có thể nghe lại · Không tự động phát</p>`;
    if(q.stem)html+=`<p class="la-stem" lang="zh-Hans">${esc(q.stem)}</p>`;
    if(q.kind==='sort'){
      const selected=Array.isArray(value)?value:[];
      html+=`<p class="la-meaning">${esc(q.meaning)}</p><div class="la-sentence" data-drop-q="${esc(q.id)}" aria-label="Câu đã xếp">${selected.length?selected.map(i=>`<button class="la-token" type="button" lang="zh-Hans" data-remove-token="${i}" draggable="${editable}" data-drag-token="${i}" data-q="${esc(q.id)}" ${editable?'':'aria-disabled="true"'} title="Chạm để bỏ từ này">${esc(q.tokens[i])}</button>`).join(''):'<span class="la-sentence-placeholder">Chạm các từ bên dưới theo thứ tự…</span>'}</div><div class="la-tokens">${order.map(i=>`<button type="button" class="la-token" lang="zh-Hans" data-token="${i}" data-drag-token="${i}" data-q="${esc(q.id)}" draggable="${editable&&!selected.includes(i)}" ${selected.includes(i)||!editable?'disabled':''}>${esc(q.tokens[i])}</button>`).join('')}</div><div class="la-sort-tools"><button data-sort-undo type="button" ${editable&&selected.length?'':'disabled'}>↶ Bỏ từ cuối</button><button data-sort-clear type="button" ${editable&&selected.length?'':'disabled'}>Xếp lại từ đầu</button></div>`;
    }else{
      html+=`<div class="la-options" role="group" aria-label="Chọn một đáp án">${order.map((original,pos)=>{const correct=submitted&&original===q.answer,wrong=submitted&&original===g.attempt.answers[q.id]&&!wasCorrect;return `<button type="button" class="la-option ${value===original?'selected':''} ${correct?'answer-correct':''} ${wrong?'answer-wrong':''}" data-option="${original}" aria-pressed="${value===original}" ${editable?'':'disabled'}><span class="la-letter">${'ABCD'[pos]}</span><span ${q.kind==='translation'||(q.options[original].match(/[\u4e00-\u9fff]/g)||[]).length>0?'lang="zh-Hans"':''}>${esc(q.options[original])}</span></button>`;}).join('')}</div>`;
    }
    if(submitted){
      const answer=q.kind==='sort'?q.answers.join(' / '):q.options[q.answer];
      html+=`<div class="la-feedback ${wasCorrect?'good':'bad'}" data-testid="feedback-${esc(q.id)}"><h3>${wasCorrect?'✓ Đúng ngay lần làm này':corrected?'✓ Đã sửa đúng · Lần nộp ban đầu chưa đúng':g.reviewChecked?'Chưa đúng · Xem giải thích rồi ôn lại':'Chưa đúng · Hãy sửa lại'}</h3><p class="la-original">Bạn đã nộp: <span class="${q.kind==='sort'||q.kind==='translation'?'zh':''}">${esc(valueText(q,g.attempt.answers[q.id]))}</span></p>${q.kind==='listening'?`<p class="la-answer" lang="zh-Hans">${esc(q.transcript)}</p><p class="la-pinyin">${esc(q.pinyin)}</p>`:''}<p class="la-small">${q.kind==='sort'&&q.answers.length>1?'Các cách xếp được chấp nhận':'Đáp án'}</p><div class="la-answer" ${q.kind==='sort'||q.kind==='translation'?'lang="zh-Hans"':''}>${esc(answer)}</div><p class="la-explanation">${esc(q.explanation)}</p><a class="la-source-link" href="lesson.html?id=${q.lesson||route.lesson}&sec=${q.kind==='listening'?'text':'grammar'}">Ôn lại bài ${q.lesson||route.lesson} trong giáo trình ↗</a></div>`;
    }
    return html+'</article>';
  }
  function editableQuestion(g,q){return !g.reviewChecked&&(!g.attempt||(!g.attempt.results[q.id]&&!g.corrections[q.id]));}
  function bindQuestions(qs,g,kind,refresh=()=>renderGroup()){
    const redraw=()=>{
      const y=window.scrollY,active=document.activeElement,qid=active?.closest('[data-qid]')?.dataset.qid;
      const attr=['data-option','data-token','data-remove-token','data-sort-undo','data-sort-clear'].find(a=>active?.hasAttribute(a)),value=attr?active.getAttribute(attr):'';
      save();refresh();
      if(qid){const card=$(`[data-qid="${qid}"]`);const same=attr?card?.querySelector(`[${attr}="${value}"]:not(:disabled)`):null;(same||card?.querySelector('button:not(:disabled)'))?.focus({preventScroll:true});}
      window.scrollTo({top:y,behavior:'instant'});
    };
    qs.forEach(q=>{
      const card=$(`[data-qid="${q.id}"]`,app.main);if(!card)return;
      const allowed=()=>editableQuestion(g,q)&&(kind==='review'||E.canOpen(state,route.lesson,kind));
      $$('[data-option]',card).forEach(b=>b.onclick=()=>{if(!allowed())return;g.draft[q.id]=Number(b.dataset.option);notice='';redraw();});
      $$('[data-token]',card).forEach(b=>b.onclick=()=>{if(!allowed())return;const arr=g.draft[q.id]||[],n=Number(b.dataset.token);if(!arr.includes(n))g.draft[q.id]=[...arr,n];notice='';redraw();});
      $$('[data-remove-token]',card).forEach(b=>b.onclick=()=>{if(!allowed())return;g.draft[q.id]=(g.draft[q.id]||[]).filter(n=>n!==Number(b.dataset.removeToken));redraw();});
      const undo=$('[data-sort-undo]',card),clear=$('[data-sort-clear]',card);if(undo)undo.onclick=()=>{if(!allowed())return;g.draft[q.id]=(g.draft[q.id]||[]).slice(0,-1);redraw();};if(clear)clear.onclick=()=>{if(!allowed())return;g.draft[q.id]=[];redraw();};
      $$('[data-drag-token]',card).forEach(b=>b.ondragstart=e=>{if(!allowed()){e.preventDefault();return;}e.dataTransfer.setData('text/plain',JSON.stringify({qid:q.id,index:Number(b.dataset.dragToken)}));});
      const zone=$('[data-drop-q]',card);if(zone){zone.ondragover=e=>{if(allowed())e.preventDefault();};zone.ondrop=e=>{if(!allowed())return;e.preventDefault();try{const payload=JSON.parse(e.dataTransfer.getData('text/plain'));if(payload.qid!==q.id||!Number.isInteger(payload.index)||payload.index<0||payload.index>=q.tokens.length)return;const target=Number(e.target.closest('[data-remove-token]')?.dataset.removeToken);const arr=(g.draft[q.id]||[]).filter(i=>i!==payload.index),at=arr.indexOf(target);arr.splice(at<0?arr.length:at,0,payload.index);g.draft[q.id]=arr;redraw();}catch(_e){}};}
      const play=$('[data-play]',card);if(play)play.onclick=()=>playRange(q.audio.track,q.audio.start,q.audio.end,`Bài ${q.lesson||route.lesson} · Câu nghe ${qs.indexOf(q)+1}`);
    });
  }
  function bindActions(qs,g,kind){
    const submit=$('[data-testid="submit-group"]'),correct=$('[data-testid="correct-group"]'),retry=$('[data-testid="retry-group"]');
    if(submit)submit.onclick=()=>{stopAudio();const result=E.submit(state,route.lesson,kind,qs);if(!result.ok){notice=result.reason==='missing'?`Còn ${result.missing.length} câu chưa trả lời đầy đủ. Hãy hoàn thành trước khi nộp.`:'Hãy hoàn thành phần trước.';renderGroup();if(result.missing){const card=$(`[data-qid="${result.missing[0]}"]`);card?.classList.add('needs-answer');card?.scrollIntoView({behavior:'smooth',block:'center'});}return;}notice='';save();renderGroup();$('[data-testid="score-summary"]')?.scrollIntoView({behavior:'smooth',block:'start'});};
    if(correct)correct.onclick=()=>{const result=E.correct(state,route.lesson,kind,qs);notice=result.remaining?.length?`Còn ${result.remaining.length} câu cần sửa. Xem giải thích dưới từng câu rồi thử lại.`:'';save();renderGroup();if(!result.remaining?.length)toast('Đã sửa xong. Phần tiếp theo đã mở.');};
    if(retry)retry.onclick=()=>{E.restart(state,route.lesson,kind);notice='';save();renderGroup();window.scrollTo({top:0,behavior:'smooth'});};
    $$('[data-next-stage]').forEach(b=>b.onclick=()=>{if(E.canOpen(state,route.lesson,b.dataset.nextStage))navigate('homework',route.lesson,{stage:b.dataset.nextStage});});
  }
  let mixedSession=null;
  function saveMixedSession(){
    const s=mixedSession;if(!s)return;
    const q=s.qs[s.index];
    if(q&&s.g?.orders[q.id])s.orders[q.id]=[...s.g.orders[q.id]];
    s.correct=Object.entries(s.answers).filter(([id,answer])=>E.check(qMap.get(id),answer)).length;
    state.preferences.listenSession={version:1,ids:s.qs.map(q=>q.id),index:s.index,answers:{...s.answers},orders:JSON.parse(JSON.stringify(s.orders)),draft:q&&E.isAnswered(q,s.g?.draft[q.id])?{[q.id]:s.g.draft[q.id]}:{}};
    save();
  }
  function restoreMixedSession(){
    const raw=state.preferences.listenSession;if(!raw)return null;
    try{
      const record=x=>x&&typeof x==='object'&&!Array.isArray(x);
      if(!record(raw)||raw.version!==1||!Array.isArray(raw.ids)||!raw.ids.length||raw.ids.length>75||new Set(raw.ids).size!==raw.ids.length)throw new Error('session');
      const qs=raw.ids.map(id=>qMap.get(id));if(qs.some(q=>!q||q.kind!=='listening')||!Number.isInteger(raw.index)||raw.index<0||raw.index>qs.length)throw new Error('questions');
      if(!record(raw.answers)||!record(raw.orders)||!record(raw.draft))throw new Error('answers');
      const answers={},orders={},index=raw.index;
      for(const [id,value] of Object.entries(raw.answers)){const at=raw.ids.indexOf(id);if(at<0||at>index||!E.isAnswered(qs[at],value))throw new Error('answer');answers[id]=value;}
      if(qs.slice(0,index).some(q=>!Object.prototype.hasOwnProperty.call(answers,q.id)))throw new Error('unfinished');
      for(const [id,value] of Object.entries(raw.orders)){const at=raw.ids.indexOf(id);if(at<0||at>index||!Array.isArray(value)||value.length!==4||new Set(value).size!==4||value.some(n=>!Number.isInteger(n)||n<0||n>3))throw new Error('order');orders[id]=[...value];}
      const q=qs[index],draft={};
      for(const [id,value] of Object.entries(raw.draft)){if(!q||id!==q.id||!E.isAnswered(q,value))throw new Error('draft');draft[id]=value;}
      let g=null;
      if(q){
        if(!orders[q.id])orders[q.id]=shuffleIndices(4);
        g={draft,orders:{[q.id]:orders[q.id]},attempt:null,corrections:{}};
        if(Object.prototype.hasOwnProperty.call(answers,q.id)){const answer=answers[q.id];g.draft[q.id]=answer;g.attempt={answers:{[q.id]:answer},results:{[q.id]:E.check(q,answer)}};g.reviewChecked=true;}
      }
      return {qs,index,answers,orders,g,correct:Object.entries(answers).filter(([id,value])=>E.check(qMap.get(id),value)).length};
    }catch(_e){delete state.preferences.listenSession;save();toast('Lượt ôn nghe lưu trước đó không hợp lệ. Hãy chọn bài để bắt đầu lượt mới.');return null;}
  }
  function resetListenMix(){stopAudio();mixedSession=null;delete state.preferences.listenSession;save();renderListenMix();}
  function renderListenMix(){
    stopAudio();document.title='Ghép bài luyện nghe · 然老师';mixedSession=restoreMixedSession();if(mixedSession)return renderMixedQuestion();const selected=new Set(state.preferences.listenLessons||[route.lesson]);
    app.main.innerHTML=hero('Luyện nghe · Ôn tập nhiều bài','Ghép bài luyện nghe','Chọn các bài đã học. Lượt ôn này được lưu riêng, không thay đổi điểm bài tập lần đầu.')+`<section class="la-panel"><div class="la-toolbar"><b>Chọn bài</b><button class="la-ghost" id="allListenLessons">Chọn tất cả</button></div><div class="la-listen-picks" style="display:flex;flex-wrap:wrap;gap:12px">${data.map(L=>`<label><input type="checkbox" name="listenLesson" value="${L.id}" ${selected.has(L.id)?'checked':''}> Bài ${L.id}</label>`).join('')}</div><div class="la-settings"><label>Số câu <select id="mixCount"><option value="5">5 câu</option><option value="10">10 câu</option><option value="0">Tất cả câu trong các bài đã chọn</option></select></label><label>Tốc độ <select id="mixRate">${rateOptions()}</select></label></div><button class="la-button" id="startListenMix">Bắt đầu ôn nghe →</button><p id="mixNotice" class="la-small" role="status"></p></section>`;
    $('#allListenLessons').onclick=()=>{$$('input[name="listenLesson"]').forEach(i=>i.checked=true);};$('#mixRate').onchange=e=>setRate(Number(e.target.value));$('#startListenMix').onclick=()=>{const ids=$$('input[name="listenLesson"]:checked').map(i=>Number(i.value));if(!ids.length){$('#mixNotice').textContent='Hãy chọn ít nhất một bài.';return;}state.preferences.listenLessons=ids;save();const pool=bank.filter(L=>ids.includes(L.lesson)).flatMap(L=>L.listening),order=shuffleIndices(pool.length),limit=Number($('#mixCount').value)||pool.length;mixedSession={qs:order.slice(0,limit).map(i=>pool[i]),index:0,correct:0,answers:{},orders:{},g:null};renderMixedQuestion();};
  }
  function renderMixedQuestion(){
    const s=mixedSession;if(!s)return renderListenMix();if(s.index>=s.qs.length){saveMixedSession();app.main.innerHTML=hero('Lượt ôn nghe hoàn thành','Bạn đã luyện xong!',`${s.correct}/${s.qs.length} câu đúng · ${Math.round(s.correct/s.qs.length*100)}%`)+`<div class="la-panel"><p>Kết quả được ghi vào lịch ôn. Điểm lần đầu của bài chính không thay đổi.</p><button class="la-button" id="mixAgain">Chọn bài khác · Bắt đầu lượt mới</button></div>`;$('#mixAgain').onclick=resetListenMix;return;}
    const q=s.qs[s.index];if(!s.g)s.g={draft:{},orders:{[q.id]:shuffleIndices(4)},attempt:null,corrections:{}};
    saveMixedSession();
    app.main.innerHTML=hero('Luyện nghe · Ôn tập nhiều bài',`Câu ${s.index+1} / ${s.qs.length}`,`Bài ${q.lesson} · Tự động lưu lượt này; có thể rời trang rồi tiếp tục.`)+questionHtml(q,s.index,s.g,true)+`<div class="la-toolbar"><button class="la-button" id="mixCheck">${s.g.attempt?'Câu tiếp theo →':'Kiểm tra'}</button><button class="la-ghost" id="mixExit">Chọn lại bài · Bắt đầu lượt mới</button></div>`;
    bindQuestions([q],s.g,'review',renderMixedQuestion);$('#mixExit').onclick=resetListenMix;$('#mixCheck').onclick=()=>{if(s.g.attempt){stopAudio();s.index++;s.g=null;renderMixedQuestion();return;}if(!E.isAnswered(q,s.g.draft[q.id])){toast('Hãy chọn một đáp án.');return;}const correct=E.check(q,s.g.draft[q.id]);s.answers[q.id]=s.g.draft[q.id];s.g.attempt={answers:{...s.g.draft},results:{[q.id]:correct}};s.g.reviewChecked=true;E.remember(state,q,correct,Date.now(),q.lesson);renderMixedQuestion();};
  }
  function renderProgress(){
    document.title='Tiến độ học · 然老师';const totals=data.map(L=>({id:L.id,...E.totals(state,L.id)})),done=totals.filter(t=>t.done).length,answered=totals.reduce((s,t)=>s+t.answered,0),correct=totals.reduce((s,t)=>s+t.correct,0);
    let html=hero('Tiến độ · 学习记录','Nhìn lại việc học của bạn','Điểm lần đầu, phần sửa và tự đánh giá từ vựng được ghi riêng.')+`<div class="la-stats"><div class="la-stat"><b>${done}/15</b><span>Bài hoàn thành cả 4 nhóm</span></div><div class="la-stat"><b>${answered}/300</b><span>Câu mới đã nộp lần đầu</span></div><div class="la-stat"><b>${answered?Math.round(correct/answered*100):'—'}${answered?'%':''}</b><span>${correct}/${answered} câu đã nộp đúng lần đầu</span></div></div><div class="la-table-wrap"><table class="la-table" data-testid="progress-table"><thead><tr><th>Bài học</th><th>Chọn đáp án</th><th>Xếp câu</th><th>Dịch Việt → Trung</th><th>Nghe</th><th>Tổng lần đầu</th><th>Hoàn thành</th></tr></thead><tbody>${data.map(L=>{const t=E.totals(state,L.id);return `<tr><td><a href="learning.html?mode=homework&lesson=${L.id}"><b>Bài ${L.id}</b></a><br><span lang="zh-Hans">${esc(L.title)}</span></td>${E.KINDS.map(k=>{const g=state.lessons[L.id]?.[k];return `<td>${g?.first?`${g.first.correct}/5${g.completed?'<br><span class="la-status">Đã hoàn thành</span>':'<br><span class="la-small">Đang sửa / làm</span>'}`:'<span class="la-muted">Chưa nộp</span>'}</td>`;}).join('')}<td><b>${t.correct}/${t.answered} đúng</b><br><span class="la-small">Đã nộp ${t.answered}/20 câu</span></td><td>${t.completed}/4 nhóm${t.done?' ✓':''}</td></tr>`;}).join('')}</tbody></table></div><p class="la-small">Làm lại không xoá điểm lần đầu. Dấu hoàn thành dựa trên bài nộp và sửa bài; lịch sử đọc và dấu sao của trang cũ được giữ riêng.</p><section class="la-panel"><h2>Sao lưu & khôi phục</h2><p class="la-muted">Dữ liệu nằm trên trình duyệt này. Tải bản sao lưu để chuyển sang thiết bị khác hoặc giữ lại trước khi xoá dữ liệu trình duyệt.</p><div class="la-toolbar"><button class="la-button" id="exportProgress" data-testid="export-progress">Tải bản sao lưu</button><label class="la-ghost" for="importProgress">Mở bản sao lưu<input type="file" id="importProgress" accept="application/json,.json" hidden></label></div><p id="importStatus" class="la-small" role="status"></p></section><section class="la-panel la-settings"><h2>Đặt lại tiến độ</h2><p class="la-small">Chỉ xoá dữ liệu bài tập và ôn từ mới. Không xoá dữ liệu đọc, bút thuận hay dấu sao cũ.</p><label>Bài cần đặt lại<select id="resetLesson">${data.map(L=>`<option value="${L.id}">Bài ${L.id}</option>`).join('')}</select><button class="la-danger" id="resetOne">Xoá tiến độ bài này</button></label><button class="la-danger" id="resetAll">Xoá toàn bộ tiến độ mới</button></section>`;
    app.main.innerHTML=html;
    $('#exportProgress').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`ran-hsk1-progress-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);};
    $('#importProgress').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>5*1024*1024){$('#importStatus').textContent='Tệp quá lớn. Hãy chọn bản sao lưu dưới 5 MB.';return;}try{const imported=E.validateImport(JSON.parse(await file.text()),bank);if(!confirm('Thay tiến độ hiện tại bằng bản sao lưu này? Hãy tải bản sao lưu hiện tại trước nếu cần.'))return;state=imported;app.state=state;save();renderProgress();toast('Đã khôi phục bản sao lưu.');}catch(error){$('#importStatus').textContent=`Không thể mở bản sao lưu: ${error.message}`;}};
    $('#resetOne').onclick=()=>{const id=Number($('#resetLesson').value);if(!confirm(`Xoá điểm và câu trả lời mới của Bài ${id}?`))return;delete state.lessons[id];for(const [key,v] of Object.entries(state.questionReviews))if(v.lesson===id)delete state.questionReviews[key];save();renderProgress();toast(`Đã đặt lại Bài ${id}.`);};
    $('#resetAll').onclick=()=>{if(!confirm('Xoá toàn bộ tiến độ mới của 15 bài, lịch ôn và tự đánh giá từ? Thao tác này không thể hoàn tác nếu chưa sao lưu.'))return;state=E.blank();app.state=state;save();renderProgress();};
  }
  let reviewSession=null;
  function renderReview(){
    document.title='Ôn lại · 然老师';const now=Date.now(),records=Object.entries(state.questionReviews).filter(([id])=>qMap.has(id)),due=records.filter(([,r])=>r.dueAt<=now),wrong=records.filter(([,r])=>r.mistakes>0),list=(state.preferences.reviewFilter==='wrong'?wrong:due).sort((a,b)=>a[1].dueAt-b[1].dueAt);
    if(route.question&&qMap.has(route.question)){if(!reviewSession||reviewSession.id!==route.question)reviewSession={id:route.question,g:{draft:{},orders:{},attempt:null,corrections:{}}};renderReviewQuestion();return;}
    app.main.innerHTML=hero('Ôn lại · 复习','Nhớ lâu hơn, từng chút một','Các câu đã làm sẽ trở lại sau một khoảng thời gian. Sửa đúng ngay sau khi xem đáp án không thay điểm lần đầu.')+`<div class="la-stats"><div class="la-stat"><b>${due.length}</b><span>Câu đến lịch ôn</span></div><div class="la-stat"><b>${wrong.length}</b><span>Câu từng trả lời sai</span></div><div class="la-stat"><b>${Object.keys(state.words||{}).length}</b><span>Từ đã tự đánh giá</span></div></div><div class="la-toolbar"><div><button class="la-ghost" data-review-filter="due">Đến lịch (${due.length})</button> <button class="la-ghost" data-review-filter="wrong">Từng sai (${wrong.length})</button></div><a class="la-text-link" href="learning.html?mode=vocab">Ôn từ vựng →</a></div>${list.length?list.map(([qid,r])=>{const q=qMap.get(qid);return `<article class="la-review-card"><div><b>Bài ${r.lesson} · ${esc(labels[q.kind])}</b><p>${esc(q.skill)}</p><p class="la-small">${r.dueAt<=now?'Đến lịch ôn':`Lần ôn tới: ${new Date(r.dueAt).toLocaleDateString('vi-VN')}`} · Đã trả lời sai ${r.mistakes} lần</p></div><button class="la-button" data-review-id="${esc(qid)}">Ôn câu này</button></article>`;}).join(''):`<div class="la-empty"><h2>${state.preferences.reviewFilter==='wrong'?'Chưa có câu sai':'Chưa có câu đến lịch'}</h2><p>Làm bài tập hoặc luyện nghe; các câu cần ôn sẽ xuất hiện tại đây.</p><a class="la-button" href="learning.html?mode=homework&lesson=${route.lesson}">Tiếp tục học →</a></div>`}<p class="la-small">Lịch khởi đầu: 1, 3, 7, 14 ngày; câu sai quay lại sớm hơn. Đây là lịch gợi ý, bạn có thể ôn lại bất cứ lúc nào.</p>`;
    $$('[data-review-filter]').forEach(b=>{b.setAttribute('aria-pressed',String((state.preferences.reviewFilter||'due')===b.dataset.reviewFilter));b.onclick=()=>{state.preferences.reviewFilter=b.dataset.reviewFilter;save();renderReview();};});$$('[data-review-id]').forEach(b=>b.onclick=()=>navigate('review',qMap.get(b.dataset.reviewId).lesson,{question:b.dataset.reviewId}));
  }
  function renderReviewQuestion(){
    const q=qMap.get(reviewSession.id),g=reviewSession.g;if(!g.orders[q.id])g.orders[q.id]=shuffleIndices(q.kind==='sort'?q.tokens.length:4);
    app.main.innerHTML=hero('Ôn lại · Không đổi điểm lần đầu',`Bài ${q.lesson} · ${labels[q.kind]}`,'Hãy thử nhớ trước khi kiểm tra. Có thể mở lại giáo trình khi cần.')+questionHtml(q,0,g,true)+`<div class="la-toolbar"><button class="la-button" id="reviewCheck">${g.attempt?'Về danh sách ôn →':'Kiểm tra'}</button><a class="la-text-link" href="learning.html?mode=review">Về danh sách</a></div>`;
    bindQuestions([q],g,'review',renderReviewQuestion);$('#reviewCheck').onclick=()=>{if(g.attempt){reviewSession=null;navigate('review',q.lesson);return;}if(!E.isAnswered(q,g.draft[q.id])){toast('Hãy trả lời đầy đủ trước khi kiểm tra.');return;}const good=E.check(q,g.draft[q.id]);g.attempt={answers:JSON.parse(JSON.stringify(g.draft)),results:{[q.id]:good}};g.reviewChecked=true;E.remember(state,q,good,Date.now(),q.lesson);save();renderReviewQuestion();};
  }
  const audio=new Audio();audio.preload='metadata';audio.playsInline=true;audio.preservesPitch=true;
  let audioToken=0,range=null,stopTimer=0;
  function getRate(){const n=Number(state.preferences.audioRate);return [.65,.75,1,1.25,1.5].includes(n)?n:1;}
  function audioStatus(message){const s=$('#playerStatus');if(s)s.textContent=message;}
  function setRate(value){if(![.65,.75,1,1.25,1.5].includes(value))return;state.preferences.audioRate=value;audio.defaultPlaybackRate=value;audio.playbackRate=value;audio.preservesPitch=true;save();const select=$('#playerRate');if(select)select.value=String(value);const local=$('#listeningRate');if(local)local.value=String(value);scheduleEnd();}
  function stopAudio(){audioToken++;clearTimeout(stopTimer);audio.pause();range=null;const p=$('#learningPlayer');if(p)p.hidden=true;}
  function scheduleEnd(){clearTimeout(stopTimer);if(!range||range.finished||audio.paused)return;stopTimer=setTimeout(checkEnd,Math.max(15,(range.end-audio.currentTime)/audio.playbackRate*1000));}
  function checkEnd(){if(!range||range.finished)return;if(audio.currentTime>=range.end-.035){range.finished=true;clearTimeout(stopTimer);audio.pause();if(audio.currentTime>range.end+.01)try{audio.currentTime=range.end;}catch(_e){}audioStatus('Đã nghe xong · Có thể phát lại');const b=$('#playerPause');if(b)b.textContent='Nghe lại';}else scheduleEnd();}
  async function playRange(track,start,end,label='Audio giáo trình'){
    if(!/^\d{1,2}-[1-7]$/.test(track)||!Number.isFinite(start)||!Number.isFinite(end)||end<=start){toast('Đoạn audio chưa có dữ liệu hợp lệ.');return false;}
    stopAudio();const token=audioToken,source=new URL(`audio/${track}.mp3`,location.href).href;range={track,start,end};$('#learningPlayer').hidden=false;$('#playerLabel').textContent=label;$('#playerPause').textContent='Tạm dừng';audioStatus('Đang tải audio…');setRate(getRate());
    try{
      if(audio.src!==source){audio.src=source;audio.load();}
      if(audio.readyState<1)await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>finish(new Error('timeout')),12000);function finish(error){clearTimeout(timeout);audio.removeEventListener('loadedmetadata',loaded);audio.removeEventListener('error',failed);error?reject(error):resolve();}function loaded(){finish();}function failed(){finish(new Error('audio-load'));}audio.addEventListener('loadedmetadata',loaded,{once:true});audio.addEventListener('error',failed,{once:true});});
      if(token!==audioToken)return false;if(end>audio.duration+.12)throw new Error('range');
      audio.currentTime=start;audio.playbackRate=getRate();await audio.play();if(token!==audioToken)return false;audioStatus('Đang phát · Audio gốc');scheduleEnd();return true;
    }catch(_e){if(token===audioToken){audio.pause();audioStatus('Chưa phát được. Hãy chạm nút nghe để thử lại.');toast('Không tải hoặc phát được audio. Câu này không bị tính sai; hãy thử lại.');}return false;}
  }
  function playFullTrack(track){const segments=app.segments.text[track];if(!segments?.length)return;return playRange(track,0,segments.at(-1)[1],`Bài ${route.lesson} · Bài khoá ${Math.ceil(Number(track.split('-')[1])/2)}`);}
  audio.addEventListener('timeupdate',checkEnd);audio.addEventListener('ended',()=>{clearTimeout(stopTimer);if(range)range.finished=true;audioStatus('Đã nghe xong');$('#playerPause').textContent='Nghe lại';});audio.addEventListener('error',()=>{clearTimeout(stopTimer);audioStatus('Không tải được audio. Hãy thử lại.');});
  document.addEventListener('DOMContentLoaded',()=>{
    app.main=$('#learningMain');route=readRoute();state.preferences.lastLesson=route.lesson;
    if(typeof window.initGate==='function')window.initGate();
    $('#playerRate').value=String(getRate());$('#playerRate').onchange=e=>setRate(Number(e.target.value));$('#playerStop').onclick=stopAudio;
    $('#playerPause').onclick=async()=>{if(!range)return;if(audio.paused){if(range.finished||audio.currentTime>=range.end-.035){range.finished=false;audio.currentTime=range.start;}try{await audio.play();$('#playerPause').textContent='Tạm dừng';audioStatus('Đang phát · Audio gốc');scheduleEnd();}catch(_e){toast('Hãy chạm nút nghe để thử lại.');}}else{audio.pause();clearTimeout(stopTimer);$('#playerPause').textContent='Tiếp tục';audioStatus('Đã tạm dừng');}};
    $$('[data-mode]').forEach(a=>a.onclick=e=>{e.preventDefault();navigate(a.dataset.mode,route.lesson);});
    render();
  });
  window.addEventListener('popstate',()=>{stopAudio();route=readRoute();notice='';render();});
  window.addEventListener('pagehide',()=>{stopAudio();save();});
})();
