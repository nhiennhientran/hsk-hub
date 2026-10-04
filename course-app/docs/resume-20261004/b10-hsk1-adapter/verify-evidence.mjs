import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {hsk1ViFields,viCanonical,viPointer} from '../../../../hsk1-app/src/services/content/official-vi-revisions.ts';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../../..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const names=['textbook','textbook-display-revisions','stage2-bank','stage3-catalog','homework30-bank','course-index'];
const values={},sourceFiles=[];
for(const name of names){const file=`hsk1-app/content/${name}.json`,bytes=fs.readFileSync(path.join(repo,file));values[`content/${name}.json`]=JSON.parse(bytes);sourceFiles.push({file,bytes:bytes.length,sha256:sha(bytes)});}
const fields=hsk1ViFields(values),problems=[],byComponent={};
const descriptors=fields.map(f=>{let value=values[f.baselineFile];for(const part of viPointer(f.field))value=value?.[part];if(value!==f.effectiveValue)problems.push(`${f.baselineFile}${f.field}`);byComponent[f.component]=(byComponent[f.component]??0)+1;return {baselineFile:f.baselineFile,field:f.field,ownerId:f.ownerId,component:f.component,lesson:f.lesson,relativeField:f.relativeField,valueSHA256:sha(f.effectiveValue),zhContextSHA256:sha(f.zhContext),...(f.originalOptions?{originalOptionsSHA256:sha(viCanonical(f.originalOptions))}:{})};});
const keys=descriptors.map(f=>viCanonical([f.baselineFile,f.field,f.ownerId,f.component]));if(new Set(keys).size!==keys.length)problems.push('duplicate registered source target');
const before=JSON.parse(fs.readFileSync(path.join(here,'protected-before.json'),'utf8'));
const protectedFiles=before.files.map(f=>{const bytes=fs.readFileSync(path.join(repo,f.file)),head=execFileSync('git',['show',`HEAD:${f.file}`],{cwd:repo});return {...f,currentBytes:bytes.length,currentSHA256:sha(bytes),sameBefore:sha(bytes)===f.sha256,sameHEAD:bytes.equals(head)};});
for(const f of protectedFiles)if(!f.sameBefore||!f.sameHEAD)problems.push(`protected source drift ${f.file}`);
const proof={schemaVersion:1,scope:'HSK1 B10 inactive engineering preparation; no official language audit or activation',HEAD:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),activeRegistry:JSON.parse(fs.readFileSync(path.join(repo,'hsk1-app/content/official-vi-registry.json'))),sourceFiles,registeredFields:fields.length,uniqueSemanticFieldTargets:new Set(keys).size,byComponent,pointerMatches:fields.length-problems.filter(p=>p.startsWith('content/')).length,targetSetSHA256:sha([...keys].sort().join('\n')),descriptors,protectedFiles,problems};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(here,'registered-field-proof.json'),JSON.stringify(proof,null,2)+'\n');
else{const frozen=JSON.parse(fs.readFileSync(path.join(here,'registered-field-proof.json'),'utf8'));if(viCanonical({...proof,HEAD:null})!==viCanonical({...frozen,HEAD:null}))problems.push('registered proof/source mismatch');}
console.log(JSON.stringify({registeredFields:fields.length,byComponent,pointerMatches:proof.pointerMatches,protected:protectedFiles.length,problems}));
if(problems.length)process.exitCode=1;
