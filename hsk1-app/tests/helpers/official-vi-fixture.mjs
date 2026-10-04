import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createOfficialViRegistry, viCanonical, viProposal } from '../../src/services/content/official-vi-revisions.ts';
export const json = name => JSON.parse(readFileSync(new URL(`../../content/${name}.json`, import.meta.url), 'utf8'));
export const sha = text => createHash('sha256').update(text).digest('hex');
export const oldBank = json('stage2-bank');
export const catalog = json('stage3-catalog');
export const book = json('textbook');
export const media = json('media-references');
/** Synthetic source/proof: no official-book audit or production activation is claimed. */
export async function fixtureRegistry(revisionId, fields, mutate = () => {}) {
  const baselineFiles = [...new Set(fields.map(f => f.baselineFile))].map(file => ({ file, sha256: sha(`synthetic baseline ${file}`) }));
  const manifest = { schemaVersion: 1, revisionId, engine: 'hsk1', courseId: 'hsk1', baselineFiles, parentDisplayRevision: 'synthetic-parent',
    sources: [{ sourceId: 'synthetic-book', pdfSHA256: '1'.repeat(64), pdfPageCount: 50 }], changes: fields.map((field, i) => ({
      changeId: `${revisionId}-${i}`, baselineFile: field.baselineFile, field: field.field, ownerId: field.ownerId, component: field.component, lesson: field.lesson,
      expectedEffectiveValue: field.effectiveValue, newValue: field.newValue,
      sourceAnchor: { kind: 'directOfficial', sourceId: `synthetic-occurrence-${i}`, documentSourceId: 'synthetic-book', pdfSHA256: '1'.repeat(64), pdfPages: [18], printedPages: [3], section: 'synthetic test only', officialViText: field.newValue, zhContext: field.zhContext },
      classification: 'official-wording-variant', consumers: [{ baselineFile: field.baselineFile, field: field.field, ownerId: field.ownerId, component: field.component }], authorReview: { reviewer: 'fixture-author', status: 'accepted' }, independentReview: { reviewer: 'fixture-reviewer', status: 'accepted', evidenceRef: 'synthetic-review.json' },
    })), coverage: { scope: 'synthetic-only' }, independentReview: {} };
  mutate(manifest);
  const proposalSHA256 = sha(viCanonical(viProposal(manifest)));
  const proof = { reviewer: 'fixture-reviewer', author: 'fixture-author', status: 'accepted', proposalSHA256,
    acceptedChangeIds: manifest.changes.map(c => c.changeId), acceptedConsumerRefs: manifest.changes.flatMap(c => c.consumers), sourceEvidenceRefs: manifest.changes.map(c => c.sourceAnchor) };
  const reviewBytes = JSON.stringify(proof), reviewSHA256 = sha(reviewBytes);
  manifest.independentReview = { reviewer: proof.reviewer, status: proof.status, proposalSHA256, evidenceFile: 'synthetic-review.json', evidenceSHA256: reviewSHA256, acceptedChangeIds: proof.acceptedChangeIds };
  const manifestBytes = JSON.stringify(manifest);
  const inputs = { manifestBytes, manifestSHA256: sha(manifestBytes), reviewBytes, reviewSHA256, baselineFiles, parentDisplayRevision: 'synthetic-parent', fields };
  return { inputs, manifest, proof, registry: await createOfficialViRegistry(inputs) };
}
export const qField = (q, component, name, newValue) => ({ baselineFile: `content/${component === 'homework30' ? 'homework30-bank' : component === 'homework' ? 'stage2-bank' : 'stage3-catalog'}.json`, field: `/fixture/${q.id}/${name}`, ownerId: q.id, component, lesson: q.lesson, relativeField: `/${name}`, effectiveValue: q[name], zhContext: q.stem || q.transcript?.map(l => l.zh).join('') || '', newValue, ...(q.options ? { originalOptions: q.options } : {}) });
