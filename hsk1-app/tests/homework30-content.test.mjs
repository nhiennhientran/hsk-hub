import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REVISIONS } from '../tools/homework30-review.mjs';
import { scanContent, questionTargets, normalizeVietnamese } from '../tools/homework30-evidence.mjs';
import { buildHomeworkArtifacts, persistHomeworkArtifacts, LESSON3_GRAMMAR_ADAPTATIONS, LESSON3_ADAPTATION_AUDIT, resolveLegacyEntry } from '../tools/homework30-content.mjs';

const appRoot = fileURLToPath(new URL('../', import.meta.url));
const read = file => JSON.parse(readFileSync(path.join(appRoot, file), 'utf8'));
const bank = read('content/homework30-bank.json');
const mapping = read('docs/homework30-mapping.json');
const audit = read('docs/homework30-content-audit.json');
const inventory = read('docs/homework30-inventory.json');
const stage2 = read('content/stage2-bank.json');
const legacy = read('content/legacy-exercises.json');
const stage3 = read('content/stage3-catalog.json');
const media = read('content/media-references.json');
const parts = { choice: 10, sort: 5, listening: 5, translationChoice: 5, translation: 5 };
const questions = bank.lessons.flatMap(lesson => Object.keys(parts).flatMap(part => lesson[part]));
const byId = new Map(questions.map(question => [question.id, question]));
const stage2Questions = stage2.lessons.flatMap(lesson => ['choice', 'sort', 'translation'].flatMap(part => lesson[part]));
const sourceMaps = {
  'content/stage2-bank.json': new Map(stage2Questions.map(question => [question.id, question])),
  'content/legacy-exercises.json': new Map(legacy.tasks.map(question => [question.id, question])),
};
const sha = value => createHash('sha256').update(value).digest('hex');
// Independent implementation so a changed generator cannot make stale fingerprints pass.
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
const hash = value => sha(canonical(value));
const withoutFingerprint = ({ fingerprint: ignored, ...content }) => content;
const text = value => typeof value === 'string' && !!value.trim();
const normalSentence = value => value.normalize('NFKC').replace(/[\s\p{P}\p{S}]/gu, '').toLowerCase();
const grammarSignature = question => canonical({ prompt: question.prompt, stem: question.stem ?? '', options: question.options, answer: question.answer });

const lockedSources = {
  'content/stage2-bank.json': 'bfd70d38b319362cd14e0da533c0c90a268a7f90b243cfffef23ef6549177ae3',
  'content/legacy-exercises.json': '84b0e7784c06da7b89f224db71d1cb122685d26e184ee41892237d1b2fdd735c',
  'content/stage3-catalog.json': '35a15efbf9cc80c8e4ccb51d154ca8d906b970b13acabb0cc179a64423162913',
};

test('homework v1 has exactly 15 × 30 questions with the approved five-part ratios', () => {
  assert.deepEqual(Object.keys(bank), ['schemaVersion', 'version', 'lessons']);
  assert.equal(bank.schemaVersion, 1); assert.equal(bank.version, 'hsk1-homework-30-v1');
  assert.equal(bank.lessons.length, 15); assert.equal(questions.length, 450);
  assert.deepEqual(bank.lessons.map(lesson => lesson.lesson), Array.from({ length: 15 }, (_, i) => i + 1));
  for (const lesson of bank.lessons) {
    assert.equal(lesson.id, lesson.lesson);
    for (const [part, count] of Object.entries(parts)) {
      assert.equal(lesson[part].length, count, `${lesson.id}:${part}`);
      for (const question of lesson[part]) {
        assert.equal(question.kind, part === 'translationChoice' ? 'choice' : part, question.id);
        assert.equal(question.assessment, part === 'translation' ? 'manual' : 'automatic', question.id);
        assert.equal(question.lesson, lesson.lesson); assert.ok(text(question.prompt) && text(question.skill));
      }
    }
    assert.equal(Object.keys(parts).flatMap(part => lesson[part]).length, 30);
  }
  assert.equal(questions.filter(question => question.assessment === 'automatic').length, 375);
  assert.equal(questions.filter(question => question.assessment === 'manual').length, 75);
  assert.deepEqual(mapping.quota, { lessons: 15, perLesson: 30, total: 450, partsPerLesson: parts, automaticPerLesson: 25, manualPerLesson: 5 });
});

