// Independent bounded read-only AST scan. Original inventory/builder stay frozen.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {parseSync} from '../../../../node_modules/rolldown/dist/utils-index.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../../../..');
const input=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,'course-app/docs/resume-20261004/vi-inventory/inventory.json.gz'))));
const files=['course-app/src/dom.ts','course-app/src/lesson-view.ts'];
const oldSourceInputs=JSON.parse(fs.readFileSync(path.join(root,'course-app/docs/resume-20261004/vi-inventory/runtime-files.json'),'utf8'));
const mainFile='course-app/src/main.ts',mainBytes=fs.readFileSync(path.join(root,mainFile));
const outsideScopeCurrentSourceDrift={file:mainFile,originalSnapshotSHA256:oldSourceInputs.find(r=>r.file===mainFile).sha256,currentSHA256:shaLater(mainBytes),reason:'Main shell has changed since the frozen835 snapshot. Original literal byte ranges cannot be reused as current identity; this supplement makes no main.ts coverage verdict.'};
function shaLater(b){return crypto.createHash('sha256').update(b).digest('hex')}
const regex=/[áàãéèíìóòõúùýỳÁÀÃÉÈÍÌÓÒÕÚÙÝỲđĐăĂâÂêÊôÔơƠưƯạảấầẩẫậắằẳẵặẹẻẽếềểễệỉĩịọỏốồổỗộớờởỡợụủũứừửữựỵỷỹẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈĨỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦŨỨỪỬỮỰỴỶỸ]/u;
const ascii=/\b(?:Nghe|Chọn|Chon|Bạn|Ban|Tôi|Toi|Bài|Bai|Câu|Cau|Xin|Khong|không|Danh|danh|nghĩa|cảm|là|của|và|theo|từ|trợ|động|như|một|này|học|Vào|Hãy|đúng|sai|biết|Nói|Lưu|viết|nào|tốt|vui)\b/u;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const pointer=parts=>'/'+parts.map(s=>String(s).replaceAll('~','~0').replaceAll('/','~1')).join('/');
const key=n=>n?.type==='Identifier'?n.name:n?.value;
const str=n=>n?.type==='Literal'&&typeof n.value==='string'?n.value:n?.type==='TemplateLiteral'?n.quasis.map(q=>q.value.cooked??q.value.raw).join('${expression}'):null;
const existing=new Set(input.filter(r=>files.includes(r.file)&&r.range).map(r=>r.file+':'+r.range.start+':'+r.range.end));
const rows=[],counts=[],parseChecks=[];
for(const file of files){
 const text=fs.readFileSync(path.join(root,file),'utf8'),parsed=parseSync(file,text,{lang:'ts'});parseChecks.push({file,passed:!parsed.errors.length});let count=0;
 function walk(n,parents=[],parts=[]){
  if(!n||typeof n!=='object')return;
  const s=str(n),p=parents[0],name=p?.type==='Property'&&p.value===n?key(p.key):'';
  if(s!==null&&(name==='vi'||regex.test(s)||ascii.test(s))){
   count++;
   if(!existing.has(file+':'+n.start+':'+n.end)){
    const before=text.slice(0,n.start),zh=parents.find(n=>n.type==='ObjectExpression')?.properties?.find(p=>key(p.key)==='zh');
    rows.push({targetRecordId:sha(file+'\0\0'+n.start+'\0'+n.end).slice(0,24),file,locationKind:'TypeScript AST literal/template; not a JSON data pointer',field:null,astPointer:pointer(parts),codeRange:{start:n.start,end:n.end,line:before.split('\n').length,column:n.start-before.lastIndexOf('\n')},oldValue:s,newValue:s,expected:null,expectedSourceWording:null,expectedEffectiveValue:s,oldValueRole:'actual unchanged baseline',sourceIDs:[],chineseContext:str(zh?.value),decision:'editorial',rationale:'Current code-object locale/presentation producer candidate missing from original inventory; no literal chapter publisher counterpart. Preserve current text provisionally, retain the actual AST location and separately record the coverage defect.',consumerBinding:{role:file.endsWith('dom.ts')?'actual sourceNote helper text / conditional supplemental note':'shared current shell/helper static producer; branch activation is not certified by this scan'},acceptance:'bounded independent coverage supplement, not a publisher translation acceptance',productionEdit:false,missingFromOriginalInventory:true});
   }
  }
  for(const[k,v]of Object.entries(n)){
   if(['start','end','loc','raw','regex','comments'].includes(k))continue;
   if(Array.isArray(v)){v.forEach((c,i)=>{if(c&&typeof c==='object'&&c.type)walk(c,[n,...parents],[...parts,k,i]);});}
   else if(v&&typeof v==='object'&&v.type)walk(v,[n,...parents],[...parts,k]);
  }
 }
 walk(parsed.program);counts.push({file,correctedASTLanguageCandidateCount:count,oldInventoryCount:input.filter(r=>r.file===file).length,sourceSHA256:sha(Buffer.from(text)),originalSnapshotSHA256:oldSourceInputs.find(r=>r.file===file).sha256,sameBytesAsOriginalSnapshot:sha(Buffer.from(text))===oldSourceInputs.find(r=>r.file===file).sha256});
}
const result={status:'bounded actual AST coverage counterexample; frozen inventory and builder not changed',originalInventorySHA256:sha(fs.readFileSync(path.join(root,'course-app/docs/resume-20261004/vi-inventory/inventory.json.gz'))),defect:'Original walkAST excludes every key named value, including Property.value AST child nodes. Explicit {zh,vi} object literals are not walked. Bounded scanner traverses value only when it is an actual AST node; primitive string literal values are not recursively walked.',files:counts,outsideScopeCurrentSourceDrift,parseChecks,missingCount:rows.length,rows};
fs.writeFileSync(path.join(here,'renderer-object-coverage-supplement.json'),JSON.stringify(result,null,2)+'\n');
process.stdout.write(JSON.stringify({parsePassed:parseChecks.every(r=>r.passed),files:counts,missingCount:rows.length,missing:rows.map(r=>({file:r.file,line:r.codeRange.line,value:r.oldValue}))})+'\n');
if(!parseChecks.every(r=>r.passed)||!counts.every(r=>r.sameBytesAsOriginalSnapshot)||rows.length!==4)process.exitCode=1;
