/** Display-only deadline refresh; it never changes or saves learner state. */
export function createDueRefresh(render: () => void, signal: AbortSignal) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clear = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; };
  const refresh = () => { if (!signal.aborted) render(); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); }, { signal });
  signal.addEventListener('abort', clear, { once: true });
  return {
    schedule(nextDueAt: number | null): void {
      clear();
      if (nextDueAt !== null && !signal.aborted) timer = setTimeout(refresh, Math.min(2147483647, Math.max(1, nextDueAt - Date.now() + 1)));
    },
    dispose: clear,
  };
}
