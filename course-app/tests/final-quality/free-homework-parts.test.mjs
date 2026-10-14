import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {configs} from '../../src/config.ts';
import {blank,grade,parts,recordAttempt,validateState} from '../../src/state.ts';
import {sharedLessonAccessible,sharedLessonComplete} from '../../src/access-policy.ts';

for (const level of [2,3]) test(`HSK${level} every homework part can be saved and restored independently in every lesson`, () => {
  const config=configs[level];
  for (let number=1;number<=config.count;number++) {
    const lesson=JSON.parse(readFileSync(new URL(`../../content/hsk${level}/lesson-${String(number).padStart(2,'0')}.json`,import.meta.url),'utf8'));
    for (const part of parts) {
      const state=blank(config),questions=lesson.homework.filter(q=>q.part===part),key=lesson.id+':'+part;
      const answers=Object.fromEntries(questions.map(q=>[q.id,part==='writing'?'独立提交的测试答案':q.answer]));
      assert.equal(sharedLessonAccessible(state,number,config.count),true);
      recordAttempt(state,key,grade(questions,answers,1791979200000,state.profile));
      const restored=validateState(JSON.parse(JSON.stringify(state)),config);
      assert.deepEqual(Object.keys(restored.homework),[key]);
      assert.deepEqual(restored.homework[key],state.homework[key]);
      assert.equal(sharedLessonComplete(restored,number),false);
      for(let target=1;target<=config.count;target++)assert.equal(sharedLessonAccessible(restored,target,config.count),true);
    }
  }
});
