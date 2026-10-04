import assert from 'node:assert/strict';
import {commandPlan,evidenceRoot} from './contract.mjs';
export function verifyCommands(records,{browser,before,actualRef,readLog}){
  const expected=commandPlan(browser);assert.equal(records.length,expected.length,'Missing or extra command receipt');
  assert.equal(new Set(records.map(row=>row.label)).size,expected.length,'Duplicate command receipt');
  return expected.map(task=>{
    const value=records.find(row=>row.label===task.label);assert.ok(value,'Missing required command '+task.label);
    assert.equal(value.label,task.label);assert.equal(value.cwd,task.cwd);assert.deepEqual(value.command,task.command,'Required command identity');
    assert.equal(value.browser,browser);assert.equal(value.checkoutCommit,before.checkoutCommit);assert.equal(value.runId,before.runId);assert.equal(value.runAttempt,before.runAttempt);
    assert.equal(value.exitCode,0,task.label+' command failed');assert.equal(value.signal,null);assert.equal(value.spawnError,null);
    assert.equal(value.log?.file,evidenceRoot(browser)+'/'+task.label+'.log');assert.deepEqual(actualRef(value.log.file),value.log,'Command log drift');
    if(task.label.endsWith('-units')||task.label==='native-report-guards'){
      const log=readLog(value.log.file);assert.ok(!/(?:#|ℹ)\s*(?:fail|cancelled|skipped|todo)\s+[1-9]\d*/u.test(log),'Unit skipped/failed/cancelled/todo');
      assert.ok(/(?:#|ℹ)\s*tests\s+[1-9]\d*/u.test(log)&&/(?:#|ℹ)\s*pass\s+[1-9]\d*/u.test(log),'No actual unit tests recorded');
    }
    return task;
  });
}
