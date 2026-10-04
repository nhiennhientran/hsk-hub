import { applyViSnapshot, loadOfficialViRegistry } from './official-vi-revisions.ts';
import { listeningDisplaySnapshot } from './vi-presentation-state.ts';
import type { AppData } from '../storage/compatibility.ts';
import type { ListeningCurrent } from '../../domain/listening/types.ts';
import {courseAssetBase} from './asset-base.ts';
import practice from '../../domain/practice/engine.js';
import type { AudioRequest } from '../audio/index.ts';

export interface ListeningLine {
  readonly zh: string;
  readonly py: string;
  readonly vi: string;
}
export interface ListeningSource {
  readonly printPages: readonly number[];
  readonly pdfPages: readonly number[];
  readonly section: string;
}
export interface ListeningAudio {
  readonly track: string;
  readonly start: number;
  readonly end: number;
  readonly timingBasis: string;
}
export interface ListeningQuestion {
  readonly id: string;
  readonly lesson: number;
  readonly kind: 'word' | 'sentence' | 'dialogue';
  readonly promptVi: string;
  readonly audio: ListeningAudio;
  readonly transcript: readonly ListeningLine[];
  readonly options: readonly string[];
  readonly answer: number;
  readonly explanationVi: string;
  readonly optionFeedback: readonly string[];
  readonly keywords: readonly ListeningLine[];
  readonly skill: string;
  readonly source: ListeningSource;
  readonly fingerprint: string;
}
export interface ListeningVocabulary extends ListeningLine {
  readonly id: string;
  readonly lexId: string;
  readonly senseId: string;
  readonly lesson: number;
  readonly senseZh: string;
  readonly cueZh?: string;
  readonly category: 'ordinary' | 'proper_noun';
  readonly extension: boolean;
  readonly source: ListeningSource;
  readonly audio: ListeningAudio | null;
  readonly fingerprint: string;
}
export interface ListeningLesson { readonly id: number; readonly title: string }
export interface ListeningCatalog {
  readonly schemaVersion: 1;
  readonly baseline: string;
  readonly version: string;
  readonly source: string;
  readonly lessons: readonly ListeningLesson[];
  readonly listening: readonly ListeningQuestion[];
  readonly vocabulary: readonly ListeningVocabulary[];
}
export interface ListeningContent {
  readonly catalog: ListeningCatalog;
  readonly lessons: readonly ListeningLesson[];
  readonly items: readonly ListeningQuestion[];
  /** Unknown IDs never resolve an arbitrary clip or synthesized replacement. */
  resolveAudio(questionId: string): AudioRequest | null;
}

type Row = Record<string, unknown>;
const row = (value: unknown): value is Row => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const hash = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const commit = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const fields = (value: Row, names: readonly string[]) => names.every(name => text(value[name]));
const positive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;
const strings = (value: unknown, length: number): value is string[] => Array.isArray(value) && value.length === length && value.every(text);
function fail(message: string): never { throw new Error(message); }
function source(value: unknown): boolean {
  return row(value) && text(value.section) && Array.isArray(value.printPages) && value.printPages.length > 0 &&
    Array.isArray(value.pdfPages) && value.pdfPages.length === value.printPages.length &&
    new Set(value.printPages).size === value.printPages.length && new Set(value.pdfPages).size === value.pdfPages.length &&
    [...value.printPages, ...value.pdfPages].every(page => Number.isSafeInteger(page) && page > 0);
}
function audio(value: unknown): value is Row {
  return row(value) && fields(value, ['track', 'timingBasis']) && typeof value.start === 'number' &&
    Number.isFinite(value.start) && value.start >= 0 && positive(value.end) && value.end > value.start;
}
const lines = (value: unknown): boolean => Array.isArray(value) && value.length > 0 && value.every(line => row(line) && fields(line, ['zh', 'py', 'vi']));
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** This is the frozen content's canonical JSON format, independent of key order. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (row(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
async function fingerprint(value: Row, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted();
  const { fingerprint: expected, ...data } = value;
  const bytes = new TextEncoder().encode(canonical(data));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  signal?.throwIfAborted();
  const actual = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  if (actual !== expected) fail('Dấu kiểm tra nội dung nghe không khớp.');
}

