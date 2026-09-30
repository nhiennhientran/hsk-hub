/* Mixed vocabulary practice. Ratings are self-assessments, not test scores. */
(function () {
  'use strict';
  const DAY = 86400000;
  const INTERVALS = [1, 3, 7, 14];
  const SENSES = {
    '7:在': ['location', 'ở; có mặt tại một nơi', '我在家里呢。'],
    '8:在': ['place-of-action', 'ở; tại (nơi diễn ra hành động)', '能到。我在学校吃午饭。'],
    '11:在': ['ongoing', 'đang (hành động đang diễn ra)', '你还在读大学吗？'],
    '12:了': ['new-situation', 'trợ từ cuối câu: tình huống mới hoặc sự thay đổi', '这里的天不太好，下雨了。'],
    '14:了': ['completed-action', 'trợ từ sau động từ: hành động đã xảy ra hoặc hoàn thành', '我看了一个电影。'],
    '4:呢': ['follow-up-question', 'trợ từ dùng để hỏi tiếp: còn… thì sao?'],
    '7:呢': ['confirmation', 'trợ từ nhấn mạnh hoặc xác nhận tình huống đang nói đến'],
    '5:号': ['date', 'ngày (trong cách nói ngày tháng)'],
    '6:号': ['number', 'số (trong số điện thoại)'],
    '3:对': ['correct', 'đúng'],
    '11:对': ['towards', 'với; đối với (chỉ đối tượng của lời nói)']
  };
  const plain = s => String(s || '').normalize('NFKC').trim().toLocaleLowerCase();
  const searchText = s => plain(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const compact = s => plain(s).replace(/\s+/g, '');
  function findAudio(segments, lesson, word) {
    if ((segments.unsupported?.[lesson] || []).includes(word)) return null;
    const direct = segments.vocabByLesson?.[lesson]?.[word];
    if (direct && direct.track && Number.isFinite(direct.start) && Number.isFinite(direct.end)) return direct;
    for (const [track, list] of Object.entries(segments.vocab || {})) {
      if (Number(track.split('-')[0]) !== lesson || !Array.isArray(list)) continue;
      const hit = list.find(x => x[0] === word);
      if (hit && Number.isFinite(hit[1]) && Number.isFinite(hit[2]) && hit[2] > hit[1]) return { track, start: hit[1], end: hit[2] };
    }
    const reuse = segments.crossLessonReuse?.[lesson]?.[word];
    return Array.isArray(reuse) ? { track: reuse[0], start: reuse[1], end: reuse[2] } : null;
  }
  function collect(data, segments) {
    const all = new Map();
    for (const lesson of data) {
      for (const source of lesson.vocab || []) {
        if (!source.zh || !source.vn) continue;
        const sense = SENSES[lesson.id + ':' + source.zh];
        const meaning = sense ? sense[1] : source.vn;
        const key = JSON.stringify([compact(source.zh), compact(source.py), sense ? sense[0] : plain(meaning)]);
        let item = all.get(key);
        if (!item) {
          item = { key, zh: source.zh, py: source.py || '', vn: meaning, lessons: [], sources: [], kind: source.kind || 'core' };
          all.set(key, item);
        }
        const lines = (lesson.scenes || []).flatMap(x => x.lines || []);
        const example = (sense?.[2] ? lines.find(x => x.zh === sense[2]) : null) || lines.find(x => x.zh.includes(source.zh));
        item.lessons.push(lesson.id);
        item.sources.push({ lesson: lesson.id, audio: findAudio(segments, lesson.id, source.zh), example: example || null });
      }
    }
    return all;
  }
  function render(app) {
    const esc = app.esc;
    if (!app.state.words || typeof app.state.words !== 'object' || Array.isArray(app.state.words)) app.state.words = {};
    if (!app.state.preferences || typeof app.state.preferences !== 'object' || Array.isArray(app.state.preferences)) app.state.preferences = {};
    const stored = app.state.preferences.vocab;
    const raw = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
    const data = Array.isArray(app.data) ? app.data : [];
    const ids = data.map(x => Number(x.id));
    const pref = app.state.preferences.vocab = {
      lessons: Array.isArray(raw.lessons) ? [...new Set(raw.lessons.map(Number).filter(x => ids.includes(x)))] : [1],
      direction: raw.direction === 'vn-zh' ? 'vn-zh' : 'zh-vn',
      pinyin: raw.pinyin !== false,
      filter: ['all', 'new', 'wrong', 'due'].includes(raw.filter) ? raw.filter : 'all',
      search: String(raw.search || '').slice(0, 120),
      session: raw.session && typeof raw.session === 'object' && !Array.isArray(raw.session) ? raw.session : null
    };
    const all = collect(data, app.segments || {});
    let session = pref.session;
    if (session && (!Array.isArray(session.queue) || !Number.isInteger(session.index) || session.index < 0 || session.index > session.queue.length || session.queue.some(x => !all.has(x)))) session = pref.session = null;
    if (session) {
      session.direction = session.direction === 'vn-zh' ? 'vn-zh' : 'zh-vn';
      session.lessons = Array.isArray(session.lessons) ? session.lessons.map(Number).filter(x => ids.includes(x)) : [...pref.lessons];
      session.retries = Array.isArray(session.retries) ? session.retries.filter(x => all.has(x)) : [];
      session.remembered = Number.isInteger(session.remembered) ? Math.max(0, Math.min(session.index, session.remembered)) : 0;
      session.revealed = !!session.revealed;
    }
    const getRecord = key => { const rec = app.state.words[key]; return rec && typeof rec === 'object' && !Array.isArray(rec) ? rec : {}; };
    const relevant = () => [...all.values()].filter(x => x.lessons.some(id => pref.lessons.includes(id)));
    const due = rec => Number.isFinite(rec.due) && rec.due <= Date.now();
    const candidates = () => relevant().filter(item => {
      const rec = getRecord(item.key);
      const filterOK = pref.filter === 'all' || (pref.filter === 'new' && rec.lastRating !== 'known') || (pref.filter === 'wrong' && rec.lastRating === 'again') || (pref.filter === 'due' && due(rec));
      const query = searchText(pref.search);
      const haystack = searchText(item.zh + ' ' + item.py + ' ' + compact(item.py) + ' ' + item.vn);
      return filterOK && (!query || haystack.includes(query));
    });
    const save = () => { pref.session = session; app.save(); };
    const button = (action, label, cls = '', attrs = '') => `<button type="button" class="lv-button ${cls}" data-lv-action="${action}" ${attrs}>${label}</button>`;
    const displayDate = ms => new Date(ms).toLocaleDateString('vi-VN');
    const activeSource = item => item.sources.find(x => (session?.lessons || pref.lessons).includes(x.lesson)) || item.sources[0];
    function summary() {
      const selected = relevant(), count = candidates().length;
      const target = app.main.querySelector('[data-testid="vocab-count"]');
      if (target) target.textContent = `${count} thẻ phù hợp · ${selected.length} mục từ/cách dùng trong ${pref.lessons.length} bài`;
      const start = app.main.querySelector('[data-testid="vocab-start"]');
      if (start) { start.disabled = !count; start.textContent = `${session ? 'Tạo lượt mới' : 'Bắt đầu ôn'} · ${count} thẻ`; }
      const counts = app.main.querySelector('[data-lv-counts]');
      if (counts) counts.innerHTML = `<span><b>${selected.filter(x => !getRecord(x.key).lastRating).length}</b> chưa ôn</span><span><b>${selected.filter(x => getRecord(x.key).lastRating === 'again').length}</b> cần ôn lại</span><span><b>${selected.filter(x => due(getRecord(x.key))).length}</b> đến hạn</span>`;
    }
    function draw(focusSelector) {
      const complete = session && session.index >= session.queue.length;
      app.main.innerHTML = `<section class="lv-shell" aria-labelledby="lv-heading">
        <header class="lv-heading"><div><p class="lv-eyebrow">TỪNG TỪ MỘT · MỖI NGÀY MỘT CHÚT</p><h1 id="lv-heading">Gom bài, nhớ từ</h1><p>Chọn những bài bạn muốn ôn. Thử nhớ trước khi lật thẻ, rồi tự đánh giá thật thoải mái.</p></div><span class="lv-heading-mark" aria-hidden="true">温故<br><small>Ôn lại để nhớ lâu</small></span></header>
        <div class="lv-layout"><aside class="lv-panel" aria-label="Chọn nội dung ôn tập">
          <fieldset class="lv-fieldset"><legend>1. Chọn bài học</legend><div class="lv-quick">${button('all', 'Chọn tất cả')}${button('none', 'Bỏ chọn')}</div>
          <div class="lv-lessons">${data.map(x => `<label class="lv-lesson"><input type="checkbox" data-lv-lesson="${x.id}" data-testid="vocab-lesson-${x.id}" ${pref.lessons.includes(Number(x.id)) ? 'checked' : ''}><span title="${esc(x.title)}">Bài ${x.id}</span></label>`).join('')}</div>
          <div class="lv-ranges" aria-label="Chọn nhóm ba bài">${[1, 4, 7, 10, 13].map(x => button('range', `${x}–${x + 2}`, '', `data-lv-range="${x}" aria-label="Chọn bài ${x} đến ${x + 2}"`)).join('')}</div></fieldset>
          <div class="lv-form-row"><label for="lv-direction">2. Hướng ôn tập</label><select id="lv-direction" data-testid="vocab-direction"><option value="zh-vn" ${pref.direction === 'zh-vn' ? 'selected' : ''}>Tiếng Trung → Tiếng Việt</option><option value="vn-zh" ${pref.direction === 'vn-zh' ? 'selected' : ''}>Tiếng Việt → Tiếng Trung</option></select></div>
          <div class="lv-form-row"><label for="lv-filter">3. Chọn nhóm từ</label><select id="lv-filter" data-testid="vocab-filter"><option value="all" ${pref.filter === 'all' ? 'selected' : ''}>Tất cả</option><option value="new" ${pref.filter === 'new' ? 'selected' : ''}>Chưa vững / chưa ôn</option><option value="wrong" ${pref.filter === 'wrong' ? 'selected' : ''}>Cần ôn lại (lần gần nhất)</option><option value="due" ${pref.filter === 'due' ? 'selected' : ''}>Đến hạn ôn</option></select></div>
          <div class="lv-form-row"><label for="lv-search">Tìm từ</label><input id="lv-search" data-testid="vocab-search" type="search" maxlength="120" value="${esc(pref.search)}" placeholder="汉字, pinyin, nghĩa tiếng Việt" autocomplete="off"></div>
          <label class="lv-pinyin-setting"><input id="lv-pinyin" data-testid="vocab-pinyin" type="checkbox" ${pref.pinyin ? 'checked' : ''}> Hiện pinyin khi xem tiếng Trung</label>
          <p class="lv-count" data-testid="vocab-count" aria-live="polite"></p><div class="lv-counts" data-lv-counts></div>
          ${button('start', 'Bắt đầu ôn', 'lv-primary lv-start', 'data-testid="vocab-start"')}
          <p class="lv-small">Thẻ cần ôn lại được ưu tiên. Đổi bộ lọc không làm mất lượt đang học; chọn “Tạo lượt mới” để áp dụng.</p>
        </aside><div class="lv-workspace">${session ? complete ? completeMarkup() : cardMarkup() : emptyMarkup()}
          <details class="lv-help"><summary>Lịch ôn và cách lưu kết quả</summary><p>“Đã nhớ” là tự đánh giá của bạn, không phải điểm bài kiểm tra. Hãy thử nói nghĩa hoặc từ cần nhớ trước khi mở đáp án.</p><p>Nếu nhớ được, lịch nhắc tiếp theo lần lượt là 1, 3, 7 rồi 14 ngày; những lần sau tiếp tục cách 14 ngày. Nếu chưa nhớ, thẻ trở về nhóm cần ôn lại và đến hạn ngay. Đây là lịch khởi đầu để thực hành, có thể điều chỉnh theo tốc độ học của bạn.</p><p>Kết quả lưu trên trình duyệt này, riêng với dấu sao ở trang từ vựng cũ. Các cách dùng khác nhau của 在, 了… được giữ thành thẻ riêng. Thẻ giống nhau giữ đầy đủ bài nguồn.</p></details>
        </div></div></section>`;
      bind(); summary();
      if (focusSelector) app.main.querySelector(focusSelector)?.focus({ preventScroll: true });
    }
    function emptyMarkup() {
      return `<section class="lv-empty"><div class="lv-empty-symbol" aria-hidden="true">学</div><h2>Một bộ thẻ, những bài bạn chọn</h2><p>Bắt đầu với một bài, hoặc ghép vài bài để ôn xen kẽ. Chọn nội dung bên cạnh, rồi nhấn “Bắt đầu ôn”.</p><ol><li>Nhìn thẻ và tự nhớ đáp án.</li><li>Lật thẻ để kiểm tra nghĩa và ví dụ.</li><li>Chọn “Cần ôn lại” hoặc “Đã nhớ”.</li></ol><p class="lv-small">Nếu không có thẻ phù hợp, hãy đổi nhóm từ, xóa tìm kiếm hoặc chọn thêm bài.</p></section>`;
    }
    function cardMarkup() {
      const item = all.get(session.queue[session.index]);
      if (!item) return emptyMarkup();
      const source = activeSource(item);
      const audio = source.audio;
      const revealed = !!session.revealed;
      const reverse = session.direction === 'vn-zh';
      const rec = getRecord(item.key);
      const front = reverse ? `<div class="lv-word lv-word-vn" lang="vi">${esc(item.vn)}</div>` : `<div class="lv-word" lang="zh-CN">${esc(item.zh)}</div>${pref.pinyin ? `<div class="lv-pinyin" lang="zh-Latn">${esc(item.py)}</div>` : ''}`;
      return `<section class="lv-study" aria-label="Thẻ đang ôn"><div class="lv-study-head"><span data-testid="vocab-position">Thẻ ${session.index + 1} / ${session.queue.length}</span><span class="lv-source">Bài ${item.lessons.join(', ')}</span></div><div class="lv-progress" role="progressbar" aria-label="Số thẻ đã tự đánh giá" aria-valuenow="${session.index}" aria-valuemin="0" aria-valuemax="${session.queue.length}"><i style="width:${100 * session.index / session.queue.length}%"></i></div>
        <article class="lv-card" data-testid="vocab-card"><span class="lv-card-label">${reverse ? 'NHỚ CÁCH NÓI BẰNG TIẾNG TRUNG' : 'BẠN CÒN NHỚ NGHĨA CỦA TỪ NÀY?'}</span>${front}
        ${!reverse || revealed ? `<div class="lv-audio-row">${button('audio', '▶ Nghe từ', 'lv-audio', `data-testid="vocab-audio" ${!audio ? 'disabled' : ''}`)}${!audio ? '<span class="lv-small">Chưa có đoạn âm thanh riêng cho từ này trong bản ghi giáo trình.</span>' : ''}</div>` : '<p class="lv-recall-note">Thử nói từ tiếng Trung trước khi xem đáp án.</p>'}
        ${revealed ? `<div class="lv-answer" data-testid="vocab-answer"><span class="lv-card-label">ĐỐI CHIẾU ĐÁP ÁN</span>${reverse ? `<div class="lv-answer-zh" lang="zh-CN">${esc(item.zh)}</div>${pref.pinyin ? `<div class="lv-pinyin" lang="zh-Latn">${esc(item.py)}</div>` : ''}` : `<div class="lv-meaning" lang="vi">${esc(item.vn)}</div>`}
          ${source.example ? `<div class="lv-example"><span class="lv-card-label">TRONG BÀI ${source.lesson}</span><p lang="zh-CN">${esc(source.example.zh)}</p>${pref.pinyin && source.example.py ? `<p class="lv-example-py" lang="zh-Latn">${esc(source.example.py)}</p>` : ''}<p lang="vi">${esc(source.example.vn || '')}</p></div>` : ''}
          <div class="lv-source-links">${item.lessons.map(id => `<a href="lesson.html?id=${id}&amp;sec=text">Xem bài khóa ${id} ↗</a>`).join('')}</div></div>` : button('reveal', 'Lật thẻ · Xem đáp án', 'lv-primary lv-reveal', 'data-testid="vocab-reveal"')}
        </article><div class="lv-rating"><p>${revealed ? 'Bạn vừa nhớ được từ này chứ?' : 'Lật thẻ trước khi tự đánh giá.'}</p><div>${button('again', '↻ Cần ôn lại', 'lv-again', `data-testid="vocab-again" ${!revealed ? 'disabled' : ''}`)}${button('known', '✓ Đã nhớ', 'lv-known', `data-testid="vocab-known" ${!revealed ? 'disabled' : ''}`)}</div></div>
        <p class="lv-small lv-session-note">${rec.lastRating ? `Lần gần nhất: ${rec.lastRating === 'known' ? 'tự đánh giá đã nhớ' : 'cần ôn lại'}. ${rec.due ? `Lịch ôn: ${displayDate(rec.due)}.` : ''}` : 'Thẻ này chưa có lượt tự đánh giá.'} Tiến độ tự động lưu sau mỗi lựa chọn.</p>
      </section>`;
    }
    function completeMarkup() {
      const retryCount = [...new Set(session.retries)].length;
      return `<section class="lv-complete" data-testid="vocab-complete" tabindex="-1"><span class="lv-complete-mark" aria-hidden="true">✓</span><p class="lv-eyebrow">BẠN ĐÃ HOÀN THÀNH LƯỢT ÔN</p><h2>${session.queue.length} thẻ đã xem lại</h2><p>Đây là kết quả bạn tự đánh giá, không phải điểm kiểm tra.</p><div class="lv-result-grid"><div><strong>${session.remembered}</strong><span>đã nhớ</span></div><div><strong>${retryCount}</strong><span>cần ôn lại</span></div></div><div class="lv-complete-actions">${retryCount ? button('retry', `Ôn lại ${retryCount} thẻ chưa nhớ`, 'lv-primary', 'data-testid="vocab-retry"') : '<p class="lv-next-day">Các từ đã nhớ sẽ xuất hiện khi đến hạn ôn. Bạn vẫn có thể ôn lại bất cứ lúc nào.</p>'}${button('finish', 'Chọn bộ thẻ khác', '')}</div></section>`;
    }
    function start(keys) {
      const items = keys ? keys.map(key => all.get(key)).filter(Boolean) : candidates();
      if (!items.length) { app.toast('Chưa có thẻ phù hợp. Hãy chọn bài hoặc đổi bộ lọc.'); return; }
      if (!keys) {
        for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
        const priority = item => { const rec = getRecord(item.key); return rec.lastRating === 'again' ? 0 : due(rec) ? 1 : !rec.lastRating ? 2 : 3; };
        items.sort((a, b) => priority(a) - priority(b));
      }
      app.stopAudio();
      session = { queue: items.map(x => x.key), index: 0, direction: pref.direction, lessons: [...pref.lessons], revealed: false, remembered: 0, retries: [], started: Date.now() };
      save(); draw('[data-testid="vocab-reveal"]'); scrollToStudy();
    }
    function scrollToStudy() {
      if (window.matchMedia('(max-width: 720px)').matches) {
        app.main.querySelector('.lv-workspace')?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    }
    function rate(known) {
      if (!session || !session.revealed || session.index >= session.queue.length) return;
      const key = session.queue[session.index], old = getRecord(key);
      const level = Number.isInteger(old.level) ? Math.max(0, Math.min(4, old.level)) : 0;
      const now = Date.now(), interval = known ? INTERVALS[Math.min(level, INTERVALS.length - 1)] : 0;
      app.state.words[key] = { ...old, zh: all.get(key).zh, lastRating: known ? 'known' : 'again', level: known ? Math.min(level + 1, 4) : 0, due: now + interval * DAY, reviewedAt: now, reviews: (Number(old.reviews) || 0) + 1, lapses: (Number(old.lapses) || 0) + (known ? 0 : 1), source: 'self-assessment' };
      if (known) session.remembered++; else session.retries.push(key);
      session.index++; session.revealed = false;
      app.stopAudio(); save(); draw(session.index < session.queue.length ? '[data-testid="vocab-reveal"]' : '[data-testid="vocab-complete"]'); scrollToStudy();
    }
    function updateSelection(selected) {
      pref.lessons = selected; save();
      app.main.querySelectorAll('[data-lv-lesson]').forEach(el => { el.checked = pref.lessons.includes(Number(el.dataset.lvLesson)); });
      summary();
    }
    function bind() {
      app.main.querySelectorAll('[data-lv-lesson]').forEach(input => input.addEventListener('change', () => updateSelection([...app.main.querySelectorAll('[data-lv-lesson]:checked')].map(x => Number(x.dataset.lvLesson)))));
      app.main.querySelector('#lv-direction').addEventListener('change', event => { pref.direction = event.target.value; save(); });
      app.main.querySelector('#lv-filter').addEventListener('change', event => { pref.filter = event.target.value; save(); summary(); });
      app.main.querySelector('#lv-search').addEventListener('input', event => { pref.search = event.target.value; save(); summary(); });
      app.main.querySelector('#lv-pinyin').addEventListener('change', event => { pref.pinyin = event.target.checked; save(); draw('#lv-pinyin'); });
      app.main.querySelectorAll('[data-lv-action]').forEach(el => el.addEventListener('click', async () => {
        if (el.disabled) return;
        const action = el.dataset.lvAction;
        if (action === 'all') updateSelection([...ids]);
        else if (action === 'none') updateSelection([]);
        else if (action === 'range') { const from = Number(el.dataset.lvRange); updateSelection(ids.filter(id => id >= from && id < from + 3)); }
        else if (action === 'start') start();
        else if (action === 'reveal' && session) { session.revealed = true; save(); draw('[data-testid="vocab-known"]'); }
        else if (action === 'known') rate(true);
        else if (action === 'again') rate(false);
        else if (action === 'retry') start([...new Set(session.retries)]);
        else if (action === 'finish') { app.stopAudio(); session = null; save(); draw('[data-testid="vocab-start"]'); }
        else if (action === 'audio' && session) {
          const item = all.get(session.queue[session.index]);
          const clip = item && activeSource(item).audio;
          if (clip) {
            try { await app.playRange(clip.track, clip.start, clip.end, item.zh); }
            catch (_error) { app.toast('Chưa phát được âm thanh. Hãy kiểm tra kết nối rồi thử lại.'); }
          }
        }
      }));
    }
    draw();
  }
  window.HSKLearnVocab = { render };
})();
