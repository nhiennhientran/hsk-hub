// Binding and saved-context validation, separate from primary-source or browser acceptance.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {sourceLessons,sourceFigureAssetPath} from '../../hsk1-app/src/services/source-activities/content.ts';
import {blankSourceData,editSourceDraft,validateSourceData} from '../../hsk1-app/src/services/source-activities/state.ts';
import {createTextbookContent} from '../../hsk1-app/src/services/content/textbook.ts';
const root=path.resolve(import.meta.dirname,'../..');
const load=f=>JSON.parse(fs.readFileSync(path.join(root,'hsk1-app/content',f),'utf8'));
const content=createTextbookContent(load('textbook.json'),load('media-references.json'),load('stage3-catalog.json'),undefined,load('textbook-display-revisions.json'));
assert.deepEqual(sourceLessons.map(l=>l.lesson),Array.from({length:15},(_,i)=>i+1));
const data=blankSourceData(),ids=new Set(),summary=[];
for(const lesson of sourceLessons){
  const figs=new Map(lesson.figures.map(f=>[f.id,f]));assert.equal(figs.size,lesson.figures.length);
  for(const f of lesson.figures){
    assert.equal(f.source.textbookSHA256,lesson.textbookSHA256);
    if(f.kind==='original-crop'){
      assert.equal(f.source.cropPdfPoints.length,4);assert.ok(f.source.cropPdfPoints.every(Number.isFinite));
      for(const host of ['hsk1-app','course-app'])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,host,'public/source-activities',f.file))).digest('hex'),f.sha256);
    }
  }
  for(const a of lesson.activities){
    assert.equal(a.lesson,lesson.lesson);assert.ok(!ids.has(a.id));ids.add(a.id);editSourceDraft(data,a,{},1791093600000);
    for(const [id,sha]of [...(a.figure?[[a.figure,a.figureSHA256]]:[]),...(a.figures??[]).map(id=>[id,a.figureSHA256s[id]])]){
      assert.ok(figs.has(id));assert.equal(figs.get(id).sha256,sha);assert.ok(sourceFigureAssetPath(figs.get(id)));
    }
    if(a.audio){assert.equal(content.resolveScene(a.lesson,a.audio.sceneId).available,true,a.id);assert.equal(a.audio.verifiedByListening,false);}
  }
  summary.push({lesson:lesson.lesson,activities:lesson.activities.length,fields:lesson.activities.reduce((n,a)=>n+a.fields.length,0),officialKeys:lesson.activities.flatMap(a=>a.fields).filter(f=>f.assessment==='answer-key').length,optional:lesson.activities.flatMap(a=>a.fields).filter(f=>f.required===false).length,crops:lesson.figures.length});
}
assert.deepEqual(validateSourceData(JSON.parse(JSON.stringify(data))),data);
const report={status:'passed',scope:'Integrated source schema, strict historical snapshot roundtrip, audio bindings, actual two-host image SHA; not native DOM/source reread/human listening',generatedAt:new Date().toISOString(),recordsValidated:Object.keys(data.records).length,lessons:summary};
const dest=path.join(root,'course-app/docs/resume-20261004/integration/runtime-binding-review.json');fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,recordsValidated:report.recordsValidated,lessons:report.lessons.length}));
