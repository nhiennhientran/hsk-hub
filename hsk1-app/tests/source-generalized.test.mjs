import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceLesson,getSourceLesson,incompleteSourceFields,sourceFigureAssetPath} from '../src/services/source-activities/content.ts';
import {blankSourceData,editSourceDraft,validateSourceData,snapshotContext,archivedSourceRecords} from '../src/services/source-activities/state.ts';
import {createSourceStore,createSourceSession} from '../src/services/source-activities/store.ts';
import {sourceActivityTable,tableFieldIds} from '../src/features/source-activities/tables.ts';

const at=1791093600000,copy=(zh,vi)=>({zh,vi}),base=sourceLesson.activities[0];
function activity(){return {id:'original-l09-table',version:'source-v1',lesson:9,kind:'source-table',source:{...base.source,printedPage:68,pdfPage:83,section:'learning-summary'},title:copy('学习小结','Tổng kết'),instruction:copy('记录学习情况','Ghi lại việc học'),prompt:copy('填写表格','Điền bảng'),fields:[{id:'known',label:copy('已经记住','Đã nhớ'),input:'textarea',assessment:'ungraded'},{id:'continue',label:copy('继续学习','Học tiếp'),input:'textarea',assessment:'ungraded',required:false}],table:{caption:copy('词语学习','Học từ vựng'),columns:[copy('类别','Loại'),copy('记录','Ghi chép')],rows:[{id:'row-1',cells:[{text:copy('记住的词语','Từ đã nhớ')},{fieldId:'known'}]},{id:'row-2',cells:[{text:copy('还没记住的词语','Từ chưa nhớ')},{fieldId:'continue'}]}]}};}
function record(a=activity()){const d=blankSourceData();editSourceDraft(d,a,{known:'学校'},at);return d;}
const key=a=>a.id+'@'+a.version;
function setup(){const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},store=createSourceStore({storage,lock:async task=>task(),now:()=>at});return {data,store,session:createSourceSession(store,()=>at)};}

test('unchanged pilot snapshots retain their exact historical JSON shape and key order',()=>{
  for(const a of sourceLesson.activities.filter(a=>a.version==='source-v2')){
    const previous={title:a.title,instruction:a.instruction,prompt:a.prompt,source:a.source,kind:a.kind,fields:a.fields,...(a.figure?{figure:a.figure,figureSHA256:a.figureSHA256}:{}),...(a.pinyin?{pinyin:a.pinyin}:{}),...(a.audio?{audio:a.audio}:{}),...(a.example?{example:a.example}:{})};
    assert.equal(JSON.stringify(snapshotContext(a)),JSON.stringify(previous));
  }
  assert.equal(getSourceLesson(4),sourceLesson);assert.equal(getSourceLesson(-1),undefined);
});

test('table topology, source spans, optional fields and crop digests survive round trips and freeze with their version',()=>{
  const a=activity();a.figures=['l09-original-a','l09-original-b'];a.figureSHA256s=Object.fromEntries(a.figures.map(id=>[id,'a'.repeat(64)]));a.source={...a.source,endOrdinal:2,printedPages:[68,69],pdfPages:[83,84]};a.table.rows[1].source={...base.source,printedPage:69,pdfPage:84};a.fields[0].source={...base.source};a.fields[0].referenceProvenance='editorial-model-not-unique';
  const d=record(a);assert.deepEqual(validateSourceData(JSON.parse(JSON.stringify(d))),d);
  for(const change of [a=>a.table.columns.reverse(),a=>a.table.rows.reverse(),a=>a.table.rows[0].cells[1].fieldId='continue',a=>a.fields[1].required=undefined,a=>a.figureSHA256s['l09-original-a']='b'.repeat(64),a=>a.source.endOrdinal=3]){const changed=structuredClone(a);change(changed);assert.throws(()=>editSourceDraft(d,changed,{known:'家'},at+1),/版本/);}
  const fresh={...a,version:'source-v2'};editSourceDraft(d,fresh,{known:'家'},at+1);assert.equal(Object.keys(d.records).length,2);assert.equal(d.records[key(a)].draft.values.known,'学校');
});

