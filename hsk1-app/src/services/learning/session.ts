import { createStore, STORAGE_KEY, WRITE_LOCK, type StoreResult } from '../storage/index.ts';
import { loadCompatibility, type AppData, type Compatibility } from '../storage/compatibility.ts';

export type LearningStore = ReturnType<typeof createStore<AppData>>;
export interface SessionOptions {
  store: LearningStore;
  compatibility: Compatibility;
  delay?: number;
  setTimer?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (timer: ReturnType<typeof setTimeout>) => void;
}

/** One learning session per application. Routes own views, never the learner's data. */
export function createLearningSession(options: SessionOptions) {
  const { store, compatibility } = options;
  const setTimer = options.setTimer ?? setTimeout;
  const clearTimer = options.clearTimer ?? clearTimeout;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inflight: Promise<StoreResult> | undefined;
  let requested = false;
  let closed = false;
  let disposal: Promise<void> | undefined;
  const cancelTimer = () => { if (timer !== undefined) clearTimer(timer); timer = undefined; };

  function flush(): Promise<StoreResult> {
    cancelTimer();
    if (inflight) return inflight;
    if (!requested && store.snapshot().status !== 'unsaved') return Promise.resolve({ ok: true, code: 'unchanged' });
    const run = async (): Promise<StoreResult> => {
      let result: StoreResult;
      do {
        requested = false;
        result = await store.save();
        // Edits while waiting for the lock enter that write. Only later edits
        // need another. A failed write never starts an automatic retry loop.
      } while (result.ok && requested && store.snapshot().status === 'unsaved');
      requested = false;
      cancelTimer();
      return result;
    };
    inflight = run().finally(() => { inflight = undefined; });
    return inflight;
  }
  return {
    store, compatibility,
    requestSave(): void {
      if (closed) return;
      requested = true; cancelTimer();
      timer = setTimer(() => { timer = undefined; void flush(); }, options.delay ?? 300);
    },
    flush,
    dispose(): Promise<void> {
      if (disposal) return disposal;
      closed = true; cancelTimer();
      disposal = flush().then(() => undefined).finally(() => store.dispose());
      return disposal;
    },
  };
}
export type LearningSession = ReturnType<typeof createLearningSession>;

export async function loadLearningSession(signal: AbortSignal): Promise<LearningSession> {
  const compatibility = await loadCompatibility(signal);
  signal.throwIfAborted();
  const storage = {
    getItem(key: string) { return window.localStorage.getItem(key); },
    setItem(key: string, value: string) { window.localStorage.setItem(key, value); },
  };
  const lock = navigator.locks
    ? <R>(task: () => R | Promise<R>): Promise<R> => navigator.locks.request(WRITE_LOCK, task)
    : undefined;
  const session = createLearningSession({ store: createStore<AppData>({ storage, blank: compatibility.blank, validate: compatibility.validate, lock }), compatibility });
  const events = new AbortController();
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY || event.key === null) session.store.observeExternalChange();
  }, { signal: events.signal });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void session.flush(); }, { signal: events.signal });
  const dispose = session.dispose;
  session.dispose = () => { events.abort(); return dispose(); };
  return session;
}