test('all identities are version-scoped, globally unique, and have canonical content fingerprints', () => {
  assert.equal(byId.size, 450); assert.equal(new Set(questions.map(question => question.fingerprint)).size, 450);
  const oldIds = new Set([...stage2Questions, ...legacy.tasks, ...stage3.listening].map(question => question.id));
  for (const lesson of bank.lessons) for (const part of Object.keys(parts)) for (const [index, question] of lesson[part].entries()) {
    assert.equal(question.id, `hw30-v1-l${String(lesson.lesson).padStart(2, '0')}-${part}-${String(index + 1).padStart(2, '0')}`);
    assert.ok(!oldIds.has(question.id));
    assert.equal(question.fingerprint, hash(withoutFingerprint(question)), question.id);
    assert.match(question.provenance.sourceFingerprint, /^[a-f0-9]{64}$/);
  }
});

test('all 300 MC questions have four different options and exactly one keyed correct option', () => {
  const mc = bank.lessons.flatMap(lesson => [...lesson.choice, ...lesson.listening, ...lesson.translationChoice]);
  assert.equal(mc.length, 300);
  for (const question of mc) {
    assert.equal(question.options.length, 4); assert.ok(question.options.every(text));
    // Preserve decimal punctuation: 3,50 and 350 are different amounts.
    assert.equal(new Set(question.options.map(option => option.normalize('NFKC').trim().replace(/\s+/g, ' '))).size, 4, question.id);
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer <= 3);
    assert.equal([0, 1, 2, 3].filter(index => index === question.answer).length, 1);
    assert.ok(!Object.hasOwn(question, 'answers') && !Object.hasOwn(question, 'tokens'), question.id);
    assert.ok(text(question.explanation)); assert.equal(question.optionFeedback.length, 4); assert.ok(question.optionFeedback.every(text));
  }
  for (const lesson of bank.lessons) for (const question of lesson.translationChoice) assert.ok(question.options.every(option => /[\u3400-\u9fff]/.test(option)), question.id);
});

test('manual translation content is prompt-only and cannot leak answers or automatic scoring fields', () => {
  const allowed = ['id', 'lesson', 'kind', 'assessment', 'prompt', 'skill', 'source', 'provenance', 'fingerprint'].sort();
  for (const lesson of bank.lessons) for (const question of lesson.translation) {
    assert.deepEqual(Object.keys(question).sort(), allowed, question.id);
    assert.equal(question.assessment, 'manual'); assert.equal(question.kind, 'translation');
    const source = sourceMaps[question.provenance.sourceFile].get(question.provenance.sourceId);
    const revised = REVISIONS[question.id]?.question;
    assert.equal(question.prompt, revised?.prompt ?? source.prompt); assert.equal(question.skill, revised?.skill ?? source.skill);
    for (const key of ['printPages', 'pdfPages']) assert.deepEqual(question.source[key], source.source[key]);
    if (revised) assert.equal(question.provenance.transformation, 'reviewed-distinct-scenario-v1');
    else assert.deepEqual(question.source, source.source);
  }
});

