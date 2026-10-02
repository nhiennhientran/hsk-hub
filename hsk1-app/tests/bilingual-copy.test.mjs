import test from 'node:test';
import assert from 'node:assert/strict';
import { bilingualText, bilingualNode, setBilingual } from '../src/app/bilingual.ts';
import { vocabularyCopy, vocabularyFilters, vocabularyRatings, vocabularyAudioStatus, vocabularySaveStatus, vocabularyDynamic } from '../src/app/i18n/vocabulary.ts';

test('vocabulary UI dictionaries pair explicit Chinese and Vietnamese without changing curriculum content', () => {
  for (const group of [vocabularyCopy, vocabularyFilters, vocabularyRatings, vocabularyAudioStatus, vocabularySaveStatus]) {
    for (const [key, pair] of Object.entries(group)) {
      assert.match(pair.zh, /\p{Script=Han}/u, key);
      assert.ok(pair.vi.trim(), key);
      assert.equal(bilingualText(pair), `${pair.zh} · ${pair.vi}`);
    }
  }
  assert.deepEqual(vocabularyDynamic.count(13, 13), { zh: '本课显示 13 / 13 个词', vi: '13 / 13 từ trong bài' });
  assert.deepEqual(vocabularyDynamic.position(0, 33), { zh: '第 1 / 33 张', vi: 'Thẻ 1 / 33' });
  const available = vocabularyDynamic.available([1, 15], 33, 33, 33, '你好');
  assert.match(available.zh, /33 张卡/); assert.match(available.vi, /33 thẻ/);
  assert.equal(vocabularyDynamic.actionIssue('Storage conflict: exact detail').vi, 'Storage conflict: exact detail');
});

test('paired DOM helper preserves language semantics, safe text, and updates rather than duplicating labels', () => {
  const original = globalThis.document;
  const createElement = tagName => ({ tagName, children: [], textContent: '', replaceChildren(...children) { this.children = children; } });
  globalThis.document = { createElement };
  try {
    const host = bilingualNode('button', vocabularyCopy.reveal);
    assert.equal(host.tagName, 'button'); assert.equal(host.children.length, 3);
    assert.equal(host.children[0].lang, 'zh'); assert.equal(host.children[2].lang, 'vi');
    assert.equal(host.children[0].textContent, '查看答案');
    setBilingual(host, '<script>not markup</script>', 'Văn bản');
    assert.equal(host.children.length, 3); assert.equal(host.children[0].textContent, '<script>not markup</script>');
    assert.equal(host.children[2].textContent, 'Văn bản');
  } finally { if (original === undefined) delete globalThis.document; else globalThis.document = original; }
});
