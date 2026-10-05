import assert from 'node:assert/strict';

export function nativeCases(report) {
  const walk=suites=>suites.flatMap(suite=>[
    ...(suite.specs??[]).flatMap(spec=>(spec.tests??[]).map(test=>({id:spec.id,title:spec.title,test}))),
    ...walk(suite.suites??[]),
  ]);
  return walk(report.suites??[]);
}
export function completeNative(report,collection,{browser,expected}) {
  assert.ok(['chromium','webkit'].includes(browser));
  assert.ok(Number.isInteger(expected)&&expected>0);
  assert.equal(collection.errors?.length??0,0,'Collection contains errors');
  assert.equal(report.errors?.length??0,0,'Native report contains errors');
  const actual=nativeCases(report),listed=nativeCases(collection);
  const key=row=>row.id+'::'+row.test.projectName;
  for(const rows of [actual,listed]) {
    assert.equal(rows.length,expected,'Missing or extra case definitions');
    assert.equal(new Set(rows.map(key)).size,expected,'Duplicate case identities');
    for(const row of rows) {
      assert.ok(typeof row.id==='string'&&row.id.length>0,'Missing case identity');
      assert.ok(row.test.projectName===browser||row.test.projectName?.endsWith('-'+browser),'Wrong browser project');
    }
  }
  assert.deepEqual(actual.map(key).sort(),listed.map(key).sort(),'Collection/execution identities differ');
  assert.equal(report.stats?.expected,expected);
  for(const name of ['unexpected','skipped','flaky'])assert.equal(report.stats?.[name],0,'Non-passing native status');
  for(const {test} of actual) {
    assert.equal(test.status,'expected');assert.equal(test.results?.length,1,'No native execution or multiple attempts');
    assert.equal(test.results[0].status,'passed');assert.equal(test.results[0].retry,0);
    assert.equal(test.results[0].errors?.length??0,0);
  }
  return actual.map(row=>({id:row.id,title:row.title,projectName:row.test.projectName,status:'passed',retry:0}));
}
