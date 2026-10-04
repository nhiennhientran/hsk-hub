import {courseAssetBase} from './asset-base.ts';
import type { AudioRequest } from '../audio/index.ts';
import { reviseTextbookDisplay, type TextbookDisplayRevisionInfo } from './textbook-display-revisions.ts';

export interface BookSource {
  readonly kind: string;
  readonly path?: string;
  readonly html?: string;
  readonly audioTrack?: string;
  readonly [key: string]: unknown;
}
interface Identified {
  readonly id: string;
  readonly fingerprint: string;
  readonly source: BookSource;
}
export interface BookWord extends Identified {
  readonly zh: string;
  readonly py: string;
  readonly vn: string;
  readonly kind: string;
  readonly pos: string;
  readonly posLabel: string;
  readonly extension: boolean;
  readonly catalogIds: readonly string[];
  readonly sourceSenseIds?: readonly string[];
}
export interface BookLine {
  readonly id: string;
  readonly fingerprint: string;
  readonly s: string;
  readonly zh: string;
  readonly py: string;
  readonly vn: string;
}
export interface BookScene extends Identified {
  readonly place: string;
  readonly place_vn: string;
  readonly lines: readonly BookLine[];
}
export interface BookExample { readonly zh: string; readonly py: string; readonly vn: string }
export interface LanguageItem extends Identified {
  readonly title: string;
  readonly vn_title: string;
  readonly structure: string;
  readonly desc: string;
  readonly examples: readonly BookExample[];
}
export interface HanziCurriculum extends Identified {
  readonly chars: string;
  readonly strokes?: string;
  readonly order?: string;
  readonly structure?: string;
  readonly radicals?: string;
}
export interface BookTip extends Identified { readonly zh: string; readonly vn: string }
export interface BookLesson {
  readonly id: number;
  readonly title: string;
  readonly title_py: string;
  readonly vn_title: string;
  readonly vocab: readonly BookWord[];
  readonly scenes: readonly BookScene[];
  readonly grammar: readonly LanguageItem[];
  readonly phonetics: readonly LanguageItem[];
  readonly hanzi: HanziCurriculum;
  readonly xiaoyuTips: readonly BookTip[];
}
interface AudioRange { readonly track: string; readonly start: number; readonly end: number; readonly timingBasis: string }
export interface OriginalTrack {
  readonly id: string;
  readonly lesson: number;
  readonly track: number;
  readonly kind: 'text' | 'vocab' | 'shadow';
  readonly scene: number | null;
  readonly file: string;
  readonly path: string;
  readonly duration_s: number;
  readonly bytes: number;
  readonly sha256: string;
  readonly fingerprint: string;
}
interface CatalogSense {
  readonly id: string;
  readonly senseId: string;
  readonly lesson: number;
  readonly zh: string;
  readonly py: string;
  readonly vi: string;
  readonly senseZh: string;
  readonly audio: AudioRange | null;
}
interface MediaData {
  readonly originalTracks: readonly OriginalTrack[];
  readonly textbookSegments: {
    readonly text: Readonly<Record<string, readonly (readonly [number, number])[]>>;
    readonly vocab: Readonly<Record<string, readonly (readonly [string, number, number])[]>>;
    readonly unsupported: Readonly<Record<string, readonly string[]>>;
    readonly crossLessonReuse: Readonly<Record<string, Readonly<Record<string, readonly [string, number, number]>>>>;
  };
  readonly missingWordAudio: readonly { readonly id: string; readonly lesson: number; readonly zh: string }[];
}
export type TextbookAudio =
  | { readonly available: true; readonly request: AudioRequest; readonly track: OriginalTrack }
  | { readonly available: false; readonly reason: string };
export interface WordSense {
  readonly catalogId: string;
  readonly senseId: string;
  readonly senseZh: string;
  readonly py: string;
  readonly vi: string;
  readonly audio: TextbookAudio;
}
export interface TextbookContent {
  readonly lessons: readonly BookLesson[];
  readonly displayRevisions?: TextbookDisplayRevisionInfo;
  resolveWord(lessonId: number, wordId: string, catalogId?: string): TextbookAudio;
  wordSenses(lessonId: number, wordId: string): readonly WordSense[];
  resolveScene(lessonId: number, sceneId: string): TextbookAudio;
  resolveLine(lessonId: number, sceneId: string, lineId: string): TextbookAudio;
  vocabPlaylist(lessonId: number): readonly AudioRequest[];
  tongue(lessonId: number): TextbookAudio;
}