test('the authoritative mapping exhaustively resolves every question to immutable authority and entry content', () => {
  assert.equal(mapping.selections.length, 450);
  assert.equal(new Set(mapping.selections.map(row => row.questionId)).size, 450);
  for (const selection of mapping.selections) {
    const question = byId.get(selection.questionId); assert.ok(question, selection.questionId);
    assert.equal(question, bank.lessons[selection.lesson - 1][selection.part][selection.position - 1]);
    assert.equal(selection.questionFingerprint, question.fingerprint);
    const source = sourceMaps[selection.sourceFile]?.get(selection.sourceId); assert.ok(source, selection.questionId);
    assert.equal(source.fingerprint, hash(withoutFingerprint(source)), selection.sourceId);
    assert.equal(selection.sourceFingerprint, source.fingerprint); assert.equal(question.provenance.sourceFingerprint, source.fingerprint);
    assert.equal(question.provenance.sourceFile, selection.sourceFile); assert.equal(question.provenance.sourceId, selection.sourceId);
    if (selection.entry) {
      const entry = legacy.entries.find(entry => entry.id === selection.entry.sourceId); assert.ok(entry);
      assert.equal(selection.entry.sourceFingerprint, hash(entry)); assert.equal(selection.entry.oldId, entry.oldId);
      assert.equal(selection.authorityId, entry.authorityId);
      if (entry.authorityId.startsWith('homework:')) { assert.equal(selection.sourceFile, 'content/stage2-bank.json'); assert.equal(entry.authorityId, `homework:${source.id}`); }
      else assert.equal(entry.authorityId, source.id);
      assert.deepEqual(selection.overrides, ['prompt', 'stem', 'meaning', 'explanation'].filter(key => Object.hasOwn(entry, key)));
      if (selection.transformation) {
        const adaptation = LESSON3_GRAMMAR_ADAPTATIONS[entry.id]; assert.ok(adaptation);
        assert.equal(selection.transformation, 'authored-grammar-scenario-v1');
        assert.equal(question.provenance.transformation, selection.transformation);
        assert.equal(selection.adaptationFingerprint, hash(adaptation));
        for (const [key, value] of Object.entries(adaptation)) assert.deepEqual(question[key], value, `${question.id}:${key}`);
      } else {
        for (const key of ['prompt', 'stem', 'meaning', 'skill', 'options', 'answer', 'explanation', 'audio', 'transcript', 'pinyin']) {
          const revision = REVISIONS[question.id]?.question;
          assert.deepEqual(question[key], revision && Object.hasOwn(revision, key) ? revision[key] : Object.hasOwn(entry, key) ? entry[key] : source[key], `${question.id}:${key}`);
        }
        if (REVISIONS[question.id]?.question.optionFeedback) assert.deepEqual(question.optionFeedback, REVISIONS[question.id].question.optionFeedback);
        else if (source.optionFeedback) assert.deepEqual(question.optionFeedback, source.optionFeedback);
        else assert.deepEqual(question.optionFeedback, question.options.map((_, i) => `${i === question.answer ? 'Đúng.' : 'Chưa đúng.'} ${question.explanation}`));
      }
    } else {
      assert.equal(selection.origin, 'existing-homework'); assert.equal(selection.sourceFile, 'content/stage2-bank.json');
      for (const key of ['prompt', 'stem', 'meaning', 'skill', 'options', 'answer', 'answers', 'tokens', 'explanation', 'optionFeedback']) {
        const revision = REVISIONS[question.id]?.question;
        assert.deepEqual(question[key], revision && Object.hasOwn(revision, key) ? revision[key] : source[key], `${question.id}:${key}`);
      }
      if (!REVISIONS[question.id]) assert.deepEqual(question.source, source.source);
    }
  }
  assert.deepEqual(mapping.selections.filter(row => row.origin === 'existing-homework').map(row => row.sourceId).sort(), stage2Questions.map(question => question.id).sort());
});

