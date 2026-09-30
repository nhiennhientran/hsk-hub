'use strict';
// Produce one offline HTML from reviewed local assets. No server or build dependency.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'new-hsk1/hsk1/stage1');
const output=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'dist/stage1');
fs.mkdirSync(output,{recursive:true});
let html=fs.readFileSync(path.join(source,'index.html'),'utf8');
for(const href of ['../learning.css','styles.css']){
  const css=fs.readFileSync(path.resolve(source,href),'utf8').replace(/^@charset[^;]+;/,'');
  html=html.replace(`<link rel="stylesheet" href="${href}">`,`<style>\n${css}\n</style>`);
}
for(const file of ['sample-bank.js','engine.js','app.js']){
  const js=fs.readFileSync(path.join(source,file),'utf8');
  if(/<\/script/i.test(js))throw new Error(`Unsafe inline closing tag in ${file}`);
  html=html.replace(`<script src="${file}"></script>`,`<script>\n${js}\n</script>`);
}
const target=path.join(output,'HSK1-Step1-Lesson3.html');
fs.writeFileSync(target,html);
console.log(JSON.stringify({file:target,bytes:Buffer.byteLength(html),lessons:1,questions:15}));
