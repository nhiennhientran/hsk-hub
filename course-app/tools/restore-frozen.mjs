import {readFileSync,existsSync,mkdirSync,copyFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {walkFiles,hash,deploymentPath} from './package-core.mjs';
const manifestPath='course-engine/release-manifest.json';
export function restoreFrozen({code,audio,output,sourceCommit}){
 code=resolve(code);audio=resolve(audio);output=resolve(output);
 if(existsSync(output))throw Error('Frozen restoration output must not exist');
 const manifestBytes=readFileSync(join(code,manifestPath)),m=JSON.parse(manifestBytes);
 if(m.schemaVersion!==1||m.sourceCommit!==sourceCommit||!['pilot','release'].includes(m.mode)||!Array.isArray(m.files))throw Error('Invalid frozen manifest identity');
 const paths=new Set(),inputs=[];
 for(const row of m.files){
  if(!deploymentPath(row.path)||paths.has(row.path)||row.path===manifestPath||!Number.isSafeInteger(row.bytes)||row.bytes<0||!/^[a-f0-9]{64}$/.test(row.sha256))throw Error('Invalid or repeated frozen path');paths.add(row.path);
  const isAudio=/^course-engine\/course-assets\/hsk[23]\/audio\/\d{1,2}-[1-8]\.mp3$/.test(row.path);
  const from=join(isAudio?audio:code,isAudio?row.path.slice('course-engine/'.length):row.path);
  const bytes=readFileSync(from);if(bytes.length!==row.bytes||hash(bytes)!==row.sha256)throw Error('Frozen bytes mismatch: '+row.path);
  inputs.push({path:row.path,from,isAudio});
 }
 if(inputs.filter(x=>x.isAudio).length!==264)throw Error('Expected264 frozen original audio tracks');
 const codePaths=walkFiles(code),expected=inputs.filter(x=>!x.isAudio).map(x=>x.path).concat(manifestPath).sort();
 if(JSON.stringify(codePaths)!==JSON.stringify(expected))throw Error('Unexpected or missing frozen code files');
 // Inspect audio tree too, rejecting symlinks; only the exact264 mapped files are copied.
 walkFiles(audio);
 mkdirSync(output,{recursive:true});
 for(const {path,from} of inputs.concat({path:manifestPath,from:join(code,manifestPath)})){mkdirSync(join(output,path,'..'),{recursive:true});copyFileSync(from,join(output,path))}
 for(const row of m.files)if(hash(readFileSync(join(output,row.path)))!==row.sha256)throw Error('Restored bytes failed verification');
 return m;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [code,audio,output,sourceCommit]=process.argv.slice(2);if(!code||!audio||!output||!sourceCommit)throw Error('Usage: restore-frozen.mjs CODE ORIGINAL_AUDIO_ROOT OUTPUT SOURCE_COMMIT');
 const m=restoreFrozen({code,audio,output,sourceCommit});console.log(JSON.stringify({sourceCommit:m.sourceCommit,mode:m.mode,verifiedFiles:m.files.length,rebuilt:false}));
}
