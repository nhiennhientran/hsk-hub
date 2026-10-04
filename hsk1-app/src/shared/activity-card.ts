/** Course-independent card chrome. Course adapters own content, grading and persistence. */
export function createActivityCard(document: Document, id: string) {
  const card = document.createElement('section'); card.classList.add('activity-card'); card.dataset.activityId = id;
  const fields = document.createElement('div'); fields.classList.add('activity-fields');
  const feedback = document.createElement('div'); feedback.classList.add('activity-feedback'); feedback.setAttribute('aria-live', 'polite');
  return { card, fields, feedback };
}
/** Invalidate delayed feedback after edits, repeated submissions, resets or disposal. */
export function createFeedbackEpoch() {
  let epoch = 0;
  return { next: () => ++epoch, current: (candidate: number) => candidate === epoch };
}
