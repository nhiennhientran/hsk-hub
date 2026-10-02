import { coreCopy as C } from '../../app/i18n/core.ts';
import { setBilingual } from '../../app/bilingual.ts';
import { createDueRefresh } from '../due-refresh.ts';
import type { FeatureModule } from '../../app/contracts.ts';
import { summarizeProgress } from '../../services/learning/progress.ts';
import { loadProgressSources } from './content.ts';
import { element, renderContinuation, renderLessonProgress, renderProgressOverview, storageStatusText } from './summary.ts';
import './progress.css';

/** Unified read-only progress over the application session; backup behavior remains separate. */
export const mount: FeatureModule['mount'] = (host, context) => {
  const article = element('article'); article.id = 'progress-module'; article.className = 'module-entry';
  const heading = element('h1', C.progressTitle); heading.tabIndex = -1;
  article.append(heading, element('p', C.progressLead));
  const continuation = element('p'); continuation.id = 'progress-resume'; continuation.hidden = true;
  const status = element('p'); status.id = 'progress-save-status'; status.className = 'progress-save-status'; status.setAttribute('role', 'status');
  const overview = element('div'); overview.id = 'progress-overview'; overview.className = 'progress-overview';
  const lessonProgress = element('section'); lessonProgress.id = 'progress-lessons';
  const controls = element('div'); controls.className = 'data-manager-controls';
  const managerHost = element('div'); managerHost.id = 'data-manager-host';
  const open = element('button', C.backups); open.id = 'open-data-manager'; open.type = 'button'; open.disabled = true;
  const close = element('button', { zh: '返回学习进度', vi: 'Trở lại tiến độ học' }); close.type = 'button'; close.id = 'close-data-manager'; close.className = 'data-manager-close'; close.hidden = true;
  const message = element('p'); message.setAttribute('role', 'status');
  controls.append(open, close, message); article.append(continuation, status, overview, controls, managerHost, lessonProgress); host.append(article);
  const controller = new AbortController();
  let left = false, unsubscribe = () => {};
  let panel: { dispose(): void } | undefined;
  let dueRefresh: ReturnType<typeof createDueRefresh> | undefined;
  const abort = () => controller.abort();
  context.signal.addEventListener('abort', abort, { once: true });
  if (context.signal.aborted) abort();
  const ready = Promise.resolve().then(async () => {
    if (!context.learning) throw new Error('Learning session is missing.');
    const [sources, session] = await Promise.all([loadProgressSources(controller.signal), context.learning()]);
    if (left || controller.signal.aborted) return;
    const render = () => {
      if (left || controller.signal.aborted) return;
      const snapshot = session.store.snapshot();
      const model = summarizeProgress(snapshot.data, sources);
      status.dataset.state = snapshot.status;
      status.textContent = storageStatusText(snapshot.status, snapshot.issue);
      renderContinuation(continuation, model.resume, 'progress-resume-link');
      if (!close.hidden) continuation.hidden = true;
      renderProgressOverview(overview, model);
      renderLessonProgress(lessonProgress, model);
      dueRefresh?.schedule(model.vocabulary.nextDueAt);
    };
    dueRefresh = createDueRefresh(render, controller.signal);
    unsubscribe = session.store.subscribe(render); render();
    open.disabled = false;
    open.addEventListener('click', async () => {
      if (left || controller.signal.aborted || open.disabled) return;
      if (panel) { overview.hidden = true; lessonProgress.hidden = true; continuation.hidden = true; managerHost.hidden = false; open.hidden = true; close.hidden = false; close.focus(); return; }
      open.disabled = true; setBilingual(message, C.openingData);
      try {
        const feature = await import('./data-panel.ts');
        if (left || controller.signal.aborted) return;
        if (!context.learning) throw new Error('Learning session is missing.');
        panel = await feature.mountDataPanel(managerHost, controller.signal, context.learning);
        if (left || controller.signal.aborted) { panel.dispose(); return; }
        message.textContent = ''; open.hidden = true; open.disabled = false; close.hidden = false; overview.hidden = true; lessonProgress.hidden = true; continuation.hidden = true; managerHost.hidden = false; close.focus();
      } catch {
        if (left || controller.signal.aborted) return;
        setBilingual(message, C.dataError); open.disabled = false;
      }
    }, { signal: controller.signal });
    close.addEventListener('click', () => { managerHost.hidden = true; overview.hidden = false; lessonProgress.hidden = false; open.hidden = false; close.hidden = true; render(); open.focus(); }, { signal: controller.signal });
  });
  return {
    ready,
    unmount() {
      if (left) return;
      left = true; controller.abort(); unsubscribe(); dueRefresh?.dispose(); panel?.dispose(); article.remove();
      context.signal.removeEventListener('abort', abort);
    },
  };
};
