import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {viBindingsForDocument, viProposalCanonicalJSON, validateTrustedViRegistry} from '../src/official-vi-revisions.ts';

// Compile only exact author bytes whose entire official/changed scope has an
// independent accepted binding. Runtime still performs its full atomic guard.
const repo = resolve(import.meta.dirname, '../..');
const candidateRoot = resolve(process.argv[2] ?? '../release-ready/hsk3');
const reviewRoot = resolve(process.argv[3] ?? candidateRoot);
const courseId = 'hsk3-fltrp-2026';
const revisionId = 'hsk3-official-vi-release-ready-20261005';
const author = '/root/vi_hsk3_author', reviewer = '/root';
const manifestFile = `course-app/content/${revisionId}.json`;
const reviewFile = `course-app/content/${revisionId}.review.json`;
const read = file => readFileSync(file, 'utf8');
const digest = text => createHash('sha256').update(text).digest('hex');
const parse = file => JSON.parse(read(file));
const canonical = value => JSON.stringify(value && typeof value === 'object'
  ? Array.isArray(value) ? value.map(value => JSON.parse(canonical(value)))
    : Object.fromEntries(Object.keys(value).sort().map(key => [key, JSON.parse(canonical(value[key]))])) : value);
const key = value => JSON.stringify([value.baselineFile, value.field, value.ownerId, value.component]);
const ref = value => Object.fromEntries(['baselineFile', 'field', 'ownerId', 'component'].map(k => [k, value[k]]));
const baselineFiles = new Map(), allBindings = [], lessons = [];
const reviewEvidence = [];
const inheritedText = execFileSync('git', ['show', '9e89fa7145c285ec92990bbbeb5dce3080c5ddf0:course-app/content/hsk3-official-vi-release-ready-20261005.json'], {cwd:repo,encoding:'utf8',maxBuffer:16*1024*1024});
assert.equal(digest(inheritedText), '9bc063cbf7501dae2949f29d238630624175b50dfa2e7f3769e15e2c08020a52');
const inheritedChanges = new Map(JSON.parse(inheritedText).changes.map(change => [key(change),change]));
for (let number = 1; number <= 18; number++) {
  const nn = String(number).padStart(2, '0');
  const candidateFile = resolve(candidateRoot, `l${nn}.candidate.json`);
  const text = read(candidateFile), candidate = JSON.parse(text);
  const proofFile = resolve(reviewRoot, `independent-final.l${nn}.json`), proofText = read(proofFile), proof = JSON.parse(proofText);
  assert.equal(candidate.lesson, number);
  assert.equal(candidate.courseId, courseId);
  assert.equal(candidate.sourceCounterpartsComplete, true);
  assert.equal(proof.lesson, number);
  assert.equal(proof.candidateSHA256, digest(text), `Stale independent candidate: ${nn}`);
  assert.equal(proof.status, 'accepted');
  assert.equal(proof.sourceCounterpartsComplete, true);
  const assignedReviewer = number <= 6 ? '/root/vi_hsk1_author'
    : number <= 9 ? '/root/vi_hsk2_author' : '/root/vi_hsk1_author/hsk1_l06_l10';
  assert.equal(proof.reviewer, assignedReviewer);
  assert.equal(proof.author, author);
  assert.notEqual(proof.reviewer, author);
  assert.equal(proof.heldBindings.length, 0);
  assert.equal(candidate.pendingSourceCounterparts.length, 0);
  const file = `course-app/content/hsk3/lesson-${nn}.json`, rawText = read(resolve(repo, file));
  const registered = viBindingsForDocument(JSON.parse(rawText), file, courseId);
  assert.equal(candidate.baselineFile, file);
  assert.equal(candidate.baselineSHA256, digest(rawText));
  assert.equal(candidate.bindings.length, registered.length);
  const actual = new Map(registered.map(binding => [key(binding), binding]));
  assert.equal(new Set(candidate.bindings.map(key)).size, candidate.bindings.length, `Duplicate candidate ref: ${nn}`);
  assert.deepEqual(new Set(candidate.bindings.map(key)), new Set(actual.keys()), `Incomplete candidate consumer set: ${nn}`);
  const accepted = new Map(proof.acceptedBindings.map(binding => [key(binding), binding]));
  assert.equal(accepted.size, proof.acceptedBindings.length, `Duplicate accepted ref: ${nn}`);
  const required = new Set();
  for (const binding of candidate.bindings) {
    const baseline = actual.get(key(binding));
    assert.ok(baseline, `Unregistered field: ${nn} ${binding.field}`);
    assert.equal(binding.expectedEffectiveValue, baseline.value);
    assert.equal(binding.zhContext, baseline.zhContext);
    assert.equal(binding.newValue, binding.value);
    assert.ok(binding.sourceAnchor, `No source disposition: ${nn} ${binding.field}`);
    assert.ok(['directOfficial', 'terminologyDerived', 'editorial'].includes(binding.sourceAnchor.kind));
    assert.equal(binding.sourceAnchor.zhContext, baseline.zhContext);
    const mustReview = binding.sourceAnchor.kind !== 'editorial' || binding.newValue !== binding.expectedEffectiveValue;
    if (mustReview) {
      const authorStatus = binding.authorSemanticReview?.status;
      if(authorStatus === 'accepted-by-author-inheriting-exact-persisted-root-reviewed-value') {
        assert.equal(number,10);
        assert.equal(inheritedChanges.get(key(binding))?.newValue,binding.newValue,`Not an exact persisted inherited value: ${binding.field}`);
      } else assert.ok(['accepted-by-author', 'accepted-by-author-awaiting-new-independent-field-review'].includes(authorStatus), `Author did not accept: ${nn} ${binding.field}`);
      required.add(key(binding));
      const seal = accepted.get(key(binding));
      assert.ok(seal, `Unreviewed official/changed field: ${nn} ${binding.field}`);
      assert.equal(seal.newValue, binding.newValue);
      assert.equal(seal.sourceAnchorSHA256, digest(canonical(binding.sourceAnchor)), `Stale accepted anchor: ${nn} ${binding.field}`);
    }
    allBindings.push(binding);
  }
  assert.deepEqual(new Set(accepted.keys()), required, `Independent scope differs: ${nn}`);
  baselineFiles.set(file, digest(rawText));
  lessons.push({number, candidateSHA256: digest(text), reviewSHA256: digest(proofText), registeredFields: registered.length, independentlyReviewedFields: required.size});
  reviewEvidence.push({lesson: number, reviewer: proof.reviewer, candidateSHA256: digest(text), reviewSHA256: digest(proofText)});
}
const bindingByOwner = new Map(allBindings.filter(binding => /^\/vocabulary\/\d+\/vi$/.test(binding.field)).map(binding => [binding.ownerId, binding]));
for (const file of ['course-app/content/hsk3-lexicon.json', 'course-app/content/course-index.json']) {
  const rawText = read(resolve(repo, file)), raw = JSON.parse(rawText);
  baselineFiles.set(file, digest(rawText));
  for (const binding of viBindingsForDocument(raw, file, courseId)) {
    const source = file.includes('lexicon')
      ? bindingByOwner.get(raw.senses[Number(binding.field.split('/')[2])].sources[0].wordId)
      : allBindings.find(item => item.lesson === binding.lesson && item.field === '/title/vi');
    assert.ok(source, `No stable source owner for ${key(binding)}`);
    assert.equal(source.zhContext, binding.zhContext);
    allBindings.push({...binding, expectedEffectiveValue: binding.value, newValue: source.newValue,
      value: source.newValue, sourceAnchor: {...source.sourceAnchor, zhContext: binding.zhContext},
      classification: source.classification});
  }
}
const changes = allBindings.filter(binding => binding.expectedEffectiveValue !== binding.newValue).map(binding => {
  const anchor = structuredClone(binding.sourceAnchor); delete anchor.evidenceRef;
  return {...ref(binding), lesson: binding.lesson, zhContext: binding.zhContext,
    changeId: `${revisionId}:${digest(key(binding)).slice(0, 16)}`,
    expectedEffectiveValue: binding.expectedEffectiveValue, newValue: binding.newValue,
    classification: anchor.kind === 'editorial' ? 'editorial-no-direct-book-counterpart' : binding.classification,
    authorReview: {status: 'accepted', reviewer: author}, sourceAnchor: anchor, consumers: [ref(binding)],
    independentReview: {status: 'accepted', reviewer, evidenceRef: reviewFile}};
});
assert.ok(changes.length > 139, 'Only an old representative lesson was compiled');
const manifest = {schemaVersion: 1, engine: 'hsk23', courseId, revisionId,
  parentDisplayRevision: `${courseId}:baseline:2026.1`,
  baselineFiles: [...baselineFiles].sort().map(([file, sha256]) => ({file, sha256})),
  sources: [{sourceId: 'hsk3-official-vi-20261004', pdfSHA256: '7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951', pdfPageCount: 212}],
  changes, coverage: {acceptedOwnerIds: [...new Set(changes.map(change => change.ownerId))].sort(), pendingOwnerIds: [], unresolvedOwnerIds: []}};
