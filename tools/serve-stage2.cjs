'use strict';
// This preview serves only this stage's public test assets, never repository files or uploads.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const allowed=new Map([
 ['/', ['new-hsk1/hsk1/stage2/index.html','text/html; charset=utf-8']],
 ['/index.html', ['new-hsk1/hsk1/stage2/index.html','text/html; charset=utf-8']],
 ['/offline.html', ['dist/stage2/HSK1-Step2-All15Lessons.html','text/html; charset=utf-8']],
 ['/learning.css', ['new-hsk1/hsk1/learning.css','text/css; charset=utf-8']],
 ['/styles.css', ['new-hsk1/hsk1/stage2/styles.css','text/css; charset=utf-8']],
 ['/bank.js', ['new-hsk1/hsk1/stage2/bank.js','application/javascript; charset=utf-8']],
 ['/engine.js', ['new-hsk1/hsk1/stage2/engine.js','application/javascript; charset=utf-8']],
 ['/app.js', ['new-hsk1/hsk1/stage2/app.js','application/javascript; charset=utf-8']]
]);
const port=Number(process.env.HSK_STEP2_PORT||8766);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid HSK_STEP2_PORT.');
http.createServer((req,res)=>{
  let url;
  try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400).end('Bad request');return;}
  if(!['GET','HEAD'].includes(req.method)||!allowed.has(url.pathname)){res.writeHead(404).end('Not found');return;}
  const [file,type]=allowed.get(url.pathname);
  let data;
  try{data=fs.readFileSync(path.join(root,file));}catch{res.writeHead(404).end('Not built');return;}
  if(type.startsWith('text/html'))data=Buffer.from(data.toString().replace('href="../learning.css"','href="/learning.css"'));
  res.writeHead(200,{'Content-Type':type,'Content-Length':data.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(req.method==='HEAD'?undefined:data);
}).listen(port,'0.0.0.0',()=>console.log(`Stage 2 allowlist preview: http://127.0.0.1:${port}/`));
