import { FEATURES, PARTS, SECTIONS } from './contracts.ts';
import type { Feature, Part, Route, Section } from './contracts.ts';

type RouteListener = (route: Route) => void;

function isFeature(value: unknown): value is Feature {
  return FEATURES.some(feature => feature === value);
}

function isSection(value: unknown): value is Section {
  return SECTIONS.some(section => section === value);
}

function isPart(value: unknown): value is Part {
  return PARTS.some(part => part === value);
}

/** Routes only contain the fields relevant to their feature. */
export function normalizeRoute(input: Partial<Route>): Route {
  const feature = isFeature(input.feature) ? input.feature : 'home';
  const lesson = Number.isInteger(input.lesson) && input.lesson! >= 1 && input.lesson! <= 15
    ? input.lesson!
    : 1;
  if (feature === 'textbook') {
    return Object.freeze({ feature, lesson, section: isSection(input.section) ? input.section : 'vocab' });
  }
  if (feature === 'homework') {
    return Object.freeze({ feature, lesson, part: isPart(input.part) ? input.part : 'choice' });
  }
  return Object.freeze({ feature, lesson });
}

function readLesson(value: string | null): number {
  return value === null || value.trim() === '' ? 1 : Number(value);
}

function readURL(input: URL | string): URL | undefined {
  try {
    return new URL(String(input), 'https://hsk.invalid/');
  } catch {
    return undefined;
  }
}

/** Canonical hashes take precedence over every legacy pathname/query/hash. */
export function parseRoute(input: URL | string): Route {
  const url = readURL(input);
  if (!url) return normalizeRoute({});

  if (url.hash.startsWith('#/')) {
    const hash = url.hash.slice(2);
    const separator = hash.indexOf('?');
    const feature = separator === -1 ? hash : hash.slice(0, separator);
    const params = new URLSearchParams(separator === -1 ? '' : hash.slice(separator + 1));
    return normalizeRoute({
      feature: isFeature(feature) ? feature : undefined,
      lesson: readLesson(params.get('lesson')),
      section: isSection(params.get('section')) ? params.get('section') as Section : undefined,
      part: isPart(params.get('part')) ? params.get('part') as Part : undefined,
    });
  }

  const filename = url.pathname.split('/').at(-1) ?? '';
  const textbookPage = /^lesson\.html$/i.test(filename);
  const defaultFeature = textbookPage ? 'textbook' : /^learning.*\.html$/i.test(filename) ? 'homework' : 'home';
  const mode = url.searchParams.get('mode');
  const feature = mode === 'vocab' ? 'vocabulary' : isFeature(mode) ? mode : defaultFeature;
  let lesson = readLesson(textbookPage
    ? url.searchParams.get('id') ?? url.searchParams.get('lesson')
    : url.searchParams.get('lesson'));
  let part = url.searchParams.get('stage') ?? url.searchParams.get('part');

  // The integrated homework page used its hash to override the query route.
  if (feature === 'homework') {
    const hash = new URLSearchParams(url.hash.slice(1));
    if (hash.has('lesson')) lesson = readLesson(hash.get('lesson'));
    if (hash.has('part')) part = hash.get('part');
  }

  const section = url.searchParams.get('sec') ?? url.searchParams.get('section');
  return normalizeRoute({
    feature,
    lesson,
    section: isSection(section) ? section : undefined,
    part: isPart(part) ? part : undefined,
  });
}

export function routeHref(route: Route): string {
  const normalized = normalizeRoute(route);
  const params = new URLSearchParams({ lesson: String(normalized.lesson) });
  if (normalized.section) params.set('section', normalized.section);
  if (normalized.part) params.set('part', normalized.part);
  return `#/${normalized.feature}?${params}`;
}

export function routeKey(route: Route): string {
  return routeHref(route);
}

function canonicalURL(href: string, route: Route): URL {
  const url = new URL(href);
  url.search = '';
  url.hash = routeHref(route);
  return url;
}

/** The router owns history writes; location remains the source of the current route. */
export function createRouter(win: Window) {
  const listeners = new Set<RouteListener>();
  let disposed = false;
  let notification = 0;
  let lastKey = routeKey(parseRoute(win.location.href));
  const initialURL = canonicalURL(win.location.href, parseRoute(win.location.href));
  if (initialURL.href !== win.location.href) {
    win.history.replaceState(win.history.state, '', initialURL.href);
  }

  function current(): Route {
    return parseRoute(win.location.href);
  }

  function publish(): void {
    if (disposed) return;
    const route = current();
    const key = routeKey(route);
    if (key === lastKey) return;
    lastKey = key;
    const delivery = ++notification;
    for (const listener of [...listeners]) {
      // A listener may navigate or dispose before later listeners run.
      if (disposed || delivery !== notification) break;
      if (listeners.has(listener)) listener(route);
    }
  }

  function navigate(route: Route, options: { replace?: boolean } = {}): void {
    if (disposed) return;
    const next = normalizeRoute(route);
    if (routeKey(next) === routeKey(current())) return;
    const url = canonicalURL(win.location.href, next);
    if (options.replace) win.history.replaceState(win.history.state, '', url.href);
    else win.history.pushState(null, '', url.href);
    publish();
  }

  function subscribe(listener: RouteListener): () => void {
    if (disposed) return () => {};
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    win.removeEventListener('popstate', publish);
    win.removeEventListener('hashchange', publish);
    listeners.clear();
  }

  win.addEventListener('popstate', publish);
  win.addEventListener('hashchange', publish);
  return { current, navigate, subscribe, href: routeHref, dispose };
}
