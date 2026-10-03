import {cpSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),dest=resolve(root,'public/course-assets');
const audio=resolve(root,'../new-hsk1/hsk1/audio');if(!existsSync(audio))throw Error('Protected HSK1 original audio source missing');
mkdirSync(dest,{recursive:true});cpSync(audio,resolve(dest,'audio'),{recursive:true});
cpSync(resolve(root,'../hsk1-app/public/course-assets/hanzi'),resolve(dest,'hanzi'),{recursive:true});
for(const name of ['HANZI-DATA-LICENSE.txt','HANZI-WRITER-LICENSE.txt'])cpSync(resolve(root,'../hsk1-app/public/course-assets',name),resolve(dest,name));
console.log('Copied protected HSK1 audio and licensed Hanzi assets into shared runtime.');
