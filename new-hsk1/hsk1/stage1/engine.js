/* Isolated Stage 1 state. This module never reads or writes browser storage. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HSKStep1Engine = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const KEY = 'ran_hsk1_stage1_v3';
  const LEGACY_KEY = 'ran_hsk1_learning_v2';
  const SCHEMA = 3;
  const KINDS = Object.freeze(['choice', 'sort', 'translation', 'listening']);
  const PATH = Object.freeze(['choice', 'sort', 'translation']);
  const MAX_TRANSLATION_LENGTH = 12000;
  const MAX_PROFILE_LENGTH = 200;
  const MAX_HISTORY = 20;
  const MAX_JSON_LENGTH = 5 * 1024 * 1024;
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const record = value => value !== null && typeof value === 'object' &&
    !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
  const unsafeKeys = new Set(['__proto__', 'prototype', 'constructor']);
  const timestamp = value => Number.isFinite(value) && value >= 0 && value <= 8640000000000000;
  const lessonNumber = value => {
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    if (typeof value === 'string' && !/^([1-9]|1[0-5])$/.test(value)) return null;
    const number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= 15 ? number : null;
  };
  const fail = message => { throw new Error(message); };

  // White space and zero-width formatting characters determine completion only.
  // The student's original string is always stored unchanged.
  const visibleText = value => value.replace(/[\p{White_Space}\p{Default_Ignorable_Code_Point}]/gu, '');
  const normal = value => String(value == null ? '' : value).normalize('NFKC')
    .replace(/[\p{White_Space}\p{Default_Ignorable_Code_Point}\p{Punctuation}]/gu, '');

  function copy(value, depth = 0, seen = new Set()) {
    if (depth > 40) fail('Dữ liệu lồng quá nhiều cấp.');
    if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if ((!record(value) && !Array.isArray(value)) || seen.has(value)) fail('Dữ liệu không phải JSON hợp lệ.');
    seen.add(value);
    let result;
    if (Array.isArray(value)) {
      if (value.length > 100000) fail('Danh sách dữ liệu quá lớn.');
      result = value.map(item => copy(item, depth + 1, seen));
    } else {
      result = {};
      for (const [key, item] of Object.entries(value)) {
        if (unsafeKeys.has(key)) fail('Khóa dữ liệu không an toàn.');
        result[key] = copy(item, depth + 1, seen);
      }
    }
    seen.delete(value);
    return result;
  }

  function cleanInput(input) {
    const value = copy(input);
    if (JSON.stringify(value).length > MAX_JSON_LENGTH) fail('Bản sao lưu vượt quá 5 MB ký tự JSON.');
    return value;
  }

  function blank() {
    return {
      schema: SCHEMA, lessons: {}, profile: {name: '', className: ''},
      words: {}, questionReviews: {}, preferences: {}, archive: {}, updatedAt: null
    };
  }

  function group(state, lesson, kind) {
    const id = lessonNumber(lesson);
    if (id === null || !KINDS.includes(kind) || !record(state) ||
        state.schema !== SCHEMA || !record(state.lessons)) fail('Nhóm bài không hợp lệ.');
    if (!own(state.lessons, id)) state.lessons[id] = {};
    if (!record(state.lessons[id])) fail('Dữ liệu bài học không hợp lệ.');
    if (!own(state.lessons[id], kind)) {
      state.lessons[id][kind] = {
        draft: {}, orders: {}, first: null, attempt: null, latest: null,
        completed: false, history: []
      };
    }
    return state.lessons[id][kind];
  }

  function tokenIndexes(q, value, complete) {
    return Array.isArray(q.tokens) && Array.isArray(value) &&
      (!complete || value.length === q.tokens.length) && value.length <= q.tokens.length &&
      new Set(value).size === value.length &&
      value.every(index => Number.isInteger(index) && index >= 0 && index < q.tokens.length);
  }

  function isAnswered(q, value) {
    if (!q || !KINDS.includes(q.kind)) return false;
    if (q.kind === 'translation') {
      return typeof value === 'string' && value.length <= MAX_TRANSLATION_LENGTH &&
        visibleText(value).length > 0;
    }
    if (q.kind === 'sort') return tokenIndexes(q, value, true);
    return Array.isArray(q.options) && Number.isInteger(value) && value >= 0 && value < q.options.length;
  }

  function validDraft(q, value) {
    if (q.kind === 'translation') return typeof value === 'string' && value.length <= MAX_TRANSLATION_LENGTH;
    return q.kind === 'sort' ? tokenIndexes(q, value, false) : isAnswered(q, value);
  }

  function check(q, value) {
    // Manual work has no machine judgement, including when its draft is blank.
    if (q && q.kind === 'translation') return null;
    if (!isAnswered(q, value)) return false;
    if (q.kind === 'sort') {
      const sentence = value.map(index => q.tokens[index]).join('');
      return Array.isArray(q.answers) && q.answers.some(answer => normal(answer) === normal(sentence));
    }
    return value === q.answer;
  }

  function canOpen(state, lesson, kind) {
    const id = lessonNumber(lesson);
    if (id === null || !KINDS.includes(kind) || !record(state) || !record(state.lessons)) return false;
    if (kind === 'choice' || kind === 'listening') return true;
    const position = PATH.indexOf(kind);
    return position > 0 && PATH.slice(0, position).every(previous =>
      state.lessons[id]?.[previous]?.completed === true && !!state.lessons[id][previous].first);
  }

  function assertQuestions(lesson, kind, questions) {
    const id = lessonNumber(lesson);
    if (id === null || !KINDS.includes(kind) || !Array.isArray(questions) || questions.length !== 5) {
      fail('Mỗi nhóm cần đúng 5 câu hỏi của bài học này.');
    }
    const ids = new Set();
    for (const q of questions) {
      if (!record(q) || typeof q.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(q.id) ||
          ids.has(q.id) || q.kind !== kind || (q.lesson !== undefined && q.lesson !== id)) {
        fail('Mã câu hỏi hoặc loại câu hỏi không hợp lệ.');
      }
      ids.add(q.id);
      if (kind === 'translation') {
        if (q.assessment !== 'manual' || typeof q.prompt !== 'string' || !visibleText(q.prompt)) {
          fail('Câu dịch cần lời nhắc và chế độ giáo viên chấm.');
        }
        if (own(q, 'answer') || own(q, 'answers') || own(q, 'options')) {
          fail('Câu dịch tự viết không được chứa đáp án hoặc lựa chọn dành cho máy chấm.');
        }
      } else if (kind === 'sort') {
        if (!Array.isArray(q.tokens) || q.tokens.length < 1 || q.tokens.length > 100 ||
            q.tokens.some(token => typeof token !== 'string' || !token.length) ||
            !Array.isArray(q.answers) || !q.answers.length ||
            q.answers.some(answer => typeof answer !== 'string' || !normal(answer))) {
          fail('Từ rời hoặc đáp án xếp câu không hợp lệ.');
        }
      } else if (!Array.isArray(q.options) || q.options.length !== 4 ||
          q.options.some(option => typeof option !== 'string' || !visibleText(option)) ||
          !Number.isInteger(q.answer) || q.answer < 0 || q.answer >= 4) {
        fail('Câu trắc nghiệm cần đúng 4 lựa chọn và một đáp án.');
      }
    }
    return questions;
  }

  function indexBank(bank) {
    if (!Array.isArray(bank) || !bank.length) fail('Ngân hàng câu hỏi không hợp lệ.');
    const lessons = new Map(), lookup = new Map();
    for (const row of bank) {
      if (!record(row) || lessonNumber(row.lesson) === null || lessons.has(Number(row.lesson))) {
        fail('Bài học trong ngân hàng bị trùng hoặc không hợp lệ.');
      }
      const id = Number(row.lesson), kinds = {};
      for (const kind of KINDS) {
        if (kind === 'listening' && (row[kind] === undefined || (Array.isArray(row[kind]) && !row[kind].length))) continue;
        const questions = assertQuestions(id, kind, row[kind]);
        kinds[kind] = questions;
        for (const q of questions) {
          if (lookup.has(q.id)) fail('Mã câu hỏi bị trùng trong ngân hàng.');
          lookup.set(q.id, {q, lesson: id, kind});
        }
      }
      lessons.set(id, kinds);
    }
    return {lessons, lookup};
  }

  function fingerprint(q) {
    const source = JSON.stringify([q.id, q.kind, q.prompt || '', q.stem || '', q.meaning || '',
      q.options || [], q.tokens || [], q.answer ?? null, q.answers || [],
      q.assessment || 'automatic', q.transcript || '', q.audio || null]);
    let hash = 2166136261;
    for (let index = 0; index < source.length; index++) hash = Math.imul(hash ^ source.charCodeAt(index), 16777619);
    return 'q1-' + (hash >>> 0).toString(16).padStart(8, '0');
  }

  function answerMap(input, questions, complete) {
    if (!record(input)) fail('Bản ghi câu trả lời không hợp lệ.');
    const lookup = new Map(questions.map(q => [q.id, q])), output = {};
    for (const [id, value] of Object.entries(input)) {
      const q = lookup.get(id);
      if (!q) fail('Câu hỏi không thuộc nhóm bài này.');
      if (!(complete ? isAnswered(q, value) : validDraft(q, value))) fail('Kiểu câu trả lời không hợp lệ.');
      output[id] = copy(value);
    }
    if (complete && questions.some(q => !own(output, q.id))) fail('Lần nộp bài chưa đủ 5 câu.');
    return output;
  }

  function makeAttempt(kind, questions, answers, at) {
    if (!timestamp(at)) fail('Thời gian nộp bài không hợp lệ.');
    const exact = answerMap(answers, questions, true);
    const canonicalAnswers = Object.fromEntries(questions.map(q => [q.id, exact[q.id]]));
    const manual = kind === 'translation';
    const results = manual ? null : Object.fromEntries(questions.map(q => [q.id, check(q, exact[q.id])]));
    return {
      assessment: manual ? 'manual' : 'automatic', answers: canonicalAnswers,
      results, correct: manual ? null : Object.values(results).filter(Boolean).length,
      total: questions.length, at,
      questionFingerprints: Object.fromEntries(questions.map(q => [q.id, fingerprint(q)]))
    };
  }

  function remember(state, q, correct, now, lesson) {
    if (q.kind === 'translation' || typeof correct !== 'boolean') return;
    const old = state.questionReviews[q.id] || {streak: 0, attempts: 0, mistakes: 0};
    const streak = correct ? old.streak + 1 : 0;
    const days = correct ? [1, 3, 7, 14][Math.min(streak - 1, 3)] : 0;
    state.questionReviews[q.id] = {
      lesson: Number(lesson), kind: q.kind, streak, attempts: old.attempts + 1,
      mistakes: old.mistakes + (correct ? 0 : 1), lastCorrect: correct,
      lastAt: now, dueAt: now + days * 86400000
    };
  }

  function submit(state, lesson, kind, questions, now = Date.now()) {
    if (!canOpen(state, lesson, kind)) return {ok: false, reason: 'locked'};
    assertQuestions(lesson, kind, questions);
    if (!timestamp(now)) fail('Thời gian nộp bài không hợp lệ.');
    const g = group(state, lesson, kind);
    if (g.attempt) return {ok: false, reason: 'submitted'};
    answerMap(g.draft, questions, false);
    const missing = questions.filter(q => !isAnswered(q, g.draft[q.id])).map(q => q.id);
    if (missing.length) return {ok: false, reason: 'missing', missing};
    const attempt = makeAttempt(kind, questions, g.draft, now);
    g.attempt = copy(attempt);
    g.latest = copy(attempt);
    if (!g.first) g.first = copy(attempt);
    g.history.push(copy(attempt));
    g.history = g.history.slice(-MAX_HISTORY);
    g.completed = true;
    state.updatedAt = now;
    if (kind !== 'translation') questions.forEach(q => remember(state, q, attempt.results[q.id], now, lesson));
    return {ok: true, manual: kind === 'translation', correct: attempt.correct,
      total: attempt.total, completed: true, attempt: copy(attempt)};
  }

  function restart(state, lesson, kind, now = Date.now()) {
    const g = group(state, lesson, kind);
    g.draft = {};
    g.orders = {};
    g.attempt = null;
    if (timestamp(now)) state.updatedAt = now;
    return g;
  }

  function totals(state, lesson, lessonBank) {
    const id = lessonNumber(lesson);
    if (id === null) fail('Bài học không hợp lệ.');
    const row = state.lessons[id] || {};
    const source = Array.isArray(lessonBank) ? lessonBank.find(item => Number(item.lesson) === id) : lessonBank;
    const count = kind => source ? (Array.isArray(source[kind]) ? source[kind].length : 0) :
      (kind === 'listening' ? (row[kind]?.first?.total || 0) : 5);
    function scored(kinds) {
      let total = 0, submitted = 0, firstCorrect = 0, latestCorrect = 0;
      for (const kind of kinds) {
        const g = row[kind];
        total += count(kind);
        if (g?.first) {
          submitted += g.first.total;
          firstCorrect += g.first.correct;
          latestCorrect += (g.latest || g.first).correct;
        }
      }
      return {total, submitted, firstCorrect, latestCorrect,
        firstPercent: submitted ? Math.round(firstCorrect / submitted * 100) : null,
        latestPercent: submitted ? Math.round(latestCorrect / submitted * 100) : null};
    }
    const automatic = scored(['choice', 'sort']);
    const manual = {total: count('translation'), submitted: row.translation?.first?.total || 0, correct: null};
    const completedGroups = PATH.filter(kind => row[kind]?.completed === true && row[kind]?.first).length;
    const listening = scored(['listening']);
    return {
      homework: {total: automatic.total + manual.total, submitted: automatic.submitted + manual.submitted,
        completedGroups, done: completedGroups === PATH.length},
      automatic, manual,
      listening: {available: count('listening') > 0, ...listening}
    };
  }

  function readOrders(input, questions) {
    if (!record(input)) fail('Thứ tự hiển thị không hợp lệ.');
    const lookup = new Map(questions.map(q => [q.id, q])), output = {};
    for (const [id, value] of Object.entries(input)) {
      const q = lookup.get(id);
      if (!q || q.kind === 'translation') fail('Thứ tự hiển thị không thuộc câu hỏi khách quan.');
      const length = q.kind === 'sort' ? q.tokens.length : q.options.length;
      if (!Array.isArray(value) || value.length !== length || new Set(value).size !== length ||
          value.some(index => !Number.isInteger(index) || index < 0 || index >= length)) {
        fail('Thứ tự hiển thị phải là một hoán vị đầy đủ.');
      }
      output[id] = value.slice();
    }
    return output;
  }

  function readAttempt(raw, kind, questions) {
    if (raw === null || raw === undefined) return null;
    if (!record(raw) || !record(raw.questionFingerprints)) fail('Thiếu thông tin phiên bản câu hỏi trong lần nộp.');
    if (Object.keys(raw.questionFingerprints).length !== questions.length ||
        questions.some(q => raw.questionFingerprints[q.id] !== fingerprint(q))) {
      fail('Nội dung câu hỏi đã thay đổi; không thể gán kết quả cũ cho câu mới.');
    }
    return makeAttempt(kind, questions, raw.answers, raw.at);
  }

  const sameAttempt = (a, b) => !!a && !!b && a.at === b.at && JSON.stringify(a.answers) === JSON.stringify(b.answers);

  function profile(input) {
    if (input === undefined) return {name: '', className: ''};
    if (!record(input)) fail('Thông tin học sinh không hợp lệ.');
    const output = {};
    for (const key of ['name', 'className']) {
      const value = input[key] === undefined ? '' : input[key];
      if (typeof value !== 'string' || value.length > MAX_PROFILE_LENGTH) fail('Tên và lớp cần là văn bản, tối đa 200 ký tự mỗi mục.');
      output[key] = value;
    }
    return output;
  }

  function rebuildReviews(state, bankIndex) {
    state.questionReviews = {};
    const events = [];
    for (const [lesson, row] of Object.entries(state.lessons)) {
      for (const kind of ['choice', 'sort', 'listening']) {
        const g = row[kind];
        if (!g?.first) continue;
        const retained = g.history.slice();
        if (!retained.some(item => sameAttempt(item, g.first))) retained.unshift(g.first);
        for (const attempt of retained) events.push({lesson: Number(lesson), kind, attempt});
      }
    }
    events.sort((a, b) => a.attempt.at - b.attempt.at);
    for (const event of events) {
      for (const q of bankIndex.lessons.get(event.lesson)[event.kind]) {
        remember(state, q, event.attempt.results[q.id], event.attempt.at, event.lesson);
      }
    }
  }

  function validateImport(input, bank) {
    const raw = cleanInput(input), bankIndex = indexBank(bank);
    if (!record(raw) || raw.schema !== SCHEMA || !record(raw.lessons)) fail('Tệp không phải bản sao lưu mẫu bước 1, phiên bản 3.');
    const state = blank();
    state.profile = profile(raw.profile);
    for (const key of ['words', 'preferences', 'archive']) {
      if (raw[key] !== undefined && !record(raw[key])) fail('Dữ liệu ' + key + ' không hợp lệ.');
      state[key] = copy(raw[key] || {});
    }
    if (raw.updatedAt !== undefined && raw.updatedAt !== null && !timestamp(raw.updatedAt)) fail('Thời gian lưu không hợp lệ.');
    state.updatedAt = raw.updatedAt ?? null;
    for (const [lesson, row] of Object.entries(raw.lessons)) {
      const id = lessonNumber(lesson), kinds = bankIndex.lessons.get(id);
      if (!kinds || !record(row)) fail('Bài học không thuộc ngân hàng của bản này.');
      for (const [kind, source] of Object.entries(row)) {
        if (!KINDS.includes(kind) || !kinds[kind] || !record(source)) fail('Nhóm bài trong bản sao lưu không hợp lệ.');
        const questions = kinds[kind], target = group(state, id, kind);
        target.draft = answerMap(source.draft === undefined ? {} : source.draft, questions, false);
        target.orders = readOrders(source.orders === undefined ? {} : source.orders, questions);
        target.first = readAttempt(source.first, kind, questions);
        target.attempt = readAttempt(source.attempt, kind, questions);
        target.latest = readAttempt(source.latest, kind, questions);
        if (source.history !== undefined && (!Array.isArray(source.history) || source.history.length > MAX_HISTORY)) {
          fail('Lịch sử nộp bài không hợp lệ.');
        }
        target.history = (source.history || []).map(attempt => {
          const parsed = readAttempt(attempt, kind, questions);
          if (!parsed) fail('Lịch sử có lần nộp rỗng.');
          return parsed;
        });
        if (!target.first && (target.attempt || target.latest || target.history.length || source.completed === true)) {
          fail('Thiếu bản ghi lần nộp đầu tiên.');
        }
        if (target.first) {
          target.latest = target.latest || target.attempt || target.history.at(-1) || copy(target.first);
          if (!target.history.length) {
            target.history = [copy(target.first)];
            if (!sameAttempt(target.first, target.latest)) target.history.push(copy(target.latest));
          }
          if (!sameAttempt(target.history.at(-1), target.latest) ||
              (target.history.length < MAX_HISTORY && !sameAttempt(target.history[0], target.first))) {
            fail('Lịch sử và bản ghi lần nộp không khớp.');
          }
          if (target.attempt && (!sameAttempt(target.attempt, target.latest) ||
              JSON.stringify(answerMap(target.draft, questions, true)) !== JSON.stringify(target.attempt.answers))) {
            // Compare by question below as drafts may have a different property insertion order.
            if (!sameAttempt(target.attempt, target.latest) || questions.some(q =>
              JSON.stringify(target.draft[q.id]) !== JSON.stringify(target.attempt.answers[q.id]))) {
              fail('Bài hiện tại không khớp với bản đã nộp.');
            }
          }
          target.completed = true;
        }
      }
    }
    for (const [lesson, row] of Object.entries(state.lessons)) {
      for (const kind of PATH) {
        if (row[kind]?.first && !canOpen(state, lesson, kind)) fail('Thứ tự hoàn thành bài tập không hợp lệ.');
      }
    }
    // Question-review outcomes are reconstructed from answers, never imported as grades.
    rebuildReviews(state, bankIndex);
    return state;
  }

  function migrateLegacy(input, bank, now = Date.now()) {
    const raw = cleanInput(input), bankIndex = indexBank(bank);
    if (!record(raw) || raw.schema !== 2 || !record(raw.lessons)) fail('Tệp không phải tiến độ cũ phiên bản 2.');
    if (!timestamp(now)) fail('Thời gian chuyển bản không hợp lệ.');
    const state = blank();
    const migration = {sourceSchema: 2, at: now, restoredGroups: [], draftOnlyGroups: [],
      heldGroups: [], archivedTranslationLessons: [], warnings: []};
    state.archive = {legacy: copy(raw), migration};
    state.updatedAt = now;
    if (record(raw.words)) state.words = copy(raw.words);
    if (record(raw.preferences)) state.preferences = copy(raw.preferences);
    try { state.profile = profile(raw.profile); } catch (error) { migration.warnings.push(error.message); }
    for (const [lesson, sourceRow] of Object.entries(raw.lessons)) {
      if (record(sourceRow) && own(sourceRow, 'translation')) migration.archivedTranslationLessons.push(lesson);
    }
    for (const [lesson, kinds] of bankIndex.lessons) {
      const row = raw.lessons[lesson];
      if (!record(row)) continue;
      for (const kind of ['choice', 'sort', 'listening']) {
        const questions = kinds[kind], source = row[kind];
        if (!questions || !record(source)) continue;
        const compatible = questions.filter(q => q.legacyCompatible === true);
        if (!compatible.length) continue;
        const target = group(state, lesson, kind), label = lesson + ':' + kind;
        if (record(source.draft)) {
          for (const q of compatible) {
            if (own(source.draft, q.id) && validDraft(q, source.draft[q.id])) target.draft[q.id] = copy(source.draft[q.id]);
          }
        }
        if (compatible.length !== questions.length) {
          migration.draftOnlyGroups.push(label);
          continue;
        }
        try {
          // A changed item cannot inherit a score merely because its ID was reused.
          if (!record(source.first)) {
            if (Object.keys(target.draft).length) migration.draftOnlyGroups.push(label);
            continue;
          }
          target.first = makeAttempt(kind, questions, source.first.answers, source.first.at);
          let latest = copy(target.first);
          if (record(source.attempt)) {
            try { latest = makeAttempt(kind, questions, source.attempt.answers, source.attempt.at); }
            catch (error) { migration.warnings.push(label + ': ' + error.message); }
          }
          target.latest = copy(latest);
          target.history = [copy(target.first)];
          if (!sameAttempt(target.first, latest)) target.history.push(copy(latest));
          const exactDraft = questions.every(q => isAnswered(q, target.draft[q.id]) &&
            JSON.stringify(target.draft[q.id]) === JSON.stringify(latest.answers[q.id]));
          // Legacy corrections may already have changed draft; keep that draft as an
          // unsubmitted redo while preserving the original first and last snapshots.
          target.attempt = source.attempt && exactDraft ? copy(latest) : null;
          target.completed = true;
          if (record(source.orders)) {
            try { target.orders = readOrders(source.orders, questions); } catch (_) { target.orders = {}; }
          }
          migration.restoredGroups.push(label);
        } catch (error) {
          target.first = null; target.latest = null; target.attempt = null;
          target.completed = false; target.history = [];
          migration.draftOnlyGroups.push(label);
          migration.warnings.push(label + ': ' + error.message);
        }
      }
    }
    for (const [lesson, row] of Object.entries(state.lessons)) {
      const target = row.sort;
      if (target?.first && !canOpen(state, lesson, 'sort')) {
        target.first = null; target.latest = null; target.attempt = null;
        target.completed = false; target.history = [];
        const label = lesson + ':sort';
        migration.heldGroups.push(label);
        migration.restoredGroups = migration.restoredGroups.filter(item => item !== label);
      }
    }
    // New free-writing groups remain absent and unsubmitted. The entire old
    // translation group, including old option answers, is intact in archive.legacy.
    return validateImport(state, bank);
  }

  return {KEY, LEGACY_KEY, SCHEMA, KINDS, PATH, MAX_TRANSLATION_LENGTH, MAX_PROFILE_LENGTH,
    blank, group, normal, isAnswered, check, canOpen, submit, restart, totals,
    validateImport, migrateLegacy, remember};
});
