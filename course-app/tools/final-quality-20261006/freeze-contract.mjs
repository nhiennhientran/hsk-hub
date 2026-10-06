import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {hash,walkFiles} from '../package-core.mjs';
import {completeNative} from '../../docs/continue-phase2-20261005/ci/native-completion.mjs';
export const finalBrowserCases=127;
export const finalSpecFiles=['remaining-coverage.spec.ts','requirements.spec.ts','teaching-clarifications.spec.ts','precision-playback.spec.ts','compatibility-entry.spec.ts'];
export function verifyInventory(site,inventory){
 assert.equal(inventory.schemaVersion,1);assert.equal(inventory.sourceDirty,false);
 assert.equal(inventory.buildProvenance,'built-from-recorded-worktree');
 assert.ok(Array.isArray(inventory.files)&&inventory.files.length>0);
 const names=walkFiles(site),listed=inventory.files.map(row=>row.path);
 assert.equal(new Set(listed).size,listed.length,'Duplicate frozen path');
 assert.deepEqual(names,listed,'Frozen website missing or extra path');
 for(const row of inventory.files){const bytes=readFileSync(join(site,row.path));assert.equal(bytes.length,row.bytes,'Frozen byte length differs: '+row.path);assert.equal(hash(bytes),row.sha256,'Frozen bytes differ: '+row.path);}
 assert.equal(hash(Buffer.from(JSON.stringify(inventory.files))),inventory.inventorySHA256,'Frozen inventory seal differs');
 return inventory.inventorySHA256;
}
export function verifyNative(report,collection,browser){return completeNative(report,collection,{browser,expected:finalBrowserCases});}
export function stagingBranch(runId,attempt){assert.match(String(runId),/^\d+$/);assert.match(String(attempt),/^[1-9]\d*$/);return `work/hsk-final-staging-20261006-${runId}-${attempt}`;}
