/* Step 3 UI: original-audio listening and learner-rated vocabulary review. */
(function () {
  'use strict';
  const E = window.HSKStep3Engine, C = window.HSKStep3Catalog;
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const fmtDate = time => new Intl.DateTimeFormat('vi-VN', {dateStyle:'medium',timeStyle:'short'}).format(new Date(time));
  const qById = new Map(C.listening.map(q => [q.id, q]));
  const sensesByForm = new Map();
  for (const item of C.vocabulary) {
    if (!sensesByForm.has(item.zh)) sensesByForm.set(item.zh, new Set());
    sensesByForm.get(item.zh).add(item.senseId);
  }
  const labels = {again:'Chưa nhớ',hard:'Còn khó',good:'Đã nhớ'};
  const PREVIOUS_KEY = E.KEY + '_previous';
  let state = E.blank(), lastRaw = null, previousRaw = null, corruptRaw = null;
  let storageBlocked = false, storageAvailable = true, pendingBackup = null;
  let previousInMemoryOnly = false, mutationVersion = 0, backupReadVersion = 0;
  let storageMessage = '';

  function notice(message, warning = false) {
    $('action-notice').textContent = message;
    $('action-notice').classList.toggle('s3-warning', warning);
    $('action-notice').hidden = !message;
  }
  function storageNotice(message, conflict = false) {
    storageMessage = message;
    $('storage-notice').textContent = message;
    $('storage-notice').hidden = !message;
    $('storage-sync').hidden = !conflict;
  }
  function readStorage() { return localStorage.getItem(E.KEY); }
  function parseBackup(raw) {
    if (typeof raw !== 'string' || new TextEncoder().encode(raw).byteLength > E.MAX_BACKUP_BYTES) {
      throw new Error('Tệp vượt quá giới hạn 4 MiB. Hãy chọn đúng bản sao nghe và ôn từ.');
    }
    let parsed;
    try { parsed = JSON.parse(raw); } catch (_) { throw new Error('Nội dung chưa phải JSON hợp lệ. Bản đang học vẫn được giữ.'); }
    return E.importBackup(parsed, C);
  }
  try {
    lastRaw = readStorage();
    if (lastRaw !== null) {
      try { state = parseBackup(lastRaw); }
      catch (_) {
        corruptRaw = lastRaw; storageBlocked = true;
        storageNotice('Chưa mở được dữ liệu đã lưu. Dữ liệu gốc vẫn được giữ; tải xuống hoặc mở một bản sao hợp lệ. Bạn có thể luyện trong tab này và tải tiến độ mới.', false);
      }
    }
    previousRaw = localStorage.getItem(PREVIOUS_KEY);
  } catch (_) {
    storageAvailable = false;
    storageNotice('Trình duyệt chưa cho phép lưu tiến độ. Bạn vẫn có thể luyện và tải bản sao trước khi đóng trang.');
  }
  let entryChanged = false;
  const entry = window.HSKStep3Entry;
  if (entry && typeof entry === 'object') {
    const patch = {};
    if (['listening', 'vocabulary'].includes(entry.module)) patch.module = entry.module;
    if (Array.isArray(entry.lessons) && entry.lessons.every(n => Number.isInteger(n) && n >= 1 && n <= 15)) patch.lessons = entry.lessons;
    if (entry.filter === 'due') patch.vocabularyFilter = 'due';
    // Keep the saved question/card queues, answers, scores and schedules intact.
    entryChanged = Object.keys(patch).some(k => !same(state.preferences[k], patch[k]));
    if (entryChanged) E.setPreferences(state, patch, Date.now());
  }
  function emitState() {
    window.dispatchEvent(new CustomEvent('hsk-learning-state', {detail: {
      app: E.APP, preferences: {...state.preferences, lessons: state.preferences.lessons.slice()},
      listening: E.listeningSummary(state, C).overall,
      stored: storageAvailable && !storageBlocked
    }}));
  }
  function serialize() { return JSON.stringify(E.exportBackup(state, C)); }
  function save() {
    if (storageBlocked) {
      $('save-status').textContent = 'Đang giữ trong tab này · hãy tải bản sao.';
      return false;
    }
    let raw;
    try { raw = serialize(); }
    catch (error) { storageNotice('Chưa lưu được: ' + error.message); return false; }
    try {
      const current = readStorage();
      if (current !== lastRaw) {
        storageBlocked = true;
        storageNotice('Tiến độ đã thay đổi ở tab khác. Trang này tạm dừng ghi đè để giữ cả hai bản.', true);
        $('save-status').textContent = 'Có bản ở tab khác · bản đang làm vẫn còn.';
        return false;
      }
      localStorage.setItem(E.KEY, raw); lastRaw = raw; storageAvailable = true;
      storageNotice('');
      $('save-status').textContent = 'Đã lưu trên trình duyệt này · ' + new Date().toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'});
      return true;
    } catch (_) {
      storageAvailable = false;
      storageNotice('Không ghi được tiến độ vào trình duyệt. Bài đang làm vẫn còn trong tab; hãy tải bản sao trước khi đóng.');
      $('save-status').textContent = 'Chưa lưu vào trình duyệt · tải bản sao để giữ.';
      return false;
    }
  }
  function keepPrevious() {
    try {
      previousRaw = serialize();
      previousInMemoryOnly = true;
      try {
        // A stale or protected tab must not overwrite another tab's recovery point.
        if (!storageBlocked && readStorage() === lastRaw) {
          localStorage.setItem(PREVIOUS_KEY, previousRaw); previousInMemoryOnly = false;
        }
      } catch (_) { /* Still recoverable in this tab; the UI says so explicitly. */ }
      $('restore-previous').hidden = false;
    } catch (_) { /* Do not replace a previous recovery point with invalid data. */ }
  }
  function act(action, focusId, renderPage = true) {
    try {
      action(); mutationVersion++; save(); emitState();
      if (renderPage) render();
      if (focusId) {
        const target = $(focusId);
        (target && !target.disabled ? target : $('work-content'))?.focus({preventScroll:true});
        if (focusId === 'work-content') {
          ($('audio-controls').hidden ? $('work-content') : $('audio-controls')).scrollIntoView({block:'start'});
        } else if (focusId === 'listening-feedback' || focusId === 'card-answer') {
          target?.scrollIntoView({block:'nearest'});
        }
      }
    } catch (error) { notice(error.message || 'Chưa thực hiện được. Vui lòng thử lại.', true); }
  }
  const player = window.HSKStep3Player.create({
    onStart: ({id}) => {
      const session = state.listening.session;
      if (state.preferences.module === 'listening' && session?.questionIds[session.position] === id) {
        act(() => E.recordListen(state, C, id, Date.now()), null, false);
        const count = $('listen-count');
        if (count) count.textContent = 'Đã nghe ' + session.responses[id].listenCount + ' lần · không trừ điểm';
      }
    },
    onRateChange: rate => act(() => E.setPreferences(state, {rate}, Date.now()), null, false)
  });
  player.setRate(state.preferences.rate);
  $('lesson-checks').insertAdjacentHTML('beforeend', Array.from({length:15}, (_, i) =>
    `<label class="s3-lesson"><input type="checkbox" data-lesson="${i+1}" value="${i+1}"><span>Bài ${i+1}</span></label>`).join(''));

  function deck(options = {}) {
    return E.makeDeck(state, C, {lessons:state.preferences.lessons, filter:state.preferences.vocabularyFilter,
      direction:state.preferences.direction, shuffle:false, ...options}, Date.now());
  }
  function renderPicker() {
    const p = state.preferences, isListen = p.module === 'listening';
    $('module-listening').setAttribute('aria-pressed', String(isListen));
    $('module-vocabulary').setAttribute('aria-pressed', String(!isListen));
    $('page-title').textContent = isListen ? 'Luyện nghe theo bài' : 'Nhớ từ bằng cách tự nhớ lại';
    $('page-intro').textContent = isListen ? 'Chọn một hoặc nhiều bài. Nghe lại tùy ý, rồi chọn nghĩa phù hợp bằng tiếng Việt.' : 'Gộp các bài đã học, tự nhớ nghĩa trước khi lật thẻ, rồi chọn mức độ bạn nhớ.';
    const allSenses = new Set(C.vocabulary.map(v => v.senseId)).size;
    $('hero-number').textContent = isListen ? C.listening.length : new Set(C.vocabulary.map(v => v.zh)).size;
    $('hero-unit').textContent = isListen ? 'câu nghe trong 15 bài' : 'từ / tên riêng theo giáo trình';
    for (const input of $('lesson-checks').querySelectorAll('input')) input.checked = p.lessons.includes(Number(input.dataset.lesson));
    $('listening-mode').value = p.listeningMode;
    $('vocab-filter').value = p.vocabularyFilter;
    $('review-direction').value = p.direction;
    $('shuffle-items').checked = p.shuffle;
    $('listening-mode-label').hidden = !isListen;
    $('vocab-filter-label').hidden = isListen;
    $('review-direction-label').hidden = isListen;
    $('start-listening').hidden = !isListen;
    $('start-review').hidden = isListen;
    const selected = deck(), ls = E.listeningSummary(state, C);
    const nListen = C.listening.filter(q => p.lessons.includes(q.lesson) &&
      (p.listeningMode === 'all' || ls.wrongIds.includes(q.id))).length;
    const el = $('selection-summary');
    Object.assign(el.dataset, {lessons:p.lessons.length,listeningCount:nListen,mergedCount:selected.mergedCount,
      filteredCount:selected.filteredCount,distinctForms:selected.distinctForms});
    el.textContent = p.lessons.length ? `${p.lessons.length} bài đã chọn · ${nListen} câu nghe · ${selected.mergedCount} thẻ nghĩa / ${selected.distinctForms} từ khác nhau${!isListen ? ' · '+selected.filteredCount+' thẻ trong nhóm ôn' : ''}` : 'Chưa chọn bài nào. Chọn ít nhất một bài để bắt đầu.';
    $('start-listening').disabled = !p.lessons.length || !nListen;
    $('start-review').disabled = !p.lessons.length || !selected.filteredCount;
    $('selection-help').textContent = isListen ? 'Mỗi bài có 5 câu nghe. Chọn nhiều bài để luyện xen kẽ.' : 'Các nghĩa khác nhau được giữ riêng. Từ trùng nghĩa được gộp và vẫn giữ đủ nguồn bài.';
    const active = isListen ? state.listening.session : state.cards.review;
    const differs = active && (!same(active.lessons, p.lessons) || (isListen ? active.mode !== p.listeningMode :
      active.filter !== p.vocabularyFilter || active.direction !== p.direction));
    $('session-scope-note').hidden = !active;
    $('session-scope-note').textContent = active ? `${differs ? 'Bạn đã đổi lựa chọn. ' : ''}Lượt đang làm giữ nguyên bài ${active.lessons.join(', ') || '—'} và thứ tự. Nhấn bắt đầu để tạo lượt mới; tiến độ đã nộp vẫn được giữ.` : '';
    if (isListen) {
      const o = ls.overall;
      $('overview').innerHTML = `<div class="s3-stat" id="listening-overall" data-answered="${o.answered}" data-first-correct="${o.firstCorrect}" data-latest-correct="${o.latestCorrect}"><strong>${o.answered} / ${o.total}</strong><span>Câu đã nộp trong toàn bộ 15 bài</span></div><div class="s3-stat"><strong>${o.firstCorrect} / ${o.answered}</strong><span>Đúng ở lần nộp đầu tiên</span><p>${o.answered ? 'Giữ nguyên khi bạn luyện lại.' : 'Chưa có câu nào được chấm.'}</p></div><div class="s3-stat"><strong>${o.latestCorrect} / ${o.answered}</strong><span>Đúng ở lần nộp gần nhất</span><p>${ls.wrongIds.length} câu cần nghe lại.</p></div>`;
    } else {
      const c = E.cardSummary(state, C, Date.now());
      $('overview').innerHTML = `<div class="s3-stat"><strong>${c.rated} / ${allSenses}</strong><span>Thẻ nghĩa đã tự đánh giá</span></div><div class="s3-stat"><strong>${c.due}</strong><span>Đến lượt ôn / thẻ mới</span><p>Trong toàn bộ 15 bài.</p></div><div class="s3-stat"><strong>${c.wrong}</strong><span>Thẻ bạn chọn “Chưa nhớ”</span><p>Tách riêng với điểm nghe.</p></div>`;
    }
    $('restore-previous').hidden = !previousRaw;
    let memoryNotice = $('recovery-memory-notice');
    if (!memoryNotice) {
      memoryNotice = document.createElement('p'); memoryNotice.id = 'recovery-memory-notice';
      memoryNotice.className = 's3-notice s3-warning';
      $('restore-previous').parentElement.insertAdjacentElement('afterend', memoryNotice);
    }
    memoryNotice.hidden = !previousInMemoryOnly;
    memoryNotice.textContent = previousInMemoryOnly ? 'Bản trước chỉ được giữ trong tab này vì chưa ghi được vào bộ nhớ trình duyệt. Muốn giữ bản đó, hãy khôi phục rồi tải tệp trước khi đóng hoặc tải lại trang.' : '';
    $('export-raw').hidden = !corruptRaw;
  }
  function noWork(message, detail) {
    player.setItem(null);
    $('work-content').innerHTML = `<div class="la-panel"><h2>${escape(message)}</h2><p class="la-muted">${escape(detail)}</p></div>`;
  }
  function sourceText(source) {
    return `Giáo trình, tr. ${source.printPages.join(', ')} · PDF tr. ${source.pdfPages.join(', ')}`;
  }
  function renderListening() {
    const session = state.listening.session;
    if (!session || !session.questionIds.length) {
      noWork(session ? 'Chưa có câu phù hợp trong lượt này' : 'Sẵn sàng nghe?', 'Chọn bài ở trên, rồi nhấn “Bắt đầu lượt nghe”. Nhóm cần làm lại chỉ lấy các câu bạn đã nộp sai gần nhất.'); return;
    }
    const id = session.questionIds[session.position], q = qById.get(id), response = session.responses[id];
    const summary = E.listeningSummary(state, C).session, submitted = !!response.submission;
    const order = session.optionOrders[id], letter = n => 'ABCD'[order.indexOf(n)];
    let feedback = '';
    if (submitted) {
      const right = response.submission.correct;
      feedback = `<section id="listening-feedback" tabindex="-1" class="s3-feedback ${right ? 'correct' : 'wrong'}" aria-label="Kết quả và giải thích"><h3>${right ? 'Đúng rồi.' : 'Mình cùng nghe lại nhé.'} Đáp án: ${letter(q.answer)}.</h3><p><strong>${escape(q.options[q.answer])}</strong></p><p>${escape(q.optionFeedback[response.selected])}</p><p>${escape(q.explanationVi)}</p><div id="listen-transcript" class="s3-transcript">${q.transcript.map(t => `<div class="s3-turn"><p class="zh" lang="zh-Hans">${escape(t.zh)}</p><p class="s3-pinyin">${escape(t.py)}</p><p class="vi">${escape(t.vi)}</p></div>`).join('')}</div><div id="listen-keywords" class="s3-keywords">${q.keywords.map(k => `<span class="s3-keyword"><span lang="zh-Hans">${escape(k.zh)}</span> · ${escape(k.py)} · ${escape(k.vi)}</span>`).join('')}</div><details><summary>Vì sao các lựa chọn khác chưa phù hợp?</summary>${order.map((idx,i) => `<p><strong>${'ABCD'[i]}.</strong> ${escape(q.optionFeedback[idx])}</p>`).join('')}</details><p class="s3-source">${escape(sourceText(q.source))} · đoạn âm ${escape(q.audio.track)}.</p></section>`;
    }
    $('work-content').innerHTML = `<div class="s3-work-head"><div><h2>Lượt nghe đang làm</h2><p>Bài ${session.lessons.join(', ')} · ${session.mode === 'wrong' ? 'các câu cần làm lại' : 'tất cả câu đã chọn'}</p></div><div id="listen-summary" class="s3-session-score" data-total="${summary.total}" data-answered="${summary.answered}" data-correct="${summary.correct}">Đã nộp ${summary.answered}/${summary.total}<br>Đúng ${summary.correct}/${summary.answered}${summary.answered ? ' · '+summary.percentAmongAnswered+'%' : ''}</div></div><article class="la-panel" id="listening-question" data-question-id="${id}"><p class="s3-qnum">Bài ${q.lesson} · Câu ${session.position+1} / ${session.questionIds.length}</p><h2 class="s3-qtitle">${escape(q.promptVi)}</h2><div class="la-options">${order.map((idx,i) => `<button type="button" class="la-option${submitted && idx===q.answer ? ' is-correct' : ''}${submitted && idx===response.selected && idx!==q.answer ? ' is-wrong' : ''}" data-listen-option="${idx}" aria-pressed="${idx===response.selected}" ${submitted ? 'disabled' : ''}><span class="la-letter">${'ABCD'[i]}</span><span>${escape(q.options[idx])}</span></button>`).join('')}</div><div class="s3-answer-row"><p class="la-small" id="listen-count">Đã nghe ${response.listenCount} lần · không trừ điểm</p><button type="button" class="la-button" id="listen-submit" ${submitted || response.selected === null ? 'disabled' : ''}>${submitted ? 'Đã nộp câu này' : 'Nộp câu trả lời'}</button></div>${feedback}</article><div class="s3-card-controls"><button type="button" class="la-ghost" id="listen-prev" ${session.position===0 ? 'disabled' : ''}>← Câu trước</button><button type="button" class="la-button" id="listen-next" ${!submitted || (summary.done && session.position===session.questionIds.length-1) ? 'disabled' : ''}>Câu tiếp →</button></div>${summary.done ? `<section class="s3-complete"><h3>Bạn đã hoàn thành lượt nghe này.</h3><p>Tổng ${summary.total} câu · đúng ${summary.correct} câu · ${summary.percentAmongAnswered}%.</p><p>Xem lại phần giải thích hoặc chọn nhóm “Câu nghe cần làm lại” để luyện thêm.</p></section>` : ''}<nav class="s3-question-nav" aria-label="Xem lại các câu trong lượt">${session.questionIds.map((qid,i) => `<button type="button" data-question-position="${i}" aria-label="Câu ${i+1}" aria-current="${i===session.position}" class="${session.responses[qid].submission ? (session.responses[qid].submission.correct ? 'done' : 'miss') : ''}" ${i>0 && !session.responses[session.questionIds[i-1]].submission ? 'disabled' : ''}>${i+1}</button>`).join('')}</nav>`;
    player.setItem({id:q.id,label:`Âm thanh giáo trình · Bài ${q.lesson} · Câu ${session.position+1}`});
    for (const button of $('work-content').querySelectorAll('[data-listen-option]')) button.addEventListener('click', () => {
      act(() => E.selectListening(state, C, q.id, Number(button.dataset.listenOption), Date.now()));
      $('work-content').querySelector(`[data-listen-option="${button.dataset.listenOption}"]`)?.focus({preventScroll:true});
    });
    $('listen-submit').addEventListener('click', () => act(() => E.submitListening(state, C, Date.now()), 'listening-feedback'));
    $('listen-prev').addEventListener('click', () => act(() => E.moveListening(state, session.position-1, Date.now()), 'work-content'));
    $('listen-next').addEventListener('click', () => act(() => E.nextListening(state, Date.now()), 'work-content'));
    for (const button of $('work-content').querySelectorAll('[data-question-position]')) button.addEventListener('click', () =>
      act(() => E.moveListening(state, Number(button.dataset.questionPosition), Date.now()), 'work-content'));
  }
  function renderVocabulary() {
    const review = state.cards.review;
    if (!review || !review.senseIds.length) {
      noWork(review ? 'Chưa có thẻ phù hợp trong lượt này' : 'Thử nhớ trước khi lật thẻ', 'Chọn các bài bạn đã học, chọn nhóm từ và hướng nhớ lại, rồi bắt đầu. Bạn tự đánh giá mức độ nhớ; trang không chấm bản dịch của bạn.'); return;
    }
    const currentDeck = deck({lessons:review.lessons,filter:'all',direction:review.direction});
    const sid = review.senseIds[review.position], card = currentDeck.cards.find(c => c.senseId===sid);
    if (!card) throw new Error('Không tìm thấy thẻ đang ôn. Hãy mở lại bản sao đúng phiên bản.');
    const flipped = !!review.revealed[sid], rating = review.ratings[sid], schedule = state.cards.schedule[sid];
    const sum = E.cardSummary(state, C, Date.now()).review, reverse = review.direction === 'vi-zh';
    const audioAllowed = !!card.audioRecordId && (!reverse || flipped);
    const frontContext = !reverse && !flipped && sensesByForm.get(card.zh)?.size > 1 && card.cueZh ?
      `<p id="card-context" class="s3-card-cue" lang="zh-Hans">${escape(card.cueZh)}</p>` : '';
    let back = '';
    if (flipped) {
      back = `<div id="card-answer" tabindex="-1" class="s3-card-back"><p class="zh" lang="zh-Hans">${escape(card.zh)}</p><p class="s3-pinyin">${escape(card.py)}</p><p class="vi">${escape(card.vi)}</p><p class="s3-card-sense">Nghĩa trong bài: <span lang="zh-Hans">${escape(card.senseZh)}</span></p>${card.cueZh ? `<p class="s3-card-cue" lang="zh-Hans">${escape(card.cueZh)}</p>` : ''}<div class="s3-ratings" aria-label="Bạn tự đánh giá mức độ nhớ">${Object.entries(labels).map(([value,label]) => `<button type="button" data-rating="${value}" ${rating ? 'disabled' : ''}>${label}</button>`).join('')}</div>${rating ? `<p class="s3-rating-result">Bạn đã chọn “${labels[rating.rating]}”. Lần ôn tiếp: ${escape(fmtDate(schedule.dueAt))}.${rating.early ? ' Bạn ôn sớm; lịch cũ được giữ nguyên.' : ''}</p>` : '<p class="la-small">Tự nhớ lại, đối chiếu rồi chọn một mức. Mỗi lượt chỉ đánh giá thẻ này một lần.</p>'}<div id="card-sources" class="s3-source"><details><summary>Nguồn: bài ${card.lessons.join(', ')} · ${card.sourceRecords.length} mục trong giáo trình</summary><ul>${card.sourceRecords.map(v => `<li>Bài ${v.lesson} · ${escape(sourceText(v.source))} · ${escape(v.vi)}${v.extension ? ' · từ mở rộng' : ''}${v.category==='proper_noun' ? ' · tên riêng' : ''}</li>`).join('')}</ul></details></div></div>`;
    }
    $('work-content').innerHTML = `<div class="s3-work-head"><div><h2>Lượt ôn từ đang làm</h2><p>Bài ${review.lessons.join(', ')} · ${reverse ? 'tiếng Việt → tiếng Trung' : 'tiếng Trung → tiếng Việt'}</p></div><div id="review-summary" class="s3-session-score" data-total="${sum.total}" data-rated="${sum.rated}">Đã tự đánh giá<br>${sum.rated} / ${sum.total} thẻ</div></div><article id="review-card" class="s3-card" data-sense-id="${escape(sid)}" data-direction="${review.direction}"><p class="s3-card-meta">Thẻ ${review.position+1} / ${review.senseIds.length} · Bài ${card.lessons.join(', ')}${card.extension ? ' · từ mở rộng' : ''}${card.category==='proper_noun' ? ' · tên riêng' : ''}</p><p class="s3-card-front" ${!reverse ? 'lang="zh-Hans"' : ''}>${escape(reverse ? card.vi : card.zh)}</p>${frontContext}<p class="la-small">${reverse ? 'Bạn nói hoặc viết từ tiếng Trung nào?' : 'Từ này có nghĩa gì trong bài đã học?'}</p>${!flipped ? '<button type="button" id="reveal-card" class="la-button">Lật thẻ để đối chiếu</button>' : ''}${back}${!card.audioRecordId ? '<p class="s3-source">Từ này nằm trong bảng số của bài 4 và chưa có đoạn đọc riêng. Bạn vẫn có thể nhớ lại và tự đánh giá.</p>' : (reverse && !flipped ? '<p class="s3-source">Âm thanh xuất hiện sau khi lật thẻ.</p>' : '')}</article><div class="s3-card-controls"><button type="button" id="card-prev" class="la-ghost" ${review.position===0 ? 'disabled' : ''}>← Thẻ trước</button><button type="button" id="card-next" class="la-button" ${!rating || (sum.done && review.position===review.senseIds.length-1) ? 'disabled' : ''}>Thẻ tiếp →</button></div>${sum.done ? '<section class="s3-complete"><h3>Đã ôn xong lượt này.</h3><p>Lần sau, chọn “Đến lượt ôn / từ mới” để xem các thẻ cần nhớ lại theo lịch.</p></section>' : ''}<details class="la-panel s3-source"><summary>Lịch ôn được tính thế nào?</summary><p>Chưa nhớ: 10 phút sau. Còn khó: 1 ngày sau. Đã nhớ: lần lượt 1, 3, 7, 14, 30 ngày khi thẻ mới hoặc đã đến hạn.</p><p>Ôn sớm và chọn “Đã nhớ” không đẩy lùi hạn ôn cũ. Đây là lịch cố định, dựa trên tự đánh giá của bạn.</p></details>`;
    player.setItem(audioAllowed ? {id:card.audioRecordId,label:`Âm thanh từ vựng · Bài ${card.lessons.join(', ')}`} : null);
    $('reveal-card')?.addEventListener('click', () => act(() => E.revealCard(state, sid, Date.now()), 'card-answer'));
    for (const button of $('work-content').querySelectorAll('[data-rating]')) button.addEventListener('click', () =>
      act(() => E.rateCard(state, C, button.dataset.rating, Date.now()), 'card-next'));
    $('card-prev').addEventListener('click', () => act(() => E.moveCard(state, review.position-1, Date.now()), 'work-content'));
    $('card-next').addEventListener('click', () => act(() => E.nextCard(state, Date.now()), 'work-content'));
  }
  function render() {
    renderPicker();
    if (state.preferences.module === 'listening') renderListening(); else renderVocabulary();
    emitState();
  }
  function preference(patch) {
    act(() => {
      const previous = state.preferences;
      E.setPreferences(state, patch, Date.now());
      if (!same(previous.lessons, state.preferences.lessons) || previous.module !== state.preferences.module) player.stop();
    });
  }
  $('module-listening').addEventListener('click', () => preference({module:'listening'}));
  $('module-vocabulary').addEventListener('click', () => preference({module:'vocabulary'}));
  $('lesson-checks').addEventListener('change', () => preference({lessons:[...$('lesson-checks').querySelectorAll('input:checked')].map(n => Number(n.dataset.lesson))}));
  $('select-all').addEventListener('click', () => preference({lessons:Array.from({length:15}, (_,i)=>i+1)}));
  $('clear-lessons').addEventListener('click', () => preference({lessons:[]}));
  $('listening-mode').addEventListener('change', () => preference({listeningMode:$('listening-mode').value}));
  $('vocab-filter').addEventListener('change', () => preference({vocabularyFilter:$('vocab-filter').value}));
  $('review-direction').addEventListener('change', () => preference({direction:$('review-direction').value}));
  $('shuffle-items').addEventListener('change', () => preference({shuffle:$('shuffle-items').checked}));
  $('start-listening').addEventListener('click', () => act(() => {
    player.stop(); keepPrevious(); notice('');
    E.createListeningSession(state, C, {lessons:state.preferences.lessons,mode:state.preferences.listeningMode,shuffle:state.preferences.shuffle}, Date.now());
  }, 'work-content'));
  $('start-review').addEventListener('click', () => act(() => {
    player.stop(); keepPrevious(); notice('');
    E.startReview(state, C, {lessons:state.preferences.lessons,filter:state.preferences.vocabularyFilter,
      direction:state.preferences.direction,shuffle:state.preferences.shuffle}, Date.now());
  }, 'work-content'));

  function download(raw, suffix) {
    const url = URL.createObjectURL(new Blob([raw], {type:'application/json;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url;
    a.download = 'HSK1-nghe-on-tu-' + suffix + '-' + new Date().toISOString().slice(0,19).replace(/[:T]/g,'-') + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportCurrent() {
    try { download(JSON.stringify(E.exportBackup(state, C), null, 2), 'tien-do'); notice('Đã tạo tệp bản sao của tiến độ đang mở.'); }
    catch (error) { notice(error.message, true); }
  }
  function inspect(raw, label) {
    backupReadVersion++;
    pendingBackup = null;
    try {
      const candidate = parseBackup(raw), ls = E.listeningSummary(candidate, C).overall;
      const cs = E.cardSummary(candidate, C, Date.now());
      let expectedRaw = lastRaw;
      try { expectedRaw = readStorage(); } catch (_) { /* Memory-only import remains available. */ }
      pendingBackup = {candidate, expectedRaw, expectedMutation: mutationVersion};
      $('backup-result').innerHTML = `<div class="s3-notice"><strong>${escape(label)} · Hợp lệ</strong><p>Đã nộp ${ls.answered}/${ls.total} câu nghe · đúng lần đầu ${ls.firstCorrect}/${ls.answered}, gần nhất ${ls.latestCorrect}/${ls.answered}.</p><p>Đã tự đánh giá ${cs.rated} thẻ nghĩa. Lượt đang làm và thứ tự sẽ được mở lại; âm thanh chỉ phát khi bạn nhấn phát.</p><p>Mở bản này sẽ thay tiến độ đang hiển thị. Bản trước được giữ để khôi phục.</p><button type="button" class="la-button" id="apply-backup">Mở bản đã kiểm tra</button></div>`;
      $('apply-backup').addEventListener('click', applyBackup);
    } catch (error) {
      $('backup-result').innerHTML = `<p class="s3-notice s3-warning">${escape(error.message)} Bản đang làm chưa bị thay đổi.</p>`;
    }
    $('backup-details').open = true;
  }
  function applyBackup() {
    if (!pendingBackup) return;
    try {
      if (pendingBackup.expectedMutation !== mutationVersion) {
        pendingBackup = null;
        $('backup-result').textContent = 'Tiến độ trong tab này đã thay đổi từ lúc kiểm tra. Hãy kiểm tra bản muốn mở một lần nữa; bài đang làm vẫn được giữ.';
        return;
      }
      let current = pendingBackup.expectedRaw;
      try { current = readStorage(); } catch (_) { /* Cannot compare an unavailable store. */ }
      if (current !== pendingBackup.expectedRaw) {
        pendingBackup = null; $('backup-result').textContent = 'Tiến độ lại thay đổi ở tab khác. Hãy kiểm tra bản muốn mở một lần nữa.';
        storageBlocked = true; storageNotice('Có cập nhật mới từ tab khác. Chưa thay thế tiến độ.', true); return;
      }
      const candidate = pendingBackup.candidate;
      player.stop(); keepPrevious(); state = candidate; mutationVersion++; backupReadVersion++;
      lastRaw = current; storageBlocked = false; pendingBackup = null;
      player.setRate(state.preferences.rate); save(); render();
      $('backup-input').value = ''; $('backup-file').value = '';
      $('backup-result').textContent = 'Đã mở bản vừa kiểm tra. Có thể khôi phục bản trước bằng nút ở trên.' +
        (previousInMemoryOnly ? ' Bản trước chỉ còn trong tab này; hãy khôi phục và tải tệp nếu cần giữ.' : '') +
        (corruptRaw !== null ? ' Dữ liệu gốc chưa mở được vẫn có thể tải bằng nút ở trên trong tab này.' : '');
      notice('Đã mở lại tiến độ. Nhấn phát nếu bạn muốn nghe.');
    } catch (error) { notice(error.message, true); }
  }
  $('export-backup').addEventListener('click', exportCurrent);
  $('export-conflict').addEventListener('click', exportCurrent);
  $('export-raw').addEventListener('click', () => { if (corruptRaw !== null) download(corruptRaw, 'du-lieu-goc'); });
  $('backup-input').addEventListener('input', () => {
    backupReadVersion++; pendingBackup = null; $('backup-file').value = ''; $('backup-result').textContent = '';
  });
  $('inspect-backup').addEventListener('click', () => inspect($('backup-input').value, 'Bản vừa dán'));
  $('backup-file').addEventListener('change', async () => {
    const token = ++backupReadVersion, file = $('backup-file').files[0];
    pendingBackup = null; $('backup-input').value = ''; $('backup-result').textContent = '';
    if (!file) return;
    if (file.size > E.MAX_BACKUP_BYTES) { $('backup-result').textContent = 'Tệp vượt quá 4 MiB. Bản đang làm được giữ.'; return; }
    $('backup-result').textContent = 'Đang đọc tệp bản sao…';
    try {
      const raw = await file.text();
      if (token !== backupReadVersion || $('backup-file').files[0] !== file) return;
      inspect(raw, file.name);
    } catch (_) {
      if (token === backupReadVersion) $('backup-result').textContent = 'Không đọc được tệp. Hãy thử lại.';
    }
  });
  $('restore-previous').addEventListener('click', () => { if (previousRaw) inspect(previousRaw, 'Bản trước'); });
  $('inspect-latest').addEventListener('click', () => {
    try {
      const raw = readStorage();
      if (raw === null) { notice('Tab khác đã xóa bản lưu. Bản đang làm vẫn còn; hãy tải bản sao trước.', true); return; }
      inspect(raw, 'Bản ở tab khác');
    } catch (error) { notice(error.message, true); }
  });
  window.addEventListener('storage', event => {
    if (event.key !== E.KEY && event.key !== null) return;
    let changed;
    try { changed = readStorage() !== lastRaw; }
    catch (_) { storageAvailable = false; storageNotice('Chưa đọc được bản lưu trên trình duyệt. Bài trong tab vẫn còn; hãy tải bản sao.'); return; }
    if (changed) {
      storageBlocked = true;
      storageNotice('Tiến độ đã thay đổi ở tab khác. Trang này tạm dừng ghi đè để giữ cả hai bản.', true);
      $('save-status').textContent = 'Có bản ở tab khác · bản đang làm vẫn còn.';
    }
  });
  window.addEventListener('beforeunload', event => {
    if (((!storageAvailable || storageBlocked) && state.updatedAt !== null) || previousInMemoryOnly) { event.preventDefault(); event.returnValue = ''; }
  });
  if (entryChanged && !storageBlocked && storageAvailable) save();
  render();
  if (!storageMessage) $('save-status').textContent = lastRaw ? 'Đã mở tiến độ đã lưu · âm thanh đang dừng.' : 'Tiến độ sẽ được lưu sau thao tác đầu tiên.';
})();
