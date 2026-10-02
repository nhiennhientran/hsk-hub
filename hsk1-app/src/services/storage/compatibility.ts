import { dataWarning, dataOriginalWarning, dataExerciseWarnings } from './copy.ts';
import legacyExercises from '../../../content/legacy-exercises.json' with { type: 'json' };
import { migrateLegacyExercises } from '../../domain/exercises/migration.ts';
import { createExerciseCatalogue } from '../../domain/exercises/catalogue.ts';
import { blankExercisesState, validateExercisesState, resetExercises, type ExercisesState } from '../../domain/exercises/engine.ts';
import homework from '../../domain/homework/engine.js';
import practice from '../../domain/practice/engine.js';
import legacyIdentities from '../../domain/homework/legacy-identities.json' with { type: 'json' };
import { resetProgress, type ResetScope, type ResetResult } from '../../domain/progress/reset.ts';
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
  'ran_hsk1_integrated_nav_v1', 'hsk1_lesson9_pilot_progress_v1',
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
  exercises: ExercisesState;
  navigation: Route | null;
  /** Original bytes are kept once under their real source key. Access gates are excluded. */
  legacyRaw: Record<string, string>;
}
export interface SourceReport {
  key: string;
  status: 'mapped' | 'retained' | 'invalid';
  understood: number;
  unsupported: number;
  bytes: number;
  warnings: string[];
}
export interface MigrationResult { data: AppData; warnings: string[]; sources: string[]; reports: SourceReport[] }
export interface Compatibility {
  blank(): AppData;
  validate(data: unknown): AppData;
  migrate(raw: Record<string, string | null>, now?: number, base?: AppData): MigrationResult;
  importLegacy(input: unknown, base: AppData, now?: number): MigrationResult;
  summary(data: AppData): Record<string, number>;
  reset(data: AppData, scope: ResetScope): ResetResult;
}
type Row = Record<string, unknown>;
const own = (row: object, key: string) => Object.prototype.hasOwnProperty.call(row, key);
const record = (value: unknown): value is Row => value !== null && typeof value === 'object' &&
  !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
