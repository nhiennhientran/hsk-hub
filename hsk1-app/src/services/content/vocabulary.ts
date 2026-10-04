import { defaultOfficialViRegistry, loadOfficialViRegistry, type OfficialViRegistry } from './official-vi-revisions.ts';
import { projectOfficialBookLesson } from './textbook.ts';
import type { VocabularyCard } from '../../domain/vocabulary/types.ts';
import {courseAssetBase} from './asset-base.ts';
import { createListeningContent } from './listening.ts';
import type { ListeningCatalog, ListeningLesson, ListeningVocabulary } from './listening.ts';
import type { AudioRequest } from '../audio/index.ts';
import { validateTextbook } from './textbook.ts';
import type { BookLesson } from './textbook.ts';
import { reviseTextbookDisplay } from './textbook-display-revisions.ts';

export type VocabularyCatalog = ListeningCatalog;
export type VocabularyItem = ListeningVocabulary;
export type VocabularyLesson = ListeningLesson;
export interface VocabularyExample {
  readonly id: string;
  readonly lesson: number;
  readonly section: 'text' | 'grammar';
  readonly sourceId: string;
  readonly zh: string;
  readonly py: string;
  readonly vi: string;
}
export interface VocabularyContent {
  readonly catalog: VocabularyCatalog;
  readonly lessons: readonly VocabularyLesson[];
  readonly items: readonly VocabularyItem[];
  readonly displayRevision?: string;
  displayItem(recordId: string): VocabularyItem | null;
  displayCard(raw: VocabularyCard): VocabularyCard;
  /** Only an exact original record ID resolves; a sense or word is never an audio lookup key. */
  resolveAudio(recordId: string): AudioRequest | null;
  /** Exact current-textbook sentences; homographs use reviewed sense links. */
  examplesForSense(senseId: string): readonly VocabularyExample[];
}

