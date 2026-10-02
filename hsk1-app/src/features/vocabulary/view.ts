import { bilingualNode as bi, bilingualText, setBilingual, type BilingualCopy } from '../../app/bilingual.ts';
import { mixedVocabularyCopy as copy } from '../../app/i18n/mixed-vocabulary.ts';
import { vocabularyCopy, vocabularySaveStatus, vocabularyDynamic } from '../../app/i18n/vocabulary.ts';
import type { ModuleContext, MountHandle } from '../../app/contracts.ts';
import type { VocabularyCard } from '../../domain/vocabulary/types.ts';
import { element as node } from '../../app/ui.ts';
import { routeHref } from '../../app/router.ts';
import { loadVocabulary } from '../../services/content/vocabulary.ts';
import { createMixedVocabularyController } from '../../domain/vocabulary/mixed-controller.ts';
import '../../app/bilingual.css';
import './vocabulary.css';

function button(id: string, text: BilingualCopy): HTMLButtonElement {
  const result = bi('button', text); result.id = `vocabulary-${id}`; result.type = 'button'; return result;
}
/** Faces are ephemeral. Only applied scope, immutable order and first-visible anchor are saved. */
export function mountVocabulary(host: HTMLElement, context: ModuleContext, feature: 'vocabulary' | 'review'): MountHandle {
  const article = node('article'); article.id = 'vocabulary-module'; article.className = 'module-entry mixed-vocabulary';
  const title = bi('h1', copy.title); title.tabIndex = -1;
  const intro = bi('p', copy.intro); intro.className = 'mixed-intro bilingual-stacked';
  const controls = node('fieldset'); controls.dataset.moduleControls = ''; controls.disabled = true;
  article.append(title, intro, controls); host.append(article);
  const lifetime = new AbortController(), abort = () => lifetime.abort();
  context.signal.addEventListener('abort', abort, { once: true }); if (context.signal.aborted) abort();
  let left = false, unsubscribe = () => {}, unsubscribeAudio = () => {}, flush = () => {};
  let playback: AbortController | undefined, playingId: string | null = null;
  const faces = new Set<string>();
  const stop = () => { playback?.abort(); playback = undefined; playingId = null; };
  const ready = Promise.resolve().then(async () => {
    if (!context.learning || !context.audio) throw new Error('Learning services unavailable.');
    const [content, session, audio] = await Promise.all([loadVocabulary(lifetime.signal), context.learning(), context.audio()]);
    if (left || lifetime.signal.aborted) return;
    const controller = createMixedVocabularyController({ session, catalog: content.catalog });
    controller.visit(context.route.lesson, feature); flush = () => { void session.flush(); };
    const medium = window.matchMedia('(min-width: 700px)'), large = window.matchMedia('(min-width: 1050px)');
    const capacity = () => large.matches ? 6 : medium.matches ? 4 : 1;
    let pageSize = capacity(), viewportWidth = window.innerWidth, renderedKey = '';
    const settings = node('details'); settings.id = 'vocabulary-settings'; settings.className = 'mixed-settings';
    settings.open = !controller.read().round;
    const settingsLabel = bi('summary', copy.settings); settings.append(settingsLabel);
    const picker = node('div'); picker.className = 'mixed-picker';
    const lessonTitle = bi('h2', copy.lessons); lessonTitle.id = 'vocabulary-lesson-title';
    const lessonGrid = node('div'); lessonGrid.className = 'mixed-lessons'; lessonGrid.setAttribute('role', 'group'); lessonGrid.setAttribute('aria-labelledby', lessonTitle.id);
    const inputs = new Map<number, HTMLInputElement>();
    for (const lesson of content.lessons) {
      const label = node('label'), input = node('input'); input.type = 'checkbox'; input.dataset.vocabularyLesson = String(lesson.id); input.id = `vocabulary-lesson-${lesson.id}`;
      label.append(input, bi('span', copy.lesson(lesson.id))); lessonGrid.append(label); inputs.set(lesson.id, input);
    }
    const all = button('all', copy.all), none = button('none', copy.none);
    const selectActions = node('div'); selectActions.className = 'mixed-selection-actions'; selectActions.append(all, none);
    const available = node('p'); available.id = 'vocabulary-available'; available.className = 'bilingual-stacked'; available.setAttribute('role', 'status');
    const pending = bi('p', copy.pending); pending.id = 'vocabulary-pending'; pending.className = 'mixed-note bilingual-stacked';
    const start = button('start', copy.start), cancel = button('cancel', copy.cancel); start.className = 'primary';
    const startActions = node('div'); startActions.className = 'mixed-start-actions'; startActions.append(start, cancel);
    picker.append(lessonTitle, lessonGrid, selectActions, available, pending, startActions); settings.append(picker);
    const legacy = bi('p', copy.legacy); legacy.id = 'vocabulary-legacy'; legacy.className = 'mixed-notice bilingual-stacked';
    const message = node('p'); message.id = 'vocabulary-message'; message.className = 'mixed-notice bilingual-stacked'; message.setAttribute('role', 'status'); message.hidden = true;
    const exercise = node('section'); exercise.id = 'vocabulary-exercise'; exercise.setAttribute('aria-labelledby', 'vocabulary-position');
    const meta = node('div'); meta.className = 'mixed-round-meta';
    const position = node('p'); position.id = 'vocabulary-position'; position.className = 'bilingual-stacked'; position.setAttribute('aria-live', 'polite');
    const scope = node('p'); scope.id = 'vocabulary-queue-scope'; scope.className = 'mixed-note bilingual-stacked'; meta.append(position, scope);
    const hint = bi('p', copy.hint); hint.id = 'vocabulary-flip-hint'; hint.className = 'mixed-hint bilingual-stacked';
    const grid = node('div'); grid.id = 'vocabulary-grid'; grid.className = 'mixed-card-grid';
    const previous = button('prev', copy.previous(pageSize === 1)), next = button('next', copy.next(pageSize === 1));
    const journey = node('nav'); journey.className = 'mixed-navigation'; journey.setAttribute('aria-label', bilingualText(copy.navigation)); journey.append(previous, next);
    const last = bi('p', copy.last(pageSize === 1)); last.id = 'vocabulary-last'; last.className = 'mixed-note bilingual-stacked';
    const reshuffle = button('reshuffle', copy.reshuffle); reshuffle.className = 'mixed-reshuffle';
    const ending = node('div'); ending.className = 'mixed-ending'; ending.append(last, reshuffle);
    const audioStatus = node('p'); audioStatus.id = 'vocabulary-audio-status'; audioStatus.className = 'mixed-note bilingual-stacked'; audioStatus.setAttribute('role', 'status'); audioStatus.hidden = true;
    exercise.append(meta, grid, hint, journey, ending, audioStatus);
    const save = node('p'); save.id = 'vocabulary-save-status'; save.className = 'mixed-save bilingual-stacked'; save.setAttribute('role', 'status');
    const retry = button('retry-save', vocabularyCopy.retry), backups = bi('a', vocabularyCopy.backups);
    backups.href = routeHref({ feature: 'progress', lesson: context.route.lesson }); backups.dataset.routeLink = '';
    const saveActions = node('div'); saveActions.className = 'mixed-save-actions'; saveActions.append(retry, backups);
    controls.append(settings, legacy, message, exercise, save, saveActions);
    const on = (target: EventTarget, event: string, action: EventListener) => target.addEventListener(event, action, { signal: lifetime.signal });
    const handle = (result: { ok: boolean; message?: string }) => { message.hidden = result.ok; if (!result.ok) setBilingual(message, vocabularyDynamic.actionIssue(result.message)); return result.ok; };
    const focusCard = () => grid.querySelector<HTMLButtonElement>('.mixed-card-toggle')?.focus();
    const resetFaces = () => { stop(); faces.clear(); renderedKey = ''; audioStatus.hidden = true; };
    const apply = () => { resetFaces(); if (handle(controller.start())) { settings.open = false; update(); focusCard(); } };
    for (const input of inputs.values()) on(input, 'change', () => { handle(controller.setLessons([...inputs].filter(([, box]) => box.checked).map(([id]) => id))); update(); });
    on(all, 'click', () => { handle(controller.setLessons(content.lessons.map(lesson => lesson.id))); update(); });
    on(none, 'click', () => { handle(controller.setLessons([])); update(); });
    on(start, 'click', apply);
    on(cancel, 'click', () => { const round = controller.read().round; if (round) controller.setLessons(round.lessons); settings.open = false; update(); focusCard(); });
    on(reshuffle, 'click', () => { const round = controller.read().round; if (round) controller.setLessons(round.lessons); apply(); });
    const move = (delta: number) => {
      const round = controller.read().round; if (!round) return;
      const nextAnchor = Math.max(0, Math.min(round.anchor + delta, round.senseIds.length - 1));
      if (nextAnchor === round.anchor || delta > 0 && round.anchor + pageSize >= round.senseIds.length) return;
      resetFaces(); if (handle(controller.move(nextAnchor))) { update(); focusCard(); }
    };
    on(previous, 'click', () => move(-pageSize)); on(next, 'click', () => move(pageSize));
    // Arrow navigation is scoped to the card surface. Lesson controls retain native keyboard behavior.
    on(grid, 'keydown', event => {
      const key = event as KeyboardEvent;
      if (!(key.target instanceof Element) || !key.target.matches('.mixed-card-toggle') || key.altKey || key.ctrlKey || key.metaKey || key.shiftKey) return;
      if (key.key === 'ArrowRight') { key.preventDefault(); move(pageSize); }
      if (key.key === 'ArrowLeft') { key.preventDefault(); move(-pageSize); }
    });
    on(retry, 'click', () => { void session.flush(); });
    const resize = () => {
      const size = capacity(), width = window.innerWidth;
      if (size !== pageSize || width !== viewportWidth) {
        const focused = document.activeElement?.closest<HTMLElement>('.mixed-card')?.dataset.senseId;
        pageSize = size; viewportWidth = width; resetFaces(); update();
        if (focused) {
          const target = [...grid.querySelectorAll<HTMLElement>('.mixed-card')].find(card => card.dataset.senseId === focused)?.querySelector<HTMLButtonElement>('.mixed-card-toggle');
          if (target) target.focus(); else focusCard();
        }
      }
    };
    on(medium, 'change', resize); on(large, 'change', resize); on(window, 'resize', resize);
    function updateAudio(): void {
      if (left || lifetime.signal.aborted) return;
      const snapshot = audio.snapshot(), active = playback && !playback.signal.aborted;
      if (active && snapshot.issue) { audioStatus.hidden = false; setBilingual(audioStatus, vocabularyDynamic.audioIssue(snapshot.issue)); }
      for (const play of grid.querySelectorAll<HTMLButtonElement>('[data-mixed-play]')) {
        const playing = active && playingId === play.dataset.mixedPlay && ['loading', 'playing'].includes(snapshot.status);
        setBilingual(play, playing ? copy.stop : copy.play); play.setAttribute('aria-pressed', String(!!playing));
      }
    }
    function playCard(card: VocabularyCard): void {
      if (!faces.has(card.senseId) || !card.audioRecordId) return;
      if (playingId === card.senseId && playback && ['loading', 'playing'].includes(audio.snapshot().status)) { stop(); updateAudio(); return; }
      const request = content.resolveAudio(card.audioRecordId); if (!request) return;
      stop(); audioStatus.hidden = true; playback = new AbortController(); playingId = card.senseId; const owner = playback;
      audio.setRate(1);
      void audio.play(request, { signal: owner.signal }).then(result => {
        if (left || lifetime.signal.aborted || owner.signal.aborted || playback !== owner) return;
        if (!result.ok && result.code !== 'cancelled') { audioStatus.hidden = false; setBilingual(audioStatus, vocabularyDynamic.audioIssue(result.issue)); }
        updateAudio();
      }); updateAudio();
    }
    function renderCard(card: VocabularyCard): HTMLElement {
      const shell = node('article'); shell.className = 'mixed-card'; shell.dataset.senseId = card.senseId;
      const flip = node('button'); flip.type = 'button'; flip.className = 'mixed-card-toggle';
      flip.setAttribute('aria-describedby', hint.id); flip.setAttribute('aria-pressed', String(faces.has(card.senseId)));
      const face = node('span');
      if (faces.has(card.senseId)) {
        face.className = 'mixed-card-back';
        const py = node('span', card.py); py.lang = 'zh-Latn'; py.className = 'mixed-pinyin';
        const meaning = node('span', card.vi); meaning.lang = 'vi'; meaning.className = 'mixed-meaning'; face.append(py, meaning);
      } else {
        face.className = 'mixed-card-front'; face.lang = 'zh-CN'; face.textContent = card.zh;
        face.dataset.length = String([...card.zh].length > 5 ? 'long' : [...card.zh].length > 3 ? 'medium' : 'short');
      }
      flip.append(face); shell.append(flip);
      // The other face is never present in the DOM, including the accessibility tree.
      flip.addEventListener('click', () => {
        if (faces.has(card.senseId)) { faces.delete(card.senseId); if (playingId === card.senseId) { stop(); audioStatus.hidden = true; } } else faces.add(card.senseId);
        const replacement = renderCard(card); shell.replaceWith(replacement); replacement.querySelector<HTMLButtonElement>('.mixed-card-toggle')?.focus(); updateAudio();
      });
      if (faces.has(card.senseId)) {
        const audioRow = node('div'); audioRow.className = 'mixed-card-audio';
        if (card.audioRecordId) {
          const play = bi('button', copy.play); play.type = 'button'; play.dataset.mixedPlay = card.senseId; play.setAttribute('aria-pressed', 'false');
          play.addEventListener('click', event => { event.stopPropagation(); playCard(card); }); audioRow.append(play);
        } else { const note = bi('span', copy.noAudio); note.className = 'mixed-note bilingual-stacked'; audioRow.append(note); }
        shell.append(audioRow);
      }
      return shell;
    }
    function update(): void {
      if (left || lifetime.signal.aborted) return;
      const model = controller.read(), round = model.round;
      for (const [id, input] of inputs) input.checked = model.draftLessons.includes(id);
      setBilingual(available, model.draftLessons.length ? copy.available(model.draftLessons.length, model.available.mergedCount) : copy.empty);
      start.disabled = model.available.mergedCount === 0; setBilingual(start, round ? copy.update : copy.start); cancel.hidden = !round;
      pending.hidden = !round || JSON.stringify(model.draftLessons) === JSON.stringify(round.lessons);
      settingsLabel.replaceChildren();
      if (round) { const summary = bi('span', copy.summary(round.lessons.length, round.senseIds.length)); summary.className = 'mixed-settings-count bilingual-stacked'; settingsLabel.append(summary, bi('span', copy.change)); }
      else settingsLabel.append(bi('span', copy.settings));
      legacy.hidden = !model.legacyPreserved || !!round; exercise.hidden = !round;
      if (round) {
        const end = Math.min(round.anchor + pageSize, round.senseIds.length);
        setBilingual(position, copy.position(round.anchor + 1, end, round.senseIds.length)); setBilingual(scope, copy.scope(round.lessons));
        const key = `${round.id}:${round.anchor}:${pageSize}`;
        if (key !== renderedKey) { resetFaces(); renderedKey = key; grid.replaceChildren(...model.cards.slice(round.anchor, end).map(renderCard)); }
        grid.dataset.columns = String(pageSize === 1 ? 1 : pageSize === 4 ? 2 : 3);
        previous.disabled = round.anchor === 0; next.disabled = end >= round.senseIds.length;
        setBilingual(previous, copy.previous(pageSize === 1)); setBilingual(next, copy.next(pageSize === 1));
        last.hidden = !next.disabled; setBilingual(last, copy.last(pageSize === 1));
      } else { grid.replaceChildren(); renderedKey = ''; }
      const snapshot = session.store.snapshot(); save.dataset.state = snapshot.status; setBilingual(save, vocabularySaveStatus[snapshot.status]);
      if (snapshot.issue) save.append(document.createTextNode(' '), bi('span', vocabularyDynamic.saveIssue(snapshot.issue)));
      const failed = !!snapshot.issue || !['empty', 'saved', 'saving', 'unsaved'].includes(snapshot.status);
      saveActions.hidden = !failed; retry.disabled = !snapshot.canWrite || snapshot.status === 'saving'; updateAudio();
    }
    unsubscribe = session.store.subscribe(update); unsubscribeAudio = audio.subscribe(updateAudio);
    lifetime.signal.addEventListener('abort', stop, { once: true }); update(); controls.disabled = false;
  });
  return { ready, unmount() { if (left) return; left = true; lifetime.abort(); stop(); unsubscribe(); unsubscribeAudio(); flush(); context.signal.removeEventListener('abort', abort); article.remove(); } };
}
