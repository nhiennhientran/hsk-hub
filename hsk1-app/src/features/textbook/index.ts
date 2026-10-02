import { SECTIONS, type FeatureModule } from '../../app/contracts.ts';
import { bilingualText, setBilingual } from '../../app/bilingual.ts';
import { readingStatusCopy, textbookCopy as copy, textbookIssue, textbookSection } from '../../app/i18n/textbook.ts';
import '../../app/bilingual.css';
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
  const heading = element('h1', copy.title); heading.tabIndex = -1;
  const name = element('p', copy.loading(context.route.lesson));
  const nav = element('nav'); nav.className = 'subnav'; nav.dataset.textbookSections = ''; nav.setAttribute('aria-label', bilingualText(copy.sections));
  const controls = element('fieldset'); controls.dataset.moduleControls = ''; controls.disabled = true; controls.append(element('legend', copy.contents));
  const loading = element('button', copy.markRead); loading.type = 'button'; loading.disabled = true; loading.id = 'reading-complete'; controls.append(loading);
  const hero = element('header'); hero.className = 'lesson-hero';
  const eyebrow = element('p', `第 ${context.route.lesson} 课 · BÀI ${context.route.lesson}`); eyebrow.className = 'eyebrow';
  hero.append(eyebrow, heading, name); article.append(hero, nav, controls); host.append(article);
  const lifetime = new AbortController(); const close = () => lifetime.abort();
  context.signal.addEventListener('abort', close, { once: true }); if (context.signal.aborted) close();
  let left = false; let unsubscribe = () => {}; let disposeView = () => {}; let disposePlayer = () => {}; let flush = () => {};
  const ready = loadCourseIndex(lifetime.signal).then(async lessons => {
    if (left || lifetime.signal.aborted) return;
    const summary = lessons.find(row => row.id === context.route.lesson); if (!summary) throw new Error(bilingualText(copy.missingLesson));
    if (!context.learning || !context.audio) throw new Error(bilingualText(copy.servicesUnavailable));
    const [content, session, audio] = await Promise.all([loadTextbook(lifetime.signal), context.learning(), context.audio()]);
    if (left || lifetime.signal.aborted) return;
    const lesson = content.lessons.find(row => row.id === summary.id); if (!lesson) throw new Error(bilingualText(copy.missingLesson));
    const section = context.route.section ?? 'vocab';
    const reading = createReadingController({ session, route: { ...context.route, section }, words: lesson.vocab });
    flush = () => { void session.flush(); };
    heading.textContent = lesson.title; heading.lang = 'zh'; name.textContent = lesson.vn_title; name.lang = 'vi';
    for (const item of SECTIONS) {
      const link = routeLink(textbookSection(item, lesson.id), { ...context.route, section: item }); link.dataset.section = item; link.classList.add('bilingual-stacked');
      if (item === section) link.setAttribute('aria-current', 'page'); nav.append(link);
    }
    controls.replaceChildren(element('legend', textbookSection(section, lesson.id)));
    const readingBox = element('div'); readingBox.className = 'textbook-reading';
    const progress = element('p'); progress.id = 'reading-section-status';
    const completeLabel = element('label'); const complete = element('input'); complete.type = 'checkbox'; complete.id = 'reading-complete';
    completeLabel.append(complete, element('span', copy.completed));
    complete.addEventListener('change', () => { reading.setComplete(complete.checked); update(); }, { signal: lifetime.signal });
    const hint = element('p', copy.readingHint); hint.className = 'textbook-hint bilingual-stacked';
    const status = element('p'); status.id = 'reading-save-status'; status.className = 'bilingual-stacked'; status.setAttribute('role', 'status');
    const retry = button(copy.retrySave, () => { void session.flush(); }, lifetime.signal); retry.id = 'retry-reading-save';
    const data = routeLink(copy.manageData, { feature: 'progress', lesson: lesson.id });
    const saveActions = element('div'); saveActions.className = 'textbook-actions'; saveActions.append(retry, data);
    readingBox.append(progress, completeLabel, hint, status, saveActions);
    const playerHost = element('div'); playerHost.className = 'textbook-player-host';
    disposePlayer = mountPlayer(playerHost, audio, lifetime.signal);
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
    } else {
      disposeView = mountPractice(body, { lesson, signal: lifetime.signal }).dispose;
      const more = element('nav'); more.className = 'study-paths'; more.setAttribute('aria-label', bilingualText(copy.otherPractice));
      more.append(routeLink(copy.originalPractice, { feature: 'exercises', lesson: lesson.id }), routeLink(copy.homework, { feature: 'homework', lesson: lesson.id })); body.append(more);
    }
    const journey = element('nav'); journey.className = 'textbook-journey'; journey.setAttribute('aria-label', bilingualText(copy.continue));
    const at = SECTIONS.indexOf(section);
    if (at > 0) journey.append(routeLink({ zh: `← ${textbookSection(SECTIONS[at - 1], lesson.id).zh}`, vi: textbookSection(SECTIONS[at - 1], lesson.id).vi }, { ...context.route, section: SECTIONS[at - 1] }));
    if (at < SECTIONS.length - 1) journey.append(routeLink({ zh: `${textbookSection(SECTIONS[at + 1], lesson.id).zh} →`, vi: textbookSection(SECTIONS[at + 1], lesson.id).vi }, { ...context.route, section: SECTIONS[at + 1] }));
    else if (lesson.id < 15) journey.append(routeLink(copy.nextLesson(lesson.id + 1), { feature: 'textbook', lesson: lesson.id + 1, section: 'vocab' }));
    const lessonsNav = element('nav'); lessonsNav.className = 'textbook-journey'; lessonsNav.setAttribute('aria-label', bilingualText(copy.otherLesson));
    if (lesson.id > 1) lessonsNav.append(routeLink(copy.lesson(lesson.id - 1, 'previous'), { ...context.route, lesson: lesson.id - 1 }));
    lessonsNav.append(routeLink(copy.chooseLesson, { feature: 'home', lesson: lesson.id }));
    if (lesson.id < 15) lessonsNav.append(routeLink(copy.lesson(lesson.id + 1, 'next'), { ...context.route, lesson: lesson.id + 1 }));
    controls.append(journey, lessonsNav, playerHost, readingBox);
    function update(): void {
      const model = reading.read(); complete.checked = model.complete;
      setBilingual(progress, copy.readingProgress(model.modules.length, model.complete));
      const snapshot = session.store.snapshot(); status.dataset.state = snapshot.status;
      setBilingual(status, textbookIssue(snapshot.issue, readingStatusCopy[snapshot.status])); retry.hidden = ['empty', 'saved', 'saving'].includes(snapshot.status); retry.disabled = !snapshot.canWrite || snapshot.status === 'saving'; updateView(model.mastered);
    }
    unsubscribe = session.store.subscribe(update); reading.visit(); update();
  });
  return { ready, unmount() { if (left) return; left = true; lifetime.abort(); context.signal.removeEventListener('abort', close); unsubscribe(); disposeView(); disposePlayer(); flush(); article.remove(); } };
};
