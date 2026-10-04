import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {viProposalCanonicalJSON, validateTrustedViRegistry} from '../../../src/official-vi-revisions.ts';
const root = new URL('../../../../', import.meta.url);
const out = new URL('./', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const reviewDir = 'course-app/docs/resume-20261004/qa-official-vi/hsk3-l10-manifest-independent/';
const reviewerFile = reviewDir + 'review.v2.json';
const reviewBytes = read(reviewerFile);
assert.equal(sha(reviewBytes), '10e02b3e447d573a5d3df520aefd8f9578c040d15735a3c9b429139ef6407e2d');
const report = JSON.parse(reviewBytes);
const freeze = JSON.parse(read(reviewDir + 'freeze-v2.json'));
for (const [file, expected] of Object.entries(freeze.files)) assert.equal(sha(read(reviewDir + file)), expected);
const manifestBytes = read(report.inputManifestFile);
assert.equal(sha(manifestBytes), report.inputManifestSHA256);
const manifest = JSON.parse(manifestBytes);
assert.equal(sha(viProposalCanonicalJSON(manifest)), report.proposalSHA256);
assert.equal(manifest.changes.length, 136);
assert.equal(report.validation.finalHeldCount, 0);
assert.equal(report.validation.privateProjectionNonVILeafChanges, 0);
assert.equal(report.author, 'root');
assert.notEqual(report.author, report.reviewer);
const reviewFile = 'course-app/content/hsk3-official-vi-l10-v2.review.json';
const manifestFile = 'course-app/content/hsk3-official-vi-l10-v2.manifest.json';
const proof = Object.fromEntries(['schemaVersion', 'status', 'author', 'reviewer', 'proposalSHA256',
  'acceptedChangeIds', 'acceptedConsumerRefs', 'sourceEvidenceRefs'].map(key => [key, report[key]]));
const proofText = JSON.stringify(proof, null, 2) + '\n';
const reviewSHA256 = sha(proofText);
for (const change of manifest.changes) change.independentReview = {
  reviewer: report.reviewer, status: 'accepted', evidenceRef: reviewFile};
manifest.independentReview = {reviewer: report.reviewer, status: 'accepted', proposalSHA256: report.proposalSHA256,
  evidenceFile: reviewFile, evidenceSHA256: reviewSHA256, acceptedChangeIds: report.acceptedChangeIds};
assert.equal(sha(viProposalCanonicalJSON(manifest)), report.proposalSHA256);
const manifestText = JSON.stringify(manifest, null, 2) + '\n';
const documents = manifest.baselineFiles.map(ref => {
  const rawText = read(ref.file).toString('utf8'); assert.equal(sha(rawText), ref.sha256);
  return {file: ref.file, rawText};
});
const registry = await validateTrustedViRegistry({courseId: manifest.courseId, parentDisplayRevision: manifest.parentDisplayRevision,
  manifestText, manifestSHA256: sha(manifestText), reviewText: proofText, reviewSHA256, reviewFile, documents});
const actualChanges = [];
function compare(a, b, file, pointer = '') {
  if (typeof a !== 'object' || a === null) {
    if (a !== b) actualChanges.push({file, field: pointer, before: a, after: b});
    return;
  }
  assert.equal(Array.isArray(a), Array.isArray(b));
  assert.deepEqual(Object.keys(a), Object.keys(b));
  for (const key of Object.keys(a)) compare(a[key], b[key], file, pointer + '/' + key.replace(/~/g, '~0').replace(/\//g, '~1'));
}
for (const doc of documents) {
  const original = JSON.parse(doc.rawText), context = {baselineFile: doc.file, sourceSHA256: sha(doc.rawText)};
  const projected = Array.isArray(original) ? registry.projectCourseIndex(original, context)
    : doc.file.endsWith('-lexicon.json') ? registry.projectLexicon(original, context) : registry.projectLesson(original, context);
  compare(original, projected, doc.file);
  assert.equal(read(doc.file).toString('utf8'), doc.rawText);
}
assert.equal(actualChanges.length, 136);
assert.ok(actualChanges.every(change => change.field.endsWith('/vi')));
assert.deepEqual(actualChanges.map(change => JSON.stringify([change.file, change.field])).sort(),
  manifest.changes.map(change => JSON.stringify([change.baselineFile, change.field])).sort());
for (const change of actualChanges) {
  const expected = manifest.changes.find(ref => ref.baselineFile === change.file && ref.field === change.field);
  assert.equal(change.before, expected.expectedEffectiveValue); assert.equal(change.after, expected.newValue);
}
fs.writeFileSync(new URL('hsk3-official-vi-l10-v2.review.json', out), proofText);
fs.writeFileSync(new URL('hsk3-official-vi-l10-v2.manifest.json', out), manifestText);
const ledger = {schemaVersion: 1, status: 'privately-assembled-independent-accepted-136-fields-runtime-validator-passed-not-activated',
  revisionId: registry.revisionId, proposalSHA256: report.proposalSHA256, manifestFile, manifestSHA256: sha(manifestText),
  reviewFile, reviewSHA256, actualVILeafChanges: 136, nonVILeafChanges: 0, sourceEvidenceRefs: proof.sourceEvidenceRefs.length,
  independentSourceReport: reviewerFile, independentSourceReportSHA256: sha(reviewBytes),
  fullLessonAlignmentAccepted: false, fullWebsiteAlignmentAccepted: false, activeRegistryChanged: false,
  publicContentFilesWritten: false, nativeCurrentOfficialFieldsExecuted: 0, publicationApproved: false,
  rawBaselineFiles: documents.map(doc => ({file: doc.file, sha256: sha(doc.rawText)}))};
fs.writeFileSync(new URL('hsk3-l10.accepted-private-projection.json', out), JSON.stringify(ledger, null, 2) + '\n');
console.log(JSON.stringify(ledger));
