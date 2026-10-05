import manifestBytes from '../../../content/official-vi-revisions/hsk1-l01-core-20261005.json?raw';
import reviewBytes from '../../../content/official-vi-revisions/hsk1-l01-core-20261005.review.json?raw';
import bookBytes from '../../../content/textbook.json?raw';
import revisionBytes from '../../../content/textbook-display-revisions.json?raw';
import catalogBytes from '../../../content/stage3-catalog.json?raw';
import oldBankBytes from '../../../content/stage2-bank.json?raw';
import newBankBytes from '../../../content/homework30-bank.json?raw';
import indexBytes from '../../../content/course-index.json?raw';
import media from '../../../content/media-references.json';
import { createOfficialViRegistry, defaultOfficialViRegistry, hsk1ViFields, viSHA256, type ViFieldRef } from '../../../src/services/content/official-vi-revisions.ts';
import { createTextbookContent } from '../../../src/services/content/textbook.ts';
import { createVocabularyContent } from '../../../src/services/content/vocabulary.ts';
import { mixedVocabularyDeck, mixedCardFingerprint } from '../../../src/domain/vocabulary/mixed-state.ts';
import { createBrowserAudioService } from '../../../src/services/audio/index.ts';
import { mountVocabulary } from '../../../src/features/textbook/vocabulary.ts';
import { mountText } from '../../../src/features/textbook/text.ts';
import { createCompatibility } from '../../../src/services/storage/compatibility.ts';
import { createStore } from '../../../src/services/storage/index.ts';
import { createHomework30Controller } from '../../../src/features/homework/controller30.ts';
import { getHomework30Bank } from '../../../src/services/content/homework30.ts';
import { projectHomeworkQuestion } from '../../../src/services/content/vi-presentation-state.ts';
import { createReceipt } from '../../../src/features/homework/receipt.ts';
import '../../../src/app/styles.css';
import '../../../src/features/textbook/textbook.css';

interface Change extends ViFieldRef { newValue: string; expectedEffectiveValue: string; lesson: number }
const manifest = JSON.parse(manifestBytes) as { revisionId: string; baselineFiles: { file: string; sha256: string }[]; changes: Change[] };
const rawBytes: Record<string, string> = { 'content/textbook.json': bookBytes, 'content/textbook-display-revisions.json': revisionBytes,
  'content/stage3-catalog.json': catalogBytes, 'content/stage2-bank.json': oldBankBytes, 'content/homework30-bank.json': newBankBytes, 'content/course-index.json': indexBytes };
const values = Object.fromEntries(Object.entries(rawBytes).map(([file, bytes]) => [file, JSON.parse(bytes)]));
const baselineFiles = await Promise.all(manifest.baselineFiles.map(async file => {
  if (!rawBytes[file.file]) throw Error('Candidate baseline is not an actual bundled source.');
  return { file: file.file, sha256: await viSHA256(rawBytes[file.file]!) };
}));
const inputs = { manifestBytes, manifestSHA256: await viSHA256(manifestBytes), reviewBytes, reviewSHA256: await viSHA256(reviewBytes),
  reviewFile: 'content/official-vi-revisions/hsk1-l01-core-20261005.review.json', baselineFiles,
  parentDisplayRevision: values['content/textbook-display-revisions.json'].revision as string,
  fields: hsk1ViFields(values).filter(field => baselineFiles.some(file => file.file === field.baselineFile)) };