const row = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const hash = (value: unknown): boolean => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const commitHash = (value: unknown): boolean => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(text);
const fields = (value: Record<string, unknown>, names: readonly string[]): boolean => names.every(name => text(value[name]));
const identified = (value: unknown): value is Record<string, unknown> => row(value) && text(value.id) && hash(value.fingerprint) && row(value.source) && text(value.source.kind);
function fail(message: string): never { throw new Error(message); }
const noAudio = (reason = 'Không có âm thanh từ vựng riêng trong giáo trình; không thay bằng giọng máy.'): TextbookAudio => ({ available: false, reason });

/** Only validate the frozen production JSON; do not rebuild it from legacy scripts. */
export function validateTextbook(value: unknown): readonly BookLesson[] {
  if (!row(value) || value.schemaVersion !== 1 || !commitHash(value.baseline) || !Array.isArray(value.lessons) || value.lessons.length !== 15) fail('Giáo trình không đúng phiên bản.');
  const ids = new Set<string>();
  const register = (item: Record<string, unknown>) => {
    if (ids.has(String(item.id))) fail('Mã nội dung giáo trình bị trùng.');
    ids.add(String(item.id));
  };
  const lessons = value.lessons as unknown[];
  const lessonIds = new Set<number>();
  let words = 0; let scenes = 0; let grammar = 0; let phonetics = 0;
  for (const value of lessons) {
    if (!row(value) || !Number.isInteger(value.id) || Number(value.id) < 1 || Number(value.id) > 15 || lessonIds.has(Number(value.id)) ||
        !fields(value, ['title', 'title_py', 'vn_title']) || !['vocab', 'scenes', 'grammar', 'phonetics', 'xiaoyuTips'].every(key => Array.isArray(value[key]))) fail('Thông tin bài học không hợp lệ.');
    lessonIds.add(Number(value.id));
    if (value.id !== 1 && (value.phonetics as unknown[]).length) fail('Nội dung ngữ âm không thuộc bài học này.');
    for (const word of value.vocab as unknown[]) {
      if (!identified(word) || !fields(word, ['zh', 'py', 'vn', 'kind', 'pos', 'posLabel']) || typeof word.extension !== 'boolean' ||
          !strings(word.catalogIds) || word.catalogIds.length < 1 || new Set(word.catalogIds).size !== word.catalogIds.length ||
          (word.sourceSenseIds !== undefined && !strings(word.sourceSenseIds))) fail('Từ vựng giáo trình không hợp lệ.');
      register(word); words++;
    }
    for (const scene of value.scenes as unknown[]) {
      if (!identified(scene) || !fields(scene, ['place', 'place_vn']) || !Array.isArray(scene.lines) || !scene.lines.length ||
          !text((scene.source as Record<string, unknown>).audioTrack)) fail('Hội thoại giáo trình không hợp lệ.');
      register(scene); scenes++;
      for (const line of scene.lines) {
        if (!row(line) || !fields(line, ['id', 's', 'zh', 'py', 'vn']) || !hash(line.fingerprint)) fail('Câu hội thoại không hợp lệ.');
        register(line);
      }
    }
    for (const key of ['grammar', 'phonetics'] as const) for (const item of value[key] as unknown[]) {
      if (!identified(item) || !fields(item, ['title', 'vn_title', 'structure', 'desc']) || !Array.isArray(item.examples) || !item.examples.length ||
          item.examples.some(example => !row(example) || !fields(example, ['zh', 'py', 'vn']))) fail('Nội dung ngôn ngữ không hợp lệ.');
      register(item); if (key === 'grammar') grammar++; else phonetics++;
    }
    const hanzi = value.hanzi;
    if (!identified(hanzi) || !text(hanzi.chars) || ['strokes', 'order', 'structure', 'radicals'].some(key => hanzi[key] !== undefined && !text(hanzi[key]))) fail('Nội dung chữ Hán không hợp lệ.');
    register(hanzi);
    for (const tip of value.xiaoyuTips as unknown[]) {
      if (!identified(tip) || !fields(tip, ['zh', 'vn'])) fail('Gợi ý Tiểu Ngữ không hợp lệ.');
      register(tip);
    }
  }
  if (words !== 342 || scenes !== 45 || grammar !== 40 || phonetics !== 3) fail('Giáo trình thiếu nội dung đã xác nhận.');
  return lessons as unknown as readonly BookLesson[];
}

