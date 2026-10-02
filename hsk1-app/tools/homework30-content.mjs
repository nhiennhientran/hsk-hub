import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REVISIONS, applyContentRevision } from './homework30-review.mjs';
import { buildContentEvidence } from './homework30-evidence.mjs';

/** Materialize the versioned homework snapshot; never rewrite its source banks. */
export const VERSION = 'hsk1-homework-30-v1';
export const PART_COUNTS = Object.freeze({ choice: 10, sort: 5, listening: 5, translationChoice: 5, translation: 5 });
export const SOURCE_HASHES = Object.freeze({
  'content/stage2-bank.json': 'bfd70d38b319362cd14e0da533c0c90a268a7f90b243cfffef23ef6549177ae3',
  'content/legacy-exercises.json': '84b0e7784c06da7b89f224db71d1cb122685d26e184ee41892237d1b2fdd735c',
  'content/stage3-catalog.json': '35a15efbf9cc80c8e4ccb51d154ca8d906b970b13acabb0cc179a64423162913',
});
export const APP_ROOT = fileURLToPath(new URL('../', import.meta.url));
export const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  : JSON.stringify(value);
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const fingerprint = value => sha256(canonical(value));
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const pad = value => String(value).padStart(2, '0');
const clone = value => structuredClone(value);
const withoutFingerprint = ({ fingerprint: ignored, ...content }) => content;
const sourceReference = (sourceFile, question) => ({ sourceFile, sourceId: question.id, sourceFingerprint: question.fingerprint });
const overrideFields = ['prompt', 'stem', 'meaning', 'explanation'];
const questionFields = ['prompt', 'stem', 'meaning', 'skill', 'options', 'answer', 'explanation', 'optionFeedback', 'tokens', 'answers', 'audio', 'transcript', 'pinyin'];
const hasText = value => typeof value === 'string' && value.trim().length > 0;

