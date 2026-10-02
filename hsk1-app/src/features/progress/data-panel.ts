import { LEGACY_KEYS, type AppData, type Compatibility, type SourceReport } from '../../services/storage/compatibility.ts';
import { RESET_MODULES, type ResetModule } from '../../domain/progress/reset.ts';
import type { LearningSession } from '../../services/learning/session.ts';
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
  exerciseSubmitted: 'Câu luyện bổ sung đã nộp', exerciseDrafts: 'Câu luyện bổ sung đang có nháp',
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
export async function mountDataPanel(host: HTMLElement, signal: AbortSignal, learning: () => Promise<LearningSession>): Promise<{ dispose(): void }> {
  const { store, compatibility } = await learning();
  signal.throwIfAborted();
  const controller = new AbortController();
  const abort = () => controller.abort(); signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  const storage = {
    getItem(key: string) { return window.localStorage.getItem(key); },
  };
  const panel = element('section'); panel.className = 'data-panel'; panel.setAttribute('aria-label', 'Quản lý dữ liệu');
  panel.append(element('h2', 'Dữ liệu trên thiết bị và bản sao lưu'));
  panel.append(element('p', 'Dữ liệu chỉ ở trình duyệt này. Việc chuyển hoặc nhập không sửa các bản ghi cũ và không sao lưu phiên đăng nhập.'));
  if (!navigator.locks) panel.append(element('p', 'Trình duyệt này không hỗ trợ ghi an toàn giữa các tab. Chỉ xem và tải bản sao lưu; hãy dùng trình duyệt có hỗ trợ để nhập dữ liệu.'));
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
  const resetSection = element('section'); resetSection.className = 'data-reset';
  resetSection.append(element('h3', 'Đặt lại tiến độ học'));
  resetSection.append(element('p', 'Chọn một bài, một phần hoặc toàn khóa. Xem rõ phạm vi trước khi xác nhận; bạn có thể khôi phục bản ngay trước lần đặt lại.'));
  const lessonLabel = element('label', 'Phạm vi bài: '); lessonLabel.htmlFor = 'reset-lesson';
  const resetLesson = element('select'); resetLesson.id = 'reset-lesson';
  const allLessons = element('option', 'Toàn khóa · 15 bài'); allLessons.value = 'all'; resetLesson.append(allLessons);
  for (let id = 1; id <= 15; id++) { const option = element('option', `Bài ${id}`); option.value = String(id); resetLesson.append(option); }
  const moduleLabel = element('label', 'Phần học: '); moduleLabel.htmlFor = 'reset-module';
  const resetModule = element('select'); resetModule.id = 'reset-module';
  const moduleLabels: Record<ResetModule | 'all', string> = { all: 'Tất cả phần học', textbook: 'Giáo trình và dấu từ đã thuộc',
    homework: 'Bài tập', listening: 'Luyện nghe', vocabulary: 'Lịch ôn từ vựng', exercises: 'Bài gốc, Bài 9 mở rộng và ôn câu' };
  for (const name of ['all', ...RESET_MODULES] as const) { const option = element('option', moduleLabels[name]); option.value = name; resetModule.append(option); }
  const resetAction = button('preview-reset', 'Xem trước đặt lại');
  const resetControls = element('div'); resetControls.className = 'data-actions';
  resetControls.append(lessonLabel, resetLesson, moduleLabel, resetModule, resetAction);
  resetSection.append(resetControls); panel.append(resetSection);
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
    resetAction.disabled = busy || !current.canWrite || current.status === 'conflict';
    resetLesson.disabled = busy; resetModule.disabled = busy;
    confirm.disabled = busy || !pending || !current.canWrite || current.status === 'conflict';
    exportPreview.disabled = !pending;
    cancel.disabled = busy;
  };
  const clearPreview = () => { pending = undefined; preview.hidden = true; previewDetails.replaceChildren(); confirm.disabled = true; };
  const showPreview = (candidate: NonNullable<typeof pending>, warnings: readonly string[], description: string, reports: readonly SourceReport[] = [], resetCount?: number) => {
    pending = candidate; actionMessage = ''; preview.hidden = false; preview.dataset.reason = candidate.reason;
    previewDetails.replaceChildren(element('h3', description));
    const counts = element('div'); renderSummary(counts, compatibility, candidate.data); previewDetails.append(counts);
    if (warnings.length) {
      const warningList = element('ul');
      for (const warning of warnings) warningList.append(element('li', warning));
      previewDetails.append(warningList);
    }
    if (reports.length) {
      const sources = element('section'); sources.className = 'data-source-list'; sources.setAttribute('aria-label', 'Nguồn dữ liệu cũ');
      sources.append(element('h4', 'Từng nguồn trên thiết bị / trong tệp'));
      sources.append(element('p', 'Số mục là câu đã có đáp án, lịch ôn, dấu đọc hoặc bản ghi lịch sử; không phải số câu đúng. Mục chưa hiểu và bản khôi phục được giữ nguyên, không cộng vào điểm.'));
      for (const report of reports) {
        const item = element('article'); item.dataset.source = report.key;
        item.append(element('strong', report.key), element('p', `${report.understood} mục đã hiểu · ${report.unsupported} mục chỉ giữ bản gốc · ${report.bytes} byte`));
        for (const warning of report.warnings) item.append(element('p', warning));
        sources.append(item);
      }
      previewDetails.append(sources);
    }
    if (candidate.reason === 'reset') {
      previewDetails.append(element('p', `${resetCount ?? 0} bản ghi / lượt đang mở sẽ được đặt lại. Điểm lần đầu, lần gần nhất và nháp trong phạm vi đã chọn sẽ bị xóa khỏi tiến độ hoạt động.`));
      previewDetails.append(element('p', 'Giữ nguyên các bài / phần ngoài phạm vi, hồ sơ học viên, tùy chọn, nguồn cũ và phiên đăng nhập. Một bản dữ liệu đầy đủ ngay trước thao tác sẽ được giữ để khôi phục.'));
      confirm.textContent = 'Xác nhận đặt lại đúng phạm vi này'; render(); return;
    }
    const current = store.snapshot();
    const hasExisting = current.revision > 0 || current.status !== 'empty';
    if (hasExisting) {
      const before = compatibility.summary(current.data), after = compatibility.summary(candidate.data);
      const differences = element('ul'); differences.className = 'data-differences';
      for (const [key, label] of Object.entries(summaryLabels)) if (before[key] !== after[key]) {
        const item = element('li', `${label}: ${before[key]} → ${after[key]}`);
        if (after[key]! < before[key]!) item.className = 'data-warning';
        differences.append(item);
      }
      if (differences.childElementCount) previewDetails.append(element('h4', 'Thay đổi so với dữ liệu đang mở'), differences);
    }
    if (hasExisting && candidate.reason === 'migration') {
      previewDetails.append(element('p', 'Xác nhận chỉ bổ sung tiến độ cũ còn thiếu. Dữ liệu mới, nháp và lượt đang mở được giữ nguyên. Toàn bộ trạng thái trước thao tác có thể khôi phục.'));
      confirm.textContent = 'Xác nhận bổ sung dữ liệu cũ'; render(); return;
    }
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
  const runWrite = async (operation: () => Promise<{ ok: boolean; code: string }>, reason: 'import' | 'restore' | 'reset' = 'import') => {
    if (!alive() || busy) return;
    readId++; busy = true; actionMessage = ''; render();
    try {
      const result = await operation();
      if (!alive()) return;
      if (result.ok) { clearPreview(); actionMessage = 'Thao tác đã hoàn tất và được lưu trên thiết bị.'; }
      else actionMessage = reason === 'reset' ? 'Chưa đặt lại được dữ liệu. Tiến độ đang mở và bản khôi phục trước đó vẫn nguyên vẹn.' : result.code === 'conflict' || result.code === 'stale-preview'
        ? 'Bản xem trước đã cũ hoặc có thay đổi ở tab khác. Hãy đọc lại dữ liệu và xem trước lần nữa.'
        : reason === 'import'
          ? 'Chưa lưu được bản xem trước. Hãy tải bản sao lưu của bản xem trước để giữ lại dữ liệu muốn nhập.'
          : 'Chưa khôi phục được dữ liệu. Bản đang mở và bản khôi phục vẫn được giữ lại.';
    } catch {
      if (alive()) actionMessage = reason === 'reset' ? 'Chưa đặt lại được dữ liệu. Tiến độ đang mở vẫn được giữ nguyên.' : reason === 'import'
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
      const current = store.snapshot();
      const result = compatibility.migrate(raw, Date.now(), current.revision > 0 || current.hasUnsavedChanges ? current.data : undefined);
      showPreview(store.previewReplacement(result.data, 'migration'), result.warnings, 'Xem trước dữ liệu chuyển từ ứng dụng cũ', result.reports);
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
        showPreview(store.previewReplacement(result.data, 'import'), result.warnings, `Xem trước tệp cũ ${file.name}`, result.reports);
      }
    } catch { if (alive() && currentRead === readId) reportError('Tệp không hợp lệ hoặc không thuộc định dạng sao lưu được hỗ trợ. Chưa thay đổi dữ liệu.'); }
    finally { if (alive() && currentRead === readId) fileInput.value = ''; }
  }, { signal: controller.signal });
  resetAction.addEventListener('click', () => {
    if (!alive() || busy) return;
    readId++; clearPreview();
    try {
      const result = compatibility.reset(store.snapshot().data, { module: resetModule.value as ResetModule | 'all',
        lesson: resetLesson.value === 'all' ? null : Number(resetLesson.value) });
      showPreview(store.previewReplacement(result.data, 'reset'), result.warnings, result.title, [], result.removed);
    } catch { reportError('Không tạo được bản xem trước đặt lại. Chưa thay đổi tiến độ.'); }
  }, { signal: controller.signal });
  for (const select of [resetLesson, resetModule]) select.addEventListener('change', () => {
    if (pending?.reason === 'reset') { clearPreview(); actionMessage = 'Phạm vi đã đổi. Hãy xem trước lại trước khi xác nhận.'; render(); }
  }, { signal: controller.signal });
  confirm.addEventListener('click', () => { if (pending) {
    const candidate = pending;
    void runWrite(() => store.confirm(candidate, controller.signal), candidate.reason === 'reset' ? 'reset' : 'import');
  } }, { signal: controller.signal });
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
  restore.addEventListener('click', () => { clearPreview(); void runWrite(() => store.restore(controller.signal), 'restore'); }, { signal: controller.signal });
  reload.addEventListener('click', () => { readId++; clearPreview(); store.reloadDiscardingDraft(); actionMessage = 'Đã đọc lại bản trên thiết bị; bản thay đổi chưa lưu đã được bỏ.'; render(); }, { signal: controller.signal });
  const unsubscribe = store.subscribe(render); render();
  return {
    dispose() {
      if (left) return;
      left = true; readId++; controller.abort(); unsubscribe(); panel.remove(); signal.removeEventListener('abort', abort);
      for (const [url, timer] of urls) { clearTimeout(timer); URL.revokeObjectURL(url); } urls.clear();
    },
  };
}
