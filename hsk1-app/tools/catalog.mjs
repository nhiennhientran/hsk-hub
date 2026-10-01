import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

export const BASELINE = '71b39192133c82f684384f450dda6079d3253440';
export const EXPECTED = Object.freeze({lessons:15,tasks:300,senses:344,forms:319,textbookWords:342,texts:45,grammar:40,sortAnswers:95,listening:75,wordAudio:330,missingWordAudio:14,clips:405,tracks:93});
const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const COURSE = 'new-hsk1/hsk1/';
const DATA = new Set(['new-data.js','new-enrichment.js','textbook-data-corrections.js','textbook-audio-segments.js','pos-tips.js','textbook-integration-corrections.js','stage3/catalog.js','textbook-final-corrections.js']);
const RUNTIME = new Map([
  ['../assets/pako.min.js','packing library'],['../assets/style-packed.js','style renderer'],
  ['textbook-segment-audio.js','playback; reads segment data at DOMContentLoaded'],
  ['../assets/hanzi-writer.min.js','stroke renderer'],['app-core.js','renderer; static phonetics extracted separately'],
  ['auth-patch.js','access gate'],['../assets/hsk2-parity.js','UI renderer'],
  ['new-practice-bank-packed.js','disabled legacy bank compatibility shim; defines no question bank'],
  ['app-practice.js','legacy generated practice renderer'],['../assets/lesson-menu-parity.js','navigation renderer'],
  ['../assets/hanzi-curriculum.js','renderer; static HSK1 Hanzi syllabus extracted separately'],
  ['tts-only.js','playback renderer'],['textbook-audio-guard.js','playback guard'],
  ['textbook-audio.js','playback renderer'],['hanzi-visibility-fix.js','stroke visibility renderer'],
  ['learning-links.js','navigation renderer']
]);
const pad = n => String(n).padStart(2,'0');
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export function canonical(value) {
  if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  if (value && typeof value === 'object') return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
export const fingerprint = value => sha256(canonical(value));
const clone = value => JSON.parse(JSON.stringify(value));
const json = value => JSON.stringify(value,null,2)+'\n';
const record = value => ({...value,fingerprint:fingerprint(value)});
const sourceQuestionId = id => id.replace('-s2-','-').replace('-translation-free-','-translation-');

export function scriptOrder(html) {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].map((m,index)=>{
    const src=m[1].match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    assert.ok(src && !m[2].trim(),`Unclassified inline script at position ${index+1}`);
    assert.ok(!/^(?:[a-z]+:|\/)/i.test(src),`External script requires review: ${src}`);
    const name=src.split(/[?#]/)[0];
    const mode=DATA.has(name)?'execute-content':RUNTIME.has(name)?'inventory-runtime':null;
    assert.ok(mode,`Unclassified lesson script: ${name}`);
    return {order:index+1,src,name,mode,reason:mode==='execute-content'?'final textbook content layer':RUNTIME.get(name)};
  });
  assert.ok(scripts.length,'No lesson scripts found');
  for(const required of DATA)assert.equal(scripts.filter(s=>s.name===required).length,1,`Required content script ${required}`);
  for(const required of ['app-core.js','../assets/hanzi-curriculum.js'])assert.equal(scripts.filter(s=>s.name===required).length,1,`Required static content ${required}`);
  return scripts;
}

// Extract only a reviewed static object/array literal. String contents and comments
// are skipped while matching brackets; no DOM, storage, playback or renderer runs.
export function staticLiteral(code, marker) {
  const offset=code.indexOf(marker);
  assert.ok(offset>=0 && code.indexOf(marker,offset+marker.length)<0,`Static marker must occur once: ${marker}`);
  let start=offset+marker.length;
  while(/\s/.test(code[start]||'') && start<code.length)start++;
  assert.ok('[{'.includes(code[start]),`Expected static literal after ${marker}`);
  const stack=[];let quote=null,comment=null,escape=false;
  for(let i=start;i<code.length;i++){
    const c=code[i],next=code[i+1];
    if(comment==='line'){if(c==='\n')comment=null;continue;}
    if(comment==='block'){if(c==='*'&&next==='/'){comment=null;i++;}continue;}
    if(quote){if(escape){escape=false;continue;}if(c==='\\'){escape=true;continue;}if(c===quote)quote=null;continue;}
    if(c==='/'&&next==='/'){comment='line';i++;continue;}
    if(c==='/'&&next==='*'){comment='block';i++;continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    assert.notEqual(c,'`',`Template literal is unsupported in static content: ${marker}`);
    if(c==='['||c==='{')stack.push(c);
    if(c===']'||c==='}'){
      assert.equal(stack.pop(),c===']'?'[':'{',`Unbalanced ${marker}`);
      if(!stack.length)return clone(vm.runInNewContext('('+code.slice(start,i+1)+')',{}, {timeout:1000}));
    }
  }
  throw new Error(`Unterminated static literal: ${marker}`);
}

function differences(before,after,prefix='') {
  if(canonical(before)===canonical(after))return [];
  if(!before || !after || typeof before!=='object'||typeof after!=='object')return [prefix];
  return [...new Set([...Object.keys(before),...Object.keys(after)])].flatMap(k=>differences(before[k],after[k],prefix+'/'+k));
}

export function mapVocabulary(lessons,vocabulary) {
  const refs=[];const words=new Map();
  for(const lesson of lessons)for(const [index,word] of lesson.vocab.entries()){
    const key=`${lesson.id}:${word.zh}`;
    assert.ok(!words.has(key),`Duplicate textbook word ${key}`);
    words.set(key,{lesson:lesson.id,index,word,id:`textbook-l${pad(lesson.id)}-v${String(index+1).padStart(3,'0')}`});
  }
  for(const v of vocabulary){
    const w=words.get(`${v.lesson}:${v.zh}`);
    assert.ok(w,`Catalog item ${v.id} has no same-lesson textbook word`);
    assert.ok(w.word.vn.includes(v.vi),`Meaning drift: ${v.id}`);
    assert.ok(v.py.split(' / ').every(reading=>w.word.py.split(' / ').includes(reading)),`Pinyin drift: ${v.id}`);
    if(v.lesson>=9)assert.ok(w.word.sourceSenseIds?.includes(v.senseId),`Final correction lost sense ${v.senseId}`);
    refs.push({catalogId:v.id,lexId:v.lexId,senseId:v.senseId,textbookId:w.id,lesson:v.lesson,zh:v.zh,source:clone(v.source)});
  }
  for(const w of words.values())assert.ok(refs.some(r=>r.textbookId===w.id),`Textbook word ${w.id} is absent from catalog`);
  return refs;
}

function pages(source,label) {
  assert.ok(source && Array.isArray(source.printPages) && source.printPages.length,`Missing print-page source ${label}`);
  assert.ok(Array.isArray(source.pdfPages)&&source.pdfPages.length===source.printPages.length,`Missing PDF-page source ${label}`);
  for(let i=0;i<source.printPages.length;i++)assert.equal(source.pdfPages[i],source.printPages[i]+15,`Page reference drift ${label}`);
}

export function verifyClip(id,uri,entry) {
  assert.match(uri||'',/^data:audio\/[A-Za-z0-9.+-]+;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,`Invalid media URI ${id}`);
  const bytes=Buffer.from(uri.slice(uri.indexOf(',')+1),'base64');
  assert.equal(bytes.length,entry.bytes,`Clip byte count ${id}`);
  assert.equal(sha256(bytes),entry.sha256,`Clip SHA256 ${id}`);
  assert.ok(Number.isFinite(entry.duration)&&entry.duration>0,`Clip duration metadata ${id}`);
  return {id,bytes:bytes.length,sha256:sha256(bytes),duration:entry.duration,lesson:entry.lesson};
}

export function sortingOrder(tokens,target,normal) {
  const goal=normal(target),parts=tokens.map(normal);
  function visit(remaining,order,prefix){
    if(!remaining.length)return prefix===goal?order:null;
    for(const index of remaining){const next=prefix+parts[index];if(goal.startsWith(next)){const result=visit(remaining.filter(i=>i!==index),[...order,index],next);if(result)return result;}}
    return null;
  }
  return visit(tokens.map((_,i)=>i),[],'');
}

export function validateReferences(catalog,bank,index,tracks,segments) {
  const trackMap=new Map(tracks.map(t=>[t.id,t]));
  assert.equal(trackMap.size,tracks.length,'Duplicate original track IDs');
  const tasks=bank.flatMap(l=>['choice','sort','translation'].flatMap(kind=>l[kind].map(q=>({...q,lesson:l.lesson}))));
  tasks.push(...catalog.listening);
  const taskIds=new Set();
  for(const q of tasks){assert.ok(q.id&&!taskIds.has(q.id),`Duplicate or missing task ID ${q.id}`);taskIds.add(q.id);pages(q.source,q.id);}
  const vocabIds=new Set(),senseIds=new Set();
  for(const v of catalog.vocabulary){
    assert.ok(v.id&&v.lexId&&v.senseId&&!vocabIds.has(v.id)&&!senseIds.has(v.senseId),`Duplicate or missing catalog identity ${v.id}`);
    vocabIds.add(v.id);senseIds.add(v.senseId);pages(v.source,v.id);
  }
  for(const q of catalog.listening){
    assert.ok(Array.isArray(q.options)&&q.options.length===4&&new Set(q.options).size===4,`Listening options ${q.id}`);
    assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,`Listening answer ${q.id}`);
    assert.ok(Array.isArray(q.optionFeedback)&&q.optionFeedback.length===4&&q.optionFeedback.every(v=>typeof v==='string'&&v.length),`Listening feedback ${q.id}`);
    assert.ok(Array.isArray(q.transcript)&&q.transcript.length&&q.transcript.every(row=>row.zh&&row.py&&row.vi),`Listening transcript ${q.id}`);
  }
  const playable=[...catalog.listening,...catalog.vocabulary.filter(v=>v.audio)];
  for(const row of playable){
    const a=row.audio,t=trackMap.get(a?.track),clip=index.clips[row.id];
    assert.ok(t,`Missing original track ${row.id}`);
    assert.ok(clip,`Missing clip ${row.id}`);assert.equal(clip.lesson,row.lesson,`Clip lesson ${row.id}`);
    assert.ok(Number.isFinite(a.start)&&Number.isFinite(a.end)&&a.start>=0&&a.end>a.start&&a.end<=t.duration_s,`Invalid track interval ${row.id}`);
    assert.equal(Number(a.track.split('-')[0]),row.lesson,`Unexpected cross-lesson catalog audio ${row.id}`);
  }
  assert.deepEqual(Object.keys(index.clips).sort(),playable.map(v=>v.id).sort(),'Orphan clip or missing reference');
  const missing=catalog.vocabulary.filter(v=>!v.audio);
  for(const row of missing){assert.equal(row.lesson,4,`Unexpected missing word audio ${row.id}`);assert.ok(segments.unsupported['4'].includes(row.zh),`Missing unsupported-word declaration ${row.id}`);}
  for(const [track,ranges] of Object.entries(segments.text)){
    const source=trackMap.get(track);assert.equal(source?.kind,'text',`Missing text track ${track}`);
    for(const interval of ranges)assert.ok(interval.length===2&&interval[0]>=0&&interval[1]>interval[0]&&interval[1]<=source.duration_s,`Invalid textbook text segment ${track}`);
  }
  for(const [track,rows] of Object.entries(segments.vocab)){
    const source=trackMap.get(track);assert.equal(source?.kind,'vocab',`Missing word track ${track}`);
    for(const row of rows)assert.ok(row[0]&&row[1]>=0&&row[2]>row[1]&&row[2]<=source.duration_s,`Invalid textbook vocabulary segment ${track}`);
  }
  for(const [lesson,words] of Object.entries(segments.crossLessonReuse||{}))for(const [word,row] of Object.entries(words)){
    const source=trackMap.get(row[0]);assert.ok(source&&row[1]>=0&&row[2]>row[1]&&row[2]<=source.duration_s,`Invalid explicit reuse ${lesson}:${word}`);
  }
  return {tasks,playable,missing};
}

export function buildCorpus(project=PROJECT,{verifyBaseline=true}={}) {
  const sources=new Map();
  const read=relative=>{
    assert.ok(!relative.startsWith('hsk1-app/'),`Generated directory cannot be an extraction source: ${relative}`);
    const absolute=path.resolve(project,relative);assert.ok(absolute.startsWith(path.resolve(project)+path.sep),'Source escapes repository');
    const bytes=fs.readFileSync(absolute),entry={path:relative,bytes:bytes.length,sha256:sha256(bytes)};
    if(verifyBaseline){
      const actual=createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
      const expected=execFileSync('git',['rev-parse',`${BASELINE}:${relative}`],{cwd:project,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
      assert.equal(actual,expected,`Source changed from required baseline: ${relative}`);entry.gitBlob=expected;
    }
    sources.set(relative,entry);return bytes;
  };
  const text=relative=>read(relative).toString('utf8');
  const order=scriptOrder(text(COURSE+'lesson.html'));
  const context=vm.createContext({window:{},location:{href:'http://localhost/lesson.html?id=1'},console:{log(){},warn(){},error(...args){throw new Error('Content script error: '+args.map(String).join(' '));}}});
  const changes=[];const contentFiles=[];let phonetics,hanzi;
  for(const script of order){
    const relative=path.posix.normalize(COURSE+script.name),code=text(relative);script.path=relative;script.sha256=sources.get(relative).sha256;
    if(script.mode==='execute-content'){
      const before=clone({lessons:context.window.HSK1_LESSONS||null,segments:context.window.HSK1_OFFICIAL_SEGMENTS||null});
      vm.runInContext(code,context,{filename:relative,timeout:3000});contentFiles.push(relative);
      const after=clone({lessons:context.window.HSK1_LESSONS||null,segments:context.window.HSK1_OFFICIAL_SEGMENTS||null});
      changes.push({script:relative,order:script.order,before:fingerprint(before),after:fingerprint(after),changedPaths:differences(before,after)});
    }
    if(script.name==='app-core.js')phonetics=staticLiteral(code,'const LESSON1_PHONETICS=');
    if(script.name==='../assets/hanzi-curriculum.js')hanzi=staticLiteral(code,'const h1=');
  }
  const lessons=clone(context.window.HSK1_LESSONS),catalog=clone(context.window.HSKStep3Catalog),segments=clone(context.window.HSK1_OFFICIAL_SEGMENTS);
  assert.equal(context.window.HSK1_TEXTBOOK_DATA_CORRECTIONS?.status,'PASS','Required L11 correction did not apply');
  assert.equal(context.window.HSK1_FINAL_TEXTBOOK?.audioCorrected,true,'Final corrections lack segment data');
  const isolated=vm.createContext({window:{}});
  vm.runInContext(text(COURSE+'stage2/bank.js'),isolated,{timeout:3000});
  vm.runInContext(text(COURSE+'stage3/media-index.js'),isolated,{timeout:3000});
  vm.runInContext(text(COURSE+'stage2/engine.js'),isolated,{timeout:3000});
  const bank=clone(isolated.HSKStep2Bank),index=clone(isolated.window.HSKStep3MediaIndex);
  assert.ok(Array.isArray(bank),'Stage 2 bank missing');assert.ok(index?.clips,'Stage 3 media index missing');
  const sourceBanks=['01-05','06-10','11-15'].flatMap(range=>JSON.parse(text(COURSE+`question-bank/bank-${range}.json`)));
  assert.equal(sourceBanks.length,15,'Required reviewed question-bank lesson count');
  const sourceQuestions=new Map(sourceBanks.flatMap(l=>['choice','sort','translation'].flatMap(k=>l[k].map(q=>[q.id,q]))));
  const stage2SourceRelations=bank.flatMap(l=>['choice','sort','translation'].flatMap(kind=>l[kind].map(q=>{
    const sourceId=sourceQuestionId(q.id),original=sourceQuestions.get(sourceId);
    assert.ok(original,`Stage 2 task lacks question-bank source ID ${q.id}`);
    return {id:q.id,sourceId,lesson:l.lesson,kind,relationship:'same lesson/type/ordinal with normalized -s2- and -free- namespaces; not a claim of identical content',sourceFingerprint:fingerprint(original),stage2Fingerprint:fingerprint(q),changedSourceFields:Object.keys(original).filter(k=>k!=='id'&&canonical(original[k])!==canonical(q[k]))};
  })));
  assert.equal(new Set(stage2SourceRelations.map(r=>r.sourceId)).size,225,'Question-bank source mapping must be one-to-one');
  const sortExpressions=[];
  const engine=isolated.window.HSKStep2Engine;assert.ok(engine?.normal&&engine?.check,'Required Stage 2 grading engine missing');
  for(const lesson of bank){
    for(const q of lesson.choice){
      assert.equal(q.options.length,4,`Choice option count ${q.id}`);assert.equal(new Set(q.options).size,4,`Duplicate choices ${q.id}`);
      assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,`Choice answer index ${q.id}`);
      for(let option=0;option<4;option++)assert.equal(engine.check(q,option),option===q.answer,`Choice answer ${q.id}`);
    }
    for(const q of lesson.sort)for(const [index,answer] of q.answers.entries()){
      const order=sortingOrder(q.tokens,answer,engine.normal);assert.ok(order,`Unconstructible sort expression ${q.id}:${index}`);
      assert.equal(engine.check(q,order),true,`Unaccepted sort expression ${q.id}:${index}`);
      sortExpressions.push({taskId:q.id,lesson:lesson.lesson,index,answer,order,fingerprint:fingerprint(answer)});
    }
    for(const q of lesson.translation)assert.equal(q.assessment,'manual',`Translation assessment ${q.id}`);
  }
  const manifest=JSON.parse(text(COURSE+'textbook-audio-manifest.json'));
  const tracks=manifest.entries.map(t=>{
    const relative=path.posix.normalize(COURSE+t.file);assert.ok(relative.startsWith(COURSE+'audio/'),'Original audio path escapes audio directory');
    const bytes=read(relative);assert.equal(bytes.length,t.bytes,`Original bytes ${t.id}`);assert.equal(sha256(bytes),t.sha256,`Original SHA256 ${t.id}`);
    return {...t,path:relative};
  });
  assert.equal(manifest.count,tracks.length,'Original manifest count');
  assert.deepEqual(fs.readdirSync(path.join(project,COURSE,'audio')).filter(f=>f.endsWith('.mp3')).sort(),tracks.map(t=>path.basename(t.file)).sort(),'Original audio directory differs from manifest');
  const {tasks,playable,missing}=validateReferences(catalog,bank,index,tracks,segments);
  const mapping=mapVocabulary(lessons,catalog.vocabulary);
  const clips=[];
  for(let lesson=1;lesson<=15;lesson++){
    const mediaFile=COURSE+`stage3/media/lesson-${pad(lesson)}.js`,mediaContext=vm.createContext({window:{}});
    vm.runInContext(text(mediaFile),mediaContext,{filename:mediaFile,timeout:3000});
    const media=mediaContext.window.HSKStep3Media;assert.ok(media,`Media pack missing ${lesson}`);
    assert.deepEqual(Object.keys(media).sort(),Object.entries(index.clips).filter(([,v])=>v.lesson===lesson).map(([id])=>id).sort(),`Unexpected clip pack contents ${lesson}`);
    for(const [id,uri] of Object.entries(media))clips.push({...verifyClip(id,uri,index.clips[id]),mediaFile,audio:clone(playable.find(row=>row.id===id).audio)});
  }
  for(let lesson=1;lesson<=15;lesson++){
    assert.equal(lessons.filter(l=>l.id===lesson).length,1,`Textbook lesson ${lesson}`);
    assert.equal(catalog.lessons.find(l=>l.id===lesson)?.title,lessons.find(l=>l.id===lesson).title,`Lesson title drift ${lesson}`);
    assert.equal(bank.filter(l=>l.lesson===lesson).length,1,`Stage 2 lesson ${lesson}`);
    for(const kind of ['choice','sort','translation'])assert.equal(bank.find(l=>l.lesson===lesson)[kind].length,5,`Task quota ${lesson}:${kind}`);
    assert.equal(catalog.listening.filter(l=>l.lesson===lesson).length,5,`Listening quota ${lesson}`);
    assert.equal(lessons.find(l=>l.id===lesson).scenes.length,3,`Text quota ${lesson}`);
    assert.ok(hanzi[lesson],`Missing Hanzi syllabus ${lesson}`);
  }
  assert.equal(phonetics.length,3,'Extra Lesson 1 phonetics content');
  const counts={lessons:lessons.length,tasks:tasks.length,senses:catalog.vocabulary.length,forms:new Set(catalog.vocabulary.map(v=>v.zh)).size,textbookWords:lessons.reduce((n,l)=>n+l.vocab.length,0),texts:lessons.reduce((n,l)=>n+l.scenes.length,0),grammar:lessons.reduce((n,l)=>n+l.grammar.length,0),sortAnswers:bank.reduce((n,l)=>n+l.sort.reduce((m,q)=>m+q.answers.length,0),0),listening:catalog.listening.length,wordAudio:catalog.vocabulary.filter(v=>v.audio).length,missingWordAudio:missing.length,clips:clips.length,tracks:tracks.length};
  assert.deepEqual(counts,EXPECTED,'Frozen corpus counts drifted');
  const provenance={kind:'runtime-extraction',html:COURSE+'lesson.html',contentFiles,printPages:null,pdfPages:null};
  const textbook={schemaVersion:1,baseline:BASELINE,lessons:lessons.map(l=>({
    id:l.id,title:l.title,title_py:l.title_py,vn_title:l.vn_title,
    vocab:l.vocab.map((v,i)=>record({...v,id:`textbook-l${pad(l.id)}-v${String(i+1).padStart(3,'0')}`,source:{...provenance,catalogSources:mapping.filter(r=>r.lesson===l.id&&r.zh===v.zh).map(r=>({catalogId:r.catalogId,senseId:r.senseId,...r.source}))},catalogIds:mapping.filter(r=>r.lesson===l.id&&r.zh===v.zh).map(r=>r.catalogId)})),
    scenes:l.scenes.map((s,i)=>{
      const track=tracks.find(t=>t.lesson===l.id&&t.kind==='text'&&t.scene===i+1);assert.ok(track,`Scene track ${l.id}:${i+1}`);assert.equal(segments.text[track.id].length,s.lines.length,`Scene/segment line count ${track.id}`);
      return record({...s,id:`textbook-l${pad(l.id)}-text-${i+1}`,source:{...provenance,audioTrack:track.id},lines:s.lines.map((line,j)=>record({...line,id:`textbook-l${pad(l.id)}-text-${i+1}-line-${pad(j+1)}`}))});
    }),
    grammar:l.grammar.map((g,i)=>record({...g,id:`textbook-l${pad(l.id)}-grammar-${pad(i+1)}`,source:provenance})),
    phonetics:l.id===1?phonetics.map((p,i)=>record({...p,id:`textbook-l01-phonetics-${i+1}`,source:{kind:'static-runtime-literal',path:COURSE+'app-core.js',marker:'LESSON1_PHONETICS',printPages:null,pdfPages:null}})):[],
    hanzi:record({...hanzi[l.id],id:`textbook-l${pad(l.id)}-hanzi`,source:{kind:'static-runtime-literal',path:'new-hsk1/assets/hanzi-curriculum.js',marker:`h1[${l.id}]`,printPages:null,pdfPages:null}}),
    xiaoyuTips:(l.xiaoyuTips||[]).map((tip,i)=>record({...tip,id:`textbook-l${pad(l.id)}-tip-${pad(i+1)}`,source:{kind:'static-runtime-content',path:COURSE+'pos-tips.js',printPages:null,pdfPages:null}}))
  }))};
  const stage2={schemaVersion:1,baseline:BASELINE,source:COURSE+'stage2/bank.js',lessons:bank.map(l=>({...l,...Object.fromEntries(['choice','sort','translation'].map(k=>[k,l[k].map(q=>record({...q,lesson:l.lesson,sourceQuestionId:sourceQuestionId(q.id)}))]))}))};
  const stage3={...catalog,schemaVersion:1,baseline:BASELINE,source:COURSE+'stage3/catalog.js',listening:catalog.listening.map(record),vocabulary:catalog.vocabulary.map(record)};
  const media={schemaVersion:1,baseline:BASELINE,indexSource:COURSE+'stage3/media-index.js',originalManifestSource:COURSE+'textbook-audio-manifest.json',clips:clips.map(record),originalTracks:tracks.map(record),textbookSegments:segments,missingWordAudio:missing.map(v=>({id:v.id,senseId:v.senseId,lesson:v.lesson,zh:v.zh,source:v.source,reason:'No official same-lesson word audio declared; no substitute created.'}))};
  const artifacts={'content/textbook.json':textbook,'content/stage2-bank.json':stage2,'content/stage3-catalog.json':stage3,'content/media-references.json':media};
  const review={schemaVersion:1,baseline:BASELINE,status:'PASS',counts,extraPhonetics:3,hanziLessons:15,sha256Verified:{originalTracks:93,embeddedClips:405},referenceChecks:{taskIds:300,catalogIds:344,senseIds:344,sameLessonVocabularyMappings:mapping.length,sourcePageOffset:15,sceneLineSegmentCounts:45,orphanClips:0},vocabularyMapping:mapping,scriptOrder:order,checks:['Frozen baseline source bytes match Git objects','Required content layers executed in lesson.html order','All 300 task IDs and source pages retained','75 choice items have a valid single answer index; all four options match the current grading engine','All 95 accepted sorting expressions can be assembled from their tokens and pass the current grading engine','75 listening items have a valid single answer index, four unique options, complete transcript and four feedback entries','75 translations retain manual assessment','344 catalog senses map to 342 final textbook words in the same lesson','Final vocabulary meanings and pinyin agree with catalog','45 textbook scenes match original tracks and line interval counts','405 clips match media-index SHA256/bytes and 405 catalog audio references','93 originals match manifest SHA256/bytes; original directory has no unlisted MP3','14 missing word-audio records are explicitly declared unsupported'],limitations:[
    'No human-ear listening review was performed in this extraction step; SHA256 and reference checks do not establish perceptual audio/text accuracy.',
    'Source PDF pages were not independently visually rechecked. Existing page references are preserved and their print/PDF offset is checked.',
    'The six reviewed Stage 3 JSON files named by catalog.js are not present in this baseline; the committed catalog is the verifiable Stage 3 source.',
    'Textbook scenes, grammar, phonetics and Hanzi have no explicit printed-page references in their runtime source; no page numbers were invented.',
    `The older raw question-bank JSON differs from the authoritative Stage 2 bank in ${stage2SourceRelations.filter(r=>r.changedSourceFields.length).length} of 225 lesson/type/ordinal relationships, including choice and sort revisions and manual translation changes. The -s2- and -free- ID namespaces are normalized only to inspect those relationships; changed source fields and both fingerprints are recorded. This does not establish identical content or independently confirm historical lineage. The authoritative Stage 2 bank payload is preserved.`,
    'Media durations and timingBasis are inherited source metadata; this step does not independently decode audio to confirm durations or timing.'
  ],humanEarReviewPerformed:false,visualPDFReviewPerformed:false};
  artifacts['review/corpus-validation.json']=review;
  artifacts['review/corpus-changes.json']={schemaVersion:1,baseline:BASELINE,changes,stage2SourceRelations,finalCorrectionStatus:clone({dataCorrection:context.window.HSK1_TEXTBOOK_DATA_CORRECTIONS.status,integration:context.window.HSK1_INTEGRATION_TEXTBOOK,final:context.window.HSK1_FINAL_TEXTBOOK}),note:'Changes describe source-layer application in observed HTML order; changedPaths are JSON pointer paths, not a new editorial revision. Stage 2 source relations normalize -s2- and translation-free namespaces by lesson/type/ordinal and record payload changes without overwriting the authoritative bank.'};
  const exportedTasks=[...stage2.lessons.flatMap(l=>['choice','sort','translation'].flatMap(k=>l[k])),...stage3.listening];
  const listeningIds=new Set(stage3.listening.map(q=>q.id));
  const inventory={schemaVersion:1,baseline:BASELINE,counts,sources:[...sources.values()].sort((a,b)=>a.path.localeCompare(b.path)),artifacts:Object.entries(artifacts).map(([relative,value])=>({path:'hsk1-app/'+relative,bytes:Buffer.byteLength(json(value)),sha256:sha256(json(value))})),taskRecords:exportedTasks.map(q=>({id:q.id,lesson:q.lesson,kind:listeningIds.has(q.id)?'listening':q.kind,...(listeningIds.has(q.id)?{listeningKind:q.kind}:{}),source:q.source,fingerprint:q.fingerprint})),catalogRecords:stage3.vocabulary.map(v=>({id:v.id,lexId:v.lexId,senseId:v.senseId,lesson:v.lesson,zh:v.zh,source:v.source,fingerprint:v.fingerprint})),sortAcceptedExpressions:sortExpressions};
  artifacts['review/corpus-inventory.json']=inventory;
  return {artifacts,counts};
}

export function persistCorpus(project,result,checkOnly=true) {
  for(const [relative,value] of Object.entries(result.artifacts)){
    const target=path.join(project,'hsk1-app',relative),content=json(value);
    if(checkOnly)assert.equal(fs.readFileSync(target,'utf8'),content,`Generated artifact is stale: hsk1-app/${relative}`);
    else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);}
  }
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try{
    const args=process.argv.slice(2);assert.ok(args.length<=1&&(!args.length||['--check','--write'].includes(args[0])),'Usage: node hsk1-app/tools/catalog.mjs [--check|--write]');
    const result=buildCorpus();persistCorpus(PROJECT,result,args[0]!=='--write');
    console.log(JSON.stringify({ok:true,mode:args[0]==='--write'?'write':'check',baseline:BASELINE,counts:result.counts,artifacts:Object.keys(result.artifacts).length}));
  }catch(error){console.error('Corpus extraction failed: '+error.message);process.exitCode=1;}
}
