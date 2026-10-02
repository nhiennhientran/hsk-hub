import { loadHomeworkBank } from '../../services/content/homework.ts';
import practice from '../../domain/practice/engine.js';
import type { ListeningCatalog } from '../../services/content/listening.ts';
import type { ProgressSources } from '../../services/learning/progress.ts';

/** Progress needs the question/sense catalog, not media or another learner store. */
export async function loadProgressSources(signal: AbortSignal): Promise<ProgressSources> {
  const [bank, catalog] = await Promise.all([loadHomeworkBank(signal), (async () => {
    const response = await fetch(new URL('../../../content/stage3-catalog.json', import.meta.url), { signal });
    if (!response.ok) throw new Error(`Không tải được danh mục tiến độ (HTTP ${response.status}).`);
    const value: unknown = await response.json();
    signal.throwIfAborted();
    practice.importBackup(practice.blank(), value);
    return value as ListeningCatalog;
  })()]);
  signal.throwIfAborted();
  return { bank, catalog };
}
