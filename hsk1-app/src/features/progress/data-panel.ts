import { createStore, STORAGE_KEY, WRITE_LOCK } from '../../services/storage/index.ts';
import { LEGACY_KEYS, loadCompatibility, type AppData, type Compatibility } from '../../services/storage/compatibility.ts';
import './data-panel.css';

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(id: string, label: string): HTMLButtonElement {
  const node = element('button', label); node.id = id; node.type = 'button'; return node;
}

const statusLabels: Record<string, string> = {
  empty: 'Chưa có dữ liệu trong ứng dụng mới. Dữ liệu cũ chưa bị thay đổi.',
  saved: 'Đã lưu dữ liệu trên thiết bị này.',
  unsaved: 'Chưa lưu được thay đổi. Hãy tải bản sao lưu trước khi rời trang.',
  saving: 'Đang lưu dữ liệu…',
  conflict: 'Dữ liệu đã thay đổi ở tab khác. Bản đang mở chưa ghi đè dữ liệu đó.',
  corrupt: 'Bản ghi hiện tại không đọc được. Hãy tải bản gốc để giữ lại dữ liệu.',
  unavailable: 'Không truy cập được bộ nhớ thiết bị. Bạn vẫn có thể tải bản sao lưu.',
};

const summaryLabels: Record<keyof ReturnType<Compatibility['summary']>, string> = {
  readingVisited: 'Bài giáo trình đã mở', readingCompleted: 'Bài giáo trình đã hoàn thành',
  masteredWords: 'Từ đã đánh dấu thuộc', homeworkSubmitted: 'Bài tập đã nộp',
  automaticSubmitted: 'Bài chấm tự động đã nộp', automaticFirstCorrect: 'Số câu đúng ở lần nộp đầu',
  automaticLatestCorrect: 'Số câu đúng ở lần nộp mới nhất', manualSubmitted: 'Bài dịch đã nộp để giáo viên xem',
  listeningSubmitted: 'Câu nghe đã nộp', listeningFirstCorrect: 'Câu nghe đúng ở lần đầu',
  listeningLatestCorrect: 'Câu nghe đúng ở lần mới nhất', scheduledSenses: 'Thẻ nghĩa có lịch ôn',
  legacySources: 'Bản dữ liệu cũ được giữ lại',
};

function renderSummary(host: HTMLElement, compatibility: Compatibility, data: AppData): void {
  const list = element('dl');
  const counts = compatibility.summary(data);
  for (const key of Object.keys(summaryLabels) as (keyof typeof summaryLabels)[]) {
    list.append(element('dt', summaryLabels[key]), element('dd', String(counts[key])));
  }
  host.replaceChildren(list);
}

