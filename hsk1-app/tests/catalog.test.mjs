import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {BASELINE,EXPECTED,buildCorpus,persistCorpus,scriptOrder,staticLiteral,mapVocabulary,validateReferences,verifyClip,fingerprint,sha256} from '../tools/catalog.mjs';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const result=buildCorpus(project);
const textbook=result.artifacts['content/textbook.json'];
const stage2=result.artifacts['content/stage2-bank.json'];
const stage3=result.artifacts['content/stage3-catalog.json'];
const media=result.artifacts['content/media-references.json'];
const review=result.artifacts['review/corpus-validation.json'];
const inventory=result.artifacts['review/corpus-inventory.json'];
const clone=value=>JSON.parse(JSON.stringify(value));
const withoutFingerprint=value=>{const {fingerprint:ignored,...data}=value;return data;};
const index=()=>({clips:Object.fromEntries(media.clips.map(v=>[v.id,v]))});

test('the frozen corpus is reproducible, has all required counts and no copied audio payload',()=>{
  assert.deepEqual(result.counts,EXPECTED);
  assert.equal(textbook.baseline,BASELINE);
  assert.equal(review.status,'PASS');
  assert.equal(review.humanEarReviewPerformed,false);
  assert.equal(review.visualPDFReviewPerformed,false);
  assert.equal(textbook.lessons.reduce((n,l)=>n+l.phonetics.length,0),3);
  assert.equal(textbook.lessons.filter(l=>l.hanzi).length,15);
  assert.equal(inventory.sources.filter(s=>s.path.endsWith('.mp3')).length,93);
  assert.ok(inventory.sources.every(s=>/^[a-f0-9]{64}$/.test(s.sha256)&&/^[a-f0-9]{40}$/.test(s.gitBlob)));
  assert.ok(inventory.sources.every(s=>!s.path.startsWith('hsk1-app/')));
  for(const artifact of Object.values(result.artifacts))assert.ok(!JSON.stringify(artifact).includes('data:audio/'));
  persistCorpus(project,result,true);
});