// Lesson 3's five original MC entries alias retained homework choices. The
// replacements use those unselected comprehensive sorting entries as a grammar
// starting point, but change scenario/target substantially instead of repeating
// the retained sorting answers in another widget. Supporting vocabulary is
// independently referenced from the corrected stage-3 catalogue below.
export const LESSON3_GRAMMAR_ADAPTATIONS = Object.freeze({
  'original:l03-sort-01': {
    prompt: 'Bạn chưa biết người trong ảnh là ai. Chọn câu hỏi về danh tính, không hỏi quốc tịch và không tự khẳng định quan hệ.',
    meaning: 'Đây là ai?', skill: '谁问身份而非哪国人问国籍',
    options: ['这是哪国人？', '这是谁？', '这是我姐姐。', '这是谁吗？'], answer: 1,
    explanation: '这是谁？ hỏi “Đây là ai?”. 谁 dùng để hỏi danh tính; không thêm 吗 vào câu hỏi đã có 谁 theo mẫu này.',
    optionFeedback: ['这是哪国人？ hỏi người trong ảnh là người nước nào, không hỏi danh tính như yêu cầu.', 'Đúng: 这是谁？ hỏi “Đây là ai?”, phù hợp khi chưa biết người trong ảnh.', '这是我姐姐。 khẳng định “Đây là chị gái tôi”; bạn chưa biết người trong ảnh nên chưa thể khẳng định như vậy.', 'Câu hỏi đã dùng 谁 thì không thêm 吗 theo mẫu hỏi danh tính này; dùng 这是谁？'],
  },
  'original:l03-sort-02': {
    prompt: 'Công việc của cô ấy trước đây rất bận và hiện vẫn như vậy. Chọn câu trần thuật có trật tự đúng để diễn tả trạng thái tiếp diễn.',
    meaning: 'Cô ấy vẫn rất bận công việc.', skill: '还的持续状态与还很忙语序',
    options: ['她工作很还忙。', '她工作还忙很。', '她工作还很忙。', '她工作吗还忙。'], answer: 2,
    explanation: '还 nghĩa là “vẫn”, đứng trước 很忙: 她工作还很忙。 Câu này khẳng định công việc của cô ấy vẫn rất bận, không hỏi bằng 吗.',
    optionFeedback: ['还 phải đứng trước 很忙, không chen giữa 很 và 忙.', '很 bổ nghĩa mức độ cho 忙 nên đứng trước 忙, không đứng cuối câu.', 'Đúng: 她工作还很忙 nói rằng cô ấy vẫn rất bận công việc.', '吗 không đứng giữa câu; đề bài yêu cầu câu trần thuật nên không dùng 吗.'],
  },
  'original:l03-sort-03': {
    prompt: 'Bạn giới thiệu giáo viên tiếng Trung của chị gái mình. Chọn câu có trật tự đúng để nói “Đây là giáo viên tiếng Trung của chị gái tôi”.',
    meaning: 'Đây là giáo viên tiếng Trung của chị gái tôi.', skill: '名词短语我姐姐加的表示所属',
    options: ['这是我姐姐的中文老师。', '这是我姐姐是中文老师。', '这我姐姐的中文老师是。', '这是的我姐姐中文老师。'], answer: 0,
    explanation: '我姐姐 là “chị gái tôi”. Thêm 的 để nối người sở hữu với 中文老师: 我姐姐的中文老师. Đặt cả cụm sau 这是.',
    optionFeedback: ['Đúng: 这是 + 我姐姐的中文老师 giới thiệu giáo viên tiếng Trung của chị gái tôi.', 'Dùng 的 sau 我姐姐 để chỉ quan hệ sở hữu; không dùng 是 để nối 我姐姐 với 中文老师.', '是 đứng sau 这 và trước cả cụm 我姐姐的中文老师, không đứng cuối câu.', '的 phải đứng sau người sở hữu 我姐姐, không đứng trước cụm này.'],
  },
  'original:l03-sort-04': {
    prompt: 'Một người nhầm chị gái bạn là bạn gái của bạn. Chọn câu phủ định để đính chính rằng cô ấy không phải là bạn gái của bạn.',
    meaning: 'Cô ấy không phải là bạn gái của tôi.', skill: '不是否定身份关系而非不太否定程度',
    options: ['她不我女朋友是。', '她是我不女朋友。', '她是我女朋友。', '她不是我女朋友。'], answer: 3,
    explanation: 'Phủ định quan hệ dùng 不是: 她 + 不是 + 我女朋友. Câu đúng là “Cô ấy không phải là bạn gái của tôi”, không phải mẫu 不太忙 chỉ mức độ.',
    optionFeedback: ['Đặt 是 ngay sau 不 để tạo 不是; không tách 不是 bằng 我女朋友.', '不 phải đứng trước 是 để phủ định quan hệ, không chen vào cụm 我女朋友.', '她是我女朋友。 khẳng định cô ấy là bạn gái của tôi, trái với điều cần đính chính.', 'Đúng: 她不是我女朋友。 phủ định quan hệ bạn gái.'],
  },
  'original:l03-sort-05': {
    prompt: 'Chị gái là người nhớ, còn chúng tôi là những người được nhớ. Chọn câu có trật tự đúng với thông tin này.',
    meaning: 'Chị gái rất nhớ chúng tôi.', skill: '想的主语与宾语方向区别',
    options: ['我们很想姐姐。', '姐姐很想吗我们。', '姐姐很想我们。', '姐姐很我们想。'], answer: 2,
    explanation: 'Người nhớ 姐姐 là chủ ngữ, đứng trước 很想. Những người được nhớ 我们 là tân ngữ, đứng sau 想: 姐姐很想我们。',
    optionFeedback: ['我们很想姐姐。 nói “Chúng tôi rất nhớ chị gái”, đảo ngược người nhớ và người được nhớ so với đề bài.', '吗 không đứng giữa 想 và tân ngữ 我们; đây là câu trần thuật, không phải câu hỏi.', 'Đúng: 姐姐 là người nhớ và 我们 là những người được nhớ.', 'Không đặt 我们 giữa 很 và 想; dùng 很想我们.'],
  },
});
export const LESSON3_ADAPTATION_AUDIT = Object.freeze({
  'original:l03-sort-01': { change: 'From declaring one’s Thai nationality to asking who an unidentified person in a photo is; distinguish identity from nationality and a known relationship.', vocabulary: ['这', '谁', '哪', '国', '人', '姐姐'], sourceTarget: '我是泰国人。' },
  'original:l03-sort-02': { change: 'From a yes/no nationality question to a third-person declarative statement of continued busyness; test 还 before 很忙, not adding 吗.', vocabulary: ['她', '工作', '还', '忙', '吗'], sourceTarget: '你是中国人吗？' },
  'original:l03-sort-03': { change: 'From my teacher to my sister’s teacher; construct possession from the full noun phrase 我姐姐 + 的 and introduce with 这.', vocabulary: ['这', '姐姐', '的', '中文'], sourceTarget: '她是我的中文老师。' },
  'original:l03-sort-04': { change: 'From low degree of busyness (不太忙) to denying a mistaken girlfriend relationship (不是); distinguish identity negation from degree.', vocabulary: ['她', '女朋友', '姐姐'], sourceTarget: '我姐姐不太忙。' },
  'original:l03-sort-05': { change: 'From adding 也 to a first-person plural expression of longing to distinguishing the subject and object of 想 in a different relationship.', vocabulary: ['姐姐', '想', '我们'], sourceTarget: '我们也很想你。' },
});
const assertFingerprint = question => assert.equal(question.fingerprint, fingerprint(withoutFingerprint(question)), `Source record fingerprint drift: ${question.id}`);