function validateMedia(value: unknown): MediaData {
  if (!row(value) || value.schemaVersion !== 1 || !commitHash(value.baseline) || !Array.isArray(value.originalTracks) || value.originalTracks.length !== 93 ||
      !row(value.textbookSegments) ||
      !Array.isArray(value.missingWordAudio) || value.missingWordAudio.length !== 14) fail('Chỉ mục âm thanh không hợp lệ.');
  const segments = value.textbookSegments;
  if (!['text', 'vocab', 'unsupported', 'crossLessonReuse'].every(key => row(segments[key]))) fail('Chỉ mục đoạn âm thanh không hợp lệ.');
  const tracks = new Map<string, OriginalTrack>();
  for (const track of value.originalTracks) {
    if (!row(track) || !Number.isInteger(track.lesson) || Number(track.lesson) < 1 || Number(track.lesson) > 15 ||
        !Number.isInteger(track.track) || Number(track.track) < 1 || Number(track.track) > 7 || track.id !== `${track.lesson}-${track.track}` ||
        tracks.has(String(track.id)) || !['text', 'vocab', 'shadow'].includes(String(track.kind)) ||
        track.file !== `audio/${track.id}.mp3` || track.path !== `new-hsk1/hsk1/audio/${track.id}.mp3` ||
        track.kind !== (track.track === 7 ? 'shadow' : Number(track.track) % 2 === 1 ? 'text' : 'vocab') ||
        track.scene !== (track.track === 7 ? null : Math.ceil(Number(track.track) / 2)) || (track.track === 7 && Number(track.lesson) > 3) ||
        typeof track.duration_s !== 'number' || !Number.isFinite(track.duration_s) || track.duration_s <= 0 ||
        !Number.isInteger(track.bytes) || Number(track.bytes) <= 0 || !hash(track.sha256) || !hash(track.fingerprint)) fail('Tệp âm thanh gốc không hợp lệ.');
    tracks.set(String(track.id), track as unknown as OriginalTrack);
  }
  for (const key of ['text', 'vocab'] as const) for (const [id, ranges] of Object.entries(segments[key] as Record<string, unknown>)) {
    const track = tracks.get(id);
    if (!track || track.kind !== key || !Array.isArray(ranges) || !ranges.length) fail('Nguồn đoạn âm thanh không hợp lệ.');
    for (const range of ranges) {
      if (!Array.isArray(range) || range.length !== (key === 'text' ? 2 : 3) || (key === 'vocab' && !text(range[0]))) fail('Đoạn âm thanh không hợp lệ.');
      checkRange(track, range[range.length - 2], range[range.length - 1]);
    }
  }
  for (const [lesson, values] of Object.entries(segments.crossLessonReuse as Record<string, unknown>)) {
    if (!/^(?:[1-9]|1[0-5])$/.test(lesson) || !row(values)) fail('Khai báo âm thanh dùng chung không hợp lệ.');
    for (const [word, range] of Object.entries(values)) {
      if (!text(word) || !Array.isArray(range) || range.length !== 3 || !text(range[0])) fail('Khai báo âm thanh dùng chung không hợp lệ.');
      const track = tracks.get(range[0]);
      if (!track || track.kind !== 'vocab') fail('Nguồn âm thanh dùng chung không hợp lệ.');
      checkRange(track, range[1], range[2]);
    }
  }
  for (const [lesson, words] of Object.entries(segments.unsupported as Record<string, unknown>)) {
    if (!/^(?:[1-9]|1[0-5])$/.test(lesson) || !strings(words)) fail('Khai báo thiếu âm thanh không hợp lệ.');
  }
  if (value.missingWordAudio.some(item => !row(item) || !fields(item, ['id', 'zh']) || !Number.isInteger(item.lesson))) fail('Danh sách thiếu âm thanh không hợp lệ.');
  return value as unknown as MediaData;
}

