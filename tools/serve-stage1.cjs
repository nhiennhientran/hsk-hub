'use strict';
// Read-only preview, with an explicit allowlist; it cannot expose the repository or uploads.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const allowed=new Map([
 ['/', ['new-hsk1/hsk1/stage1/index.html','text/html; charset=utf-8']],
 ['/index.html', ['new-hsk1/hsk1/stage1/index.html','text/html; charset=utf-8']],
 ['/offline.html', ['dist/stage1/HSK1-Step1-Lesson3.html','text/html; charset=utf-8']],
 ['/learning.css', ['new-hsk1/hsk1/learning.css','text/css; charset=utf-8']],
 ['/styles.css', ['new-hsk1/hsk1/stage1/styles.css','text/css; charset=utf-8']],
 ['/sample-bank.js', ['new-hsk1/hsk1/stage1/sample-bank.js','application/javascript; charset=utf-8']],
 ['/engine.js', ['new-hsk1/hsk1/stage1/engine.js','application/javascript; charset=utf-8']],
 ['/app.js', ['new-hsk1/hsk1/stage1/app.js','application/javascript; charset=utf-8']],
 ['/responsive.html', ['tools/tests/stage1-responsive.html','text/html; charset=utf-8']]
]);
const port=Number(process.env.HSK_STEP1_PORT||8765);
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(!['GET','HEAD'].includes(req.method)||!allowed.has(url.pathname)){res.writeHead(404).end('Not found');return;}
 const [file,type]=allowed.get(url.pathname);
 let data=fs.readFileSync(path.join(root,file));
 if(type.startsWith('text/html'))data=Buffer.from(data.toString().replace('href="../learning.css"','href="/learning.css"').replace('src="../../new-hsk1/hsk1/stage1/index.html"','src="/index.html"'));
 res.writeHead(200,{'Content-Type':type,'Content-Length':data.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 res.end(req.method==='HEAD'?undefined:data);
}).listen(port,'0.0.0.0',()=>console.log(`Stage 1 allowlist preview: http://127.0.0.1:${port}/`));
