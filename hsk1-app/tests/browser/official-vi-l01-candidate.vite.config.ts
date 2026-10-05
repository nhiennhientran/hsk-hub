import { defineConfig } from 'vite';
import { mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const app = process.cwd();
const output = resolve(process.env.HSK_L01_OUTPUT ?? `.repro-output/continue-phase5/${process.env.HSK_L01_BROWSER ?? 'local'}`);
export default defineConfig({ root: app, base: '/', publicDir: false,
  plugins: [{ name: 'bounded-l01-real-scene-figures', async closeBundle() {
    const directory = resolve(output, 'compiled/source-activities/figures'); await mkdir(directory, { recursive: true });
    for (const number of [1, 2, 3]) { const file = `l01-text-${number}-photo.png`; await copyFile(resolve(app, 'public/source-activities/figures', file), resolve(directory, file)); }
  } }],
  build: { target: 'es2022', sourcemap: true, outDir: resolve(output, 'compiled'), emptyOutDir: true,
    rolldownOptions: { input: resolve(app, 'tests/browser/fixtures/official-vi-l01-candidate.html') } },
});
