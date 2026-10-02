import type { Route } from '../../app/contracts.ts';
import type { VocabularyCatalog } from '../../services/content/vocabulary.ts';
import type { LearningSession } from '../../services/learning/session.ts';
import type { VocabularyResult, VocabularyReview } from './types.ts';
import { compatibleLegacyMixedRound, mixedCardFingerprint, mixedVocabularyDeck, validateMixedVocabulary, type MixedVocabularyRound,
  type MixedVocabularyState } from './mixed-state.ts';

export type { MixedVocabularyRound, MixedVocabularyState } from './mixed-state.ts';
interface ControllerOptions {
  session: LearningSession;
  catalog: VocabularyCatalog;
  now?: () => number;
  random?: () => number;
}
const success: VocabularyResult = { ok: true };
const failed = (reason: string, message: string): VocabularyResult => ({ ok: false, reason, message });
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const errorResult = (error: unknown): VocabularyResult => failed(
  error instanceof Error && 'code' in error ? String(error.code).toLowerCase().replaceAll('_', '-') : 'invalid',
  error instanceof Error ? error.message : 'Không thực hiện được thao tác từ vựng trộn.',
);

/** Isolated browsing state. Legacy practice preferences, queues and schedules never change. */
export function createMixedVocabularyController({ session, catalog, now = Date.now, random = Math.random }: ControllerOptions) {
  const { store } = session;
  const initial = store.snapshot().data;
  if (initial.mixedVocabulary !== undefined) validateMixedVocabulary(initial.mixedVocabulary, catalog);
  let draftLessons = [...(initial.mixedVocabulary?.round?.lessons ?? [initial.navigation?.lesson ?? 1])];
  let feature: 'review' | 'vocabulary' = initial.navigation?.feature === 'review' ? 'review' : 'vocabulary';
  let visited = false, edited = false;
  let sequence = Number(initial.mixedVocabulary?.round?.id.match(/-(\d+)$/)?.[1] ?? 0);
  function legacyRound(): MixedVocabularyRound | null {
    const legacy = store.snapshot().data.practice.cards.review as unknown as VocabularyReview | null;
    return compatibleLegacyMixedRound(legacy, catalog);
  }
  function navigation(round: MixedVocabularyRound | null, routeLesson: number): Route {
    const id = round?.senseIds[round.anchor];
    const card = round && mixedVocabularyDeck(catalog, round.lessons, round.startedAt).cards.find(card => card.senseId === id);
    return { feature, lesson: card ? card.lessons[0] : routeLesson };
  }
  function save(mixed: MixedVocabularyState | undefined, route: Route): VocabularyResult {
    try {
      const before = store.snapshot().data;
      if (same(before.mixedVocabulary, mixed) && same(before.navigation, route)) return success;
      store.edit(data => { if (mixed !== undefined) data.mixedVocabulary = mixed; data.navigation = route; });
      session.requestSave();
      return success;
    } catch (error) { return errorResult(error); }
  }
  return {
    read() {
      const data = store.snapshot().data, round = data.mixedVocabulary?.round ?? null;
      const available = mixedVocabularyDeck(catalog, draftLessons, now());
      const byId = new Map((round ? mixedVocabularyDeck(catalog, round.lessons, round.startedAt).cards : [])
        .map(card => [card.senseId, card]));
      return { draftLessons: [...draftLessons], appliedLessons: [...(round?.lessons ?? [])], available,
        availableCount: available.filteredCount, round, cards: round ? round.senseIds.map(id => byId.get(id)!) : [],
        legacyPreserved: data.practice.cards.review !== null && !round && !legacyRound(),
        draftChanged: round !== null && !same(draftLessons, round.lessons) };
    },
    visit(routeLesson: number, routeFeature: 'review' | 'vocabulary' = 'vocabulary'): VocabularyResult {
      if (!Number.isInteger(routeLesson) || routeLesson < 1 || routeLesson > 15 || !['review', 'vocabulary'].includes(routeFeature)) {
        return failed('invalid', 'Bài học hoặc mục từ vựng không hợp lệ.');
      }
      try {
        const data = store.snapshot().data;
        const legacy = data.mixedVocabulary === undefined ? legacyRound() : null;
        const mixed = data.mixedVocabulary ?? (legacy ? { schema: 1 as const, round: legacy } : undefined);
        const previousFeature = feature; feature = routeFeature;
        const result = save(mixed, navigation(mixed?.round ?? null, routeLesson));
        if (!result.ok) { feature = previousFeature; return result; }
        const oldLessons = data.mixedVocabulary === undefined
          ? (data.practice.cards.review as unknown as VocabularyReview | null)?.lessons : undefined;
        if (!visited && !edited) draftLessons = [...(mixed?.round?.lessons ?? oldLessons ?? [routeLesson])];
        visited = true;
        sequence = Math.max(sequence, Number(mixed?.round?.id.match(/-(\d+)$/)?.[1] ?? 0));
        return success;
      } catch (error) { return errorResult(error); }
    },
    setLessons(lessons: number[]): VocabularyResult {
      if (!Array.isArray(lessons)) return failed('invalid-lessons', 'Hãy chọn các bài từ 1 đến 15.');
      try {
        const deck = mixedVocabularyDeck(catalog, lessons, now());
        draftLessons = [...deck.lessons]; edited = true;
        return success;
      } catch (error) { return errorResult(error); }
    },
    start(): VocabularyResult {
      try {
        const stamp = now();
        if (!mixedVocabularyDeck(catalog, draftLessons, stamp).filteredCount) {
          return failed('empty', 'Hãy chọn ít nhất một bài có từ vựng.');
        }
        // The only shuffled call: render, draft edits, navigation and resize never reshuffle.
        const deck = mixedVocabularyDeck(catalog, draftLessons, stamp, true, random);
        const currentSequence = Number(store.snapshot().data.mixedVocabulary?.round?.id.match(/-(\d+)$/)?.[1] ?? 0);
        const nextSequence = Math.max(sequence, currentSequence) + 1;
        const round: MixedVocabularyRound = { id: `mixed-${stamp}-${nextSequence}`, lessons: [...deck.lessons],
          senseIds: [...deck.senseIds], anchor: 0, startedAt: stamp,
          fingerprints: Object.fromEntries(deck.cards.map(card => [card.senseId, mixedCardFingerprint(card)])) };
        const result = save({ schema: 1, round }, navigation(round, draftLessons[0]));
        if (result.ok) { sequence = nextSequence; edited = false; }
        return result;
      } catch (error) { return errorResult(error); }
    },
    move(anchor: number): VocabularyResult {
      const mixed = store.snapshot().data.mixedVocabulary, round = mixed?.round;
      if (!round) return failed('empty-review', 'Chưa bắt đầu lượt từ vựng trộn.');
      if (!Number.isInteger(anchor) || anchor < 0 || anchor >= round.senseIds.length) {
        return failed('invalid-position', 'Vị trí thẻ không hợp lệ.');
      }
      if (round.anchor === anchor) return success;
      try {
        const moved = { ...round, anchor };
        return save({ schema: 1, round: moved }, navigation(moved, round.lessons[0]));
      } catch (error) { return errorResult(error); }
    },
  };
}
export type MixedVocabularyController = ReturnType<typeof createMixedVocabularyController>;