function checkRange(track: OriginalTrack, start: unknown, end: unknown): void {
  if (typeof start !== 'number' || typeof end !== 'number' || !Number.isFinite(start) || !Number.isFinite(end) || start < 0 ||
      end <= start || end > track.duration_s) fail('Giới hạn đoạn âm thanh không hợp lệ.');
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

export function createTextbookContent(bookValue: unknown, mediaValue: unknown, catalogValue: unknown,
  audioURL: (trackId: string) => string = id => typeof document === 'undefined' ? `course-assets/audio/${id}.mp3` : new URL(`course-assets/audio/${id}.mp3`, courseAssetBase()).href,
  displayRevisionValue?: unknown): TextbookContent {
  const sourceLessons = freeze(structuredClone(validateTextbook(bookValue)));
  const media = freeze(structuredClone(validateMedia(mediaValue)));
  if (!row(catalogValue) || catalogValue.schemaVersion !== 1 || !commitHash(catalogValue.baseline) || !Array.isArray(catalogValue.vocabulary) || catalogValue.vocabulary.length !== 344) fail('Chỉ mục nghĩa từ không hợp lệ.');
  if (!row(bookValue) || !row(mediaValue) || bookValue.baseline !== mediaValue.baseline || bookValue.baseline !== catalogValue.baseline) fail('Các nguồn giáo trình không cùng phiên bản.');
  const tracks = new Map(media.originalTracks.map(track => [track.id, track]));
  const missing = new Map(media.missingWordAudio.map(item => [item.id, item]));
  const senses = new Map<string, CatalogSense>();
  let withAudio = 0;
  for (const value of catalogValue.vocabulary) {
    if (!row(value) || !fields(value, ['id', 'senseId', 'zh', 'py', 'vi', 'senseZh']) || !Number.isInteger(value.lesson) || Number(value.lesson) < 1 || Number(value.lesson) > 15 || senses.has(String(value.id))) fail('Nghĩa từ không hợp lệ.');
    if (value.audio !== null) {
      if (!row(value.audio) || !fields(value.audio, ['track', 'timingBasis'])) fail('Âm thanh từ vựng không hợp lệ.');
      const audio = value.audio;
      const track = tracks.get(String(audio.track));
      if (!track || track.kind !== 'vocab') fail('Nguồn âm thanh từ vựng không hợp lệ.');
      checkRange(track, audio.start, audio.end);
      if (track.lesson !== value.lesson) {
        const declared = media.textbookSegments.crossLessonReuse[String(value.lesson)]?.[String(value.zh)];
        if (!declared || declared[0] !== audio.track || declared[1] !== audio.start || declared[2] !== audio.end) fail('Không được tự thay âm thanh của bài khác.');
      }
      const segment = media.textbookSegments.vocab[track.id]?.some(range => range[0] === value.zh && range[1] === audio.start && range[2] === audio.end);
      if (!segment) fail('Âm thanh từ không khớp đoạn giáo trình.');
      withAudio++;
    } else {
      const declared = missing.get(String(value.id));
      if (!declared || declared.lesson !== value.lesson || declared.zh !== value.zh || !media.textbookSegments.unsupported[String(value.lesson)]?.includes(String(value.zh))) fail('Trạng thái thiếu âm thanh không khớp giáo trình.');
    }
    senses.set(String(value.id), freeze(structuredClone(value as unknown as CatalogSense)));
  }
  if (withAudio !== 330 || senses.size - withAudio !== 14 || missing.size !== 14) fail('Số lượng âm thanh từ vựng không khớp giáo trình.');
  for (const lesson of sourceLessons) {
    for (const word of lesson.vocab) for (const id of word.catalogIds) {
      const sense = senses.get(id);
      if (!sense || sense.lesson !== lesson.id || sense.zh !== word.zh || (word.sourceSenseIds && !word.sourceSenseIds.includes(sense.senseId))) fail('Nghĩa từ không khớp hàng giáo trình.');
    }
    for (const [index, scene] of lesson.scenes.entries()) {
      const track = tracks.get(String(scene.source.audioTrack));
      if (!track || track.kind !== 'text' || track.lesson !== lesson.id || track.scene !== index + 1 || media.textbookSegments.text[track.id]?.length !== scene.lines.length) fail('Âm thanh hội thoại không khớp giáo trình.');
    }
  }
  const revised = displayRevisionValue === undefined ? undefined : reviseTextbookDisplay(sourceLessons, displayRevisionValue, String(bookValue.baseline));
  const lessons = revised ? freeze(revised.lessons) : sourceLessons;
  const lessonMap = new Map(lessons.map(lesson => [lesson.id, lesson]));
  const original = (track: OriginalTrack, label: string): TextbookAudio => ({ available: true, track, request: { url: audioURL(track.id), label, sourceKind: 'original' } });
  const segment = (track: OriginalTrack, start: number, end: number, label: string): TextbookAudio => ({ available: true, track, request: { url: audioURL(track.id), start, end, label, sourceKind: 'segment' } });
  const findWord = (lessonId: number, wordId: string) => lessonMap.get(lessonId)?.vocab.find(word => word.id === wordId);
  const findScene = (lessonId: number, sceneId: string) => lessonMap.get(lessonId)?.scenes.find(scene => scene.id === sceneId);
  const senseAudio = (sense: CatalogSense): TextbookAudio => sense.audio ? segment(tracks.get(sense.audio.track)!, sense.audio.start, sense.audio.end, `${sense.zh} · ${sense.senseZh}`) : noAudio();
  return {
    lessons,
    ...(revised ? { displayRevisions: freeze(revised.info) } : {}),
    resolveWord(lessonId, wordId, catalogId) {
      const word = findWord(lessonId, wordId);
      if (!word || (catalogId !== undefined && !word.catalogIds.includes(catalogId))) return noAudio('Từ hoặc nghĩa từ không thuộc bài học này.');
      return senseAudio(senses.get(catalogId ?? word.catalogIds[0])!);
    },
    wordSenses(lessonId, wordId) {
      return findWord(lessonId, wordId)?.catalogIds.map(id => {
        const sense = senses.get(id)!;
        return { catalogId: id, senseId: sense.senseId, senseZh: sense.senseZh, py: sense.py, vi: sense.vi, audio: senseAudio(sense) };
      }) ?? [];
    },
    resolveScene(lessonId, sceneId) {
      const scene = findScene(lessonId, sceneId);
      return scene ? original(tracks.get(String(scene.source.audioTrack))!, scene.place_vn) : noAudio('Không tìm thấy hội thoại của bài học.');
    },
    resolveLine(lessonId, sceneId, lineId) {
      const scene = findScene(lessonId, sceneId);
      const index = scene?.lines.findIndex(line => line.id === lineId) ?? -1;
      if (!scene || index < 0) return noAudio('Không tìm thấy câu hội thoại của bài học.');
      const track = tracks.get(String(scene.source.audioTrack))!;
      const range = media.textbookSegments.text[track.id][index];
      return segment(track, range[0], range[1], `${scene.lines[index].s}: ${scene.lines[index].zh}`);
    },
    vocabPlaylist(lessonId) {
      if (!lessonMap.has(lessonId)) return [];
      return media.originalTracks.filter(track => track.lesson === lessonId && track.kind === 'vocab').sort((a, b) => a.track - b.track)
        .map(track => ({ url: audioURL(track.id), label: `Từ vựng bài ${lessonId} · ${track.scene}`, sourceKind: 'original' as const }));
    },
    tongue(lessonId) {
      const track = tracks.get(`${lessonId}-7`);
      return track?.kind === 'shadow' ? original(track, `Luyện đọc nhanh · bài ${lessonId}`) : noAudio('Bài này không có bản ghi luyện đọc nhanh trong giáo trình.');
    }
  };
}

/** Asset URL imports stay inside the browser-only loader so pure validation works in Node. */
export async function loadTextbook(signal: AbortSignal): Promise<TextbookContent> {
  const assets = await Promise.all([
    import('../../../content/textbook.json?url'), import('../../../content/media-references.json?url'), import('../../../content/stage3-catalog.json?url'),
    import('../../../content/textbook-display-revisions.json?url')
  ]);
  const values = await Promise.all(assets.map(async asset => {
    const response = await fetch(asset.default, { signal });
    if (!response.ok) throw new Error(`Textbook content HTTP ${response.status}`);
    return response.json() as Promise<unknown>;
  }));
  if (signal.aborted) throw new DOMException('Module left.', 'AbortError');
  return createTextbookContent(values[0], values[1], values[2], undefined, values[3]);
}
