import test from 'node:test';import assert from 'node:assert/strict';
import {verifyNativeResults} from './verify-native-results.mjs';
const options={browser:'chromium',expectedCount:1,expectedFile:'official-vi-history.spec.ts'};
const sample=()=>({config:{projects:[{id:'chromium',name:'chromium',metadata:{browserName:'chromium'},retries:0,repeatEach:1}]},errors:[],stats:{expected:1,skipped:0,unexpected:0,flaky:0},
 suites:[{specs:[{id:'actual-1',file:'official-vi-history.spec.ts',title:'synthetic report guard fixture',ok:true,tests:[{projectId:'chromium',projectName:'chromium',expectedStatus:'passed',status:'expected',results:[{status:'passed',retry:0,errors:[],duration:10}]}]}]}]});
test('an actual single native pass can satisfy exact engine/file/count',()=>assert.equal(verifyNativeResults(sample(),options).passed,1));
for(const [label,mutate]of Object.entries({
 collection:r=>{r.suites[0].specs[0].tests[0].results=[];r.stats.expected=0;r.stats.skipped=1},
 skip:r=>{r.suites[0].specs[0].tests[0].results[0].status='skipped';r.stats.skipped=1},
 retry:r=>r.suites[0].specs[0].tests[0].results[0].retry=1,
 expectedFailure:r=>r.suites[0].specs[0].tests[0].expectedStatus='failed',
 perCaseError:r=>r.suites[0].specs[0].tests[0].results[0].errors=[{message:'actual error'}],
 globalError:r=>r.errors=[{message:'launch blocked'}],
 wrongEngine:r=>r.config.projects[0].metadata.browserName='webkit',
 foreignFile:r=>r.suites[0].specs[0].file='another.spec.ts',
 missingCase:r=>r.suites=[],
 duplicateCase:r=>r.suites[0].specs.push(structuredClone(r.suites[0].specs[0])),
 flaky:r=>r.stats.flaky=1,
}))test('native guard rejects '+label,()=>{const r=sample();mutate(r);assert.throws(()=>verifyNativeResults(r,options))});
