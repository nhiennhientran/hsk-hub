import { recordAttempt, type Attempt, type ListeningRound, type createLearningStore } from './state.ts';

type Store = Pick<ReturnType<typeof createLearningStore>, 'snapshot' | 'saveCandidate'>;

/** Keep immutable receipts out of the live draft until the write is confirmed. */
export async function commitCourseAttempt(
  store: Store,
  key: string,
  attempt: Attempt,
  kind: 'homework' | 'listening',
  signal: AbortSignal,
  isComposing: () => boolean = () => false,
  expectedRound?: ListeningRound,
): Promise<boolean> {
  if (signal.aborted || isComposing()) return false;
  const candidate = store.snapshot().data;
  if (JSON.stringify(candidate.profile) !== JSON.stringify(attempt.profile)) return false;
  const questionId = attempt.questionIds[0];
  let answers = candidate.drafts[key]?.answers;
  let savedQuestions = candidate.drafts[key]?.questions;
  if (expectedRound) {
    const current = candidate.listeningRound;
    if (kind !== 'listening' || !questionId || attempt.questionIds.length !== 1 ||
        key !== questionId + ':individual' || !current ||
        current.startedAt !== expectedRound.startedAt ||
        current.index !== expectedRound.index ||
        JSON.stringify(current.queue) !== JSON.stringify(expectedRound.queue) ||
        current.queue[current.index] !== questionId || current.submitted[questionId]) return false;
    answers = current.answers;
    const snapshot = current.questionSnapshots?.[questionId];
    savedQuestions = snapshot ? [snapshot.question] : undefined;
    current.submitted[questionId] = structuredClone(attempt);
  }
  if (!answers || attempt.questionIds.some(id =>
      JSON.stringify(answers![id]) !== JSON.stringify(attempt.answers[id]))) return false;
  if (savedQuestions && JSON.stringify(savedQuestions) !== JSON.stringify(attempt.questions)) return false;
  recordAttempt(candidate, key, attempt, kind);
  try {
    return (await store.saveCandidate(candidate, signal)).ok;
  } catch {
    return false;
  }
}
