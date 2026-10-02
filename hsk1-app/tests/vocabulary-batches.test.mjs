import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { vocabularyBatches } from './vocabulary-batches.ts';
const { vocabulary } = JSON.parse(await readFile(new URL('../content/stage3-catalog.json', import.meta.url), 'utf8'));

test('exhaustive browser batches cover every frozen sense once, all 330 audio records, and all 14 missing-audio records', () => {
  const covered = [];
  let audio = 0, noAudio = 0;
  for (const batch of vocabularyBatches) {
    const rows = vocabulary.filter(word => word.lesson >= batch.first && word.lesson <= batch.last);
    assert.equal(rows.length, batch.count);
    assert.equal(rows.filter(word => word.audio).length, batch.audio);
    assert.equal(rows.filter(word => !word.audio).length, batch.noAudio);
    covered.push(...rows.map(word => word.senseId)); audio += batch.audio; noAudio += batch.noAudio;
  }
  assert.equal(covered.length, 344); assert.equal(new Set(covered).size, 344);
  assert.deepEqual(covered, vocabulary.map(word => word.senseId));
  assert.deepEqual({ audio, noAudio }, { audio: 330, noAudio: 14 });
});
