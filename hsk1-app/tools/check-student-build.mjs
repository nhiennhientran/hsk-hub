import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

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
const privateAudit = process.argv.includes('--private');
const sourcePaths = new Set();
let maps = 0, sources = 0;
for (const path of files) {
  const name = relative(dist, path);
  assert.doesNotMatch(name, forbidden, `Legacy/teacher artifact copied: ${name}`);
  if (!/\.(?:js|css|html|map)$/.test(path)) continue;
  const text = readFileSync(path, 'utf8');
  assert.doesNotMatch(text, /learning-integrated\.js|createEntryModule|stopExternal|window\.(?:HSK1Stage2|HSK1Stage3|HSKLearning)/, name);
  if (!privateAudit) assert.doesNotMatch(text, /sourceMappingURL=/, `Public source-map reference: ${name}`);
  if (!path.endsWith('.map')) continue;
  maps++;
  for (const source of JSON.parse(text).sources) {
    sources++; sourcePaths.add(source.split('?')[0]);
    assert.match(source, /^\.\.\/\.\.\/(?:src|content)\//, `Non-candidate source bundled: ${source}`);
    assert.doesNotMatch(source, forbidden);
  }
}
const auditPath = resolve(root, '.repro-output/student-build-source-audit.json');
const digest = value => createHash('sha256').update(value).digest('hex');
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
if (privateAudit) {
  assert.ok(maps > 0 && sources > 0, 'Inspect private build source maps before stripping');
  const records = [...sourcePaths].sort().map(path => ({ path, sha256: digest(readFileSync(resolve(root, path.replace(/^\.\.\/\.\.\//, '')))) }));
  mkdirSync(resolve(root, '.repro-output'), { recursive: true });
  writeFileSync(auditPath, JSON.stringify({ sourceCommit, maps, sources, records }, null, 2)+'\n');
} else {
  assert.equal(maps, 0, 'Public source maps are forbidden');
  const audit = JSON.parse(readFileSync(auditPath, 'utf8'));
  assert.equal(audit.sourceCommit, sourceCommit, 'Source provenance must match this checkout');
  assert.ok(audit.sources > 0 && audit.maps > 0, 'Missing private source provenance audit');
  for (const record of audit.records) {
    assert.match(record.path, /^\.\.\/\.\.\/(?:src|content)\//);
    assert.doesNotMatch(record.path, forbidden);
    assert.equal(digest(readFileSync(resolve(root, record.path.replace(/^\.\.\/\.\.\//, '')))), record.sha256, 'Source changed after build audit');
  }
  sources = audit.sources;
}
console.log(JSON.stringify({ status: 'PASS', identicalEntryAliases: 3, bootScripts: 1, sourceMaps: maps, candidateSourceReferences: sources, legacyRuntimeOrTeacherSources: 0 }));
