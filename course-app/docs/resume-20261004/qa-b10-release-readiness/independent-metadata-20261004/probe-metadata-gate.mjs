import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {assertReleaseReadiness, snapshotRuntimeSource, semanticLessonScopes, crossSiteScopes} from '../../../../tools/release-readiness.mjs';

const output = dirname(fileURLToPath(import.meta.url));
const app = resolve(output, '../../../..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const toolPath = join(app, 'tools/release-readiness.mjs');
const historicalPath = join(output, '../release-readiness.author-input.mjs');
const actualBytes = readFileSync(toolPath);
const historicalBytes = readFileSync(historicalPath);
const frozenToolSHA = '4db18945e5c731dd6fcee60de0dc3056f609edfae01ed5dfe76ac0439d38c248';
const frozenHistoricalSHA = 'ed4bc1b2c9b1004819dd2e8594ee2b91a58f7b54cf9a1ef13614d8860349c6b7';
assert.equal(sha(actualBytes), frozenToolSHA, 'probe must call the reviewed current source');
assert.equal(sha(historicalBytes), frozenHistoricalSHA, 'historical author input must retain its original bytes');
const oldLine = "if(scope.id==='legacy-questions'&&scope.items!==1360||['asset-metadata','svg'].includes(scope.id)&&scope.items!==412)fail('incomplete cross-site item count '+scope.id);";
const newLine = "if(scope.id==='legacy-questions'&&scope.items!==1360||scope.id==='svg'&&scope.items!==412)fail('incomplete cross-site item count '+scope.id);";
assert.equal(historicalBytes.toString().split(oldLine).length, 2, 'exactly one old cardinality guard');
assert.equal(actualBytes.toString(), historicalBytes.toString().replace(oldLine, newLine), 'the accepted patch is exactly one line');

// All documents, reviews and browser records below are explicitly synthetic.
// The fixture exercises certificate structure, not PDF or native acceptance.
const repo = mkdtempSync(join(tmpdir(), 'hsk-independent-metadata-gate-'));
const scopes = ['course-app/src'];
const git = args => execFileSync('git', args, {cwd:repo, encoding:'utf8', stdio:['pipe','pipe','pipe']}).trim();
const write = (path, bytes) => {
  mkdirSync(dirname(join(repo, path)), {recursive:true});
  writeFileSync(join(repo, path), bytes);
  return {path, sha256:sha(Buffer.from(bytes))};
};
const json = (path, value) => write(path, JSON.stringify(value));
const results = [];
let fixtureSummary;
try {
  git(['init', '--initial-branch=synthetic-review']);
  write('course-app/src/synthetic.ts', 'export const syntheticFixture = true;\n');
  git(['add', 'course-app/src/synthetic.ts']);
  git(['-c','user.name=Synthetic Independent Gate Probe','-c','user.email=synthetic@example.invalid','commit','-m','Isolated synthetic gate runtime fixture']);
  const testedSourceCommit = git(['rev-parse','HEAD']);
  const runtimeSourceSnapshot = snapshotRuntimeSource(repo, scopes);
  const binding = {testedSourceCommit, runtimeSourceSnapshotSHA256:runtimeSourceSnapshot.sha256};
  const evidence = write('course-app/docs/SYNTHETIC-EVIDENCE.txt', 'SYNTHETIC ONLY: no official page, translation, real browser, publication or deployment acceptance.\n');
  const sources = [1,2,3].map(level => {
    const pages = {1:148,2:162,3:212}[level];
    const pdf = write(`course-app/docs/SYNTHETIC-${level}.pdf`, `Not a real PDF. Synthetic identity ${level}.\n`);
    const pageLedger = json(`course-app/docs/pages-${level}.json`, {
      level, sourceSHA256:pdf.sha256,
      pages:Array.from({length:pages}, (_,i) => ({pdfPage:i+1, disposition:'applicable', status:'accepted', author:'synthetic author', independentReviewer:'synthetic reviewer', evidence:[evidence]}))
    });
    return {level, pages, sourceFile:pdf.path, sha256:pdf.sha256, pageLedger};
  });
  const lessons = [];
  for(const level of [1,2,3]) for(let number=1;number<=(level===3?18:15);number++) {
    const id = `synthetic-hsk${level}:lesson${number}`;
    const items = semanticLessonScopes.map(scope => ({id:`${id}/${scope}`, scope}));
    lessons.push({level, number, id, status:'accepted', unresolved:0, author:'synthetic author', independentReviewer:'synthetic reviewer',
      consumerScope:json(`course-app/docs/lesson-${level}-${number}.json`, {level, number, lessonId:id, items}),
      coverage:semanticLessonScopes.map(scope => ({id:scope, status:'accepted', acceptedItemIDs:items.filter(item=>item.scope===scope).map(item=>item.id), evidence:[evidence]}))});
  }
  const semanticAcceptance = json('course-app/docs/semantic.json', {...binding, lessons});
  const crossCoverage = crossSiteScopes.map(id => {
    const count = id==='legacy-questions'?1360:id==='svg'?412:id==='asset-metadata'?1981:1;
    const items = Array.from({length:count}, (_,i)=>({id:`synthetic/${id}/${i}`}));
    return {id, status:'accepted', unresolved:0, scopeDescription:`Synthetic ${id} fixture only`, items:count,
      acceptedItemIDs:items.map(item=>item.id), consumerScope:json(`course-app/docs/cross-${id}.json`, {scope:id, items}), evidence:[evidence]};
  });
  const cross = json('course-app/docs/cross-certificate.json', {...binding, author:'synthetic author', independentReviewer:'synthetic reviewer', coverage:crossCoverage});
  const buildInputManifest = json('course-app/docs/synthetic-build.json', {schemaVersion:1, ...binding, files:[{path:'index.html',bytes:9,sha256:sha(Buffer.from('synthetic'))}]});
  const native = json('course-app/docs/synthetic-native.json', {...binding, buildInputManifest,
    browsers:['chromium','webkit'].map(engine=>({engine,status:'passed',widths:[320,390,768,1440],evidence:[evidence]})),
    checks:['content-media-binding','language-layout','affected-full-release','nonempty-history-backup-legacy','student-build'].map(id=>({id,status:'passed',evidence:[evidence]}))});
  const baseGate = {schemaVersion:2,phase:'pre-publication',publicationApproved:false,deployed:false,testedSourceCommit,runtimeSourceSnapshot,lessons:48,textbookLessons:33,officialVI:{sources},semanticAcceptance,
    stages:Array.from({length:16},(_,i)=>({id:i+1,status:i===15?'awaiting-authorization':'passed',...(i<15?{evidence:[evidence]}:{}),...(i===13?{certificate:cross}:i===14?{certificate:native}:{})}))};
  fixtureSummary = {syntheticOnly:true, temporaryRepositoryRemoved:true, runtimeScopes:scopes, runtimeFiles:runtimeSourceSnapshot.files,
    officialSourcePageCounts:[148,162,212], semanticLessons:lessons.length, semanticScopesPerLesson:semanticLessonScopes.length,
    fullCrossScopeCounts:crossCoverage.map(({id,items})=>({id,items})), importedFunction:'assertReleaseReadiness', actualCurrentToolSHA256:frozenToolSHA};

  const baseCross = JSON.parse(readFileSync(join(repo,cross.path)));
  const baseLedgers = new Map(crossCoverage.map(scope=>[scope.id,JSON.parse(readFileSync(join(repo,scope.consumerScope.path)))]));
  function probe(id, scopeID, mutate, outcome, errorPattern) {
    const gate = structuredClone(baseGate);
    const certificate = structuredClone(baseCross);
    const scope = certificate.coverage.find(item=>item.id===scopeID);
    const ledger = structuredClone(baseLedgers.get(scopeID));
    mutate(scope,ledger);
    // Re-hash both evidence files after each mutation. A rejection must arise
    // from the actual content guard, not a stale SHA or unreadable reference.
    scope.consumerScope = json(`course-app/docs/probe-${id}-inventory.json`,ledger);
    gate.stages[13].certificate = json(`course-app/docs/probe-${id}-cross.json`,certificate);
    let returned = null;
    let error = null;
    try { returned = assertReleaseReadiness(gate,testedSourceCommit,{repo,scopes}); }
    catch(caught) { error = caught.message; }
    if(outcome==='accepted') {
      assert.equal(error,null,id);
      assert.equal(returned.publicationApproved,false,id);
      assert.equal(returned.deployed,false,id);
      assert.equal(returned.stage16,'awaiting-authorization',id);
    } else {
      assert.equal(returned,null,id);
      assert.match(error??'',errorPattern,id);
    }
    const record = {id,scope:scopeID,expected:outcome,actual:error?'rejected':'accepted',passed:true,
      declaredItemCount:scope.items,ledgerItemCount:Array.isArray(ledger.items)?ledger.items.length:null,
      acceptedIDCount:Array.isArray(scope.acceptedItemIDs)?scope.acceptedItemIDs.length:null,
      ledgerSHA256:scope.consumerScope.sha256,crossCertificateSHA256:gate.stages[13].certificate.sha256,
      mutationEvidenceRehashed:true,error,
      ...(returned?{publicationApproved:returned.publicationApproved,deployed:returned.deployed,stage16:returned.stage16}:{})};
    results.push(record);
    console.log(`${id}: ${record.actual}${error?' | '+error:''}`);
  }
  const cardinality = count => (scope,ledger)=> {
    ledger.items = Array.from({length:count},(_,i)=>({id:`synthetic/${scope.id}/${i}`}));
    scope.items = count;
    scope.acceptedItemIDs = ledger.items.map(item=>item.id);
  };
  for(const count of [1,411,412,413,1981]) probe(`metadata-complete-${count}`,'asset-metadata',cardinality(count),'accepted');
  const invalidInventory = /invalid cross-site consumer inventory asset-metadata/;
  const invalidAcceptance = /incomplete or duplicate cross-site asset-metadata accepted consumer IDs/;
  probe('metadata-missing-accepted-id','asset-metadata',scope=>scope.acceptedItemIDs.pop(),'rejected',invalidAcceptance);
  probe('metadata-extra-accepted-id','asset-metadata',scope=>scope.acceptedItemIDs.push('synthetic/extra'),'rejected',invalidAcceptance);
  probe('metadata-duplicate-accepted-id','asset-metadata',scope=>scope.acceptedItemIDs[1980]=scope.acceptedItemIDs[0],'rejected',invalidAcceptance);
  probe('metadata-same-count-wrong-accepted-id','asset-metadata',scope=>scope.acceptedItemIDs[1980]='synthetic/wrong','rejected',invalidAcceptance);
  probe('metadata-missing-inventory-item','asset-metadata',(scope,ledger)=>ledger.items.pop(),'rejected',invalidInventory);
  probe('metadata-extra-inventory-item','asset-metadata',(scope,ledger)=>ledger.items.push({id:'synthetic/extra'}),'rejected',invalidInventory);
  probe('metadata-duplicate-inventory-item','asset-metadata',(scope,ledger)=>ledger.items[1980]={...ledger.items[0]},'rejected',invalidInventory);
  probe('metadata-declared-count-too-small','asset-metadata',scope=>scope.items--,'rejected',invalidInventory);
  probe('metadata-declared-count-too-large','asset-metadata',scope=>scope.items++,'rejected',invalidInventory);
  probe('metadata-empty-consistent-ledger','asset-metadata',cardinality(0),'rejected',/empty cross-site consumer scope asset-metadata/);
  probe('metadata-empty-item-id','asset-metadata',(scope,ledger)=>ledger.items[1980].id=' ','rejected',invalidInventory);
  probe('metadata-wrong-inventory-scope','asset-metadata',(scope,ledger)=>ledger.scope='svg','rejected',invalidInventory);
  probe('metadata-non-array-ledger','asset-metadata',(scope,ledger)=>ledger.items={length:1981},'rejected',invalidInventory);
  probe('metadata-non-array-accepted-id','asset-metadata',scope=>scope.acceptedItemIDs={length:1981},'rejected',invalidAcceptance);
  for(const [id,count] of [['legacy-questions',1360],['svg',412]]) {
    probe(`${id}-complete-required-count`,id,cardinality(count),'accepted');
    for(const delta of [-1,1]) probe(`${id}-coherent-wrong-count-${count+delta}`,id,cardinality(count+delta),'rejected',new RegExp('incomplete cross-site item count '+id));
    probe(`${id}-duplicate-accepted-id`,id,scope=>scope.acceptedItemIDs[count-1]=scope.acceptedItemIDs[0],'rejected',new RegExp('incomplete or duplicate cross-site '+id+' accepted consumer IDs'));
    probe(`${id}-missing-accepted-id`,id,scope=>scope.acceptedItemIDs.pop(),'rejected',new RegExp('incomplete or duplicate cross-site '+id+' accepted consumer IDs'));
  }
  assert.equal(sha(readFileSync(toolPath)),frozenToolSHA,'reviewed tool changed during probes');
  assert.equal(sha(readFileSync(historicalPath)),frozenHistoricalSHA,'author evidence changed during probes');
} finally {
  rmSync(repo,{recursive:true,force:true});
}
const report = {schemaVersion:1,reviewer:'remaining_media_audit',createdAt:new Date().toISOString(),scope:'Independent bounded metadata-cardinality guard repair, not real publication readiness',
  syntheticOnly:true, actualGateInvocation:true, nativeTestsRun:0, officialSemanticComparisonsRun:0,
  currentToolSHA256:frozenToolSHA,historicalAuthorToolSHA256:frozenHistoricalSHA,
  boundedPatch:{oneLineOnly:true,removedRequirement:'asset-metadata must have exactly 412 items',retainedRequirements:['asset-metadata nonempty ledger','unique nonempty ledger IDs','declared item count equals ledger count','accepted item IDs exactly equal ledger IDs','legacy-questions exactly 1360','svg exactly 412','all other source, evidence, semantic and native structure guards unchanged']},
  fixture:fixtureSummary,counts:{probes:results.length,accepted:results.filter(r=>r.actual==='accepted').length,rejected:results.filter(r=>r.actual==='rejected').length,passed:results.filter(r=>r.passed).length,failed:0},results,
  limits:['Synthetic accepted metadata cardinality is not certification that a real ledger enumerates every current website consumer.','No official translations, page review, actual native certificate, active manifest, frozen release or deployment are approved by these probes.','The original author 200-test report and root targeted17 log are historical references; these direct probes executed current SHA4db189 source.']};
writeFileSync(join(output,'probe-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(`TOTAL ${results.length}: ${report.counts.accepted} accepted, ${report.counts.rejected} correctly rejected.`);
