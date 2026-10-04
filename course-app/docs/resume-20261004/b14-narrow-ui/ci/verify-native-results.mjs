import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {actualBrowser,widths,surfaces,title} from './contract.mjs';
const source=JSON.parse(readFileSync(new URL('../../../../../hsk1-app/content/source-activities/lesson-06.json',import.meta.url),'utf8'));
const activity=source.activities.find(row=>row.id==='hsk1-original-2026-l06-p042-classroom-table-01');
const book=JSON.parse(readFileSync(new URL('../../../../../hsk1-app/content/textbook.json',import.meta.url),'utf8'));
export const selectIds=activity.fields.filter(field=>field.input==='select').map(field=>field.id);
const lineIds=book.lessons[0].scenes[2].lines.map(line=>line.id);
function attachmentJSON(result,name){
  const rows=result.attachments?.filter(row=>row.name===name);assert.equal(rows?.length,1,'Missing/duplicate actual layout attachment: '+name);
  const row=rows[0];assert.equal(row.contentType,'application/json');assert.ok(typeof row.body==='string'&&row.body.length,'Actual inline JSON body missing');
  return JSON.parse(Buffer.from(row.body,'base64').toString('utf8'));
}
function layoutEvidence(result,surface,width){
  const layout=attachmentJSON(result,'layout-and-source-binding.json');assert.equal(layout.surface,surface);assert.equal(layout.width,width);
  assert.equal(layout.sourceActivity,activity.id);assert.equal(layout.fieldCount,activity.fields.length);
  assert.deepEqual(layout.columns,activity.table.columns);assert.deepEqual(layout.rowIds,activity.table.rows.map(row=>row.id));assert.deepEqual(layout.pageErrors,[]);
  assert.equal(layout.navMetrics?.length,4,'Actual complete header metrics missing');
  assert.deepEqual(layout.roleMetrics?.map(row=>row.lineId),lineIds,'Actual scene-line metrics missing');
  assert.deepEqual(layout.selectMetrics?.map(row=>row.fieldId),selectIds,'Actual source-field metrics missing');
  for(const metric of layout.selectMetrics){
    assert.equal(metric.hint,'请选择 · Hãy chọn');assert.equal(metric.nativeArrowReserve,32);assert.ok(Number.isFinite(metric.measuredTextWidth)&&metric.measuredTextWidth>0);
    assert.ok(Number.isFinite(metric.usableWidth)&&metric.usableWidth>=metric.measuredTextWidth+34,'Closed native label does not fit actual font');
    assert.ok(parseFloat(metric.fontSize)>=16,'Native typography compressed');
    assert.deepEqual(attachmentJSON(result,`${surface}-${width}-${metric.fieldId}-native-font-width.json`),metric,'Native per-field measurements mismatch');
  }
  return layout;
}
/** Two actual projects, five exact viewport cases each; collection/skips/retries are rejected. */
export function verifyNativeResults(report,{browser}){
  actualBrowser(browser);assert.ok(report&&Array.isArray(report.suites)&&Array.isArray(report.errors));assert.equal(report.errors.length,0,'Native global errors');
  const projects=report.config?.projects;assert.equal(projects?.length,2,'Exactly two compiled-host projects required');
  const map=new Map(projects.map(project=>[project.name,project]));assert.equal(map.size,2,'Duplicate native project');
  for(const surface of surfaces){
    const project=map.get(`${surface}-${browser}`);assert.ok(project,'Missing actual host project');
    assert.equal(project.metadata?.surface,surface);assert.equal(project.metadata?.browserName,browser);
    assert.equal(project.retries,0,'Configured retries');assert.equal(project.repeatEach,1,'Configured repeats');
  }
  const cases=[];
  function walk(suites){for(const suite of suites){for(const spec of suite.specs??[]){
    assert.equal(spec.file.replaceAll('\\','/').split('/').at(-1),'narrow-ui.spec.ts','Foreign native fixture');assert.equal(spec.ok,true,'Spec not okay');
    const width=widths.find(value=>title(value)===spec.title);assert.ok(width,'Foreign/duplicate viewport title');
    for(const test of spec.tests??[]){
      const project=map.get(test.projectName);assert.ok(project,'Foreign native project');assert.equal(test.projectId,project.id,'Project ID');
      const surface=project.metadata.surface;assert.equal(test.expectedStatus,'passed','Expected failure or skip');assert.equal(test.status,'expected','Native outcome');
      assert.ok(!(test.annotations??[]).some(row=>['skip','fixme','fail'].includes(row.type)),'Skipped/expected-fail annotations');
      assert.equal(test.results?.length,1,'Collection or retry');const result=test.results[0];assert.equal(result.status,'passed');assert.equal(result.retry,0);
      assert.equal(result.errors?.length,0);assert.ok(!result.error);assert.ok(Number.isFinite(result.duration)&&result.duration>0,'Actual browser case duration missing');
      assert.ok(!(result.annotations??[]).some(row=>['skip','fixme','fail'].includes(row.type)),'Result skip annotations');
      cases.push({id:`${spec.id}:${test.projectName}`,specId:spec.id,title:spec.title,projectName:test.projectName,surface,width,duration:result.duration,status:'passed',retry:0,layout:layoutEvidence(result,surface,width)});
    }
  }walk(suite.suites??[])}}
  walk(report.suites);assert.equal(cases.length,10,'Actual native case count');assert.equal(new Set(cases.map(row=>row.id)).size,10,'Duplicate native case IDs');
  assert.deepEqual(cases.map(row=>`${row.surface}:${row.width}`).sort(),surfaces.flatMap(surface=>widths.map(width=>`${surface}:${width}`)).sort(),'Missing or duplicated actual host/viewport');
  assert.equal(report.stats?.expected,10);for(const key of ['skipped','unexpected','flaky'])assert.equal(report.stats?.[key],0,'Native '+key);
  return {browser,expectedCount:10,passed:10,skipped:0,retries:0,unexpected:0,flaky:0,cases};
}
export function expectedScreenshots(cases){
  return cases.flatMap(({surface,width,id})=>[
    {name:`${surface}-${width}-shown-scene.png`,caseId:id,surface,width,kind:'shown-scene'},
    {name:`${surface}-${width}-hidden-scene.png`,caseId:id,surface,width,kind:'hidden-scene'},
    {name:`${surface}-${width}-table.png`,caseId:id,surface,width,kind:'source-table'},
    ...selectIds.map(fieldId=>({name:`${surface}-${width}-${fieldId}-closed-select.png`,caseId:id,surface,width,kind:'closed-native-select',fieldId})),
  ]);
}
export function verifyScreenshotSet(entries,cases){
  const expected=expectedScreenshots(cases);assert.equal(expected.length,90);assert.equal(entries.length,90,'Actual original PNG count');
  assert.equal(new Set(entries.map(row=>row.name)).size,90,'Duplicate original PNG basenames');
  assert.deepEqual(entries.map(row=>row.name).sort(),expected.map(row=>row.name).sort(),'Missing/foreign native PNG');
  return expected.map(row=>{const entry=entries.find(candidate=>candidate.name===row.name);assert.equal(entry.completeRaster,true);assert.ok(entry.width>0&&entry.height>0);
    assert.ok(/^[a-f0-9]{64}$/.test(entry.sha256)&&entry.bytes>0,'Actual PNG byte identity missing');
    if(['shown-scene','hidden-scene'].includes(row.kind))assert.equal(entry.width,row.width,'Original full-page PNG viewport mismatch');
    else assert.ok(entry.width<=row.width+1,'Control/card screenshot exceeds viewport');
    return {...entry,...row};
  });
}
