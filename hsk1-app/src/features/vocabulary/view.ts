import { bilingualNode as bi, bilingualText, setBilingual, type BilingualCopy } from '../../app/bilingual.ts';
import { vocabularyCopy as copy, vocabularyFilters as filters, vocabularyRatings as ratings, vocabularyAudioStatus, vocabularySaveStatus, vocabularyDynamic as dynamic } from '../../app/i18n/vocabulary.ts';
import '../../app/bilingual.css';
import type { ModuleContext, MountHandle } from '../../app/contracts.ts';
import { routeHref } from '../../app/router.ts';
import { loadVocabulary } from '../../services/content/vocabulary.ts';
import { createVocabularyController } from '../../domain/vocabulary/controller.ts';
import './vocabulary.css';
import { createDueRefresh } from '../due-refresh.ts';

function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag); if (text !== undefined) result.textContent = text; return result;
}
function button(id: string, text: BilingualCopy): HTMLButtonElement {
  const result = bi('button', text); result.id = `vocabulary-${id}`; result.type = 'button'; return result;
}

/** Vocabulary and due review are two entrances to one saved sense-based round. */
export function mountVocabulary(host: HTMLElement, context: ModuleContext, feature: 'vocabulary' | 'review'): MountHandle {
  const article = node('article'); article.id = 'vocabulary-module'; article.className = 'module-entry vocabulary';
  const title = bi('h1', feature === 'review' ? copy.reviewTitle : copy.title); title.tabIndex = -1;
  const controls = node('fieldset'); controls.dataset.moduleControls = ''; controls.disabled = true;
  controls.className = 'vocabulary-controls'; controls.setAttribute('aria-label', bilingualText(copy.controls));
  article.append(title, bi('p', copy.intro), controls); host.append(article);
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
    const settings = node('details'); settings.className = 'vocabulary-panel vocabulary-settings'; settings.id = 'vocabulary-settings';
    settings.open = !controller.read().current;
    settings.append(bi('summary', copy.settings));
    const lessons = node('div'); lessons.className = 'vocabulary-lesson-picker'; lessons.setAttribute('role', 'group');
    const lessonTitle = bi('h3', copy.selectLessons); lessonTitle.id = 'vocabulary-lesson-title';
    lessons.setAttribute('aria-labelledby', lessonTitle.id); lessons.append(lessonTitle);
    const grid = node('div'); grid.className = 'vocabulary-lessons';
    const inputs = new Map<number, HTMLInputElement>();
    for (const lesson of content.lessons) {
      const label = node('label'); const input = node('input'); input.type = 'checkbox'; input.dataset.vocabularyLesson = String(lesson.id);
      input.id = `vocabulary-lesson-${lesson.id}`; label.append(input, bi('span', dynamic.lesson(lesson.id))); grid.append(label); inputs.set(lesson.id, input);
    }
    const all = button('all', copy.all), none = button('none', copy.none);
    const actions = node('div'); actions.className = 'vocabulary-actions'; actions.append(all, none); lessons.append(grid, actions);
    const searchLabel = bi('label', copy.search); searchLabel.htmlFor = 'vocabulary-search';
    const search = node('input'); search.type = 'search'; search.id = 'vocabulary-search'; search.maxLength = 120;
    search.placeholder = bilingualText(copy.searchPlaceholder); search.autocomplete = 'off'; search.value = controller.read().search;
    search.setAttribute('aria-describedby', 'vocabulary-search-note vocabulary-available');
    const clearSearch = button('clear-search', copy.clearSearch);
    const searchRow = node('div'); searchRow.className = 'vocabulary-search-row'; searchRow.append(search, clearSearch);
    const searchNote = bi('p', copy.searchNote);
    searchNote.id = 'vocabulary-search-note'; searchNote.className = 'vocabulary-hint bilingual-stacked';
    const searchPanel = node('div'); searchPanel.className = 'vocabulary-search'; searchPanel.append(searchLabel, searchRow, searchNote);
    const filterLabel = bi('label', copy.filter), filter = node('select'); filter.id = 'vocabulary-filter';
    for (const [value, text] of Object.entries(filters)) { const option = node('option', bilingualText(text)); option.value = value; filter.append(option); } filterLabel.append(filter);
    const directionLabel = bi('label', copy.direction), direction = node('select'); direction.id = 'vocabulary-direction';
    for (const [value, text] of [['zh-vi', copy.zhVi], ['vi-zh', copy.viZh]] as const) { const option = node('option', bilingualText(text)); option.value = value; direction.append(option); } directionLabel.append(direction);
    const shuffleLabel = node('label'), shuffle = node('input'); shuffle.type = 'checkbox'; shuffle.id = 'vocabulary-shuffle'; shuffleLabel.append(shuffle, bi('span', copy.shuffle));
    const options = node('div'); options.className = 'vocabulary-options'; options.append(filterLabel, directionLabel, shuffleLabel);
    const available = node('p'); available.id = 'vocabulary-available'; available.setAttribute('role', 'status');
    const start = button('start', copy.start), due = button('due', copy.due), resume = button('resume', copy.resume);
    const rounds = node('div'); rounds.className = 'vocabulary-actions'; rounds.append(start, due, resume);
    settings.append(lessons, searchPanel, options, available, rounds, bi('p', copy.newRoundNote));
    const save = node('p'); save.id = 'vocabulary-save-status'; save.setAttribute('role', 'status');
    const retry = button('retry-save', copy.retry); const backups = bi('a', copy.backups);
    backups.href = routeHref({ feature: 'progress', lesson: context.route.lesson }); backups.dataset.routeLink = '';
    const saveActions = node('div'); saveActions.className = 'vocabulary-actions'; saveActions.append(retry, backups);
    const message = node('p'); message.id = 'vocabulary-message'; message.setAttribute('role', 'status');
    const exercise = node('section'); exercise.id = 'vocabulary-exercise';
    const position = node('p'); position.id = 'vocabulary-position';
    const scope = node('p'); scope.id = 'vocabulary-queue-scope';
    const pinyinLabel = node('label'), pinyin = node('input'); pinyin.type = 'checkbox'; pinyin.id = 'vocabulary-pinyin';
    pinyinLabel.append(pinyin, bi('span', copy.pinyin));
    const cardHost = node('div');
    const previous = button('prev', copy.previous), next = button('next', copy.next), skip = button('skip', copy.skip);
    const journey = node('nav'); journey.className = 'vocabulary-actions'; journey.setAttribute('aria-label', bilingualText(copy.navigation)); journey.append(previous, next, skip);
    const skipNote = bi('p', copy.skipNote);
    skipNote.className = 'vocabulary-hint bilingual-stacked';
    const audioPanel = node('section'); audioPanel.className = 'vocabulary-panel';
    const audioStatus = node('p'); audioStatus.id = 'vocabulary-audio-status'; audioStatus.setAttribute('role', 'status');
    const play = button('play', copy.play), pause = button('pause', copy.pause), replay = button('replay', copy.replay);
    const audioActions = node('div'); audioActions.className = 'vocabulary-actions'; audioActions.append(play, pause, replay); audioPanel.append(audioStatus, audioActions);
    exercise.append(position, scope, pinyinLabel, cardHost, audioPanel, journey, skipNote);
    const summary = node('details'); summary.className = 'vocabulary-panel vocabulary-summary'; summary.id = 'vocabulary-summary';
    const summaryTitle = bi('summary', copy.summary), summaryBody = node('div'); summary.append(summaryTitle, summaryBody);
    controls.append(message, exercise, settings, summary, save, saveActions);
    for (const note of article.querySelectorAll(':scope > p, #vocabulary-settings > p')) note.classList.add('bilingual-stacked');
    let key = '', rendered = '';
    const handle = (result: { ok: boolean; message?: string }) => { if (result.ok) message.replaceChildren(); else setBilingual(message, dynamic.actionIssue(result.message)); return result.ok; };
    const focusCard = () => cardHost.querySelector<HTMLElement>('h2')?.focus();
    const on = (target: HTMLElement, event: string, action: () => void) => target.addEventListener(event, action, { signal: lifetime.signal });
    const preferences = (patch: Parameters<typeof controller.setPreferences>[0]) => { handle(controller.setPreferences(patch)); update(); };
    for (const input of inputs.values()) on(input, 'change', () => preferences({ lessons: [...inputs].filter(([, value]) => value.checked).map(([id]) => id) }));
    on(all, 'click', () => preferences({ lessons: content.lessons.map(lesson => lesson.id) }));
    on(none, 'click', () => preferences({ lessons: [] }));
    on(search, 'input', () => { handle(controller.setSearch(search.value)); update(); });
    on(clearSearch, 'click', () => { search.value = ''; handle(controller.setSearch('')); update(); search.focus(); });
    on(filter, 'change', () => preferences({ vocabularyFilter: filter.value as keyof typeof filters }));
    on(direction, 'change', () => preferences({ direction: direction.value as 'zh-vi' | 'vi-zh' }));
    on(shuffle, 'change', () => preferences({ shuffle: shuffle.checked }));
    on(start, 'click', () => { stop(); if (handle(controller.start())) { settings.open = false; update(); focusCard(); } });
    on(due, 'click', () => { stop(); if (handle(controller.start('due'))) { settings.open = false; update(); focusCard(); } });
    on(resume, 'click', () => { settings.open = false; focusCard(); });
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

      setBilingual(audioStatus, !current?.audio ? copy.noSenseAudio : !current.revealed ? copy.revealAudio : playback && snapshot.issue ? dynamic.audioIssue(snapshot.issue) : vocabularyAudioStatus[state]);
      play.disabled = replay.disabled = !current?.audio || !current.revealed || state === 'loading';
      pause.disabled = !playback || !['loading', 'playing', 'paused'].includes(state); setBilingual(pause, state === 'paused' ? copy.continueAudio : copy.pause);
    }
    function begin(): void {
      const current = controller.read().current;
      if (!current?.revealed || !current.audioRecordId) return;
      const request = content.resolveAudio(current.audioRecordId); if (!request) return;
      stop(); playback = new AbortController(); const owner = playback;
      audio.setRate(controller.read().preferences.rate);
      void audio.play(request, { signal: owner.signal }).then(result => {
        if (left || lifetime.signal.aborted || owner.signal.aborted || playback !== owner) return;
        if (!result.ok && result.code !== 'cancelled') setBilingual(message, dynamic.audioIssue(result.issue));
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
      const reveal = button('reveal', copy.reveal); reveal.disabled = current.revealed;
      reveal.addEventListener('click', () => { if (handle(controller.reveal())) { update(); cardHost.querySelector<HTMLElement>('#vocabulary-answer')?.focus(); } }, { signal: cardEvents.signal }); card.append(reveal);
      if (current.revealed) {
        const answer = node('section'); answer.id = 'vocabulary-answer'; answer.tabIndex = -1;
        const target = node('p', current.direction === 'zh-vi' ? current.vi : current.zh); target.lang = current.direction === 'zh-vi' ? 'vi' : 'zh-CN'; target.className = 'vocabulary-target';
        answer.append(target, bi('p', dynamic.meaning(current.senseZh, current.cueZh)));
        answer.append(bi('p', dynamic.category(current.extension, current.category === 'proper_noun')));
        const sources = node('ul'); sources.id = 'vocabulary-sources';
        for (const source of current.sourceRecords) {
          const row = node('li'); const link = bi('a', dynamic.lesson(source.lesson)); link.href = routeHref({ feature: 'textbook', lesson: source.lesson, section: 'vocab' }); link.dataset.routeLink = '';
          row.append(link, document.createTextNode(' · '), bi('span', dynamic.source(source.source.section, source.source.printPages, source.source.pdfPages))); sources.append(row);
        }
        const sourceDetails = node('details'); sourceDetails.className = 'vocabulary-sources';
        sourceDetails.append(bi('summary', copy.sources), sources); answer.append(sourceDetails);
        const examples = content.examplesForSense(current.senseId);
        if (examples.length) {
          const details = node('details'); details.id = 'vocabulary-examples'; details.className = 'vocabulary-examples';
          details.append(bi('summary', dynamic.examples(examples.length)));
          const list = node('ul');
          for (const example of examples) {
            const item = node('li'); item.dataset.exampleId = example.id;
            const zh = node('p', example.zh); zh.lang = 'zh-CN'; zh.className = 'vocabulary-example-zh';
            const py = node('p', example.py); py.lang = 'zh-Latn'; py.className = 'vocabulary-example-pinyin';
            const vi = node('p', example.vi); vi.lang = 'vi';
            const source = bi('a', dynamic.exampleSource(example.lesson, example.section === 'text'));
            source.href = routeHref({ feature: 'textbook', lesson: example.lesson, section: example.section }); source.dataset.routeLink = '';
            item.append(zh, py, vi, source); list.append(item);
          }
          details.append(list); answer.append(details);
        } else {
          const noExample = bi('p', copy.noSenseExample);
          noExample.id = 'vocabulary-no-examples'; noExample.className = 'vocabulary-hint'; answer.append(noExample);
        }
        card.append(answer);
      }
      const rateActions = node('div'); rateActions.className = 'vocabulary-actions';
      rateActions.setAttribute('aria-label', bilingualText(copy.optionalRating));
      for (const [value, text] of Object.entries(ratings)) {
        const rate = button(value, text); rate.disabled = !current.revealed || !!current.rating;
        rate.addEventListener('click', () => { if (handle(controller.rate(value as keyof typeof ratings))) { update(); next.focus(); } }, { signal: cardEvents.signal }); rateActions.append(rate);
      }
      if (current.revealed) { const ratingNote = bi('p', copy.optionalRating); ratingNote.className = 'vocabulary-hint'; card.append(ratingNote); }
      rateActions.hidden = !current.revealed; card.append(rateActions);
      if (current.rating) {
        const note = bi('p', dynamic.rating(current.rating.rating, current.rating.schedule.dueAt, current.rating.early));
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
      setBilingual(available, !model.preferences.lessons.length ? copy.selectOne : dynamic.available(model.preferences.lessons, model.available.mergedCount, model.available.distinctForms, model.availableCount, model.search));
      start.disabled = model.availableCount === 0; due.disabled = model.dueCount === 0; clearSearch.disabled = search.value.length === 0;
      resume.hidden = !current; setBilingual(resume, dynamic.resume(review?.position));
      exercise.hidden = !current;
      if (review) setBilingual(position, dynamic.position(review.position, review.senseIds.length)); else position.replaceChildren();
      if (review) setBilingual(scope, dynamic.scope(review.lessons, review.filter, review.direction, review.search)); else scope.replaceChildren();
      previous.disabled = !review || review.position === 0; next.disabled = skip.disabled = !review || review.position >= review.senseIds.length - 1;
      const stats = model.summary;
      summaryBody.replaceChildren(bi('p', dynamic.total(stats.rated, stats.totalSenses, stats.unfamiliar, stats.wrong, stats.due)), bi('p', dynamic.round(stats.review.rated, stats.review.total, stats.review.done)), bi('p', copy.schedule));
      for (const note of summaryBody.querySelectorAll('p')) note.classList.add('bilingual-stacked');
      const snapshot = session.store.snapshot(); save.dataset.state = snapshot.status;
      setBilingual(save, vocabularySaveStatus[snapshot.status]); if (snapshot.issue) save.append(document.createTextNode(' '), bi('span', dynamic.saveIssue(snapshot.issue)));
      retry.hidden = ['empty', 'saved', 'saving'].includes(snapshot.status) || (snapshot.status === 'unsaved' && !snapshot.issue); retry.disabled = !snapshot.canWrite || snapshot.status === 'saving';
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