const registry = await createOfficialViRegistry(inputs), inactive = defaultOfficialViRegistry();
const book = values['content/textbook.json'], catalog = values['content/stage3-catalog.json'], revisions = values['content/textbook-display-revisions.json'];
const current = createTextbookContent(book, media, catalog, undefined, revisions, registry);
const baseline = createTextbookContent(book, media, catalog, undefined, revisions, inactive);
const vocabulary = await createVocabularyContent(catalog, media, undefined, undefined, book, revisions, registry);
const compatibility = createCompatibility(values['content/stage2-bank.json'], catalog, book);
const store = createStore({ storage: localStorage, blank: compatibility.blank, validate: compatibility.validate });
const bank = getHomework30Bank(), stamp = 1791202800000, audio = createBrowserAudioService();
const host = document.querySelector<HTMLElement>('#candidate-host')!;
let lifetime = new AbortController(), receipt: ReturnType<typeof createReceipt> | undefined;
function clear() { lifetime.abort(); lifetime = new AbortController(); receipt?.dispose(); receipt = undefined; host.replaceChildren(); }
function wordChanges() { return manifest.changes.filter(change => change.component === 'textbook' && /^textbook-l01-v[0-9]+$/.test(change.ownerId)); }
const owners = manifest.changes.map(change => ({ id: change.ownerId, component: change.component }));
const harness = {
  metadata() { return { revisionId: registry.revisionId, defaultRevision: inactive.revisionId, manifestSHA256: inputs.manifestSHA256, proofSHA256: inputs.reviewSHA256,
    baselineFiles, changedOwners: manifest.changes.map(change => ({ ownerId: change.ownerId, component: change.component, old: change.expectedEffectiveValue, shown: change.newValue })), snapshot: registry.snapshot(owners) }; },
  render() {
    clear(); const lesson = current.lessons[0]!;
    const title = document.createElement('p'); title.dataset.candidateTitle = ''; title.textContent = lesson.vn_title; host.append(title);
    const words = document.createElement('section'); words.dataset.candidateWords = ''; host.append(words);
    mountVocabulary(words, { lesson, content: current, audio, signal: lifetime.signal, getMastered: () => ({}), markMastered() {} });
    const texts = document.createElement('section'); texts.dataset.candidateText = ''; host.append(texts);
    let textView: ReturnType<typeof mountText>;
    textView = mountText(texts, { lesson, content: current, audio, signal: lifetime.signal, onSceneChange: scene => textView.updateScene(scene) });
    return { words: wordChanges(), lines: manifest.changes.filter(change => change.component === 'textbook' && change.ownerId.includes('-line-')), baseline: baseline.lessons[0], current: lesson };
  },
  async history() {
    clear(); const prior = createHomework30Controller({ store, bank, lesson: 1, part: 'choice', now: () => stamp, viRegistry: inactive });
    for (const question of prior.read().questions) { if (question.kind !== 'choice') throw Error('History fixture requires actual choice questions.'); prior.answer(question.id, question.answer); }
    if (!prior.submit().ok) throw Error('Baseline history did not submit.');
    const first = structuredClone(prior.read().group!.first);
    if (!prior.restart().ok) throw Error('Baseline history did not restart.');
    const candidate = createHomework30Controller({ store, bank, lesson: 1, part: 'choice', now: () => stamp + 1, viRegistry: registry });
    for (const question of candidate.read().questions) { if (question.kind !== 'choice') throw Error('History fixture requires actual choice questions.'); candidate.answer(question.id, question.answer); }
    if (!candidate.submit().ok || !(await store.save()).ok) throw Error('Candidate-scoped history did not save.');
    const data = store.snapshot().data, group = candidate.read().group!, questions = bank[0]!.choice;
    receipt = createReceipt(host, { lesson: 1, lessonTitle: book.lessons[0].title, part: 'choice', homeworkVersion: '30-v1', questions,
      displayQuestions: { first: questions.map(q => projectHomeworkQuestion(data, '30-v1', 1, 'choice', q, questions, 'first', registry)), latest: questions.map(q => projectHomeworkQuestion(data, '30-v1', 1, 'choice', q, questions, 'latest', registry)) },
      profile: data.homework.profile, first: group.first, latest: group.latest, selected: 'first', onClose() { receipt?.dispose(); } });
    const snapshot = registry.snapshot(owners); const frozen = structuredClone(snapshot);
    if (snapshot) snapshot.fields[0]!.value = 'ephemeral client mutation';
    const rawCards = mixedVocabularyDeck(vocabulary.catalog, [1]).cards;
    const cards = manifest.changes.filter(c => c.component === 'vocabulary').map(change => {
      const raw = rawCards.find(card => card.sourceRecords.some(record => record.id === change.ownerId))!;
      return { id: change.ownerId, expected: change.newValue, shown: vocabulary.displayItem(change.ownerId)?.vi, rawFingerprint: mixedCardFingerprint(raw), displayFingerprint: mixedCardFingerprint(vocabulary.displayCard(raw)) };
    });
    return { firstBeforeCandidate: first, group, backup: JSON.parse(store.exportBackup()), data, freshSnapshot: registry.snapshot(owners), expectedSnapshot: frozen, cards, question: questions[0], defaultRevision: defaultOfficialViRegistry().revisionId };
  },
  async roundTrip() {
    const original = store.snapshot().data, backup = store.exportBackup();
    const storageKey = 'hsk1-l01-candidate-roundtrip';
    const fresh = createStore({ storage: localStorage, storageKey, blank: compatibility.blank, validate: compatibility.validate });
    const result = await fresh.confirm(fresh.previewBackup(backup));
    const disk = localStorage.getItem(storageKey); if (result.ok && !disk) throw Error('Confirmed imported history is absent from real browser storage.');
    return { result, original, restored: fresh.snapshot().data, diskRestored: disk ? JSON.parse(disk).data : null };
  },
  async rejectedBytes() {
    clear(); const rejected: string[] = [];
    for (const [label, input] of [['manifest bytes', { ...inputs, manifestBytes: manifestBytes + ' ' }], ['review bytes', { ...inputs, reviewBytes: reviewBytes + ' ' }]] as const) {
      try { await createOfficialViRegistry(input); throw Error('Tampered bytes were accepted.'); }
      catch (error) { if (!(error instanceof Error) || !error.message.includes('byte hash mismatch')) throw error; rejected.push(label); }
    }
    const status = document.createElement('p'); status.id = 'candidate-rejection'; status.textContent = 'Đã từ chối thay đổi byte của đề xuất và bằng chứng độc lập.'; host.append(status);
    return { rejected, defaultRevision: defaultOfficialViRegistry().revisionId, currentTitle: current.lessons[0]!.vn_title };
  },
};
Object.assign(window, { officialViL01Candidate: harness });
document.body.dataset.ready = 'true';
