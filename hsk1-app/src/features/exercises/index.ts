import type { FeatureModule, Route } from '../../app/contracts.ts';
import { normalizeRoute } from '../../app/router.ts';
import { routeLink, element, button } from '../textbook/dom.ts';
import { loadExercises, exerciseAudio } from '../../services/content/exercises.ts';
import { bilingualNode, bilingualText, setBilingual, type BilingualCopy } from '../../app/bilingual.ts';
import { exerciseCopy as copy, exerciseSets, exerciseGroups, exerciseFilters, exerciseSaveStates, exerciseAudioStates, exerciseText, exerciseIssue } from '../../app/i18n/exercises.ts';
import '../../app/bilingual.css';
import type { ExerciseFilter, ExerciseGroup, ExerciseSet } from '../../domain/exercises/catalogue.ts';
import { answerExercise, exerciseQueue, exerciseReview, exerciseScope, exerciseTotals, isSubmitted, restartExercise, submitExercise } from '../../domain/exercises/engine.ts';
import { AUDIO_RATES } from '../../services/audio/index.ts';
import './exercises.css';

const bilingualButton = (copy: BilingualCopy, action: () => void, signal: AbortSignal, id?: string) => {
  const node = button('', action, signal); if (id) node.id = id; setBilingual(node, copy); return node;
};
const bilingualLink = (copy: BilingualCopy, route: Route) => {
  const node = routeLink('', route); setBilingual(node, copy); return node;
};

