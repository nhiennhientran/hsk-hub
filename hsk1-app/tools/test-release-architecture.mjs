import { cpSync, copyFileSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const root=fileURLToPath(new URL('../', import.meta.url));
const dir=mkdtempSync(resolve(tmpdir(),'hsk-release-'));
try {
  cpSync(resolve(root,'dist'),dir,{recursive:true});
  copyFileSync(resolve(root,'../new-hsk1/hsk1/audio-architecture-check.cjs'),resolve(dir,'check.cjs'));
  const check=()=>spawnSync(process.execPath,[resolve(dir,'check.cjs')],{encoding:'utf8'});
  const valid=check();assert.equal(valid.status,0,valid.stderr);
  const original=readFileSync(resolve(dir,'release-manifest.json'),'utf8');
  const data=JSON.parse(original);
  let checked=1;
  for(const mutate of [m=>{m.productionBase='/wrong/';},m=>{m.productionRecoveryCommit='0'.repeat(40);},m=>{m.files=m.files.filter(f=>f.path!=='index.html');m.buildId=createHash('sha256').update(JSON.stringify(m.files)).digest('hex');},m=>{m.files[0].path='../bad';m.buildId=createHash('sha256').update(JSON.stringify(m.files)).digest('hex');}]){
    const bad=structuredClone(data);mutate(bad);writeFileSync(resolve(dir,'release-manifest.json'),JSON.stringify(bad));assert.notEqual(check().status,0,'Bad manifest accepted');checked++;
  }
  writeFileSync(resolve(dir,'release-manifest.json'),original);
  const target=resolve(dir,'index.html'),html=readFileSync(target);writeFileSync(target,Buffer.concat([html,Buffer.from('corrupt')]));assert.notEqual(check().status,0,'Corrupt payload accepted');checked++;
  writeFileSync(target,html);rmSync(resolve(dir,'release-manifest.json'));assert.notEqual(check().status,0,'Missing manifest accepted');checked++;
  console.log(JSON.stringify({releaseArchitectureChecks:checked,passed:checked,failed:0}));
} finally {rmSync(dir,{recursive:true,force:true});}
