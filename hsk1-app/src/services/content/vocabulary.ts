import { createListeningContent } from './listening.ts';
import type { ListeningCatalog, ListeningLesson, ListeningVocabulary } from './listening.ts';
import type { AudioRequest } from '../audio/index.ts';

export type VocabularyCatalog = ListeningCatalog;
export type VocabularyItem = ListeningVocabulary;
export type VocabularyLesson = ListeningLesson;
export interface VocabularyContent {
  readonly catalog: VocabularyCatalog;
  readonly lessons: readonly VocabularyLesson[];
  readonly items: readonly VocabularyItem[];
  /** Only an exact original record ID resolves; a sense or word is never an audio lookup key. */
  resolveAudio(recordId: string): AudioRequest | null;
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
    ? `course-assets/audio/${id}.mp3` : new URL(`course-assets/audio/${id}.mp3`, document.baseURI).href,
  signal?: AbortSignal): Promise<VocabularyContent> {
  signal?.throwIfAborted();
  // Keep both inputs stable across the asynchronous shared metadata/hash validation.
  const rawCatalog = structuredClone(catalogValue), rawMedia: unknown = structuredClone(mediaValue);
  // Reuse the established catalog identity and all 93 original-track validation.
  // This also keeps listening and vocabulary bound to one content baseline.
  const { catalog } = await createListeningContent(rawCatalog, rawMedia, audioURL, signal);
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
  const records = new Map(catalog.vocabulary.map(item => [item.id, item]));
  return Object.freeze({
    catalog, lessons: catalog.lessons, items: catalog.vocabulary,
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
  const urls = [new URL('../../../content/stage3-catalog.json', import.meta.url), new URL('../../../content/media-references.json', import.meta.url)];
  const values = await Promise.all(urls.map(async url => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Không tải được nội dung từ vựng (HTTP ${response.status}).`);
    const value: unknown = await response.json();
    signal.throwIfAborted();
    return value;
  }));
  return createVocabularyContent(values[0], values[1], undefined, signal);
}