/** Loaded only by an explicit click. It never writes merely because a page opens. */
export async function mountDataPanel(host: HTMLElement, signal: AbortSignal): Promise<{ dispose(): void }> {
  const compatibility = await loadCompatibility(signal);
  signal.throwIfAborted();
  const controller = new AbortController();
  const abort = () => controller.abort(); signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  const storage = {
    getItem(key: string) { return window.localStorage.getItem(key); },
    setItem(key: string, value: string) { window.localStorage.setItem(key, value); },
  };
  const lock = navigator.locks
    ? <R>(task: () => R | Promise<R>): Promise<R> => navigator.locks.request(WRITE_LOCK, { signal: controller.signal }, task)
    : undefined;
  const store = createStore<AppData>({ storage, blank: compatibility.blank, validate: compatibility.validate, lock });
  const panel = element('section'); panel.className = 'data-panel'; panel.setAttribute('aria-label', 'Quản lý dữ liệu');
  panel.append(element('h2', 'Dữ liệu trên thiết bị và bản sao lưu'));
  panel.append(element('p', 'Dữ liệu chỉ ở trình duyệt này. Việc chuyển hoặc nhập không sửa các bản ghi cũ và không sao lưu phiên đăng nhập.'));
  if (!lock) panel.append(element('p', 'Trình duyệt này không hỗ trợ ghi an toàn giữa các tab. Chỉ xem và tải bản sao lưu; hãy dùng trình duyệt có hỗ trợ để nhập dữ liệu.'));
  const status = element('p'); status.id = 'data-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const summary = element('div'); summary.id = 'data-summary';
  panel.append(status, element('h3', 'Dữ liệu đang mở'), summary);
  const actions = element('div'); actions.className = 'data-actions';
  const migration = button('preview-migration', 'Xem trước dữ liệu cũ trên thiết bị');
  const exportBackup = button('export-backup', 'Tải bản sao lưu hiện tại');
  const exportOriginal = button('export-original', 'Tải bản ghi gốc không đọc được');
  const restore = button('restore-data', 'Khôi phục bản đã giữ trước đó');
  const reload = button('reload-data', 'Bỏ thay đổi chưa lưu và đọc lại dữ liệu');
  actions.append(migration, exportBackup, exportOriginal, restore, reload); panel.append(actions);
  const label = element('label', 'Nhập tệp sao lưu mới hoặc cũ: '); label.htmlFor = 'backup-file';
  const fileInput = element('input'); fileInput.type = 'file'; fileInput.id = 'backup-file'; fileInput.accept = '.json,application/json';
  panel.append(label, fileInput);
  const preview = element('div'); preview.id = 'migration-preview'; preview.hidden = true; preview.setAttribute('aria-live', 'polite');
  const previewDetails = element('div'); const previewActions = element('div'); previewActions.className = 'data-actions';
  const confirm = button('confirm-data-import', 'Xác nhận'); confirm.disabled = true;
  const exportPreview = button('export-preview', 'Tải bản sao lưu của bản xem trước');
  const cancel = button('cancel-data-import', 'Hủy xem trước');
  previewActions.append(confirm, exportPreview, cancel); preview.append(previewDetails, previewActions); panel.append(preview); host.append(panel);

  let left = false; let busy = false; let readId = 0; let actionMessage = '';
  let pending: ReturnType<typeof store.previewReplacement> | undefined;
  const urls = new Map<string, ReturnType<typeof setTimeout>>();
  const alive = () => !left && !controller.signal.aborted;
  const render = () => {
    if (!alive()) return;
    const current = store.snapshot();
    status.dataset.state = current.status;
    status.textContent = [statusLabels[current.status], current.issue, actionMessage].filter(Boolean).join(' ');
    renderSummary(summary, compatibility, current.data);
    migration.disabled = busy; fileInput.disabled = busy;
    exportBackup.disabled = current.status === 'corrupt';
    exportOriginal.hidden = current.status !== 'corrupt';
    restore.disabled = busy || !current.hasRecovery || !current.canWrite || current.status === 'conflict';
    reload.disabled = busy;
    confirm.disabled = busy || !pending || !current.canWrite || current.status === 'conflict';
    exportPreview.disabled = !pending;
    cancel.disabled = busy;
  };
  const clearPreview = () => { pending = undefined; preview.hidden = true; previewDetails.replaceChildren(); confirm.disabled = true; };
  const showPreview = (candidate: NonNullable<typeof pending>, warnings: readonly string[], description: string) => {
    pending = candidate; actionMessage = ''; preview.hidden = false; preview.dataset.reason = candidate.reason;
    previewDetails.replaceChildren(element('h3', description));
    const counts = element('div'); renderSummary(counts, compatibility, candidate.data); previewDetails.append(counts);
    if (warnings.length) {
      const warningList = element('ul');
      for (const warning of warnings) warningList.append(element('li', warning));
      previewDetails.append(warningList);
    }
    const current = store.snapshot();
    const hasExisting = current.revision > 0 || current.status !== 'empty';
    const note = element('p', hasExisting
      ? 'Xác nhận sẽ thay thế dữ liệu hiện tại bằng bản xem trước này. Ứng dụng giữ một bản để khôi phục; các bản ghi cũ vẫn nguyên vẹn.'
      : 'Chỉ khi xác nhận, bản xem trước mới được lưu vào ứng dụng mới. Các bản ghi cũ vẫn nguyên vẹn.');
    note.className = 'data-warning'; previewDetails.append(note);
    confirm.textContent = hasExisting ? 'Xác nhận thay thế dữ liệu hiện tại' : 'Xác nhận lưu bản xem trước';
    render();
  };
  const reportError = (message: string) => { actionMessage = message; render(); };
  const download = (text: string, name: string) => {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
    const anchor = element('a'); anchor.href = url; anchor.download = name; document.body.append(anchor); anchor.click(); anchor.remove();
    const timer = setTimeout(() => { URL.revokeObjectURL(url); urls.delete(url); }, 1000); urls.set(url, timer);
  };
  const runWrite = async (operation: () => Promise<{ ok: boolean; code: string }>, reason: 'import' | 'restore' = 'import') => {
    if (!alive() || busy) return;
    readId++; busy = true; actionMessage = ''; render();
    try {
      const result = await operation();
      if (!alive()) return;
      if (result.ok) { clearPreview(); actionMessage = 'Thao tác đã hoàn tất và được lưu trên thiết bị.'; }
      else actionMessage = result.code === 'conflict' || result.code === 'stale-preview'
        ? 'Bản xem trước đã cũ hoặc có thay đổi ở tab khác. Hãy đọc lại dữ liệu và xem trước lần nữa.'
        : reason === 'import'
          ? 'Chưa lưu được bản xem trước. Hãy tải bản sao lưu của bản xem trước để giữ lại dữ liệu muốn nhập.'
          : 'Chưa khôi phục được dữ liệu. Bản đang mở và bản khôi phục vẫn được giữ lại.';
    } catch {
      if (alive()) actionMessage = reason === 'import'
        ? 'Chưa lưu được dữ liệu. Hãy tải bản sao lưu của bản xem trước nếu muốn giữ dữ liệu nhập.'
        : 'Chưa khôi phục được dữ liệu. Hãy tải bản sao lưu hiện tại để giữ lại dữ liệu.';
    } finally { if (alive()) { busy = false; render(); } }
  };
  migration.addEventListener('click', () => {
    if (!alive() || busy) return;
    readId++; clearPreview();
    const raw: Record<string, string | null> = {};
    try {
      for (const key of LEGACY_KEYS) raw[key] = storage.getItem(key);
      if (!Object.values(raw).some(value => value !== null)) { reportError('Không tìm thấy dữ liệu cũ trên thiết bị này. Không có bản ghi nào bị thay đổi.'); return; }
      const result = compatibility.migrate(raw, Date.now());
      showPreview(store.previewReplacement(result.data, 'migration'), result.warnings, 'Xem trước dữ liệu chuyển từ ứng dụng cũ');
    } catch { reportError('Không đọc hoặc chuyển được dữ liệu cũ. Các bản ghi cũ vẫn được giữ nguyên.'); }
  }, { signal: controller.signal });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]; if (!file || !alive() || busy) return;
    const currentRead = ++readId; clearPreview(); actionMessage = 'Đang đọc tệp sao lưu…'; render();
    try {
      const text = await file.text(); if (!alive() || currentRead !== readId) return;
      const parsed: unknown = JSON.parse(text);
      const app = typeof parsed === 'object' && parsed !== null && 'app' in parsed ? parsed.app : undefined;
      if (typeof app === 'string' && app.startsWith('hsk1-modular')) {
        showPreview(store.previewBackup(text), [], `Xem trước tệp ${file.name}`);
      } else {
        const result = compatibility.importLegacy(text, store.snapshot().data, Date.now());
        showPreview(store.previewReplacement(result.data, 'import'), result.warnings, `Xem trước tệp cũ ${file.name}`);
      }
    } catch { if (alive() && currentRead === readId) reportError('Tệp không hợp lệ hoặc không thuộc định dạng sao lưu được hỗ trợ. Chưa thay đổi dữ liệu.'); }
    finally { if (alive() && currentRead === readId) fileInput.value = ''; }
  }, { signal: controller.signal });
  confirm.addEventListener('click', () => { if (pending) void runWrite(() => store.confirm(pending!)); }, { signal: controller.signal });
  cancel.addEventListener('click', () => { readId++; clearPreview(); actionMessage = 'Đã hủy xem trước. Chưa thay đổi dữ liệu.'; render(); }, { signal: controller.signal });
  exportBackup.addEventListener('click', () => {
    try { download(store.exportBackup(), `hsk1-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`); }
    catch { reportError('Không tạo được bản sao lưu. Dữ liệu đang mở vẫn được giữ nguyên.'); }
  }, { signal: controller.signal });
  exportOriginal.addEventListener('click', () => {
    const original = store.exportOriginal();
    if (original !== null) download(original, 'hsk1-original-record.json');
  }, { signal: controller.signal });
  exportPreview.addEventListener('click', () => {
    if (!pending) return;
    try { download(store.exportPreview(pending), `hsk1-preview-${new Date().toISOString().replace(/[:.]/g, '-')}.json`); }
    catch { reportError('Không tạo được bản sao lưu của bản xem trước. Chưa thay đổi dữ liệu.'); }
  }, { signal: controller.signal });
  restore.addEventListener('click', () => { clearPreview(); void runWrite(() => store.restore(), 'restore'); }, { signal: controller.signal });
  reload.addEventListener('click', () => { readId++; clearPreview(); store.reloadDiscardingDraft(); actionMessage = 'Đã đọc lại bản trên thiết bị; bản thay đổi chưa lưu đã được bỏ.'; render(); }, { signal: controller.signal });
  const external = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) store.observeExternalChange(); };
  window.addEventListener('storage', external, { signal: controller.signal });
  const unsubscribe = store.subscribe(render); render();
  return {
    dispose() {
      if (left) return;
      left = true; readId++; controller.abort(); unsubscribe(); store.dispose(); panel.remove(); signal.removeEventListener('abort', abort);
      for (const [url, timer] of urls) { clearTimeout(timer); URL.revokeObjectURL(url); } urls.clear();
    },
  };
}
