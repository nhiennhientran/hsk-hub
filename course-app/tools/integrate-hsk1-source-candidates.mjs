// Copies source candidates into the isolated development build after checking provenance.
// Editorial reviews remain separate; copying is not publication or acceptance.
import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const repo=resolve(import.meta.dirname,'../..');
const source=resolve(repo,'course-app/docs/resume-20261004');
const dest=resolve(repo,'hsk1-app/content/source-activities');
const assets=resolve(repo,'hsk1-app/public/source-activities/figures');
mkdirSync(assets,{recursive:true});
const expectedBook='25d1aad102e4179307b5bc4f932927bbd244b3f4dd53edeb6cfd4dbbb8d4f2ba';
const expectedAnswers='9e783c9deb889231a778d6776b65dbc04fc734eeca0fdfda1c9d99eb793104e5';
const groups=[['content-01-03',[1,2,3]],['content-05-08',[5,6,7,8]],['content-09-11',[9,10,11]],['content-12-15',[12,13,14,15]]];
const result=[];
for(const [group,lessons] of groups)for(const lesson of lessons){
  const name=`lesson-${String(lesson).padStart(2,'0')}.json`,file=resolve(source,group,name);
  if(!existsSync(file))continue;
  const bytes=readFileSync(file),data=JSON.parse(bytes);
  if(data.lesson!==lesson||data.textbookSHA256!==expectedBook||data.answerBookSHA256!==expectedAnswers)throw Error(`Wrong source: ${name}`);
  const images=new Map();for(const figure of data.figures){
    if(figure.kind!=='original-crop'||!/^figures\/[a-zA-Z0-9][a-zA-Z0-9_-]*\.png$/.test(figure.file))throw Error(`Unexpected crop: ${figure.id}`);
    const origin=resolve(source,group,figure.file),crop=readFileSync(origin);
    if(createHash('sha256').update(crop).digest('hex')!==figure.sha256||figure.source.textbookSHA256!==expectedBook)throw Error(`Crop provenance mismatch: ${figure.id}`);
    if(images.has(figure.id))throw Error(`Duplicate crop: ${figure.id}`);
    images.set(figure.id,figure.sha256);
    copyFileSync(origin,resolve(assets,figure.file.slice('figures/'.length)));
  }
  const ids=new Set();for(const activity of data.activities){
    if(activity.lesson!==lesson||activity.source.textbookSHA256!==expectedBook||ids.has(activity.id))throw Error(`Invalid activity: ${activity.id}`);
    ids.add(activity.id);
    if(activity.figure&&images.get(activity.figure)!==activity.figureSHA256)throw Error(`Missing image hash: ${activity.id}`);
    for(const id of activity.figures??[])if(images.get(id)!==activity.figureSHA256s?.[id])throw Error(`Missing grouped image hash: ${activity.id}`);
  }
  writeFileSync(resolve(dest,name),bytes);
  result.push({lesson,activities:data.activities.length,fields:data.activities.flatMap(a=>a.fields).length,figures:data.figures.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
console.log(JSON.stringify(result,null,2));
