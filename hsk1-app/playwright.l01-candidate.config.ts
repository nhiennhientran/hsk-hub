import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
const browser = process.env.HSK_L01_BROWSER ?? 'chromium';
if (!['chromium', 'webkit'].includes(browser)) throw Error('Bounded L01 checkpoint requires a known native engine.');
const output = resolve(process.env.HSK_L01_OUTPUT ?? `.repro-output/continue-phase5/${browser}`);
const shellQuote = (value: string) => "'" + value.replaceAll("'", "'\"'\"'") + "'";
export default defineConfig({ testDir: './tests/browser', testMatch: 'official-vi-l01-candidate.spec.ts', workers: 1, retries: 0, timeout: 20_000,
  reporter: [['list'], ['json', { outputFile: resolve(output, 'native-results.json') }]], outputDir: resolve(output, 'native-artifacts'),
  projects: [{ name: browser, use: { browserName: browser as 'chromium' | 'webkit' } }],
  use: { baseURL: 'http://127.0.0.1:4186', headless: true, viewport: { width: 1280, height: 900 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: `node node_modules/vite/bin/vite.js preview --outDir ${shellQuote(resolve(output, 'compiled'))} --host 127.0.0.1 --port 4186 --strictPort`, url: 'http://127.0.0.1:4186/tests/browser/fixtures/official-vi-l01-candidate.html', reuseExistingServer: false },
});