export const mount: FeatureModule['mount'] = (host, context) => {
  const root = element('article'); root.className = 'module-entry exercises'; root.id = 'exercises-module';
  const heading = bilingualNode('h1', copy.title); heading.tabIndex = -1;
  const loading = bilingualNode('p', copy.loading); root.append(heading, loading); host.append(root);
  const lifetime = new AbortController(); const close = () => lifetime.abort();
  context.signal.addEventListener('abort', close, { once: true }); if (context.signal.aborted) close();
  let left = false, disposeDraft = () => {}, disposeStore = () => {}, disposeAudio = () => {}, flush = () => {}, stopAudio = () => {}, collect = () => false;
  let viewLifetime: AbortController | undefined;
  let isComposing = () => false;
  const ready = Promise.resolve().then(async () => {
    if (!context.learning || !context.audio) throw new Error('Learning services unavailable.');
    const [catalogue, session, audio] = await Promise.all([loadExercises(lifetime.signal), context.learning(), context.audio()]);
    if (left || lifetime.signal.aborted) return;
    loading.remove(); flush = () => { void session.flush(); }; stopAudio = () => audio.stop();
    const set: ExerciseSet = context.route.exerciseSet ?? 'original';
    const group: ExerciseGroup = context.route.exerciseGroup ?? (set === 'pilot' ? 'words' : 'choice');
    const filter: ExerciseFilter = context.route.exerciseFilter ?? (set === 'homework-review' ? 'wrong' : 'all');
    const lesson = set === 'pilot' ? 9 : context.route.lesson;
    setBilingual(heading, set === 'pilot' ? copy.pilotTitle : set === 'homework-review' ? copy.reviewTitle : copy.originalTitle);
    const route = (changes: Partial<Route>): Route => ({ feature: 'exercises', lesson, exerciseSet: set, exerciseGroup: group, exerciseFilter: filter, ...changes });
    const state = () => session.store.snapshot().data.exercises;
    const edit = (action: (draft: ReturnType<typeof state>) => void) => { session.store.edit(data => action(data.exercises)); session.requestSave(); };
    const visitedRoute = normalizeRoute(context.route);
    if (JSON.stringify(session.store.snapshot().data.navigation) !== JSON.stringify(visitedRoute)) { session.store.edit(data => { data.navigation = visitedRoute; }); session.requestSave(); }
    const snapshot = session.store.snapshot().data;
    let queue = exerciseQueue(catalogue, snapshot.exercises, { set, lesson, group, filter, homework: snapshot.homework });
    const scope = exerciseScope({ set, lesson, group }, filter);
    let position = Math.max(0, queue.findIndex(entry => entry.id === state().positions[scope]));
    const allEntries = catalogue.entries.filter(entry => entry.set === set && entry.lesson === lesson && entry.group === group);
    const introduction = bilingualNode('p', set === 'homework-review' ? copy.reviewIntroduction : copy.introduction); introduction.className = 'bilingual-stacked exercise-introduction'; root.append(introduction);
    const sets = element('nav'); sets.setAttribute('aria-label', bilingualText(copy.sets)); sets.className = 'exercise-tabs exercise-set-tabs';
    for (const next of ['original', 'pilot', 'homework-review'] as const) {
      const link = bilingualLink(exerciseSets[next], route({ exerciseSet: next, exerciseGroup: undefined, exerciseFilter: undefined, lesson: next === 'pilot' ? 9 : lesson }));
      link.dataset.exerciseSet = next; if (next === set) link.setAttribute('aria-current', 'page'); sets.append(link);
    }
    const settings = element('div'); settings.className = 'exercise-settings';
    const filterLabel = bilingualNode('label', copy.filter); const selectFilter = element('select'); selectFilter.id = 'exercise-filter';
    for (const value of ['all', 'wrong', 'due'] as const) { const option = element('option', bilingualText(exerciseFilters[value])); option.value = value; selectFilter.append(option); }
    selectFilter.value = filter; filterLabel.append(selectFilter); selectFilter.addEventListener('change', () => { if (collect()) { selectFilter.value = filter; return; } context.navigate(route({ exerciseFilter: selectFilter.value as ExerciseFilter })); }, { signal: lifetime.signal });
    settings.append(filterLabel); // The shell already owns the one visible lesson picker.
    const groups = element('nav'); groups.className = 'exercise-tabs exercise-group-tabs'; groups.setAttribute('aria-label', bilingualText(copy.groups));
    for (const next of [...new Set(catalogue.entries.filter(e => e.set === set && e.lesson === lesson).map(e => e.group))]) {
      const label = next === 'translation' ? set === 'original' ? copy.translationChoice : copy.translationManual : exerciseGroups[next];
      const link = bilingualLink(label, route({ exerciseGroup: next })); link.dataset.exerciseGroup = next; if (next === group) link.setAttribute('aria-current', 'page'); groups.append(link);
    }
    const summary = element('p'); summary.id = 'exercise-summary'; summary.className = 'bilingual-stacked';
    const save = element('p'); save.id = 'exercise-save-status'; save.className = 'bilingual-stacked'; save.setAttribute('role', 'status');
    const retrySave = bilingualButton(copy.retrySave, () => { void session.flush(); }, lifetime.signal); retrySave.id = 'exercise-save-retry';
    const saveActions = element('div'); saveActions.className = 'exercise-save-actions'; saveActions.append(retrySave, bilingualLink(copy.backup, { feature: 'progress', lesson }));
    const message = element('p'); message.id = 'exercise-message'; message.className = 'bilingual-stacked'; message.setAttribute('role', 'status');
    const questionHost = element('section'); questionHost.className = 'exercise-question';
    const navigator = element('nav'); navigator.className = 'exercise-navigator'; navigator.setAttribute('aria-label', bilingualText(copy.navigator));
    const refresh = bilingualButton(copy.refresh, () => { if (collect()) return; audio.stop(); queue = exerciseQueue(catalogue, state(), { set, lesson, group, filter, homework: session.store.snapshot().data.homework }); position = 0; render(); }, lifetime.signal); refresh.id = 'exercise-refresh';
    const secondary = element('div'); secondary.className = 'exercise-secondary';
    if (group === 'translation') {
      const writing = element('nav'); writing.className = 'study-paths';
      writing.append(bilingualLink(copy.choicePath, { feature: 'exercises', lesson, exerciseSet: 'original', exerciseGroup: 'translation' }), bilingualLink(copy.writingPath, { feature: 'homework', lesson, part: 'translation' }));
      secondary.append(writing);
    }
    const setup = element('div'); setup.className = 'exercise-setup'; setup.append(sets, settings);
    root.append(setup, groups, navigator, message, questionHost, secondary, summary, save, saveActions, refresh);
    root.addEventListener('click', event => { if ((event.target as Element).closest('a[data-route-link]') && collect()) { event.preventDefault(); event.stopPropagation(); } }, { capture: true, signal: lifetime.signal });
    if (set === 'pilot') for (const activity of catalogue.oral) {
      const speaking = element('details'); speaking.className = 'exercise-oral'; speaking.append(bilingualNode('summary', copy.oral), element('h2', activity.title), element('p', activity.prompt));
      activity.stems.forEach(stem => { const line = element('p', stem); line.lang = 'zh-CN'; speaking.append(line); }); speaking.append(element('p', activity.note)); root.append(speaking);
    }
    function updateStatus() {
      const current = session.store.snapshot(); const totals = exerciseTotals(catalogue, current.data.exercises, allEntries);
      setBilingual(summary, totals.manual ? exerciseText.manualSummary(totals.manualSubmitted, totals.manual) : exerciseText.automaticSummary(totals.submitted, totals.automatic, totals.firstCorrect, totals.latestCorrect));
      setBilingual(save, current.issue ? exerciseIssue(current.issue, exerciseSaveStates[current.status]) : exerciseSaveStates[current.status]); save.dataset.state = current.status; save.dataset.hasIssue = String(!!current.issue); retrySave.hidden = !['conflict', 'unavailable', 'corrupt'].includes(current.status) && !(current.status === 'unsaved' && current.issue);
    }
    disposeStore = session.store.subscribe(updateStatus); updateStatus();
    function move(index: number) { if (collect()) return; audio.stop(); position = index; const entry = queue[position]; if (entry) edit(draft => { draft.positions[scope] = entry.id; }); render(); }
    function showWritingSheet() {
      if (collect()) return;
      const data = session.store.snapshot().data; const sheet = element('section'); sheet.className = 'exercise-writing-sheet'; sheet.id = 'exercise-writing-sheet'; sheet.tabIndex = -1;
      const title = exerciseText.sheetTitle(lesson, set), profile = exerciseText.profile(data.homework.profile.name, data.homework.profile.className);
      const lines = [bilingualText(title), bilingualText(profile), bilingualText(copy.teacherSheet)];
      sheet.append(bilingualNode('h2', title), bilingualNode('p', profile), bilingualNode('p', copy.teacherSheet));
      allEntries.forEach((entry, index) => {
        const task = catalogue.tasks.get(entry.authorityId)!; const latest = data.exercises.records[task.id]?.submissions.at(-1); const draft = data.exercises.drafts[task.id];
        const answer = typeof draft === 'string' ? draft : typeof latest?.answer === 'string' ? latest.answer : '';
        const status = typeof draft === 'string' ? copy.draft : latest ? copy.writingSaved : copy.notWritten;
        lines.push(`${index + 1}. ${entry.prompt ?? task.prompt}`, `${bilingualText(status)}: ${answer || bilingualText(copy.noAnswer)}`);
        sheet.append(element('h3', `${index + 1}. ${entry.prompt ?? task.prompt}`), bilingualNode('p', status)); const text = answer ? element('p', answer) : bilingualNode('p', copy.noAnswer); if (answer) text.lang = 'zh-CN'; text.className = 'exercise-written-answer'; sheet.append(text);
      });
      const controls = element('div'); controls.className = 'exercise-sheet-controls';
      controls.append(bilingualButton(copy.copySheet, () => { void navigatorClipboard(lines.join('\n\n')); }, lifetime.signal, 'exercise-sheet-copy'), bilingualButton(copy.printSheet, () => window.print(), lifetime.signal, 'exercise-sheet-print'), bilingualButton(copy.closeSheet, () => { sheet.remove(); questionHost.hidden = false; questionHost.querySelector<HTMLElement>('h2')?.focus(); }, lifetime.signal, 'exercise-sheet-close'));
      sheet.prepend(controls); root.querySelector('#exercise-writing-sheet')?.remove(); root.append(sheet); questionHost.hidden = true; sheet.focus();
    }
    async function navigatorClipboard(text: string) { try { await window.navigator.clipboard.writeText(text); setBilingual(message, copy.copied); } catch { setBilingual(message, copy.copyFailed); } }
    function render() {
      collect = () => false; isComposing = () => false; viewLifetime?.abort(); viewLifetime = new AbortController();
      const signal = viewLifetime.signal;
      disposeAudio(); disposeAudio = () => {};
      questionHost.replaceChildren(); questionHost.hidden = false; navigator.replaceChildren(); root.querySelector('#exercise-writing-sheet')?.remove();
      const entry = queue[position];
      if (!entry) { questionHost.append(bilingualNode('h2', filter === 'all' ? copy.noGroupQuestions : copy.noMatchingQuestions), bilingualNode('p', filter === 'all' ? copy.chooseAnotherGroup : copy.queueRules)); return; }
      const task = catalogue.tasks.get(entry.authorityId)!;
      const current = state(), submitted = isSubmitted(current, task.id), latest = current.records[task.id]?.submissions.at(-1);
      const answer = submitted ? latest?.answer : current.drafts[task.id];
      queue.forEach((item, index) => { const jump = button(String(index + 1), () => move(index), signal); jump.setAttribute('aria-label', bilingualText(exerciseText.openQuestion(index + 1))); if (index === position) jump.setAttribute('aria-current', 'step'); jump.dataset.exerciseEntry = item.id; navigator.append(jump); });
      const title = bilingualNode('h2', exerciseText.question(position + 1, queue.length, group)); title.dataset.oldQuestionId = entry.oldId; questionHost.dataset.exerciseEntry = entry.id; title.tabIndex = -1; questionHost.append(title);
      if (entry.passageId) { const passage = catalogue.passages[entry.passageId]!; const block = element('section'); block.className = 'exercise-passage'; block.append(bilingualNode('h3', copy.readPassage)); for (const line of passage.lines) { const p = element('p', line); p.lang = 'zh-CN'; block.append(p); } questionHost.append(block); }
      questionHost.append(element('p', entry.prompt ?? task.prompt));
      if (entry.stem ?? task.stem) { const stem = element('p', entry.stem ?? task.stem); stem.className = 'exercise-hanzi'; questionHost.append(stem); }
      if (entry.meaning ?? task.meaning) questionHost.append(element('p', entry.meaning ?? task.meaning));
      const source = bilingualNode('p', exerciseText.source(entry.source, lesson)); source.className = 'exercise-source bilingual-stacked'; questionHost.append(source);
      if (task.kind === 'choice' && task.audio) {
        const player = element('div'); player.className = 'exercise-player'; const audioStatus = element('p'); audioStatus.setAttribute('role', 'status');
        const playCurrent = () => { const request = exerciseAudio(catalogue, task.id); if (request) void audio.play(request, { signal }).then(result => { if (!signal.aborted && !result.ok && result.code !== 'cancelled') setBilingual(message, result.issue ? exerciseIssue(result.issue, copy.audioFailed) : copy.audioFailed); }); };
        const play = bilingualButton(copy.play, playCurrent, signal); play.id = 'exercise-audio-play';
        const rate = element('select'); rate.setAttribute('aria-label', bilingualText(copy.audioRate)); AUDIO_RATES.forEach(value => { const option = element('option', `${value}×`); option.value = String(value); rate.append(option); }); rate.value = String(audio.snapshot().rate); rate.addEventListener('change', () => audio.setRate(Number(rate.value)), { signal });
        player.append(play, bilingualButton(copy.pause, () => audio.pause(), signal), bilingualButton(copy.resume, () => { const current = audio.snapshot().request; const request = exerciseAudio(catalogue, task.id); if (audio.snapshot().status === 'paused' && current?.url === request?.url && current?.start === request?.start && current?.end === request?.end) void audio.resume(); else playCurrent(); }, signal), bilingualButton(copy.replay, playCurrent, signal, 'exercise-audio-replay'), rate, audioStatus); questionHost.append(player);
        const updateAudio = () => { const snap = audio.snapshot(); setBilingual(audioStatus, snap.issue ? exerciseIssue(snap.issue, copy.audioFailed) : exerciseAudioStates[snap.status]); audioStatus.dataset.state = snap.status; }; disposeAudio = audio.subscribe(updateAudio); updateAudio();
      }
      if (task.kind === 'choice') {
        const choices = element('fieldset'); choices.append(bilingualNode('legend', copy.chooseAnswer)); choices.disabled = submitted;
        for (const index of entry.optionOrder ?? task.options.map((_, index) => index)) {
          const label = element('label'); const input = element('input'); input.type = 'radio'; input.name = 'exercise-answer'; input.value = String(index); input.checked = answer === index;
          input.addEventListener('change', () => edit(draft => { answerExercise(draft, task, index); }), { signal }); label.append(input, document.createTextNode(task.options[index]!)); choices.append(label);
        } questionHost.append(choices);
      } else if (task.kind === 'sort') {
        const selected = Array.isArray(answer) ? answer : []; const chosen = element('div'); chosen.className = 'exercise-tokens'; chosen.dataset.exerciseTokens = 'chosen'; chosen.setAttribute('aria-label', bilingualText(copy.chosenTokens));
        const available = element('div'); available.className = 'exercise-tokens'; available.dataset.exerciseTokens = 'available'; available.setAttribute('aria-label', bilingualText(copy.availableTokens));
        const update = (next: number[]) => { edit(draft => { answerExercise(draft, task, next); }); render(); };
        selected.forEach((index, selectedIndex) => { const token = button(task.tokens[index]!, () => update(selected.filter((_, i) => i !== selectedIndex)), signal); token.disabled = submitted; chosen.append(token); });
        for (const index of entry.tokenOrder ?? task.tokens.map((_, i) => i)) if (!selected.includes(index)) { const token = button(task.tokens[index]!, () => update([...selected, index]), signal); token.disabled = submitted; available.append(token); }
        questionHost.append(bilingualNode('p', copy.sortHint), chosen, available);
      } else {
        const label = bilingualNode('label', copy.writeChinese); const input = element('textarea'); input.id = 'exercise-writing'; input.lang = 'zh-CN'; input.maxLength = 4000; input.rows = 5; input.disabled = submitted; input.value = typeof answer === 'string' ? answer : ''; label.htmlFor = input.id; label.append(input); questionHost.append(label, bilingualNode('p', copy.manualHint));
        let composing = false; isComposing = () => composing;
        collect = () => { if (submitted) return false; if (input.value.length > 4000) { setBilingual(message, copy.writingTooLong); return true; } if ((state().drafts[task.id] ?? '') !== input.value) edit(draft => { answerExercise(draft, task, input.value); }); return false; };
        input.addEventListener('compositionstart', () => { composing = true; input.removeAttribute('maxlength'); }, { signal }); input.addEventListener('compositionend', () => { composing = false; input.maxLength = 4000; collect(); }, { signal }); input.addEventListener('input', () => { if (!composing) collect(); }, { signal });
        questionHost.append(bilingualButton(copy.showSheet, showWritingSheet, signal, 'exercise-sheet-show'));
      }
      const feedback = element('div'); feedback.id = 'exercise-feedback'; feedback.setAttribute('role', 'status');
      if (submitted && latest) {
        feedback.dataset.result = latest.correct === null ? 'manual' : latest.correct ? 'correct' : 'incorrect';
        feedback.append(bilingualNode('h3', latest.correct === null ? copy.manualFeedback : latest.correct ? copy.correct : copy.incorrect));
        if (task.kind !== 'manual') {
          feedback.append(element('p', entry.explanation ?? task.explanation));
          feedback.append(bilingualNode('p', exerciseText.answer(task.kind === 'choice' ? task.options[task.answer]! : task.answers.join(' / '))));
          if (task.kind === 'choice' && task.transcript) { const transcript = element('p', task.transcript); transcript.lang = 'zh-CN'; feedback.append(transcript, element('p', task.pinyin)); }
          const review = exerciseReview(state(), task, session.store.snapshot().data.homework); if (review?.dueAt) feedback.append(bilingualNode('p', exerciseText.reviewAt(review.dueAt)));
        }
      }
      const submit = bilingualButton(submitted ? copy.redo : task.kind === 'manual' ? copy.submitWriting : copy.submit, () => {
        if (isComposing()) { setBilingual(message, copy.finishComposing); return; }
        if (collect()) return;
        try { if (isSubmitted(state(), task.id)) { edit(draft => { restartExercise(draft, task); }); setBilingual(message, copy.restarted); }
          else { const at = Date.now(), homeworkAtReview = session.store.snapshot().data.homework; if (!submitExercise(state(), task, at, homeworkAtReview)) { setBilingual(message, copy.incomplete); return; } edit(draft => { submitExercise(draft, task, at, homeworkAtReview); }); setBilingual(message, task.assessment === 'manual' ? copy.manualSubmitted : copy.submitted); }
          render();
        } catch (error) { setBilingual(message, error instanceof Error ? exerciseIssue(error.message, copy.submitFailed) : copy.submitFailed); }
      }, signal); submit.id = 'exercise-submit'; submit.dataset.action = submitted ? 'redo' : task.kind === 'manual' ? 'save-writing' : 'submit';
      const previous = bilingualButton(copy.previous, () => move(position - 1), signal); previous.id = 'exercise-previous'; previous.disabled = position === 0;
      const next = bilingualButton(copy.next, () => move(position + 1), signal); next.id = 'exercise-next'; next.disabled = position === queue.length - 1;
      const actions = element('div'); actions.className = 'exercise-actions'; actions.append(previous, submit, next); questionHost.append(feedback, actions);
    }
    disposeDraft = session.registerExitDraft(() => collect()); render();
  }).catch(error => { if (!left && !lifetime.signal.aborted) { setBilingual(loading, copy.loadFailed); throw error; } });
  return { ready, unmount() { if (left) return; collect(); left = true; stopAudio(); viewLifetime?.abort(); lifetime.abort(); disposeDraft(); disposeStore(); disposeAudio(); flush(); context.signal.removeEventListener('abort', close); root.remove(); } };
};
