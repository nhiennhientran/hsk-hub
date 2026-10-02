import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Check the built artifact, not just requests observed on the routes a test happened to visit.
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
const walk = directory => readdirSync(directory).flatMap(name => {
  const path = resolve(directory, name); return statSync(path).isDirectory() ? walk(path) : [path];
});
const files = walk(dist);
const html = readFileSync(resolve(dist, 'index.html'), 'utf8');
for (const alias of ['lesson.html', 'learning.html']) assert.equal(readFileSync(resolve(dist, alias), 'utf8'), html, `${alias} must alias the one app`);
assert.equal((html.match(/<script\b/g) ?? []).length, 1, 'One boot script');
assert.match(html, /<script type="module"/);
const forbidden = /(?:learning-integrated|app-core|app-practice|auth-patch|textbook-[\w-]*corrections|tts-only|stage[23]\/app|stage3\/player|features\/entry\.ts|teacher[-_](?:answers?|reference))/i;
let maps = 0, sources = 0;
for (const path of files) {
  const name = relative(dist, path);
  assert.doesNotMatch(name, forbidden, `Legacy/teacher artifact copied: ${name}`);
  if (!/\.(?:js|css|html|map)$/.test(path)) continue;
  const text = readFileSync(path, 'utf8');
  assert.doesNotMatch(text, /learning-integrated\.js|createEntryModule|stopExternal|window\.(?:HSK1Stage2|HSK1Stage3|HSKLearning)/, name);
  if (!path.endsWith('.map')) continue;
  maps++;
  for (const source of JSON.parse(text).sources) {
    sources++;
    assert.match(source, /^\.\.\/\.\.\/(?:src|content)\//, `Non-candidate source bundled: ${source}`);
    assert.doesNotMatch(source, forbidden);
  }
}
assert.ok(maps > 0 && sources > 0, 'Inspect actual emitted source maps');
console.log(JSON.stringify({ status: 'PASS', identicalEntryAliases: 3, bootScripts: 1, sourceMaps: maps, candidateSourceReferences: sources, legacyRuntimeOrTeacherSources: 0 }));
