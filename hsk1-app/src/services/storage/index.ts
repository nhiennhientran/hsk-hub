/** One atomic record: current data and one non-recursive recovery snapshot. */
export const STORAGE_KEY = 'ran_hsk1_modular_v1';
export const WRITE_LOCK = 'ran-hsk1-modular-write';
export type StoreStatus = 'empty' | 'saved' | 'unsaved' | 'saving' | 'conflict' | 'corrupt' | 'unavailable';
export type ReplacementReason = 'import' | 'migration' | 'reset';
export type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export type StoreResult = Readonly<{ ok: boolean; code: string }>;
export type Preview<T> = Readonly<{ id: number; reason: ReplacementReason; data: T }>;
export interface StoreOptions<T> {
  storage: StoragePort;
  blank: () => T;
  validate: (data: unknown) => T;
  lock?: <R>(task: () => R | Promise<R>) => Promise<R>;
  now?: () => number;
  /** Optional course identity. Defaults preserve the existing HSK1 contract. */
  storageKey?: string;
  appId?: string;
  backupAppId?: string;
}
interface Recovery<T> {
  data: T;
  revision: number;
  updatedAt: number | null;
  reason: ReplacementReason | 'restore';
}
interface Envelope<T> {
  app: string;
  schema: 1;
  revision: number;
  updatedAt: number;
  data: T;
  recovery: Recovery<T> | null;
}
const copy = <T>(value: T): T => structuredClone(value);
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const time = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const revision = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export function createStore<T>(options: StoreOptions<T>) {
  const now = options.now ?? Date.now;
  const storageKey = options.storageKey ?? STORAGE_KEY;
  const appId = options.appId ?? 'hsk1-modular';
  const backupAppId = options.backupAppId ?? 'hsk1-modular-backup';
  let data = options.blank();
  let status: StoreStatus = 'empty';
  let issue: string | null = null;
  let expectedRaw: string | null = null;
  let rev = 0;
  let updatedAt: number | null = null;
  let recovery: Recovery<T> | null = null;
  let blocked = false;
  let disposed = false;
  let hasUnsavedChanges = false;
  let editVersion = 0;
  let nextPreview = 0;
  const listeners = new Set<() => void>();
  const previews = new WeakMap<Preview<T>, { data: T; reason: ReplacementReason; version: number; raw: string | null }>();
  // Observers cannot turn a confirmed write into a reported failure.
  const publish = () => { if (!disposed) for (const listener of [...listeners]) { try { listener(); } catch { /* Isolate UI observers. */ } } };
  const validate = (value: unknown) => options.validate(copy(value));

  function readRecovery(value: unknown): Recovery<T> | null {
    if (value === null) return null;
    if (!record(value) || !revision(value.revision) || !(value.updatedAt === null || time(value.updatedAt)) ||
        !['import', 'migration', 'reset', 'restore'].includes(String(value.reason)) || 'recovery' in value) {
      throw new Error('Bản khôi phục không hợp lệ.');
    }
    return { data: validate(value.data), revision: value.revision, updatedAt: value.updatedAt,
      reason: value.reason as Recovery<T>['reason'] };
  }
  function readEnvelope(raw: string): Envelope<T> {
    const value: unknown = JSON.parse(raw);
    if (!record(value) || value.app !== appId || value.schema !== 1 ||
        !revision(value.revision) || value.revision < 1 || !time(value.updatedAt)) {
      throw new Error('Dữ liệu lưu không đúng ứng dụng hoặc phiên bản.');
    }
    return { app: appId, schema: 1, revision: value.revision, updatedAt: value.updatedAt,
      data: validate(value.data), recovery: readRecovery(value.recovery) };
  }
  function load(): void {
    editVersion++;
    data = options.blank(); rev = 0; updatedAt = null; recovery = null; issue = null; blocked = false; hasUnsavedChanges = false;
    try { expectedRaw = options.storage.getItem(storageKey); }
    catch { expectedRaw = null; blocked = true; status = 'unavailable'; issue = 'Không đọc được bộ nhớ của trình duyệt. Bản nháp chỉ ở trong tab này.'; publish(); return; }
    if (expectedRaw === null) { status = 'empty'; publish(); return; }
    try {
      const envelope = readEnvelope(expectedRaw);
      data = envelope.data; rev = envelope.revision; updatedAt = envelope.updatedAt; recovery = envelope.recovery;
      status = 'saved';
    } catch {
      status = 'corrupt'; blocked = true;
      issue = 'Dữ liệu gốc không đọc được. Không ghi đè; hãy tải dữ liệu gốc để giữ lại.';
    }
    publish();
  }
  function result(ok: boolean, code: string): StoreResult { return { ok, code }; }
  function conflict(code = 'conflict'): StoreResult {
    status = 'conflict'; issue = 'Có thay đổi ở tab khác. Bản nháp trong tab này vẫn còn; hãy sao lưu trước khi đọc lại.';
    publish(); return result(false, code);
  }
  function storageFailure(error: unknown): StoreResult {
    const quota = record(error) && error.name === 'QuotaExceededError';
    status = 'unsaved'; issue = quota
      ? 'Bộ nhớ đã đầy. Chưa lưu; bản nháp vẫn còn và có thể tải bản sao lưu.'
      : 'Chưa xác nhận được việc lưu. Bản nháp vẫn còn; hãy tải bản sao lưu.';
    publish(); return result(false, quota ? 'quota' : 'write-unconfirmed');
  }
  function writable(): StoreResult | null {
    if (disposed) return result(false, 'disposed');
    if (blocked) return result(false, status === 'corrupt' ? 'corrupt' : 'unavailable');
    if (!options.lock) {
      status = 'unavailable'; issue = 'Trình duyệt không hỗ trợ khóa ghi an toàn. Bạn vẫn có thể tải bản sao lưu.';
      publish(); return result(false, 'lock-unavailable');
    }
    return null;
  }
  function checkCurrent(): StoreResult | null {
    try { if (options.storage.getItem(storageKey) !== expectedRaw) return conflict(); }
    catch (error) { return storageFailure(error); }
    return null;
  }
  function commit(candidate: T, reason?: Recovery<T>['reason']): StoreResult {
    const changed = checkCurrent(); if (changed) return changed;
    if (!Number.isSafeInteger(rev + 1)) throw new Error('Số phiên lưu vượt giới hạn.');
    const stamp = now(); if (!time(stamp)) throw new Error('Thời gian lưu không hợp lệ.');
    const previous = reason ? { data: copy(data), revision: rev, updatedAt, reason } : recovery;
    const envelope: Envelope<T> = { app: appId, schema: 1, revision: rev + 1,
      updatedAt: stamp, data: validate(candidate), recovery: previous };
    const raw = JSON.stringify(envelope);
    // No await between compare and set. The injected Web Lock serializes cooperating tabs.
    let writeError: unknown;
    try { options.storage.setItem(storageKey, raw); } catch (error) { writeError = error; }
    let observed: string | null;
    try { observed = options.storage.getItem(storageKey); }
    catch (error) { return storageFailure(writeError ?? error); }
    // A hostile/test adapter can write then throw. Accept only an exact, readable write.
    // Never roll back: another writer may already own the new value.
    if (observed !== raw) {
      if (observed !== expectedRaw) return conflict();
      return storageFailure(writeError ?? new Error('Write was not retained.'));
    }
    expectedRaw = raw; data = envelope.data; rev = envelope.revision; updatedAt = stamp;
    recovery = previous; editVersion++; status = 'saved'; issue = null; hasUnsavedChanges = false;
    publish(); return result(true, 'saved');
  }
  async function locked(action: () => StoreResult, signal?: AbortSignal): Promise<StoreResult> {
    if (signal?.aborted) return result(false, 'cancelled');
    const stop = writable(); if (stop) return stop;
    const previousStatus = status;
    status = 'saving'; issue = null; publish();
    try {
      const outcome = await options.lock!(() => {
        if (signal?.aborted) return result(false, 'cancelled');
        const stopped = writable(); if (stopped) return stopped;
        return action();
      });
      if (!disposed && status === 'saving') {
        status = previousStatus === 'saving' ? 'unsaved' : previousStatus;
        if (outcome.code === 'stale-preview') issue = 'Bản xem trước đã hết hạn. Hãy xem trước lại trước khi xác nhận.';
        publish();
      }
      return outcome;
    } catch (error) { return disposed ? result(false, 'disposed') : storageFailure(error); }
  }
  function previewReplacement(candidate: unknown, reason: ReplacementReason): Preview<T> {
    if (disposed) throw new Error('Trang dữ liệu đã đóng.');
    if (!['import', 'migration', 'reset'].includes(reason)) throw new Error('Loại nhập dữ liệu không được hỗ trợ.');
    if (blocked) throw new Error(issue ?? 'Không đọc được dữ liệu hiện tại.');
    const changed = checkCurrent(); if (changed) throw new Error(issue!);
    const validated = validate(candidate);
    const preview = Object.freeze({ id: ++nextPreview, reason, data: copy(validated) });
    previews.set(preview, { data: validated, reason, version: editVersion, raw: expectedRaw });
    return preview;
  }
  load();
  return {
    snapshot() { return { data: copy(data), status, revision: rev, updatedAt, hasRecovery: recovery !== null,
      canWrite: !!options.lock && !blocked && !disposed, hasUnsavedChanges, issue }; },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    edit(mutator: (draft: T) => void): void {
      if (disposed) throw new Error('Trang dữ liệu đã đóng.');
      const draft = copy(data); mutator(draft); data = validate(draft); editVersion++; hasUnsavedChanges = true;
      if (!blocked && status !== 'conflict') { status = 'unsaved'; issue = null; }
      publish();
    },
    async save(): Promise<StoreResult> { return locked(() => commit(data)); },
    exportBackup(): string {
      return JSON.stringify({ app: backupAppId, schema: 1, exportedAt: now(), data: validate(data) }, null, 2);
    },
    exportPreview(preview: Preview<T>): string {
      const held = previews.get(preview);
      if (!held) throw new Error('Không có bản xem trước này.');
      return JSON.stringify({ app: backupAppId, schema: 1, exportedAt: now(), data: copy(held.data) }, null, 2);
    },
    exportOriginal(): string | null { return status === 'corrupt' ? expectedRaw : null; },
    previewReplacement,
    previewBackup(text: string): Preview<T> {
      const value: unknown = JSON.parse(text);
      if (!record(value) || value.app !== backupAppId || value.schema !== 1 || !time(value.exportedAt)) {
        throw new Error('Tệp không đúng ứng dụng hoặc phiên bản sao lưu.');
      }
      return previewReplacement(value.data, 'import');
    },
    async confirm(preview: Preview<T>, signal?: AbortSignal): Promise<StoreResult> {
      return locked(() => {
        const held = previews.get(preview);
        if (!held || held.version !== editVersion || held.raw !== expectedRaw) return result(false, 'stale-preview');
        const changed = checkCurrent(); if (changed) return changed;
        const committed = commit(held.data, held.reason);
        if (committed.ok) previews.delete(preview);
        return committed;
      }, signal);
    },
    async restore(signal?: AbortSignal): Promise<StoreResult> {
      const version = editVersion;
      return locked(() => {
        if (version !== editVersion) return result(false, 'stale-preview');
        if (!recovery) return result(false, 'no-recovery');
        return commit(recovery.data, 'restore');
      }, signal);
    },
    reloadDiscardingDraft(): void { if (!disposed) load(); },
    observeExternalChange(): void { if (!disposed && !blocked) checkCurrent(); },
    dispose(): void { disposed = true; listeners.clear(); },
  };
}
