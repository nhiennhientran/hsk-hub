import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {packageFrozen} from './package-core.mjs';
const args=process.argv.slice(2),option=(name,fallback)=>{const at=args.indexOf(name);return at<0?fallback:args[at+1]};
const root=resolve(import.meta.dirname,'..');
if(!args.includes('--pilot')){execFileSync('git',['diff','--quiet'],{cwd:root});execFileSync('git',['diff','--cached','--quiet'],{cwd:root});if(execFileSync('git',['ls-files','--others','--exclude-standard','content','src','tools'],{cwd:root,encoding:'utf8'}).trim())throw Error('Untracked source cannot be frozen for release')}
const manifest=packageFrozen({input:option('--input',resolve(root,'dist')),output:option('--output',resolve(root,'release-package')),portal:option('--portal',resolve(root,'../index.html')),sourceCommit:option('--source',process.env.GITHUB_SHA??execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()),mode:args.includes('--pilot')?'pilot':'release'});
console.log(JSON.stringify({sourceCommit:manifest.sourceCommit,mode:manifest.mode,files:manifest.files.length,entries:manifest.entries},null,2));
