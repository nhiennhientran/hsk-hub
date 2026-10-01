'use strict';
// Independent Stage 3 review preview. Exact public-asset allowlist; no repository, uploads or source JSON routes.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const APP = 'new-hsk1/hsk1/stage3';
const MIME = {html:'text/html; charset=utf-8', css:'text/css; charset=utf-8', js:'application/javascript; charset=utf-8', json:'application/json; charset=utf-8'};
const allowed = new Map([
  ['/', [`${APP}/index.html`, MIME.html]],
  ['/index.html', [`${APP}/index.html`, MIME.html]],
  ['/offline.html', ['dist/stage3/HSK1-Step3-Listening-Vocabulary.html', MIME.html]],
  ['/teacher.html', ['dist/stage3/HSK1-Step3-Teacher-Guide.html', MIME.html]],
  ['/learning.css', ['new-hsk1/hsk1/learning.css', MIME.css]],
  ['/styles.css', [`${APP}/styles.css`, MIME.css]],
  ...['catalog.js', 'media-index.js', 'engine.js', 'player.js', 'app.js'].map(file => [`/${file}`, [`${APP}/${file}`, MIME.js]]),
  ...Array.from({length:15}, (_, i) => {
    const file = `media/lesson-${String(i+1).padStart(2, '0')}.js`;
    return [`/${file}`, [`${APP}/${file}`, MIME.js]];
  }),
  ['/media-manifest.json', [`${APP}/media-manifest.json`, MIME.json]]
]);
function createServer() {
  return http.createServer((req, res) => {
    let url;
    try { url = new URL(req.url, 'http://localhost'); }
    catch { res.writeHead(400).end('Bad request'); return; }
    if (!['GET', 'HEAD'].includes(req.method) || !allowed.has(url.pathname)) {
      res.writeHead(404, {'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'}).end('Not found'); return;
    }
    const [file, type] = allowed.get(url.pathname);
    let data;
    try { data = fs.readFileSync(path.join(ROOT, file)); }
    catch { res.writeHead(404, {'Cache-Control':'no-store'}).end('Not built'); return; }
    if (type === MIME.html) data = Buffer.from(data.toString('utf8').replace('href="../learning.css"', 'href="/learning.css"'));
    res.writeHead(200, {'Content-Type':type, 'Content-Length':data.length, 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}
if (require.main === module) {
  const port = Number(process.env.HSK_STEP3_PORT || 18767);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid HSK_STEP3_PORT.');
  createServer().listen(port, '0.0.0.0', () => console.log(`Stage 3 independent allowlist preview: http://127.0.0.1:${port}/`));
}
module.exports = {createServer, allowed};
