import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createVocabularyContent } from '../../../../hsk1-app/src/services/content/vocabulary.ts';

const root = new URL('../../../../', import.meta.url);
const json = name => JSON.parse(readFileSync(new URL(`hsk1-app/content/${name}.json`, root), 'utf8'));
const catalog = json('stage3-catalog');
const media = json('media-references');
const textbook = json('textbook');
const revision = json('textbook-display-revisions');

for (const order of ['legacy-first', 'legacy-last']) {
  test(`reviewed 想 replacement rejects old/new Chinese alias coexistence: ${order}`, async () => {
    const changed = structuredClone(revision);
    const change = changed.changes.find(change => change.target === 'textbook-l06-grammar-01' && change.field === 'examples');
    const source = structuredClone(textbook.lessons[5].grammar[0].examples[1]);
    assert.equal(source.zh, '我不想休息。');
    assert.equal(change.value[1].zh, '我哥哥不想休息。');
    if (order === 'legacy-first') change.value.unshift(source);
    else change.value.push(source);
    await assert.rejects(
      createVocabularyContent(catalog, media, undefined, undefined, textbook, changed),
      /khớp duy nhất/,
    );
  });
}
