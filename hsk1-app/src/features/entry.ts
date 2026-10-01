import type { Feature, FeatureModule, ModuleContext } from '../app/contracts.ts';
import { SECTIONS, PARTS } from '../app/contracts.ts';
import { featureLabels, sectionLabels, partLabels } from '../app/labels.ts';
import { routeHref } from '../app/router.ts';
import { loadCourseIndex, type LessonSummary } from '../services/content/index.ts';

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function link(label: string, route: ModuleContext['route']): HTMLAnchorElement {
  const anchor = element('a', label); anchor.href = routeHref(route); anchor.dataset.routeLink = '';
  return anchor;
}

function renderHome(host: HTMLElement, lessons: readonly LessonSummary[]): void {
  const grid = element('div'); grid.className = 'lesson-grid';
  for (const lesson of lessons) {
    const card = element('article'); card.className = 'lesson-card'; card.dataset.lesson = String(lesson.id);
    card.append(element('p', `Bài ${lesson.id}`), element('h2', lesson.title), element('p', lesson.titleVi));
    const actions = element('div'); actions.className = 'lesson-actions';
    for (const feature of ['textbook', 'homework', 'listening'] as const) actions.append(link(featureLabels[feature], { feature, lesson: lesson.id }));
    card.append(actions); grid.append(card);
  }
  host.append(grid);
}

/** Temporary entry views. Each feature replaces its own entry in steps 4–7. */
export function createEntryModule(feature: Feature): FeatureModule {
  return {
    mount(host, context) {
      const article = element('article'); article.className = 'module-entry';
      const heading = element('h1', featureLabels[feature]); heading.tabIndex = -1;
      article.append(heading);
      const lessonName = element('p', `Bài ${context.route.lesson} · Đang tải thông tin…`); article.append(lessonName);
      if (feature !== 'home') article.append(element('p', 'Bản xem trước. Phần luyện tập này chưa mở để làm bài.'));
      const controls = element('fieldset'); controls.dataset.moduleControls = ''; controls.disabled = true;
      controls.append(element('legend', 'Thông tin bài học'));
      const preview = element('button', 'Xem thông tin bài'); preview.type = 'button'; preview.dataset.moduleAction = 'preview';
      controls.append(preview); article.append(controls);
      const details = element('div'); details.id = 'entry-details'; details.hidden = true; details.dataset.clickCount = '0';
      article.append(details); host.append(article);
      let left = false;
      const ready = loadCourseIndex(context.signal).then(lessons => {
        if (left || context.signal.aborted) return;
        const lesson = lessons.find(row => row.id === context.route.lesson);
        if (!lesson) throw new Error('Lesson not found.');
        lessonName.textContent = `Bài ${lesson.id} · ${lesson.title} · ${lesson.titleVi}`;
        if (feature === 'home') renderHome(article, lessons);
        if (feature === 'textbook' || feature === 'homework') {
          const navigation = element('nav'); navigation.className = 'subnav'; navigation.setAttribute('aria-label', feature === 'textbook' ? 'Các mục giáo trình' : 'Các phần bài tập');
          const items = feature === 'textbook' ? SECTIONS : PARTS;
          for (const item of items) {
            const target = feature === 'textbook' ? { ...context.route, section: item as typeof SECTIONS[number] } : { ...context.route, part: item as typeof PARTS[number] };
            const anchor = link(feature === 'textbook' ? sectionLabels[item as typeof SECTIONS[number]] : partLabels[item as typeof PARTS[number]], target);
            if (item === (feature === 'textbook' ? context.route.section : context.route.part)) anchor.setAttribute('aria-current', 'page');
            navigation.append(anchor);
          }
          article.insertBefore(navigation, controls);
        }
        const currentPart = feature === 'textbook' ? sectionLabels[context.route.section ?? 'vocab'] : feature === 'homework' ? partLabels[context.route.part ?? 'choice'] : featureLabels[feature];
        details.append(element('h2', `${currentPart} · Bài ${lesson.id}`), element('p', `${lesson.vocabularyCount} từ trong giáo trình · ${lesson.scenesCount} bài khoá · ${lesson.homeworkCount} câu bài tập · ${lesson.listeningCount} câu nghe · ${lesson.senseCount} thẻ nghĩa.`));
        preview.addEventListener('click', () => {
          if (left || context.signal.aborted) return;
          details.hidden = false; details.dataset.clickCount = String(Number(details.dataset.clickCount) + 1);
        }, { signal: context.signal });
      });
      return { ready, unmount() { if (left) return; left = true; article.remove(); } };
    },
  };
}
