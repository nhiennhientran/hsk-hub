import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { revisions as early } from './homework30-revisions-early.mjs';
import { revisions as late } from './homework30-revisions-late.mjs';
export const REVISIONS = Object.freeze({ ...early, ...late });
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
export const revisionFingerprint = value => createHash('sha256').update(canonical(value)).digest('hex');
const ref = (sourceFile, item) => ({ sourceFile, sourceId: item.id, sourceFingerprint: item.fingerprint });
const hanzi = value => (value.match(/[\u3400-\u9fff]+/g) ?? []).join('');
const learnerFields = question => [question.prompt, question.stem, question.meaning, ...(question.options ?? []), ...(question.answers ?? []), ...(question.tokens ?? [])].filter(value => typeof value === 'string');
const manualWords = {
  8: ['猫', '学校', '工作', '书店', '午饭', '想', '哪儿', '妈妈'],
  9: ['书', '老师', '朋友', '电视', '读书', '中文', '晚上', '家', '和', '想'],
  10: ['商店', '衣服', '多', '买', '这里'],
  11: ['大学', '学', '医', '弟弟', '也'],
  12: ['姐姐', '生病', '今天', '公司', '来', '没'],
  13: ['想', '问', '服务员', '问题', '商店', '卖', '面包'],
  14: ['女儿', '儿子', '小学', '中学', '小学生', '中学生'],
  15: ['小时', '家人', '在', '家', '想', '时间'],
};
// These rules resolve real, earlier teaching records; they are evidence of available
// building blocks, not a claim that word matching alone proves grammatical quality.
const grammarRules = [
  ['l02-grammar-01', /[\u3400-\u9fff]{2}|subject|order|compose|speaker|recipient|identity/i],
  ['l03-grammar-01', /是|不是|identity|identif/i], ['l03-grammar-02', /的|possess|owner|relationship/i], ['l03-grammar-03', /吗|question|ask/i],
  ['l04-grammar-01', /有|没有|possess|exist/i], ['l04-grammar-02', /[一二两三四五六七八九十百千]|number|quantity/i], ['l04-grammar-03', /呢/], ['l04-grammar-04', /个|本|只|件|家|classifier|quantity/i],
  ['l05-grammar-01', /年|月|号|星期|date|calendar|weekday/i], ['l05-grammar-03', /会|ability|can/i],
  ['l06-grammar-01', /想|desire|wish|want/i], ['l06-grammar-02', /去.*买|去.*见|去.*接|坐.*去|purpose/i], ['l06-grammar-03', /怎么/],
  ['l07-grammar-01', /点|半|分|clock|time/i], ['l07-grammar-02', /吧|suggest/i], ['l07-grammar-03', /今天|明天|昨天|上午|下午|晚上|早上|time|future/i], ['l07-grammar-04', /呢/],
  ['l08-grammar-01', /上|下|里|外|前|后|position|location|place/i], ['l08-grammar-02', /在|location|place/i], ['l08-grammar-03', /能|ability/i],
  ['l09-grammar-01', /上.*有|里.*有|外.*有|前.*有|exist/i], ['l09-grammar-02', /上午.*在|下午.*在|晚上.*在|time.*place/i], ['l09-grammar-03', /第|ordinal/i],
  ['l10-grammar-01', /元|块|毛|price|money/i], ['l10-grammar-02', /很|不太|漂亮|贵|便宜|大|少|degree|adject/i], ['l10-grammar-03', /怎么样/],
  ['l11-grammar-01', /不.*[去是卖忙]|正反|A-not-A/i], ['l11-grammar-02', /正在|ongoing/], ['l11-grammar-03', /要|intention|plan/i],
  ['l12-grammar-01', /下雨|下雪/], ['l12-grammar-02', /了|new state|change/i], ['l12-grammar-03', /太.*了/],
  ['l13-grammar-01', /可以|permission/i], ['l13-grammar-02', /一下/], ['l13-grammar-03', /给|问|recipient|receiver/i],
  ['l14-grammar-01', /了|completed|past/i], ['l14-grammar-02', /睡.*觉|吃.*饭|上.*课/], ['l14-grammar-03', /都|scope|all/i],
  ['l15-grammar-01', /还|也|parallel|addition/i],
];
export function scopeEvidence(question, review, stage3, textbook) {
  const targetText = learnerFields(question).join(' ');
  const learnerText = hanzi(targetText);
  const candidates = stage3.vocabulary.filter(word => word.lesson <= question.lesson);
  const declared = review.supportingVocabulary ?? (question.assessment === 'manual' ? manualWords[question.lesson] ?? [] : []);
  const vocabulary = candidates.filter(word => learnerText.includes(word.zh) || declared.includes(word.zh));
  const seen = new Set();
  const vocabularyEvidence = vocabulary.filter(word => !seen.has(word.id) && seen.add(word.id)).map(word => ({ ...ref('content/stage3-catalog.json', word), lesson: word.lesson, zh: word.zh, vi: word.vi }));
  const allGrammar = textbook.lessons.filter(lesson => lesson.id <= question.lesson).flatMap(lesson => lesson.grammar.map(grammar => ({ ...grammar, lesson: lesson.id })));
  const checkText = `${targetText} ${question.skill} ${review.reason}`;
  const grammarIds = new Set(grammarRules.filter(([id, regex]) => regex.test(checkText)).map(([id]) => `textbook-${id}`));
  const grammarEvidence = allGrammar.filter(grammar => grammarIds.has(grammar.id)).map(grammar => ({ ...ref('content/textbook.json', grammar), lesson: grammar.lesson, title: grammar.title, structure: grammar.structure }));
  const textLines = textbook.lessons.filter(lesson => lesson.id <= question.lesson).flatMap(lesson => lesson.scenes.flatMap(scene => scene.lines.map(line => ({ ...line, lesson: lesson.id }))));
  const ranked = textLines.map(line => ({ line, score: vocabularyEvidence.reduce((sum, word) => sum + (word.zh.length > 1 && line.zh.includes(word.zh) ? word.zh.length : 0), 0) })).filter(row => row.score > 0).sort((a, b) => b.score - a.score || b.line.lesson - a.line.lesson).slice(0, 3);
  const textEvidence = ranked.map(({ line }) => ({ ...ref('content/textbook.json', line), lesson: line.lesson, zh: line.zh, vi: line.vn }));
  assert.ok(vocabularyEvidence.length || textEvidence.length, `No resolved scope evidence: ${question.id}`);
  return { vocabularyEvidence, grammarEvidence, textEvidence, compositionBasis: review.reason, scopeBoundary: 'Every reference is from this lesson or earlier. References document taught building blocks; the independent linguistic review checks the composed scenario and each distractor.' };
}
export function applyContentRevision(question, stage3, textbook) {
  const revision = REVISIONS[question.id];
  if (!revision) return { question, audit: null };
  assert.ok(revision.question && revision.review, `Incomplete authored revision: ${question.id}`);
  const { fingerprint: previousFingerprint, ...before } = question;
  if (question.assessment === 'manual') assert.ok(Object.keys(revision.question).every(key => ['prompt', 'skill'].includes(key)), `Manual revision leakage: ${question.id}`);
  const revised = {
    ...before, ...structuredClone(revision.question),
    source: { ...before.source, label: `Tình huống biên soạn mới · Nguồn học liệu: ${before.source.label}`, adaptation: 'Version-only scenario/assessment revision; referenced source record remains unchanged and is not represented as a verbatim new question.' },
    provenance: { ...before.provenance, transformation: 'reviewed-distinct-scenario-v1', revisionFingerprint: revisionFingerprint(revision.question) },
  };
  if (revised.assessment === 'manual') {
    for (const key of ['stem', 'meaning', 'options', 'answer', 'answers', 'tokens', 'explanation', 'optionFeedback', 'transcript', 'audio', 'pinyin']) assert.ok(!Object.hasOwn(revised, key), `Manual leaked field: ${question.id}:${key}`);
  }
  const audit = {
    questionId: question.id, lesson: question.lesson,
    originalVersionFingerprint: previousFingerprint,
    immutableAuthority: before.provenance,
    originalObjective: before.skill,
    originalPrompt: before.prompt,
    revisedObjective: revised.skill,
    revisionFingerprint: revisionFingerprint(revision.question),
    changedFields: Object.keys(revision.question).filter(key => canonical(before[key]) !== canonical(revision.question[key])),
    reason: revision.review.reason,
    replacementProposition: revision.review.replacementProposition,
    distinctFromIds: revision.review.distinctFromIds ?? [],
    linguisticAudit: revision.review.linguisticAudit,
    scope: scopeEvidence(revised, revision.review, stage3, textbook),
    ...(revised.assessment === 'manual' ? { manualRubric: 'Judge preservation of the requested people, roles, time, polarity, quantities and speech acts. Accept natural taught word order, equivalent taught expressions, suitable punctuation and optional possessive particles where meaning is unchanged. This record contains no model answer or accepted-answer list.' }
      : revised.options ? { optionChecks: revised.options.map((option, index) => ({ index, option, keyedCorrect: index === revised.answer, rationaleVi: revised.optionFeedback[index] })) }
      : { sortingChecks: { tokens: revised.tokens, acceptedExpressions: revised.answers, rationaleVi: revised.explanation } }),
  };
  return { question: { ...revised, fingerprint: revisionFingerprint(revised) }, audit };
}