function fail(message: string): never { throw new Error(message); }
const time = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= 8640000000000000;
const lesson = (value: string): boolean => /^([1-9]|1[0-5])$/.test(value);
const message = (error: unknown): string => error instanceof Error ? error.message : dataWarning({"zh": "数据无效。", "vi": "Dữ liệu không hợp lệ."});
const parse = (text: string): unknown => JSON.parse(text);
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((value, index) => same(value, b[index]));
  if (!record(a) || !record(b)) return false;
  return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => own(b, key) && same(a[key], b[key]));
}
function exact(row: Row, keys: readonly string[]): void {
  if (Object.keys(row).some(key => !keys.includes(key))) fail(dataWarning({"zh": "保存的数据包含不受支持的字段。", "vi": "Bản lưu có trường không được hỗ trợ."}));
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
      if (!record(value)) fail(dataWarning({"zh": "题库无效。", "vi": "Ngân hàng câu hỏi không hợp lệ."}));
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
  if (!Array.isArray(bank) || bank.length !== 15 || bank.some(row => !record(row))) fail(dataWarning({"zh": "HSK 1 题库必须包含完整的15课。", "vi": "Ngân hàng HSK 1 cần đủ 15 bài."}));
  homework.validateImport(homework.blank(), bank);
  practice.importBackup(practice.blank(), catalog);
  const compatibleBank = legacyBank(bank);
  const exerciseCatalogue = createExerciseCatalogue(legacyExercises, bank, catalog);
  const stars = new Set<string>();
  const bookRows = record(textbook) && Array.isArray(textbook.lessons) ? textbook.lessons : Array.isArray(textbook) ? textbook : null;
  if (bookRows) for (const row of bookRows) {
    if (!record(row) || !Array.isArray(row.vocab)) fail(dataWarning({"zh": "教材词汇数据无效。", "vi": "Dữ liệu từ vựng giáo trình không hợp lệ."}));
    for (const word of row.vocab) if (record(word) && typeof word.zh === 'string') stars.add(`${row.id}-${word.zh}`);
  }
  const blank = (): AppData => ({ reading: { lessons: {}, mastered: {}, modules: {} },
    homework: homework.blank(), practice: practice.blank(), exercises: blankExercisesState(), navigation: null, legacyRaw: {} });
  function reading(input: unknown): ReadingState {
    if (!record(input) || !record(input.lessons) || !record(input.mastered) || !record(input.modules)) fail(dataWarning({"zh": "阅读进度无效。", "vi": "Tiến độ đọc không hợp lệ."}));
    exact(input, ['lessons', 'mastered', 'modules']);
    const output: ReadingState = { lessons: {}, mastered: {}, modules: {} };
    for (const [id, value] of Object.entries(input.lessons)) {
      if (!lesson(id) || !record(value)) fail(dataWarning({"zh": "阅读课次编号不属于 HSK 1。", "vi": "Mã bài đọc không thuộc HSK 1."}));
      exact(value, ['visited', 'complete']);
      if (Object.values(value).some(item => typeof item !== 'boolean')) fail(dataWarning({"zh": "阅读进度标记必须为真或假。", "vi": "Dấu tiến độ đọc cần là đúng hoặc sai."}));
      output.lessons[id] = { ...value };
    }
    for (const [id, value] of Object.entries(input.mastered)) {
      const split = id.indexOf('-');
      if (split < 1 || !lesson(id.slice(0, split)) || !id.slice(split + 1) || typeof value !== 'boolean' ||
          (stars.size > 0 && !stars.has(id))) fail(dataWarning({"zh": "掌握标记与 HSK 1 教材不匹配。", "vi": "Dấu từ đã thuộc không khớp giáo trình HSK 1."}));
      output.mastered[id] = value;
    }
    for (const [id, value] of Object.entries(input.modules)) {
      if (!id.startsWith('hsk1:') || !lesson(id.slice(5)) || !record(value) || !Array.isArray(value.modules) ||
          new Set(value.modules).size !== value.modules.length || value.modules.some(item => !SECTIONS.some(section => section === item)) || !time(value.updatedAt)) {
        fail(dataWarning({"zh": "教材模块进度无效。", "vi": "Tiến độ phần giáo trình không hợp lệ."}));
      }
      exact(value, ['modules', 'updatedAt']);
      output.modules[id] = { modules: value.modules.slice() as Section[], updatedAt: value.updatedAt };
    }
    return output;
  }
  function rawSources(input: unknown): Record<string, string> {
    if (!record(input)) fail(dataWarning({"zh": "旧数据来源无效。", "vi": "Nguồn dữ liệu cũ không hợp lệ."}));
    const output: Record<string, string> = {};
    for (const [key, value] of Object.entries(input)) {
      if (!LEGACY_KEYS.some(item => item === key) || typeof value !== 'string') fail(dataWarning({"zh": "学习数据不得包含访问密钥或未知来源。", "vi": "Bản học tập không được chứa khóa truy cập hoặc nguồn lạ."}));
      const limit = key.startsWith('ran_hsk1_stage3_') ? practice.MAX_BACKUP_BYTES : homework.MAX_BACKUP_BYTES;
      if (new TextEncoder().encode(value).byteLength > limit) fail(dataWarning({ zh: `来源 ${key} 超过旧格式的容量限制。`, vi: `Nguồn ${key} vượt giới hạn định dạng cũ.` }));
      output[key] = value;
    }
    return output;
  }
  function validate(input: unknown): AppData {
    if (!record(input)) fail(dataWarning({"zh": "学习备份无效。", "vi": "Bản lưu học tập không hợp lệ."}));
    exact(input, ['reading', 'homework', 'practice', 'exercises', 'navigation', 'legacyRaw']);
    const h = homework.validateImport(input.homework, bank), p = practice.importBackup(input.practice, catalog);
    const issues = [...homeworkScoreIssues(input.homework, h), ...practiceScoreIssues(input.practice, p)];
    if (issues.length) fail(dataWarning({ zh: `成绩或提交状态被修改，已拒绝导入（${issues[0]}）。`, vi: `Điểm hoặc trạng thái nộp bị sửa; nhập bị từ chối (${issues[0]}).` }));
    let navigation: Route | null = null;
    if (input.navigation !== null) {
      const source = input.navigation;
      if (!record(source) || !FEATURES.some(feature => feature === source.feature) ||
          typeof source.lesson !== 'number' || !lesson(String(source.lesson))) fail(dataWarning({"zh": "继续学习的位置无效。", "vi": "Vị trí tiếp tục không hợp lệ."}));
      const normalized = normalizeRoute(source as Partial<Route>);
      if (!same(source, normalized)) fail(dataWarning({"zh": "继续学习的位置包含无效字段。", "vi": "Vị trí tiếp tục có trường không hợp lệ."}));
      navigation = normalized;
    }
    return { reading: reading(input.reading), homework: h, practice: p, exercises: validateExercisesState(input.exercises, exerciseCatalogue), navigation, legacyRaw: rawSources(input.legacyRaw) };
  }
  function convert(input: unknown, now: number): { state: HomeworkState | PracticeState; key: string; warnings: string[] } {
    if (!record(input)) fail(dataWarning({"zh": "此文件不是受支持的 HSK 1 备份。", "vi": "Tệp không phải bản sao lưu HSK 1 được hỗ trợ."}));
    if (input.app === practice.APP && input.schema === practice.SCHEMA) {
      const state = practice.importBackup(input, catalog);
      const issues = practiceScoreIssues(input, state);
      return { state, key: practice.KEY, warnings: issues.length ? [dataWarning({"zh": "旧听力成绩已从答案重新计算，不采信文件中记录的答对数量。", "vi": "Kết quả nghe cũ đã được tính lại từ đáp án; số đúng ghi trong tệp không được tin cậy."})] : [] };
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
    } else fail(dataWarning({"zh": "不支持此应用或备份版本。", "vi": "Ứng dụng hoặc phiên bản bản sao lưu không được hỗ trợ."}));
    const warnings: string[] = [];
    if (key === homework.LEGACY_KEY) {
      warnings.push(dataWarning({"zh": "旧格式没有内容指纹。仅核对已验证的原题库，无法确认文件是否曾在应用之外被修改。", "vi": "Định dạng cũ không có dấu vân tay nội dung. Đối chiếu chỉ áp dụng cho bộ câu hỏi gốc đã xác minh; không thể xác thực tệp từng bị sửa bên ngoài."}));
      warnings.push(dataWarning({"zh": "旧版成绩仅在题目编号与内容均匹配时迁移；已改变的题组只保留原始数据或已验证的草稿。", "vi": "Bản cũ: điểm chỉ được chuyển khi cả mã và nội dung câu hỏi khớp; các nhóm đã đổi chỉ giữ bản gốc hoặc nháp đã xác minh."}));
      warnings.push(dataWarning({"zh": "旧版翻译选择题仅对应原题，不会将成绩或提交状态转入新的自由翻译题。", "vi": "Bài dịch trắc nghiệm cũ chỉ nối với bài gốc tương ứng; không chuyển điểm hoặc trạng thái nộp sang bài dịch tự viết mới."}));
    } else if (homeworkScoreIssues(input, state).length) {
      warnings.push(dataWarning({"zh": "旧作业的成绩和提交状态已根据验证过的答案重新计算。", "vi": "Điểm và trạng thái bài tập cũ đã được tính lại từ đáp án đã xác minh."}));
    }
    if (record(state.archive.migration) && Array.isArray(state.archive.migration.warnings)) {
      warnings.push(...state.archive.migration.warnings.filter((value): value is string => typeof value === 'string').map(dataOriginalWarning));
    }
    return { state, key, warnings };
  }
  // Old mixed-card keys include the answer domain (meaning), not only the Hanzi.
  // Never guess a changed meaning or fan one old rating out to several current senses.
  const plain = (text: string) => text.normalize('NFKC').trim().toLowerCase();
  const compact = (text: string) => plain(text).replace(/\s+/g, '');
  const vocabulary = record(catalog) && Array.isArray(catalog.vocabulary) ? catalog.vocabulary.filter(record) : [];
  const cardFingerprints = practice.startReview(practice.blank(), catalog as Parameters<typeof practice.startReview>[1],
    { lessons: Array.from({ length: 15 }, (_, index) => index + 1), filter: 'all', shuffle: false }, 0).fingerprints;
  function mapWords(raw: unknown, state: PracticeState): { understood: number; unsupported: number } {
    const words = record(raw) && raw.schema === 2 && raw.app === undefined && record(raw.lessons) && record(raw.words) ? raw.words : {};
    let understood = 0, unsupported = 0;
    for (const [key, value] of Object.entries(words)) {
      try {
        const identity: unknown = JSON.parse(key);
        if (!Array.isArray(identity) || identity.length !== 3 || identity.some(item => typeof item !== 'string') || !record(value)) throw Error();
        const matches = vocabulary.filter(item => typeof item.zh === 'string' && typeof item.py === 'string' && typeof item.vi === 'string' &&
          compact(item.zh) === identity[0] && compact(item.py) === identity[1] && plain(item.vi) === identity[2]);
        const ids = [...new Set(matches.map(item => String(item.senseId)))];
        if (ids.length !== 1 || typeof value.zh !== 'string' || compact(value.zh) !== identity[0] ||
            !['known', 'again'].includes(String(value.lastRating)) || !time(value.reviewedAt) || !time(value.due) ||
            !Number.isInteger(value.level) || Number(value.level) < 0 || Number(value.level) > 4 ||
            !Number.isSafeInteger(value.reviews) || Number(value.reviews) < 1 || Number(value.reviews) > 1000000000 ||
            value.source !== 'self-assessment' ||
            (value.lastRating === 'again' && (value.level !== 0 || value.due !== value.reviewedAt)) ||
            (value.lastRating === 'known' && (Number(value.level) < 1 || value.due !== value.reviewedAt + [1, 3, 7, 14][Number(value.level) - 1]! * 86400000))) throw Error();
        const id = ids[0]!;
        // A newer domain and its active queue always win; the source remains downloadable.
        if (own(state.cards.schedule, id) || state.cards.review) { unsupported++; continue; }
        const fingerprint = cardFingerprints[id]!;
        const candidate = structuredClone(state);
        candidate.cards.schedule[id] = { fingerprint, level: value.lastRating === 'again' ? 0 : value.level as number,
          lastRating: value.lastRating === 'known' ? 'good' : 'again', ratedAt: value.reviewedAt,
          dueAt: value.lastRating === 'again' ? value.reviewedAt + 600000 : value.due, reviewCount: value.reviews as number };
        state.cards.schedule = practice.importBackup(candidate, catalog).cards.schedule; understood++;
      } catch { unsupported++; }
    }
    return { understood, unsupported };
  }
  function entryIds(raw: unknown): Set<string> {
    const ids = new Set<string>();
    if (!record(raw)) return ids;
    if (record(raw.lessons)) for (const [lessonId, groups] of Object.entries(raw.lessons)) {
      if (!record(groups)) continue;
      for (const [kind, group] of Object.entries(groups)) {
        if (!record(group)) continue;
        for (const part of [group.draft, ...['first', 'attempt', 'latest'].map(field => record(group[field]) ? group[field].answers : null),
          ...(Array.isArray(group.history) ? group.history.map(item => record(item) ? item.answers : null) : [])]) {
          if (record(part)) for (const id of Object.keys(part)) ids.add(`${lessonId}:${kind}:${id}`);
        }
      }
    }
    if (record(raw.groups)) for (const [groupId, group] of Object.entries(raw.groups)) {
      if (!record(group)) continue;
      for (const part of [group.draft, ...(Array.isArray(group.attempts) ? group.attempts.map(item => record(item) ? item.answers : null) : [])]) {
        if (record(part)) for (const id of Object.keys(part)) ids.add(`${groupId}:${id}`);
      }
    }
    return ids;
  }
  function sourceReports(raw: Record<string, string>, data: AppData, sources: string[], warnings: string[], wordCounts?: { understood: number; unsupported: number }, exerciseBase?: ExercisesState): SourceReport[] {
    return Object.entries(raw).map(([key, text]) => {
      let value: unknown;
      try { value = parse(text); } catch { return { key, status: 'invalid' as const, understood: 0, unsupported: 1, bytes: new TextEncoder().encode(text).byteLength,
        warnings: [dataWarning({"zh": "无法读取 JSON，原始数据完整保留。", "vi": "Không đọc được JSON; giữ nguyên toàn bộ bản gốc."})] }; }
      const active = sources.includes(key), recoveryOnly = key.endsWith('_recovery') || key.endsWith('_previous');
      let total = record(value) ? Object.keys(value).length : 1, understood = 0, scoreOnlyHistory = 0;
      if (key === homework.LEGACY_KEY || key === homework.KEY || key === homework.STEP1_KEY) {
        const entries = entryIds(value), mapped = entryIds(data.homework);
        const homeworkSource = [homework.KEY, homework.STEP1_KEY, homework.LEGACY_KEY].find(source => sources.includes(source));
        const recognized = new Set(key === homeworkSource ? mapped : []);
        if (key === homework.LEGACY_KEY) for (const entry of exerciseCatalogue.entries) {
          if (entry.set === 'original' && (data.exercises.records[entry.authorityId] || data.exercises.drafts[entry.authorityId] !== undefined) &&
              !exerciseBase?.records[entry.authorityId] && exerciseBase?.drafts[entry.authorityId] === undefined) {
            recognized.add(`${entry.lesson}:${entry.group}:${entry.oldId}`);
          }
        }
        if (key === homework.LEGACY_KEY && record(value) && record(value.lessons)) {
          for (const groups of Object.values(value.lessons)) if (record(groups)) {
            for (const group of Object.values(groups)) if (record(group) && Array.isArray(group.history)) {
              scoreOnlyHistory += group.history.filter(item => record(item) && !record(item.answers)).length;
            }
          }
        }
        total = entries.size + scoreOnlyHistory;
        understood = [...entries].filter(id => recognized.has(id)).length;
        const count = key === homework.LEGACY_KEY ? wordCounts : undefined;
        total += record(value) && record(value.words) ? Object.keys(value.words).length : 0;
        understood += count?.understood ?? 0;
      } else if (key === 'hsk1_lesson9_pilot_progress_v1') {
        total = entryIds(value).size + (record(value) && record(value.words) ? Object.keys(value.words).length : 0);
      } else if (key === practice.KEY) {
        total = record(value) && record(value.listening) && record(value.listening.records) ? Object.keys(value.listening.records).length : 0;
        total += record(value) && record(value.cards) && record(value.cards.schedule) ? Object.keys(value.cards.schedule).length : 0;
        understood = active ? total : 0;
      } else if (key === 'hsk_module_progress_v1') understood = active && record(value) ? Object.keys(value).filter(id => id.startsWith('hsk1:')).length : 0;
      else understood = active && !recoveryOnly ? total : 0;
      const unsupported = Math.max(0, total - understood);
      const notes = warnings.filter(warning => warning.includes(key));
      if (scoreOnlyHistory) notes.push(dataWarning({ zh: `${scoreOnlyHistory} 条历史记录只有总分，没有答案：保留原始来源，不生成提交记录。`, vi: `${scoreOnlyHistory} bản ghi lịch sử chỉ có tổng điểm, không có đáp án: giữ nguyên nguồn, không tạo lần nộp.` }));
      if (recoveryOnly) notes.push(dataWarning({"zh": "恢复副本仅原样保留，不会自动启用。", "vi": "Bản khôi phục chỉ được giữ nguyên; không tự động kích hoạt."}));
      if (key === 'hsk1_lesson9_pilot_progress_v1') notes.push(dataWarning({"zh": "第9课原始数据保持不变；题目身份尚未完整核验，因此不迁移成绩。", "vi": "Giữ nguyên nguồn Bài 9; chưa chuyển điểm khi chưa xác minh đầy đủ danh tính câu hỏi."}));
      if (!active && !recoveryOnly && understood === 0) notes.push(dataWarning({"zh": "此来源尚未计入当前学习进度，原始数据仍保留在备份中。", "vi": "Nguồn này chưa được đưa vào tiến độ hoạt động; bản gốc vẫn nằm trong bản sao lưu."}));
      return { key, status: (active || understood > 0) && !recoveryOnly ? 'mapped' : 'retained', understood, unsupported,
        bytes: new TextEncoder().encode(text).byteLength, warnings: notes };
    });
  }
  function importLegacy(input: unknown, base: AppData, now = Date.now()): MigrationResult {
    const data = validate(base), text = typeof input === 'string' ? input : JSON.stringify(input);
    if (typeof text !== 'string') fail(dataWarning({"zh": "此文件不是学习数据 JSON。", "vi": "Tệp không phải JSON học tập."}));
    const parsed = typeof input === 'string' ? parse(input) : input;
    if (record(parsed) && parsed.version === 1 && typeof parsed.bankVersion === 'string' && record(parsed.groups)) {
      const key = 'hsk1_lesson9_pilot_progress_v1'; data.legacyRaw[key] = text;
      const warnings = [dataWarning({"zh": "第9课原始数据保留供恢复；尚未导入成绩，需要先核验题目和答案格式。", "vi": "Nguồn Bài 9 được giữ nguyên để khôi phục; chưa nhập điểm vì cần xác minh đúng câu hỏi và định dạng đáp án."})];
      return { data: validate(data), warnings, sources: [], reports: sourceReports({ [key]: text }, data, [], warnings) };
    }
    const result = convert(parsed, now);
    if (result.key === practice.KEY) data.practice = result.state as PracticeState;
    else {
      const incoming = result.state as HomeworkState;
      for (const [id, entry] of Object.entries(data.exercises.records)) {
        const latest = entry.submissions.at(-1);
        if (id.startsWith('homework:') && latest?.homeworkAttempts !== undefined &&
            !same(data.homework.questionReviews[id.slice(9)], incoming.questionReviews[id.slice(9)])) latest.homeworkAttempts = 0;
      }
      data.homework = incoming;
    }
    const exerciseBase = structuredClone(data.exercises);
    if (result.key === homework.LEGACY_KEY) {
      const exercises = migrateLegacyExercises(parsed, exerciseCatalogue, data.exercises);
      data.exercises = exercises.state; result.warnings.push(...dataExerciseWarnings(exercises.warnings, exercises.skipped));
      result.warnings.push(dataWarning({ zh: `${exercises.submitted} 题恢复了提交记录，${exercises.drafts} 题保留了草稿。原始成绩只按对应题目的答案规则重新计算。`, vi: `${exercises.submitted} câu khôi phục lần nộp, ${exercises.drafts} câu giữ nháp. Điểm nguồn chỉ được tính lại trong đúng miền đáp án.` }));
    }
    const words = result.key === homework.LEGACY_KEY ? mapWords(parsed, data.practice) : undefined;
    if (words && words.understood) result.warnings.push(dataWarning({ zh: `${words.understood} 个自评复习计划已转至汉字、拼音和词义均一致的词卡。“再复习”安排在10分钟后，这不是考试成绩。`, vi: `${words.understood} lịch ôn tự đánh giá được chuyển sang thẻ có cùng chữ, pinyin và nghĩa. Mức “ôn lại” dùng lịch 10 phút; không phải điểm thi.` }));
    if (words?.unsupported) result.warnings.push(dataWarning({ zh: `${words.unsupported} 个词条的词义尚不匹配或已有新进度：仅保留原始数据，不覆盖。`, vi: `${words.unsupported} mục từ chưa khớp nghĩa hoặc đã có tiến độ mới: chỉ giữ bản gốc, không ghi đè.` }));
    data.legacyRaw[result.key] = text;
    rawSources(data.legacyRaw);
    return { data: validate(data), warnings: result.warnings, sources: [result.key],
      reports: sourceReports({ [result.key]: text }, data, [result.key], result.warnings, words, exerciseBase) };
  }
  function migrate(raw: Record<string, string | null>, now = Date.now(), base?: AppData): MigrationResult {
    let data = blank();
    const warnings: string[] = [], sources: string[] = [];
    // Unknown keys are ignored before validation: shared gates never enter a backup.
    const allowed = Object.fromEntries(LEGACY_KEYS.filter(key => own(raw, key) && raw[key] !== null).map(key => [key, raw[key]]));
    data.legacyRaw = rawSources(allowed);
    function read(key: string, apply: (value: unknown) => void): void {
      if (!own(data.legacyRaw, key)) return;
      try { apply(parse(data.legacyRaw[key]!)); sources.push(key); }
      catch (error) { warnings.push(dataWarning({ zh: `来源 ${key} 无法迁移。原始数据仍保留供恢复，不会替换为空数据。`, vi: `${key}: ${message(error)} Bản gốc vẫn được giữ để khôi phục; không thay bằng dữ liệu trống.` })); }
    }
    read(LEGACY_KEYS[0], value => { data.reading.lessons = reading({ ...data.reading, lessons: value }).lessons; });
    read(LEGACY_KEYS[1], value => { data.reading.mastered = reading({ ...data.reading, mastered: value }).mastered; });
    read(LEGACY_KEYS[2], value => {
      if (!record(value)) fail(dataWarning({"zh": "综合进度无效。", "vi": "Tiến độ chung không hợp lệ."}));
      const relevant = Object.fromEntries(Object.entries(value).filter(([key]) => key.startsWith('hsk1:')));
      data.reading.modules = reading({ ...data.reading, modules: relevant }).modules;
    });
    // A corrupt preferred source stays visible; it never silently falls back to an older version.
    const hkey = [homework.KEY, homework.STEP1_KEY, homework.LEGACY_KEY].find(key => own(data.legacyRaw, key));
    if (hkey) read(hkey, value => {
      const result = convert(value, now);
      if (result.key !== hkey) fail(dataWarning({"zh": "数据中的应用标识与来源键不匹配。", "vi": "Ứng dụng trong dữ liệu không khớp khóa nguồn."}));
      data.homework = result.state as HomeworkState; warnings.push(...result.warnings);
    });
    read(practice.KEY, value => {
      const result = convert(value, now);
      if (result.key !== practice.KEY) fail(dataWarning({"zh": "此来源不是听力与词汇备份。", "vi": "Nguồn không phải bản nghe và từ vựng."}));
      data.practice = result.state as PracticeState; warnings.push(...result.warnings);
    });
    let words: { understood: number; unsupported: number } | undefined;
    if (own(data.legacyRaw, homework.LEGACY_KEY)) {
      try {
        const parsed = parse(data.legacyRaw[homework.LEGACY_KEY]!);
        const exercises = migrateLegacyExercises(parsed, exerciseCatalogue, base?.exercises);
        data.exercises = exercises.state; warnings.push(...dataExerciseWarnings(exercises.warnings, exercises.skipped));
        if (!sources.includes(homework.LEGACY_KEY)) sources.push(homework.LEGACY_KEY);
        warnings.push(dataWarning({ zh: `${exercises.submitted} 题恢复了提交记录，${exercises.drafts} 题保留了草稿。成绩根据已核对的原题重新计算。`, vi: `${exercises.submitted} câu khôi phục lần nộp, ${exercises.drafts} câu giữ nháp. Điểm được tính lại theo câu hỏi gốc đã đối chiếu.` }));
        words = mapWords(parsed, data.practice);
        if (words.understood) warnings.push(dataWarning({ zh: `${words.understood} 个自评复习计划的汉字、拼音和词义均匹配，已转入词汇卡。“再复习”安排在10分钟后。`, vi: `${words.understood} lịch ôn tự đánh giá đã khớp chữ, pinyin và nghĩa; chuyển sang thẻ từ vựng. Mức “ôn lại” dùng lịch 10 phút.` }));
        if (words.unsupported) warnings.push(dataWarning({ zh: `${words.unsupported} 个词条尚未核验或已有新计划：保留原始数据，不覆盖。`, vi: `${words.unsupported} mục từ chưa xác minh hoặc đã có lịch mới: giữ bản gốc, không ghi đè.` }));
      } catch (error) { warnings.push(dataWarning({ zh: `来源 ${homework.LEGACY_KEY} 无法迁移。原始数据保持不变，不恢复未经核验的题目。`, vi: `${homework.LEGACY_KEY}: ${message(error)} Nguồn gốc được giữ nguyên; không khôi phục câu chưa xác minh.` })); }
    }
    read('hsk_recent_lesson_v1', value => {
      if (!record(value)) fail(dataWarning({"zh": "最近阅读的位置无效。", "vi": "Vị trí đọc gần đây không hợp lệ."}));
      if (value.code !== 'hsk1') return;
      if (!lesson(String(value.id)) || !SECTIONS.some(section => section === value.sec)) fail(dataWarning({"zh": "HSK 1 阅读位置无效。", "vi": "Vị trí đọc HSK 1 không hợp lệ."}));
      data.navigation = normalizeRoute({ feature: 'textbook', lesson: Number(value.id), section: value.sec as Section });
    });
    read('ran_hsk1_integrated_nav_v1', value => {
      if (!record(value) || !lesson(String(value.lesson))) fail(dataWarning({"zh": "HSK 1 学习位置无效。", "vi": "Vị trí học HSK 1 không hợp lệ."}));
      const feature = value.mode === 'vocab' ? 'vocabulary' : value.mode;
      if (!FEATURES.some(item => item === feature)) fail(dataWarning({"zh": "不支持此继续学习模块。", "vi": "Phần học tiếp tục không được hỗ trợ."}));
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
    const reports = sourceReports(data.legacyRaw, data, sources, warnings, words, base?.exercises);
    if (base) {
      const current = validate(base), incoming = data;
      // Discovery adds missing identities only. Explicit backup import remains a replacement flow.
      for (const key of ['lessons', 'mastered', 'modules'] as const) {
        Object.assign(current.reading[key], Object.fromEntries(Object.entries(incoming.reading[key]).filter(([id]) => !own(current.reading[key], id))));
      }
      let held = 0;
      for (const [id, groups] of Object.entries(incoming.homework.lessons)) {
        if (own(current.homework.lessons, id)) held++; else current.homework.lessons[id] = groups;
      }
      for (const [id, value] of Object.entries(incoming.practice.listening.records)) {
        if (own(current.practice.listening.records, id)) held++; else current.practice.listening.records[id] = value;
      }
      for (const [id, value] of Object.entries(incoming.practice.cards.schedule)) {
        if (own(current.practice.cards.schedule, id) || current.practice.cards.review) held++;
        else current.practice.cards.schedule[id] = value;
      }
      for (const [id, value] of Object.entries(incoming.exercises.records)) {
        if (own(current.exercises.records, id) || own(current.exercises.drafts, id)) held++;
        else {
          current.exercises.records[id] = value;
          if (incoming.exercises.retrying.includes(id)) current.exercises.retrying.push(id);
          if (own(incoming.exercises.drafts, id)) current.exercises.drafts[id] = incoming.exercises.drafts[id]!;
        }
      }
      for (const [id, value] of Object.entries(incoming.exercises.drafts)) {
        if (!own(current.exercises.records, id) && !own(current.exercises.drafts, id)) current.exercises.drafts[id] = value;
      }
      // Existing positions, settings and active queues are authoritative, including unfinished drafts.
      current.legacyRaw = { ...current.legacyRaw, ...incoming.legacyRaw };
      data = current;
      warnings.push(dataWarning({"zh": "仅补充缺失的课次、题目或义项。优先保留新应用的进度、草稿、学员资料、偏好与正在进行的学习。", "vi": "Chỉ bổ sung bài / câu / nghĩa còn thiếu. Tiến độ, nháp, hồ sơ, tùy chọn và lượt đang mở của ứng dụng mới được ưu tiên giữ nguyên."}));
      if (held) warnings.push(dataWarning({ zh: `${held} 条旧记录与当前范围重叠或影响正在进行的学习，仅保留在原始来源中，不覆盖新进度。`, vi: `${held} bản ghi cũ trùng phạm vi hoặc ảnh hưởng lượt đang mở chỉ được giữ trong nguồn; không ghi đè tiến độ mới.` }));
      warnings.push(dataWarning({"zh": "若旧来源已改变，将保留该来源的新副本；确认前的完整当前数据仍可从恢复副本中找回。", "vi": "Nếu nguồn cũ đã thay đổi, bản sao nguồn mới được giữ trong dữ liệu; toàn bộ bản hiện tại vẫn nằm trong bản khôi phục trước khi xác nhận."}));
    }
    return { data: validate(data), warnings: [...new Set(warnings)], sources, reports };
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
      exerciseSubmitted: Object.keys(data.exercises.records).length,
      exerciseDrafts: Object.keys(data.exercises.drafts).length,
    };
  }
  const dataExerciseEntries = (state: ExercisesState) => Object.keys(state.records).length + Object.keys(state.drafts).length + Object.keys(state.positions).length;
  function reset(input: AppData, scope: ResetScope): ResetResult {
    const result = resetProgress(validate(input), scope, catalog as Parameters<typeof resetProgress>[2]);
    if (scope.module === 'all' || scope.module === 'exercises') {
      const before = dataExerciseEntries(result.data.exercises);
      result.data.exercises = resetExercises(result.data.exercises, exerciseCatalogue, scope.lesson ?? undefined);
      result.removed += before - dataExerciseEntries(result.data.exercises);
    }
    return { ...result, data: validate(result.data) };
  }
  return { blank, validate, migrate, importLegacy, summary, reset };
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