/** Validate only existing JSON metadata. No media extraction, re-timing or store is created. */
export async function createListeningContent(catalogValue: unknown, mediaValue: unknown,
  audioURL: (trackId: string) => string = id => typeof document === 'undefined'
    ? `course-assets/audio/${id}.mp3` : new URL(`course-assets/audio/${id}.mp3`, courseAssetBase()).href,
  signal?: AbortSignal): Promise<ListeningContent> {
  signal?.throwIfAborted();
  // Hash and expose the same snapshot even if a caller edits its inputs while
  // Web Crypto is pending. This is content validation, never learner state.
  catalogValue = structuredClone(catalogValue);
  mediaValue = structuredClone(mediaValue);
  if (!row(catalogValue) || catalogValue.schemaVersion !== 1 || !commit(catalogValue.baseline) ||
      !fields(catalogValue, ['version', 'source']) || !Array.isArray(catalogValue.lessons) || catalogValue.lessons.length !== 15 ||
      !Array.isArray(catalogValue.listening) || catalogValue.listening.length !== 75 ||
      !Array.isArray(catalogValue.vocabulary) || catalogValue.vocabulary.length !== 344) fail('Ngân hàng nghe không đúng phiên bản.');
  if (!row(mediaValue) || mediaValue.schemaVersion !== 1 || !commit(mediaValue.baseline) ||
      !Array.isArray(mediaValue.clips) || !Array.isArray(mediaValue.originalTracks) || mediaValue.originalTracks.length !== 93) fail('Chỉ mục âm thanh nghe không hợp lệ.');
  if (catalogValue.baseline !== mediaValue.baseline) fail('Ngân hàng nghe và âm thanh không cùng phiên bản.');

  const lessonIds = new Set<number>();
  for (const lesson of catalogValue.lessons) {
    if (!row(lesson) || !Number.isInteger(lesson.id) || Number(lesson.id) < 1 || Number(lesson.id) > 15 ||
        lessonIds.has(Number(lesson.id)) || !text(lesson.title)) fail('Thông tin bài học nghe không hợp lệ.');
    lessonIds.add(Number(lesson.id));
  }
  const tracks = new Map<string, Row>();
  for (const track of mediaValue.originalTracks) {
    if (!row(track) || !Number.isInteger(track.lesson) || Number(track.lesson) < 1 || Number(track.lesson) > 15 ||
        !Number.isInteger(track.track) || Number(track.track) < 1 || Number(track.track) > 7 || track.id !== `${track.lesson}-${track.track}` ||
        tracks.has(String(track.id)) || track.file !== `audio/${track.id}.mp3` || track.path !== `new-hsk1/hsk1/audio/${track.id}.mp3` ||
        track.kind !== (track.track === 7 ? 'shadow' : Number(track.track) % 2 ? 'text' : 'vocab') ||
        track.scene !== (track.track === 7 ? null : Math.ceil(Number(track.track) / 2)) || (track.track === 7 && Number(track.lesson) > 3) ||
        !positive(track.duration_s) || !Number.isSafeInteger(track.bytes) || Number(track.bytes) <= 0 ||
        !hash(track.sha256) || !hash(track.fingerprint)) fail('Nguồn âm thanh gốc không hợp lệ.');
    tracks.set(String(track.id), track);
  }
  const clips = new Map<string, Row>();
  for (const clip of mediaValue.clips) {
    if (!row(clip) || !text(clip.id) || clips.has(clip.id)) fail('Mã đoạn âm thanh bị thiếu hoặc trùng.');
    clips.set(clip.id, clip);
  }
  const ids = new Set<string>();
  const verified = new Set<Row>();
  for (const question of catalogValue.listening) {
    if (!row(question) || !text(question.id) || !Number.isInteger(question.lesson) || Number(question.lesson) < 1 || Number(question.lesson) > 15 ||
        !new RegExp(`^l${String(question.lesson).padStart(2, '0')}-listen-0[1-5]$`).test(question.id) || ids.has(question.id) ||
        !['word', 'sentence', 'dialogue'].includes(String(question.kind)) || !fields(question, ['promptVi', 'explanationVi', 'skill']) ||
        !audio(question.audio) || !lines(question.transcript) || !lines(question.keywords) || !strings(question.options, 4) ||
        new Set(question.options.map(option => option.trim())).size !== 4 || !Number.isInteger(question.answer) || Number(question.answer) < 0 || Number(question.answer) > 3 ||
        !strings(question.optionFeedback, 4) || !source(question.source) || !hash(question.fingerprint)) fail('Câu nghe, đáp án hoặc nguồn giáo trình không hợp lệ.');
    ids.add(question.id);
    const range = question.audio;
    const original = tracks.get(String(range.track));
    const clip = clips.get(question.id);
    if (!original || original.lesson !== question.lesson || Number(range.end) > Number(original.duration_s)) fail('Đoạn nghe không thuộc tệp gốc của bài học.');
    if (!clip || clip.lesson !== question.lesson || !Number.isSafeInteger(clip.bytes) || Number(clip.bytes) <= 0 ||
        !positive(clip.duration) || !hash(clip.sha256) || !hash(clip.fingerprint) ||
        clip.mediaFile !== `new-hsk1/hsk1/stage3/media/lesson-${String(question.lesson).padStart(2, '0')}.js` || !audio(clip.audio) ||
        ['track', 'start', 'end', 'timingBasis'].some(key => (clip.audio as Row)[key] !== range[key])) fail('Đoạn nghe không khớp chỉ mục âm thanh đã xác nhận.');
    verified.add(question); verified.add(clip); verified.add(original);
  }
  if ([...clips.keys()].filter(id => /-listen-/.test(id)).some(id => !ids.has(id))) fail('Chỉ mục có đoạn nghe không thuộc ngân hàng.');
  // The preserved practice engine validates the complete original catalog shape.
  practice.importBackup(practice.blank(), catalogValue);
  await Promise.all([...verified].map(value => fingerprint(value, signal)));
  signal?.throwIfAborted();
  const catalog = freeze(catalogValue) as unknown as ListeningCatalog;
  const questions = new Map(catalog.listening.map(question => [question.id, question]));
  return Object.freeze({
    catalog, lessons: catalog.lessons, items: catalog.listening,
    resolveAudio(questionId: string): AudioRequest | null {
      const question = questions.get(questionId);
      return question ? Object.freeze({ url: audioURL(question.audio.track), start: question.audio.start, end: question.audio.end,
        label: `Bài ${question.lesson} · Câu ${Number(question.id.slice(-2))}`, sourceKind: 'segment' as const }) : null;
    },
  });
}

