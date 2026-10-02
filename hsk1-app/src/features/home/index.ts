import { createDueRefresh } from '../due-refresh.ts';
import { createEntryModule } from '../entry.ts';
import type { FeatureModule } from '../../app/contracts.ts';
import { routeHref } from '../../app/router.ts';
import { summarizeProgress } from '../../services/learning/progress.ts';
import { loadProgressSources } from '../progress/content.ts';
import { element, renderContinuation, renderProgressOverview, routeLink, storageStatusText } from '../progress/summary.ts';
import '../progress/progress.css';

/** Home keeps the course overview and projects the same session as the progress page. */
export const mount: FeatureModule['mount'] = (host, context) => {
  const entry = createEntryModule('home').mount(host, context);
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
  const ready = Promise.all([entry.ready, loadProgressSources(controller.signal)]).then(async ([, sources]) => {
    if (left || controller.signal.aborted || !context.learning) return;
    const session = await context.learning();
    if (left || controller.signal.aborted) return;
    const grid = host.querySelector('.lesson-grid');
    grid?.before(continuation, overview);
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
    left = true; controller.abort(); unsubscribe(); dueRefresh?.dispose(); continuation.remove(); overview.remove(); entry.unmount();
    context.signal.removeEventListener('abort', abort);
  } };
};