/** Resolve the catalogue's authority separately from entry-specific wording/order. */
export function resolveLegacyEntry(entry, authorities) {
  const authority = authorities.get(entry.authorityId);
  assert.ok(authority, `Unresolved comprehensive authority: ${entry.id} -> ${entry.authorityId}`);
  assert.equal(authority.question.lesson, entry.lesson, `Cross-lesson authority: ${entry.id}`);
  if (entry.migration) assert.equal(entry.migration.authorityFingerprint, authority.question.fingerprint, `Comprehensive reference drift: ${entry.id}`);
  const question = clone(authority.question);
  for (const key of overrideFields) if (Object.hasOwn(entry, key)) question[key] = clone(entry[key]);
  if (entry.optionOrder) {
    assert.equal(new Set(entry.optionOrder).size, question.options.length, `Invalid option order: ${entry.id}`);
    assert.ok(entry.optionOrder.every(index => Number.isInteger(index) && index >= 0 && index < question.options.length), `Invalid option index: ${entry.id}`);
    const originalAnswer = question.answer;
    question.options = entry.optionOrder.map(index => question.options[index]);
    if (question.optionFeedback) question.optionFeedback = entry.optionOrder.map(index => question.optionFeedback[index]);
    question.answer = entry.optionOrder.indexOf(originalAnswer);
  }
  if (entry.tokenOrder) question.tokens = entry.tokenOrder.map(index => question.tokens[index]);
  return { ...authority, question, reference: sourceReference(authority.sourceFile, authority.question) };
}

function legacySource(entry) {
  // The historical entry identifies a source-code location, not a textbook page.
  // Only explicit, independently stored page metadata may populate page arrays.
  const origin = clone(entry.source);
  const printPages = Number.isInteger(origin.page) ? [origin.page] : [];
  const pdfPages = Number.isInteger(origin.pdfPage) ? [origin.pdfPage] : [];
  return {
    label: `Luyện tổng hợp đã hiệu chỉnh · ${origin.file}${origin.line ? `, dòng ${origin.line}` : ''}`,
    printPages, pdfPages, ...origin,
  };
}

function materializeQuestion(lesson, part, position, question, reference, source) {
  const content = {
    id: `hw30-v1-l${pad(lesson)}-${part}-${pad(position)}`,
    lesson, kind: part === 'translationChoice' ? 'choice' : part,
    assessment: part === 'translation' ? 'manual' : 'automatic',
    ...Object.fromEntries(questionFields.filter(key => Object.hasOwn(question, key)).map(key => [key, clone(question[key])])),
    source: clone(source), provenance: clone(reference),
  };
  assert.ok(hasText(content.skill), `Missing skill: ${content.id}`);
  if (part === 'translation') {
    // Fail rather than silently stripping an answer accidentally added upstream.
    for (const key of ['answer', 'answers', 'accepted', 'incorrect', 'options', 'explanation', 'explain', 'reference', 'modelAnswer', 'sampleAnswer', 'rubric']) {
      assert.ok(!Object.hasOwn(question, key), `Manual answer leakage: ${question.id}:${key}`);
    }
  }
  if (['choice', 'listening', 'translationChoice'].includes(part)) {
    assert.ok(Array.isArray(content.options) && content.options.length === 4 && new Set(content.options).size === 4, `Four distinct options required: ${content.id}`);
    assert.ok(Number.isInteger(content.answer) && content.answer >= 0 && content.answer <= 3, `Invalid correct option: ${content.id}`);
    assert.ok(hasText(content.explanation), `Missing explanation: ${content.id}`);
    // Existing authored per-option feedback wins. Older questions carry one reviewed
    // explanation; use that exact explanation rather than inventing new diagnoses.
    content.optionFeedback ??= content.options.map((_, index) => `${index === content.answer ? 'Đúng.' : 'Chưa đúng.'} ${content.explanation}`);
    assert.ok(content.optionFeedback.length === 4 && content.optionFeedback.every(hasText), `Missing feedback: ${content.id}`);
  }
  if (part === 'listening') {
    assert.ok(content.audio && hasText(content.transcript) && hasText(content.pinyin), `Missing listening evidence: ${content.id}`);
  }
  return { ...content, fingerprint: fingerprint(content) };
}