test('HTML order includes every mandatory layer and rejects unknown or missing scripts',()=>{
  const html=fs.readFileSync(path.join(project,'new-hsk1/hsk1/lesson.html'),'utf8');
  const order=scriptOrder(html),position=name=>order.find(s=>s.name===name).order;
  assert.ok(position('textbook-data-corrections.js')<position('textbook-audio-segments.js'));
  assert.ok(position('textbook-audio-segments.js')<position('pos-tips.js'));
  assert.ok(position('pos-tips.js')<position('textbook-integration-corrections.js'));
  assert.ok(position('stage3/catalog.js')<position('textbook-final-corrections.js'));
  assert.throws(()=>scriptOrder(html.replace(/<script src="new-enrichment\.js[^>]*>\s*<\/script>/,'')),/Required content script/);
  assert.throws(()=>scriptOrder(html+'<script src="unreviewed-patch.js"></script>'),/Unclassified lesson script/);
  assert.throws(()=>scriptOrder(html+'<script>window.extra=1</script>'),/Unclassified inline script/);
});

test('all final textbook corrections survive extraction, including speaker and timing repairs',()=>{
  const lesson=id=>textbook.lessons.find(l=>l.id===id);
  assert.equal(lesson(3).scenes[1].lines.length,4);
  assert.equal(lesson(3).scenes[1].lines[0].zh,'这是谁？');
  assert.equal(lesson(10).scenes[0].lines[0].zh,'请问，有杯子吗？');
  assert.equal(lesson(11).scenes[2].lines.length,6);
  assert.equal(lesson(11).scenes[2].lines[4].zh,'去超市。');
  assert.equal(lesson(11).scenes[2].lines[4].s,'刘明');
  assert.equal(lesson(11).scenes[2].lines[5].s,'刘小雪');
  assert.equal(lesson(12).scenes[0].lines[2].zh,'雨大吗？');
  assert.equal(lesson(13).scenes[2].lines[5].zh,'请给我一杯茶吧。');
  assert.deepEqual(media.textbookSegments.text['14-3'],[[2.95,7.45],[7.6,9.55],[9.6,12.15],[12.2,22.15],[22.15,25.427]]);
  assert.equal(media.textbookSegments.crossLessonReuse['6']?.['西安'],undefined);
  const finalChanges=result.artifacts['review/corpus-changes.json'].changes.find(c=>c.script.endsWith('/textbook-final-corrections.js'));
  assert.ok(finalChanges.changedPaths.some(p=>p.startsWith('/segments/text/14-3/')));
  assert.notEqual(finalChanges.before,finalChanges.after);
});

test('sense mapping preserves polysemy and detects semantic or same-lesson mapping drift',()=>{
  const mappings=mapVocabulary(textbook.lessons,stage3.vocabulary);
  assert.equal(mappings.length,344);
  assert.equal(new Set(mappings.map(r=>r.textbookId)).size,342);
  for(const [lesson,word] of [[12,'天'],[14,'上']]){
    const senses=mappings.filter(r=>r.lesson===lesson&&r.zh===word);
    assert.equal(senses.length,2);
    assert.equal(new Set(senses.map(s=>s.textbookId)).size,1);
    assert.equal(new Set(senses.map(s=>s.senseId)).size,2);
  }
  const changed=clone(stage3.vocabulary);changed[0].vi='unreviewed replacement meaning';
  assert.throws(()=>mapVocabulary(textbook.lessons,changed),/Meaning drift/);
  changed[0]=clone(stage3.vocabulary[0]);changed[0].lesson=15;
  assert.throws(()=>mapVocabulary(textbook.lessons,changed),/no same-lesson textbook word/);
});

test('media references reject missing originals, orphan clips and unsupported invented word audio',()=>{
  assert.doesNotThrow(()=>validateReferences(stage3,stage2.lessons,index(),media.originalTracks,media.textbookSegments));
  const missing=media.originalTracks.filter(t=>t.id!==stage3.listening[0].audio.track);
  assert.throws(()=>validateReferences(stage3,stage2.lessons,index(),missing,media.textbookSegments),/Missing original track/);
  const orphan=index();orphan.clips.extra={lesson:1};
  assert.throws(()=>validateReferences(stage3,stage2.lessons,orphan,media.originalTracks,media.textbookSegments),/Orphan clip/);
  const absent=clone(stage3),row=absent.vocabulary.find(v=>!v.audio);
  row.audio={track:'4-2',start:0,end:1};
  assert.throws(()=>validateReferences(absent,stage2.lessons,index(),media.originalTracks,media.textbookSegments),/Missing clip/);
  const pages=clone(stage3);pages.listening[0].source.pdfPages[0]++;
  assert.throws(()=>validateReferences(pages,stage2.lessons,index(),media.originalTracks,media.textbookSegments),/Page reference drift/);
  const answer=clone(stage3);answer.listening[0].answer=4;
  assert.throws(()=>validateReferences(answer,stage2.lessons,index(),media.originalTracks,media.textbookSegments),/Listening answer/);
});

test('clip integrity requires actual bytes, expected SHA256 and strict base64',()=>{
  const bytes=Buffer.from('audio integrity fixture'),uri='data:audio/mpeg;base64,'+bytes.toString('base64');
  const entry={bytes:bytes.length,sha256:sha256(bytes),duration:1,lesson:1};
  assert.equal(verifyClip('fixture',uri,entry).sha256,entry.sha256);
  assert.throws(()=>verifyClip('fixture',uri,{...entry,sha256:'0'.repeat(64)}),/Clip SHA256/);
  assert.throws(()=>verifyClip('fixture',uri,{...entry,bytes:bytes.length+1}),/Clip byte count/);
  assert.throws(()=>verifyClip('fixture',uri+'!',entry),/Invalid media URI/);
});

test('record and artifact fingerprints bind IDs, sources and exported contents',()=>{
  const tasks=[...stage2.lessons.flatMap(l=>['choice','sort','translation'].flatMap(k=>l[k])),...stage3.listening];
  assert.equal(tasks.length,300);
  assert.equal(inventory.taskRecords.filter(t=>t.kind==='listening').length,75);
  for(const item of [...tasks,...stage3.vocabulary])assert.equal(item.fingerprint,fingerprint(withoutFingerprint(item)),item.id);
  for(const item of inventory.taskRecords)assert.equal(item.fingerprint,tasks.find(q=>q.id===item.id).fingerprint,item.id);
  for(const item of inventory.artifacts){
    const artifact=result.artifacts[item.path.replace('hsk1-app/','')];
    const bytes=Buffer.from(JSON.stringify(artifact,null,2)+'\n');
    assert.equal(bytes.length,item.bytes,item.path);assert.equal(sha256(bytes),item.sha256,item.path);
  }
  assert.equal(inventory.sortAcceptedExpressions.length,95);
  assert.ok(inventory.sortAcceptedExpressions.every(s=>s.order.length&&s.fingerprint===fingerprint(s.answer)));
});

test('static content extraction handles brackets inside strings and fails on unsupported input',()=>{
  assert.deepEqual(staticLiteral("const fixture=[{title:'a ] } b',content:'c \\' d'},/* ] */{title:'x'}];",'const fixture='),[{title:'a ] } b',content:"c ' d"},{title:'x'}]);
  assert.throws(()=>staticLiteral('const fixture=[1;','const fixture='),/Unterminated static literal/);
  assert.throws(()=>staticLiteral('const fixture=[`computed`];','const fixture='),/Template literal is unsupported/);
  assert.throws(()=>staticLiteral('const fixture=[];const fixture=[];','const fixture='),/must occur once/);
});

test('check mode fails on stale or absent output and never repairs it implicitly',()=>{
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'hsk1-catalog-test-'));
  try{
    const fixture={artifacts:{'content/tiny.json':{baseline:BASELINE,required:true}}};
    assert.throws(()=>persistCorpus(temporary,fixture,true),/ENOENT/);
    persistCorpus(temporary,fixture,false);
    const target=path.join(temporary,'hsk1-app/content/tiny.json');
    fs.writeFileSync(target,'{}\n');
    assert.throws(()=>persistCorpus(temporary,fixture,true),/Generated artifact is stale/);
    assert.equal(fs.readFileSync(target,'utf8'),'{}\n');
  }finally{fs.rmSync(temporary,{recursive:true,force:true});}
});
