// Explicit draft only: refuses overwrite of an independently reviewed catalogue.
import {readFileSync,readdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
for(const level of [2,3]){
 const courseId=`hsk${level}-fltrp-2026`,out=resolve(root,`content/hsk${level}-lexicon.json`);
 if(existsSync(out)&&JSON.parse(readFileSync(out,'utf8')).reviewStatus?.independent)throw Error('Refusing to regenerate an independently reviewed lexicon');
 const lessons=readdirSync(resolve(root,`content/hsk${level}`)).filter(x=>/^lesson-\d\d.json$/.test(x)).sort().map(p=>JSON.parse(readFileSync(resolve(root,`content/hsk${level}`,p),'utf8')));
 const senses=lessons.flatMap(l=>l.vocabulary.map(w=>({id:`${courseId}:sense:${w.id.split(':').slice(1).join('-')}`,zh:w.zh,py:w.py,vi:w.vi,pos:w.pos,sources:[{wordId:w.id,lessonId:l.id,lesson:l.number,sourceText:w.sourceText,audioTrack:w.audioTrack,source:w.source}]})));
 const groups=new Map();for(const s of senses){const g=groups.get(s.zh)??[];g.push(s);groups.set(s.zh,g)}
 const sameFormDecisions=[...groups].filter(([,g])=>g.length>1).map(([zh,g])=>({zh,senseIds:g.map(s=>s.id),action:'keep-distinct',reason:new Set(g.map(s=>s.py)).size>1?'Different printed pronunciation and grammatical meaning.':new Set(g.map(s=>s.pos)).size>1?'Distinct printed parts of speech or grammatical uses.':'Distinct printed senses despite identical spelling, pronunciation and part of speech.',reviewed:false}));
 const result={schemaVersion:1,courseId,version:'2026.1',reviewStatus:{independent:false,reviewer:'pending',notes:['Draft explicit identity. Each source POS/sense is retained separately; no spelling-only or translation-string merging.','Syllabus targets200/500 are not this catalogue\'s counts.']},counts:{sourceRecords:senses.length,senses:senses.length,chineseForms:groups.size,verifiedMerges:0},merges:[],sameFormDecisions,senses};
 writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(courseId,result.counts);
}
