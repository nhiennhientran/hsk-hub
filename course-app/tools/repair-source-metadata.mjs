import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {viProposalCanonicalJSON} from '../src/official-vi-revisions.ts';

// Preserve the already accepted VI vector; apply only independently reviewed
// source-occurrence repairs and stage exact bytes for a final independent seal.
const repo = resolve(import.meta.dirname, '../..');
const [reportFile, outputDirectory] = process.argv.slice(2);
assert.ok(reportFile && outputDirectory, 'Provide disposition report and staging directory');
const read = file => readFileSync(file, 'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');
const reportText = read(resolve(reportFile)), report = JSON.parse(reportText);
assert.equal(report.status, 'accepted-source-metadata-repair-only');
assert.equal(report.counts.displayValueChanges, 0);
assert.equal(report.counts.actualSemanticHolds, 0);
assert.notEqual(report.reviewer, report.translationAuthor);
const manifestFile = 'course-app/content/hsk2-official-vi-release-ready-20261005.json';
const reviewFile = 'course-app/content/hsk2-official-vi-release-ready-20261005.review.json';
const manifestText = read(resolve(repo, manifestFile)), oldProofText = read(resolve(repo, reviewFile));
assert.equal(hash(manifestText), report.inheritedManifestSHA256);
assert.equal(hash(oldProofText), report.inheritedReviewSHA256);
const manifest = JSON.parse(manifestText), oldProof = JSON.parse(oldProofText);
const vector = manifest.changes.map(c => [c.baselineFile,c.field,c.ownerId,c.component,c.newValue]);
assert.equal(hash(JSON.stringify(vector)), report.inheritedAcceptedVIVectorSHA256);
const sourceArchive = JSON.parse(gunzipSync(readFileSync(resolve(repo,
  'course-app/docs/release-ready-20261005/retained-book-sources.json.gz'))).toString('utf8'));
const sourceRecords = new Map(sourceArchive.lessons.filter(x => x.lesson.startsWith('hsk2-'))
  .flatMap(x => x.sourceRecords).map(source => [source.sourceId, source]));
const changes = new Map(manifest.changes.map(c => [c.changeId, c]));
const lexicon = JSON.parse(read(resolve(repo, 'course-app/content/hsk2-lexicon.json')));
const seen = new Set();
for (const disposition of report.dispositions) {
  assert.equal(disposition.status, 'accepted-source-metadata-repair-only');
  assert.equal(disposition.preserveDisplayedValue, true);
  assert.ok(!seen.has(disposition.acceptedChangeId)); seen.add(disposition.acceptedChangeId);
  const change = changes.get(disposition.acceptedChangeId); assert.ok(change);
  for (const field of ['baselineFile','field','ownerId','component']) assert.equal(change[field], disposition.consumerRef[field]);
  assert.equal(hash(change.newValue), disposition.displayedValueSHA256);
  assert.equal(hash(change.zhContext), disposition.ChineseContextSHA256);
  const references = disposition.actualSourceRefs.map(ref => {
    const source = sourceRecords.get(ref.sourceId); assert.ok(source, ref.sourceId);
    assert.equal(hash(source.viPrinted), ref.officialViSHA256);
    assert.equal(hash(source.zhAnchor), ref.officialZhSHA256);
    const pages = name => source[name+'s'] ?? (Array.isArray(source[name]) ? source[name] : [source[name]]);
    assert.deepEqual(pages('pdfPage'), ref.pdfPages);
    assert.deepEqual(pages('printedPage'), ref.printedPages);
    return {sourceId: source.sourceId, documentSourceId: 'hsk2-official-vi-20261004',
      pdfSHA256: manifest.sources[0].pdfSHA256, pdfPages: ref.pdfPages, printedPages: ref.printedPages,
      section: source.section, officialZhText: source.zhAnchor, officialViText: source.viPrinted};
  });
  assert.ok(references.length);
  if (disposition.proposedKind === 'directOfficial') {
    assert.equal(references.length, 1);
    assert.equal(references[0].officialViText, change.newValue);
    change.sourceAnchor = {kind: 'directOfficial', ...references[0], zhContext: change.zhContext};
  } else {
    assert.equal(disposition.proposedKind, 'terminologyDerived');
    assert.equal(disposition.notVerbatim, true);
    change.sourceAnchor = {kind: 'terminologyDerived', sourceId: references[0].sourceId,
      zhContext: change.zhContext, notVerbatim: true, terminologySourceRefs: references,
      sourceRelation: disposition.sourceRelation, rationale: disposition.rationale};
  }
}
assert.equal(seen.size, report.counts.reviewed);
const stableOwnerAliases = [];
for (const alias of manifest.changes.filter(c => c.baselineFile === 'course-app/content/hsk2-lexicon.json')) {
  const sense = lexicon.senses[Number(alias.field.split('/')[2])];
  const source = manifest.changes.find(c => c.component === 'vocabulary' && c.ownerId === sense.sources[0].wordId && seen.has(c.changeId));
  if (!source) continue;
  assert.equal(alias.zhContext, source.zhContext);
  assert.equal(alias.newValue, source.newValue);
  alias.sourceAnchor = structuredClone(source.sourceAnchor);
  stableOwnerAliases.push({consumerRef: Object.fromEntries(['baselineFile','field','ownerId','component'].map(k => [k,alias[k]])),
    sourceOwnerId: source.ownerId, sourceChangeId: source.changeId, aliasChangeId: alias.changeId});
}
assert.deepEqual(manifest.changes.map(c => [c.baselineFile,c.field,c.ownerId,c.component,c.newValue]), vector);
for (const change of manifest.changes) change.independentReview = {
  status: 'accepted', reviewer: report.reviewer, evidenceRef: reviewFile};
const proposalSHA256 = hash(viProposalCanonicalJSON(manifest));
const proof = {...oldProof, reviewer: report.reviewer, proposalSHA256,
  sourceEvidenceRefs: [...new Map(manifest.changes.map(c => [viProposalCanonicalJSON(c.sourceAnchor), c.sourceAnchor])).values()],
  inheritedAcceptedTranslation: {commit: report.persistedCommit,
    manifestSHA256: report.inheritedManifestSHA256, reviewSHA256: report.inheritedReviewSHA256,
    acceptedVIVectorSHA256: report.inheritedAcceptedVIVectorSHA256, changedValues: 0},
  sourceMetadataReview: {reviewer: report.reviewer, dispositionSHA256: hash(reportText),
    repairedReferences: seen.size, stableOwnerAliases, scope: report.scope}};
const proofText = JSON.stringify(proof, null, 2)+'\n', proofSHA256 = hash(proofText);
manifest.independentReview = {status: 'accepted', reviewer: report.reviewer, proposalSHA256,
  evidenceFile: reviewFile, evidenceSHA256: proofSHA256, acceptedChangeIds: proof.acceptedChangeIds};
const newManifestText = JSON.stringify(manifest, null, 2)+'\n';
const output = resolve(outputDirectory); mkdirSync(output, {recursive: true});
writeFileSync(resolve(output, 'manifest.json'), newManifestText);
writeFileSync(resolve(output, 'review.json'), proofText);
const receipt = {status: 'staged-source-metadata-only-awaiting-exact-byte-independent-seal',
  proposalSHA256, manifestSHA256: hash(newManifestText), reviewSHA256: proofSHA256,
  dispositionsSHA256: hash(reportText), counts: report.counts, stableOwnerAliases, inheritedAcceptedVIVectorSHA256: report.inheritedAcceptedVIVectorSHA256};
writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
