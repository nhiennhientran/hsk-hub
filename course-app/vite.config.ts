import {defineConfig} from 'vite';
import {readFileSync} from 'node:fs';
export default defineConfig({base:'./',plugins:[{name:'freeze-content-identity',generateBundle(){
 const report=JSON.parse(readFileSync(new URL('./docs/content-validation.json',import.meta.url),'utf8'));
 const audio=JSON.parse(readFileSync(new URL('./content/audio-manifest.json',import.meta.url),'utf8')).tracks.map(({file,sha256,bytes}:{file:string;sha256:string;bytes:number})=>({file,sha256,bytes}));
 if(report.issues.length)throw Error('Content validation did not pass');
 this.emitFile({type:'asset',fileName:'content-manifest.json',source:JSON.stringify({schemaVersion:1,mode:report.mode,totals:report.totals,lexicons:report.lexicons,audio,lessons:report.lessons.map(({id,level,number,words,texts,grammar,homework,sha256}:{id:string;level:number;number:number;words:number;texts:number;grammar:number;homework:number;sha256:string})=>({id,level,number,words,texts,grammar,homework,sha256}))},null,2)+'\n'});
 }}],build:{target:'es2022',sourcemap:false},server:{fs:{allow:['..']}}});
