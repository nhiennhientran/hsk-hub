import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {viBindingsForDocument, baselineViDisplayRevision, viProposalCanonicalJSON} from '../../../src/official-vi-revisions.ts';

// Private proposal preparation only. It cannot create trusted acceptance or
// change a public registration. Exact source spans are never inferred by fuzzy
// translation similarity; unsupported compositions stay pending.
const root = new URL('../../../../', import.meta.url);
const out = new URL('./', import.meta.url);
const json = path => JSON.parse(fs.readFileSync(new URL(path, root), 'utf8'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sourceDir = 'course-app/docs/resume-20261004/official-vi-source-prep/hsk3-l10/';
const comparisonPath = 'course-app/docs/resume-20261004/qa-official-vi/hsk3-l10-comparison/field-comparisons.json';
const acceptedInputCommit = '6f668b4f47ed22cffe0c02d1993263fb83b1304e';
for (const file of [comparisonPath, ...['body-vietnamese-transcription.json', 'appendix-lesson10-vietnamese-transcription.json'].map(file => sourceDir + file)]) {
  const frozen = execFileSync('git', ['show', acceptedInputCommit + ':' + file], {cwd: fileURLToPath(root), maxBuffer: 8 * 1024 * 1024});
  assert.deepEqual(fs.readFileSync(new URL(file, root)), frozen, 'accepted source/comparison input drift');
}
const overrides = new Map(JSON.parse(fs.readFileSync(new URL('hsk3-l10.construction-overrides.json', out))).overrides.map(row => [row.targetRecordId, row]));
const sourceRows = ['body-vietnamese-transcription.json', 'appendix-lesson10-vietnamese-transcription.json'].flatMap(file => json(sourceDir + file).rows);
assert.equal(sourceRows.length, 119);
const sources = new Map(sourceRows.map(row => [row.recordId, row]));
assert.equal(sources.size, 119);
const courseId = 'hsk3-fltrp-2026';
const docId = 'hsk3-official-vietnamese-20261004';
const pdfSHA256 = '7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951';
const proposals = json(comparisonPath).filter(row => row.oldValue !== row.newValue);
assert.equal(proposals.length, 135);
const documents = [...new Set(proposals.map(row => row.file))].sort().map(file => {
  const rawText = fs.readFileSync(new URL(file, root), 'utf8');
  return {file, rawText, bindings: viBindingsForDocument(JSON.parse(rawText), file, courseId)};
});
const bindings = new Map(documents.flatMap(doc => doc.bindings).map(binding => [JSON.stringify([binding.baselineFile, binding.field]), binding]));
const changes = [], pending = [];
for (const row of proposals) {
  const binding = bindings.get(JSON.stringify([row.file, row.field]));
  assert.ok(binding, 'unregistered pointer ' + row.field);
  assert.equal(binding.value, row.oldValue, 'baseline drift ' + row.field);
  const override = overrides.get(row.targetRecordId);
  if (binding.zhContext !== row.chineseContext && !(override?.kind === 'actual-owner-context-binding' &&
      override.comparisonChineseContext === row.chineseContext && override.actualChineseContext === binding.zhContext)) {
    pending.push({targetRecordId: row.targetRecordId, file: row.file, field: row.field, sourceIDs: row.sourceIDs,
      reason: 'Comparison Chinese context differs from actual runtime owner; explicit mapping review required',
      comparisonChineseContext: row.chineseContext, actualChineseContext: binding.zhContext});
    continue;
  }
  const refs = row.sourceIDs.map(id => {
    assert.ok(sources.has(id), 'unread source ' + id);
    return sources.get(id);
  });
  assert.ok(refs.length);
  let anchor;
  if (refs.length === 1 && refs[0].printedVietnamese === row.newValue) {
    const source = refs[0];
    anchor = {kind: 'directOfficial', sourceId: source.recordId, documentSourceId: docId, pdfSHA256,
      pdfPages: [source.pdfPage], printedPages: [source.printedPage], section: source.section,
      officialViText: source.printedVietnamese, officialZhText: source.chineseAnchor, zhContext: binding.zhContext};
  } else {
    const fragments = [];
    let supported = true;
    for (const source of refs) {
      const text = source.printedVietnamese;
      const targetStart = row.newValue.indexOf(text);
      const sourceStart = refs.length === 1 ? text.indexOf(row.newValue) : -1;
      if (targetStart >= 0) fragments.push({sourceId: source.recordId, sourceField: 'printedVietnamese', sourceStartUTF16: 0,
        sourceEndUTF16: text.length, targetStartUTF16: targetStart, targetEndUTF16: targetStart + text.length, text});
      else if (sourceStart >= 0) fragments.push({sourceId: source.recordId, sourceField: 'printedVietnamese', sourceStartUTF16: sourceStart,
        sourceEndUTF16: sourceStart + row.newValue.length, targetStartUTF16: 0, targetEndUTF16: row.newValue.length, text: row.newValue});
      else if (override?.kind === 'explicit-contiguous-source-span-plus-existing-range' && override.sourceId === source.recordId) {
        assert.equal(text, override.sourceText);
        assert.equal(text.slice(override.sourceStartUTF16, override.sourceEndUTF16), override.selectedText);
        assert.equal(row.newValue.slice(override.targetStartUTF16, override.targetEndUTF16), override.selectedText);
        assert.equal(row.newValue.slice(override.targetEndUTF16), override.unchangedEditorialRange);
        assert.ok(row.oldValue.endsWith(override.unchangedEditorialRange));
        fragments.push({sourceId: source.recordId, sourceField: 'printedVietnamese', sourceStartUTF16: override.sourceStartUTF16,
          sourceEndUTF16: override.sourceEndUTF16, targetStartUTF16: override.targetStartUTF16,
          targetEndUTF16: override.targetEndUTF16, text: override.selectedText, explicitConstructionProposal: true});
      }
      else supported = false;
    }
    if (!supported) {
      pending.push({targetRecordId: row.targetRecordId, file: row.file, field: row.field, sourceIDs: row.sourceIDs,
        reason: 'No exact whole-source or selected-contiguous-span construction; explicit author span/composition review required'});
      continue;
    }
    anchor = {kind: 'terminologyDerived', sourceId: refs[0].recordId, zhContext: binding.zhContext, notVerbatim: true,
      terminologySourceRefs: refs.map(source => ({documentSourceId: docId, pdfSHA256, sourceId: source.recordId,
        pdfPages: [source.pdfPage], printedPages: [source.printedPage], section: source.section})), sourceFragments: fragments,
      compositionReview: {status: 'pending', policy: 'Exact cited spans shown; all uncited glue/editorial suffix must be independently checked against full old/new values.'}};
  }
  const consumer = {baselineFile: binding.baselineFile, field: binding.field, ownerId: binding.ownerId, component: binding.component};
  changes.push({changeId: 'hsk3-l10:' + row.targetRecordId, ...consumer, lesson: binding.lesson,
    expectedEffectiveValue: binding.value, newValue: row.newValue, classification: 'official-wording-variant', sourceAnchor: anchor,
    consumers: [consumer], authorReview: {reviewer: 'remaining_media_audit', status: 'proposal-awaiting-explicit-manifest-author-review', evidenceRef: comparisonPath}});
}
const manifest = {schemaVersion: 1, revisionId: 'hsk3-official-vi-pilot-l10-draft-20261004', engine: 'hsk23', courseId,
  parentDisplayRevision: baselineViDisplayRevision(courseId), baselineFiles: documents.map(doc => ({file: doc.file, sha256: sha(doc.rawText)})),
  sources: [{sourceId: docId, pdfSHA256, pdfPageCount: 212}], changes,
  coverage: {acceptedOwnerIds: [], pendingOwnerIds: [...new Set(proposals.map(row => bindings.get(JSON.stringify([row.file, row.field])).ownerId))], unresolvedOwnerIds: []}};
const ledger = {schemaVersion: 1, status: 'private-unaccepted-proposal-no-activation', comparisonPath,
  comparisonSHA256: sha(fs.readFileSync(new URL(comparisonPath, root))), acceptedInputCommit,
  constructionOverridesSHA256: sha(fs.readFileSync(new URL('hsk3-l10.construction-overrides.json', out))), sourceOccurrenceCount: 119,
  proposedChangedFields: proposals.length, draftChanges: changes.length, pendingSpanConstruction: pending,
  directOfficial: changes.filter(change => change.sourceAnchor.kind === 'directOfficial').length,
  terminologyDerived: changes.filter(change => change.sourceAnchor.kind === 'terminologyDerived').length,
  proposalSHA256: sha(viProposalCanonicalJSON(manifest)), independentAcceptedChanges: 0, activeRegistryChanges: 0,
  rawFileWrites: 0, publicFileWrites: 0, sourceInputFiles: ['body-vietnamese-transcription.json', 'appendix-lesson10-vietnamese-transcription.json'].map(file =>
    ({file: sourceDir + file, sha256: sha(fs.readFileSync(new URL(sourceDir + file, root)))}))};
fs.writeFileSync(new URL('hsk3-l10.draft-manifest.json', out), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(new URL('hsk3-l10.draft-construction-ledger.json', out), JSON.stringify(ledger, null, 2) + '\n');
console.log(JSON.stringify({status: ledger.status, fields: proposals.length, drafted: changes.length,
  direct: ledger.directOfficial, derived: ledger.terminologyDerived, pending: pending.length, activated: 0}));
