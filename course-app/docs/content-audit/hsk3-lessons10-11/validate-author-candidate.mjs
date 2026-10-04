/** Author structural/preservation checks. This is not independent acceptance. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {verifyActivities} from '../../../tools/verify-activities.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const app=path.resolve(here,'../../..');
const repo=path.resolve(app,'..');
const baseline='9b7c76702e9724b4c647750138d800605254a116';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const failures=[];
const assert=(ok,message)=>{if(!ok)failures.push(message);};
const expected={
  10:{activities:26,fields:68,official:24,reference:28,open:16,figures:14,warmup:'BEDAFC',listening:'CBBBABBA',words:'ACEDBDCBEA',grammarBlanks:9,pictureBlanks:[3,3,3],vocabulary:33,textLines:26},
  11:{activities:29,fields:72,official:24,reference:35,open:13,figures:13,warmup:'ACEDBF',listening:'ACCCCCCB',words:'CADBEDBAEC',grammarBlanks:12,pictureBlanks:[3,4,4],vocabulary:29,textLines:24},
};
function oldDifferences(before,after,at=''){
 const result=[];
 if(Array.isArray(before)){
  if(!Array.isArray(after)||before.length!==after.length)result.push({path:at,kind:'array-length',before:before.length,after:after?.length});
  before.forEach((value,i)=>result.push(...oldDifferences(value,after?.[i],`${at}/${i}`)));
 }else if(before&&typeof before==='object'){
  for(const [key,value] of Object.entries(before)){
   if(!after||!(key in after))result.push({path:`${at}/${key}`,kind:'removed'});
   else result.push(...oldDifferences(value,after[key],`${at}/${key}`));
  }
 }else if(before!==after)result.push({path:at,kind:'changed',before,after});
 return result;
}
const lessons=[];
const completionRepairs=fs.existsSync(path.join(here,'vietnamese-completion-repairs.json'))?read(path.join(here,'vietnamese-completion-repairs.json')):null;
for(const n of [10,11]){
 const relative=`course-app/content/hsk3/lesson-${n}.json`;
 const currentBytes=fs.readFileSync(path.join(repo,relative));
 const d=JSON.parse(currentBytes),e=expected[n];
 const baseBytes=execFileSync('git',['show',`${baseline}:${relative}`],{cwd:repo});
 const base=JSON.parse(baseBytes),differences=oldDifferences(base,d);
 assert(differences.length===0,`L${n}: original key/value changes: ${JSON.stringify(differences)}`);
 assert(d.homework.length===30&&d.homework.filter(q=>q.part==='writing').length===5,`L${n}: original 30 homework boundary`);
 assert(d.listening.length===4,`L${n}: supplemental listening count`);
 assert(d.vocabulary.length===e.vocabulary,`L${n}: vocabulary count`);
 assert(d.texts.reduce((a,t)=>a+t.lines.length,0)===e.textLines,`L${n}: text line count`);
 const issues=verifyActivities(d);assert(!issues.length,`L${n}: activity schema issues: ${issues.join('; ')}`);
 const fields=d.activities.flatMap(a=>a.fields),counts=Object.fromEntries(['official','reference','open'].map(a=>[a,fields.filter(f=>f.assessment===a).length]));
 for(const check of completionRepairs?.completedSentenceChecks??[]){
  if(!check.activityId.startsWith(d.id+':'))continue;
  const a=d.activities.find(a=>a.id===check.activityId);
  assert(Boolean(a),`${check.activityId}: repaired activity missing`);
  if(!a)continue;
  const template=a.id.includes('picture-dialogue')?a.note.vi.split(' Câu tham khảo do biên tập viên')[0]:a.title.vi;
  let index=0;const references=a.fields.map(f=>f.referenceAnswer.vi);
  const completed=template.replace(/_{3,}/g,()=>references[index++]);
  assert(index===references.length&&completed===check.completedVietnamese,`${a.id}: complete Vietnamese prompt/reference regression`);
 }
 assert(d.activities.length===e.activities&&fields.length===e.fields,`L${n}: activity/field count`);
 for(const key of Object.keys(counts))assert(counts[key]===e[key],`L${n}: ${key} count`);
 const keys=activities=>activities.flatMap(a=>a.fields).map(f=>String.fromCharCode(65+f.options.findIndex(o=>o.zh===f.answer))).join('');
 assert(keys(d.activities.filter(a=>a.id.endsWith('warmup1-matching')))===e.warmup,`L${n}: warmup official keys`);
 assert(keys(d.activities.filter(a=>/text\d-listening$/.test(a.id)))===e.listening,`L${n}: listen-twice official keys`);
 assert(keys(d.activities.filter(a=>/comprehensive-words\d$/.test(a.id)))===e.words,`L${n}: word bank official keys`);
 for(const a of d.activities.filter(a=>/text\d-listening$/.test(a.id))){
  const ti=Number(a.id.match(/text(\d)-listening$/)[1]);
  assert(a.audioTrack===`${n}-${ti*2-1}`&&a.recommendedPlays===2,`${a.id}: original audio/twice directive`);
  const page=n===10?14:ti<3?15:16;
  for(const f of a.fields)assert(f.answerSource.pdfPage===page,`${f.id}: official answer-page boundary`);
 }
 for(const a of d.activities.filter(a=>/comprehensive-words\d$/.test(a.id)))for(const f of a.fields){
  const qi=Number(f.id.match(/word(\d+)$/)[1]);
  assert(f.answerSource.pdfPage===(n===10?(qi<=4?14:15):16),`${f.id}: word answer-page boundary`);
 }
 assert(d.activities.filter(a=>/grammar\d-practice\d$/.test(a.id)).reduce((a,x)=>a+x.fields.length,0)===e.grammarBlanks,`L${n}: separate grammar blanks`);
 assert(JSON.stringify(d.activities.filter(a=>/picture-dialogue\d$/.test(a.id)).map(a=>a.fields.length))===JSON.stringify(e.pictureBlanks),`L${n}: separate picture-dialogue blanks`);
 for(const f of fields.filter(f=>f.assessment!=='official'))assert(f.answer===undefined&&f.answerSource===undefined,`${f.id}: open/reference must not be exact-graded`);
 const qids=d.texts.flatMap(t=>t.questions.map(q=>q.id));
 assert(qids.every(id=>fields.some(f=>f.targetRef===id)),`L${n}: every original text task/question is mapped`);
 if(n===10){
  assert(fields.find(f=>f.id.endsWith('text4-read-aloud')).input==='checkbox','L10: original read-aloud directive is a completion check');
  assert(fields.find(f=>f.id.endsWith('text4-china-system')).assessment==='reference','L10: China retelling is non-unique reference');
  assert(fields.find(f=>f.id.endsWith('text4-own-country-system')).assessment==='open','L10: own-country discussion is open');
  assert(d.sections.find(s=>s.kind==='culture').media.status==='unavailable','L10: unavailable culture video is retained');
 }else assert(!d.sections.some(s=>s.kind==='culture'||s.kind==='review'),'L11: no fabricated culture/review section');
 assert(d.illustrationManifest.length===e.figures,`L${n}: figure count`);
 const figures=[];
 for(const pic of d.illustrationManifest){
  const bytes=fs.readFileSync(path.join(app,'public',pic.file)),svg=bytes.toString();
  assert(sha(bytes)===pic.assetSha256,`${pic.id}: asset hash`);
  assert(!/<(?:image|script|foreignObject)\b|(?:href|src)\s*=\s*["']https?:|data:image/i.test(svg),`${pic.id}: embedded/external asset`);
  assert(pic.kind==='original-illustration'&&pic.originalTextbookImage===false,`${pic.id}: original asset provenance`);
  assert(pic.authorVisualReview.status==='author-pixels-inspected',`${pic.id}: author pixel inspection pending`);
  assert(pic.independentReview.status==='pending',`${pic.id}: author must not assert independent acceptance`);
  if(pic.sceneKey.startsWith('warmup')){
   const visible=[...svg.matchAll(/<text\b[^>]*>(.*?)<\/text>/gs)].map(m=>m[1]).join(' ');
   assert(!/[A-F办公室黑板数学考试历史成绩会议休假经理邮件]/u.test(visible),`${pic.id}: answer word/letter visible`);
  }
  figures.push({id:pic.id,file:pic.file,sha256:sha(bytes)});
 }
 const jsonCopyHash=key=>sha(Buffer.from(JSON.stringify(d[key])));
 lessons.push({lesson:n,file:relative,sha256:sha(currentBytes),baselineFileSha256:sha(baseBytes),counts:{activities:d.activities.length,fields:fields.length,...counts,figures:figures.length,vocabulary:d.vocabulary.length,textLines:e.textLines,grammarBlanks:e.grammarBlanks,pictureBlanks:e.pictureBlanks},originalKeyDifferences:differences,oldDataProjectionPreserved:true,preservedCoreHashes:Object.fromEntries(['objectives','warmup','vocabulary','grammar','sections','homework','listening'].map(k=>[k,jsonCopyHash(k)])),figures,verifyActivitiesIssues:issues});
}
const report={scope:'author structural, source-binding and preservation checks; not independent review or browser acceptance',baseline,status:failures.length?'FAIL':'PASS',failures,lessons};
fs.writeFileSync(path.join(here,'author-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,failures,lessons:lessons.map(l=>({lesson:l.lesson,sha256:l.sha256,counts:l.counts}))},null,2));
if(failures.length)process.exitCode=1;
