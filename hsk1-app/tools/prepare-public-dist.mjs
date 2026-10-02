import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url)), dist = resolve(root, 'dist');
const checkOnly = process.argv.includes('--check');
const walk = dir => readdirSync(dir).flatMap(name => { const path = resolve(dir, name); return statSync(path).isDirectory() ? walk(path) : [path]; });
// Resolve the old public classroom fixture only in memory for a negative leak
// check. Never print or write either its reversible representation or password.
const legacy = readFileSync(resolve(root, '../new-hsk1/hsk1/auth-patch.js'), 'utf8');
const signature = legacy.match(/const SIG='([0-9a-f.]+)'/)?.[1];
assert.ok(signature, 'Baseline leak-check fixture unavailable');
const password = signature.split('.').map(hex => String.fromCodePoint(parseInt(hex, 16))).join('');
let removed = 0;
if (!checkOnly) for (const path of walk(dist)) {
  if (path.endsWith('.map')) { unlinkSync(path); removed++; }
  else if (/\.(?:js|css)$/.test(path)) {
    const before = readFileSync(path, 'utf8');
    const after = before.replace(/\n?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?/g, '\n').replace(/\/\*# sourceMappingURL=[\s\S]*?\*\//g, '');
    if (after !== before) writeFileSync(path, after);
  }
}
let checked = 0;
for (const path of walk(dist)) {
  const name = relative(dist, path);
  assert.ok(!path.endsWith('.map'), `Public map forbidden: ${name}`);
  if (!/\.(?:js|css|html|json|txt)$/.test(path)) continue;
  const text = readFileSync(path, 'utf8');
  assert.ok(!text.includes(signature) && !text.includes(password), `Reversible classroom credential in public artifact: ${name}`);
  assert.doesNotMatch(text, /sourceMappingURL=|PASSWORD_SIGNATURE/, `Public debugging/fallback material: ${name}`);
  checked++;
}
console.log(JSON.stringify({ publicArtifact: 'PASS', removedSourceMaps: removed, checkedTextFiles: checked, publicMaps: 0, reversibleCredentialCopies: 0 }));
