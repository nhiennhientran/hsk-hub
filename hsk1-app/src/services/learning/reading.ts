import { SECTIONS, type Route } from '../../app/contracts.ts';
import { normalizeRoute, routeKey } from '../../app/router.ts';
import type { LearningSession } from './session.ts';

interface Word { zh: string }
interface ReadingOptions { session: LearningSession; route: Route; words: readonly Word[]; now?: () => number }

/** Reading marks and visited sections are independent of homework submission. */
export function createReadingController({ session, route, words, now = Date.now }: ReadingOptions) {
  if (route.feature !== 'textbook' || !Number.isInteger(route.lesson) || route.lesson < 1 || route.lesson > 15) throw new Error('Invalid reading route.');
  const currentRoute = normalizeRoute(route);
  const lesson = String(route.lesson), moduleKey = `hsk1:${lesson}`;
  const allowedWords = new Set(words.map(word => word.zh));
  const key = (word: Word | string) => {
    const zh = typeof word === 'string' ? word : word.zh;
    if (!allowedWords.has(zh)) throw new Error('Word does not belong to this lesson.');
    return `${lesson}-${zh}`;
  };
  return {
    read() {
      const data = session.store.snapshot().data;
      return { visited: !!data.reading.lessons[lesson]?.visited, complete: !!data.reading.lessons[lesson]?.complete,
        modules: data.reading.modules[moduleKey]?.modules ?? [], mastered: data.reading.mastered, navigation: data.navigation };
    },
    visit(): void {
      const data = session.store.snapshot().data;
      const section = currentRoute.section ?? 'vocab';
      if (data.reading.lessons[lesson]?.visited && data.reading.modules[moduleKey]?.modules.includes(section) &&
          data.navigation && routeKey(data.navigation) === routeKey(currentRoute)) return;
      session.store.edit(draft => {
        draft.reading.lessons[lesson] = { ...draft.reading.lessons[lesson], visited: true };
        const old = draft.reading.modules[moduleKey]?.modules ?? [];
        draft.reading.modules[moduleKey] = { modules: SECTIONS.filter(item => old.includes(item) || item === section), updatedAt: now() };
        draft.navigation = currentRoute;
      });
      session.requestSave();
    },
    setComplete(value: boolean): void {
      if (typeof value !== 'boolean') throw new Error('Invalid completion mark.');
      if (!!session.store.snapshot().data.reading.lessons[lesson]?.complete === value) return;
      session.store.edit(draft => { draft.reading.lessons[lesson] = { ...draft.reading.lessons[lesson], complete: value }; });
      session.requestSave();
    },
    isMastered(word: Word | string): boolean { return !!session.store.snapshot().data.reading.mastered[key(word)]; },
    setMastered(word: Word | string, value: boolean): void {
      const id = key(word);
      if (typeof value !== 'boolean') throw new Error('Invalid mastered mark.');
      if (!!session.store.snapshot().data.reading.mastered[id] === value) return;
      session.store.edit(draft => { draft.reading.mastered[id] = value; });
      session.requestSave();
    },
  };
}
export type ReadingController = ReturnType<typeof createReadingController>;
