import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// A production-shaped static host, deliberately without Vite middleware or an
// HTML fallback. A missing JS, JSON, MP3, or legacy entry must really be a 404.
export const productionBase = '/hsk-hub/new-hsk1/hsk1/';
const defaultDist = fileURLToPath(new URL('../dist/', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8', '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

/** A single byte range is sufficient for Chromium/WebKit native MP3 seeking. */
export function byteRange(value, size) {
  if (!value) return { start: 0, end: size - 1, partial: false };
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2]) || size === 0) return null;
  const first = match[1] ? Number(match[1]) : null;
  const last = match[2] ? Number(match[2]) : null;
  if ([first, last].some(number => number !== null && !Number.isSafeInteger(number))) return null;
  if (first === null && last === 0) return null;
  const start = first ?? Math.max(0, size - last);
  const end = first === null || last === null ? size - 1 : Math.min(last, size - 1);
  return start >= size || start > end ? null : { start, end, partial: true };
}

export async function createReleaseServer(dist = process.env.HSK_RELEASE_DIST ?? defaultDist) {
  const root = await realpath(resolve(dist));
  for (const entry of ['index.html', 'lesson.html', 'learning.html']) {
    if (!(await stat(resolve(root, entry))).isFile()) throw new Error(`Build the release first: missing ${entry}`);
  }
  return createServer(async (request, response) => {
    const finish = (status, message) => {
      response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(request.method === 'HEAD' ? undefined : message);
    };
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD'); finish(405, 'Method not allowed'); return;
    }
    let pathname;
    try { pathname = decodeURIComponent((request.url ?? '/').split('?')[0]); }
    catch { finish(400, 'Malformed path'); return; }
    if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').includes('..')) {
      finish(400, 'Invalid path'); return;
    }
    if (pathname === productionBase.slice(0, -1)) {
      response.writeHead(308, { Location: productionBase }); response.end(); return;
    }
    if (!pathname.startsWith(productionBase)) { finish(404, 'Not found'); return; }
    const relative = pathname.slice(productionBase.length) || 'index.html';
    try {
      const file = await realpath(resolve(root, relative));
      if (!file.startsWith(root + sep)) { finish(404, 'Not found'); return; }
      const info = await stat(file);
      if (!info.isFile()) { finish(404, 'Not found'); return; }
      const range = byteRange(request.headers.range, info.size);
      response.setHeader('Accept-Ranges', 'bytes');
      response.setHeader('Cache-Control', 'no-store');
      response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      if (!range) {
        response.setHeader('Content-Range', `bytes */${info.size}`);
        response.writeHead(416); response.end(); return;
      }
      const { start, end, partial } = range;
      if (partial) response.setHeader('Content-Range', `bytes ${start}-${end}/${info.size}`);
      response.setHeader('Content-Length', info.size === 0 ? 0 : end - start + 1);
      response.writeHead(partial ? 206 : 200);
      if (request.method === 'HEAD' || info.size === 0) { response.end(); return; }
      const stream = createReadStream(file, { start, end });
      response.on('close', () => stream.destroy());
      stream.on('error', () => response.destroy());
      stream.pipe(response);
    } catch (error) {
      if (!response.headersSent) finish(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500, 'File unavailable');
      else response.destroy();
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.HSK_RELEASE_PORT ?? 4174);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid HSK_RELEASE_PORT');
  const server = await createReleaseServer();
  server.on('error', error => { console.error(`Release preview could not start: ${error.code ?? error.name}`); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Release preview: http://127.0.0.1:${port}${productionBase}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
