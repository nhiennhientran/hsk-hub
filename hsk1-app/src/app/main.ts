import './bilingual.css';
import { bilingualText, setBilingual } from './bilingual.ts';
import { coreCopy, lessonCopy } from './i18n/core.ts';
import './styles.css';
import { FEATURES, type Feature, type FeatureModule, type Route } from './contracts.ts';
import { featureLabels, featureChinese } from './labels.ts';
import { createRouter, normalizeRoute, parseRoute } from './router.ts';
import { createLifecycle } from './lifecycle.ts';
import { createSessionAuth } from '../services/auth/index.ts';

const loaders: Record<Feature, () => Promise<FeatureModule>> = {
  home: () => import('../features/home/index.ts'),
  textbook: () => import('../features/textbook/index.ts'),
  homework: () => import('../features/homework/index.ts'),
  exercises: () => import('../features/exercises/index.ts'),
  listening: () => import('../features/listening/index.ts'),
  vocabulary: () => import('../features/vocabulary/index.ts'),
  review: () => import('../features/review/index.ts'),
  progress: () => import('../features/progress/index.ts'),
};

function startApplication(): () => void {
  const candidate = document.querySelector<HTMLElement>('#app');
  if (!candidate) throw new Error('Application root is missing.');
  const root = candidate;
  const events = new AbortController();
  let audio: Promise<import('../services/audio/index.ts').AudioService> | undefined;
  const getAudio = () => {
    if (!audio) {
      audio = import('../services/audio/index.ts').then(module => module.createBrowserAudioService());
      void audio.catch(() => { audio = undefined; });
    }
    return audio;
  };
  let learning: Promise<import('../services/learning/session.ts').LearningSession> | undefined;
  let sessionForExit: import('../services/learning/session.ts').LearningSession | undefined;
  const getLearning = () => {
    if (!learning) {
      learning = import('../services/learning/session.ts').then(module => module.loadLearningSession(events.signal)).then(session => { sessionForExit = session; return session; });
      void learning.catch(() => { learning = undefined; });
    }
    return learning;
  };
  const router = createRouter(window);
  root.innerHTML = `
    <a class="skip-link" href="#module-host">${bilingualText(coreCopy.skip)}</a>
    <header class="site-header"><a class="brand" data-route-link href="${router.href({ feature: 'home', lesson: 1 })}"><span lang="zh">汉语课件</span><small>然老师 · Cô Nhiên · HSK 1</small></a><span class="course-badge">${bilingualText(coreCopy.course)}</span></header>
    <nav id="feature-nav" class="feature-nav" aria-label="${bilingualText(coreCopy.navigation)}">${FEATURES.map(feature => `<a data-route-link data-feature="${feature}" href="${router.href({ feature, lesson: 1 })}"><span lang="zh">${featureChinese[feature]}</span><span lang="vi">${featureLabels[feature]}</span></a>`).join('')}</nav>
    <main>
      <div class="lesson-picker"><label for="lesson-select">${bilingualText(coreCopy.chooseLesson)}</label><select id="lesson-select">${Array.from({ length: 15 }, (_, index) => `<option value="${index + 1}">${bilingualText(lessonCopy(index + 1))}</option>`).join('')}</select></div>
      <p id="module-status" role="status" aria-live="polite"></p>
      <p id="session-message" role="status" hidden></p>
      <p id="navigation-message" role="alert" hidden></p>
      <button id="retry-module" type="button" hidden>${bilingualText(coreCopy.retry)}</button>
      <section id="module-host" tabindex="-1" aria-label="${bilingualText(coreCopy.content)}"></section>
    </main>
    <footer><span id="footer-note"></span> <a id="footer-backups" data-route-link href="${router.href({ feature: 'progress', lesson: 1 })}"></a> · <a id="footer-levels" href="https://nhiennhientran.github.io/hsk-hub/new-hsk1/index.html"></a> ↗ · <a id="footer-help" href="./help.html"></a></footer>
  `;
  setBilingual(root.querySelector<HTMLElement>('label[for="lesson-select"]')!, coreCopy.chooseLesson);
  setBilingual(root.querySelector<HTMLElement>('.skip-link')!, coreCopy.skip);
  setBilingual(root.querySelector<HTMLElement>('#retry-module')!, coreCopy.retry);
  setBilingual(root.querySelector<HTMLElement>('#footer-note')!, coreCopy.footer);
  setBilingual(root.querySelector<HTMLElement>('#footer-backups')!, coreCopy.backups);
  setBilingual(root.querySelector<HTMLElement>('#footer-levels')!, coreCopy.levels);
  setBilingual(root.querySelector<HTMLElement>('#footer-help')!, '学习帮助', 'Hướng dẫn học');
  root.querySelector('label[for="lesson-select"]')!.classList.add('bilingual-stacked');
  const host = root.querySelector<HTMLElement>('#module-host')!;
  const status = root.querySelector<HTMLElement>('#module-status')!;
  const retry = root.querySelector<HTMLButtonElement>('#retry-module')!;
  const lessons = root.querySelector<HTMLSelectElement>('#lesson-select')!;
  const lifecycle = createLifecycle({
    host, learning: getLearning, audio: getAudio, navigate: route => navigateSafely(route),
    loadModule: (feature, signal) => {
      if (signal.aborted) return Promise.reject(new DOMException('Module left.', 'AbortError'));
      return loaders[feature]();
    },
    onState({ state, route }) {
      host.dataset.feature = route.feature; host.dataset.lesson = String(route.lesson);
      root.dataset.moduleState = state;
      retry.hidden = state !== 'error';
      status.textContent = state === 'loading' ? bilingualText(coreCopy.loading) : state === 'error' ? bilingualText(coreCopy.loadError) : `${featureChinese[route.feature]} · ${featureLabels[route.feature]} · ${bilingualText(lessonCopy(route.lesson))}`;
      if (state === 'ready') {
        const heading = host.querySelector<HTMLElement>('h1');
        if (heading && !heading.querySelector('[lang="zh"]') && route.feature !== 'textbook') {
          const chinese = { home: '自由选课', homework: '课后作业', exercises: '练习', listening: '听力练习', vocabulary: '生词卡', review: '复习', progress: '学习进度' };
          const translation = document.createElement('span'); translation.lang = 'zh'; translation.className = 'heading-zh';
          translation.textContent = chinese[route.feature as keyof typeof chinese] ?? ''; heading.append(translation);
        }
        heading?.focus({ preventScroll: true });
      }
    },
  });
  let unsubscribe: (() => void) | undefined;
  let displayedRoute: Route | undefined;
  function canLeave(): boolean {
    let blocked = false;
    try { blocked = sessionForExit?.prepareExit() ?? false; } catch { blocked = true; }
    const warning = root.querySelector<HTMLElement>('#navigation-message')!;
    warning.hidden = !blocked;
    warning.classList.add('bilingual-stacked');
    if (blocked) setBilingual(warning, coreCopy.unfinished); else warning.replaceChildren();
    return !blocked;
  }
  function navigateSafely(route: Route): void {
    if (!canLeave()) { if (displayedRoute) updateNavigation(displayedRoute); return; }
    router.navigate(route);
    updateNavigation(router.current());
  }
  function updateNavigation(route: Route): void {
    lessons.value = String(route.lesson);
    root.dataset.feature = route.feature;
    root.querySelector<HTMLElement>('.lesson-picker')!.hidden = route.feature === 'home';
    root.querySelectorAll<HTMLAnchorElement>('#feature-nav a[data-feature]').forEach(anchor => {
      const feature = anchor.dataset.feature as Feature;
      anchor.href = router.href(feature === route.feature ? route : normalizeRoute({ feature, lesson: route.lesson }));
      if (route.feature === feature) anchor.setAttribute('aria-current', 'page'); else anchor.removeAttribute('aria-current');
    });
    document.title = `${featureChinese[route.feature]} · ${featureLabels[route.feature]} · ${bilingualText(lessonCopy(route.lesson))} · HSK 1`;
  }
  function begin(): void {
    if (unsubscribe || events.signal.aborted) return;
    root.inert = false;
    const render = (route: Route) => {
      if (displayedRoute && router.href(route) === router.href(displayedRoute)) { updateNavigation(route); return; }
      if (displayedRoute && !canLeave()) {
        router.navigate(displayedRoute, { replace: true }); updateNavigation(displayedRoute); return;
      }
      displayedRoute = route; updateNavigation(route); void lifecycle.show(route);
    };
    unsubscribe = router.subscribe(render);
    render(router.current());
  }
  root.addEventListener('click', event => {
    if (event.defaultPrevented || !(event instanceof MouseEvent) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('.skip-link')) { event.preventDefault(); host.focus(); return; }
    const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[data-route-link]');
    if (!anchor || !root.contains(anchor) || anchor.target || anchor.hasAttribute('download')) return;
    event.preventDefault(); navigateSafely(parseRoute(anchor.href));
  }, { signal: events.signal });
  lessons.addEventListener('change', () => navigateSafely(normalizeRoute({ ...router.current(), lesson: Number(lessons.value) })), { signal: events.signal });
  retry.addEventListener('click', () => { void lifecycle.retry(); }, { signal: events.signal });

  let storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  try { storage = window.sessionStorage; }
  catch { storage = { getItem() { throw new Error('Unavailable'); }, setItem() { throw new Error('Unavailable'); }, removeItem() { throw new Error('Unavailable'); } }; }
  const auth = createSessionAuth(storage);
  const gate = document.createElement('section'); gate.id = 'auth-gate'; gate.className = 'auth-gate';
  gate.setAttribute('role', 'dialog'); gate.setAttribute('aria-modal', 'true'); gate.setAttribute('aria-labelledby', 'auth-title');
  gate.innerHTML = `<form id="auth-form" class="auth-card"><h1 id="auth-title">${bilingualText(coreCopy.authTitle)}</h1><p>${bilingualText(coreCopy.authHint)}</p><label for="class-password">${bilingualText(coreCopy.password)}</label><input id="class-password" type="password" autocomplete="current-password" required><button id="unlock-session" type="submit">${bilingualText(coreCopy.enter)}</button><p id="auth-message" role="alert"></p></form>`;
  setBilingual(gate.querySelector<HTMLElement>('#auth-title')!, coreCopy.authTitle);
  setBilingual(gate.querySelector<HTMLElement>('.auth-card > p')!, coreCopy.authHint);
  setBilingual(gate.querySelector<HTMLElement>('label[for="class-password"]')!, coreCopy.password);
  setBilingual(gate.querySelector<HTMLElement>('#unlock-session')!, coreCopy.enter);
  gate.querySelector('#auth-title')!.classList.add('bilingual-stacked');
  document.body.append(gate); root.inert = true;
  const password = gate.querySelector<HTMLInputElement>('#class-password')!;
  const unlock = gate.querySelector<HTMLButtonElement>('#unlock-session')!;
  const message = gate.querySelector<HTMLElement>('#auth-message')!;
  gate.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const items = [...gate.querySelectorAll<HTMLElement>('input, button:not(:disabled)')];
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }, { signal: events.signal });
  gate.querySelector<HTMLFormElement>('#auth-form')!.addEventListener('submit', async event => {
    event.preventDefault(); if (unlock.disabled) return;
    unlock.disabled = true;
    try {
      const result = await auth.unlock(password.value);
      if (events.signal.aborted) return;
      if (!result.accepted) {
        setBilingual(message, result.reason === 'unsupported-crypto' ? coreCopy.unsupported : coreCopy.incorrect);
        password.select(); return;
      }
      password.value = ''; gate.hidden = true; begin();
      if (!result.persisted) {
        const warning = root.querySelector<HTMLElement>('#session-message')!;
        warning.hidden = false;
        setBilingual(warning, coreCopy.tabSession);
      }
    } catch { if (!events.signal.aborted) setBilingual(message, coreCopy.authError); }
    finally { unlock.disabled = false; }
  }, { signal: events.signal });
  if (auth.isUnlocked()) { gate.hidden = true; begin(); } else password.focus();
  return () => {
    events.abort(); unsubscribe?.(); lifecycle.dispose(); router.dispose(); gate.remove();
    void learning?.then(session => session.dispose()).catch(() => {});
    void audio?.then(service => service.dispose()).catch(() => {});
  };
}

let dispose = startApplication();
window.addEventListener('pagehide', () => dispose());
window.addEventListener('pageshow', event => { if (event.persisted) dispose = startApplication(); });
