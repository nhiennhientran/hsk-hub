import type { ModuleContext, MountHandle } from '../../app/contracts.ts';
import { routeHref } from '../../app/router.ts';
import { loadVocabulary } from '../../services/content/vocabulary.ts';
import { createVocabularyController } from '../../domain/vocabulary/controller.ts';
import './vocabulary.css';
import { createDueRefresh } from '../due-refresh.ts';

function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag); if (text !== undefined) result.textContent = text; return result;
}
function button(id: string, text: string): HTMLButtonElement {
  const result = node('button', text); result.id = `vocabulary-${id}`; result.type = 'button'; return result;
}
const filters = { all: 'Tất cả từ', unfamiliar: 'Chưa thuộc', wrong: 'Cần luyện lại', due: 'Đến hạn và từ mới' };
const ratings = { again: 'Chưa nhớ', hard: 'Khó nhớ', good: 'Đã nhớ' };

/** Vocabulary and due review are two entrances to one saved sense-based round. */
export function mountVocabulary(host: HTMLElement, context: ModuleContext, feature: 'vocabulary' | 'review'): MountHandle {
  const article = node('article'); article.id = 'vocabulary-module'; article.className = 'module-entry vocabulary';
  const title = node('h1', feature === 'review' ? 'Ôn tập từ vựng' : 'Từ vựng nhiều bài'); title.tabIndex = -1;
  const controls = node('fieldset'); controls.dataset.moduleControls = ''; controls.disabled = true;
  controls.append(node('legend', 'Luyện từ theo nghĩa'));
  article.append(title, node('p', 'Bạn có thể tự do chuyển thẻ hoặc bỏ qua. Tự đánh giá là tùy chọn, chỉ dùng để xếp lịch ôn, không phải điểm đúng/sai.'), controls); host.append(article);
  const lifetime = new AbortController(); const abort = () => lifetime.abort();
  context.signal.addEventListener('abort', abort, { once: true }); if (context.signal.aborted) abort();
  let left = false, unsubscribe = () => {}, unsubscribeAudio = () => {}, flush = () => {};
  let playback: AbortController | undefined, cardEvents: AbortController | undefined;
  let dueRefresh: ReturnType<typeof createDueRefresh> | undefined;
  const stop = () => { playback?.abort(); playback = undefined; };
  const ready = Promise.resolve().then(async () => {
    if (!context.learning || !context.audio) throw new Error('Learning services unavailable.');
    const [content, session, audio] = await Promise.all([loadVocabulary(lifetime.signal), context.learning(), context.audio()]);
    if (left || lifetime.signal.aborted) return;
    const controller = createVocabularyController({ session, catalog: content.catalog });
    controller.visit(context.route.lesson, feature); flush = () => { void session.flush(); };
    const settings = node('section'); settings.className = 'vocabulary-panel'; settings.id = 'vocabulary-settings';
    settings.append(node('h2', 'Chọn phạm vi cho lượt mới'));
    const lessons = node('fieldset'); lessons.append(node('legend', 'Chọn một hoặc nhiều bài'));
    const grid = node('div'); grid.className = 'vocabulary-lessons';
    const inputs = new Map<number, HTMLInputElement>();
    for (const lesson of content.lessons) {
      const label = node('label'); const input = node('input'); input.type = 'checkbox'; input.dataset.vocabularyLesson = String(lesson.id);
      input.id = `vocabulary-lesson-${lesson.id}`; label.append(input, document.createTextNode(` Bài ${lesson.id}`)); grid.append(label); inputs.set(lesson.id, input);
    }
    const all = button('all', 'Chọn tất cả'), none = button('none', 'Bỏ chọn tất cả');
    const actions = node('div'); actions.className = 'vocabulary-actions'; actions.append(all, none); lessons.append(grid, actions);
    const filterLabel = node('label', 'Bộ lọc '), filter = node('select'); filter.id = 'vocabulary-filter';
    for (const [value, text] of Object.entries(filters)) { const option = node('option', text); option.value = value; filter.append(option); } filterLabel.append(filter);
    const directionLabel = node('label', 'Hướng nhớ lại '), direction = node('select'); direction.id = 'vocabulary-direction';
    for (const [value, text] of [['zh-vi', 'Trung → Việt'], ['vi-zh', 'Việt → Trung']]) { const option = node('option', text); option.value = value; direction.append(option); } directionLabel.append(direction);
    const shuffleLabel = node('label'), shuffle = node('input'); shuffle.type = 'checkbox'; shuffle.id = 'vocabulary-shuffle'; shuffleLabel.append(shuffle, document.createTextNode(' Trộn thứ tự'));
    const options = node('div'); options.className = 'vocabulary-options'; options.append(filterLabel, directionLabel, shuffleLabel);
    const available = node('p'); available.id = 'vocabulary-available'; available.setAttribute('role', 'status');
    const start = button('start', 'Bắt đầu lượt mới'), due = button('due', 'Ôn từ đến hạn và từ mới'), resume = button('resume', 'Tiếp tục lượt đã lưu');
    const rounds = node('div'); rounds.className = 'vocabulary-actions'; rounds.append(start, due, resume);
    settings.append(lessons, options, available, rounds, node('p', 'Bắt đầu lượt mới sẽ thay lượt đang học, vẫn giữ mọi tự đánh giá và lịch ôn. Đổi lựa chọn chưa thay lượt đã lưu.'));
    const save = node('p'); save.id = 'vocabulary-save-status'; save.setAttribute('role', 'status');
    const retry = button('retry-save', 'Thử lưu lại'); const backups = node('a', 'Quản lý dữ liệu và bản sao lưu');
    backups.href = routeHref({ feature: 'progress', lesson: context.route.lesson }); backups.dataset.routeLink = '';
    const saveActions = node('div'); saveActions.className = 'vocabulary-actions'; saveActions.append(retry, backups);
    const message = node('p'); message.id = 'vocabulary-message'; message.setAttribute('role', 'status');
    const exercise = node('section'); exercise.id = 'vocabulary-exercise';
    const position = node('p'); position.id = 'vocabulary-position';
    const scope = node('p'); scope.id = 'vocabulary-queue-scope';
    const pinyinLabel = node('label'), pinyin = node('input'); pinyin.type = 'checkbox'; pinyin.id = 'vocabulary-pinyin';
    pinyinLabel.append(pinyin, document.createTextNode(' Hiện pinyin (Việt → Trung: sau khi xem đáp án)'));
    const cardHost = node('div');
    const previous = button('prev', '← Thẻ trước'), next = button('next', 'Thẻ tiếp →'), skip = button('skip', 'Bỏ qua thẻ này');
    const journey = node('nav'); journey.className = 'vocabulary-actions'; journey.setAttribute('aria-label', 'Di chuyển trong lượt từ vựng'); journey.append(previous, next, skip);
    const skipNote = node('p', 'Bỏ qua chỉ chuyển sang thẻ tiếp, không tính là đã nhớ hoặc đã tự đánh giá, không đổi lịch ôn. Bạn vẫn có thể quay lại thẻ đã bỏ qua.');
    const audioPanel = node('section'); audioPanel.className = 'vocabulary-panel';
    const audioStatus = node('p'); audioStatus.id = 'vocabulary-audio-status'; audioStatus.setAttribute('role', 'status');
    const play = button('play', 'Nghe từ'), pause = button('pause', 'Tạm dừng'), replay = button('replay', 'Nghe lại');
    const audioActions = node('div'); audioActions.className = 'vocabulary-actions'; audioActions.append(play, pause, replay); audioPanel.append(audioStatus, audioActions);
    exercise.append(position, scope, pinyinLabel, cardHost, audioPanel, journey, skipNote);
    const summary = node('section'); summary.className = 'vocabulary-panel'; summary.id = 'vocabulary-summary';
    controls.append(settings, save, saveActions, message, exercise, summary);
    let key = '', rendered = '';
    const handle = (result: { ok: boolean; message?: string }) => { message.textContent = result.ok ? '' : result.message ?? 'Chưa thực hiện được thao tác.'; return result.ok; };
    const focusCard = () => cardHost.querySelector<HTMLElement>('h2')?.focus();
    const on = (target: HTMLElement, event: string, action: () => void) => target.addEventListener(event, action, { signal: lifetime.signal });
    const preferences = (patch: Parameters<typeof controller.setPreferences>[0]) => { stop(); handle(controller.setPreferences(patch)); update(); };
    for (const input of inputs.values()) on(input, 'change', () => preferences({ lessons: [...inputs].filter(([, value]) => value.checked).map(([id]) => id) }));
    on(all, 'click', () => preferences({ lessons: content.lessons.map(lesson => lesson.id) }));
    on(none, 'click', () => preferences({ lessons: [] }));
    on(filter, 'change', () => preferences({ vocabularyFilter: filter.value as keyof typeof filters }));
    on(direction, 'change', () => preferences({ direction: direction.value as 'zh-vi' | 'vi-zh' }));
    on(shuffle, 'change', () => preferences({ shuffle: shuffle.checked }));
    on(start, 'click', () => { stop(); if (handle(controller.start())) { update(); focusCard(); } });
    on(due, 'click', () => { stop(); if (handle(controller.start('due'))) { update(); focusCard(); } });
    on(resume, 'click', focusCard);
    on(previous, 'click', () => { const review = controller.read().review; if (review && handle(controller.move(review.position - 1))) { update(); focusCard(); } });
    const advance = () => { if (handle(controller.next())) { update(); focusCard(); } };
    on(next, 'click', advance); on(skip, 'click', advance);
    on(pinyin, 'change', () => { rendered = ''; update(); });
    on(retry, 'click', () => { void session.flush(); });
    function updateAudio(): void {
      if (left || lifetime.signal.aborted) return;
      const current = controller.read().current, snapshot = audio.snapshot();
      const state = playback && !playback.signal.aborted ? snapshot.status : 'idle';
      audioStatus.dataset.state = state;
      const labels = { idle: 'Âm thanh gốc giáo trình.', loading: 'Đang tải âm thanh…', playing: 'Đang phát âm thanh giáo trình.', paused: 'Đã tạm dừng.', ended: 'Đã nghe hết từ.', error: 'Chưa phát được. Kiểm tra kết nối rồi bấm Nghe lại.' };
      audioStatus.textContent = !current?.audio ? 'Không có âm thanh riêng trong giáo trình cho nghĩa này.' : !current.revealed ? 'Xem đáp án để nghe từ.' : playback && snapshot.issue ? snapshot.issue : labels[state];
      play.disabled = replay.disabled = !current?.audio || !current.revealed || state === 'loading';
      pause.disabled = !playback || !['loading', 'playing', 'paused'].includes(state); pause.textContent = state === 'paused' ? 'Tiếp tục' : 'Tạm dừng';
    }
    function begin(): void {
      const current = controller.read().current;
      if (!current?.revealed || !current.audioRecordId) return;
      const request = content.resolveAudio(current.audioRecordId); if (!request) return;
      stop(); playback = new AbortController(); const owner = playback;
      audio.setRate(controller.read().preferences.rate);
      void audio.play(request, { signal: owner.signal }).then(result => {
        if (left || lifetime.signal.aborted || owner.signal.aborted || playback !== owner) return;
        if (!result.ok && result.code !== 'cancelled') message.textContent = result.issue ?? 'Chưa phát được âm thanh. Hãy thử lại.';
        updateAudio();
      }); updateAudio();
    }
    on(play, 'click', begin); on(replay, 'click', begin);
    on(pause, 'click', () => { if (playback && !playback.signal.aborted) { if (audio.snapshot().status === 'paused') void audio.resume(); else audio.pause(); } });
    function renderCard(): void {
      cardEvents?.abort(); cardEvents = new AbortController(); cardHost.replaceChildren();
      const current = controller.read().current; if (!current) return;
      const card = node('article'); card.id = 'vocabulary-card'; card.className = 'vocabulary-card'; card.dataset.senseId = current.senseId;
      const prompt = node('h2', current.direction === 'zh-vi' ? current.zh : current.vi); prompt.tabIndex = -1; prompt.lang = current.direction === 'zh-vi' ? 'zh-CN' : 'vi'; prompt.id = 'vocabulary-prompt';
      card.append(prompt);
      if (pinyin.checked && (current.direction === 'zh-vi' || current.revealed)) { const py = node('p', current.py); py.lang = 'zh-Latn'; py.dataset.vocabularyPinyin = ''; card.append(py); }
      const reveal = button('reveal', 'Xem đáp án'); reveal.disabled = current.revealed;
      reveal.addEventListener('click', () => { if (handle(controller.reveal())) { update(); cardHost.querySelector<HTMLElement>('#vocabulary-answer')?.focus(); } }, { signal: cardEvents.signal }); card.append(reveal);
      if (current.revealed) {
        const answer = node('section'); answer.id = 'vocabulary-answer'; answer.tabIndex = -1;
        const target = node('p', current.direction === 'zh-vi' ? current.vi : current.zh); target.lang = current.direction === 'zh-vi' ? 'vi' : 'zh-CN'; target.className = 'vocabulary-target';
        answer.append(target, node('p', `Nghĩa / cách dùng: ${current.senseZh}${current.cueZh ? ` · ${current.cueZh}` : ''}`));
        answer.append(node('p', `${current.extension ? 'Từ mở rộng' : 'Từ trong giáo trình'} · ${current.category === 'proper_noun' ? 'Tên riêng' : 'Từ thông dụng'}`));
        const sources = node('ul'); sources.id = 'vocabulary-sources';
        for (const source of current.sourceRecords) {
          const row = node('li'); const link = node('a', `Bài ${source.lesson}`); link.href = routeHref({ feature: 'textbook', lesson: source.lesson, section: 'vocab' }); link.dataset.routeLink = '';
          row.append(link, document.createTextNode(` · ${source.source.section} · Trang sách ${source.source.printPages.join(', ')} · PDF ${source.source.pdfPages.join(', ')}`)); sources.append(row);
        }
        answer.append(sources); card.append(answer);
      }
      const rateActions = node('div'); rateActions.className = 'vocabulary-actions';
      for (const [value, text] of Object.entries(ratings)) {
        const rate = button(value, text); rate.disabled = !current.revealed || !!current.rating;
        rate.addEventListener('click', () => { if (handle(controller.rate(value as keyof typeof ratings))) { update(); next.focus(); } }, { signal: cardEvents.signal }); rateActions.append(rate);
      }
      card.append(rateActions);
      if (current.rating) {
        const note = node('p', `${ratings[current.rating.rating]} · Ôn tiếp: ${new Date(current.rating.schedule.dueAt).toLocaleString('vi-VN')}${current.rating.early ? ' · Ôn sớm: giữ nguyên cấp và hạn ôn.' : ''}`);
        note.id = 'vocabulary-rating-result'; note.setAttribute('role', 'status'); card.append(note);
      }
      cardHost.append(card);
    }
    function update(): void {
      if (left || lifetime.signal.aborted) return;
      const model = controller.read(), current = model.current, review = model.review;
      const nextKey = current && review ? `${review.id}:${current.senseId}` : '';
      if (key !== nextKey) { stop(); key = nextKey; }
      const renderKey = `${key}:${current?.revealed}:${current?.rating?.at}:${pinyin.checked}`;
      if (rendered !== renderKey) { rendered = renderKey; renderCard(); }
      for (const [id, input] of inputs) input.checked = model.preferences.lessons.includes(id);
      filter.value = model.preferences.vocabularyFilter; direction.value = model.preferences.direction; shuffle.checked = model.preferences.shuffle;
      available.textContent = !model.preferences.lessons.length ? 'Hãy chọn ít nhất một bài học.' : `Bài đã chọn: ${model.preferences.lessons.join(', ')} · ${model.available.mergedCount} nghĩa / ${model.available.distinctForms} dạng chữ · ${model.availableCount} thẻ theo bộ lọc.${model.availableCount ? '' : ' Không có thẻ phù hợp; hãy đổi bộ lọc hoặc chọn thêm bài.'}`;
      start.disabled = model.availableCount === 0; due.disabled = model.preferences.lessons.length === 0;
      resume.hidden = !current; resume.textContent = `Tiếp tục lượt đã lưu${review ? ` · Thẻ ${review.position + 1}` : ''}`;
      exercise.hidden = !current;
      position.textContent = review ? `Thẻ ${review.position + 1} / ${review.senseIds.length}` : '';
      scope.textContent = review ? `Lượt đang học: Bài ${review.lessons.join(', ')} · ${filters[review.filter]} · ${review.direction === 'zh-vi' ? 'Trung → Việt' : 'Việt → Trung'}` : '';
      previous.disabled = !review || review.position === 0; next.disabled = skip.disabled = !review || review.position >= review.senseIds.length - 1;
      const stats = model.summary;
      summary.replaceChildren(node('h2', 'Tự đánh giá và lịch ôn'), node('p', `Đã tự đánh giá ${stats.rated} / ${stats.totalSenses} nghĩa · Chưa thuộc ${stats.unfamiliar} · Cần luyện lại ${stats.wrong} · Đến hạn và từ mới ${stats.due}.`), node('p', `Lượt đang học: ${stats.review.rated} / ${stats.review.total} thẻ đã tự đánh giá.${stats.review.done ? ' Đã hoàn thành lượt này.' : ''}`), node('p', 'Chưa nhớ: 10 phút. Khó nhớ: 1 ngày. Đã nhớ đúng hạn: 1, 3, 7, 14, 30 ngày. Ôn sớm bằng Đã nhớ không tăng cấp hoặc đẩy hạn ôn.'));
      const snapshot = session.store.snapshot(); save.dataset.state = snapshot.status;
      save.textContent = snapshot.issue ?? ({ empty: 'Chưa có dữ liệu cần lưu.', saved: 'Đã lưu trên thiết bị này.', unsaved: 'Có thay đổi chưa lưu.', saving: 'Đang lưu…', conflict: 'Có thay đổi ở tab khác; lượt ôn vẫn ở tab này.', corrupt: 'Dữ liệu không đọc được. Hãy giữ dữ liệu gốc trong quản lý dữ liệu.', unavailable: 'Chưa lưu được. Hãy tải bản sao lưu hoặc thử lưu lại.' }[snapshot.status]);
      retry.hidden = ['empty', 'saved', 'saving'].includes(snapshot.status); retry.disabled = !snapshot.canWrite || snapshot.status === 'saving';
      const now = Date.now();
      const nextDueAt = Object.values(snapshot.data.practice.cards.schedule).reduce<number | null>((next, entry) => {
        const at = entry && typeof entry === 'object' && !Array.isArray(entry) ? Number(entry.dueAt) : NaN;
        return at > now && (next === null || at < next) ? at : next;
      }, null);
      dueRefresh?.schedule(nextDueAt); updateAudio();
    }
    dueRefresh = createDueRefresh(update, lifetime.signal);
    unsubscribe = session.store.subscribe(update); unsubscribeAudio = audio.subscribe(updateAudio);
    lifetime.signal.addEventListener('abort', stop, { once: true }); update(); controls.disabled = false;
  });
  return { ready, unmount() { if (left) return; left = true; lifetime.abort(); dueRefresh?.dispose(); stop(); cardEvents?.abort(); unsubscribe(); unsubscribeAudio(); flush(); context.signal.removeEventListener('abort', abort); article.remove(); } };
}