test('lesson metadata and source labels preserve known origins without inventing legacy textbook pages', () => {
  for (const [index, lesson] of bank.lessons.entries()) {
    const { choice: ignoredChoice, sort: ignoredSort, translation: ignoredTranslation, ...expected } = stage2.lessons[index];
    const { choice: ignoredNewChoice, sort: ignoredNewSort, listening: ignoredListening, translationChoice: ignoredTranslationChoice, translation: ignoredNewTranslation, ...actual } = lesson;
    assert.deepEqual(actual, expected);
  }
  for (const question of questions) {
    assert.ok(text(question.source.label)); assert.ok(Array.isArray(question.source.printPages)); assert.ok(Array.isArray(question.source.pdfPages));
    assert.equal(question.source.printPages.length, question.source.pdfPages.length);
    assert.ok([...question.source.printPages, ...question.source.pdfPages].every(page => Number.isInteger(page) && page > 0));
    const selection = mapping.selections.find(row => row.questionId === question.id);
    if (selection.entry) {
      const entry = legacy.entries.find(entry => entry.id === selection.entry.sourceId);
      assert.deepEqual(question.source.printPages, []); assert.deepEqual(question.source.pdfPages, []);
      assert.ok(question.source.label.includes(entry.source.file) && question.source.label.includes(String(entry.source.line)));
      assert.ok(!question.source.label.includes('Giáo trình')); assert.equal(question.source.commit, entry.source.commit);
    }
  }
});

test('all listening audio intervals, transcripts and pinyin are preserved, including the corrected lesson-10 clip', () => {
  const tracks = new Map(media.originalTracks.map(track => [track.id, track]));
  for (const lesson of bank.lessons) for (const question of lesson.listening) {
    const source = sourceMaps[question.provenance.sourceFile].get(question.provenance.sourceId);
    assert.deepEqual(question.audio, source.audio); assert.equal(question.transcript, source.transcript); assert.equal(question.pinyin, source.pinyin);
    assert.ok(text(question.transcript) && text(question.pinyin));
    const track = tracks.get(question.audio.track); assert.ok(track, question.id); assert.equal(track.lesson, lesson.lesson);
    assert.ok(question.audio.start >= 0 && question.audio.end > question.audio.start && question.audio.end <= track.duration_s);
  }
  const corrected = bank.lessons[9].listening[3];
  assert.equal(corrected.provenance.sourceId, 'legacy:l10-listening-04');
  assert.equal(corrected.transcript, '我想买两斤苹果。'); assert.equal(corrected.pinyin, 'Wǒ xiǎng mǎi liǎng jīn píngguǒ.');
  assert.ok(!JSON.stringify(bank).includes('data:audio/'));
});

