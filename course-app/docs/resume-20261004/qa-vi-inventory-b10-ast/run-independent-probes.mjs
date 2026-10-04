import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseSync} from '../../../node_modules/rolldown/dist/utils-index.mjs';

// Run only the actual crawler declarations. Neither full builder is executed.
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../../..');
const oldFile='course-app/docs/resume-20261004/vi-inventory/build-inventory.mjs';
const newFile='course-app/docs/resume-20261004/vi-inventory-b10/build-inventory.mjs';
const authorProbe='course-app/docs/resume-20261004/vi-inventory-b10/verify-ast-coverage.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const declarations=new Set(['sha','files','records','failures','legacyLayers','viet','asciiViet','chinese','viKey','likelyVi','ptr']);
const helpers=new Set(['location','propertyName','staticString','zhSibling','walkAST']);
const inputs=[oldFile,newFile,authorProbe,'course-app/src/dom.ts','course-app/src/lesson-view.ts','course-app/src/main.ts','course-app/docs/resume-20261004/vi-inventory/runtime-files.json'];
const initialInputs=inputs.map(file=>{const b=fs.readFileSync(path.join(root,file));return {file,sha256:sha(b),bytes:b.length};});
const checks=[];const check=(name,passed,details={})=>checks.push({name,passed:!!passed,...details});
function loadCrawler(file){
 const source=fs.readFileSync(path.join(root,file),'utf8'),parsed=parseSync(file,source,{lang:'js'});
 check('actual crawler source parses',!parsed.errors.length,{file});
 const nodes=parsed.program.body.filter(n=>n.type==='FunctionDeclaration'&&helpers.has(n.id?.name)||n.type==='VariableDeclaration'&&n.declarations.some(d=>declarations.has(d.id?.name)));
 const extractedNames=nodes.flatMap(n=>n.type==='FunctionDeclaration'?[n.id.name]:n.declarations.map(d=>d.id.name));
 check('only all named dependency and crawler declarations extracted',extractedNames.length===declarations.size+helpers.size&&extractedNames.every(name=>declarations.has(name)||helpers.has(name)),{file,nodes:nodes.length,extractedNames});
 const sandbox={crypto};vm.createContext(sandbox);
 vm.runInContext(nodes.map(n=>source.slice(n.start,n.end)).join('\n')+'\nglobalThis.crawl=walkAST;globalThis.rows=records;',sandbox);
 return (text,sourceFile)=>{
  sandbox.rows.length=0;
  const result=parseSync(sourceFile,text,{lang:'ts'});
  check('input probe parses actual TS AST',!result.errors.length,{file:sourceFile});
  sandbox.crawl(result.program,[],sourceFile,text,{component:'active-ui',state:'runtime-source-static-candidate',consumers:['bounded independent probe']});
  const rows=JSON.parse(JSON.stringify(sandbox.rows));
  for(const row of rows){
   const node=row.astPath.split('/').slice(1).reduce((n,k)=>n[k.replaceAll('~1','/').replaceAll('~0','~')],result.program);
   const value=node.type==='Literal'?node.value:node.type==='TemplateLiteral'?node.quasis.map(q=>q.value.cooked??q.value.raw).join('${expression}'):null;
   check('every record resolves to an actual string AST node and exact source range',value===row.value&&node.start===row.range.start&&node.end===row.range.end,{file:sourceFile,recordId:row.recordId});
  }
  check('all actual record and semantic IDs unique',new Set(rows.map(r=>r.recordId)).size===rows.length&&new Set(rows.map(r=>r.semanticKey)).size===rows.length,{file:sourceFile});
  return rows;
 };
}
const oldSource=fs.readFileSync(path.join(root,oldFile),'utf8'),newSource=fs.readFileSync(path.join(root,newFile),'utf8');
const expected=oldSource.replace(" for(const[key,v]of Object.entries(node))if(!['start','end','loc','raw','value','regex','comments'].includes(key)){"," // Property.value and MethodDefinition.value contain real AST children.\n // Scalar literal values are naturally excluded by the object/type checks below.\n for(const[key,v]of Object.entries(node))if(!['start','end','loc','raw','regex','comments'].includes(key)){");
check('builder changes only value exclusion and two explanatory comments',expected===newSource);
check('original historical builder identity retained',sha(Buffer.from(oldSource))==='8ef5eb37677d333beb4117310f79160b902b242809edda57122bed7858949d72');
const old=loadCrawler(oldFile),current=loadCrawler(newFile);
const originalInputs=JSON.parse(fs.readFileSync(path.join(root,'course-app/docs/resume-20261004/vi-inventory/runtime-files.json'),'utf8'));
const sources=[];
for(const file of ['course-app/src/dom.ts','course-app/src/lesson-view.ts']){
 const text=fs.readFileSync(path.join(root,file),'utf8'),before=old(text,file),after=current(text,file),beforeMap=new Map(before.map(r=>[r.recordId,r]));
 const expectedBefore=file.endsWith('dom.ts')?0:85,expectedAfter=file.endsWith('dom.ts')?2:87;
 check('actual source bytes equal original frozen inventory input',sha(Buffer.from(text))===originalInputs.find(r=>r.file===file).sha256,{file});
 check('same-byte real source recovers exact missing count',before.length===expectedBefore&&after.length===expectedAfter,{file,before:before.length,after:after.length});
 check('every previous same-byte record is unchanged rather than regenerated as a false omission',before.every(r=>after.some(a=>a.recordId===r.recordId&&JSON.stringify(a)===JSON.stringify(r))),{file});
 const missing=after.filter(r=>!beforeMap.has(r.recordId));sources.push({file,beforeCount:before.length,afterCount:after.length,missing});
}
const recovered=sources.flatMap(s=>s.missing);
check('exact four real counterexamples recovered',recovered.length===4&&['SGK trang ${expression}${expression}',' · Nội dung bổ trợ','Câu trả lời của bạn','合成语音 · Giọng tổng hợp · ${expression}'].every(v=>recovered.some(r=>r.value===v)));

