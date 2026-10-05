import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {viBindingsForDocument} from '../../../../src/official-vi-revisions.ts';

// Read-only baseline extraction. Only this author's assigned comparison directories are written.
const root=new URL('../../../../../',import.meta.url);
const n=Number(process.argv[2]??4), tag=String(n).padStart(2,'0');
assert.ok([1,3,4,5,6].includes(n));
const out=new URL(`course-app/docs/resume-20261004/qa-official-vi/hsk2-l${tag}-comparison/`,root);
fs.mkdirSync(out,{recursive:true});
const read=f=>fs.readFileSync(new URL(f,root));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const json=f=>JSON.parse(read(f));
const lessonFile=`course-app/content/hsk2/lesson-${tag}.json`, lexiconFile='course-app/content/hsk2-lexicon.json', indexFile='course-app/content/course-index.json';
const lesson=json(lessonFile), lexicon=json(lexiconFile), index=json(indexFile);
const files=[lessonFile,lexiconFile,indexFile];
const wordIds=new Set(lesson.vocabulary.map(w=>w.id));
const senses=lexicon.senses.filter(s=>s.sources.some(x=>wordIds.has(x.wordId)));
const senseIds=new Set(senses.map(s=>s.id));
const bindings=files.flatMap(file=>viBindingsForDocument(json(file),file,'hsk2-fltrp-2026')).filter(b=>b.baselineFile===lessonFile||b.baselineFile===lexiconFile?senseIds.has(b.ownerId)||b.baselineFile===lessonFile:b.lesson===n&&b.ownerId===lesson.id);
const invFile='course-app/docs/resume-20261004/vi-inventory-b10/inventory.json.gz';
const inventory=JSON.parse(zlib.gunzipSync(read(invFile)));
assert.equal(inventory.length,55430);
const key=r=>JSON.stringify([r.file??r.baselineFile,r.pointer??r.field]);
const bindMap=new Map(bindings.map(b=>[key(b),b]));
const svgFiles=lesson.illustrationManifest.map(x=>'course-app/public/'+x.file);
const selected=inventory.filter(r=>r.file===lessonFile || r.file===lexiconFile&&senseIds.has(r.itemId) || r.file===indexFile&&r.itemId===lesson.id || svgFiles.includes(r.file));
const rawLeaves=[];
function walk(v,path='',owner=lesson.id,zh=''){
 if(Array.isArray(v)){v.forEach((x,i)=>walk(x,path+'/'+i,owner,zh));return}
 if(!v||typeof v!=='object')return;
 owner=v.id??v.grammarId??owner;zh=typeof v.zh==='string'?v.zh:zh;
 for(const[k,x]of Object.entries(v)){const p=path+'/'+k.replaceAll('~','~0').replaceAll('/','~1');if(k==='vi'&&typeof x==='string')rawLeaves.push({file:lessonFile,pointer:p,itemId:owner,chineseContext:typeof v.zh==='string'?v.zh:zh,value:x,sourceKind:'raw-explicit-vi-leaf'});if(x&&typeof x==='object')walk(x,p,owner,zh)}
}
walk(lesson);
for(const leaf of rawLeaves)if(!selected.some(r=>key(r)===key(leaf)))selected.push({...leaf,recordId:'raw:'+sha(key(leaf)).slice(0,24),inventoryOmission:true});
for(const binding of bindings){const row=selected.find(r=>key(r)===key(binding));assert.ok(row,'registered binding missing occurrence');assert.equal(row.value,binding.value)}
const selectedRows=selected.map(r=>({...r,actualBinding:bindMap.get(key(r))??null,rawFileSHA256:sha(read(r.file))}));
const semanticFile='course-app/docs/resume-20261004/vi-inventory-b10/semantic-consumers.json';
const semantic=json(semanticFile).filter(x=>JSON.stringify(x).includes(lesson.id)||svgFiles.includes(x.assetFile));
const producers=['course-app/src/content.ts','course-app/src/official-vi-revisions.ts','course-app/src/lesson-view.ts','course-app/src/lexicon.ts','course-app/src/listening-view.ts','course-app/src/main.ts','course-app/src/activity-history.ts','course-app/src/assessment-revisions.ts'].filter(f=>fs.existsSync(new URL(f,root)));
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:fileURLToPath(root)}).toString().trim();
const tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:fileURLToPath(root)}).toString().trim();
const runtimeFiles=[...files,...producers,...svgFiles].map(file=>{const bytes=read(file);const committed=execFileSync('git',['show',head+':'+file],{cwd:fileURLToPath(root),maxBuffer:12e6});assert.deepEqual(bytes,committed,'runtime differs from HEAD '+file);return{file,sha256:sha(bytes),bytes:bytes.length,equalsHEAD:true}});
const input={schemaVersion:1,lesson:n,courseId:lesson.courseId,gitHead:head,gitTree:tree,files:runtimeFiles,inventory:{file:invFile,sha256:sha(read(invFile)),records:inventory.length,status:'current-snapshot-independent-inventory-review-separate'},semanticConsumers:{file:semanticFile,sha256:sha(read(semanticFile)),selected:semantic.length},bindings:bindings.length,rawLessonViLeaves:rawLeaves.length,selectedInventoryCandidates:selectedRows.length,rawWrites:0,activation:0};
const write=(f,v)=>fs.writeFileSync(new URL(f,out),JSON.stringify(v,null,2)+'\n');
write('current-bindings.json',bindings);write('current-occurrences.json',selectedRows);write('current-semantic-consumers.json',semantic);write('current-input-ledger.json',input);
console.log(JSON.stringify(input));
