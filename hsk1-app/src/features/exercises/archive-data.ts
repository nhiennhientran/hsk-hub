import type { Route } from '../../app/contracts.ts';
import { normalizeRoute } from '../../app/router.ts';
import type { Answer, HomeworkAttempt, HomeworkState } from '../../domain/types.ts';
import type { ExerciseCatalogue, ExerciseEntry, ExerciseTask } from '../../domain/exercises/catalogue.ts';
import type { ExercisesState, ExerciseSubmission } from '../../domain/exercises/engine.ts';

export interface ArchivedTimeline {
  readonly source: 'exercises' | 'homework';
  readonly first?: ExerciseSubmission;
  readonly latest?: ExerciseSubmission;
  /** Saved sequence, not sorted by wall clock; the old homework history can be capped. */
  readonly submissions: readonly ExerciseSubmission[];
  readonly draft?: Answer;
}
export interface ArchivedExercise {
  readonly entry: ExerciseEntry;
  readonly task: ExerciseTask;
  readonly timelines: readonly ArchivedTimeline[];
}

function homeworkSubmission(attempt: HomeworkAttempt | null, id: string): ExerciseSubmission | undefined {
  if (!attempt || !Object.hasOwn(attempt.answers, id)) return;
  const correct = attempt.assessment === 'manual' ? null : attempt.results?.[id];
  if (correct !== null && typeof correct !== 'boolean') return;
  const fingerprint = attempt.questionFingerprints[id];
  if (!fingerprint) return;
  return { answer: structuredClone(attempt.answers[id]!), correct, at: attempt.at, fingerprint };
}

/** Read-only projection. Never grade, migrate, update navigation, or fill missing answers. */
export function archivedExercises(catalogue: ExerciseCatalogue, exercises: ExercisesState, route: Route, homework?: HomeworkState): ArchivedExercise[] {
  const scope = normalizeRoute({ ...route, feature: 'exercises' });
  return catalogue.entries.flatMap(entry => {
    if (entry.set !== scope.exerciseSet || entry.lesson !== scope.lesson || entry.group !== scope.exerciseGroup) return [];
    const task = catalogue.tasks.get(entry.authorityId);
    if (!task) return [];
    const timelines: ArchivedTimeline[] = [];
    // Only the old homework-review URL can expose an original homework receipt.
    // An alias in another bank does not prove the learner used that entry there.
    if (entry.set === 'homework-review' && homework && (entry.group === 'choice' || entry.group === 'sort')) {
      const group = homework.lessons[String(entry.lesson)]?.[entry.group];
      if (group) {
        const first = homeworkSubmission(group.first, entry.oldId);
        const latest = homeworkSubmission(group.latest, entry.oldId);
        const submissions = group.history.flatMap(attempt => { const saved = homeworkSubmission(attempt, entry.oldId); return saved ? [saved] : []; });
        const hasDraft = !group.attempt && Object.hasOwn(group.draft, entry.oldId);
        if (first || latest || submissions.length || hasDraft) timelines.push({ source: 'homework', first, latest, submissions, ...(hasDraft ? { draft: structuredClone(group.draft[entry.oldId]!) } : {}) });
      }
    }
    const submissions = structuredClone(exercises.records[task.id]?.submissions ?? []);
    const hasDraft = Object.hasOwn(exercises.drafts, task.id);
    if (submissions.length || hasDraft) timelines.push({ source: 'exercises', first: submissions[0], latest: submissions.at(-1), submissions, ...(hasDraft ? { draft: structuredClone(exercises.drafts[task.id]!) } : {}) });
    return timelines.length ? [{ entry, task, timelines }] : [];
  });
}

/** A readable rendering accompanies the exact raw value; no answer key is consulted. */
export function archivedAnswerText(task: ExerciseTask, answer: Answer): string {
  if (typeof answer === 'string') return answer;
  if (typeof answer === 'number') return task.kind === 'choice' ? task.options[answer] ?? String(answer) : String(answer);
  return task.kind === 'sort' ? answer.map(index => task.tokens[index] ?? String(index)).join(' ') : JSON.stringify(answer);
}
