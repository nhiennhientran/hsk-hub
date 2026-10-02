import type { FeatureModule } from '../../app/contracts.ts';
import { routeHref } from '../../app/router.ts';
import { loadListening } from '../../services/content/listening.ts';
import { createListeningController } from '../../domain/listening/controller.ts';
import { AUDIO_RATES } from '../../services/audio/index.ts';
import type { PlaybackResult } from '../../services/audio/index.ts';
import { bilingualText, bilingualNode, setBilingual, type BilingualCopy } from '../../app/bilingual.ts';
import { listeningCopy as copy, listeningAudioStates, listeningAudioFailure, listeningFailure } from '../../app/i18n/listening.ts';
import { assignmentSaveCopy, assignmentSaveFailed } from '../../app/i18n/homework.ts';
import '../../app/bilingual.css';
import './listening.css';

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string | BilingualCopy): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (typeof text === 'string') node.textContent = text;
  else if (text) { if (tag === 'option') node.textContent = bilingualText(text); else setBilingual(node, text); if (tag === 'p') node.classList.add('bilingual-stacked'); }
  return node;
}
function button(id: string, text: string | BilingualCopy): HTMLButtonElement {
  const node = element('button', text); node.id = id; node.type = 'button'; return node;
}

export const mount: FeatureModule['mount'] = (host, context) => {
  const article = element('article'); article.id = 'listening-module'; article.className = 'module-entry listening';
  const heading = element('h1', copy.title); heading.tabIndex = -1;
  const introduction = element('p', copy.introduction);
  const controls = element('fieldset'); controls.dataset.moduleControls = ''; controls.disabled = true;
  controls.append(element('legend', copy.controls));
  const start = button('listening-start', copy.start); start.disabled = true; controls.append(start);
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

    const settings = element('details'); settings.id = 'listening-settings'; settings.className = 'listening-panel listening-settings';
    settings.open = !listening.read().current;
    settings.append(element('summary', copy.settings));
    const lessons = element('fieldset'); lessons.className = 'listening-lessons'; lessons.append(element('legend', copy.lessons));
    const lessonGrid = element('div'); lessonGrid.className = 'listening-lesson-grid';
    const lessonInputs = new Map<number, HTMLInputElement>();
    for (const lesson of content.lessons) {
      const label = element('label'); const input = element('input'); input.type = 'checkbox'; input.dataset.listeningLesson = String(lesson.id); input.id = `listening-lesson-${lesson.id}`;
      label.append(input, bilingualNode('span', copy.lesson(lesson.id))); lessonInputs.set(lesson.id, input); lessonGrid.append(label);
    }
    const selectAll = button('listening-all', copy.all); const selectNone = button('listening-none', copy.none);
    const selectCurrent = button('listening-current-lesson', copy.currentLesson(context.route.lesson));
    const lessonActions = element('div'); lessonActions.className = 'listening-actions'; lessonActions.append(selectAll, selectNone, selectCurrent);
    lessons.append(lessonGrid, lessonActions);
    const modeLabel = element('label', copy.mode); const mode = element('select'); mode.id = 'listening-mode';
    for (const [value, text] of [['all', copy.allQuestions], ['wrong', copy.wrongQuestions]] as const) {
      const option = element('option', text); option.value = value; mode.append(option);
    }
    modeLabel.append(mode);
    const shuffleLabel = element('label'); const shuffle = element('input'); shuffle.type = 'checkbox'; shuffle.id = 'listening-shuffle';
    shuffleLabel.append(shuffle, bilingualNode('span', copy.shuffle));
    const countLabel = element('label', copy.count); const count = element('select'); count.id = 'listening-count';
    for (const [value, text] of [['5', copy.questionCount(5)], ['10', copy.questionCount(10)], ['all', copy.allQuestions]] as const) { const option = element('option', text); option.value = value; count.append(option); }
    count.value = String(listening.read().session?.limit ?? 'all'); countLabel.append(count);
    const requestedCount = (): 5 | 10 | 'all' => count.value === 'all' ? 'all' : Number(count.value) as 5 | 10;
    const preferences = element('div'); preferences.className = 'listening-preferences'; preferences.append(modeLabel, countLabel, shuffleLabel);
    const available = element('p'); available.id = 'listening-available'; available.setAttribute('role', 'status');
    const resume = button('listening-resume', copy.resume()); const redo = button('listening-redo', copy.redo);
    const sessionActions = element('div'); sessionActions.className = 'listening-actions'; sessionActions.append(start, resume, redo);
    settings.append(lessons, preferences, available, sessionActions, element('p', copy.replaceHint));

    const saveBox = element('div'); saveBox.className = 'listening-save';
    const saveStatus = element('p'); saveStatus.id = 'listening-save-status'; saveStatus.setAttribute('role', 'status');
    const retrySave = button('retry-listening-save', copy.retrySave);
    const dataLink = element('a', copy.data); dataLink.href = routeHref({ feature: 'progress', lesson: context.route.lesson }); dataLink.dataset.routeLink = '';
    const saveActions = element('div'); saveActions.className = 'listening-actions'; saveActions.append(retrySave, dataLink); saveBox.append(saveStatus, saveActions);
    const summary = element('details'); summary.id = 'listening-summary'; summary.className = 'listening-panel listening-summary';
    let roundComplete = listening.read().summary.session.done; summary.open = roundComplete;
    const sessionScore = element('p'); sessionScore.id = 'listening-session-score';
    const firstScore = element('p'); firstScore.id = 'listening-first-score'; const latestScore = element('p'); latestScore.id = 'listening-latest-score';
    const completed = element('p'); completed.id = 'listening-completed'; completed.setAttribute('role', 'status');
    summary.append(element('summary', copy.results), sessionScore, firstScore, latestScore, completed);
    const message = element('p'); message.id = 'listening-message'; message.setAttribute('role', 'status');

    const exercise = element('section'); exercise.className = 'listening-exercise';
    const position = element('p'); position.id = 'listening-position';
    const queueScope = element('p'); queueScope.id = 'listening-queue-scope'; queueScope.className = 'listening-hint';
    const listenCount = element('p'); listenCount.id = 'listening-listen-count';
    const player = element('div'); player.id = 'listening-player'; player.className = 'listening-panel';
    const playerTitle = element('h3', copy.playerTitle);
    const audioStatus = element('p'); audioStatus.id = 'listening-audio-status'; audioStatus.setAttribute('role', 'status');
    const play = button('listening-play', copy.play); const pause = button('listening-pause', copy.pause); const replay = button('listening-replay', copy.replay);
    const rateLabel = element('label', copy.rate); const rate = element('select'); rate.id = 'listening-rate';
    for (const value of AUDIO_RATES) { const option = element('option', `${value}×${value === 1 ? ` · ${bilingualText(copy.normal)}` : ''}`); option.value = String(value); rate.append(option); }
    rateLabel.append(rate);
    const playerActions = element('div'); playerActions.className = 'listening-actions'; playerActions.append(play, pause, replay, rateLabel);
    player.append(playerTitle, audioStatus, playerActions, element('p', copy.playerHint));
    const questionHost = element('div');
    const journey = element('nav'); journey.className = 'listening-actions'; journey.setAttribute('aria-label', bilingualText(copy.navigation));
    const previous = button('listening-prev', copy.previous); const next = button('listening-next', copy.next); journey.append(previous, next);
    exercise.append(position, queueScope, player, listenCount, questionHost, journey);
    controls.replaceChildren(element('legend', copy.controls), message, exercise, settings, summary, saveBox);

    for (const node of [available, saveStatus, message, sessionScore, firstScore, latestScore, completed, queueScope, audioStatus]) node.classList.add('bilingual-stacked');

    // A question owns playback independently of view rendering and save events.
    let playback: AbortController | undefined;
    let pendingListen: { owner: AbortController; key: string; identity: { sessionId: string; questionId: string; playbackId: string }; counted: boolean } | undefined;
    let playbackKey = ''; let playbackSequence = 0; let questionKey = ''; let renderedQuestion = ''; let hasQuestion = false;
    stopPlayback = () => { playback?.abort(); playback = undefined; pendingListen = undefined; playbackKey = ''; updateAudio(); };
    lifetime.signal.addEventListener('abort', stopPlayback, { once: true });
    lifetime.signal.addEventListener('abort', () => questionLifetime?.abort(), { once: true });
    const showMessage = (text: BilingualCopy | '') => { if (!left && !lifetime.signal.aborted) { if (text) setBilingual(message, text); else message.replaceChildren(); } };
    const handle = (outcome: { ok: boolean; reason?: string; message?: string }) => { showMessage(outcome.ok ? '' : listeningFailure(outcome)); return outcome.ok; };
    function changedPreferences(patch: Parameters<typeof listening.setPreferences>[0]): void {
      handle(listening.setPreferences(patch)); update();
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
    count.addEventListener('change', () => update(), { signal: lifetime.signal });
    start.addEventListener('click', () => { stopPlayback(); if (handle(listening.start(requestedCount()))) { settings.open = false; summary.open = false; update(); focusQuestion(); } }, { signal: lifetime.signal });
    redo.addEventListener('click', () => { stopPlayback(); if (handle(listening.redo(requestedCount()))) { settings.open = false; summary.open = false; update(); focusQuestion(); } }, { signal: lifetime.signal });
    resume.addEventListener('click', () => { showMessage(''); settings.open = false; focusQuestion(); }, { signal: lifetime.signal });
    previous.addEventListener('click', () => { const model = listening.read(); if (model.session && handle(listening.move(model.session.position - 1))) { update(); focusQuestion(); } }, { signal: lifetime.signal });
    next.addEventListener('click', () => { if (handle(listening.next())) { update(); focusQuestion(); } }, { signal: lifetime.signal });
    retrySave.addEventListener('click', () => { void session.flush(); }, { signal: lifetime.signal });
    function focusQuestion(): void { questionHost.querySelector<HTMLElement>('h2')?.focus(); }
    function updateAudio(): void {
      if (left || lifetime.signal.aborted) return;
      const owned = !!playback && !playback.signal.aborted && playbackKey === questionKey;
      const snapshot = audio.snapshot(); const state = owned ? snapshot.status : 'idle';
      audioStatus.dataset.state = state;
      setBilingual(audioStatus, owned && snapshot.issue ? listeningAudioFailure(snapshot.issue) : listeningAudioStates[state]);
      play.disabled = !hasQuestion || state === 'loading'; replay.disabled = !hasQuestion || state === 'loading';
      pause.disabled = !owned || !['loading', 'playing', 'paused'].includes(state);
      setBilingual(pause, state === 'paused' ? copy.continue : copy.pause); player.dataset.state = state;
    }
    function confirmPlayback(owner: AbortController, result: PlaybackResult): void {
      const pending = pendingListen;
      if (left || lifetime.signal.aborted || owner.signal.aborted || playback !== owner || !pending || pending.owner !== owner || questionKey !== pending.key) return;
      if (result.ok && result.code === 'playing' && !pending.counted) {
        pending.counted = true; handle(listening.recordListen(pending.identity));
      } else if (!result.ok && result.code !== 'cancelled') showMessage(listeningAudioFailure(result.issue, result.code));
      update();
    }
    function beginPlayback(): void {
      const model = listening.read();
      if (!model.current || !model.session || left || lifetime.signal.aborted) return;
      const request = content.resolveAudio(model.current.id);
      if (!request) { showMessage(copy.invalidAudio); return; }
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
      if (!current || !model.session) { questionHost.append(element('p', copy.noSession)); return; }
      const card = element('article'); card.id = 'listening-question'; card.className = 'listening-question'; card.dataset.questionId = current.id; card.dataset.sessionId = model.session.id;
      const title = element('h2', copy.question(model.session.position + 1, current.lesson)); title.tabIndex = -1;
      card.append(title, element('p', current.promptVi));
      const options = element('fieldset'); options.className = 'listening-options'; options.append(element('legend', copy.choose));
      for (const [visibleIndex, option] of current.options.entries()) {
        const label = element('label'); const input = element('input'); input.type = 'radio'; input.name = `listen-${current.id}`; input.value = String(option.index); input.dataset.optionIndex = String(option.index); input.checked = current.selected === option.index; input.disabled = current.submitted;
        input.addEventListener('change', () => { handle(listening.select(current.id, option.index)); update(); }, { signal });
        label.append(input, element('span', `${String.fromCharCode(65 + visibleIndex)}. ${option.text}`)); options.append(label);
      }
      const submit = button('listening-submit', copy.submit); submit.className = 'listening-primary'; submit.disabled = current.submitted || current.selected === null;
      submit.addEventListener('click', () => { if (handle(listening.submit())) { update(); questionHost.querySelector<HTMLElement>('#listening-feedback')?.focus(); } }, { signal });
      card.append(options, submit);
      // These nodes do not exist in the DOM or accessibility tree before submit.
      if (current.feedback) {
        const feedback = current.feedback;
        const result = element('section'); result.id = 'listening-feedback'; result.className = `listening-feedback ${feedback.correct ? 'is-correct' : 'is-incorrect'}`; result.tabIndex = -1;
        result.append(element('h3', feedback.correct ? copy.correct : copy.incorrect));
        const answerPosition = current.options.findIndex(option => option.index === feedback.answer);
        const answer = current.options[answerPosition];
        result.append(element('p', `${bilingualText(copy.correctAnswer)}: ${String.fromCharCode(65 + answerPosition)}. ${answer?.text ?? ''}`), element('p', feedback.explanationVi));
        const explanations = element('ul'); explanations.className = 'listening-option-feedback';
        for (const [visibleIndex, option] of current.options.entries()) {
          const row = element('li', `${String.fromCharCode(65 + visibleIndex)}. ${option.text}: ${feedback.optionFeedback[option.index]}`); row.dataset.feedbackOptionIndex = String(option.index); explanations.append(row);
        }
        result.append(explanations, element('h4', copy.transcript));
        for (const line of feedback.transcript) {
          const block = element('div'); block.className = 'listening-transcript';
          const zh = element('p', line.zh); zh.lang = 'zh-CN'; zh.dataset.listeningTranscript = '';
          const py = element('p', line.py); py.lang = 'zh-Latn'; py.dataset.listeningPinyin = '';
          block.append(zh, py, element('p', line.vi)); result.append(block);
        }
        const source = element('p', copy.source(feedback.source.section, feedback.source.printPages, feedback.source.pdfPages)); source.classList.add('listening-hint'); result.append(source); card.append(result);
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
      setBilingual(available, !model.preferences.lessons.length ? copy.noLessons : model.availableCount
        ? copy.available(requestedCount() === 'all' ? model.availableCount : Math.min(Number(requestedCount()), model.availableCount), model.availableCount) : copy.noWrong);
      start.disabled = !model.availableCount; redo.disabled = !wrongInRange;
      resume.hidden = !current; setBilingual(resume, copy.resume(model.session ? model.session.position + 1 : undefined));
      exercise.hidden = !current;
      if (model.session && current) setBilingual(position, copy.position(model.session.position + 1, model.session.questionIds.length)); else position.replaceChildren();
      if (model.session) setBilingual(queueScope, copy.scope(model.session.lessons, model.session.mode, model.session.questionIds.length)); else queueScope.replaceChildren();
      if (current) setBilingual(listenCount, copy.listens(current.listenCount)); else listenCount.replaceChildren();
      previous.disabled = !model.session || model.session.position === 0;
      next.disabled = !model.session || !current?.submitted || model.session.position >= model.session.questionIds.length - 1;
      const round = model.summary.session; const overall = model.summary.overall;
      setBilingual(sessionScore, copy.sessionScore(round.answered, round.total, round.correct));
      setBilingual(firstScore, copy.firstScore(overall.firstCorrect, overall.answered, overall.total));
      setBilingual(latestScore, copy.latestScore(overall.latestCorrect, overall.answered));
      if (round.done) setBilingual(completed, copy.completed); else completed.replaceChildren();
      if (round.done && !roundComplete) summary.open = true;
      roundComplete = round.done; summary.dataset.complete = String(round.done);
      const snapshot = session.store.snapshot(); saveStatus.dataset.state = snapshot.status;
      setBilingual(saveStatus, assignmentSaveCopy(snapshot));
      saveStatus.dataset.failed = String(assignmentSaveFailed(snapshot));
      retrySave.hidden = !assignmentSaveFailed(snapshot); retrySave.disabled = !snapshot.canWrite || snapshot.status === 'saving';
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
