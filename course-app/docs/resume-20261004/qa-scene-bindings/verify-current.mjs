import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=new URL('../../../../',import.meta.url);
const at=path=>new URL(path,root);
const bytes=path=>readFileSync(at(path));
const json=path=>JSON.parse(bytes(path));
const hash=value=>createHash('sha256').update(value).digest('hex');
const baseline='387aa7b6145e80f983f331d8b55cd2b2b26d6990';
const bookPath='hsk1-app/content/textbook.json';
const book=json(bookPath);
assert.deepEqual(bytes(bookPath),execFileSync('git',['show',baseline+':'+bookPath],{cwd:fileURLToPath(root)}));
const ledgerPath='course-app/docs/resume-20261004/media-closure/hsk1-scene-binding-ledger.json';
const ledger=json(ledgerPath);
const {sceneFigureBindings,sceneFigures,resolveSceneFigureBindings}=await import(at('hsk1-app/src/services/source-activities/scene-figures.ts'));
const {getSourceLesson,sourceFigureAssetPath}=await import(at('hsk1-app/src/services/source-activities/content.ts'));
const declared=Object.keys(sceneFigureBindings),frozen=book.lessons.flatMap(lesson=>lesson.scenes.map(scene=>scene.id));
assert.equal(frozen.length,45);
assert.deepEqual(declared.toSorted(),frozen.toSorted());
assert.equal(ledger.bindings.length,48);
assert.equal(new Set(ledger.bindings.map(binding=>binding.figureId)).size,48);

const entries=[],lessons=[];
for(const lesson of book.lessons){
  const sourcePath=`hsk1-app/content/source-activities/lesson-${String(lesson.id).padStart(2,'0')}${lesson.id===4?'-current':''}.json`;
  const source=json(sourcePath),runtimeSource=getSourceLesson(lesson.id);
  assert.deepEqual(runtimeSource,source);
  lessons.push({lesson:lesson.id,file:sourcePath,sha256:hash(bytes(sourcePath)),currentRuntimeCatalogueExactSourceObject:true});
  for(const scene of lesson.scenes){
    const records=ledger.bindings.filter(binding=>binding.sceneId===scene.id);
    assert.ok(records.length);
    assert.ok(records.every(binding=>binding.lesson===lesson.id&&binding.sourceLessonFile===sourcePath));
    assert.deepEqual(sceneFigureBindings[scene.id],{lesson:lesson.id,figures:records.map(binding=>({id:binding.figureId,sha256:binding.figureSHA256,printedPage:binding.source.printedPage}))});
    const expected=records.map(binding=>source.figures.find(figure=>figure.id===binding.figureId));
    assert.deepEqual(sceneFigures(lesson.id,scene.id),expected);
    assert.deepEqual(resolveSceneFigureBindings(source,scene.id),expected);
    const primary=records[0].figureId;
    const main=source.activities.find(activity=>activity.figure===primary&&
      [activity.sourceSceneId,activity.existingSceneId,activity.audio?.sceneId].includes(scene.id));
    assert.ok(main,scene.id+' lacks a reviewed source activity linked to its primary crop');
    if(main.audio)assert.equal(main.audio.track,scene.source.audioTrack);
    const figures=records.map((binding,index)=>{
      const figure=expected[index];assert.ok(figure);
      assert.equal(figure.kind,'original-crop');
      assert.deepEqual(figure.source,binding.source);
      assert.equal(figure.source.pdfPage,figure.source.printedPage+15);
      assert.equal(figure.file,binding.file);
      assert.equal(figure.sha256,binding.figureSHA256);
      assert.equal(figure.source.textbookSHA256,'25d1aad102e4179307b5bc4f932927bbd244b3f4dd53edeb6cfd4dbbb8d4f2ba');
      assert.equal(sourceFigureAssetPath(figure),'./source-activities/'+figure.file);
      const path='hsk1-app/public/source-activities/'+figure.file,png=bytes(path);
      assert.equal(hash(png),figure.sha256);
      assert.deepEqual(png.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));
      assert.ok(png.readUInt32BE(16)>0&&png.readUInt32BE(20)>0);
      let supplementSource;
      if(index){
        if(main.figures?.includes(figure.id)){
          assert.equal(main.figureSHA256s?.[figure.id],figure.sha256);
          supplementSource={activity:main.id,method:'explicit secondary figure on reviewed primary activity'};
        }else{
          const activity=source.activities.find(activity=>activity.figure===figure.id);
          assert.ok(activity);
          assert.equal(activity.source.printedPage,figure.source.printedPage);
          const ordinal=scene.id.split('-').at(-1);
          assert.equal(activity.source.section,'scene-inset-'+ordinal);
          assert.equal(activity.figureSHA256,figure.sha256);
          supplementSource={activity:activity.id,method:'reviewed same-scene inset reference and exact original page'};
        }
      }
      return {figureId:figure.id,file:path,sha256:figure.sha256,printedPage:figure.source.printedPage,pdfPage:figure.source.pdfPage,originalCropSourceAndBBoxExactLedgerMatch:true,actualPNGBytesMatchSHA256:true,dimensions:[png.readUInt32BE(16),png.readUInt32BE(20)],supplementSource};
    });
    entries.push({sceneId:scene.id,lesson:lesson.id,frozenAudioTrack:scene.source.audioTrack,sourceActivity:main.id,sourceActivityPage:main.source.printedPage,sourceActivityPages:main.source.printedPages??main.dialoguePrintedPages??[main.source.printedPage],sourceSceneIdentityExactMatch:true,runtimeFullyResolved:true,figures});
  }
}
assert.equal(entries.length,45);
assert.equal(entries.reduce((sum,entry)=>sum+entry.figures.length,0),48);
const files=['hsk1-app/src/services/source-activities/scene-figures.ts','hsk1-app/src/features/textbook/text.ts','hsk1-app/src/features/textbook/textbook.css','hsk1-app/tests/textbook-scene-navigation.test.mjs'];
const report={reviewer:'qa_hsk1_01_03',reviewedAt:new Date().toISOString(),status:'accepted-independent-scene-to-reviewed-source-crop-binding',baselineCommit:baseline,frozenTextbookBytesUnchanged:true,frozenTextbookSHA256:hash(bytes(bookPath)),ledgerFile:ledgerPath,ledgerSHA256:hash(bytes(ledgerPath)),reviewedFiles:files.map(path=>({path,sha256:hash(bytes(path))})),sceneCount:45,cropCount:48,uniqueCropCount:48,currentCatalogueResolvedScenes:45,currentCatalogueResolvedCrops:48,lessons,entries,scopeLimits:['Reuse previous independent original-page/crop semantic acceptance; not a fresh 48-crop PDF reread or recrop','No full official Vietnamese edition alignment','No human listening or physical-device certification','Native image loading, layout and accessibility remain root browser gates']};
writeFileSync(new URL('./independent-review.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,scenes:45,crops:48,resolvedScenes:45,resolvedCrops:48,ledgerSHA256:report.ledgerSHA256},null,2));
