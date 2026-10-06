import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const sha=b=>createHash('sha256').update(b).digest('hex');
const sourceParts=text=>(text.match(/[^。！？!?]+[。！？!?]*/gu)??[]).map(s=>s.trim()).filter(Boolean);
export function derivePrecisionTargets(repo){
 const sourceFiles=[],targets=[],nonPhoneticSourceParts=[];
 const sentences=(line,binding)=>{
  const parts=sourceParts(line.zh);if(parts.join('')!==line.zh.trim())throw Error('Sentence split drops source characters '+line.id);
  for(const text of parts)if(!/[\p{L}\p{N}]/u.test(text))nonPhoneticSourceParts.push({lineId:line.id,sourceText:text,...binding,reason:'Punctuation-only source notation; retained in the displayed full original line, not treated as spoken syllables.'});
  const spoken=parts.filter(text=>/[\p{L}\p{N}]/u.test(text));
  return spoken.length===1?[line.zh.trim()]:spoken;
 };
 const source=file=>{const bytes=readFileSync(resolve(repo,file)),digest=sha(bytes);sourceFiles.push({file,sha256:digest});return {value:JSON.parse(bytes),binding:{sourceLessonFile:file,sourceLessonSHA256:digest}};};
 const catalog=source('hsk1-app/content/stage3-catalog.json'),book=source('hsk1-app/content/textbook.json');
 for(const [i,w]of catalog.value.vocabulary.entries())targets.push({id:w.id,level:1,lesson:w.lesson,unit:'word',sourceText:w.zh,...catalog.binding,sourceJSONPointer:`/vocabulary/${i}/zh`});
 for(const [li,l]of book.value.lessons.entries())for(const [si,s]of l.scenes.entries())for(const [i,line]of s.lines.entries()){
  const binding={level:1,lesson:l.id,...book.binding,sourceJSONPointer:`/lessons/${li}/scenes/${si}/lines/${i}/zh`};
  targets.push({id:line.id,unit:'line',sourceText:line.zh,...binding});
  const parts=sentences(line,binding);
  for(const [n,text]of parts.entries())targets.push({id:`${line.id}-sentence-${n+1}`,unit:'sentence',sourceText:text,parentLineId:line.id,sentenceNumber:n+1,...binding});
 }
 for(const level of [2,3])for(let lesson=1;lesson<=(level===2?15:18);lesson++){
  const {value:l,binding}=source(`course-app/content/hsk${level}/lesson-${String(lesson).padStart(2,'0')}.json`);
  for(const [i,w]of l.vocabulary.entries())targets.push({id:w.id,level,lesson,unit:'word',sourceText:w.zh,...binding,sourceJSONPointer:`/vocabulary/${i}/zh`});
  for(const [ti,t]of l.texts.entries())for(const [i,line]of t.lines.entries()){
   const parts=sentences(line,{...binding,sourceJSONPointer:`/texts/${ti}/lines/${i}/zh`});
   for(const [n,text]of parts.entries())targets.push({id:parts.length===1?line.id:`${line.id}:sentence${n+1}`,level,lesson,unit:'sentence',sourceText:text,parentLineId:parts.length===1?null:line.id,sentenceNumber:n+1,...binding,sourceJSONPointer:`/texts/${ti}/lines/${i}/zh`});
  }
 }
 if(targets.length!==2540||new Set(targets.map(t=>t.id)).size!==2540)throw Error('Changed complete precision target set');
 return {schemaVersion:1,sourceFiles,nonPhoneticSourceParts,targets:targets.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const repo=resolve(import.meta.dirname,'../../..'),result=derivePrecisionTargets(repo),output=process.argv[2];
 if(!output)throw Error('Usage: build-precision-targets OUTPUT_JSON');
 writeFileSync(resolve(output),JSON.stringify(result)+'\n');console.log(JSON.stringify({sourceFiles:result.sourceFiles.length,targets:result.targets.length,sha256:sha(readFileSync(resolve(output)))}));
}
