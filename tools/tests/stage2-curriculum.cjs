#!/usr/bin/env node
'use strict';

// Provenance checks and an auditable link to assistant semantic curriculum review.
// This does not segment Chinese or purport to validate grammar, translations,
// level appropriateness, or the uniqueness of a natural-language answer.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const bankDirectory = 'new-hsk1/hsk1/stage2/question-bank';
const bankPaths = ['bank-01-05.json', 'bank-06-10.json', 'bank-11-15.json']
  .map(name => `${bankDirectory}/${name}`);
const requiredTeacherPaths = ['01-05', '06-10', '11-15']
  .map(range => `docs/stage2/teacher-${range}.md`);
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const map = JSON.parse(read('docs/stage1/course-map.json'));
const course = new Map(map.lessons.map(lesson => [lesson.id, lesson]));
const errors = [];
const results = [];
const banks = [];
const lessons = [];
const seenIds = new Set();
const semanticReviewHints = [];
const pendingReviewAllowed = process.argv.includes('--allow-pending-review');
const reportJSON = process.argv.includes('--json');

function problem(id, message) {
  errors.push({id, message});
}

function checkSource(id, source, lessonNumber) {
  const lesson = course.get(lessonNumber);
  if (!lesson || !source || typeof source !== 'object') {
    problem(id, '缺少可对应教材课程的source对象。');
    return;
  }
  const print = source.printPages;
  const pdf = source.pdfPages;
  if (!Array.isArray(print) || !print.length || !print.every(Number.isInteger) ||
      !Array.isArray(pdf) || print.length !== pdf.length || !pdf.every(Number.isInteger)) {
    problem(id, 'printPages/pdfPages必须是同长度的非空整数页码列表。');
    return;
  }
  if (new Set(print).size !== print.length) problem(id, '来源印刷页重复。');
  print.forEach((page, index) => {
    if (page < 1 || page > lesson.source.printed_pages[1]) {
      problem(id, `引用印刷${page}页超出第${lessonNumber}课及此前正文范围。`);
    }
    if (pdf[index] !== page + 15) {
      problem(id, `印刷${page}页应对应PDF${page + 15}页，不是${pdf[index]}页。`);
    }
  });
}

for (const filename of bankPaths) {
  if (!fs.existsSync(path.join(root, filename))) {
    problem(filename, '题库文件尚未提供。');
    continue;
  }
  const raw = fs.readFileSync(path.join(root, filename));
  let data;
  try { data = JSON.parse(raw.toString('utf8')); }
  catch (error) { problem(filename, `无法读取JSON：${error.message}`); continue; }
  const rows = Array.isArray(data) ? data : data.lessons;
  if (!Array.isArray(rows)) { problem(filename, '题库必须为课程数组或有lessons数组。'); continue; }
  banks.push({path: filename, sha256: sha256(raw)});
  lessons.push(...rows);
  for (const row of rows) {
    const n = Number(row.lesson ?? row.id);
    if (!course.has(n)) { problem(filename, `无对应教材课号${n}。`); continue; }
    checkSource(`lesson-${n}`, row.source, n);
    for (const kind of ['choice', 'sort', 'translation']) {
      if (!Array.isArray(row[kind])) { problem(`lesson-${n}`, `缺少${kind}题组。`); continue; }
      for (const q of row[kind]) {
        if (typeof q.id !== 'string' || seenIds.has(q.id)) {
          problem(String(q.id), '题目ID缺失或重复，无法绑定逐题审阅记录。');
        }
        seenIds.add(q.id);
        checkSource(q.id, q.source, n);
        // Literal appearances are a reading aid only. A character may be part
        // of a different compound; no hint here is an error or a scope verdict.
        const ChineseSurface = [q.stem, ...(q.options ?? []), ...(q.tokens ?? []),
          ...(q.answers ?? [])].filter(value => typeof value === 'string').join('\n');
        for (const term of map.repeated_or_polysemous_terms) {
          if (ChineseSurface.includes(term.zh)) {
            semanticReviewHints.push({id:q.id, word:term.zh,
              possibleSensesThroughLesson:term.senses.filter(s => s.lesson <= n)
                .map(s => ({lesson:s.lesson, meaning:s.editorial_sense_summary,
                  printPages:s.source.printed_pages})),
              caveat:'Literal match only; reviewer must identify the compound, syntax, and intended sense.'});
          }
        }
        results.push({id:q.id, lesson:n, kind, printPages:q.source?.printPages ?? [],
          pdfPages:q.source?.pdfPages ?? []});
      }
    }
  }
}

