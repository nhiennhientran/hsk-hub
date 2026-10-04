import fs from 'node:fs';
import {verifyNativeResults} from './hsk-hub-resume/course-app/docs/resume-20261004/b10-adapter-ci/verify-native-results.mjs';
const records=[];
for(const browser of ['chromium','webkit']) {
  const dir='/workspace/scratch/28b55072841a/b10-ci-success-input/'+browser+'/course-app/.repro-output/b10-adapter-ci/'+browser+'/';
  for(const [app,count] of [['hsk1',3],['hsk23',8]]) {
    const json=JSON.parse(fs.readFileSync(dir+app+'-results.json','utf8'));
    records.push({app,...verifyNativeResults(json,{browser,expectedCount:count,expectedFile:'official-vi-history.spec.ts'})});
  }
}
const output='/workspace/scratch/28b55072841a/hsk-hub-resume/course-app/docs/resume-20261004/qa-b10-adapter-ci/success-37237442946/';
fs.mkdirSync(output,{recursive:true});fs.writeFileSync(output+'actual-report-guard.json',JSON.stringify({actualCases:22,records},null,2)+'\n');
console.log(JSON.stringify({actualCases:22,records}));
