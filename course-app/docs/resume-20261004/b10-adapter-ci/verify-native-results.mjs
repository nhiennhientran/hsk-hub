import assert from 'node:assert/strict';
/** Collection, expected failures, skip and retry cannot establish a native pass. */
export function verifyNativeResults(report,{browser,expectedCount,expectedFile}){
 assert.ok(['chromium','webkit'].includes(browser),'unknown actual browser');
 assert.ok(report&&Array.isArray(report.suites)&&Array.isArray(report.errors),'missing native suites/errors');
 assert.equal(report.errors.length,0,'native global errors');
 const projects=report.config?.projects;assert.ok(Array.isArray(projects),'native project identity missing');
 const actual=projects.find(p=>p.name===browser);assert.ok(actual,'actual browser project missing');
 assert.equal(actual.metadata?.browserName,browser,'browserName metadata does not match actual matrix engine');
 assert.equal(actual.retries,0,'configured native retries');assert.equal(actual.repeatEach,1,'configured native repeats');
 const rows=[];
 function walk(suites){for(const suite of suites){for(const spec of suite.specs??[]){
  assert.equal(spec.file.replaceAll('\\','/').split('/').at(-1),expectedFile,'foreign native fixture');
  assert.equal(spec.ok,true,'native spec not okay');
  for(const test of spec.tests??[]){assert.equal(test.projectName,browser,'foreign or duplicate browser project');assert.equal(test.projectId,actual.id,'native project ID');
   assert.equal(test.expectedStatus,'passed','expected-failed or skipped native case');assert.equal(test.status,'expected','native status is not expected');
   assert.equal(test.results?.length,1,'collection or retry cannot pass');const result=test.results[0];
   assert.equal(result.status,'passed','skipped/failed/interrupted native result');assert.equal(result.retry,0,'retried native result');
   assert.equal(result.errors?.length,0,'native per-case errors');assert.ok(!result.error,'native per-case error');
   rows.push({id:spec.id,title:spec.title,file:spec.file,projectName:test.projectName,duration:result.duration,status:result.status,retry:result.retry});
  }
 }walk(suite.suites??[])}}
 walk(report.suites);assert.equal(rows.length,expectedCount,'native case count mismatch');assert.equal(new Set(rows.map(r=>r.id)).size,expectedCount,'duplicate native case IDs');
 assert.equal(report.stats?.expected,expectedCount,'native expected count');
 for(const key of ['skipped','unexpected','flaky'])assert.equal(report.stats?.[key],0,'native '+key);
 return {browser,expectedCount,passed:rows.length,skipped:0,retries:0,unexpected:0,flaky:0,cases:rows};
}