// References, never a second copy of the textbook. Character matching alone
// would mix 家 (home/classifier), 在 (location/progressive), 天 (weather/day),
// 上 (location/boarding/school), and other polysemous senses.
const senseExamples: Readonly<Record<string, readonly string[]>> = {
  'lex-02b83ec7cc-s1': ['textbook-l03-text-3-line-04'],
  'lex-02b83ec7cc-s2': ['textbook-l11-text-3-line-06'],
  'lex-dd9fc2c0a1-s1': ['textbook-l03-text-3-line-03'],
  'lex-dd9fc2c0a1-s2': ['textbook-l08-grammar-02:example:2'],
  'lex-a48f3ad06d-s1': ['textbook-l03-text-3-line-05', 'textbook-l03-text-3-line-06'],
  'lex-a48f3ad06d-s2': ['textbook-l06-grammar-01:example:1', 'textbook-l06-grammar-01:example:2'],
  'lex-0889c34972-s1': ['textbook-l04-text-3-line-05'],
  'lex-0889c34972-s2': ['textbook-l08-text-3-line-03'],
  'lex-451b1366af-s1': ['textbook-l04-text-3-line-05'],
  'lex-451b1366af-s2': ['textbook-l08-text-3-line-03'],
  'lex-9a3eb34097-s1': ['textbook-l04-text-2-line-04'],
  'lex-9a3eb34097-s2': ['textbook-l09-text-3-line-02'],
  'lex-68bf29eb00-s1': ['textbook-l04-text-2-line-03', 'textbook-l04-text-3-line-03'],
  'lex-68bf29eb00-s2': ['textbook-l15-text-2-line-03'],
  'lex-7de8177ce7-s1': ['textbook-l04-text-2-line-04'],
  'lex-7de8177ce7-s2': ['textbook-l07-text-3-line-02'],
  'lex-7de8177ce7-s3': ['textbook-l09-grammar-01:example:1', 'textbook-l09-grammar-01:example:2'],
  'lex-dcf66dcd60-s1': ['textbook-l04-grammar-03:example:1', 'textbook-l04-grammar-03:example:2'],
  'lex-dcf66dcd60-s2': ['textbook-l07-grammar-04:example:1', 'textbook-l07-grammar-04:example:2'],
  'lex-7b4bb888fb-s1': ['textbook-l05-grammar-03:example:3'],
  'lex-7b4bb888fb-s2': ['textbook-l07-text-3-line-05'],
  'lex-7f5716be5c-s1': ['textbook-l05-grammar-01:example:1'],
  'lex-7f5716be5c-s2': ['textbook-l06-text-1-line-01'],
  'lex-715fb2c0ef-s1': ['textbook-l05-grammar-03:example:2'],
  'lex-715fb2c0ef-s2': ['textbook-l09-text-3-line-01'],
  'lex-4a1e3b19fa-s1': ['textbook-l06-grammar-02:example:2'],
  'lex-4a1e3b19fa-s2': ['textbook-l13-grammar-01:example:2'],
  'lex-686b703f41-s1': ['textbook-l07-text-3-line-02'],
  'lex-686b703f41-s2': ['textbook-l08-grammar-02:example:1', 'textbook-l08-grammar-02:example:2'],
  'lex-686b703f41-s3': ['textbook-l11-grammar-02:example:1', 'textbook-l11-grammar-02:example:2'],
  'lex-a6caf2effb-s1': ['textbook-l08-text-1-line-03'],
  'lex-a6caf2effb-s2': ['textbook-l12-grammar-01:example:1', 'textbook-l12-grammar-01:example:2'],
  'lex-b967ce841a-s1': ['textbook-l09-grammar-01:example:3'],
  'lex-b967ce841a-s2': ['textbook-l14-text-1-line-01'],
  'lex-b967ce841a-s3': ['textbook-l14-text-3-line-01', 'textbook-l14-text-3-line-02'],
  'lex-327049aa37-s1': ['textbook-l09-text-2-line-01'],
  'lex-327049aa37-s2': ['textbook-l15-text-3-line-06'],
  'lex-93e27107a1-s1': ['textbook-l11-grammar-03:example:1', 'textbook-l11-grammar-03:example:2'],
  'lex-93e27107a1-s2': ['textbook-l13-text-3-line-02'],
  'lex-93e27107a1-s3': ['textbook-l15-text-3-line-01'],
  'lex-c3304d1e49-s1': ['textbook-l12-text-1-line-02'],
  'lex-c3304d1e49-s2': ['textbook-l12-text-3-line-04'],
  'lex-a5933e2a9e-s1': ['textbook-l12-grammar-02:example:2', 'textbook-l12-grammar-03:example:2'],
  'lex-a5933e2a9e-s2': ['textbook-l14-grammar-01:example:1', 'textbook-l14-grammar-01:example:2'],
  'lex-95fd8be0d9-s1': ['textbook-l12-text-3-line-06'],
  'lex-95fd8be0d9-s2': ['textbook-l13-grammar-01:example:1'],
};

// The original reviewed negative 想 example omitted 哥哥. Its replacement is
// explicitly approved on printed p38; do not guess a replacement by array position.
const revisedExampleAnchors: Readonly<Record<string, { readonly expected: string; readonly current: string }>> = {
  'textbook-l06-grammar-01:example:2': { expected: '我不想休息。', current: '我哥哥不想休息。' },
};