// Counts ensure source review covers the entire authorized corpus, rather
// than merely a subset of otherwise structurally valid questions.
if (lessons.length !== 15 || new Set(lessons.map(l => Number(l.lesson ?? l.id))).size !== 15) {
  problem('corpus', '教材来源审校应覆盖15个不同课程。');
}
if (results.length !== 225) problem('corpus', `来源审校应覆盖225题，实际${results.length}题。`);

const stage1 = require(path.join(root, 'new-hsk1/hsk1/stage1/sample-bank.js'));
const original3 = stage1.find(l => Number(l.lesson ?? l.id) === 3);
const current3 = lessons.find(l => Number(l.lesson ?? l.id) === 3);
if (!original3 || !current3) problem('lesson-3', '无法对应获批的第3课样板。');
else {
  for (const kind of ['choice', 'sort', 'translation']) {
    try { assert.deepStrictEqual(current3[kind], original3[kind]); }
    catch { problem(`lesson-3-${kind}`, '第3课题目与第一步获批样板发生变化，需要明确复核。'); }
  }
}

// A reviewer writes this marker only after reading the exact bank files and
// teacher references. Hashes make a later content edit invalidate the review;
// the marker does not itself prove that the assistant review was correct.
const reviewText = read('docs/stage2/curriculum-review.md');
const marker = reviewText.match(/<!-- curriculum-review-ledger\s*\n([\s\S]*?)\n-->/);
let ledger = null;
if (marker) {
  try { ledger = JSON.parse(marker[1]); }
  catch (error) { problem('assistant-review', `助手审阅记录JSON无效：${error.message}`); }
}
if (!ledger && !pendingReviewAllowed) {
  problem('assistant-review', '助手逐题语义审阅尚未完成；草稿阶段可用--allow-pending-review只检查来源。');
}
if (ledger) {
  if (ledger.status !== 'completed') problem('assistant-review', '助手审阅状态尚未完成。');
  const reviewed = ledger.reviewedQuestionIds;
  if (!Array.isArray(reviewed) || reviewed.length !== 225 || new Set(reviewed).size !== 225 ||
      results.some(q => !reviewed.includes(q.id)) || reviewed.some(id => !seenIds.has(id))) {
    problem('assistant-review', '助手审阅ID清单与当前225题不完全相符。');
  }
  for (const bank of banks) {
    const approved = ledger.banks?.find(x => x.path === bank.path);
    if (!approved || approved.sha256 !== bank.sha256) {
      problem(bank.path, '题库内容与助手审阅时的SHA-256不同；需要复核变化后更新记录。');
    }
  }
  const teacherReferences = Array.isArray(ledger.teacherReferences) ? ledger.teacherReferences : [];
  for (const reference of teacherReferences) {
    if (!fs.existsSync(path.join(root, reference.path)) ||
        sha256(fs.readFileSync(path.join(root, reference.path))) !== reference.sha256) {
      problem(reference.path, '教师参考与助手审阅版本不一致。');
    }
  }
  if (!teacherReferences.length) {
    problem('assistant-review', '助手审阅记录未绑定教师参考。');
  }
  for (const filename of requiredTeacherPaths) {
    if (!teacherReferences.some(reference => reference.path === filename)) {
      problem(filename, '助手审阅记录未绑定该分卷教师参考。');
    }
  }
}

const report = {
  check: 'stage2-curriculum-provenance', passed: errors.length === 0,
  coveredLessons: lessons.length, coveredQuestions: results.length,
  scope: 'source-page arithmetic, cumulative citation bounds, preserved lesson-3 questions, assistant-review version binding',
  doesNotValidate: ['Chinese segmentation or grammar', 'Vietnamese translation quality',
    'answer uniqueness or every valid word order', 'browser behavior'],
  assistantSemanticReviewLedgerPresent: Boolean(ledger), banks, questions: results,
  semanticReviewHints, errors
};
if (reportJSON) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
else {
  console.log(`${report.passed ? 'PASS' : 'FAIL'}: stage2 curriculum provenance; ${results.length} questions / ${lessons.length} lessons.`);
  console.log(`Assistant semantic-review version ledger: ${ledger ? 'present and checked' : 'pending (no claim of assistant semantic approval)'}.`);
  console.log('Source checks are not a substitute for linguistic review or browser tests.');
  for (const error of errors) console.error(`${error.id}: ${error.message}`);
}
process.exitCode = report.passed ? 0 : 1;