const fixture=`// Bình luận không phải bản sao hiển thị
const named = {vi:'Sai', vn:'Dung', titleVi:'OK', meaning_vi:'ABC', ['vi']:'NO'};
const nested = {copy:{zh:'样例',vi:'Ví dụ'}, items:[{vi:'Đúng'}]};
class View {
 render(){return 'Câu trong phương thức';}
 get label(){return {zh:'老师',vi:'Cô giáo'};}
 static render(){return {vi:'Nội dung tĩnh'};}
}
const objectMethods={render(){return 'Bài trong phương thức';},copy:()=>({vi:'Câu lồng'})};
const conditional={vi:\`Trang \${ok?'đã lưu':'chưa lưu'}\`};
const scalar='Bài đơn';
const packed='{"vi":"Chào"}';
const numberValue=123;
const empty={vi:''};
const regex=/Cô giáo/;
const chineseOnly={zh:'你好',id:'stable-no-vi'};
`;
fs.writeFileSync(path.join(here,'probe-fixture.ts.txt'),fixture);
const before=old(fixture,'independent-fixture.ts'),after=current(fixture,'independent-fixture.ts');
const missingPhrases=['Sai','Dung','OK','ABC','NO','Ví dụ','Đúng','Câu trong phương thức','Cô giáo','Nội dung tĩnh','Bài trong phương thức','Câu lồng','đã lưu','chưa lưu'];
for(const value of missingPhrases){
 check('object value or method body absent before and detected exactly once after',before.filter(r=>r.value===value).length===0&&after.filter(r=>r.value===value).length===1,{value});
}
for(const value of ['Bài đơn','{"vi":"Chào"}']){
 check('scalar literal recorded once without interpreting or recursively scanning primitive value',before.filter(r=>r.value===value).length===1&&after.filter(r=>r.value===value).length===1,{value});
}
check('packed primitive string never parsed as nested JSON or code',!after.some(r=>r.value==='Chào'));
check('method-definition body traversed independently of property translation object',after.some(r=>r.value==='Câu trong phương thức'&&r.astPath.includes('/value/body/')));
check('named ASCII VI confidence remains explicit',after.filter(r=>['Sai','Dung','OK','ABC','NO'].includes(r.value)).every(r=>r.confidence==='explicit'));
check('template producer records raw expressions separately and once',after.filter(r=>r.value==='Trang ${expression}').length===1&&after.find(r=>r.value==='Trang ${expression}').expressions[0]==="ok?'đã lưu':'chưa lưu'");
check('comments, regex, numbers, empty VI and plain Chinese metadata do not become candidate rows',!after.some(r=>['Bình luận không phải bản sao hiển thị','123','','你好','stable-no-vi'].includes(r.value))&&after.filter(r=>r.value==='Cô giáo').length===1);

