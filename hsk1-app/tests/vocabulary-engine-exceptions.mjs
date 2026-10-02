import assert from 'node:assert/strict';

// Exact approved differences only: keep the rest of the frozen engine pinned.
export function withVocabularySearch(source) {
  const changes = [
    ['  function makeDeck(state, catalog, options = {}, now = Date.now(), random = Math.random) {', String.raw`  function vocabularySearch(value = '') {
    if (typeof value !== 'string' || value.length > 120) fail('INVALID_SEARCH', 'Từ khóa tìm kiếm tối đa 120 ký tự.');
    return value.trim().replace(/\s+/gu, ' ');
  }
  const foldSearch = value => value.normalize('NFKD').replace(/\p{M}/gu, '').replace(/[đĐ]/gu, 'd').toLowerCase().replace(/\s+/gu, ' ').trim();
  function matchesVocabulary(card, query) {
    if (!query) return true;
    const needle = foldSearch(query), compact = needle.replace(/\s+/gu, '');
    return card.sourceRecords.some(item =>
      [item.zh, item.vi].some(value => foldSearch(value).includes(needle)) ||
      foldSearch(item.py).replace(/\s+/gu, '').includes(compact));
  }
  function makeDeck(state, catalog, options = {}, now = Date.now(), random = Math.random) {`],
    ["    const shuffle = options.shuffle ?? state.preferences.shuffle;", "    const shuffle = options.shuffle ?? state.preferences.shuffle;\n    const search = vocabularySearch(options.search);"],
    ["    cards = cards.filter(card => {", "    cards = cards.filter(card => matchesVocabulary(card, search)).filter(card => {"],
    ["      fingerprints: Object.fromEntries(deck.senseIds.map(id => [id, index.senses.get(id).fingerprint])),", "      fingerprints: Object.fromEntries(deck.senseIds.map(id => [id, index.senses.get(id).fingerprint])),\n      ...(vocabularySearch(options.search) ? {search: vocabularySearch(options.search)} : {}),"],
    ["      const expected = makeDeck(before, catalog, {lessons: selected, filter: active.filter, direction: active.direction, shuffle: false}, active.startedAt);", "      const search = vocabularySearch(active.search);\n      const expected = makeDeck(before, catalog, {lessons: selected, filter: active.filter, direction: active.direction, shuffle: false, search}, active.startedAt);"],
    ["      state.cards.review = {...common, filter: active.filter, direction: active.direction, senseIds: ids.slice(), revealed, ratings,", "      state.cards.review = {...common, filter: active.filter, direction: active.direction, senseIds: ids.slice(), revealed, ratings,\n        ...(search ? {search} : {}),"],
  ];
  for (const [before, after] of changes) {
    assert.equal(source.split(before).length - 1, 1, `Search difference must match exactly once: ${before}`);
    source = source.replace(before, after);
  }
  return source;
}