function indexExamples(lessons: readonly BookLesson[], items: readonly VocabularyItem[], sourceLessons: readonly BookLesson[] = lessons): ReadonlyMap<string, readonly VocabularyExample[]> {
  const examples: VocabularyExample[] = lessons.flatMap(lesson => [
    ...lesson.scenes.flatMap(scene => scene.lines.map(line => ({ id: line.id, lesson: lesson.id,
      section: 'text' as const, sourceId: scene.id, zh: line.zh, py: line.py, vi: line.vn }))),
    ...lesson.grammar.flatMap(grammar => grammar.examples.map((example, index) => ({
      id: `${grammar.id}:example:${index + 1}`, lesson: lesson.id, section: 'grammar' as const,
      sourceId: grammar.id, zh: example.zh, py: example.py, vi: example.vn }))),
  ]);
  const references = new Map<string, string>();
  const reviewed = new Set(Object.values(senseExamples).flat());
  const grammarById = new Map(lessons.flatMap(lesson => lesson.grammar.map(grammar => [grammar.id, grammar])));
  for (const lesson of sourceLessons) for (const source of lesson.grammar) {
    const current = grammarById.get(source.id);
    if (!current) fail('Không tìm thấy nguồn ví dụ ngữ pháp đã đối chiếu.');
    const unchanged = canonical(current.examples) === canonical(source.examples);
    for (const [index, example] of source.examples.entries()) {
      const id = `${source.id}:example:${index + 1}`;
      if (!reviewed.has(id)) continue;
      if (unchanged) { references.set(id, id); continue; }
      const anchor = revisedExampleAnchors[id];
      const matches = current.examples.flatMap((candidate, position) =>
        candidate.zh === example.zh || (anchor?.expected === example.zh && candidate.zh === anchor.current) ? [position] : []);
      if (matches.length !== 1) fail('Ví dụ đã sửa không khớp duy nhất với liên kết nghĩa từ đã đối chiếu.');
      references.set(id, `${source.id}:example:${matches[0] + 1}`);
    }
  }
  const forms = new Map<string, Set<string>>();
  for (const item of items) {
    const senses = forms.get(item.zh) ?? new Set<string>(); senses.add(item.senseId); forms.set(item.zh, senses);
  }
  return new Map(items.map(item => {
    const declared = senseExamples[item.senseId]?.map(id => references.get(id) ?? id);
    const matched = examples.filter(example => example.lesson === item.lesson && example.zh.includes(item.zh) &&
      (declared ? declared.includes(example.id) : forms.get(item.zh)!.size === 1));
    const seen = new Set<string>();
    const unique = matched.filter(example => {
      const key = JSON.stringify([example.zh, example.py, example.vi]);
      if (seen.has(key)) return false; seen.add(key); return true;
    }).slice(0, 3).map(example => Object.freeze(example));
    return [item.senseId, Object.freeze(unique)];
  }));
}

