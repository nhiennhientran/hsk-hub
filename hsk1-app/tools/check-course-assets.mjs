import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Verify the built bytes independently of the Vite copy plugin. No downloading,
// encoding, timing extraction or generated fixtures are part of this check.
const root = fileURLToPath(new URL('../', import.meta.url));
const repository = resolve(root, '..');
const output = resolve(root, 'dist/course-assets');
const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const digest = value => createHash('sha256').update(value).digest('hex');
const book = json('content/textbook.json');
const media = json('content/media-references.json');
const supplement = json('review/hanzi-supplement.json');
const records = [];

assert.equal(book.schemaVersion, 1, 'Unsupported textbook manifest');
assert.equal(media.schemaVersion, 1, 'Unsupported media manifest');
assert.equal(book.baseline, media.baseline, 'Mixed source baselines');
assert.equal(book.lessons.length, 15, 'Incomplete textbook');
assert.equal(supplement.schemaVersion, 1, 'Unsupported Hanzi supplement manifest');
assert.equal(supplement.package, 'hanzi-writer-data', 'Unexpected supplement package');
assert.equal(supplement.version, '2.0.1', 'Unexpected supplement version');

function verifyFile(path, source, expected) {
  const original = readFileSync(source);
  const built = readFileSync(resolve(output, path));
  if (expected) {
    assert.equal(original.length, expected.bytes, `Source byte count changed: ${path}`);
    assert.equal(digest(original), expected.sha256, `Source hash changed: ${path}`);
  }
  assert.ok(built.equals(original), `Built file differs from its source: ${path}`);
  const record = { path, bytes: built.length, sha256: digest(built) };
  records.push(record);
  return { record, bytes: built };
}

const tracks = new Set();
let audioBytes = 0;
assert.equal(media.originalTracks.length, 93, 'Expected 93 original audio tracks');
for (const track of media.originalTracks) {
  assert.match(track.id, /^(?:[1-9]|1[0-5])-[1-7]$/, 'Invalid original track ID');
  assert.equal(track.path, `new-hsk1/hsk1/audio/${track.id}.mp3`, 'Unexpected original audio path');
  assert.ok(!tracks.has(track.id), `Duplicate original track: ${track.id}`);
  tracks.add(track.id);
  assert.ok(Number.isInteger(track.bytes) && track.bytes > 0, `Invalid audio size: ${track.id}`);
  assert.match(track.sha256, /^[a-f0-9]{64}$/, `Invalid audio hash: ${track.id}`);
  const result = verifyFile(`audio/${track.id}.mp3`, resolve(repository, track.path), track);
  audioBytes += result.record.bytes;
}
assert.deepEqual(readdirSync(resolve(output, 'audio')).sort(), [...tracks].map(id => `${id}.mp3`).sort(), 'Built audio inventory differs from the frozen manifest');

// Required characters come from visible word details and the original Hanzi
// curriculum. Punctuation, Latin letters and pronunciation are excluded.
const characters = new Set(book.lessons.flatMap(lesson => [lesson.hanzi.chars, ...lesson.vocab.map(word => word.zh)])
  .flatMap(text => text.match(/\p{Script=Han}/gu) ?? []));
assert.equal(characters.size, 267, 'Expected 267 required textbook characters');
assert.equal(supplement.entries.length, 17, 'Expected 17 recorded local supplements');
const additions = new Map();
for (const entry of supplement.entries) {
  assert.match(entry.character, /^\p{Script=Han}$/u, 'Invalid supplement character');
  assert.ok(characters.has(entry.character), `Supplement is not required by the textbook: ${entry.character}`);
  assert.ok(!additions.has(entry.character), `Duplicate supplement: ${entry.character}`);
  assert.equal(entry.file, `public/course-assets/hanzi/${entry.character}.json`, 'Unexpected supplement path');
  assert.ok(Number.isInteger(entry.bytes) && entry.bytes > 0, 'Invalid supplement byte count');
  assert.match(entry.sha256, /^[a-f0-9]{64}$/, 'Invalid supplement hash');
  additions.set(entry.character, entry);
}

function checkStrokes(data, character) {
  assert.ok(data && typeof data === 'object', `Invalid stroke JSON: ${character}`);
  assert.ok(Array.isArray(data.strokes) && data.strokes.length > 0 && data.strokes.every(stroke => typeof stroke === 'string' && stroke.trim()), `Invalid SVG strokes: ${character}`);
  assert.ok(Array.isArray(data.medians) && data.medians.length === data.strokes.length && data.medians.every(stroke =>
    Array.isArray(stroke) && stroke.length > 1 && stroke.every(point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite))), `Invalid stroke medians: ${character}`);
  if (data.radStrokes !== undefined) assert.ok(Array.isArray(data.radStrokes) && data.radStrokes.every(index =>
    Number.isInteger(index) && index >= 0 && index < data.strokes.length), `Invalid radical stroke indexes: ${character}`);
}
let hanziBytes = 0;
for (const character of [...characters].sort()) {
  const entry = additions.get(character);
  const source = entry ? resolve(root, entry.file) : resolve(repository, `new-hsk1/assets/hanzi-data/${character}.json`);
  const result = verifyFile(`hanzi/${character}.json`, source, entry);
  const data = JSON.parse(result.bytes.toString('utf8'));
  checkStrokes(data, character);
  if (entry) assert.equal(data.strokes.length, entry.strokes, `Supplement stroke count changed: ${character}`);
  hanziBytes += result.record.bytes;
}
assert.deepEqual(readdirSync(resolve(output, 'hanzi')).sort(), [...characters].map(character => `${character}.json`).sort(), 'Built Hanzi inventory differs from required characters');

assert.equal(supplement.license.file, 'public/course-assets/HANZI-DATA-LICENSE.txt', 'Unexpected Hanzi data license path');
assert.match(supplement.license.sha256, /^[a-f0-9]{64}$/, 'Invalid Hanzi data license hash');
const dataLicenseSource = readFileSync(resolve(root, supplement.license.file));
assert.equal(digest(dataLicenseSource), supplement.license.sha256, 'Hanzi data license provenance changed');
const dataLicense = verifyFile('HANZI-DATA-LICENSE.txt', resolve(root, supplement.license.file)).record;
const writerLicense = verifyFile('HANZI-WRITER-LICENSE.txt', resolve(root, 'src/services/hanzi/LICENSE')).record;
assert.equal(supplement.writer.version, '3.7.3', 'Unexpected Hanzi Writer version');
assert.equal(writerLicense.sha256, supplement.writer.license.sha256, 'Hanzi Writer license provenance changed');
assert.ok(readFileSync(resolve(root, 'public/course-assets/HANZI-WRITER-LICENSE.txt')).equals(readFileSync(resolve(root, 'src/services/hanzi/LICENSE'))), 'Public Hanzi Writer license differs from the bundled source license');

records.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
process.stdout.write(JSON.stringify({
  schemaVersion: 1,
  baseline: book.baseline,
  output: 'dist/course-assets',
  audio: { files: tracks.size, bytes: audioBytes, manifestHashesVerified: tracks.size, originalFilesUnchanged: tracks.size },
  hanzi: { files: characters.size, bytes: hanziBytes, originalLocalFiles: characters.size - additions.size, supplements: additions.size,
    strokeDataValidated: characters.size, sourceCopiesEqual: characters.size, supplementHashesVerified: additions.size },
  licenses: [dataLicense, writerLicense],
  totalBytes: records.reduce((sum, record) => sum + record.bytes, 0),
  assetManifestSha256: digest(JSON.stringify(records)),
}, null, 2) + '\n');
