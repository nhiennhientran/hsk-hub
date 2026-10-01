import homework from '../../domain/homework/engine.js';
import practice from '../../domain/practice/engine.js';
import legacyIdentities from '../../domain/homework/legacy-identities.json' with { type: 'json' };
import { FEATURES, PARTS, SECTIONS } from '../../app/contracts.ts';
import type { Route, Section } from '../../app/contracts.ts';
import { normalizeRoute, parseRoute } from '../../app/router.ts';
import type { HomeworkState, PracticeState } from '../../domain/types.ts';

export const LEGACY_KEYS = Object.freeze([
  'hsk1_ranteacher_progress_v1', 'hsk1_ranteacher_mastered_v1',
  'hsk_module_progress_v1', 'hsk_recent_lesson_v1',
  'ran_hsk1_learning_v2', 'ran_hsk1_stage1_v3',
  'ran_hsk1_stage2_v3', 'ran_hsk1_stage2_v3_recovery',
  'ran_hsk1_stage3_v1', 'ran_hsk1_stage3_v1_previous',
  'ran_hsk1_integrated_nav_v1',
] as const);

export interface ReadingState {
  lessons: Record<string, { visited?: boolean; complete?: boolean }>;
  mastered: Record<string, boolean>;
  modules: Record<string, { modules: Section[]; updatedAt: number }>;
}
export interface AppData {
  reading: ReadingState;
  homework: HomeworkState;
  practice: PracticeState;
  navigation: Route | null;
  /** Original bytes are kept once under their real source key. Access gates are excluded. */
  legacyRaw: Record<string, string>;
}
export interface MigrationResult { data: AppData; warnings: string[]; sources: string[] }
export interface Compatibility {
  blank(): AppData;
  validate(data: unknown): AppData;
  migrate(raw: Record<string, string | null>, now?: number): MigrationResult;
  importLegacy(input: unknown, base: AppData, now?: number): MigrationResult;
  summary(data: AppData): Record<string, number>;
}
type Row = Record<string, unknown>;
const own = (row: object, key: string) => Object.prototype.hasOwnProperty.call(row, key);
const record = (value: unknown): value is Row => value !== null && typeof value === 'object' &&
  !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
function fail(message: string): never { throw new Error(message); }
const time = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= 8640000000000000;
const lesson = (value: string): boolean => /^([1-9]|1[0-5])$/.test(value);
const message = (error: unknown): string => error instanceof Error ? error.message : 'Dữ liệu không hợp lệ.';
const parse = (text: string): unknown => JSON.parse(text);
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((value, index) => same(value, b[index]));
  if (!record(a) || !record(b)) return false;
  return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => own(b, key) && same(a[key], b[key]));
}
function exact(row: Row, keys: readonly string[]): void {
  if (Object.keys(row).some(key => !keys.includes(key))) fail('Bản lưu có trường không được hỗ trợ.');
}
function questionIdentity(q: Row): string {
  return JSON.stringify([q.id, q.kind, q.prompt || '', q.stem || '', q.meaning || '', q.options || [],
    q.tokens || [], q.answer ?? null, q.answers || [], q.assessment || 'automatic', q.transcript || '', q.audio || null]);
}

