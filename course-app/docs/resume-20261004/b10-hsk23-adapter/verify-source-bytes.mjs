import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const repo=fileURLToPath(new URL('../../../../',import.meta.url)),course=resolve(repo,'course-app');
const baseline='835e5bd41045655cc2724ba2ba59235064ff92cf';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sources=[...['hsk2','hsk3'].flatMap(level=>readdirSync(resolve(course,'content',level)).filter(f=>/^lesson-\d{2}\.json$/.test(f)).map(f=>`course-app/content/${level}/${f}`)),
 'course-app/content/hsk2-lexicon.json','course-app/content/hsk3-lexicon.json','course-app/content/course-index.json'].sort();
assert.equal(sources.length,36);
const dist=resolve(course,'.repro-output/b10-hsk23-adapter/dist'),assets=resolve(dist,'assets'),compiled=[];
for(const name of readdirSync(assets).sort()){
 if(!/^(?:lesson-\d{2}|hsk[23]-lexicon|course-index)-.+\.js$/.test(name))continue;
 const file=resolve(assets,name),value=(await import(pathToFileURL(file).href)).default;
 if(typeof value==='string')compiled.push({file:relative(repo,file),rawText:value,sourceSHA256:sha(value),compiledSHA256:sha(readFileSync(file))});
}
const rows=sources.map(file=>{
 const bytes=readFileSync(resolve(repo,file)),gitBytes=execFileSync('git',['show',`${baseline}:${file}`],{cwd:repo,maxBuffer:20*1024*1024});
 assert.deepEqual(bytes,gitBytes,`Raw textbook/lexicon/index file changed: ${file}`);
 const matches=compiled.filter(c=>c.sourceSHA256===sha(bytes));assert.equal(matches.length,1,`One exact compiled raw source required: ${file}`);
 assert.equal(matches[0].rawText,bytes.toString('utf8'));
 return {file,bytes:bytes.length,sha256:sha(bytes),baselineCommit:baseline,baselineBytesEqual:true,compiledFile:matches[0].file,compiledSHA256:matches[0].compiledSHA256,compiledDecodedBytesEqual:true};
});
const registryPath='course-app/content/official-vi-registry.json',registryBytes=readFileSync(resolve(repo,registryPath));
assert.deepEqual(JSON.parse(registryBytes),{schemaVersion:1,courses:{hsk2:null,hsk3:null}});
const ownSourcePaths=['course-app/src/official-vi-revisions.ts','course-app/src/content.ts','course-app/src/listening-view.ts','course-app/src/main.ts','course-app/tests/official-vi-revisions.test.mjs','course-app/tests/unified/official-vi-history.spec.ts',registryPath];
const ownedInputs=ownSourcePaths.map(file=>({file,bytes:readFileSync(resolve(repo,file)).length,sha256:sha(readFileSync(resolve(repo,file)))}));
const consumerFiles=readdirSync(assets).filter(f=>/\.(?:js|css|json)$/.test(f)).map(name=>{const file=resolve(assets,name),bytes=readFileSync(file);return {file:relative(repo,file),bytes:bytes.length,sha256:sha(bytes)}});
consumerFiles.push({file:relative(repo,resolve(dist,'index.html')),bytes:readFileSync(resolve(dist,'index.html')).length,sha256:sha(readFileSync(resolve(dist,'index.html')))});
const evidence={schemaVersion:1,generatedAt:new Date().toISOString(),candidate:'B10 HSK2/3 default-inactive dirty worktree build (not a release or CI head)',
 observedHead:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),rawBaselineCommit:baseline,
 activeRegistry:{file:registryPath,sha256:sha(registryBytes),courses:{hsk2:null,hsk3:null},activeChangeCount:0},
 rawSourceCount:rows.length,compiledRawSourceCount:rows.length,rawSources:rows,ownedInputs,
 compiledConsumers:{count:consumerFiles.length,files:consumerFiles.sort((a,b)=>a.file.localeCompare(b.file))},
 limitations:['Build includes other agents’ concurrent HSK1 adapter sources; this does not freeze the whole runtime tree.','No production publication or official Vietnamese acceptance occurs.','Historical native fixtures are only typechecked/collected locally; no browser execution is claimed.']};
writeFileSync(new URL('./source-bytes.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
process.stdout.write(`Verified ${rows.length} raw source files against ${baseline}; all ${rows.length} compiled raw imports decode to exact bytes; registry active changes: 0.\n`);
