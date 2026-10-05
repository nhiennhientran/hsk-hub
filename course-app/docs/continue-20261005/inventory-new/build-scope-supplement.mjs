import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {parseSync} from '../../../node_modules/rolldown/dist/utils-index.mjs';

// Execute the actual bounded B10 crawler declarations, without replaying its
// entire inventory. This supplement adds separately named producer identities.
const output = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(output, 'input-snapshot');
const source = fs.readFileSync(path.join(output, 'build-inventory.mjs'), 'utf8');
const ast = parseSync('inventory.js', source, {lang: 'js'});
if (ast.errors.length) throw Error('Cannot parse actual copied inventory builder');
const declarations = new Set(['sha', 'files', 'records', 'failures', 'legacyLayers', 'viet', 'asciiViet', 'chinese', 'viKey', 'likelyVi', 'ptr']);
const helpers = new Set(['load', 'sourceFiles', 'location', 'propertyName', 'staticString', 'zhSibling', 'walkAST', 'parseCode', 'scanCode']);
const nodes = ast.program.body.filter(node =>
  node.type === 'FunctionDeclaration' && helpers.has(node.id?.name) ||
  node.type === 'VariableDeclaration' && node.declarations.some(d => declarations.has(d.id?.name) || helpers.has(d.id?.name)));
const sandbox = {fs, path, crypto, zlib, Buffer, parseSync, root};
vm.createContext(sandbox);
vm.runInContext(nodes.map(n => source.slice(n.start, n.end)).join('\n') +
  '\nglobalThis.crawl = scanCode; globalThis.paths = sourceFiles; globalThis.rows = records; globalThis.inputs = files; globalThis.problems = failures; globalThis.viCandidate = likelyVi;', sandbox);

const policy = {component: 'retained-nested-assets-supplement', state: 'retained-route-runtime-candidate',
  service: 'distinct producer under new-hsk1/assets; not the primary unified engine',
  consumers: ['retained old new-hsk1 auxiliary routes; final route retention must be verified']};