/** A flagged same-ID question is not enough: its actual old identity must still match. */
function legacyBank(bank: readonly Row[]): Row[] {
  const known = legacyIdentities.identities as Record<string, string>;
  return bank.map(row => ({ ...row, ...Object.fromEntries(['choice', 'sort', 'listening'].flatMap(kind =>
    Array.isArray(row[kind]) ? [[kind, row[kind].map((value: unknown) => {
      if (!record(value)) fail('Ngân hàng câu hỏi không hợp lệ.');
      return { ...value, legacyCompatible: value.legacyCompatible === true && typeof value.id === 'string' &&
        known[value.id] === questionIdentity(value) };
    })]] : [])) }));
}
function homeworkScoreIssues(raw: unknown, state: HomeworkState): string[] {
  if (!record(raw) || !record(raw.lessons)) return ['Thiếu dữ liệu bài tập.'];
  const issues: string[] = [];
  for (const [id, row] of Object.entries(state.lessons)) {
    const sourceRow = raw.lessons[id];
    for (const [kind, group] of Object.entries(row)) {
      if (!group || !record(sourceRow) || !record(sourceRow[kind])) { issues.push(`${id}:${kind}`); continue; }
      const source = sourceRow[kind];
      if (source.completed !== group.completed) issues.push(`${id}:${kind}:completed`);
      for (const field of ['first', 'attempt', 'latest'] as const) {
        const expected = group[field], supplied = source[field];
        if (!expected) continue;
        if (!record(supplied) || ['assessment', 'results', 'correct', 'total'].some(key => !same(supplied[key], expected[key as keyof typeof expected]))) {
          issues.push(`${id}:${kind}:${field}`);
        }
      }
      group.history.forEach((expected, index) => {
        const supplied = Array.isArray(source.history) ? source.history[index] : undefined;
        if (!record(supplied) || ['assessment', 'results', 'correct', 'total'].some(key => !same(supplied[key], expected[key as keyof typeof expected]))) {
          issues.push(`${id}:${kind}:history[${index}]`);
        }
      });
    }
  }
  return issues;
}
function practiceScoreIssues(raw: unknown, state: PracticeState): string[] {
  const issues: string[] = [];
  if (!record(raw) || !record(raw.listening) || !record(raw.listening.records)) return ['Thiếu dữ liệu nghe.'];
  for (const [id, result] of Object.entries(state.listening.records)) {
    const supplied = raw.listening.records[id];
    for (const field of ['first', 'latest'] as const) {
      if (!record(supplied) || !record(supplied[field]) || supplied[field].correct !== result[field].correct) issues.push(`${id}:${field}`);
    }
  }
  const source = raw.listening.session;
  const normalized = state.listening.session;
  if (normalized && record(normalized.responses) && record(source) && record(source.responses)) {
    for (const [id, response] of Object.entries(normalized.responses)) {
      const supplied = source.responses[id];
      if (record(response) && record(response.submission) && (!record(supplied) || !record(supplied.submission) ||
          supplied.submission.correct !== response.submission.correct)) issues.push(`${id}:session`);
    }
  }
  return issues;
}

