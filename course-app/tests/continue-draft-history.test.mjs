import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {configs} from '../src/config.ts';
import {blank, createLearningStore, grade, questionRevision, validateState,
  resolveDraftQuestions, acknowledgeDraftQuestions, captureDraftAnswer,
  resolveListeningDraftQuestion, acknowledgeListeningDraftQuestion, captureListeningDraftAnswer} from '../src/state.ts';
import {commitCourseAttempt} from '../src/attempt-commit.ts';

const clone = value => structuredClone(value);
const memory = () => {
  const values = new Map(), writes = [];
  return {values, writes, getItem: key => values.get(key) ?? null,
    setItem(key, value) {writes.push([key, value]); values.set(key, value);}};
};
const lock = async task => task();
function fixture(level) {
  const lesson = JSON.parse(readFileSync(new URL(`../content/hsk${level}/lesson-01.json`, import.meta.url), 'utf8'));
  const questions = lesson.homework.filter(question => question.part === 'vocabGrammar');
  const listening = clone(lesson.listening[0]);
  const key = lesson.id + ':vocabGrammar';
  const round = {selected: [1], limit: 5, wrongOnly: false, queue: [listening.id], index: 0,
    answers: {}, submitted: {}, playCounts: {}, startedAt: 1000};
  return {questions, listening, key, round, config: configs[level]};
}
for (const level of [2, 3]) {
  test(`HSK${level}: first actual answer freezes the shown questions and later VI edits do not rewrite the draft`, () => {
    const f = fixture(level), before = clone(f.questions), q = f.questions[0];
    const draft = captureDraftAnswer(undefined, f.questions, q.id, q.answer, 1000, true);
    const bytes = JSON.stringify(draft), current = clone(f.questions);
    current[0].prompt.vi = 'SYNTHETIC later wording — not textbook text';
    const resolved = resolveDraftQuestions(current, draft, true);
    assert.equal(resolved.status, 'saved'); assert.deepEqual(resolved.questions, before);
    assert.equal(JSON.stringify(draft), bytes);
    const next = captureDraftAnswer(draft, current, q.id, (q.answer + 1) % q.options.length, 2000, true);
    assert.deepEqual(next.questions, before); assert.equal(next.contentRevision, draft.contentRevision);
    resolved.questions[0].prompt.vi = 'caller mutation'; assert.deepEqual(draft.questions, before);
  });
  test(`HSK${level}: active VI needs explicit legacy draft review without inventing or losing older answers`, () => {
    const f = fixture(level), q = f.questions[0], old = {answers: {[q.id]: q.answer}, updatedAt: 500};
    const bytes = JSON.stringify(old);
    assert.equal(resolveDraftQuestions(f.questions, old, true).status, 'missing');
    assert.throws(() => captureDraftAnswer(old, f.questions, q.id, q.answer, 1000, true), /核对旧草稿/);
    assert.equal(JSON.stringify(old), bytes);
    const reviewed = acknowledgeDraftQuestions(old, f.questions, 1000);
    assert.deepEqual(reviewed.answers, old.answers); assert.equal(reviewed.updatedAt, 1000);
    assert.deepEqual(reviewed.questions, f.questions); assert.equal(resolveDraftQuestions(f.questions, reviewed, true).status, 'saved');
    assert.equal(JSON.stringify(old), bytes);
  });
  test(`HSK${level}: inactive old draft stays editable and can repair incomplete out-of-range answers`, () => {
    const f = fixture(level), first = f.questions[0], second = f.questions[1];
    const old = {answers: {[first.id]: 99, [second.id]: 99}, updatedAt: 500};
    assert.equal(resolveDraftQuestions(f.questions, old).status, 'current');
    const repaired = captureDraftAnswer(old, f.questions, first.id, first.answer, 1000);
    assert.equal(repaired.answers[first.id], first.answer); assert.equal(repaired.answers[second.id], 99);
    const state = blank(f.config); state.drafts[f.key] = repaired;
    assert.deepEqual(validateState(state, f.config).drafts[f.key], repaired);
    const again = captureDraftAnswer(repaired, f.questions, second.id, second.answer, 1001);
    assert.equal(again.answers[second.id], second.answer); assert.deepEqual(old.answers, {[first.id]: 99, [second.id]: 99});
    assert.throws(() => grade(f.questions, again.answers), /完成本部分/);
  });
  test(`HSK${level}: changed grading authority cannot be paired with a saved draft`, () => {
    const f = fixture(level), q = f.questions[0], draft = captureDraftAnswer(undefined, f.questions, q.id, q.answer, 1000);
    for (const mutate of [questions => questions[0].prompt.zh += '变更', questions => questions[0].options.reverse(),
      questions => questions[0].answer = (q.answer + 1) % q.options.length,
      questions => questions[0].source.pdfPage += 1, questions => questions.reverse()]) {
      const current = clone(f.questions); mutate(current);
      const resolved = resolveDraftQuestions(current, draft, true);
      assert.equal(resolved.status, 'incompatible'); assert.deepEqual(resolved.questions, draft.questions);
      assert.throws(() => acknowledgeDraftQuestions(draft, current), /开始新作业/);
      assert.throws(() => captureDraftAnswer(draft, current, q.id, q.answer), /核对旧草稿/);
    }
  });
  test(`HSK${level}: saved draft round-trips backup/import/recovery and rejects malformed snapshot identities atomically`, async () => {
    const f = fixture(level), storage = memory(), store = createLearningStore(f.config, storage, lock);
    const draft = captureDraftAnswer(undefined, f.questions, f.questions[0].id, f.questions[0].answer, 1000);
    store.edit(state => state.drafts[f.key] = draft); assert.equal((await store.save()).ok, true);
    const raw = storage.getItem(f.config.storageKey), backup = store.exportBackup();
    for (const mutate of [d => d.contentRevision = 'wrong', d => d.questions[0].id = 'foreign:q',
      d => d.questions.push(clone(d.questions[0])), d => delete d.questions[0].prompt,
      d => delete d.questions]) {
      const invalid = JSON.parse(backup); mutate(invalid.data.drafts[f.key]);
      assert.throws(() => store.previewBackup(JSON.stringify(invalid)));
      assert.equal(storage.getItem(f.config.storageKey), raw);
    }
    store.edit(state => state.drafts[f.key].answers[f.questions[0].id] = 0); await store.save();
    const beforeImport = store.snapshot().data;
    assert.equal((await store.confirm(store.previewBackup(backup))).ok, true);
    assert.deepEqual(store.snapshot().data.drafts[f.key], draft);
    assert.equal((await store.restore()).ok, true); assert.deepEqual(store.snapshot().data, beforeImport);
  });
  test(`HSK${level}: listening captures individual shown questions and preserves old text through reload`, () => {
    const f = fixture(level), captured = captureListeningDraftAnswer(f.round, f.listening, f.listening.answer, true);
    const current = clone(f.listening); current.prompt.vi = 'SYNTHETIC newer listening prompt';
    const state = blank(f.config); state.listeningRound = captured;
    const restored = validateState(state, f.config).listeningRound;
    assert.equal(resolveListeningDraftQuestion(current, restored, true).status, 'saved');
    assert.deepEqual(resolveListeningDraftQuestion(current, restored, true).question, f.listening);
    assert.equal(captured.questionSnapshots[f.listening.id].contentRevision, questionRevision([f.listening]));
    assert.equal(f.round.questionSnapshots, undefined); assert.deepEqual(f.round.answers, {});
  });
  test(`HSK${level}: older listening choices require review only during active VI; malformed snapshot cannot import`, () => {
    const f = fixture(level), old = {...clone(f.round), answers: {[f.listening.id]: 99}};
    assert.equal(resolveListeningDraftQuestion(f.listening, old, true).status, 'missing');
    assert.throws(() => captureListeningDraftAnswer(old, f.listening, 0, true), /核对旧听力/);
    assert.equal(resolveListeningDraftQuestion(f.listening, old).status, 'current');
    const repaired = captureListeningDraftAnswer(old, f.listening, f.listening.answer);
    assert.equal(repaired.answers[f.listening.id], f.listening.answer); assert.equal(old.answers[f.listening.id], 99);
    const reviewed = acknowledgeListeningDraftQuestion({...old, answers: {[f.listening.id]: 0}}, f.listening);
    assert.equal(reviewed.answers[f.listening.id], 0);
    for (const mutate of [r => r.questionSnapshots[f.listening.id].contentRevision = 'wrong',
      r => r.questionSnapshots['foreign:q'] = r.questionSnapshots[f.listening.id],
      r => r.questionSnapshots[f.listening.id].question.part = 'writing']) {
      const state = blank(f.config); state.listeningRound = clone(reviewed); mutate(state.listeningRound);
      assert.throws(() => validateState(state, f.config));
    }
  });
  test(`HSK${level}: committing a draft cannot substitute a newer VI question behind the saved answers`, async () => {
    const f = fixture(level), storage = memory(), store = createLearningStore(f.config, storage, lock);
    let draft; for (const q of f.questions) draft = captureDraftAnswer(draft, f.questions, q.id, q.answer, 1000);
    store.edit(state => state.drafts[f.key] = draft); await store.save();
    const raw = storage.getItem(f.config.storageKey), current = clone(f.questions); current[0].prompt.vi = 'SYNTHETIC replacement';
    assert.equal(await commitCourseAttempt(store, f.key, grade(current, draft.answers, 2000), 'homework', new AbortController().signal), false);
    assert.equal(storage.getItem(f.config.storageKey), raw); assert.deepEqual(store.snapshot().data.drafts[f.key], draft);
    const attempt = grade(draft.questions, draft.answers, 2000);
    assert.equal(await commitCourseAttempt(store, f.key, attempt, 'homework', new AbortController().signal), true);
    assert.deepEqual(store.snapshot().data.homework[f.key].latest.questions, draft.questions);
  });
  test(`HSK${level}: listening commit freezes its draft question and a rejected substitute writes nothing`, async () => {
    const f = fixture(level), storage = memory(), store = createLearningStore(f.config, storage, lock);
    const round = captureListeningDraftAnswer(f.round, f.listening, f.listening.answer, true);
    store.edit(state => state.listeningRound = round); await store.save();
    const raw = storage.getItem(f.config.storageKey), current = clone(f.listening); current.prompt.vi = 'SYNTHETIC replacement';
    const make = q => grade([q], {[q.id]: q.answer}, 2000), key = f.listening.id + ':individual';
    assert.equal(await commitCourseAttempt(store, key, make(current), 'listening', new AbortController().signal, () => false, round), false);
    assert.equal(storage.getItem(f.config.storageKey), raw); assert.deepEqual(store.snapshot().data.listeningRound.submitted, {});
    assert.equal(await commitCourseAttempt(store, key, make(f.listening), 'listening', new AbortController().signal, () => false, round), true);
    assert.deepEqual(store.snapshot().data.listeningRound.submitted[f.listening.id].questions, [f.listening]);
  });
}
