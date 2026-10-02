import { bilingualText, setBilingual } from '../../app/bilingual.ts';
import { coreCopy as C } from '../../app/i18n/core.ts';
import { progressMessages as M } from '../../app/i18n/progress.ts';
import { createDueRefresh } from '../due-refresh.ts';
import { SECTIONS, type FeatureModule } from '../../app/contracts.ts';
import { sectionLabels, sectionChinese, featureLabels, featureChinese } from '../../app/labels.ts';
import { routeHref } from '../../app/router.ts';
import { loadCourseIndex } from '../../services/content/index.ts';
import { summarizeProgress } from '../../services/learning/progress.ts';
import { loadProgressSources } from '../progress/content.ts';
import { element, renderContinuation, renderProgressOverview, routeLink, storageStatusText } from '../progress/summary.ts';
import '../progress/progress.css';

/** Home keeps the course overview and projects the same session as the progress page. */
export const mount: FeatureModule['mount'] = (host, context) => {
  const article = element('article'); article.id = 'home-module'; article.className = 'module-entry';
  const heading = element('h1', C.homeTitle); heading.tabIndex = -1;
  const description = element('p', C.loadingLessons); description.id = 'home-course-status';
  const hero = element('header'); hero.className = 'course-hero';
  hero.append(heading, element('p', C.homeLead));
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
  overview.append(element('h2', C.yourLearning), status, panels, routeLink(C.showProgress, { feature: 'progress', lesson: context.route.lesson }));
  const ready = Promise.all([loadCourseIndex(controller.signal), loadProgressSources(controller.signal)]).then(async ([lessons, sources]) => {
    if (left || controller.signal.aborted) return;
    if (!context.learning) throw new Error('Learning session is missing.');
    const session = await context.learning();
    if (left || controller.signal.aborted) return;
    const selected = lessons.find(lesson => lesson.id === context.route.lesson);
    if (!selected) throw new Error('Lesson not found.');
    setBilingual(description, C.allOpen);
    const catalogue = element('section'); catalogue.className = 'home-catalogue';
    const toolbar = element('div'); toolbar.className = 'catalogue-toolbar';
    const searchLabel = element('label', C.lessonSearch); searchLabel.className = 'home-search-label';
    const search = element('input'); search.type = 'search'; search.id = 'lesson-search'; search.placeholder = bilingualText(C.lessonSearchHint); searchLabel.append(search);
    toolbar.append(element('h2', C.startWhere), searchLabel);
    catalogue.append(toolbar, description);
    const grid = element('div'); grid.className = 'lesson-grid';
    for (const lesson of lessons) {
      const card = element('article'); card.className = 'lesson-card'; card.dataset.lesson = String(lesson.id); card.dataset.searchText = `${lesson.id} ${lesson.title} ${lesson.titleVi}`;
      const number = element('p', {zh:`第${lesson.id}课`,vi:`BÀI ${String(lesson.id).padStart(2, '0')}`}); number.className = 'lesson-number';
      const title = element('h2'); const titleLink = routeLink(lesson.title, { feature: 'textbook', lesson: lesson.id, section: 'vocab' }); titleLink.lang = 'zh'; title.append(titleLink);
      const subtitle = element('p', lesson.titleVi); subtitle.className = 'lesson-subtitle';
      card.append(number, title, subtitle);
      const sections = element('nav'); sections.className = 'lesson-section-links'; sections.setAttribute('aria-label', `第${lesson.id}课的五个教材部分 · Năm mục giáo trình bài ${lesson.id}`);
      for (const section of SECTIONS) {
        const link = routeLink({ zh: sectionChinese[section], vi: sectionLabels[section] }, { feature: 'textbook', lesson: lesson.id, section });
        link.title = `${sectionChinese[section]} · ${sectionLabels[section]}`; link.dataset.lessonSection = section; sections.append(link);
      }
      const detail = element('details'); detail.className = 'lesson-detail';
      detail.append(element('summary', { zh: '查看各部分', vi: 'Xem các phần' }), sections);
      card.append(detail);
      const actions = element('div'); actions.className = 'lesson-actions';
      for (const feature of ['homework', 'listening'] as const) actions.append(routeLink({ zh: featureChinese[feature], vi: featureLabels[feature] }, { feature, lesson: lesson.id, ...(feature === 'homework' ? { homeworkVersion: '30-v1' as const } : {}) }));
      detail.append(actions); grid.append(card);
    }
    catalogue.append(grid);
    search.addEventListener('input', () => {
      const key = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase();
      const query = key(search.value.trim());
      for (const card of grid.querySelectorAll<HTMLElement>('.lesson-card')) card.hidden = !!query && !key(card.dataset.searchText ?? '').includes(query);
    }, { signal: controller.signal });
    const progressDetails = element('details'); progressDetails.className = 'home-progress-details'; progressDetails.append(element('summary', C.learningDetails), overview);
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
        if (!state) { state = element('p'); state.dataset.readingSummary = ''; card.querySelector('.lesson-detail')!.append(state); }
        setBilingual(state, M.readingState(row.reading.complete, row.reading.visited, row.reading.modules));
        let work = card.querySelector<HTMLElement>('[data-homework-summary]');
        if (!work) { work = element('p'); work.dataset.homeworkSummary = ''; card.insertBefore(work, card.querySelector('.lesson-detail')); }
        const current = model.currentHomework.lessons.find(item => item.lesson === row.lesson)!;
        setBilingual(work, { zh: `新版作业 ${current.homework.submitted}/30 · 教材 ${row.reading.modules}/5 部分`, vi: `Bài tập mới ${current.homework.submitted}/30 · Giáo trình ${row.reading.modules}/5 phần` });
        // Keep the existing one-link-per-domain card contract, pointing homework at the next unlocked group.
        const homework = card.querySelector<HTMLAnchorElement>('a[href^="#/homework?"]');
        if (homework) homework.href = routeHref(current.nextRoute);
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