const shiftedFixture='const inserted=0;\n'+fixture,shifted=current(shiftedFixture,'independent-fixture.ts');
check('changed source offsets produce changed source-specific occurrence IDs rather than false unchanged identity',shifted.length===after.length&&shifted.every(r=>after.some(a=>a.value===r.value&&a.astPath!==r.astPath&&a.recordId!==r.recordId)));
const mainSHA=sha(fs.readFileSync(path.join(root,'course-app/src/main.ts'))),oldMainSHA=originalInputs.find(r=>r.file==='course-app/src/main.ts').sha256;
const sourceDrift={file:'course-app/src/main.ts',originalSHA256:oldMainSHA,currentSHA256:mainSHA,changed:mainSHA!==oldMainSHA,coverageVerdict:'not assessed; current main offsets are not compared to historical inventory as omissions'};
check('current main source drift remains explicit and excluded from old-offset omission verdict',sourceDrift.changed);
const authorStdout=execFileSync(process.execPath,[path.join(root,authorProbe)],{cwd:root,encoding:'utf8'});
const author=JSON.parse(authorStdout);fs.writeFileSync(path.join(here,'author-bounded-probe-output.json'),JSON.stringify(author,null,2)+'\n');
check('actual root bounded verifier succeeds without full inventory execution',author.status==='passed-bounded-actual-AST-coverage-repair'&&author.completeNewSourceInventoryExecuted===false&&author.formalVietnameseSemanticAuditPerformed===false&&author.historicalBuilderSHA256===sha(Buffer.from(oldSource))&&author.revisedBuilderSHA256===sha(Buffer.from(newSource)));
const finalInputs=initialInputs.map(r=>{const bytes=fs.readFileSync(path.join(root,r.file));return {...r,unchanged:sha(bytes)===r.sha256&&bytes.length===r.bytes};});
check('all seven actual inputs unchanged during independent probe',finalInputs.every(r=>r.unchanged));
const report={status:checks.every(r=>r.passed)?'accepted-bounded-AST-traversal-repair':'failed',checksCount:checks.length,passed:checks.every(r=>r.passed),inputs:finalInputs,checks,sameSourceResults:sources,fixture:{beforeRows:before,afterRows:after},sourceDrift,fullInventoryExecuted:false,formalVietnameseSemanticAudit:false,productionEdits:0,globalInventoryAcceptance:false};
fs.writeFileSync(path.join(here,'independent-probe-results.json'),JSON.stringify(report,null,2)+'\n');
process.stdout.write(JSON.stringify({status:report.status,checks:checks.length,failed:checks.filter(r=>!r.passed),actualSources:sources.map(s=>({file:s.file,before:s.beforeCount,after:s.afterCount})),fixtureBeforeRows:before.length,fixtureAfterRows:after.length})+'\n');
if(!report.passed)process.exitCode=1;
