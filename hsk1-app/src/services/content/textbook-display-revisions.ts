import type { BookLesson } from './textbook.ts';

type Row = Record<string, unknown>;
interface Target { readonly lesson: number; readonly value: Row; readonly fields: readonly string[] }
export interface TextbookDisplayRevisionInfo {
  readonly revision: string;
  readonly sources: readonly { readonly id: string; readonly title: string; readonly sha256: string }[];
  readonly changes: readonly {
    readonly target: string; readonly lesson: number; readonly field: string;
    readonly expected: unknown; readonly value: unknown; readonly reason: string;
    readonly source: { readonly id: string; readonly printedPages: readonly number[]; readonly pdfPages: readonly number[] };
  }[];
}
const row = (value: unknown): value is Row => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const keys = (value: Row, names: readonly string[]) => Object.keys(value).every(key => names.includes(key));
const pages = (value: unknown): value is number[] => Array.isArray(value) && value.length > 0 &&
  value.every(page => Number.isInteger(page) && page > 0) && new Set(value).size === value.length;
const examples = (value: unknown): boolean => Array.isArray(value) && value.length > 0 && value.every(example =>
  row(example) && keys(example, ['zh', 'py', 'vn']) && ['zh', 'py', 'vn'].every(key => text(example[key])));
function failure(): never { throw new Error('Bản sửa hiển thị giáo trình không khớp nguồn đã xác nhận.'); }

/** Apply approved copy corrections only after the frozen book and media identities have been validated.
 * IDs, fingerprints, catalog bindings and historical assessment banks remain the source identities.
 * `expected` always refers to the frozen value, so stale or duplicate corrections fail the entire load.
 */
export function reviseTextbookDisplay(lessons: readonly BookLesson[], value: unknown, baseline: string): {
  readonly lessons: readonly BookLesson[]; readonly info: TextbookDisplayRevisionInfo;
} {
  if (!row(value) || !keys(value, ['schemaVersion', 'baseline', 'revision', 'sources', 'changes']) || value.schemaVersion !== 1 ||
      value.baseline !== baseline || !text(value.revision) || !Array.isArray(value.sources) || !value.sources.length ||
      !Array.isArray(value.changes) || !value.changes.length) failure();
  const sources = new Set<string>();
  for (const source of value.sources) {
    if (!row(source) || !keys(source, ['id', 'title', 'sha256']) || !text(source.id) || !text(source.title) ||
        typeof source.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(source.sha256) || sources.has(source.id)) failure();
    sources.add(source.id);
  }
  const copy = structuredClone(lessons);
  const targets = new Map<string, Target>();
  const register = (lesson: number, id: string, item: unknown, fields: readonly string[]) => {
    if (targets.has(id) || !row(item)) failure();
    targets.set(id, { lesson, value: item, fields });
  };
  for (const lesson of copy) {
    register(lesson.id, `textbook-l${String(lesson.id).padStart(2, '0')}-title`, lesson, ['title', 'title_py', 'vn_title']);
    for (const word of lesson.vocab) register(lesson.id, word.id, word, ['zh', 'py', 'vn', 'pos', 'posLabel']);
    for (const scene of lesson.scenes) {
      register(lesson.id, scene.id, scene, ['place', 'place_vn']);
      for (const line of scene.lines) register(lesson.id, line.id, line, ['s', 'zh', 'py', 'vn']);
    }
    for (const item of [...lesson.grammar, ...lesson.phonetics]) {
      register(lesson.id, item.id, item, ['title', 'vn_title', 'structure', 'desc', 'examples']);
    }
    for (const tip of lesson.xiaoyuTips) register(lesson.id, tip.id, tip, ['zh', 'vn']);
  }
  const touched = new Set<string>();
  for (const change of value.changes) {
    if (!row(change) || !keys(change, ['target', 'lesson', 'field', 'expected', 'value', 'reason', 'source']) ||
        !text(change.target) || !Number.isInteger(change.lesson) || !text(change.field) || !text(change.reason) ||
        !row(change.source) || !keys(change.source, ['id', 'printedPages', 'pdfPages']) || !text(change.source.id) ||
        !sources.has(change.source.id) || !pages(change.source.printedPages) || !pages(change.source.pdfPages) ||
        change.source.printedPages.length !== change.source.pdfPages.length) failure();
    const target = targets.get(change.target);
    const identity = `${change.target}:${change.field}`;
    if (!target || target.lesson !== change.lesson || !target.fields.includes(change.field) || touched.has(identity) ||
        JSON.stringify(target.value[change.field]) !== JSON.stringify(change.expected) ||
        JSON.stringify(change.expected) === JSON.stringify(change.value) ||
        (change.field === 'examples' ? !examples(change.value) : !text(change.value))) failure();
    touched.add(identity);
    target.value[change.field] = structuredClone(change.value);
  }
  return { lessons: copy, info: structuredClone({ revision: value.revision, sources: value.sources, changes: value.changes }) as TextbookDisplayRevisionInfo };
}