const normalSentence = value => value.normalize('NFKC').replace(/[\s\p{P}\p{S}]/gu, '').toLowerCase();
const sentenceFragments = value => value.split(/[。！？!?；;\n]+/).map(value => value.trim()).filter(value => (value.match(/[\u3400-\u9fff]/g) ?? []).length >= 3);

export function buildHomeworkArtifacts(appRoot = APP_ROOT) {
  const sources = Object.fromEntries(Object.entries(SOURCE_HASHES).map(([file, expected]) => {
    const bytes = readFileSync(path.join(appRoot, file));
    assert.equal(sha256(bytes), expected, `Immutable source bank changed: ${file}`);
    return [file, JSON.parse(bytes.toString('utf8'))];
  }));
  const stage2 = sources['content/stage2-bank.json'];
  const legacy = sources['content/legacy-exercises.json'];
  const stage3 = sources['content/stage3-catalog.json'];
  const textbookBytes = readFileSync(path.join(appRoot, 'content/textbook.json'));
  assert.equal(sha256(textbookBytes), '5079b381a30d5d7785db5ee93d17b1ad71380a53633146001150c874f27558d7', 'Teaching evidence changed: content/textbook.json');
  const textbook = JSON.parse(textbookBytes);
  const reviewCases = JSON.parse(readFileSync(path.join(appRoot, 'docs/homework30-review-cases.json'), 'utf8'));
  const contentRevisions = [];
  const authorities = new Map();
  for (const lesson of stage2.lessons) for (const part of ['choice', 'sort', 'translation']) for (const question of lesson[part]) {
    assertFingerprint(question);
    authorities.set(`homework:${question.id}`, { sourceFile: 'content/stage2-bank.json', question });
  }
  for (const question of legacy.tasks) {
    assertFingerprint(question);
    assert.ok(!authorities.has(question.id), `Duplicate authority: ${question.id}`);
    authorities.set(question.id, { sourceFile: 'content/legacy-exercises.json', question });
  }
  const selections = [], selectedEntries = new Set();
  const lessons = stage2.lessons.map(lesson => {
    const { choice: ignoredChoice, sort: ignoredSort, translation: ignoredTranslation, ...metadata } = lesson;
    const output = { ...clone(metadata), ...Object.fromEntries(Object.keys(PART_COUNTS).map(part => [part, []])) };
    const append = (part, question, reference, source, entry = null) => {
      const position = output[part].length + 1;
      const original = materializeQuestion(lesson.lesson, part, position, question, reference, source);
      const { question: record, audit: revision } = applyContentRevision(original, stage3, textbook);
      if (revision) contentRevisions.push(revision);
      output[part].push(record);
      const selection = {
        questionId: record.id, lesson: lesson.lesson, part, position, ...reference,
        authorityId: entry?.authorityId ?? `homework:${question.id}`,
        questionFingerprint: record.fingerprint,
        origin: entry ? 'comprehensive-original' : 'existing-homework',
      };
      if (revision) selection.revision = { transformation: 'reviewed-distinct-scenario-v1', revisionFingerprint: revision.revisionFingerprint, changedFields: revision.changedFields, originalObjective: revision.originalObjective, revisedObjective: revision.revisedObjective, auditQuestionId: record.id };
      if (entry) {
        selection.entry = { sourceFile: 'content/legacy-exercises.json', sourceId: entry.id, sourceFingerprint: fingerprint(entry), oldId: entry.oldId, set: entry.set, group: entry.group };
        selection.overrides = overrideFields.filter(key => Object.hasOwn(entry, key));
        selection.optionFeedback = reference.transformation ? 'authored-distractor-specific-feedback' : question.optionFeedback ? 'preserved-authority-feedback' : 'reviewed-explanation-with-result-prefix';
        if (reference.transformation) {
          selection.adaptationFingerprint = fingerprint(LESSON3_GRAMMAR_ADAPTATIONS[entry.id]);
          selection.substantiveChange = LESSON3_ADAPTATION_AUDIT[entry.id].change;
          selection.supportingVocabulary = LESSON3_ADAPTATION_AUDIT[entry.id].vocabulary.map(zh => {
            const word = stage3.vocabulary.find(word => word.lesson === 3 && word.zh === zh);
            assert.ok(word, `Missing corrected lesson-3 vocabulary: ${zh}`);
            return { ...sourceReference('content/stage3-catalog.json', word), zh, vi: word.vi };
          });
        }
        selectedEntries.add(entry.id);
      }
      selections.push(selection);
    };
    for (const part of ['choice', 'sort', 'translation']) for (const question of lesson[part]) {
      append(part, question, sourceReference('content/stage2-bank.json', question), question.source);
    }
    for (const [group, part] of [['choice', 'choice'], ['listening', 'listening'], ['translation', 'translationChoice']]) {
      const entries = legacy.entries.filter(entry => entry.set === 'original' && entry.lesson === lesson.lesson && entry.group === (lesson.lesson === 3 && group === 'choice' ? 'sort' : group));
      assert.equal(entries.length, 5, `Required comprehensive selection: lesson ${lesson.lesson}, ${group}`);
      for (const entry of entries) {
        const resolved = resolveLegacyEntry(entry, authorities);
        const adaptation = LESSON3_GRAMMAR_ADAPTATIONS[entry.id];
        if (adaptation) {
          assert.equal(part, 'choice');
          assert.equal(resolved.question.kind, 'sort');
          assert.ok(!resolved.question.answers.includes(adaptation.options[adaptation.answer]), `Authored scenario must not repeat retained sort target: ${entry.id}`);
          const { tokens: ignoredTokens, answers: ignoredAnswers, ...question } = resolved.question;
          append(part, { ...question, ...clone(adaptation) }, { ...resolved.reference, transformation: 'authored-grammar-scenario-v1' }, { ...legacySource(entry), label: `${legacySource(entry).label} · Tình huống ngữ pháp biên soạn mới`, adaptation: 'New grammar scenario; source supplies a starting skill, not verbatim options or answer.' }, entry);
        } else append(part, resolved.question, resolved.reference, legacySource(entry), entry);
      }
    }
    for (const [part, count] of Object.entries(PART_COUNTS)) assert.equal(output[part].length, count, `${lesson.lesson}:${part} quota`);
    return output;
  });
  selections.sort((a, b) => a.lesson - b.lesson || Object.keys(PART_COUNTS).indexOf(a.part) - Object.keys(PART_COUNTS).indexOf(b.part) || a.position - b.position);
  assert.equal(selections.length, 450);
  assert.equal(new Set(selections.map(selection => selection.questionId)).size, 450);
  const sharedAuthorities = [...new Set(selections.map(selection => selection.authorityId))].map(authorityId => ({ authorityId, questionIds: selections.filter(selection => selection.authorityId === authorityId).map(selection => selection.questionId) })).filter(row => row.questionIds.length > 1);
  const archiveEntries = legacy.entries.filter(entry => !selectedEntries.has(entry.id)).map(entry => {
    const resolved = resolveLegacyEntry(entry, authorities);
    return {
      entryId: entry.id, oldId: entry.oldId, lesson: entry.lesson, set: entry.set, group: entry.group,
      entryFingerprint: fingerprint(entry), authorityId: entry.authorityId, ...resolved.reference,
      reason: entry.set === 'pilot' ? 'lesson-9-extension-outside-the-uniform-30-question-quota' : entry.lesson === 3 && entry.group === 'choice' ? 'shared-choice-core-already-present-in-existing-homework' : 'existing-homework-sorting-already-fills-the-five-question-sorting-quota',
    };
  });
  const selectedAuthorities = new Set(selections.map(selection => selection.authorityId));
  const archiveTasks = legacy.tasks.filter(question => !selectedAuthorities.has(question.id)).map(question => ({ ...sourceReference('content/legacy-exercises.json', question), entryIds: legacy.entries.filter(entry => entry.authorityId === question.id).map(entry => entry.id) }));
  const bank = { schemaVersion: 1, version: VERSION, lessons };
  const mapping = {
    schemaVersion: 1, version: VERSION,
    purpose: 'Authoritative source/entry identities, plus explicit version-only scenario revisions. Original objectives and records remain immutable; they are not represented as verbatim authored questions.',
    sourceFiles: Object.entries(SOURCE_HASHES).map(([sourceFile, sha256]) => ({ sourceFile, sha256 })),
    teachingEvidenceSource: { sourceFile: 'content/textbook.json', sha256: sha256(textbookBytes) },
    authoredRevisionCount: contentRevisions.length,
    reviewCaseCount: reviewCases.cases.length,
    fingerprintContract: {
      question: 'SHA-256 of canonical JSON containing all question fields except fingerprint; object keys sorted recursively, array order preserved.',
      provenance: 'sourceFingerprint is the existing fingerprint of the immutable authority question identified by sourceFile/sourceId.',
      comprehensiveEntry: 'entry.sourceFingerprint is SHA-256 of the complete canonical entry, including overrides and its authority reference.',
    },
    quota: { lessons: 15, perLesson: 30, total: 450, partsPerLesson: PART_COUNTS, automaticPerLesson: 25, manualPerLesson: 5 },
    selectionPolicy: { stage2: 'Retain 225 immutable source references and ordering; explicitly revise new-version prompts/contexts where duplicate propositions or exposed manual targets were found.', comprehensive: 'For each lesson, original-set choice 01–05, listening 01–05, and translation 01–05; lesson 3 replaces duplicate original choice entries with new grammar scenarios anchored to original sort 01–05, with different propositions and targets. Resolve shared authority and entry-specific overrides.', sourceOrder: 'Existing homework choice first, followed by comprehensive choice. Other parts preserve source order.' },
    selections,
    sharedAuthorities,
    maintenanceArchive: {
      status: 'retained-in-immutable-source-only-not-additional-student-homework',
      entries: archiveEntries,
      tasks: archiveTasks,
      oral: legacy.oral.map(activity => ({ sourceFile: 'content/legacy-exercises.json', sourceId: activity.id, sourceFingerprint: fingerprint(activity), reason: 'oral-extension-outside-the-uniform-30-question-quota' })),
      passages: Object.entries(legacy.passages).map(([id, passage]) => ({ sourceFile: 'content/legacy-exercises.json', sourceId: id, sourceFingerprint: fingerprint(passage), reason: 'context-for-unselected-lesson-9-extension' })),
    },
    independentSources: {
      status: 'preserved-for-existing-independent-listening-and-vocabulary-features-not-counted-in-homework',
      sourceFile: 'content/stage3-catalog.json',
      listening: stage3.listening.map(question => ({ sourceId: question.id, sourceFingerprint: question.fingerprint })),
      vocabulary: stage3.vocabulary.map(word => ({ sourceId: word.id, sourceFingerprint: word.fingerprint })),
    },
    audit: {
      selectedStage2Questions: selections.filter(row => row.origin === 'existing-homework').length,
      selectedComprehensiveEntries: selectedEntries.size,
      unselectedComprehensiveEntries: archiveEntries.filter(row => row.set === 'original').length,
      unselectedPilotEntries: archiveEntries.filter(row => row.set === 'pilot').length,
      archivedLegacyTaskAuthorities: archiveTasks.length,
      repeatedSharedAuthorities: sharedAuthorities.length,
      inheritedCorrectedTranscript: 'original:l10-listening-04: 我想买两斤苹果。 / Wǒ xiǎng mǎi liǎng jīn píngguǒ.',
      authoredGrammarChoiceAdaptations: 5,
      reviewedVersionOnlyRevisions: contentRevisions.length,
      authoredAdaptationSources: Object.keys(LESSON3_GRAMMAR_ADAPTATIONS),
      sourceBankReauthoringPerformed: false,
      newHumanEarReviewPerformed: false,
      newTextbookPageReviewPerformed: false,
    },
  };
  return { 'content/homework30-bank.json': bank, 'docs/homework30-mapping.json': mapping, ...buildContentEvidence(bank, mapping, contentRevisions, reviewCases) };
}

export function persistHomeworkArtifacts(artifacts, appRoot = APP_ROOT, check = true) {
  for (const [relative, content] of Object.entries(artifacts)) {
    const target = path.join(appRoot, relative), expected = json(content);
    if (check) assert.equal(readFileSync(target, 'utf8'), expected, `Generated homework artifact is stale: ${relative}`);
    else { mkdirSync(path.dirname(target), { recursive: true }); writeFileSync(target, expected); }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'Use --write or --check.');
  persistHomeworkArtifacts(buildHomeworkArtifacts(), APP_ROOT, process.argv[2] === '--check');
  console.log(`${VERSION}: 15 lessons, 450 questions (150 choice, 75 sorting, 75 listening, 75 translation-choice, 75 manual writing). ${process.argv[2] === '--check' ? 'Verified.' : 'Generated.'}`);
}
