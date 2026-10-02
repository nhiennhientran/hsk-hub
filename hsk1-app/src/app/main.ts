import './styles.css';
import { FEATURES, type Feature, type FeatureModule, type Route } from './contracts.ts';
import { featureLabels } from './labels.ts';
import { createRouter, normalizeRoute, parseRoute } from './router.ts';
import { createLifecycle } from './lifecycle.ts';
import { createSessionAuth } from '../services/auth/index.ts';

const loaders: Record<Feature, () => Promise<FeatureModule>> = {
  home: () => import('../features/home/index.ts'),
  textbook: () => import('../features/textbook/index.ts'),
  homework: () => import('../features/homework/index.ts'),
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
  const getLearning = () => {
    if (!learning) {
      learning = import('../services/learning/session.ts').then(module => module.loadLearningSession(events.signal));
      void learning.catch(() => { learning = undefined; });
    }
    return learning;
  };
  const router = createRouter(window);
  root.innerHTML = `
    <a class="skip-link" href="#module-host">Đến nội dung</a>
    <header class="site-header"><a class="brand" data-route-link href="${router.href({ feature: 'home', lesson: 1 })}"><span lang="zh">汉语课件</span><small>然老师 · HSK 1</small></a><span class="course-badge">新HSK教程 1 · 15 bài</span></header>
    <nav id="feature-nav" class="feature-nav" aria-label="Nội dung học">${FEATURES.map(feature => `<a data-route-link data-feature="${feature}" href="${router.href({ feature, lesson: 1 })}">${featureLabels[feature]}</a>`).join('')}</nav>
    <main>
      <div class="lesson-picker"><label for="lesson-select">Bài đang chọn</label><select id="lesson-select">${Array.from({ length: 15 }, (_, index) => `<option value="${index + 1}">Bài ${index + 1}</option>`).join('')}</select></div>
      <p id="module-status" role="status" aria-live="polite"></p>
      <p id="session-message" role="status" hidden></p>
      <button id="retry-module" type="button" hidden>Thử tải lại</button>
      <section id="module-host" tabindex="-1" aria-label="Nội dung bài học"></section>
    </main>
    <footer>Giáo trình và bài tập 15 bài đã mở. <a data-route-link href="${router.href({ feature: 'progress', lesson: 1 })}">Quản lý dữ liệu và bản sao lưu</a> · <a href="https://nhiennhientran.github.io/hsk-hub/new-hsk1/index.html">Chọn cấp độ ↗</a></footer>
  `;
  const host = root.querySelector<HTMLElement>('#module-host')!;
  const status = root.querySelector<HTMLElement>('#module-status')!;
  const retry = root.querySelector<HTMLButtonElement>('#retry-module')!;
  const lessons = root.querySelector<HTMLSelectElement>('#lesson-select')!;
  const lifecycle = createLifecycle({
    host, learning: getLearning, audio: getAudio, navigate: route => router.navigate(route),
    loadModule: (feature, signal) => {
      if (signal.aborted) return Promise.reject(new DOMException('Module left.', 'AbortError'));
      return loaders[feature]();
    },
    onState({ state, route }) {
      host.dataset.feature = route.feature; host.dataset.lesson = String(route.lesson);
      retry.hidden = state !== 'error';
      status.textContent = state === 'loading' ? 'Đang chuẩn bị nội dung…' : state === 'error' ? 'Chưa tải được nội dung. Hãy thử lại; bài đang chọn vẫn được giữ.' : `${featureLabels[route.feature]} · Bài ${route.lesson}`;
      if (state === 'ready') {
        const heading = host.querySelector<HTMLElement>('h1');
        if (heading && !heading.querySelector('[lang="zh"]') && route.feature !== 'textbook') {
          const chinese = { home: '自由选课', homework: '课后作业', listening: '听力练习', vocabulary: '生词卡', review: '复习', progress: '学习进度' };
          const translation = document.createElement('span'); translation.lang = 'zh'; translation.className = 'heading-zh';
          translation.textContent = chinese[route.feature as keyof typeof chinese] ?? ''; heading.append(translation);
        }
        heading?.focus({ preventScroll: true });
      }
    },
  });
  let unsubscribe: (() => void) | undefined;
  function updateNavigation(route: Route): void {
    lessons.value = String(route.lesson);
    root.dataset.feature = route.feature;
    root.querySelector<HTMLElement>('.lesson-picker')!.hidden = route.feature === 'home';
    root.querySelectorAll<HTMLAnchorElement>('#feature-nav a[data-feature]').forEach(anchor => {
      const feature = anchor.dataset.feature as Feature;
      anchor.href = router.href(feature === route.feature ? route : normalizeRoute({ feature, lesson: route.lesson }));
      if (route.feature === feature) anchor.setAttribute('aria-current', 'page'); else anchor.removeAttribute('aria-current');
    });
    document.title = `${featureLabels[route.feature]} · Bài ${route.lesson} · HSK 1`;
  }
  function begin(): void {
    if (unsubscribe || events.signal.aborted) return;
    root.inert = false;
    const render = (route: Route) => { updateNavigation(route); void lifecycle.show(route); };
    unsubscribe = router.subscribe(render);
    render(router.current());
  }
  root.addEventListener('click', event => {
    if (event.defaultPrevented || !(event instanceof MouseEvent) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('.skip-link')) { event.preventDefault(); host.focus(); return; }
    const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[data-route-link]');
    if (!anchor || !root.contains(anchor) || anchor.target || anchor.hasAttribute('download')) return;
    event.preventDefault(); router.navigate(parseRoute(anchor.href));
  }, { signal: events.signal });
  lessons.addEventListener('change', () => router.navigate(normalizeRoute({ ...router.current(), lesson: Number(lessons.value) })), { signal: events.signal });
  retry.addEventListener('click', () => { void lifecycle.retry(); }, { signal: events.signal });

  let storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  try { storage = window.sessionStorage; }
  catch { storage = { getItem() { throw new Error('Unavailable'); }, setItem() { throw new Error('Unavailable'); }, removeItem() { throw new Error('Unavailable'); } }; }
  const auth = createSessionAuth(storage);
  const gate = document.createElement('section'); gate.id = 'auth-gate'; gate.className = 'auth-gate';
  gate.setAttribute('role', 'dialog'); gate.setAttribute('aria-modal', 'true'); gate.setAttribute('aria-labelledby', 'auth-title');
  gate.innerHTML = `<form id="auth-form" class="auth-card"><h1 id="auth-title">Vào lớp của cô Nhiên</h1><p>Nhập mật khẩu lớp học để tiếp tục.</p><label for="class-password">Mật khẩu</label><input id="class-password" type="password" autocomplete="current-password" required><button id="unlock-session" type="submit">Vào học</button><p id="auth-message" role="alert"></p></form>`;
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
        message.textContent = result.reason === 'unsupported-crypto'
          ? 'Trình duyệt không hỗ trợ kiểm tra mật khẩu an toàn. Hãy mở trang bằng HTTPS trên trình duyệt mới hơn.'
          : 'Mật khẩu chưa đúng. Hãy thử lại.';
        password.select(); return;
      }
      password.value = ''; gate.hidden = true; begin();
      if (!result.persisted) {
        const warning = root.querySelector<HTMLElement>('#session-message')!;
        warning.hidden = false;
        warning.textContent = 'Phiên học chỉ được giữ trong tab này; tải lại trang có thể cần nhập lại mật khẩu.';
      }
    } catch { if (!events.signal.aborted) message.textContent = 'Chưa kiểm tra được mật khẩu. Hãy thử lại.'; }
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
