import { dataStorageIssueCopy } from '../../services/storage/copy.ts';
import { bilingualText, setBilingual, type BilingualCopy } from '../../app/bilingual.ts';
import { progressCopy as C, progressMessages as M, progressStatus } from '../../app/i18n/progress.ts';
import type { StoreStatus } from '../../services/storage/index.ts';
import type { Route } from '../../app/contracts.ts';
import { routeHref } from '../../app/router.ts';
import type { ProgressLink, ProgressSummary } from '../../services/learning/progress.ts';

export function storageStatusText(status: StoreStatus, issue?: string | null): string {
  return [bilingualText(progressStatus[status]!), issue ? bilingualText(dataStorageIssueCopy(issue)) : null].filter(Boolean).join(' ');
}

export function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string | BilingualCopy): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (typeof text === 'string') node.textContent = text; else if (text) setBilingual(node, text);
  return node;
}
export function routeLink(text: string | BilingualCopy, route: Route): HTMLAnchorElement {
  const link = element('a', text); link.href = routeHref(route); link.dataset.routeLink = ''; return link;
}
export function renderContinuation(host: HTMLElement, resume: ProgressLink | null, id: string): void {
  host.replaceChildren(); host.hidden = !resume;
  if (resume) { const link = routeLink(resume.label, resume.route); link.id = id; host.append(link); }
}
function metric(host: HTMLElement, id: string, text: string | BilingualCopy): void {
  const line = element('p', text); line.className = 'bilingual-stacked'; line.id = id; host.append(line);
}
function section(title: string | BilingualCopy, name: string): HTMLElement {
  const panel = element('section'); panel.className = 'progress-panel'; panel.dataset.progressDomain = name;
  panel.append(element('h2', title)); return panel;
}

export function renderProgressOverview(host: HTMLElement, model: ProgressSummary, prefix = 'progress'): void {
  const reading = section(C.reading, 'reading');
  metric(reading, `${prefix}-reading`, M.reading(model.reading.visited, model.reading.total, model.reading.complete));
  reading.append(element('p', M.stars(model.reading.starred)));

  const homework = section(C.homework, 'homework');
  metric(homework, `${prefix}-homework-submitted`, M.submitted(model.homework.submitted, model.homework.total, model.homework.completedLessons, model.homework.lessonCount));
  metric(homework, `${prefix}-homework-objective`, M.scores(model.automatic.firstCorrect, model.automatic.latestCorrect, model.automatic.total, model.automatic.submitted));
  homework.append(element('p', M.objectiveNote(model.automatic.submitted, model.automatic.total)));

  const translation = section(C.translation, 'translation');
  metric(translation, `${prefix}-translation-submitted`, M.translation(model.translation.submitted, model.translation.total));
  metric(translation, `${prefix}-translation-draft`, M.drafts(model.translation.draftAnswered, model.translation.draftLessons));
  translation.append(element('p', C.translationNote));

  const listening = section(C.listening, 'listening');
  metric(listening, `${prefix}-listening-submitted`, M.listening(model.listening.overall.answered, model.listening.overall.total));
  metric(listening, `${prefix}-listening-objective`, M.scores(model.listening.overall.firstCorrect, model.listening.overall.latestCorrect, model.listening.overall.total, model.listening.overall.answered));
  listening.append(element('p', M.listeningWrong(model.listening.wrongIds.length)));
  if (model.listeningResume) listening.append(routeLink(model.listeningResume.label, model.listeningResume.route));

  const vocabulary = section(C.vocabulary, 'vocabulary');
  metric(vocabulary, `${prefix}-vocabulary-counts`, M.senses(model.vocabulary.records, model.vocabulary.distinctForms));
  metric(vocabulary, `${prefix}-vocabulary-ratings`, M.ratings(model.vocabulary.rated, model.vocabulary.totalSenses, model.vocabulary.again, model.vocabulary.hard, model.vocabulary.good));
  metric(vocabulary, `${prefix}-vocabulary-due`, M.due(model.vocabulary.dueRated, model.vocabulary.new, model.vocabulary.due));
  vocabulary.append(element('p', C.ratingNote));
  const actions = element('div'); actions.className = 'progress-actions';
  actions.append(routeLink(C.review, { feature: 'review', lesson: model.resume?.route.lesson ?? 1 }));
  if (model.vocabularyResume) actions.append(routeLink(model.vocabularyResume.label, model.vocabularyResume.route));
  vocabulary.append(actions);
  const restored: HTMLElement[] = [];
  if (model.extraExercises) {
    for (const [kind, title] of [['original', C.original], ['pilot', C.pilot]] as const) {
      const totals = model.extraExercises[kind], panel = section(title, kind);
      metric(panel, `${prefix}-${kind}-submitted`, M.extra(totals.submitted, totals.automatic, totals.firstCorrect, totals.latestCorrect));
      if (totals.manual) panel.append(element('p', M.manual(totals.manualSubmitted, totals.manual)));
      panel.append(routeLink(C.openExercise, { feature: 'exercises', lesson: kind === 'pilot' ? 9 : model.resume?.route.lesson ?? 1, exerciseSet: kind })); restored.push(panel);
    }
    homework.append(element('p', M.homeworkReview(model.extraExercises.reviewWrong, model.extraExercises.reviewDue)));
  }
  host.replaceChildren(reading, homework, translation, listening, vocabulary, ...restored);
}

export function renderLessonProgress(host: HTMLElement, model: ProgressSummary): void {
  const grid = element('div'); grid.className = 'lesson-grid';
  for (const row of model.lessons) {
    const card = element('article'); card.className = 'lesson-card'; card.dataset.progressLesson = String(row.lesson);
    card.append(element('h3', `第${row.lesson}课 · Bài ${row.lesson} · ${row.title}`), element('p', row.titleVi),
      element('p', M.readingState(row.reading.complete, row.reading.visited, row.reading.modules)),
      element('p', M.homeworkCount(row.homework.submitted, row.homework.total)),
      element('p', M.lessonObjective(row.automatic.firstCorrect, row.automatic.latestCorrect, row.automatic.total, row.automatic.submitted)),
      element('p', M.lessonTranslation(row.translation.submitted, row.translation.total, row.translation.draftAnswered)),
      element('p', M.lessonListening(row.listening.firstCorrect, row.listening.latestCorrect, row.listening.total, row.listening.answered)));
    const actions = element('div'); actions.className = 'lesson-actions';
    actions.append(routeLink(C.openBook, { feature: 'textbook', lesson: row.lesson }),
      routeLink(row.homework.done ? C.viewWork : C.continueWork, row.homeworkRoute),
      routeLink(row.translation.submitted ? C.viewTranslation : C.openTranslation, { feature: 'homework', lesson: row.lesson, part: 'translation' }));
    card.append(actions); grid.append(card);
  }
  host.replaceChildren(element('h2', C.perLesson), grid);
}