test('lesson-3 authored scenarios have distinct propositions and individual Chinese/Vietnamese distractor checks', () => {
  const lesson = bank.lessons[2], adapted = lesson.choice.slice(5);
  assert.equal(adapted.length, 5);
  assert.equal(new Set(lesson.choice.map(grammarSignature)).size, 10);
  const expectedAnswers = ['这是谁？', '她工作还很忙。', '这是我姐姐的中文老师。', '她不是我女朋友。', '姐姐很想我们。'];
  const expectedMeanings = ['Đây là ai?', 'Cô ấy vẫn rất bận công việc.', 'Đây là giáo viên tiếng Trung của chị gái tôi.', 'Cô ấy không phải là bạn gái của tôi.', 'Chị gái rất nhớ chúng tôi.'];
  const retainedSentenceTargets = Object.keys(parts).flatMap(part => lesson[part].filter(question => !adapted.includes(question)).flatMap(question => {
    const values = part === 'sort' ? question.answers : part === 'listening' ? [question.transcript] : ['choice', 'translationChoice'].includes(part) ? [question.options[question.answer]] : [];
    return values.flatMap(value => value.split(/[。！？!?；;\n]+/).map(normalSentence));
  }));
  for (const [index, question] of adapted.entries()) {
    const source = sourceMaps[question.provenance.sourceFile].get(question.provenance.sourceId);
    const selection = mapping.selections.find(row => row.questionId === question.id);
    assert.equal(source.kind, 'sort'); assert.equal(question.options[question.answer], expectedAnswers[index]);
    assert.equal(question.meaning, expectedMeanings[index]);
    assert.ok(!source.answers.map(normalSentence).includes(normalSentence(expectedAnswers[index])));
    assert.ok(!retainedSentenceTargets.includes(normalSentence(expectedAnswers[index])), question.id);
    assert.ok(lesson.translation.every(manual => normalSentence(manual.prompt) !== normalSentence(question.meaning)), question.id);
    assert.equal(new Set(question.optionFeedback).size, 4); assert.ok(question.optionFeedback.every(feedback => feedback.length > 30));
    assert.notEqual(question.skill, source.skill); assert.ok(selection.substantiveChange.length > 60);
    assert.equal(selection.substantiveChange, LESSON3_ADAPTATION_AUDIT[selection.entry.sourceId].change);
    for (const reference of selection.supportingVocabulary) {
      const word = stage3.vocabulary.find(word => word.id === reference.sourceId);
      assert.ok(word); assert.equal(word.lesson, 3); assert.equal(reference.sourceFingerprint, word.fingerprint);
      assert.equal(reference.zh, word.zh); assert.equal(reference.vi, word.vi);
    }
  }
  // Structural/semantic guardrails for each authored distractor set. The linked
  // evidence includes the individual Vietnamese explanation for every option.
  assert.deepEqual(adapted[0].options, ['这是哪国人？', '这是谁？', '这是我姐姐。', '这是谁吗？']);
  assert.ok(adapted[1].options.filter((_, i) => i !== adapted[1].answer).every(option => !option.includes('还很忙')));
  assert.ok(adapted[2].options.filter((_, i) => i !== adapted[2].answer).every(option => !option.startsWith('这是我姐姐的')));
  assert.ok(adapted[3].options.filter((_, i) => i !== adapted[3].answer).every(option => !option.includes('不是')));
  assert.equal(adapted[4].options[0], '我们很想姐姐。'); // Reverses the subject/object deliberately.
  assert.ok(adapted[4].options.filter((_, i) => i !== adapted[4].answer).every(option => !option.includes('很想我们')));
  for (const current of bank.lessons) {
    const mc = [...current.choice, ...current.listening, ...current.translationChoice];
    assert.equal(new Set(mc.map(grammarSignature)).size, mc.length, `Repeated MC question core in lesson ${current.lesson}`);
  }
  const archived = mapping.maintenanceArchive.entries.filter(entry => entry.lesson === 3 && entry.group === 'choice');
  assert.equal(archived.length, 5); assert.ok(archived.every(entry => entry.reason === 'shared-choice-core-already-present-in-existing-homework'));
});

test('450-item inventory and exhaustive evidence track revisions and only three explicit reinforcement exceptions', () => {
  assert.equal(inventory.total, 450); assert.equal(inventory.questions.length, 450);
  assert.deepEqual(inventory.questions.map(row => row.questionId).sort(), questions.map(question => question.id).sort());
  for (const row of inventory.questions) {
    const question = byId.get(row.questionId); assert.equal(row.prompt, question.prompt); assert.equal(row.skill, question.skill);
    assert.equal(row.fingerprint, question.fingerprint); assert.deepEqual(row.provenance, question.provenance);
    for (const field of ['answer', 'answers', 'reference', 'accepted', 'sampleAnswer', 'modelAnswer']) assert.ok(!Object.hasOwn(row, field));
  }
  assert.equal(audit.status, 'independently-reviewed');
  assert.equal(audit.independentReview.status, 'passed');
  assert.equal(audit.independentReview.bankSha256, sha(readFileSync(path.join(appRoot, 'content/homework30-bank.json'))));
  assert.equal(audit.lessonCoverage.length, 15); assert.equal(audit.lessonCoverage.flatMap(lesson => lesson.skills).length, 450);
  assert.deepEqual(audit.summary, { lessons: 15, questions: 450, automatic: 375, manual: 75, versionOnlyRevisions: 191, initialReviewedCases: 160, exactRepeatedMcRecords: 0, sameLessonLiteralGroups: 2, crossLessonLiteralGroups: 1, unreviewedLiteralGroups: 0, exactVietnameseManualExposureFindings: 0 });
  assert.deepEqual(audit.exactRepeatedMcRecords, []); assert.equal(audit.retainedLiteralRecurrences.length, 3);
  assert.deepEqual(audit.exactVietnameseManualExposureFindings, []);
  const scan = scanContent(bank);
  assert.deepEqual(scan.overlaps, audit.retainedLiteralRecurrences);
  assert.deepEqual(scan.unresolvedOverlaps, []); assert.deepEqual(scan.exactVietnameseManualLeaks, []);
  for (const overlap of audit.retainedLiteralRecurrences) {
    assert.ok(overlap.rationale.length > 150); assert.equal(overlap.disposition, 'reviewed-distinct-objective-reinforcement');
    for (const occurrence of overlap.occurrences) {
      const question = byId.get(occurrence.questionId);
      assert.ok(questionTargets(question, occurrence.part).some(target => target.normalized === overlap.normalized));
    }
  }
  assert.equal(audit.initialCaseDispositions.length, 160);
  assert.equal(audit.manualMeaningReview.length, 75);
});