/** Reuse the application content paths; the learning session remains the sole store. */
export async function loadListening(signal: AbortSignal): Promise<ListeningContent> {
  await loadOfficialViRegistry(signal);
  signal.throwIfAborted();
  const urls = [new URL('../../../content/stage3-catalog.json', import.meta.url), new URL('../../../content/media-references.json', import.meta.url)];
  const values = await Promise.all(urls.map(async url => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Không tải được nội dung nghe (HTTP ${response.status}).`);
    const value: unknown = await response.json();
    signal.throwIfAborted();
    return value;
  }));
  return createListeningContent(values[0], values[1], undefined, signal);
}

/** View DTO only. The controller, answers and randomized original indices stay raw. */
export function projectListeningCurrent(raw: ListeningCurrent, data: AppData, catalog: ListeningCatalog): ListeningCurrent {
  const question = catalog.listening.find(q => q.id === raw.id); if (!question) return raw;
  const display = applyViSnapshot(question, question.id, 'listening', listeningDisplaySnapshot(data, question.id));
  if (display === question) return raw;
  return { ...raw, promptVi: display.promptVi, options: raw.options.map(option => ({ ...option, text: display.options[option.index]! })),
    feedback: raw.feedback ? { ...raw.feedback, transcript: display.transcript, explanationVi: display.explanationVi, optionFeedback: display.optionFeedback, keywords: display.keywords } : null };
}
