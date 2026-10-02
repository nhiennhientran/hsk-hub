import type { Homework30Part } from '../../domain/homework30/engine.ts';
import type { FeatureModule } from '../../app/contracts.ts';
import { HOMEWORK30_PARTS as PARTS } from '../../domain/homework30/engine.ts';
import { bilingualText, setBilingual, type BilingualCopy } from '../../app/bilingual.ts';
import { assignmentSaveCopy, assignmentSaveFailed } from '../../app/i18n/homework.ts';
import { homework30Copy as copy, homework30Parts as homeworkParts } from '../../app/i18n/homework30.ts';
import { listeningAudioFailure, listeningAudioStates } from '../../app/i18n/listening.ts';
import '../../app/bilingual.css';
import { routeHref } from '../../app/router.ts';
import { loadCourseIndex } from '../../services/content/index.ts';
import { createHomework30Controller as createHomeworkController, HOMEWORK30_LIMITS as HOMEWORK_LIMITS } from './controller30.ts';
import { loadHomework30Bank as loadHomeworkBank, homework30Audio, type Homework30Question as HomeworkQuestion } from '../../services/content/homework30.ts';
import type { SortQuestion } from '../../services/content/homework.ts';
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

export const mountHomework30: FeatureModule['mount'] = (host, context) => {
  const article = element('article'); article.id = 'homework-module'; article.className = 'module-entry homework homework30';
  const heading = element('h1', copy.title); heading.tabIndex = -1;
  const lessonName = element('p', copy.loading(context.route.lesson));
  const nav = element('nav'); nav.className = 'subnav'; nav.dataset.homeworkParts = ''; nav.setAttribute('aria-label', bilingualText(copy.navigation));
  const controls = element('fieldset'); controls.dataset.moduleControls = ''; controls.disabled = true;
  controls.append(element('legend', copy.controls));
  const body = element('div'); body.className = 'homework-body';
  const loadingSubmit = element('button', copy.submit); loadingSubmit.id = 'submit-homework'; loadingSubmit.type = 'button'; loadingSubmit.disabled = true; body.append(loadingSubmit); controls.append(body);
  const version = element('p', copy.version); version.dataset.homeworkVersion = '30-v1';
  const history = element('details'); history.id = 'homework-version-history'; const historyLabel = element('summary', copy.legacy); historyLabel.id = 'homework-version-history-toggle';
  const legacyLink = element('a', copy.legacy); legacyLink.id = 'homework-legacy-link'; legacyLink.href = routeHref({ feature: 'homework', lesson: context.route.lesson, part: context.route.part === 'sort' || context.route.part === 'translation' ? context.route.part : 'choice', homeworkVersion: 'legacy' }); legacyLink.dataset.routeLink = ''; history.append(historyLabel, legacyLink);
  article.append(heading, lessonName, nav, controls, history); host.append(article);
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
  let activeAudio: import('../../services/audio/index.ts').AudioService | undefined;
  const ready = loadCourseIndex(lifetime.signal).then(async lessons => {
    if (left || lifetime.signal.aborted) return;
    const found = lessons.find(row => row.id === context.route.lesson);
    if (!found) throw new Error('Lesson not found.');
    const lesson = found;
    if (!context.learning) throw new Error('Learning session unavailable.');
    const [session, bank] = await Promise.all([context.learning(), loadHomeworkBank(lifetime.signal)]);
    if (left || lifetime.signal.aborted) return;
    flush = () => { void session.flush(); };
    const part = (context.route.part ?? 'choice') as Homework30Part;
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
    saveActions.append(exportBackup, dataLink); saveBox.append(saveStatus, retrySave);
    const courseSummary = element('p'); courseSummary.id = 'homework-course-summary';
    const exercise = element('div'); exercise.className = 'homework-exercise';
    const message = element('p'); message.id = 'homework-message'; message.setAttribute('role', 'status');
    const counter = element('p'); counter.id = 'homework-answer-count';
    const submissionDetails = element('details'); submissionDetails.id = 'homework-submission-details'; submissionDetails.className = 'homework-secondary';
    const submissionSummary = element('summary', { zh: '提交信息 · 选填', vi: 'Thông tin bài nộp · không bắt buộc' }); submissionSummary.id = 'homework-submission-details-toggle';
    submissionDetails.append(submissionSummary, profileHint, profile);
    const studyDetails = element('details'); studyDetails.id = 'homework-study-details'; studyDetails.className = 'homework-secondary';
    const studySummary = element('summary', { zh: '作业说明、总进度与备份', vi: 'Hướng dẫn, tổng tiến độ và bản sao lưu' }); studySummary.id = 'homework-study-details-toggle';
    studyDetails.append(studySummary, version, courseSummary, saveActions);
    body.replaceChildren(saveBox, message, counter, exercise, submissionDetails, studyDetails);
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
      setBilingual(saveStatus, current.status === 'saved' && !current.issue ? { zh: '已保存到本设备', vi: 'Đã lưu trên thiết bị này' } : assignmentSaveCopy(current));
      saveStatus.dataset.failed = String(assignmentSaveFailed(current));
      const saveFailed = assignmentSaveFailed(current);
      retrySave.hidden = !saveFailed;
      // Recovery must stay immediately reachable even when secondary tools are collapsed.
      const toolsHost = saveFailed ? saveBox : studyDetails;
      if (saveActions.parentElement !== toolsHost) toolsHost.append(saveActions);
      retrySave.disabled = current.status === 'saving' || !current.canWrite;
      for (const anchor of nav.querySelectorAll<HTMLAnchorElement>('a[data-homework-part]')) {
        const target = anchor.dataset.homeworkPart as typeof part;
        const locked = !homework.canOpen(target);
        anchor.dataset.locked = String(locked);
        setBilingual(anchor, compactParts[target]);
        anchor.setAttribute('aria-label', bilingualText(copy.part(target, locked)));
      }
    }
    const compactParts: Record<Homework30Part, BilingualCopy> = {
      choice: { zh: '词汇语法 · 10', vi: 'Từ vựng/ngữ pháp' }, sort: { zh: '排序 · 5', vi: 'Xếp câu' },
      listening: { zh: '听力 · 5', vi: 'Nghe' }, translationChoice: { zh: '翻译选择 · 5', vi: 'Dịch chọn đáp án' },
      translation: { zh: '翻译写作 · 5', vi: 'Dịch tự viết' },
    };
    const revealPart = (anchor: HTMLElement) => {
      // Scroll only this row, never move the whole page away from the active task.
      const offset = anchor.offsetLeft;
      if (offset < nav.scrollLeft) nav.scrollLeft = offset;
      else if (offset + anchor.offsetWidth > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = offset + anchor.offsetWidth - nav.clientWidth;
    };
    nav.addEventListener('focusin', event => { const anchor = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-homework-part]') : null; if (anchor) revealPart(anchor); }, { signal: lifetime.signal });
    for (const item of PARTS) {
      const anchor = element('a', compactParts[item]); anchor.href = routeHref({ ...context.route, part: item }); anchor.dataset.routeLink = ''; anchor.dataset.homeworkPart = item;
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
      collectDraft(); activeAudio?.stop();
      const model = homework.read();
      receipt?.dispose(); body.hidden = true; controls.hidden = true;
      receipt = createReceipt(article, { lesson: lesson.id, lessonTitle: lesson.title, part, questions: model.questions,
        homeworkVersion: '30-v1', profile: model.profile, first: model.group?.first ?? null, latest: model.group?.latest ?? null, selected,
        onClose() { receipt?.dispose(); receipt = undefined; body.hidden = false; controls.hidden = false; article.querySelector<HTMLButtonElement>(selected === 'first' ? '#receipt-first' : '#receipt-latest')?.focus(); } });
    }
    function feedback(question: HomeworkQuestion, card: HTMLElement): void {
      const model = homework.read(); const attempt = model.group?.attempt;
      if (!attempt || question.kind === 'translation') return;
      const correct = attempt.results?.[question.id] === true;
      const result = element('div'); result.className = `homework-feedback ${correct ? 'is-correct' : 'is-incorrect'}`; result.dataset.homeworkFeedback = '';
      result.append(element('strong', correct ? copy.correct : copy.incorrect));
      if (question.kind === 'choice' || question.kind === 'listening') {
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
      const partHeading = element('h2', homeworkParts[part]); partHeading.className = 'homework-part-heading'; exercise.append(partHeading);
      if (model.locked) {
        const prerequisite = PARTS[Math.max(0, PARTS.indexOf(part) - 1)]!;
        exercise.append(element('p', copy.locked(prerequisite)));
        const previous = element('a', copy.goToPart(prerequisite)); previous.href = routeHref({ ...context.route, part: prerequisite }); previous.dataset.routeLink = ''; exercise.append(previous); return;
      }
      const submitted = model.group?.attempt;
      if (part === 'translation') exercise.append(element('p', copy.manualHint));
      // Automatic submission guidance is adjacent to the submit action rather than repeated above the first question.
      for (const [index, question] of model.questions.entries()) {
        const card = element('article'); card.className = 'homework-question'; card.dataset.questionId = question.id;
        card.append(element('h3', `${bilingualText(copy.question(index + 1))}. ${question.prompt}`));
        if (question.stem) { const stem = element('p', question.stem); stem.className = 'homework-stem'; card.append(stem); }
        const source = element('p', question.source.label); source.className = 'homework-source'; card.append(source);
        if (question.kind === 'listening') {
          const player = element('div'); player.className = 'homework-actions';
          const status = element('p'); status.setAttribute('role', 'status');
          let playerEvents = () => {};
          const play = element('button', copy.play); play.type = 'button'; play.dataset.homeworkAudio = question.id;
          const pause = element('button', copy.pause); pause.type = 'button';
          const run = async () => {
            try {
              const audio = await context.audio?.(); if (!audio || signal.aborted || lifetime.signal.aborted) return;
              activeAudio = audio;
              playerEvents(); playerEvents = audio.subscribe(() => { if (!signal.aborted) setBilingual(status, audio.snapshot().issue ? listeningAudioFailure(audio.snapshot().issue) : listeningAudioStates[audio.snapshot().status]); });
              const outcome = await audio.play(homework30Audio(question), { signal });
              if (!outcome.ok && outcome.code !== 'cancelled' && !signal.aborted) setBilingual(status, outcome.issue ? listeningAudioFailure(outcome.issue) : copy.audioFailed);
            } catch { if (!signal.aborted) setBilingual(status, copy.audioFailed); }
          };
          play.addEventListener('click', () => { void run(); }, { signal });
          pause.addEventListener('click', async () => { const audio = await context.audio?.(); if (!signal.aborted) audio?.pause(); }, { signal });
          signal.addEventListener('abort', () => playerEvents(), { once: true });
          player.append(play, pause, status); card.append(player);
          if (submitted) { const transcript = element('details'); transcript.append(element('summary', copy.transcript), element('p', question.transcript)); card.append(transcript); }
        }
        const value = model.group?.draft[question.id];
        if (question.kind === 'choice' || question.kind === 'listening') {
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
        if (part !== 'translation') exercise.append(element('p', copy.automaticHint));
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
    requestAnimationFrame(() => { if (!left && !lifetime.signal.aborted) { const active = nav.querySelector<HTMLElement>('[aria-current="page"]'); if (active) revealPart(active); } });
  });
  return { ready, unmount() {
    if (left) return;
    collectDraft(); left = true;
    unsubscribe(); formLifetime?.abort(); lifetime.abort(); receipt?.dispose(); flush();
    context.signal.removeEventListener('abort', close); article.remove();
  } };
};
