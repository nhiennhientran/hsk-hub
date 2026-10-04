import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root=new URL('../../',import.meta.url);
const read=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url)));
const report=read('../docs/hsk3-appendix-stars/crosswalk.json');
const proposal=read('../docs/resume-20261004/hsk23-source-closure/official-vi-metadata-proposal.json');
const load=n=>read(`../content/hsk3/lesson-${String(n).padStart(2,'0')}.json`);
const originalWord=word=>{
  // Remove only the separately verified addition; every other key stays in the
  // historical complete-object assertion, including old appendix provenance.
  const {additionalSourceEvidence,...original}=word;
  return original;
};

test('HSK3 glossary has all22 starred heads and23 stable word-sense records',()=>{
  const words=Array.from({length:18},(_,i)=>load(i+1).vocabulary).flat();
  const marked=words.filter(word=>word.supplementarySyllabus);
  assert.equal(marked.length,23);
  assert.deepEqual(marked.map(word=>word.id).sort(),report.allStarredSenseIds);
  assert.deepEqual([...new Set(marked.map(word=>word.zh))].sort(),report.allStarredHeadwords);
  assert.equal(new Set(marked.map(word=>word.zh)).size,22);
  for(const edit of report.edits){
    const word=words.find(word=>word.id===edit.id);
    assert.ok(word,edit.id);
    assert.equal(word.zh,edit.word);
    assert.equal(word.supplementarySyllabus,true);
    assert.deepEqual(word.appendixSource,edit.source);
  }
  assert.equal(report.edits.length,16);
  assert.equal(marked.filter(word=>word.zh==='冰').length,2);
});

test('HSK3 star patch does not alter any existing lesson values',()=>{
  for(const n of new Set(report.edits.map(edit=>edit.lesson))){
    const current=load(n);
    const path=`course-app/content/hsk3/lesson-${String(n).padStart(2,'0')}.json`;
    const old=JSON.parse(execFileSync('git',['show',`29b96cdb5cfe34a61fc3821fec5b47abb136e84e:${path}`],{cwd:root,encoding:'utf8'}));
    current.vocabulary=current.vocabulary.map(originalWord);
    for(const edit of report.edits.filter(edit=>edit.lesson===n)){
      const word=current.vocabulary.find(word=>word.id===edit.id);
      const previous=old.vocabulary.find(word=>word.id===edit.id);
      assert.equal(previous.supplementarySyllabus,undefined);
      assert.equal(previous.appendixSource,undefined);
      delete word.supplementarySyllabus;
      delete word.appendixSource;
    }
    assert.deepEqual(current.vocabulary,old.vocabulary);
    assert.deepEqual(current.homework,old.homework);
    assert.deepEqual(current.texts,old.texts);
  }
});

test('all18 additional official-source registries and523 word anchors retain every complete old word and source',()=>{
  assert.equal(proposal.lessons.length,18);
  assert.equal(new Set(proposal.lessons.map(plan=>plan.jsonFile)).size,18);
  assert.equal(proposal.sourceSha256,'7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951');
  assert.equal(proposal.oldSourceSha256,'33a9c743f73f634f97a9864aa0423ac4e3568b3febbf57b63e983b5dcc0932f2');
  const ids=new Set();
  let words=0,oldAppendices=0,oldNumberPos=0,oldNumberPosSources=0,printedPOS=0;
  for(const plan of proposal.lessons){
    const lesson=read(`../${plan.jsonFile}`);
    assert.equal(lesson.id,plan.lessonId);
    assert.deepEqual(plan.registryOperation.expected,{exists:false});
    assert.deepEqual(lesson.additionalSourceRevisions,plan.registryOperation.value);
    assert.equal(lesson.additionalSourceRevisions.length,1);
    const registry=lesson.additionalSourceRevisions[0];
    assert.equal(registry.id,proposal.sourceRevisionId);
    assert.equal(registry.sha256,proposal.sourceSha256);
    assert.equal(registry.originalChinesePdfSha256,proposal.oldSourceSha256);
    assert.equal(registry.sameBytesAsOriginalChineseSource,false);
    assert.equal(registry.doesNotRevalidateOriginalEnglishAppendix,true);
    assert.equal(registry.sourceAudit.independentStatus,'accepted-source-evidence');
    assert.equal(registry.sourceAudit.vietnameseGlossAlignment,'deferred-to-Phase-B');
    assert.equal(lesson.vocabulary.length,plan.wordOperations.length);
    for(const [index,operation] of plan.wordOperations.entries()){
      const word=lesson.vocabulary[index];
      assert.equal(word.id,operation.wordId);
      assert.ok(!ids.has(word.id),word.id);
      ids.add(word.id);
      assert.deepEqual(operation.expected,{exists:false});
      assert.deepEqual(originalWord(word),operation.expectedWord,word.id);
      assert.deepEqual(word.additionalSourceEvidence,operation.value,word.id);
      assert.equal(word.additionalSourceEvidence.length,1);
      const evidence=word.additionalSourceEvidence[0];
      assert.equal(evidence.sourceRevisionId,registry.id);
      assert.equal(evidence.vocabulary.headword,word.zh);
      assert.equal(evidence.glossary.headword,word.zh);
      assert.ok(evidence.glossary.lessonNumbers.includes(lesson.number));
      for(const source of [evidence.vocabulary.source,evidence.glossary.source]){
        assert.equal(source.provenance,'textbook');
        assert.equal(source.pdfPage,source.printedPage+registry.bodyPrintedPageOffset);
      }
      if(evidence.vocabulary.posPrinted)printedPOS++;
      else{
        assert.equal(evidence.vocabulary.printedPOSRaw,null);
        assert.deepEqual(evidence.vocabulary.posCategoriesZh,[]);
      }
      oldAppendices+=Object.hasOwn(word,'appendixSource');
      oldNumberPos+=Object.hasOwn(word,'appendixMetadata');
      oldNumberPosSources+=Object.hasOwn(word.appendixMetadata??{},'source');
      words++;
    }
  }
  assert.equal(words,523);
  assert.equal(ids.size,523);
  assert.equal(oldAppendices,217);
  assert.equal(oldNumberPos,174);
  assert.equal(oldNumberPosSources,0);
  assert.equal(printedPOS,508);
  const canonical=fs.readFileSync(new URL('../content/hsk3-lexicon.json',import.meta.url));
  assert.equal(createHash('sha256').update(canonical).digest('hex'),proposal.preservationGuards.canonicalLexiconSha256);
});