const aliases = [];
for (const file of sandbox.paths('new-hsk1/assets')) {
  // Third party libraries and encoded style payload have no source-book copy
  // authority. Pin their bytes and exclusions explicitly in the scope report.
  if (/(?:pako\.min|hanzi-writer\.min|style-packed)\.js$/.test(file)) {
    aliases.push({file, classification: 'excluded-third-party-or-packed-style-runtime',
      sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')});
    continue;
  }
  sandbox.crawl(file, policy);
  const counterpart = file.replace(/^new-hsk1\//, '');
  const actual = fs.readFileSync(path.join(root, file));
  const equivalent = fs.existsSync(path.join(root, counterpart)) && actual.equals(fs.readFileSync(path.join(root, counterpart)));
  aliases.push({file, counterpart, bytes: actual.length,
    sha256: crypto.createHash('sha256').update(actual).digest('hex'),
    counterpartIsByteIdentical: equivalent,
    classification: equivalent ? 'distinct-retained-producer-with-identical-source-bytes' : 'distinct-retained-producer-with-different-source-bytes'});
}
sandbox.crawl('new-hsk1/index.html', {...policy, component: 'retained-entry-supplement'});

// The old HTML pass includes visible text and accessibility attributes but
// excludes meta description/keywords. Add these to all declared HTML inputs
// as metadata, preserving exact source spelling and independent identity.
const originalInputs = JSON.parse(fs.readFileSync(path.join(output, 'runtime-files.json'), 'utf8'));
const htmlFiles = [...new Set([...originalInputs.filter(x => x.format === 'html').map(x => x.file), 'new-hsk1/index.html'])];
const metadataRows = [];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
for (const file of htmlFiles) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for (const m of text.matchAll(/<meta\b[^>]*>/gi)) {
    const name = m[0].match(/\bname\s*=\s*(["'])(.*?)\1/i)?.[2];
    const content = m[0].match(/\bcontent\s*=\s*(["'])(.*?)\1/is)?.[2];
    if (!name || !/^(description|keywords)$/i.test(name) || !sandbox.viCandidate(content)) continue;
    metadataRows.push({recordId: hash(file + '\0meta\0' + m.index).slice(0,24),
      semanticKey: `html-meta-supplement:${file}:${name}:${m.index}`, component: 'html-meta-supplement',
      itemId: name, file, range: {start: m.index, end: m.index + m[0].length}, value: content,
      sourceKind: 'html-meta-content', visibility: 'browser-search-metadata-not-lesson-body',
      confidence: 'language-detection-candidate', learningFieldOccurrence: false,
      sourceRelation: 'editorial-site-metadata', officialAuditStatus: 'pending-website-adoption',
      consumers: ['HTML metadata; exposure depends on browser and search service'],
      chineseContext: null, frozen: false});
  }
}
const extra = JSON.parse(JSON.stringify(sandbox.rows));
for (const row of extra) Object.assign(row, {officialAuditStatus: 'pending-website-adoption',
  learningFieldOccurrence: false, sourceRelation: 'retained-route-editorial-candidate',
  uploadedBookMapping: 'unmapped; must not infer same lesson ordinal as current 48 lessons'});
const rows = [...extra, ...metadataRows];
const baseline = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(output, 'inventory.json.gz'))));
const combined = [...baseline, ...rows];
if (new Set(combined.map(x => x.recordId)).size !== combined.length ||
    new Set(combined.map(x => x.semanticKey)).size !== combined.length) throw Error('Supplement identity collision');
if (sandbox.problems.length) throw Error('Supplement parse/decode failures: ' + JSON.stringify(sandbox.problems));
const cssInputs = [];
for (const file of fs.readdirSync(path.join(root,'new-hsk1/assets')).filter(x => x.endsWith('.css')).map(x => 'new-hsk1/assets/' + x)) {
  const text = fs.readFileSync(path.join(root,file),'utf8');
  cssInputs.push({file, sha256: hash(text), bytes: Buffer.byteLength(text),
    vietnamesePseudoContentCandidate: [...text.matchAll(/(?:^|[;{])\s*content\s*:\s*(["'])(.*?)\1/g)].filter(m => sandbox.viCandidate(m[2])).length});
}
if (cssInputs.some(x => x.vietnamesePseudoContentCandidate)) throw Error('New CSS VI pseudo content requires explicit supplemental extraction');
const report = {schemaVersion: 1, status: 'author-scoped-supplement-awaiting-independent-review',
  extractionBuilderSHA256: hash(source), baselineCandidates: baseline.length,
  supplementalCandidates: rows.length, retainedProducerCandidates: extra.length,
  htmlMetadataCandidates: metadataRows.length, expandedCandidates: combined.length,
  inputs: JSON.parse(JSON.stringify(sandbox.inputs)), aliases, cssInputs,
  parseOrDecodeFailures: JSON.parse(JSON.stringify(sandbox.problems)),
  duplicateRecordIDs: combined.length-new Set(combined.map(x=>x.recordId)).size,
  duplicateSemanticKeys: combined.length-new Set(combined.map(x=>x.semanticKey)).size,
  limits: ['Retained producer reachability is not certified by extraction.',
    'The primary 48-lesson engine and legacy retained routes have separate mapping scopes.',
    'No submitted learner values or past browser storage records are accessed.',
    'No textbook equivalence or native browser acceptance is claimed.']};
for (const [name,value] of Object.entries({'scope-supplement.json':report})) fs.writeFileSync(path.join(output,name),JSON.stringify(value,null,2)+'\n');
fs.writeFileSync(path.join(output,'scope-supplement-inventory.json.gz'),zlib.gzipSync(JSON.stringify(rows)+'\n',{level:9}));
fs.writeFileSync(path.join(output,'inventory-expanded.json.gz'),zlib.gzipSync(JSON.stringify(combined)+'\n',{level:9}));
console.log(JSON.stringify({baselineCandidates:baseline.length,supplementalCandidates:rows.length,expandedCandidates:combined.length,parseFailures:sandbox.problems.length}));
