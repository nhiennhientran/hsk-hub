import test from 'node:test';
import assert from 'node:assert/strict';
import {completeNative} from './native-completion.mjs';
const sample=()=>({errors:[],stats:{expected:1,unexpected:0,skipped:0,flaky:0},suites:[{specs:[{id:'synthetic-guard-case',title:'Synthetic guard input, not browser evidence',tests:[{projectName:'chromium',status:'expected',results:[{status:'passed',retry:0,errors:[]}]}]}]}]});
test('a guard accepts a single completed identity only with its exact collection',()=>{
  const report=sample(),collection=structuredClone(report);delete collection.suites[0].specs[0].tests[0].results;
  assert.equal(completeNative(report,collection,{browser:'chromium',expected:1}).length,1);
});
test('collection-only output, failed, skipped, retried and wrong-engine records cannot pass',()=>{
  const mutations=[
    r=>r.errors.push({message:'load failed'}),r=>r.stats.skipped=1,r=>r.stats.flaky=1,r=>r.stats.unexpected=1,
    r=>r.suites[0].specs[0].tests[0].status='unexpected',r=>r.suites[0].specs[0].tests[0].results=[],
    r=>r.suites[0].specs[0].tests[0].results[0].status='failed',r=>r.suites[0].specs[0].tests[0].results[0].retry=1,
    r=>r.suites[0].specs[0].tests[0].results.push({...r.suites[0].specs[0].tests[0].results[0]}),
    r=>r.suites[0].specs[0].tests[0].projectName='webkit',
  ];
  for(const mutate of mutations){const report=sample();mutate(report);assert.throws(()=>completeNative(report,sample(),{browser:'chromium',expected:1}));}
});
test('the declared scope cannot be shrunk or replaced by equal-count identities',()=>{
  const r=sample(),c=sample();c.suites[0].specs[0].id='different-case';
  assert.throws(()=>completeNative(r,c,{browser:'chromium',expected:1}));
  assert.throws(()=>completeNative(r,sample(),{browser:'chromium',expected:2}));
  const duplicate=sample();duplicate.suites[0].specs.push(structuredClone(duplicate.suites[0].specs[0]));duplicate.stats.expected=2;
  assert.throws(()=>completeNative(duplicate,duplicate,{browser:'chromium',expected:2}));
});
