import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {verifyNativeResults,verifyScreenshotSet,expectedScreenshots,selectIds} from './verify-native-results.mjs';
import {inspectPNG,crc32} from './verify-png.mjs';
import {verifyCommands} from './verify-commands.mjs';
import {widths,surfaces,title,commandPlan,evidenceRoot} from './contract.mjs';

// Deliberately synthetic FORMAT/guard fixtures. No Page fixture or native/browser execution.
const browser='chromium';
const activity=JSON.parse(readFileSync(new URL('../../../../../hsk1-app/content/source-activities/lesson-06.json',import.meta.url),'utf8')).activities.find(row=>row.id==='hsk1-original-2026-l06-p042-classroom-table-01');
const lines=JSON.parse(readFileSync(new URL('../../../../../hsk1-app/content/textbook.json',import.meta.url),'utf8')).lessons[0].scenes[2].lines;
const attach=(name,value)=>({name,contentType:'application/json',body:Buffer.from(JSON.stringify(value)).toString('base64')});
function layout(surface,width){return {surface,width,sourceActivity:activity.id,fieldCount:activity.fields.length,columns:activity.table.columns,rowIds:activity.table.rows.map(row=>row.id),pageErrors:[],navMetrics:[{},{},{},{}],roleMetrics:lines.map(line=>({lineId:line.id})),selectMetrics:selectIds.map(fieldId=>({fieldId,hint:'请选择 · Hãy chọn',measuredTextWidth:130,usableWidth:188,clientWidth:208,font:'16px serif',fontSize:'16px',paddingLeft:'10px',paddingRight:'10px',nativeArrowReserve:32}))}}
function sample(){return {config:{projects:surfaces.map(surface=>({id:surface+'-'+browser,name:surface+'-'+browser,metadata:{surface,browserName:browser},retries:0,repeatEach:1}))},errors:[],stats:{expected:10,skipped:0,unexpected:0,flaky:0},suites:[{specs:surfaces.flatMap(surface=>widths.map(width=>{
 const evidence=layout(surface,width);return {id:surface+'-'+width,file:'narrow-ui.spec.ts',title:title(width),ok:true,tests:[{projectId:surface+'-'+browser,projectName:surface+'-'+browser,expectedStatus:'passed',status:'expected',annotations:[],results:[{status:'passed',retry:0,errors:[],duration:10,attachments:[attach('layout-and-source-binding.json',evidence),...evidence.selectMetrics.map(metric=>attach(`${surface}-${width}-${metric.fieldId}-native-font-width.json`,metric))]}]}]};
}))}]}}
const first=report=>report.suites[0].specs[0].tests[0];
const options={browser};
test('SYNTHETIC two-host five-width reporter-format fixture passes the strict guard',()=>assert.equal(verifyNativeResults(sample(),options).passed,10));
test('SYNTHETIC merged spec IDs remain unique per actual host project',()=>{const r=sample();for(const spec of r.suites[0].specs)spec.id=String(spec.title);assert.equal(verifyNativeResults(r,options).passed,10)});
for(const [label,mutate]of Object.entries({
 collection:r=>{first(r).results=[];r.stats.expected=0;r.stats.skipped=10},skip:r=>{first(r).results[0].status='skipped';r.stats.skipped=1},retry:r=>first(r).results[0].retry=1,
 twoResults:r=>first(r).results.push(structuredClone(first(r).results[0])),expectedFailure:r=>first(r).expectedStatus='failed',perCaseError:r=>first(r).results[0].errors=[{message:'launch error'}],globalError:r=>r.errors=[{message:'blocked'}],
 wrongEngine:r=>r.config.projects[0].metadata.browserName='webkit',missingHost:r=>r.config.projects.pop(),configuredRetries:r=>r.config.projects[0].retries=1,configuredRepeat:r=>r.config.projects[0].repeatEach=2,
 foreignFile:r=>r.suites[0].specs[0].file='another.spec.ts',missingCase:r=>r.suites[0].specs.pop(),duplicateCase:r=>r.suites[0].specs[0]=structuredClone(r.suites[0].specs[1]),unknownWidth:r=>r.suites[0].specs[0].title=title(1000),flaky:r=>r.stats.flaky=1,
 missingActualLayout:r=>first(r).results[0].attachments.shift(),wrongActualViewport:r=>{const a=first(r).results[0].attachments[0],v=JSON.parse(Buffer.from(a.body,'base64'));v.width=390;a.body=Buffer.from(JSON.stringify(v)).toString('base64')},
 noActualDuration:r=>first(r).results[0].duration=0,skippedAnnotation:r=>first(r).annotations=[{type:'skip'}],
 noFullFontFit:r=>{const result=first(r).results[0],v=JSON.parse(Buffer.from(result.attachments[0].body,'base64'));v.selectMetrics[0].usableWidth=120;result.attachments[0]=attach('layout-and-source-binding.json',v)},
}))test('native-format guard rejects '+label,()=>{const r=sample();mutate(r);assert.throws(()=>verifyNativeResults(r,options))});
function screenshotSample(){const cases=verifyNativeResults(sample(),options).cases;return {cases,entries:expectedScreenshots(cases).map(row=>({name:row.name,width:row.kind.endsWith('scene')?row.width:208,height:100,sha256:'a'.repeat(64),bytes:1000,completeRaster:true}))}}
test('SYNTHETIC 90-entry screenshot manifest matches the exact ten cases',()=>{const {cases,entries}=screenshotSample();assert.equal(verifyScreenshotSet(entries,cases).length,90)});
for(const [label,mutate]of Object.entries({missingPNG:e=>e.pop(),duplicatePNG:e=>e[0]=structuredClone(e[1]),wrongViewport:e=>e[0].width=1000,truncatedRaster:e=>e[0].completeRaster=false,missingByteHash:e=>e[0].sha256=null}))test('screenshot set rejects '+label,()=>{const {cases,entries}=screenshotSample();mutate(entries);assert.throws(()=>verifyScreenshotSet(entries,cases))});
function png(filter=0){const chunk=(type,data)=>{const t=Buffer.from(type),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([length,t,data,crc])};const header=Buffer.alloc(13);header.writeUInt32BE(1);header.writeUInt32BE(1,4);header[8]=8;header[9]=2;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(Buffer.from([filter,0,0,0]))),chunk('IEND',Buffer.alloc(0))])}
test('SYNTHETIC real 1x1 PNG byte FORMAT fully inflates with complete CRC chunks',()=>assert.equal(inspectPNG(png()).completeRaster,true));
for(const [label,mutate]of Object.entries({truncated:b=>b.subarray(0,b.length-5),trailing:b=>Buffer.concat([b,Buffer.from([1])]),badCRC:b=>{b[40]^=1;return b},badFilter:()=>png(5)}))test('PNG full-byte guard rejects '+label,()=>assert.throws(()=>inspectPNG(mutate(png()))));
const before={checkoutCommit:'b'.repeat(40),runId:'1',runAttempt:'1'};
function commandSample(){return commandPlan(browser).map(task=>({...task,browser,...before,exitCode:0,signal:null,spawnError:null,log:{file:evidenceRoot(browser)+'/'+task.label+'.log',bytes:80,sha256:'a'.repeat(64)}}))}
const commandOptions=rows=>({browser,before,actualRef:file=>({file,bytes:80,sha256:'a'.repeat(64)}),readLog:()=> '# tests 12\n# pass 12\n# fail 0\n# skipped 0\n',unused:rows});
test('SYNTHETIC exact 18 fixed command receipts pass',()=>{const rows=commandSample();assert.equal(verifyCommands(rows,commandOptions(rows)).length,18)});
for(const [label,mutate]of Object.entries({missingCommand:r=>r.pop(),duplicateLabel:r=>r[1].label=r[0].label,wrongCommand:r=>r[0].command=['node','-e','0'],wrongCwd:r=>r[0].cwd='hsk1-app',failedCommand:r=>r[0].exitCode=1,signal:r=>r[0].signal='SIGTERM',spawnError:r=>r[0].spawnError='blocked',wrongSource:r=>r[0].checkoutCommit='c'.repeat(40),wrongRun:r=>r[0].runId='2',changedLog:r=>r[0].log.sha256='c'.repeat(64)}))test('command guard rejects '+label,()=>{const rows=commandSample();mutate(rows);assert.throws(()=>verifyCommands(rows,commandOptions(rows)))});
test('command guard rejects skipped unit output',()=>{const rows=commandSample();assert.throws(()=>verifyCommands(rows,{...commandOptions(rows),readLog:()=> '# tests 12\n# pass 11\n# skipped 1\n'}))});
test('command guard rejects zero-test unit output',()=>{const rows=commandSample();assert.throws(()=>verifyCommands(rows,{...commandOptions(rows),readLog:()=> '# tests 0\n# pass 0\n# skipped 0\n'}))});
