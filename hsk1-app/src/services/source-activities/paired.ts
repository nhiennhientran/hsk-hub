import {pairDescription} from './summary.ts';
import { STORAGE_KEY, WRITE_LOCK, type PreparedWrite, type StoreResult } from '../storage/index.ts';
import type { LearningStore } from '../learning/session.ts';
import type { AppData } from '../storage/compatibility.ts';
import { SOURCE_STORAGE_KEY, SOURCE_WRITE_LOCK, SOURCE_JOURNAL_KEY, type SourceStore } from './store.ts';
import { SOURCE_EDITION, blankSourceData, type SourceData } from './state.ts';
export const PAIR_RECOVERY_KEY = 'ran_hsk1_source_pair_recovery_v1';
export const COMPLETE_APP = 'hsk1-complete-backup';
export type PairStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type PairLock = <R>(name: string, task: () => R | Promise<R>) => Promise<R>;
type PairRaw = { primary: string | null; source: string | null };
type PairAfter = { primary: string; source: string };
type Reason = 'import' | 'reset' | 'restore';
interface Completed { app: 'hsk1-pair-recovery'; schema: 1; id: string; before: PairRaw; after: PairAfter }
interface Journal { app: 'hsk1-pair-journal'; schema: 1; id: string; reason: Reason; before: PairRaw; after: PairAfter; previousRecovery: string | null }
export interface CompleteBackup { app: typeof COMPLETE_APP; schema: 2; exportedAt: number; domains: { name: 'primary' | 'textbook-source'; edition: string; backup: unknown }[] }
export interface PairPreview { readonly primary: AppData; readonly source: SourceData; readonly reason: Reason; readonly description: Readonly<{zh:string;vi:string}> }
const own = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, keys: string[]) => { if (Object.keys(v).length !== keys.length || Object.keys(v).some(k => !keys.includes(k))) throw Error('Invalid recovery fields.'); };
const result = (ok: boolean, code: string): StoreResult => ({ok, code});

