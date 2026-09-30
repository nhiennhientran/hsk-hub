(function () {
  'use strict';
  const E = window.HSKStep1Engine;
  const bank = window.HSKStep1Bank;
  const lesson = bank[0];
  const lessonId = lesson.id;
  const labels = { choice: 'Chọn A, B, C, D', sort: 'Ghép câu', translation: 'Dịch sang tiếng Trung' };
  const descriptions = {
    choice: 'Chọn một đáp án cho mỗi câu. Bạn sẽ xem điểm và giải thích sau khi nộp đủ 5 câu.',
    sort: 'Chạm từng từ để ghép câu theo nghĩa tiếng Việt. Chạm từ trong câu để đưa từ đó trở lại.',
    translation: 'Viết câu tiếng Trung cho từng câu tiếng Việt. Trang web lưu nguyên bài của bạn để bạn chụp gửi cô.'
  };
  const byId = id => document.getElementById(id);
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  const clone = value => JSON.parse(JSON.stringify(value));
  let state = E.blank();
  let kind = 'choice';
  let storageAvailable = true;
  let submittedWithMissing = false;
  let candidate = null;
  let saveTimer;
  let writeFailed = false;
  try {
    const raw = localStorage.getItem(E.KEY);
    if (raw) state = E.validateImport(JSON.parse(raw), bank);
  } catch (error) {
    storageAvailable = false;
    byId('storage-notice').hidden = false;
    byId('storage-notice').textContent = 'Chưa mở được bản lưu trên trình duyệt. Bài hiện tại vẫn làm được; hãy tải bản sao trước khi đóng trang. Dữ liệu cũ chưa bị ghi đè.';
  }
  if (!state.profile) state.profile = { name: '', className: '' };
  for (const k of E.PATH) if (E.canOpen(state, lessonId, k) && !E.group(state, lessonId, k).completed) { kind = k; break; }
  const g = () => E.group(state, lessonId, kind);
  const questions = () => lesson[kind];
  function dateLabel(value) {
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return 'Không có thời gian ghi nhận';
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }
  function attemptDate(attempt) { return attempt && (attempt.submittedAt || attempt.at || attempt.timestamp); }
  function countCorrect(attempt) { return attempt && typeof attempt.correct === 'number' ? attempt.correct : (attempt && typeof attempt.score === 'number' ? attempt.score : 0); }
  function answeredCount() { return questions().filter(q => E.isAnswered(q, g().draft[q.id])).length; }
  function save() {
    state.updatedAt = Date.now();
    if (!storageAvailable) return;
    try {
      localStorage.setItem(E.KEY, JSON.stringify(state));
      if (writeFailed) byId('storage-notice').hidden = true;
      writeFailed = false;
      byId('save-status').textContent = 'Đã lưu trên trình duyệt này';
    } catch (error) {
      writeFailed = true;
      byId('storage-notice').hidden = false;
      byId('storage-notice').textContent = 'Trình duyệt chưa lưu được thay đổi. Hãy tải bản sao bài làm trước khi đóng trang.';
      byId('save-status').textContent = 'Chưa lưu được trên trình duyệt';
    }
  }
  function queueSave() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 180); }
  function flushSave() { clearTimeout(saveTimer); save(); }
  function shuffle(size) {
    const order = Array.from({length:size}, (_, i) => i);
    for (let i = size - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    return order;
  }
  function orderFor(q) {
    const size = kind === 'sort' ? q.tokens.length : q.options.length;
    let order = g().orders[q.id];
    if (!Array.isArray(order) || order.length !== size || new Set(order).size !== size || order.some(x => !Number.isInteger(x) || x < 0 || x >= size)) {
      order = shuffle(size);
      if (kind === 'sort') {
        for (let n = 0; n < 12 && E.check(q, order) === true; n++) order = shuffle(size);
        if (E.check(q, order) === true && size > 1) [order[0],order[1]] = [order[1],order[0]];
      }
      g().orders[q.id] = order;
    }
    return order;
  }
  function renderOverview() {
    const totals = E.totals(state, lessonId, lesson);
    const a = totals.automatic;
    const h = totals.homework;
    const manual = totals.manual;
    byId('overview').innerHTML = `<div class="s1-stat"><h2>Tiến độ nộp bài</h2><strong>${h.submitted}/15 câu</strong><div class="la-progress-track" role="progressbar" aria-label="Tiến độ nộp bài" aria-valuemin="0" aria-valuemax="15" aria-valuenow="${h.submitted}"><i style="width:${h.submitted/15*100}%"></i></div><p>${h.completedGroups}/3 phần đã nộp đủ</p></div><div class="s1-stat"><h2>10 câu chấm tự động</h2>${a.submitted ? `<p class="s1-score-line">Lần đầu: <b>${a.firstCorrect}/${a.submitted} đúng</b></p><p class="s1-score-line">Gần nhất: <b>${a.latestCorrect}/${a.submitted} đúng</b></p><p>Đã chấm ${a.submitted}/10 câu.</p>` : '<strong>Chưa có điểm</strong><p>Điểm hiện sau khi nộp từng phần.</p>'}</div><div class="s1-stat"><h2>5 câu dịch gửi cô</h2><strong>${manual.submitted}/5 đã lưu</strong><p>Không tính vào điểm chấm tự động.</p><p>Bạn tự chụp và gửi bài cho cô.</p></div>`;
  }
  function renderStages() {
    byId('stages').innerHTML = E.PATH.map((k,i) => {
      const open = E.canOpen(state, lessonId, k);
      const done = E.group(state, lessonId, k).completed;
      return `<button type="button" class="la-step ${kind===k?'active':''}" data-stage="${k}" ${open?'':'disabled'} ${kind===k?'aria-current="step"':''}><span class="la-step-num">${done?'✓':i+1}</span><span><b>${labels[k]}</b><small class="s1-step-state">${done ? 'Đã nộp đủ 5 câu' : open ? '5 câu · Đã mở' : 'Nộp phần trước để mở'}</small></span></button>`;
    }).join('');
  }
  function questionFeedback(q, attempt) {
    if (!attempt || kind === 'translation') return '';
    const answer = attempt.answers[q.id];
    const ok = E.check(q, answer);
    const correctText = kind === 'sort' ? q.answers.join(' / ') : q.options[q.answer];
    const chosenText = kind === 'sort' ? answer.map(i => q.tokens[i]).join('') : q.options[answer];
    const specific = kind === 'choice' && q.optionFeedback && !ok ? `<p class="s1-selected-feedback">${escape(q.optionFeedback[answer])}</p>` : '';
    return `<div class="la-feedback ${ok?'good':'bad'}"><h3>${ok?'Đúng':'Chưa đúng'}</h3><p class="s1-answer-label">${ok?'Câu trả lời':'Đáp án phù hợp'}:</p><p class="la-answer zh" lang="zh-Hans">${escape(correctText)}</p>${ok?'':`<p class="la-original">Bạn đã trả lời: <span class="zh" lang="zh-Hans">${escape(chosenText)}</span></p>`}<p class="la-explanation">${escape(q.explanation)}</p>${specific}<p class="s1-explanation-source">${escape(q.source.label)}</p></div>`;
  }
  function choiceQuestion(q, i) {
    const group = g();
    const selected = group.attempt ? group.attempt.answers[q.id] : group.draft[q.id];
    const optionHtml = orderFor(q).map((index, letter) => `<button type="button" class="la-option ${selected===index?'selected':''} ${group.attempt && index===q.answer?'answer-correct':''} ${group.attempt && index===selected && selected!==q.answer?'answer-wrong':''}" data-option="${q.id}" data-index="${index}" aria-pressed="${selected===index}" ${group.attempt?'disabled':''}><span class="la-option-letter">${'ABCD'[letter]}</span><span class="zh" lang="zh-Hans">${escape(q.options[index])}</span></button>`).join('');
    return `<h3 class="s1-question-title" id="title-${q.id}"><span class="s1-number">CÂU ${i+1} / 5</span>${escape(q.prompt)}</h3>${q.stem?`<p class="la-stem" lang="zh-Hans">${escape(q.stem)}</p>`:''}<div class="la-options" role="group" aria-labelledby="title-${q.id}">${optionHtml}</div>${questionFeedback(q, group.attempt)}`;
  }
  function sortQuestion(q, i) {
    const group = g();
    const answer = (group.attempt ? group.attempt.answers[q.id] : group.draft[q.id]) || [];
    const used = new Set(answer);
    return `<h3 class="s1-question-title" id="title-${q.id}"><span class="s1-number">CÂU ${i+1} / 5</span>${escape(q.meaning)}</h3><p class="la-muted">${escape(q.prompt)}</p><div class="la-sentence" aria-label="Câu ${i+1} đã ghép">${answer.length ? answer.map((token,pos) => `<button type="button" class="la-token" lang="zh-Hans" aria-label="Bỏ ${escape(q.tokens[token])} khỏi vị trí ${pos+1}" data-remove="${q.id}" data-position="${pos}" ${group.attempt?'disabled':''}>${escape(q.tokens[token])}</button>`).join('') : '<span class="s1-sentence-hint">Chạm các từ bên dưới để bắt đầu…</span>'}</div><div class="s1-token-pool" role="group" aria-label="Từ cho câu ${i+1}">${orderFor(q).map(index => `<button type="button" class="la-token" lang="zh-Hans" aria-label="Thêm ${escape(q.tokens[index])} vào câu ${i+1}" data-token="${q.id}" data-index="${index}" ${used.has(index)||group.attempt?'disabled':''}>${escape(q.tokens[index])}</button>`).join('')}</div><div class="s1-sentence-actions"><button type="button" class="s1-small-button" data-undo="${q.id}" ${!answer.length||group.attempt?'disabled':''}>Hoàn tác từ cuối</button><button type="button" class="s1-small-button" data-clear="${q.id}" ${!answer.length||group.attempt?'disabled':''}>Ghép lại câu ${i+1}</button></div>${questionFeedback(q,group.attempt)}`;
  }
  function translationQuestion(q,i) {
    const group = g();
    const answer = (group.attempt ? group.attempt.answers[q.id] : group.draft[q.id]) || '';
    return `<label class="s1-question-title" for="input-${q.id}"><span class="s1-number">CÂU ${i+1} / 5</span>${escape(q.prompt)}</label><textarea id="input-${q.id}" data-translation="${q.id}" class="s1-translation zh" lang="zh-Hans" rows="2" maxlength="12000" spellcheck="false" autocomplete="off" ${group.attempt?'readonly':''} aria-describedby="help-${q.id}">${escape(answer)}</textarea><p class="s1-charcount" id="help-${q.id}">${group.attempt?'Đã lưu nguyên bài làm.':'Viết bằng tiếng Trung. Bạn có thể dùng bàn phím hoặc bộ gõ tiếng Trung.'}</p>`;
  }
  function resultSummary() {
    const group = g();
    const attempt = group.attempt;
    if (!attempt) return kind==='translation' && group.latest ? '<section class="la-panel"><p>Bạn đang viết bản làm lại. Bản dịch đã lưu gần nhất vẫn được giữ riêng.</p><button type="button" class="la-ghost" data-receipt>Xem bản dịch đã lưu gần nhất</button></section>' : '';
    const next = E.PATH[E.PATH.indexOf(kind)+1];
    const first = group.first;
    let body = kind === 'translation' ? `<h3 class="s1-result-head">Đã lưu đủ 5 câu dịch</h3><p class="s1-result-meta">Trang web không chấm đúng – sai cho phần dịch. Hãy mở bản chụp và gửi cho cô.</p><p class="s1-result-meta">Lưu lúc: ${escape(dateLabel(attemptDate(attempt)))}</p>` : `<h3 class="s1-result-head">Đúng ${countCorrect(attempt)}/5 câu · ${countCorrect(attempt)*20}%</h3><p class="s1-result-meta">Lần đầu: <strong>${countCorrect(first)}/5</strong> · Lần nộp này: <strong>${countCorrect(attempt)}/5</strong></p><p class="s1-result-meta">Đã nộp đủ 5 câu. Phần tiếp theo đã mở. Xem giải thích dưới từng câu để luyện thêm.</p>`;
    body += `<div class="s1-summary-actions">${next?`<button type="button" class="la-button" data-stage="${next}">Tiếp tục: ${labels[next]}</button>`:'<button type="button" class="la-button" data-receipt>Mở bản chụp gửi cô</button>'}<button type="button" class="la-ghost" data-restart>Làm lại phần này</button></div>`;
    if (group.history && group.history.length > 1) body += `<details class="s1-history"><summary>Lịch sử ${group.history.length} lần nộp gần đây</summary><ol>${group.history.map(a => `<li>${escape(dateLabel(attemptDate(a)))} · ${kind==='translation'?'Đã lưu 5 câu, không chấm điểm':`${countCorrect(a)}/5 câu đúng`}</li>`).join('')}</ol></details>`;
    return `<section class="la-summary" id="submitted-result" tabindex="-1" aria-label="Kết quả nộp bài">${body}</section>`;
  }
  function renderQuestion(q,i) {
    const missing = submittedWithMissing && !E.isAnswered(q,g().draft[q.id]);
    const body = kind==='choice' ? choiceQuestion(q,i) : kind==='sort' ? sortQuestion(q,i) : translationQuestion(q,i);
    return `<article class="la-question ${missing?'s1-missing':''}" id="question-${q.id}">${body}${missing?'<p class="s1-missing-label">Vui lòng hoàn thành câu này trước khi nộp.</p>':''}</article>`;
  }
  function fitTextarea(el) { if (el) { el.style.height = 'auto'; el.style.height = `${Math.max(104,el.scrollHeight+2)}px`; } }
  function renderExercise() {
    const group = g();
    byId('exercise').innerHTML = `<div class="s1-group-head"><div><h2>${E.PATH.indexOf(kind)+1}. ${labels[kind]}</h2><p>${descriptions[kind]}</p></div><span class="s1-kind">${kind==='translation'?'Cô xem bài':'Chấm tự động · 5 câu'}</span></div>${kind==='sort'?'<p class="s1-keyboard-note">Có thể dùng Tab để chọn nút và Enter để ghép từ.</p>':''}${kind==='translation'?`<section class="la-panel"><p class="s1-note">Phần dịch không tính vào điểm chấm tự động. Bài chưa được gửi tự động cho cô.</p><div class="s1-profile"><label for="student-name">Họ tên (để cô nhận ra bài)<input id="student-name" data-profile="name" maxlength="200" value="${escape(state.profile.name)}" autocomplete="name"></label><label for="student-class">Lớp / mã học sinh<input id="student-class" data-profile="className" maxlength="200" value="${escape(state.profile.className)}" autocomplete="off"></label></div><p class="s1-profile-help">Thông tin này chỉ xuất hiện trên bản chụp và bản sao bài làm.</p></section>`:''}${resultSummary()}<div id="form-error" class="la-alert s1-inline-error" role="alert" tabindex="-1" hidden></div><div id="question-list">${questions().map(renderQuestion).join('')}</div>${group.attempt?'':`<div class="s1-submit-area"><div class="la-toolbar"><span class="s1-progress" id="answered-count">Đã làm ${answeredCount()}/5 câu</span><button type="button" class="la-button" id="submit-group">${kind==='translation'?'Lưu 5 câu dịch':'Nộp 5 câu và xem kết quả'}</button></div><p class="la-small">${kind==='translation'?'Sau khi lưu, mở bản chụp có đủ 5 câu để gửi cho cô.':'Chỉ cần làm đủ và nộp bài để mở phần sau. Không yêu cầu đạt một mức điểm để mở.'}</p></div>`}`;
    byId('exercise').querySelectorAll('textarea.s1-translation').forEach(fitTextarea);
  }
  function render() { renderOverview(); renderStages(); renderExercise(); flushSave(); }
  function updateAnswerCount() {
    const count=answeredCount();
    const el=byId('answered-count');if(el)el.textContent=`Đã làm ${count}/5 câu`;
    const error=byId('form-error');
    if(error&&!error.hidden){error.hidden=count===5;if(count<5)error.textContent=`Bạn đã làm ${count}/5 câu. Vui lòng hoàn thành đủ 5 câu rồi nộp bài.`;}
    if(submittedWithMissing)questions().forEach(q=>{if(E.isAnswered(q,g().draft[q.id])){const card=byId(`question-${q.id}`);card.classList.remove('s1-missing');const warning=card.querySelector('.s1-missing-label');if(warning)warning.remove();}});
  }
  function replaceQuestion(q,focusSelector) {
    const i = questions().findIndex(item=>item.id===q.id);
    byId(`question-${q.id}`).outerHTML=renderQuestion(q,i);
    updateAnswerCount();
    if(focusSelector){const focus=byId(`question-${q.id}`).querySelector(focusSelector);if(focus)focus.focus({preventScroll:true});}
  }
  function findQuestion(id) { return questions().find(q=>q.id===id); }
  function focusExercise() { byId('exercise').focus({preventScroll:true}); byId('exercise').scrollIntoView({block:'start'}); }
  function openStage(k) {
    if (!E.PATH.includes(k) || !E.canOpen(state,lessonId,k)) return;
    flushSave();kind=k;submittedWithMissing=false;render();focusExercise();
  }
  function submitGroup() {
    flushSave();
    const result = E.submit(state,lessonId,kind,questions());
    if (!result.ok) {
      submittedWithMissing=true;
      renderExercise();
      byId('form-error').hidden=false;
      byId('form-error').textContent=`Bạn đã làm ${answeredCount()}/5 câu. Vui lòng hoàn thành đủ 5 câu rồi nộp bài.`;
      byId('form-error').focus();
      return;
    }
    submittedWithMissing=false;
    render();
    const feedback=byId('submitted-result');feedback.focus({preventScroll:true});feedback.scrollIntoView({block:'start'});
  }
  function receipt() {
    flushSave();
    const group=E.group(state,lessonId,'translation');
    const attempt=group.attempt||group.latest;
    if(!attempt) return;
    const details=lesson.translation.map((q,i)=>`<article class="s1-receipt-item"><h2>${i+1}. ${escape(q.prompt)}</h2><p class="s1-written-answer zh" lang="zh-Hans">${escape(attempt.answers[q.id])}</p></article>`).join('');
    byId('receipt').innerHTML=`<div class="s1-receipt-actions"><button type="button" class="la-ghost" data-close-receipt>Quay lại bài tập</button><button type="button" class="la-button" data-print>In / lưu PDF</button></div><header class="s1-receipt-header"><p class="la-eyebrow">Học cùng cô Nhiên · Bài dịch</p><h1>Bài 3 · <span lang="zh-Hans">我是中国人</span></h1><div class="s1-receipt-meta"><p><b>Họ tên:</b> ${escape(state.profile.name||'Chưa điền')}</p><p><b>Lớp / mã:</b> ${escape(state.profile.className||'Chưa điền')}</p><p><b>Lưu lúc:</b> ${escape(dateLabel(attemptDate(attempt)))}</p><p><b>Đã lưu:</b> 5/5 câu · Không chấm điểm</p></div><p class="s1-receipt-tip">Hãy chụp đủ 5 câu và gửi cho cô. Trang web chưa gửi bài và chưa nhận đánh giá của cô.</p></header>${details}<p class="s1-receipt-version">Bài dịch Việt → Trung · Bản mẫu Bài 3 · Bản nộp gần nhất</p>`;
    byId('receipt').hidden=false;document.body.classList.add('is-receipt');byId('receipt').focus();window.scrollTo(0,0);
  }
  document.addEventListener('click', event=>{
    const button=event.target.closest('button');if(!button||button.disabled)return;
    if(button.dataset.stage) return openStage(button.dataset.stage);
    if(button.id==='submit-group') return submitGroup();
    if(button.hasAttribute('data-restart')){E.restart(state,lessonId,kind);submittedWithMissing=false;render();focusExercise();return;}
    if(button.hasAttribute('data-receipt')) return receipt();
    if(button.hasAttribute('data-close-receipt')){document.body.classList.remove('is-receipt');byId('receipt').hidden=true;focusExercise();return;}
    if(button.hasAttribute('data-print')){window.print();return;}
    if(button.dataset.option){if(g().attempt)return;const q=findQuestion(button.dataset.option);if(!q)return;g().draft[q.id]=Number(button.dataset.index);replaceQuestion(q,'.la-option.selected');queueSave();return;}
    const id=button.dataset.token||button.dataset.remove||button.dataset.undo||button.dataset.clear;
    if(id){if(kind!=='sort'||g().attempt)return;const q=findQuestion(id);if(!q)return;let answer=[...(g().draft[q.id]||[])];if(button.dataset.token){const index=Number(button.dataset.index);if(!answer.includes(index))answer.push(index);}else if(button.dataset.remove){answer.splice(Number(button.dataset.position),1);}else if(button.dataset.undo){answer.pop();}else answer=[];g().draft[q.id]=answer;replaceQuestion(q,answer.length===q.tokens.length?'[data-undo]':'.s1-token-pool button:not(:disabled)');queueSave();}
  });
  byId('exercise').addEventListener('input',event=>{
    const el=event.target;
    if(el.dataset.translation){if(kind!=='translation'||g().attempt)return;g().draft[el.dataset.translation]=el.value;fitTextarea(el);updateAnswerCount();queueSave();}
    if(el.dataset.profile){state.profile[el.dataset.profile]=el.value.slice(0,200);queueSave();}
  });
  // Do not rerender a text field during composition; the browser owns the IME session.
  byId('exercise').addEventListener('compositionend',event=>{if(event.target.dataset.translation){g().draft[event.target.dataset.translation]=event.target.value;fitTextarea(event.target);updateAnswerCount();queueSave();}});
  byId('export-backup').addEventListener('click',()=>{
    flushSave();const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`hsk1-bai3-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
  });
  byId('backup-input').addEventListener('input',()=>{candidate=null;byId('backup-result').textContent='';});
  function updateRecoveryButton(){try{byId('restore-previous').hidden=!localStorage.getItem(`${E.KEY}_recovery`);}catch(error){byId('restore-previous').hidden=true;}}
  byId('restore-previous').addEventListener('click',()=>{
    try{const raw=localStorage.getItem(`${E.KEY}_recovery`);if(!raw)throw new Error('missing');byId('backup-input').value=raw;byId('inspect-backup').click();}catch(error){byId('backup-result').innerHTML='<p class="la-alert">Chưa đọc được bản khôi phục. Bài hiện tại chưa bị thay đổi.</p>';}
  });
  byId('inspect-backup').addEventListener('click',()=>{
    candidate=null;
    try{
      const input=JSON.parse(byId('backup-input').value);
      const legacy=Number(input.schema||input.version)===2;
      candidate=legacy?E.migrateLegacy(input,bank):E.validateImport(input,bank);
      const totals=E.totals(candidate,lessonId,lesson);
      byId('backup-result').innerHTML=`<div class="la-success"><p>Bản sao hợp lệ: Bài 3 có ${totals.homework.submitted}/15 câu đã nộp; phần dịch mới có ${totals.manual.submitted}/5 câu.</p>${legacy?'<p>Bản cũ được giữ trong mục lịch sử của bản sao. Bài dịch chọn đáp án cũ không được tính là bài dịch tự viết đã nộp.</p>':''}<p>Mở bản sao sẽ thay bài đang hiển thị. Bản hiện tại được giữ làm bản khôi phục trên trình duyệt.</p><button type="button" class="la-button" id="apply-backup">Mở bản sao này</button></div>`;
    }catch(error){byId('backup-result').innerHTML='<p class="la-alert">Bản sao chưa hợp lệ. Hãy kiểm tra đúng tệp bài làm và đủ nội dung JSON. Bài hiện tại chưa bị thay đổi.</p>';}
  });
  byId('backup-result').addEventListener('click',event=>{
    if(event.target.id!=='apply-backup'||!candidate)return;
    try{localStorage.setItem(`${E.KEY}_recovery`,JSON.stringify(state));}catch(error){byId('backup-result').innerHTML='<p class="la-alert">Chưa giữ được bản hiện tại. Hãy tải bản sao bài đang làm trước khi thử lại.</p>';candidate=null;return;}
    state=clone(candidate);candidate=null;storageAvailable=true;byId('storage-notice').hidden=true;kind='choice';submittedWithMissing=false;render();updateRecoveryButton();byId('backup-result').innerHTML='<p class="la-success">Đã mở bản sao. Bài cũ ở mục khôi phục vẫn được giữ.</p>';byId('backup-input').value='';focusExercise();
  });
  window.addEventListener('pagehide',flushSave);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushSave();});
  window.addEventListener('resize',()=>{byId('exercise').querySelectorAll('textarea.s1-translation').forEach(fitTextarea);});
  render();updateRecoveryButton();
})();
