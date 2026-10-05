import configuredRegistry from '../../../content/official-vi-registry.json' with { type: 'json' };
import { reviseTextbookDisplay } from './textbook-display-revisions.ts';
import type { BookLesson } from './textbook.ts';

type Row = Record<string, unknown>;
export interface ViFieldRef { baselineFile: string; field: string; ownerId: string; component: string }
export interface ViField extends ViFieldRef { lesson: number; relativeField: string; effectiveValue: string; zhContext: string; originalOptions?: readonly string[] }
export interface ViDisplayField { ownerId: string; component: string; field: string; value: string }
export interface ViDisplaySnapshot { revisionId: string; fields: ViDisplayField[] }
export interface OfficialViRegistry {
  readonly revisionId: string | null;
  project<T>(raw: T, ownerId: string, component: string): T;
  snapshot(owners: readonly { id: string; component: string }[]): ViDisplaySnapshot | null;
  displayVersion(ownerId: string, component: string, originalVersion: string): string;
}
const row = (v: unknown): v is Row => v !== null && typeof v === 'object' && !Array.isArray(v) && [Object.prototype, null].includes(Object.getPrototypeOf(v));
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 8192;
const hash = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const exact = (v: Row, keys: readonly string[]) => { if (Object.keys(v).some(k => !keys.includes(k))) fail('Unknown VI revision field.'); };
function fail(message: string): never { throw new Error(message); }
export function viCanonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(viCanonical).join(',')}]`;
  if (row(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${viCanonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export async function viSHA256(value: Uint8Array | string): Promise<string> {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
export function viProposal(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(viProposal);
  if (row(value)) return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'independentReview').map(([key, child]) => [key, viProposal(child)]));
  return value;
}
const refKey = (r: ViFieldRef) => viCanonical([r.baselineFile, r.field, r.ownerId, r.component]);
const equalSet = (a: readonly unknown[], b: readonly unknown[]) => a.length === b.length && new Set(a.map(viCanonical)).size === a.length && [...a.map(viCanonical)].sort().join('\n') === [...b.map(viCanonical)].sort().join('\n');
export function viPointer(pointer: string): string[] {
  if (!pointer.startsWith('/') || /~(?![01])/u.test(pointer)) fail('Invalid VI pointer.');
  const parts = pointer.slice(1).split('/').map(p => p.replaceAll('~1', '/').replaceAll('~0', '~'));
  if (parts.some(p => ['__proto__', 'prototype', 'constructor'].includes(p) || p === '')) fail('Unsafe VI pointer.');
  return parts;
}
export function isViDisplayField(component: string, pointer: string): boolean {
  const parts = viPointer(pointer), last = parts.at(-1)!;
  const sealed = ['id', 'senseId', 'catalogId', 'fingerprint', 'questionFingerprint', 'answer', 'answers', 'tokens', 'tokenOrder', 'optionOrder', 'assessment', 'audio', 'audioTrack', 'audioRange', 'source', 'sourceSHA', 'zh', 'py', 'pos', 'sourceRecords'];
  if (parts.some(p => sealed.includes(p))) return false;
  if (component === 'source-activity') return /^\/(?:title|instruction|prompt|example)\/vi$/.test(pointer) ||
    /^\/fields\/(?:0|[1-9][0-9]*)\/(?:label|reference|feedbackNote)\/vi$/.test(pointer) ||
    /^\/fields\/(?:0|[1-9][0-9]*)\/options\/(?:0|[1-9][0-9]*)\/vi$/.test(pointer) ||
    /^\/table\/(?:caption|columns\/(?:0|[1-9][0-9]*))\/vi$/.test(pointer) ||
    /^\/table\/rows\/(?:0|[1-9][0-9]*)\/cells\/(?:0|[1-9][0-9]*)\/text\/vi$/.test(pointer);
  if (component === 'source-figure') return /^\/(?:alt|note)\/vi$/.test(pointer);
  if (component === 'source-numbers') return /^\/(?:grid\/(?:0|[1-9][0-9]*)\/(?:0|[1-9][0-9]*)|(?:higher|two)\/(?:0|[1-9][0-9]*))\/vi$/.test(pointer);
  if (component === 'source-bonus') return pointer === '/title/vi';
  if (component === 'textbook') return ['vn', 'vn_title', 'place_vn', 'desc'].includes(last);
  if (component === 'course-index') return parts.length === 1 && last === 'titleVi';
  if (component === 'vocabulary') return parts.length === 1 && last === 'vi';
  if (!['homework', 'homework30', 'listening'].includes(component)) return false;
  return parts.length === 1 && ['prompt', 'promptVi', 'meaning', 'explanation', 'explanationVi'].includes(last) ||
    parts.length === 2 && ['options', 'optionFeedback'].includes(parts[0]!) && /^(0|[1-9][0-9]*)$/.test(last) ||
    parts.length === 3 && ['transcript', 'keywords'].includes(parts[0]!) && /^(0|[1-9][0-9]*)$/.test(parts[1]!) && last === 'vi';
}
export function uniqueViOptions(options: readonly string[]): boolean {
  const labels = options.map(text => text.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('vi').replace(/[.!?。！？…]+$/u, ''));
  return new Set(labels).size === labels.length;
}
export function applyViSnapshot<T>(raw: T, ownerId: string, component: string, snapshot: ViDisplaySnapshot | null): T {
  const changes = snapshot?.fields.filter(f => f.ownerId === ownerId && f.component === component) ?? [];
  if (!changes.length) return raw;
  const display = structuredClone(raw);
  for (const change of changes) {
    const parts = viPointer(change.field); let parent: unknown = display;
    for (const part of parts.slice(0, -1)) { if (!parent || typeof parent !== 'object' || !Object.hasOwn(parent, part)) fail('VI display owner drift.'); parent = (parent as Row)[part]; }
    const key = parts.at(-1)!;
    if (!parent || typeof parent !== 'object' || !Object.hasOwn(parent, key) || typeof (parent as Row)[key] !== 'string') fail('VI display field drift.');
    (parent as Row)[key] = change.value;
  }
  return display;
}
const inactive: OfficialViRegistry = Object.freeze({ revisionId: null, project: <T>(raw: T) => raw, snapshot: () => null, displayVersion: (_owner: string, _component: string, original: string) => original });
interface ActiveViEntry { manifestFile: string; manifestSHA256: string; reviewFile: string; reviewSHA256: string }
export function validateOfficialViConfig(value: unknown): { schemaVersion: 1; active: ActiveViEntry | null } {
  if (!row(value)) fail('VI active registry schema.');
  exact(value, ['schemaVersion', 'active']);
  if (value.schemaVersion !== 1 || !Object.hasOwn(value, 'active')) fail('VI active registry schema.');
  if (value.active === null) return { schemaVersion: 1, active: null };
  const entry = value.active;
  if (!row(entry)) fail('VI active entry missing.');
  exact(entry, ['manifestFile', 'manifestSHA256', 'reviewFile', 'reviewSHA256']);
  if (!text(entry.manifestFile) || !text(entry.reviewFile) || !hash(entry.manifestSHA256) || !hash(entry.reviewSHA256)) fail('VI active entry invalid.');
  return { schemaVersion: 1, active: entry as unknown as ActiveViEntry };
}
/** The checked-in registry is deliberately inactive until book evidence is independently accepted. */
export function defaultOfficialViRegistry(): OfficialViRegistry {
  const config = validateOfficialViConfig(configuredRegistry);
  if (config.active === null) return inactive;
  if (!loadedRegistry) fail('Active VI registry has not been verified.');
  return loadedRegistry;
}
let loadedRegistry: OfficialViRegistry | undefined;
export interface ViRegistryInputs {
  manifestBytes: string; manifestSHA256: string; reviewBytes: string; reviewSHA256: string;
  reviewFile?: string;
  baselineFiles: readonly { file: string; sha256: string }[];
  parentDisplayRevision: string; fields: readonly ViField[];
}
/** Every byte/proof/owner is verified before a display object can be projected. */
export async function createOfficialViRegistry(input: ViRegistryInputs): Promise<OfficialViRegistry> {
  if (!hash(input.manifestSHA256) || !hash(input.reviewSHA256) || await viSHA256(input.manifestBytes) !== input.manifestSHA256 || await viSHA256(input.reviewBytes) !== input.reviewSHA256) fail('VI artifact byte hash mismatch.');
  const manifest: unknown = JSON.parse(input.manifestBytes), proof: unknown = JSON.parse(input.reviewBytes);
  if (!row(manifest) || !row(proof)) fail('VI registry format.');
  exact(manifest, ['schemaVersion', 'revisionId', 'engine', 'courseId', 'baselineFiles', 'parentDisplayRevision', 'sources', 'changes', 'independentReview', 'coverage']);
  exact(proof, ['reviewer', 'author', 'status', 'proposalSHA256', 'acceptedChangeIds', 'acceptedConsumerRefs', 'sourceEvidenceRefs']);
  if (manifest.schemaVersion !== 1 || manifest.engine !== 'hsk1' || manifest.courseId !== 'hsk1' || !text(manifest.revisionId) || manifest.revisionId.length > 256 || manifest.parentDisplayRevision !== input.parentDisplayRevision || !Array.isArray(manifest.baselineFiles) || !equalSet(manifest.baselineFiles, input.baselineFiles) || !Array.isArray(manifest.changes) || !manifest.changes.length || manifest.changes.length > 10000 || !Array.isArray(manifest.sources) || !manifest.sources.length || !row(manifest.coverage)) fail('VI registry identity/baseline mismatch.');
  if (!text(proof.reviewer) || !text(proof.author) || proof.reviewer === proof.author || proof.status !== 'accepted' || !hash(proof.proposalSHA256) || await viSHA256(viCanonical(viProposal(manifest))) !== proof.proposalSHA256 || !Array.isArray(proof.acceptedChangeIds) || !Array.isArray(proof.acceptedConsumerRefs) || !Array.isArray(proof.sourceEvidenceRefs)) fail('VI independent proof mismatch.');
  const review = manifest.independentReview;
  if (!row(review) || review.reviewer !== proof.reviewer || review.status !== 'accepted' || review.proposalSHA256 !== proof.proposalSHA256 || review.evidenceSHA256 !== input.reviewSHA256 || !text(review.evidenceFile) || input.reviewFile !== undefined && review.evidenceFile !== input.reviewFile || !Array.isArray(review.acceptedChangeIds) || !equalSet(review.acceptedChangeIds, proof.acceptedChangeIds)) fail('VI manifest/proof binding mismatch.');
  const fields = new Map(input.fields.map(f => [refKey(f), f]));
  if (fields.size !== input.fields.length) fail('Duplicate registered VI consumer.');
  if (input.fields.some(f => !isViDisplayField(f.component, f.relativeField))) fail('Sealed/non-VI registered field.');
  const sources = new Map<string, Row>();
  for (const value of manifest.sources) {
    if (!row(value) || !text(value.sourceId) || sources.has(value.sourceId) || !hash(value.pdfSHA256) || !Number.isSafeInteger(value.pdfPageCount) || Number(value.pdfPageCount) < 1) fail('VI document source mismatch.');
    sources.set(value.sourceId, value);
  }
  // Canonicalize each evidence anchor once. Repeatedly scanning the complete
  // proof for every field makes a full-course registry block lesson startup.
  const evidenceAnchors = new Set(proof.sourceEvidenceRefs.map(viCanonical));
  const ids: string[] = [], consumers: ViFieldRef[] = [], snapshots: ViDisplayField[] = [], seen = new Set<string>();
  for (const change of manifest.changes) {
    if (!row(change) || !text(change.changeId) || ids.includes(change.changeId) || !text(change.baselineFile) || !text(change.field) || !text(change.ownerId) || !text(change.component) || !text(change.newValue) || !text(change.expectedEffectiveValue) || !Number.isSafeInteger(change.lesson) || !Array.isArray(change.consumers) || !change.consumers.length || !row(change.authorReview) || !text(change.authorReview.reviewer) || change.authorReview.reviewer !== proof.author || change.authorReview.status !== 'accepted' || !row(change.independentReview) || change.independentReview.reviewer !== proof.reviewer || change.independentReview.status !== 'accepted' || change.independentReview.evidenceRef !== review.evidenceFile) fail('VI change review mismatch.');
    if (!['official-wording-variant', 'meaning-error', 'official-book-erratum', 'editorial-no-direct-book-counterpart'].includes(String(change.classification))) fail('Inactive VI classification.');
    const ref = { baselineFile: change.baselineFile, field: change.field, ownerId: change.ownerId, component: change.component };
    const registered = fields.get(refKey(ref));
    if (!registered || registered.lesson !== change.lesson || registered.effectiveValue !== change.expectedEffectiveValue || seen.has(refKey(ref))) fail('Foreign/stale/duplicate VI field.');
    viPointer(change.field); viPointer(registered.relativeField);
    seen.add(refKey(ref)); ids.push(change.changeId);
    const anchor = change.sourceAnchor;
    if (!row(anchor) || !text(anchor.sourceId) || !evidenceAnchors.has(viCanonical(anchor)) || anchor.zhContext !== registered.zhContext) fail('VI source occurrence/Chinese context mismatch.');
    if (anchor.kind === 'directOfficial' || anchor.kind === 'terminologyDerived') {
      const source = sources.get(String(anchor.documentSourceId));
      if (!source || anchor.pdfSHA256 !== source.pdfSHA256 || !Array.isArray(anchor.pdfPages) || !anchor.pdfPages.length || new Set(anchor.pdfPages).size !== anchor.pdfPages.length || anchor.pdfPages.some(p => !Number.isSafeInteger(p) || p < 1 || p > Number(source.pdfPageCount)) || !Array.isArray(anchor.printedPages) || anchor.printedPages.length !== anchor.pdfPages.length || !anchor.printedPages.every(p => typeof p === 'string' && p.trim() || Number.isSafeInteger(p) && Number(p) > 0) || !text(anchor.section)) fail('VI official source page mismatch.');
      if (anchor.kind === 'directOfficial' && (!text(anchor.officialViText) || anchor.officialViText !== change.newValue)) fail('VI official text mismatch.');
      if (anchor.kind === 'terminologyDerived' && (anchor.verbatim === true || !text(anchor.rationale))) fail('VI terminology inference missing.');
    } else if (anchor.kind !== 'editorial' || anchor.directCounterpart !== false || !text(anchor.rationale) || change.classification !== 'editorial-no-direct-book-counterpart') fail('VI unresolved/editorial source mismatch.');
    for (const c of change.consumers) {
      if (!row(c) || !text(c.baselineFile) || !text(c.field) || !text(c.ownerId) || !text(c.component)) fail('VI consumer shape.');
      exact(c, ['baselineFile', 'field', 'ownerId', 'component']);
      const r = c as unknown as ViFieldRef;
      if (!fields.has(refKey(r)) || refKey(r) !== refKey(ref)) fail('Foreign VI consumer binding.');
      consumers.push(r);
    }
    if (change.consumers.length !== 1) fail('Duplicate VI consumer binding.');
    snapshots.push({ ownerId: registered.ownerId, component: registered.component, field: registered.relativeField, value: change.newValue });
  }
  if (!equalSet(ids, proof.acceptedChangeIds) || !equalSet(consumers, proof.acceptedConsumerRefs)) fail('VI complete independent acceptance mismatch.');
  const optionOwners = new Set(snapshots.filter(s => s.field.startsWith('/options/')).map(s => viCanonical([s.ownerId, s.component])));
  for (const key of optionOwners) {
    const registered = input.fields.filter(f => viCanonical([f.ownerId, f.component]) === key && f.relativeField.startsWith('/options/'));
    const source = registered[0]?.originalOptions;
    if (!source || !source.length || !source.every(text) || registered.some(f => !f.originalOptions || viCanonical(f.originalOptions) !== viCanonical(source) || source[Number(viPointer(f.relativeField)[1])] !== f.effectiveValue || /[\p{Script=Han}]/u.test(f.effectiveValue))) fail('VI original option binding missing.');
    const options = [...source];
    for (const change of snapshots.filter(s => viCanonical([s.ownerId, s.component]) === key && s.field.startsWith('/options/'))) options[Number(viPointer(change.field)[1])] = change.value;
    if (!uniqueViOptions(options)) fail('VI option labels are ambiguous.');
  }
  const sourceOptionGroups = new Set(snapshots.filter(s => s.component === 'source-activity' && /^\/fields\/[0-9]+\/options\/[0-9]+\/vi$/.test(s.field))
    .map(s => viCanonical([s.ownerId, s.field.split('/').slice(0, 4).join('/')])));
  for (const key of sourceOptionGroups) {
    const [ownerId, prefix] = JSON.parse(key) as [string, string];
    const registered = input.fields.filter(f => f.component === 'source-activity' && f.ownerId === ownerId && f.relativeField.startsWith(prefix + '/'));
    const original = registered[0]?.originalOptions;
    if (!original || !original.length || !original.every(text) || registered.length !== original.length || registered.some(f => !f.originalOptions || viCanonical(f.originalOptions) !== viCanonical(original) || original[Number(viPointer(f.relativeField)[3])] !== f.effectiveValue)) fail('VI source option binding missing.');
    const options = [...original];
    for (const change of snapshots.filter(s => s.component === 'source-activity' && s.ownerId === ownerId && s.field.startsWith(prefix + '/'))) options[Number(viPointer(change.field)[3])] = change.value;
    if (!uniqueViOptions(options)) fail('VI source option labels are ambiguous.');
  }
  const revisionId = manifest.revisionId;
  const snapshot = Object.freeze({ revisionId, fields: snapshots.map(s => Object.freeze(s)) });
  // Activity receipts keep their exact presented context. Derive a new version
  // from this owner's accepted display fields rather than overwrite old records.
  const versionHashes = new Map<string, string>();
  for (const ownerId of new Set(snapshots.filter(s => s.component === 'source-activity').map(s => s.ownerId))) {
    const fields = snapshots.filter(s => s.ownerId === ownerId && s.component === 'source-activity').sort((a, b) => a.field.localeCompare(b.field));
    versionHashes.set(ownerId, await viSHA256(viCanonical(fields)));
  }
  return Object.freeze({ revisionId,
    project: <T>(raw: T, ownerId: string, component: string) => applyViSnapshot(raw, ownerId, component, snapshot as ViDisplaySnapshot),
    snapshot: (owners: readonly { id: string; component: string }[]) => {
      const fields = snapshots.filter(s => owners.some(o => o.id === s.ownerId && o.component === s.component));
      return fields.length ? structuredClone({ revisionId, fields }) : null;
    },
    displayVersion: (ownerId: string, component: string, originalVersion: string) => {
      const digest = component === 'source-activity' ? versionHashes.get(ownerId) : undefined;
      if (!digest) return originalVersion;
      const version = `${originalVersion}-vi-${digest}`;
      if (version.length > 180 || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(version)) fail('VI activity version is invalid.');
      return version;
    },
  });
}

const escapePointer = (s: string) => s.replaceAll('~', '~0').replaceAll('/', '~1');
export const hsk1SourceViFiles = Array.from({ length: 15 }, (_, i) => `content/source-activities/lesson-${String(i + 1).padStart(2, '0')}${i === 3 ? '-current' : ''}.json`);
/** Actual semantic owners and original array positions, derived from the bundled source objects. */
export function hsk1ViFields(values: Readonly<Record<string, unknown>>): ViField[] {
  const fields: ViField[] = [];
  const add = (object: unknown, baselineFile: string, base: string, ownerId: string, component: string, lesson: number, names: readonly string[], zhContext: string) => {
    if (!row(object)) fail('VI source owner missing.');
    for (const name of names) if (typeof object[name] === 'string') fields.push({ baselineFile, field: `${base}/${escapePointer(name)}`, ownerId, component, lesson, relativeField: `/${escapePointer(name)}`, effectiveValue: object[name] as string, zhContext });
  };
  const bookFile = 'content/textbook.json', revisionFile = 'content/textbook-display-revisions.json', original = values[bookFile], revisions = values[revisionFile];
  if (!row(original) || !Array.isArray(original.lessons) || !row(revisions)) fail('VI book baseline missing.');
  const effective = reviseTextbookDisplay(original.lessons as unknown as BookLesson[], revisions, String(original.baseline)).lessons;
  // A prior display correction is itself an explicit source leaf. Never pretend an added example exists in the frozen book.
  const correction = (id: string, name: string) => Array.isArray(revisions.changes) ? revisions.changes.findIndex(c => row(c) && c.target === id && c.field === name) : -1;
  const addBook = (raw: Row, shown: Row, base: string, ownerId: string, lesson: number, names: readonly string[], zh: string) => {
    for (const name of names) {
      const changeIndex = correction(ownerId, name);
      add(shown, changeIndex < 0 ? bookFile : revisionFile, changeIndex < 0 ? base : `/changes/${changeIndex}`, ownerId, 'textbook', lesson, [name], zh);
      if (changeIndex >= 0) fields.at(-1)!.field = `/changes/${changeIndex}/value`;
      if (typeof raw[name] !== 'string' && changeIndex < 0) fail('VI effective leaf has no actual baseline.');
    }
  };
  for (const [li, lesson] of effective.entries()) {
    const source = original.lessons[li]; if (!row(source) || source.id !== lesson.id) fail('VI book lesson order drift.');
    addBook(source, lesson as unknown as Row, `/lessons/${li}`, `textbook-l${String(lesson.id).padStart(2, '0')}-title`, lesson.id, ['vn_title'], lesson.title);
    for (const collection of ['vocab', 'scenes', 'grammar', 'phonetics', 'xiaoyuTips'] as const) for (const [oi, item] of lesson[collection].entries()) {
      const sourceItems = source[collection]; const raw = Array.isArray(sourceItems) ? sourceItems[oi] : undefined;
      if (!row(raw) || raw.id !== item.id) fail('VI book stable owner drift.');
      const shown = item as unknown as Row, base = `/lessons/${li}/${collection}/${oi}`;
      const names = collection === 'scenes' ? ['place_vn'] : ['grammar', 'phonetics'].includes(collection) ? ['vn_title', 'desc'] : ['vn'];
      addBook(raw, shown, base, item.id, lesson.id, names, String(shown.zh ?? shown.title ?? shown.place ?? ''));
      if (collection === 'scenes' && 'lines' in item) for (const [i, line] of item.lines.entries()) {
        const rawLines = raw.lines; const rawLine = Array.isArray(rawLines) ? rawLines[i] : undefined;
        if (!row(rawLine) || rawLine.id !== line.id) fail('VI line stable identity drift.');
        addBook(rawLine, line as unknown as Row, `${base}/lines/${i}`, line.id, lesson.id, ['vn'], line.zh);
      }
      if ((collection === 'grammar' || collection === 'phonetics') && 'examples' in item) for (const [i, example] of item.examples.entries()) {
        const ci = correction(item.id, 'examples');
        if (ci >= 0) add(example, revisionFile, `/changes/${ci}/value/${i}`, `${item.id}:example:${i + 1}`, 'textbook', lesson.id, ['vn'], example.zh);
        else add(example, bookFile, `${base}/examples/${i}`, `${item.id}:example:${i + 1}`, 'textbook', lesson.id, ['vn'], example.zh);
      }
    }
  }
  const index = values['content/course-index.json'];
  if (row(index) && Array.isArray(index.lessons)) index.lessons.forEach((lesson, i) => { if (!row(lesson)) fail('VI index owner missing.'); add(lesson, 'content/course-index.json', `/lessons/${i}`, `course-index-l${String(lesson.id).padStart(2, '0')}`, 'course-index', Number(lesson.id), ['titleVi'], String(lesson.title)); });
  for (const [baselineFile, component, collection] of [['content/stage3-catalog.json', 'listening', 'listening'], ['content/stage3-catalog.json', 'vocabulary', 'vocabulary']] as const) {
    const value = values[baselineFile]; if (!row(value) || !Array.isArray(value[collection])) fail('VI catalog source missing.');
    value[collection].forEach((question, i) => {
      if (!row(question) || typeof question.id !== 'string') fail('VI catalog owner missing.');
      const base = `/${collection}/${i}`, zh = String(question.zh ?? (Array.isArray(question.transcript) ? question.transcript.map(l => row(l) ? l.zh : '').join('') : ''));
      add(question, baselineFile, base, question.id, component, Number(question.lesson), component === 'vocabulary' ? ['vi'] : ['promptVi', 'explanationVi'], zh);
      if (component === 'listening') questionLeaves(question, baselineFile, base, question.id, component, Number(question.lesson), zh);
    });
  }
  for (const [baselineFile, component] of [['content/stage2-bank.json', 'homework'], ['content/homework30-bank.json', 'homework30']] as const) {
    const value = values[baselineFile]; if (!row(value) || !Array.isArray(value.lessons)) fail('VI homework source missing.');
    value.lessons.forEach((lesson, li) => {
      if (!row(lesson)) fail('VI homework lesson missing.');
      for (const part of ['choice', 'sort', 'translation', 'translationChoice', 'listening']) if (Array.isArray(lesson[part])) (lesson[part] as unknown[]).forEach((question, qi) => {
        if (!row(question) || typeof question.id !== 'string') fail('VI homework owner missing.');
        const base = `/lessons/${li}/${part}/${qi}`, zh = String(question.stem ?? '');
        add(question, baselineFile, base, question.id, component, Number(lesson.lesson), ['prompt', 'meaning', 'explanation'], zh);
        questionLeaves(question, baselineFile, base, question.id, component, Number(lesson.lesson), zh);
      });
    });
  }
  function questionLeaves(q: Row, file: string, base: string, ownerId: string, component: string, lesson: number, zhContext: string) {
    for (const array of ['options', 'optionFeedback']) if (Array.isArray(q[array])) (q[array] as unknown[]).forEach((value, i) => {
      // Frozen Chinese answer options remain Chinese; only named Vietnamese feedback or non-Chinese labels are eligible.
      if (typeof value === 'string' && (array !== 'options' || !/[\p{Script=Han}]/u.test(value))) fields.push({ baselineFile: file, field: `${base}/${array}/${i}`, ownerId, component, lesson, relativeField: `/${array}/${i}`, effectiveValue: value, zhContext, ...(array === 'options' ? { originalOptions: q.options as string[] } : {}) });
    });
    for (const array of ['transcript', 'keywords']) if (Array.isArray(q[array])) (q[array] as unknown[]).forEach((line, i) => { if (row(line) && typeof line.vi === 'string') fields.push({ baselineFile: file, field: `${base}/${array}/${i}/vi`, ownerId, component, lesson, relativeField: `/${array}/${i}/vi`, effectiveValue: line.vi, zhContext: String(line.zh ?? zhContext) }); });
  }
  for (const baselineFile of hsk1SourceViFiles) {
    const source = values[baselineFile];
    // Older six-file revision manifests remain valid. A new source sidecar
    // becomes eligible only when its actual bundled bytes are supplied.
    if (source === undefined) continue;
    if (!row(source) || !Number.isSafeInteger(source.lesson) || !Array.isArray(source.activities) || !Array.isArray(source.figures)) fail('VI activity catalogue missing.');
    const lesson = Number(source.lesson);
    source.activities.forEach((activity, i) => {
      if (!row(activity) || !text(activity.id) || activity.lesson !== lesson) fail('VI activity owner missing.');
      sourceLeaves(activity, baselineFile, `/activities/${i}`, activity.id, 'source-activity', lesson, '');
      for (const field of fields.filter(f => f.component === 'source-activity' && f.ownerId === activity.id && /^\/fields\/[0-9]+\/options\/[0-9]+\/vi$/.test(f.relativeField))) {
        const activityFields = activity.fields;
        const owner = Array.isArray(activityFields) ? activityFields[Number(viPointer(field.relativeField)[1])] : undefined;
        if (!row(owner) || !Array.isArray(owner.options) || owner.options.some(option => !row(option) || typeof option.vi !== 'string')) fail('VI source option catalogue missing.');
        field.originalOptions = owner.options.map(option => (option as Row).vi as string);
      }
    });
    source.figures.forEach((figure, i) => {
      if (!row(figure) || !text(figure.id)) fail('VI figure owner missing.');
      sourceLeaves(figure, baselineFile, `/figures/${i}`, figure.id, 'source-figure', lesson, '');
    });
    if (source.numberTables !== undefined) sourceLeaves(source.numberTables, baselineFile, '/numberTables', `source-l${String(lesson).padStart(2, '0')}-numbers`, 'source-numbers', lesson, '');
    if (source.bonus !== undefined) {
      if (!row(source.bonus) || !text(source.bonus.id)) fail('VI bonus owner missing.');
      sourceLeaves(source.bonus, baselineFile, '/bonus', source.bonus.id, 'source-bonus', lesson, '');
    }
  }
  function sourceLeaves(value: unknown, file: string, base: string, ownerId: string, component: string, lesson: number, fallback: string, relative = '') {
    if (Array.isArray(value)) { value.forEach((v, i) => sourceLeaves(v, file, `${base}/${i}`, ownerId, component, lesson, fallback, `${relative}/${i}`)); return; }
    if (!row(value)) return;
    const zh = typeof value.zh === 'string' ? value.zh : fallback;
    for (const [key, child] of Object.entries(value)) {
      const field = `${relative}/${escapePointer(key)}`;
      if (key === 'vi' && typeof child === 'string' && isViDisplayField(component, field)) fields.push({ baselineFile: file, field: `${base}/vi`, ownerId, component, lesson, relativeField: field, effectiveValue: child, zhContext: zh });
      else if (key !== 'vi') sourceLeaves(child, file, `${base}/${escapePointer(key)}`, ownerId, component, lesson, zh, field);
    }
  }
  return fields;
}
/** Fixed build-registered raw modules only; a manifest path never becomes an arbitrary fetch. */
export async function loadOfficialViRegistry(signal?: AbortSignal): Promise<OfficialViRegistry> {
  signal?.throwIfAborted();
  const config = validateOfficialViConfig(configuredRegistry);
  if (config.active === null) return inactive;
  if (loadedRegistry) return loadedRegistry;
  const entry = config.active;
  const registered = import.meta.glob('../../../content/official-vi-revisions/*.json', { query: '?raw', import: 'default' });
  const readRegistered = async (file: string) => {
    const load = registered[`../../../${file}`]; if (!load) fail('VI artifact is not registered in this build.');
    const bytes = await load(); if (typeof bytes !== 'string') fail('VI registered artifact bytes missing.'); return bytes;
  };
  const [manifestBytes, reviewBytes] = await Promise.all([readRegistered(entry.manifestFile), readRegistered(entry.reviewFile)]);
  const rawSources = import.meta.glob(['../../../content/*.json', '../../../content/source-activities/*.json'], { query: '?raw', import: 'default' });
  const values: Record<string, unknown> = {}, bytes: Record<string, string> = {};
  for (const file of ['textbook', 'textbook-display-revisions', 'stage2-bank', 'stage3-catalog', 'homework30-bank', 'course-index']) {
    const name = `content/${file}.json`, load = rawSources[`../../../${name}`]; if (!load) fail('VI bundled baseline missing.');
    const raw = await load(); if (typeof raw !== 'string') fail('VI bundled source bytes missing.'); values[name] = JSON.parse(raw); bytes[name] = raw;
  }
  for (const name of hsk1SourceViFiles) {
    const load = rawSources[`../../../${name}`]; if (!load) fail('VI bundled activity baseline missing.');
    const raw = await load(); if (typeof raw !== 'string') fail('VI bundled activity bytes missing.'); values[name] = JSON.parse(raw); bytes[name] = raw;
  }
  const manifest: unknown = JSON.parse(manifestBytes); if (!row(manifest) || !Array.isArray(manifest.baselineFiles)) fail('VI baseline list missing.');
  const baselineFiles = await Promise.all(manifest.baselineFiles.map(async v => { if (!row(v) || !text(v.file) || !bytes[v.file]) fail('VI baseline is not a known HSK1 source.'); return { file: v.file, sha256: await viSHA256(bytes[v.file]!) }; }));
  const revisions = values['content/textbook-display-revisions.json']; if (!row(revisions) || !text(revisions.revision)) fail('VI parent display revision missing.');
  const result = await createOfficialViRegistry({ manifestBytes, reviewBytes, manifestSHA256: entry.manifestSHA256, reviewSHA256: entry.reviewSHA256, reviewFile: entry.reviewFile, baselineFiles, parentDisplayRevision: revisions.revision, fields: hsk1ViFields(values).filter(f => baselineFiles.some(b => b.file === f.baselineFile)) });
  signal?.throwIfAborted(); loadedRegistry = result; return result;
}