test('all 191 reviewed overlays have resolved current-or-earlier scope and exact public content change records', () => {
  const textbook = read('content/textbook.json');
  const records = new Map([...stage3.vocabulary, ...textbook.lessons.flatMap(lesson => [...lesson.grammar, ...lesson.scenes.flatMap(scene => scene.lines)])].map(record => [record.id, record]));
  assert.equal(Object.keys(REVISIONS).length, 191); assert.equal(audit.authoredRevisions.length, 191);
  assert.equal(mapping.authoredRevisionCount, 191);
  for (const revision of audit.authoredRevisions) {
    const question = byId.get(revision.questionId), authored = REVISIONS[revision.questionId];
    assert.ok(authored && revision.reason.length > 20 && revision.changedFields.length > 0);
    assert.equal(revision.revisionFingerprint, hash(authored.question));
    assert.equal(question.provenance.revisionFingerprint, revision.revisionFingerprint);
    assert.equal(question.provenance.transformation, 'reviewed-distinct-scenario-v1');
    assert.equal(revision.revisedObjective, question.skill);
    for (const [key, value] of Object.entries(authored.question)) assert.deepEqual(question[key], value, `${question.id}:${key}`);
    const scope = revision.scope;
    assert.ok(scope.vocabularyEvidence.length + scope.textEvidence.length > 0);
    for (const ref of [...scope.vocabularyEvidence, ...scope.grammarEvidence, ...scope.textEvidence]) {
      assert.ok(ref.lesson <= question.lesson, `${question.id}:${ref.sourceId}`);
      const record = records.get(ref.sourceId); assert.ok(record, ref.sourceId);
      assert.equal(ref.sourceFingerprint, record.fingerprint, ref.sourceId);
    }
    if (question.assessment === 'manual') {
      assert.ok(revision.manualRubric); assert.ok(!revision.optionChecks && !revision.sortingChecks);
      for (const key of ['answer', 'answers', 'modelAnswer', 'acceptedAnswers', 'correctChinese']) assert.ok(!Object.hasOwn(revision, key));
    } else if (question.options) {
      assert.equal(revision.optionChecks.length, 4); assert.equal(revision.optionChecks.filter(option => option.keyedCorrect).length, 1);
      for (const option of revision.optionChecks) { assert.equal(option.option, question.options[option.index]); assert.equal(option.rationaleVi, question.optionFeedback[option.index]); }
    } else assert.deepEqual(revision.sortingChecks.acceptedExpressions, question.answers);
  }
});

test('new sorting expressions are exact permutations of their own tokens, including all accepted variants', () => {
  function order(tokens, answer, used = [], prefix = '') {
    const target = normalSentence(answer);
    if (used.length === tokens.length) return prefix === target ? used : null;
    for (let index = 0; index < tokens.length; index++) if (!used.includes(index)) {
      const next = prefix + normalSentence(tokens[index]);
      if (target.startsWith(next)) { const found = order(tokens, answer, [...used, index], next); if (found) return found; }
    }
    return null;
  }
  for (const lesson of bank.lessons) for (const question of lesson.sort) for (const answer of question.answers) {
    const found = order(question.tokens, answer); assert.ok(found, `${question.id}: ${answer}`);
    assert.equal(new Set(found).size, question.tokens.length);
    assert.equal(normalSentence(found.map(index => question.tokens[index]).join('')), normalSentence(answer));
  }
});