test('table validation rejects broken topology, duplicate inputs, foreign field references and malformed provenance',()=>{
  const valid=record(),recordKey=key(activity());
  const invalids=[c=>c.table.rows[0].cells.pop(),c=>c.table.rows[1].id='row-1',c=>c.table.rows[1].cells[1].fieldId='known',c=>c.table.rows[0].cells[1].fieldId='foreign',c=>c.table.rows[0].cells[0].html='<script>',c=>c.table.rows[0].source={...base.source,pdfPage:0},c=>c.fields[1].required=true,c=>c.source.printedPages=[68],c=>c.source.endOrdinal=0,c=>c.figures=['../secret'],c=>{c.figures=['a'];c.figureSHA256s={b:'a'.repeat(64)}},c=>c.fields[0].referenceProvenance='<script>'];
  for(const mutate of invalids){const d=structuredClone(valid);mutate(d.records[recordKey].context);assert.throws(()=>validateSourceData(d));}
});

test('optional blank input saves alongside required text while missing required input cannot submit',async()=>{
  const {session,store}=setup(),a=activity();assert.equal(incompleteSourceFields(a,{known:'学校'}),false);assert.equal((await session.submit(a,{continue:'稍后'})).code,'incomplete');assert.equal(Object.keys(store.snapshot().data.records).length,0);
  assert.equal((await session.submit(a,{known:'学校'})).ok,true);const row=store.snapshot().data.records[key(a)];assert.equal(row.history.length,1);assert.deepEqual(row.history[0].values,{known:'学校'});assert.equal(row.context.fields[1].required,false);session.dispose();
});

test('read-only source support accepts a blank field list but never produces a submission or storage write',async()=>{
  const {session,store,data}=setup(),a=activity();a.fields=[];a.table.rows=a.table.rows.map(row=>({...row,cells:[row.cells[0],{}]}));const readOnly=blankSourceData();editSourceDraft(readOnly,a,{},at);assert.deepEqual(validateSourceData(readOnly),readOnly);
  assert.deepEqual(await session.submit(a,{}),{ok:false,code:'readonly',submissionId:null});assert.equal(data.size,0);assert.deepEqual(store.snapshot().data,blankSourceData());session.dispose();
});

test('each lesson shows only its own superseded historical records with saved answers untouched',()=>{
  const old=activity(),current={...old,version:'source-v2'},other={...old,id:'original-l12-table',lesson:12};const d=record(old);d.records[key(old)].history.push({id:'submission-1',at,values:{known:'旧答案'}});editSourceDraft(d,current,{known:'新草稿'},at+1);editSourceDraft(d,other,{known:'第十二课'},at+1);
  const before=JSON.stringify(d),older=archivedSourceRecords(d,9,[current,other]);assert.deepEqual(older.map(r=>r.activityId+'@'+r.version),[key(old)]);assert.equal(older[0].history[0].values.known,'旧答案');assert.equal(JSON.stringify(d),before);assert.deepEqual(archivedSourceRecords(d,12,[other]),[]);
});

test('crop assets resolve only within the fixed public source directory',()=>{
  const figure={kind:'original-crop',file:'figures/l09-picture-01.png'};assert.equal(sourceFigureAssetPath(figure),'./source-activities/figures/l09-picture-01.png');
  for(const file of ['../private.png','figures/../private.png','figures//x.png','https://evil.test/x.png','figures/a.svg','figures/a.png?x=1','figures/%2fprivate.png','/figures/a.png','figures/a\\b.png'])assert.equal(sourceFigureAssetPath({...figure,file}),undefined);
});

class Node {
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attributes={};}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=[...nodes];}
  setAttribute(k,v){this.attributes[k]=v;}
}
test('table renderer preserves row/column shape, empty cells and each embedded field exactly once',()=>{
  const previous=globalThis.document;globalThis.document={createElement:tag=>new Node(tag)};
  try{const a=activity();a.table.rows.push({id:'row-3',cells:[{text:copy('留空','Để trống')},{}]});const seen=[],wrap=sourceActivityTable(a.table,a.title,id=>{seen.push(id);return new Node('input');}),table=wrap.children[0],head=table.children.find(n=>n.tagName==='THEAD'),body=table.children.find(n=>n.tagName==='TBODY');assert.deepEqual(seen,['known','continue']);assert.deepEqual([...tableFieldIds(a.table)],seen);assert.equal(wrap.attributes.role,'region');assert.equal(wrap.tabIndex,0);assert.equal(head.children[0].children.length,2);assert.deepEqual(body.children.map(row=>row.children.length),[2,2,2]);assert.equal(body.children[2].children[1].children.length,0);assert.equal(body.children[0].children[0].scope,'row');assert.ok(head.children[0].children.every(cell=>cell.scope==='col'));}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
