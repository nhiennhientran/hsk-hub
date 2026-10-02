import { createExerciseCatalogue } from '../../domain/exercises/catalogue.ts';
import type { ExerciseCatalogue } from '../../domain/exercises/catalogue.ts';
import type { AudioRequest } from '../audio/index.ts';
export async function loadExercises(signal: AbortSignal): Promise<ExerciseCatalogue> {
  const { loadHomeworkBank } = await import('./homework.ts');
  const [{ default: legacy }, bank] = await Promise.all([import('../../../content/legacy-exercises.json'), loadHomeworkBank(signal)]);
  signal.throwIfAborted(); return createExerciseCatalogue(legacy, bank);
}
/** Reuse the application's original-track player. No base64 packs, TTS fallback, or new audio owner. */
export function exerciseAudio(catalogue: ExerciseCatalogue, authorityId: string, base = document.baseURI): AudioRequest | null {
  const task = catalogue.tasks.get(authorityId);
  return task?.kind === 'choice' && task.audio ? { url: new URL(`course-assets/audio/${task.audio.track}.mp3`, base).href, start: task.audio.start, end: task.audio.end, label: `Bài ${task.lesson} · ${task.prompt}`, sourceKind: 'segment' } : null;
}