test('duplicate/leak regression checks catch reordered MC options, completed clozes and wrong-option/manual exposure', () => {
  const duplicate = structuredClone(bank), original = duplicate.lessons[0].choice[0], target = duplicate.lessons[0].choice[5];
  Object.assign(target, { prompt: original.prompt, stem: original.stem, options: [...original.options].reverse(), answer: 3 - original.answer });
  assert.ok(scanContent(duplicate).repeatedMcCores.some(ids => ids.includes(original.id) && ids.includes(target.id)));
  const cloze = structuredClone(bank), sort = cloze.lessons[8].sort[3], mc = cloze.lessons[8].choice[7];
  const last = sort.tokens.at(-1); mc.stem = sort.answers[0].replace(last, '___'); mc.options = [last, '错误甲', '错误乙', '错误丙']; mc.answer = 0;
  assert.ok(scanContent(cloze).unresolvedOverlaps.some(group => group.occurrences.some(row => row.questionId === sort.id) && group.occurrences.some(row => row.questionId === mc.id)));
  const leak = structuredClone(bank), manual = leak.lessons[0].translation[0], automatic = leak.lessons[14].choice[0];
  automatic.options[(automatic.answer + 1) % 4] = manual.prompt;
  assert.ok(scanContent(leak).exactVietnameseManualLeaks.some(row => row.manualId === manual.id && row.automaticId === automatic.id && row.scope === 'cross-lesson' && row.field === 'options'));
  assert.equal(normalizeVietnamese('Năm sau con gái tôi sẽ học trung học.'), normalizeVietnamese('Năm sau con gái tôi học trung học.'));
  assert.equal(normalizeVietnamese('Xin chào mọi người!'), normalizeVietnamese('Chào mọi người.'));
  assert.equal(audit.initialCaseDispositions.filter(item => item.changedQuestionIds.length === 0).length, 0);
});

test('mapping accounts for every unselected comprehensive and pilot entry and standalone authority', () => {
  const selected = mapping.selections.filter(row => row.entry).map(row => row.entry.sourceId);
  const archived = mapping.maintenanceArchive.entries.map(row => row.entryId);
  assert.equal(selected.length, 225); assert.equal(archived.length, 105);
  assert.equal(new Set([...selected, ...archived]).size, 330);
  assert.deepEqual([...selected, ...archived].sort(), legacy.entries.map(entry => entry.id).sort());
  assert.equal(mapping.maintenanceArchive.entries.filter(entry => entry.set === 'original').length, 75);
  assert.equal(mapping.maintenanceArchive.entries.filter(entry => entry.set === 'pilot').length, 30);
  assert.equal(mapping.maintenanceArchive.entries.filter(entry => entry.set === 'original' && entry.group === 'sort').length, 70);
  for (const row of mapping.maintenanceArchive.entries) {
    const entry = legacy.entries.find(entry => entry.id === row.entryId); assert.equal(row.entryFingerprint, hash(entry));
    const authority = sourceMaps[row.sourceFile].get(row.sourceId); assert.equal(row.sourceFingerprint, authority.fingerprint);
  }
  const usedTasks = new Set(mapping.selections.filter(row => row.sourceFile === 'content/legacy-exercises.json').map(row => row.sourceId));
  const archivedTasks = mapping.maintenanceArchive.tasks.map(row => row.sourceId);
  assert.equal(archivedTasks.length, 95); assert.equal(new Set([...usedTasks, ...archivedTasks]).size, 315);
  assert.deepEqual([...usedTasks, ...archivedTasks].sort(), legacy.tasks.map(question => question.id).sort());
  assert.deepEqual(mapping.independentSources.listening, stage3.listening.map(question => ({ sourceId: question.id, sourceFingerprint: question.fingerprint })));
  assert.deepEqual(mapping.independentSources.vocabulary, stage3.vocabulary.map(word => ({ sourceId: word.id, sourceFingerprint: word.fingerprint })));
  assert.equal(mapping.maintenanceArchive.oral.length, legacy.oral.length);
  assert.equal(mapping.maintenanceArchive.passages.length, Object.keys(legacy.passages).length);
});

