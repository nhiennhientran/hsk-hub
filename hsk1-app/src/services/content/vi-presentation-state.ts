import type { HomeworkGroup, ViPresentationState, ViHomeworkPresentation } from '../../domain/types.ts';
import type { AppData } from '../storage/compatibility.ts';
import type { ListeningSession } from '../../domain/listening/types.ts';
import { applyViSnapshot, defaultOfficialViRegistry, viCanonical, viPointer, uniqueViOptions, type OfficialViRegistry, type ViDisplaySnapshot } from './official-vi-revisions.ts';

export type ViHomeworkVersion = 'legacy' | '30-v1';
export interface ViQuestion { readonly id: string; readonly fingerprint?: string }
const row = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) && [Object.prototype, null].includes(Object.getPrototypeOf(v));
function fail(): never { throw new Error('Vietnamese presentation binding is invalid.'); }
const exact = (r: object, keys: string[]) => { if (Object.keys(r).length !== keys.length || Object.keys(r).some(k => !keys.includes(k))) fail(); };
const groupKey = (v: ViHomeworkVersion, lesson: number, part: string) => `${v}:${lesson}:${part}`;
const component = (v: ViHomeworkVersion) => v === 'legacy' ? 'homework' : 'homework30';
const group = (data: AppData, v: ViHomeworkVersion, lesson: number, part: string): HomeworkGroup | undefined =>
  (v === 'legacy' ? data.homework : data.homework30)?.lessons[String(lesson)]?.[part as 'choice'];
