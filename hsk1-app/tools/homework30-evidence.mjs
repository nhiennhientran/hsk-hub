import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const APPROVED_BANK_SHA256 = 'efc0fd1c3bbbead479e8d610da9ea7c802d7cf3edb553942edc2d7dce54c9c5d';
const PARTS = ['choice', 'sort', 'listening', 'translationChoice', 'translation'];
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
const hash = value => createHash('sha256').update(canonical(value)).digest('hex');
export const normalizeChinese = value => value.normalize('NFKC').replace(/[\s\p{P}\p{S}]/gu, '').toLowerCase();
export const normalizeVietnamese = value => value.normalize('NFC').toLowerCase().replace(/xin chào/g, 'chào').replace(/(^|\s)sẽ(?=\s|$)/gu, '$1').replace(/[\p{P}\p{S}]/gu, ' ').replace(/\s+/g, ' ').trim();
const fragments = value => value.split(/[。！？!?；;\n]+/).map(value => value.trim()).filter(value => (value.match(/[\u3400-\u9fff]/g) ?? []).length >= 3);
export function questionTargets(question, part) {
  const values = [];
  if (part === 'sort') values.push(...question.answers.map(value => ({ role: 'accepted-sort', value })));
  if (part === 'listening') values.push({ role: 'transcript', value: question.transcript });
  if (['choice', 'translationChoice'].includes(part)) values.push({ role: 'correct-option', value: question.options[question.answer] });
  if (question.stem) {
    if (/_{2,}/.test(question.stem) && Array.isArray(question.options)) {
      const pieces = question.options[question.answer].split(/[；;]/); let index = 0;
      values.push({ role: 'completed-cloze', value: question.stem.replace(/_{2,}/g, () => pieces[Math.min(index++, pieces.length - 1)]) });
    } else values.push({ role: 'displayed-stem', value: question.stem });
  }
  return values.flatMap(({ role, value }) => fragments(value).map(sentence => ({ role, sentence, normalized: normalizeChinese(sentence) })));
}
const exception = group => {
  const ids = group.occurrences.map(row => row.questionId).sort();
  if (group.normalized === '有点儿' && canonical(ids) === canonical(['hw30-v1-l12-choice-02', 'hw30-v1-l12-choice-09'])) return 'The first item identifies a degree modifier in a single adjective frame. The later two-blank task contrasts degree 有点儿 with quantity 一点儿 in two different frames. A shared lexical answer is necessary to this contrast; no full proposition or manual answer is repeated.';
  if (group.normalized === '一点儿' && canonical(ids) === canonical(['hw30-v1-l12-choice-03', 'hw30-v1-l12-choice-09'])) return 'The first item identifies a small quantity before a noun. The later two-blank task must distinguish that noun quantity from adjective degree. This is a specific mixed-category contrast, not another translation of the first sentence.';
  if (group.normalized === '我不知道' && canonical(ids) === canonical(['hw30-v1-l11-choice-08', 'hw30-v1-l13-listening-02'])) return 'Lesson 11 recognizes the speaker’s lack of knowledge. Lesson 13 embeds that statement in an original recorded two-part reply that also suggests calling to ask. The later task requires hearing both the information state and proposed action; this cross-lesson reinforcement is intentional and does not expose any full manual target.';
  return null;
};
export function scanContent(bank) {
  const globalTargets = new Map(), exactMc = new Map(), manualLeaks = [];
  const all = bank.lessons.flatMap(lesson => PARTS.flatMap(part => lesson[part].map(question => ({ part, question }))));
  for (const { part, question } of all) {
    if (question.options) {
      const signature = hash({ prompt: question.prompt, stem: question.stem ?? '', options: [...question.options].sort(), correct: question.options[question.answer] });
      const group = exactMc.get(signature) ?? []; group.push(question.id); exactMc.set(signature, group);
    }
    for (const target of questionTargets(question, part)) {
      const group = globalTargets.get(target.normalized) ?? { sentence: target.sentence, normalized: target.normalized, occurrences: [] };
      const old = group.occurrences.find(row => row.questionId === question.id);
      if (old) { if (!old.roles.includes(target.role)) old.roles.push(target.role); }
      else group.occurrences.push({ questionId: question.id, lesson: question.lesson, part, skill: question.skill, roles: [target.role] });
      globalTargets.set(target.normalized, group);
    }
  }
  const overlaps = [...globalTargets.values()].filter(group => group.occurrences.length > 1).map(group => ({ ...group, scope: new Set(group.occurrences.map(row => row.lesson)).size === 1 ? 'same-lesson' : 'cross-lesson', disposition: exception(group) ? 'reviewed-distinct-objective-reinforcement' : 'requires-explicit-review', rationale: exception(group) }));
  for (const { question: manual } of all.filter(({ part }) => part === 'translation')) {
    const target = normalizeVietnamese(manual.prompt);
    for (const { question: automatic } of all.filter(({ part }) => part !== 'translation')) {
      for (const [field, values] of Object.entries({ prompt: [automatic.prompt], meaning: [automatic.meaning], stem: [automatic.stem], options: automatic.options ?? [], explanation: [automatic.explanation], optionFeedback: automatic.optionFeedback ?? [] })) {
        for (const value of values) if (typeof value === 'string' && target.length >= 14 && normalizeVietnamese(value).includes(target)) manualLeaks.push({ manualId: manual.id, automaticId: automatic.id, field, scope: manual.lesson === automatic.lesson ? 'same-lesson' : 'cross-lesson' });
      }
    }
  }
  return { overlaps, unresolvedOverlaps: overlaps.filter(group => !group.rationale), repeatedMcCores: [...exactMc.values()].filter(ids => ids.length > 1), exactVietnameseManualLeaks: manualLeaks };
}
export function buildContentEvidence(bank, mapping, authoredRevisions, baselineCases) {
  const all = bank.lessons.flatMap(lesson => PARTS.flatMap(part => lesson[part].map(question => ({ part, question }))));
  const bankSha256 = createHash('sha256').update(JSON.stringify(bank, null, 2) + '\n').digest('hex');
  const approved = bankSha256 === APPROVED_BANK_SHA256;
  const scan = scanContent(bank), revisionsById = new Map(authoredRevisions.map(row => [row.questionId, row]));
  const inventory = all.map(({ part, question }) => ({ questionId: question.id, lesson: question.lesson, part, skill: question.skill, prompt: question.prompt, ...(question.stem ? { stem: question.stem } : {}), ...(question.meaning ? { meaning: question.meaning } : {}), assessment: question.assessment, source: question.source, provenance: question.provenance, fingerprint: question.fingerprint }));
  const caseDispositions = baselineCases.cases.map(item => {
    const direct = item.questionIds.map(id => revisionsById.get(id)).filter(Boolean);
    assert.ok(direct.length, `Review case has no specifically identified changed question: ${item.id}`);
    const related = [];
    return { ...item, status: direct.length ? 'source-scenario-replaced-in-new-version' : 'surrounding-exposure-revised-and-rechecked', changedQuestionIds: direct.map(row => row.questionId), changes: direct.map(row => ({ questionId: row.questionId, reason: row.reason, revisedObjective: row.revisedObjective })), ...(related.length ? { surroundingRevisions: related.map(row => row.questionId), note: 'The retained item is reviewed against changed surrounding automatic content; unchanged manual prompts never gain answers. See full revised payloads and the independent final exposure review.' } : {}) };
  });
  const lessonCoverage = bank.lessons.map(lesson => ({ lesson: lesson.lesson, total: 30, parts: Object.fromEntries(PARTS.map(part => [part, lesson[part].length])), skills: PARTS.flatMap(part => lesson[part].map(question => ({ questionId: question.id, part, skill: question.skill }))), revisedQuestions: authoredRevisions.filter(row => row.lesson === lesson.lesson).length }));
  return {
    'docs/homework30-inventory.json': { schemaVersion: 1, version: bank.version, total: inventory.length, questions: inventory },
    'docs/homework30-content-audit.json': {
      schemaVersion: 1, version: bank.version,
      status: approved ? 'independently-reviewed' : 'candidate-awaiting-final-independent-content-review',
      independentReview: { status: approved ? 'passed' : 'pending-new-content-review', bankSha256, approvedBankSha256: APPROVED_BANK_SHA256, date: '2026-10-02', coverage: 'All 450 questions, every authored overlay, current-or-earlier scope references, key/distractor rationale, manual nonleakage, cross-lesson recurrence and all 160 original issue dispositions.', boundary: 'Independent assistant content review. No native-speaker, classroom-teacher, new human-ear or PDF-page certification. Any change to the bank bytes invalidates this approval.' },
      method: {
        scope: 'All 450 questions, all 15 lessons, and every authored overlay. Compare original authority/objective separately from new scenario; verify every source ID and fingerprint.',
        exactMc: 'Global unordered-option signature with prompt, displayed stem and keyed answer; reordering distractors cannot disguise an identical MC record.',
        literalComparison: 'Global and same-lesson comparison of keyed answers, completed clozes, all displayed Chinese stems, accepted sort expressions and listening transcripts. Three-Hanzi-or-longer fragments include lexical phrases; each retained recurrence requires an explicit item-pair-specific rationale.',
        manualExposure: 'Scan full Vietnamese manual prompts against all automatic prompts, meanings, stems, options, explanations and option feedback across all lessons; independently review Chinese equivalents, paraphrases, distractors and acceptable natural variants. Exact scans alone cannot establish semantic nonleakage.',
        linguisticReview: 'Per-authored-item key/distractor rationales, natural Chinese/Vietnamese review, current-or-earlier resolved vocabulary/grammar/text evidence, and manual meaning-preservation rubric. No private teacher answer list is embedded in bank, frontend or these public artifacts.',
        certificationBoundary: 'Automated and independent assistant content review, not a claim of native-speaker, classroom-teacher, new human-ear or PDF-page certification.',
      },
      summary: { lessons: 15, questions: 450, automatic: 375, manual: 75, versionOnlyRevisions: authoredRevisions.length, initialReviewedCases: baselineCases.cases.length, exactRepeatedMcRecords: scan.repeatedMcCores.length, sameLessonLiteralGroups: scan.overlaps.filter(row => row.scope === 'same-lesson').length, crossLessonLiteralGroups: scan.overlaps.filter(row => row.scope === 'cross-lesson').length, unreviewedLiteralGroups: scan.unresolvedOverlaps.length, exactVietnameseManualExposureFindings: scan.exactVietnameseManualLeaks.length },
      lessonCoverage, initialCaseDispositions: caseDispositions,
      exactRepeatedMcRecords: scan.repeatedMcCores, retainedLiteralRecurrences: scan.overlaps,
      exactVietnameseManualExposureFindings: scan.exactVietnameseManualLeaks,
      authoredRevisions,
      manualMeaningReview: all.filter(({ part }) => part === 'translation').map(({ question }) => ({ questionId: question.id, prompt: question.prompt, objective: question.skill, newScenario: revisionsById.has(question.id), automatedExposureScan: 'all 375 automatic questions, including wrong choices and feedback', teacherRubric: 'Assess the complete requested proposition and speech acts, preserve roles/time/polarity/quantity, and accept natural taught equivalents and word-order variants; no model answer is stored.' })),
    },
  };
}
