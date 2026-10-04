import {mkdtempSync,readFileSync,writeFileSync,renameSync,rmSync,mkdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {assembleUnifiedCheckpoint,protectedBaselineManifest} from '../../../tools/assemble-unified-checkpoint.mjs';
import {hash} from '../../../tools/package-core.mjs';
const repo=resolve(import.meta.dirname,'../../../..'),[baseline,packageRoot,report]=process.argv.slice(2);
if(!report)throw Error('Usage: verify-negative-guards BASELINE PACKAGE PRIVATE_REPORT');
protectedBaselineManifest(repo);
const expectedErrors={'baseline-byte':/Protected baseline mismatch/,'baseline-extra':/Missing or extra protected baseline files/,'package-byte':/Frozen checkpoint mismatch/,'poisoned-approved-crop':/Unapproved frozen original crop/,'extra-private-pdf':/Frozen checkpoint mismatch/,'extra-private-svg':/Frozen checkpoint mismatch/,'extra-backend-js':/Frozen checkpoint mismatch/,'legacy-overwrite':/Frozen checkpoint mismatch/,'manifest-duplicate':/Missing or extra frozen checkpoint files/,'wrong-production':/Wrong unified checkpoint identity/,'fake-release':/Wrong unified checkpoint identity/,'missing-required-alias-crop':/Missing required unified output/,'missing-required-entry':/Missing required unified output/,'missing-main-bundle':/Missing required bundle dependency/,'missing-original-audio':/Missing or changed required original audio/,'missing-handwriting':/Missing required unified output/,'missing-course-index-json':/Missing required bundle dependency/,'missing-textbook-json':/Missing required bundle dependency/,'missing-media-json':/Missing required bundle dependency/,'poisoned-handwriting':/Frozen handwriting identity mismatch/,'poisoned-handwriting-provenance':/Untrusted frozen handwriting provenance/,'poisoned-handwriting-license':/Frozen handwriting license identity mismatch/};
const sandbox=mkdtempSync(join(tmpdir(),'hsk-assembly-probes-')),results=[];
const replace=(file,b)=>{writeFileSync(file+'.probe',b);renameSync(file+'.probe',file);};
const manifestPath='course-engine/unified-release-manifest.json';
try{
  for(const kind of ['baseline-byte','baseline-extra','package-byte','poisoned-approved-crop','extra-private-pdf','extra-private-svg','extra-backend-js','legacy-overwrite','manifest-duplicate','wrong-production','fake-release','missing-required-alias-crop','missing-required-entry','missing-main-bundle','missing-original-audio','missing-handwriting','missing-course-index-json','missing-textbook-json','missing-media-json','poisoned-handwriting','poisoned-handwriting-provenance','poisoned-handwriting-license']){
    const local=join(sandbox,kind),b=join(local,'baseline'),p=join(local,'package'),output=join(local,'output');mkdirSync(local);
    // Hard-link immutable inputs; every mutation replaces its inode atomically.
    execFileSync('cp',['-al',resolve(baseline),b]);execFileSync('cp',['-al',resolve(packageRoot),p]);
    const m=JSON.parse(readFileSync(join(p,manifestPath))),crop=m.files.find(f=>f.path==='course-engine/source-activities/figures/l01-text-1-photo.png');assert.ok(crop);
    if(kind==='baseline-byte')replace(join(b,'hsk4/index.html'),Buffer.from('changed protected bytes'));
    if(kind==='baseline-extra')writeFileSync(join(b,'extra.html'),'unapproved');
    if(kind==='package-byte')replace(join(p,crop.path),Buffer.from('changed crop'));
    if(kind==='poisoned-approved-crop'){const bytes=Buffer.from('unapproved replacement crop');replace(join(p,crop.path),bytes);crop.bytes=bytes.length;crop.sha256=hash(bytes);}
    if(['poisoned-handwriting','poisoned-handwriting-provenance','poisoned-handwriting-license'].includes(kind)){
      const target=kind==='poisoned-handwriting'?'course-engine/course-assets/hanzi/一.json':kind==='poisoned-handwriting-provenance'?'course-engine/course-assets/HANZI-PROVENANCE.json':'course-engine/course-assets/HANZI-DATA-LICENSE.txt';
      const bytes=Buffer.from('unapproved poisoned handwriting payload');replace(join(p,target),bytes);
      for(const f of m.files.filter(f=>f.path===target)){f.bytes=bytes.length;f.sha256=hash(bytes);}
      for(const f of m.inputFiles.filter(f=>'course-engine/'+f.path===target)){f.bytes=bytes.length;f.sha256=hash(bytes);}
    }
    let extra;
    if(kind==='extra-private-pdf')extra='course-engine/source-activities/figures/whole-page.pdf';
    if(kind==='extra-private-svg')extra='course-engine/illustrations/private-full-page.svg';
    if(kind==='extra-backend-js')extra='course-engine/tools/backend.js';
    if(kind==='legacy-overwrite')extra='hsk4/index.html';
    if(extra){const bytes=Buffer.from('private unapproved artifact');mkdirSync(join(p,extra,'..'),{recursive:true});writeFileSync(join(p,extra),bytes);m.files.push({path:extra,bytes:bytes.length,sha256:hash(bytes)});}
    let missing;
    if(kind==='missing-required-alias-crop')missing='new-hsk2/hsk2/'+crop.path.slice('course-engine/'.length);
    if(kind==='missing-required-entry')missing='new-hsk3/hsk3/index.html';
    if(kind==='missing-main-bundle'){
      const html=readFileSync(join(p,'index.html'),'utf8'),ref=html.match(/src="([^"]+\.js)"/)?.[1];assert.ok(ref);missing=new URL(ref,'https://checkpoint.invalid/index.html').pathname.slice(1);
    }
    if(kind==='missing-course-index-json')missing=m.files.find(f=>/^course-engine\/assets\/course-index-.+\.json$/.test(f.path))?.path;
    if(kind==='missing-textbook-json')missing=m.files.find(f=>/^course-engine\/assets\/textbook-.+\.json$/.test(f.path))?.path;
    if(kind==='missing-media-json')missing=m.files.find(f=>/^course-engine\/assets\/media-references-.+\.json$/.test(f.path))?.path;
    if(['missing-course-index-json','missing-textbook-json','missing-media-json'].includes(kind))assert.ok(missing,kind+' requires an actual frozen asset');
    if(kind==='missing-original-audio')missing='course-engine/course-assets/audio/1-1.mp3';
    if(kind==='missing-handwriting')missing='course-engine/course-assets/hanzi/一.json';
    if(missing){rmSync(join(p,missing));m.files=m.files.filter(f=>f.path!==missing);m.inputFiles=m.inputFiles.filter(f=>'course-engine/'+f.path!==missing);}
    if(kind==='manifest-duplicate')m.files.push(m.files[0]);
    if(kind==='wrong-production')m.protectedProduction='0'.repeat(40);
    if(kind==='fake-release')m.mode='release';
    if(!['baseline-byte','baseline-extra','package-byte'].includes(kind))replace(join(p,manifestPath),Buffer.from(JSON.stringify(m)));
    let error;try{assembleUnifiedCheckpoint({repo,baseline:b,packageRoot:p,output});}catch(e){error=e.message;}
    assert.ok(error,kind+' must fail');assert.match(error,expectedErrors[kind],kind+' must fail for the intended guard');assert.equal(existsSync(output),false,kind+' must fail before output creation');results.push({kind,status:'passed',observedError:error,outputCreated:false});
    rmSync(local,{recursive:true,force:true});
  }
}finally{rmSync(sandbox,{recursive:true,force:true});}
const out={generatedAt:new Date().toISOString(),status:'passed',negativeProbes:results.length,scope:'Actual protected 2da baseline and actual frozen checkpoint; source inputs remain unchanged',results};mkdirSync(resolve(report,'..'),{recursive:true});writeFileSync(report,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({status:out.status,negativeProbes:out.negativeProbes}));
