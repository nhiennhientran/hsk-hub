import { defineConfig } from '@playwright/test';
const live = process.env.HSK_LIVE_URL;
export default defineConfig({
  outputDir: 'test-results-release',
  testDir: './tests/browser', testMatch: '**/release.spec.ts', workers: 1, retries: 0, timeout: 60_000,
  reporter: [['list'], ['json', { outputFile: live ? '.repro-output/step9-live.json' : '.repro-output/step9-release.json' }]],
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }, { name: 'webkit', use: { browserName: 'webkit' } }],
  use: { baseURL: live ?? 'http://127.0.0.1:4174/hsk-hub/new-hsk1/hsk1/', headless: true, trace: 'off', video: 'off' },
  webServer: live ? undefined : { command: 'node tools/release-server.mjs', url: 'http://127.0.0.1:4174/hsk-hub/new-hsk1/hsk1/index.html', reuseExistingServer: false },
});
