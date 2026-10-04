/** Persisted learning data only. DOM, audio players and access gates never enter these types. */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type JsonRecord = { [key: string]: JsonValue };
/** Parallel display evidence; raw grading records and their fingerprints remain authoritative. */
export interface ViHomeworkPresentation { draft: string | null; first: string | null; current: string | null; latest: string | null; history: (string | null)[] }
export interface ViListeningRoundPresentation { id: string; payloadId: string | null; responses: Record<string, string | null> }
export interface ViPresentationState {
  schemaVersion: 1; sequence: number;
  payloads: Record<string, { revisionId: string; fields: { ownerId: string; component: string; field: string; value: string }[] }>;
  bindings: Record<string, { payloadId: string; context: string; authority: string }>;
  homework: Record<string, ViHomeworkPresentation>;
  listening: { round: ViListeningRoundPresentation | null; records: Record<string, { first: string | null; latest: string | null }> };
}
export type HomeworkKind = 'choice' | 'sort' | 'translation' | 'listening';
export type Answer = number | number[] | string;
export interface HomeworkAttempt {
  assessment: 'automatic' | 'manual';
  answers: Record<string, Answer>;
  results: Record<string, boolean> | null;
  correct: number | null;
  total: number;
  at: number;
  questionFingerprints: Record<string, string>;
}
export interface HomeworkGroup {
  draft: Record<string, Answer>;
  orders: Record<string, number[]>;
  first: HomeworkAttempt | null;
  attempt: HomeworkAttempt | null;
  latest: HomeworkAttempt | null;
  completed: boolean;
  history: HomeworkAttempt[];
}
export interface HomeworkState {
  app: 'hsk1-stage2';
  schema: 3;
  lessons: Record<string, Partial<Record<HomeworkKind, HomeworkGroup>>>;
  profile: { name: string; className: string };
  words: JsonRecord;
  questionReviews: JsonRecord;
  preferences: JsonRecord;
  archive: JsonRecord;
  updatedAt: number | null;
}
export interface ListeningSubmission { answer: number; correct: boolean; at: number; fingerprint: string }
export interface PracticeState {
  app: 'hsk1-stage3';
  schema: 1;
  sequence: number;
  updatedAt: number | null;
  preferences: {
    module: 'listening' | 'vocabulary'; lessons: number[]; listeningMode: 'all' | 'wrong';
    vocabularyFilter: 'all' | 'unfamiliar' | 'wrong' | 'due'; direction: 'zh-vi' | 'vi-zh';
    shuffle: boolean; rate: number;
  };
  listening: {
    records: Record<string, { first: ListeningSubmission; latest: ListeningSubmission; attempts: number }>;
    session: JsonRecord | null;
  };
  cards: { schedule: JsonRecord; review: JsonRecord | null };
}
