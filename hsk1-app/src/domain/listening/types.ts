import type { ListeningQuestion } from '../../services/content/listening.ts';
import type { ListeningSubmission, PracticeState } from '../types.ts';

export interface ListeningResponse {
  selected: number | null;
  submission: ListeningSubmission | null;
  listenCount: number;
}
export interface ListeningSession {
  id: string;
  lessons: number[];
  mode: 'all' | 'wrong';
  questionIds: string[];
  optionOrders: Record<string, number[]>;
  fingerprints: Record<string, string>;
  position: number;
  responses: Record<string, ListeningResponse>;
  startedAt: number;
  finishedAt: number | null;
}
export interface ListeningSummary {
  session: { total: number; answered: number; unanswered: number; correct: number; percentAmongAnswered: number | null; done: boolean };
  overall: { total: number; answered: number; firstCorrect: number; latestCorrect: number; firstPercentAmongAnswered: number | null; latestPercentAmongAnswered: number | null };
  wrongIds: string[];
}
export type ListeningPreferences = Pick<PracticeState['preferences'], 'lessons' | 'listeningMode' | 'shuffle' | 'rate'>;
export type ListeningResult = { ok: true } | { ok: false; reason: string; message: string };
export interface ListeningCurrent {
  id: string;
  lesson: number;
  kind: ListeningQuestion['kind'];
  promptVi: string;
  audio: ListeningQuestion['audio'];
  options: { index: number; text: string }[];
  selected: number | null;
  submitted: boolean;
  listenCount: number;
  feedback: null | {
    answer: number;
    correct: boolean;
    transcript: ListeningQuestion['transcript'];
    explanationVi: string;
    optionFeedback: ListeningQuestion['optionFeedback'];
    keywords: ListeningQuestion['keywords'];
    source: ListeningQuestion['source'];
  };
}
