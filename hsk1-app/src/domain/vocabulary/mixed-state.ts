import engine from '../practice/engine.js';
import type { VocabularyCatalog } from '../../services/content/vocabulary.ts';
import type { VocabularyCard, VocabularyDeck, VocabularyReview } from './types.ts';

/** A browsing round has no ratings, mastery, scheduling, or persisted flip state. */
export interface MixedVocabularyRound {
  id: string;
  lessons: number[];
  senseIds: string[];
  /** Zero-based card anchor, independent of a view's responsive page size. */
  anchor: number;
  fingerprints: Record<string, string>;
  startedAt: number;
}
export interface MixedVocabularyState { schema: 1; round: MixedVocabularyRound | null }
type Row = Record<string, unknown>;
const record = (value: unknown): value is Row => value !== null && typeof value === 'object' &&
  !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const list = (value: unknown): value is unknown[] => Array.isArray(value) &&
  Object.getPrototypeOf(value) === Array.prototype && Object.keys(value).length === value.length;
function invalid(): never { throw new Error('Lượt từ vựng trộn đã lưu không hợp lệ hoặc nội dung đã thay đổi.'); }
function exact(value: Row, keys: readonly string[]): void {
  if (Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) invalid();
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (record(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

/** Content-version marker, not authentication. Includes source text and metadata. */
export function mixedCardFingerprint(card: VocabularyCard): string {
  const source = canonical(card.sourceRecords);
  let a = 2166136261, b = 3339675911;
  for (let index = 0; index < source.length; index++) {
    a = Math.imul(a ^ source.charCodeAt(index), 16777619);
    b = Math.imul(b ^ source.charCodeAt(index), 2246822519);
  }
  return `mixed-v1-${(a >>> 0).toString(16).padStart(8, '0')}${(b >>> 0).toString(16).padStart(8, '0')}`;
}

/** Reuse the frozen lexeme-sense deduplication with a fixed browsing scope. */
export function mixedVocabularyDeck(catalog: VocabularyCatalog, lessons: number[], now = 0,
  shuffle = false, random?: () => number): VocabularyDeck {
  return engine.makeDeck(engine.blank(), catalog,
    { lessons, filter: 'all', direction: 'zh-vi', search: '', shuffle }, now, random);
}

export function validateMixedVocabulary(input: unknown, catalog: VocabularyCatalog): MixedVocabularyState {
  if (!record(input)) invalid();
  exact(input, ['schema', 'round']);
  if (input.schema !== 1) invalid();
  if (input.round === null) return { schema: 1, round: null };
  const round = input.round;
  if (!record(round)) invalid();
  exact(round, ['id', 'lessons', 'senseIds', 'anchor', 'fingerprints', 'startedAt']);
  if (!list(round.lessons) || !round.lessons.length ||
      !round.lessons.every((lesson, index, values) => typeof lesson === 'number' && Number.isInteger(lesson) && lesson >= 1 && lesson <= 15 &&
        (index === 0 || Number(values[index - 1]) < lesson)) ||
      !list(round.senseIds) || !round.senseIds.length ||
      !round.senseIds.every(id => typeof id === 'string') || new Set(round.senseIds).size !== round.senseIds.length ||
      !Number.isSafeInteger(round.anchor) || Number(round.anchor) < 0 || Number(round.anchor) >= round.senseIds.length ||
      !Number.isSafeInteger(round.startedAt) || Number(round.startedAt) < 0 || !record(round.fingerprints)) invalid();
  const match = typeof round.id === 'string' && round.id.match(/^mixed-(?:legacy-cards-)?(\d+)-(\d+)$/);
  if (!match || Number(match[1]) !== round.startedAt || !Number.isSafeInteger(Number(match[2])) || Number(match[2]) < 1) invalid();
  const lessons = round.lessons as number[], senseIds = round.senseIds as string[];
  const deck = mixedVocabularyDeck(catalog, lessons, Number(round.startedAt));
  const expected = new Map(deck.cards.map(card => [card.senseId, mixedCardFingerprint(card)]));
  const fingerprints = round.fingerprints;
  if (senseIds.length !== expected.size || Object.keys(fingerprints).length !== expected.size ||
      senseIds.some(id => !expected.has(id) || !Object.hasOwn(fingerprints, id) || fingerprints[id] !== expected.get(id))) invalid();
  return { schema: 1, round: { id: round.id as string, lessons: [...lessons], senseIds: [...senseIds],
    anchor: Number(round.anchor), fingerprints: { ...fingerprints } as Record<string, string>, startedAt: Number(round.startedAt) } };
}

/** A legacy round is resumable only when it is already exactly the browsing pool. */
export function compatibleLegacyMixedRound(legacy: VocabularyReview | null, catalog: VocabularyCatalog): MixedVocabularyRound | null {
  if (!legacy || legacy.filter !== 'all' || legacy.direction !== 'zh-vi' || legacy.search || !legacy.senseIds.length) return null;
  try {
    const deck = mixedVocabularyDeck(catalog, legacy.lessons, legacy.startedAt);
    const state = { schema: 1, round: { id: `mixed-legacy-${legacy.id}`, lessons: [...legacy.lessons],
      senseIds: [...legacy.senseIds], anchor: legacy.position, startedAt: legacy.startedAt,
      fingerprints: Object.fromEntries(deck.cards.map(card => [card.senseId, mixedCardFingerprint(card)])) } };
    return validateMixedVocabulary(state, catalog).round;
  } catch { return null; }
}

/** Pure reset candidate; only the existing confirmed replacement flow applies it. */
export function resetMixedVocabulary(input: MixedVocabularyState, lesson: number | null,
  catalog: VocabularyCatalog): MixedVocabularyState {
  const state = validateMixedVocabulary(input, catalog), round = state.round;
  if (!round || (lesson !== null && !round.lessons.includes(lesson))) return state;
  const lessons = lesson === null ? [] : round.lessons.filter(id => id !== lesson);
  const deck = mixedVocabularyDeck(catalog, lessons, round.startedAt);
  if (!deck.cards.length) return { schema: 1, round: null };
  const fingerprints = Object.fromEntries(deck.cards.map(card => [card.senseId, mixedCardFingerprint(card)]));
  const senseIds = round.senseIds.filter(id => Object.hasOwn(fingerprints, id));
  const preceding = round.senseIds.slice(0, round.anchor).filter(id => Object.hasOwn(fingerprints, id)).length;
  return { schema: 1, round: { ...round, lessons, senseIds, fingerprints, anchor: Math.min(preceding, senseIds.length - 1) } };
}
