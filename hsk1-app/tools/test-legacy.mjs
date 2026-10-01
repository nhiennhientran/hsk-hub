import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Baseline tests resolve source paths from the repository root.
const result = spawnSync(process.execPath, ['--test',
  'tools/tests/stage2-engine.test.cjs',
  'tools/tests/stage3-engine.test.cjs',
  'tools/tests/integration-final-data.test.cjs',
], { cwd: fileURLToPath(new URL('../..', import.meta.url)), stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