export function createCompatibility(bankInput: unknown, catalog: unknown, textbook?: unknown): Compatibility {
  const bank = Array.isArray(bankInput) ? bankInput : record(bankInput) ? bankInput.lessons : null;
  if (!Array.isArray(bank) || bank.length !== 15 || bank.some(row => !record(row))) fail('Ngân hàng HSK 1 cần đủ 15 bài.');
  homework.validateImport(homework.blank(), bank);
  practice.importBackup(practice.blank(), catalog);
  const compatibleBank = legacyBank(bank);
  const stars = new Set<string>();
  const bookRows = record(textbook) && Array.isArray(textbook.lessons) ? textbook.lessons : Array.isArray(textbook) ? textbook : null;
  if (bookRows) for (const row of bookRows) {
    if (!record(row) || !Array.isArray(row.vocab)) fail('Dữ liệu từ vựng giáo trình không hợp lệ.');
    for (const word of row.vocab) if (record(word) && typeof word.zh === 'string') stars.add(`${row.id}-${word.zh}`);
  }
  const blank = (): AppData => ({ reading: { lessons: {}, mastered: {}, modules: {} },
    homework: homework.blank(), practice: practice.blank(), navigation: null, legacyRaw: {} });
  function reading(input: unknown): ReadingState {
    if (!record(input) || !record(input.lessons) || !record(input.mastered) || !record(input.modules)) fail('Tiến độ đọc không hợp lệ.');
    exact(input, ['lessons', 'mastered', 'modules']);
    const output: ReadingState = { lessons: {}, mastered: {}, modules: {} };
    for (const [id, value] of Object.entries(input.lessons)) {
      if (!lesson(id) || !record(value)) fail('Mã bài đọc không thuộc HSK 1.');
      exact(value, ['visited', 'complete']);
      if (Object.values(value).some(item => typeof item !== 'boolean')) fail('Dấu tiến độ đọc cần là đúng hoặc sai.');
      output.lessons[id] = { ...value };
    }
    for (const [id, value] of Object.entries(input.mastered)) {
      const split = id.indexOf('-');
      if (split < 1 || !lesson(id.slice(0, split)) || !id.slice(split + 1) || typeof value !== 'boolean' ||
          (stars.size > 0 && !stars.has(id))) fail('Dấu từ đã thuộc không khớp giáo trình HSK 1.');
      output.mastered[id] = value;
    }
    for (const [id, value] of Object.entries(input.modules)) {
      if (!id.startsWith('hsk1:') || !lesson(id.slice(5)) || !record(value) || !Array.isArray(value.modules) ||
          new Set(value.modules).size !== value.modules.length || value.modules.some(item => !SECTIONS.some(section => section === item)) || !time(value.updatedAt)) {
        fail('Tiến độ phần giáo trình không hợp lệ.');
      }
      exact(value, ['modules', 'updatedAt']);
      output.modules[id] = { modules: value.modules.slice() as Section[], updatedAt: value.updatedAt };
    }
    return output;
  }
  function rawSources(input: unknown): Record<string, string> {
    if (!record(input)) fail('Nguồn dữ liệu cũ không hợp lệ.');
    const output: Record<string, string> = {};
    for (const [key, value] of Object.entries(input)) {
      if (!LEGACY_KEYS.some(item => item === key) || typeof value !== 'string') fail('Bản học tập không được chứa khóa truy cập hoặc nguồn lạ.');
      const limit = key.startsWith('ran_hsk1_stage3_') ? practice.MAX_BACKUP_BYTES : homework.MAX_BACKUP_BYTES;
      if (new TextEncoder().encode(value).byteLength > limit) fail(`Nguồn ${key} vượt giới hạn định dạng cũ.`);
      output[key] = value;
    }
    return output;
  }
  function validate(input: unknown): AppData {
    if (!record(input)) fail('Bản lưu học tập không hợp lệ.');
    exact(input, ['reading', 'homework', 'practice', 'navigation', 'legacyRaw']);
    const h = homework.validateImport(input.homework, bank), p = practice.importBackup(input.practice, catalog);
    const issues = [...homeworkScoreIssues(input.homework, h), ...practiceScoreIssues(input.practice, p)];
    if (issues.length) fail(`Điểm hoặc trạng thái nộp bị sửa; nhập bị từ chối (${issues[0]}).`);
    let navigation: Route | null = null;
    if (input.navigation !== null) {
      const source = input.navigation;
      if (!record(source) || !FEATURES.some(feature => feature === source.feature) ||
          typeof source.lesson !== 'number' || !lesson(String(source.lesson))) fail('Vị trí tiếp tục không hợp lệ.');
      const normalized = normalizeRoute(source as Partial<Route>);
      if (!same(source, normalized)) fail('Vị trí tiếp tục có trường không hợp lệ.');
      navigation = normalized;
    }
    return { reading: reading(input.reading), homework: h, practice: p, navigation, legacyRaw: rawSources(input.legacyRaw) };
  }
  function convert(input: unknown, now: number): { state: HomeworkState | PracticeState; key: string; warnings: string[] } {
    if (!record(input)) fail('Tệp không phải bản sao lưu HSK 1 được hỗ trợ.');
    if (input.app === practice.APP && input.schema === practice.SCHEMA) {
      const state = practice.importBackup(input, catalog);
      const issues = practiceScoreIssues(input, state);
      return { state, key: practice.KEY, warnings: issues.length ? ['Kết quả nghe cũ đã được tính lại từ đáp án; số đúng ghi trong tệp không được tin cậy.'] : [] };
    }
    let key: string, state: HomeworkState;
    if (input.app === homework.APP && input.schema === homework.SCHEMA) {
      key = homework.KEY; state = homework.validateImport(input, bank);
    } else if (input.schema === 3 && (input.app === undefined || input.app === 'hsk1-stage1')) {
      key = homework.STEP1_KEY; state = homework.migrateStep1(input, bank, now);
      // The original input is held once in legacyRaw, rather than nesting another source copy.
      delete state.archive.step1;
    } else if (input.schema === 2 && input.app === undefined && record(input.lessons)) {
      key = homework.LEGACY_KEY; state = homework.migrateLegacy(input, compatibleBank, now);
      delete state.archive.legacy;
    } else fail('Ứng dụng hoặc phiên bản bản sao lưu không được hỗ trợ.');
    const warnings: string[] = [];
    if (key === homework.LEGACY_KEY) {
      warnings.push('Bản cũ: điểm chỉ được chuyển khi cả mã và nội dung câu hỏi khớp; các nhóm đã đổi chỉ giữ bản gốc hoặc nháp đã xác minh.');
      warnings.push('Bài dịch trắc nghiệm cũ chỉ được lưu nguồn; bài dịch tự viết mới chưa được nộp và không có điểm.');
    } else if (homeworkScoreIssues(input, state).length) {
      warnings.push('Điểm và trạng thái bài tập cũ đã được tính lại từ đáp án đã xác minh.');
    }
    if (record(state.archive.migration) && Array.isArray(state.archive.migration.warnings)) {
      warnings.push(...state.archive.migration.warnings.filter((value): value is string => typeof value === 'string'));
    }
    return { state, key, warnings };
  }
  function importLegacy(input: unknown, base: AppData, now = Date.now()): MigrationResult {
    const data = validate(base), text = typeof input === 'string' ? input : JSON.stringify(input);
    if (typeof text !== 'string') fail('Tệp không phải JSON học tập.');
    const result = convert(typeof input === 'string' ? parse(input) : input, now);
    if (result.key === practice.KEY) data.practice = result.state as PracticeState;
    else data.homework = result.state as HomeworkState;
    data.legacyRaw[result.key] = text;
    rawSources(data.legacyRaw);
    return { data: validate(data), warnings: result.warnings, sources: [result.key] };
  }
  function migrate(raw: Record<string, string | null>, now = Date.now()): MigrationResult {
    const data = blank(), warnings: string[] = [], sources: string[] = [];
    // Unknown keys are ignored before validation: shared gates never enter a backup.
    const allowed = Object.fromEntries(LEGACY_KEYS.filter(key => own(raw, key) && raw[key] !== null).map(key => [key, raw[key]]));
    data.legacyRaw = rawSources(allowed);
    function read(key: string, apply: (value: unknown) => void): void {
      if (!own(data.legacyRaw, key)) return;
      try { apply(parse(data.legacyRaw[key]!)); sources.push(key); }
      catch (error) { warnings.push(`${key}: ${message(error)} Bản gốc vẫn được giữ để khôi phục; không thay bằng dữ liệu trống.`); }
    }
    read(LEGACY_KEYS[0], value => { data.reading.lessons = reading({ ...data.reading, lessons: value }).lessons; });
    read(LEGACY_KEYS[1], value => { data.reading.mastered = reading({ ...data.reading, mastered: value }).mastered; });
    read(LEGACY_KEYS[2], value => {
      if (!record(value)) fail('Tiến độ chung không hợp lệ.');
      const relevant = Object.fromEntries(Object.entries(value).filter(([key]) => key.startsWith('hsk1:')));
      data.reading.modules = reading({ ...data.reading, modules: relevant }).modules;
    });
    // A corrupt preferred source stays visible; it never silently falls back to an older version.
    const hkey = [homework.KEY, homework.STEP1_KEY, homework.LEGACY_KEY].find(key => own(data.legacyRaw, key));
    if (hkey) read(hkey, value => {
      const result = convert(value, now);
      if (result.key !== hkey) fail('Ứng dụng trong dữ liệu không khớp khóa nguồn.');
      data.homework = result.state as HomeworkState; warnings.push(...result.warnings);
    });
    read(practice.KEY, value => {
      const result = convert(value, now);
      if (result.key !== practice.KEY) fail('Nguồn không phải bản nghe và từ vựng.');
      data.practice = result.state as PracticeState; warnings.push(...result.warnings);
    });
    read('hsk_recent_lesson_v1', value => {
      if (!record(value)) fail('Vị trí đọc gần đây không hợp lệ.');
      if (value.code !== 'hsk1') return;
      if (!lesson(String(value.id)) || !SECTIONS.some(section => section === value.sec)) fail('Vị trí đọc HSK 1 không hợp lệ.');
      data.navigation = normalizeRoute({ feature: 'textbook', lesson: Number(value.id), section: value.sec as Section });
    });
    read('ran_hsk1_integrated_nav_v1', value => {
      if (!record(value) || !lesson(String(value.lesson))) fail('Vị trí học HSK 1 không hợp lệ.');
      const feature = value.mode === 'vocab' ? 'vocabulary' : value.mode;
      if (!FEATURES.some(item => item === feature)) fail('Phần học tiếp tục không được hỗ trợ.');
      const parsed = typeof value.href === 'string' ? parseRoute(value.href) : null;
      const remembered = record(value.homeworkParts) ? value.homeworkParts[String(value.lesson)] : null;
      const part = PARTS.find(item => item === remembered) ?? (parsed && parsed.feature === feature && parsed.lesson === Number(value.lesson) ? parsed.part : undefined);
      data.navigation = normalizeRoute({ feature: feature as Route['feature'], lesson: Number(value.lesson), part,
        section: parsed && parsed.feature === feature ? parsed.section : undefined });
    });
    // Recovery/previous snapshots are retained for inspection, never automatically activated.
    for (const [key, engine] of [[`${homework.KEY}_recovery`, 'homework'], [`${practice.KEY}_previous`, 'practice']] as const) {
      read(key, value => {
        if (engine === 'homework') homework.validateImport(value, bank); else practice.importBackup(value, catalog);
      });
    }
    return { data: validate(data), warnings: [...new Set(warnings)], sources };
  }
  function summary(data: AppData): Record<string, number> {
    const totals = homework.courseTotals(data.homework, bank);
    const records = Object.values(data.practice.listening.records);
    return {
      readingVisited: Object.values(data.reading.lessons).filter(row => row.visited).length,
      readingCompleted: Object.values(data.reading.lessons).filter(row => row.complete).length,
      masteredWords: Object.values(data.reading.mastered).filter(Boolean).length,
      homeworkSubmitted: totals.homework.submitted, automaticSubmitted: totals.automatic.submitted,
      automaticFirstCorrect: totals.automatic.firstCorrect, automaticLatestCorrect: totals.automatic.latestCorrect,
      manualSubmitted: totals.manual.submitted, listeningSubmitted: records.length,
      listeningFirstCorrect: records.filter(row => row.first.correct).length,
      listeningLatestCorrect: records.filter(row => row.latest.correct).length,
      scheduledSenses: Object.keys(data.practice.cards.schedule).length,
      legacySources: Object.keys(data.legacyRaw).length,
    };
  }
  return { blank, validate, migrate, importLegacy, summary };
}

export async function loadCompatibility(signal?: AbortSignal): Promise<Compatibility> {
  const urls = [new URL('../../../content/stage2-bank.json', import.meta.url),
    new URL('../../../content/stage3-catalog.json', import.meta.url), new URL('../../../content/textbook.json', import.meta.url)];
  const values = await Promise.all(urls.map(async url => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Không tải được dữ liệu học tập (HTTP ${response.status}).`);
    return response.json() as Promise<unknown>;
  }));
  if (signal?.aborted) throw new DOMException('Module left.', 'AbortError');
  return createCompatibility(values[0], values[1], values[2]);
}
