import type { FeatureModule } from '../../app/contracts.ts';
import { routeHref } from '../../app/router.ts';
import { loadListening } from '../../services/content/listening.ts';
import { createListeningController } from '../../domain/listening/controller.ts';
import { AUDIO_RATES } from '../../services/audio/index.ts';
import type { PlaybackResult } from '../../services/audio/index.ts';
import './listening.css';

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}
function button(id: string, text: string): HTMLButtonElement {
  const node = element('button', text); node.id = id; node.type = 'button'; return node;
}
const percentage = (right: number, total: number) => total ? `${Math.round(right / total * 100)}%` : 'chưa có điểm';

export const mount: FeatureModule['mount'] = (host, context) => {
  const article = element('article'); article.id = 'listening-module'; article.className = 'module-entry listening';
  const heading = element('h1', 'Luyện nghe'); heading.tabIndex = -1;
  const introduction = element('p', 'Nghe tiếng Trung từ bản ghi giáo trình, chọn nghĩa phù hợp bằng tiếng Việt rồi nộp từng câu.');
  const controls = element('fieldset'); controls.dataset.moduleControls = ''; controls.disabled = true;
  controls.append(element('legend', 'Luyện nghe của bạn'));
  const start = button('listening-start', 'Bắt đầu lượt mới'); start.disabled = true; controls.append(start);
  article.append(heading, introduction, controls); host.append(article);
  const lifetime = new AbortController();
  const close = () => lifetime.abort();
  context.signal.addEventListener('abort', close, { once: true });
  if (context.signal.aborted) close();
  let left = false;
  let unsubscribe = () => {};
  let unsubscribeAudio = () => {};
  let flush = () => {};
  let stopPlayback = () => {};
  let questionLifetime: AbortController | undefined;

  const ready = Promise.resolve().then(async () => {
    if (!context.learning || !context.audio) throw new Error('Learning services unavailable.');
    const [content, session, audio] = await Promise.all([loadListening(lifetime.signal), context.learning(), context.audio()]);
    if (left || lifetime.signal.aborted) return;
    const listening = createListeningController({ session, catalog: content.catalog });
    flush = () => { void session.flush(); };
    listening.visit(context.route.lesson);

    const settings = element('section'); settings.id = 'listening-settings'; settings.className = 'listening-panel';
    settings.append(element('h2', 'Chọn câu cho lượt mới'));
    const lessons = element('fieldset'); lessons.className = 'listening-lessons'; lessons.append(element('legend', 'Chọn một hoặc nhiều bài học'));
    const lessonGrid = element('div'); lessonGrid.className = 'listening-lesson-grid';
    const lessonInputs = new Map<number, HTMLInputElement>();
    for (const lesson of content.lessons) {
      const label = element('label'); const input = element('input'); input.type = 'checkbox'; input.dataset.listeningLesson = String(lesson.id); input.id = `listening-lesson-${lesson.id}`;
      label.append(input, document.createTextNode(` Bài ${lesson.id}`)); lessonInputs.set(lesson.id, input); lessonGrid.append(label);
    }
    const selectAll = button('listening-all', 'Chọn tất cả'); const selectNone = button('listening-none', 'Bỏ chọn tất cả');
    const selectCurrent = button('listening-current-lesson', `Chọn bài đang mở · Bài ${context.route.lesson}`);
    const lessonActions = element('div'); lessonActions.className = 'listening-actions'; lessonActions.append(selectAll, selectNone, selectCurrent);
    lessons.append(lessonGrid, lessonActions);
    const modeLabel = element('label', 'Câu cần luyện'); const mode = element('select'); mode.id = 'listening-mode';
    for (const [value, text] of [['all', 'Tất cả câu'], ['wrong', 'Câu gần nhất còn sai']] as const) {
      const option = element('option', text); option.value = value; mode.append(option);
    }
    modeLabel.append(mode);
    const shuffleLabel = element('label'); const shuffle = element('input'); shuffle.type = 'checkbox'; shuffle.id = 'listening-shuffle';
    shuffleLabel.append(shuffle, document.createTextNode(' Trộn thứ tự câu hỏi'));
    const preferences = element('div'); preferences.className = 'listening-preferences'; preferences.append(modeLabel, shuffleLabel);
    const available = element('p'); available.id = 'listening-available'; available.setAttribute('role', 'status');
    const resume = button('listening-resume', 'Tiếp tục lượt đã lưu'); const redo = button('listening-redo', 'Làm lại câu còn sai');
    const sessionActions = element('div'); sessionActions.className = 'listening-actions'; sessionActions.append(start, resume, redo);
    settings.append(lessons, preferences, available, sessionActions, element('p', 'Chọn phạm vi mới rồi bấm bắt đầu. Lượt đang học sẽ được thay bằng lượt mới; điểm lần đầu và gần nhất vẫn được giữ.'));

    const saveBox = element('div'); saveBox.className = 'listening-save';
    const saveStatus = element('p'); saveStatus.id = 'listening-save-status'; saveStatus.setAttribute('role', 'status');
    const retrySave = button('retry-listening-save', 'Thử lưu lại');
    const dataLink = element('a', 'Quản lý dữ liệu và bản sao lưu'); dataLink.href = routeHref({ feature: 'progress', lesson: context.route.lesson }); dataLink.dataset.routeLink = '';
    const saveActions = element('div'); saveActions.className = 'listening-actions'; saveActions.append(retrySave, dataLink); saveBox.append(saveStatus, saveActions);
    const summary = element('div'); summary.id = 'listening-summary'; summary.className = 'listening-panel';
    const sessionScore = element('p'); sessionScore.id = 'listening-session-score';
    const firstScore = element('p'); firstScore.id = 'listening-first-score'; const latestScore = element('p'); latestScore.id = 'listening-latest-score';
    const completed = element('p'); completed.id = 'listening-completed'; completed.setAttribute('role', 'status');
    summary.append(element('h2', 'Kết quả nghe'), sessionScore, firstScore, latestScore, completed);
    const message = element('p'); message.id = 'listening-message'; message.setAttribute('role', 'status');

    const exercise = element('section'); exercise.className = 'listening-exercise';
    const position = element('p'); position.id = 'listening-position';
    const queueScope = element('p'); queueScope.id = 'listening-queue-scope'; queueScope.className = 'listening-hint';
    const listenCount = element('p'); listenCount.id = 'listening-listen-count';
    const player = element('div'); player.id = 'listening-player'; player.className = 'listening-panel';
    const playerTitle = element('h3', 'Âm thanh giáo trình');
    const audioStatus = element('p'); audioStatus.id = 'listening-audio-status'; audioStatus.setAttribute('role', 'status');
    const play = button('listening-play', 'Nghe'); const pause = button('listening-pause', 'Tạm dừng'); const replay = button('listening-replay', 'Nghe lại từ đầu');
    const rateLabel = element('label', 'Tốc độ'); const rate = element('select'); rate.id = 'listening-rate';
    for (const value of AUDIO_RATES) { const option = element('option', `${value}×${value === 1 ? ' · Bình thường' : ''}`); option.value = String(value); rate.append(option); }
    rateLabel.append(rate);
    const playerActions = element('div'); playerActions.className = 'listening-actions'; playerActions.append(play, pause, replay, rateLabel);
    player.append(playerTitle, audioStatus, playerActions, element('p', 'Bạn có thể nghe nhiều lần và đổi tốc độ. Số lần nghe không làm giảm điểm.'));
    const questionHost = element('div');
    const journey = element('nav'); journey.className = 'listening-actions'; journey.setAttribute('aria-label', 'Di chuyển trong lượt nghe');
    const previous = button('listening-prev', '← Câu trước'); const next = button('listening-next', 'Câu tiếp →'); journey.append(previous, next);
    exercise.append(position, queueScope, player, listenCount, questionHost, journey);
    controls.replaceChildren(element('legend', 'Luyện nghe của bạn'), settings, saveBox, message, exercise, summary);

    // A question owns playback independently of view rendering and save events.
    let playback: AbortController | undefined;
    let pendingListen: { owner: AbortController; key: string; identity: { sessionId: string; questionId: string; playbackId: string }; counted: boolean } | undefined;
    let playbackKey = ''; let playbackSequence = 0; let questionKey = ''; let renderedQuestion = ''; let hasQuestion = false;
    stopPlayback = () => { playback?.abort(); playback = undefined; pendingListen = undefined; playbackKey = ''; updateAudio(); };
    lifetime.signal.addEventListener('abort', stopPlayback, { once: true });
    lifetime.signal.addEventListener('abort', () => questionLifetime?.abort(), { once: true });
    const showMessage = (text: string) => { if (!left && !lifetime.signal.aborted) message.textContent = text; };
    const handle = (outcome: { ok: boolean; message?: string }) => { showMessage(outcome.ok ? '' : outcome.message ?? 'Chưa thực hiện được. Vui lòng thử lại.'); return outcome.ok; };
    function changedPreferences(patch: Parameters<typeof listening.setPreferences>[0]): void {
      stopPlayback(); handle(listening.setPreferences(patch)); update();
    }
    for (const input of lessonInputs.values()) input.addEventListener('change', () => {
      changedPreferences({ lessons: [...lessonInputs].filter(([, field]) => field.checked).map(([id]) => id) });
    }, { signal: lifetime.signal });
    selectAll.addEventListener('click', () => changedPreferences({ lessons: content.lessons.map(lesson => lesson.id) }), { signal: lifetime.signal });
    selectNone.addEventListener('click', () => changedPreferences({ lessons: [] }), { signal: lifetime.signal });
    selectCurrent.addEventListener('click', () => changedPreferences({ lessons: [context.route.lesson] }), { signal: lifetime.signal });
    mode.addEventListener('change', () => changedPreferences({ listeningMode: mode.value as 'all' | 'wrong' }), { signal: lifetime.signal });
    shuffle.addEventListener('change', () => changedPreferences({ shuffle: shuffle.checked }), { signal: lifetime.signal });
    rate.addEventListener('change', () => { const value = Number(rate.value); if (handle(listening.setPreferences({ rate: value }))) audio.setRate(value); update(); }, { signal: lifetime.signal });
    start.addEventListener('click', () => { stopPlayback(); if (handle(listening.start())) { update(); focusQuestion(); } }, { signal: lifetime.signal });
    redo.addEventListener('click', () => { stopPlayback(); if (handle(listening.redo())) { update(); focusQuestion(); } }, { signal: lifetime.signal });
    resume.addEventListener('click', () => { showMessage(''); focusQuestion(); }, { signal: lifetime.signal });
    previous.addEventListener('click', () => { const model = listening.read(); if (model.session && handle(listening.move(model.session.position - 1))) { update(); focusQuestion(); } }, { signal: lifetime.signal });
    next.addEventListener('click', () => { if (handle(listening.next())) { update(); focusQuestion(); } }, { signal: lifetime.signal });
    retrySave.addEventListener('click', () => { void session.flush(); }, { signal: lifetime.signal });
    function focusQuestion(): void { questionHost.querySelector<HTMLElement>('h2')?.focus(); }
    function updateAudio(): void {
      if (left || lifetime.signal.aborted) return;
      const owned = !!playback && !playback.signal.aborted && playbackKey === questionKey;
      const snapshot = audio.snapshot(); const state = owned ? snapshot.status : 'idle';
      audioStatus.dataset.state = state;
      const labels = { idle: 'Bấm Nghe để phát câu này.', loading: 'Đang tải âm thanh…', playing: 'Đang phát âm thanh giáo trình.', paused: 'Đã tạm dừng.', ended: 'Đã nghe hết đoạn. Bạn có thể nghe lại.', error: 'Không phát được âm thanh. Kiểm tra kết nối rồi bấm Nghe lại.' };
      audioStatus.textContent = owned && snapshot.issue ? snapshot.issue : labels[state];
      play.disabled = !hasQuestion || state === 'loading'; replay.disabled = !hasQuestion || state === 'loading';
      pause.disabled = !owned || !['loading', 'playing', 'paused'].includes(state);
      pause.textContent = state === 'paused' ? 'Tiếp tục' : 'Tạm dừng'; player.dataset.state = state;
    }
    function confirmPlayback(owner: AbortController, result: PlaybackResult): void {
      const pending = pendingListen;
      if (left || lifetime.signal.aborted || owner.signal.aborted || playback !== owner || !pending || pending.owner !== owner || questionKey !== pending.key) return;
      if (result.ok && result.code === 'playing' && !pending.counted) {
        pending.counted = true; handle(listening.recordListen(pending.identity));
      } else if (!result.ok && result.code !== 'cancelled') showMessage(result.issue ?? 'Không phát được âm thanh. Hãy thử lại.');
      update();
    }
    function beginPlayback(): void {
      const model = listening.read();
      if (!model.current || !model.session || left || lifetime.signal.aborted) return;
      const request = content.resolveAudio(model.current.id);
      if (!request) { showMessage('Câu này chưa có đoạn âm thanh hợp lệ. Vui lòng chọn câu khác.'); return; }
      stopPlayback(); playback = new AbortController(); playbackKey = questionKey;
      const owner = playback;
      const identity = { sessionId: model.session.id, questionId: model.current.id, playbackId: `${model.session.id}:${++playbackSequence}` };
      pendingListen = { owner, key: questionKey, identity, counted: false };
      audio.setRate(model.preferences.rate);
      // Keep native play inside the gesture and count each request's first playing.
      void audio.play(request, { signal: owner.signal }).then(result => confirmPlayback(owner, result));
      updateAudio();
    }
    play.addEventListener('click', beginPlayback, { signal: lifetime.signal });
    replay.addEventListener('click', beginPlayback, { signal: lifetime.signal });
    pause.addEventListener('click', () => {
      if (!playback || playback.signal.aborted || playbackKey !== questionKey) return;
      const owner = playback;
      // Resuming an already started request never adds a listen. A request
      // paused during loading is counted once when it genuinely starts later.
      if (audio.snapshot().status === 'paused') void audio.resume().then(result => confirmPlayback(owner, result));
      else audio.pause();
    }, { signal: lifetime.signal });

    function renderQuestion(): void {
      const model = listening.read(); const current = model.current;
      questionLifetime?.abort(); questionLifetime = new AbortController();
      const signal = questionLifetime.signal; questionHost.replaceChildren();
      if (!current || !model.session) { questionHost.append(element('p', 'Chọn bài học rồi bấm bắt đầu để luyện nghe.')); return; }
      const card = element('article'); card.id = 'listening-question'; card.className = 'listening-question'; card.dataset.questionId = current.id; card.dataset.sessionId = model.session.id;
      const title = element('h2', `Câu ${model.session.position + 1} · Bài ${current.lesson}`); title.tabIndex = -1;
      card.append(title, element('p', current.promptVi));
      const options = element('fieldset'); options.className = 'listening-options'; options.append(element('legend', 'Chọn một đáp án'));
      for (const [visibleIndex, option] of current.options.entries()) {
        const label = element('label'); const input = element('input'); input.type = 'radio'; input.name = `listen-${current.id}`; input.value = String(option.index); input.dataset.optionIndex = String(option.index); input.checked = current.selected === option.index; input.disabled = current.submitted;
        input.addEventListener('change', () => { handle(listening.select(current.id, option.index)); update(); }, { signal });
        label.append(input, element('span', `${String.fromCharCode(65 + visibleIndex)}. ${option.text}`)); options.append(label);
      }
      const submit = button('listening-submit', 'Nộp và xem giải thích'); submit.className = 'listening-primary'; submit.disabled = current.submitted || current.selected === null;
      submit.addEventListener('click', () => { if (handle(listening.submit())) { update(); questionHost.querySelector<HTMLElement>('#listening-feedback')?.focus(); } }, { signal });
      card.append(options, submit);
      // These nodes do not exist in the DOM or accessibility tree before submit.
      if (current.feedback) {
        const feedback = current.feedback;
        const result = element('section'); result.id = 'listening-feedback'; result.className = `listening-feedback ${feedback.correct ? 'is-correct' : 'is-incorrect'}`; result.tabIndex = -1;
        result.append(element('h3', feedback.correct ? 'Đúng' : 'Chưa đúng'));
        const answerPosition = current.options.findIndex(option => option.index === feedback.answer);
        const answer = current.options[answerPosition];
        result.append(element('p', `Đáp án đúng: ${String.fromCharCode(65 + answerPosition)}. ${answer?.text ?? ''}`), element('p', feedback.explanationVi));
        const explanations = element('ul'); explanations.className = 'listening-option-feedback';
        for (const [visibleIndex, option] of current.options.entries()) {
          const row = element('li', `${String.fromCharCode(65 + visibleIndex)}. ${option.text}: ${feedback.optionFeedback[option.index]}`); row.dataset.feedbackOptionIndex = String(option.index); explanations.append(row);
        }
        result.append(explanations, element('h4', 'Nội dung đã nghe'));
        for (const line of feedback.transcript) {
          const block = element('div'); block.className = 'listening-transcript';
          const zh = element('p', line.zh); zh.lang = 'zh-CN'; zh.dataset.listeningTranscript = '';
          const py = element('p', line.py); py.lang = 'zh-Latn'; py.dataset.listeningPinyin = '';
          block.append(zh, py, element('p', line.vi)); result.append(block);
        }
        const source = element('p', `Nguồn: ${feedback.source.section} · Trang sách ${feedback.source.printPages.join(', ')} · Trang PDF ${feedback.source.pdfPages.join(', ')}`); source.className = 'listening-hint'; result.append(source); card.append(result);
      }
      questionHost.append(card);
    }
    function update(): void {
      if (left || lifetime.signal.aborted) return;
      const model = listening.read(); const current = model.current;
      hasQuestion = !!current;
      const key = model.session && current ? `${model.session.id}:${current.id}` : '';
      if (key !== questionKey) { stopPlayback(); questionKey = key; }
      const renderKey = `${key}:${current?.submitted ?? false}`;
      if (renderKey !== renderedQuestion) { renderedQuestion = renderKey; renderQuestion(); }
      else if (current) {
        for (const input of questionHost.querySelectorAll<HTMLInputElement>('input[data-option-index]')) input.checked = Number(input.value) === current.selected;
        const submit = questionHost.querySelector<HTMLButtonElement>('#listening-submit'); if (submit) submit.disabled = current.submitted || current.selected === null;
      }
      for (const [id, input] of lessonInputs) input.checked = model.preferences.lessons.includes(id);
      mode.value = model.preferences.listeningMode; shuffle.checked = model.preferences.shuffle; rate.value = String(model.preferences.rate);
      const wrong = new Set(model.summary.wrongIds);
      const wrongInRange = content.items.filter(row => model.preferences.lessons.includes(row.lesson) && wrong.has(row.id)).length;
      available.textContent = !model.preferences.lessons.length ? 'Hãy chọn ít nhất một bài học.' : model.availableCount ? `${model.availableCount} câu trong phạm vi đã chọn.` : 'Không có câu còn sai trong phạm vi đã chọn. Bạn có thể chọn tất cả câu để luyện thêm.';
      start.disabled = !model.availableCount; redo.disabled = !wrongInRange;
      resume.hidden = !current; resume.textContent = `Tiếp tục lượt đã lưu${model.session ? ` · Câu ${model.session.position + 1}` : ''}`;
      exercise.hidden = !current;
      position.textContent = model.session && current ? `Câu ${model.session.position + 1} / ${model.session.questionIds.length}` : '';
      queueScope.textContent = model.session ? `Lượt đang học: Bài ${model.session.lessons.join(', ')} · ${model.session.mode === 'wrong' ? 'Làm lại câu còn sai' : 'Tất cả câu'}` : '';
      listenCount.textContent = current ? `Số lần đã bắt đầu nghe: ${current.listenCount}` : '';
      previous.disabled = !model.session || model.session.position === 0;
      next.disabled = !model.session || !current?.submitted || model.session.position >= model.session.questionIds.length - 1;
      const round = model.summary.session; const overall = model.summary.overall;
      sessionScore.textContent = `Lượt này: đã nộp ${round.answered} / ${round.total} câu · Đúng ${round.correct} / ${round.answered} câu đã nộp (${percentage(round.correct, round.answered)}).`;
      firstScore.textContent = `Lần đầu: đúng ${overall.firstCorrect} / ${overall.answered} câu đã nộp (${percentage(overall.firstCorrect, overall.answered)}) · Đã nộp ${overall.answered} / ${overall.total} câu.`;
      latestScore.textContent = `Gần nhất: đúng ${overall.latestCorrect} / ${overall.answered} câu đã nộp (${percentage(overall.latestCorrect, overall.answered)}).`;
      completed.textContent = round.done ? 'Bạn đã hoàn thành lượt nghe này. Lần đầu và lần gần nhất được giữ riêng khi làm lại.' : '';
      summary.dataset.complete = String(round.done);
      const snapshot = session.store.snapshot(); saveStatus.dataset.state = snapshot.status;
      const saveLabels = { empty: 'Chưa có dữ liệu cần lưu.', saved: 'Đã lưu trên thiết bị này.', unsaved: 'Có thay đổi chưa lưu.', saving: 'Đang lưu…', conflict: 'Có thay đổi ở tab khác. Câu trả lời của bạn vẫn còn trong tab này.', corrupt: 'Dữ liệu không đọc được. Hãy giữ lại dữ liệu gốc trong mục quản lý dữ liệu.', unavailable: 'Chưa lưu được trên thiết bị. Dữ liệu chỉ còn trong tab này; hãy thử lưu lại hoặc tải bản sao lưu.' };
      saveStatus.textContent = snapshot.issue ?? saveLabels[snapshot.status];
      retrySave.hidden = ['empty', 'saved', 'saving'].includes(snapshot.status); retrySave.disabled = !snapshot.canWrite || snapshot.status === 'saving';
      updateAudio();
    }
    audio.setRate(listening.read().preferences.rate);
    unsubscribe = session.store.subscribe(update); unsubscribeAudio = audio.subscribe(updateAudio);
    update(); controls.disabled = false;
  });
  return { ready, unmount() {
    if (left) return;
    left = true; lifetime.abort(); context.signal.removeEventListener('abort', close);
    unsubscribe(); unsubscribeAudio(); questionLifetime?.abort(); stopPlayback(); flush(); article.remove();
  } };
};