type Row = Record<string, unknown>;
const row = (value: unknown): value is Row => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const hash = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const positive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;
function fail(message: string): never { throw new Error(message); }
function source(value: unknown): boolean {
  return row(value) && text(value.section) && Array.isArray(value.printPages) && value.printPages.length > 0 &&
    Array.isArray(value.pdfPages) && value.pdfPages.length === value.printPages.length &&
    new Set(value.printPages).size === value.printPages.length &&
    value.printPages.every((page, index) => Number.isSafeInteger(page) && page > 0 && (value.pdfPages as unknown[])[index] === page + 15);
}
function audio(value: unknown): value is Row {
  return row(value) && text(value.track) && text(value.timingBasis) && typeof value.start === 'number' &&
    Number.isFinite(value.start) && value.start >= 0 && positive(value.end) && value.end > value.start;
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (row(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
async function fingerprint(value: Row, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted();
  const { fingerprint: expected, ...data } = value;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(data)));
  signal?.throwIfAborted();
  const actual = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  if (actual !== expected) fail('Dấu kiểm tra nội dung từ vựng không khớp.');
}

/** Validate the frozen 344 senses and exact 330 clips before exposing any word audio. */
export async function createVocabularyContent(catalogValue: unknown, mediaValue: unknown,
  audioURL: (trackId: string) => string = id => typeof document === 'undefined'
    ? `course-assets/audio/${id}.mp3` : new URL(`course-assets/audio/${id}.mp3`, courseAssetBase()).href,
  signal?: AbortSignal, textbookValue?: unknown, displayRevisionValue?: unknown, officialVi: OfficialViRegistry = defaultOfficialViRegistry()): Promise<VocabularyContent> {
  signal?.throwIfAborted();
  // Keep inputs stable across the asynchronous shared metadata/hash validation.
  const rawCatalog = structuredClone(catalogValue), rawMedia: unknown = structuredClone(mediaValue);
  const rawTextbook: unknown = structuredClone(textbookValue);
  const rawDisplayRevision: unknown = structuredClone(displayRevisionValue);
  if (rawDisplayRevision !== undefined && rawTextbook === undefined) fail('Bản sửa ví dụ cần có nguồn giáo trình gốc.');
  const textbook = rawTextbook === undefined ? [] : validateTextbook(rawTextbook);
  // Reuse the established catalog identity and all 93 original-track validation.
  // This also keeps listening and vocabulary bound to one content baseline.
  const { catalog } = await createListeningContent(rawCatalog, rawMedia, audioURL, signal);
  if (rawTextbook !== undefined && (!row(rawTextbook) || rawTextbook.baseline !== catalog.baseline)) {
    fail('Ví dụ giáo trình không cùng phiên bản với từ vựng.');
  }
  if (!row(rawMedia) || !Array.isArray(rawMedia.clips) || rawMedia.clips.length !== 405 ||
      !Array.isArray(rawMedia.originalTracks) || !Array.isArray(rawMedia.missingWordAudio) || rawMedia.missingWordAudio.length !== 14) {
    fail('Chỉ mục âm thanh từ vựng không hợp lệ.');
  }
  const clips = new Map<string, Row>(rawMedia.clips.map(value => {
    if (!row(value) || !text(value.id)) fail('Mã đoạn âm thanh từ vựng không hợp lệ.');
    return [value.id, value];
  }));
  const tracks = new Map<string, Row>(rawMedia.originalTracks.map(value => {
    if (!row(value) || !text(value.id)) fail('Mã tệp âm thanh gốc không hợp lệ.');
    return [value.id, value];
  }));
  const missing = new Map<string, Row>();
  for (const value of rawMedia.missingWordAudio) {
    if (!row(value) || !text(value.id) || missing.has(value.id) || !text(value.reason)) fail('Danh sách từ chưa có âm thanh không hợp lệ.');
    missing.set(value.id, value);
  }
  const ids = new Set<string>(), senses = new Set<string>(), forms = new Set<string>(), verified = new Set<Row>();
  for (const lesson of textbook) {
    for (const item of [...lesson.scenes, ...lesson.grammar]) verified.add(item as unknown as Row);
  }
  let audioCount = 0, missingCount = 0;
  for (const item of catalog.vocabulary) {
    if (item.id !== `v-l${String(item.lesson).padStart(2, '0')}-${item.senseId}` || !item.senseId.startsWith(`${item.lexId}-`) ||
        ids.has(item.id) || senses.has(item.senseId) || !hash(item.fingerprint) || !source(item.source) ||
        (item.cueZh !== undefined && !text(item.cueZh))) fail('Nghĩa, nguồn hoặc mã từ vựng không hợp lệ.');
    ids.add(item.id); senses.add(item.senseId); forms.add(item.zh.normalize('NFKC'));
    verified.add(item as unknown as Row);
    const clip = clips.get(item.id), unavailable = missing.get(item.id);
    if (item.audio === null) {
      if (clip || !unavailable || item.lesson !== 4 || item.source.section !== '数字表' ||
          unavailable.senseId !== item.senseId || unavailable.lesson !== item.lesson || unavailable.zh !== item.zh ||
          canonical(unavailable.source) !== canonical(item.source)) fail('Từ chưa có âm thanh phải giữ nguồn và trạng thái không có âm riêng.');
      missingCount++;
      continue;
    }
    if (!audio(item.audio) || unavailable) fail('Thông tin âm thanh từ vựng không hợp lệ.');
    const original = tracks.get(item.audio.track);
    if (!original || original.lesson !== item.lesson || original.kind !== 'vocab' || item.audio.end > Number(original.duration_s)) {
      fail('Âm từ không thuộc tệp từ vựng gốc của cùng bài học.');
    }
    if (!clip || clip.lesson !== item.lesson || !Number.isSafeInteger(clip.bytes) || Number(clip.bytes) <= 0 ||
        !positive(clip.duration) || !hash(clip.sha256) || !hash(clip.fingerprint) || !audio(clip.audio) ||
        clip.mediaFile !== `new-hsk1/hsk1/stage3/media/lesson-${String(item.lesson).padStart(2, '0')}.js` ||
        ['track', 'start', 'end', 'timingBasis'].some(key => (clip.audio as Row)[key] !== (item.audio as unknown as Row)[key])) {
      fail('Âm từ không khớp đoạn âm thanh đã xác nhận.');
    }
    verified.add(clip); verified.add(original); audioCount++;
  }
  const allIds = new Set([...ids, ...catalog.listening.map(item => item.id)]);
  if (senses.size !== 344 || forms.size !== 319 || audioCount !== 330 || missingCount !== 14 ||
      [...clips.keys()].some(id => !allIds.has(id)) || [...missing.keys()].some(id => !ids.has(id))) {
    fail('Số nghĩa, dạng từ hoặc số âm thanh không đúng ngân hàng 344 nghĩa / 319 dạng từ.');
  }
  await Promise.all([...verified].map(value => fingerprint(value, signal)));
  signal?.throwIfAborted();
  const revised = rawDisplayRevision === undefined ? undefined : reviseTextbookDisplay(textbook, rawDisplayRevision, catalog.baseline);
  const records = new Map(catalog.vocabulary.map(item => [item.id, item]));
  const examples = indexExamples((revised?.lessons ?? textbook).map(lesson => projectOfficialBookLesson(lesson, officialVi)), catalog.vocabulary, textbook);
  const noExamples: readonly VocabularyExample[] = Object.freeze([]);
  return Object.freeze({
    catalog, lessons: catalog.lessons, items: catalog.vocabulary,
    ...(revised ? { displayRevision: revised.info.revision } : {}),
    displayItem(recordId: string) { const raw = records.get(recordId); return raw ? officialVi.project(raw, raw.id, 'vocabulary') : null; },
    displayCard(raw: VocabularyCard): VocabularyCard {
      const shown = raw.sourceRecords.map(item => officialVi.project(item, item.id, 'vocabulary'));
      const meanings = [...new Set(shown.map(item => item.vi))];
      // Keep sourceRecords by identity: the saved mixed fingerprint always sees the raw catalog.
      return { ...raw, vi: shown[0]?.vi ?? raw.vi, meanings, sourceRecords: raw.sourceRecords };
    },
    examplesForSense(senseId: string) { return examples.get(senseId) ?? noExamples; },
    resolveAudio(recordId: string): AudioRequest | null {
      const item = records.get(recordId);
      if (!item?.audio) return null;
      return Object.freeze({ url: audioURL(item.audio.track), start: item.audio.start, end: item.audio.end,
        label: `Bài ${item.lesson} · Âm từ giáo trình`, sourceKind: 'segment' as const });
    },
  });
}

export async function loadVocabulary(signal: AbortSignal): Promise<VocabularyContent> {
  signal.throwIfAborted();
  const urls = [new URL('../../../content/stage3-catalog.json', import.meta.url), new URL('../../../content/media-references.json', import.meta.url),
    new URL('../../../content/textbook.json', import.meta.url), new URL('../../../content/textbook-display-revisions.json', import.meta.url)];
  const values = await Promise.all(urls.map(async url => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Không tải được nội dung từ vựng (HTTP ${response.status}).`);
    const value: unknown = await response.json();
    signal.throwIfAborted();
    return value;
  }));
  return createVocabularyContent(values[0], values[1], undefined, signal, values[2], values[3], await loadOfficialViRegistry(signal));
}
