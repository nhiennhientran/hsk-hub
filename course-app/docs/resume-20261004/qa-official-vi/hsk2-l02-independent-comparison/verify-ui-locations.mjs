import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {parseSync} from '../../../../node_modules/rolldown/dist/utils-index.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../../../..');
const file='course-app/docs/resume-20261004/qa-official-vi/hsk2-l02-comparison/dynamic-ui-and-missing-presentations.json';
const source=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),results=[];
for(const row of source.sharedDynamicUI){
 const text=fs.readFileSync(path.join(root,row.file),'utf8'),parsed=parseSync(row.file,text,{lang:'ts'});
 const node=row.astPath.split('/').slice(1).reduce((v,k)=>v[k.replaceAll('~1','/').replaceAll('~0','~')],parsed.program);
 const value=node.type==='Literal'?node.value:node.type==='TemplateLiteral'?node.quasis.map(q=>q.value.cooked??q.value.raw).join('${expression}'):null;
 const before=text.slice(0,node.start),currentRange={start:node.start,end:node.end,line:before.split('\n').length,column:node.start-before.lastIndexOf('\n')};
 results.push({authorRecordID:row.recordId,file:row.file,sourceSHA256:sha(Buffer.from(text)),astPointer:row.astPath,currentValue:value,sourceParsePassed:!parsed.errors.length,valueAndPathStillActual:value===row.value,authorRange:row.range,currentRange,authorRangeMatchesCurrent:node.start===row.range.start&&node.end===row.range.end,currentSourceSpecificRecordID:sha(row.file+'\0\0'+node.start+'\0'+node.end).slice(0,24),status:row.file.endsWith('main.ts')?'repair-source-specific-range-and-ID; semantic literal remains present':'actual-scoped-code-location-confirmed',activation:'B14 source-aware scoped heading presentation still required; no global or native acceptance'});
}
const passed=results.length===4&&results.every(r=>r.sourceParsePassed&&r.valueAndPathStillActual)&&results.filter(r=>r.authorRangeMatchesCurrent).length===3&&results.filter(r=>!r.authorRangeMatchesCurrent).length===1&&results.find(r=>!r.authorRangeMatchesCurrent).file==='course-app/src/main.ts';
const evidence={passed,status:'4literal values/path identities independently resolved;1main old range and source-specific ID require metadata repair',results,fullInventoryExecuted:false,productionChanges:0,nativeRenderingTested:false};
fs.writeFileSync(path.join(here,'dynamic-ui-location-review.json'),JSON.stringify(evidence,null,2)+'\n');
process.stdout.write(JSON.stringify({passed,oldRangeMatches:results.filter(r=>r.authorRangeMatchesCurrent).length,metadataRepairs:results.filter(r=>!r.authorRangeMatchesCurrent).map(r=>({file:r.file,oldRecord:r.authorRecordID,newRecord:r.currentSourceSpecificRecordID,currentRange:r.currentRange}))})+'\n');
if(!passed)process.exitCode=1;
