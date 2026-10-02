import { dataStorageIssueCopy } from '../../services/storage/copy.ts';
import { bilingualText, type BilingualCopy } from '../../app/bilingual.ts';
import { progressCopy as C, progressMessages as M, progressStatus } from '../../app/i18n/progress.ts';
import type { StoreStatus } from '../../services/storage/index.ts';
import { element, routeLink, disclosure } from '../../app/ui.ts';
export { element, routeLink } from '../../app/ui.ts';
import type { ProgressLink, ProgressSummary } from '../../services/learning/progress.ts';

export function storageStatusText(status: StoreStatus, issue?: string | null): string {
  return [bilingualText(progressStatus[status]!), issue ? bilingualText(dataStorageIssueCopy(issue)) : null].filter(Boolean).join(' ');
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

  const current = model.currentHomework;
  const currentWork = section({ zh: '课后作业 · 每课30题', vi: 'Bài tập · 30 câu mỗi bài' }, 'current-homework');
  metric(currentWork, `${prefix}-current-homework-submitted`, M.submitted(current.homework.submitted, 450, current.homework.completedLessons, 15));
  metric(currentWork, `${prefix}-current-homework-objective`, M.scores(current.automatic.firstCorrect, current.automatic.latestCorrect, 375, current.automatic.submitted));
  currentWork.append(element('p', { zh: '自动评分与人工批阅分开；本版本不会重新标记旧成绩。', vi: 'Điểm tự chấm tách khỏi bài giáo viên xem; phiên bản này không đổi nhãn điểm cũ.' }));
  const currentWriting = section({ zh: '新版翻译写作 · 人工批阅', vi: 'Dịch tự viết mới · giáo viên xem' }, 'current-translation');
  metric(currentWriting, `${prefix}-current-translation-submitted`, M.translation(current.translation.submitted, 75));
  metric(currentWriting, `${prefix}-current-translation-draft`, M.drafts(current.translation.draftAnswered, current.translation.draftLessons));
  currentWriting.append(element('p', C.translationNote));

  const homework = section({ zh: '旧版15题作业 · 原成绩', vi: 'Bài tập cũ 15 câu · điểm gốc' }, 'homework');
  metric(homework, `${prefix}-homework-submitted`, M.submitted(model.homework.submitted, model.homework.total, model.homework.completedLessons, model.homework.lessonCount));
  metric(homework, `${prefix}-homework-objective`, M.scores(model.automatic.firstCorrect, model.automatic.latestCorrect, model.automatic.total, model.automatic.submitted));
  homework.append(element('p', M.objectiveNote(model.automatic.submitted, model.automatic.total)));

  const translation = section({ zh: '旧版翻译写作', vi: 'Dịch tự viết phiên bản cũ' }, 'translation');
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
      if (totals.submitted || totals.manualSubmitted) restored.push(panel);
    }
    homework.append(element('p', M.homeworkReview(model.extraExercises.reviewWrong, model.extraExercises.reviewDue)));
  }
  const expanded = new Set([...host.querySelectorAll<HTMLDetailsElement>('details[open][data-detail-key]')].map(node => node.dataset.detailKey));
  for (const panel of [reading, currentWork, currentWriting, homework, translation, listening, vocabulary]) {
    const extra = [...panel.children].slice(2);
    if (extra.length) {
      const details = disclosure({ zh: '查看详情与统计说明', vi: 'Xem chi tiết và cách tính' });
      details.dataset.detailKey = panel.dataset.progressDomain; details.open = expanded.has(details.dataset.detailKey);
      details.append(...extra); panel.append(details);
    }
  }
  const archive = disclosure({ zh: '旧版作业与练习历史', vi: 'Lịch sử bài tập và luyện tập cũ' }, 'progress-archive secondary-details');
  archive.dataset.detailKey = 'archive'; archive.open = expanded.has('archive');
  archive.append(element('p', { zh: '以下为旧版本原始分母、首次与最近成绩，不计入新版450题。', vi: 'Dưới đây giữ nguyên tổng câu, điểm lần đầu và gần nhất của phiên bản cũ; không cộng vào 450 câu mới.' }), homework, translation, ...restored);
  host.replaceChildren(currentWork, currentWriting, reading, listening, vocabulary, archive);
}

export function renderLessonProgress(host: HTMLElement, model: ProgressSummary): void {
  const expanded = new Set([...host.querySelectorAll<HTMLDetailsElement>('details[open][data-progress-lesson]')].map(node => node.dataset.progressLesson));
  const grid = element('div'); grid.className = 'lesson-progress-list';
  for (const row of model.lessons) {
    const card = element('details'); card.className = 'lesson-progress-detail'; card.dataset.progressLesson = String(row.lesson); card.open = expanded.has(String(row.lesson));
    const label = element('summary', { zh: `第${row.lesson}课 · ${row.title}`, vi: `Bài ${row.lesson} · ${row.titleVi}` });
    const detail = element('div'); detail.className = 'lesson-progress-content';
    const current = model.currentHomework.lessons.find(item => item.lesson === row.lesson)!;
    detail.append(
      element('p', { zh: `新版作业：已提交 ${current.homework.submitted}/30`, vi: `Bài tập mới: đã nộp ${current.homework.submitted}/30` }),
      element('p', { zh: `自动评分：首次 ${current.automatic.firstCorrect}/25，最近 ${current.automatic.latestCorrect}/25；写作 ${current.translation.submitted}/5 待老师查看`, vi: `Tự chấm: lần đầu ${current.automatic.firstCorrect}/25, gần nhất ${current.automatic.latestCorrect}/25; ${current.translation.submitted}/5 câu viết để giáo viên xem` }),
      element('p', M.readingState(row.reading.complete, row.reading.visited, row.reading.modules)),
      element('p', M.homeworkCount(row.homework.submitted, row.homework.total)),
      element('p', M.lessonObjective(row.automatic.firstCorrect, row.automatic.latestCorrect, row.automatic.total, row.automatic.submitted)),
      element('p', M.lessonTranslation(row.translation.submitted, row.translation.total, row.translation.draftAnswered)),
      element('p', M.lessonListening(row.listening.firstCorrect, row.listening.latestCorrect, row.listening.total, row.listening.answered)));
    const legacy = disclosure({ zh: '旧版15题记录', vi: 'Lịch sử 15 câu phiên bản cũ' });
    legacy.append(...[...detail.children].slice(3, 6));
    detail.append(legacy);
    const actions = element('div'); actions.className = 'lesson-actions';
    actions.append(routeLink(C.openBook, { feature: 'textbook', lesson: row.lesson }),
      routeLink(current.homework.done ? C.viewWork : C.continueWork, current.nextRoute));
    legacy.append(routeLink({ zh: '查看旧版作业原记录', vi: 'Xem bản ghi bài tập cũ' }, { ...row.homeworkRoute, homeworkVersion: 'legacy' }));
    detail.append(actions); card.append(label, detail); grid.append(card);
  }
  host.replaceChildren(element('h2', C.perLesson), grid);
}