const round = (data: AppData) => data.practice.listening.session as unknown as ListeningSession | null;
/** These limits bound UTF-8 storage, not character counts or fake historical submissions. */
export const VI_PRESENTATION_LIMITS = Object.freeze({ bytes: 8 * 1024 * 1024, bindings: 4000, payloads: 2000, fields: 1000, text: 8192 });
const ensure = (data: AppData): ViPresentationState => data.viPresentation ??= { schemaVersion: 1, sequence: 0, payloads: {}, bindings: {}, homework: {}, listening: { round: null, records: {} } };
function next(state: ViPresentationState, prefix: string): string {
  if (state.sequence >= Number.MAX_SAFE_INTEGER) fail();
  return `${prefix}${++state.sequence}`;
}
function payload(state: ViPresentationState, snapshot: ViDisplaySnapshot): string {
  const key = Object.keys(state.payloads).find(id => viCanonical(state.payloads[id]) === viCanonical(snapshot));
  if (key) return key;
  const id = next(state, 'p'); state.payloads[id] = structuredClone(snapshot); return id;
}
function binding(state: ViPresentationState, snapshotId: string, context: string, authority: unknown): string {
  const id = next(state, 'b');
  // The exact canonical authority is retained, not a timestamp digest that could merge two submissions.
  state.bindings[id] = { payloadId: snapshotId, context, authority: viCanonical(authority) }; return id;
}
const emptyGroup = (raw: HomeworkGroup | undefined): ViHomeworkPresentation => ({ draft: null, first: null, current: null, latest: null, history: (raw?.history ?? []).map(() => null) });
function snapshotOf(data: AppData, id: string | null | undefined): ViDisplaySnapshot | null {
  const binding = id ? data.viPresentation?.bindings[id] : undefined;
  return binding ? data.viPresentation?.payloads[binding.payloadId] ?? null : null;
}
function owners(questions: readonly ViQuestion[], v: ViHomeworkVersion) { return questions.map(q => ({ id: q.id, component: component(v) })); }
export function homeworkDisplaySnapshot(data: AppData, version: ViHomeworkVersion, lesson: number, part: string, questions: readonly ViQuestion[], slot: 'draft' | 'first' | 'current' | 'latest' | number = 'draft', registry: OfficialViRegistry = defaultOfficialViRegistry()): ViDisplaySnapshot | null {
  const raw = group(data, version, lesson, part), saved = data.viPresentation?.homework[groupKey(version, lesson, part)];
  if (typeof slot === 'number') return snapshotOf(data, saved?.history[slot]);
  if (slot !== 'draft') return snapshotOf(data, saved?.[slot]);
  if (raw?.attempt) return snapshotOf(data, saved?.current);
  if (saved?.draft) return snapshotOf(data, saved.draft);
  // Any pre-existing unbound draft belongs to the baseline. Orders/profile/reads do not start a draft.
  return Object.keys(raw?.draft ?? {}).length ? null : registry.snapshot(owners(questions, version));
}
export function projectHomeworkQuestion<T extends ViQuestion>(data: AppData, version: ViHomeworkVersion, lesson: number, part: string, question: T, questions: readonly ViQuestion[], slot: 'draft' | 'first' | 'current' | 'latest' | number = 'draft', registry: OfficialViRegistry = defaultOfficialViRegistry()): T {
  return applyViSnapshot(question, question.id, component(version), homeworkDisplaySnapshot(data, version, lesson, part, questions, slot, registry));
}
/** Called after an actual raw answer change, inside that same store.edit. */
export function captureHomeworkDraft(data: AppData, version: ViHomeworkVersion, lesson: number, part: string, previousDraft: object, displayed: ViDisplaySnapshot | null): void {
  const key = groupKey(version, lesson, part), raw = group(data, version, lesson, part)!;
  const existing = data.viPresentation?.homework[key];
  if (!existing?.draft && (Object.keys(previousDraft).length || !displayed)) return;
  const state = ensure(data), saved = state.homework[key] ??= emptyGroup(raw);
  if (saved.draft) state.bindings[saved.draft]!.authority = viCanonical(raw.draft);
  else saved.draft = binding(state, payload(state, displayed!), `draft:${key}`, raw.draft);
  collectViPresentation(data);
}
/** Called only after the real grading engine succeeds, in the grading edit. */
export function commitHomeworkPresentation(data: AppData, version: ViHomeworkVersion, lesson: number, part: string, before: HomeworkGroup | undefined): void {
  const key = groupKey(version, lesson, part), raw = group(data, version, lesson, part)!, old = data.viPresentation?.homework[key];
  if (!old) return;
  const state = ensure(data), draft = old.draft ? state.bindings[old.draft] : undefined;
  const id = draft ? binding(state, draft.payloadId, `attempt:${key}`, raw.attempt) : null;
  if (!before?.first) old.first = id;
  old.latest = id; old.current = id; old.draft = null;
  old.history = [...old.history, id].slice(-20);
  collectViPresentation(data);
}
export function restartHomeworkPresentation(data: AppData, version: ViHomeworkVersion, lesson: number, part: string): void {
  const saved = data.viPresentation?.homework[groupKey(version, lesson, part)];
  if (saved) { saved.current = null; saved.draft = null; collectViPresentation(data); }
}
export function captureListeningRound(data: AppData, questions: readonly ViQuestion[], registry: OfficialViRegistry = defaultOfficialViRegistry()): void {
  const raw = round(data); if (!raw) return;
  const snapshot = registry.snapshot(questions.filter(q => raw.questionIds.includes(q.id)).map(q => ({ id: q.id, component: 'listening' })));
  if (!snapshot && !data.viPresentation) return;
  const state = ensure(data);
  state.listening.round = { id: raw.id, payloadId: snapshot ? payload(state, snapshot) : null, responses: Object.fromEntries(raw.questionIds.map(id => [id, null])) };
  collectViPresentation(data);
}
export function commitListeningPresentation(data: AppData, id: string, priorRecord: boolean): void {
  const state = data.viPresentation, raw = round(data), saved = state?.listening.round;
  if (!state || !raw || (!saved && !state.listening.records[id])) return;
  const submission = raw.responses[id]?.submission; if (!submission) return;
  const payloadId = saved?.id === raw.id ? saved.payloadId : null;
  const bid = payloadId ? binding(state, payloadId, `listening:${id}`, submission) : null;
  const record = state.listening.records[id] ??= { first: null, latest: null };
  if (!priorRecord) record.first = bid;
  record.latest = bid;
  if (saved?.id === raw.id) saved.responses[id] = bid;
  collectViPresentation(data);
}
export function listeningDisplaySnapshot(data: AppData, id: string, slot: 'round' | 'first' | 'latest' = 'round'): ViDisplaySnapshot | null {
  const state = data.viPresentation;
  if (slot !== 'round') return snapshotOf(data, state?.listening.records[id]?.[slot]);
  const saved = state?.listening.round, current = round(data);
  return saved && saved.id === current?.id && current.questionIds.includes(id) && saved.payloadId ? state!.payloads[saved.payloadId] ?? null : null;
}
export function collectViPresentation(data: AppData): void {
  const state = data.viPresentation; if (!state) return;
  const refs = new Set<string>();
  for (const saved of Object.values(state.homework)) for (const id of [saved.draft, saved.first, saved.current, saved.latest, ...saved.history]) if (id) refs.add(id);
  for (const saved of Object.values(state.listening.records)) for (const id of [saved.first, saved.latest]) if (id) refs.add(id);
  for (const id of Object.values(state.listening.round?.responses ?? {})) if (id) refs.add(id);
  for (const id of Object.keys(state.bindings)) if (!refs.has(id)) delete state.bindings[id];
  const payloads = new Set(Object.values(state.bindings).map(b => b.payloadId));
  if (state.listening.round?.payloadId) payloads.add(state.listening.round.payloadId);
  for (const id of Object.keys(state.payloads)) if (!payloads.has(id)) delete state.payloads[id];
  if (!Object.keys(state.homework).length && !Object.keys(state.listening.records).length && !state.listening.round) delete data.viPresentation;
}
/** Only explicit legacy replacement/reset callers may prune metadata after their raw-domain change. */
export function reconcileViPresentation(data: AppData, replaced?: 'legacy' | 'practice'): void {
  const state = data.viPresentation; if (!state) return;
  for (const key of Object.keys(state.homework)) {
    const [version, lesson, part] = key.split(':');
    if (replaced === 'legacy' && version === 'legacy' || !group(data, version as ViHomeworkVersion, Number(lesson), part!)) delete state.homework[key];
  }
  if (replaced === 'practice') state.listening = { round: null, records: {} };
  else {
    for (const id of Object.keys(state.listening.records)) if (!data.practice.listening.records[id]) delete state.listening.records[id];
    const current = round(data);
    if (!current || state.listening.round?.id !== current.id) state.listening.round = null;
    else if (state.listening.round) {
      const kept = state.listening.round;
      kept.responses = Object.fromEntries(current.questionIds.map(id => [id, kept.responses[id] ?? null]));
      if (kept.payloadId) {
        const source = state.payloads[kept.payloadId]!;
        const fields = source.fields.filter(f => current.questionIds.includes(f.ownerId));
        kept.payloadId = fields.length ? payload(state, { revisionId: source.revisionId, fields }) : null;
      }
    }
  }
  collectViPresentation(data);
}
export interface ViPresentationOwners { homework: ReadonlyMap<string, readonly ViQuestion[]>; listening: ReadonlyMap<string, ViQuestion> }
/** Import validation never repairs forged/dangling bindings or certifies unknown saved revisions. */
export function validateViPresentation(value: unknown, data: AppData, owners: ViPresentationOwners): ViPresentationState {
  if (!row(value)) fail(); exact(value, ['schemaVersion', 'sequence', 'payloads', 'bindings', 'homework', 'listening']);
  if (value.schemaVersion !== 1 || !Number.isSafeInteger(value.sequence) || Number(value.sequence) < 0 || !row(value.payloads) || !row(value.bindings) || !row(value.homework) || !row(value.listening) || new TextEncoder().encode(JSON.stringify(value)).byteLength > VI_PRESENTATION_LIMITS.bytes) fail();
  if (Object.keys(value.bindings).length > VI_PRESENTATION_LIMITS.bindings || Object.keys(value.payloads).length > VI_PRESENTATION_LIMITS.payloads) fail();
  exact(value.listening, ['round', 'records']); if (!row(value.listening.records)) fail();
  const state = structuredClone(value) as unknown as ViPresentationState;
  const used = new Set<string>(), usedPayloads = new Set<string>();
  const id = (v: unknown, prefix: string) => { if (typeof v !== 'string' || !new RegExp(`^${prefix}[1-9][0-9]*$`).test(v) || !Number.isSafeInteger(Number(v.slice(1))) || Number(v.slice(1)) > state.sequence) fail(); };
  for (const [key, snapshot] of Object.entries(state.payloads)) {
    id(key, 'p'); if (!row(snapshot)) fail(); exact(snapshot, ['revisionId', 'fields']);
    if (typeof snapshot.revisionId !== 'string' || !snapshot.revisionId.trim() || snapshot.revisionId.length > 256 || !Array.isArray(snapshot.fields) || !snapshot.fields.length || snapshot.fields.length > VI_PRESENTATION_LIMITS.fields) fail();
    const unique = new Set<string>();
    for (const field of snapshot.fields) {
      if (!row(field)) fail(); exact(field, ['ownerId', 'component', 'field', 'value']);
      if (typeof field.ownerId !== 'string' || typeof field.component !== 'string' || typeof field.field !== 'string' || typeof field.value !== 'string' || !field.value.trim() || field.value.length > VI_PRESENTATION_LIMITS.text) fail();
      const parts = viPointer(field.field), last = parts.at(-1)!;
      // Only display-language leaves: never grading identities, source, Chinese, pinyin, audio or order.
      const scalar = ['prompt', 'promptVi', 'meaning', 'explanation', 'explanationVi', 'vi'];
      const indexed = ['options', 'optionFeedback', 'transcript', 'keywords'];
      if (!(parts.length === 1 && scalar.includes(last) || parts.length === 2 && indexed.slice(0, 2).includes(parts[0]!) && /^(0|[1-9][0-9]*)$/.test(last) || parts.length === 3 && indexed.slice(2).includes(parts[0]!) && /^(0|[1-9][0-9]*)$/.test(parts[1]!) && last === 'vi')) fail();
      const uniqueKey = viCanonical([field.ownerId, field.component, field.field]); if (unique.has(uniqueKey)) fail(); unique.add(uniqueKey);
      const question = field.component === 'listening' ? owners.listening.get(field.ownerId) : [...owners.homework.entries()].filter(([key]) => key.startsWith(field.component === 'homework' ? 'legacy:' : field.component === 'homework30' ? '30-v1:' : 'INVALID:')).flatMap(([, qs]) => qs).find(q => q.id === field.ownerId);
      if (!question) fail();
      const display = applyViSnapshot(question, field.ownerId, field.component, snapshot);
      if (parts[0] === 'options') {
        const original = question as unknown as { options?: string[] }, projected = display as unknown as { options?: string[] };
        const rawLabel = original.options?.[Number(parts[1])];
        if (typeof rawLabel !== 'string' || /[\p{Script=Han}]/u.test(rawLabel) || !projected.options || !uniqueViOptions(projected.options)) fail();
      }
    }
  }
  for (const [key, saved] of Object.entries(state.bindings)) {
    id(key, 'b'); if (!row(saved)) fail(); exact(saved, ['payloadId', 'context', 'authority']);
    if (!state.payloads[saved.payloadId] || typeof saved.context !== 'string' || typeof saved.authority !== 'string' || saved.authority.length > 256000) fail();
  }
  function check(ref: string | null, context: string, authority: unknown, questionIds: readonly string[], displayComponent: string): void {
    if (ref === null) return;
    id(ref, 'b'); const saved = state.bindings[ref];
    if (!saved || saved.context !== context || saved.authority !== viCanonical(authority)) fail();
    const snapshot = state.payloads[saved.payloadId]!;
    if (!snapshot.fields.every(f => f.component === displayComponent && questionIds.includes(f.ownerId))) fail();
    used.add(ref); usedPayloads.add(saved.payloadId);
  }
  for (const [key, saved] of Object.entries(state.homework)) {
    const match = /^(legacy|30-v1):([1-9]|1[0-5]):(choice|sort|translation|translationChoice|listening)$/.exec(key);
    if (!match || !owners.homework.has(key) || !row(saved)) fail(); exact(saved, ['draft', 'first', 'current', 'latest', 'history']);
    const raw = group(data, match[1] as ViHomeworkVersion, Number(match[2]), match[3]!); if (!raw || !Array.isArray(saved.history) || saved.history.length !== raw.history.length) fail();
    const qids = owners.homework.get(key)!.map(q => q.id), comp = component(match[1] as ViHomeworkVersion), attemptContext = `attempt:${key}`;
    if (saved.draft && (raw.attempt || !Object.keys(raw.draft).length)) fail();
    if (saved.draft) check(saved.draft, `draft:${key}`, raw.draft, qids, comp); else if (saved.draft !== null) fail();
    if (!raw.first && saved.first !== null || !raw.attempt && saved.current !== null || !raw.latest && saved.latest !== null) fail();
    check(saved.first, attemptContext, raw.first, qids, comp); check(saved.current, attemptContext, raw.attempt, qids, comp); check(saved.latest, attemptContext, raw.latest, qids, comp);
    const nonNull = saved.history.filter(r => r !== null); if (new Set(nonNull).size !== nonNull.length) fail();
    if (nonNull.some((ref, index) => index > 0 && Number(ref!.slice(1)) <= Number(nonNull[index - 1]!.slice(1)))) fail();
    if (saved.first && nonNull.some(ref => Number(ref!.slice(1)) < Number(saved.first!.slice(1)) || ref === saved.first && saved.history[0] !== ref)) fail();
    saved.history.forEach((ref, index) => check(ref, attemptContext, raw.history[index], qids, comp));
    if (saved.latest !== (saved.history.at(-1) ?? null) || raw.attempt && saved.current !== saved.latest || raw.history.length < 20 && saved.first !== (saved.history[0] ?? null)) fail();
  }
  const listening = state.listening;
  for (const [qid, saved] of Object.entries(listening.records)) {
    const raw = data.practice.listening.records[qid]; if (!raw || !owners.listening.has(qid) || !row(saved)) fail(); exact(saved, ['first', 'latest']);
    // A round payload may include other queue questions; each field still belongs to the same listening bank.
    const qids = [...owners.listening.keys()];
    check(saved.first, `listening:${qid}`, raw.first, qids, 'listening'); check(saved.latest, `listening:${qid}`, raw.latest, qids, 'listening');
    if (raw.attempts === 1 && saved.first !== saved.latest || raw.attempts > 1 && saved.first && saved.first === saved.latest) fail();
    if (saved.first && saved.latest && Number(saved.first.slice(1)) > Number(saved.latest.slice(1))) fail();
  }
  if (listening.round !== null) {
    const saved = listening.round, raw = round(data); if (!row(saved)) fail(); exact(saved, ['id', 'payloadId', 'responses']);
    if (!raw || saved.id !== raw.id || !row(saved.responses) || !equalKeys(saved.responses, raw.responses)) fail();
    if (saved.payloadId !== null) {
      const snapshot = state.payloads[saved.payloadId]; if (!snapshot || snapshot.fields.some(f => f.component !== 'listening' || !raw.questionIds.includes(f.ownerId))) fail();
      usedPayloads.add(saved.payloadId);
    }
    for (const qid of raw.questionIds) {
      const ref = saved.responses[qid]; if (!raw.responses[qid]!.submission && ref !== null) fail();
      if (ref !== null) {
        check(ref!, `listening:${qid}`, raw.responses[qid]!.submission, [...owners.listening.keys()], 'listening');
        const submitted = state.payloads[state.bindings[ref!]!.payloadId]!, current = saved.payloadId ? state.payloads[saved.payloadId]! : null;
        // A scoped reset may trim the current queue payload; historical submissions remain byte-exact.
        if (current && submitted.revisionId !== current.revisionId || viCanonical(submitted.fields.filter(f => f.ownerId === qid)) !== viCanonical(current?.fields.filter(f => f.ownerId === qid) ?? [])) fail();
      }
      if (raw.responses[qid]!.submission && ref !== (state.listening.records[qid]?.latest ?? null)) fail();
    }
  }
  if (!equalKeys(Object.fromEntries([...used].map(k => [k, true])), state.bindings) || !equalKeys(Object.fromEntries([...usedPayloads].map(k => [k, true])), state.payloads)) fail();
  return state;
}
function equalKeys(a: object, b: object): boolean { return Object.keys(a).sort().join('\n') === Object.keys(b).sort().join('\n'); }
