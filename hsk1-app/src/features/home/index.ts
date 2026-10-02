import { createDueRefresh } from '../due-refresh.ts';
import { SECTIONS, type FeatureModule } from '../../app/contracts.ts';
import { sectionLabels, sectionChinese, featureLabels } from '../../app/labels.ts';
import { routeHref } from '../../app/router.ts';
import { loadCourseIndex } from '../../services/content/index.ts';
import { summarizeProgress } from '../../services/learning/progress.ts';
import { loadProgressSources } from '../progress/content.ts';
import { element, renderContinuation, renderProgressOverview, routeLink, storageStatusText } from '../progress/summary.ts';
import '../progress/progress.css';

/** Home keeps the course overview and projects the same session as the progress page. */
export const mount: FeatureModule['mount'] = (host, context) => {
  const article = element('article'); article.id = 'home-module'; article.className = 'module-entry';
  const heading = element('h1', 'Tự do chọn bài học'); heading.tabIndex = -1;
  const description = element('p', 'Đang tải danh sách bài học và tiến độ đã lưu…'); description.id = 'home-course-status';
  const hero = element('header'); hero.className = 'course-hero';
  const eyebrow = element('p', '新HSK教程 1 · 15 BÀI HỌC'); eyebrow.className = 'eyebrow';
  hero.append(eyebrow, heading, element('p', 'Học theo giáo trình, chọn đúng phần bạn cần.'), element('p', '15 bài học · 5 phần / bài · Nội dung và âm thanh giáo trình'));
  article.append(hero, description); host.append(article);
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
    description.textContent = '15 bài luôn mở · Vào thẳng từng mục, không cần học theo thứ tự';
    const catalogue = element('section'); catalogue.className = 'home-catalogue';
    const toolbar = element('div'); toolbar.className = 'catalogue-toolbar';
    const searchLabel = element('label', 'Tìm bài học'); searchLabel.className = 'home-search-label';
    const search = element('input'); search.type = 'search'; search.id = 'lesson-search'; search.placeholder = 'Tên bài, chữ Hán hoặc số bài…'; searchLabel.append(search);
    toolbar.append(element('h2', 'Bắt đầu từ bài bạn muốn'), searchLabel);
    catalogue.append(toolbar, description);
    const grid = element('div'); grid.className = 'lesson-grid';
    for (const lesson of lessons) {
      const card = element('article'); card.className = 'lesson-card'; card.dataset.lesson = String(lesson.id); card.dataset.searchText = `${lesson.id} ${lesson.title} ${lesson.titleVi}`;
      const number = element('p', `BÀI ${String(lesson.id).padStart(2, '0')}`); number.className = 'lesson-number';
      const title = element('h2'); const titleLink = routeLink(lesson.title, { feature: 'textbook', lesson: lesson.id, section: 'vocab' }); titleLink.lang = 'zh'; title.append(titleLink);
      const subtitle = element('p', lesson.titleVi); subtitle.className = 'lesson-subtitle';
      card.append(number, title, subtitle);
      const sections = element('nav'); sections.className = 'lesson-section-links'; sections.setAttribute('aria-label', `Năm mục giáo trình bài ${lesson.id}`);
      for (const section of SECTIONS) {
        const link = routeLink(sectionLabels[section], { feature: 'textbook', lesson: lesson.id, section });
        link.title = `${sectionChinese[section]} · ${sectionLabels[section]}`; link.dataset.lessonSection = section; sections.append(link);
      }
      card.append(sections);
      const actions = element('div'); actions.className = 'lesson-actions';
      for (const feature of ['exercises', 'homework', 'listening'] as const) actions.append(routeLink(featureLabels[feature], { feature, lesson: lesson.id }));
      card.append(actions); grid.append(card);
    }
    catalogue.append(grid);
    search.addEventListener('input', () => {
      const key = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase();
      const query = key(search.value.trim());
      for (const card of grid.querySelectorAll<HTMLElement>('.lesson-card')) card.hidden = !!query && !key(card.dataset.searchText ?? '').includes(query);
    }, { signal: controller.signal });
    const progressDetails = element('details'); progressDetails.className = 'home-progress-details'; progressDetails.append(element('summary', 'Việc học của bạn · Tiến độ và việc cần ôn'), overview);
    article.append(continuation, catalogue, progressDetails);
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
