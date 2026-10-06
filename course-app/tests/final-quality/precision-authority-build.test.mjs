import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {hash} from '../../tools/package-core.mjs';
import {requireCompleteReview,verifyReviewReferences} from '../../tools/final-quality-20261006/build-precision-manifest.mjs';

test('a partial independent review cannot become runtime authority even with an accepted status elsewhere',()=>{
 assert.throws(()=>requireCompleteReview({schemaVersion:1,status:'partial',completeCoverage:false},'a'.repeat(64)),/Only the complete/);
 assert.throws(()=>requireCompleteReview({schemaVersion:1,status:'accepted-complete-source-frame-review',completeCoverage:true,independentTargetCatalogSHA256:'a'.repeat(64),acceptedSourceFrameGates:[]},'a'.repeat(64)));
});
test('retained audit evidence checks real bytes and rejects same-size changed text',()=>{
 const root=mkdtempSync(join(tmpdir(),'hsk-audit-bytes-'));
 try{
  const raw=Buffer.from('{"raw":"七"}\n'),file=join(root,'actual.json');writeFileSync(file,raw);
  const report={evidence:{file:'actual.json',sha256:hash(raw)}};assert.equal(verifyReviewReferences(report,root),1);
  writeFileSync(file,'{"raw":"十"}\n');assert.throws(()=>verifyReviewReferences(report,root),/evidence changed/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('audit references cannot escape the recorded repository or silently conflict',()=>{
 const root=mkdtempSync(join(tmpdir(),'hsk-audit-path-'));
 try{
  writeFileSync(join(root,'raw.json'),'raw');const sha=hash(Buffer.from('raw'));
  assert.throws(()=>verifyReviewReferences({file:'../raw.json',sha256:sha},root),/recorded repository/);
  assert.throws(()=>verifyReviewReferences([{file:'raw.json',sha256:sha},{file:'raw.json',sha256:'0'.repeat(64)}],root),/Conflicting/);
  assert.throws(()=>verifyReviewReferences({claims:'accepted'},root),/actual retained evidence/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
