import { createDueRefresh } from '../due-refresh.ts';
import type { FeatureModule } from '../../app/contracts.ts';
import { featureLabels } from '../../app/labels.ts';
import { routeHref } from '../../app/router.ts';
import { loadCourseIndex } from '../../services/content/index.ts';
import { summarizeProgress } from '../../services/learning/progress.ts';
import { loadProgressSources } from '../progress/content.ts';
import { element, renderContinuation, renderProgressOverview, routeLink, storageStatusText } from '../progress/summary.ts';
import '../progress/progress.css';

/** Home keeps the course overview and projects the same session as the progress page. */
export const mount: FeatureModule['mount'] = (host, context) => {
  const article = element('article'); article.id = 'home-module'; article.className = 'module-entry';
  const heading = element('h1', featureLabels.home); heading.tabIndex = -1;
  const description = element('p', 'Đang tải danh sách bài học và tiến độ đã lưu…'); description.id = 'home-course-status';
  article.append(heading, description); host.append(article);
  const controller = new AbortController();
  const abort = () => controller.abort();
  context.signal.addEventListener('abort', abort, { once: true });
  if (context.signal.aborted) abort();
  let left = false, unsubscribe = () => {};
  let dueRefresh: ReturnType<typeof createDueRefresh> | undefined;
  const continuation = element('p'); continuation.id = 'continue-learning'; continuation.hidden = true;
  const overview = element('section'); overview.id = 'home-progress'; overview.className = 'home-progress';
  const status = element('p'); status.id = 'home-save-status'; status.className = 'progress-save-status'; status.setAttribute('role', 'status');
  const panels = element('div'); panels.className = 'progress-overview';
  overview.append(element('h2', 'Việc học của bạn'), status, panels, routeLink('Xem tiến độ từng bài và bản sao lưu', { feature: 'progress', lesson: context.route.lesson }));
  const ready = Promise.all([loadCourseIndex(controller.signal), loadProgressSources(controller.signal)]).then(async ([lessons, sources]) => {
    if (left || controller.signal.aborted) return;
    if (!context.learning) throw new Error('Learning session is missing.');
    const session = await context.learning();
    if (left || controller.signal.aborted) return;
    const selected = lessons.find(lesson => lesson.id === context.route.lesson);
    if (!selected) throw new Error('Lesson not found.');
    description.textContent = `Bài đang chọn: ${selected.id} · ${selected.title} · ${selected.titleVi}`;
    const grid = element('div'); grid.className = 'lesson-grid';
    for (const lesson of lessons) {
      const card = element('article'); card.className = 'lesson-card'; card.dataset.lesson = String(lesson.id);
      card.append(element('p', `Bài ${lesson.id}`), element('h2', lesson.title), element('p', lesson.titleVi));
      const actions = element('div'); actions.className = 'lesson-actions';
      for (const feature of ['textbook', 'homework', 'listening'] as const) actions.append(routeLink(featureLabels[feature], { feature, lesson: lesson.id }));
      card.append(actions); grid.append(card);
    }
    article.append(continuation, overview, grid);
    const render = () => {
      if (left || controller.signal.aborted) return;
      const snapshot = session.store.snapshot(), data = snapshot.data;
      status.dataset.state = snapshot.status; status.textContent = storageStatusText(snapshot.status, snapshot.issue);
      const model = summarizeProgress(data, sources);
      renderContinuation(continuation, model.resume, 'continue-learning-link');
      renderProgressOverview(panels, model, 'home');
      for (const card of host.querySelectorAll<HTMLElement>('.lesson-card[data-lesson]')) {
        const id = card.dataset.lesson!, row = model.lessons.find(lesson => String(lesson.lesson) === id)!;
        let state = card.querySelector<HTMLElement>('[data-reading-summary]');
        if (!state) { state = element('p'); state.dataset.readingSummary = ''; card.append(state); }
        state.textContent = `${row.reading.complete ? 'Đã đánh dấu hoàn thành' : row.reading.visited ? 'Đã mở bài' : 'Chưa mở bài'} · ${row.reading.modules}/5 mục giáo trình đã mở`;
        let work = card.querySelector<HTMLElement>('[data-homework-summary]');
        if (!work) { work = element('p'); work.dataset.homeworkSummary = ''; card.append(work); }
        work.textContent = `Bài tập đã nộp ${row.homework.submitted}/${row.homework.total} · Nghe đã nộp ${row.listening.answered}/${row.listening.total}`;
        // Keep the existing one-link-per-domain card contract, pointing homework at the next unlocked group.
        const homework = card.querySelector<HTMLAnchorElement>('a[href^="#/homework?"]');
        if (homework) homework.href = routeHref(row.homeworkRoute);
      }
      dueRefresh?.schedule(model.vocabulary.nextDueAt);
    };
    dueRefresh = createDueRefresh(render, controller.signal);
    unsubscribe = session.store.subscribe(render); render();
  });
  return { ready, unmount() {
    if (left) return;
    left = true; controller.abort(); unsubscribe(); dueRefresh?.dispose(); article.remove();
    context.signal.removeEventListener('abort', abort);
  } };
};
