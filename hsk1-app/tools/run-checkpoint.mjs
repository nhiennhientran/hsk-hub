import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// The existing public, static classroom gate is the independent compatibility
// reference. Keep its password out of new source files, logs and test reports.
const gate = readFileSync(new URL('../../new-hsk1/hsk1/auth-patch.js', import.meta.url), 'utf8');
const signature = gate.match(/const SIG='([0-9a-f.]+)'/)?.[1];
if (!signature) throw new Error('Cannot resolve the baseline classroom gate for acceptance.');
const password = process.env.HSK_TEST_PASSWORD ?? signature.split('.').map(hex => String.fromCodePoint(Number.parseInt(hex, 16))).join('');
const kind = process.argv[2];
const args = kind === 'unit'
  ? ['--import', './tests/helpers/baseline-vi-loader.mjs', '--experimental-strip-types', '--test', ...readdirSync(new URL('../tests/', import.meta.url)).filter(name => name.endsWith('.test.mjs')).map(name => 'tests/' + name)]
  : kind === 'browser' ? ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(3)] : undefined;
if (!args) throw new Error('Choose unit or browser.');
const result = spawnSync(process.execPath, args, {
  cwd: fileURLToPath(new URL('../', import.meta.url)), env: { ...process.env, HSK_TEST_PASSWORD: password }, stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
