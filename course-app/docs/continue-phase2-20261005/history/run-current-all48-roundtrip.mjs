import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {after} from 'node:test';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const output = process.env.HSK_PHASE2_HISTORY_OUTPUT
  ? resolve(process.env.HSK_PHASE2_HISTORY_OUTPUT) : dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(output, {recursive:true});
const originalReport = new URL('../../resume-20261004/flow-compat-review/all48-state-roundtrip-coverage.json', import.meta.url);
const originalHash = createHash('sha256').update(fs.readFileSync(originalReport)).digest('hex');
const write = fs.writeFileSync.bind(fs);
fs.writeFileSync = (file, ...args) => write(
  file instanceof URL && file.href === originalReport.href
    ? join(output, 'all48-roundtrip-current-coverage.json') : file,
  ...args,
);
after(() => {
  fs.writeFileSync = write;
  const afterHash = createHash('sha256').update(fs.readFileSync(originalReport)).digest('hex');
  if (afterHash !== originalHash) throw Error('Historical all48 coverage artifact changed');
  write(join(output, 'historical-all48-artifact-preservation.json'), JSON.stringify({
    originalArtifactSHA256: originalHash, afterArtifactSHA256: afterHash, unchanged: true,
    scope: 'Current runtime engines using unchanged original test source; synthetic nonempty memory ports, not native UI or textbook semantic acceptance',
  }, null, 2) + '\n');
});
await import('../../resume-20261004/flow-compat-review/all48-state-roundtrip.candidate.test.mjs');
