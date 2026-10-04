import { LEGACY_KEYS, type AppData, type Compatibility, type SourceReport } from '../../services/storage/compatibility.ts';
import { RESET_MODULES, type ResetModule } from '../../domain/progress/reset.ts';
import type { LearningSession } from '../../services/learning/session.ts';
import { bilingualNode, bilingualText, setBilingual, type BilingualCopy } from '../../app/bilingual.ts';
import { dataCopy as copy, dataStatusCopy as statusLabels, dataSummaryCopy as summaryLabels, dataModuleCopy as moduleLabels,
  dataLessonCopy, dataFileCopy, dataSourceCountCopy, dataResetCountCopy, dataDifferenceCopy, dataStorageIssueCopy } from '../../services/storage/copy.ts';
import '../../app/bilingual.css';
import './data-panel.css';

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string | BilingualCopy): HTMLElementTagNameMap[K] {
  const node = typeof text === 'object' ? bilingualNode(tag, text) : document.createElement(tag);
  if (typeof text === 'string') node.textContent = text;
  if (tag === 'p' || tag === 'li' || tag === 'dt' || tag === 'h2' || tag === 'h3' || tag === 'h4') node.classList.add('bilingual-stacked');
  return node;
}

function button(id: string, label: BilingualCopy): HTMLButtonElement {
  const node = element('button', label); node.id = id; node.type = 'button'; return node;
}

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
  const panel = element('section'); panel.className = 'data-panel'; panel.setAttribute('aria-label', bilingualText(copy.panelLabel));
  panel.append(element('h2', copy.panelTitle));
  panel.append(element('p', copy.localOnly));
  if (!navigator.locks) panel.append(element('p', copy.noLocks));
  const status = element('p'); status.id = 'data-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const summary = element('div'); summary.id = 'data-summary';
  panel.append(status, element('h3', copy.currentData), summary);
  const actions = element('div'); actions.className = 'data-actions';
  const migration = button('preview-migration', copy.previewMigration);
  const exportBackup = button('export-backup', {zh:copy.exportBackup.zh+'（旧格式，不含教材练习记录）',vi:copy.exportBackup.vi+' (định dạng cũ, không gồm dữ liệu luyện tập theo giáo trình)'});
  const exportOriginal = button('export-original', copy.exportOriginal);
  const restore = button('restore-data', copy.restore);
  const reload = button('reload-data', copy.reload);
  actions.append(migration, exportBackup, exportOriginal, restore, reload); panel.append(actions);
  const label = element('label', copy.importLabel); label.htmlFor = 'backup-file';
  const fileInput = element('input'); fileInput.type = 'file'; fileInput.id = 'backup-file'; fileInput.accept = '.json,application/json';
  const chooseFile = button('choose-backup-file', copy.chooseFile); fileInput.hidden = true;
  chooseFile.addEventListener('click', () => fileInput.click(), { signal: controller.signal });
  const importControls = element('div'); importControls.className = 'data-import-controls';
  importControls.append(label, chooseFile, fileInput); panel.append(importControls);
  const resetSection = element('section'); resetSection.className = 'data-reset';
  resetSection.append(element('h3', copy.resetTitle));
  resetSection.append(element('p', copy.resetDescription));
  const lessonLabel = element('label', copy.lessonLabel); lessonLabel.htmlFor = 'reset-lesson';
  const resetLesson = element('select'); resetLesson.id = 'reset-lesson';
  const chooseLessonScope = element('option', '请选择 · Chọn phạm vi'); chooseLessonScope.value = ''; chooseLessonScope.disabled = true; chooseLessonScope.selected = true; resetLesson.append(chooseLessonScope);
  const allLessons = element('option', bilingualText(copy.allLessons)); allLessons.value = 'all'; resetLesson.append(allLessons);
  for (let id = 1; id <= 15; id++) { const option = element('option', bilingualText(dataLessonCopy(id))); option.value = String(id); resetLesson.append(option); }
  const moduleLabel = element('label', copy.moduleLabel); moduleLabel.htmlFor = 'reset-module';
  const resetModule = element('select'); resetModule.id = 'reset-module';
  const chooseModuleScope = element('option', '请选择 · Chọn phạm vi'); chooseModuleScope.value = ''; chooseModuleScope.disabled = true; chooseModuleScope.selected = true; resetModule.append(chooseModuleScope);
  for (const name of ['all', ...RESET_MODULES] as const) { const option = element('option', bilingualText(moduleLabels[name])); option.value = name; resetModule.append(option); }
  const resetAction = button('preview-reset', copy.previewReset);
  const resetControls = element('div'); resetControls.className = 'data-actions data-reset-controls';
  resetControls.append(lessonLabel, resetLesson, moduleLabel, resetModule, resetAction);
  resetSection.append(resetControls); panel.append(resetSection);
  const preview = element('div'); preview.id = 'migration-preview'; preview.hidden = true; preview.setAttribute('aria-live', 'polite');
  const previewDetails = element('div'); const previewActions = element('div'); previewActions.className = 'data-actions';
  const confirm = button('confirm-data-import', copy.confirm); confirm.disabled = true;
  const exportPreview = button('export-preview', copy.exportPreview);
  const cancel = button('cancel-data-import', copy.cancel);
  previewActions.append(confirm, exportPreview, cancel); preview.append(previewDetails, previewActions); panel.append(preview); host.append(panel);

  let left = false; let busy = false; let readId = 0; let actionMessage: BilingualCopy | undefined;
  let pending: ReturnType<typeof store.previewReplacement> | undefined;
  const urls = new Map<string, ReturnType<typeof setTimeout>>();
  const alive = () => !left && !controller.signal.aborted;
  const render = () => {
    if (!alive()) return;
    const current = store.snapshot();
    status.dataset.state = current.status;
    status.replaceChildren(...[statusLabels[current.status], current.issue ? dataStorageIssueCopy(current.issue) : undefined, actionMessage]
      .filter((message): message is BilingualCopy => message !== undefined).map(message => {
        const node = bilingualNode('span', message); node.className = 'data-status-message bilingual-stacked'; return node;
      }));
    renderSummary(summary, compatibility, current.data);
    migration.disabled = busy; fileInput.disabled = busy; chooseFile.disabled = busy;
    exportBackup.disabled = current.status === 'corrupt';
    exportOriginal.hidden = current.status !== 'corrupt';
    restore.disabled = busy || !current.hasRecovery || !current.canWrite || current.status === 'conflict';
    reload.disabled = busy;
    resetAction.disabled = busy || !current.canWrite || current.status === 'conflict' || !resetLesson.value || !resetModule.value;
    resetLesson.disabled = busy; resetModule.disabled = busy;
    confirm.disabled = busy || !pending || !current.canWrite || current.status === 'conflict';
    exportPreview.disabled = !pending;
    cancel.disabled = busy;
  };
  const clearPreview = () => { pending = undefined; preview.hidden = true; previewDetails.replaceChildren(); confirm.disabled = true; };
  const showPreview = (candidate: NonNullable<typeof pending>, warnings: readonly string[], description: string | BilingualCopy, reports: readonly SourceReport[] = [], resetCount?: number) => {
    pending = candidate; actionMessage = undefined; preview.hidden = false; preview.dataset.reason = candidate.reason;
    previewDetails.replaceChildren(element('h3', description));
    const counts = element('div'); renderSummary(counts, compatibility, candidate.data); previewDetails.append(counts);
    if (warnings.length) {
      const warningList = element('ul');
      for (const warning of warnings) warningList.append(element('li', warning));
      previewDetails.append(warningList);
    }
    if (reports.length) {
      const sources = element('section'); sources.className = 'data-source-list'; sources.setAttribute('aria-label', bilingualText(copy.sourcesLabel));
      sources.append(element('h4', copy.sourcesTitle));
      sources.append(element('p', copy.sourcesDescription));
      for (const report of reports) {
        const item = element('article'); item.dataset.source = report.key; item.dataset.understood = String(report.understood);
        item.dataset.unsupported = String(report.unsupported); item.dataset.bytes = String(report.bytes);
        item.append(element('strong', report.key), element('p', dataSourceCountCopy(report.understood, report.unsupported, report.bytes)));
        for (const warning of report.warnings) item.append(element('p', warning));
        sources.append(item);
      }
      previewDetails.append(sources);
    }
    if (candidate.reason === 'reset') {
      previewDetails.append(element('p', dataResetCountCopy(resetCount ?? 0)));
      previewDetails.append(element('p', copy.resetPreserved));
      setBilingual(confirm, copy.confirmReset); render(); return;
    }
    const current = store.snapshot();
    const hasExisting = current.revision > 0 || current.status !== 'empty';
    if (hasExisting) {
      const before = compatibility.summary(current.data), after = compatibility.summary(candidate.data);
      const differences = element('ul'); differences.className = 'data-differences';
      for (const [key, label] of Object.entries(summaryLabels)) if (before[key] !== after[key]) {
        const item = element('li', dataDifferenceCopy(label, before[key]!, after[key]!));
        if (after[key]! < before[key]!) item.classList.add('data-warning');
        differences.append(item);
      }
      if (differences.childElementCount) previewDetails.append(element('h4', copy.differences), differences);
    }
    if (hasExisting && candidate.reason === 'migration') {
      previewDetails.append(element('p', copy.migrationPreserved));
      setBilingual(confirm, copy.confirmSupplement); render(); return;
    }
    const note = element('p', hasExisting
      ? copy.replacementNote
      : copy.firstImportNote);
    note.classList.add('data-warning'); previewDetails.append(note);
    setBilingual(confirm, hasExisting ? copy.confirmReplace : copy.confirmSave);
    render();
  };
  const reportError = (message: BilingualCopy) => { actionMessage = message; render(); };
  const download = (text: string, name: string) => {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
    const anchor = element('a'); anchor.href = url; anchor.download = name; document.body.append(anchor); anchor.click(); anchor.remove();
    const timer = setTimeout(() => { URL.revokeObjectURL(url); urls.delete(url); }, 1000); urls.set(url, timer);
  };
  const runWrite = async (operation: () => Promise<{ ok: boolean; code: string }>, reason: 'import' | 'restore' | 'reset' = 'import') => {
    if (!alive() || busy) return;
    readId++; busy = true; actionMessage = undefined; render();
    try {
      const result = await operation();
      if (!alive()) return;
      if (result.ok) { clearPreview(); actionMessage = copy.completed; }
      else actionMessage = reason === 'reset' ? copy.resetFailed : result.code === 'conflict' || result.code === 'stale-preview'
        ? copy.stalePreview
        : reason === 'import'
          ? copy.importFailed
          : copy.restoreFailed;
    } catch {
      if (alive()) actionMessage = reason === 'reset' ? copy.resetError : reason === 'import'
        ? copy.importError
        : copy.restoreError;
    } finally { if (alive()) { busy = false; render(); } }
  };
  migration.addEventListener('click', () => {
    if (!alive() || busy) return;
    readId++; clearPreview();
    const raw: Record<string, string | null> = {};
    try {
      for (const key of LEGACY_KEYS) raw[key] = storage.getItem(key);
      if (!Object.values(raw).some(value => value !== null)) { reportError(copy.noLegacy); return; }
      const current = store.snapshot();
      const result = compatibility.migrate(raw, Date.now(), current.revision > 0 || current.hasUnsavedChanges ? current.data : undefined);
      showPreview(store.previewReplacement(result.data, 'migration'), result.warnings, copy.migrationTitle, result.reports);
    } catch { reportError(copy.migrationError); }
  }, { signal: controller.signal });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]; if (!file || !alive() || busy) return;
    const currentRead = ++readId; clearPreview(); actionMessage = copy.readingFile; render();
    try {
      const text = await file.text(); if (!alive() || currentRead !== readId) return;
      const parsed: unknown = JSON.parse(text);
      const app = typeof parsed === 'object' && parsed !== null && 'app' in parsed ? parsed.app : undefined;
      if (typeof app === 'string' && app.startsWith('hsk1-modular')) {
        showPreview(store.previewBackup(text), [], dataFileCopy(file.name));
      } else {
        const result = compatibility.importLegacy(text, store.snapshot().data, Date.now());
        showPreview(store.previewReplacement(result.data, 'import'), result.warnings, dataFileCopy(file.name, true), result.reports);
      }
    } catch { if (alive() && currentRead === readId) reportError(copy.invalidFile); }
    finally { if (alive() && currentRead === readId) fileInput.value = ''; }
  }, { signal: controller.signal });
  resetAction.addEventListener('click', () => {
    if (!alive() || busy || !resetLesson.value || !resetModule.value) return;
    readId++; clearPreview();
    try {
      const result = compatibility.reset(store.snapshot().data, { module: resetModule.value as ResetModule | 'all',
        lesson: resetLesson.value === 'all' ? null : Number(resetLesson.value) });
      showPreview(store.previewReplacement(result.data, 'reset'), result.warnings, result.title, [], result.removed);
    } catch { reportError(copy.resetPreviewError); }
  }, { signal: controller.signal });
  for (const select of [resetLesson, resetModule]) select.addEventListener('change', () => {
    if (pending?.reason === 'reset') { clearPreview(); actionMessage = copy.scopeChanged; }
    render();
  }, { signal: controller.signal });
  confirm.addEventListener('click', () => { if (pending) {
    const candidate = pending;
    void runWrite(() => store.confirm(candidate, controller.signal), candidate.reason === 'reset' ? 'reset' : 'import');
  } }, { signal: controller.signal });
  cancel.addEventListener('click', () => { readId++; clearPreview(); actionMessage = copy.cancelled; render(); }, { signal: controller.signal });
  exportBackup.addEventListener('click', () => {
    try { download(store.exportBackup(), `hsk1-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`); }
    catch { reportError(copy.exportError); }
  }, { signal: controller.signal });
  exportOriginal.addEventListener('click', () => {
    const original = store.exportOriginal();
    if (original !== null) download(original, 'hsk1-original-record.json');
  }, { signal: controller.signal });
  exportPreview.addEventListener('click', () => {
    if (!pending) return;
    try { download(store.exportPreview(pending), `hsk1-preview-${new Date().toISOString().replace(/[:.]/g, '-')}.json`); }
    catch { reportError(copy.exportPreviewError); }
  }, { signal: controller.signal });
  restore.addEventListener('click', () => { clearPreview(); void runWrite(() => store.restore(controller.signal), 'restore'); }, { signal: controller.signal });
  reload.addEventListener('click', () => { readId++; clearPreview(); store.reloadDiscardingDraft(); actionMessage = copy.reloaded; render(); }, { signal: controller.signal });
  const { mountPairPanel } = await import('../source-activities/pair-panel.ts');
  if (controller.signal.aborted) return { dispose() { panel.remove(); } };
  const pairedPanel = mountPairPanel(panel, await learning(), controller.signal);
  const unsubscribe = store.subscribe(render); render();
  return {
    dispose() {
      if (left) return;
      left = true; readId++; controller.abort(); unsubscribe(); pairedPanel.dispose(); panel.remove(); signal.removeEventListener('abort', abort);
      for (const [url, timer] of urls) { clearTimeout(timer); URL.revokeObjectURL(url); } urls.clear();
    },
  };
}
