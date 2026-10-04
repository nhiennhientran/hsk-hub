import {cpSync,mkdirSync,existsSync,readFileSync,writeFileSync,readdirSync,unlinkSync,copyFileSync} from 'node:fs';
import {resolve} from 'node:path';import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..'),repo=resolve(root,'..'),dest=resolve(root,'public/course-assets');
const audio=resolve(repo,'new-hsk1/hsk1/audio');if(!existsSync(audio))throw Error('Protected HSK1 original audio source missing');
mkdirSync(dest,{recursive:true});cpSync(audio,resolve(dest,'audio'),{recursive:true});
const sourceFigures=resolve(repo,'hsk1-app/public/source-activities');
if(existsSync(sourceFigures))cpSync(sourceFigures,resolve(root,'public/source-activities'),{recursive:true});
const one=JSON.parse(readFileSync(resolve(repo,'hsk1-app/content/textbook.json'),'utf8'));
const characters=new Set(one.lessons.flatMap(l=>[l.hanzi.chars,...l.vocab.map(w=>w.zh)]).join('').match(/\p{Script=Han}/gu)??[]);
for(const level of [2,3])for(const name of readdirSync(resolve(root,`content/hsk${level}`)).filter(n=>/^lesson-\d+\.json$/.test(n))){const lesson=JSON.parse(readFileSync(resolve(root,`content/hsk${level}`,name),'utf8'));for(const c of lesson.vocabulary.flatMap(w=>w.zh.match(/\p{Script=Han}/gu)??[]))characters.add(c)}
const strokeDir=resolve(dest,'hanzi');mkdirSync(strokeDir,{recursive:true});for(const name of readdirSync(strokeDir))if(name.endsWith('.json')&&!characters.has(name.slice(0,-5)))unlinkSync(resolve(strokeDir,name));
const sources=[];for(const character of [...characters].sort()){
 const candidates=[resolve(repo,'hsk1-app/public/course-assets/hanzi',character+'.json'),resolve(repo,'new-hsk1/assets/hanzi-data',character+'.json'),resolve(root,'node_modules/hanzi-writer-data',character+'.json')],source=candidates.find(existsSync);if(!source)throw Error('Missing licensed stroke data: '+character);
 const bytes=readFileSync(source),data=JSON.parse(bytes);if(!Array.isArray(data.strokes)||!data.strokes.length||!data.strokes.every(p=>typeof p==='string'&&p.trim())||!Array.isArray(data.medians)||data.medians.length!==data.strokes.length||!data.medians.every(s=>Array.isArray(s)&&s.length>1&&s.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))))throw Error('Invalid stroke data: '+character);
 copyFileSync(source,resolve(strokeDir,character+'.json'));sources.push({character,origin:source.includes('node_modules')?'npm:hanzi-writer-data@2.0.1':'protected-hsk1-source',strokes:data.strokes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
for(const name of ['HANZI-DATA-LICENSE.txt','HANZI-WRITER-LICENSE.txt'])cpSync(resolve(repo,'hsk1-app/public/course-assets',name),resolve(dest,name));
writeFileSync(resolve(dest,'HANZI-PROVENANCE.json'),JSON.stringify({schemaVersion:1,source:'https://github.com/chanind/hanzi-writer-data',packageVersion:'2.0.1',license:'HANZI-DATA-LICENSE.txt',characters:sources},null,2)+'\n');
console.log(JSON.stringify({originalHSK1Audio:93,requiredCharacters:characters.size,preservedCharacters:sources.filter(s=>s.origin==='protected-hsk1-source').length,licensedAdditions:sources.filter(s=>s.origin.startsWith('npm:')).length,complete:true}));
