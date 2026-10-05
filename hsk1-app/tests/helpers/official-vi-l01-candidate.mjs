import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createOfficialViRegistry, hsk1ViFields } from '../../src/services/content/official-vi-revisions.ts';

export const candidateFile = 'content/official-vi-revisions/hsk1-l01-core-20261005.json';
export const candidateReviewFile = 'content/official-vi-revisions/hsk1-l01-core-20261005.review.json';
export const candidateSHA = value => createHash('sha256').update(value).digest('hex');
export const candidateSourceBytes = file => readFileSync(new URL('../../' + file, import.meta.url), 'utf8');
const text = candidateSourceBytes;
export const candidateJSON = name => JSON.parse(text('content/' + name + '.json'));
export function candidatePointer(value, pointer) {
  return pointer.slice(1).split('/').reduce((parent, key) => parent[key.replaceAll('~1', '/').replaceAll('~0', '~')], value);
}
/** Actual authored payload and independently reviewed proof; never synthesize acceptance. */
export async function loadOfficialViL01Candidate() {
  const manifestBytes = text(candidateFile), reviewBytes = text(candidateReviewFile);
  const manifest = JSON.parse(manifestBytes), proof = JSON.parse(reviewBytes);
  const names = ['textbook', 'textbook-display-revisions', 'stage2-bank', 'stage3-catalog', 'homework30-bank', 'course-index'];
  const rawBytes = Object.fromEntries(names.map(name => ['content/' + name + '.json', text('content/' + name + '.json')]));
  const values = Object.fromEntries(Object.entries(rawBytes).map(([file, bytes]) => [file, JSON.parse(bytes)]));
  const allowed = new Set(Object.keys(rawBytes));
  const baselineFiles = manifest.baselineFiles.map(row => {
    if (!allowed.has(row.file)) throw Error('L01 candidate names an unbound baseline file.');
    return { file: row.file, sha256: candidateSHA(rawBytes[row.file]) };
  });
  const inputs = { manifestBytes, manifestSHA256: candidateSHA(manifestBytes), reviewBytes, reviewSHA256: candidateSHA(reviewBytes), reviewFile: candidateReviewFile,
    baselineFiles, parentDisplayRevision: values['content/textbook-display-revisions.json'].revision,
    fields: hsk1ViFields(values).filter(field => baselineFiles.some(file => file.file === field.baselineFile)) };
  return { manifest, proof, inputs, values, rawBytes, registry: await createOfficialViRegistry(inputs) };
}
