import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {scanRuntimeSVG} from './supplement-svg-scan.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../../../..');
const read=f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
const rows=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir,'inventory.json.gz'))));
const summary=read('summary.json'),files=read('runtime-files.json'),checks=[];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function check(name,passed,details){checks.push({name,passed,details});}
check('record ID and semantic namespace uniqueness',new Set(rows.map(x=>x.recordId)).size===rows.length&&new Set(rows.map(x=>x.semanticKey)).size===rows.length,{rows:rows.length});
check('reported counts equal real rows',summary.records===rows.length);
check('all official audit states remain pending',rows.every(r=>r.officialAuditStatus==='pending-phase-B'));
check('reference metadata is excluded from learning appearances',rows.filter(r=>r.sourceRelation==='reference-metadata').every(r=>!r.learningFieldOccurrence));
check('frozen/raw textbook and historical source are excluded from effective learning count',rows.filter(r=>['hsk1-textbook','hsk1-source-l4-historical'].includes(r.component)).every(r=>!r.learningFieldOccurrence));
check('all 600 Vietnamese listening options/feedback strings are present',rows.filter(r=>r.component==='hsk1-stage3'&&r.sourceKind==='schema-declared-vietnamese-array').length===600);
check('15 HSK1 lessons / 484 original activities / 344 stable senses',summary.measuredContent.hsk1.lessons===15&&summary.measuredContent.hsk1.sourceActivities===484&&summary.measuredContent.hsk1.wordSenseRecords===344);
const l2=summary.measuredContent.hsk2,l3=summary.measuredContent.hsk3;
check('33 HSK2/3 lessons, 749 word records, 738 lines, 132 text units, 108 grammar units',l2.lessons+l3.lessons===33&&l2.wordRecords+l3.wordRecords===749&&l2.lineRecords+l3.lineRecords===738&&l2.textUnits+l3.textUnits===132&&l2.grammarUnits+l3.grammarUnits===108);
check('source lesson IDs agree with their actual file',rows.filter(r=>/\/lesson-\d+/.test(r.file)).every(r=>r.lesson===Number(r.file.match(/\/lesson-(\d+)/)[1])));
check('all official-labelled JSON VI fields are inventoried',(()=>{
 const vi=k=>/^(?:vi|vn|vn_title|title_vi|titleVi|promptVi|explanationVi|place_vn|meaning_vi|goal_vi|scope_note_vi|labelVi|label_vn)$/i.test(k)||/(?:_vi|_vn|Vi|Vn)$/.test(k);
 const escape=v=>String(v).replaceAll('~','~0').replaceAll('/','~1');
 for(const f of files.filter(x=>x.format==='json')){
  const obj=JSON.parse(fs.readFileSync(path.join(root,f.file),'utf8'));
  const indexed=new Set(rows.filter(r=>r.file===f.file&&r.component===f.component).map(r=>r.pointer));
  let good=true;
  function walk(x,p=[]){if(!x||typeof x!=='object')return;for(const[k,v]of Object.entries(x)){const next=[...p,k];if(typeof v==='string'&&v.trim()&&vi(k)&&!indexed.has('/'+next.map(escape).join('/')))good=false;if(v&&typeof v==='object')walk(v,next);}}
  walk(obj);if(!good)return false;
 }
 return true;
})());
check('source/parser/packed-content replay has no reported failures',read('parse-failures.json').length===0&&read('legacy-content-layers.json').every(r=>r.status==='executed-content-only'));
const banks=read('legacy-practice-banks.json'),questions=read('legacy-practice-consumers.json');
const practiceProblems=[];
for(const b of banks){
 const packed=b.fetchChunks.map(f=>fs.readFileSync(path.join(root,f.file),'utf8').trim()).join('');
 const decoded=zlib.gunzipSync(Buffer.from(packed,'base64')),source=JSON.parse(decoded);
 if(hash(decoded)!==b.decodedJSONSHA256)practiceProblems.push(b.course+':decode-hash');
 const consumers=questions.filter(q=>q.course===b.course);
 const sourceQs=source.lessons.flatMap((l,li)=>['basic','advanced'].flatMap(tier=>(l[tier]??[]).map((q,qi)=>({q,l,base:['lessons',li,tier,qi]}))));
 if(consumers.length!==sourceQs.length||new Set(consumers.map(q=>q.semanticId)).size!==consumers.length)practiceProblems.push(b.course+':question-identity-count');
 for(const {q,l,base}of sourceQs){
  const c=consumers.find(c=>c.sourceQuestionId===q.id),expected=[];
  function leaves(v,p=[]){if(v&&typeof v==='object')for(const[k,x]of Object.entries(v))leaves(x,[...p,k]);else expected.push({pointer:'/'+[...base,...p].map(x=>String(x).replaceAll('~','~0').replaceAll('/','~1')).join('/'),value:v});}
  leaves(q);
  if(!c||c.lesson!==l.lesson_id||c.originalAnswer!==q.answer||JSON.stringify(c.originalOptions)!==JSON.stringify(q.options??null)||JSON.stringify(c.originalSegments)!==JSON.stringify(q.segments??null)||JSON.stringify(c.leaves.map(({pointer,value})=>({pointer,value})))!==JSON.stringify(expected))practiceProblems.push(q.id+':full-source-leaf-mismatch');
  for(const leaf of expected.filter(x=>/\/(?:prompt_vi|explanation_vi)$/.test(x.pointer))){if(!rows.some(r=>r.file===b.virtualFile&&r.pointer===leaf.pointer&&r.value===leaf.value))practiceProblems.push(q.id+':missing-named-VI');}
  if(q.type==='判断题'&&q.options?.length===2&&q.options.every(s=>['Đúng','Sai'].includes(s)))for(const leaf of expected.filter(x=>/\/(?:options\/\d+|answer)$/.test(x.pointer))){if(!rows.some(r=>r.file===b.virtualFile&&r.pointer===leaf.pointer&&r.value===leaf.value&&r.confidence==='schema-explicit'))practiceProblems.push(q.id+':missing-schema-VI-truth-choice');}
 }
}
check('three fetched legacy practice banks preserve all 1360 question identities and every original leaf',banks.length===3&&questions.length===1360&&practiceProblems.length===0,{banks:banks.map(b=>({course:b.course,questions:b.questions,questionLeaves:b.questionLeafOccurrences,VietnameseOccurrences:b.VietnameseOccurrences})),problems:practiceProblems});
check('all original Vietnamese truth-choice options and answers are explicit source targets',rows.filter(r=>r.sourceKind==='schema-declared-vietnamese-legacy-truth-choice').length===186,{schemaLeaves:rows.filter(r=>r.sourceKind==='schema-declared-vietnamese-legacy-truth-choice').length,capitalizedSai:rows.filter(r=>r.sourceKind==='schema-declared-vietnamese-legacy-truth-choice'&&r.value==='Sai').length});
const svg=scanRuntimeSVG({root,expectedHead:summary.gitHead}),svgRows=rows.filter(r=>r.sourceKind==='svg-embedded');
check('all approved SVG embedded Vietnamese targets and stable asset bindings are included',svg.records.length===412&&svgRows.length===svg.records.length&&svg.records.every(e=>svgRows.some(r=>r.recordId===e.recordId&&r.semanticKey===e.semanticKey&&r.value===e.value&&r.file===e.file&&r.pointer===e.pointer))&&JSON.stringify(read('svg-consumers.json'))===JSON.stringify(svg.bindings),{SVGFiles:svg.summary.approvedSVGFiles??svg.summary.activeApprovedSVGFiles,embeddedVietnameseOccurrences:svgRows.length});
const contracts=read('legacy-content-contracts.json');
check('real legacy HSK3 vocabulary classification contract is applied before locked scenes',contracts.length===1&&contracts[0].contract.ok===true&&contracts[0].changes.some(c=>c.before==='danh từ'&&c.after==='danh từ riêng'),{contract:contracts[0]?.contract});
const baseline={
 'textbook.json':'5079b381a30d5d7785db5ee93d17b1ad71380a53633146001150c874f27558d7',
 'homework30-bank.json':'efc0fd1c3bbbead479e8d610da9ea7c802d7cf3edb553942edc2d7dce54c9c5d',
 'stage2-bank.json':'bfd70d38b319362cd14e0da533c0c90a268a7f90b243cfffef23ef6549177ae3',
 'stage3-catalog.json':'35a15efbf9cc80c8e4ccb51d154ca8d906b970b13acabb0cc179a64423162913',
 'legacy-exercises.json':'84b0e7784c06da7b89f224db71d1cb122685d26e184ee41892237d1b2fdd735c',
};
check('five frozen HSK1 source files match protected SHA256',Object.entries(baseline).every(([f,expected])=>hash(fs.readFileSync(path.join(root,'hsk1-app/content',f)))===expected));
const stale=files.filter(f=>hash(fs.readFileSync(path.join(root,f.file)))!==f.sha256).map(f=>f.file);
check('input work files still match the generation snapshot',stale.length===0,{staleFiles:stale});
const headMismatch=files.filter(f=>!fs.readFileSync(path.join(root,f.file)).equals(execFileSync('git',['show',summary.gitHead+':'+f.file],{cwd:root}))).map(f=>f.file);
check('all actual inputs match the declared precise source HEAD',headMismatch.length===0&&summary.exactHEADInputChecks.allMatch,{sourceHEAD:summary.gitHead,currentHEAD:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),files:files.length,mismatches:headMismatch});
const report={status:checks.every(c=>c.passed)?'passed-source-inventory-validation':'failed-or-stale-source-inventory',generatedAt:new Date().toISOString(),inventoryGeneratedAt:summary.generatedAt,gitHeadAtInventory:summary.gitHead,gitTreeAtInventory:summary.gitTree,checks,limits:'These checks establish extraction/identity/source consistency only. No official translation match or native browser execution is certified.'};
fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(checks.some(c=>!c.passed))process.exitCode=1;
