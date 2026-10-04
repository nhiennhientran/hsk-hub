import { projectHomeworkQuestion } from '../../services/content/vi-presentation-state.ts';
import { mountHomework30 } from './index30.ts';
import type { HomeworkPart } from '../../services/content/homework.ts';
import type { FeatureModule } from '../../app/contracts.ts';
import { PARTS } from '../../app/contracts.ts';
import { bilingualText, setBilingual, type BilingualCopy } from '../../app/bilingual.ts';
import { homeworkCopy as copy, homeworkParts, assignmentSaveCopy, assignmentSaveFailed } from '../../app/i18n/homework.ts';
import '../../app/bilingual.css';
import { routeHref } from '../../app/router.ts';
import { loadCourseIndex } from '../../services/content/index.ts';
import { createHomeworkController, HOMEWORK_LIMITS } from './controller.ts';
import { loadHomeworkBank, type HomeworkQuestion, type SortQuestion } from '../../services/content/homework.ts';
import { createReceipt } from './receipt.ts';
import './homework.css';

const MAX_TEXT = HOMEWORK_LIMITS.text;
function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string | BilingualCopy): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (typeof text === 'string') node.textContent = text;
  else if (text) { setBilingual(node, text); if (tag === 'p') node.classList.add('bilingual-stacked'); }
  return node;
}
const localTime = (stamp: number) => new Date(stamp).toLocaleString('vi-VN');