test('comprehensive shared-reference resolver preserves overrides, option order and correct-answer identity', () => {
  const question = { id: 'fixture', lesson: 1, options: ['A', 'B', 'C', 'D'], answer: 1, optionFeedback: ['a', 'b', 'c', 'd'], prompt: 'Authority prompt', explanation: 'Authority explanation', fingerprint: 'fixed' };
  const authorities = new Map([['homework:fixture', { sourceFile: 'content/stage2-bank.json', question }]]);
  const entry = { id: 'original:fixture', lesson: 1, authorityId: 'homework:fixture', prompt: 'Entry prompt', explanation: 'Entry explanation', optionOrder: [2, 0, 3, 1] };
  const result = resolveLegacyEntry(entry, authorities);
  assert.deepEqual(result.question.options, ['C', 'A', 'D', 'B']); assert.equal(result.question.answer, 3);
  assert.deepEqual(result.question.optionFeedback, ['c', 'a', 'd', 'b']); assert.equal(result.question.prompt, 'Entry prompt'); assert.equal(result.question.explanation, 'Entry explanation');
  assert.equal(result.reference.sourceId, 'fixture'); assert.equal(question.answer, 1);
  assert.throws(() => resolveLegacyEntry({ ...entry, authorityId: 'missing' }, authorities), /Unresolved comprehensive authority/);
  assert.throws(() => resolveLegacyEntry({ ...entry, lesson: 2 }, authorities), /Cross-lesson/);
  assert.throws(() => resolveLegacyEntry({ ...entry, optionOrder: [0, 0, 2, 3] }, authorities), /Invalid option order/);
});

test('all three source banks remain byte-identical and generated artifacts are reproducible', () => {
  for (const [file, expected] of Object.entries(lockedSources)) assert.equal(sha(readFileSync(path.join(appRoot, file))), expected, file);
  assert.deepEqual(mapping.sourceFiles, Object.entries(lockedSources).map(([sourceFile, sha256]) => ({ sourceFile, sha256 })));
  const generated = buildHomeworkArtifacts(appRoot);
  assert.deepEqual(generated['content/homework30-bank.json'], bank); assert.deepEqual(generated['docs/homework30-mapping.json'], mapping);
  persistHomeworkArtifacts(generated, appRoot, true);
});

test('check mode rejects drift without repairing it and generation refuses changed source bytes', () => {
  const temporary = mkdtempSync(path.join(os.tmpdir(), 'hsk1-homework30-'));
  try {
    for (const file of [...Object.keys(lockedSources), 'content/textbook.json', 'docs/homework30-review-cases.json']) { mkdirSync(path.dirname(path.join(temporary, file)), { recursive: true }); writeFileSync(path.join(temporary, file), readFileSync(path.join(appRoot, file))); }
    const generated = buildHomeworkArtifacts(temporary); persistHomeworkArtifacts(generated, temporary, false);
    const target = path.join(temporary, 'content/homework30-bank.json'); writeFileSync(target, '{}\n');
    assert.throws(() => persistHomeworkArtifacts(generated, temporary, true), /Generated homework artifact is stale/);
    assert.equal(readFileSync(target, 'utf8'), '{}\n');
    const source = path.join(temporary, 'content/stage2-bank.json'); writeFileSync(source, readFileSync(source, 'utf8') + ' ');
    assert.throws(() => buildHomeworkArtifacts(temporary), /Immutable source bank changed/);
  } finally { rmSync(temporary, { recursive: true, force: true }); }
});
