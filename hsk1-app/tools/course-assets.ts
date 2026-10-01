import { createReadStream, readFileSync } from 'node:fs';
import { copyFile, mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/** Reuse original audio and local stroke data; the built site is self-contained. */
export function courseAssets(root: string): Plugin {
  const book = JSON.parse(readFileSync(resolve(root, 'content/textbook.json'), 'utf8')) as { lessons: { vocab: { zh: string }[]; hanzi: { chars?: string } }[] };
  const media = JSON.parse(readFileSync(resolve(root, 'content/media-references.json'), 'utf8')) as { originalTracks: { id: string; path: string }[] };
  const files = new Map<string, string>();
  for (const track of media.originalTracks) {
    if (!/^\d{1,2}-[1-7]$/.test(track.id) || track.path !== `new-hsk1/hsk1/audio/${track.id}.mp3`) throw new Error('Invalid original audio path.');
    files.set(`/audio/${track.id}.mp3`, resolve(root, '..', track.path));
  }
  const chars = new Set(book.lessons.flatMap(lesson => lesson.vocab.flatMap(word => [...word.zh]).concat([...(lesson.hanzi.chars ?? '')])).filter(char => /\p{Script=Han}/u.test(char)));
  const supplements = JSON.parse(readFileSync(resolve(root, 'review/hanzi-supplement.json'), 'utf8')) as { entries: { character: string }[] };
  const missing = new Set(supplements.entries.map(entry => entry.character));
  for (const char of chars) files.set(`/hanzi/${char}.json`, missing.has(char)
    ? resolve(root, `public/course-assets/hanzi/${char}.json`)
    : resolve(root, `../new-hsk1/assets/hanzi-data/${char}.json`));
  return {
    name: 'course-assets',
    configureServer(server) {
      server.middlewares.use('/course-assets', async (request, response, next) => {
        let name: string;
        try { name = decodeURIComponent((request.url ?? '').split('?')[0]!); }
        catch { response.statusCode = 400; response.end(); return; }
        const file = files.get(name);
        if (!file) { next(); return; }
        try {
          const info = await stat(file);
          response.setHeader('Content-Type', name.endsWith('.mp3') ? 'audio/mpeg' : 'application/json;charset=utf-8');
          response.setHeader('Accept-Ranges', 'bytes');
          response.setHeader('Cache-Control', 'no-cache');
          let start = 0, end = info.size - 1;
          if (request.headers.range) {
            const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
            if (!match || (!match[1] && !match[2])) { response.statusCode = 416; response.setHeader('Content-Range', `bytes */${info.size}`); response.end(); return; }
            if (!match[1]) start = Math.max(0, info.size - Number(match[2]));
            else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
            if (start > end || start >= info.size) { response.statusCode = 416; response.setHeader('Content-Range', `bytes */${info.size}`); response.end(); return; }
            response.statusCode = 206; response.setHeader('Content-Range', `bytes ${start}-${end}/${info.size}`);
          }
          response.setHeader('Content-Length', end - start + 1);
          if (request.method === 'HEAD') { response.end(); return; }
          const stream = createReadStream(file, { start, end });
          response.on('close', () => stream.destroy()); stream.on('error', () => response.destroy()); stream.pipe(response);
        } catch { response.statusCode = 404; response.end(); }
      });
    },
    async writeBundle(options) {
      if (!options.dir) throw new Error('Missing course asset output directory.');
      await Promise.all([...files].map(async ([name, source]) => {
        const target = resolve(options.dir!, 'course-assets' + name);
        await mkdir(resolve(target, '..'), { recursive: true }); await copyFile(source, target);
      }));
    },
  };
}
