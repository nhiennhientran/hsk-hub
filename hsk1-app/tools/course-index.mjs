import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
export function buildCourseIndex() {
  const files = ['textbook.json', 'stage2-bank.json', 'stage3-catalog.json'];
  const raw = files.map(name => fs.readFileSync(root + 'content/' + name));
  const [textbook, homework, catalog] = raw.map(value => JSON.parse(value));
  assert.equal(textbook.lessons.length, 15);
  return {
    schemaVersion: 1,
    sources: Object.fromEntries(files.map((name, index) => [name, createHash('sha256').update(raw[index]).digest('hex')])),
    lessons: textbook.lessons.map(lesson => {
      const bank = homework.lessons.find(row => row.id === lesson.id);
      assert.ok(bank, `Missing homework lesson ${lesson.id}`);
      return { id: lesson.id, title: lesson.title, titleVi: lesson.vn_title,
        vocabularyCount: lesson.vocab.length, scenesCount: lesson.scenes.length,
        grammarCount: lesson.grammar.length, phoneticsCount: lesson.phonetics.length,
        homeworkCount: bank.choice.length + bank.sort.length + bank.translation.length,
        listeningCount: catalog.listening.filter(row => row.lesson === lesson.id).length,
        senseCount: catalog.vocabulary.filter(row => row.lesson === lesson.id).length };
    }),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = root + 'content/course-index.json';
  const expected = JSON.stringify(buildCourseIndex(), null, 2) + '\n';
  if (process.argv.includes('--write')) fs.writeFileSync(target, expected);
  else assert.equal(fs.readFileSync(target, 'utf8'), expected, 'Course index is stale; regenerate after reviewing content changes.');
  console.log(JSON.stringify({ courseIndex: 'PASS', lessons: 15, mode: process.argv.includes('--write') ? 'write' : 'check' }));
}
