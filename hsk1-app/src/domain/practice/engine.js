/* Pure ESM adaptation of new-hsk1/hsk1/stage3/engine.js.
 * Source SHA-256: 010cfde850b1b9a49f90b5b2ceb2c70991d255750c3514761f7b064401d36a17
 * Only the UMD wrapper and final export change; grading/state rules stay identical. */
  const APP = 'hsk1-stage3', KEY = 'ran_hsk1_stage3_v1', SCHEMA = 1;
  const MAX_BACKUP_BYTES = 4 * 1024 * 1024;
  const DAY = 86400000, MINUTE = 60000, MAX_TIME = 8640000000000000;
  const GOOD_DAYS = Object.freeze([1, 3, 7, 14, 30]);
  const RATES = Object.freeze([0.65, 0.75, 1, 1.25, 1.5]);
  const FILTERS = Object.freeze(['all', 'unfamiliar', 'wrong', 'due']);
  const DIRECTIONS = Object.freeze(['zh-vi', 'vi-zh']);
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value));
  const idOkay = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value) &&
    !['__proto__', 'prototype', 'constructor'].includes(value);
  const countOkay = value => Number.isSafeInteger(value) && value >= 0 && value <= 1000000000;
  const timeOkay = value => Number.isSafeInteger(value) && value >= 0 && value <= MAX_TIME;
  const textOkay = value => typeof value === 'string' && value.trim().length > 0;
  const fail = (code, message) => { const error = new Error(message); error.code = code; throw error; };
  function clock(now) {
    if (!timeOkay(now) || now > MAX_TIME - 30 * DAY) fail('INVALID_TIME', 'Thời gian không hợp lệ.');
    return now;
  }
  function copy(value, depth = 0, seen = new Set()) {
    if (depth > 24) fail('INVALID_BACKUP', 'Dữ liệu lồng quá nhiều cấp.');
    if (value === null || ['string', 'boolean'].includes(typeof value)) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if ((!record(value) && !Array.isArray(value)) || seen.has(value)) fail('INVALID_BACKUP', 'Dữ liệu không phải JSON hợp lệ.');
    seen.add(value);
    let result;
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype || value.length > 5000 ||
          Object.keys(value).length !== value.length) fail('INVALID_BACKUP', 'Danh sách dữ liệu không hợp lệ.');
      result = [];
      for (let i = 0; i < value.length; i++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
        if (!descriptor || descriptor.get || descriptor.set) fail('INVALID_BACKUP', 'Danh sách có phần tử không hợp lệ.');
        result.push(copy(descriptor.value, depth + 1, seen));
      }
    } else {
      result = {};
      for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
        if (['__proto__', 'prototype', 'constructor'].includes(key) || descriptor.get || descriptor.set) {
          fail('INVALID_BACKUP', 'Khóa dữ liệu không an toàn.');
        }
        result[key] = copy(descriptor.value, depth + 1, seen);
      }
    }
    seen.delete(value);
    return result;
  }
  function backupByteLength(value) {
    const json = JSON.stringify(value);
    if (typeof json !== 'string') fail('INVALID_BACKUP', 'Dữ liệu không phải JSON hợp lệ.');
    return new TextEncoder().encode(json).byteLength;
  }
  // A deterministic content-version marker, not an authentication mechanism.
  function fingerprint(value) {
    const source = JSON.stringify(value);
    let a = 2166136261, b = 3339675911;
    for (let i = 0; i < source.length; i++) {
      a = Math.imul(a ^ source.charCodeAt(i), 16777619);
      b = Math.imul(b ^ source.charCodeAt(i), 2246822519);
    }
    return 'v1-' + (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
  }
  function listeningFingerprint(q) {
    return fingerprint([q.id, q.lesson, q.kind, q.promptVi, q.audio.track, q.audio.start, q.audio.end,
      q.transcript.map(line => [line.zh, line.py, line.vi, line.speaker || '']), q.options, q.answer]);
  }
  // Sense identity is editorial: changing its meaning requires a new senseId.
  // Wording, pinyin, source additions, and missing audio do not erase its schedule.
  function senseFingerprint(item) { return fingerprint([item.senseId, item.zh.normalize('NFKC')]); }
  function lessons(value) {
    if (!Array.isArray(value) || value.some(n => !Number.isInteger(n) || n < 1 || n > 15)) {
      fail('INVALID_LESSONS', 'Hãy chọn các bài từ 1 đến 15.');
    }
    return [...new Set(value)].sort((a, b) => a - b);
  }
  function indexCatalog(catalog) {
    if (!record(catalog) || !Array.isArray(catalog.listening) || !Array.isArray(catalog.vocabulary)) {
      fail('INVALID_CATALOG', 'Thiếu ngân hàng nghe hoặc từ vựng.');
    }
    const questions = new Map(), senses = new Map(), vocabIds = new Set();
    for (const q of catalog.listening) {
      if (!record(q) || !idOkay(q.id) || questions.has(q.id) || !Number.isInteger(q.lesson) || q.lesson < 1 || q.lesson > 15 ||
          !textOkay(q.kind) || !textOkay(q.promptVi) || !record(q.audio) || !textOkay(q.audio.track) ||
          !Number.isFinite(q.audio.start) || q.audio.start < 0 || !Number.isFinite(q.audio.end) || q.audio.end <= q.audio.start ||
          !Array.isArray(q.transcript) || !q.transcript.length || q.transcript.some(line => !record(line) ||
            !textOkay(line.zh) || !textOkay(line.py) || !textOkay(line.vi)) ||
          !Array.isArray(q.options) || q.options.length !== 4 || q.options.some(x => !textOkay(x)) ||
          new Set(q.options).size !== 4 || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
        fail('INVALID_CATALOG', 'Câu nghe không hợp lệ hoặc bị trùng.');
      }
      questions.set(q.id, {q, fingerprint: listeningFingerprint(q)});
    }
    for (const item of catalog.vocabulary) {
      if (!record(item) || !idOkay(item.id) || vocabIds.has(item.id) || !idOkay(item.lexId) || !idOkay(item.senseId) ||
          !Number.isInteger(item.lesson) || item.lesson < 1 || item.lesson > 15 || !textOkay(item.zh) || !textOkay(item.py) ||
          !textOkay(item.vi) || !textOkay(item.senseZh) || !['ordinary', 'proper_noun'].includes(item.category) ||
          typeof item.extension !== 'boolean' || !record(item.source) ||
          !(item.audio === null || (record(item.audio) && textOkay(item.audio.track) && Number.isFinite(item.audio.start) &&
            item.audio.start >= 0 && Number.isFinite(item.audio.end) && item.audio.end > item.audio.start))) {
        fail('INVALID_CATALOG', 'Mục từ vựng không hợp lệ hoặc bị trùng.');
      }
      const fp = senseFingerprint(item), old = senses.get(item.senseId);
      if (old && old.fingerprint !== fp) fail('INVALID_CATALOG', 'Một mã nghĩa không thể dùng cho hai từ khác nhau.');
      if (!old) senses.set(item.senseId, {fingerprint: fp, records: []});
      senses.get(item.senseId).records.push(item); vocabIds.add(item.id);
    }
    return {questions, senses};
  }
  function blank() {
    return {app: APP, schema: SCHEMA, sequence: 0, updatedAt: null,
      preferences: {module: 'listening', lessons: [1], listeningMode: 'all', vocabularyFilter: 'all',
        direction: 'zh-vi', shuffle: true, rate: 1},
      listening: {records: {}, session: null}, cards: {schedule: {}, review: null}};
  }
  function assertState(state) {
    if (!record(state) || state.app !== APP || state.schema !== SCHEMA || !record(state.listening) ||
        !record(state.listening.records) || !record(state.cards) || !record(state.cards.schedule)) {
      fail('WRONG_APP', 'Đây không phải bản lưu nghe và từ vựng bước 3.');
    }
  }
  function readPreferences(input) {
    if (!record(input)) fail('INVALID_PREFERENCES', 'Tùy chọn không hợp lệ.');
    const defaults = blank().preferences;
    if (Object.keys(input).some(key => !own(defaults, key))) fail('INVALID_PREFERENCES', 'Tùy chọn chưa được hỗ trợ.');
    const out = {...defaults, ...input}; out.lessons = lessons(out.lessons);
    if (!['listening', 'vocabulary'].includes(out.module) || !['all', 'wrong'].includes(out.listeningMode) ||
        !FILTERS.includes(out.vocabularyFilter) || !DIRECTIONS.includes(out.direction) || typeof out.shuffle !== 'boolean' ||
        !RATES.includes(out.rate)) fail('INVALID_PREFERENCES', 'Tùy chọn không hợp lệ.');
    return out;
  }
  function setPreferences(state, patch, now = Date.now()) {
    assertState(state); clock(now);
    if (!record(patch)) fail('INVALID_PREFERENCES', 'Tùy chọn không hợp lệ.');
    state.preferences = readPreferences({...state.preferences, ...copy(patch)});
    state.updatedAt = now; return state.preferences;
  }
  function shuffled(values, random) {
    const result = values.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const number = random();
      if (!Number.isFinite(number) || number < 0 || number >= 1) fail('INVALID_RANDOM', 'Nguồn xáo trộn không hợp lệ.');
      const j = Math.floor(number * (i + 1)); [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function sequenceId(state, type, now) {
    if (!countOkay(state.sequence) || state.sequence === 1000000000) fail('INVALID_STATE', 'Số phiên không hợp lệ.');
    state.sequence++; return `${type}-${now}-${state.sequence}`;
  }
  function createListeningSession(state, catalog, options = {}, now = Date.now(), random = Math.random) {
    assertState(state); clock(now); const index = indexCatalog(catalog);
    const selected = lessons(options.lessons ?? state.preferences.lessons);
    const mode = options.mode ?? state.preferences.listeningMode, shuffle = options.shuffle ?? state.preferences.shuffle;
    if (!['all', 'wrong'].includes(mode) || typeof shuffle !== 'boolean') fail('INVALID_OPTIONS', 'Kiểu luyện nghe không hợp lệ.');
    let ids = catalog.listening.filter(q => selected.includes(q.lesson) &&
      (mode === 'all' || state.listening.records[q.id]?.latest.correct === false)).map(q => q.id);
    if (shuffle) ids = shuffled(ids, random);
    const optionOrders = {}, responses = {}, fingerprints = {};
    for (const id of ids) {
      optionOrders[id] = shuffled([0, 1, 2, 3], random);
      responses[id] = {selected: null, submission: null, listenCount: 0};
      fingerprints[id] = index.questions.get(id).fingerprint;
    }
    const session = {id: sequenceId(state, 'listen', now), lessons: selected, mode, questionIds: ids,
      optionOrders, fingerprints, position: 0, responses, startedAt: now, finishedAt: null};
    state.listening.session = session; state.updatedAt = now; return session;
  }
  function currentListening(state, catalog) {
    assertState(state); const session = state.listening.session;
    if (!session || !session.questionIds.length) fail('EMPTY_SESSION', 'Chưa có câu nghe trong lượt này.');
    const id = session.questionIds[session.position], indexed = indexCatalog(catalog).questions.get(id);
    if (!indexed || session.fingerprints[id] !== indexed.fingerprint) fail('CONTENT_CHANGED', 'Câu nghe đã đổi phiên bản. Hãy mở lượt mới.');
    return {session, id, q: indexed.q, fingerprint: indexed.fingerprint, response: session.responses[id]};
  }
  function selectListening(state, catalog, id, optionIndex, now = Date.now()) {
    clock(now); const current = currentListening(state, catalog);
    if (current.id !== id) fail('NOT_CURRENT', 'Hãy chọn đáp án cho câu đang mở.');
    if (current.response.submission) fail('ALREADY_SUBMITTED', 'Câu này đã nộp. Hãy mở lượt mới để luyện lại.');
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 3) fail('INVALID_ANSWER', 'Đáp án cần là một trong bốn lựa chọn.');
    current.response.selected = optionIndex; state.updatedAt = now; return current.response;
  }
  function recordListen(state, catalog, id, now = Date.now()) {
    clock(now); const current = currentListening(state, catalog);
    if (current.id !== id) fail('NOT_CURRENT', 'Âm thanh không thuộc câu đang mở.');
    if (current.response.listenCount >= 1000000000) fail('INVALID_STATE', 'Số lần nghe vượt giới hạn.');
    current.response.listenCount++; state.updatedAt = now; return current.response.listenCount;
  }
  function submitListening(state, catalog, now = Date.now()) {
    clock(now); const {session, id, q, fingerprint: fp, response} = currentListening(state, catalog);
    if (response.submission) fail('ALREADY_SUBMITTED', 'Câu này đã nộp. Hãy mở lượt mới để luyện lại.');
    if (response.selected === null) fail('ANSWER_REQUIRED', 'Hãy chọn một đáp án rồi nộp.');
    const submission = {answer: response.selected, correct: response.selected === q.answer, at: now, fingerprint: fp};
    const previous = state.listening.records[id];
    if (previous && previous.latest.fingerprint !== fp) fail('CONTENT_CHANGED', 'Câu nghe đã đổi phiên bản.');
    const attempts = (previous?.attempts || 0) + 1;
    if (!countOkay(attempts)) fail('INVALID_STATE', 'Số lần nộp không hợp lệ.');
    state.listening.records[id] = {first: copy(previous?.first || submission), latest: copy(submission), attempts};
    response.submission = copy(submission);
    if (session.questionIds.every(key => session.responses[key].submission)) session.finishedAt = now;
    state.updatedAt = now; return response.submission;
  }
  function moveListening(state, position, now = Date.now()) {
    assertState(state); clock(now); const session = state.listening.session;
    if (!session || !Number.isInteger(position) || position < 0 || position >= session.questionIds.length) fail('INVALID_POSITION', 'Vị trí câu nghe không hợp lệ.');
    if (session.questionIds.slice(0, position).some(id => !session.responses[id].submission)) fail('ANSWER_REQUIRED', 'Hãy nộp câu hiện tại trước khi chuyển tiếp.');
    session.position = position; state.updatedAt = now;
    return {position, done: session.questionIds.every(id => !!session.responses[id].submission)};
  }
  function nextListening(state, now = Date.now()) {
    assertState(state); const session = state.listening.session;
    if (!session || !session.questionIds.length) fail('EMPTY_SESSION', 'Chưa có câu nghe trong lượt này.');
    if (!session.responses[session.questionIds[session.position]].submission) fail('ANSWER_REQUIRED', 'Hãy chọn và nộp đáp án trước khi chuyển tiếp.');
    return moveListening(state, Math.min(session.position + 1, session.questionIds.length - 1), now);
  }
  function listeningSummary(state, catalog) {
    assertState(state); const index = indexCatalog(catalog), session = state.listening.session;
    const submitted = session ? session.questionIds.map(id => session.responses[id].submission).filter(Boolean) : [];
    const correct = submitted.filter(item => item.correct).length, total = session?.questionIds.length || 0;
    const records = [...index.questions.keys()].map(id => state.listening.records[id]).filter(Boolean);
    const firstCorrect = records.filter(item => item.first.correct).length;
    const latestCorrect = records.filter(item => item.latest.correct).length;
    const percent = (right, answered) => answered ? Math.round(right / answered * 100) : null;
    return {session: {total, answered: submitted.length, unanswered: total - submitted.length, correct,
        percentAmongAnswered: percent(correct, submitted.length), done: total > 0 && submitted.length === total},
      overall: {total: index.questions.size, answered: records.length, firstCorrect, latestCorrect,
        firstPercentAmongAnswered: percent(firstCorrect, records.length), latestPercentAmongAnswered: percent(latestCorrect, records.length)},
      wrongIds: [...index.questions.keys()].filter(id => state.listening.records[id]?.latest.correct === false)};
  }
  function makeDeck(state, catalog, options = {}, now = Date.now(), random = Math.random) {
    assertState(state); clock(now); indexCatalog(catalog);
    const selected = lessons(options.lessons ?? state.preferences.lessons);
    const filter = options.filter ?? state.preferences.vocabularyFilter, direction = options.direction ?? state.preferences.direction;
    const shuffle = options.shuffle ?? state.preferences.shuffle;
    if (!FILTERS.includes(filter) || !DIRECTIONS.includes(direction) || typeof shuffle !== 'boolean') fail('INVALID_OPTIONS', 'Kiểu ôn từ không hợp lệ.');
    const groups = new Map();
    for (const item of catalog.vocabulary) if (selected.includes(item.lesson)) {
      if (!groups.has(item.senseId)) groups.set(item.senseId, []);
      groups.get(item.senseId).push(item);
    }
    let cards = [...groups.entries()].map(([senseId, records]) => {
      const sourceRecords = copy(records), first = sourceRecords[0], audioRecord = sourceRecords.find(item => item.audio);
      return {senseId, zh: first.zh, py: first.py, vi: first.vi, senseZh: first.senseZh, cueZh: first.cueZh || '',
        lessons: [...new Set(records.map(item => item.lesson))].sort((a, b) => a - b), sourceRecords,
        meanings: [...new Set(records.map(item => item.vi))], category: first.category,
        extension: records.some(item => item.extension), audio: audioRecord?.audio || null, audioRecordId: audioRecord?.id || null};
    });
    const mergedCount = cards.length, distinctForms = new Set(cards.map(card => card.zh.normalize('NFKC'))).size;
    cards = cards.filter(card => {
      const entry = state.cards.schedule[card.senseId];
      return filter === 'all' || (filter === 'unfamiliar' && (!entry || entry.lastRating !== 'good')) ||
        (filter === 'wrong' && entry?.lastRating === 'again') || (filter === 'due' && (!entry || entry.dueAt <= now));
    });
    if (shuffle) cards = shuffled(cards, random);
    return {lessons: selected, selectedLessonCount: selected.length, mergedCount, distinctForms,
      filteredCount: cards.length, senseIds: cards.map(card => card.senseId), cards, filter, direction};
  }
  function startReview(state, catalog, options = {}, now = Date.now(), random = Math.random) {
    const deck = makeDeck(state, catalog, options, now, random), index = indexCatalog(catalog);
    const review = {id: sequenceId(state, 'cards', now), lessons: deck.lessons, filter: deck.filter, direction: deck.direction,
      senseIds: deck.senseIds, position: 0, revealed: {}, ratings: {},
      fingerprints: Object.fromEntries(deck.senseIds.map(id => [id, index.senses.get(id).fingerprint])),
      startedAt: now, finishedAt: null};
    state.cards.review = review; state.updatedAt = now; return review;
  }
  function currentReview(state) {
    assertState(state); const review = state.cards.review;
    if (!review || !review.senseIds.length) fail('EMPTY_REVIEW', 'Chưa có thẻ trong lượt ôn này.');
    return {review, id: review.senseIds[review.position]};
  }
  function revealCard(state, id, now = Date.now()) {
    clock(now); const current = currentReview(state);
    if (current.id !== id) fail('NOT_CURRENT', 'Hãy lật thẻ đang mở.');
    current.review.revealed[id] = true; state.updatedAt = now; return current.review;
  }
  function calculateRating(previous, fp, rating, now) {
    clock(now);
    if (!['again', 'hard', 'good'].includes(rating)) fail('INVALID_RATING', 'Hãy chọn một mức tự đánh giá.');
    let level = previous?.level || 0, dueAt, advanced = false;
    if (rating === 'again') { level = 0; dueAt = now + 10 * MINUTE; }
    else if (rating === 'hard') dueAt = now + DAY;
    else if (!previous || now >= previous.dueAt) {
      const next = Math.min(level + 1, GOOD_DAYS.length); advanced = next > level; level = next;
      dueAt = now + GOOD_DAYS[level - 1] * DAY;
    } else dueAt = previous.dueAt;
    const schedule = {fingerprint: fp, level, lastRating: rating, dueAt, ratedAt: now, reviewCount: (previous?.reviewCount || 0) + 1};
    if (!countOkay(schedule.reviewCount)) fail('INVALID_STATE', 'Số lần tự đánh giá không hợp lệ.');
    return {rating, at: now, previous: previous ? copy(previous) : null, advanced,
      early: rating === 'good' && !!previous && now < previous.dueAt, schedule};
  }
  function rateCard(state, catalog, rating, now = Date.now()) {
    const {review, id} = currentReview(state), sense = indexCatalog(catalog).senses.get(id);
    if (!sense || sense.fingerprint !== review.fingerprints[id]) fail('CONTENT_CHANGED', 'Nghĩa của thẻ đã đổi phiên bản.');
    if (!review.revealed[id]) fail('REVEAL_REQUIRED', 'Hãy nhớ lại rồi lật thẻ trước khi tự đánh giá.');
    if (own(review.ratings, id)) fail('ALREADY_RATED', 'Thẻ này đã được tự đánh giá trong lượt này.');
    const previous = state.cards.schedule[id] || null;
    if (previous && previous.fingerprint !== sense.fingerprint) fail('CONTENT_CHANGED', 'Nghĩa của thẻ đã đổi phiên bản.');
    const result = calculateRating(previous, sense.fingerprint, rating, now);
    state.cards.schedule[id] = copy(result.schedule); review.ratings[id] = copy(result);
    if (review.senseIds.every(key => own(review.ratings, key))) review.finishedAt = now;
    state.updatedAt = now; return result;
  }
  function moveCard(state, position, now = Date.now()) {
    clock(now); const {review} = currentReview(state);
    if (!Number.isInteger(position) || position < 0 || position >= review.senseIds.length) fail('INVALID_POSITION', 'Vị trí thẻ không hợp lệ.');
    if (review.senseIds.slice(0, position).some(id => !own(review.ratings, id))) fail('RATING_REQUIRED', 'Hãy tự đánh giá thẻ hiện tại trước khi chuyển tiếp.');
    review.position = position; state.updatedAt = now;
    return {position, done: review.senseIds.every(id => own(review.ratings, id))};
  }
  function nextCard(state, now = Date.now()) {
    const {review, id} = currentReview(state);
    if (!own(review.ratings, id)) fail('RATING_REQUIRED', 'Hãy tự đánh giá thẻ hiện tại trước khi chuyển tiếp.');
    return moveCard(state, Math.min(review.position + 1, review.senseIds.length - 1), now);
  }
  function cardSummary(state, catalog, now = Date.now()) {
    assertState(state); clock(now); const index = indexCatalog(catalog), review = state.cards.review;
    const ids = [...index.senses.keys()], entries = ids.map(id => state.cards.schedule[id]).filter(Boolean);
    return {totalSenses: ids.length, rated: entries.length, unfamiliar: ids.filter(id => !state.cards.schedule[id] || state.cards.schedule[id].lastRating !== 'good').length,
      wrong: entries.filter(entry => entry.lastRating === 'again').length,
      due: ids.filter(id => !state.cards.schedule[id] || state.cards.schedule[id].dueAt <= now).length,
      review: {total: review?.senseIds.length || 0, revealed: Object.keys(review?.revealed || {}).length,
        rated: Object.keys(review?.ratings || {}).length, done: !!review?.senseIds.length && review.senseIds.every(id => own(review.ratings, id))}};
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const sameSet = (a, b) => a.length === b.length && a.every(item => b.includes(item));
  function exactKeys(object, keys) {
    if (!record(object) || !sameSet(Object.keys(object), keys)) fail('INVALID_BACKUP', 'Danh sách mã và dữ liệu không khớp.');
  }
  function readSubmission(raw, indexed) {
    if (!record(raw) || !Number.isInteger(raw.answer) || raw.answer < 0 || raw.answer > 3 || !timeOkay(raw.at)) {
      fail('INVALID_ANSWER', 'Bản ghi đáp án không hợp lệ.');
    }
    if (raw.fingerprint !== indexed.fingerprint) fail('CONTENT_CHANGED', 'Bản lưu thuộc phiên bản câu nghe khác.');
    return {answer: raw.answer, correct: raw.answer === indexed.q.answer, at: raw.at, fingerprint: indexed.fingerprint};
  }
  function readSchedule(raw, fp) {
    if (!record(raw) || raw.fingerprint !== fp) fail('CONTENT_CHANGED', 'Bản lưu thuộc phiên bản nghĩa khác.');
    if (!Number.isInteger(raw.level) || raw.level < 0 || raw.level > 5 || !['again', 'hard', 'good'].includes(raw.lastRating) ||
        !timeOkay(raw.dueAt) || !timeOkay(raw.ratedAt) || raw.dueAt <= raw.ratedAt ||
        !countOkay(raw.reviewCount) || raw.reviewCount < 1 ||
        (raw.lastRating === 'again' && (raw.level !== 0 || raw.dueAt !== raw.ratedAt + 10 * MINUTE)) ||
        (raw.lastRating === 'hard' && raw.dueAt !== raw.ratedAt + DAY)) {
      fail('INVALID_SCHEDULE', 'Lịch ôn từ không hợp lệ.');
    }
    return {fingerprint: fp, level: raw.level, lastRating: raw.lastRating, dueAt: raw.dueAt,
      ratedAt: raw.ratedAt, reviewCount: raw.reviewCount};
  }
  function readQueueIdentity(raw, type, state, ids, selected, lookup) {
    if (!record(raw) || !Array.isArray(ids) || new Set(ids).size !== ids.length ||
        ids.some(id => !idOkay(id) || !lookup.has(id)) || !Number.isInteger(raw.position) || raw.position < 0 ||
        raw.position >= Math.max(ids.length, 1) || !timeOkay(raw.startedAt)) fail('INVALID_SESSION', 'Lượt luyện hoặc vị trí không hợp lệ.');
    const match = typeof raw.id === 'string' && raw.id.match(new RegExp(`^${type}-(\\d+)-(\\d+)$`));
    if (!match || Number(match[1]) !== raw.startedAt || Number(match[2]) < 1 || Number(match[2]) > state.sequence) {
      fail('INVALID_SESSION', 'Mã lượt luyện không hợp lệ.');
    }
    exactKeys(raw.fingerprints, ids);
    for (const id of ids) if (raw.fingerprints[id] !== lookup.get(id).fingerprint) fail('CONTENT_CHANGED', 'Nội dung trong lượt luyện đã đổi phiên bản.');
    return {id: raw.id, lessons: selected, position: raw.position, fingerprints: copy(raw.fingerprints), startedAt: raw.startedAt};
  }
  function importBackup(input, catalog) {
    const raw = copy(input);
    if (backupByteLength(raw) > MAX_BACKUP_BYTES) fail('BACKUP_TOO_LARGE', 'Bản sao vượt giới hạn 4 MiB.');
    assertState(raw); const index = indexCatalog(catalog), state = blank();
    if (!countOkay(raw.sequence) || !(raw.updatedAt === null || timeOkay(raw.updatedAt))) fail('INVALID_BACKUP', 'Thời gian hoặc số phiên không hợp lệ.');
    state.sequence = raw.sequence; state.updatedAt = raw.updatedAt; state.preferences = readPreferences(raw.preferences);
    for (const [id, entry] of Object.entries(raw.listening.records)) {
      const indexed = index.questions.get(id);
      if (!indexed) fail('UNKNOWN_ID', 'Bản lưu có mã câu nghe không thuộc bộ này.');
      if (!record(entry) || !countOkay(entry.attempts) || entry.attempts < 1) fail('INVALID_BACKUP', 'Số lần nộp câu nghe không hợp lệ.');
      const first = readSubmission(entry.first, indexed), latest = readSubmission(entry.latest, indexed);
      if (entry.attempts === 1 && !same(first, latest)) fail('INVALID_BACKUP', 'Lần đầu và lần gần nhất không khớp với số lượt.');
      state.listening.records[id] = {first, latest, attempts: entry.attempts};
    }
    const source = raw.listening.session;
    if (source !== null && source !== undefined) {
      if (!record(source)) fail('INVALID_SESSION', 'Lượt nghe không hợp lệ.');
      const selected = lessons(source.lessons), ids = source.questionIds;
      const common = readQueueIdentity(source, 'listen', state, ids, selected, index.questions);
      if (!['all', 'wrong'].includes(source.mode) || ids.some(id => !selected.includes(index.questions.get(id).q.lesson))) {
        fail('INVALID_SESSION', 'Câu nghe không thuộc các bài đã chọn.');
      }
      const allIds = catalog.listening.filter(q => selected.includes(q.lesson)).map(q => q.id);
      if (source.mode === 'all' && !sameSet(ids, allIds)) fail('INVALID_SESSION', 'Lượt nghe thiếu câu của các bài đã chọn.');
      exactKeys(source.optionOrders, ids); exactKeys(source.responses, ids);
      const optionOrders = {}, responses = {};
      for (const id of ids) {
        const order = source.optionOrders[id], response = source.responses[id];
        if (!Array.isArray(order) || !sameSet(order, [0, 1, 2, 3]) || new Set(order).size !== 4 ||
            !record(response) || !(response.selected === null || (Number.isInteger(response.selected) && response.selected >= 0 && response.selected <= 3)) ||
            !countOkay(response.listenCount)) fail('INVALID_SESSION', 'Lựa chọn, thứ tự hoặc số lần nghe không hợp lệ.');
        const submission = response.submission === null ? null : readSubmission(response.submission, index.questions.get(id));
        if (submission && (response.selected !== submission.answer || !same(state.listening.records[id]?.latest, submission))) {
          fail('INVALID_SESSION', 'Đáp án trong lượt nghe không khớp bản đã nộp.');
        }
        optionOrders[id] = order.slice(); responses[id] = {selected: response.selected, submission, listenCount: response.listenCount};
      }
      if (ids.slice(0, common.position).some(id => !responses[id].submission)) fail('INVALID_SESSION', 'Lượt nghe đã bỏ qua câu chưa nộp.');
      state.listening.session = {...common, mode: source.mode, questionIds: ids.slice(), optionOrders, responses,
        finishedAt: ids.length && ids.every(id => responses[id].submission) ? responses[ids.at(-1)].submission.at : null};
    }
    for (const [id, schedule] of Object.entries(raw.cards.schedule)) {
      const sense = index.senses.get(id);
      if (!sense) fail('UNKNOWN_ID', 'Bản lưu có mã nghĩa không thuộc bộ này.');
      state.cards.schedule[id] = readSchedule(schedule, sense.fingerprint);
    }
    const active = raw.cards.review;
    if (active !== null && active !== undefined) {
      if (!record(active)) fail('INVALID_SESSION', 'Lượt ôn từ không hợp lệ.');
      const selected = lessons(active.lessons), ids = active.senseIds;
      const common = readQueueIdentity(active, 'cards', state, ids, selected, index.senses);
      if (!FILTERS.includes(active.filter) || !DIRECTIONS.includes(active.direction) ||
          ids.some(id => !index.senses.get(id).records.some(item => selected.includes(item.lesson))) ||
          !record(active.revealed) || !record(active.ratings)) fail('INVALID_SESSION', 'Kiểu hoặc nguồn thẻ ôn không hợp lệ.');
      const revealed = {}, ratings = {}, before = copy(state);
      for (const [id, value] of Object.entries(active.revealed)) {
        if (!ids.includes(id) || value !== true) fail('INVALID_SESSION', 'Bản ghi lật thẻ không hợp lệ.');
        revealed[id] = true;
      }
      for (const [id, rawRating] of Object.entries(active.ratings)) {
        if (!ids.includes(id) || !revealed[id] || !record(rawRating)) fail('INVALID_RATING', 'Bản tự đánh giá cần thuộc thẻ đã lật.');
        const fp = index.senses.get(id).fingerprint;
        const previous = rawRating.previous === null ? null : readSchedule(rawRating.previous, fp);
        const calculated = calculateRating(previous, fp, rawRating.rating, rawRating.at);
        const saved = readSchedule(rawRating.schedule, fp);
        if (!same(saved, calculated.schedule) || !same(state.cards.schedule[id], calculated.schedule)) {
          fail('INVALID_SCHEDULE', 'Lịch ôn không khớp mức tự đánh giá và thời gian.');
        }
        ratings[id] = calculated;
        if (previous) before.cards.schedule[id] = previous; else delete before.cards.schedule[id];
      }
      const expected = makeDeck(before, catalog, {lessons: selected, filter: active.filter, direction: active.direction, shuffle: false}, active.startedAt);
      if (!sameSet(ids, expected.senseIds)) fail('INVALID_SESSION', 'Danh sách thẻ không khớp bộ lọc khi bắt đầu lượt.');
      if (ids.slice(0, common.position).some(id => !own(ratings, id))) fail('INVALID_SESSION', 'Lượt ôn đã bỏ qua thẻ chưa tự đánh giá.');
      state.cards.review = {...common, filter: active.filter, direction: active.direction, senseIds: ids.slice(), revealed, ratings,
        finishedAt: ids.length && ids.every(id => own(ratings, id)) ? ratings[ids.at(-1)].at : null};
    }
    return state;
  }
  function exportBackup(state, catalog) { return importBackup(state, catalog); }

  export default {APP, KEY, SCHEMA, MAX_BACKUP_BYTES, DAY, MINUTE, GOOD_DAYS, RATES, FILTERS, DIRECTIONS,
    blank, setPreferences, createListeningSession, selectListening, recordListen, submitListening,
    nextListening, moveListening, listeningSummary, makeDeck, startReview, revealCard, rateCard,
    nextCard, moveCard, cardSummary, importBackup, exportBackup, backupByteLength};
