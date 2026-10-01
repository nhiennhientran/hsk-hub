import { defineConfig, type Plugin } from 'vite';
import { copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { courseAssets } from './tools/course-assets.ts';

// These are copies of the single application HTML, not separate student apps.
function legacyEntries(): Plugin {
  return {
    name: 'legacy-entry-aliases',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (request.url) request.url = request.url.replace(/^\/(lesson|learning)\.html(?=\?|$)/, '/index.html');
        next();
      });
    },
    async writeBundle(options) {
      if (!options.dir) throw new Error('Missing build directory.');
      const index = resolve(options.dir, 'index.html');
      await Promise.all(['lesson.html', 'learning.html'].map(name => copyFile(index, resolve(options.dir!, name))));
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [legacyEntries(), courseAssets(fileURLToPath(new URL('.', import.meta.url)))],
  build: { target: 'es2022', sourcemap: true },
});
