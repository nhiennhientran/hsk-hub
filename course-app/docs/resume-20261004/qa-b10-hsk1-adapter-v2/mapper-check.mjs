import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {hsk1ViFields,viCanonical,viPointer,isViDisplayField} from '../../../../hsk1-app/src/services/content/official-vi-revisions.ts';
const sha = input => createHash('sha256').update(input).digest('hex');
const names = ['textbook','textbook-display-revisions','stage2-bank','stage3-catalog','homework30-bank','course-index'];
const values = Object.fromEntries(names.map(name => [`content/${name}.json`, JSON.parse(readFileSync(new URL(`../../../../hsk1-app/content/${name}.json`,import.meta.url),'utf8'))]));
const fields = hsk1ViFields(values), byComponent = {}, bySource = {}, unique = new Set(), actualDescriptors = [];
let optionLeaves=0, checkedOriginalArrays=0;
for (const field of fields) {
  let value=values[field.baselineFile]; for (const part of viPointer(field.field)) { assert.ok(Object.hasOwn(value,part)); value=value[part]; }
  assert.equal(value,field.effectiveValue); assert.ok(isViDisplayField(field.component,field.relativeField));
  assert.ok(!viPointer(field.relativeField).some(part=>['pos','posLabel','source','label','zh','py','answer','answers','fingerprint','id','senseId','catalogId','sourceRecords','tokens'].includes(part)));
  const key=viCanonical([field.baselineFile,field.field,field.ownerId,field.component]); assert.ok(!unique.has(key)); unique.add(key);
  byComponent[field.component]=(byComponent[field.component]??0)+1; bySource[field.baselineFile]=(bySource[field.baselineFile]??0)+1;
  if (field.relativeField.startsWith('/options/')) {
    optionLeaves++; assert.ok(!/[\p{Script=Han}]/u.test(field.effectiveValue));
    const parts=viPointer(field.field);let question=values[field.baselineFile]; for (const part of parts.slice(0,-2)) question=question[part];
    assert.equal(question.id,field.ownerId); assert.deepEqual(field.originalOptions,question.options); assert.equal(field.originalOptions[Number(parts.at(-1))],field.effectiveValue); checkedOriginalArrays++;
  }
  actualDescriptors.push({baselineFile:field.baselineFile,field:field.field,ownerId:field.ownerId,component:field.component,lesson:field.lesson,relativeField:field.relativeField,valueSHA256:sha(field.effectiveValue),zhContextSHA256:sha(field.zhContext),...(field.originalOptions?{originalOptionsSHA256:sha(viCanonical(field.originalOptions))}:{})});
}
const authorBytes=readFileSync(new URL('../b10-hsk1-adapter/registered-field-proof.json',import.meta.url)),author=JSON.parse(authorBytes);
assert.deepEqual(actualDescriptors,author.descriptors); assert.deepEqual(byComponent,author.byComponent); assert.equal(sha([...unique].sort().join('\n')),author.targetSetSHA256);
const proof={scope:'Actual runtime mapper self-check; registered learning leaves only, not all website VI or official language acceptance',registeredFields:fields.length,uniqueTargets:unique.size,actualPointerMatches:fields.length,byComponent,bySource,optionLeaves,checkedOriginalArrays,targetSetSHA256:sha([...unique].sort().join('\n')),authorProofSHA256:sha(authorBytes),authorDescriptorMatches:actualDescriptors.length,heldPOSAndSourceLabel:true,officialAccepted:0};
writeFileSync(new URL('./mapper-proof.json',import.meta.url),JSON.stringify(proof,null,2)+'\n');
process.stdout.write(JSON.stringify(proof,null,2)+'\n');
