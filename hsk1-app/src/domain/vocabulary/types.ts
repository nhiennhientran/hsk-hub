import type { PracticeState } from '../types.ts';
import type { VocabularyItem } from '../../services/content/vocabulary.ts';

export type VocabularyPreferences = Pick<PracticeState['preferences'], 'lessons' | 'vocabularyFilter' | 'direction' | 'shuffle' | 'rate'>;
export type VocabularyFilter = VocabularyPreferences['vocabularyFilter'];
export type VocabularyDirection = VocabularyPreferences['direction'];
export type VocabularyRating = 'again' | 'hard' | 'good';
export type VocabularyResult = { ok: true } | { ok: false; reason: string; message: string };
export interface VocabularySchedule {
  fingerprint: string;
  level: number;
  lastRating: VocabularyRating;
  dueAt: number;
  ratedAt: number;
  reviewCount: number;
}
export interface VocabularyRatingResult {
  rating: VocabularyRating;
  at: number;
  previous: VocabularySchedule | null;
  advanced: boolean;
  early: boolean;
  schedule: VocabularySchedule;
}
export interface VocabularyReview {
  id: string;
  /** Immutable scope of this saved queue. Absent on existing unsearched rounds. */
  search?: string;
  lessons: number[];
  filter: VocabularyFilter;
  direction: VocabularyDirection;
  senseIds: string[];
  position: number;
  revealed: Record<string, true>;
  ratings: Record<string, VocabularyRatingResult>;
  fingerprints: Record<string, string>;
  startedAt: number;
  finishedAt: number | null;
}
export interface VocabularyCard {
  senseId: string;
  zh: string;
  py: string;
  vi: string;
  senseZh: string;
  cueZh: string;
  lessons: number[];
  sourceRecords: VocabularyItem[];
  meanings: string[];
  category: VocabularyItem['category'];
  extension: boolean;
  audio: VocabularyItem['audio'];
  audioRecordId: string | null;
}
export interface VocabularyDeck {
  lessons: number[];
  selectedLessonCount: number;
  mergedCount: number;
  distinctForms: number;
  filteredCount: number;
  senseIds: string[];
  cards: VocabularyCard[];
  filter: VocabularyFilter;
  direction: VocabularyDirection;
}
export interface VocabularySummary {
  totalSenses: number;
  rated: number;
  unfamiliar: number;
  wrong: number;
  due: number;
  review: { total: number; revealed: number; rated: number; done: boolean };
}
export interface VocabularyCurrent extends VocabularyCard {
  revealed: boolean;
  rating: VocabularyRatingResult | null;
  schedule: VocabularySchedule | null;
  direction: VocabularyDirection;
}
export interface VocabularyDeckOptions {
  search?: string;
  lessons?: number[];
  filter?: VocabularyFilter;
  direction?: VocabularyDirection;
  shuffle?: boolean;
}