export const mount: FeatureModule['mount'] = (host, context) => {
  if (context.route.homeworkVersion === '30-v1') return mountHomework30(host, context);
  return mountLegacy(host, context);
};
const mountLegacy: FeatureModule['mount'] = (host, context) => {
  const article = element('article'); article.id = 'homework-module'; article.className = 'module-entry homework';
  const heading = element('h1', copy.title); heading.tabIndex = -1;
  const lessonName = element('p', copy.loading(context.route.lesson));
  const nav = element('nav'); nav.className = 'subnav'; nav.dataset.homeworkParts = ''; nav.setAttribute('aria-label', bilingualText(copy.navigation));
  const controls = element('fieldset'); controls.dataset.moduleControls = ''; controls.disabled = true;
  controls.append(element('legend', copy.controls));
  const body = element('div'); body.className = 'homework-body';
  const loadingSubmit = element('button', copy.submit); loadingSubmit.id = 'submit-homework'; loadingSubmit.type = 'button'; loadingSubmit.disabled = true; body.append(loadingSubmit); controls.append(body);
  const version = element('p', { zh: '旧版15题作业与提交记录', vi: 'Bài tập cũ 15 câu và lịch sử bài nộp' });
  const current = element('a', { zh: '打开新版30题作业', vi: 'Mở bài tập mới 30 câu' }); current.href = routeHref({ feature: 'homework', lesson: context.route.lesson, part: 'choice', homeworkVersion: '30-v1' }); current.dataset.routeLink = '';
  article.append(heading, version, current, lessonName, nav, controls); host.append(article);
  const lifetime = new AbortController();
  const close = () => lifetime.abort();
  context.signal.addEventListener('abort', close, { once: true });
  if (context.signal.aborted) close();
  let left = false;
  let unsubscribe = () => {};
  let flush = () => {};
  let collectDraft = () => {};
  let receipt: ReturnType<typeof createReceipt> | undefined;
  let formLifetime: AbortController | undefined;
  const ready = loadCourseIndex(lifetime.signal).then(async lessons => {
    if (left || lifetime.signal.aborted) return;
    const found = lessons.find(row => row.id === context.route.lesson);
    if (!found) throw new Error('Lesson not found.');
    const lesson = found;
    if (!context.learning) throw new Error('Learning session unavailable.');
    const [session, bank] = await Promise.all([context.learning(), loadHomeworkBank(lifetime.signal)]);
    if (left || lifetime.signal.aborted) return;
    flush = () => { void session.flush(); };
    const part = (context.route.part ?? 'choice') as HomeworkPart;
    const homework = createHomeworkController({ store: session.store, bank, lesson: lesson.id, part, onChange: session.requestSave });
    setBilingual(lessonName, copy.lesson(lesson.id, lesson.title, lesson.titleVi));
    const profile = element('div'); profile.className = 'homework-profile';
    const profileInputs: Partial<Record<'name' | 'className', HTMLInputElement>> = {};
    const textareaCollectors = new Map<string, () => void>();
    for (const [field, id, label] of [['name', 'homework-name', copy.name], ['className', 'homework-class', copy.className]] as const) {
      const wrapper = element('label', label);
      const input = element('input'); input.id = id; input.type = 'text'; input.maxLength = HOMEWORK_LIMITS.profile;
      input.value = homework.read().profile[field]; input.autocomplete = field === 'name' ? 'name' : 'off';
      profileInputs[field] = input;
      input.addEventListener('input', () => {
        if (left) return;
        if (!homework.profile(field, input.value).ok) showMessage(copy.profileLimit);
      }, { signal: lifetime.signal });
      wrapper.append(input); profile.append(wrapper);
    }
    const profileHint = element('p', copy.profileHint);
    profileHint.classList.add('homework-hint');
    const saveBox = element('div'); saveBox.className = 'homework-save';
    const saveStatus = element('p'); saveStatus.id = 'homework-save-status'; saveStatus.setAttribute('role', 'status');
    const saveActions = element('div'); saveActions.className = 'homework-actions';
    const retrySave = element('button', copy.retrySave); retrySave.id = 'retry-homework-save'; retrySave.type = 'button';
    const exportBackup = element('button', copy.backup); exportBackup.id = 'export-homework-backup'; exportBackup.type = 'button';
    const dataLink = element('a', copy.data); dataLink.href = routeHref({ feature: 'progress', lesson: lesson.id }); dataLink.dataset.routeLink = '';
    saveActions.append(retrySave, exportBackup, dataLink); saveBox.append(saveStatus, saveActions);
    const courseSummary = element('p'); courseSummary.id = 'homework-course-summary';
    const exercise = element('div'); exercise.className = 'homework-exercise';
    const message = element('p'); message.id = 'homework-message'; message.setAttribute('role', 'status');
    const counter = element('p'); counter.id = 'homework-answer-count';
    body.replaceChildren(profile, profileHint, saveBox, courseSummary, message, counter, exercise);
    const composing = new Set<HTMLTextAreaElement>();
    const invalid = new Set<string>();
    const urls = new Set<string>();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    lifetime.signal.addEventListener('abort', () => {
      for (const timer of timers) clearTimeout(timer);
      for (const url of urls) URL.revokeObjectURL(url);
    }, { once: true });
    function showMessage(text: BilingualCopy | ''): void { if (text) setBilingual(message, text); else message.replaceChildren(); }
    for (const node of [message, counter, courseSummary, saveStatus]) node.classList.add('bilingual-stacked');
    collectDraft = () => {
      for (const field of ['name', 'className'] as const) {
        const input = profileInputs[field];
        if (input) homework.profile(field, input.value);
      }
      for (const collect of textareaCollectors.values()) collect();
    };
    const removeExitDraft = session.registerExitDraft(() => {
      collectDraft();
      // An oversized composition may still exist only in the DOM because the
      // domain correctly rejected it. Never truncate or silently discard it.
      return invalid.size > 0;
    });
    lifetime.signal.addEventListener('abort', removeExitDraft, { once: true });
    const score = (correct: number | null, total: number) => `${correct} / ${total} (${total ? Math.round((correct ?? 0) / total * 100) : 0}%)`;
    function updateSummary(): void {
      const model = homework.read();
      if (model.locked) counter.replaceChildren();
      else setBilingual(counter, model.group?.attempt ? copy.allSubmitted : copy.answered(model.answered, model.total));
      const totals = model.courseTotals;
      setBilingual(courseSummary, copy.courseTotals(totals.homework, totals.automatic, totals.manual));
      const current = session.store.snapshot(); saveStatus.dataset.state = current.status;
      setBilingual(saveStatus, assignmentSaveCopy(current));
      saveStatus.dataset.failed = String(assignmentSaveFailed(current));
      retrySave.hidden = !assignmentSaveFailed(current);
      retrySave.disabled = current.status === 'saving' || !current.canWrite;
      for (const anchor of nav.querySelectorAll<HTMLAnchorElement>('a[data-homework-part]')) {
        const target = anchor.dataset.homeworkPart as typeof part;
        const locked = !homework.canOpen(target);
        anchor.dataset.locked = String(locked);
        setBilingual(anchor, copy.part(target, locked));
      }
    }
    for (const item of PARTS) {
      const anchor = element('a', homeworkParts[item]); anchor.href = routeHref({ ...context.route, part: item }); anchor.dataset.routeLink = ''; anchor.dataset.homeworkPart = item;
      if (item === part) anchor.setAttribute('aria-current', 'page');
      nav.append(anchor);
    }
    retrySave.addEventListener('click', () => { void session.flush(); }, { signal: lifetime.signal });
    exportBackup.addEventListener('click', () => {
      try {
        const url = URL.createObjectURL(new Blob([session.store.exportBackup()], { type: 'application/json' })); urls.add(url);
        const anchor = element('a'); anchor.href = url; anchor.download = `hsk1-ban-sao-luu-${Date.now()}.json`; document.body.append(anchor); anchor.click(); anchor.remove();
        const timer = setTimeout(() => { URL.revokeObjectURL(url); urls.delete(url); timers.delete(timer); }, 1000); timers.add(timer);
      } catch { showMessage(copy.backupFailed); }
    }, { signal: lifetime.signal });
    function openReceipt(selected: 'first' | 'latest'): void {
      collectDraft();
      const model = homework.read();
      receipt?.dispose(); body.hidden = true; controls.hidden = true;
      receipt = createReceipt(article, { lesson: lesson.id, lessonTitle: lesson.title, part, questions: model.questions,
        displayQuestions: { first: model.questions.map(q => projectHomeworkQuestion(session.store.snapshot().data, 'legacy', lesson.id, part, q, model.questions, 'first')), latest: model.questions.map(q => projectHomeworkQuestion(session.store.snapshot().data, 'legacy', lesson.id, part, q, model.questions, 'latest')) },
        homeworkVersion: 'legacy', profile: model.profile, first: model.group?.first ?? null, latest: model.group?.latest ?? null, selected,
        onClose() { receipt?.dispose(); receipt = undefined; body.hidden = false; controls.hidden = false; article.querySelector<HTMLButtonElement>(selected === 'first' ? '#receipt-first' : '#receipt-latest')?.focus(); } });
    }
    function feedback(question: HomeworkQuestion, card: HTMLElement): void {
      const model = homework.read(); const attempt = model.group?.attempt;
      if (!attempt || question.kind === 'translation') return;
      const correct = attempt.results?.[question.id] === true;
      const result = element('div'); result.className = `homework-feedback ${correct ? 'is-correct' : 'is-incorrect'}`; result.dataset.homeworkFeedback = '';
      result.append(element('strong', correct ? copy.correct : copy.incorrect));
      if (question.kind === 'choice') {
        result.append(element('p', `${bilingualText(copy.answer)}: ${question.options[question.answer]}`));
        const selected = attempt.answers[question.id];
        if (typeof selected === 'number' && question.optionFeedback?.[selected]) result.append(element('p', question.optionFeedback[selected]));
      } else result.append(element('p', `${bilingualText(copy.suitableSentence)}: ${question.answers.join(' / ')}`));
      result.append(element('p', question.explanation)); card.append(result);
    }
    function renderSort(question: SortQuestion, card: HTMLElement, readonly: boolean, signal: AbortSignal): void {
      const output = element('div'); output.className = 'sort-answer'; output.dataset.sortAnswer = question.id; output.setAttribute('aria-label', bilingualText(copy.sorted));
      const available = element('div'); available.className = 'sort-tokens'; available.dataset.sortTokens = question.id; available.setAttribute('aria-label', bilingualText(copy.unused));
      const clear = element('button', copy.clearSort); clear.type = 'button'; clear.id = `sort-clear-${question.id}`; clear.disabled = readonly;
      function draw(): void {
        const model = homework.read(); const value = model.group?.draft[question.id];
        const chosen = Array.isArray(value) ? value : [];
        output.replaceChildren(); available.replaceChildren();
        if (!chosen.length) output.append(element('span', copy.sortHint));
        for (const index of chosen) {
          const button = element('button', question.tokens[index]); button.type = 'button'; button.dataset.sortRemove = question.id; button.dataset.tokenIndex = String(index); button.disabled = readonly;
          button.setAttribute('aria-label', bilingualText(copy.removeToken(question.tokens[index]))); output.append(button);
        }
        const order = model.group?.orders[question.id] ?? question.tokens.map((_, index) => index);
        for (const index of order) {
          if (chosen.includes(index)) continue;
          const button = element('button', question.tokens[index]); button.type = 'button'; button.dataset.sortAdd = question.id; button.dataset.tokenIndex = String(index); button.disabled = readonly;
          available.append(button);
        }
        clear.disabled = readonly || !chosen.length;
        if (homework.isAnswered(question.id)) card.classList.remove('is-missing');
      }
      function change(event: Event): void {
        if (left || readonly) return;
        const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-token-index]') : null;
        if (!target) return;
        const value = homework.read().group?.draft[question.id]; const chosen = Array.isArray(value) ? value : [];
        const index = Number(target.dataset.tokenIndex);
        const next = target.dataset.sortAdd ? [...chosen, index] : chosen.filter(item => item !== index);
        if (homework.answer(question.id, next).ok) {
          showMessage(''); draw();
          const nextFocus = target.dataset.sortAdd ? available.querySelector<HTMLButtonElement>('button') ?? output.querySelector<HTMLButtonElement>('button') : output.querySelector<HTMLButtonElement>('button') ?? available.querySelector<HTMLButtonElement>('button');
          nextFocus?.focus();
        }
      }
      output.addEventListener('click', change, { signal }); available.addEventListener('click', change, { signal });
      clear.addEventListener('click', () => { if (homework.answer(question.id, []).ok) { showMessage(''); draw(); available.querySelector<HTMLButtonElement>('button')?.focus(); } }, { signal });
      card.append(output, available, clear); draw();
    }
    function renderExercise(): void {
      formLifetime?.abort(); formLifetime = new AbortController();
      const signal = formLifetime.signal;
      composing.clear(); invalid.clear(); textareaCollectors.clear(); exercise.replaceChildren();
      const model = homework.read();
      exercise.append(element('h2', homeworkParts[part]));
      const reviewLinks = element('nav'); reviewLinks.className = 'study-paths'; reviewLinks.setAttribute('aria-label', bilingualText(copy.reviewNavigation));
      for (const [label, filter] of [[copy.wrong, 'wrong'], [copy.due, 'due']] as const) {
        const link = element('a', label); link.href = routeHref({ feature: 'exercises', lesson: lesson.id, exerciseSet: 'homework-review', exerciseGroup: part === 'sort' ? 'sort' : 'choice', exerciseFilter: filter }); link.dataset.routeLink = ''; reviewLinks.append(link);
      }
      if (part === 'translation') { const link = element('a', copy.translationChoice); link.href = routeHref({ feature: 'exercises', lesson: lesson.id, exerciseSet: 'original', exerciseGroup: 'translation' }); link.dataset.routeLink = ''; reviewLinks.append(link); }
      exercise.append(reviewLinks);

      if (model.locked) {
        const prerequisite = part === 'sort' ? 'choice' : 'sort';
        exercise.append(element('p', copy.locked(prerequisite)));
        const previous = element('a', copy.goToPart(prerequisite)); previous.href = routeHref({ ...context.route, part: prerequisite }); previous.dataset.routeLink = ''; exercise.append(previous); return;
      }
      const submitted = model.group?.attempt;
      if (part === 'translation') exercise.append(element('p', copy.manualHint));
      else exercise.append(element('p', copy.automaticHint));
      for (const [index, rawQuestion] of model.questions.entries()) {
        const question = projectHomeworkQuestion(session.store.snapshot().data, 'legacy', lesson.id, part, rawQuestion, model.questions);
        const card = element('article'); card.className = 'homework-question'; card.dataset.questionId = question.id;
        card.append(element('h3', `${bilingualText(copy.question(index + 1))}. ${question.prompt}`));
        if (question.stem) { const stem = element('p', question.stem); stem.className = 'homework-stem'; card.append(stem); }
        const source = element('p', question.source.label); source.className = 'homework-source'; card.append(source);
        const value = model.group?.draft[question.id];
        if (question.kind === 'choice') {
          const options = element('fieldset'); options.className = 'homework-options'; options.append(element('legend', copy.choose(index + 1)));
          for (const [optionIndex, text] of question.options.entries()) {
            const label = element('label'); const input = element('input'); input.type = 'radio'; input.name = question.id; input.value = String(optionIndex); input.dataset.answerId = question.id; input.checked = value === optionIndex; input.disabled = !!submitted;
            input.addEventListener('change', () => { if (homework.answer(question.id, optionIndex).ok) { card.classList.remove('is-missing'); showMessage(''); } }, { signal });
            label.append(input, element('span', `${String.fromCharCode(65 + optionIndex)}. ${text}`)); options.append(label);
          }
          card.append(options);
        } else if (question.kind === 'sort') renderSort(question, card, !!submitted, signal);
        else {
          const label = element('label', copy.writtenAnswer(index + 1));
          const textarea = element('textarea'); textarea.dataset.answerId = question.id; textarea.rows = 4; textarea.maxLength = MAX_TEXT; textarea.value = typeof value === 'string' ? value : ''; textarea.readOnly = !!submitted; textarea.spellcheck = false;
          const length = element('p', copy.length(textarea.value.length, MAX_TEXT)); length.classList.add('homework-hint', 'homework-length'); length.dataset.answerLength = question.id;
          const persist = () => {
            setBilingual(length, copy.length(textarea.value.length, MAX_TEXT));
            const outcome = homework.answer(question.id, textarea.value);
            if (!outcome.ok) { invalid.add(question.id); showMessage(copy.tooLong(index + 1, MAX_TEXT)); }
            else { invalid.delete(question.id); card.classList.remove('is-missing'); if (!invalid.size) showMessage(''); }
          };
          if (!submitted) textareaCollectors.set(question.id, persist);
          textarea.addEventListener('compositionstart', () => { composing.add(textarea); textarea.removeAttribute('maxlength'); }, { signal });
          textarea.addEventListener('compositionend', () => { composing.delete(textarea); textarea.maxLength = MAX_TEXT; persist(); }, { signal });
          textarea.addEventListener('input', persist, { signal });
          label.append(textarea); card.append(label, length);
        }
        feedback(question, card); exercise.append(card);
      }
      const actions = element('div'); actions.className = 'homework-actions';
      if (!submitted) {
        const submit = element('button', part === 'translation' ? copy.submitManual : copy.submitAutomatic); submit.type = 'button'; submit.id = 'submit-homework'; submit.className = 'primary';
        submit.addEventListener('click', () => {
          if (composing.size) { showMessage(copy.composing); return; }
          if (invalid.size || [...exercise.querySelectorAll('textarea')].some(input => input.value.length > MAX_TEXT)) { showMessage(copy.unsavedTooLong(MAX_TEXT)); return; }
          collectDraft();
          const outcome = homework.submit();
          if (!outcome.ok) {
            if (outcome.reason === 'missing') {
              showMessage(copy.missing);
              for (const card of exercise.querySelectorAll<HTMLElement>('[data-question-id]')) card.classList.toggle('is-missing', outcome.missing?.includes(card.dataset.questionId!) ?? false);
              exercise.querySelector<HTMLElement>('.is-missing input, .is-missing textarea, .is-missing button')?.focus();
            } else showMessage(copy.submitFailed);
            return;
          }
          showMessage(outcome.manual ? copy.manualSubmitted : copy.submitted(score(outcome.correct, outcome.total)));
          renderExercise();
        }, { signal }); actions.append(submit);
      } else {
        const result = element('p', submitted.assessment === 'manual' ? copy.manualResult(localTime(submitted.at)) : copy.result(score(submitted.correct, submitted.total), localTime(submitted.at))); result.id = 'homework-result'; exercise.append(result);
        const restart = element('button', copy.restart); restart.type = 'button'; restart.id = 'restart-homework';
        restart.addEventListener('click', () => { if (homework.restart().ok) { homework.ensureSortOrders(); showMessage(copy.restarted); renderExercise(); } }, { signal }); actions.append(restart);
      }
      if (model.group?.first) {
        const first = element('button', copy.firstReceipt); first.type = 'button'; first.id = 'receipt-first'; first.addEventListener('click', () => openReceipt('first'), { signal }); actions.append(first);
      }
      if (model.group?.latest) {
        const latest = element('button', copy.latestReceipt); latest.type = 'button'; latest.id = 'receipt-latest'; latest.addEventListener('click', () => openReceipt('latest'), { signal }); actions.append(latest);
        const firstAttempt = model.group.first!; const latestAttempt = model.group.latest;
        const firstScore = firstAttempt.assessment === 'manual' ? '' : ` · ${score(firstAttempt.correct, firstAttempt.total)}`;
        const latestScore = latestAttempt.assessment === 'manual' ? '' : ` · ${score(latestAttempt.correct, latestAttempt.total)}`;
        const summary = element('p', copy.attempts(`${localTime(firstAttempt.at)}${firstScore}`, `${localTime(latestAttempt.at)}${latestScore}`, model.group.history.length)); summary.id = 'homework-attempt-summary'; exercise.append(summary);
      }
      exercise.append(actions); updateSummary();
    }
    homework.ensureSortOrders();
    unsubscribe = session.store.subscribe(updateSummary);
    renderExercise(); updateSummary();
  });
  return { ready, unmount() {
    if (left) return;
    collectDraft(); left = true;
    unsubscribe(); formLifetime?.abort(); lifetime.abort(); receipt?.dispose(); flush();
    context.signal.removeEventListener('abort', close); article.remove();
  } };
};
