import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {parseSync} from '../../../../node_modules/rolldown/dist/utils-index.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../../../..');
const load=name=>JSON.parse(fs.readFileSync(path.join(here,name),'utf8'));
const sha=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const checks=[];
const check=(check,passed,details={})=>checks.push({check,passed,...details});
const decoded=new Map();
const resolve=(value,pointer)=>pointer.split('/').slice(1).reduce((v,k)=>v[k.replaceAll('~1','/').replaceAll('~0','~')],value);
for(const item of load('field-comparisons.json')){
 if(!decoded.has(item.file))decoded.set(item.file,JSON.parse(fs.readFileSync(path.join(root,item.file),'utf8')));
 check('actual RFC6901 JSON field oldValue and immutable identity',resolve(decoded.get(item.file),item.field)===item.oldValue,{file:item.file,field:item.field,targetRecordId:item.targetRecordId});
}
for(const input of load('runtime-input-snapshot.json').inputs){
 const bytes=fs.readFileSync(path.join(root,input.file));check('frozen runtime input SHA and bytes',sha(bytes)===input.sha256&&bytes.length===input.bytes,{file:input.file});
}
const asts=new Map();
for(const item of load('renderer-comparisons.json')){
 if(!asts.has(item.file)){
  const source=fs.readFileSync(path.join(root,item.file),'utf8');const result=parseSync(item.file,source,{lang:'ts'});
  check('actual TypeScript parse no errors',result.errors.length===0,{file:item.file});asts.set(item.file,result.program);
 }
 const node=resolve(asts.get(item.file),item.astPointer),str=node.type==='Literal'?node.value:node.type==='TemplateLiteral'?node.quasis.map(q=>q.value.cooked??q.value.raw).join('${expression}'):null;
 check('actual renderer/helper AST pointer, literal/template value and exact UTF16 range',str===item.oldValue&&node.start===item.codeRange.start&&node.end===item.codeRange.end,{file:item.file,targetRecordId:item.targetRecordId,astPointer:item.astPointer,start:node.start,end:node.end});
}
const supplement=load('renderer-object-coverage-supplement.json');
check('exactly four same-source independently scanned Property.value candidates included',supplement.missingCount===4&&supplement.files.every(r=>r.sameBytesAsOriginalSnapshot)&&supplement.rows.every(r=>load('renderer-comparisons.json').some(x=>x.targetRecordId===r.targetRecordId&&x.file===r.file&&x.oldValue===r.oldValue)));
const rows=load('field-comparisons.json');
const prefixRows=rows.filter(r=>r.sourceSpanOnly&&r.file.endsWith('lesson-10.json')&&r.field.startsWith('/activities/')&&r.field.endsWith('/note/vi'));
for(const item of prefixRows){
 const markers=[' Câu tham khảo ',' Biên tập viên ',' Các ô ghi chép '];
 const marker=markers.find(marker=>item.oldValue.includes(marker));
 if(marker){check('editorial suffix exact bytes retained after source instruction prefix',item.oldValue.slice(item.oldValue.indexOf(marker))===item.newValue.slice(item.newValue.indexOf(marker)),{field:item.field});}
}
const issues=rows.filter(r=>r.decision==='official-book-erratum');
check('confirmed erratum retains correct local/canonical value in exactly two word30 consumers',issues.length===2&&issues.every(r=>r.newValue==='năm sau nữa'&&r.oldValue==='năm sau nữa'&&r.resolution==='retain-correct-current'));
check('scene3 source semantic tension not silently activated',rows.some(r=>r.decision==='official-source-context-ambiguity'&&r.field==='/texts/2/context/vi'&&r.newValue===r.oldValue));
for(const item of load('role-consumer-observations.json').roleRows){
 check('26 actual Chinese-only speaker fields and stable line IDs retained',resolve(decoded.get('course-app/content/hsk3/lesson-10.json'),item.existingSpeakerField)===item.ChineseSpeakerMetadata&&resolve(decoded.get('course-app/content/hsk3/lesson-10.json'),item.existingSpeakerField.replace(/\/speaker$/,'/id'))===item.lineID,{field:item.existingSpeakerField,lineID:item.lineID});
}
const allComparisons=[...rows,...load('renderer-comparisons.json'),...load('svg-comparisons.json')];
check('all773 comparison fields preserve explicit baseline/source/effective-value roles',allComparisons.length===773&&allComparisons.every(r=>r.expectedSourceWording===r.expected&&r.expectedEffectiveValue===r.newValue&&r.productionEdit===false));
const summary={passed:checks.every(c=>c.passed),checksCount:checks.length,checks};
fs.writeFileSync(path.join(here,'actual-runtime-field-verification.json'),JSON.stringify(summary,null,2)+'\n');
process.stdout.write(JSON.stringify({passed:summary.passed,checksCount:checks.length,failed:checks.filter(c=>!c.passed)})+'\n');
if(!summary.passed)process.exitCode=1;