const proposalSHA256 = digest(viProposalCanonicalJSON(manifest));
const proof = {reviewer, author, status: 'accepted', proposalSHA256,
  acceptedChangeIds: changes.map(change => change.changeId), acceptedConsumerRefs: changes.map(ref),
  sourceEvidenceRefs: [...new Map(changes.map(change => [viProposalCanonicalJSON(change.sourceAnchor), change.sourceAnchor])).values()],
  scopedIndependentReviews: reviewEvidence,
  inheritedEditorialScope: 'Unchanged editorial supplements retained; no new independent review claimed.'};
const proofText = JSON.stringify(proof, null, 2) + '\n', proofSHA256 = digest(proofText);
manifest.independentReview = {status: 'accepted', reviewer, proposalSHA256, evidenceFile: reviewFile,
  evidenceSHA256: proofSHA256, acceptedChangeIds: proof.acceptedChangeIds};
const manifestText = JSON.stringify(manifest, null, 2) + '\n';
await validateTrustedViRegistry({courseId,parentDisplayRevision:manifest.parentDisplayRevision,
  manifestText,manifestSHA256:digest(manifestText),reviewFile,reviewText:proofText,reviewSHA256:proofSHA256,
  documents:manifest.baselineFiles.map(baseline => ({file:baseline.file,rawText:read(resolve(repo,baseline.file))}))});
writeFileSync(resolve(repo, reviewFile), proofText); writeFileSync(resolve(repo, manifestFile), manifestText);
const registryFile = resolve(repo, 'course-app/content/official-vi-registry.json'), registry = parse(registryFile);
registry.courses.hsk3 = {manifestFile, manifestSHA256: digest(manifestText), reviewFile, reviewSHA256: proofSHA256};
const receipt = {schemaVersion: 1, status: 'independently-sealed-candidate-compiled', lessons,
  allRegisteredLessonFields: lessons.reduce((sum, lesson) => sum + lesson.registeredFields, 0),
  changes: changes.length, manifestSHA256: digest(manifestText), reviewSHA256: proofSHA256,
  sourceCounterpartsComplete: true, immutableBaselineHashes: manifest.baselineFiles};
const receiptFile = resolve(repo, 'course-app/docs/release-ready-20261005/hsk3-compiled-scope.json');
mkdirSync(dirname(receiptFile), {recursive: true}); writeFileSync(receiptFile, JSON.stringify(receipt, null, 2) + '\n');
writeFileSync(registryFile, JSON.stringify(registry, null, 2) + '\n');
console.log(JSON.stringify(receipt));
