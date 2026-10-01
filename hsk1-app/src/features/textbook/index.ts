import { SECTIONS, type FeatureModule } from '../../app/contracts.ts';
import { sectionLabels } from '../../app/labels.ts';
import { loadCourseIndex } from '../../services/content/index.ts';
import { loadTextbook } from '../../services/content/textbook.ts';
import { createReadingController } from '../../services/learning/reading.ts';
import { mountVocabulary } from './vocabulary.ts';
import { mountText } from './text.ts';
import { mountLanguage } from './language.ts';
import { mountHanzi } from './hanzi.ts';
import { mountPractice } from './practice.ts';
import { mountPlayer } from './player.ts';
import { button, element, routeLink } from './dom.ts';
import './textbook.css';

export const mount: FeatureModule['mount'] = (host, context) => {
  const article = element('article'); article.id = 'textbook-module'; article.className = 'module-entry textbook';
  const heading = element('h1', 'Giáo trình'); heading.tabIndex = -1;
  const name = element('p', `Bài ${context.route.lesson} · Đang tải thông tin…`);
  const nav = element('nav'); nav.className = 'subnav'; nav.dataset.textbookSections = ''; nav.setAttribute('aria-label', 'Các mục giáo trình');
  const controls = element('fieldset'); controls.dataset.moduleControls = ''; controls.disabled = true; controls.append(element('legend', 'Nội dung giáo trình'));
  const loading = element('button', 'Đánh dấu đã đọc bài'); loading.type = 'button'; loading.disabled = true; loading.id = 'reading-complete'; controls.append(loading);
  article.append(heading, name, nav, controls); host.append(article);
  const lifetime = new AbortController(); const close = () => lifetime.abort();
  context.signal.addEventListener('abort', close, { once: true }); if (context.signal.aborted) close();
  let left = false; let unsubscribe = () => {}; let disposeView = () => {}; let disposePlayer = () => {}; let flush = () => {};
  const ready = loadCourseIndex(lifetime.signal).then(async lessons => {
    if (left || lifetime.signal.aborted) return;
    const summary = lessons.find(row => row.id === context.route.lesson); if (!summary) throw new Error('Lesson not found.');
    if (!context.learning || !context.audio) throw new Error('Learning services unavailable.');
    const [content, session, audio] = await Promise.all([loadTextbook(lifetime.signal), context.learning(), context.audio()]);
    if (left || lifetime.signal.aborted) return;
    const lesson = content.lessons.find(row => row.id === summary.id); if (!lesson) throw new Error('Lesson not found.');
    const section = context.route.section ?? 'vocab';
    const reading = createReadingController({ session, route: { ...context.route, section }, words: lesson.vocab });
    flush = () => { void session.flush(); };
    name.textContent = `Bài ${lesson.id} · ${lesson.title} · ${lesson.vn_title}`;
    for (const item of SECTIONS) {
      const link = routeLink(sectionLabels[item], { ...context.route, section: item }); link.dataset.section = item;
      if (item === section) link.setAttribute('aria-current', 'page'); nav.append(link);
    }
    controls.replaceChildren(element('legend', sectionLabels[section]));
    const readingBox = element('div'); readingBox.className = 'textbook-reading';
    const progress = element('p'); progress.id = 'reading-section-status';
    const completeLabel = element('label'); const complete = element('input'); complete.type = 'checkbox'; complete.id = 'reading-complete';
    completeLabel.append(complete, document.createTextNode(' Tôi đã đọc xong bài này'));
    complete.addEventListener('change', () => { reading.setComplete(complete.checked); update(); }, { signal: lifetime.signal });
    const hint = element('p', 'Đánh dấu đọc giáo trình riêng với điểm và tình trạng nộp bài tập.'); hint.className = 'textbook-hint';
    const status = element('p'); status.id = 'reading-save-status'; status.setAttribute('role', 'status');
    const retry = button('Thử lưu lại', () => { void session.flush(); }, lifetime.signal); retry.id = 'retry-reading-save';
    const data = routeLink('Quản lý dữ liệu và bản sao lưu', { feature: 'progress', lesson: lesson.id });
    const saveActions = element('div'); saveActions.className = 'textbook-actions'; saveActions.append(retry, data);
    readingBox.append(progress, completeLabel, hint, status, saveActions); controls.append(readingBox);
    disposePlayer = mountPlayer(controls, audio, lifetime.signal);
    const body = element('div'); body.className = 'textbook-body'; body.dataset.textbookSection = section; controls.append(body);
    let updateView: (mastered: Readonly<Record<string, boolean>>) => void = () => {};
    if (section === 'vocab') {
      const view = mountVocabulary(body, { lesson, content, audio, signal: lifetime.signal,
        getMastered: () => reading.read().mastered, markMastered: reading.setMastered }); disposeView = view.dispose; updateView = view.update;
    } else if (section === 'text') disposeView = mountText(body, { lesson, content, audio, signal: lifetime.signal }).dispose;
    else if (section === 'grammar') disposeView = mountLanguage(body, { lesson, audio, signal: lifetime.signal }).dispose;
    else if (section === 'hanzi') {
      const view = mountHanzi(body, { chars: lesson.hanzi.chars, words: lesson.vocab, curriculum: lesson.hanzi, signal: lifetime.signal }); disposeView = view.dispose;
      await view.ready;
      if (left || lifetime.signal.aborted) return;
    } else disposeView = mountPractice(body, { lesson, signal: lifetime.signal }).dispose;
    const journey = element('nav'); journey.className = 'textbook-journey'; journey.setAttribute('aria-label', 'Tiếp tục học');
    const at = SECTIONS.indexOf(section);
    if (at > 0) journey.append(routeLink(`← ${sectionLabels[SECTIONS[at - 1]]}`, { ...context.route, section: SECTIONS[at - 1] }));
    if (at < SECTIONS.length - 1) journey.append(routeLink(`${sectionLabels[SECTIONS[at + 1]]} →`, { ...context.route, section: SECTIONS[at + 1] }));
    else if (lesson.id < 15) journey.append(routeLink(`Tiếp đến bài ${lesson.id + 1} →`, { feature: 'textbook', lesson: lesson.id + 1, section: 'vocab' }));
    const lessonsNav = element('nav'); lessonsNav.className = 'textbook-journey'; lessonsNav.setAttribute('aria-label', 'Chọn bài khác');
    if (lesson.id > 1) lessonsNav.append(routeLink(`← Bài ${lesson.id - 1}`, { ...context.route, lesson: lesson.id - 1 }));
    lessonsNav.append(routeLink('Chọn bài học', { feature: 'home', lesson: lesson.id }));
    if (lesson.id < 15) lessonsNav.append(routeLink(`Bài ${lesson.id + 1} →`, { ...context.route, lesson: lesson.id + 1 }));
    controls.append(journey, lessonsNav);
    function update(): void {
      const model = reading.read(); complete.checked = model.complete;
      progress.textContent = `Đã mở ${model.modules.length} / 5 mục giáo trình${model.complete ? ' · Đã đánh dấu đọc xong bài.' : '.'}`;
      const snapshot = session.store.snapshot(); status.dataset.state = snapshot.status;
      const labels = { empty: 'Chưa có dữ liệu cần lưu.', saved: 'Đã lưu trên thiết bị này.', unsaved: 'Có thay đổi chưa lưu.', saving: 'Đang lưu…', conflict: 'Có thay đổi ở tab khác. Thay đổi của bạn vẫn còn trong tab này.', corrupt: 'Dữ liệu không đọc được. Hãy giữ lại dữ liệu gốc trong mục quản lý dữ liệu.', unavailable: 'Chưa lưu được trên thiết bị. Thay đổi chỉ ở trong tab này.' };
      status.textContent = snapshot.issue ?? labels[snapshot.status]; retry.hidden = ['empty', 'saved', 'saving'].includes(snapshot.status); retry.disabled = !snapshot.canWrite || snapshot.status === 'saving'; updateView(model.mastered);
    }
    unsubscribe = session.store.subscribe(update); reading.visit(); update();
  });
  return { ready, unmount() { if (left) return; left = true; lifetime.abort(); context.signal.removeEventListener('abort', close); unsubscribe(); disposeView(); disposePlayer(); flush(); article.remove(); } };
};
