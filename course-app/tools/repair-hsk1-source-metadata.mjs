import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {viCanonical, viProposal} from '../../hsk1-app/src/services/content/official-vi-revisions.ts';

const repo = resolve(import.meta.dirname, '../..');
const [reportFile, outputDirectory] = process.argv.slice(2);
assert.ok(reportFile && outputDirectory);
const read = file => readFileSync(file,'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');
const reportText = read(resolve(reportFile)), report = JSON.parse(reportText);
assert.equal(report.status,'accepted-source-metadata-repair-only');
assert.equal(report.counts.displayValueChanges,0);
assert.equal(report.counts.actualSemanticHolds,0);
assert.equal(report.counts.unresolvedSourceOccurrences,0);
assert.notEqual(report.reviewer,report.translationAuthor);
const registry = JSON.parse(read(resolve(repo,'hsk1-app/content/official-vi-registry.json')));
const manifestText = read(resolve(repo,'hsk1-app',registry.active.manifestFile));
const oldProofText = read(resolve(repo,'hsk1-app',registry.active.reviewFile));
assert.equal(hash(manifestText),report.inheritedManifestSHA256);
assert.equal(hash(oldProofText),report.inheritedReviewSHA256);
assert.equal(hash(readFileSync(resolve(repo,'course-app/docs/release-ready-20261005/retained-book-sources.json.gz'))),report.retainedSourceArchiveSHA256);
const manifest = JSON.parse(manifestText), oldProof = JSON.parse(oldProofText);
const vector = manifest.changes.map(c=>[c.baselineFile,c.field,c.ownerId,c.component,c.newValue]);
assert.equal(hash(JSON.stringify(vector)),report.inheritedAcceptedVIVectorSHA256);
const changes = new Map(manifest.changes.map(c=>[c.changeId,c])), seen = new Set();
for(const disposition of report.dispositions){
  assert.equal(disposition.status,'accepted-source-metadata-repair-only');
  assert.equal(disposition.preserveDisplayedValue,true);
  assert.ok(!seen.has(disposition.acceptedChangeId)); seen.add(disposition.acceptedChangeId);
  const change = changes.get(disposition.acceptedChangeId); assert.ok(change);
  for(const key of ['baselineFile','field','ownerId','component']) assert.equal(change[key],disposition.consumerRef[key]);
  assert.equal(hash(change.newValue),disposition.displayedValueSHA256);
  assert.equal(hash(change.zhContext),disposition.ChineseContextSHA256);
  // The disposition binds the original compact JSON in its retained key order.
  assert.equal(hash(JSON.stringify(change.sourceAnchor)),disposition.oldSourceAnchorSHA256);
  const anchor = disposition.proposedSourceAnchor;
  assert.equal(anchor.kind,disposition.proposedKind);
  assert.equal(anchor.zhContext,change.zhContext);
  if(anchor.kind==='directOfficial') assert.equal(anchor.officialViText,change.newValue);
  else {assert.equal(anchor.kind,'terminologyDerived');assert.equal(anchor.notVerbatim,true);assert.ok(anchor.rationale);}
  change.sourceAnchor = structuredClone(anchor);
}
assert.equal(seen.size,report.counts.reviewed);
assert.deepEqual(manifest.changes.map(c=>[c.baselineFile,c.field,c.ownerId,c.component,c.newValue]),vector);
for(const change of manifest.changes) change.independentReview = {status:'accepted',reviewer:report.reviewer,evidenceRef:registry.active.reviewFile};
const proposalSHA256 = hash(viCanonical(viProposal(manifest)));
// The HSK1 proof has a strict seven-key schema. Inheritance and metadata scope
// live in the separately saved report/receipt, rather than relaxing that guard.
const proof = {...oldProof,reviewer:report.reviewer,proposalSHA256,
  sourceEvidenceRefs:[...new Map(manifest.changes.map(c=>[viCanonical(c.sourceAnchor),c.sourceAnchor])).values()]};
const proofText = JSON.stringify(proof,null,2)+'\n', reviewSHA256 = hash(proofText);
manifest.independentReview = {...manifest.independentReview,reviewer:report.reviewer,proposalSHA256,evidenceSHA256:reviewSHA256};
const newManifestText = JSON.stringify(manifest,null,2)+'\n';
const receipt = {status:'staged-source-metadata-only-awaiting-exact-byte-independent-seal',proposalSHA256,
  manifestSHA256:hash(newManifestText),reviewSHA256,dispositionsSHA256:hash(reportText),counts:report.counts,
  inheritedAcceptedTranslation:{commit:report.persistedCommit,manifestSHA256:report.inheritedManifestSHA256,
    reviewSHA256:report.inheritedReviewSHA256,acceptedVIVectorSHA256:report.inheritedAcceptedVIVectorSHA256,changedValues:0},
  metadataReview:{reviewer:report.reviewer,scope:report.scope}};
const output = resolve(outputDirectory); mkdirSync(output,{recursive:true});
writeFileSync(resolve(output,'manifest.json'),newManifestText);writeFileSync(resolve(output,'review.json'),proofText);
writeFileSync(resolve(output,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
