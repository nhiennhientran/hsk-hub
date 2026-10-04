import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {parseSync} from '../../../node_modules/rolldown/dist/utils-index.mjs';

// Execute the actual declared crawler and its dependencies, without running
// the complete inventory generator or copying its traversal implementation.
const base = new URL('./', import.meta.url);
const declarations = new Set(['sha', 'files', 'records', 'failures', 'legacyLayers', 'viet', 'asciiViet', 'chinese', 'viKey', 'likelyVi', 'ptr']);
const helpers = new Set(['location', 'propertyName', 'staticString', 'zhSibling', 'walkAST']);
function extract(file, text, virtual = '') {
  const source = fs.readFileSync(file, 'utf8');
  const parsed = parseSync('inventory.js', source, {lang: 'js'});
  assert.equal(parsed.errors.length, 0);
  const nodes = parsed.program.body.filter(node =>
    node.type === 'FunctionDeclaration' && helpers.has(node.id?.name) ||
    node.type === 'VariableDeclaration' && node.declarations.some(d => declarations.has(d.id?.name)));
  const sandbox = {crypto};
  vm.createContext(sandbox);
  vm.runInContext(nodes.map(n => source.slice(n.start, n.end)).join('\n') + '\nglobalThis.scan = walkAST; globalThis.rows = records;', sandbox);
  const ast = parseSync('fixture.ts', text, {lang: 'ts'});
  assert.equal(ast.errors.length, 0);
  sandbox.scan(ast.program, [], 'fixture.ts', text, {component: 'actual-crawler-probe', state: 'active', consumers: ['probe']}, virtual);
  return JSON.parse(JSON.stringify(sandbox.rows));
}

const oldFile = new URL('../vi-inventory/build-inventory.mjs', base);
const newFile = new URL('./build-inventory.mjs', base);
const repo = new URL('../../../../', base);
const domPath = new URL('course-app/src/dom.ts', repo);
const actualDom = fs.readFileSync(domPath, 'utf8');
const before = extract(oldFile, actualDom);
const after = extract(newFile, actualDom);
assert.equal(before.length, 0, 'historical crawler actually misses this module');
assert.ok(after.some(r => r.value.includes('SGK trang') && r.sourceKind === 'dynamic-template'));
assert.ok(after.some(r => r.value.includes('Nội dung bổ trợ')));
const fixture = `const truth = {zh: '错', vi: 'Sai'};
const nested = {copy: {zh: '例子', vi: 'Ví dụ'}};
class View { render() { return {zh: '老师', vi: 'Cô giáo'}; } }
const dynamic = {vi: \`Trang \${ok ? 'đã lưu' : 'chưa lưu'}\`};
const plain = 'Bài học';`;
const oldRows = extract(oldFile, fixture);
const newRows = extract(newFile, fixture);
for (const phrase of ['Sai', 'Ví dụ', 'Cô giáo', 'đã lưu', 'chưa lưu']) {
  assert.equal(oldRows.filter(r => r.value === phrase).length, 0, phrase);
  assert.equal(newRows.filter(r => r.value === phrase).length, 1, phrase);
}
assert.equal(newRows.filter(r => r.value === 'Bài học').length, 1);
assert.equal(new Set(newRows.map(r => r.recordId)).size, newRows.length);
assert.equal(new Set(newRows.map(r => r.semanticKey)).size, newRows.length);
for (const row of newRows) assert.ok(row.range.end > row.range.start);
const summary = {
  status: 'passed-bounded-actual-AST-coverage-repair',
  historicalBuilderSHA256: crypto.createHash('sha256').update(fs.readFileSync(oldFile)).digest('hex'),
  revisedBuilderSHA256: crypto.createHash('sha256').update(fs.readFileSync(newFile)).digest('hex'),
  actualDomSHA256: crypto.createHash('sha256').update(actualDom).digest('hex'),
  actualDomBeforeRows: before.length,
  actualDomAfterRows: after.length,
  fixtureBeforeRows: oldRows.length,
  fixtureAfterRows: newRows.length,
  completeNewSourceInventoryExecuted: false,
  formalVietnameseSemanticAuditPerformed: false
};
console.log(JSON.stringify(summary, null, 2));