/** Fixed HSK1 coordinator. Recoverability, not cross-key atomic visibility. */
export function createHSK1Pair(options: { primary: LearningStore; source: SourceStore; storage: PairStorage; lock?: PairLock; now?: () => number; isComposing?: () => boolean }) {
  const {primary, source, storage} = options, now = options.now ?? Date.now, scope = {};
  const p = primary.transactionParticipant(scope), s = source.transactionParticipant(scope);
  if (p.key !== STORAGE_KEY || p.app !== 'hsk1-modular' || s.key !== SOURCE_STORAGE_KEY || s.app !== 'hsk1-textbook-source') throw Error('Wrong transaction participants.');
  const previews = new WeakMap<PairPreview, { p: ReturnType<typeof p.preview>; s: ReturnType<typeof s.preview>; recovery: string | null }>();
  let serial = 0;
  const clean = () => !options.isComposing?.() && !primary.snapshot().hasUnsavedChanges && !source.snapshot().hasUnsavedChanges;
  const readPair = (): PairRaw => ({primary: storage.getItem(STORAGE_KEY), source: storage.getItem(SOURCE_STORAGE_KEY)});
  function validatePair(value: unknown, after = false): PairRaw {
    if (!own(value)) throw Error('Invalid pair.'); exact(value, ['primary','source']);
    for (const key of ['primary','source'] as const) if (!(typeof value[key] === 'string' || (!after && value[key] === null))) throw Error('Invalid raw domain.');
    p.parseRaw(value.primary as string | null); s.parseRaw(value.source as string | null);
    return value as PairRaw;
  }
  function parseCompleted(raw: string): Completed {
    const v: unknown = JSON.parse(raw);
    if (!own(v) || v.app !== 'hsk1-pair-recovery' || v.schema !== 1 || typeof v.id !== 'string' || !/^pair-[0-9]+-[0-9]+$/.test(v.id)) throw Error('Invalid completed recovery.');
    exact(v, ['app','schema','id','before','after']); validatePair(v.before); validatePair(v.after,true);
    return v as unknown as Completed;
  }
  function parseJournal(raw: string): Journal {
    const v: unknown = JSON.parse(raw);
    if (!own(v) || v.app !== 'hsk1-pair-journal' || v.schema !== 1 || typeof v.id !== 'string' || !/^pair-[0-9]+-[0-9]+$/.test(v.id) || !['import','reset','restore'].includes(String(v.reason)) || !(v.previousRecovery === null || typeof v.previousRecovery === 'string')) throw Error('Invalid pending journal.');
    exact(v, ['app','schema','id','reason','before','after','previousRecovery']); validatePair(v.before); validatePair(v.after,true);
    if (typeof v.previousRecovery === 'string') parseCompleted(v.previousRecovery);
    return v as unknown as Journal;
  }
  const completedRaw = (j: Journal) => JSON.stringify({app:'hsk1-pair-recovery',schema:1,id:j.id,before:j.before,after:j.after} satisfies Completed);
  function writeExact(key: string, raw: string | null): boolean {
    try { if (raw === null) storage.removeItem(key); else storage.setItem(key,raw); } catch { /* A write-then-throw is accepted only by exact readback. */ }
    return storage.getItem(key) === raw;
  }
  function samePair(a: PairRaw, b: PairRaw): boolean { return a.primary === b.primary && a.source === b.source; }
  async function locked<R>(task: () => R): Promise<R> {
    if (!options.lock) throw Error('Safe Web Locks unavailable.');
    return options.lock(WRITE_LOCK, () => options.lock!(SOURCE_WRITE_LOCK,task));
  }
  function preview(primaryData: unknown, sourceData: unknown, reason: Reason = 'import'): PairPreview {
    if (!options.lock || !clean() || storage.getItem(SOURCE_JOURNAL_KEY) !== null) throw Error('Flush drafts and resolve pending recovery first.');
    const recovery = storage.getItem(PAIR_RECOVERY_KEY); if (recovery !== null) parseCompleted(recovery);
    // Both candidates validate before a public preview/token exists.
    const pp = p.preview(primaryData,reason), sp = s.preview(sourceData,reason);
    const description=Object.freeze(pairDescription({primary:primary.snapshot().data,source:source.snapshot().data},{primary:pp.data,source:sp.data}));
    const token = Object.freeze({primary:pp.data,source:sp.data,reason,description}); previews.set(token,{p:pp,s:sp,recovery}); return token;
  }
  function conditionalRollback(j: Journal, raw: string): boolean {
    // Verify/re-establish the journal before any rollback, including an uncertain final remove.
    const journalNow=storage.getItem(SOURCE_JOURNAL_KEY);
    if(journalNow===null){if(!writeExact(SOURCE_JOURNAL_KEY,raw))return false;}else if(journalNow!==raw)return false;
    // Only bytes still owned by this transaction may be undone; never replace a third value.
    for (const [name,key] of [['primary',STORAGE_KEY],['source',SOURCE_STORAGE_KEY]] as const) {
      const current = storage.getItem(key);
      if (current === j.after[name] && !writeExact(key,j.before[name])) return false;
    }
    const final = completedRaw(j), recovery = storage.getItem(PAIR_RECOVERY_KEY);
    if (recovery === final && !writeExact(PAIR_RECOVERY_KEY,j.previousRecovery)) return false;
    if (!samePair(readPair(),j.before) || storage.getItem(PAIR_RECOVERY_KEY) !== j.previousRecovery || storage.getItem(SOURCE_JOURNAL_KEY) !== raw) return false;
    return writeExact(SOURCE_JOURNAL_KEY,null);
  }
  function adoptReload(raw: PairRaw): void {
    const pp = p.prepareReload(raw.primary), sp = s.prepareReload(raw.source);
    if (!p.check(pp,'after') || !s.check(sp,'after')) throw Error('Recovery state changed.');
    p.adopt(pp); s.adopt(sp); p.publish(); s.publish();
  }
  async function confirm(token: PairPreview, signal?: AbortSignal): Promise<StoreResult> {
    const held = previews.get(token); previews.delete(token); // One use, including cancellation/failure.
    if (!held || signal?.aborted) return result(false,held?'cancelled':'stale-preview');
    let pp: PreparedWrite | undefined, sp: PreparedWrite | undefined;
    try { return await locked(() => {
      if (signal?.aborted || !clean() || storage.getItem(SOURCE_JOURNAL_KEY) !== null || storage.getItem(PAIR_RECOVERY_KEY) !== held.recovery) return result(false,'stale-preview');
      pp = p.prepare(held.p,signal); sp = s.prepare(held.s,signal);
      if (!p.check(pp,'before',signal) || !s.check(sp,'before',signal)) return result(false,'stale-preview');
      const j: Journal = {app:'hsk1-pair-journal',schema:1,id:`pair-${now()}-${++serial}`,reason:token.reason,
        before:{primary:pp.beforeRaw,source:sp.beforeRaw},after:{primary:pp.afterRaw!,source:sp.afterRaw!},previousRecovery:held.recovery};
      const raw = JSON.stringify(j); parseJournal(raw);
      let journalVerified = false;
      try {
        if (!writeExact(SOURCE_JOURNAL_KEY,raw)) return result(false,'journal-unconfirmed');
        journalVerified = true;
        if (!p.check(pp,'before',signal) || !s.check(sp,'before',signal) || !clean()) throw Error('Changed after journal.');
        if (!writeExact(STORAGE_KEY,j.after.primary)) throw Error('Primary write unconfirmed.');
        if (!p.check(pp,'after',signal) || !s.check(sp,'before',signal) || !clean()) throw Error('Changed between live writes.');
        if (!writeExact(SOURCE_STORAGE_KEY,j.after.source)) throw Error('Source write unconfirmed.');
        if (!p.check(pp,'after',signal) || !s.check(sp,'after',signal) || !clean()) throw Error('Changed before finalization.');
        if (!writeExact(PAIR_RECOVERY_KEY,completedRaw(j))) throw Error('Recovery finalization unconfirmed.');
        if (!p.check(pp,'after',signal) || !s.check(sp,'after',signal) || !clean()) throw Error('Changed during finalization.');
        if (storage.getItem(SOURCE_JOURNAL_KEY) !== raw || !writeExact(SOURCE_JOURNAL_KEY,null)) throw Error('Journal finalization unconfirmed.');
        if (!p.check(pp,'after',signal) || !s.check(sp,'after',signal) || !clean()) throw Error('Changed after final readback.');
        // Synchronous non-notifying adoption; only then can observers see both domains.
        p.adopt(pp); s.adopt(sp); p.publish(); s.publish(); return result(true,'saved');
      } catch {
        if (!journalVerified) return result(false,'journal-unconfirmed');
        try { return result(false,conditionalRollback(j,raw)?'rolled-back':'recovery-required'); }
        catch { return result(false,'recovery-required'); }
      }
    }); } catch { return result(false,options.lock?'stale-or-unavailable':'lock-unavailable'); }
    finally { if (pp) p.discard(pp); if (sp) s.discard(sp); }
  }
  async function recover(signal?: AbortSignal): Promise<StoreResult> {
    try { return await locked(() => {
      if (signal?.aborted || !clean()) return result(false,'dirty-or-cancelled');
      const raw = storage.getItem(SOURCE_JOURNAL_KEY); if (raw === null) return result(true,'no-recovery');
      const j = parseJournal(raw), current = readPair(), recovery = storage.getItem(PAIR_RECOVERY_KEY), final = completedRaw(j);
      if (recovery !== j.previousRecovery && recovery !== final) return result(false,'recovery-conflict');
      for (const name of ['primary','source'] as const) if (current[name] !== j.before[name] && current[name] !== j.after[name]) return result(false,'recovery-conflict');
      if (samePair(current,j.after)) {
        if (!writeExact(PAIR_RECOVERY_KEY,final) || !samePair(readPair(),j.after) || storage.getItem(SOURCE_JOURNAL_KEY)!==raw || !writeExact(SOURCE_JOURNAL_KEY,null)) return result(false,'recovery-required');
        adoptReload(j.after); return result(true,'recovered-completed');
      }
      if (!conditionalRollback(j,raw)) return result(false,'recovery-required');
      adoptReload(j.before); return result(true,'recovered-cancelled');
    }); } catch { return result(false,options.lock?'recovery-required':'lock-unavailable'); }
  }
  function rescue() {
    const reads: Record<string, string | null> = {}, errors: string[] = [];
    for (const key of [STORAGE_KEY,SOURCE_STORAGE_KEY,SOURCE_JOURNAL_KEY,PAIR_RECOVERY_KEY]) { try { reads[key]=storage.getItem(key); } catch { errors.push(key); } }
    return {app:'hsk1-pair-rescue',schema:1,exportedAt:now(),consistent:false,raw:reads,unreadable:errors,
      drafts:{primary:JSON.parse(primary.exportBackup()),source:JSON.parse(source.exportBackup())}};
  }
  async function exportComplete(): Promise<{kind:'complete'|'rescue'; text:string}> {
    try { return await locked(() => {
      if (!clean() || storage.getItem(SOURCE_JOURNAL_KEY)!==null) throw Error('Not a consistent snapshot.');
      const before=readPair(); validatePair(before);
      const data:CompleteBackup={app:COMPLETE_APP,schema:2,exportedAt:now(),domains:[
        {name:'primary',edition:'hsk1-current',backup:JSON.parse(primary.exportBackup())},
        {name:'textbook-source',edition:SOURCE_EDITION,backup:JSON.parse(source.exportBackup())}]};
      if (primary.snapshot().status==='corrupt'||source.snapshot().status==='corrupt'||!samePair(before,readPair())) throw Error('Changed during export.');
      // exportBackup is the in-memory view. Verify it matches the live envelopes, not an old tab.
      if (JSON.stringify(p.parseRaw(before.primary))!==JSON.stringify(primary.snapshot().data)||JSON.stringify(s.parseRaw(before.source))!==JSON.stringify(source.snapshot().data)) throw Error('Stale tab.');
      return {kind:'complete' as const,text:JSON.stringify(data,null,2)};
    }); } catch { return {kind:'rescue',text:JSON.stringify(rescue(),null,2)}; }
  }
  function parseComplete(value: unknown): {primary:AppData;source:SourceData} {
    if (!own(value)||value.app!==COMPLETE_APP||value.schema!==2||!Number.isSafeInteger(value.exportedAt)||(value.exportedAt as number)<=0||(value.exportedAt as number)>8640000000000000||!Array.isArray(value.domains)||value.domains.length!==2) throw Error('Invalid complete backup.');
    exact(value,['app','schema','exportedAt','domains']);const domains=new Map<string,unknown>();
    for (const row of value.domains) { if(!own(row)||!['primary','textbook-source'].includes(String(row.name))||domains.has(String(row.name)))throw Error('Invalid or duplicate domain.');exact(row,['name','edition','backup']);if(row.edition!==(row.name==='primary'?'hsk1-current':SOURCE_EDITION)||row.backup===null)throw Error('Wrong edition or null domain.');domains.set(String(row.name),row.backup); }
    return {primary:p.parseBackup(JSON.stringify(domains.get('primary'))),source:s.parseBackup(JSON.stringify(domains.get('textbook-source')))};
  }
  return {preview,confirm,recover,exportComplete,rescue,parseComplete,hasSafeLocks:()=>!!options.lock,
    previewBackup(text:string){const d=parseComplete(JSON.parse(text));return preview(d.primary,d.source);},
    previewRestore(){const raw=storage.getItem(PAIR_RECOVERY_KEY);if(raw===null)throw Error('No paired recovery.');const v=parseCompleted(raw);return preview(p.parseRaw(v.before.primary),s.parseRaw(v.before.source),'restore');},
    previewReset(primaryData:AppData){return preview(primaryData,blankSourceData(),'reset');},
    pending(){try{return storage.getItem(SOURCE_JOURNAL_KEY)!==null;}catch{return true;}},
  };
}
export type HSK1Pair=ReturnType<typeof createHSK1Pair>;
