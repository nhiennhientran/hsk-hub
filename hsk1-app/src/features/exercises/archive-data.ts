import type { AppData } from '../../services/storage/compatibility.ts';
import { applyViSnapshot } from '../../services/content/official-vi-revisions.ts';
import { homeworkDisplaySnapshot } from '../../services/content/vi-presentation-state.ts';
import type { Route } from '../../app/contracts.ts';
import { normalizeRoute } from '../../app/router.ts';
import type { Answer, HomeworkAttempt, HomeworkState } from '../../domain/types.ts';
import type { ExerciseCatalogue, ExerciseEntry, ExerciseTask } from '../../domain/exercises/catalogue.ts';
import type { ExercisesState, ExerciseSubmission } from '../../domain/exercises/engine.ts';

export type ArchivedSubmission = ExerciseSubmission & { readonly displayTask?: ExerciseTask; readonly displayBindingId?: string };
export interface ArchivedTimeline {
  readonly source: 'exercises' | 'homework';
  readonly first?: ArchivedSubmission;
  readonly latest?: ArchivedSubmission;
  /** Saved sequence, not sorted by wall clock; the old homework history can be capped. */
  readonly submissions: readonly ArchivedSubmission[];
  readonly draft?: Answer;
  readonly displayDraftTask?: ExerciseTask;
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
export function archivedExercises(catalogue: ExerciseCatalogue, exercises: ExercisesState, route: Route, homework?: HomeworkState, data?: AppData): ArchivedExercise[] {
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
        const display = (saved: ExerciseSubmission | undefined, slot: 'first' | 'latest' | number): ArchivedSubmission | undefined => {
          if (!saved || !data) return saved;
          const snapshot = homeworkDisplaySnapshot(data, 'legacy', entry.lesson, entry.group, [], slot);
          if (!snapshot) return saved;
          const group = data.viPresentation?.homework[`legacy:${entry.lesson}:${entry.group}`];
          const displayBindingId = typeof slot === 'number' ? group?.history[slot] : group?.[slot];
          return { ...saved, displayTask: applyViSnapshot(task, entry.oldId, 'homework', snapshot), ...(displayBindingId ? { displayBindingId } : {}) };
        };
        const first = display(homeworkSubmission(group.first, entry.oldId), 'first');
        const latest = display(homeworkSubmission(group.latest, entry.oldId), 'latest');
        const submissions = group.history.flatMap((attempt, index) => { const saved = display(homeworkSubmission(attempt, entry.oldId), index); return saved ? [saved] : []; });
        const hasDraft = !group.attempt && Object.hasOwn(group.draft, entry.oldId);
        if (first || latest || submissions.length || hasDraft) timelines.push({ source: 'homework', first, latest, submissions, ...(hasDraft ? { draft: structuredClone(group.draft[entry.oldId]!), ...(data ? { displayDraftTask: applyViSnapshot(task, entry.oldId, 'homework', homeworkDisplaySnapshot(data, 'legacy', entry.lesson, entry.group, [], 'draft')) } : {}) } : {}) });
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
